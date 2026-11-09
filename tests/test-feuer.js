// Lagerfeuer und Kamin (Spec 2026-11-09-feuer-design): Blöcke, Rezepte, Logik, Spielanbindung
var FEUER_IDS = function(){ return [SC.B.LAGERFEUER, SC.B.LAGERFEUER_AN, SC.B.KAMIN, SC.B.KAMIN_AN, SC.B.FEUERZEUG]; };
test("Feuer: Blöcke haben Namen, an/aus, Licht und Eigenschaften", function(){
  FEUER_IDS().forEach(function(id){ wahr(SC.BLOECKE[id] && SC.BLOECKE[id].name, "Block " + id); });
  gleich(SC.BLOECKE[SC.B.LAGERFEUER].brennt, false); gleich(SC.BLOECKE[SC.B.LAGERFEUER_AN].brennt, true); gleich(SC.BLOECKE[SC.B.KAMIN].brennt, false); gleich(SC.BLOECKE[SC.B.KAMIN_AN].brennt, true);
  gleich(SC.BLOECKE[SC.B.LAGERFEUER_AN].leuchten, 15); gleich(SC.BLOECKE[SC.B.KAMIN_AN].leuchten, 13); gleich(SC.BLOECKE[SC.B.LAGERFEUER].leuchten, 0); gleich(SC.BLOECKE[SC.B.KAMIN].leuchten, 0);
  gleich(SC.BLOECKE[SC.B.LAGERFEUER].feuer, "lager"); gleich(SC.BLOECKE[SC.B.KAMIN_AN].feuer, "kamin");
  gleich(SC.BLOECKE[SC.B.LAGERFEUER].fest, false, "Lagerfeuer durchgehbar"); gleich(SC.BLOECKE[SC.B.KAMIN].fest, true, "Kamin fest");
  wahr(SC.BLOECKE[SC.B.FEUERZEUG].nichtAufstellbar, "Feuerzeug nicht aufstellbar");
  var ids = Object.keys(SC.B).map(function(k){ return SC.B[k]; }); gleich(ids.filter(function(v, i){ return ids.indexOf(v) === i; }).length, ids.length, "IDs eindeutig"); wahr(Math.max.apply(null, ids) <= 255, "passt in ein Byte");
});
test("Feuer: Kacheln und Farben für alle Seiten vorhanden", function(){
  FEUER_IDS().forEach(function(id){ var b = SC.BLOECKE[id]; ["oben", "seite", "unten"].forEach(function(s){ wahr(SC.TEXTUREN[b.seiten[s]], "Kachel " + b.seiten[s]); wahr(SC.PALETTEN.start.texturen[b.seiten[s]], "Farben " + b.seiten[s]); }); });
  wahr(Object.keys(SC.TEXTUREN).length < 256, "Atlas voll");
});
test("Feuer: Abbauen ergibt immer die ausgeschaltete Form, alles ist abbaubar", function(){
  gleich(SC.Abbau.ergibt(SC.B.LAGERFEUER_AN), SC.B.LAGERFEUER); gleich(SC.Abbau.ergibt(SC.B.KAMIN_AN), SC.B.KAMIN); gleich(SC.Abbau.ergibt(SC.B.LAGERFEUER), SC.B.LAGERFEUER); gleich(SC.Abbau.ergibt(SC.B.KAMIN), SC.B.KAMIN);
  FEUER_IDS().forEach(function(id){ wahr(SC.Abbau.zeit(id) < Infinity, "abbaubar " + id); });
});
test("Feuer: Rezepte Lagerfeuer, Kamin und Feuerzeug sind herstellbar, mit Namen, Feuerzeug im Kreativ-Material", function(){
  function bau(id, liste){ var r = new SC.Rucksack(); liste.forEach(function(x){ r.lege(x); }); var e = SC.Crafting.herstelle(r, SC.Crafting.rezept(id), null, Math.random, 1); return { r: r, e: e }; }
  var a = bau("lagerfeuer", [{ block: SC.B.STAMM, anzahl: 3 }]); wahr(a.e.ok, "Lagerfeuer"); gleich(a.r.hat(SC.B.LAGERFEUER), 1); gleich(a.r.hat(SC.B.STAMM), 0);
  var k = bau("kamin", [{ block: SC.B.STEIN, anzahl: 6 }, { block: SC.B.STAMM, anzahl: 2 }]); wahr(k.e.ok, "Kamin"); gleich(k.r.hat(SC.B.KAMIN), 1);
  var f = bau("feuerzeug", [{ block: SC.B.EISENERZ, anzahl: 2 }, { block: SC.B.KRISTALL_ROT, anzahl: 1 }]); wahr(f.e.ok, "Feuerzeug"); gleich(f.r.hat(SC.B.FEUERZEUG), 1);
  gleich(bau("lagerfeuer", [{ block: SC.B.STAMM, anzahl: 2 }]).e.ok, false, "zu wenig Holz");
  ["lagerfeuer", "kamin", "feuerzeug"].forEach(function(id){ wahr(SC.T.rezeptName[id], "Name " + id); gleich(SC.Crafting.rezept(id).station, "werkbank"); });
  wahr(SC.CRAFTING_MATERIALIEN.indexOf(SC.B.FEUERZEUG) >= 0, "Feuerzeug im Kreativ-Reiter Materialien");
});
