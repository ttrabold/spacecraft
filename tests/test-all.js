// Stufe 5b: Raumschiff und Raumflug
test("Raumschiff: vier Sitze, unzerstörbar, steigt bis über die Grenzhöhe", function(){
  var d = SC.FAHRZEUGE.raumschiff; wahr(d && d.fliegt && d.unzerstoerbar, "fliegt, unzerstörbar"); gleich(d.sitze.length, 4); wahr(d.maxHoehe > SC.ALL_GRENZE, "maxHoehe"); wahr(d.geschuetz.schaden > 0);
  var w = fzWelt(), f = SC.Fahrzeug.neu(w, "raumschiff", [20, 60, 20], 0); SC.Fahrzeug.einsteigen(f, "a");
  var r = SC.Fahrzeug.schaden(w, f, 9999, 1); gleich(r.verpufft, false); gleich(f.panzerung, 0); gleich(f.weg, false); gleich(f.sitze[0], "a");
  fzLauf(w, f, { hoch: true }, 20); wahr(f.pos[1] > SC.ALL_GRENZE, "über der Grenze: " + f.pos[1]);
});
test("Raumschiff steht nur auf dem Startplaneten, einmal", function(){
  var w = new SC.Welt(new SC.Planet({ id: "start", seed: 1234 })), sp = SC.Spiel.startpunkt(w.planet);
  wahr(SC.Fahrzeug.sichereSchiff(w, sp), "angelegt"); gleich(SC.Fahrzeug.sichereSchiff(w, sp), false, "nicht doppelt");
  var f = w.fahrzeuge.get("schiff"); gleich(f.art, "raumschiff"); gleich(f.fundort, "schiff"); gleich(f.heim, null);
  var a = Math.hypot(f.pos[0] - sp[0], f.pos[2] - sp[2]); wahr(a >= 14 && a <= 21, "Abstand " + a); wahr(SC.Fahrzeug.frei(w, f.pos, SC.FAHRZEUGE.raumschiff.breite, SC.FAHRZEUGE.raumschiff.hoehe), "frei");
  var g = new SC.Welt(new SC.Planet({ id: "glutfrost", seed: 5 })); gleich(SC.Fahrzeug.sichereSchiff(g, SC.Spiel.startpunkt(g.planet)), false, "nicht auf Glutfrost");
});
test("Spiel: Raumschiff entsteht einmal pro Welt", function(){
  var sl = mspSlots(), s = mspSpielVoll(sl), d = SC.Spielstand.neu({ name: "R", seedText: "schiff", modus: "kreativ", figurName: "T" });
  s.starte(d); wahr(s.welt.fahrzeuge.get("schiff"), "Schiff da"); gleich(d.schiffErzeugt, true);
  s.welt.fahrzeuge.delete("schiff"); s.starte(d); gleich(s.welt.fahrzeuge.has("schiff"), false, "kein zweites, wenn es woanders ist");
});
test("Höhenfaktor: 0 am Boden, 1 an der Grenze", function(){ gleich(SC.Render.hoehenFaktor(60), 0); gleich(SC.Render.hoehenFaktor(128), 0); gleich(SC.Render.hoehenFaktor(SC.ALL_GRENZE), 1); wahr(Math.abs(SC.Render.hoehenFaktor((128 + SC.ALL_GRENZE) / 2) - 0.5) < 1e-9); gleich(SC.Render.hoehenFaktor(999), 1); });
