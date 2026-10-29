// Raumflug im Spiel (Stufe 5b): Austritt über SC.ALL_GRENZE, Flug im All, Zielwahl, Sprung, Eintritt mit Planetenwechsel.
// Zustand in this.all (null am Boden): { phase: "all" | "sprung", pos, blick, neigung, tempo, ziel, sprungT, vonPlanet, schiffId }.
// Ergänzt SC.Spiel; Logik des Sonnensystems in js/all.js, Darstellung in js/render-all.js.
SC.Spiel.prototype.all = null;
(function(){
  var S = SC.Spiel.prototype, SPRUNG_DAUER = 3;

  function vorwaerts(a){ return [-Math.sin(a.blick) * Math.cos(a.neigung), Math.sin(a.neigung), -Math.cos(a.blick) * Math.cos(a.neigung)]; }

  // Sitzen im Fahrzeug f alle Spieler (allein: nur man selbst)?
  S._alleAnBord = function(f){
    var r = this.raum, ids = [this._fzId()];
    if(r instanceof SC.Gastgeber) r.spieler.forEach(function(e){ if(e.verbunden) ids.push(e.id); });
    else if(r instanceof SC.Gast) (r.spieler || []).forEach(function(e){ if(ids.indexOf(e.id) < 0) ids.push(e.id); });
    return ids.every(function(id){ return f.sitze.indexOf(id) >= 0; });
  };

  // Aus _fahren: Pilot im Raumschiff über der Grenzhöhe → ins All (oder Halt, solange jemand fehlt)
  S._grenzeErreicht = function(f){
    if(this._alleAnBord(f)){ this._austritt(f); return; }
    f.pos[1] = SC.ALL_GRENZE - 0.5; if(f.geschw[1] > 0) f.geschw[1] = 0;
    var t = Date.now(); if(t - (this._anBordHinweis || 0) > 3000){ this._anBordHinweis = t; this.ui.hinweis(SC.T.allAlleAnBord, 2500); }
  };
  S._austritt = function(f){
    var id = this.welt.planet.id, c = SC.ALL.planeten[id], p = SC.All.zuKugel(id, f.pos[0], f.pos[2], SC.ALL.radius * 0.35); // außerhalb der Eintrittsgrenze (1,25 R)
    var n = [p[0] - c[0], p[1] - c[1], p[2] - c[2]], l = Math.hypot(n[0], n[1], n[2]); n = [n[0] / l, n[1] / l, n[2] / l];
    this.all = { phase: "all", pos: p, blick: Math.atan2(-n[0], -n[2]), neigung: Math.asin(n[1]), tempo: 40, ziel: null, sprungT: 0, vonPlanet: id, schiffId: f.id };
    if(this.render && this.render.allModus){ this.render.allModus(true); if(this._allPlaneten !== this.daten){ this.render.allSzene.setzePlaneten(this.daten); this._allPlaneten = this.daten; } }
    if(this.ui.gluehen) this.ui.gluehen("#cfe8ff", 700);
  };

  // Pro Bild im All (statt Spielerphysik und Survival)
  S._allBild = function(e, dt, offen){
    var a = this.all, R = SC.ALL.radius;
    if(a.phase === "sprung"){
      a.sprungT += dt;
      var zc = SC.ALL.planeten[a.ziel], d = [zc[0] - a.pos[0], zc[1] - a.pos[1], zc[2] - a.pos[2]], l = Math.hypot(d[0], d[1], d[2]) || 1;
      a.blick = Math.atan2(-d[0] / l, -d[2] / l); a.neigung = Math.asin(d[1] / l);
      if(a.sprungT >= SPRUNG_DAUER){
        a.pos = [zc[0] - d[0] / l * 2.5 * R, zc[1] - d[1] / l * 2.5 * R, zc[2] - d[2] / l * 2.5 * R]; a.phase = "all"; a.tempo = 60;
        if(this.ui.gluehen) this.ui.gluehen("#e8f4ff", 500);
      } else { var v = Math.min(l - 2.5 * R, Math.max(0, l - 2.5 * R) * dt * 1.2 + 200 * dt); a.pos = [a.pos[0] + d[0] / l * v, a.pos[1] + d[1] / l * v, a.pos[2] + d[2] / l * v]; }
    } else {
      if(!offen){
        var gas = (e.vor ? 1 : 0) - (e.zurueck ? 1 : 0); a.tempo = Math.max(0, Math.min(SC.ALL.tempo, a.tempo + gas * 60 * dt));
        a.blick += ((e.links ? 1 : 0) - (e.rechts ? 1 : 0)) * 1.2 * dt;
        a.neigung = Math.max(-1.2, Math.min(1.2, a.neigung + ((e.springen ? 1 : 0) - (e.sinken ? 1 : 0)) * 1.0 * dt));
        if(e.ziel) this._zielWechseln();
        if(e.sprung){ if(!a.ziel) this.ui.hinweis(SC.T.allKeinZiel, 2000); else { a.phase = "sprung"; a.sprungT = 0; this.audio.spiele("aufstieg"); } }
      }
      var fw = vorwaerts(a); a.pos = [a.pos[0] + fw[0] * a.tempo * dt, a.pos[1] + fw[1] * a.tempo * dt, a.pos[2] + fw[2] * a.tempo * dt];
      for(var id in SC.ALL.planeten){ var c = SC.ALL.planeten[id]; if(Math.hypot(a.pos[0] - c[0], a.pos[1] - c[1], a.pos[2] - c[2]) < 1.25 * R){ this._eintritt(id); return; } }
    }
    this._allAnzeige();
  };
  // Ziel reihum durch die anderen Planeten
  S._zielWechseln = function(){
    var a = this.all, l = SC.PLANET_REIHENFOLGE.filter(function(id){ return id !== a.vonPlanet; }), i = l.indexOf(a.ziel);
    a.ziel = l[(i + 1) % l.length]; this.ui.hinweis(SC.T.allZiel.replace("{name}", SC.PLANETEN[a.ziel].name), 1500);
  };
  // Raumszene und Cockpit-Anzeige
  S._allAnzeige = function(){
    var a = this.all; if(!a) return;
    if(this.render) this.render.allZustand = { schiff: { pos: a.pos, blick: a.blick, neigung: a.neigung }, sprung: a.phase === "sprung" ? Math.min(1, a.sprungT / 0.6) : 0,
      asteroiden: this._allAsteroiden || [], piraten: this._allPiraten || [], geschosse: this._allGeschosse || [] };
    if(this.ui.cockpit){
      var f = this.welt && this.welt.fahrzeuge.get(a.schiffId), ziel = a.ziel ? SC.ALL.planeten[a.ziel] : null;
      this.ui.cockpit({ ziel: a.ziel ? SC.PLANETEN[a.ziel].name : null, sekunden: ziel ? Math.max(0, Math.round((Math.hypot(ziel[0] - a.pos[0], ziel[1] - a.pos[1], ziel[2] - a.pos[2]) - 1.25 * SC.ALL.radius) / SC.ALL.tempo)) : null,
        schild: f ? Math.round(100 * f.panzerung / SC.FAHRZEUGE[f.art].panzerung) : 100, sprung: a.phase === "sprung" });
    }
  };

  // Eintritt in Planet id: Glühen, Anflugstelle auf dem Torus, Schiff samt Insassen in die Atmosphäre darüber → Promise in this._eintrittP
  S._eintritt = function(id){
    var s = this, t = SC.All.zuTorus(id, this.all.pos), f = this.welt.fahrzeuge.get(this.all.schiffId);
    this.all = null; if(this.render && this.render.allModus) this.render.allModus(false); if(this.ui.cockpit) this.ui.cockpit(null);
    if(this.ui.gluehen) this.ui.gluehen("#ffb070", 800);
    var ort = [Math.floor(t.x) + 0.5, Math.floor(t.z) + 0.5];
    if(id === this.welt.planet.id){ // zurück zum selben Planeten: nur das Schiff versetzen
      if(f){ f.pos = [ort[0], SC.ALL_GRENZE - 10, ort[1]]; f.geschw = [0, 0, 0]; f.tempo = 0; this._fahrzeugFolgen(SC.Fahrzeug.sitzVon(this.welt, this._fzId()), true); }
      return this._eintrittP = Promise.resolve();
    }
    return this._eintrittP = this.wechslePlanet(id, { ort: ort, schiff: f });
  };

  // Speichern im All: Spieler am Landepunkt des Ausgangsplaneten, Schiff am Boden daneben (nur in den gespeicherten Daten)
  S._allSpeichern = function(speichern){
    var a = this.all, sp = this.spieler, f = this.welt.fahrzeuge.get(a.schiffId), lp = this.landepunkt(), altRuhe = sp.ruhePos, altPos = f && f.pos;
    sp.ruhePos = lp.slice();
    if(f){ var p = SC.Fahrzeug.freieStelle(this.welt, lp[0] + 10, lp[2], f.art, 0, 10); if(p) f.pos = p; }
    try{ speichern(); } finally { sp.ruhePos = altRuhe; if(f) f.pos = altPos; }
  };
})();
