// Zaubertränke (Spec 2026-11-09-zaubertraenke-design.md): Tabellen und reine Logik, ohne Oberfläche (Fenster: js/ui-kessel.js)
// Ein Trank entsteht aus Flasche + Kristall (Wirkung und Leuchtfarbe) + Pflanze (Tier-Teile); er ist durch den Schlüssel "kristall:pflanze" bestimmt.
SC.PFLANZEN = {};
SC.PFLANZEN_REIHE = [];
SC.Trank = {};
(function(){
  var B = SC.B;
  // pflanze(id, Block, Planet, Name, Tier-Teil): die Tier-Teile baut SC.Figur.verwandle (js/render-mitspieler.js)
  function pflanze(id, block, planet, name, teil){ SC.PFLANZEN[id] = { id: id, block: block, planet: planet, name: name, teil: teil }; SC.PFLANZEN_REIHE.push(id); }
  pflanze("hasenklee", B.HASENKLEE, "start", "Hasenklee", "hasenohren");
  pflanze("katzenminze", B.KATZENMINZE, "start", "Katzenminze", "katzenoehrchen");
  pflanze("fuchsgras", B.FUCHSGRAS, "start", "Fuchsgras", "fuchsohren");
  pflanze("eisblume", B.EISBLUME, "glutfrost", "Eisblume", "eisbaerohren");
  pflanze("frostbeere", B.FROSTBEERE, "glutfrost", "Frostbeere", "pinguinfluegel");
  pflanze("glutmohn", B.GLUTMOHN, "glutfrost", "Glutmohn", "salamanderschwanz");
  pflanze("federfarn", B.FEDERFARN, "rankenmoor", "Federfarn", "papageienfedern");
  pflanze("quakblume", B.QUAKBLUME, "rankenmoor", "Quakblume", "froschaugen");
  pflanze("dschungelranke", B.DSCHUNGELRANKE, "rankenmoor", "Dschungelranke", "affenschwanz");
  // Zahlen sind Vorschläge und lassen sich hier einstellen. dauer in Sekunden Spielzeit; nachwuchs = Wartezeit, bis eine gepflückte Pflanze wieder wächst
  var K = SC.CRAFTING_KRISTALLE;
  SC.TRANK = {
    dauer: 180, beuteChance: 0.15, nachwuchs: 600,
    wirkung: {
      gelb: { art: "tempo", wert: 30, farbe: K.gelb.farbe },          // Prozent mehr Lauftempo
      gruen: { art: "sprung", wert: 1.4, farbe: K.gruen.farbe },      // Faktor auf die Sprungkraft
      rot: { art: "schaden", wert: 25, farbe: K.rot.farbe },          // Prozent mehr Schaden
      blau: { art: "schild", wert: 30, farbe: K.blau.farbe },         // zusätzliche Schildpunkte
      violett: { art: "schweben", wert: 0.35, farbe: K.violett.farbe }, // Faktor auf die Schwerkraft (langsames Fallen)
      weiss: { art: "nachtsicht", wert: 1, farbe: K.weiss.farbe }     // die Figur trägt ein Licht
    }
  };
  // Zustand eines laufenden Tranks: { kristall, pflanze, rest } (rest = Sekunden Spielzeit) oder null
  SC.Trank.neu = function(s){ var t = SC.Trank.teile(s); return t ? { kristall: t.kristall, pflanze: t.pflanze, rest: SC.TRANK.dauer } : null; };
  // Aus einem Spielstand: nur gültige Zustände mit Restzeit > 0 (alte Stände ohne Feld, Müll → null); die Restzeit wird auf die Dauer begrenzt
  SC.Trank.pruefe = function(z){
    if(!z || typeof z !== "object" || typeof z.rest !== "number" || !(z.rest > 0) || !SC.Trank.teile(SC.Trank.schluessel(z.kristall, z.pflanze))) return null;
    return { kristall: z.kristall, pflanze: z.pflanze, rest: Math.min(z.rest, SC.TRANK.dauer) };
  };
  // Zählt die Restzeit herunter; null, wenn der Trank abgelaufen ist
  SC.Trank.zeit = function(z, dt){ if(!z) return null; z.rest -= dt; return z.rest > 0 ? z : null; };
  // Werte, die der Trank der Figur gibt (nur die Art des Kristalls ist gesetzt)
  SC.Trank.bonus = function(z){
    var b = { tempo: 0, schaden: 0, schild: 0, sprung: 1, schwerkraft: 1, nachtsicht: false }, w = z && SC.TRANK.wirkung[z.kristall];
    if(!w) return b;
    if(w.art === "tempo") b.tempo = w.wert; else if(w.art === "schaden") b.schaden = w.wert; else if(w.art === "schild") b.schild = w.wert;
    else if(w.art === "sprung") b.sprung = w.wert; else if(w.art === "schweben") b.schwerkraft = w.wert; else if(w.art === "nachtsicht") b.nachtsicht = true;
    return b;
  };
  // Anzeigename, z. B. "Hasenklee-Trank (Du machst mehr Schaden.)"; ohne gültigen Schlüssel "Zaubertrank"
  SC.Trank.name = function(s){ var t = SC.Trank.teile(s); return t ? SC.PFLANZEN[t.pflanze].name + "-Trank (" + SC.T.trankWirkungLang[SC.TRANK.wirkung[t.kristall].art] + ")" : SC.BLOECKE[SC.B.TRANK].name; };
  SC.Trank.schluessel = function(kristall, pflanze){ return kristall + ":" + pflanze; };
  // → { kristall, pflanze } oder null bei ungültigem Schlüssel
  SC.Trank.teile = function(s){
    if(typeof s !== "string") return null;
    var t = s.split(":"); var eigen = Object.prototype.hasOwnProperty;
    if(t.length !== 2 || !eigen.call(SC.TRANK.wirkung, t[0]) || !eigen.call(SC.PFLANZEN, t[1])) return null;
    return { kristall: t[0], pflanze: t[1] };
  };
})();
