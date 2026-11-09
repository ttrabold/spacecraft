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
      leucht_gruen: ["#6bffb0", "#3fe08e", "#e0fff0"], beton: ["#9a9a96", "#85857f", "#adada8"],
      kiste_oben: ["#8a5a2b", "#c9a23a", "#ffd95c"], kiste_seite: ["#8a5a2b", "#c9a23a", "#ffd95c"], kiste_offen: ["#5a3a1b", "#c9a23a", "#2a1a0b"],
      lava: ["#ff6a1a", "#c43a0a", "#ffd04a"], eis: ["#bfe6ff", "#94c9ee", "#ecf8ff"], schlamm: ["#5a4a32", "#433625", "#6e5c40"], basalt: ["#3a3638", "#28252a", "#4d484b"],
      // Stufe 6a: [Grund, dunkel, hell]; bei Erzen ist „hell“ die Erzfarbe auf grauem Stein
      eisenerz: ["#8c8f96", "#6f727a", "#d9946a"], titan: ["#8c8f96", "#6f727a", "#bfe3ff"], glutstahl: ["#6d6470", "#4a3f4c", "#ff5a2a"],
      moorsilber: ["#6a7062", "#545a4e", "#7fffc0"], sternenmetall: ["#4a4560", "#332f46", "#d9a0ff"],
      kristall_blau: ["#3fa0ff", "#1f6fd0", "#c8e4ff"], kristall_gruen: ["#3fe06a", "#1fb04a", "#c8ffd8"], kristall_rot: ["#ff4a4a", "#c22a2a", "#ffc8c8"],
      kristall_gelb: ["#ffe14a", "#d0b21f", "#fff4b8"], kristall_violett: ["#b46bff", "#8a3fd0", "#e6ccff"], kristall_weiss: ["#f4f4ff", "#c8c8e0", "#ffffff"],
      lagerfeuer_aus: ["#8a6a3a", "#5a4023", "#9a9a9a"], lagerfeuer_an: ["#8a6a3a", "#5a4023", "#ff8a2a"], kamin_oben: ["#8a8a92", "#5a5a62", "#aaaab2"], kamin_aus: ["#9a6a4a", "#5a3a2a", "#aaaaaa"], kamin_an: ["#9a6a4a", "#5a3a2a", "#ff8a2a"], feuerzeug: ["#c8c8d0", "#6a6a72", "#e8e8f0"],
      kessel_oben: ["#4fbf5a", "#2a2f36", "#b8f0a0"], kessel_seite: ["#3a4048", "#6a7480", "#22262c"], flasche: ["#bfe0f0", "#6a8fa8", "#ffffff"], trank: ["#b46bff", "#6a8fa8", "#ffffff"],
      pflanze_hasenklee: ["#5fbf4f", "#3a8f3a", "#ffffff"], pflanze_katzenminze: ["#6fa86f", "#4a7a4a", "#b48cff"], pflanze_fuchsgras: ["#c8a24a", "#8a6a22", "#ff9a4a"], pflanze_eisblume: ["#9fd8ef", "#6fb0cf", "#ffffff"], pflanze_frostbeere: ["#4a9a8a", "#2a6a5a", "#6fb0ff"],
      pflanze_glutmohn: ["#7a3a2a", "#4a2218", "#ff5a2a"], pflanze_federfarn: ["#2faa5a", "#1a7a3a", "#ff4a7a"], pflanze_quakblume: ["#3faa6a", "#2a7a4a", "#ffe14a"], pflanze_dschungelranke: ["#2a8a3a", "#1a5a26", "#b0ff5a"],
      schaltkreis: ["#2f8a5a", "#1f5c3c", "#ffd24a"], chitin: ["#8a6a3a", "#5c4423", "#c9a468"], netz: ["#7a8a4c", "#4a5a2c", "#e0e8b0"], tierfutter: ["#c8884a", "#8a5a2a", "#6fbf4f"], eimer: ["#a9b4bf", "#5f6a75", "#3a4048"], eimer_wasser: ["#a9b4bf", "#5f6a75", "#3f8fe0"], eimer_lava: ["#a9b4bf", "#5f6a75", "#ff7a1f"],
      werkbank_oben: ["#b88a52", "#6b4a2b", "#d9d9d9"], werkbank_seite: ["#946c3c", "#5c3f20", "#b9c2cc"],
      fackel: ["#8a5a2b", "#ff8a1a", "#ffe27a"], zaun: ["#a87a44", "#6b4a2b", "#c9a060"], leiter: ["#a07a4c", "#6b4a2b", "#b88f5d"],
      tuer: ["#a87a44", "#5c3f20", "#ffd95c"], tuer_oben: ["#a87a44", "#5c3f20", "#9fd6f5"], zauber_tisch_oben: ["#3a2a6a", "#241848", "#7a5ad8"], zauber_tisch: ["#3a2a6a", "#241848", "#9a7af0"], zauber_kugel: ["#7a5ad8", "#4a2ab0", "#e6d8ff"], bett_fuss_oben: ["#d8443c", "#b5342e", "#ea5d55"], bett_kopf_oben: ["#d8443c", "#b5342e", "#f4f4ff"], bett_seite: ["#8a5a33", "#5c3f20", "#d8443c"], truhe_oben: ["#9a6a35", "#5a3a1b", "#c9a060"], truhe_seite: ["#9a6a35", "#5a3a1b", "#c9a060"]
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
  // Stufe 5a: Glutfrost (Feuer und Eis) und Rankenmoor (Dschungel und Sumpf)
  function palette(id, t, himmel, sonne, mond, monde){ var p = JSON.parse(JSON.stringify(SC.PALETTEN.start)); p.id = id; for(var k in t) p.texturen[k] = t[k]; p.himmel = himmel; p.sonne = sonne; p.mond = mond; p.monde = monde; return p; }
  SC.PALETTEN.glutfrost = palette("glutfrost", {
    gras_oben: ["#dfeefa", "#c4d9ea", "#f4fbff"], gras_seite: ["#5b5560", "#dfeefa", "#46414a"], erde: ["#5b5560", "#46414a", "#6e6873"],
    stein: ["#6d7380", "#565c68", "#868c98"], sand: ["#8a8a92", "#74747c", "#a0a0a8"], kies: ["#4a464c", "#36333a", "#5e5a60"],
    schnee_oben: ["#f6fbff", "#dce9f6", "#ffffff"], schnee_seite: ["#5b5560", "#f6fbff", "#46414a"], wasser: ["#6fb6e8", "#4f97cc", "#9fd2f5"],
    stamm_seite: ["#3d3438", "#2b2428", "#4f454a"], stamm_oben: ["#5a4c50", "#3d3438", "#6e5f63"], blaetter: ["#9fd8ef", "#7cbcd6", "#c4ecfa"],
    kristall: ["#ff8a3c", "#d45a14", "#ffd0a0"], leuchtpilz: ["#ffb35a", "#e0802a", "#ffe0b0"],
    lava: ["#ff6a1a", "#c43a0a", "#ffd04a"], eis: ["#a9dcff", "#7fc0ef", "#e2f4ff"], basalt: ["#2e2a2e", "#1e1b1f", "#423c41"]
  }, { tag: ["#8fc4e8", "#e8d8d0"], daemmerung: ["#3a2a5a", "#ff8a4a"], nacht: ["#0a0820", "#3a1a2a"] }, "#ffd2a0", "#cfe6ff", 1);
  SC.PALETTEN.rankenmoor = palette("rankenmoor", {
    gras_oben: ["#3f8f2a", "#2f7020", "#55aa38"], gras_seite: ["#4a3a22", "#3f8f2a", "#3a2c18"], erde: ["#4a3a22", "#3a2c18", "#5c4a2e"],
    stein: ["#6a7062", "#545a4e", "#808676"], sand: ["#9a8c5c", "#82744a", "#b0a26e"], kies: ["#6a6452", "#524c3c", "#7e7864"],
    wasser: ["#4a6a3a", "#3a5a2c", "#5e8048"], stamm_seite: ["#4a3a26", "#36291a", "#5e4a32"], stamm_oben: ["#7a6040", "#4a3a26", "#8e7450"],
    blaetter: ["#2e8a2a", "#1f6a1e", "#46aa3c"], kristall: ["#b0ff5a", "#7ad42a", "#e0ffb0"], leuchtpilz: ["#c8ff4a", "#90d420", "#ecffb0"],
    schlamm: ["#4e4028", "#3a2f1c", "#5f4f33"]
  }, { tag: ["#8fd0b0", "#d8f0c8"], daemmerung: ["#2a3a3a", "#e0b060"], nacht: ["#061410", "#1a3326"] }, "#f0ffb0", "#c8ffd8", 2);
})();

SC.Planet = function(o){
  this.id = o.id; this.seed = o.seed >>> 0;
  this.groesse = o.groesse || 2048; this.hoehe = o.hoehe || 128;
  this.palette = o.palette || "start"; this.generatorVersion = o.generatorVersion || 1;
  this.landschaft = o.landschaft || (SC.PLANETEN && SC.PLANETEN[o.id] ? o.id : "start"); // Regeln für Landschaft, Gegner und Bosse (js/planeten.js)
  this.chunksProSeite = this.groesse / 16;
};
SC.Planet.prototype.wickel = function(x){ return SC.mod(Math.floor(x), this.groesse); };
SC.Planet.prototype.chunkSchluessel = function(cx, cz){ return SC.mod(cx, this.chunksProSeite) + "," + SC.mod(cz, this.chunksProSeite); };
