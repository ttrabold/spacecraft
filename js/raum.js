// Raum-Protokoll: Gastgeber und Gast über einen Netz-Adapter (js/netz.js). Reine Logik ohne DOM und three.js;
// mit dem Spiel spricht der Raum nur über Rückrufe. Nachrichten tragen ihren Typ in `t` und laufen über die
// Verteilertabellen SC.Gastgeber.NACHRICHTEN und SC.Gast.NACHRICHTEN (spätere Aufgaben ergänzen dort weitere Typen).
SC.RAUM_FARBEN = ["#3a6fd8", "#e0533a", "#2fae5a", "#c9a227"]; // Gastgeber zuerst
SC.RAUM_MAX = 4;                // Spieler insgesamt (Gastgeber + 3 Gäste)
SC.RAUM_NEU_ALLE_MS = 2000;     // Gast: Neuverbinden alle 2 s …
SC.RAUM_NEU_HOECHSTENS_MS = 15000; // … höchstens 15 s lang
SC.RAUM_PLATZ_MS = 20000;       // Gastgeber: Platz und Farbe eines abgerissenen Gastes so lange frei halten
SC.RAUM_NACHLAUF_MS = 500;      // Gastgeber: Raum erst kurz nach „ende“ schließen, damit die Nachricht noch ankommt
SC.RAUM_TAKT = 1 / 15;          // zustand und wesen 15-mal pro Sekunde …
SC.RAUM_ZEIT_TAKT = 1;          // … zeit einmal pro Sekunde
SC.RAUM_GAST_ID = 1e9;          // Gast: eigene Wesen (Beutekugeln) ab dieser ID, darunter liegen die gespiegelten des Gastgebers
SC.RAUM_WUNSCH_MAX = 512;       // Gast: höchstens so viele unbestätigte Block-Wünsche (älteste fallen weg); bestätigt wird über wunschNr
SC.RAUM_ABGELEHNT_MERKEN = 128; // Gastgeber: so viele abgelehnte Wunsch-Nummern je Gast (für willkommen nach Neuverbinden)
SC.Raum = {};

// --- Gastgeber ---
// Rückrufe: beiAnfrage(info, antwort), beiAnfrageWeg(info) (Wartender ging vor der Antwort), beiSpieler(liste), beiNachricht(id, n)
SC.Gastgeber = function(o){
  this.o = o; this.daten = o.daten; this.welt = o.welt; this.zf = o.zf || Math.random; this.warte = o.warte || function(ms, fn){ return setTimeout(fn, ms); };
  this.farbe = SC.RAUM_FARBEN[0]; this.spieler = []; this.pvp = false; this.code = null; this.raum = null;
  this._bestaetigt = {}; // figurId → true, solange dieser Raum lebt
  this._verb = {};       // figurId → angenommene Verbindung {verb, id, name, drin}
  this._zu = false;
  this.uhr = o.uhr || function(){ return typeof performance !== "undefined" ? performance.now() : Date.now(); }; // Spieluhr für getroffenBis
  this._takt = 0; this._zeitTakt = 0;
  this._wunschNr = {}; this._abgelehnt = {}; // figurId → höchste verarbeitete Wunsch-Nummer bzw. zuletzt abgelehnte Nummern
  var s = this;
  if(this.welt) this.welt.ereignisse.an("block", function(b){ s._blockGeaendert(b); });
};
(function(){
  var G = SC.Gastgeber.prototype;
  function ruf(f){ if(typeof f === "function") f.apply(null, Array.prototype.slice.call(arguments, 1)); }

  // Würfelt einen Code und öffnet den Raum; ist die ID vergeben, bis zu 5 neue Codes
  G.oeffne = function(){
    var s = this, n = 0;
    function los(){
      var c = SC.Netz.neuerCode(s.zf);
      return s.o.adapter.oeffne(c.peerId).then(function(r){ s.raum = r; s.code = c; r.an("verbindung", function(v){ s._neu(v); }); return c; },
        function(f){ if(f && f.art === "vergeben" && n++ < 5) return los(); throw f; });
    }
    return los();
  };
  G._neu = function(v){
    var s = this, c = { verb: v, id: null, name: "", drin: false, weg: false };
    if(s._zu){ v.schliesse(); return; }
    v.an("daten", function(n){
      if(!n || typeof n !== "object" || c.weg) return;
      if(n.t !== "hallo" && !c.drin) return; // vor dem Annehmen zählt nur „hallo“
      var f = SC.Gastgeber.NACHRICHTEN[n.t];
      if(f) f.call(s, c, n); else ruf(s.o.beiNachricht, c.id, n);
    });
    v.an("zu", function(){
      // Wartender Gast geht, bevor der Gastgeber antwortet: Anfrage verfällt, das Spiel schließt seinen Dialog
      if(!c.drin){ var fragte = c.gefragt; c.weg = true; c.gefragt = false; if(fragte) ruf(s.o.beiAnfrageWeg, { id: c.id, name: c.name }); return; }
      s._weg(c);
    });
  };
  G._eintrag = function(id){ for(var i = 0; i < this.spieler.length; i++) if(this.spieler[i].id === id) return this.spieler[i]; return null; };
  // Eintrag weg: auch die je Empfänger gemerkte Ausrüstung dieses Spielers vergessen (die Gäste löschen ihn aus mitspieler)
  G._entferne = function(id){ this.spieler = this.spieler.filter(function(e){ return e.id !== id; }); for(var v in this._verb){ var c = this._verb[v]; if(c.ausr) delete c.ausr[id]; } };
  G._voll = function(id){ return this.spieler.filter(function(e){ return e.id !== id; }).length >= SC.RAUM_MAX - 1; };
  G._freieFarbe = function(){ var benutzt = this.spieler.map(function(e){ return e.farbe; }); for(var i = 1; i < SC.RAUM_FARBEN.length; i++) if(benutzt.indexOf(SC.RAUM_FARBEN[i]) < 0) return SC.RAUM_FARBEN[i]; return SC.RAUM_FARBEN[1]; };
  G._ablehnen = function(c, grund){ c.weg = true; c.verb.sende({ t: "ablehnen", grund: grund }); c.verb.schliesse(); };
  // Alle Spieler samt Gastgeber für willkommen/spieler
  G.liste = function(){ var s = this.daten.spieler; return [{ id: s.figurId, name: s.name, farbe: this.farbe }].concat(this.spieler.map(function(e){ return { id: e.id, name: e.name, farbe: e.farbe }; })); };
  G._weltInfo = function(){
    var d = this.daten, p = this.welt.planet;
    return { seed: d.seed, name: d.name, modus: d.modus, schwierigkeit: d.schwierigkeit, startpunkt: d.startpunkt, tageszeit: d.tageszeit,
      planet: { id: p.id, seed: p.seed, groesse: p.groesse, palette: p.palette, generatorVersion: p.generatorVersion } };
  };
  G._listeGeaendert = function(ausserId){ if(this._zu) return; this.sendeAlle({ t: "spieler", liste: this.liste() }, ausserId); ruf(this.o.beiSpieler, this.spieler); };

  // Annehmen: willkommen, je geändertem Chunk eine chunk-Nachricht, dann bereit
  G._annehmen = function(c){
    var s = this, d = s.daten, id = c.id, alt = s._verb[id];
    if(alt && alt !== c){ alt.weg = true; alt.verb.schliesse(); } // alte, noch nicht bemerkt abgerissene Verbindung derselben Figur
    c.drin = true; s._verb[id] = c; s._bestaetigt[id] = true;
    if(!c.wiederkehr){ s._wunschNr[id] = 0; s._abgelehnt[id] = []; } // neuer Gast zählt seine Wünsche von vorn
    var m = d.mitspieler[id], pos = (m && m.pos) || d.startpunkt || d.spieler.pos, blick = (m && m.blick) || [0, 0];
    pos = pos ? pos.slice() : null; blick = blick.slice();
    d.mitspieler[id] = { name: c.name, pos: pos, blick: blick.slice() };
    var e = s._eintrag(id);
    if(!e){ e = { id: id, name: c.name, farbe: s._freieFarbe(), pos: pos, blick: blick, modus: d.modus, stufe: 1, ausr: null, menue: false, lebt: true, verbunden: true }; s.spieler.push(e); }
    else { e.name = c.name; e.verbunden = true; e._marke = null; }
    c.verb.sende({ t: "willkommen", farbe: e.farbe, welt: s._weltInfo(), pos: pos, blick: blick, pvp: s.pvp, spieler: s.liste(), chunkAnzahl: s.welt.geaenderte.size,
      wunschNr: s._wunschNr[id] || 0, abgelehnt: (s._abgelehnt[id] || []).slice() });
    s.welt.geaenderte.forEach(function(u8, k){ c.verb.sende({ t: "chunk", k: k, daten: u8 }); });
    c.verb.sende({ t: "bereit" });
    s._listeGeaendert(id);
  };
  G._weg = function(c){
    if(!c.drin || this._verb[c.id] !== c) return;
    // Platz bleibt frei: Eintrag mit verbunden=false (zählt für „voll“, behält die Farbe), erst nach SC.RAUM_PLATZ_MS weg
    var s = this, id = c.id, e = s._eintrag(id), marke = {};
    c.drin = false; delete s._verb[id];
    if(!e) return;
    e.verbunden = false; e._marke = marke; ruf(s.o.beiSpieler, s.spieler);
    s.warte(SC.RAUM_PLATZ_MS, function(){ var x = s._eintrag(id); if(x && !x.verbunden && x._marke === marke){ s._entferne(id); s._listeGeaendert(); } });
  };

  // Jede Blockänderung in der Welt des Gastgebers geht an alle Gäste, außer an den, von dem sie kam (Quelle "netz:<id>")
  G._blockGeaendert = function(b){
    if(this._zu) return;
    var q = String(b.quelle || ""), urheber = q.indexOf("netz:") === 0 ? q.slice(5) : undefined;
    this.sendeAlle({ t: "block", x: b.x, y: b.y, z: b.z, id: b.id }, urheber);
  };
  // Zustand aller Spieler (Gastgeber mit seiner figurId zuerst), ohne getrennte Gäste
  G._zustaende = function(ich){
    var l = [];
    if(ich) l.push(zustand(this.daten.spieler.figurId, ich));
    this.spieler.forEach(function(e){ if(e.verbunden && e.pos) l.push(zustand(e.id, e)); });
    return l;
  };
  function zustand(id, q){ return { id: id, pos: q.pos, blick: q.blick, modus: q.modus, stufe: q.stufe, ausr: q.ausr, menue: !!q.menue, lebt: q.lebt !== false, hieb: q.hieb, blockt: !!q.blockt }; }
  // Pro Bild aufrufen. ich: {pos, blick, modus, stufe, ausr, menue, lebt, tageszeit?} des Gastgebers.
  // 15 Hz: jedem Gast den Zustand der anderen Spieler (ausr nur, wenn sie sich für diesen Empfänger geändert hat) und die Wesen-Liste;
  // 1 Hz: zeit {tageszeit (aus ich.tageszeit, sonst daten.tageszeit), modus, schwierigkeit}
  G.takt = function(dt, ich){
    var s = this, d = s.daten; if(s._zu) return;
    s._takt += dt; s._zeitTakt += dt;
    var zust = s._takt >= SC.RAUM_TAKT, zeit = s._zeitTakt >= SC.RAUM_ZEIT_TAKT;
    if(zust){ s._takt -= SC.RAUM_TAKT; if(s._takt >= SC.RAUM_TAKT) s._takt = 0; }
    if(zeit){ s._zeitTakt -= SC.RAUM_ZEIT_TAKT; if(s._zeitTakt >= SC.RAUM_ZEIT_TAKT) s._zeitTakt = 0; }
    var ids = Object.keys(s._verb); if(!ids.length) return;
    if(zust){
      var alle = s._zustaende(ich), wesen = { t: "wesen", liste: SC.Raum.wesenListe(s.welt, s.uhr()) };
      ids.forEach(function(id){
        var c = s._verb[id], merk = c.ausr || (c.ausr = {}); // je Empfänger: zuletzt geschickte Ausrüstung pro Spieler
        alle.forEach(function(z){
          if(z.id === id) return;
          var n = { t: "zustand" }, j = JSON.stringify(z.ausr === undefined ? null : z.ausr);
          for(var k in z) if(k !== "ausr") n[k] = z[k];
          if(merk[z.id] !== j){ merk[z.id] = j; n.ausr = z.ausr; }
          c.verb.sende(n);
        });
        c.verb.sende(wesen);
      });
    }
    if(zeit){ var tz = ich && typeof ich.tageszeit === "number" ? ich.tageszeit : d.tageszeit; // je Gast mit seiner bestätigten Wunsch-Nummer
      ids.forEach(function(id){ s._verb[id].verb.sende({ t: "zeit", tageszeit: tz, modus: d.modus, schwierigkeit: d.schwierigkeit, wunschNr: s._wunschNr[id] || 0 }); }); }
  };

  G.sende = function(id, n){ var c = this._verb[id]; if(c) c.verb.sende(n); };
  G.sendeAlle = function(n, ausserId){ for(var id in this._verb) if(id !== ausserId) this._verb[id].verb.sende(n); };
  G.hinauswerfen = function(id){
    delete this._bestaetigt[id];
    var c = this._verb[id], war = !!this._eintrag(id);
    this._entferne(id);
    if(c){ c.drin = false; delete this._verb[id]; this._ablehnen(c, "hinausgeworfen"); }
    if(c || war) this._listeGeaendert();
  };
  G.schliesse = function(){
    var s = this; if(s._zu) return;
    s.sendeAlle({ t: "ende" }); s._zu = true;
    for(var id in s._verb){ s._verb[id].weg = true; s._verb[id].verb.schliesse(); }
    s._verb = {}; s.spieler = [];
    var r = s.raum; if(r) s.warte(SC.RAUM_NACHLAUF_MS, function(){ r.schliesse(); });
  };

  SC.Gastgeber.NACHRICHTEN = {
    hallo: function(c, n){
      var s = this;
      if(c.id) return;
      if(n.protokoll !== SC.NETZ_PROTOKOLL || !n.figurId) return s._ablehnen(c, "version");
      c.id = String(n.figurId); c.name = String(n.name || ""); c.wiederkehr = !!n.wiederkehr;
      if(s._voll(c.id)) return s._ablehnen(c, "voll");
      if(s._bestaetigt[c.id]) return s._annehmen(c);
      c.verb.sende({ t: "warte" });
      var beantwortet = false; c.gefragt = true;
      ruf(s.o.beiAnfrage, { id: c.id, name: c.name }, function(ja){
        if(beantwortet || c.weg || s._zu) return; beantwortet = true; c.gefragt = false;
        if(!ja) return s._ablehnen(c, "nein");
        if(s._voll(c.id)) return s._ablehnen(c, "voll");
        s._annehmen(c);
      });
    },
    // Position und Anzeige-Zustand des Gastes; Position wird pro Figur in der Welt des Gastgebers gemerkt
    zustand: function(c, n){
      var e = this._eintrag(c.id), m = this.daten.mitspieler[c.id];
      if(e) ["pos", "blick", "modus", "stufe", "ausr", "menue", "lebt", "hieb", "blockt"].forEach(function(k){ if(n[k] !== undefined) e[k] = n[k]; });
      if(m){ if(n.pos) m.pos = n.pos.slice(); if(n.blick) m.blick = n.blick.slice(); }
      if(typeof this.o.beiNachricht === "function") this.o.beiNachricht(c.id, n);
    },
    // Block-Wunsch eines Gastes {x, y, z, id, alt, nr}: gilt nur, wenn hier noch `alt` steht; sonst bekommt der Urheber den tatsächlichen Block zurück
    // Jede Nummer gilt als verarbeitet (wunschNr); abgelehnte werden zusätzlich gemerkt
    block: function(c, n){
      var w = this.welt;
      if(zahl(n.nr) && n.nr > (this._wunschNr[c.id] || 0)) this._wunschNr[c.id] = n.nr;
      if(!w || !zahl(n.x) || !zahl(n.y) || !zahl(n.z) || !SC.BLOECKE[n.id]) return;
      if((n.alt === undefined || w.holeBlock(n.x, n.y, n.z) === n.alt) && w.setzeBlock(n.x, n.y, n.z, n.id, "netz:" + c.id)) return;
      if(zahl(n.nr)){ var ab = this._abgelehnt[c.id] || (this._abgelehnt[c.id] = []); ab.push(n.nr); if(ab.length > SC.RAUM_ABGELEHNT_MERKEN) ab.shift(); }
      c.verb.sende({ t: "block", x: w.planet.wickel(n.x), y: Math.floor(n.y), z: w.planet.wickel(n.z), id: w.holeBlock(n.x, n.y, n.z), zurueck: true, nr: n.nr });
    }
  };
  function zahl(v){ return typeof v === "number" && isFinite(v); }
})();

// --- Gast ---
SC.Gast = function(o){
  this.o = o; this.figur = o.figur; this.protokoll = o.protokoll === undefined ? SC.NETZ_PROTOKOLL : o.protokoll;
  this.jetzt = o.jetzt || Date.now; this.warte = o.warte || function(ms, fn){ return setTimeout(fn, ms); };
  this.status = null; this.verb = null; this.code = null; this.farbe = null; this.spieler = []; this.willkommen = null; this.pvp = false;
  this._fertig = true; this._ende = true; this._runde = 0; this._start = 0;
  this.welt = null; this.mitspieler = {}; this.wesen = []; this.tageszeit = null; // mitspieler: id → letzter zustand (ohne Gast selbst)
  this._wuensche = {}; this._nr = 0; this._takt = 0; this._ausr = undefined;
};
(function(){
  var G = SC.Gast.prototype;
  function ruf(f){ if(typeof f === "function") f.apply(null, Array.prototype.slice.call(arguments, 1)); }

  // Erfüllt nach „bereit“; abgelehnt mit SC.Netz.Fehler (art aus dem Adapter oder "nein" | "voll" | "version")
  G.verbinde = function(code){
    var s = this; s.code = code; s._ende = false; s._fertig = false;
    return new Promise(function(ok, nein){ s._ok = ok; s._nein = nein; s._versuch(false); });
  };
  G._abschluss = function(fehler){ if(this._fertig) return; this._fertig = true; if(fehler) this._nein(fehler); else this._ok(); };
  G._status = function(st, info){ this.status = st; ruf(this.o.beiStatus, st, info || {}); };
  G._versuch = function(wiederkehr){
    var s = this;
    s.o.adapter.verbinde(s.code.peerId).then(function(v){
      if(s._ende){ v.schliesse(); return; }
      s._binde(v);
      v.sende({ t: "hallo", protokoll: s.protokoll, figurId: s.figur.figurId, name: s.figur.name, wiederkehr: wiederkehr });
    }, function(f){
      if(s._ende) return;
      if(!wiederkehr){ s._ende = true; s._abschluss(f instanceof SC.Netz.Fehler ? f : new SC.Netz.Fehler("unbekannt")); }
      else s._wiederPlanen();
    });
  };
  G._binde = function(v){
    var s = this; s.verb = v;
    v.an("daten", function(n){
      if(s.verb !== v || !n || typeof n !== "object") return;
      var f = SC.Gast.NACHRICHTEN[n.t];
      if(f) f.call(s, n); else ruf(s.o.beiNachricht, n);
    });
    v.an("zu", function(){ if(s.verb !== v) return; s.verb = null; s._zu(); });
  };
  G._loese = function(){ var v = this.verb; this.verb = null; if(v) v.schliesse(); };
  // Verbindung weg ohne „ende“: vor dem ersten „bereit“ ist das ein Fehler, danach wird neu verbunden
  G._zu = function(){
    if(this._ende) return;
    if(!this._fertig){ this._ende = true; this._abschluss(new SC.Netz.Fehler("unbekannt")); return; }
    if(this.status === "neuverbinden") this._wiederPlanen(); else this._neuverbinden();
  };
  G._neuverbinden = function(){
    var s = this, runde = ++s._runde; s._start = s.jetzt(); s._status("neuverbinden");
    s.warte(SC.RAUM_NEU_HOECHSTENS_MS, function(){ if(!s._ende && s._runde === runde && s.status === "neuverbinden") s._aufgeben(); });
    s._wiederPlanen();
  };
  G._wiederPlanen = function(){
    var s = this;
    s.warte(SC.RAUM_NEU_ALLE_MS, function(){
      if(s._ende || s.status !== "neuverbinden") return;
      if(s.jetzt() - s._start >= SC.RAUM_NEU_HOECHSTENS_MS) return s._aufgeben();
      s._versuch(true);
    });
  };
  G._aufgeben = function(){ this._ende = true; this._loese(); this._status("getrennt", { grund: "abbruch" }); };

  G.sende = function(n){ if(this.verb) this.verb.sende(n); };
  // Welt des Gastes anbinden: eigene Blockänderungen (Quelle nicht "netz") gehen als Wunsch an den Gastgeber und werden je Nummer (nr) gemerkt
  G.bindeWelt = function(welt){
    var s = this; s.welt = welt; s._wuensche = {}; SC.Raum.gastWelt(welt);
    welt.ereignisse.an("block", function(b){
      if(s.welt !== welt || !s.verb || String(b.quelle || "").indexOf("netz") === 0) return;
      var nr = ++s._nr; s._wuensche[nr] = { id: b.id, alt: b.alt, nr: nr, zeit: s.jetzt(), x: b.x, y: b.y, z: b.z };
      if(nr - SC.RAUM_WUNSCH_MAX > 0) delete s._wuensche[nr - SC.RAUM_WUNSCH_MAX];
      s.verb.sende({ t: "block", x: b.x, y: b.y, z: b.z, id: b.id, alt: b.alt, nr: nr });
    });
  };
  // Pro Bild aufrufen. ich: {pos, blick, modus, stufe, ausr, menue, lebt}; sendet 15 Hz den eigenen zustand (ausr nur bei Änderung)
  G.takt = function(dt, ich){
    var s = this; s._takt += dt;
    if(s._takt < SC.RAUM_TAKT) return;
    s._takt -= SC.RAUM_TAKT; if(s._takt >= SC.RAUM_TAKT) s._takt = 0;
    if(!s.verb || !ich || s.status !== "verbunden") return;
    var n = { t: "zustand", id: s.figur.figurId, pos: ich.pos, blick: ich.blick, modus: ich.modus, stufe: ich.stufe, menue: !!ich.menue, lebt: ich.lebt !== false, hieb: ich.hieb, blockt: !!ich.blockt },
      j = JSON.stringify(ich.ausr === undefined ? null : ich.ausr);
    if(j !== s._ausr){ s._ausr = j; n.ausr = ich.ausr; }
    s.verb.sende(n);
  };
  // Gastgeber hat alle Wünsche bis nr verarbeitet: angenommene vergessen; abgelehnte (Liste, nur bei willkommen) bleiben
  // für den Abgleich nach dem Neuverbinden, falls ihre Ablehnung unterwegs verloren ging
  G._bestaetige = function(nr, abgelehnt){
    if(typeof nr !== "number") return;
    var ab = {}; (abgelehnt || []).forEach(function(x){ ab[x] = true; });
    for(var k in this._wuensche) if(+k <= nr && !ab[k]) delete this._wuensche[k];
  };
  // Selbst gehen: kein Neuverbinden, kein Status-Rückruf
  G.trenne = function(){ this._ende = true; this._loese(); this._abschluss(new SC.Netz.Fehler("abbruch")); };

  SC.Gast.NACHRICHTEN = {
    warte: function(){ if(!this._fertig) this._status("warte"); },
    ablehnen: function(n){
      var g = n.grund; this._ende = true; this._loese();
      if(!this._fertig) this._abschluss(new SC.Netz.Fehler(g));
      else this._status("getrennt", { grund: g === "hinausgeworfen" ? g : "abbruch", art: g });
    },
    willkommen: function(n){ this.willkommen = n; this._bestaetige(n.wunschNr, n.abgelehnt); this.farbe = n.farbe; this.spieler = n.spieler || []; this.pvp = !!n.pvp; ruf(this.o.beiWillkommen, n); },
    chunk: function(n){ ruf(this.o.beiChunk, n.k, n.daten); },
    bereit: function(){
      this._runde++; this._ausr = undefined; ruf(this.o.beiBereit); // nach (Wieder-)Eintritt die Ausrüstung neu schicken
      this._status("verbunden"); this._abschluss(null);
    },
    spieler: function(n){
      var s = this; s.spieler = n.liste || [];
      for(var id in s.mitspieler) if(!s.spieler.some(function(e){ return e.id === id; })) delete s.mitspieler[id];
      ruf(s.o.beiNachricht, n);
    },
    zustand: function(n){
      if(!n.id) return;
      var m = this.mitspieler[n.id] || (this.mitspieler[n.id] = {});
      for(var k in n) if(k !== "t") m[k] = n[k];
    },
    wesen: function(n){ this.wesen = n.liste || []; },
    zeit: function(n){ this._bestaetige(n.wunschNr); if(typeof n.tageszeit === "number") this.tageszeit = n.tageszeit; ruf(this.o.beiNachricht, n); },
    // Tatsache vom Gastgeber; mit zurueck:true wurde ein eigener Wunsch abgelehnt → beiBlockZurueck(x, y, z, id, wunsch {id, alt} | null)
    block: function(n){
      var w = this.welt; if(!w) return;
      w.setzeBlock(n.x, n.y, n.z, n.id, "netz");
      if(!n.zurueck) return;
      // je Nummer: mehrere Wünsche an derselben Stelle werden einzeln rückgängig gemacht
      var wu = n.nr !== undefined ? this._wuensche[n.nr] : null;
      if(wu) delete this._wuensche[n.nr];
      ruf(this.o.beiBlockZurueck, n.x, n.y, n.z, n.id, wu ? { id: wu.id, alt: wu.alt } : null);
    },
    ende: function(){
      this._ende = true; this._loese();
      if(!this._fertig) this._abschluss(new SC.Netz.Fehler("ende"));
      else this._status("getrennt", { grund: "ende" });
    }
  };
})();

// --- Hilfen für das Spiel ---
// Gast-Welt: eigene Wesen bekommen IDs ab SC.RAUM_GAST_ID, damit sie nie mit den gespiegelten des Gastgebers kollidieren
SC.Raum.gastWelt = function(welt){ if(welt.naechsteId < SC.RAUM_GAST_ID) welt.naechsteId = SC.RAUM_GAST_ID; return welt; };
(function(){
  function r2(v){ return Math.round(v * 100) / 100; }
  function r3(a){ return [r2(a[0]), r2(a[1]), r2(a[2])]; }
  // Gastgeber: Momentaufnahme der Gegner und Geschosse (keine Beutekugeln). getroffen = verbleibende ms bis getroffenBis (nur wenn > 0),
  // relativ, weil die Uhren der Geräte nicht übereinstimmen. blick: Gegner Drehwinkel, Geschoss Flugrichtung.
  SC.Raum.wesenListe = function(welt, uhr){
    var l = [];
    welt.wesen.forEach(function(e){
      if(e.art === "gegner"){
        var n = { id: e.id, art: "gegner", gegnerArt: e.gegnerArt, stufe: e.stufe, pos: r3(e.pos), blick: r2(e.blick || 0), lp: e.lp, lpMax: e.lpMax, boss: !!e.boss, bemerkt: !!e.bemerkt, blockt: !!e.blockt };
        var g = e.getroffenBis && typeof uhr === "number" ? e.getroffenBis - uhr : 0;
        if(g > 0) n.getroffen = Math.round(g);
        if(e.farbe) n.farbe = e.farbe;
        l.push(n);
      } else if(e.art === "geschoss"){
        var r = e._fliegt && e.geschw ? e.geschw : e.richtung || [0, 0, 1];
        var gs = { id: e.id, art: "geschoss", typ: e.typ, pos: r3(e.pos), blick: r3(r), farbe: e.farbe, team: e.team };
        if(e.schuetze) gs.schuetze = e.schuetze; // der Gast blendet seine eigenen Schüsse aus (er zeigt sie schon selbst)
        l.push(gs);
      }
    });
    return l;
  };
  var FELDER = ["typ", "gegnerArt", "stufe", "lp", "lpMax", "boss", "bemerkt", "blockt", "farbe", "team", "schuetze"];
  // Gast, pro Bild: Gegner und Geschosse unter den IDs des Gastgebers setzen und aktualisieren, fehlende entfernen, eigene (≥ SC.RAUM_GAST_ID)
  // in Ruhe lassen. Felder werden nur bei einer neuen Liste übernommen; die Position läuft jedes Bild zum Ziel (Sprung bei > 8 Blöcken).
  // uhr (optional): Spieluhr des Gastes für getroffenBis.
  SC.Raum.spiegleWesen = function(welt, liste, dt, uhr){
    liste = liste || [];
    var neu = welt._spiegelListe !== liste, da = {};
    welt._spiegelListe = liste;
    liste.forEach(function(n){
      if(!n || n.id >= SC.RAUM_GAST_ID || !n.pos) return;
      da[n.id] = true;
      var e = welt.wesen.get(n.id), frisch = !e || e.art !== n.art;
      if(frisch){
        var def = n.art === "gegner" && SC.GEGNER[n.gegnerArt];
        e = { id: n.id, art: n.art, pos: n.pos.slice(), geschw: [0, 0, 0], breite: def ? def.breite : 0.3, hoehe: def ? def.hoehe : 0.3, alter: 0, gespiegelt: true };
        welt.wesen.set(n.id, e);
      }
      if(neu || frisch){
        FELDER.forEach(function(k){ if(n[k] !== undefined) e[k] = n[k]; });
        e._ziel = n.pos.slice();
        if(n.art === "geschoss"){ var b = n.blick || [0, 0, 1]; e.richtung = b.slice(); e.geschw = b.slice(); }
        else { e.blick = n.blick || 0; e.getroffenBis = n.getroffen > 0 && typeof uhr === "number" ? uhr + n.getroffen : 0; }
      }
      var z = e._ziel, p = e.pos, alt = p.slice(), f = Math.min(1, dt * 12);
      if(Math.hypot(z[0] - p[0], z[1] - p[1], z[2] - p[2]) > 8) e.pos = z.slice();
      else e.pos = [p[0] + (z[0] - p[0]) * f, p[1] + (z[1] - p[1]) * f, p[2] + (z[2] - p[2]) * f];
      if(e.art === "gegner") e.geschw = dt > 0 ? [(e.pos[0] - alt[0]) / dt, (e.pos[1] - alt[1]) / dt, (e.pos[2] - alt[2]) / dt] : [0, 0, 0];
    });
    welt.wesen.forEach(function(e, id){ if(id < SC.RAUM_GAST_ID && !da[id]) welt.wesen.delete(id); });
  };
  // Gast, Survival: ein abgelehnter Block-Wunsch {id, alt} wird im Rucksack rückgängig gemacht – gesetzter Block (nur in Luft oder Wasser) kommt zurück,
  // ein abgebauter (was er ergibt) wird wieder herausgenommen, soweit noch vorhanden. Liefert {zurueck, heraus} (Anzahl).
  SC.Raum.blockZurueck = function(rucksack, wunsch, tatsaechlicheId){
    var r = { zurueck: 0, heraus: 0 }, B = SC.B;
    if(!rucksack || !wunsch) return r;
    if(wunsch.id !== B.LUFT){ if(wunsch.alt !== B.LUFT && wunsch.alt !== B.WASSER) return r; if(rucksack.lege({ block: wunsch.id, anzahl: 1 }) === 0) r.zurueck = 1; return r; }
    var g = wunsch.alt === undefined || wunsch.alt === B.LUFT ? null : SC.Abbau.ergibt(wunsch.alt);
    if(g === null) return r;
    for(var i = rucksack.plaetze.length - 1; i >= 0; i--){ var p = rucksack.plaetze[i]; if(p && p.block === g){ rucksack.nimm(i, 1); r.heraus = 1; break; } }
    return r;
  };
  // Gastgeber: alle Spieler als mögliche Ziele für Gegner (Gastgeber mit figurId zuerst, getrennte Gäste nicht)
  SC.Raum.mitspielerZiele = function(gastgeber, ich){
    return gastgeber._zustaende(ich).map(function(z){ return { id: z.id, pos: z.pos, blick: z.blick, modus: z.modus, stufe: z.stufe, menue: z.menue, lebt: z.lebt }; });
  };
})();

// --- Gemeinsam kämpfen ---
// Der Gastgeber rechnet Gegner, Treffer auf Gegner, Beute und Kisten; jeder Gast verrechnet Treffer an sich selbst mit seiner Ausrüstung.
// Beute und Erfahrung: einmal gewürfelt, identisch an jeden Spieler in SC.RAUM_NAH Blöcken (waagerechter Ringabstand), Gastgeber eingeschlossen.
// Nachrichten: angriff G→H {ziel, schaden, von}, schuss G→H {pos, richtung, tempo, schaden, farbe, abprall, lebensdauer}, kiste G→H {x, y, z},
// abprall G→H {geschossId}, treffer H→G {schaden, von, geschoss {id, typ, pos, richtung} | null, pvpVon}, besiegt H→G {nr, pos, erfahrung, beute, boss, kiste?}.
// besiegt geht nur live hinaus (nie nachgeholt); der Gast verwirft eine schon gesehene Nummer.
SC.RAUM_NAH = 40;
SC.RAUM_ABPRALL_MERKEN = 32; // Gastgeber: so viele an Gäste gemeldete Geschoss-Treffer bleiben für „abprall“ gemerkt
(function(){
  var H = SC.Gastgeber.prototype, G = SC.Gast.prototype;
  function ruf(f){ if(typeof f === "function") return f.apply(null, Array.prototype.slice.call(arguments, 1)); }
  function zahl(v){ return typeof v === "number" && isFinite(v); }
  function vek(v){ return Array.isArray(v) && v.length === 3 && zahl(v[0]) && zahl(v[1]) && zahl(v[2]) ? v.slice() : null; }
  function abstand(welt, a, b){ var P = welt.planet.groesse; return Math.hypot(SC.mod(b[0] - a[0] + P / 2, P) - P / 2, SC.mod(b[2] - a[2] + P / 2, P) - P / 2); }
  function laenge1(v){ var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }

  // Wer kann getroffen werden bzw. ist Ziel: Survival, nicht besiegt, kein Menü offen
  SC.Raum.trefferZiele = function(ziele){ return (ziele || []).filter(function(z){ return z && z.pos && z.modus === "survival" && z.lebt !== false && !z.menue; }); };
  // Nächster mögliches Ziel für einen Gegner (für SC.KI.schritt) → {pos, sichtbar: true, id} oder null
  SC.Raum.zielFuer = function(welt, g, ziele){
    var best = null, bd = Infinity;
    SC.Raum.trefferZiele(ziele).forEach(function(z){ var d = abstand(welt, g.pos, z.pos); if(d < bd){ bd = d; best = z; } });
    return best ? { pos: best.pos, sichtbar: true, id: best.id } : null;
  };
  // Gast: vom Gastgeber gespiegeltes Wesen (nicht lokal rechnen)
  SC.Raum.istGespiegelt = function(e){ return !!e && e.id < SC.RAUM_GAST_ID; };

  // --- Gastgeber ---
  // o: { ich() → eigener Zustand {pos, modus, menue, lebt, …} (für „in der Nähe“), beiBeute(pos, gegenstaende) (eigener Anteil auswerfen),
  //      besiege(g)? (Gegner durch Gast besiegt; Standard: this.besiege(g)), beiGetroffen(g, ergebnis)? (Gegner durch Gast getroffen, für Funken/Zahl) }
  H.bindeKampf = function(kampf, o){ this._k = { kampf: kampf, o: o || {} }; this._ereignis = this._ereignis || 0; this._geschosse = this._geschosse || {}; };
  H._ich = function(){ return this._k ? ruf(this._k.o.ich) || null : null; };
  // Beute und Erfahrung an alle in der Nähe von pos; der eigene Anteil geht an beiBeute. → {nah, an: [Gast-IDs]}
  H._verteile = function(pos, erfahrung, beute, boss, kiste){
    var s = this, w = s.welt, nr = ++s._ereignis, ich = s.daten.spieler.figurId, aus = { nah: false, an: [] };
    SC.Raum.mitspielerZiele(s, s._ich()).forEach(function(z){
      if(!z.pos || abstand(w, pos, z.pos) > SC.RAUM_NAH) return;
      if(z.id === ich){ aus.nah = true; return; }
      var n = { t: "besiegt", nr: nr, pos: pos.slice(), erfahrung: erfahrung, beute: beute, boss: !!boss };
      if(kiste) n.kiste = true;
      s.sende(z.id, n); aus.an.push(z.id);
    });
    return aus;
  };
  // Gegner besiegt: einmal würfeln, aus der Welt nehmen, an alle in der Nähe verteilen; Gastgeber verbucht sich selbst, wenn er nah ist.
  // → {erfahrung, beute, boss, nah, aufstiege, an}
  H.besiege = function(g){
    var k = this._k.kampf, r = SC.Kampf.beuteFuer(g, this.daten, k.zf);
    SC.Wesen.entferne(this.welt, g.id);
    var v = this._verteile(g.pos, r.erfahrung, r.beute, r.boss, false);
    r.nah = v.nah; r.an = v.an; r.aufstiege = 0;
    if(v.nah){ r.aufstiege = k.gibErfahrung(r.erfahrung); if(r.beute.length) ruf(this._k.o.beiBeute, g.pos.slice(), r.beute); }
    return r;
  };
  // Kiste öffnen (eigene oder vom Gast): Beute einmal würfeln, für alle in der Nähe; danach ist sie für alle offen. → Beute (leer, wenn schon offen)
  H.oeffneKiste = function(x, y, z){
    var w = this.welt, k = this._k.kampf;
    var beute = SC.Kampf.oeffneKiste(w, k, x, y, z, SC.Kampf.bauwerkZuKiste(w, x, y, z), SC.zufall((this.zf() * 4294967296) >>> 0));
    if(!beute.length) return beute;
    var pos = [x + 0.5, y + 0.5, z + 0.5], v = this._verteile(pos, 0, beute, false, true);
    if(v.nah) ruf(this._k.o.beiBeute, pos, beute);
    return beute;
  };
  // Treffer an einen Gast melden (Hieb, Stampfen oder Geschoss); der Gast verrechnet ihn selbst
  H.treffer = function(id, schaden, von, geschoss, pvpVon){
    var gs = null;
    if(geschoss){
      gs = { id: geschoss.id, typ: geschoss.typ || geschoss.art, pos: geschoss.pos.slice(), richtung: (geschoss.richtung || geschoss.geschw).slice() };
      var m = this._geschosse || (this._geschosse = {}), ks = Object.keys(m);
      if(ks.length >= SC.RAUM_ABPRALL_MERKEN) delete m[ks[0]];
      m[gs.id] = { an: id, pos: gs.pos, richtung: gs.richtung, schaden: schaden };
    }
    this.sende(id, { t: "treffer", schaden: schaden, von: von.slice(), geschoss: gs, pvpVon: pvpVon || null });
  };
  // Hieb oder Stampfen eines Gegners gegen alle Ziele: der Gastgeber verrechnet sich selbst (kampf.gegnerAktion), Gäste bekommen treffer.
  // ziele aus SC.Raum.mitspielerZiele. → Ergebnis für den Gastgeber selbst oder null
  H.gegnerAktion = function(g, akt, ziele){
    var s = this, ich = s.daten.spieler.figurId, eigen = null;
    SC.Raum.trefferZiele(ziele).forEach(function(z){
      if(z.id === ich){ eigen = s._k.kampf.gegnerAktion(g, akt); return; }
      var t = SC.Kampf.aktionTrifft(s.welt, g, akt, z.pos, true);
      if(t) s.treffer(z.id, t.schaden, t.von, null);
    });
    return eigen;
  };
  // Gegner-Geschoss hat Spieler id getroffen (SC.Geschoss.schritt mit Array): Gastgeber selbst → kampf.trifftSpieler, sonst treffer an den Gast.
  // → Ergebnis für den Gastgeber selbst oder null
  H.geschossTrifft = function(g, id){
    var von = g.geschw || g.richtung;
    if(id === this.daten.spieler.figurId) return this._k.kampf.trifftSpieler(g.schaden, von, g);
    this.treffer(id, g.schaden, von, g);
    return null;
  };
  // --- Spaßkampf (PvP): Schalter des Gastgebers, pro Raum, nicht gespeichert ---
  H.setzePvp = function(an){ this.pvp = !!an; if(!this._zu) this.sendeAlle({ t: "pvpAn", an: this.pvp }); };
  H._name = function(id){ if(id === this.daten.spieler.figurId) return this.daten.spieler.name; for(var i = 0; i < this.spieler.length; i++) if(this.spieler[i].id === id) return this.spieler[i].name; return ""; };
  // Treffer auf Spieler ziel durch Spieler vonId (Hieb oder Geschoss); nur mit pvp. Gastgeber selbst → kampf.trifftSpieler (Ergebnis),
  // Gast → treffer mit pvpVon. Fällt der Getroffene auf 0 LP: kein Besiegt-Bildschirm, wiederbeleben am Startpunkt, Rückruf beiPvpBesiegt(name).
  // Der Schaden ist der Waffenschaden des Angreifers; kampf.trifftSpieler wendet wie sonst die Schwierigkeit des Getroffenen an.
  H.pvpTrifft = function(ziel, schaden, von, vonId, geschoss){
    if(!this.pvp || !this._k || ziel === vonId) return null;
    if(ziel !== this.daten.spieler.figurId){ this.treffer(ziel, schaden, von, geschoss || null, vonId); return null; }
    var k = this._k.kampf, r = k.trifftSpieler(schaden, von, geschoss || null);
    if(k.besiegt()){ k.wiederbeleben(this.daten.startpunkt || SC.Spiel.startpunkt(this.welt.planet)); ruf(this._k.o.beiPvpBesiegt, this._name(vonId)); }
    return r;
  };
  // Mögliche Spieler-Ziele für Hiebe und Geschosse des Spielers selbst (leer ohne Spaßkampf). raum: Gastgeber oder Gast; ich: eigener Zustand (Gastgeber).
  SC.Raum.pvpZiele = function(raum, ich){
    if(!raum || !raum.pvp) return [];
    if(raum instanceof SC.Gastgeber){ var me = raum.daten.spieler.figurId; return SC.Raum.trefferZiele(SC.Raum.mitspielerZiele(raum, ich)).filter(function(z){ return z.id !== me; }); }
    var l = []; for(var id in raum.mitspieler) l.push(raum.mitspieler[id]);
    return SC.Raum.trefferZiele(l.map(function(m){ return { id: m.id || "", pos: m.pos, blick: m.blick, modus: m.modus, stufe: m.stufe, menue: m.menue, lebt: m.lebt }; }));
  };
  function spielerGeschoss(w, d){ return SC.Wesen.neu(w, "geschoss", d); }
  var HN = SC.Gastgeber.NACHRICHTEN;
  // Hieb eines Gastes auf einen Mitspieler (nur im Spaßkampf, nur in Reichweite, nur wenn beide kämpfen können)
  HN.pvp = function(c, n){
    var k = this._k, e = this._eintrag(c.id);
    if(!this.pvp || !k || !e || !e.pos || e.modus !== "survival" || e.lebt === false || e.menue || !zahl(n.schaden) || n.schaden <= 0 || n.ziel === c.id) return;
    var z = SC.Raum.trefferZiele(SC.Raum.mitspielerZiele(this, this._ich())).filter(function(m){ return m.id === n.ziel; })[0];
    if(!z || abstand(this.welt, e.pos, z.pos) > 12) return;
    var von = vek(n.von) || [0, 0, 1], r = this.pvpTrifft(n.ziel, n.schaden, von, c.id, null);
    if(r && r.schaden > 0) ruf(k.o.beiPvpGetroffen, r);
  };
  // Hieb eines Gastes auf einen Gegner
  HN.angriff = function(c, n){
    var w = this.welt, g = w && w.wesen.get(n.ziel), k = this._k;
    if(!k || !g || g.art !== "gegner" || !zahl(n.schaden) || n.schaden <= 0) return;
    var von = vek(n.von), e = this._eintrag(c.id);
    if(!von && e && e.pos){ var P = w.planet.groesse; von = [SC.mod(g.pos[0] - e.pos[0] + P / 2, P) - P / 2, 0, SC.mod(g.pos[2] - e.pos[2] + P / 2, P) - P / 2]; }
    var r = k.kampf.trifftGegner(g, n.schaden, von || [0, 0, 1]);
    if(r.besiegt){ if(typeof k.o.besiege === "function") k.o.besiege(g); else this.besiege(g); }
    else ruf(k.o.beiGetroffen, g, r);
  };
  // Schuss eines Gastes: hier ein echtes Spieler-Geschoss mit Schütze
  HN.schuss = function(c, n){
    var pos = vek(n.pos), r = vek(n.richtung);
    if(!this.welt || !pos || !r || !zahl(n.tempo) || !zahl(n.schaden)) return;
    spielerGeschoss(this.welt, { pos: pos, richtung: laenge1(r), tempo: n.tempo, schaden: n.schaden, team: "spieler", schuetze: c.id, art: "laser",
      lebensdauer: Math.min(3, zahl(n.lebensdauer) ? n.lebensdauer : 1), farbe: n.farbe, abprall: !!n.abprall });
  };
  HN.kiste = function(c, n){ if(this._k && this.welt && zahl(n.x) && zahl(n.y) && zahl(n.z) && this.welt.holeBlock(n.x, n.y, n.z) === SC.B.KISTE) this.oeffneKiste(Math.floor(n.x), Math.floor(n.y), Math.floor(n.z)); };
  // Gast hat einen gemeldeten Laser mit dem Schwert abgewehrt: zurückgeworfen als Spieler-Geschoss (wie im Einzelspiel, nur einmal je Geschoss)
  HN.abprall = function(c, n){
    var m = this._geschosse && this._geschosse[n.geschossId];
    if(!m || m.an !== c.id || !this.welt) return;
    delete this._geschosse[n.geschossId];
    spielerGeschoss(this.welt, { pos: m.pos.slice(), richtung: [-m.richtung[0], -m.richtung[1], -m.richtung[2]], tempo: 35, schaden: m.schaden, team: "spieler", schuetze: c.id, art: "laser", lebensdauer: 2, farbe: "#7cf3ff" });
  };

  // --- Gast ---
  // o: { beiBeute(pos, gegenstaende) (Beute als eigene Kugeln auswerfen), beiTreffer(ergebnis, n)? (für Ton/Anzeige), beiBesiegt(n, aufstiege)? }
  G.bindeKampf = function(kampf, o){ this._k = { kampf: kampf, o: o || {} }; this._gesehen = this._gesehen || {}; };
  G.angriff = function(ziel, schaden, von){ this.sende({ t: "angriff", ziel: ziel, schaden: schaden, von: von.slice() }); };
  G.pvpAngriff = function(ziel, schaden, von){ if(this.pvp) this.sende({ t: "pvp", ziel: ziel, schaden: schaden, von: von.slice() }); };
  G.schuss = function(d){ this.sende({ t: "schuss", pos: d.pos.slice(), richtung: d.richtung.slice(), tempo: d.tempo, schaden: d.schaden, farbe: d.farbe, abprall: !!d.abprall, lebensdauer: d.lebensdauer }); };
  G.kiste = function(x, y, z){ this.sende({ t: "kiste", x: x, y: y, z: z }); };
  var GN = SC.Gast.NACHRICHTEN;
  GN.treffer = function(n){
    var k = this._k; if(!k){ ruf(this.o.beiNachricht, n); return; }
    var kampf = k.kampf, w = kampf.welt, vorher = w ? w.naechsteId : 0;
    var r = kampf.trifftSpieler(n.schaden, vek(n.von) || [0, 0, 1], n.geschoss || null);
    if(r.abgeprallt && n.geschoss){
      // Der zurückgeworfene Laser zählt nur beim Gastgeber; hier ist er rein optisch
      if(w) for(var id = vorher; id < w.naechsteId; id++){ var e = w.wesen.get(id); if(e) e.optisch = true; }
      this.sende({ t: "abprall", geschossId: n.geschoss.id });
    }
    if(n.pvpVon && kampf.besiegt()){
      var sp = this.willkommen && this.willkommen.welt && this.willkommen.welt.startpunkt, nm = "";
      this.spieler.forEach(function(e){ if(e.id === n.pvpVon) nm = e.name; });
      kampf.wiederbeleben(sp || SC.Spiel.startpunkt(kampf.welt.planet)); ruf(k.o.beiPvpBesiegt, nm, n);
    }
    ruf(k.o.beiTreffer, r, n);
  };
  GN.pvpAn = function(n){ this.pvp = !!n.an; ruf(this.o.beiPvp, this.pvp); };
  GN.besiegt = function(n){
    var k = this._k; if(!k){ ruf(this.o.beiNachricht, n); return; }
    if(n.nr !== undefined){ if(this._gesehen[n.nr]) return; this._gesehen[n.nr] = true; }
    var auf = zahl(n.erfahrung) && n.erfahrung > 0 ? k.kampf.gibErfahrung(n.erfahrung) : 0;
    if(n.beute && n.beute.length && n.pos) ruf(k.o.beiBeute, n.pos.slice(), n.beute);
    ruf(k.o.beiBesiegt, n, auf);
  };
})();
