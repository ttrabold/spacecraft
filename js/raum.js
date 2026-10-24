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
SC.RAUM_WUNSCH_MS = 10000;      // Gast: unbeantworteter Block-Wunsch gilt danach als angenommen
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
  G._entferne = function(id){ this.spieler = this.spieler.filter(function(e){ return e.id !== id; }); };
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
    var m = d.mitspieler[id], pos = (m && m.pos) || d.startpunkt || d.spieler.pos, blick = (m && m.blick) || [0, 0];
    pos = pos ? pos.slice() : null; blick = blick.slice();
    d.mitspieler[id] = { name: c.name, pos: pos, blick: blick.slice() };
    var e = s._eintrag(id);
    if(!e){ e = { id: id, name: c.name, farbe: s._freieFarbe(), pos: pos, blick: blick, modus: d.modus, stufe: 1, ausr: null, menue: false, lebt: true, verbunden: true }; s.spieler.push(e); }
    else { e.name = c.name; e.verbunden = true; e._marke = null; }
    c.verb.sende({ t: "willkommen", farbe: e.farbe, welt: s._weltInfo(), pos: pos, blick: blick, pvp: s.pvp, spieler: s.liste(), chunkAnzahl: s.welt.geaenderte.size });
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
  function zustand(id, q){ return { id: id, pos: q.pos, blick: q.blick, modus: q.modus, stufe: q.stufe, ausr: q.ausr, menue: !!q.menue, lebt: q.lebt !== false }; }
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
    if(zeit) s.sendeAlle({ t: "zeit", tageszeit: ich && typeof ich.tageszeit === "number" ? ich.tageszeit : d.tageszeit, modus: d.modus, schwierigkeit: d.schwierigkeit });
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
      c.id = String(n.figurId); c.name = String(n.name || "");
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
      if(e) ["pos", "blick", "modus", "stufe", "ausr", "menue", "lebt"].forEach(function(k){ if(n[k] !== undefined) e[k] = n[k]; });
      if(m){ if(n.pos) m.pos = n.pos.slice(); if(n.blick) m.blick = n.blick.slice(); }
      if(typeof this.o.beiNachricht === "function") this.o.beiNachricht(c.id, n);
    },
    // Block-Wunsch eines Gastes {x, y, z, id, alt, nr}: gilt nur, wenn hier noch `alt` steht; sonst bekommt der Urheber den tatsächlichen Block zurück
    block: function(c, n){
      var w = this.welt;
      if(!w || !zahl(n.x) || !zahl(n.y) || !zahl(n.z) || !SC.BLOECKE[n.id]) return;
      if((n.alt === undefined || w.holeBlock(n.x, n.y, n.z) === n.alt) && w.setzeBlock(n.x, n.y, n.z, n.id, "netz:" + c.id)) return;
      c.verb.sende({ t: "block", x: w.planet.wickel(n.x), y: Math.floor(n.y), z: w.planet.wickel(n.z), id: w.holeBlock(n.x, n.y, n.z), zurueck: true, nr: n.nr });
    }
  };
  function zahl(v){ return typeof v === "number" && isFinite(v); }
})();

// --- Gast ---
SC.Gast = function(o){
  this.o = o; this.figur = o.figur; this.protokoll = o.protokoll === undefined ? SC.NETZ_PROTOKOLL : o.protokoll;
  this.jetzt = o.jetzt || Date.now; this.warte = o.warte || function(ms, fn){ return setTimeout(fn, ms); };
  this.status = null; this.verb = null; this.code = null; this.farbe = null; this.spieler = []; this.willkommen = null;
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
  // Welt des Gastes anbinden: eigene Blockänderungen (Quelle nicht "netz") gehen als Wunsch an den Gastgeber und werden je Position gemerkt
  G.bindeWelt = function(welt){
    var s = this; s.welt = welt; s._wuensche = {}; SC.Raum.gastWelt(welt);
    welt.ereignisse.an("block", function(b){
      if(s.welt !== welt || !s.verb || String(b.quelle || "").indexOf("netz") === 0) return;
      var nr = ++s._nr; s._wuensche[b.x + "," + b.y + "," + b.z] = { id: b.id, alt: b.alt, nr: nr, zeit: s.jetzt() };
      s.verb.sende({ t: "block", x: b.x, y: b.y, z: b.z, id: b.id, alt: b.alt, nr: nr });
    });
  };
  // Pro Bild aufrufen. ich: {pos, blick, modus, stufe, ausr, menue, lebt}; sendet 15 Hz den eigenen zustand (ausr nur bei Änderung)
  G.takt = function(dt, ich){
    var s = this; s._takt += dt;
    if(s._takt < SC.RAUM_TAKT) return;
    s._takt -= SC.RAUM_TAKT; if(s._takt >= SC.RAUM_TAKT) s._takt = 0;
    var alt = s.jetzt() - SC.RAUM_WUNSCH_MS; for(var k in s._wuensche) if(s._wuensche[k].zeit < alt) delete s._wuensche[k];
    if(!s.verb || !ich || s.status !== "verbunden") return;
    var n = { t: "zustand", id: s.figur.figurId, pos: ich.pos, blick: ich.blick, modus: ich.modus, stufe: ich.stufe, menue: !!ich.menue, lebt: ich.lebt !== false },
      j = JSON.stringify(ich.ausr === undefined ? null : ich.ausr);
    if(j !== s._ausr){ s._ausr = j; n.ausr = ich.ausr; }
    s.verb.sende(n);
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
    willkommen: function(n){ this.willkommen = n; this.farbe = n.farbe; this.spieler = n.spieler || []; this.pvp = !!n.pvp; ruf(this.o.beiWillkommen, n); },
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
    zeit: function(n){ if(typeof n.tageszeit === "number") this.tageszeit = n.tageszeit; ruf(this.o.beiNachricht, n); },
    // Tatsache vom Gastgeber; mit zurueck:true wurde ein eigener Wunsch abgelehnt → beiBlockZurueck(x, y, z, id, wunsch {id, alt} | null)
    block: function(n){
      var w = this.welt; if(!w) return;
      w.setzeBlock(n.x, n.y, n.z, n.id, "netz");
      if(!n.zurueck) return;
      var k = n.x + "," + n.y + "," + n.z, wu = this._wuensche[k];
      if(wu && n.nr !== undefined && wu.nr !== n.nr) wu = null; // abgelehnt wurde ein älterer Wunsch an derselben Stelle
      else delete this._wuensche[k];
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
        l.push({ id: e.id, art: "geschoss", typ: e.typ, pos: r3(e.pos), blick: r3(r), farbe: e.farbe, team: e.team });
      }
    });
    return l;
  };
  var FELDER = ["typ", "gegnerArt", "stufe", "lp", "lpMax", "boss", "bemerkt", "blockt", "farbe", "team"];
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
  // Gast, Survival: ein abgelehnter Block-Wunsch {id, alt} wird im Rucksack rückgängig gemacht – gesetzter Block kommt zurück,
  // ein abgebauter (was er ergibt) wird wieder herausgenommen, soweit noch vorhanden. Liefert {zurueck, heraus} (Anzahl).
  SC.Raum.blockZurueck = function(rucksack, wunsch, tatsaechlicheId){
    var r = { zurueck: 0, heraus: 0 }, B = SC.B;
    if(!rucksack || !wunsch) return r;
    if(wunsch.id !== B.LUFT){ if(rucksack.lege({ block: wunsch.id, anzahl: 1 }) === 0) r.zurueck = 1; return r; }
    var g = wunsch.alt === undefined || wunsch.alt === B.LUFT ? null : SC.Abbau.ergibt(wunsch.alt);
    if(g === null) return r;
    for(var i = rucksack.plaetze.length - 1; i >= 0; i--){ var p = rucksack.plaetze[i]; if(p && p.block === g){ rucksack.nimm(i, 1); r.heraus = 1; break; } }
    return r;
  };
  // Gastgeber: alle Spieler als mögliche Ziele für Gegner (Gastgeber mit figurId zuerst, getrennte Gäste nicht)
  SC.Raum.mitspielerZiele = function(gastgeber, ich){
    return gastgeber._zustaende(ich).map(function(z){ return { id: z.id, pos: z.pos, blick: z.blick, modus: z.modus, menue: z.menue, lebt: z.lebt }; });
  };
})();
