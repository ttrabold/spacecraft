// Betten (#118–#120): Aufbau wie in Minecraft
var BETT_FUSS = ["BETT_FUSS_N", "BETT_FUSS_S", "BETT_FUSS_O", "BETT_FUSS_W"], BETT_KOPF = ["BETT_KOPF_N", "BETT_KOPF_S", "BETT_KOPF_O", "BETT_KOPF_W"];
test("Bett: acht Blöcke (Fuß und Kopf je Richtung), niedrig und begehbar (#118)", function(){
  gleich(SC.B.BETT_FUSS_N, 62); gleich(SC.B.BETT_KOPF_N, 66); gleich(SC.B.BETT_KOPF_W, 69);
  BETT_FUSS.concat(BETT_KOPF).forEach(function(n){ var b = SC.BLOECKE[SC.B[n]]; wahr(b, n); wahr(b.name && b.name !== "undefined", n + ": Name"); wahr(!b.fest && b.durchsichtig && b.zerstoerbar, n + ": begehbar, durchsichtig, abbaubar"); gleich(b.form.typ, "kasten"); wahr(b.form.b[1] > 0.4 && b.form.b[1] < 0.7, n + ": halbhoch");
    ["oben", "seite", "unten"].forEach(function(s){ wahr(SC.Mesher.atlasNamen.indexOf(b.seiten[s]) >= 0, n + ": Textur " + b.seiten[s]); }); wahr(SC.Abbau.zeit(SC.B[n]) < 2, n + ": schnell abbaubar"); gleich(SC.Abbau.ergibt(SC.B[n]), SC.B.BETT_FUSS_N, n + ": liefert ein Bett"); });
  wahr(SC.BLOECKE[SC.B.BETT_KOPF_N].seiten.oben !== SC.BLOECKE[SC.B.BETT_FUSS_N].seiten.oben, "Kopfende hat das Kissen");
  gleich(SC.BLOECKE[SC.B.BETT_FUSS_N].inAuswahl, true, "im Kreativ wählbar"); BETT_FUSS.slice(1).concat(BETT_KOPF).forEach(function(n){ gleich(SC.BLOECKE[SC.B[n]].inAuswahl, false, n); });
});
test("Bett: im Mesher ein flacher Kasten mit eigener Oberseite (#118)", function(){
  var w = leereWelt(); w.setzeBlock(5, 64, 5, SC.B.BETT_FUSS_N, "system"); var m = SC.Mesher.chunk(w, 0, 0, SC.Licht.chunk(w, 0, 0)), g = m.form; gleich(g.indizes.length / 6, 6, "sechs Flächen");
  var hoch = -1e9; for(var i = 1; i < g.positionen.length; i += 3) hoch = Math.max(hoch, g.positionen[i]); wahr(hoch < 64.7 && hoch > 64.4, "halbhoch: " + hoch);
  var uvs = {}; for(var j = 0; j < g.uv.length; j += 2) uvs[Math.round(g.uv[j] * 1000) + "," + Math.round(g.uv[j + 1] * 1000)] = 1; wahr(Object.keys(uvs).length >= 8, "mindestens zwei Kacheln (Oberseite und Seite)");
  gleich(SC.Licht.opak[SC.B.BETT_FUSS_N], 0, "lässt Licht durch");
});
test("Bett-Rezepte: Wolle aus Blättern, Bett aus Wolle und Brettern (#118)", function(){
  var wolle = SC.Crafting.rezept("wolle"), bett = SC.Crafting.rezept("bett"); wahr(wolle && bett);
  gleich(wolle.ergibt.block, SC.B.WOLLE_ROT); gleich(wolle.kosten[0].block, SC.B.BLAETTER); gleich(bett.ergibt.block, SC.B.BETT_FUSS_N); gleich(bett.ergibt.anzahl, 1); gleich(bett.station, "werkbank");
  var rs = new SC.Rucksack(); rs.lege({ block: SC.B.BLAETTER, anzahl: 8 }); rs.lege({ block: SC.B.BRETTER, anzahl: 5 });
  gleich(SC.Crafting.herstelle(rs, wolle, null, SC.zufall(1), 1).ok, true); gleich(SC.Crafting.herstelle(rs, wolle, null, SC.zufall(1), 1).ok, true); gleich(rs.hat(SC.B.WOLLE_ROT), 2 * wolle.ergibt.anzahl); gleich(rs.hat(SC.B.BLAETTER), 8 - 2 * wolle.kosten[0].anzahl);
  var e = SC.Crafting.herstelle(rs, bett, null, SC.zufall(1), 1); gleich(e.ok, false, "zu wenig Wolle"); gleich(e.grund, "material"); rs.lege({ block: SC.B.WOLLE_ROT, anzahl: 3 }); gleich(SC.Crafting.herstelle(rs, bett, null, SC.zufall(1), 1).ok, true); gleich(rs.hat(SC.B.BETT_FUSS_N), 1); gleich(rs.hat(SC.B.BRETTER), 2);
});
test("Bett aufstellen: Fußende vorn, Kopfende in Blickrichtung, beide Hälften, mit Boden darunter (#118)", function(){
  var w = leereWelt(); for(var x = 0; x < 16; x++) for(var z = 0; z < 16; z++) w.setzeBlock(x, 63, z, SC.B.STEIN, "system");
  var sp = new SC.Spieler({ id: "a", pos: [2.5, 64, 2.5], modus: "survival" }), A = SC.Bauteile.aufstellId, ziel = { x: 5, y: 63, z: 5, nx: 0, ny: 1, nz: 0 };
  gleich(A(w, SC.B.BETT_FUSS_N, ziel, [0, 0, -1]), SC.B.BETT_FUSS_N); gleich(A(w, SC.B.BETT_FUSS_N, ziel, [0, 0, 1]), SC.B.BETT_FUSS_S); gleich(A(w, SC.B.BETT_FUSS_N, ziel, [1, 0, 0.2]), SC.B.BETT_FUSS_O); gleich(A(w, SC.B.BETT_FUSS_N, ziel, [-1, 0, 0.2]), SC.B.BETT_FUSS_W);
  gleich(SC.Bauteile.setze(w, sp, 5, 64, 5, SC.B.BETT_FUSS_O), true); gleich(w.holeBlock(5, 64, 5), SC.B.BETT_FUSS_O); gleich(w.holeBlock(6, 64, 5), SC.B.BETT_KOPF_O, "Kopf östlich");
  gleich(SC.Bauteile.setze(w, sp, 8, 64, 8, SC.B.BETT_FUSS_N), true); gleich(w.holeBlock(8, 63 + 1, 7), SC.B.BETT_KOPF_N, "Kopf nördlich (z−1)");
  w.setzeBlock(11, 64, 10, SC.B.STEIN, "system"); gleich(SC.Bauteile.setze(w, sp, 10, 64, 10, SC.B.BETT_FUSS_O), false, "Kopfzelle belegt"); gleich(w.holeBlock(10, 64, 10), SC.B.LUFT, "nichts gesetzt");
  w.setzeBlock(13, 63, 12, SC.B.LUFT, "system"); gleich(SC.Bauteile.setze(w, sp, 12, 64, 12, SC.B.BETT_FUSS_O), false, "kein Boden unter dem Kopfende"); gleich(w.holeBlock(12, 64, 12), SC.B.LUFT);
  gleich(SC.Bauteile.setze(w, sp, 2, 64, 2, SC.B.BETT_FUSS_N), true, "man darf neben/auf sein Bett stellen (begehbar)");
});
test("Bett abgebaut: die andere Hälfte verschwindet mit (#118)", function(){
  var w = leereWelt(); for(var x = 0; x < 16; x++) for(var z = 0; z < 16; z++) w.setzeBlock(x, 63, z, SC.B.STEIN, "system"); var sp = new SC.Spieler({ id: "a", pos: [1.5, 64, 1.5], modus: "survival" });
  SC.Bauteile.setze(w, sp, 5, 64, 5, SC.B.BETT_FUSS_O); SC.Bauteile.setze(w, sp, 8, 64, 8, SC.B.BETT_FUSS_S);
  var fake = { welt: w }; w.ereignisse.an("block", function(b){ SC.Spiel.prototype._bettWeg.call(fake, b); });
  w.setzeBlock(5, 64, 5, SC.B.LUFT, "spieler"); gleich(w.holeBlock(6, 64, 5), SC.B.LUFT, "Fuß weg, Kopf weg"); w.setzeBlock(8, 64, 9, SC.B.LUFT, "spieler"); gleich(w.holeBlock(8, 64, 8), SC.B.LUFT, "Kopf weg, Fuß weg");
  w.setzeBlock(5, 64, 5, SC.B.BETT_FUSS_O, "system"); w.setzeBlock(6, 64, 5, SC.B.STEIN, "system"); w.setzeBlock(5, 64, 5, SC.B.LUFT, "spieler"); gleich(w.holeBlock(6, 64, 5), SC.B.STEIN, "nur Bettteile werden mitgenommen");
});
// --- Schlafen (#119) ---
function schlafSpiel(o){
  var w = new SC.Welt(new SC.Planet({ id: "start", seed: 5 })); for(var x = 0; x < 16; x++) for(var z = 0; z < 16; z++) for(var y = 1; y < 128; y++) w.setzeBlock(x, y, z, y <= 63 ? SC.B.STEIN : SC.B.LUFT, "system");
  var sp = new SC.Spieler({ id: "a", pos: [4.5, 64, 4.5], modus: (o && o.modus) || "survival" }), hinweise = [];
  var s = { welt: w, spieler: sp, daten: { spieler: {} }, tageszeit: (o && o.tageszeit !== undefined) ? o.tageszeit : 0.0, kampf: { zuletztGetroffen: -1e9, uhr: 0 }, raum: (o && o.raum) || null, ui: { hinweis: function(t){ hinweise.push(t); }, schlafBild: function(a, t){ s.bildAlpha = a; s.bildText = t; } }, hinweise: hinweise };
  ["_tageslicht", "_gegnerBeiBett", "bettBenutzen", "_einschlafen", "_aufwachen", "_schlafen", "_alleSchlafen"].forEach(function(n){ s[n] = SC.Spiel.prototype[n]; });
  SC.Bauteile.setze(w, new SC.Spieler({ id: "bauer", pos: [1.5, 64, 1.5], modus: "survival" }), 8, 64, 8, SC.B.BETT_FUSS_O); return s;   // Zuschauer dürfen nichts setzen
}
var RUHE = { vor: false, zurueck: false, links: false, rechts: false, springen: false, sinken: false, abbauen: false, abbauenGehalten: false, setzen: false, setzenGehalten: false, blickDx: 0, blickDy: 0 };
test("Schlafen: Gegner in 8 Blöcken waagerecht und 5 senkrecht verhindern es (#119)", function(){
  var s = schlafSpiel(), g = function(x, y, z, art){ return SC.Wesen.neu(s.welt, art || "gegner", { gegnerArt: "krabbler", stufe: 1, pos: [x, y, z], heim: [x, y, z], lp: 5, lpMax: 5, breite: 0.9, hoehe: 0.7 }); };
  gleich(s._gegnerBeiBett(9, 64, 8), false, "keiner da"); var e = g(9.5 + 7, 66, 8.5); gleich(s._gegnerBeiBett(9, 64, 8), true, "7 Blöcke weit, 2 höher"); SC.Wesen.entferne(s.welt, e.id);
  e = g(9.5 + 9, 64, 8.5); gleich(s._gegnerBeiBett(9, 64, 8), false, "9 Blöcke weit"); SC.Wesen.entferne(s.welt, e.id); e = g(9.5, 70.5, 8.5); gleich(s._gegnerBeiBett(9, 64, 8), false, "6 Blöcke höher"); SC.Wesen.entferne(s.welt, e.id);
  g(9.5, 64, 12.5, "geschoss"); gleich(s._gegnerBeiBett(9, 64, 8), false, "nur Gegner zählen");
});
test("Bett benutzen: Wiedereinstieg setzen, nur nachts schlafen, nicht bei Gegnern (#119)", function(){
  var s = schlafSpiel({ tageszeit: 0.5 }); s.bettBenutzen({ x: 8, y: 64, z: 8 });
  gleich(JSON.stringify(s.daten.spieler.bett), JSON.stringify({ planet: "start", x: 9, y: 64, z: 8 }), "Kopfende als Wiedereinstieg"); gleich(s.hinweise[0], SC.T.bettGesetzt); gleich(s.hinweise[1], SC.T.nurNachts); gleich(s.spieler.schlaeft, undefined, "tagsüber kein Schlaf");
  s.bettBenutzen({ x: 8, y: 64, z: 8 }); gleich(s.hinweise.filter(function(h){ return h === SC.T.bettGesetzt; }).length, 1, "Wiedereinstieg nur einmal melden");
  var n = schlafSpiel({ tageszeit: 0.0 }); SC.Wesen.neu(n.welt, "gegner", { gegnerArt: "krabbler", stufe: 1, pos: [12.5, 64, 8.5], heim: [12.5, 64, 8.5], lp: 5, lpMax: 5, breite: 0.9, hoehe: 0.7 }); n.bettBenutzen({ x: 9, y: 64, z: 8 }); gleich(n.hinweise[n.hinweise.length - 1], SC.T.monsterNah); wahr(!n.spieler.schlaeft, "kein Schlaf bei Gegnern"); wahr(n.daten.spieler.bett, "Wiedereinstieg trotzdem gesetzt");
  var f = schlafSpiel({ tageszeit: 0.0 }); f.bettBenutzen({ x: 8, y: 64, z: 8 }); wahr(f.spieler.schlaeft, "nachts frei: schläft"); gleich(JSON.stringify(f.spieler.schlaeft.kopf), JSON.stringify({ x: 9, y: 64, z: 8 })); gleich(f.spieler.pos[0], 9.5); wahr(Math.abs(f.spieler.pos[1] - 64.56) < 0.01); gleich(f.spieler.pos[2], 8.5);
  var z = schlafSpiel({ tageszeit: 0.0, modus: "zuschauer" }); z.bettBenutzen({ x: 8, y: 64, z: 8 }); wahr(!z.spieler.schlaeft, "Zuschauer schlafen nicht");
  var k = schlafSpiel({ tageszeit: 0.0, modus: "kreativ" }); k.bettBenutzen({ x: 9, y: 64, z: 8 }); wahr(k.spieler.schlaeft, "auch Kreativ kann schlafen; Kopf angeklickt geht auch");
});
test("Schlafen: nach drei Sekunden ist Morgen, Bewegung, Treffer und Tag wecken (#119)", function(){
  var s = schlafSpiel({ tageszeit: 0.0 }); s.bettBenutzen({ x: 8, y: 64, z: 8 }); var e = Object.assign({}, RUHE);
  var r = s._schlafen(e, 1); wahr(r !== e && !r.vor && r.blickDx === 0, "Eingaben gesperrt"); wahr(s.spieler.schlaeft && s.bildAlpha > 0.3, "Bild wird dunkler: " + s.bildAlpha); s._schlafen(e, 1.5); wahr(s.bildAlpha >= 0.9);
  gleich(s.tageszeit, 0.0, "noch Nacht nach 2,5 s"); s._schlafen(e, 1); gleich(s.tageszeit, 0.27, "Morgen"); gleich(s.spieler.schlaeft, null, "aufgewacht"); gleich(s.hinweise[s.hinweise.length - 1], SC.T.guterMorgen); gleich(s.bildAlpha, 0, "Bild hell");
  var b = schlafSpiel({ tageszeit: 0.0 }); b.bettBenutzen({ x: 8, y: 64, z: 8 }); b._schlafen(Object.assign({}, RUHE, { vor: true }), 0.1); gleich(b.spieler.schlaeft, null, "Bewegung weckt"); gleich(b.tageszeit, 0.0, "ohne Zeitsprung");
  var t = schlafSpiel({ tageszeit: 0.0 }); t.bettBenutzen({ x: 8, y: 64, z: 8 }); t._schlafen(Object.assign({}, RUHE), 0.5); t.kampf.zuletztGetroffen = 500; t._schlafen(Object.assign({}, RUHE), 0.1); gleich(t.spieler.schlaeft, null, "Treffer weckt"); gleich(t.tageszeit, 0.0);
  var m = schlafSpiel({ tageszeit: 0.0 }); m.bettBenutzen({ x: 8, y: 64, z: 8 }); m.tageszeit = 0.5; m._schlafen(Object.assign({}, RUHE), 0.1); gleich(m.spieler.schlaeft, null, "Tag weckt");
  var w = schlafSpiel({ tageszeit: 0.0 }); w.bettBenutzen({ x: 8, y: 64, z: 8 }); w.welt.setzeBlock(9, 64, 8, SC.B.LUFT, "system"); w._schlafen(Object.assign({}, RUHE), 0.1); gleich(w.spieler.schlaeft, null, "Bett weg weckt");
  var o = schlafSpiel(); var e2 = Object.assign({}, RUHE, { vor: true }); gleich(o._schlafen(e2, 1), e2, "ohne Schlaf bleibt die Eingabe unverändert");
});
test("Schlafen im Mehrspieler: Gastgeber springt erst, wenn alle schlafen; Gäste warten (#119)", function(){
  var h = Object.create(SC.Gastgeber.prototype); h.spieler = [{ id: "g1", verbunden: true, modus: "survival", schlaeft: false }, { id: "g2", verbunden: true, modus: "zuschauer", schlaeft: false }, { id: "g3", verbunden: false, modus: "survival" }];
  var s = schlafSpiel({ tageszeit: 0.0, raum: h }); s.bettBenutzen({ x: 8, y: 64, z: 8 }); s._schlafen(Object.assign({}, RUHE), 4); gleich(s.tageszeit, 0.0, "g1 schläft nicht"); gleich(s.bildText, SC.T.schlafWarte, "wartet auf die anderen"); wahr(s.spieler.schlaeft);
  h.spieler[0].schlaeft = true; s._schlafen(Object.assign({}, RUHE), 0.1); gleich(s.tageszeit, 0.27, "alle Beteiligten schlafen: Morgen"); gleich(s.spieler.schlaeft, null);
  var gast = Object.create(SC.Gast.prototype), gs = schlafSpiel({ tageszeit: 0.0, raum: gast }); gs.bettBenutzen({ x: 8, y: 64, z: 8 }); gs._schlafen(Object.assign({}, RUHE), 10); gleich(gs.tageszeit, 0.0, "Gast stellt die Zeit nicht selbst"); wahr(gs.spieler.schlaeft); gs.tageszeit = 0.3; gs._schlafen(Object.assign({}, RUHE), 0.1); gleich(gs.spieler.schlaeft, null, "wacht auf, wenn der Gastgeber den Morgen schickt");
});
test("Schlafen: Kamera liegt tief, Bildschirm blendet ab (#119)", function(){
  var sp = new SC.Spieler({ id: "a", pos: [1, 64, 1], modus: "survival" }); var stehend = sp.augen()[1]; sp.schlaeft = { t: 0 }; wahr(sp.augen()[1] < stehend - 1, "Augen unten im Bett");
  var w = document.createElement("div"), ui = ui2(w); ui.schlafBild(0.6, "Zzz …"); var el = w.querySelector(".schlaf"); wahr(el && !el.hidden, "sichtbar"); wahr(el.textContent.indexOf("Zzz") >= 0); wahr(Math.abs(parseFloat(el.style.opacity) - 0.6) < 0.01); ui.schlafBild(0, ""); wahr(el.hidden || el.style.opacity === "0", "wieder hell");
});
// --- Wiedereinstieg und Mehrspieler (#120) ---
test("Wiedereinstieg am Bett: Stelle neben dem Bett, fehlendes Bett wird vergessen (#120)", function(){
  var s = schlafSpiel(); s["bettPunkt"] = SC.Spiel.prototype.bettPunkt; s.daten.spieler.bett = { planet: "start", x: 9, y: 64, z: 8 };
  var p = s.bettPunkt(); wahr(p, "Stelle gefunden"); wahr(Math.abs(p[0] - 9.5) <= 1.6 && Math.abs(p[2] - 8.5) <= 1.6, "neben dem Bett: " + p); gleich(p[1], 64); wahr(!((p[0] === 8.5 || p[0] === 9.5) && p[2] === 8.5), "nicht im Bett");
  gleich(s.hinweise.length, 0, "keine Meldung, wenn alles in Ordnung ist"); wahr(s.daten.spieler.bett, "Bett bleibt gemerkt");
  s.welt.setzeBlock(9, 64, 8, SC.B.LUFT, "system"); s.welt.setzeBlock(8, 64, 8, SC.B.LUFT, "system"); gleich(s.bettPunkt(), null, "Bett fehlt"); gleich(s.hinweise[0], SC.T.bettFehlte); gleich(s.daten.spieler.bett, null, "vergessen");
  var a = schlafSpiel(); a.bettPunkt = SC.Spiel.prototype.bettPunkt; a.daten.spieler.bett = { planet: "glutfrost", x: 9, y: 64, z: 8 }; gleich(a.bettPunkt(), null, "anderer Planet"); gleich(a.hinweise.length, 0); wahr(a.daten.spieler.bett, "bleibt für den Besuch dort gemerkt");
  var n = schlafSpiel(); n.bettPunkt = SC.Spiel.prototype.bettPunkt; n.daten.spieler.bett = { planet: "start", x: 9, y: 64, z: 8 };
  for(var x = 6; x <= 11; x++) for(var z = 6; z <= 10; z++) for(var y = 64; y <= 65; y++) if(!SC.Bauteile.istBett(n.welt.holeBlock(x, y, z))) n.welt.setzeBlock(x, y, z, SC.B.STEIN, "system");
  gleich(n.bettPunkt(), null, "ringsum zugemauert"); gleich(n.hinweise[0], SC.T.bettBlockiert); wahr(n.daten.spieler.bett, "Bett bleibt gemerkt, wenn es nur blockiert ist");
  var k = schlafSpiel(); k.bettPunkt = SC.Spiel.prototype.bettPunkt; gleich(k.bettPunkt(), null, "ohne Bett nichts"); gleich(k.hinweise.length, 0, "und keine Meldung");
});
test("Schlafzustand reist mit: Gastgeber kennt schlafende Gäste, Gäste sehen schlafende Mitspieler (#120)", function(){
  var u, a;
  return mspRaum(1).then(function(x){ u = x; a = u.gs[0]; a.g.takt(0.1, mspIch({ schlaeft: true })); return raumLauf(u.netz); }).then(function(){
    var e = u.h.spieler.filter(function(q){ return q.id === a.id; })[0]; gleich(e.schlaeft, true, "Gastgeber weiß es"); wahr(u.h._zustaende(mspIch({ schlaeft: true })).every(function(z){ return z.schlaeft === true || z.schlaeft === undefined || z.schlaeft === false; }));
    var z = u.h._zustaende(mspIch({ schlaeft: true })); gleich(z[0].schlaeft, true, "Gastgeber meldet seinen eigenen Schlaf an die Gäste");
    a.g.takt(0.1, mspIch({ schlaeft: false })); return raumLauf(u.netz);
  }).then(function(){ var e = u.h.spieler.filter(function(q){ return q.id === a.id; })[0]; wahr(!e.schlaeft, "aufgewacht"); });
});
test("Schlafende Mitspieler liegen im Bild (#120)", function(){
  var m = _ms(); m.r.aktualisiere([_e(1, { schlaeft: true })], [0, 0, 0], 0.1); var g = m.r.figuren.get(1).f.gruppe; wahr(Math.abs(g.rotation.x - Math.PI / 2) < 0.01, "liegt auf dem Rücken: " + g.rotation.x);
  m.r.aktualisiere([_e(1, { schlaeft: false })], [0, 0, 0], 0.1); wahr(Math.abs(g.rotation.x) < 0.01, "steht wieder");
});
test("Netzprotokoll mindestens 6 wegen der Betten (#120)", function(){ wahr(SC.NETZ_PROTOKOLL >= 6); });
// --- Wiedereinstieg von anderen Planeten (#123) ---
function wiederSpiel(o){
  var s = schlafSpiel(), log = [];
  s.daten = SC.Spielstand.neu({ name: "W", seedText: "w", modus: "survival" }); SC.Planeten.anlegen(s.daten, "glutfrost"); s.rolle = (o && o.rolle) || "einzel"; s.raum = (o && o.raum) || null; s.log = log;
  s.kampf = { zuletztGetroffen: -1e9, uhr: 0, wiederbeleben: function(p){ log.push(["wiederbeleben", p && p.map(Math.round)]); } }; s.landepunkt = function(){ return [100, 70, 100]; }; s.welt.planet.groesse = s.welt.planet.groesse;
  s.wechslePlanet = function(id, opt){ log.push(["wechsel", id, JSON.stringify(opt)]); return Promise.resolve(); };
  ["_wiederEinstieg", "_bettDa", "bettPunkt"].forEach(function(n){ s[n] = SC.Spiel.prototype[n]; }); return s;
}
function bettAufPlanet(s, planetId, x, y, z){
  var pd = s.daten.planeten[planetId], welt = new SC.Welt(new SC.Planet(pd)); SC.Bauteile.setze(welt, new SC.Spieler({ id: "b", pos: [x - 3.5, y, z + 0.5], modus: "survival" }), x - 1, y, z, SC.B.BETT_FUSS_O);
  for(var i = x - 3; i <= x + 3; i++) for(var j = z - 3; j <= z + 3; j++) if(welt.holeBlock(i, y - 1, j) === SC.B.LUFT) welt.setzeBlock(i, y - 1, j, SC.B.STEIN, "system");
  SC.Bauteile.setze(welt, new SC.Spieler({ id: "b", pos: [x - 3.5, y, z + 0.5], modus: "survival" }), x - 1, y, z, SC.B.BETT_FUSS_O); SC.Spielstand.ausWelt(s.daten, welt, null, null); return welt;
}
test("Wiedereinstieg: Bett auf anderem Planeten, wiederbeleben und dorthin wechseln (#123)", function(){
  var s = wiederSpiel(); var w = bettAufPlanet(s, "glutfrost", 500, 70, 500); gleich(SC.Bauteile.istBettKopf(w.holeBlock(500, 70, 500)), true, "Bett steht dort");
  s.daten.spieler.bett = { planet: "glutfrost", x: 500, y: 70, z: 500 }; return s._wiederEinstieg().then(function(){
    gleich(s.log.length, 2); gleich(s.log[0][0], "wiederbeleben", "erst wiederbeleben (sonst bleibt er beim Wechsel besiegt)"); gleich(s.log[1][0], "wechsel"); gleich(s.log[1][1], "glutfrost"); gleich(JSON.parse(s.log[1][2]).bett, true, "am Ziel zum Bett setzen"); wahr(s.daten.spieler.bett, "Bett bleibt gemerkt");
  });
});
test("Wiedereinstieg: fehlendes Bett auf anderem Planeten wird vergessen, kein Wechsel (#123)", function(){
  var s = wiederSpiel(); s.daten.spieler.bett = { planet: "glutfrost", x: 500, y: 70, z: 500 };
  return s._wiederEinstieg().then(function(){ gleich(s.log.length, 1); gleich(s.log[0][0], "wiederbeleben"); gleich(JSON.stringify(s.log[0][1]), "[100,70,100]", "wie bisher am Landepunkt"); gleich(s.daten.spieler.bett, null); gleich(s.hinweise[0], SC.T.bettFehlte); });
});
test("Wiedereinstieg: Bett auf diesem Planeten, Gast und Gastgeber mit Gästen bleiben hier (#123)", function(){
  var s = wiederSpiel(); s.welt.setzeBlock(20, 64, 20, SC.B.LUFT, "system"); s.daten.spieler.bett = { planet: "start", x: 9, y: 64, z: 8 };
  return s._wiederEinstieg().then(function(){ gleich(s.log.length, 1); gleich(s.log[0][0], "wiederbeleben"); wahr(Math.abs(s.log[0][1][0] - 9) <= 2, "neben dem Bett: " + s.log[0][1]);
    var g = wiederSpiel({ rolle: "gast" }); bettAufPlanet(g, "glutfrost", 500, 70, 500); g.daten.spieler.bett = { planet: "glutfrost", x: 500, y: 70, z: 500 }; return g._wiederEinstieg().then(function(){ gleich(g.log.length, 1, "Gast bleibt in der Welt des Gastgebers"); gleich(g.log[0][0], "wiederbeleben"); wahr(g.daten.spieler.bett, "Bett bleibt für später gemerkt"); });
  }).then(function(){
    var h = Object.create(SC.Gastgeber.prototype); h.spieler = [{ id: "g1", verbunden: true }]; var m = wiederSpiel({ raum: h }); bettAufPlanet(m, "glutfrost", 500, 70, 500); m.daten.spieler.bett = { planet: "glutfrost", x: 500, y: 70, z: 500 };
    return m._wiederEinstieg().then(function(){ gleich(m.log.length, 1, "kein Planetenwechsel für alle Gäste wegen eines Todes"); gleich(m.log[0][0], "wiederbeleben"); });
  });
});
test("Bett: die Decke läuft in allen vier Richtungen von Fuß zu Kopf durch", function(){
  var R = { N: [0, -1], S: [0, 1], O: [1, 0], W: [-1, 0] }, uf = SC.Mesher.uvFuer(SC.BLOECKE[SC.B.BETT_FUSS_N].seiten.oben), uk = SC.Mesher.uvFuer(SC.BLOECKE[SC.B.BETT_KOPF_N].seiten.oben);
  Object.keys(R).forEach(function(r){
    var w = leereWelt(), fx = 7, fz = 7, d = R[r], kx = fx + d[0], kz = fz + d[1];
    w.setzeBlock(fx, 64, fz, SC.B["BETT_FUSS_" + r], "system"); w.setzeBlock(kx, 64, kz, SC.B["BETT_KOPF_" + r], "system");
    var g = SC.Mesher.chunk(w, 0, 0, SC.Licht.chunk(w, 0, 0)).form, p = g.positionen, uv = g.uv, oben = 64 + SC.BLOECKE[SC.B.BETT_FUSS_N].form.b[1];
    // gemeinsame Kante: x bzw. z genau zwischen Fuß und Kopf; dort zeigt der Fuß seinen offenen Rand (Kachel unten, v klein), der Kopf seinen offenen Rand (Kachel oben, v groß)
    var kante = d[0] ? Math.max(fx, kx) : Math.max(fz, kz), achse = d[0] ? 0 : 2, fussV = [], kopfV = [];
    for(var i = 0; i < p.length / 3; i++){
      if(Math.abs(p[i * 3 + 1] - oben) > 1e-4 || Math.abs(p[i * 3 + achse] - kante) > 1e-4) continue;
      var u = uv[i * 2], v = uv[i * 2 + 1];
      if(u >= uf[0] - 1e-6 && u <= uf[2] + 1e-6 && v >= uf[1] - 1e-6 && v <= uf[3] + 1e-6) fussV.push(v);
      else if(u >= uk[0] - 1e-6 && u <= uk[2] + 1e-6 && v >= uk[1] - 1e-6 && v <= uk[3] + 1e-6) kopfV.push(v);
    }
    gleich(fussV.length, 2, r + ": zwei Ecken des Fußes an der Kante"); gleich(kopfV.length, 2, r + ": zwei Ecken des Kopfes an der Kante");
    wahr(fussV.every(function(v){ return Math.abs(v - uf[1]) < 1e-6; }), r + ": Fuß zeigt seinen offenen Rand zum Kopf");
    wahr(kopfV.every(function(v){ return Math.abs(v - uk[3]) < 1e-6; }), r + ": Kopf zeigt seinen offenen Rand zum Fuß");
  });
});
