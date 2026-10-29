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
  // Laub hält Fahrzeuge nicht auf (sonst hinge man im Wald ständig fest); es bleibt dabei stehen
  var DURCH = {}; DURCH[SC.B.BLAETTER] = true; F.DURCH = DURCH;

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
    if(!SC.bewegeKoerper(welt, f.pos, achse, weg, d.breite, d.hoehe, DURCH)) return false;
    if(d.stufe && (f.aufBoden || d.schwebt)){
      var q = f.pos.slice();
      if(!SC.bewegeKoerper(welt, q, 1, d.stufe, d.breite, d.hoehe, DURCH) && !SC.bewegeKoerper(welt, q, achse, weg, d.breite, d.hoehe, DURCH)){ f.pos = q; return false; }
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
    if(SC.bewegeKoerper(welt, f.pos, 1, vy * dt, d.breite, d.hoehe, DURCH)){ f.aufBoden = vy < 0; f.geschw[1] = 0; }
    else f.aufBoden = false;
    if(ziel !== null && f.pos[1] <= ziel + 0.01 && vy <= 0){ if(f.pos[1] < ziel) f.pos[1] = ziel; f.geschw[1] = 0; f.aufBoden = true; }
    if(d.maxHoehe && f.pos[1] > d.maxHoehe){ f.pos[1] = d.maxHoehe; if(f.geschw[1] > 0) f.geschw[1] = 0; }
    f.pos[0] = SC.mod(f.pos[0], P); f.pos[2] = SC.mod(f.pos[2], P);
  };

  // --- Sitze: 0 = Fahrer, 1–3 Mitfahrer; ein freier Fahrersitz wird nie automatisch nachbesetzt ---
  // → Sitznummer oder -1 (voll); wer schon drin ist, behält seinen Sitz
  F.einsteigen = function(f, id){
    var i = f.sitze.indexOf(id); if(i >= 0) return i;
    if(f.weg) return -1;
    if(f.sitze[0] === null){ f.sitze[0] = id; return 0; }
    for(i = 1; i < f.sitze.length; i++) if(f.sitze[i] === null){ f.sitze[i] = id; return i; }
    return -1;
  };
  F.aussteigen = function(f, id){ var i = f.sitze.indexOf(id); if(i < 0) return false; f.sitze[i] = null; return true; };
  F.sitzVon = function(welt, id){ var r = null; welt.fahrzeuge.forEach(function(f){ var i = f.sitze.indexOf(id); if(i >= 0 && !r) r = { f: f, sitz: i }; }); return r; };
  // Lokalen Versatz [x, y, z] mit blick drehen → Weltposition
  function dreh(f, o, P){
    var c = Math.cos(f.blick), s = Math.sin(f.blick);
    return [SC.mod(f.pos[0] + o[0] * c + o[2] * s, P), f.pos[1] + o[1], SC.mod(f.pos[2] - o[0] * s + o[2] * c, P)];
  }
  F.dreh = dreh;
  F.sitzPos = function(f, sitz, P){ return dreh(f, SC.FAHRZEUGE[f.art].sitze[sitz], P); };
  // Waagerechter Abstand (Ring) von pos zur Grundfläche, dazu der senkrechte Abstand zum Fahrzeugkörper
  function abstand(welt, f, pos){
    var P = welt.planet.groesse, d = SC.FAHRZEUGE[f.art], hb = d.breite / 2;
    var dx = Math.max(0, Math.abs(SC.mod(pos[0] - f.pos[0] + P / 2, P) - P / 2) - hb), dz = Math.max(0, Math.abs(SC.mod(pos[2] - f.pos[2] + P / 2, P) - P / 2) - hb);
    var dy = pos[1] < f.pos[1] - SC.PHYSIK.hoehe ? f.pos[1] - SC.PHYSIK.hoehe - pos[1] : pos[1] > f.pos[1] + d.hoehe ? pos[1] - f.pos[1] - d.hoehe : 0;
    return { waagerecht: Math.hypot(dx, dz), senkrecht: dy };
  }
  F.abstand = abstand;
  F.naechstes = function(welt, pos, reichweite){
    var r = reichweite === undefined ? 3.5 : reichweite, best = null, bd = Infinity;
    welt.fahrzeuge.forEach(function(f){ if(f.weg) return; var a = abstand(welt, f, pos); if(a.senkrecht <= 1.5 && a.waagerecht <= r && a.waagerecht < bd){ bd = a.waagerecht; best = f; } });
    return best;
  };
  // Passt ein Körper (Standard: Spieler) an p, ohne einen festen Block zu schneiden? Geprüft wird jede Blockspalte der Grundfläche.
  function frei(welt, p, breite, hoehe){
    var hb = (breite || SC.PHYSIK.breite) / 2 - 0.01, h = hoehe || SC.PHYSIK.hoehe;
    for(var x = Math.floor(p[0] - hb); x <= Math.floor(p[0] + hb); x++) for(var z = Math.floor(p[2] - hb); z <= Math.floor(p[2] + hb); z++)
      for(var y = Math.floor(p[1]); y <= Math.floor(p[1] + h - 0.01); y++){ var b = SC.BLOECKE[welt.holeBlock(x, y, z)]; if(b && b.fest) return false; }
    return true;
  }
  F.frei = frei;
  // Freier Platz zum Aussteigen: neben dem Sitz, dann im Umkreis bis 3 Blöcke um das Fahrzeug (je auf Fahrzeug- und eine Blockhöhe darüber),
  // sonst obenauf (notfalls höher)
  F.aussteigePos = function(welt, f, sitz){
    var d = SC.FAHRZEUGE[f.art], P = welt.planet.groesse, o = d.sitze[sitz] || d.sitze[0], hb = d.breite / 2, kand = [];
    kand.push([(o[0] < 0 ? -1 : 1) * (hb + 0.45), 0, o[2]], [(o[0] < 0 ? 1 : -1) * (hb + 0.45), 0, o[2]]);
    for(var r = hb + 0.45; r <= hb + 3; r += 0.75) for(var k = 0; k < 16; k++){ var a = k / 16 * Math.PI * 2; kand.push([Math.sin(a) * r, 0, Math.cos(a) * r]); }
    for(var i = 0; i < kand.length; i++) for(var h = 0; h <= 1; h++){
      var p = dreh(f, kand[i], P); p[1] = h ? Math.floor(f.pos[1]) + 1 : f.pos[1];
      if(frei(welt, p)) return p;
    }
    var oben = [f.pos[0], f.pos[1] + d.hoehe, f.pos[2]];
    for(var n = 0; n < 12 && !frei(welt, oben); n++) oben[1] += 1;
    return oben;
  };

  // --- Fundorte: Lager → Buggy, Station → Flieger, Herrenhaus → Gleiter, dazu "start" (Gleiter beim Startpunkt) ---
  // Die ID eines Fundort-Fahrzeugs ist der Fundort-Schlüssel; es wird nie gelöscht, darum liefert jeder Fundort genau einmal.
  F.FUNDORT_ART = { lager: "buggy", station: "flieger", herrenhaus: "gleiter" };
  // Freie Stelle für Fahrzeug art: Spalten in festen Ringen um (x, z) (Abstand rMin..rMax), Boden fest und trocken, Körper frei
  function freieStelle(welt, x, z, art, rMin, rMax){
    var d = SC.FAHRZEUGE[art], P = welt.planet.groesse;
    for(var r = rMin; r <= rMax; r++) for(var k = 0, n = r ? 16 : 1; k < n; k++){
      var a = k / n * Math.PI * 2, px = SC.mod(Math.floor(x + Math.sin(a) * r), P) + 0.5, pz = SC.mod(Math.floor(z + Math.cos(a) * r), P) + 0.5, y = SC.CHUNK.H - 2;
      while(y > 1 && !SC.BLOECKE[welt.holeBlock(px, y - 1, pz)].fest && welt.holeBlock(px, y - 1, pz) !== SC.B.WASSER) y--;
      if(welt.holeBlock(px, y - 1, pz) === SC.B.WASSER) continue;
      var p = [px, y + (d.schwebt || 0), pz];
      if(frei(welt, p, d.breite, d.hoehe)) return p;
    }
    return null;
  }
  F.freieStelle = freieStelle;
  F.fundortPos = function(welt, b){
    var art = F.FUNDORT_ART[b.typ];
    return freieStelle(welt, b.x + b.breite + 2 + SC.FAHRZEUGE[art].breite / 2, b.z + (b.tiefe >> 1), art, 0, 8);
  };
  F.startPos = function(welt, startpunkt){ return freieStelle(welt, startpunkt[0], startpunkt[2], "gleiter", 6, 10); };
  // Fundort-Fahrzeuge der Bauwerke im Umkreis r (Ringabstand zur Bauwerksmitte) anlegen, sofern es sie noch nicht gibt
  F.fundorteNah = function(welt, pos, r){
    r = r || 96;
    var pl = welt.planet, P = pl.groesse, rx = Math.floor(pos[0] / 128), rz = Math.floor(pos[2] / 128);
    for(var i = -1; i <= 1; i++) for(var j = -1; j <= 1; j++) SC.Bauwerke.inRegion(pl, rx + i, rz + j).forEach(function(b){
      var art = F.FUNDORT_ART[b.typ];
      if(!art || welt.fahrzeuge.has(b.schluessel)) return;
      var dx = SC.mod(b.x + b.breite / 2 - pos[0] + P / 2, P) - P / 2, dz = SC.mod(b.z + b.tiefe / 2 - pos[2] + P / 2, P) - P / 2;
      if(Math.hypot(dx, dz) > r) return;
      var p = F.fundortPos(welt, b);
      if(p) F.neu(welt, art, p, 0, { id: b.schluessel, fundort: b.schluessel, heim: p });
    });
  };
  F.sichereStart = function(welt, startpunkt){
    if(welt.fahrzeuge.has("start") || !startpunkt) return;
    var p = F.startPos(welt, startpunkt);
    if(p) F.neu(welt, "gleiter", p, 0, { id: "start", fundort: "start", heim: p });
  };
  // Verpuffte Fundort-Fahrzeuge kommen zur Zeit wiederBei (Spielzeit) mit voller Panzerung an den Fundort zurück
  F.wiederkehr = function(welt, spielzeit){
    welt.fahrzeuge.forEach(function(f){
      if(!f.weg || f.wiederBei === null || spielzeit < f.wiederBei || !f.heim) return;
      f.pos = f.heim.slice(); f.blick = 0; f.geschw = [0, 0, 0]; f.tempo = 0; f.panzerung = SC.FAHRZEUGE[f.art].panzerung;
      f.weg = false; f.wiederBei = null; f.sitze = [null, null, null, null];
    });
  };

  // Unbesetztes Fundort-Fahrzeug sofort an den Fundort zurück (auch ein verpufftes)
  F.heimholen = function(f){ if(f.heim && f.sitze.every(function(x){ return x === null; })){ f.wiederBei = 0; f.weg = true; F.wiederkehr({ fahrzeuge: new Map([[f.id, f]]) }, 0); } };
  // Erstes Fahrzeug auf dem Strahl a + r·t (t ≤ reichweite) → { f, t } oder null
  F.anvisiert = function(welt, a, r, reichweite){
    var P = welt.planet.groesse, b = [a[0] + r[0] * reichweite, a[1] + r[1] * reichweite, a[2] + r[2] * reichweite], best = null;
    welt.fahrzeuge.forEach(function(f){
      if(f.weg) return;
      var d = SC.FAHRZEUGE[f.art], p = [a[0] + SC.mod(f.pos[0] - a[0] + P / 2, P) - P / 2, f.pos[1], a[2] + SC.mod(f.pos[2] - a[2] + P / 2, P) - P / 2], t = SC.Wesen.strecke(a, b, p, d.breite, d.hoehe);
      if(t >= 0 && (!best || t < best.t)) best = { f: f, t: t * reichweite };
    });
    return best;
  };

  // --- Kampf: Panzerung, Verpuffen, Erholung, Rammen ---
  F.WIEDERKEHR = 120; F.ERHOLUNG = 4; F.ERHOLUNG_NACH = 8;
  // Schaden aufs Fahrzeug. Bei 0 steigen alle aus; ein Fundort-Fahrzeug wartet F.WIEDERKEHR s auf die Rückkehr, ein freies ist weg.
  // → { verpufft, ausgestiegen: [IDs] }
  F.schaden = function(welt, f, menge, spielzeit){
    var r = { verpufft: false, ausgestiegen: [] };
    if(f.weg || !(menge > 0)) return r;
    f.panzerung = Math.max(0, f.panzerung - menge); f.zuletztGetroffen = spielzeit;
    if(f.panzerung > 0) return r;
    r.verpufft = true; r.ausgestiegen = f.sitze.filter(function(id){ return id !== null; });
    f.sitze = [null, null, null, null]; f.tempo = 0; f.geschw = [0, 0, 0];
    if(f.fundort){ f.weg = true; f.wiederBei = spielzeit + F.WIEDERKEHR; } else welt.fahrzeuge.delete(f.id);
    return r;
  };
  F.erholung = function(f, dt, spielzeit){
    var max = SC.FAHRZEUGE[f.art].panzerung;
    if(f.weg || f.panzerung >= max || spielzeit - (f.zuletztGetroffen === undefined ? -Infinity : f.zuletztGetroffen) < F.ERHOLUNG_NACH) return;
    f.panzerung = Math.min(max, f.panzerung + F.ERHOLUNG * dt);
  };
  // Gegner an der Grundfläche ab Tempo 4: Schaden round(tempo * 1.5), Schub in Fahrtrichtung, je Gegner höchstens alle 0,5 s (zeit in s).
  // Ein Boss bleibt stehen und das Fahrzeug prallt mit halbem Tempo zurück. → [{ gegner, schaden, boss }]
  F.rammen = function(welt, f, zeit){
    var v = Math.abs(f.tempo), aus = [];
    if(f.weg || v < 4) return aus;
    var d = SC.FAHRZEUGE[f.art], P = welt.planet.groesse, m = f._gerammt || (f._gerammt = {}), rx = -Math.sin(f.blick) * Math.sign(f.tempo), rz = -Math.cos(f.blick) * Math.sign(f.tempo);
    welt.wesen.forEach(function(g){
      if(g.art !== "gegner" || aus.some(function(a){ return a.boss; })) return;
      var gr = d.breite / 2 + (g.breite || 0.8) / 2 + 0.3;
      if(Math.abs(SC.mod(g.pos[0] - f.pos[0] + P / 2, P) - P / 2) > gr || Math.abs(SC.mod(g.pos[2] - f.pos[2] + P / 2, P) - P / 2) > gr) return;
      if(g.pos[1] > f.pos[1] + d.hoehe || g.pos[1] + (g.hoehe || 1.8) < f.pos[1]) return;
      if(m[g.id] !== undefined && zeit < m[g.id]) return;
      m[g.id] = zeit + 0.5;
      if(g.boss){ f.tempo = -f.tempo * 0.5; aus.push({ gegner: g, schaden: 0, boss: true }); return; }
      g.geschw[0] += rx * 5; g.geschw[2] += rz * 5; g.geschw[1] = Math.max(g.geschw[1], 4);
      aus.push({ gegner: g, schaden: Math.round(v * 1.5), boss: false });
    });
    return aus;
  };

  // --- Speichern: je Planet { id: {art, pos, blick, panzerung, fundort, heim, weg, wiederBei} }, ohne Sitze und Tempo ---
  F.inDaten = function(welt){
    var o = {};
    welt.fahrzeuge.forEach(function(f, id){ o[id] = { art: f.art, pos: f.pos.slice(), blick: f.blick, panzerung: f.panzerung, fundort: f.fundort, heim: f.heim ? f.heim.slice() : null, weg: !!f.weg, wiederBei: f.wiederBei }; });
    return o;
  };
  F.ausDaten = function(welt, o){
    for(var id in o || {}){
      var e = o[id]; if(!e || !SC.FAHRZEUGE[e.art] || !Array.isArray(e.pos)) continue;
      var f = F.neu(welt, e.art, e.pos, +e.blick || 0, { id: id, fundort: e.fundort, heim: e.heim });
      if(typeof e.panzerung === "number") f.panzerung = e.panzerung;
      f.weg = !!e.weg; f.wiederBei = typeof e.wiederBei === "number" ? e.wiederBei : null;
    }
  };
})();
