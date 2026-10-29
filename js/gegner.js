// Gegnertabelle: jede Art ist ein Eintrag – neue Arten kommen hier dazu, ohne Umbau.
// Modell: Blockfigur aus Teilen (Maße und Mitte relativ zu den Füßen), Farben fest je Art.
SC.GEGNER = {
  patrouillendroide: {
    verhalten: "fernkampf", lp: function(s){ return 30 + 12 * s; }, schaden: function(s){ return 3 + 1 * s; },
    tempo: 2.6, breite: 0.7, hoehe: 1.9, sicht: 24, abstand: [8, 14],
    waffe: { art: "laser", rate: 1.5, tempo: 30, streuung: 0.14, farbe: "#ff4f4f" },
    beute: { chance: 0.35 }, orte: ["station"], laut: "droide",
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
    beute: { chance: 0.35 }, orte: ["lager"], laut: null,
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
    beute: { chance: 0.2 }, orte: ["dungeon", "nacht"], laut: "krabbler",
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
    beute: { chance: 0.3 }, orte: ["dungeon", "nacht", "kristallfeld"], laut: "spucker",
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
    beute: { chance: 0.35 }, orte: ["glutfrost"], laut: null,
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
    beute: { chance: 0.2 }, orte: ["glutfrost"], laut: "krabbler",
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
    beute: { chance: 1 }, orte: ["glutfrost"], laut: null,
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
    beute: { chance: 0.3 }, orte: ["rankenmoor"], laut: "krabbler",
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
    beute: { chance: 0.3 }, orte: ["rankenmoor"], laut: "spucker",
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
    beute: { chance: 1 }, orte: ["rankenmoor"], laut: null,
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
  }
};
