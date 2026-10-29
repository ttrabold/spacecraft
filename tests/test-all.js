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
  gleich(s.all.phase, "all"); var info = null; s.ui.cockpit = function(i){ info = i; }; s._allBild(alE(), 0.016, false); wahr(info && info.mahnen, "Cockpit blinkt");
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

// --- Asteroiden und Piraten ---
test("Asteroidenfelder deterministisch und zwischen den Planeten", function(){
  var a = SC.All.asteroiden(5), b = SC.All.asteroiden(5), P = SC.ALL.planeten; gleich(JSON.stringify(a), JSON.stringify(b)); wahr(a.length >= 120 && a.length <= 240, "Anzahl " + a.length);
  var mitten = [["start", "glutfrost"], ["start", "rankenmoor"], ["glutfrost", "rankenmoor"]].map(function(p){ var x = P[p[0]], y = P[p[1]]; return [(x[0] + y[0]) / 2, (x[1] + y[1]) / 2, (x[2] + y[2]) / 2]; });
  a.forEach(function(s){ wahr(s.r >= 6 && s.r <= 20); wahr(mitten.some(function(m){ return Math.hypot(s.pos[0] - m[0], s.pos[1] - m[1], s.pos[2] - m[2]) <= 650; }), "nahe einer Feldmitte"); });
  gleich(JSON.stringify(SC.All.asteroiden(6)) === JSON.stringify(a), false, "anderer Seed, andere Felder");
});
function alVor(s, d){ var a = s.all, f = [-Math.sin(a.blick) * Math.cos(a.neigung), Math.sin(a.neigung), -Math.cos(a.blick) * Math.cos(a.neigung)]; return [a.pos[0] + f[0] * d, a.pos[1] + f[1] * d, a.pos[2] + f[2] * d]; }
test("Asteroid kostet Schild, prallt ab", function(){
  var u = alSpiel(), s = u.s; alAustritt(u); s.all.tempo = 100; s._allAsteroiden = [{ pos: alVor(s, 12), r: 10 }];
  s._allBild(alE(), 0.05, false); gleich(u.f.panzerung, SC.FAHRZEUGE.raumschiff.panzerung - 25); wahr(s.all.tempo <= 20, "abgebremst");
  s._allBild(alE(), 0.05, false); gleich(u.f.panzerung, SC.FAHRZEUGE.raumschiff.panzerung - 25, "nicht gleich nochmal");
});
test("Piraten greifen an, Bordlaser besiegt sie, Beute im Rucksack", function(){
  var u = alSpiel(), s = u.s; alAustritt(u); s.all.tempo = 0; s._allAsteroiden = [];
  s._piratenRufen(); wahr(s._allPiraten.length >= 2 && s._allPiraten.length <= 3, "Gruppe"); s._allPiraten = s._allPiraten.slice(0, 1); s._allPiraten[0].pos = alVor(s, 60); s._allPiraten[0].halt = true;
  var vorher = s.kampf.rucksack.plaetze.filter(function(p){ return p && p.gegenstand; }).length;
  for(var i = 0; i < 80 && s._allPiraten.length; i++) s._allBild(alE({ abbauen: true, abbauenGehalten: true }), 0.05, false);
  gleich(s._allPiraten.length, 0, "besiegt"); wahr(s.kampf.rucksack.plaetze.filter(function(p){ return p && p.gegenstand; }).length > vorher, "Beute im Rucksack");
});
test("Notsprung statt Verpuffen", function(){
  var u = alSpiel(), s = u.s, lp = s.landepunkt(), ruck = JSON.stringify(s.kampf.rucksack.alsDaten()); alAustritt(u); s.all.tempo = 100; u.f.panzerung = 10; s._allAsteroiden = [{ pos: alVor(s, 12), r: 10 }];
  s._allBild(alE(), 0.05, false);
  gleich(s.all, null, "zurück"); gleich(s.welt.planet.id, "start"); var f = s.welt.fahrzeuge.get("schiff"); wahr(f && !f.weg, "Schiff da"); wahr(Math.hypot(f.pos[0] - lp[0], f.pos[2] - lp[2]) < 30 && f.pos[1] < 120, "am Landepunkt am Boden");
  var im = s._imFahrzeug(); wahr(im && im.f === f, "sitzt im Schiff"); gleich(JSON.stringify(s.kampf.rucksack.alsDaten()), ruck); wahr(s.hinweise.indexOf(SC.T.allNotsprung) >= 0);
});

// --- Gemeinsam fliegen ---
function agZwei(){
  return mspZwei().then(function(u){
    u.f = u.h.welt.fahrzeuge.get("schiff"); u.h.spieler.pos = SC.Fahrzeug.aussteigePos(u.h.welt, u.f, 0); u.h.benutzen(); u.h._raumBild(0.1, false);
    return mspLauf(u.netz).then(function(){ return u; });
  });
}
function agGastRein(u){
  u.g._raumBild(0.1, false); var fg = u.g.welt.fahrzeuge.get("schiff"); u.g.spieler.pos = SC.Fahrzeug.aussteigePos(u.g.welt, fg, 1); u.g._raumBild(0.1, false);
  return mspLauf(u.netz).then(function(){ u.g.benutzen(); return mspLauf(u.netz); }).then(function(){ u.h._raumBild(0.1, false); return mspLauf(u.netz); }).then(function(){ u.g._raumBild(0.1, false); return u; });
}
test("Gemeinsam: Austritt nur mit allen an Bord", function(){
  var u;
  return agZwei().then(function(x){ u = x; u.f.pos[1] = SC.ALL_GRENZE + 1; u.h._fahren(alE(), 1 / 60, false);
    gleich(u.h.all, null, "Gast fehlt"); wahr(u.f.pos[1] < SC.ALL_GRENZE, "Halt an der Grenze"); wahr(u.h.hinweise.indexOf(SC.T.allAlleAnBord) >= 0); return agGastRein(u);
  }).then(function(){ wahr(u.g._imFahrzeug(), "Gast sitzt"); u.f.pos[1] = SC.ALL_GRENZE + 1; u.h._fahren(alE(), 1 / 60, false); wahr(u.h.all, "jetzt ins All"); }).then(mspFertig, mspFehler);
});
test("Gemeinsam: Gast sieht den Raumflug des Gastgebers", function(){
  var u;
  return agZwei().then(agGastRein).then(function(x){ u = x; u.f.pos[1] = SC.ALL_GRENZE + 1; u.h._fahren(alE(), 1 / 60, false); u.h._allBild(alE({ vor: true }), 0.1, false); u.h._raumBild(0.1, false); return mspLauf(u.netz); })
  .then(function(){ u.g._raumBild(0.1, false); wahr(u.g.all && u.g.all.zuschauer, "Gast im All als Mitfahrer");
    var a = u.g.all.pos, b = u.h.all.pos; wahr(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 1, "gleiche Lage"); }).then(mspFertig, mspFehler);
});
test("Gemeinsam: Gast fliegt, Gastgeber übernimmt den Raumflug-Zustand", function(){
  var u;
  return mspZwei().then(function(x){ u = x; u.f = u.h.welt.fahrzeuge.get("schiff"); u.h._raumBild(0.1, false); return mspLauf(u.netz); }).then(function(){
    u.g._raumBild(0.1, false); var fg = u.g.welt.fahrzeuge.get("schiff"); u.g.spieler.pos = SC.Fahrzeug.aussteigePos(u.g.welt, fg, 0); u.g._raumBild(0.1, false); return mspLauf(u.netz);
  }).then(function(){ u.g.benutzen(); return mspLauf(u.netz); }).then(function(){ u.h._raumBild(0.1, false); return mspLauf(u.netz); }).then(function(){
    u.g._raumBild(0.1, false); gleich(u.g._imFahrzeug().sitz, 0, "Gast ist Pilot"); u.h.spieler.pos = SC.Fahrzeug.aussteigePos(u.h.welt, u.f, 1); u.h.benutzen(); u.h._raumBild(0.1, false); return mspLauf(u.netz);
  }).then(function(){ u.g._raumBild(0.1, false); var fg = u.g.welt.fahrzeuge.get("schiff"); fg.pos[1] = SC.ALL_GRENZE + 1; u.g._fahren(alE(), 1 / 60, false); wahr(u.g.all && !u.g.all.zuschauer, "Gast fliegt");
    u.g._raumBild(0.1, false); return mspLauf(u.netz);
  }).then(function(){ u.h._raumBild(0.1, false); wahr(u.h.all && u.h.all.zuschauer, "Gastgeber schaut zu"); }).then(mspFertig, mspFehler);
});
test("Gemeinsam: Eintritt bringt alle auf den Planeten, sitzend", function(){
  var u;
  return agZwei().then(agGastRein).then(function(x){ u = x; u.f.pos[1] = SC.ALL_GRENZE + 1; u.h._fahren(alE(), 1 / 60, false); u.h.all.pos = SC.All.zuKugel("glutfrost", 400, 800, 40); u.h._allBild(alE(), 0.016, false); return u.h._eintrittP; })
  .then(function(){ return mspLauf(u.netz, 4); }).then(function(){ u.h._raumBild(0.1, false); return mspLauf(u.netz); }).then(function(){
    u.g._raumBild(0.1, false); gleich(u.h.welt.planet.id, "glutfrost"); gleich(u.g.welt.planet.id, "glutfrost", "Gast mitgekommen");
    var im = u.g._imFahrzeug(); wahr(im && im.f.id === "schiff" && im.sitz === 1, "Gast sitzt wieder"); gleich(u.g.all, null);
  }).then(mspFertig, mspFehler);
});
test("Abriss im All", function(){
  var u;
  return agZwei().then(agGastRein).then(function(x){ u = x; u.f.pos[1] = SC.ALL_GRENZE + 1; u.h._fahren(alE(), 1 / 60, false); wahr(u.h.all); u.netz.trenne(u.g.raum.verb); return mspLauf(u.netz); })
  .then(function(){ var f = u.h.welt.fahrzeuge.get("schiff"); gleich(f.sitze[1], null, "Sitz frei"); wahr(u.h.all && u.h.all.phase === "all", "Flug geht weiter"); u.h._allBild(alE({ vor: true }), 0.1, false); wahr(u.h.all); }).then(mspFertig, mspFehler);
});
test("Im All kein Aussteigen und kein Planetenwechsel über F3", function(){
  var u = alSpiel(), s = u.s; alAustritt(u); gleich(s.benutzen(), false); wahr(s._imFahrzeug(), "sitzt noch");
  return s.wechslePlanet("glutfrost").then(function(){ wahr(false, "darf nicht gehen"); }, function(){ gleich(s.welt.planet.id, "start"); wahr(s.all, "noch im All"); });
});
test("All: Maus und Wischen lenken das Schiff, nicht bei offenem Menü (#92)", function(){
  var u = alSpiel(), s = u.s; alAustritt(u); var a = s.all, b0 = a.blick, n0 = a.neigung;
  s._allBild(alE({ blickDx: 0.3, blickDy: 0.2 }), 1 / 60, false);
  wahr(Math.abs(a.blick - b0 - 0.3) < 1e-9, "gieren"); wahr(Math.abs(a.neigung - n0 - 0.2) < 1e-9, "nicken");
  s._allBild(alE({ blickDx: 5, blickDy: 5 }), 1 / 60, false); wahr(a.neigung <= 1.2, "Nicken begrenzt");
  var b1 = a.blick; s._allBild(alE({ blickDx: 0.3 }), 1 / 60, true); gleich(a.blick, b1, "Menü offen");
});
test("All: Ziel über die Sternenkarte setzen, Anzeige bekommt Karte und Marker (#89, #90)", function(){
  var u = alSpiel(), s = u.s, info = null, beiZiel = null; s.ui.allKarte = function(i, f){ info = i; beiZiel = f; };
  s.render.allSzene = { marker: function(){ return [{ id: "glutfrost", x: 10, y: 20, aussen: true, winkel: 0 }]; } };
  alAustritt(u); s._allBild(alE(), 1 / 60, false);
  wahr(info, "Karte gezeigt"); gleich(info.planeten.length, SC.PLANET_REIHENFOLGE.length); wahr(info.schiff && typeof info.schiff.blick === "number", "Schiff auf der Karte");
  gleich(info.marker.length, 1); gleich(info.marker[0].name, SC.PLANETEN.glutfrost.name); wahr(/\d+ s/.test(info.marker[0].text), "Flugzeit im Marker");
  beiZiel("rankenmoor"); gleich(s.all.ziel, "rankenmoor"); beiZiel("start"); gleich(s.all.ziel, "start", "auch zurück nach Hause");
  s._allBild(alE(), 1 / 60, false); wahr(info.planeten.some(function(p){ return p.id === "start" && p.ziel; }), "Ziel hervorgehoben");
  s._allEnde(); gleich(info, null, "Karte weg nach dem Flug");
});
test("Entwickler: Planetenwechsel funktioniert auch im All (#91)", function(){
  var u = alSpiel(), s = u.s, div = document.createElement("div"); s.render.sichtweite = 6; s.render.chunks = new Map(); s.render.chunkGrenzen = false;
  alAustritt(u); wahr(s.all, "im All");
  var pn = new SC.Entwickler.Panel(div, s); pn.zeige(); div.querySelector("#ew-planet").value = "glutfrost"; div.querySelector('[data-ew="planet"]').click();
  return s._eintrittP.then(function(){ gleich(s.all, null, "aus dem All"); gleich(s.welt.planet.id, "glutfrost"); var im = s._imFahrzeug(); wahr(im && im.f.art === "raumschiff", "sitzt im Schiff"); });
});
test("All: Schnellleiste bleibt beim Ziel- und Sprungknopf stehen, HUD ohne Leiste", function(){
  var u = alSpiel(), s = u.s, ex = null; alAustritt(u); s.spieler.auswahl = 3; s.ui.hud = function(sp, e){ ex = e; }; s.entwickler = { offen: function(){ return false; } }; s.render.bild = function(){};
  s.eingabe.zustand = function(){ var e = alE({ ziel: true }); e.auswahl = null; e.auswahlRad = 1; e.blickDx = e.blickDy = 0; return e; };
  s._t0 = 0; s._bild(16); gleich(s.spieler.auswahl, 3, "keine Leistenwahl im All"); wahr(ex && ex.all, "HUD weiß vom All"); wahr(s.all.ziel, "Ziel gewählt");
});
test("All: nach Landung mit neuer Darstellung bekommt die neue Raumszene wieder Planeten", function(){
  var u = alSpiel(), s = u.s;
  function neueDarstellung(){ s.render.allSzene = null; s.render.allModus = function(an){ if(an && !this.allSzene) this.allSzene = { kugeln: [], setzePlaneten: function(){ this.gesetzt = (this.gesetzt || 0) + 1; } }; }; }
  neueDarstellung(); alAustritt(u); gleich(s.render.allSzene.gesetzt, 1, "erster Flug");
  s._allEnde(); neueDarstellung(); // Landung auf einem anderen Planeten: starte() legt eine neue Darstellung an
  u.f.pos[1] = SC.ALL_GRENZE + 1; s._fahren(alE(), 1 / 60, false); wahr(s.all, "wieder im All"); gleich(s.render.allSzene.gesetzt, 1, "zweiter Flug");
  s._allEnde(); u.f.pos[1] = SC.ALL_GRENZE + 1; s._fahren(alE(), 1 / 60, false); gleich(s.render.allSzene.gesetzt, 1, "gleiche Szene: nicht neu rechnen");
});
test("All: Laser feuert auch beim zweiten Flug sofort", function(){
  var u = alSpiel(), s = u.s; alAustritt(u);
  for(var i = 0; i < 600; i++) s._allBild(alE(), 0.05, false); // 30 s fliegen
  s._allBild(alE({ abbauen: true }), 0.05, false); wahr(s._allGeschosse.some(function(q){ return q.team === "spieler"; }), "erster Flug");
  s._allEnde(); alAustritt(u); s._allGeschosse = [];
  s._allBild(alE({ abbauen: true }), 0.05, false); wahr(s._allGeschosse.some(function(q){ return q.team === "spieler"; }), "zweiter Flug");
});
test("All: Ziel und fehlendes Ziel nur im Cockpit, keine doppelte Meldung", function(){
  var u = alSpiel(), s = u.s; alAustritt(u); s.hinweise.length = 0;
  s._allBild(alE({ sprung: true }), 1 / 60, false); s._allBild(alE({ ziel: true }), 1 / 60, false); s._zielSetzen("rankenmoor");
  gleich(s.hinweise.length, 0, s.hinweise.join(" | ")); gleich(s.all.ziel, "rankenmoor");
});
test("All: T schaltet reihum durch alle Planeten, auch den Startplaneten", function(){
  var u = alSpiel(), s = u.s; alAustritt(u); var gesehen = {};
  s._zielWechseln(); wahr(s.all.ziel && s.all.ziel !== "start", "erst ein anderer Planet: " + s.all.ziel);
  for(var i = 0; i < SC.PLANET_REIHENFOLGE.length; i++){ gesehen[s.all.ziel] = true; s._zielWechseln(); }
  gleich(Object.keys(gesehen).sort().join(), SC.PLANET_REIHENFOLGE.slice().sort().join());
});
