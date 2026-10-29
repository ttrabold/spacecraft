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

// --- Sonnensystem, Kugel ↔ Torus ---
test("Kugel ↔ Torus hin und zurück", function(){
  ["start", "glutfrost", "rankenmoor"].forEach(function(id){
    for(var x = 0; x < 2048; x += 173) for(var z = 3; z < 2048; z += 191){
      var p = SC.All.zuKugel(id, x, z, 30), t = SC.All.zuTorus(id, p), dx = Math.abs(SC.mod(t.x - x + 1024, 2048) - 1024);
      wahr(dx < 1 && Math.abs(t.z - z) < 1, id + " " + x + "," + z + " → " + t.x.toFixed(1) + "," + t.z.toFixed(1));
      var c = SC.ALL.planeten[id], r = Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]); wahr(Math.abs(r - SC.ALL.radius - 30) < 1e-6, "Abstand");
    }
  });
});
test("Kugel ↔ Torus an Polen und Rändern", function(){
  var c = SC.ALL.planeten.glutfrost, R = SC.ALL.radius;
  [[0, R + 50, 0], [0, -(R + 50), 0], [R + 50, 0, 0], [R + 50, 0, -0.0001]].forEach(function(o){
    var t = SC.All.zuTorus("glutfrost", [c[0] + o[0], c[1] + o[1], c[2] + o[2]]); wahr(t.x >= 0 && t.x < 2048 && t.z >= 0 && t.z < 2048, "gültig: " + t.x + "," + t.z);
  });
});
test("Abstände: Nachbarplaneten bei Flugtempo 150 in 30–60 s", function(){
  [["start", "glutfrost"], ["start", "rankenmoor"]].forEach(function(p){
    var a = SC.ALL.planeten[p[0]], b = SC.ALL.planeten[p[1]], s = (Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) - 2 * SC.ALL.radius) / SC.ALL.tempo;
    wahr(s >= 30 && s <= 60, p.join("–") + ": " + s.toFixed(1) + " s");
  });
  var n = SC.All.naechster([SC.ALL.planeten.rankenmoor[0] + 500, SC.ALL.planeten.rankenmoor[1], SC.ALL.planeten.rankenmoor[2]]); gleich(n.id, "rankenmoor"); wahr(Math.abs(n.abstand - 100) < 1e-6);
});

// --- Flugablauf allein ---
function alSpiel(){ var sl = mspSlots(), s = mspSpielVoll(sl), d = SC.Spielstand.neu({ name: "Flug", seedText: "flug", modus: "survival", figurName: "Mia" }); s.starte(d); var f = s.welt.fahrzeuge.get("schiff"); s.spieler.pos = SC.Fahrzeug.aussteigePos(s.welt, f, 0); s.benutzen(); return { s: s, d: d, sl: sl, f: f }; }
function alE(o){ var e = { vor: false, zurueck: false, links: false, rechts: false, springen: false, sinken: false, ziel: false, sprung: false }; for(var k in o || {}) e[k] = o[k]; return e; }
function alAustritt(u){ u.f.pos[1] = SC.ALL_GRENZE + 1; u.s._fahren(alE(), 1 / 60, false); }
test("Austritt über der Grenzhöhe nur als Pilot im Raumschiff", function(){
  var u = alSpiel(), s = u.s; gleich(s._imFahrzeug().f, u.f); gleich(s.all, null);
  alAustritt(u); wahr(s.all, "im All"); gleich(s.all.phase, "all"); gleich(s.all.vonPlanet, "start");
  var c = SC.ALL.planeten.start, r = Math.hypot(s.all.pos[0] - c[0], s.all.pos[1] - c[1], s.all.pos[2] - c[2]); wahr(r > SC.ALL.radius * 1.25 && r < SC.ALL.radius * 1.5, "über dem Planeten: " + r);
  var u2 = alSpiel(), s2 = u2.s; s2.aussteigen(); var fl = SC.Fahrzeug.neu(s2.welt, "flieger", [u2.f.pos[0] + 12, SC.ALL_GRENZE + 1, u2.f.pos[2]], 0); SC.Fahrzeug.einsteigen(fl, s2._fzId()); s2._fahren(alE(), 1 / 60, false); gleich(s2.all, null, "Flieger fliegt nicht ins All");
});
test("Flug im All: Schub bis 150, Ziel wählen, Sprung kommt 2,5 R vor dem Ziel heraus", function(){
  var u = alSpiel(), s = u.s; alAustritt(u);
  for(var i = 0; i < 60; i++) s._allBild(alE({ vor: true }), 0.1, false); gleich(s.all.tempo, SC.ALL.tempo);
  s._allBild(alE({ ziel: true }), 0.016, false); gleich(s.all.ziel, "glutfrost"); s._allBild(alE({ ziel: true }), 0.016, false); gleich(s.all.ziel, "rankenmoor");
  s._allBild(alE({ sprung: true }), 0.016, false); gleich(s.all.phase, "sprung");
  for(var j = 0; j < 50 && s.all.phase === "sprung"; j++) s._allBild(alE(), 0.1, false);
  gleich(s.all.phase, "all"); var c = SC.ALL.planeten.rankenmoor, r = Math.hypot(s.all.pos[0] - c[0], s.all.pos[1] - c[1], s.all.pos[2] - c[2]); wahr(Math.abs(r - 2.5 * SC.ALL.radius) < 5, "Abstand " + r);
});
test("Sprung ohne Ziel", function(){
  var u = alSpiel(), s = u.s; alAustritt(u); s._allBild(alE({ sprung: true }), 0.016, false);
  gleich(s.all.phase, "all"); wahr(s.hinweise.indexOf(SC.T.allKeinZiel) >= 0, "Hinweis");
});
test("Eintritt: neuer Planet, Schiff samt Insasse über der Anflugstelle", function(){
  var u = alSpiel(), s = u.s; alAustritt(u); s.all.pos = SC.All.zuKugel("glutfrost", 500, 900, 40);
  s._allBild(alE(), 0.016, false); wahr(s._eintrittP, "Eintritt läuft");
  return s._eintrittP.then(function(){
    gleich(s.all, null); gleich(s.welt.planet.id, "glutfrost"); var f = s.welt.fahrzeuge.get("schiff"); wahr(f, "Schiff mitgekommen");
    wahr(Math.abs(f.pos[0] - 500) < 2 && Math.abs(f.pos[2] - 900) < 2, "über der Anflugstelle: " + f.pos); gleich(f.pos[1], SC.ALL_GRENZE - 10);
    var im = s._imFahrzeug(); wahr(im && im.f === f && im.sitz === 0, "sitzt als Pilot"); gleich(s.daten.planeten.start.fahrzeuge.schiff, undefined, "nicht mehr auf dem Startplaneten");
  });
});
test("Speichern im All lädt am Landepunkt", function(){
  var u = alSpiel(), s = u.s, lp = s.landepunkt(); alAustritt(u);
  return s.speichere("test").then(function(){ return u.sl.lade(u.d.id); }).then(function(d2){
    gleich(d2.aktuellerPlanet, "start"); wahr(Math.hypot(d2.spieler.pos[0] - lp[0], d2.spieler.pos[2] - lp[2]) < 1 && Math.abs(d2.spieler.pos[1] - lp[1]) < 1, "Spieler am Landepunkt");
    var sch = d2.planeten.start.fahrzeuge.schiff; wahr(sch, "Schiff gespeichert"); wahr(Math.hypot(sch.pos[0] - lp[0], sch.pos[2] - lp[2]) < 24 && sch.pos[1] < SC.ALL_GRENZE - 20, "Schiff am Boden nahe Landepunkt");
    wahr(s.all, "Flug läuft weiter");
  });
});
