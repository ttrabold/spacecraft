// Blocktabelle. IDs nie umnummerieren: Spielstände speichern die Zahlen.
SC.B = {
  LUFT: 0, GRUNDGESTEIN: 1, STEIN: 2, ERDE: 3, GRAS: 4, SAND: 5, KIES: 6, SCHNEE: 7, WASSER: 8,
  STAMM: 9, BLAETTER: 10, KRISTALL: 11, LEUCHTPILZ: 12, BRETTER: 13, STEINZIEGEL: 14, GLAS: 15,
  WOLLE_ROT: 16, WOLLE_BLAU: 17, WOLLE_GELB: 18, WOLLE_WEISS: 19, METALL: 20, METALLGITTER: 21,
  TECHNIK: 22, LEUCHT_CYAN: 23, LEUCHT_PINK: 24, LEUCHT_GRUEN: 25, BETON: 26, KISTE: 27, KISTE_OFFEN: 28,
  LAVA: 29, EIS: 30, SCHLAMM: 31, BASALT: 32,                      // Stufe 5a: neue Planeten
  // Stufe 6a (Crafting): Erze, Kristalle, Gegnerteile, Werkbank, Bauteile (Zustände wie offen/zu und Richtung stecken in eigenen IDs)
  EISENERZ: 33, TITAN: 34, GLUTSTAHL: 35, MOORSILBER: 36, STERNENMETALL: 37,
  KRISTALL_BLAU: 38, KRISTALL_GRUEN: 39, KRISTALL_ROT: 40, KRISTALL_GELB: 41, KRISTALL_VIOLETT: 42, KRISTALL_WEISS: 43,
  SCHALTKREIS: 44, CHITIN: 45, WERKBANK: 46, FACKEL: 47, ZAUN: 48,
  LEITER_N: 49, LEITER_S: 50, LEITER_O: 51, LEITER_W: 52, TUER_X: 53, TUER_Z: 54, TUER_X_OFFEN: 55, TUER_Z_OFFEN: 56, TRUHE: 57,
  TUER_X_OBEN: 58, TUER_Z_OBEN: 59, TUER_X_OFFEN_OBEN: 60, TUER_Z_OFFEN_OBEN: 61,   // obere Türhälften (die Tür ist zwei Blöcke hoch)
  // Betten: Fuß und Kopf je Richtung; N/S/O/W sagt, auf welcher Seite des Fußes der Kopf liegt (Norden = z−1)
  BETT_FUSS_N: 62, BETT_FUSS_S: 63, BETT_FUSS_O: 64, BETT_FUSS_W: 65, BETT_KOPF_N: 66, BETT_KOPF_S: 67, BETT_KOPF_O: 68, BETT_KOPF_W: 69
};

// Muster je Textur (Farben kommen aus der Palette des Planeten)
SC.TEXTUREN = {
  gras_oben: "rauschen", gras_seite: "grasrand", erde: "rauschen", stein: "stein", grundgestein: "stein",
  sand: "rauschen", kies: "kies", schnee_oben: "rauschen", schnee_seite: "schneerand", wasser: "wellen",
  stamm_seite: "rinde", stamm_oben: "ringe", blaetter: "blaetter", kristall: "kristall", leuchtpilz: "pilz",
  bretter: "bretter", steinziegel: "ziegel", glas: "glas", wolle_rot: "wolle", wolle_blau: "wolle",
  wolle_gelb: "wolle", wolle_weiss: "wolle", metall: "platte", metallgitter: "gitter", technik: "technik",
  leucht_cyan: "leucht", leucht_pink: "leucht", leucht_gruen: "leucht", beton: "beton",
  kiste_oben: "kistedeckel", kiste_seite: "kiste", kiste_offen: "kisteoffen",
  lava: "lava", eis: "eis", schlamm: "schlamm", basalt: "basalt",
  eisenerz: "erz", titan: "erz", glutstahl: "erz", moorsilber: "erz", sternenmetall: "erz",
  kristall_blau: "kristall", kristall_gruen: "kristall", kristall_rot: "kristall", kristall_gelb: "kristall", kristall_violett: "kristall", kristall_weiss: "kristall",
  schaltkreis: "schaltkreis", chitin: "chitin", werkbank_oben: "werkbankoben", werkbank_seite: "werkbankseite",
  fackel: "fackel", zaun: "zaun", leiter: "leiter", tuer: "tuer", tuer_oben: "tueroben", bett_fuss_oben: "bettfuss", bett_kopf_oben: "bettkopf", bett_seite: "bettseite", truhe_oben: "kistedeckel", truhe_seite: "kiste"
};

SC.BLOECKE = {};
(function(){
  function alle(t){ return { oben: t, seite: t, unten: t }; }
  var BETT = { typ: "kasten", a: [0, 0, 0], b: [1, 0.56, 1] };
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
    [SC.B.BETON, "beton", alle("beton"), true, false, 0, null, true, true],
    [SC.B.KISTE, "kiste", { oben: "kiste_oben", seite: "kiste_seite", unten: "kiste_seite" }, true, false, 6, [1.0, 0.8, 0.35], false, false],
    [SC.B.KISTE_OFFEN, "kisteOffen", { oben: "kiste_offen", seite: "kiste_seite", unten: "kiste_seite" }, true, false, 0, null, false, false],
    [SC.B.LAVA, "lava", alle("lava"), false, true, 15, [1.0, 0.5, 0.15], false, true],
    [SC.B.EIS, "eis", alle("eis"), true, true, 0, null, true, true],
    [SC.B.SCHLAMM, "schlamm", alle("schlamm"), true, false, 0, null, true, true],
    [SC.B.BASALT, "basalt", alle("basalt"), true, false, 0, null, true, true],
    // Stufe 6a: [..., { form, klettern }] – form: "kreuz" | "pfosten" | { typ: "platte", achse, versatz } (Standard Würfel)
    [SC.B.EISENERZ, "eisenerz", alle("eisenerz"), true, false, 0, null, true, true],
    [SC.B.TITAN, "titan", alle("titan"), true, false, 0, null, true, true],
    [SC.B.GLUTSTAHL, "glutstahl", alle("glutstahl"), true, false, 3, [1.0, 0.45, 0.15], true, true],
    [SC.B.MOORSILBER, "moorsilber", alle("moorsilber"), true, false, 3, [0.5, 1.0, 0.75], true, true],
    [SC.B.STERNENMETALL, "sternenmetall", alle("sternenmetall"), true, false, 5, [0.75, 0.55, 1.0], true, true],
    [SC.B.KRISTALL_BLAU, "kristallBlau", alle("kristall_blau"), true, false, 10, [0.25, 0.63, 1.0], true, true],
    [SC.B.KRISTALL_GRUEN, "kristallGruen", alle("kristall_gruen"), true, false, 10, [0.25, 0.88, 0.42], true, true],
    [SC.B.KRISTALL_ROT, "kristallRot", alle("kristall_rot"), true, false, 10, [1.0, 0.29, 0.29], true, true],
    [SC.B.KRISTALL_GELB, "kristallGelb", alle("kristall_gelb"), true, false, 10, [1.0, 0.88, 0.29], true, true],
    [SC.B.KRISTALL_VIOLETT, "kristallViolett", alle("kristall_violett"), true, false, 10, [0.71, 0.42, 1.0], true, true],
    [SC.B.KRISTALL_WEISS, "kristallWeiss", alle("kristall_weiss"), true, false, 12, [0.96, 0.96, 1.0], true, true],
    [SC.B.SCHALTKREIS, "schaltkreis", alle("schaltkreis"), true, false, 0, null, true, true],
    [SC.B.CHITIN, "chitin", alle("chitin"), true, false, 0, null, true, true],
    [SC.B.WERKBANK, "werkbank", { oben: "werkbank_oben", seite: "werkbank_seite", unten: "werkbank_seite" }, true, false, 0, null, true, true],
    [SC.B.FACKEL, "fackel", alle("fackel"), false, true, 14, [1.0, 0.7, 0.3], true, true, { form: "kreuz" }],
    [SC.B.ZAUN, "zaun", alle("zaun"), true, true, 0, null, true, true, { form: "pfosten" }],
    [SC.B.LEITER_N, "leiter", alle("leiter"), false, true, 0, null, true, true, { form: { typ: "platte", achse: "z", versatz: 0 }, klettern: true }],
    [SC.B.LEITER_S, "leiter", alle("leiter"), false, true, 0, null, true, false, { form: { typ: "platte", achse: "z", versatz: 1 }, klettern: true }],
    [SC.B.LEITER_O, "leiter", alle("leiter"), false, true, 0, null, true, false, { form: { typ: "platte", achse: "x", versatz: 1 }, klettern: true }],
    [SC.B.LEITER_W, "leiter", alle("leiter"), false, true, 0, null, true, false, { form: { typ: "platte", achse: "x", versatz: 0 }, klettern: true }],
    [SC.B.TUER_X, "tuer", alle("tuer"), true, true, 0, null, true, true, { form: { typ: "platte", achse: "x", versatz: 0.5 } }],
    [SC.B.TUER_Z, "tuer", alle("tuer"), true, true, 0, null, true, false, { form: { typ: "platte", achse: "z", versatz: 0.5 } }],
    [SC.B.TUER_X_OFFEN, "tuer", alle("tuer"), false, true, 0, null, true, false, { form: { typ: "platte", achse: "z", versatz: 0 } }],
    [SC.B.TUER_Z_OFFEN, "tuer", alle("tuer"), false, true, 0, null, true, false, { form: { typ: "platte", achse: "x", versatz: 0 } }],
    [SC.B.TUER_X_OBEN, "tuer", alle("tuer_oben"), true, true, 0, null, true, false, { form: { typ: "platte", achse: "x", versatz: 0.5 } }],
    [SC.B.TUER_Z_OBEN, "tuer", alle("tuer_oben"), true, true, 0, null, true, false, { form: { typ: "platte", achse: "z", versatz: 0.5 } }],
    [SC.B.TUER_X_OFFEN_OBEN, "tuer", alle("tuer_oben"), false, true, 0, null, true, false, { form: { typ: "platte", achse: "z", versatz: 0 } }],
    [SC.B.TUER_Z_OFFEN_OBEN, "tuer", alle("tuer_oben"), false, true, 0, null, true, false, { form: { typ: "platte", achse: "x", versatz: 0 } }],
    // Betten: flacher Kasten, begehbar; nur das Fußende Nord steht in der Kreativ-Auswahl
    [SC.B.BETT_FUSS_N, "bett", { oben: "bett_fuss_oben", seite: "bett_seite", unten: "bretter" }, false, true, 0, null, true, true, { form: BETT }],
    [SC.B.BETT_FUSS_S, "bett", { oben: "bett_fuss_oben", seite: "bett_seite", unten: "bretter" }, false, true, 0, null, true, false, { form: BETT }],
    [SC.B.BETT_FUSS_O, "bett", { oben: "bett_fuss_oben", seite: "bett_seite", unten: "bretter" }, false, true, 0, null, true, false, { form: BETT }],
    [SC.B.BETT_FUSS_W, "bett", { oben: "bett_fuss_oben", seite: "bett_seite", unten: "bretter" }, false, true, 0, null, true, false, { form: BETT }],
    [SC.B.BETT_KOPF_N, "bett", { oben: "bett_kopf_oben", seite: "bett_seite", unten: "bretter" }, false, true, 0, null, true, false, { form: BETT }],
    [SC.B.BETT_KOPF_S, "bett", { oben: "bett_kopf_oben", seite: "bett_seite", unten: "bretter" }, false, true, 0, null, true, false, { form: BETT }],
    [SC.B.BETT_KOPF_O, "bett", { oben: "bett_kopf_oben", seite: "bett_seite", unten: "bretter" }, false, true, 0, null, true, false, { form: BETT }],
    [SC.B.BETT_KOPF_W, "bett", { oben: "bett_kopf_oben", seite: "bett_seite", unten: "bretter" }, false, true, 0, null, true, false, { form: BETT }],
    [SC.B.TRUHE, "truhe", { oben: "truhe_oben", seite: "truhe_seite", unten: "truhe_seite" }, true, false, 0, null, true, true]
  ];
  D.forEach(function(d){
    var b = SC.BLOECKE[d[0]] = { id: d[0], name: SC.T.bloecke[d[1]], seiten: d[2], fest: d[3], durchsichtig: d[4], leuchten: d[5], lichtFarbe: d[6], zerstoerbar: d[7], inAuswahl: d[8], form: "wuerfel", klettern: false };
    if(d[9]) for(var k in d[9]) b[k] = d[9][k];
  });
})();

// Kristallfarben für Laserschwerter und Blaster (Stufe 6a): Schlüssel → Block und Farbe der Klinge/des Strahls
SC.CRAFTING_KRISTALLE = {
  blau: { block: SC.B.KRISTALL_BLAU, farbe: "#3fa0ff" }, gruen: { block: SC.B.KRISTALL_GRUEN, farbe: "#3fe06a" },
  rot: { block: SC.B.KRISTALL_ROT, farbe: "#ff4a4a" }, gelb: { block: SC.B.KRISTALL_GELB, farbe: "#ffe14a" },
  violett: { block: SC.B.KRISTALL_VIOLETT, farbe: "#b46bff" }, weiss: { block: SC.B.KRISTALL_WEISS, farbe: "#f4f4ff" }
};
