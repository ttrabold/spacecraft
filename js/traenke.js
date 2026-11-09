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
  SC.Trank.schluessel = function(kristall, pflanze){ return kristall + ":" + pflanze; };
  // → { kristall, pflanze } oder null bei ungültigem Schlüssel
  SC.Trank.teile = function(s){
    if(typeof s !== "string") return null;
    var t = s.split(":"); if(t.length !== 2 || !SC.TRANK.wirkung[t[0]] || !SC.PFLANZEN[t[1]]) return null;
    return { kristall: t[0], pflanze: t[1] };
  };
})();
