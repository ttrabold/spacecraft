// Raumflug im Spiel (Stufe 5b): Austritt über SC.ALL_GRENZE, Flug im All, Zielwahl, Sprung, Eintritt mit Planetenwechsel.
// Zustand in this.all (null am Boden): { phase: "all" | "sprung", pos, blick, neigung, tempo, ziel, sprungT, vonPlanet, schiffId }.
// Ergänzt SC.Spiel; Logik des Sonnensystems in js/all.js, Darstellung in js/render-all.js.
SC.Spiel.prototype.all = null;
(function(){
  var S = SC.Spiel.prototype, SPRUNG_DAUER = 3;

  function vorwaerts(a){ return [-Math.sin(a.blick) * Math.cos(a.neigung), Math.sin(a.neigung), -Math.cos(a.blick) * Math.cos(a.neigung)]; }

  // Raumszene einschalten; Planeten setzen, wenn diese Szene sie für diesen Spielstand noch nicht hat
  // (nach einer Landung auf einem anderen Planeten legt starte() eine neue Darstellung samt leerer Raumszene an)
  S._allSzeneAn = function(){
    var r = this.render; if(!r || !r.allModus) return;
    r.allModus(true);
    if(r.allSzene && r.allSzene._daten !== this.daten){ r.allSzene.setzePlaneten(this.daten); r.allSzene._daten = this.daten; }
  };
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
    this.all = { phase: "all", pos: p, blick: Math.atan2(-n[0], -n[2]), neigung: Math.asin(n[1]), tempo: 40, ziel: null, sprungT: 0, vonPlanet: id, schiffId: f.id, schild: f.panzerung };
    if(this._astDaten !== this.daten){ this._astDaten = this.daten; this._allAsteroiden = SC.All.asteroiden(SC.hashText(this.daten.seed + ":all")); }
    this._allPiraten = []; this._allGeschosse = []; this._allZeit = 0; this._piratZeit = 40 + Math.random() * 30;
    this._allSzeneAn();
    if(this.ui.gluehen) this.ui.gluehen("#cfe8ff", 700);
  };

  // Pro Bild im All (statt Spielerphysik und Survival)
  S._allBild = function(e, dt, offen){
    var a = this.all, R = SC.ALL.radius;
    if(a.zuschauer){ this._allAnzeige(); return; } // Mitfahrer: Zustand kommt vom Piloten
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
        // Lenken: Tasten, dazu Maus bzw. Wischen (wie der Blick am Boden)
        a.blick += ((e.links ? 1 : 0) - (e.rechts ? 1 : 0)) * 1.2 * dt + (e.blickDx || 0);
        a.neigung = Math.max(-1.2, Math.min(1.2, a.neigung + ((e.springen ? 1 : 0) - (e.sinken ? 1 : 0)) * 1.0 * dt + (e.blickDy || 0)));
        if(e.ziel) this._zielWechseln();
        if(e.sprung){ if(!a.ziel) this.ui.hinweis(SC.T.allKeinZiel, 2000); else { a.phase = "sprung"; a.sprungT = 0; this.audio.spiele("aufstieg"); } }
      }
      var fw = vorwaerts(a); a.pos = [a.pos[0] + fw[0] * a.tempo * dt, a.pos[1] + fw[1] * a.tempo * dt, a.pos[2] + fw[2] * a.tempo * dt];
      if(this._allKampf(e, dt, offen)) return; // Notsprung
      for(var id in SC.ALL.planeten){ var c = SC.ALL.planeten[id]; if(Math.hypot(a.pos[0] - c[0], a.pos[1] - c[1], a.pos[2] - c[2]) < 1.25 * R){ this._eintritt(id); return; } }
    }
    this._allAnzeige();
  };
  // --- Asteroiden, Piraten, Bordlaser, Notsprung (nur im Survival gibt es Schaden und Piraten) ---
  var PIRAT_LP = 40, PIRAT_SCHADEN = 8, ASTEROID_SCHADEN = 25;
  S._piratenRufen = function(){
    var a = this.all, fw = vorwaerts(a), n = 2 + Math.floor(Math.random() * 2);
    this._allPiraten = [];
    for(var i = 0; i < n; i++){ var w = (i - (n - 1) / 2) * 0.6; this._allPiraten.push({ id: i, pos: [a.pos[0] + fw[0] * 320 + Math.cos(w) * 60 * i, a.pos[1] + fw[1] * 320 + 30 * i, a.pos[2] + fw[2] * 320 + Math.sin(w) * 60], blick: 0, lp: PIRAT_LP, cd: 1 + i * 0.5 }); }
    this.ui.hinweis(SC.T.allPiraten, 2500);
  };
  // → true, wenn ein Notsprung ausgelöst wurde
  S._allKampf = function(e, dt, offen){
    var s = this, a = this.all, f = this.welt.fahrzeuge.get(a.schiffId), survival = this.spieler.modus === "survival", fw = vorwaerts(a), z = this.daten.spielzeit || 0;
    this._allZeit = (this._allZeit || 0) + dt;
    // Schild: beim Gastgeber bzw. allein am Fahrzeug, beim Gast-Piloten im Zustand (das Fahrzeug spiegelt der Gastgeber)
    var gast = this.raum instanceof SC.Gast;
    function schaden(m){ if(survival){ if(gast) a.schild = Math.max(0, a.schild - m); else if(f){ SC.Fahrzeug.schaden(s.welt, f, m, z); a.schild = f.panzerung; } } s.audio.spiele("getroffen"); }
    // Asteroiden: Schild −25 (höchstens alle 0,5 s), abbremsen und abprallen
    var hit = SC.All.kollision(a.pos, this._allAsteroiden || [], 4);
    if(hit && this._allZeit >= (this._astBereit || 0)){
      this._astBereit = this._allZeit + 0.5; schaden(ASTEROID_SCHADEN); a.tempo = Math.min(a.tempo, 20);
      var d = [a.pos[0] - hit.pos[0], a.pos[1] - hit.pos[1], a.pos[2] - hit.pos[2]], l = Math.hypot(d[0], d[1], d[2]) || 1;
      a.pos = [hit.pos[0] + d[0] / l * (hit.r + 4.5), hit.pos[1] + d[1] / l * (hit.r + 4.5), hit.pos[2] + d[2] / l * (hit.r + 4.5)];
    }
    // Bordlaser des Piloten
    var g = SC.FAHRZEUGE.raumschiff.geschuetz;
    if(!offen && (e.abbauen || e.abbauenGehalten) && this._allZeit >= (this._laserBereit || 0)){
      this._laserBereit = this._allZeit + g.abklingen; this.audio.spiele("blaster");
      this._allGeschosse.push({ pos: [a.pos[0] + fw[0] * 5, a.pos[1] + fw[1] * 5, a.pos[2] + fw[2] * 5], richtung: fw, tempo: 300, leben: 2, team: "spieler" });
    }
    // Piraten: Gruppe alle 40–70 s Flug, fliegen heran, kreisen, schießen
    if(survival && !this._allPiraten.length && (this._piratZeit -= dt) <= 0){ this._piratZeit = 40 + Math.random() * 30; this._piratenRufen(); }
    this._allPiraten.forEach(function(p){
      var d = [a.pos[0] - p.pos[0], a.pos[1] - p.pos[1], a.pos[2] - p.pos[2]], l = Math.hypot(d[0], d[1], d[2]) || 1, v = [d[0] / l, d[1] / l, d[2] / l];
      p.blick = Math.atan2(-v[0], -v[2]);
      if(!p.halt){ var t = l > 120 ? 90 : 60, r = l > 120 ? v : [-v[2], 0, v[0]]; p.pos = [p.pos[0] + r[0] * t * dt, p.pos[1] + r[1] * t * dt, p.pos[2] + r[2] * t * dt]; }
      if((p.cd -= dt) <= 0 && l < 250){ p.cd = 1.5 + Math.random(); s._allGeschosse.push({ pos: p.pos.slice(), richtung: v, tempo: 160, leben: 3, team: "gegner" }); }
    });
    // Geschosse
    this._allGeschosse = this._allGeschosse.filter(function(q){
      q.leben -= dt; if(q.leben <= 0) return false;
      q.pos = [q.pos[0] + q.richtung[0] * q.tempo * dt, q.pos[1] + q.richtung[1] * q.tempo * dt, q.pos[2] + q.richtung[2] * q.tempo * dt];
      if(q.team === "gegner"){ if(Math.hypot(q.pos[0] - a.pos[0], q.pos[1] - a.pos[1], q.pos[2] - a.pos[2]) < 6){ schaden(PIRAT_SCHADEN); return false; } return true; }
      for(var i = 0; i < s._allPiraten.length; i++){ var p = s._allPiraten[i]; if(Math.hypot(q.pos[0] - p.pos[0], q.pos[1] - p.pos[1], q.pos[2] - p.pos[2]) < 8){ p.lp -= g.schaden; if(p.lp <= 0) s._piratBesiegt(i); else s.audio.spiele("treffer"); return false; } }
      return true;
    });
    if(survival && (gast ? a.schild : f ? f.panzerung : 1) <= 0){ this._notsprung(f); return true; }
    return false;
  };
  // Pirat verpufft; Beute direkt in den Rucksack (voll: Hinweis, Beute verfällt)
  S._piratBesiegt = function(i){
    this._allPiraten.splice(i, 1); this.audio.spiele("zerfall");
    if(this.spieler.modus !== "survival" || !this.kampf) return;
    var g = SC.Beute.erzeuge(SC.zufall((Math.random() * 4294967296) >>> 0), { stufe: this.kampf.werte.stufe });
    if(this.kampf.rucksack.lege({ gegenstand: g })) this.ui.hinweis(SC.T.rucksackVoll, 2000);
    else { this.ui.hinweis(SC.T.allBeute.replace("{name}", g.name), 2500); this.audio.spiele("aufsammeln", { seltenheit: g.seltenheit }); }
  };
  // Schild leer im All: zurück auf den Ausgangsplaneten, am Landepunkt auf den Boden (die Welt ist noch dessen Welt)
  S._notsprung = function(f){
    var schild = this.all.schild;
    this._allEnde(); if(this.ui.gluehen) this.ui.gluehen("#ffffff", 900);
    this.ui.hinweis(SC.T.allNotsprung, 4000);
    if(this.raum instanceof SC.Gast){ this.raum.notsprung(schild); return; } // der Gastgeber setzt das Schiff ab
    if(f) this._schiffAbsetzen(f);
  };
  // Schiff am Landepunkt des aktuellen Planeten auf den Boden setzen; Insassen bleiben sitzen
  S._schiffAbsetzen = function(f){
    var lp = this.landepunkt(), p = SC.Fahrzeug.freieStelle(this.welt, lp[0] + 10, lp[2], f.art, 0, 12) || [lp[0], lp[1] + 2, lp[2]];
    f.pos = p; f.geschw = [0, 0, 0]; f.tempo = 0;
    var im = SC.Fahrzeug.sitzVon(this.welt, this._fzId()); if(im) this._fahrzeugFolgen(im, true);
  };
  S._allEnde = function(){ this.all = null; if(this.render && this.render.allModus) this.render.allModus(false); if(this.ui.cockpit) this.ui.cockpit(null); if(this.ui.allKarte) this.ui.allKarte(null); };

  // --- Gemeinsam: Zustand des Piloten senden bzw. als Mitfahrer übernehmen ---
  S._allLage = function(){
    var a = this.all; if(!a || a.zuschauer) return null;
    return { phase: a.phase, pos: a.pos.slice(), blick: a.blick, neigung: a.neigung, tempo: a.tempo, ziel: a.ziel, sprungT: a.sprungT, vonPlanet: a.vonPlanet, schiffId: a.schiffId, schild: a.schild,
      piraten: (this._allPiraten || []).map(function(p){ return { pos: p.pos.slice(), blick: p.blick }; }), geschosse: (this._allGeschosse || []).slice(0, 40).map(function(q){ return { pos: q.pos.slice(), richtung: q.richtung.slice() }; }) };
  };
  // st: Zustand des Piloten (oder null). Wer als Mitfahrer im selben Schiff sitzt, sieht den Flug; endet er, zurück in die Blockwelt.
  S._allMitfahren = function(st){
    var im = this._imFahrzeug(), mit = !!(st && im && im.sitz !== 0 && st.schiffId === im.f.id);
    if(mit){
      if(!this.all || !this.all.zuschauer){
        this.all = { zuschauer: true };
        this._allSzeneAn();
      }
      for(var k in st) if(k !== "piraten" && k !== "geschosse") this.all[k] = st[k];
      this._allPiraten = st.piraten || []; this._allGeschosse = st.geschosse || []; this._allAsteroiden = this._allAsteroiden || SC.All.asteroiden(SC.hashText(this.daten.seed + ":all"));
    } else if(this.all && this.all.zuschauer) this._allEnde();
  };

  // Ziel reihum durch die anderen Planeten
  S._zielWechseln = function(){
    var a = this.all, l = SC.PLANET_REIHENFOLGE.filter(function(id){ return id !== a.vonPlanet; }), i = l.indexOf(a.ziel);
    a.ziel = l[(i + 1) % l.length]; this.ui.hinweis(SC.T.allZiel.replace("{name}", SC.PLANETEN[a.ziel].name), 1500);
  };
  // Ziel direkt setzen (Sternenkarte), nur als Pilot außerhalb des Sprungs → true, wenn gesetzt
  S._zielSetzen = function(id){
    var a = this.all; if(!a || a.zuschauer || a.phase !== "all" || !SC.ALL.planeten[id]) return false;
    a.ziel = id; this.ui.hinweis(SC.T.allZiel.replace("{name}", SC.PLANETEN[id].name), 1500); return true;
  };
  function flugzeit(c, pos){ return Math.max(0, Math.round((Math.hypot(c[0] - pos[0], c[1] - pos[1], c[2] - pos[2]) - 1.25 * SC.ALL.radius) / SC.ALL.tempo)); }
  // Raumszene und Cockpit-Anzeige
  S._allAnzeige = function(){
    var a = this.all; if(!a) return;
    if(this.render) this.render.allZustand = { schiff: { pos: a.pos, blick: a.blick, neigung: a.neigung }, sprung: a.phase === "sprung" ? Math.min(1, a.sprungT / 0.6) : 0,
      asteroiden: this._allAsteroiden || [], piraten: this._allPiraten || [], geschosse: this._allGeschosse || [] };
    if(this.ui.cockpit){
      var ziel = a.ziel ? SC.ALL.planeten[a.ziel] : null;
      this.ui.cockpit({ ziel: a.ziel ? SC.PLANETEN[a.ziel].name : null, sekunden: ziel ? flugzeit(ziel, a.pos) : null,
        schild: Math.round(100 * (typeof a.schild === "number" ? a.schild : SC.FAHRZEUGE.raumschiff.panzerung) / SC.FAHRZEUGE.raumschiff.panzerung), sprung: a.phase === "sprung" });
    }
    // Sternenkarte (von oben, x/z) und Planetenmarker im Bild; Antippen eines Planeten auf der Karte setzt das Ziel
    if(this.ui.allKarte && a.pos){
      var s = this, ms = this.render && this.render.allSzene && this.render.allSzene.marker ? this.render.allSzene.marker(innerWidth, innerHeight) : [];
      this.ui.allKarte({
        planeten: SC.PLANET_REIHENFOLGE.map(function(id){ var c = SC.ALL.planeten[id]; return { id: id, name: SC.PLANETEN[id].name, x: c[0], z: c[2], ziel: a.ziel === id }; }),
        schiff: { x: a.pos[0], z: a.pos[2], blick: a.blick },
        marker: ms.map(function(m){ var n = SC.PLANETEN[m.id] ? SC.PLANETEN[m.id].name : m.id; return { id: m.id, name: n, text: n + " · " + flugzeit(SC.ALL.planeten[m.id] || a.pos, a.pos) + " s", x: m.x, y: m.y, aussen: m.aussen, winkel: m.winkel, ziel: a.ziel === m.id }; })
      }, a.zuschauer ? null : function(id){ s._zielSetzen(id); });
    }
  };

  // Eintritt in Planet id: Glühen, Anflugstelle auf dem Torus, Schiff samt Insassen in die Atmosphäre darüber → Promise in this._eintrittP
  S._eintritt = function(id){
    var t = SC.All.zuTorus(id, this.all.pos), f = this.welt.fahrzeuge.get(this.all.schiffId), schild = this.all.schild, ort = [Math.floor(t.x) + 0.5, Math.floor(t.z) + 0.5];
    this._allEnde(); if(this.ui.gluehen) this.ui.gluehen("#ffb070", 800);
    if(this.raum instanceof SC.Gast){ this.raum.eintritt(id, ort, schild); return this._eintrittP = Promise.resolve(); } // der Gastgeber wechselt für alle
    return this._eintrittP = this._eintrittAusfuehren(f, id, ort);
  };
  // Schiff f samt Insassen in Planet id über ort [x, z] setzen (gleicher Planet: nur versetzen)
  S._eintrittAusfuehren = function(f, id, ort){
    if(id === this.welt.planet.id){
      if(f){ f.pos = [ort[0], SC.ALL_GRENZE - 10, ort[1]]; f.geschw = [0, 0, 0]; f.tempo = 0; var im = SC.Fahrzeug.sitzVon(this.welt, this._fzId()); if(im) this._fahrzeugFolgen(im, true); }
      return Promise.resolve();
    }
    return this.wechslePlanet(id, { ort: ort, schiff: f });
  };

  // Speichern im All: Spieler am Landepunkt des Ausgangsplaneten, Schiff am Boden daneben (nur in den gespeicherten Daten)
  S._allSpeichern = function(speichern){
    var a = this.all, sp = this.spieler, f = this.welt.fahrzeuge.get(a.schiffId), lp = this.landepunkt(), altRuhe = sp.ruhePos, altPos = f && f.pos;
    sp.ruhePos = lp.slice();
    if(f){ var p = SC.Fahrzeug.freieStelle(this.welt, lp[0] + 10, lp[2], f.art, 0, 10); if(p) f.pos = p; }
    try{ speichern(); } finally { sp.ruhePos = altRuhe; if(f) f.pos = altPos; }
  };
})();
