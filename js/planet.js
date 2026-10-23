// Planet: Seed, Größe, Palette; die Oberfläche schlägt in x und z um (Torus)
SC.PALETTEN = {};
(function(){
  // Farben je Textur: [Grundfarbe, dunkel, hell]
  SC.PALETTEN.start = {
    id: "start",
    texturen: {
      gras_oben: ["#5cb83a", "#4a9a2e", "#6fd048"], gras_seite: ["#8a5a33", "#5cb83a", "#6e4526"], erde: ["#8a5a33", "#6e4526", "#a06b3f"],
      stein: ["#8c8f96", "#6f727a", "#a3a6ad"], grundgestein: ["#3e3f45", "#2a2b30", "#55565c"], sand: ["#e3cf8a", "#cdb56e", "#f0de9e"],
      kies: ["#8a8580", "#6b6661", "#a8a39d"], schnee_oben: ["#f4f8ff", "#dce6f5", "#ffffff"], schnee_seite: ["#8a5a33", "#f4f8ff", "#6e4526"],
      wasser: ["#2f7fd8", "#2566b5", "#4a98ee"], stamm_seite: ["#6b4a2b", "#523720", "#82603d"], stamm_oben: ["#a07a4c", "#6b4a2b", "#b88f5d"],
      blaetter: ["#3f9a35", "#2f7a28", "#56b84a"], kristall: ["#ff6fd8", "#d43aa9", "#ffd0f3"], leuchtpilz: ["#5fe8ff", "#2fb8d4", "#c0f6ff"],
      bretter: ["#b88a52", "#946c3c", "#cc9f66"], steinziegel: ["#7f8189", "#5e6068", "#979aa2"], glas: ["#c8ecff", "#9fd6f5", "#ffffff"],
      wolle_rot: ["#d8443c", "#b5342e", "#ea5d55"], wolle_blau: ["#3a6fd8", "#2b55b0", "#5385ea"], wolle_gelb: ["#f2c53d", "#d9a91f", "#ffd95c"],
      wolle_weiss: ["#e9edf2", "#cfd5dd", "#ffffff"], metall: ["#b9c2cc", "#8a95a1", "#d6dde5"], metallgitter: ["#9aa4b0", "#6f7985", "#c0c8d2"],
      technik: ["#5a6470", "#454e58", "#33c4ff"], leucht_cyan: ["#5ff4ff", "#3ad0e8", "#e0fdff"], leucht_pink: ["#ff6fd8", "#e04cb8", "#ffe0f6"],
      leucht_gruen: ["#6bffb0", "#3fe08e", "#e0fff0"], beton: ["#9a9a96", "#85857f", "#adada8"]
    },
    himmel: { tag: ["#7ec8ff", "#cfeaff"], daemmerung: ["#3b3a7a", "#ffb37a"], nacht: ["#070b24", "#1b2a55"] },
    sonne: "#fff6b0", mond: "#e6ecff", monde: 1
  };
  // Fremder Planet: gleiche Muster, andere Farben (für Stufe 5, hier schon zum Testen)
  var f = JSON.parse(JSON.stringify(SC.PALETTEN.start));
  f.id = "fremd";
  f.texturen.gras_oben = ["#7a4fc0", "#6440a3", "#9468dc"]; f.texturen.gras_seite = ["#2f8f8a", "#7a4fc0", "#257570"];
  f.texturen.erde = ["#2f8f8a", "#257570", "#3aa8a2"]; f.texturen.stein = ["#4b6b80", "#3a5568", "#5f8399"];
  f.texturen.sand = ["#e0a8d8", "#c98cc0", "#f0c4ea"]; f.texturen.blaetter = ["#3fd4c0", "#2bb0a0", "#6af0de"];
  f.texturen.stamm_seite = ["#4a3a6b", "#382b52", "#5c4a82"]; f.texturen.wasser = ["#6a3ad8", "#5528b5", "#8a5cee"];
  f.himmel = { tag: ["#2a1d5e", "#b0508a"], daemmerung: ["#2a1d5e", "#ffb37a"], nacht: ["#0e0b2e", "#3b1d5e"] };
  f.sonne = "#ff9a5c"; f.mond = "#9ad7ff"; f.monde = 2;
  SC.PALETTEN.fremd = f;
})();

SC.Planet = function(o){
  this.id = o.id; this.seed = o.seed >>> 0;
  this.groesse = o.groesse || 2048; this.hoehe = o.hoehe || 128;
  this.palette = o.palette || "start"; this.generatorVersion = o.generatorVersion || 1;
  this.chunksProSeite = this.groesse / 16;
};
SC.Planet.prototype.wickel = function(x){ return SC.mod(Math.floor(x), this.groesse); };
SC.Planet.prototype.chunkSchluessel = function(cx, cz){ return SC.mod(cx, this.chunksProSeite) + "," + SC.mod(cz, this.chunksProSeite); };
