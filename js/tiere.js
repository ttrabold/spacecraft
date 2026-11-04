// Haustiere: Tabelle der Arten (je Planet eigene), Werte, Stärkung, Erfahrung und der Käfig. Spec: docs/superpowers/specs/2026-11-04-haustiere-design.md
// Gefangene Tiere liegen im Käfig der Figur (SC.Kaefig); draußen laufen sie als Wesen "tier" (js/haustiere.js). Zeiten laufen in Spielzeit.
SC.TIERE = {};
SC.Tier = {};
(function(){
  // Blockfigur: Rumpf, Kopf vorn (−z), vier Beine, Augen; o.ohr = [w,h,Abstand], o.schwanz = [w,h,d], o.extra = weitere Teile
  function modell(o){
    var f = o.farbe, b = o.bauch || f, rb = o.breite, rh = o.rumpf, rl = o.laenge, y = o.bein + rh / 2, k = o.kopf, ky = o.bein + rh * (o.kopfHoch || 0.85), kz = -rl / 2 - k * 0.3;
    var t = [
      { teil: "rumpf", w: rb, h: rh, d: rl, x: 0, y: y, z: 0, farbe: f },
      { teil: "bauch", w: rb * 0.9, h: rh * 0.3, d: rl * 0.8, x: 0, y: o.bein + rh * 0.2, z: 0, farbe: b },
      { teil: "kopf", w: k, h: k, d: k, x: 0, y: ky, z: kz, farbe: o.kopfFarbe || f },
      { teil: "augeL", w: k * 0.16, h: k * 0.16, d: 0.02, x: -k * 0.22, y: ky + k * 0.1, z: kz - k / 2, farbe: "#1b1b2a" },
      { teil: "augeR", w: k * 0.16, h: k * 0.16, d: 0.02, x: k * 0.22, y: ky + k * 0.1, z: kz - k / 2, farbe: "#1b1b2a" },
      { teil: "nase", w: k * 0.2, h: k * 0.14, d: 0.04, x: 0, y: ky - k * 0.1, z: kz - k / 2, farbe: o.nase || "#3a2a2a" }
    ];
    if(o.bein > 0){ var bw = Math.max(0.08, rb * 0.25), dx = rb / 2 - bw / 2, dz = rl / 2 - bw / 2, bf = o.beinFarbe || f; [["beinVL", -dx, -dz], ["beinVR", dx, -dz], ["beinHL", -dx, dz], ["beinHR", dx, dz]].forEach(function(p){ t.push({ teil: p[0], w: bw, h: o.bein, d: bw, x: p[1], y: o.bein / 2, z: p[2], farbe: bf }); }); }
    if(o.ohr){ var ow = o.ohr[0], oh = o.ohr[1], od = o.ohr[2] || k * 0.3; [-1, 1].forEach(function(s){ t.push({ teil: s < 0 ? "ohrL" : "ohrR", w: ow, h: oh, d: 0.06, x: s * od, y: ky + k / 2 + oh / 2 - 0.02, z: kz, farbe: o.ohrFarbe || f }); }); }
    if(o.schwanz) t.push({ teil: "schwanz", w: o.schwanz[0], h: o.schwanz[1], d: o.schwanz[2], x: 0, y: o.bein + rh * 0.8, z: rl / 2 + o.schwanz[2] / 2 - 0.02, farbe: o.schwanzFarbe || f });
    (o.extra || []).forEach(function(e){ t.push(e); });
    return t;
  }
  // art(id, Name, Planet, Seltenheit 0–2, Kampfstil, Leben×, Schaden×, Tempo, Breite, Höhe, Namensliste, Modell)
  function art(id, name, planet, seltenheit, stil, lpM, schM, tempo, breite, hoehe, namen, mod){
    SC.TIERE[id] = { name: name, planet: planet, seltenheit: seltenheit, stil: stil, tempo: tempo, breite: breite, hoehe: hoehe, namen: namen, modell: mod,
      lp: function(s){ return Math.round((18 + 7 * s) * lpM); }, schaden: function(s){ return Math.round((2 + 0.8 * s) * schM * 10) / 10; } };
  }
  // Heimat
  art("hase", "Hase", "start", 0, "ablenker", 0.7, 0.6, 4.6, 0.4, 0.7, ["Hoppel", "Schnuppel", "Wuschel"],
    modell({ farbe: "#d8c9b4", bauch: "#f2ece0", breite: 0.3, rumpf: 0.3, laenge: 0.45, bein: 0.16, kopf: 0.26, ohr: [0.07, 0.3], schwanz: [0.12, 0.12, 0.1], schwanzFarbe: "#ffffff", nase: "#e89aa8" }));
  art("frosch", "Frosch", "start", 0, "fern", 0.7, 0.9, 3.0, 0.4, 0.4, ["Quaki", "Hüpfi", "Plitsch"],
    modell({ farbe: "#5fbf4f", bauch: "#c8ec9a", breite: 0.34, rumpf: 0.24, laenge: 0.36, bein: 0.1, kopf: 0.28, kopfHoch: 0.7, nase: "#3d8f3d",
      extra: [{ teil: "augeOL", w: 0.1, h: 0.1, d: 0.1, x: -0.1, y: 0.42, z: -0.3, farbe: "#fff8c8" }, { teil: "augeOR", w: 0.1, h: 0.1, d: 0.1, x: 0.1, y: 0.42, z: -0.3, farbe: "#fff8c8" }] }));
  art("katze", "Katze", "start", 1, "nah", 0.9, 1.1, 4.2, 0.4, 0.55, ["Mieze", "Flocke", "Samtpfote", "Tigger"],
    modell({ farbe: "#d99b52", bauch: "#f5dcae", breite: 0.26, rumpf: 0.28, laenge: 0.55, bein: 0.2, kopf: 0.26, ohr: [0.08, 0.1, 0.09], schwanz: [0.07, 0.07, 0.45], nase: "#e89aa8" }));
  art("hund", "Hund", "start", 1, "nah", 1.2, 1.2, 4.0, 0.5, 0.7, ["Bello", "Waldi", "Struppi", "Rex"],
    modell({ farbe: "#a9794a", bauch: "#e2c9a2", breite: 0.32, rumpf: 0.34, laenge: 0.6, bein: 0.26, kopf: 0.3, ohr: [0.09, 0.2, 0.15], ohrFarbe: "#6e4a2a", schwanz: [0.08, 0.08, 0.3], nase: "#1b1b2a" }));
  art("fuchs", "Fuchs", "start", 1, "nah", 0.9, 1.1, 4.3, 0.45, 0.62, ["Rotfell", "Flinki", "Schlaui"],
    modell({ farbe: "#e0722a", bauch: "#fff0dc", breite: 0.28, rumpf: 0.3, laenge: 0.58, bein: 0.22, kopf: 0.27, ohr: [0.08, 0.14, 0.1], ohrFarbe: "#3a2a22", schwanz: [0.14, 0.14, 0.5], schwanzFarbe: "#e8803a", beinFarbe: "#3a2a22" }));
  art("eule", "Eule", "start", 2, "flieger", 0.7, 1.3, 3.4, 0.45, 0.6, ["Hugo", "Nachtfee", "Uhu"],
    modell({ farbe: "#8a6a46", bauch: "#e8d8b8", breite: 0.34, rumpf: 0.4, laenge: 0.3, bein: 0.08, kopf: 0.3, kopfHoch: 0.95, ohr: [0.06, 0.1, 0.1], nase: "#e8a82a", kopfFarbe: "#9a7a56",
      extra: [{ teil: "fluegelL", w: 0.06, h: 0.32, d: 0.24, x: -0.2, y: 0.32, z: 0, farbe: "#6e5434" }, { teil: "fluegelR", w: 0.06, h: 0.32, d: 0.24, x: 0.2, y: 0.32, z: 0, farbe: "#6e5434" }] }));
  art("igel", "Igel", "start", 0, "robust", 1.4, 0.7, 2.4, 0.4, 0.4, ["Stachel", "Pieks", "Knuddel"],
    modell({ farbe: "#7a5a3c", bauch: "#e8d2b0", breite: 0.36, rumpf: 0.3, laenge: 0.46, bein: 0.08, kopf: 0.2, kopfHoch: 0.6, kopfFarbe: "#d8b890", nase: "#1b1b2a",
      extra: [{ teil: "stachel", w: 0.38, h: 0.12, d: 0.4, x: 0, y: 0.4, z: 0.04, farbe: "#4a3626" }] }));
  // Glutfrost
  art("pinguin", "Pinguin", "glutfrost", 0, "fern", 0.9, 0.9, 3.0, 0.4, 0.62, ["Frostie", "Watschel", "Eismann"],
    modell({ farbe: "#2a3a55", bauch: "#f4f8ff", breite: 0.3, rumpf: 0.4, laenge: 0.26, bein: 0.08, kopf: 0.24, kopfHoch: 0.95, nase: "#f0a02a", beinFarbe: "#f0a02a",
      extra: [{ teil: "fluegelL", w: 0.05, h: 0.28, d: 0.16, x: -0.18, y: 0.34, z: 0, farbe: "#1e2a40" }, { teil: "fluegelR", w: 0.05, h: 0.28, d: 0.16, x: 0.18, y: 0.34, z: 0, farbe: "#1e2a40" }] }));
  art("schneefuchs", "Schneefuchs", "glutfrost", 1, "nah", 0.9, 1.15, 4.3, 0.45, 0.62, ["Schneeball", "Flöckchen", "Frostpfote"],
    modell({ farbe: "#eef4fa", bauch: "#ffffff", breite: 0.28, rumpf: 0.3, laenge: 0.58, bein: 0.22, kopf: 0.27, ohr: [0.08, 0.14, 0.1], ohrFarbe: "#c8d4e0", schwanz: [0.14, 0.14, 0.5], nase: "#1b1b2a", beinFarbe: "#c8d4e0" }));
  art("glutsalamander", "Glutsalamander", "glutfrost", 2, "fern", 0.9, 1.4, 3.2, 0.45, 0.4, ["Funke", "Glimmi", "Lavo"],
    modell({ farbe: "#3a2420", bauch: "#ff7a2a", breite: 0.3, rumpf: 0.22, laenge: 0.6, bein: 0.1, kopf: 0.26, kopfHoch: 0.7, nase: "#ff7a2a", schwanz: [0.12, 0.1, 0.5], schwanzFarbe: "#ff7a2a",
      extra: [{ teil: "glut1", w: 0.1, h: 0.04, d: 0.12, x: 0, y: 0.34, z: -0.1, farbe: "#ffb347", leuchtet: true }, { teil: "glut2", w: 0.1, h: 0.04, d: 0.12, x: 0, y: 0.34, z: 0.14, farbe: "#ffb347", leuchtet: true }] }));
  art("eisbaer", "Eisbärjunges", "glutfrost", 1, "robust", 1.6, 1.0, 3.2, 0.55, 0.7, ["Tapsi", "Brummel", "Eisbert"],
    modell({ farbe: "#f4f8fc", bauch: "#e4ecf4", breite: 0.4, rumpf: 0.4, laenge: 0.62, bein: 0.24, kopf: 0.32, ohr: [0.1, 0.1, 0.14], nase: "#1b1b2a", schwanz: [0.1, 0.1, 0.1] }));
  // Rankenmoor
  art("chamaeleon", "Chamäleon", "rankenmoor", 0, "ablenker", 0.8, 0.8, 3.6, 0.4, 0.4, ["Bunti", "Farbi", "Schlängel"],
    modell({ farbe: "#4fbf6f", bauch: "#b8e8a0", breite: 0.24, rumpf: 0.26, laenge: 0.5, bein: 0.1, kopf: 0.26, kopfHoch: 0.8, nase: "#2a8f4f", schwanz: [0.08, 0.08, 0.5], schwanzFarbe: "#3fa05f",
      extra: [{ teil: "kamm", w: 0.04, h: 0.1, d: 0.2, x: 0, y: 0.42, z: -0.3, farbe: "#e8a02a" }] }));
  art("schildkroete", "Moorschildkröte", "rankenmoor", 1, "robust", 1.7, 0.7, 2.0, 0.55, 0.4, ["Panzi", "Gemütlich", "Moosi"],
    modell({ farbe: "#4a6a3a", bauch: "#c8d49a", breite: 0.44, rumpf: 0.26, laenge: 0.56, bein: 0.08, kopf: 0.2, kopfHoch: 0.6, kopfFarbe: "#8aa65a", nase: "#2a3a1a", beinFarbe: "#8aa65a",
      extra: [{ teil: "panzer", w: 0.48, h: 0.18, d: 0.5, x: 0, y: 0.34, z: 0.02, farbe: "#6a8a4a" }] }));
  art("leuchtkaefer", "Leuchtkäfer-Schwarm", "rankenmoor", 2, "fern", 0.6, 1.4, 3.8, 0.5, 0.55, ["Glühwürmchen", "Flimmer", "Lichtli"],
    modell({ farbe: "#3a3a2a", bauch: "#e8f06a", breite: 0.14, rumpf: 0.12, laenge: 0.2, bein: 0.0, kopf: 0.12, kopfHoch: 0.5, nase: "#e8f06a",
      extra: [{ teil: "licht1", w: 0.1, h: 0.1, d: 0.1, x: 0, y: 0.45, z: 0.1, farbe: "#f4ff7a", leuchtet: true }, { teil: "licht2", w: 0.08, h: 0.08, d: 0.08, x: -0.2, y: 0.7, z: -0.1, farbe: "#f4ff7a", leuchtet: true }, { teil: "licht3", w: 0.08, h: 0.08, d: 0.08, x: 0.2, y: 0.6, z: 0.15, farbe: "#f4ff7a", leuchtet: true }, { teil: "licht4", w: 0.07, h: 0.07, d: 0.07, x: 0.05, y: 0.85, z: -0.2, farbe: "#f4ff7a", leuchtet: true }] }));
  art("affe", "Kleiner Affe", "rankenmoor", 1, "ablenker", 0.9, 1.0, 4.4, 0.4, 0.7, ["Bananas", "Kletti", "Mocki"],
    modell({ farbe: "#8a5a3a", bauch: "#e8c8a0", breite: 0.28, rumpf: 0.34, laenge: 0.3, bein: 0.2, kopf: 0.28, kopfHoch: 0.95, kopfFarbe: "#e8c8a0", ohr: [0.1, 0.1, 0.17], ohrFarbe: "#8a5a3a", schwanz: [0.06, 0.06, 0.5], nase: "#3a2a2a" }));

  // --- Zweite Runde (0.25.0): je Planet fünf weitere Arten ---
  // Heimat
  art("eichhoernchen", "Eichhörnchen", "start", 0, "ablenker", 0.7, 0.8, 4.4, 0.35, 0.55, ["Nussi", "Husch", "Zimtie"],
    modell({ farbe: "#b5652a", bauch: "#f2dcc0", breite: 0.22, rumpf: 0.26, laenge: 0.34, bein: 0.14, kopf: 0.22, kopfHoch: 0.9, ohr: [0.06, 0.1, 0.08], schwanz: [0.14, 0.4, 0.16], schwanzFarbe: "#9a4f1f", nase: "#2a1a1a" }));
  art("reh", "Reh", "start", 1, "nah", 1.0, 0.9, 4.6, 0.45, 1.0, ["Bambi", "Fleck", "Sprinti"],
    modell({ farbe: "#b98a56", bauch: "#f4e6cf", breite: 0.26, rumpf: 0.36, laenge: 0.7, bein: 0.5, kopf: 0.26, kopfHoch: 1.25, ohr: [0.08, 0.16, 0.12], schwanz: [0.08, 0.1, 0.1], schwanzFarbe: "#fff2dc", nase: "#2a1a1a", beinFarbe: "#8a6a40" }));
  art("schmetterling", "Schmetterling", "start", 2, "fern", 0.5, 1.2, 3.0, 0.4, 0.4, ["Flatter", "Bunti", "Falter"],
    modell({ farbe: "#3a2a2a", bauch: "#3a2a2a", breite: 0.1, rumpf: 0.12, laenge: 0.3, bein: 0, kopf: 0.1, kopfHoch: 0.5, nase: "#3a2a2a",
      extra: [{ teil: "fluegelL", w: 0.3, h: 0.28, d: 0.04, x: -0.2, y: 0.22, z: -0.05, farbe: "#ff8ad0" }, { teil: "fluegelR", w: 0.3, h: 0.28, d: 0.04, x: 0.2, y: 0.22, z: -0.05, farbe: "#ff8ad0" },
        { teil: "fluegelUL", w: 0.2, h: 0.18, d: 0.04, x: -0.16, y: 0.08, z: 0.1, farbe: "#8ad0ff" }, { teil: "fluegelUR", w: 0.2, h: 0.18, d: 0.04, x: 0.16, y: 0.08, z: 0.1, farbe: "#8ad0ff" }] }));
  art("ente", "Ente", "start", 0, "fern", 0.8, 0.9, 2.8, 0.4, 0.55, ["Quaki", "Paddel", "Schnatter"],
    modell({ farbe: "#f6d84a", bauch: "#fff6c8", breite: 0.3, rumpf: 0.26, laenge: 0.42, bein: 0.1, kopf: 0.22, kopfHoch: 1.5, nase: "#f08a1a", beinFarbe: "#f08a1a", schwanz: [0.1, 0.1, 0.1],
      extra: [{ teil: "schnabel", w: 0.14, h: 0.05, d: 0.12, x: 0, y: 0.45, z: -0.446, farbe: "#f08a1a" }] }));
  art("schaf", "Schaf", "start", 0, "robust", 1.5, 0.6, 3.2, 0.5, 0.7, ["Wolli", "Mäh", "Flauschi"],
    modell({ farbe: "#f4f4ec", bauch: "#f4f4ec", kopfFarbe: "#3a3a3a", beinFarbe: "#3a3a3a", breite: 0.42, rumpf: 0.4, laenge: 0.6, bein: 0.22, kopf: 0.24, kopfHoch: 0.8, ohr: [0.1, 0.06, 0.16], ohrFarbe: "#3a3a3a", nase: "#1b1b1b" }));
  // Glutfrost
  art("schneehase", "Schneehase", "glutfrost", 0, "ablenker", 0.7, 0.6, 4.6, 0.4, 0.7, ["Pustel", "Weißohr", "Flockhop"],
    modell({ farbe: "#f4f8fc", bauch: "#ffffff", breite: 0.3, rumpf: 0.3, laenge: 0.45, bein: 0.16, kopf: 0.26, ohr: [0.07, 0.3], ohrFarbe: "#e0e8f0", schwanz: [0.12, 0.12, 0.1], nase: "#e89aa8" }));
  art("robbe", "Robbe", "glutfrost", 1, "robust", 1.5, 0.8, 2.4, 0.5, 0.45, ["Plantsch", "Flossi", "Glitschi"],
    modell({ farbe: "#8a98a8", bauch: "#d8e0e8", breite: 0.36, rumpf: 0.3, laenge: 0.8, bein: 0.06, kopf: 0.28, kopfHoch: 0.8, nase: "#1b1b1b", schwanz: [0.2, 0.08, 0.2], beinFarbe: "#6a7888" }));
  art("rentier", "Rentier", "glutfrost", 1, "nah", 1.2, 1.0, 4.2, 0.5, 1.0, ["Rudi", "Blitzen", "Rotnase"],
    modell({ farbe: "#9a7a5a", bauch: "#e8dcc8", breite: 0.3, rumpf: 0.38, laenge: 0.7, bein: 0.5, kopf: 0.28, kopfHoch: 1.2, ohr: [0.08, 0.14, 0.14], nase: "#c01818", beinFarbe: "#6a5238",
      extra: [{ teil: "geweihL", w: 0.05, h: 0.3, d: 0.05, x: -0.12, y: 1.2, z: -0.434, farbe: "#7a5a3a" }, { teil: "geweihR", w: 0.05, h: 0.3, d: 0.05, x: 0.12, y: 1.2, z: -0.434, farbe: "#7a5a3a" }] }));
  art("schneeeule", "Schneeeule", "glutfrost", 2, "flieger", 0.7, 1.3, 3.4, 0.45, 0.6, ["Polar", "Schneewitt", "Hedwig"],
    modell({ farbe: "#f2f4f8", bauch: "#ffffff", kopfFarbe: "#ffffff", breite: 0.34, rumpf: 0.4, laenge: 0.3, bein: 0.08, kopf: 0.3, kopfHoch: 0.95, ohr: [0.06, 0.08, 0.1], nase: "#e8a82a",
      extra: [{ teil: "fluegelL", w: 0.06, h: 0.32, d: 0.24, x: -0.2, y: 0.32, z: 0, farbe: "#d0d8e4" }, { teil: "fluegelR", w: 0.06, h: 0.32, d: 0.24, x: 0.2, y: 0.32, z: 0, farbe: "#d0d8e4" }] }));
  art("lavakrabbe", "Lavakrabbe", "glutfrost", 1, "nah", 1.3, 1.1, 3.2, 0.5, 0.35, ["Zwick", "Knips", "Glutzange"],
    modell({ farbe: "#d8402a", bauch: "#ff8a3a", breite: 0.4, rumpf: 0.2, laenge: 0.36, bein: 0.12, kopf: 0.16, kopfHoch: 0.9, nase: "#ffb347",
      extra: [{ teil: "klaueL", w: 0.14, h: 0.1, d: 0.2, x: -0.3, y: 0.24, z: -0.28, farbe: "#ff5a2a" }, { teil: "klaueR", w: 0.14, h: 0.1, d: 0.2, x: 0.3, y: 0.24, z: -0.28, farbe: "#ff5a2a" }] }));
  // Rankenmoor
  art("papagei", "Papagei", "rankenmoor", 2, "flieger", 0.6, 1.3, 3.6, 0.4, 0.5, ["Lora", "Kunterbunt", "Paulchen"],
    modell({ farbe: "#e83a3a", bauch: "#f2d03a", kopfFarbe: "#e83a3a", breite: 0.3, rumpf: 0.34, laenge: 0.26, bein: 0.08, kopf: 0.22, kopfHoch: 0.95, nase: "#f4f0d0", schwanz: [0.08, 0.06, 0.4], schwanzFarbe: "#3a7ae8",
      extra: [{ teil: "fluegelL", w: 0.05, h: 0.3, d: 0.2, x: -0.18, y: 0.3, z: 0, farbe: "#3a7ae8" }, { teil: "fluegelR", w: 0.05, h: 0.3, d: 0.2, x: 0.18, y: 0.3, z: 0, farbe: "#3a7ae8" }] }));
  art("faultier", "Faultier", "rankenmoor", 1, "robust", 1.8, 0.5, 1.4, 0.5, 0.6, ["Schlafmütz", "Gemach", "Langsam"],
    modell({ farbe: "#9a8a6a", bauch: "#c8b890", kopfFarbe: "#d8c8a0", beinFarbe: "#7a6a4a", breite: 0.3, rumpf: 0.34, laenge: 0.5, bein: 0.18, kopf: 0.26, kopfHoch: 0.9, nase: "#2a2018" }));
  art("libelle", "Libelle", "rankenmoor", 1, "fern", 0.6, 1.1, 4.0, 0.4, 0.3, ["Zickzack", "Glitzer", "Surr"],
    modell({ farbe: "#2ab0a0", bauch: "#2ab0a0", breite: 0.08, rumpf: 0.08, laenge: 0.6, bein: 0, kopf: 0.12, kopfHoch: 0.5, nase: "#2ab0a0",
      extra: [{ teil: "fluegelL", w: 0.3, h: 0.03, d: 0.12, x: -0.2, y: 0.12, z: -0.08, farbe: "#bff4ff" }, { teil: "fluegelR", w: 0.3, h: 0.03, d: 0.12, x: 0.2, y: 0.12, z: -0.08, farbe: "#bff4ff" },
        { teil: "fluegelUL", w: 0.3, h: 0.03, d: 0.12, x: -0.2, y: 0.12, z: 0.1, farbe: "#bff4ff" }, { teil: "fluegelUR", w: 0.3, h: 0.03, d: 0.12, x: 0.2, y: 0.12, z: 0.1, farbe: "#bff4ff" }] }));
  art("laubfrosch", "Laubfrosch", "rankenmoor", 0, "fern", 0.7, 0.9, 3.0, 0.3, 0.35, ["Hüpsi", "Grünling", "Blubb"],
    modell({ farbe: "#3fd05a", bauch: "#e8fcb8", breite: 0.28, rumpf: 0.2, laenge: 0.3, bein: 0.08, kopf: 0.24, kopfHoch: 0.7, nase: "#2aa044",
      extra: [{ teil: "augeOL", w: 0.08, h: 0.08, d: 0.08, x: -0.08, y: 0.34, z: -0.24, farbe: "#fff8c8" }, { teil: "augeOR", w: 0.08, h: 0.08, d: 0.08, x: 0.08, y: 0.34, z: -0.24, farbe: "#fff8c8" }] }));
  art("jaguar", "Jaguar", "rankenmoor", 2, "nah", 1.3, 1.5, 4.8, 0.5, 0.7, ["Tigo", "Samtpfote", "Fleckchen"],
    modell({ farbe: "#e0a830", bauch: "#f6e6b0", breite: 0.34, rumpf: 0.34, laenge: 0.7, bein: 0.28, kopf: 0.3, ohr: [0.09, 0.09, 0.13], schwanz: [0.07, 0.07, 0.5], nase: "#2a1a1a",
      extra: [{ teil: "tupfen1", w: 0.09, h: 0.02, d: 0.09, x: -0.08, y: 0.63, z: -0.15, farbe: "#3a2410" }, { teil: "tupfen2", w: 0.09, h: 0.02, d: 0.09, x: 0.09, y: 0.63, z: 0.0, farbe: "#3a2410" }, { teil: "tupfen3", w: 0.09, h: 0.02, d: 0.09, x: -0.06, y: 0.63, z: 0.18, farbe: "#3a2410" }] }));

  SC.TIERE.eule.fliegt = true; SC.TIERE.eule.flughoehe = 1.8; SC.TIERE.leuchtkaefer.fliegt = true; SC.TIERE.leuchtkaefer.flughoehe = 1.4;
  [["schmetterling", 1.5], ["schneeeule", 1.8], ["papagei", 1.8], ["libelle", 1.2]].forEach(function(p){ SC.TIERE[p[0]].fliegt = true; SC.TIERE[p[0]].flughoehe = p[1]; });   // Flieger schweben statt zu laufen
  // Fortbewegung je Art: laufen (Standard), huepfen (hupf = Sprungkraft, pause = Wartezeit zwischen Sprüngen), watscheln, schleichen (stockend), schlaengeln, trippeln
  var GANG = { hase: ["huepfen", 6.5, 0.05, 0.15], frosch: ["huepfen", 7.5, 0.25, 0.5], affe: ["huepfen", 8, 0.1, 0.3], pinguin: ["watscheln"], chamaeleon: ["schleichen"], glutsalamander: ["schlaengeln"], igel: ["trippeln"], schildkroete: ["kriechen"],
    eichhoernchen: ["huepfen", 7, 0.1, 0.25], schneehase: ["huepfen", 6.8, 0.05, 0.15], laubfrosch: ["huepfen", 7, 0.25, 0.5], ente: ["watscheln"], robbe: ["schlaengeln"], lavakrabbe: ["trippeln"], faultier: ["kriechen"] };
  Object.keys(SC.TIERE).forEach(function(a){ var g = GANG[a]; SC.TIERE[a].gang = g ? g[0] : "laufen"; if(g && g[0] === "huepfen"){ SC.TIERE[a].hupf = g[1]; SC.TIERE[a].pause = [g[2], g[3]]; } });
  var EMOJI = { hase: "🐰", frosch: "🐸", katze: "🐱", hund: "🐶", fuchs: "🦊", eule: "🦉", igel: "🦔", pinguin: "🐧", schneefuchs: "🐺", glutsalamander: "🦎", eisbaer: "🐻", chamaeleon: "🦎", schildkroete: "🐢", leuchtkaefer: "🐞", affe: "🐵", eichhoernchen: "🐿", reh: "🦌", schmetterling: "🦋", ente: "🦆", schaf: "🐑", schneehase: "🐇", robbe: "🐬", rentier: "🦌", schneeeule: "🦉", lavakrabbe: "🦀", papagei: "🦜", faultier: "🦥", libelle: "🦗", laubfrosch: "🐸", jaguar: "🐆" };
  Object.keys(EMOJI).forEach(function(a){ SC.TIERE[a].emoji = EMOJI[a]; });
  [["frosch", "#7dff5a"], ["pinguin", "#d8f2ff"], ["glutsalamander", "#ff7a2a"], ["leuchtkaefer", "#f4ff7a"], ["eule", "#e8d8b0"], ["schmetterling", "#ffb0e8"], ["schneeeule", "#e8f4ff"], ["papagei", "#ffd84a"], ["libelle", "#7affd8"], ["laubfrosch", "#7dff5a"], ["ente", "#7ad0ff"]].forEach(function(p){ SC.TIERE[p[0]].schussFarbe = p[1]; });
  var T = SC.Tier;
  T.arten = function(planetId){ return Object.keys(SC.TIERE).filter(function(a){ return SC.TIERE[a].planet === planetId; }); };
  function neueId(){ return Math.floor(Math.random() * 4294967296).toString(36) + Date.now().toString(36); }
  // Neues Tier im Käfig-Format (drinnen, volles Leben, Vorschlagsname aus der Liste der Art)
  T.neu = function(artId, zf){
    var d = SC.TIERE[artId], z = typeof zf === "function" ? zf : Math.random, t = { id: neueId(), art: artId, name: d.namen[Math.floor(z() * d.namen.length)], stufe: 1, erfahrung: 0, lp: 0, draussen: false, koRest: 0, staerke: null };
    t.lp = T.werte(t).lpMax; return t;
  };
  var FAKTOR = { streicheln: 1.2, fuettern: 1.5 }, DAUER = { streicheln: 120, fuettern: 300 };
  // Leben und Schaden aus Art, Stufe und Stärkung
  T.werte = function(t){
    var d = SC.TIERE[t.art], f = t.staerke ? FAKTOR[t.staerke.art] || 1 : 1;
    return { lpMax: Math.round(d.lp(t.stufe) * f), schaden: Math.round(d.schaden(t.stufe) * f * 10) / 10 };
  };
  // Stärkung ersetzt die laufende (stapelt nicht); Füttern heilt auf volles Leben
  // → false, wenn eine laufende Fütterung (stärker) nicht durch Streicheln ersetzt wird
  T.staerken = function(t, wie){
    if(wie === "streicheln" && t.staerke && t.staerke.art === "fuettern") return false;
    t.staerke = { art: wie, rest: DAUER[wie] };
    if(wie === "fuettern"){ t.lp = T.werte(t).lpMax; t.futterNr = (t.futterNr || 0) + 1; }   // futterNr: der Gastgeber heilt das Wesen, wenn sich die Zahl ändert
    return true;
  };
  // Spielzeit vergeht: Stärkung und K.o.-Pause laufen ab
  T.zeit = function(t, dt){
    if(t.staerke){ t.staerke.rest -= dt; if(t.staerke.rest <= 0){ t.staerke = null; var m = T.werte(t).lpMax; if(t.lp > m) t.lp = m; } }
    if(t.koRest > 0){ t.koRest -= dt; if(t.koRest <= 0){ t.koRest = 0; t.lp = T.werte(t).lpMax; } }
  };
  // Erfahrung sammeln; die Stufe bleibt höchstens bei der des Besitzers (Rest wird gesammelt) → Zahl der Aufstiege
  T.gibErfahrung = function(t, xp, besitzerStufe){
    t.erfahrung += xp; var auf = 0, vor = T.werte(t).lpMax;
    while(t.stufe < besitzerStufe && t.stufe < SC.Werte.MAX_STUFE && t.erfahrung >= SC.Werte.erfahrungFuer(t.stufe)){ t.erfahrung -= SC.Werte.erfahrungFuer(t.stufe); t.stufe++; auf++; }
    if(auf && t.koRest <= 0) t.lp += T.werte(t).lpMax - vor;
    return auf;
  };
})();

// Käfig: das Haustier-Inventar der Figur, 18 Plätze; höchstens 3 Tiere gleichzeitig draußen
SC.Kaefig = function(plaetze){
  this.plaetze = [];
  for(var i = 0; i < SC.Kaefig.GROESSE; i++) this.plaetze.push(plaetze && plaetze[i] ? plaetze[i] : null);
};
SC.Kaefig.GROESSE = 54;   // 0.25.0: dreimal so viele Plätze (vorher 18); alte Spielstände werden beim Laden aufgefüllt
SC.Kaefig.DRAUSSEN = 3;
(function(){
  var C = SC.Kaefig.prototype;
  C.lege = function(t){ for(var i = 0; i < this.plaetze.length; i++) if(!this.plaetze[i]){ this.plaetze[i] = t; return true; } return false; };
  C.tier = function(id){ for(var i = 0; i < this.plaetze.length; i++) if(this.plaetze[i] && this.plaetze[i].id === id) return this.plaetze[i]; return null; };
  C.draussen = function(){ return this.plaetze.filter(function(t){ return t && t.draussen; }); };
  // "ok", "voll" (schon 3 draußen), "ko" (erholt sich noch) oder "fehlt"
  C.rauslassen = function(id){
    var t = this.tier(id); if(!t) return "fehlt";
    if(t.koRest > 0) return "ko";
    if(t.draussen) return "ok";
    if(this.draussen().length >= SC.Kaefig.DRAUSSEN) return "voll";
    t.draussen = true; return "ok";
  };
  C.zurueck = function(id){ var t = this.tier(id); if(t) t.draussen = false; };
  C.freilassen = function(id){ for(var i = 0; i < this.plaetze.length; i++) if(this.plaetze[i] && this.plaetze[i].id === id){ this.plaetze[i] = null; return true; } return false; };
  // Name getrimmt, 1–16 Zeichen, sonst bleibt der alte
  C.umbenennen = function(id, name){ var t = this.tier(id), n = String(name == null ? "" : name).trim(); if(t && n.length >= 1 && n.length <= 16){ t.name = n; return true; } return false; };
  C.alsDaten = function(){ return this.plaetze.map(function(t){ return t ? JSON.parse(JSON.stringify(t)) : null; }); };
})();
