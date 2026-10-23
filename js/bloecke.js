// Blocktabelle. IDs nie umnummerieren: Spielstände speichern die Zahlen.
SC.B = {
  LUFT: 0, GRUNDGESTEIN: 1, STEIN: 2, ERDE: 3, GRAS: 4, SAND: 5, KIES: 6, SCHNEE: 7, WASSER: 8,
  STAMM: 9, BLAETTER: 10, KRISTALL: 11, LEUCHTPILZ: 12, BRETTER: 13, STEINZIEGEL: 14, GLAS: 15,
  WOLLE_ROT: 16, WOLLE_BLAU: 17, WOLLE_GELB: 18, WOLLE_WEISS: 19, METALL: 20, METALLGITTER: 21,
  TECHNIK: 22, LEUCHT_CYAN: 23, LEUCHT_PINK: 24, LEUCHT_GRUEN: 25, BETON: 26
};

// Muster je Textur (Farben kommen aus der Palette des Planeten)
SC.TEXTUREN = {
  gras_oben: "rauschen", gras_seite: "grasrand", erde: "rauschen", stein: "stein", grundgestein: "stein",
  sand: "rauschen", kies: "kies", schnee_oben: "rauschen", schnee_seite: "schneerand", wasser: "wellen",
  stamm_seite: "rinde", stamm_oben: "ringe", blaetter: "blaetter", kristall: "kristall", leuchtpilz: "pilz",
  bretter: "bretter", steinziegel: "ziegel", glas: "glas", wolle_rot: "wolle", wolle_blau: "wolle",
  wolle_gelb: "wolle", wolle_weiss: "wolle", metall: "platte", metallgitter: "gitter", technik: "technik",
  leucht_cyan: "leucht", leucht_pink: "leucht", leucht_gruen: "leucht", beton: "beton"
};

SC.BLOECKE = {};
(function(){
  function alle(t){ return { oben: t, seite: t, unten: t }; }
  // [id, Textname, Seiten, fest, durchsichtig, leuchten, Lichtfarbe, zerstörbar, in Auswahl]
  var D = [
    [SC.B.LUFT, "luft", null, false, true, 0, null, false, false],
    [SC.B.GRUNDGESTEIN, "grundgestein", alle("grundgestein"), true, false, 0, null, false, false],
    [SC.B.STEIN, "stein", alle("stein"), true, false, 0, null, true, true],
    [SC.B.ERDE, "erde", alle("erde"), true, false, 0, null, true, true],
    [SC.B.GRAS, "gras", { oben: "gras_oben", seite: "gras_seite", unten: "erde" }, true, false, 0, null, true, true],
    [SC.B.SAND, "sand", alle("sand"), true, false, 0, null, true, true],
    [SC.B.KIES, "kies", alle("kies"), true, false, 0, null, true, true],
    [SC.B.SCHNEE, "schnee", { oben: "schnee_oben", seite: "schnee_seite", unten: "erde" }, true, false, 0, null, true, true],
    [SC.B.WASSER, "wasser", alle("wasser"), false, true, 0, null, false, true],
    [SC.B.STAMM, "stamm", { oben: "stamm_oben", seite: "stamm_seite", unten: "stamm_oben" }, true, false, 0, null, true, true],
    [SC.B.BLAETTER, "blaetter", alle("blaetter"), true, true, 0, null, true, true],
    [SC.B.KRISTALL, "kristall", alle("kristall"), true, false, 12, [1.0, 0.45, 0.85], true, true],
    [SC.B.LEUCHTPILZ, "leuchtpilz", alle("leuchtpilz"), true, true, 10, [0.4, 0.95, 1.0], true, true],
    [SC.B.BRETTER, "bretter", alle("bretter"), true, false, 0, null, true, true],
    [SC.B.STEINZIEGEL, "steinziegel", alle("steinziegel"), true, false, 0, null, true, true],
    [SC.B.GLAS, "glas", alle("glas"), true, true, 0, null, true, true],
    [SC.B.WOLLE_ROT, "wolleRot", alle("wolle_rot"), true, false, 0, null, true, true],
    [SC.B.WOLLE_BLAU, "wolleBlau", alle("wolle_blau"), true, false, 0, null, true, true],
    [SC.B.WOLLE_GELB, "wolleGelb", alle("wolle_gelb"), true, false, 0, null, true, true],
    [SC.B.WOLLE_WEISS, "wolleWeiss", alle("wolle_weiss"), true, false, 0, null, true, true],
    [SC.B.METALL, "metall", alle("metall"), true, false, 0, null, true, true],
    [SC.B.METALLGITTER, "metallgitter", alle("metallgitter"), true, true, 0, null, true, true],
    [SC.B.TECHNIK, "technik", alle("technik"), true, false, 8, [0.3, 0.8, 1.0], true, true],
    [SC.B.LEUCHT_CYAN, "leuchtCyan", alle("leucht_cyan"), true, false, 15, [0.35, 0.95, 1.0], true, true],
    [SC.B.LEUCHT_PINK, "leuchtPink", alle("leucht_pink"), true, false, 15, [1.0, 0.4, 0.85], true, true],
    [SC.B.LEUCHT_GRUEN, "leuchtGruen", alle("leucht_gruen"), true, false, 15, [0.4, 1.0, 0.65], true, true],
    [SC.B.BETON, "beton", alle("beton"), true, false, 0, null, true, true]
  ];
  D.forEach(function(d){
    SC.BLOECKE[d[0]] = { id: d[0], name: SC.T.bloecke[d[1]], seiten: d[2], fest: d[3], durchsichtig: d[4], leuchten: d[5], lichtFarbe: d[6], zerstoerbar: d[7], inAuswahl: d[8] };
  });
})();
