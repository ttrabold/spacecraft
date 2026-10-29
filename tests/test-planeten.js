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
