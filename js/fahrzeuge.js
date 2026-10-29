// Fahrzeuge (Stufe 4): gefundene Viersitzer. Werte und Modelle in SC.FAHRZEUGE, Logik in SC.Fahrzeug (ohne DOM und three.js).
// Lage: pos = Mitte unten, blick = Drehwinkel wie bei Gegnern (vorn ist -z bei blick 0, größerer Winkel dreht nach links),
// Grundfläche quadratisch mit Kantenlänge breite (dreht nicht mit). Modell und Sitze in lokalen Koordinaten (vorn -z).
SC.FAHRZEUGE = {
  // Offener Landgleiter: schnell, schwebt über Boden und Wasser, kein Geschütz
  gleiter: {
    tempo: 13, beschl: 18, lenk: 2.2, breite: 2.4, hoehe: 1.4, panzerung: 120, geschuetz: null, schwebt: 0.6, stufe: 1,
    sitze: [[-0.45, 0.35, -0.2], [0.45, 0.35, -0.2], [-0.45, 0.35, 0.75], [0.45, 0.35, 0.75]],
    modell: [
      { w: 2.0, h: 0.45, d: 3.4, x: 0, y: 0.3, z: 0.1, farbe: "#d9c7a0" },          // Rumpf
      { w: 1.4, h: 0.35, d: 1.0, x: 0, y: 0.25, z: -1.9, farbe: "#c9b48a" },        // Nase
      { w: 2.0, h: 0.06, d: 3.0, x: 0, y: 0.04, z: 0.1, farbe: "#5ff4ff", leuchtet: true }, // Schwebestrahl unten
      { w: 1.7, h: 0.5, d: 0.08, x: 0, y: 0.8, z: -0.75, farbe: "#9fdcff" },        // Windschutz
      { w: 0.75, h: 0.25, d: 0.7, x: -0.45, y: 0.6, z: -0.2, farbe: "#6b4a3a" },    // Sitze
      { w: 0.75, h: 0.25, d: 0.7, x: 0.45, y: 0.6, z: -0.2, farbe: "#6b4a3a" },
      { w: 1.7, h: 0.25, d: 0.7, x: 0, y: 0.6, z: 0.75, farbe: "#6b4a3a" },
      { w: 0.5, h: 0.5, d: 1.3, x: -0.75, y: 0.75, z: 1.45, farbe: "#8f8a80" },     // Triebwerke
      { w: 0.5, h: 0.5, d: 1.3, x: 0.75, y: 0.75, z: 1.45, farbe: "#8f8a80" },
      { w: 0.4, h: 0.4, d: 0.06, x: -0.75, y: 0.75, z: 2.12, farbe: "#ff9a3c", leuchtet: true },
      { w: 0.4, h: 0.4, d: 0.06, x: 0.75, y: 0.75, z: 2.12, farbe: "#ff9a3c", leuchtet: true },
      { w: 2.02, h: 0.06, d: 0.2, x: 0, y: 0.45, z: -1.0, farbe: "#ff7a3c", leuchtet: true }  // Leuchtstreifen
    ]
  },
  // Schwerer Geländewagen mit großen Rädern und Geschützturm
  buggy: {
    tempo: 8.5, beschl: 10, lenk: 1.8, breite: 2.6, hoehe: 2.0, panzerung: 250, stufe: 1,
    geschuetz: { schaden: 18, tempo: 40, abklingen: 0.35, farbe: "#ff5a3c", rohr: [0, 2.1, -1.4] },
    sitze: [[-0.5, 0.75, -0.35], [0.5, 0.75, -0.35], [-0.5, 0.75, 0.65], [0.5, 0.75, 0.65]],
    modell: [
      { w: 2.0, h: 0.6, d: 3.0, x: 0, y: 0.85, z: 0, farbe: "#6f7d52" },           // Wanne
      { w: 1.8, h: 0.35, d: 0.6, x: 0, y: 0.9, z: -1.7, farbe: "#5d6a43" },         // Rammbügel
      { w: 0.55, h: 1.0, d: 1.0, x: -1.05, y: 0.5, z: -0.95, farbe: "#2b2b2e" },    // Räder
      { w: 0.55, h: 1.0, d: 1.0, x: 1.05, y: 0.5, z: -0.95, farbe: "#2b2b2e" },
      { w: 0.55, h: 1.0, d: 1.0, x: -1.05, y: 0.5, z: 0.95, farbe: "#2b2b2e" },
      { w: 0.55, h: 1.0, d: 1.0, x: 1.05, y: 0.5, z: 0.95, farbe: "#2b2b2e" },
      { w: 0.1, h: 0.9, d: 0.1, x: -0.9, y: 1.6, z: -0.8, farbe: "#3d4430" },       // Überrollbügel
      { w: 0.1, h: 0.9, d: 0.1, x: 0.9, y: 1.6, z: -0.8, farbe: "#3d4430" },
      { w: 1.9, h: 0.1, d: 0.1, x: 0, y: 2.05, z: -0.8, farbe: "#3d4430" },
      { w: 0.8, h: 0.4, d: 0.8, x: 0, y: 2.1, z: -0.8, farbe: "#55603d" },          // Geschützturm
      { w: 0.14, h: 0.14, d: 0.9, x: 0, y: 2.1, z: -1.4, farbe: "#2a2f22" },        // Rohr
      { w: 0.16, h: 0.16, d: 0.05, x: 0, y: 2.1, z: -1.86, farbe: "#ff5a3c", leuchtet: true },
      { w: 2.02, h: 0.08, d: 0.16, x: 0, y: 1.05, z: -1.2, farbe: "#ffad47", leuchtet: true }, // Leuchtstreifen
      { w: 0.3, h: 0.2, d: 0.05, x: -0.7, y: 0.95, z: -1.53, farbe: "#fff3c0", leuchtet: true }, // Scheinwerfer
      { w: 0.3, h: 0.2, d: 0.05, x: 0.7, y: 0.95, z: -1.53, farbe: "#fff3c0", leuchtet: true }
    ]
  },
  // Kleiner Gleitjäger mit Cockpit und Flügeln, fliegt wie eine Drohne
  flieger: {
    tempo: 11, beschl: 14, lenk: 2.0, breite: 2.6, hoehe: 1.6, panzerung: 160, fliegt: true, maxHoehe: 118, steigen: 6, sinken: 4,
    geschuetz: { schaden: 14, tempo: 45, abklingen: 0.25, farbe: "#5ad1ff", rohr: [0, 0.9, -2.3] },
    sitze: [[-0.3, 0.55, -0.6], [0.3, 0.55, -0.6], [-0.3, 0.55, 0.3], [0.3, 0.55, 0.3]],
    modell: [
      { w: 1.1, h: 0.8, d: 4.0, x: 0, y: 0.8, z: 0, farbe: "#c8ccd4" },            // Rumpf
      { w: 0.7, h: 0.5, d: 0.8, x: 0, y: 0.75, z: -2.3, farbe: "#b0b5bf" },         // Nase
      { w: 1.0, h: 0.5, d: 1.6, x: 0, y: 1.4, z: -0.15, farbe: "#7fd8ff" },         // Cockpit
      { w: 4.2, h: 0.14, d: 1.3, x: 0, y: 0.7, z: 0.7, farbe: "#a9afba" },          // Flügel
      { w: 0.14, h: 0.6, d: 1.0, x: -2.05, y: 0.95, z: 0.75, farbe: "#8b919c" },    // Flügelenden
      { w: 0.14, h: 0.6, d: 1.0, x: 2.05, y: 0.95, z: 0.75, farbe: "#8b919c" },
      { w: 0.1, h: 0.1, d: 1.0, x: -2.05, y: 0.7, z: -0.2, farbe: "#3a3f4a" },      // Laserkanonen
      { w: 0.1, h: 0.1, d: 1.0, x: 2.05, y: 0.7, z: -0.2, farbe: "#3a3f4a" },
      { w: 0.6, h: 0.6, d: 0.6, x: -0.45, y: 0.85, z: 2.0, farbe: "#7a808b" },      // Triebwerke
      { w: 0.6, h: 0.6, d: 0.6, x: 0.45, y: 0.85, z: 2.0, farbe: "#7a808b" },
      { w: 0.5, h: 0.5, d: 0.05, x: -0.45, y: 0.85, z: 2.32, farbe: "#5ad1ff", leuchtet: true },
      { w: 0.5, h: 0.5, d: 0.05, x: 0.45, y: 0.85, z: 2.32, farbe: "#5ad1ff", leuchtet: true },
      { w: 4.22, h: 0.04, d: 0.12, x: 0, y: 0.79, z: 0.2, farbe: "#ff6fd8", leuchtet: true }, // Leuchtstreifen
      { w: 0.12, h: 0.4, d: 0.12, x: -0.4, y: 0.2, z: -1.2, farbe: "#55595f" },     // Landestützen
      { w: 0.12, h: 0.4, d: 0.12, x: 0.4, y: 0.2, z: -1.2, farbe: "#55595f" },
      { w: 0.12, h: 0.4, d: 0.12, x: 0, y: 0.2, z: 1.4, farbe: "#55595f" }
    ]
  }
};
(function(){ for(var a in SC.FAHRZEUGE){ SC.FAHRZEUGE[a].art = a; SC.FAHRZEUGE[a].name = SC.T.fahrzeuge[a]; } })();

SC.Fahrzeug = { SCHWERKRAFT: 32 };
(function(){
  var F = SC.Fahrzeug;

  // o: { id, fundort, heim } – ohne id ein frei hingestelltes Fahrzeug
  F.neu = function(welt, art, pos, blick, o){
    o = o || {}; var d = SC.FAHRZEUGE[art];
    var f = { id: o.id || "frei-" + Math.random().toString(36).slice(2, 10), art: art, pos: pos.slice(), blick: blick || 0, geschw: [0, 0, 0], tempo: 0,
      panzerung: d.panzerung, fundort: o.fundort || null, heim: o.heim ? o.heim.slice() : null, sitze: [null, null, null, null], weg: false, wiederBei: null, aufBoden: false };
    welt.fahrzeuge.set(f.id, f);
    return f;
  };

  // Oberkante des ersten festen Blocks oder Wassers unter pos (Mittelspalte), höchstens 24 Blöcke tief
  function boden(welt, pos){
    for(var y = Math.floor(pos[1] + 0.5); y > pos[1] - 24 && y > 0; y--){
      var b = SC.BLOECKE[welt.holeBlock(pos[0], y - 1, pos[2])];
      if(b && (b.fest || b.id === SC.B.WASSER)) return y;
    }
    return -Infinity;
  }
  // Waagerecht bewegen; an einer Kante (höchstens d.stufe hoch) steigt das Fahrzeug hinauf
  function waagerecht(welt, f, d, achse, weg){
    if(!SC.bewegeKoerper(welt, f.pos, achse, weg, d.breite, d.hoehe)) return false;
    if(d.stufe && (f.aufBoden || d.schwebt)){
      var q = f.pos.slice();
      if(!SC.bewegeKoerper(welt, q, 1, d.stufe, d.breite, d.hoehe) && !SC.bewegeKoerper(welt, q, achse, weg, d.breite, d.hoehe)){ f.pos = q; return false; }
    }
    return true;
  }

  // Ein Schritt. e: { vor, zurueck, links, rechts, hoch, runter } des Fahrers oder null (niemand fährt)
  F.schritt = function(welt, f, e, dt){
    if(f.weg) return;
    if(dt > 0.05){ var n = Math.ceil(dt / 0.05); for(var i = 0; i < n; i++) F.schritt(welt, f, e, dt / n); return; }
    var d = SC.FAHRZEUGE[f.art], P = welt.planet.groesse;
    var gas = e ? (e.vor ? 1 : 0) - (e.zurueck ? 1 : 0) : 0, lenk = e ? (e.links ? 1 : 0) - (e.rechts ? 1 : 0) : 0;
    if(gas) f.tempo = Math.max(-d.tempo * 0.4, Math.min(d.tempo, f.tempo + gas * d.beschl * dt));
    else { f.tempo *= Math.max(0, 1 - 2.5 * dt); if(Math.abs(f.tempo) < 0.2) f.tempo = 0; }
    if(lenk && Math.abs(f.tempo) > 1) f.blick += lenk * d.lenk * dt * (f.tempo < 0 ? -1 : 1);
    f.geschw[0] = -Math.sin(f.blick) * f.tempo; f.geschw[2] = -Math.cos(f.blick) * f.tempo;
    // Senkrecht: Flieger steigt/sinkt nach Eingabe (ohne Fahrer sinkt er), Gleiter schwebt, Buggy fällt
    var ziel = null;
    if(d.fliegt) f.geschw[1] = e ? ((e.hoch ? 1 : 0) - (e.runter ? 1 : 0)) * d.steigen : -d.sinken;
    else if(d.schwebt){
      ziel = boden(welt, f.pos) + d.schwebt;
      if(f.pos[1] > ziel + 0.01) f.geschw[1] -= F.SCHWERKRAFT * dt; else f.geschw[1] = Math.min(8, (ziel - f.pos[1]) * 10);
    } else f.geschw[1] -= F.SCHWERKRAFT * dt;
    // Gegen eine Wand verliert das Fahrzeug Tempo
    var gx = waagerecht(welt, f, d, 0, f.geschw[0] * dt), gz = waagerecht(welt, f, d, 2, f.geschw[2] * dt);
    if(gx || gz) f.tempo *= Math.max(0, 1 - 6 * dt);
    var vy = f.geschw[1];
    if(SC.bewegeKoerper(welt, f.pos, 1, vy * dt, d.breite, d.hoehe)){ f.aufBoden = vy < 0; f.geschw[1] = 0; }
    else f.aufBoden = false;
    if(ziel !== null && f.pos[1] <= ziel + 0.01 && vy <= 0){ if(f.pos[1] < ziel) f.pos[1] = ziel; f.geschw[1] = 0; f.aufBoden = true; }
    if(d.maxHoehe && f.pos[1] > d.maxHoehe){ f.pos[1] = d.maxHoehe; if(f.geschw[1] > 0) f.geschw[1] = 0; }
    f.pos[0] = SC.mod(f.pos[0], P); f.pos[2] = SC.mod(f.pos[2], P);
  };
})();
