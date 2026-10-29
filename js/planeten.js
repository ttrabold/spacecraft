// Planeten (Stufe 5): Tabelle mit Name, Palette, Landschaft, Gegnern, Bossen und Stufenaufschlag.
// Weitere Planeten sind später nur weitere Einträge. Die Landschaftsregeln stehen in js/landschaft.js.
SC.PLANETEN = {
  start: { palette: "start", stufenBonus: 0,
    gegner: { station: ["patrouillendroide"], lager: ["weltraumbandit"], herrenhaus: ["weltraumbandit", "patrouillendroide"], dungeon: ["krabbler", "spucker"], nacht: ["krabbler", "spucker"] },
    boss: { herrenhaus: ["schattenritter"], dungeon: ["schattenritter", "panzerkoloss"] } },
  glutfrost: { palette: "glutfrost", stufenBonus: 8,
    gegner: { station: ["frostkrabbler", "patrouillendroide"], lager: ["lavagolem", "weltraumbandit"], herrenhaus: ["lavagolem", "frostkrabbler"], dungeon: ["lavagolem", "frostkrabbler"], nacht: ["frostkrabbler", "lavagolem"] },
    boss: { herrenhaus: ["magmakoenig"], dungeon: ["magmakoenig"] } },
  rankenmoor: { palette: "rankenmoor", stufenBonus: 15,
    gegner: { station: ["sumpfspucker", "patrouillendroide"], lager: ["rankenschleicher", "weltraumbandit"], herrenhaus: ["rankenschleicher", "sumpfspucker"], dungeon: ["rankenschleicher", "sumpfspucker"], nacht: ["rankenschleicher", "sumpfspucker"] },
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
      chunks: {}, kisten: {}, geraeumt: {}, fahrzeuge: {}, landepunkt: null };
  }
};
