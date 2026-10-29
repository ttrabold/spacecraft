// Stufe 5a: neue Planeten
function plPruef(c){ var h = 2166136261; for(var i = 0; i < c.length; i++){ h ^= c[i]; h = Math.imul(h, 16777619) >>> 0; } return h; }
test("Startplanet: Chunks und Bauwerke unverändert", function(){
  var p = new SC.Planet({ id: "start", seed: 1234, generatorVersion: 2 }), g = new SC.Generator(p);
  gleich(plPruef(g.chunk(0, 0)), 4113621621); gleich(plPruef(g.chunk(5, 7)), 4105641303); gleich(plPruef(g.chunk(64, 100)), 3441392342); gleich(plPruef(g.chunk(127, 3)), 2523961076);
  var bw = []; for(var rx = 0; rx < 3; rx++) SC.Bauwerke.inRegion(p, rx, 1).forEach(function(b){ bw.push([b.typ, b.x, b.y, b.z, b.stufe, b.bossArt].join(":")); });
  gleich(bw.join(" "), "herrenhaus:93:53:164:14:schattenritter dungeon:68:23:138:25:panzerkoloss herrenhaus:170:51:180:18:schattenritter dungeon:165:20:225:21:schattenritter herrenhaus:302:49:144:15:schattenritter dungeon:270:17:187:24:panzerkoloss");
  gleich(p.landschaft, "start");
});
test("Planetentabelle: drei Planeten mit Namen, Palette, Gegnern und Bossen", function(){
  gleich(SC.PLANET_REIHENFOLGE.join(","), "start,glutfrost,rankenmoor");
  SC.PLANET_REIHENFOLGE.forEach(function(id){
    var d = SC.PLANETEN[id]; wahr(d && d.name && d.name.length > 3, "Name " + id); gleich(d.id, id);
    var pal = SC.PALETTEN[d.palette]; wahr(pal, "Palette " + id); SC.Mesher.atlasNamen.forEach(function(n){ wahr(pal.texturen[n] && pal.texturen[n].length === 3, id + ": Textur " + n); });
    ["station", "lager", "herrenhaus", "dungeon", "nacht"].forEach(function(o){ wahr(d.gegner[o] && d.gegner[o].length, id + ": Gegner " + o); });
    ["herrenhaus", "dungeon"].forEach(function(o){ wahr(d.boss[o], id + ": Boss " + o); });
  });
  gleich(SC.PLANETEN.start.name, "Heimatplanet"); gleich(SC.PLANETEN.glutfrost.name, "Glutfrost"); gleich(SC.PLANETEN.rankenmoor.name, "Rankenmoor");
  gleich(SC.PLANETEN.start.stufenBonus, 0); gleich(SC.PLANETEN.glutfrost.stufenBonus, 8); gleich(SC.PLANETEN.rankenmoor.stufenBonus, 15);
  gleich(new SC.Planet({ id: "glutfrost", seed: 5 }).landschaft, "glutfrost"); gleich(SC.Planeten.def(new SC.Planet({ id: "rankenmoor", seed: 5 })), SC.PLANETEN.rankenmoor);
});
test("Planet anlegen ist idempotent, Startplanet bleibt", function(){
  var d = SC.Spielstand.neu({ name: "A", seedText: "welt" }); var vorher = JSON.stringify(d.planeten.start); delete d.planeten.glutfrost;
  var p = SC.Planeten.anlegen(d, "glutfrost"); gleich(p.seed, SC.hashText("welt:glutfrost")); gleich(p.palette, "glutfrost"); gleich(p.groesse, 2048); gleich(p.landepunkt, null);
  gleich(JSON.stringify(p.chunks), "{}"); gleich(JSON.stringify(p.fahrzeuge), "{}"); wahr(SC.Planeten.anlegen(d, "glutfrost") === p, "zweites Anlegen gleich");
  gleich(JSON.stringify(d.planeten.start), vorher); gleich(d.aktuellerPlanet, "start");
});
test("Neue Blöcke haben feste IDs und Eigenschaften", function(){
  gleich(SC.B.LAVA, 29); gleich(SC.B.EIS, 30); gleich(SC.B.SCHLAMM, 31); gleich(SC.B.BASALT, 32);
  var l = SC.BLOECKE[SC.B.LAVA]; gleich(l.fest, false); gleich(l.leuchten, 15); wahr(l.name.length > 2);
  wahr(SC.BLOECKE[SC.B.EIS].fest && SC.BLOECKE[SC.B.EIS].durchsichtig, "Eis fest und durchsichtig"); wahr(SC.BLOECKE[SC.B.SCHLAMM].fest); wahr(SC.BLOECKE[SC.B.BASALT].fest);
});

// --- Landschaften ---
function plZaehle(planet, ids, n){ var g = new SC.Generator(planet), z = {}; ids.forEach(function(i){ z[i] = 0; }); for(var i = 0; i < n; i++) for(var j = 0; j < n; j++){ var c = g.chunk(i * 31, j * 29); for(var k = 0; k < c.length; k++) if(z[c[k]] !== undefined) z[c[k]]++; } return z; }
test("Glutfrost: deterministisch, hat Eis, Lava und Basalt", function(){
  var a = new SC.Planet({ id: "glutfrost", seed: 777 }), b = new SC.Planet({ id: "glutfrost", seed: 777 });
  gleich(plPruef(new SC.Generator(a).chunk(3, 9)), plPruef(new SC.Generator(b).chunk(3, 9)));
  var z = plZaehle(a, [SC.B.GRAS], 3); gleich(z[SC.B.GRAS], 0, "kein Gras");
  // je Landschaft eine Stelle suchen und dort den erwarteten Block im Chunk finden
  var g = new SC.Generator(a);
  [["lavasee", SC.B.LAVA], ["vulkan", SC.B.BASALT], ["eisfeld", SC.B.EIS]].forEach(function(e){
    var ort = null; for(var x = 0; x < 2048 && !ort; x += 32) for(var zz = 0; zz < 2048 && !ort; zz += 32) if(g.biom(x, zz) === e[0] && g.hoehe(x, zz) < 46 + (e[0] === "lavasee" ? 0 : 80)) ort = [x, zz];
    wahr(ort, "Landschaft " + e[0] + " vorhanden"); var c = g.chunk(ort[0] >> 4, ort[1] >> 4), n = 0; for(var k = 0; k < c.length; k++) if(c[k] === e[1]) n++; wahr(n > 0, e[0] + ": Block " + e[1]);
  });
});
test("Rankenmoor: deterministisch, hat Schlamm, Wasser und hohe Bäume", function(){
  var a = new SC.Planet({ id: "rankenmoor", seed: 778 }), g = new SC.Generator(a);
  gleich(plPruef(g.chunk(4, 4)), plPruef(new SC.Generator(new SC.Planet({ id: "rankenmoor", seed: 778 })).chunk(4, 4)));
  var z = plZaehle(a, [SC.B.SCHLAMM, SC.B.WASSER, SC.B.LAVA], 4); wahr(z[SC.B.SCHLAMM] > 0, "Schlamm"); wahr(z[SC.B.WASSER] > 0, "Wasser"); gleich(z[SC.B.LAVA], 0);
  var hoch = 0; for(var i = 0; i < 3 && !hoch; i++) for(var j = 0; j < 3 && !hoch; j++){ var c = g.chunk(i * 7, j * 7); for(var x = 0; x < 16; x++) for(var zz = 0; zz < 16; zz++){ var n = 0; for(var y = 0; y < SC.CHUNK.H; y++){ if(c[SC.idx(x, y, zz)] === SC.B.STAMM){ if(++n >= 10) hoch = 1; } else n = 0; } } }
  wahr(hoch, "Stamm mit mindestens 10 Blöcken");
});
test("Landepunkt ist sicher", function(){
  ["glutfrost", "rankenmoor"].forEach(function(id){ [1, 2, 3].forEach(function(seed){
    var p = new SC.Planet({ id: id, seed: seed * 1000 + 7 }), w = new SC.Welt(p), lp = SC.Spiel.startpunkt(p), x = Math.floor(lp[0]), y = Math.floor(lp[1]), z = Math.floor(lp[2]);
    var unter = w.holeBlock(x, y - 1, z); wahr(SC.BLOECKE[unter].fest && unter !== SC.B.LAVA && unter !== SC.B.SCHLAMM, id + "/" + seed + ": Boden " + unter);
    wahr(!SC.BLOECKE[w.holeBlock(x, y, z)].fest && !SC.BLOECKE[w.holeBlock(x, y + 1, z)].fest, id + "/" + seed + ": frei");
    for(var dx = -2; dx <= 2; dx++) for(var dz = -2; dz <= 2; dz++) for(var dy = -1; dy <= 1; dy++){ var b = w.holeBlock(x + dx, y + dy, z + dz); wahr(b !== SC.B.LAVA && b !== SC.B.WASSER, id + "/" + seed + ": keine Flüssigkeit nah"); }
  }); });
});

// --- Lava, Eis, Schlamm ---
// Spieler mit Kampf in einer Testwelt (fzWelt aus test-fahrzeuge.js: Stein bis y = 59)
function plSpieler(w, modus, pos){ var sp = new SC.Spieler({ id: "ich", pos: pos, modus: modus || "survival" }), d = SC.Spielstand.neu({ name: "L", modus: modus || "survival" }); var k = new SC.Kampf(w, sp, d, SC.zufall(1)); return { sp: sp, k: k }; }
function plLauf(w, s, e, sek, t0){ var t = t0 || 0; for(var i = 0; i < Math.round(sek * 60); i++){ t += 1000 / 60; s.sp.schritt(w, e || {}, 1 / 60); s.k.uhr = t; if(s.sp.imLava) s.k.lava(1 / 60); } return t; }
function plLavaBecken(w, r){ for(var x = 20 - r; x <= 20 + r; x++) for(var z = 20 - r; z <= 20 + r; z++) for(var y = 56; y < 60; y++) w.setze(x, y, z, SC.B.LAVA); }
test("Lava stößt nach oben heraus, ans Ufer", function(){
  var w = fzWelt(); plLavaBecken(w, 2); var s = plSpieler(w, "survival", [20.5, 56.2, 20.5]), lp = s.k.werte.lp;
  plLauf(w, s, {}, 3);
  wahr(!s.sp.imLava, "draußen"); wahr(s.sp.pos[1] >= 59.9, "oben: " + s.sp.pos[1]); wahr(lp - s.k.werte.lp <= 36 && s.k.werte.lp > 0, "Schaden begrenzt: " + (lp - s.k.werte.lp));
  // großer Lavasee ohne nahes Ufer: wird ans Ufer gesetzt
  var w2 = fzWelt(); plLavaBecken(w2, 20); var s2 = plSpieler(w2, "survival", [20.5, 57, 20.5]); plLauf(w2, s2, {}, 3); wahr(!s2.sp.imLava, "aus dem großen See gerettet"); wahr(s2.k.werte.lp > 0);
  // Kreativ: kein Schaden
  var w3 = fzWelt(); plLavaBecken(w3, 2); var s3 = plSpieler(w3, "kreativ", [20.5, 57, 20.5]), lp3 = s3.k.werte.lp; plLauf(w3, s3, {}, 2); gleich(s3.k.werte.lp, lp3);
});
test("Eis rutscht nach, Schlamm bremst", function(){
  function strecke(boden, laufen, gleiten){
    var w = fzWelt(); if(boden !== null) for(var x = 0; x < 80; x++) for(var z = 0; z < 40; z++) w.setze(x, 59, z, boden);
    var s = plSpieler(w, "survival", [10.5, 60, 20.5]); s.sp.blick = [-Math.PI / 2, 0]; // Blick nach +x
    plLauf(w, s, { vor: true }, laufen); var x0 = s.sp.pos[0]; plLauf(w, s, {}, gleiten); return { lauf: x0 - 10.5, nach: s.sp.pos[0] - x0 };
  }
  var stein = strecke(null, 0.5, 0.3), eis = strecke(SC.B.EIS, 0.5, 0.3), schlamm = strecke(SC.B.SCHLAMM, 1, 0);
  wahr(eis.nach > 0.7, "Eis rutscht nach: " + eis.nach); wahr(stein.nach < 0.1, "Stein hält: " + stein.nach);
  var st1 = strecke(null, 1, 0); wahr(Math.abs(schlamm.lauf / st1.lauf - 0.6) < 0.06, "Schlamm ~0,6: " + (schlamm.lauf / st1.lauf));
});
test("Gleiter schwebt über Lava, Buggy nimmt Schaden", function(){
  var w = fzWelt(); for(var x = 0; x < 60; x++) for(var z = 0; z < 60; z++) for(var y = 55; y < 60; y++) w.setze(x, y, z, SC.B.LAVA);
  var g = SC.Fahrzeug.neu(w, "gleiter", [20, 63, 20], 0); fzLauf(w, g, {}, 3); wahr(g.pos[1] >= 60.5, "schwebt: " + g.pos[1]);
  var b = SC.Fahrzeug.neu(w, "buggy", [30, 63, 30], 0); fzLauf(w, b, {}, 3); wahr(SC.Fahrzeug.inLava(w, b), "Buggy steckt in Lava"); wahr(!SC.Fahrzeug.inLava(w, g), "Gleiter nicht");
});

// --- Gegner und Bosse ---
test("Neue Gegner haben Modelle mit Leuchtteilen und Texte", function(){
  ["lavagolem", "frostkrabbler", "magmakoenig", "rankenschleicher", "sumpfspucker", "sumpfkoloss"].forEach(function(a){
    var d = SC.GEGNER[a]; wahr(d && d.modell.length >= 6, a); wahr(d.modell.some(function(t){ return t.leuchtet; }), a + " leuchtet"); wahr(SC.T.gegner[a], a + " Name"); gleich(typeof d.lp, "function");
  });
  wahr(SC.GEGNER.magmakoenig.boss && SC.GEGNER.sumpfkoloss.boss, "Bosse"); gleich(SC.T.gegner.magmakoenig, "Magmakönig");
  SC.PLANET_REIHENFOLGE.forEach(function(id){ var d = SC.PLANETEN[id]; for(var o in d.gegner) d.gegner[o].forEach(function(a){ wahr(SC.GEGNER[a], id + ": " + a); }); for(var b in d.boss) d.boss[b].forEach(function(a){ wahr(SC.GEGNER[a] && SC.GEGNER[a].boss, id + ": Boss " + a); }); });
});
test("Bauwerke auf Glutfrost haben Magmakönig, Stufen mit Aufschlag", function(){
  var p = new SC.Planet({ id: "glutfrost", seed: 99 }), n = 0;
  for(var rx = 0; rx < 4; rx++) for(var rz = 0; rz < 2; rz++) SC.Bauwerke.inRegion(p, rx, rz).forEach(function(b){
    if(b.bossArt) gleich(b.bossArt, "magmakoenig"); n++;
    wahr(b.stufe >= Math.min(SC.Werte.MAX_STUFE, SC.ORTSSTUFE[b.typ][0] + 8), b.typ + " Stufe " + b.stufe); wahr(b.stufe <= SC.Werte.MAX_STUFE);
  });
  wahr(n > 4, "Bauwerke vorhanden");
});
