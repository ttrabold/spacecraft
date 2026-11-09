// Zaubertränke (Spec 2026-11-09-zaubertraenke-design): Tabellen, Blöcke, Brauen, Wirkung, Verwandlung
test("Pflanzen: neun, drei je Planet, Blöcke vorhanden", function(){
  var ids = Object.keys(SC.PFLANZEN), je = { start: 0, glutfrost: 0, rankenmoor: 0 };
  gleich(ids.length, 9); gleich(SC.PFLANZEN_REIHE.length, 9);
  ids.forEach(function(i){ var p = SC.PFLANZEN[i]; je[p.planet]++; wahr(SC.BLOECKE[p.block] && SC.BLOECKE[p.block].name, "Block fehlt: " + i); wahr(p.name && p.teil && p.id === i, "Angaben fehlen: " + i); gleich(SC.PFLANZEN_REIHE.indexOf(i) >= 0, true); });
  gleich(je.start, 3); gleich(je.glutfrost, 3); gleich(je.rankenmoor, 3);
});
test("Wirkungen: sechs Kristalle, jede Art einmal, Farbe wie die Kristallfarbe", function(){
  var k = Object.keys(SC.TRANK.wirkung), arten = {};
  gleich(k.sort().join(), Object.keys(SC.CRAFTING_KRISTALLE).sort().join());
  k.forEach(function(n){ var w = SC.TRANK.wirkung[n]; arten[w.art] = true; gleich(w.farbe, SC.CRAFTING_KRISTALLE[n].farbe); wahr(w.wert !== undefined, "Wert fehlt: " + n); });
  gleich(Object.keys(arten).length, 6);
  gleich(SC.TRANK.dauer, 180);
});
test("Schlüssel: Hin und Zurück, ungültig gibt null", function(){
  var s = SC.Trank.schluessel("rot", "hasenklee"); gleich(s, "rot:hasenklee");
  var t = SC.Trank.teile(s); gleich(t.kristall, "rot"); gleich(t.pflanze, "hasenklee");
  gleich(SC.Trank.teile("rot:gibtesnicht"), null); gleich(SC.Trank.teile("x"), null); gleich(SC.Trank.teile(null), null); gleich(SC.Trank.teile("gibtes:hasenklee"), null);
});
test("Blöcke: Kessel, Flasche, Trank sind abbaubar und haben Kacheln", function(){
  [SC.B.KESSEL, SC.B.FLASCHE, SC.B.TRANK].concat(SC.PFLANZEN_REIHE.map(function(i){ return SC.PFLANZEN[i].block; })).forEach(function(id){
    var b = SC.BLOECKE[id]; wahr(b && b.name, "Block " + id); wahr(SC.Abbau.zeit(id) < Infinity, "abbaubar " + id);
    ["oben", "seite", "unten"].forEach(function(s){ wahr(SC.TEXTUREN[b.seiten[s]], "Kachel " + b.seiten[s]); });
    wahr(SC.PALETTEN.start.texturen[b.seiten.oben], "Farben " + b.seiten.oben);
  });
  wahr(SC.BLOECKE[SC.B.TRANK].nichtAufstellbar && SC.BLOECKE[SC.B.FLASCHE].nichtAufstellbar, "Flasche und Trank nicht aufstellbar");
  gleich(SC.BLOECKE[SC.B.HASENKLEE].form, "pflanze"); gleich(SC.BLOECKE[SC.B.HASENKLEE].fest, false);
  gleich(Object.keys(SC.TEXTUREN).length < 256, true);
});
