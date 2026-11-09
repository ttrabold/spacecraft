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
  // --- Pflanzen in der Welt: Beute, Wachsen und Nachwachsen ---
  var VON = {}; SC.PFLANZEN_REIHE.forEach(function(id){ VON[SC.PFLANZEN[id].block] = id; });
  SC.Trank.istPflanze = function(block){ return Object.prototype.hasOwnProperty.call(VON, block) ? VON[block] : null; };
  // Pflanze (Block) an einer Stelle der Landschaft: hash ist SC.hash3(...); nur etwa 6 von 1024 Säulen, je eine der drei Pflanzen des Planeten; 0 = keine
  SC.Trank.pflanzeAn = function(planetId, hash){
    var w = hash & 1023; if(w >= 6) return 0;
    var l = SC.PFLANZEN_REIHE.filter(function(i){ return SC.PFLANZEN[i].planet === planetId; });
    return l.length ? SC.PFLANZEN[l[w % l.length]].block : 0;
  };
  // Beute eines besiegten Gegners: eine Pflanze seines Planeten (Chance SC.TRANK.beuteChance, Bosse immer) → { block, anzahl } oder null; zf() liefert 0..1
  SC.Trank.beute = function(planetId, boss, zf){
    var l = SC.PFLANZEN_REIHE.filter(function(i){ return SC.PFLANZEN[i].planet === planetId; });
    if(!l.length || (!boss && !(zf() < SC.TRANK.beuteChance))) return null;
    return { block: SC.PFLANZEN[l[Math.floor(zf() * l.length) % l.length]].block, anzahl: 1 };
  };
  // Nachwachsen: gepflückte Pflanzen stehen als [x, y, z, block, fälligBei] in einer Liste je Planet (daten.nachwuchs[planetId], Spielzeit in s)
  SC.Trank.pflueckeMerken = function(liste, x, y, z, block, jetzt){ liste.push([x, y, z, block, jetzt + SC.TRANK.nachwuchs]); while(liste.length > 400) liste.shift(); };
  // Setzt fällige Pflanzen zurück: nur in geladenen Chunks, nur in freier Luft über festem Boden (was dort inzwischen gebaut wurde, bleibt; der Eintrag fällt dann weg) → Anzahl
  SC.Trank.nachwuchsTakt = function(welt, liste, jetzt){
    var n = 0;
    for(var i = liste.length - 1; i >= 0; i--){
      var e = liste[i]; if(e[4] > jetzt || !welt.istGeladen(e[0] >> 4, e[2] >> 4)) continue;
      liste.splice(i, 1);
      if(welt.holeBlock(e[0], e[1], e[2]) !== SC.B.LUFT) continue;
      var u = SC.BLOECKE[welt.holeBlock(e[0], e[1] - 1, e[2])]; if(!u || !u.fest) continue;
      if(welt.setzeBlock(e[0], e[1], e[2], e[3], "nachwuchs")) n++;
    }
    return n;
  };
  // Block-Ereignis der Welt: Pflücken durch den Spieler oder einen Gast (quelle "spieler" oder "netz:…") merken
  SC.Trank.beiBlock = function(daten, planetId, b){
    if(b.id !== SC.B.LUFT || !SC.Trank.istPflanze(b.alt) || !(b.quelle === "spieler" || /^netz:/.test(b.quelle || ""))) return;
    var l = daten.nachwuchs || (daten.nachwuchs = {}); if(!l[planetId]) l[planetId] = [];
    SC.Trank.pflueckeMerken(l[planetId], b.x, b.y, b.z, b.alt, daten.spielzeit || 0);
  };
  SC.Trank.schluessel = function(kristall, pflanze){ return kristall + ":" + pflanze; };
  // → { kristall, pflanze } oder null bei ungültigem Schlüssel
  SC.Trank.teile = function(s){
    if(typeof s !== "string") return null;
    var t = s.split(":"); var eigen = Object.prototype.hasOwnProperty;
    if(t.length !== 2 || !eigen.call(SC.TRANK.wirkung, t[0]) || !eigen.call(SC.PFLANZEN, t[1])) return null;
    return { kristall: t[0], pflanze: t[1] };
  };
})();
