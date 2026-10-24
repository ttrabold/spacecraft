// Raum-Protokoll: Gastgeber und Gast über einen Netz-Adapter (js/netz.js). Reine Logik ohne DOM und three.js;
// mit dem Spiel spricht der Raum nur über Rückrufe. Nachrichten tragen ihren Typ in `t` und laufen über die
// Verteilertabellen SC.Gastgeber.NACHRICHTEN und SC.Gast.NACHRICHTEN (spätere Aufgaben ergänzen dort weitere Typen).
SC.RAUM_FARBEN = ["#3a6fd8", "#e0533a", "#2fae5a", "#c9a227"]; // Gastgeber zuerst
SC.RAUM_MAX = 4;                // Spieler insgesamt (Gastgeber + 3 Gäste)
SC.RAUM_NEU_ALLE_MS = 2000;     // Gast: Neuverbinden alle 2 s …
SC.RAUM_NEU_HOECHSTENS_MS = 15000; // … höchstens 15 s lang
SC.RAUM_NACHLAUF_MS = 500;      // Gastgeber: Raum erst kurz nach „ende“ schließen, damit die Nachricht noch ankommt

// --- Gastgeber ---
SC.Gastgeber = function(o){
  this.o = o; this.daten = o.daten; this.welt = o.welt; this.zf = o.zf || Math.random; this.warte = o.warte || function(ms, fn){ return setTimeout(fn, ms); };
  this.farbe = SC.RAUM_FARBEN[0]; this.spieler = []; this.pvp = false; this.code = null; this.raum = null;
  this._bestaetigt = {}; // figurId → true, solange dieser Raum lebt
  this._verb = {};       // figurId → angenommene Verbindung {verb, id, name, drin}
  this._zu = false;
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
    v.an("zu", function(){ s._weg(c); });
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
    else { e.name = c.name; e.verbunden = true; }
    c.verb.sende({ t: "willkommen", farbe: e.farbe, welt: s._weltInfo(), pos: pos, blick: blick, pvp: s.pvp, spieler: s.liste(), chunkAnzahl: s.welt.geaenderte.size });
    s.welt.geaenderte.forEach(function(u8, k){ c.verb.sende({ t: "chunk", k: k, daten: u8 }); });
    c.verb.sende({ t: "bereit" });
    s._listeGeaendert(id);
  };
  G._weg = function(c){
    if(!c.drin || this._verb[c.id] !== c) return;
    c.drin = false; delete this._verb[c.id]; this._entferne(c.id); this._listeGeaendert();
  };

  G.sende = function(id, n){ var c = this._verb[id]; if(c) c.verb.sende(n); };
  G.sendeAlle = function(n, ausserId){ for(var id in this._verb) if(id !== ausserId) this._verb[id].verb.sende(n); };
  G.hinauswerfen = function(id){
    delete this._bestaetigt[id];
    var c = this._verb[id]; if(!c) return;
    c.drin = false; delete this._verb[id]; this._entferne(id);
    this._ablehnen(c, "hinausgeworfen"); this._listeGeaendert();
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
      var beantwortet = false;
      ruf(s.o.beiAnfrage, { id: c.id, name: c.name }, function(ja){
        if(beantwortet || c.weg || s._zu) return; beantwortet = true;
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
    }
  };
})();

// --- Gast ---
SC.Gast = function(o){
  this.o = o; this.figur = o.figur; this.protokoll = o.protokoll === undefined ? SC.NETZ_PROTOKOLL : o.protokoll;
  this.jetzt = o.jetzt || Date.now; this.warte = o.warte || function(ms, fn){ return setTimeout(fn, ms); };
  this.status = null; this.verb = null; this.code = null; this.farbe = null; this.spieler = []; this.willkommen = null;
  this._fertig = true; this._ende = true; this._runde = 0; this._start = 0;
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
      this._runde++; ruf(this.o.beiBereit);
      this._status("verbunden"); this._abschluss(null);
    },
    spieler: function(n){ this.spieler = n.liste || []; ruf(this.o.beiNachricht, n); },
    ende: function(){
      this._ende = true; this._loese();
      if(!this._fertig) this._abschluss(new SC.Netz.Fehler("ende"));
      else this._status("getrennt", { grund: "ende" });
    }
  };
})();
