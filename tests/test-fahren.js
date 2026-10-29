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
