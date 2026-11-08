// Planeten (Stufe 5): Tabelle mit Name, Palette, Landschaft, Gegnern, Bossen und Stufenaufschlag.
// Weitere Planeten sind später nur weitere Einträge. Die Landschaftsregeln stehen in js/landschaft.js.
SC.PLANETEN = {
  start: { palette: "start", stufenBonus: 0,
    gegner: { station: ["patrouillendroide", "flatterdroide", "schildwaechter", "reparaturdroide"], lager: ["weltraumbandit", "spaeher", "flatterdroide", "reparaturdroide"], herrenhaus: ["weltraumbandit", "patrouillendroide", "schildwaechter", "spaeher"], dungeon: ["krabbler", "spucker", "funkenling"], nacht: ["krabbler", "spucker", "funkenling"] },
    boss: { herrenhaus: ["schattenritter"], dungeon: ["schattenritter", "panzerkoloss"] } },
  glutfrost: { palette: "glutfrost", stufenBonus: 8,
    gegner: { station: ["frostkrabbler", "patrouillendroide", "schneewerfer", "glutflatterer"], lager: ["lavagolem", "weltraumbandit", "eisrutscher", "schneewerfer"], herrenhaus: ["lavagolem", "frostkrabbler", "frostgolem"], dungeon: ["lavagolem", "frostkrabbler", "frostgolem", "eisrutscher", "glutfunke"], nacht: ["frostkrabbler", "lavagolem", "eisrutscher", "glutfunke", "glutflatterer"] },
    boss: { herrenhaus: ["magmakoenig"], dungeon: ["magmakoenig"] } },
  rankenmoor: { palette: "rankenmoor", stufenBonus: 15,
    gegner: { station: ["sumpfspucker", "patrouillendroide", "moosmutter"], lager: ["rankenschleicher", "weltraumbandit", "dornenbock", "pilzling"], herrenhaus: ["rankenschleicher", "sumpfspucker", "lianenwuerger", "moosmutter"], dungeon: ["rankenschleicher", "sumpfspucker", "lianenwuerger", "moorirrlicht"], nacht: ["rankenschleicher", "sumpfspucker", "moorirrlicht", "pilzling", "dornenbock"] },
    boss: { herrenhaus: ["sumpfkoloss"], dungeon: ["sumpfkoloss"] } }
};
SC.PLANET_REIHENFOLGE = ["start", "glutfrost", "rankenmoor"];
(function(){ for(var id in SC.PLANETEN){ SC.PLANETEN[id].id = id; SC.PLANETEN[id].landschaft = id; SC.PLANETEN[id].name = SC.T.planeten[id]; } })();
SC.Planeten = {
  // Landepunkt des aktuellen Planeten: eigener Punkt je Planet, sonst (Heimatplanet, Gastwelt) der Startpunkt der Welt
  landepunkt: function(daten){ var pl = daten.planeten[daten.aktuellerPlanet]; return (pl && pl.landepunkt) || daten.startpunkt; },
  def: function(planet){ return SC.PLANETEN[planet.landschaft] || SC.PLANETEN.start; },
  // Planetendaten im Spielstand anlegen, falls es sie noch nicht gibt (Seed aus dem Welt-Seed) → planetDaten
  anlegen: function(daten, id){
    var p = daten.planeten[id];
    if(p) return p;
    return daten.planeten[id] = { id: id, seed: SC.hashText(daten.seed + ":" + id), groesse: 2048, palette: SC.PLANETEN[id].palette, generatorVersion: SC.GENERATOR_VERSION,
      chunks: {}, kisten: {}, geraeumt: {}, fahrzeuge: {}, landepunkt: null, wetter: null, wetterSpuren: [] };
  }
};
