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
  // Wasser und Lava fließen (Spec 2026-11-08): Fließstufen und fallendes Wasser/Lava; WASSER (8) und LAVA (29) bleiben die Quellen
  WASSER_1: 73, WASSER_2: 74, WASSER_3: 75, WASSER_4: 76, WASSER_5: 77, WASSER_6: 78, WASSER_7: 79, WASSER_FALL: 80, LAVA_1: 81, LAVA_2: 82, LAVA_3: 83, LAVA_FALL: 84,
  EIMER: 85, EIMER_WASSER: 86, EIMER_LAVA: 87,
  SCHNEESCHICHT: 88,   // Wetter: dünne Schneedecke, taut wieder   // Eimer (leer, mit Wasser, mit Lava): Gegenstände, nicht aufstellbar
  // Zaubertränke (Spec 2026-11-09): Kessel, Flasche, Trank (Gegenstand mit Variante im Rucksackplatz) und neun Pflanzen
  KESSEL: 89, FLASCHE: 90, TRANK: 91, HASENKLEE: 92, KATZENMINZE: 93, FUCHSGRAS: 94, EISBLUME: 95, FROSTBEERE: 96, GLUTMOHN: 97, FEDERFARN: 98, QUAKBLUME: 99, DSCHUNGELRANKE: 100,
  // Lagerfeuer und Kamin (Spec 2026-11-09-feuer): je aus und an, dazu das Feuerzeug
  LAGERFEUER: 101, LAGERFEUER_AN: 102, KAMIN: 103, KAMIN_AN: 104, FEUERZEUG: 105,
  SPIEGEL_N: 106, SPIEGEL_S: 107, SPIEGEL_O: 108, SPIEGEL_W: 109, SPIEGEL_N_OBEN: 110, SPIEGEL_S_OBEN: 111, SPIEGEL_O_OBEN: 112, SPIEGEL_W_OBEN: 113,   // Spiegel: Wandrichtung wie die Leiter, zwei Blöcke hoch wie die Tür
  NETZ: 71, TIERFUTTER: 72, ZAUBERKUGEL: 70, BETT_FUSS_N: 62, BETT_FUSS_S: 63, BETT_FUSS_O: 64, BETT_FUSS_W: 65, BETT_KOPF_N: 66, BETT_KOPF_S: 67, BETT_KOPF_O: 68, BETT_KOPF_W: 69
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
  schaltkreis: "schaltkreis", chitin: "chitin", netz: "netz", tierfutter: "tierfutter", eimer: "eimer", eimer_wasser: "eimer", eimer_lava: "eimer", werkbank_oben: "werkbankoben", werkbank_seite: "werkbankseite",
  fackel: "fackel", zaun: "zaun", leiter: "leiter", tuer: "tuer", tuer_oben: "tueroben", spiegel_unten: "spiegelunten", spiegel_oben: "spiegeloben", zauber_tisch_oben: "zaubertisch", zauber_tisch: "zaubertischseite", zauber_kugel: "zauberkugel", bett_fuss_oben: "bettfuss", bett_kopf_oben: "bettkopf", bett_seite: "bettseite", truhe_oben: "kistedeckel", truhe_seite: "kiste",
  lagerfeuer_aus: "holzstoss", lagerfeuer_an: "holzstossfeuer", kamin_oben: "kaminoben", kamin_aus: "kaminloch", kamin_an: "kaminfeuer", feuerzeug: "feuerzeug",
  kessel_oben: "kesseloben", kessel_seite: "kesselseite", flasche: "flasche", trank: "trank",
  pflanze_hasenklee: "kraut", pflanze_katzenminze: "kraut", pflanze_fuchsgras: "kraut", pflanze_eisblume: "kraut", pflanze_frostbeere: "kraut", pflanze_glutmohn: "kraut", pflanze_federfarn: "kraut", pflanze_quakblume: "kraut", pflanze_dschungelranke: "kraut"
};

SC.BLOECKE = {};
(function(){
  function alle(t){ return { oben: t, seite: t, unten: t }; }
  // Bett: flacher Kasten; drehOben legt die Deckenkachel so, dass ihr unterer Rand (Fuß offen, Kopf geschlossen) zum Kopf zeigt –
  // ungedreht zeigt er nach Süden (+z), 1 = Westen, 2 = Norden, 3 = Osten
  function bett(dreh){ return { typ: "kasten", a: [0, 0, 0], b: [1, 0.56, 1], drehOben: dreh }; }
  var BETT = { N: bett(2), S: bett(0), O: bett(3), W: bett(1) };
  // Zauberkugel: Tisch (Platte mit Rand, vier Beine) und eine Kristallkugel aus Kästen darauf; t = Kachel aus seiten, o = andere Kachel für die Oberseite
  var ZAUBER = { typ: "mehrteilig", teile: [
    { a: [0.02, 0.7, 0.02], b: [0.98, 0.82, 0.98], t: "seite", o: "oben" },
    { a: [0.08, 0, 0.08], b: [0.2, 0.7, 0.2], t: "seite" }, { a: [0.8, 0, 0.08], b: [0.92, 0.7, 0.2], t: "seite" },
    { a: [0.08, 0, 0.8], b: [0.2, 0.7, 0.92], t: "seite" }, { a: [0.8, 0, 0.8], b: [0.92, 0.7, 0.92], t: "seite" },
    { a: [0.36, 0.82, 0.36], b: [0.64, 0.9, 0.64], t: "seite" },
    { a: [0.3, 0.9, 0.3], b: [0.7, 1.26, 0.7], t: "kugel", leuchtet: true }, { a: [0.37, 1.26, 0.37], b: [0.63, 1.32, 0.63], t: "kugel", leuchtet: true }
  ] };
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
    [SC.B.BLAETTER, "blaetter", alle("blaetter"), true, true, 0, null, true, true, { ausschnitt: true }],
    [SC.B.KRISTALL, "kristall", alle("kristall"), true, false, 12, [1.0, 0.45, 0.85], true, true],
    // Pflanze: gekreuzte Flächen, durchgehbar wie in Minecraft (Issue #17)
    [SC.B.LEUCHTPILZ, "leuchtpilz", alle("leuchtpilz"), false, true, 10, [0.4, 0.95, 1.0], true, true, { form: "pflanze" }],
    [SC.B.BRETTER, "bretter", alle("bretter"), true, false, 0, null, true, true],
    [SC.B.STEINZIEGEL, "steinziegel", alle("steinziegel"), true, false, 0, null, true, true],
    [SC.B.GLAS, "glas", alle("glas"), true, true, 0, null, true, true],
    [SC.B.WOLLE_ROT, "wolleRot", alle("wolle_rot"), true, false, 0, null, true, true],
    [SC.B.WOLLE_BLAU, "wolleBlau", alle("wolle_blau"), true, false, 0, null, true, true],
    [SC.B.WOLLE_GELB, "wolleGelb", alle("wolle_gelb"), true, false, 0, null, true, true],
    [SC.B.WOLLE_WEISS, "wolleWeiss", alle("wolle_weiss"), true, false, 0, null, true, true],
    [SC.B.METALL, "metall", alle("metall"), true, false, 0, null, true, true],
    [SC.B.METALLGITTER, "metallgitter", alle("metallgitter"), true, true, 0, null, true, true, { ausschnitt: true }],
    [SC.B.TECHNIK, "technik", alle("technik"), true, false, 8, [0.3, 0.8, 1.0], true, true],
    [SC.B.LEUCHT_CYAN, "leuchtCyan", alle("leucht_cyan"), true, false, 15, [0.35, 0.95, 1.0], true, true],
    [SC.B.LEUCHT_PINK, "leuchtPink", alle("leucht_pink"), true, false, 15, [1.0, 0.4, 0.85], true, true],
    [SC.B.LEUCHT_GRUEN, "leuchtGruen", alle("leucht_gruen"), true, false, 15, [0.4, 1.0, 0.65], true, true],
    [SC.B.BETON, "beton", alle("beton"), true, false, 0, null, true, true],
    [SC.B.KISTE, "kiste", { oben: "kiste_oben", seite: "kiste_seite", unten: "kiste_seite" }, true, false, 6, [1.0, 0.8, 0.35], false, false],
    [SC.B.KISTE_OFFEN, "kisteOffen", { oben: "kiste_offen", seite: "kiste_seite", unten: "kiste_seite" }, true, false, 0, null, false, false],
    [SC.B.LAVA, "lava", alle("lava"), false, true, 15, [1.0, 0.5, 0.15], false, true, { ausschnitt: true }],
    [SC.B.EIS, "eis", alle("eis"), true, true, 0, null, true, true],
    [SC.B.SCHLAMM, "schlamm", alle("schlamm"), true, false, 0, null, true, true],
    [SC.B.BASALT, "basalt", alle("basalt"), true, false, 0, null, true, true],
    // Stufe 6a: [..., { form, klettern }] – form: "kreuz" | "pflanze" | "pfosten" | "gegenstand" (nur Bild, z. B. Eimer in der Hand) | { typ: "platte", achse, versatz } (Standard Würfel)
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
    [SC.B.NETZ, "netz", alle("netz"), true, false, 0, null, true, false, { nichtAufstellbar: true }],
    [SC.B.TIERFUTTER, "tierfutter", alle("tierfutter"), true, false, 0, null, true, false, { nichtAufstellbar: true }],
    [SC.B.EIMER, "eimer", alle("eimer"), true, true, 0, null, true, false, { nichtAufstellbar: true, ausschnitt: true, form: "gegenstand" }],
    [SC.B.EIMER_WASSER, "eimerWasser", alle("eimer_wasser"), true, true, 0, null, true, true, { nichtAufstellbar: true, ausschnitt: true, form: "gegenstand" }],
    [SC.B.EIMER_LAVA, "eimerLava", alle("eimer_lava"), true, true, 0, null, true, true, { nichtAufstellbar: true, ausschnitt: true, form: "gegenstand" }],
    [SC.B.WERKBANK, "werkbank", { oben: "werkbank_oben", seite: "werkbank_seite", unten: "werkbank_seite" }, true, false, 0, null, true, true],
    [SC.B.FACKEL, "fackel", alle("fackel"), false, true, 14, [1.0, 0.7, 0.3], true, true, { form: "kreuz" }],
    [SC.B.ZAUN, "zaun", alle("zaun"), true, true, 0, null, true, true, { form: "pfosten" }],
    [SC.B.LEITER_N, "leiter", alle("leiter"), false, true, 0, null, true, true, { form: { typ: "platte", achse: "z", versatz: 0 }, klettern: true }],
    [SC.B.LEITER_S, "leiter", alle("leiter"), false, true, 0, null, true, false, { form: { typ: "platte", achse: "z", versatz: 1 }, klettern: true }],
    [SC.B.LEITER_O, "leiter", alle("leiter"), false, true, 0, null, true, false, { form: { typ: "platte", achse: "x", versatz: 1 }, klettern: true }],
    [SC.B.LEITER_W, "leiter", alle("leiter"), false, true, 0, null, true, false, { form: { typ: "platte", achse: "x", versatz: 0 }, klettern: true }],
    [SC.B.SPIEGEL_N, "spiegel", { oben: "spiegel_unten", seite: "spiegel_unten", unten: "spiegel_unten" }, false, true, 0, null, true, true, { form: { typ: "platte", achse: "z", versatz: 0 } }],
    [SC.B.SPIEGEL_S, "spiegel", { oben: "spiegel_unten", seite: "spiegel_unten", unten: "spiegel_unten" }, false, true, 0, null, true, false, { form: { typ: "platte", achse: "z", versatz: 1 } }],
    [SC.B.SPIEGEL_O, "spiegel", { oben: "spiegel_unten", seite: "spiegel_unten", unten: "spiegel_unten" }, false, true, 0, null, true, false, { form: { typ: "platte", achse: "x", versatz: 1 } }],
    [SC.B.SPIEGEL_W, "spiegel", { oben: "spiegel_unten", seite: "spiegel_unten", unten: "spiegel_unten" }, false, true, 0, null, true, false, { form: { typ: "platte", achse: "x", versatz: 0 } }],
    [SC.B.SPIEGEL_N_OBEN, "spiegel", { oben: "spiegel_oben", seite: "spiegel_oben", unten: "spiegel_oben" }, false, true, 0, null, true, false, { form: { typ: "platte", achse: "z", versatz: 0 } }],
    [SC.B.SPIEGEL_S_OBEN, "spiegel", { oben: "spiegel_oben", seite: "spiegel_oben", unten: "spiegel_oben" }, false, true, 0, null, true, false, { form: { typ: "platte", achse: "z", versatz: 1 } }],
    [SC.B.SPIEGEL_O_OBEN, "spiegel", { oben: "spiegel_oben", seite: "spiegel_oben", unten: "spiegel_oben" }, false, true, 0, null, true, false, { form: { typ: "platte", achse: "x", versatz: 1 } }],
    [SC.B.SPIEGEL_W_OBEN, "spiegel", { oben: "spiegel_oben", seite: "spiegel_oben", unten: "spiegel_oben" }, false, true, 0, null, true, false, { form: { typ: "platte", achse: "x", versatz: 0 } }],
    [SC.B.TUER_X, "tuer", alle("tuer"), true, true, 0, null, true, true, { form: { typ: "platte", achse: "x", versatz: 0.5 } }],
    [SC.B.TUER_Z, "tuer", alle("tuer"), true, true, 0, null, true, false, { form: { typ: "platte", achse: "z", versatz: 0.5 } }],
    [SC.B.TUER_X_OFFEN, "tuer", alle("tuer"), false, true, 0, null, true, false, { form: { typ: "platte", achse: "z", versatz: 0 } }],
    [SC.B.TUER_Z_OFFEN, "tuer", alle("tuer"), false, true, 0, null, true, false, { form: { typ: "platte", achse: "x", versatz: 0 } }],
    [SC.B.TUER_X_OBEN, "tuer", alle("tuer_oben"), true, true, 0, null, true, false, { form: { typ: "platte", achse: "x", versatz: 0.5 } }],
    [SC.B.TUER_Z_OBEN, "tuer", alle("tuer_oben"), true, true, 0, null, true, false, { form: { typ: "platte", achse: "z", versatz: 0.5 } }],
    [SC.B.TUER_X_OFFEN_OBEN, "tuer", alle("tuer_oben"), false, true, 0, null, true, false, { form: { typ: "platte", achse: "z", versatz: 0 } }],
    [SC.B.TUER_Z_OFFEN_OBEN, "tuer", alle("tuer_oben"), false, true, 0, null, true, false, { form: { typ: "platte", achse: "x", versatz: 0 } }],
    // Betten: flacher Kasten, begehbar; nur das Fußende Nord steht in der Kreativ-Auswahl
    [SC.B.BETT_FUSS_N, "bett", { oben: "bett_fuss_oben", seite: "bett_seite", unten: "bretter" }, false, true, 0, null, true, true, { form: BETT.N }],
    [SC.B.BETT_FUSS_S, "bett", { oben: "bett_fuss_oben", seite: "bett_seite", unten: "bretter" }, false, true, 0, null, true, false, { form: BETT.S }],
    [SC.B.BETT_FUSS_O, "bett", { oben: "bett_fuss_oben", seite: "bett_seite", unten: "bretter" }, false, true, 0, null, true, false, { form: BETT.O }],
    [SC.B.BETT_FUSS_W, "bett", { oben: "bett_fuss_oben", seite: "bett_seite", unten: "bretter" }, false, true, 0, null, true, false, { form: BETT.W }],
    [SC.B.BETT_KOPF_N, "bett", { oben: "bett_kopf_oben", seite: "bett_seite", unten: "bretter" }, false, true, 0, null, true, false, { form: BETT.N }],
    [SC.B.BETT_KOPF_S, "bett", { oben: "bett_kopf_oben", seite: "bett_seite", unten: "bretter" }, false, true, 0, null, true, false, { form: BETT.S }],
    [SC.B.BETT_KOPF_O, "bett", { oben: "bett_kopf_oben", seite: "bett_seite", unten: "bretter" }, false, true, 0, null, true, false, { form: BETT.O }],
    [SC.B.BETT_KOPF_W, "bett", { oben: "bett_kopf_oben", seite: "bett_seite", unten: "bretter" }, false, true, 0, null, true, false, { form: BETT.W }],
    [SC.B.ZAUBERKUGEL, "zauberkugel", { oben: "zauber_tisch_oben", seite: "zauber_tisch", unten: "zauber_tisch", kugel: "zauber_kugel" }, true, true, 9, [0.7, 0.5, 1.0], true, true, { form: ZAUBER }],
    [SC.B.SCHNEESCHICHT, "schneeschicht", alle("schnee_oben"), false, true, 0, null, true, true, { form: { typ: "kasten", a: [0, 0, 0], b: [1, 0.125, 1] } }],
    [SC.B.LAGERFEUER, "lagerfeuer", alle("lagerfeuer_aus"), false, true, 0, null, true, true, { form: "kreuz", feuer: "lager", brennt: false }],
    [SC.B.LAGERFEUER_AN, "lagerfeuerAn", alle("lagerfeuer_an"), false, true, 15, [1.0, 0.55, 0.2], true, true, { form: "kreuz", feuer: "lager", brennt: true }],
    [SC.B.KAMIN, "kamin", { oben: "kamin_oben", seite: "kamin_aus", unten: "kamin_oben" }, true, false, 0, null, true, true, { feuer: "kamin", brennt: false }],
    [SC.B.KAMIN_AN, "kaminAn", { oben: "kamin_oben", seite: "kamin_an", unten: "kamin_oben" }, true, false, 13, [1.0, 0.6, 0.25], true, true, { feuer: "kamin", brennt: true }],
    [SC.B.FEUERZEUG, "feuerzeug", alle("feuerzeug"), true, true, 0, null, true, false, { nichtAufstellbar: true, ausschnitt: true, form: "gegenstand" }],
    [SC.B.KESSEL, "kessel", { oben: "kessel_oben", seite: "kessel_seite", unten: "kessel_seite" }, true, false, 0, null, true, true],
    [SC.B.FLASCHE, "flasche", alle("flasche"), true, true, 0, null, true, true, { nichtAufstellbar: true, ausschnitt: true, form: "gegenstand" }],
    [SC.B.TRANK, "trank", alle("trank"), true, true, 0, null, true, false, { nichtAufstellbar: true, ausschnitt: true, form: "gegenstand" }],
    [SC.B.HASENKLEE, "hasenklee", alle("pflanze_hasenklee"), false, true, 0, null, true, true, { form: "pflanze" }],
    [SC.B.KATZENMINZE, "katzenminze", alle("pflanze_katzenminze"), false, true, 0, null, true, true, { form: "pflanze" }],
    [SC.B.FUCHSGRAS, "fuchsgras", alle("pflanze_fuchsgras"), false, true, 0, null, true, true, { form: "pflanze" }],
    [SC.B.EISBLUME, "eisblume", alle("pflanze_eisblume"), false, true, 0, null, true, true, { form: "pflanze" }],
    [SC.B.FROSTBEERE, "frostbeere", alle("pflanze_frostbeere"), false, true, 0, null, true, true, { form: "pflanze" }],
    [SC.B.GLUTMOHN, "glutmohn", alle("pflanze_glutmohn"), false, true, 0, null, true, true, { form: "pflanze" }],
    [SC.B.FEDERFARN, "federfarn", alle("pflanze_federfarn"), false, true, 0, null, true, true, { form: "pflanze" }],
    [SC.B.QUAKBLUME, "quakblume", alle("pflanze_quakblume"), false, true, 0, null, true, true, { form: "pflanze" }],
    [SC.B.DSCHUNGELRANKE, "dschungelranke", alle("pflanze_dschungelranke"), false, true, 0, null, true, true, { form: "pflanze" }],
    [SC.B.TRUHE, "truhe", { oben: "truhe_oben", seite: "truhe_seite", unten: "truhe_seite" }, true, false, 0, null, true, true]
  ];
  // Fließstufen: wie die Quelle, aber nicht in der Auswahl; stufe 1 (fast leer) … MAX − 1, fallend = voller Strahl nach unten
  [["wasser", SC.B.WASSER, 7, "WASSER_"], ["lava", SC.B.LAVA, 3, "LAVA_"]].forEach(function(f){
    var q = D.filter(function(d){ return d[0] === f[1]; })[0], zusatz = q[9] || {};
    function eintrag(id, stufe, fallend){ var z = {}; for(var k in zusatz) z[k] = zusatz[k]; z.fluessig = f[0]; z.stufe = stufe; z.fallend = fallend; return [id, q[1], q[2], q[3], q[4], q[5], q[6], false, false, z]; }
    q[9] = Object.assign({}, zusatz, { fluessig: f[0], stufe: f[2] + 1, quelle: true });
    for(var s = 1; s <= f[2]; s++) D.push(eintrag(SC.B[f[3] + s], s, false));
    D.push(eintrag(SC.B[f[3] + "FALL"], f[2] + 1, true));
  });
  D.forEach(function(d){
    var b = SC.BLOECKE[d[0]] = { id: d[0], name: SC.T.bloecke[d[1]], seiten: d[2], fest: d[3], durchsichtig: d[4], leuchten: d[5], lichtFarbe: d[6], zerstoerbar: d[7], inAuswahl: d[8], form: "wuerfel", klettern: false, ausschnitt: false };   // ausschnitt: durchsichtig für Licht und Flächen, Kachel nur mit Löchern oder deckend – gezeichnet mit Tiefenpuffer
    if(d[9]) for(var k in d[9]) b[k] = d[9][k];
  });
})();

// Flüssigkeiten: Art, Stufe, Quelle, Höhe der Oberfläche; MAX = Stufe der Quelle (Weite zur Seite = MAX − 1)
SC.Fluessig = (function(){
  var MAX = { wasser: 8, lava: 4 }, ID = { wasser: {}, lava: {} };
  for(var id in SC.BLOECKE){ var b = SC.BLOECKE[id]; if(b.fluessig) ID[b.fluessig][b.fallend ? "f" : b.stufe] = +id; }
  function def(id){ return SC.BLOECKE[id]; }
  return {
    MAX: MAX,
    art: function(id){ var b = def(id); return b && b.fluessig || null; },
    istWasser: function(id){ var b = def(id); return !!b && b.fluessig === "wasser"; },
    istLava: function(id){ var b = def(id); return !!b && b.fluessig === "lava"; },
    quelle: function(id){ var b = def(id); return !!b && !!b.quelle; },
    fallend: function(id){ var b = def(id); return !!b && !!b.fallend; },
    stufe: function(id){ var b = def(id); return b && b.fluessig ? b.stufe : 0; },
    id: function(art, stufe, fallend){ return ID[art][fallend ? "f" : stufe]; },
    hoehe: function(id){ var b = def(id); return !b || !b.fluessig ? 0 : b.quelle || b.fallend ? 1 : b.stufe / MAX[b.fluessig]; }
  };
})();

// Kristallfarben für Laserschwerter und Blaster (Stufe 6a): Schlüssel → Block und Farbe der Klinge/des Strahls
SC.CRAFTING_KRISTALLE = {
  blau: { block: SC.B.KRISTALL_BLAU, farbe: "#3fa0ff" }, gruen: { block: SC.B.KRISTALL_GRUEN, farbe: "#3fe06a" },
  rot: { block: SC.B.KRISTALL_ROT, farbe: "#ff4a4a" }, gelb: { block: SC.B.KRISTALL_GELB, farbe: "#ffe14a" },
  violett: { block: SC.B.KRISTALL_VIOLETT, farbe: "#b46bff" }, weiss: { block: SC.B.KRISTALL_WEISS, farbe: "#f4f4ff" }
};
