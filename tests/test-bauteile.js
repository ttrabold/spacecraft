// Crafting (Stufe 6a): Bauteile mit Sonderformen, Türen, Leitern
function bwFlaechen(g){ return g.indizes.length / 6; }
function bwMesh(w){ return SC.Mesher.chunk(w, 0, 0, SC.Licht.chunk(w, 0, 0)); }
function bwBereich(g, achse){ var lo = 1e9, hi = -1e9; for(var i = achse; i < g.positionen.length; i += 3){ lo = Math.min(lo, g.positionen[i]); hi = Math.max(hi, g.positionen[i]); } return [lo, hi]; }
test("Fackel: zwei Kreuzflächen, leuchtet, lässt Licht durch (#102)", function(){
  var w = leereWelt(); w.setzeBlock(5, 64, 5, SC.B.FACKEL, "system"); var m = bwMesh(w);
  gleich(bwFlaechen(m.durchsichtig), 2); gleich(bwFlaechen(m.fest), 256, "nur der Boden im festen Teil");
  var l = SC.Licht.chunk(w, 0, 0); wahr(l.block[SC.idx(5, 64, 5)] >= 13, "Fackel leuchtet: " + l.block[SC.idx(5, 64, 5)]); gleich(l.himmel[SC.idx(5, 60, 5)], 15, "Himmelslicht geht durch");
  [SC.B.FACKEL, SC.B.ZAUN, SC.B.TUER_X, SC.B.LEITER_N, SC.B.TRUHE === 0 ? 0 : SC.B.FACKEL].forEach(function(id){ gleich(SC.Licht.opak[id], 0, "nicht deckend: " + SC.BLOECKE[id].name); });
});
test("Zaun: schmaler Pfosten, verbindet sich mit Nachbarzäunen (#102)", function(){
  var w = leereWelt(); w.setzeBlock(5, 64, 5, SC.B.ZAUN, "system"); var g = bwMesh(w).durchsichtig; gleich(bwFlaechen(g), 5, "Pfosten: 4 Seiten und oben");
  var bx = bwBereich(g, 0); wahr(bx[1] - bx[0] < 0.3, "schmal: " + (bx[1] - bx[0]));
  w.setzeBlock(6, 64, 5, SC.B.ZAUN, "system"); var g2 = bwMesh(w).durchsichtig; wahr(bwFlaechen(g2) > 10, "Querlatten zwischen den Pfosten: " + bwFlaechen(g2));
});
test("Tür und Leiter sind dünne Platten (#102)", function(){
  var w = leereWelt(); w.setzeBlock(5, 64, 5, SC.B.TUER_X, "system"); var g = bwMesh(w).durchsichtig, bx = bwBereich(g, 0), bz = bwBereich(g, 2);
  wahr(bx[1] - bx[0] < 0.2 && bz[1] - bz[0] > 0.9, "Tür zu: dünn in x, breit in z"); gleich(bx[0] > 5.3 && bx[1] < 5.7, true, "Tür in der Mitte");
  var w2 = leereWelt(); w2.setzeBlock(5, 64, 5, SC.B.LEITER_N, "system"); var g2 = bwMesh(w2).durchsichtig, z2 = bwBereich(g2, 2); wahr(z2[1] - z2[0] < 0.2 && z2[0] < 5.2, "Leiter Nord an der Nordkante des Blocks");
  var w3 = leereWelt(); w3.setzeBlock(5, 64, 5, SC.B.LEITER_O, "system"); var x3 = bwBereich(bwMesh(w3).durchsichtig, 0); wahr(x3[1] > 5.8, "Leiter Ost an der Ostkante");
  var w4 = leereWelt(); w4.setzeBlock(5, 64, 5, SC.B.TUER_X_OFFEN, "system"); var z4 = bwBereich(bwMesh(w4).durchsichtig, 2); wahr(z4[1] - z4[0] < 0.2, "offene Tür seitlich: dünn in z");
});
test("Kollision: Zaun und geschlossene Tür sperren, Fackel und offene Tür nicht (#102)", function(){
  var w = leereWelt(); [[SC.B.ZAUN, 4], [SC.B.TUER_X, 6], [SC.B.FACKEL, 8], [SC.B.TUER_X_OFFEN, 10], [SC.B.LEITER_N, 12]].forEach(function(p){ w.setzeBlock(p[1], 64, 5, p[0], "system"); });
  function laufe(x){ return SC.bewegeKoerper(w, [x - 0.5, 64, 5.5], 0, 0.9, 0.6, 1.8); }
  gleich(laufe(4.2), true, "Zaun"); gleich(laufe(6.2), true, "Tür zu"); gleich(laufe(8.2), false, "Fackel"); gleich(laufe(10.2), false, "Tür offen"); gleich(laufe(12.2), false, "Leiter");
});
function bwWelt(){ var w = leereWelt(); w.setzeBlock(5, 64, 5, SC.B.STEIN, "system"); return w; }
test("Aufstellen: Leiter wählt die Variante nach der Wand, ohne Wand abgelehnt (#102)", function(){
  var w = bwWelt(), A = SC.Bauteile.aufstellId, L = SC.B.LEITER_N;
  gleich(A(w, L, { x: 5, y: 64, z: 5, nx: 0, ny: 0, nz: 1 }, [0, 0, -1]), SC.B.LEITER_N, "Wand im Norden");
  gleich(A(w, L, { x: 5, y: 64, z: 5, nx: 0, ny: 0, nz: -1 }, [0, 0, 1]), SC.B.LEITER_S, "Wand im Süden");
  gleich(A(w, L, { x: 5, y: 64, z: 5, nx: 1, ny: 0, nz: 0 }, [-1, 0, 0]), SC.B.LEITER_W, "Wand im Westen");
  gleich(A(w, L, { x: 5, y: 64, z: 5, nx: -1, ny: 0, nz: 0 }, [1, 0, 0]), SC.B.LEITER_O, "Wand im Osten");
  gleich(A(w, L, { x: 5, y: 64, z: 5, nx: 0, ny: 1, nz: 0 }, [0, 0, -1]), 0, "auf der Oberseite hält keine Leiter");
  gleich(A(w, L, { x: 9, y: 64, z: 9, nx: 0, ny: 0, nz: 1 }, [0, 0, -1]), 0, "gegen Luft keine Wand");
  w.setzeBlock(7, 64, 7, SC.B.LEITER_O, "system"); gleich(A(w, L, { x: 7, y: 64, z: 7, nx: 0, ny: 1, nz: 0 }, [0, 0, -1]), SC.B.LEITER_O, "Leiter nach oben verlängern");
});
test("Aufstellen: Tür nach Blickrichtung, andere Blöcke unverändert (#102)", function(){
  var w = bwWelt(), z = { x: 5, y: 64, z: 5, nx: 0, ny: 1, nz: 0 }, A = SC.Bauteile.aufstellId;
  gleich(A(w, SC.B.TUER_X, z, [1, 0, 0.2]), SC.B.TUER_X); gleich(A(w, SC.B.TUER_X, z, [-1, 0, 0.2]), SC.B.TUER_X); gleich(A(w, SC.B.TUER_X, z, [0.1, 0, -1]), SC.B.TUER_Z);
  [SC.B.FACKEL, SC.B.ZAUN, SC.B.STEIN, SC.B.TRUHE, SC.B.WERKBANK].forEach(function(id){ gleich(A(w, id, z, [1, 0, 0]), id); });
});
test("kannSetzen: dünne Bauteile dürfen den Spieler überlappen, feste nicht (#102)", function(){
  var w = leereWelt(), s = new SC.Spieler({ id: "a", pos: [5.5, 64, 5.5], modus: "survival" });
  gleich(SC.kannSetzen(w, s, 5, 65, 5), false, "Stein in den Spieler"); gleich(SC.kannSetzen(w, s, 5, 65, 5, SC.B.STEIN), false); gleich(SC.kannSetzen(w, s, 5, 65, 5, SC.B.ZAUN), false, "Zaun ist fest");
  gleich(SC.kannSetzen(w, s, 5, 65, 5, SC.B.LEITER_N), true, "Leiter beim Klettern"); gleich(SC.kannSetzen(w, s, 5, 64, 5, SC.B.FACKEL), true);
});
test("Setzen aus dem Rucksack: Leiter an die Wand, Tür nach Blick, Menge sinkt (#102)", function(){
  var w = bwWelt(), sp = new SC.Spieler({ id: "a", pos: [5.5, 64, 9.5], modus: "survival" }); sp.blick = [Math.PI, 0];    // blickt nach +z? richtung() liefert [-sin, ., -cos]
  var rs = new SC.Rucksack(); rs.lege({ block: SC.B.LEITER_N, anzahl: 2 }); rs.lege({ block: SC.B.TUER_X, anzahl: 1 });
  var fake = { spieler: sp, kampf: { rucksack: rs }, welt: w }, setze = SC.Spiel.prototype.setzeAusRucksack;
  sp.auswahl = 0; gleich(setze.call(fake, 5, 64, 6, { x: 5, y: 64, z: 5, nx: 0, ny: 0, nz: 1 }), true); gleich(w.holeBlock(5, 64, 6), SC.B.LEITER_N); gleich(rs.hat(SC.B.LEITER_N), 1);
  gleich(setze.call(fake, 8, 64, 8, { x: 8, y: 63, z: 8, nx: 0, ny: 1, nz: 0 }), false, "Leiter ohne Wand abgelehnt"); gleich(rs.hat(SC.B.LEITER_N), 1, "nichts verbraucht");
  sp.pos = [5.5, 64, 12.5]; sp.auswahl = 1; sp.blick = [-Math.PI / 2, 0];   // Blick entlang x
  gleich(setze.call(fake, 9, 64, 5, { x: 9, y: 63, z: 5, nx: 0, ny: 1, nz: 0 }), true); wahr([SC.B.TUER_X, SC.B.TUER_Z].indexOf(w.holeBlock(9, 64, 5)) >= 0, "Tür steht"); gleich(rs.hat(SC.B.TUER_X), 0);
});
test("Tür umschalten: auf, zu, nicht in den Spieler hinein (#104)", function(){
  var w = leereWelt(), U = SC.Bauteile.tuerUmschalten; w.setzeBlock(5, 64, 5, SC.B.TUER_X, "system"); w.setzeBlock(8, 64, 5, SC.B.TUER_Z_OFFEN, "system");
  var ereignisse = []; w.ereignisse.an("block", function(e){ ereignisse.push(e); });
  gleich(U(w, 5, 64, 5, []), true); gleich(w.holeBlock(5, 64, 5), SC.B.TUER_X_OFFEN); gleich(U(w, 5, 64, 5, []), true); gleich(w.holeBlock(5, 64, 5), SC.B.TUER_X);
  gleich(U(w, 8, 64, 5, []), true); gleich(w.holeBlock(8, 64, 5), SC.B.TUER_Z); gleich(ereignisse.length, 3, "jede Änderung ist ein Block-Ereignis"); gleich(ereignisse[0].quelle, "spieler");
  w.setzeBlock(5, 64, 5, SC.B.TUER_X_OFFEN, "system"); gleich(U(w, 5, 64, 5, [{ pos: [5.5, 64, 5.5] }]), false, "zu, aber Spieler steht in der Tür"); gleich(w.holeBlock(5, 64, 5), SC.B.TUER_X_OFFEN);
  gleich(U(w, 5, 64, 5, [{ pos: [5.5, 64, 7.5] }]), true, "Spieler daneben"); gleich(U(w, 6, 64, 5, []), false, "keine Tür");
});
test("Tür antippen schaltet um, auch als Gast mit Verbindung (#104)", function(){
  var w = leereWelt(); w.setzeBlock(5, 64, 5, SC.B.TUER_Z, "system"); var sp = new SC.Spieler({ id: "a", pos: [5.5, 64, 8.5], modus: "survival" });
  var fake = { welt: w, spieler: sp, kampf: {}, eingabe: { gebeMausFrei: function(){} }, ui: {}, _blockErlaubt: function(){ return fake.ok; }, ok: true };
  gleich(SC.Spiel.prototype.benutzeBlock.call(fake, { x: 5, y: 64, z: 5 }), true); gleich(w.holeBlock(5, 64, 5), SC.B.TUER_Z_OFFEN);
  fake.ok = false; gleich(SC.Spiel.prototype.benutzeBlock.call(fake, { x: 5, y: 64, z: 5 }), true, "behandelt, aber ohne Verbindung unverändert"); gleich(w.holeBlock(5, 64, 5), SC.B.TUER_Z_OFFEN);
});
test("Leiter: Spieler hängt, steigt mit Vorwärts und sinkt mit Rückwärts (#104)", function(){
  var w = flacheWelt(); for(var y = 61; y <= 66; y++){ w.setzeBlock(4, y, 4, SC.B.LEITER_N, "system"); w.setzeBlock(4, y, 3, SC.B.STEIN, "system"); }   // Wand im Norden
  var s = new SC.Spieler({ id: "a", pos: [4.5, 61, 4.5], blick: [0, 0], modus: "survival" }); s.schritt(w, ruhe, 1 / 60);
  var hoch = Object.assign({}, ruhe, { vor: true }); for(var i = 0; i < 60; i++) s.schritt(w, hoch, 1 / 60); wahr(s.pos[1] > 62.5, "steigt: " + s.pos[1]); gleich(s.klettert, true);
  var h = s.pos[1]; for(var j = 0; j < 60; j++) s.schritt(w, ruhe, 1 / 60); wahr(Math.abs(s.pos[1] - h) < 0.05, "hängt ohne Eingabe: " + (s.pos[1] - h));
  for(var k = 0; k < 60; k++) s.schritt(w, Object.assign({}, ruhe, { zurueck: true }), 1 / 60); wahr(s.pos[1] < h - 1, "sinkt");
  var f = new SC.Spieler({ id: "b", pos: [2.5, 66, 2.5], blick: [0, 0], modus: "survival" }); for(var m = 0; m < 30; m++) f.schritt(w, ruhe, 1 / 60); wahr(f.pos[1] < 65, "ohne Leiter fällt man");
});
