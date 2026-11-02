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
  var w = leereWelt(); w.setzeBlock(5, 64, 5, SC.B.BETT_FUSS_N, "system"); var m = SC.Mesher.chunk(w, 0, 0, SC.Licht.chunk(w, 0, 0)), g = m.durchsichtig; gleich(g.indizes.length / 6, 6, "sechs Flächen");
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
