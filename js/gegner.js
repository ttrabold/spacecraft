// Gegnertabelle: jede Art ist ein Eintrag – neue Arten kommen hier dazu, ohne Umbau.
// Modell: Blockfigur aus Teilen (Maße und Mitte relativ zu den Füßen), Farben fest je Art.
SC.GEGNER = {
  patrouillendroide: {
    verhalten: "fernkampf", lp: function(s){ return 30 + 12 * s; }, schaden: function(s){ return 3 + 1 * s; },
    tempo: 2.6, breite: 0.7, hoehe: 1.9, sicht: 24, abstand: [8, 14],
    waffe: { art: "laser", rate: 1.5, tempo: 30, streuung: 0.14, farbe: "#ff4f4f" },
    beute: { chance: 0.35 }, teile: [{ block: SC.B.SCHALTKREIS, chance: 0.5, menge: [1, 2] }], orte: ["station"], laut: "droide",
    modell: [
      { teil: "kopf", w: 0.42, h: 0.38, d: 0.42, x: 0, y: 1.7, z: 0, farbe: "#e6e9ef" },
      { teil: "visier", w: 0.34, h: 0.08, d: 0.02, x: 0, y: 1.72, z: -0.22, farbe: "#ff7a3c", leuchtet: true },
      { teil: "rumpf", w: 0.56, h: 0.7, d: 0.32, x: 0, y: 1.15, z: 0, farbe: "#cfd6e2" },
      { teil: "armL", w: 0.16, h: 0.66, d: 0.16, x: -0.36, y: 1.15, z: 0, farbe: "#9aa4b4" },
      { teil: "armR", w: 0.16, h: 0.66, d: 0.16, x: 0.36, y: 1.15, z: 0, farbe: "#9aa4b4" },
      { teil: "waffe", w: 0.1, h: 0.1, d: 0.6, x: 0.36, y: 0.95, z: -0.3, farbe: "#3a3f4a" },
      { teil: "beinL", w: 0.2, h: 0.8, d: 0.2, x: -0.14, y: 0.4, z: 0, farbe: "#8a93a3" },
      { teil: "beinR", w: 0.2, h: 0.8, d: 0.2, x: 0.14, y: 0.4, z: 0, farbe: "#8a93a3" }
    ]
  },
  weltraumbandit: {
    verhalten: "ausweicher", lp: function(s){ return 24 + 10 * s; }, schaden: function(s){ return 2 + 0.8 * s; },
    tempo: 3.6, breite: 0.6, hoehe: 1.8, sicht: 22, abstand: [5, 10],
    waffe: { art: "laser", rate: 1.3, tempo: 28, streuung: 0.14, farbe: "#ffa64f" },
    beute: { chance: 0.35 }, teile: [{ block: SC.B.SCHALTKREIS, chance: 0.5, menge: [1, 2] }], orte: ["lager"], laut: null,
    modell: [
      { teil: "kopf", w: 0.42, h: 0.42, d: 0.42, x: 0, y: 1.58, z: 0, farbe: "#c99a72" },
      { teil: "tuch", w: 0.44, h: 0.14, d: 0.44, x: 0, y: 1.5, z: 0, farbe: "#c0392b" },
      { teil: "rumpf", w: 0.5, h: 0.68, d: 0.28, x: 0, y: 1.05, z: 0, farbe: "#6b4a2b" },
      { teil: "armL", w: 0.16, h: 0.62, d: 0.16, x: -0.33, y: 1.05, z: 0, farbe: "#52381f" },
      { teil: "armR", w: 0.16, h: 0.62, d: 0.16, x: 0.33, y: 1.05, z: 0, farbe: "#52381f" },
      { teil: "waffe", w: 0.08, h: 0.12, d: 0.32, x: 0.33, y: 0.85, z: -0.2, farbe: "#2a2a2a" },
      { teil: "beinL", w: 0.2, h: 0.72, d: 0.2, x: -0.12, y: 0.36, z: 0, farbe: "#3b3b52" },
      { teil: "beinR", w: 0.2, h: 0.72, d: 0.2, x: 0.12, y: 0.36, z: 0, farbe: "#3b3b52" }
    ]
  },
  krabbler: {
    verhalten: "nahkampf", lp: function(s){ return 14 + 6 * s; }, schaden: function(s){ return 2 + 0.8 * s; },
    tempo: 4.2, breite: 0.9, hoehe: 0.7, sicht: 16, hieb: { reichweite: 1.5, rate: 0.9 },
    beute: { chance: 0.2 }, teile: [{ block: SC.B.CHITIN, chance: 0.5, menge: [1, 2] }], orte: ["dungeon", "nacht"], laut: "krabbler",
    modell: [
      { teil: "rumpf", w: 0.8, h: 0.4, d: 0.9, x: 0, y: 0.4, z: 0, farbe: "#5a3a8a" },
      { teil: "kopf", w: 0.5, h: 0.32, d: 0.3, x: 0, y: 0.42, z: -0.55, farbe: "#7a52b0" },
      { teil: "augen", w: 0.36, h: 0.08, d: 0.02, x: 0, y: 0.48, z: -0.71, farbe: "#ff5050", leuchtet: true },
      { teil: "beinL", w: 0.9, h: 0.1, d: 0.1, x: -0.1, y: 0.15, z: -0.25, farbe: "#3a2560" },
      { teil: "beinR", w: 0.9, h: 0.1, d: 0.1, x: 0.1, y: 0.15, z: 0.25, farbe: "#3a2560" }
    ]
  },
  spucker: {
    verhalten: "spucker", lp: function(s){ return 20 + 8 * s; }, schaden: function(s){ return 3 + 1 * s; },
    tempo: 2.8, breite: 0.8, hoehe: 1.0, sicht: 20, abstand: [6, 12],
    waffe: { art: "spucke", rate: 1.8, tempo: 11, streuung: 0.05, farbe: "#7cff4f" },
    beute: { chance: 0.3 }, teile: [{ block: SC.B.CHITIN, chance: 0.5, menge: [1, 2] }], orte: ["dungeon", "nacht", "kristallfeld"], laut: "spucker",
    modell: [
      { teil: "rumpf", w: 0.6, h: 0.5, d: 1.0, x: 0, y: 0.45, z: 0.05, farbe: "#3f9a55" },
      { teil: "kopf", w: 0.46, h: 0.4, d: 0.46, x: 0, y: 0.75, z: -0.55, farbe: "#56b86a" },
      { teil: "maul", w: 0.3, h: 0.08, d: 0.02, x: 0, y: 0.66, z: -0.79, farbe: "#c0ff60", leuchtet: true },
      { teil: "schwanz", w: 0.2, h: 0.2, d: 0.7, x: 0, y: 0.4, z: 0.85, farbe: "#2f7a42" },
      { teil: "beinL", w: 0.16, h: 0.3, d: 0.16, x: -0.3, y: 0.15, z: 0, farbe: "#2f7a42" },
      { teil: "beinR", w: 0.16, h: 0.3, d: 0.16, x: 0.3, y: 0.15, z: 0, farbe: "#2f7a42" }
    ]
  },
  schattenritter: {
    verhalten: "ritter", boss: true, lp: function(s){ return 600 + 160 * s; }, schaden: function(s){ return 8 + 2.5 * s; },
    tempo: 3.4, breite: 0.8, hoehe: 2.0, sicht: 24, hieb: { reichweite: 2.4, rate: 1.1 }, blockt: true,
    beute: { chance: 1 }, orte: ["herrenhaus", "dungeon"], laut: null,
    modell: [
      { teil: "kopf", w: 0.46, h: 0.46, d: 0.46, x: 0, y: 1.76, z: 0, farbe: "#26203a" },
      { teil: "visier", w: 0.36, h: 0.06, d: 0.02, x: 0, y: 1.78, z: -0.24, farbe: "#ff3b5c", leuchtet: true },
      { teil: "umhang", w: 0.7, h: 1.1, d: 0.1, x: 0, y: 1.0, z: 0.2, farbe: "#3b1d5e" },
      { teil: "rumpf", w: 0.6, h: 0.78, d: 0.32, x: 0, y: 1.2, z: 0, farbe: "#332b4a" },
      { teil: "armL", w: 0.18, h: 0.72, d: 0.18, x: -0.4, y: 1.2, z: 0, farbe: "#26203a" },
      { teil: "armR", w: 0.18, h: 0.72, d: 0.18, x: 0.4, y: 1.2, z: 0, farbe: "#26203a" },
      { teil: "klinge", w: 0.07, h: 1.1, d: 0.07, x: 0.4, y: 1.45, z: -0.35, farbe: "#ff3b5c", leuchtet: true },
      { teil: "beinL", w: 0.22, h: 0.82, d: 0.22, x: -0.15, y: 0.41, z: 0, farbe: "#1c1830" },
      { teil: "beinR", w: 0.22, h: 0.82, d: 0.22, x: 0.15, y: 0.41, z: 0, farbe: "#1c1830" }
    ]
  },
  panzerkoloss: {
    verhalten: "koloss", boss: true, lp: function(s){ return 800 + 200 * s; }, schaden: function(s){ return 10 + 3 * s; },
    tempo: 2.2, breite: 2.2, hoehe: 2.6, sicht: 20, hieb: { reichweite: 2.6, rate: 1.6 }, stampf: { radius: 4.5, rate: 3.5 },
    rueckenFaktor: 3, vorneFaktor: 0.3,
    beute: { chance: 1 }, orte: ["dungeon"], laut: null,
    modell: [
      { teil: "rumpf", w: 2.0, h: 1.4, d: 2.2, x: 0, y: 1.5, z: 0, farbe: "#6b5a3a" },
      { teil: "panzer", w: 2.2, h: 0.5, d: 1.2, x: 0, y: 2.3, z: -0.4, farbe: "#9a8a6a" },
      { teil: "kopf", w: 1.0, h: 0.8, d: 0.8, x: 0, y: 1.6, z: -1.4, farbe: "#7a6a4a" },
      { teil: "augen", w: 0.7, h: 0.1, d: 0.02, x: 0, y: 1.8, z: -1.81, farbe: "#ffad47", leuchtet: true },
      { teil: "ruecken", w: 1.0, h: 0.6, d: 0.4, x: 0, y: 1.7, z: 1.15, farbe: "#ff6f6f", leuchtet: true },
      { teil: "beinL", w: 0.5, h: 0.9, d: 0.5, x: -0.75, y: 0.45, z: -0.6, farbe: "#4a3d28" },
      { teil: "beinR", w: 0.5, h: 0.9, d: 0.5, x: 0.75, y: 0.45, z: -0.6, farbe: "#4a3d28" },
      { teil: "beinHL", w: 0.5, h: 0.9, d: 0.5, x: -0.75, y: 0.45, z: 0.7, farbe: "#4a3d28" },
      { teil: "beinHR", w: 0.5, h: 0.9, d: 0.5, x: 0.75, y: 0.45, z: 0.7, farbe: "#4a3d28" }
    ]
  },
  // --- Stufe 5a: Glutfrost ---
  lavagolem: {
    verhalten: "nahkampf", lp: function(s){ return 40 + 16 * s; }, schaden: function(s){ return 4 + 1.2 * s; },
    tempo: 1.8, breite: 1.4, hoehe: 2.0, sicht: 18, hieb: { reichweite: 2.0, rate: 1.4 },
    beute: { chance: 0.35 }, teile: [{ block: SC.B.GLUTSTAHL, chance: 0.5, menge: [1, 2] }], orte: ["glutfrost"], laut: null,
    modell: [
      { teil: "rumpf", w: 1.0, h: 0.9, d: 0.7, x: 0, y: 1.2, z: 0, farbe: "#3a3034" },
      { teil: "glut", w: 0.6, h: 0.5, d: 0.05, x: 0, y: 1.25, z: -0.37, farbe: "#ff7a2a", leuchtet: true },
      { teil: "kopf", w: 0.55, h: 0.45, d: 0.5, x: 0, y: 1.85, z: -0.05, farbe: "#2e2629" },
      { teil: "augen", w: 0.4, h: 0.08, d: 0.02, x: 0, y: 1.9, z: -0.31, farbe: "#ffd04a", leuchtet: true },
      { teil: "armL", w: 0.32, h: 0.9, d: 0.32, x: -0.68, y: 1.1, z: 0, farbe: "#433a3e" },
      { teil: "armR", w: 0.32, h: 0.9, d: 0.32, x: 0.68, y: 1.1, z: 0, farbe: "#433a3e" },
      { teil: "beinL", w: 0.36, h: 0.75, d: 0.36, x: -0.26, y: 0.38, z: 0, farbe: "#2e2629" },
      { teil: "beinR", w: 0.36, h: 0.75, d: 0.36, x: 0.26, y: 0.38, z: 0, farbe: "#2e2629" }
    ]
  },
  frostkrabbler: {
    verhalten: "nahkampf", lp: function(s){ return 12 + 5 * s; }, schaden: function(s){ return 2 + 0.7 * s; },
    tempo: 4.6, breite: 0.8, hoehe: 0.6, sicht: 16, hieb: { reichweite: 1.4, rate: 0.8 },
    beute: { chance: 0.2 }, teile: [{ block: SC.B.CHITIN, chance: 0.5, menge: [1, 2] }], orte: ["glutfrost"], laut: "krabbler",
    modell: [
      { teil: "panzer", w: 0.8, h: 0.35, d: 0.9, x: 0, y: 0.35, z: 0, farbe: "#bfe6ff" },
      { teil: "kopf", w: 0.4, h: 0.25, d: 0.3, x: 0, y: 0.38, z: -0.55, farbe: "#94c9ee" },
      { teil: "augen", w: 0.32, h: 0.06, d: 0.02, x: 0, y: 0.42, z: -0.71, farbe: "#5ff4ff", leuchtet: true },
      { teil: "beinL", w: 0.12, h: 0.3, d: 0.6, x: -0.46, y: 0.15, z: 0, farbe: "#7fb0d6" },
      { teil: "beinR", w: 0.12, h: 0.3, d: 0.6, x: 0.46, y: 0.15, z: 0, farbe: "#7fb0d6" },
      { teil: "zacken", w: 0.5, h: 0.15, d: 0.5, x: 0, y: 0.6, z: 0.05, farbe: "#e2f4ff" }
    ]
  },
  magmakoenig: {
    verhalten: "koloss", boss: true, lp: function(s){ return 900 + 220 * s; }, schaden: function(s){ return 11 + 3 * s; },
    tempo: 2.0, breite: 2.8, hoehe: 3.0, sicht: 24, hieb: { reichweite: 2.8, rate: 1.6 }, stampf: { radius: 4.5, rate: 3.5 },
    waffe: { art: "glut", rate: 2.5, tempo: 12, streuung: 0.08, farbe: "#ff7a2a" },
    beute: { chance: 1 }, teile: [{ block: SC.B.GLUTSTAHL, chance: 1, menge: [2, 3] }], orte: ["glutfrost"], laut: null,
    modell: [
      { teil: "rumpf", w: 2.0, h: 1.4, d: 1.3, x: 0, y: 1.8, z: 0, farbe: "#2e2629" },
      { teil: "glut", w: 1.2, h: 0.8, d: 0.05, x: 0, y: 1.9, z: -0.67, farbe: "#ff6a1a", leuchtet: true },
      { teil: "kopf", w: 0.9, h: 0.7, d: 0.8, x: 0, y: 2.75, z: -0.1, farbe: "#3a3034" },
      { teil: "krone", w: 1.0, h: 0.25, d: 0.9, x: 0, y: 3.2, z: -0.1, farbe: "#ffd04a", leuchtet: true },
      { teil: "augen", w: 0.6, h: 0.1, d: 0.02, x: 0, y: 2.8, z: -0.51, farbe: "#ffe08a", leuchtet: true },
      { teil: "armL", w: 0.55, h: 1.4, d: 0.55, x: -1.3, y: 1.6, z: 0, farbe: "#433a3e" },
      { teil: "armR", w: 0.55, h: 1.4, d: 0.55, x: 1.3, y: 1.6, z: 0, farbe: "#433a3e" },
      { teil: "beinL", w: 0.6, h: 1.1, d: 0.6, x: -0.5, y: 0.55, z: 0, farbe: "#2e2629" },
      { teil: "beinR", w: 0.6, h: 1.1, d: 0.6, x: 0.5, y: 0.55, z: 0, farbe: "#2e2629" }
    ]
  },
  // --- Stufe 5a: Rankenmoor ---
  rankenschleicher: {
    verhalten: "nahkampf", lp: function(s){ return 22 + 8 * s; }, schaden: function(s){ return 3 + 1 * s; },
    tempo: 3.6, breite: 0.8, hoehe: 1.2, sicht: 14, hieb: { reichweite: 1.6, rate: 1.0 }, sprung: { reichweite: 6, rate: 4 },
    beute: { chance: 0.3 }, teile: [{ block: SC.B.CHITIN, chance: 0.5, menge: [1, 2] }], orte: ["rankenmoor"], laut: "krabbler",
    modell: [
      { teil: "rumpf", w: 0.6, h: 0.5, d: 1.0, x: 0, y: 0.6, z: 0, farbe: "#2f6a24" },
      { teil: "kopf", w: 0.45, h: 0.4, d: 0.45, x: 0, y: 0.85, z: -0.6, farbe: "#3f8a2e" },
      { teil: "augen", w: 0.34, h: 0.07, d: 0.02, x: 0, y: 0.92, z: -0.83, farbe: "#c8ff4a", leuchtet: true },
      { teil: "ranke", w: 0.08, h: 0.6, d: 0.08, x: 0, y: 1.1, z: 0.3, farbe: "#55aa38" },
      { teil: "beinL", w: 0.15, h: 0.4, d: 0.15, x: -0.32, y: 0.2, z: -0.25, farbe: "#24521c" },
      { teil: "beinR", w: 0.15, h: 0.4, d: 0.15, x: 0.32, y: 0.2, z: 0.25, farbe: "#24521c" }
    ]
  },
  sumpfspucker: {
    verhalten: "spucker", lp: function(s){ return 22 + 8 * s; }, schaden: function(s){ return 3 + 1 * s; },
    tempo: 2.4, breite: 0.9, hoehe: 1.1, sicht: 20, abstand: [6, 12],
    waffe: { art: "spucke", rate: 1.8, tempo: 11, streuung: 0.05, farbe: "#a8ff3a" },
    beute: { chance: 0.3 }, teile: [{ block: SC.B.MOORSILBER, chance: 0.5, menge: [1, 2] }], orte: ["rankenmoor"], laut: "spucker",
    modell: [
      { teil: "koerper", w: 0.9, h: 0.8, d: 0.9, x: 0, y: 0.5, z: 0, farbe: "#4e6a3a" },
      { teil: "maul", w: 0.4, h: 0.12, d: 0.02, x: 0, y: 0.6, z: -0.46, farbe: "#a8ff3a", leuchtet: true },
      { teil: "augeL", w: 0.14, h: 0.14, d: 0.14, x: -0.22, y: 1.0, z: -0.3, farbe: "#c8ff4a", leuchtet: true },
      { teil: "augeR", w: 0.14, h: 0.14, d: 0.14, x: 0.22, y: 1.0, z: -0.3, farbe: "#c8ff4a", leuchtet: true },
      { teil: "blase", w: 0.5, h: 0.3, d: 0.5, x: 0, y: 0.95, z: 0.15, farbe: "#6a8a4e" },
      { teil: "fuss", w: 1.0, h: 0.12, d: 1.0, x: 0, y: 0.06, z: 0, farbe: "#3a4e2a" }
    ]
  },
  sumpfkoloss: {
    verhalten: "koloss", boss: true, lp: function(s){ return 950 + 230 * s; }, schaden: function(s){ return 10 + 3 * s; },
    tempo: 2.0, breite: 2.8, hoehe: 2.8, sicht: 22, hieb: { reichweite: 2.8, rate: 1.6 }, stampf: { radius: 4.5, rate: 4 },
    ruft: { art: "rankenschleicher", rate: 12, max: 3 },
    beute: { chance: 1 }, teile: [{ block: SC.B.MOORSILBER, chance: 1, menge: [2, 3] }], orte: ["rankenmoor"], laut: null,
    modell: [
      { teil: "rumpf", w: 2.1, h: 1.5, d: 1.4, x: 0, y: 1.6, z: 0, farbe: "#3a4e2a" },
      { teil: "moos", w: 2.2, h: 0.35, d: 1.5, x: 0, y: 2.45, z: 0, farbe: "#55aa38" },
      { teil: "kopf", w: 0.9, h: 0.6, d: 0.8, x: 0, y: 2.6, z: -0.5, farbe: "#4e6a3a" },
      { teil: "augen", w: 0.6, h: 0.1, d: 0.02, x: 0, y: 2.65, z: -0.91, farbe: "#c8ff4a", leuchtet: true },
      { teil: "blueten", w: 0.3, h: 0.3, d: 0.3, x: 0.7, y: 2.75, z: 0.2, farbe: "#ff6fd8", leuchtet: true },
      { teil: "armL", w: 0.55, h: 1.5, d: 0.55, x: -1.35, y: 1.4, z: 0, farbe: "#2f4a22" },
      { teil: "armR", w: 0.55, h: 1.5, d: 0.55, x: 1.35, y: 1.4, z: 0, farbe: "#2f4a22" },
      { teil: "beinL", w: 0.6, h: 0.9, d: 0.6, x: -0.5, y: 0.45, z: 0, farbe: "#24361a" },
      { teil: "beinR", w: 0.6, h: 0.9, d: 0.6, x: 0.5, y: 0.45, z: 0, farbe: "#24361a" }
    ]
  },

  // --- Gegner-Vielfalt: fünf neue Gegner je Planet ---
  funkenling: {
    verhalten: "kamikaze", lp: function(s){ return 8 + 3 * s; }, schaden: function(s){ return 5 + 1.5 * s; },
    tempo: 5.2, breite: 0.5, hoehe: 0.6, sicht: 18, zuend: { reichweite: 1.8, zeit: 0.9 }, explosion: { radius: 3.2 },
    beute: { chance: 0.1 }, teile: [{ block: SC.B.SCHALTKREIS, chance: 0.4, menge: [1, 1] }], orte: ["dungeon", "nacht"], laut: "krabbler",
    modell: [
      { teil: "rumpf", w: 0.42, h: 0.4, d: 0.42, x: 0, y: 0.3, z: 0, farbe: "#ff9a3c", leuchtet: true },
      { teil: "augen", w: 0.3, h: 0.08, d: 0.02, x: 0, y: 0.34, z: -0.22, farbe: "#fff6a0", leuchtet: true },
      { teil: "funke", w: 0.12, h: 0.22, d: 0.12, x: 0, y: 0.62, z: 0, farbe: "#ffe14a", leuchtet: true },
      { teil: "beinL", w: 0.12, h: 0.14, d: 0.14, x: -0.12, y: 0.07, z: 0, farbe: "#a85a1a" },
      { teil: "beinR", w: 0.12, h: 0.14, d: 0.14, x: 0.12, y: 0.07, z: 0, farbe: "#a85a1a" }
    ]
  },
  flatterdroide: {
    verhalten: "schweber", fliegt: true, schwebehoehe: 3, lp: function(s){ return 18 + 7 * s; }, schaden: function(s){ return 2 + 0.7 * s; },
    tempo: 3.4, breite: 1.0, hoehe: 0.5, sicht: 24, abstand: [6, 11],
    waffe: { art: "laser", rate: 1.4, tempo: 28, streuung: 0.12, farbe: "#ff7a3c" },
    beute: { chance: 0.25 }, teile: [{ block: SC.B.SCHALTKREIS, chance: 0.6, menge: [1, 2] }], orte: ["station", "lager"], laut: "droide",
    modell: [
      { teil: "rumpf", w: 0.5, h: 0.3, d: 0.5, x: 0, y: 0.3, z: 0, farbe: "#cfd6e2" },
      { teil: "auge", w: 0.26, h: 0.12, d: 0.02, x: 0, y: 0.32, z: -0.26, farbe: "#ff4f4f", leuchtet: true },
      { teil: "rotorL", w: 0.55, h: 0.04, d: 0.14, x: -0.35, y: 0.56, z: 0, farbe: "#8a95a1" },
      { teil: "rotorR", w: 0.55, h: 0.04, d: 0.14, x: 0.35, y: 0.56, z: 0, farbe: "#8a95a1" },
      { teil: "antenne", w: 0.04, h: 0.2, d: 0.04, x: 0, y: 0.62, z: 0.18, farbe: "#e6e9ef" }
    ]
  },
  schildwaechter: {
    verhalten: "nahkampf", lp: function(s){ return 50 + 18 * s; }, schaden: function(s){ return 4 + 1.2 * s; },
    tempo: 2.2, breite: 0.8, hoehe: 1.9, sicht: 18, hieb: { reichweite: 2.2, rate: 1.3 },
    vorneFaktor: 0.2, rueckenFaktor: 1.6,
    beute: { chance: 0.3 }, teile: [{ block: SC.B.SCHALTKREIS, chance: 0.5, menge: [1, 2] }], orte: ["station", "herrenhaus"], laut: "droide",
    modell: [
      { teil: "kopf", w: 0.42, h: 0.4, d: 0.42, x: 0, y: 1.7, z: 0, farbe: "#c9d2de" },
      { teil: "visier", w: 0.34, h: 0.08, d: 0.02, x: 0, y: 1.72, z: -0.22, farbe: "#3cd0ff", leuchtet: true },
      { teil: "rumpf", w: 0.6, h: 0.75, d: 0.34, x: 0, y: 1.15, z: 0, farbe: "#9aa6b8" },
      { teil: "schild", w: 1.0, h: 1.2, d: 0.12, x: 0, y: 1.1, z: -0.5, farbe: "#4a6fb0" },
      { teil: "schildstreifen", w: 0.12, h: 1.0, d: 0.02, x: 0, y: 1.1, z: -0.57, farbe: "#7fe0ff", leuchtet: true },
      { teil: "beinL", w: 0.22, h: 0.75, d: 0.26, x: -0.17, y: 0.38, z: 0, farbe: "#6f7b8c" },
      { teil: "beinR", w: 0.22, h: 0.75, d: 0.26, x: 0.17, y: 0.38, z: 0, farbe: "#6f7b8c" }
    ]
  },
  spaeher: {
    verhalten: "fernkampf", lp: function(s){ return 20 + 8 * s; }, schaden: function(s){ return 6 + 1.8 * s; },
    tempo: 2.0, breite: 0.6, hoehe: 1.8, sicht: 34, abstand: [14, 22],
    waffe: { art: "laser", rate: 3.4, tempo: 60, streuung: 0.03, farbe: "#ffd24a" },
    beute: { chance: 0.3 }, teile: [{ block: SC.B.SCHALTKREIS, chance: 0.5, menge: [1, 1] }], orte: ["lager", "herrenhaus"], laut: null,
    modell: [
      { teil: "kopf", w: 0.4, h: 0.4, d: 0.4, x: 0, y: 1.65, z: 0, farbe: "#7a5a3a" },
      { teil: "kapuze", w: 0.5, h: 0.3, d: 0.5, x: 0, y: 1.82, z: 0.02, farbe: "#4a3a2a" },
      { teil: "augen", w: 0.3, h: 0.06, d: 0.02, x: 0, y: 1.66, z: -0.21, farbe: "#ffd24a", leuchtet: true },
      { teil: "rumpf", w: 0.55, h: 0.7, d: 0.3, x: 0, y: 1.1, z: 0, farbe: "#6a5a3a" },
      { teil: "gewehr", w: 0.1, h: 0.1, d: 1.1, x: 0.3, y: 1.15, z: -0.5, farbe: "#3a3a44" },
      { teil: "zielfernrohr", w: 0.08, h: 0.08, d: 0.3, x: 0.3, y: 1.25, z: -0.45, farbe: "#ff4f4f", leuchtet: true },
      { teil: "beinL", w: 0.2, h: 0.7, d: 0.24, x: -0.15, y: 0.35, z: 0, farbe: "#4a3f2a" },
      { teil: "beinR", w: 0.2, h: 0.7, d: 0.24, x: 0.15, y: 0.35, z: 0, farbe: "#4a3f2a" }
    ]
  },
  reparaturdroide: {
    verhalten: "fernkampf", lp: function(s){ return 26 + 10 * s; }, schaden: function(s){ return 1.5 + 0.5 * s; },
    tempo: 2.4, breite: 0.7, hoehe: 1.6, sicht: 22, abstand: [8, 13],
    waffe: { art: "laser", rate: 2.2, tempo: 24, streuung: 0.1, farbe: "#7cff8a" },
    heilt: { rate: 3.5, radius: 9, anteil: 0.25 },
    beute: { chance: 0.3 }, teile: [{ block: SC.B.SCHALTKREIS, chance: 0.6, menge: [1, 2] }], orte: ["station", "lager"], laut: "droide",
    modell: [
      { teil: "kopf", w: 0.4, h: 0.36, d: 0.4, x: 0, y: 1.4, z: 0, farbe: "#f2f4f8" },
      { teil: "auge", w: 0.26, h: 0.1, d: 0.02, x: 0, y: 1.42, z: -0.21, farbe: "#7cff8a", leuchtet: true },
      { teil: "rumpf", w: 0.6, h: 0.7, d: 0.36, x: 0, y: 0.95, z: 0, farbe: "#f2f4f8" },
      { teil: "kreuzA", w: 0.3, h: 0.08, d: 0.02, x: 0, y: 1.0, z: -0.19, farbe: "#3fe06a", leuchtet: true },
      { teil: "kreuzB", w: 0.08, h: 0.3, d: 0.02, x: 0, y: 1.0, z: -0.19, farbe: "#3fe06a", leuchtet: true },
      { teil: "antenne", w: 0.04, h: 0.3, d: 0.04, x: 0.12, y: 1.7, z: 0, farbe: "#c8d0dc" },
      { teil: "beinL", w: 0.2, h: 0.6, d: 0.24, x: -0.15, y: 0.3, z: 0, farbe: "#c8d0dc" },
      { teil: "beinR", w: 0.2, h: 0.6, d: 0.24, x: 0.15, y: 0.3, z: 0, farbe: "#c8d0dc" }
    ]
  },
  eisrutscher: {
    verhalten: "nahkampf", lp: function(s){ return 30 + 10 * s; }, schaden: function(s){ return 3.5 + 1.1 * s; },
    tempo: 3.0, breite: 0.8, hoehe: 0.9, sicht: 20, hieb: { reichweite: 1.6, rate: 1.0 },
    sturm: { min: 5, max: 13, rate: 5, dauer: 0.9 },
    beute: { chance: 0.2 }, teile: [{ block: SC.B.CHITIN, chance: 0.5, menge: [1, 2] }], orte: ["nacht", "dungeon", "lager"], laut: "krabbler",
    modell: [
      { teil: "rumpf", w: 0.62, h: 0.7, d: 0.5, x: 0, y: 0.5, z: 0, farbe: "#2a3f6a" },
      { teil: "bauch", w: 0.46, h: 0.55, d: 0.04, x: 0, y: 0.48, z: -0.27, farbe: "#f4f8ff" },
      { teil: "kopf", w: 0.46, h: 0.38, d: 0.4, x: 0, y: 0.98, z: -0.02, farbe: "#2a3f6a" },
      { teil: "schnabel", w: 0.2, h: 0.1, d: 0.2, x: 0, y: 0.94, z: -0.3, farbe: "#ff9a3c" },
      { teil: "augen", w: 0.32, h: 0.07, d: 0.02, x: 0, y: 1.02, z: -0.23, farbe: "#ffffff", leuchtet: true },
      { teil: "flosseL", w: 0.1, h: 0.4, d: 0.3, x: -0.36, y: 0.5, z: 0, farbe: "#1f2f52" },
      { teil: "flosseR", w: 0.1, h: 0.4, d: 0.3, x: 0.36, y: 0.5, z: 0, farbe: "#1f2f52" },
      { teil: "beinL", w: 0.2, h: 0.1, d: 0.3, x: -0.16, y: 0.05, z: -0.05, farbe: "#ff9a3c" },
      { teil: "beinR", w: 0.2, h: 0.1, d: 0.3, x: 0.16, y: 0.05, z: -0.05, farbe: "#ff9a3c" }
    ]
  },
  glutfunke: {
    verhalten: "kamikaze", lp: function(s){ return 10 + 4 * s; }, schaden: function(s){ return 6 + 1.8 * s; },
    tempo: 5.0, breite: 0.5, hoehe: 0.6, sicht: 18, zuend: { reichweite: 2, zeit: 1.0 }, explosion: { radius: 4 },
    beute: { chance: 0.1 }, teile: [{ block: SC.B.GLUTSTAHL, chance: 0.35, menge: [1, 1] }], orte: ["nacht", "dungeon"], laut: "krabbler",
    modell: [
      { teil: "kern", w: 0.4, h: 0.4, d: 0.4, x: 0, y: 0.32, z: 0, farbe: "#ff6a1a", leuchtet: true },
      { teil: "glut", w: 0.5, h: 0.5, d: 0.5, x: 0, y: 0.32, z: 0, farbe: "#ffb04a", leuchtet: true },
      { teil: "augen", w: 0.3, h: 0.08, d: 0.02, x: 0, y: 0.36, z: -0.27, farbe: "#ffffff", leuchtet: true },
      { teil: "funkeL", w: 0.1, h: 0.25, d: 0.1, x: -0.15, y: 0.7, z: 0, farbe: "#ffe14a", leuchtet: true },
      { teil: "funkeR", w: 0.1, h: 0.2, d: 0.1, x: 0.15, y: 0.68, z: 0.05, farbe: "#ffe14a", leuchtet: true }
    ]
  },
  schneewerfer: {
    verhalten: "fernkampf", lp: function(s){ return 22 + 8 * s; }, schaden: function(s){ return 3 + 1 * s; },
    tempo: 2.4, breite: 0.9, hoehe: 1.7, sicht: 22, abstand: [8, 13],
    waffe: { art: "spucke", rate: 2.0, tempo: 13, streuung: 0.08, farbe: "#eaf6ff" },
    beute: { chance: 0.3 }, teile: [{ block: SC.B.CHITIN, chance: 0.4, menge: [1, 2] }], orte: ["station", "lager"], laut: "spucker",
    modell: [
      { teil: "unten", w: 0.9, h: 0.6, d: 0.9, x: 0, y: 0.3, z: 0, farbe: "#f4f8ff" },
      { teil: "mitte", w: 0.7, h: 0.5, d: 0.7, x: 0, y: 0.85, z: 0, farbe: "#eaf2fb" },
      { teil: "kopf", w: 0.5, h: 0.45, d: 0.5, x: 0, y: 1.35, z: 0, farbe: "#f4f8ff" },
      { teil: "nase", w: 0.1, h: 0.1, d: 0.3, x: 0, y: 1.33, z: -0.38, farbe: "#ff9a3c" },
      { teil: "augen", w: 0.34, h: 0.07, d: 0.02, x: 0, y: 1.45, z: -0.26, farbe: "#222833" },
      { teil: "hut", w: 0.5, h: 0.25, d: 0.5, x: 0, y: 1.7, z: 0, farbe: "#2a2f3a" },
      { teil: "armL", w: 0.1, h: 0.1, d: 0.5, x: -0.45, y: 0.9, z: -0.1, farbe: "#6b4a2b" },
      { teil: "armR", w: 0.1, h: 0.1, d: 0.5, x: 0.45, y: 0.9, z: -0.1, farbe: "#6b4a2b" }
    ]
  },
  frostgolem: {
    verhalten: "nahkampf", lp: function(s){ return 70 + 22 * s; }, schaden: function(s){ return 5 + 1.5 * s; },
    tempo: 1.6, breite: 1.6, hoehe: 2.4, sicht: 18, hieb: { reichweite: 2.6, rate: 1.6 },
    stampf: { radius: 3.5, rate: 5 },
    beute: { chance: 0.4 }, teile: [{ block: SC.B.TITAN, chance: 0.25, menge: [1, 1] }], orte: ["herrenhaus", "dungeon"], laut: null,
    modell: [
      { teil: "rumpf", w: 1.3, h: 1.2, d: 0.9, x: 0, y: 1.5, z: 0, farbe: "#9fd0f0" },
      { teil: "eis", w: 1.0, h: 0.3, d: 0.7, x: 0, y: 2.2, z: 0, farbe: "#d8f0ff" },
      { teil: "kopf", w: 0.7, h: 0.55, d: 0.6, x: 0, y: 2.3, z: -0.1, farbe: "#b8e0f8" },
      { teil: "augen", w: 0.5, h: 0.09, d: 0.02, x: 0, y: 2.35, z: -0.41, farbe: "#ffb04a", leuchtet: true },
      { teil: "armL", w: 0.4, h: 1.3, d: 0.5, x: -0.8, y: 1.35, z: 0, farbe: "#86bce0" },
      { teil: "armR", w: 0.4, h: 1.3, d: 0.5, x: 0.8, y: 1.35, z: 0, farbe: "#86bce0" },
      { teil: "beinL", w: 0.5, h: 0.9, d: 0.55, x: -0.35, y: 0.45, z: 0, farbe: "#6a9cc4" },
      { teil: "beinR", w: 0.5, h: 0.9, d: 0.55, x: 0.35, y: 0.45, z: 0, farbe: "#6a9cc4" }
    ]
  },
  glutflatterer: {
    verhalten: "schweber", fliegt: true, schwebehoehe: 3.5, lp: function(s){ return 16 + 6 * s; }, schaden: function(s){ return 2.5 + 0.8 * s; },
    tempo: 3.2, breite: 1.2, hoehe: 0.6, sicht: 24, abstand: [6, 11],
    waffe: { art: "laser", rate: 1.5, tempo: 26, streuung: 0.12, farbe: "#ff9a3c" },
    beute: { chance: 0.25 }, teile: [{ block: SC.B.GLUTSTAHL, chance: 0.3, menge: [1, 1] }], orte: ["station", "nacht"], laut: null,
    modell: [
      { teil: "rumpf", w: 0.4, h: 0.35, d: 0.7, x: 0, y: 0.35, z: 0, farbe: "#e0502a" },
      { teil: "kopf", w: 0.3, h: 0.3, d: 0.3, x: 0, y: 0.42, z: -0.45, farbe: "#ff8a3c" },
      { teil: "schnabel", w: 0.1, h: 0.08, d: 0.2, x: 0, y: 0.38, z: -0.65, farbe: "#ffd24a" },
      { teil: "auge", w: 0.2, h: 0.06, d: 0.02, x: 0, y: 0.46, z: -0.61, farbe: "#ffffff", leuchtet: true },
      { teil: "fluegelL", w: 0.6, h: 0.05, d: 0.5, x: -0.45, y: 0.42, z: 0, farbe: "#ff5a1a", leuchtet: true },
      { teil: "fluegelR", w: 0.6, h: 0.05, d: 0.5, x: 0.45, y: 0.42, z: 0, farbe: "#ff5a1a", leuchtet: true },
      { teil: "schweif", w: 0.2, h: 0.1, d: 0.6, x: 0, y: 0.32, z: 0.6, farbe: "#ffb04a", leuchtet: true }
    ]
  },
  moorirrlicht: {
    verhalten: "schweber", fliegt: true, schwebehoehe: 2.5, lp: function(s){ return 14 + 5 * s; }, schaden: function(s){ return 2.5 + 0.8 * s; },
    tempo: 2.8, breite: 0.5, hoehe: 0.5, sicht: 24, abstand: [7, 12],
    waffe: { art: "laser", rate: 1.6, tempo: 22, streuung: 0.1, farbe: "#9dff7a" },
    beute: { chance: 0.2 }, teile: [{ block: SC.B.MOORSILBER, chance: 0.3, menge: [1, 1] }], orte: ["nacht", "dungeon"], laut: null,
    modell: [
      { teil: "kern", w: 0.3, h: 0.3, d: 0.3, x: 0, y: 0.3, z: 0, farbe: "#d8ffb0", leuchtet: true },
      { teil: "halo", w: 0.5, h: 0.5, d: 0.5, x: 0, y: 0.3, z: 0, farbe: "#7cff6a", leuchtet: true },
      { teil: "augen", w: 0.22, h: 0.06, d: 0.02, x: 0, y: 0.33, z: -0.26, farbe: "#1f4a1a" },
      { teil: "schweif", w: 0.14, h: 0.14, d: 0.5, x: 0, y: 0.28, z: 0.4, farbe: "#9dff7a", leuchtet: true }
    ]
  },
  pilzling: {
    verhalten: "kamikaze", lp: function(s){ return 16 + 6 * s; }, schaden: function(s){ return 4.5 + 1.4 * s; },
    tempo: 3.6, breite: 0.7, hoehe: 0.9, sicht: 18, zuend: { reichweite: 1.8, zeit: 1.2 }, explosion: { radius: 3.6 },
    beute: { chance: 0.15 }, teile: [{ block: SC.B.MOORSILBER, chance: 0.3, menge: [1, 1] }], orte: ["nacht", "lager"], laut: "krabbler",
    modell: [
      { teil: "stiel", w: 0.4, h: 0.5, d: 0.4, x: 0, y: 0.25, z: 0, farbe: "#f2e8d0" },
      { teil: "hut", w: 0.9, h: 0.35, d: 0.9, x: 0, y: 0.68, z: 0, farbe: "#d8443c" },
      { teil: "punkteA", w: 0.2, h: 0.04, d: 0.2, x: -0.2, y: 0.87, z: -0.1, farbe: "#fff6e0", leuchtet: true },
      { teil: "punkteB", w: 0.2, h: 0.04, d: 0.2, x: 0.2, y: 0.87, z: 0.15, farbe: "#fff6e0", leuchtet: true },
      { teil: "augen", w: 0.3, h: 0.07, d: 0.02, x: 0, y: 0.3, z: -0.21, farbe: "#222833" },
      { teil: "beinL", w: 0.14, h: 0.14, d: 0.2, x: -0.12, y: 0.07, z: 0, farbe: "#c9b896" },
      { teil: "beinR", w: 0.14, h: 0.14, d: 0.2, x: 0.12, y: 0.07, z: 0, farbe: "#c9b896" }
    ]
  },
  lianenwuerger: {
    verhalten: "nahkampf", lp: function(s){ return 45 + 16 * s; }, schaden: function(s){ return 4 + 1.2 * s; },
    tempo: 0, breite: 0.8, hoehe: 1.7, sicht: 9, hieb: { reichweite: 3.8, rate: 1.1 },
    beute: { chance: 0.3 }, teile: [{ block: SC.B.MOORSILBER, chance: 0.35, menge: [1, 1] }], orte: ["dungeon", "herrenhaus"], laut: "krabbler",
    modell: [
      { teil: "stamm", w: 0.7, h: 1.2, d: 0.7, x: 0, y: 0.6, z: 0, farbe: "#3a5a22" },
      { teil: "kopf", w: 0.8, h: 0.5, d: 0.7, x: 0, y: 1.45, z: -0.05, farbe: "#4f7a2e" },
      { teil: "maul", w: 0.5, h: 0.14, d: 0.02, x: 0, y: 1.35, z: -0.41, farbe: "#2a0f1a" },
      { teil: "augen", w: 0.5, h: 0.08, d: 0.02, x: 0, y: 1.6, z: -0.41, farbe: "#c8ff4a", leuchtet: true },
      { teil: "rankeL", w: 0.18, h: 0.18, d: 1.6, x: -0.5, y: 0.9, z: -0.9, farbe: "#2f4a22" },
      { teil: "rankeR", w: 0.18, h: 0.18, d: 1.6, x: 0.5, y: 0.9, z: -0.9, farbe: "#2f4a22" },
      { teil: "blume", w: 0.3, h: 0.3, d: 0.3, x: 0.3, y: 1.65, z: 0, farbe: "#ff6fd8", leuchtet: true }
    ]
  },
  moosmutter: {
    verhalten: "fernkampf", lp: function(s){ return 40 + 14 * s; }, schaden: function(s){ return 2 + 0.7 * s; },
    tempo: 2.0, breite: 1.2, hoehe: 2.2, sicht: 22, abstand: [8, 13],
    waffe: { art: "spucke", rate: 2.6, tempo: 11, streuung: 0.06, farbe: "#b8e86a" },
    heilt: { rate: 4, radius: 10, anteil: 0.3 },
    beute: { chance: 0.3 }, teile: [{ block: SC.B.MOORSILBER, chance: 0.35, menge: [1, 2] }], orte: ["station", "herrenhaus"], laut: "spucker",
    modell: [
      { teil: "rumpf", w: 1.0, h: 1.1, d: 0.8, x: 0, y: 1.0, z: 0, farbe: "#4a6a3a" },
      { teil: "moos", w: 1.1, h: 0.3, d: 0.9, x: 0, y: 1.65, z: 0, farbe: "#55aa38" },
      { teil: "kopf", w: 0.6, h: 0.5, d: 0.55, x: 0, y: 1.85, z: -0.1, farbe: "#6a8a4a" },
      { teil: "augen", w: 0.4, h: 0.08, d: 0.02, x: 0, y: 1.9, z: -0.38, farbe: "#c8ff4a", leuchtet: true },
      { teil: "blume", w: 0.3, h: 0.3, d: 0.3, x: -0.3, y: 2.2, z: 0, farbe: "#ff9ad8", leuchtet: true },
      { teil: "blume2", w: 0.25, h: 0.25, d: 0.25, x: 0.3, y: 2.15, z: 0.1, farbe: "#ffe14a", leuchtet: true },
      { teil: "armL", w: 0.3, h: 0.9, d: 0.3, x: -0.55, y: 1.0, z: 0, farbe: "#3a5a2a" },
      { teil: "armR", w: 0.3, h: 0.9, d: 0.3, x: 0.55, y: 1.0, z: 0, farbe: "#3a5a2a" },
      { teil: "beinL", w: 0.35, h: 0.5, d: 0.4, x: -0.25, y: 0.25, z: 0, farbe: "#33492a" },
      { teil: "beinR", w: 0.35, h: 0.5, d: 0.4, x: 0.25, y: 0.25, z: 0, farbe: "#33492a" }
    ]
  },
  dornenbock: {
    verhalten: "nahkampf", lp: function(s){ return 55 + 18 * s; }, schaden: function(s){ return 6 + 1.8 * s; },
    tempo: 3.2, breite: 1.0, hoehe: 1.2, sicht: 22, hieb: { reichweite: 1.8, rate: 1.2 },
    sturm: { min: 6, max: 16, rate: 6, dauer: 1.0 },
    beute: { chance: 0.25 }, teile: [{ block: SC.B.CHITIN, chance: 0.5, menge: [1, 2] }, { block: SC.B.MOORSILBER, chance: 0.25, menge: [1, 1] }], orte: ["lager", "nacht"], laut: "krabbler",
    modell: [
      { teil: "rumpf", w: 0.9, h: 0.7, d: 1.3, x: 0, y: 0.75, z: 0.05, farbe: "#6a4a2a" },
      { teil: "kopf", w: 0.6, h: 0.55, d: 0.55, x: 0, y: 0.85, z: -0.8, farbe: "#7a5a34" },
      { teil: "augen", w: 0.4, h: 0.08, d: 0.02, x: 0, y: 0.92, z: -1.09, farbe: "#ff5050", leuchtet: true },
      { teil: "hornL", w: 0.12, h: 0.12, d: 0.5, x: -0.25, y: 1.2, z: -0.95, farbe: "#e8dcc0" },
      { teil: "hornR", w: 0.12, h: 0.12, d: 0.5, x: 0.25, y: 1.2, z: -0.95, farbe: "#e8dcc0" },
      { teil: "dornen", w: 0.5, h: 0.25, d: 0.9, x: 0, y: 1.2, z: 0.1, farbe: "#3f8a2e" },
      { teil: "beinL", w: 0.25, h: 0.45, d: 0.3, x: -0.3, y: 0.22, z: -0.4, farbe: "#4a3318" },
      { teil: "beinR", w: 0.25, h: 0.45, d: 0.3, x: 0.3, y: 0.22, z: -0.4, farbe: "#4a3318" },
      { teil: "hinterL", w: 0.25, h: 0.45, d: 0.3, x: -0.3, y: 0.22, z: 0.5, farbe: "#4a3318" },
      { teil: "hinterR", w: 0.25, h: 0.45, d: 0.3, x: 0.3, y: 0.22, z: 0.5, farbe: "#4a3318" }
    ]
  }
};
