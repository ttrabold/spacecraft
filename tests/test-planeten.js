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
