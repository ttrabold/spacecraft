// Fahren im Spiel (Stufe 4): Ein-/Aussteigen, Steuern, Ansicht, Sperren im Fahrzeug – Spiel ohne Darstellung (mspSpielVoll aus test-mehrspieler.js)
function fhSpiel(modus){
  var s = mspSpielVoll(mspSlots()), d = SC.Spielstand.neu({ name: "F", seedText: "fz", modus: modus || "survival", figurName: "Mia" });
  s.starte(d); var f = s.welt.fahrzeuge.get("start"); s.spieler.pos = [f.pos[0] + SC.FAHRZEUGE.gleiter.breite / 2 + 1, f.pos[1] - SC.FAHRZEUGE.gleiter.schwebt, f.pos[2]];
  return { s: s, f: f };
}
function fhE(o){ var e = { vor: false, zurueck: false, links: false, rechts: false, springen: false, sinken: false, abbauen: false, setzen: false, abbauenGehalten: false, setzenGehalten: false, ausweichen: false, blickDx: 0, blickDy: 0 }; for(var k in o || {}) e[k] = o[k]; return e; }

test("Fahren: Benutzen neben dem Start-Gleiter steigt als Fahrer ein, nochmal steigt aus", function(){
  var u = fhSpiel(), s = u.s, sp = s.spieler;
  wahr(s.benutzen(), "eingestiegen"); var im = s._imFahrzeug(); wahr(im && im.f === u.f && im.sitz === 0, "Fahrer");
  s._fahren(fhE(), 1 / 60, false); gleich(sp.sitzt, u.f.blick); wahr(sp.ruhePos, "Aussteigeposition gemerkt");
  wahr(s.benutzen(), "ausgestiegen"); gleich(s._imFahrzeug(), null); gleich(sp.ruhePos, null); gleich(sp.sitzt, null);
  wahr(SC.Fahrzeug.frei(s.welt, sp.pos), "steht frei"); wahr(SC.Fahrzeug.abstand(s.welt, u.f, sp.pos).waagerecht < 3.5, "neben dem Fahrzeug");
  sp.pos = [SC.mod(u.f.pos[0] + 30, 2048), sp.pos[1], sp.pos[2]]; gleich(s.benutzen(), false, "zu weit weg");
});
test("Fahren: Fahrer bewegt das Fahrzeug, Spieler sitzt mit", function(){
  var u = fhSpiel(), s = u.s, sp = s.spieler, x0 = u.f.pos.slice(); s.benutzen();
  for(var i = 0; i < 60; i++) s._fahren(fhE({ vor: true }), 1 / 60, false);
  wahr(Math.hypot(u.f.pos[0] - x0[0], u.f.pos[2] - x0[2]) > 2, "bewegt");
  var p = SC.Fahrzeug.sitzPos(u.f, 0, 2048); gleich(JSON.stringify(sp.pos), JSON.stringify(p));
  for(var j = 0; j < 30; j++) s._fahren(fhE({ vor: true }), 1 / 60, true); // Menü offen: kein Gas mehr
  var v = Math.hypot(u.f.geschw[0], u.f.geschw[2]); for(var k = 0; k < 30; k++) s._fahren(fhE({ vor: true }), 1 / 60, true); wahr(Math.hypot(u.f.geschw[0], u.f.geschw[2]) < v, "rollt aus");
});
test("Fahren: Im Fahrzeug kein Abbauen und Setzen", function(){
  var u = fhSpiel("kreativ"), s = u.s, sp = s.spieler; s.benutzen(); s._fahren(fhE(), 1 / 60, false);
  sp.blick = [u.f.blick, -0.3]; var a = sp.augen(), r = sp.richtung(), x = Math.floor(a[0] + r[0] * 3), y = Math.floor(a[1] + r[1] * 3), z = Math.floor(a[2] + r[2] * 3);
  s.welt.setzeBlock(x, y, z, SC.B.STEIN, "system");
  s._survival(fhE({ abbauen: true, abbauenGehalten: true }), 1 / 60, false, 1000); gleich(s.welt.holeBlock(x, y, z), SC.B.STEIN, "nicht abgebaut");
  var n = 0; for(var dx = -3; dx <= 3; dx++) for(var dy = -3; dy <= 3; dy++) for(var dz = -3; dz <= 3; dz++) if(s.welt.holeBlock(x + dx, y + dy, z + dz) === sp.schnellleiste[sp.auswahl]) n++;
  var vorher = n; s._survival(fhE({ setzen: true }), 1 / 60, false, 3000); n = 0;
  for(dx = -3; dx <= 3; dx++) for(dy = -3; dy <= 3; dy++) for(dz = -3; dz <= 3; dz++) if(s.welt.holeBlock(x + dx, y + dy, z + dz) === sp.schnellleiste[sp.auswahl]) n++;
  gleich(n, vorher, "nichts gesetzt");
});
test("Fahren: Zuschauer steigt aus und kann nicht einsteigen", function(){
  var u = fhSpiel("kreativ"), s = u.s; s.benutzen(); wahr(s._imFahrzeug()); s.modus("zuschauer"); gleich(s._imFahrzeug(), null, "ausgestiegen");
  gleich(s.benutzen(), false); gleich(u.f.sitze[0], null);
});
test("Fahren: Ansicht wechselt auf außen und zurück", function(){
  var u = fhSpiel(), s = u.s, sp = s.spieler; sp.ansicht = "ich"; s.benutzen(); gleich(sp.ansicht, "aussen"); s.benutzen(); gleich(sp.ansicht, "ich");
});
test("Fahren: Leeres Fahrzeug rollt beim Gastgeber bzw. allein aus, Flieger sinkt", function(){
  var u = fhSpiel(), s = u.s, f = SC.Fahrzeug.neu(s.welt, "flieger", [u.f.pos[0] + 8, u.f.pos[1] + 10, u.f.pos[2]], 0), y = f.pos[1];
  s._fahrzeugeBild(0.5); wahr(f.pos[1] < y, "sinkt");
});
test("Fahren: Blick dreht beim Lenken mit dem Fahrzeug mit", function(){
  var u = fhSpiel(), s = u.s, sp = s.spieler; s.benutzen(); var b0 = sp.blick[0] - u.f.blick;
  for(var i = 0; i < 60; i++) s._fahren(fhE({ vor: true }), 1 / 60, false);
  for(var j = 0; j < 30; j++) s._fahren(fhE({ vor: true, links: true }), 1 / 60, false);
  wahr(Math.abs(u.f.blick) > 0.5, "gelenkt"); wahr(Math.abs(sp.blick[0] - u.f.blick - b0) < 1e-9, "Blick folgt: " + (sp.blick[0] - u.f.blick));
});

// --- Kampf mit Fahrzeugen ---
test("Panzerung: Treffer auf Insassen gehen aufs Fahrzeug", function(){
  var u = fhSpiel(), s = u.s, k = s.kampf; s.benutzen(); s._fahren(fhE(), 1 / 60, false);
  var lp = k.werte.lp, r = k.trifftSpieler(10, [0, 0, 1], null);
  gleich(k.werte.lp, lp, "Spieler unverletzt"); wahr(r.fahrzeug, "umgeleitet"); gleich(SC.FAHRZEUGE.gleiter.panzerung - u.f.panzerung, 10 * SC.SCHWIERIGKEIT[s.daten.schwierigkeit].schaden, "genau einmal mit Schwierigkeit");
  s.aussteigen(); k.trifftSpieler(10, [0, 0, 1], null); wahr(k.werte.lp < lp, "draußen trifft es wieder den Spieler");
});
test("Panzerung: Kreativ nimmt keinen Schaden", function(){
  var u = fhSpiel("kreativ"), s = u.s; s.benutzen(); s.kampf.trifftSpieler(50, [0, 0, 1], null); gleich(u.f.panzerung, SC.FAHRZEUGE.gleiter.panzerung);
});
test("Panzerung: im Spiel verpufft, Spieler steht frei, Fahrzeug kommt wieder", function(){
  var u = fhSpiel(), s = u.s, sp = s.spieler; s.benutzen(); s._fahren(fhE(), 1 / 60, false);
  s.kampf.trifftSpieler(9999, [0, 0, 1], null);
  gleich(s._imFahrzeug(), null, "ausgestiegen"); gleich(u.f.weg, true); wahr(SC.Fahrzeug.frei(s.welt, sp.pos), "steht frei"); gleich(sp.sitzt, null);
  s.daten.spielzeit = u.f.wiederBei; s._fzTakt = 5; s._fahrzeugTakt(0); gleich(u.f.weg, false, "zurück am Fundort");
});
test("Bordgeschütz: Buggy schießt mit Abklingzeit, Gleiter hat keins", function(){
  var u = fhSpiel(), s = u.s, sp = s.spieler, P = 2048;
  var b = SC.Fahrzeug.neu(s.welt, "buggy", [SC.mod(u.f.pos[0] + 40, P), u.f.pos[1] + 5, u.f.pos[2]], 0);
  for(var i = 0; i < 120; i++) SC.Fahrzeug.schritt(s.welt, b, null, 1 / 60);
  sp.pos = SC.Fahrzeug.aussteigePos(s.welt, b, 0); s.benutzen(); gleich(s._imFahrzeug().f, b);
  function schuesse(){ var n = 0; s.welt.wesen.forEach(function(e){ if(e.art === "geschoss") n++; }); return n; }
  s._survival(fhE({ abbauen: true }), 1 / 60, false, 1000); s._survival(fhE({ abbauen: true }), 1 / 60, false, 1100); gleich(schuesse(), 1, "Abklingzeit");
  s._survival(fhE({ abbauen: true }), 1 / 60, false, 1400); gleich(schuesse(), 2, "danach wieder");
  var g = null; s.welt.wesen.forEach(function(e){ if(e.art === "geschoss") g = e; }); gleich(g.schaden, SC.FAHRZEUGE.buggy.geschuetz.schaden); gleich(g.team, "spieler");
  s.aussteigen(); s.welt.wesen.forEach(function(e, id){ s.welt.wesen.delete(id); });
  sp.pos = SC.Fahrzeug.aussteigePos(s.welt, u.f, 0); s.benutzen(); gleich(s._imFahrzeug().f, u.f);
  s._survival(fhE({ abbauen: true }), 1 / 60, false, 5000); gleich(schuesse(), 0, "Gleiter schießt nicht");
});

// --- Kreativ und Entwicklerwerkzeuge ---
function fhZiele(s, f){ var sp = s.spieler, d = SC.FAHRZEUGE[f.art], dx = f.pos[0] - sp.pos[0], dz = f.pos[2] - sp.pos[2], a = sp.augen(), dy = f.pos[1] + d.hoehe / 2 - a[1]; sp.blick = [Math.atan2(-dx, -dz), Math.atan2(dy, Math.hypot(dx, dz))]; }
test("Kreativ: Fahrzeug hinstellen und wieder entfernen", function(){
  var u = fhSpiel("kreativ"), s = u.s, sp = s.spieler; sp.blick = [Math.PI, 0];
  var f = s.fahrzeugHinstellen("buggy"); wahr(f && s.welt.fahrzeuge.get(f.id) === f, "steht"); wahr(/^frei-/.test(f.id)); gleich(f.fundort, null);
  var ab = SC.Fahrzeug.abstand(s.welt, f, sp.pos).waagerecht; wahr(ab > 1 && ab < 7, "vor dem Spieler: " + ab); wahr(SC.Fahrzeug.frei(s.welt, f.pos, 2.6, 2), "frei");
  fhZiele(s, f); s._survival(fhE({ abbauen: true, abbauenGehalten: true }), 1 / 60, false, 1000); gleich(s.welt.fahrzeuge.has(f.id), false, "entfernt");
});
test("Kreativ: Fundort-Fahrzeug und besetztes Fahrzeug lassen sich nicht entfernen", function(){
  var u = fhSpiel("kreativ"), s = u.s; fhZiele(s, u.f); s._survival(fhE({ abbauen: true, abbauenGehalten: true }), 1 / 60, false, 1000); wahr(s.welt.fahrzeuge.has("start"), "Fundort bleibt");
  s.spieler.blick = [Math.PI, 0]; var f = s.fahrzeugHinstellen("gleiter"); SC.Fahrzeug.einsteigen(f, "jemand"); fhZiele(s, f); s._survival(fhE({ abbauen: true, abbauenGehalten: true }), 1 / 60, false, 2000); wahr(s.welt.fahrzeuge.has(f.id), "besetzt bleibt");
});
test("Entwickler: Fahrzeug erscheinen lassen, Fahrzeuge weg schickt Fundort-Fahrzeuge heim", function(){
  var u = fhSpiel("survival"), s = u.s, div = document.createElement("div"); s.render.sichtweite = 6; s.render.chunks = new Map(); s.render.chunkGrenzen = false;
  var pn = new SC.Entwickler.Panel(div, s); pn.zeige(); div.querySelector("#ew-fz").value = "flieger"; div.querySelector('[data-ew="fahrzeug"]').click();
  var frei = []; s.welt.fahrzeuge.forEach(function(f){ if(!f.fundort) frei.push(f); }); gleich(frei.length, 1); gleich(frei[0].art, "flieger");
  u.f.pos = [u.f.pos[0] + 7, u.f.pos[1] + 3, u.f.pos[2]]; u.f.panzerung = 3;
  div.querySelector('[data-ew="fahrzeuge-weg"]').click(); gleich(s.welt.fahrzeuge.has(frei[0].id), false, "freies weg");
  gleich(JSON.stringify(u.f.pos), JSON.stringify(u.f.heim), "Fundort-Fahrzeug daheim"); gleich(u.f.panzerung, SC.FAHRZEUGE.gleiter.panzerung);
});
test("Blockauswahl: Reiter Fahrzeuge stellt hin", function(){
  var w = document.createElement("div"), ui = new SC.UI(w, {}), gew = []; ui.zeigeBlockauswahl(function(){}, { ausruestung: true, beiFahrzeug: function(a){ gew.push(a); } });
  var k = w.querySelectorAll('[data-aktion="fahrzeug"]'); gleich(k.length, Object.keys(SC.FAHRZEUGE).length); ui._klick(k[1]); gleich(gew[0], "buggy");
});

// --- Gemeinsam spielen ---
function fhE60(s, o, n){ for(var i = 0; i < (n || 60); i++) s._fahren(fhE(o), 1 / 60, false); }
test("Mehrspieler: Gast steigt ein und fährt, Gastgeber sieht Lage und Sitz, Gast speichert keine Fahrzeuge", function(){
  var u, f, fg;
  return mspZwei().then(function(x){ u = x; f = u.h.welt.fahrzeuge.get("start"); wahr(f, "Start-Gleiter beim Gastgeber"); u.h._raumBild(0.1, false); return mspLauf(u.netz); }).then(function(){
    u.g._raumBild(0.1, false); fg = u.g.welt.fahrzeuge.get("start"); wahr(fg, "beim Gast gespiegelt");
    u.g.spieler.pos = SC.Fahrzeug.aussteigePos(u.g.welt, fg, 0); u.g._raumBild(0.1, false); return mspLauf(u.netz);
  }).then(function(){ gleich(u.g.benutzen(), true); return mspLauf(u.netz); }).then(function(){
    gleich(f.sitze[0], u.eigen.spieler.figurId, "Gastgeber setzt den Gast als Fahrer"); u.h._raumBild(0.1, false); return mspLauf(u.netz);
  }).then(function(){
    u.g._raumBild(0.1, false); var im = u.g._imFahrzeug(); wahr(im && im.sitz === 0, "Gast sitzt"); gleich(u.g.spieler.ansicht, "aussen");
    fhE60(u.g, { vor: true }); u.g._raumBild(0.1, false); return mspLauf(u.netz);
  }).then(function(){
    wahr(Math.hypot(f.pos[0] - fg.pos[0], f.pos[2] - fg.pos[2]) < 0.5, "Lage beim Gastgeber: " + f.pos + " / " + fg.pos);
    wahr(typeof u.h.raum.spieler[0].sitzt === "number", "Gastgeber sieht den Gast sitzen");
    return u.g.speichere("test");
  }).then(function(){
    gleich(JSON.stringify(u.sG.b.m["welt:" + u.eigen.id].planeten.start.fahrzeuge), "{}", "eigene Welt ohne Fahrzeuge");
    gleich(u.g.benutzen(), true, "aussteigen"); gleich(u.g._imFahrzeug(), null); return mspLauf(u.netz);
  }).then(function(){
    gleich(f.sitze[0], null, "Sitz beim Gastgeber frei"); u.h._raumBild(0.1, false); return mspLauf(u.netz);
  }).then(function(){ u.g._raumBild(0.1, false); gleich(u.g._imFahrzeug(), null, "bleibt draußen"); }).then(mspFertig, mspFehler);
});
test("Mehrspieler: Verpuffen setzt den Gast ab", function(){
  var u, f;
  return mspZwei().then(function(x){ u = x; f = u.h.welt.fahrzeuge.get("start"); SC.Fahrzeug.einsteigen(f, u.eigen.spieler.figurId); u.h._raumBild(0.1, false); return mspLauf(u.netz); }).then(function(){
    u.g._raumBild(0.1, false); wahr(u.g._imFahrzeug(), "sitzt"); u.h.raum.treffer(u.eigen.spieler.figurId, 99999, [0, 0, 1], null); u.h._raumBild(0.1, false); return mspLauf(u.netz);
  }).then(function(){
    u.g._raumBild(0.1, false); gleich(u.g._imFahrzeug(), null, "abgesetzt"); gleich(u.g.spieler.sitzt, null); wahr(SC.Fahrzeug.frei(u.g.welt, u.g.spieler.pos), "steht frei"); gleich(f.weg, true);
  }).then(mspFertig, mspFehler);
});
test("Mehrspieler: Mitspieler im Fahrzeug sitzt auf seinem Sitz, nicht an seiner gemeldeten Position", function(){
  var u, f;
  return mspZwei().then(function(x){ u = x; f = u.h.welt.fahrzeuge.get("start"); SC.Fahrzeug.einsteigen(f, u.h.daten.spieler.figurId); SC.Fahrzeug.einsteigen(f, u.eigen.spieler.figurId); u.h._raumBild(0.1, false); return mspLauf(u.netz); }).then(function(){
    u.g._raumBild(0.1, false); u.g._raumBild(0.1, false); u.h._raumBild(0.1, false); return mspLauf(u.netz);
  }).then(function(){
    u.g._raumBild(0.1, false);
    // Gastgeber-Sicht: Gast (Sitz 1) an seinem Sitz, auch wenn seine gemeldete Position veraltet ist
    u.h.raum.spieler[0].pos = [0, 0, 0];
    var eh = u.h._mitspielerListe().filter(function(e){ return e.id === u.eigen.spieler.figurId; })[0];
    gleich(JSON.stringify(eh.pos), JSON.stringify(SC.Fahrzeug.sitzPos(f, 1, 2048)), "Gast auf Sitz 1"); gleich(eh.sitzt, f.blick); wahr(eh.imFahrzeug, "markiert");
    // Gast-Sicht: Gastgeber (Sitz 0) am Sitz im gespiegelten Fahrzeug
    var fg = u.g.welt.fahrzeuge.get("start"), eg = u.g._mitspielerListe().filter(function(e){ return e.id === u.h.daten.spieler.figurId; })[0];
    gleich(JSON.stringify(eg.pos), JSON.stringify(SC.Fahrzeug.sitzPos(fg, 0, 2048)), "Gastgeber auf Sitz 0");
  }).then(mspFertig, mspFehler);
});
test("Mehrspieler: fremd gefahrenes Fahrzeug fährt zwischen den Meldungen weiter", function(){
  var u = fhSpiel(), s = u.s, f = u.f; SC.Fahrzeug.einsteigen(f, "anderer"); f.geschw = [10, 0, 0]; f.tempo = 10; f.aufBoden = true; var x0 = f.pos[0];
  s._fahrzeugeBild(0.1); wahr(Math.abs(f.pos[0] - (x0 + 1)) < 1e-6, "Gastgeber rechnet weiter: " + (f.pos[0] - x0));
  var w = fzWelt(), l = [{ id: "a", art: "gleiter", pos: [100, 60.6, 100], blick: 0, geschw: [10, 0, 0], tempo: 10, panzerung: 120, sitze: ["x", null, null, null], weg: false, frei: true }];
  SC.Raum.spiegleFahrzeuge(w, l, 1 / 60, "ich"); for(var i = 0; i < 12; i++) SC.Raum.spiegleFahrzeuge(w, l, 1 / 60, "ich");
  var g = w.fahrzeuge.get("a"); wahr(g.pos[0] > 101.5, "Gast hinkt nicht hinterher: " + g.pos[0]);
});
test("Mitspieler-Figur im Fahrzeug folgt ohne Verzögerung", function(){
  var sz = new THREE.Scene(), rm = new SC.RenderMitspieler(sz, { groesse: 2048 }), e = { id: "a", name: "A", farbe: "#e0533a", pos: [10, 70, 10], blick: [0, 0], modus: "survival", lebt: true, imFahrzeug: true, sitzt: 0 };
  rm.aktualisiere([e], [10, 70, 10], 1 / 60); e.pos = [14, 70, 10]; rm.aktualisiere([e], [10, 70, 10], 1 / 60);
  gleich(rm.figuren.get("a").p[0], 14);
});
test("Touch: beim Verlassen der Welt wird das Overlay ausgeblendet", function(){
  var u = fhSpiel(), s = u.s, ui = document.createElement("div"), e = new SC.Eingabe(document.createElement("canvas"), ui); s.eingabe.touch = new SC.Touch(e, ui); s.eingabe.touch.sichtbar(true);
  s._abbauen(); wahr(s.eingabe.touch.el.hidden, "ausgeblendet"); s.eingabe.touch.entferne(); e.entferne();
});
test("Mehrspieler: eigener Sitz folgt dem Fahrzeug im selben Bild, nicht ein Bild später", function(){
  var u, f, fg;
  return mspZwei().then(function(x){ u = x; f = u.h.welt.fahrzeuge.get("start"); SC.Fahrzeug.einsteigen(f, u.h.daten.spieler.figurId); SC.Fahrzeug.einsteigen(f, u.eigen.spieler.figurId); u.h._raumBild(0.1, false); return mspLauf(u.netz); }).then(function(){
    u.g._raumBild(0.1, false); fg = u.g.welt.fahrzeuge.get("start"); wahr(u.g._imFahrzeug(), "Gast sitzt");
    f.pos = [f.pos[0] + 3, f.pos[1], f.pos[2]]; f.geschw = [0, 0, 0]; u.h._raumBild(0.1, false); return mspLauf(u.netz);
  }).then(function(){
    u.g._raumBild(0.1, false);
    gleich(JSON.stringify(u.g.spieler.pos), JSON.stringify(SC.Fahrzeug.sitzPos(fg, 1, 2048)), "Gast: Sitz nach dem Abgleich");
    // Gastgeber als Mitfahrer, ein anderer fährt: nach dem Vorausrechnen sitzt er am neuen Platz
    var s = u.h; SC.Fahrzeug.aussteigen(f, s.daten.spieler.figurId); SC.Fahrzeug.aussteigen(f, u.eigen.spieler.figurId); SC.Fahrzeug.einsteigen(f, "anderer"); SC.Fahrzeug.einsteigen(f, s.daten.spieler.figurId);
    s._fahren({}, 1 / 60, false); f.geschw = [10, 0, 0]; s._fahrzeugeBild(0.1);
    gleich(JSON.stringify(s.spieler.pos), JSON.stringify(SC.Fahrzeug.sitzPos(f, 1, 2048)), "Gastgeber: Sitz nach dem Vorausrechnen");
  }).then(mspFertig, mspFehler);
});
