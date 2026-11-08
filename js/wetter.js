// Wetter (Spec 2026-11-08-wetter-design.md): Zustand je Planet – wann eine Phase kommt, wie stark sie ist, was sie bewirkt.
// Rein rechnerisch; Boden (js/wetter-boden.js), Darstellung (js/render-wetter.js) und Spiel lesen effekte().
// Alle Zahlen stehen hier in SC.WETTER (nach dem Spieltest anpassen).
SC.WETTER = {
  TAG: 1200,            // Spieltag in Sekunden: höchstens eine Phase je Tag
  PAUSE: 600,           // mindestens so lange klar nach einer Phase
  DAUER: [180, 300],    // Länge einer Phase
  UNWETTER: 1 / 3,      // Anteil der Phasen, die zum Unwetter werden (ab der Hälfte)
  ANKUENDIGUNG: 8,      // Sekunden Vorwarnung
  AUFZUG: 20,           // Sekunden bis zur vollen Stärke bzw. bis klar
  TROCKNEN: 90,         // Sekunden nach dem Ende, bis Pfützen trocknen und Schnee taut
  KRISTALL: 0.2,        // Chance auf einen weißen Kristall je Blitzeinschlag
  start: { chance: 0.5, normal: ["regen"], unwetter: "gewitter" },
  glutfrost: { chance: 0.7, normal: ["schnee"], unwetter: "schneesturm" },
  rankenmoor: { chance: 0.9, normal: ["regen", "nebel"], unwetter: "wolkenbruch" },
  // je Art: niederschlag, menge, sicht (Faktor auf die Nebelweite), dunkel (Faktor aufs Tageslicht), wind (Blöcke/s), blitze (je Minute),
  // gegnerTag (Anteil von nachtMax tagsüber), gegnerNacht (Faktor nachts), gegnerArten ({art: Faktor}), tiere, froesche (Faktoren),
  // pfuetzen (Mulden je Minute), einsinken, schneeRate (Schneestellen je Minute)
  ARTEN: {
    regen: { niederschlag: "regen", menge: 0.6, sicht: 0.75, dunkel: 0.85, wind: 0.4, blitze: 0, gegnerTag: 0, gegnerNacht: 1, gegnerArten: {}, tiere: 0.5, froesche: 3, pfuetzen: 12, einsinken: false, schneeRate: 0 },
    gewitter: { niederschlag: "regen", menge: 1, sicht: 0.6, dunkel: 0.55, wind: 1, blitze: 4, gegnerTag: 0.5, gegnerNacht: 1.25, gegnerArten: {}, tiere: 0.5, froesche: 3, pfuetzen: 20, einsinken: true, schneeRate: 0 },
    schnee: { niederschlag: "schnee", menge: 0.6, sicht: 0.6, dunkel: 0.9, wind: 0.4, blitze: 0, gegnerTag: 0, gegnerNacht: 1, gegnerArten: {}, tiere: 0.7, froesche: 1, pfuetzen: 0, einsinken: false, schneeRate: 60 },
    schneesturm: { niederschlag: "schnee", menge: 1, sicht: 0.25, dunkel: 0.75, wind: 2, blitze: 0, gegnerTag: 0, gegnerNacht: 1, gegnerArten: { frostkrabbler: 3, frostgolem: 3, schneewerfer: 3, eisrutscher: 3 }, tiere: 0.5, froesche: 1, pfuetzen: 0, einsinken: false, schneeRate: 150 },
    nebel: { niederschlag: null, menge: 0, sicht: 0.3, dunkel: 0.85, wind: 0, blitze: 0, gegnerTag: 0, gegnerNacht: 1, gegnerArten: { moorirrlicht: 3 }, tiere: 0.8, froesche: 2, pfuetzen: 0, einsinken: false, schneeRate: 0 },
    wolkenbruch: { niederschlag: "regen", menge: 1, sicht: 0.5, dunkel: 0.7, wind: 0.8, blitze: 0, gegnerTag: 0, gegnerNacht: 1, gegnerArten: {}, tiere: 0.5, froesche: 3, pfuetzen: 40, einsinken: true, schneeRate: 0 }
  }
};

// planetId: Tabelle je Planet (start, glutfrost, rankenmoor); daten: gespeicherter Zustand (pd.wetter) oder null; zf: Zufall 0..1
SC.Wetter = function(planetId, daten, zf){
  this.planet = SC.WETTER[planetId] ? planetId : "start"; this.zf = zf || Math.random; this.gast = false;
  var d = daten || {};
  this.art = d.art || null; this.normal = d.normal || null; this.unwetterArt = d.unwetterArt || null; this.unwetter = !!d.unwetter;
  this.rest = d.rest || 0; this.dauer = d.dauer || 0; this.wind = d.wind || [0, 0]; this.seitEnde = d.seitEnde === undefined ? 1e9 : d.seitEnde;
  this.geplant = d.geplant || null;   // angekündigte Phase { art, unwetter }
  this.bisNaechste = typeof d.bisNaechste === "number" ? d.bisNaechste : SC.WETTER.PAUSE + this.zf() * SC.WETTER.TAG;
  this.staerke = typeof d.staerke === "number" ? d.staerke : this.art ? 1 : 0;
};
(function(){
  var W = SC.WETTER, P = SC.Wetter.prototype;
  P.alsDaten = function(){ return { art: this.art, normal: this.normal, unwetterArt: this.unwetterArt, unwetter: this.unwetter, rest: this.rest, dauer: this.dauer, wind: this.wind.slice(), seitEnde: this.seitEnde, geplant: this.geplant, bisNaechste: this.bisNaechste, staerke: this.staerke }; };
  P._beginne = function(normal, unwetter, dauer){
    var zf = this.zf, a = this.planet;
    this.normal = normal; this.unwetterArt = unwetter ? W[a].unwetter : null; this.unwetter = false; this.art = normal;
    this.dauer = this.rest = dauer || W.DAUER[0] + zf() * (W.DAUER[1] - W.DAUER[0]);
    var win = zf() * Math.PI * 2; this.wind = [Math.sin(win), Math.cos(win)];   // Richtung je Phase fest
  };
  P.schritt = function(dt){
    var ev = [], zf = this.zf;
    if(this.gast) return ev;   // Gäste übernehmen den Zustand vom Gastgeber
    if(!this.art){
      this.seitEnde += dt; this.staerke = Math.max(0, this.staerke - dt / W.AUFZUG);
      this.bisNaechste -= dt;
      if(!this.geplant && this.bisNaechste <= W.ANKUENDIGUNG){
        if(zf() < W[this.planet].chance){ var n = W[this.planet].normal; this.geplant = { art: n[Math.floor(zf() * n.length)], unwetter: zf() < W.UNWETTER }; ev.push({ art: "ankuendigung", wetter: this.geplant.unwetter ? W[this.planet].unwetter : this.geplant.art }); }
        else this.bisNaechste += W.TAG;   // heute bleibt es klar
      }
      if(this.geplant && this.bisNaechste <= 0){ this._beginne(this.geplant.art, this.geplant.unwetter); this.geplant = null; ev.push({ art: "beginn", wetter: this.art }); }
      return ev;
    }
    this.rest -= dt;
    this.staerke = Math.min(1, this.staerke + dt / W.AUFZUG, Math.max(0, this.rest) / W.AUFZUG);
    if(this.unwetterArt && !this.unwetter && this.rest <= this.dauer / 2){ this.unwetter = true; this.art = this.unwetterArt; ev.push({ art: "unwetter", wetter: this.art }); }
    if(this.rest <= 0){
      ev.push({ art: "ende", wetter: this.art });
      this.art = null; this.unwetter = false; this.unwetterArt = null; this.seitEnde = 0; this.staerke = 0;
      this.bisNaechste = W.TAG - this.dauer + zf() * W.TAG / 2;   // Abstand der Anfänge ≥ TAG, Pause ≥ TAG − DAUER[1] ≥ PAUSE
    }
    return ev;
  };
  // Entwicklerwerkzeug und Gastgeber: Wetter sofort setzen (null = klar)
  P.setze = function(art, dauer){
    this.geplant = null;
    if(!art){ if(this.art){ this.art = null; this.unwetter = false; this.unwetterArt = null; this.seitEnde = 0; } this.staerke = 0; this.bisNaechste = W.PAUSE; return; }
    this._beginne(art, false, dauer || W.DAUER[1]); this.unwetter = art === W[this.planet].unwetter; this.staerke = 1;
  };
  P.effekte = function(){
    var A = this.art && W.ARTEN[this.art], s = A ? this.staerke : 0, k = A || W.ARTEN.regen;
    function mix(wert, neutral){ return neutral + (wert - neutral) * s; }
    return { art: this.art, staerke: s, niederschlag: A && s > 0 ? A.niederschlag : null, menge: A ? A.menge * s : 0, sicht: mix(k.sicht, 1), dunkel: mix(k.dunkel, 1),
      wind: A ? [this.wind[0] * A.wind * s, this.wind[1] * A.wind * s] : [0, 0], blitze: A ? A.blitze * s : 0, gegnerTag: A ? A.gegnerTag * s : 0, gegnerNacht: A ? mix(A.gegnerNacht, 1) : 1,
      gegnerArten: A && s > 0 ? A.gegnerArten : {}, tiere: A ? mix(A.tiere, 1) : 1, froesche: A ? mix(A.froesche, 1) : 1, pfuetzen: A ? A.pfuetzen * s : 0, einsinken: !!(A && A.einsinken && s > 0.5),
      schneeRate: A ? A.schneeRate * s : 0, seitEnde: this.art ? 0 : this.seitEnde };
  };
  // Gastgeber → Gäste: kurzer Zustand; Gäste rechnen nicht selbst
  P.netz = function(){ return { art: this.art, staerke: +this.staerke.toFixed(3), unwetter: this.unwetter, wind: this.wind.slice(), seitEnde: Math.min(this.seitEnde, 1e6) }; };
  P.uebernimm = function(n){ this.art = n.art || null; this.staerke = n.staerke || 0; this.unwetter = !!n.unwetter; this.wind = n.wind || [0, 0]; this.seitEnde = n.seitEnde || 0; };
  // Blitz: in ein paar Spalten 12–40 Blöcke um einen Spieler die höchste Stelle; nie näher als 6 an Spielern oder Tieren → [x, y, z] oder null
  SC.Wetter.blitzZiel = function(welt, orte, zf){
    var P = welt.planet.groesse, o = orte[Math.floor(zf() * orte.length)], best = null, H = SC.CHUNK.H;
    var nah = orte.slice(); welt.wesen.forEach(function(e){ if(e.art === "tier") nah.push(e.pos); });
    for(var i = 0; i < 12; i++){
      var win = zf() * Math.PI * 2, ab = 12 + zf() * 28, x = Math.floor(o[0] + Math.sin(win) * ab), z = Math.floor(o[2] + Math.cos(win) * ab);
      if(welt.istGeladen && !welt.istGeladen(SC.mod(x, P) >> 4, SC.mod(z, P) >> 4)) continue;
      if(nah.some(function(p){ return Math.hypot(SC.mod(x + 0.5 - p[0] + P / 2, P) - P / 2, SC.mod(z + 0.5 - p[2] + P / 2, P) - P / 2) < 6; })) continue;
      var y = H - 1; while(y > 0 && !SC.BLOECKE[welt.holeBlock(x, y, z)].fest) y--;
      if(y > 0 && (!best || y > best[1])) best = [SC.mod(x, P), y, SC.mod(z, P)];
    }
    return best;
  };
  // Was ein Einschlag liegen lässt: manchmal einen weißen Kristall; zerstört wird nichts
  SC.Wetter.blitzBeute = function(zf){ return zf() < W.KRISTALL ? [{ block: SC.B.KRISTALL_WEISS, anzahl: 1 }] : []; };
  SC.Wetter.vonNetz = function(n, planetId){ var w = new SC.Wetter(planetId || "start", null); w.gast = true; w.uebernimm(n); return w; };
})();
