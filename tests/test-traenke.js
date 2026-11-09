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

// --- Rucksack: Tränke stapeln nach Kristall und Pflanze ---
function trankSache(s, n){ return { block: SC.B.TRANK, anzahl: n || 1, trank: s }; }
test("Rucksack: gleiche Tränke stapeln, verschiedene nicht", function(){
  var r = new SC.Rucksack();
  gleich(r.lege(trankSache("rot:hasenklee", 2)), 0); gleich(r.lege(trankSache("rot:hasenklee", 2)), 0);
  gleich(r.plaetze[0].anzahl, 4); gleich(r.plaetze[0].trank, "rot:hasenklee"); gleich(r.plaetze[1], null);
  gleich(r.lege(trankSache("gelb:hasenklee", 1)), 0); gleich(r.plaetze[1].trank, "gelb:hasenklee"); gleich(r.plaetze[1].anzahl, 1);
  gleich(r.hatTrank("rot:hasenklee"), 4); gleich(r.hatTrank("gelb:hasenklee"), 1); gleich(r.hatTrank("blau:eisblume"), 0);
});
test("Rucksack: nimm einer Teilmenge behält den Trank-Schlüssel", function(){
  var r = new SC.Rucksack(); r.lege(trankSache("blau:eisblume", 5));
  var n = r.nimm(0, 2); gleich(n.trank, "blau:eisblume"); gleich(n.anzahl, 2); gleich(r.plaetze[0].anzahl, 3); gleich(r.plaetze[0].trank, "blau:eisblume");
});
test("Rucksack: Tränke und Blöcke ohne trank stapeln unverändert", function(){
  var r = new SC.Rucksack(); gleich(r.lege({ block: SC.B.STEIN, anzahl: 70 }), 0); gleich(r.plaetze[0].anzahl, 64); gleich(r.plaetze[1].anzahl, 6);
  wahr(r.plaetze[0].trank === undefined, "kein trank-Feld bei Blöcken");
  var r2 = new SC.Rucksack([{ block: SC.B.TRANK, anzahl: 1 }]); gleich(r2.lege(trankSache("rot:hasenklee", 1)), 0); gleich(r2.plaetze[1].trank, "rot:hasenklee");   // alter Platz ohne trank bleibt eigener Stapel
});
test("Rucksack: passt und alsDaten mit Trank", function(){
  var r = new SC.Rucksack(); for(var i = 0; i < 36; i++) r.lege({ gegenstand: { id: "g" + i } });
  gleich(r.passt(trankSache("rot:hasenklee", 1)), false);
  var r2 = new SC.Rucksack(); r2.lege(trankSache("rot:hasenklee", 3)); var d = JSON.parse(JSON.stringify(r2.alsDaten())); var r3 = new SC.Rucksack(d);
  gleich(r3.hatTrank("rot:hasenklee"), 3); gleich(r3.passt(trankSache("rot:hasenklee", 61)), true); gleich(r3.passt(trankSache("rot:hasenklee", 61 * 40)), false);
});

// --- Rezepte und Brauen ---
function rucksackMit(liste){ var r = new SC.Rucksack(); liste.forEach(function(x){ r.lege(x); }); return r; }
test("Rezepte: Kessel und Flasche sind an der Werkbank herstellbar", function(){
  var k = SC.Crafting.rezept("kessel"), f = SC.Crafting.rezept("flasche");
  gleich(k.ergibt.block, SC.B.KESSEL); gleich(k.ergibt.anzahl, 1); gleich(f.ergibt.block, SC.B.FLASCHE); gleich(f.ergibt.anzahl, 3); gleich(k.station, "werkbank"); gleich(f.station, "werkbank");
  var r = rucksackMit([{ block: SC.B.EISENERZ, anzahl: 6 }, { block: SC.B.BRETTER, anzahl: 2 }, { block: SC.B.GLAS, anzahl: 2 }]);
  wahr(SC.Crafting.herstelle(r, k, null, Math.random, 1).ok, "Kessel"); wahr(SC.Crafting.herstelle(r, f, null, Math.random, 1).ok, "Flasche");
  gleich(r.hat(SC.B.KESSEL), 1); gleich(r.hat(SC.B.FLASCHE), 3); gleich(r.hat(SC.B.EISENERZ), 0);
});
test("Brauen: verbraucht je eine Zutat und legt einen Trank ab", function(){
  var r = rucksackMit([{ block: SC.B.FLASCHE, anzahl: 2 }, { block: SC.B.KRISTALL_ROT, anzahl: 1 }, { block: SC.B.HASENKLEE, anzahl: 3 }]);
  var e = SC.Crafting.brauen(r, "rot", "hasenklee"); gleich(e.ok, true); gleich(e.schluessel, "rot:hasenklee");
  gleich(r.hatTrank("rot:hasenklee"), 1); gleich(r.hat(SC.B.FLASCHE), 1); gleich(r.hat(SC.B.KRISTALL_ROT), 0); gleich(r.hat(SC.B.HASENKLEE), 2);
});
test("Brauen: fehlende Zutat ändert nichts", function(){
  var r = rucksackMit([{ block: SC.B.KRISTALL_ROT, anzahl: 1 }, { block: SC.B.HASENKLEE, anzahl: 1 }]), vorher = JSON.stringify(r.alsDaten());
  var e = SC.Crafting.brauen(r, "rot", "hasenklee"); gleich(e.ok, false); gleich(e.grund, "zutat"); gleich(JSON.stringify(r.alsDaten()), vorher);
  var r2 = rucksackMit([{ block: SC.B.FLASCHE, anzahl: 1 }, { block: SC.B.HASENKLEE, anzahl: 1 }]); gleich(SC.Crafting.brauen(r2, "rot", "hasenklee").grund, "zutat");
});
test("Brauen: voller Rucksack verliert keine Zutaten", function(){
  var r = new SC.Rucksack(); r.lege({ block: SC.B.FLASCHE, anzahl: 1 }); r.lege({ block: SC.B.KRISTALL_ROT, anzahl: 2 }); r.lege({ block: SC.B.HASENKLEE, anzahl: 2 });
  for(var i = 0; i < 40; i++) r.lege({ gegenstand: { id: "g" + i } });
  wahr(r.plaetze.every(Boolean), "Rucksack voll");
  var vorher = JSON.stringify(r.alsDaten()), e = SC.Crafting.brauen(r, "rot", "hasenklee");
  gleich(e.ok, true, "die Flasche gibt beim Verbrauch einen Platz frei, der Trank passt dorthin");   // Flasche war ein Einzelplatz: Platz frei, Trank passt
  gleich(r.hatTrank("rot:hasenklee"), 1);
  var r2 = new SC.Rucksack(); r2.lege({ block: SC.B.FLASCHE, anzahl: 2 }); r2.lege({ block: SC.B.KRISTALL_ROT, anzahl: 2 }); r2.lege({ block: SC.B.HASENKLEE, anzahl: 2 });
  for(i = 0; i < 40; i++) r2.lege({ gegenstand: { id: "g" + i } });
  var v2 = JSON.stringify(r2.alsDaten()); gleich(SC.Crafting.brauen(r2, "rot", "hasenklee").grund, "voll"); gleich(JSON.stringify(r2.alsDaten()), v2);
});
test("Brauen: unbekannter Kristall oder unbekannte Pflanze", function(){
  var r = rucksackMit([{ block: SC.B.FLASCHE, anzahl: 1 }, { block: SC.B.KRISTALL_ROT, anzahl: 1 }, { block: SC.B.HASENKLEE, anzahl: 1 }]), vorher = JSON.stringify(r.alsDaten());
  gleich(SC.Crafting.brauen(r, "pink", "hasenklee").grund, "zutat"); gleich(SC.Crafting.brauen(r, "rot", "gibtesnicht").grund, "zutat"); gleich(SC.Crafting.brauen(r, undefined, undefined).grund, "zutat"); gleich(SC.Crafting.brauen(r, "constructor", "hasenklee").grund, "zutat"); gleich(SC.Crafting.brauen(r, "rot", "__proto__").grund, "zutat"); gleich(SC.Trank.teile("constructor:hasenklee"), null); gleich(SC.Trank.teile("rot:toString"), null); gleich(JSON.stringify(r.alsDaten()), vorher);
});
