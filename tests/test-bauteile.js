// Crafting (Stufe 6a): Bauteile mit Sonderformen, Türen, Leitern
function bwFlaechen(g){ return g.indizes.length / 6; }
function bwMesh(w){ return SC.Mesher.chunk(w, 0, 0, SC.Licht.chunk(w, 0, 0)); }
function bwBereich(g, achse){ var lo = 1e9, hi = -1e9; for(var i = achse; i < g.positionen.length; i += 3){ lo = Math.min(lo, g.positionen[i]); hi = Math.max(hi, g.positionen[i]); } return [lo, hi]; }
test("Fackel: zwei Kreuzflächen, leuchtet, lässt Licht durch (#102)", function(){
  var w = leereWelt(); w.setzeBlock(5, 64, 5, SC.B.FACKEL, "system"); var m = bwMesh(w);
  gleich(bwFlaechen(m.form), 2); gleich(bwFlaechen(m.fest), 256, "nur der Boden im festen Teil");
  var l = SC.Licht.chunk(w, 0, 0); wahr(l.block[SC.idx(5, 64, 5)] >= 13, "Fackel leuchtet: " + l.block[SC.idx(5, 64, 5)]); gleich(l.himmel[SC.idx(5, 60, 5)], 15, "Himmelslicht geht durch");
  [SC.B.FACKEL, SC.B.ZAUN, SC.B.TUER_X, SC.B.LEITER_N, SC.B.TRUHE === 0 ? 0 : SC.B.FACKEL].forEach(function(id){ gleich(SC.Licht.opak[id], 0, "nicht deckend: " + SC.BLOECKE[id].name); });
});
test("Zaun: schmaler Pfosten, verbindet sich mit Nachbarzäunen (#102)", function(){
  var w = leereWelt(); w.setzeBlock(5, 64, 5, SC.B.ZAUN, "system"); var g = bwMesh(w).form; gleich(bwFlaechen(g), 5, "Pfosten: 4 Seiten und oben");
  var bx = bwBereich(g, 0); wahr(bx[1] - bx[0] < 0.3, "schmal: " + (bx[1] - bx[0]));
  w.setzeBlock(6, 64, 5, SC.B.ZAUN, "system"); var g2 = bwMesh(w).form; wahr(bwFlaechen(g2) > 10, "Querlatten zwischen den Pfosten: " + bwFlaechen(g2));
});
test("Tür und Leiter sind dünne Platten (#102)", function(){
  var w = leereWelt(); w.setzeBlock(5, 64, 5, SC.B.TUER_X, "system"); var g = bwMesh(w).form, bx = bwBereich(g, 0), bz = bwBereich(g, 2);
  wahr(bx[1] - bx[0] < 0.2 && bz[1] - bz[0] > 0.9, "Tür zu: dünn in x, breit in z"); gleich(bx[0] > 5.3 && bx[1] < 5.7, true, "Tür in der Mitte");
  var w2 = leereWelt(); w2.setzeBlock(5, 64, 5, SC.B.LEITER_N, "system"); var g2 = bwMesh(w2).form, z2 = bwBereich(g2, 2); wahr(z2[1] - z2[0] < 0.2 && z2[0] < 5.2, "Leiter Nord an der Nordkante des Blocks");
  var w3 = leereWelt(); w3.setzeBlock(5, 64, 5, SC.B.LEITER_O, "system"); var x3 = bwBereich(bwMesh(w3).form, 0); wahr(x3[1] > 5.8, "Leiter Ost an der Ostkante");
  var w4 = leereWelt(); w4.setzeBlock(5, 64, 5, SC.B.TUER_X_OFFEN, "system"); var z4 = bwBereich(bwMesh(w4).form, 2); wahr(z4[1] - z4[0] < 0.2, "offene Tür seitlich: dünn in z");
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
test("Tür umschalten: auf, zu, nicht in den Spieler hinein (#103)", function(){
  var w = leereWelt(), U = SC.Bauteile.tuerUmschalten; w.setzeBlock(5, 64, 5, SC.B.TUER_X, "system"); w.setzeBlock(8, 64, 5, SC.B.TUER_Z_OFFEN, "system");
  var ereignisse = []; w.ereignisse.an("block", function(e){ ereignisse.push(e); });
  gleich(U(w, 5, 64, 5, []), true); gleich(w.holeBlock(5, 64, 5), SC.B.TUER_X_OFFEN); gleich(U(w, 5, 64, 5, []), true); gleich(w.holeBlock(5, 64, 5), SC.B.TUER_X);
  gleich(U(w, 8, 64, 5, []), true); gleich(w.holeBlock(8, 64, 5), SC.B.TUER_Z); gleich(ereignisse.length, 3, "jede Änderung ist ein Block-Ereignis"); gleich(ereignisse[0].quelle, "spieler");
  w.setzeBlock(5, 64, 5, SC.B.TUER_X_OFFEN, "system"); gleich(U(w, 5, 64, 5, [{ pos: [5.5, 64, 5.5] }]), false, "zu, aber Spieler steht in der Tür"); gleich(w.holeBlock(5, 64, 5), SC.B.TUER_X_OFFEN);
  gleich(U(w, 5, 64, 5, [{ pos: [5.5, 64, 7.5] }]), true, "Spieler daneben"); gleich(U(w, 6, 64, 5, []), false, "keine Tür");
});
test("Tür antippen schaltet um, auch als Gast mit Verbindung (#103)", function(){
  var w = leereWelt(); w.setzeBlock(5, 64, 5, SC.B.TUER_Z, "system"); var sp = new SC.Spieler({ id: "a", pos: [5.5, 64, 8.5], modus: "survival" });
  var fake = { welt: w, spieler: sp, kampf: {}, eingabe: { gebeMausFrei: function(){} }, ui: {}, _blockErlaubt: function(){ return fake.ok; }, ok: true };
  gleich(SC.Spiel.prototype.benutzeBlock.call(fake, { x: 5, y: 64, z: 5 }), true); gleich(w.holeBlock(5, 64, 5), SC.B.TUER_Z_OFFEN);
  fake.ok = false; gleich(SC.Spiel.prototype.benutzeBlock.call(fake, { x: 5, y: 64, z: 5 }), true, "behandelt, aber ohne Verbindung unverändert"); gleich(w.holeBlock(5, 64, 5), SC.B.TUER_Z_OFFEN);
});
test("Leiter: Spieler hängt, steigt mit Vorwärts und sinkt mit Rückwärts (#103)", function(){
  var w = flacheWelt(); for(var y = 61; y <= 66; y++){ w.setzeBlock(4, y, 4, SC.B.LEITER_N, "system"); w.setzeBlock(4, y, 3, SC.B.STEIN, "system"); }   // Wand im Norden
  var s = new SC.Spieler({ id: "a", pos: [4.5, 61, 4.5], blick: [0, 0], modus: "survival" }); s.schritt(w, ruhe, 1 / 60);
  var hoch = Object.assign({}, ruhe, { vor: true }); for(var i = 0; i < 60; i++) s.schritt(w, hoch, 1 / 60); wahr(s.pos[1] > 62.5, "steigt: " + s.pos[1]); gleich(s.klettert, true);
  var h = s.pos[1]; for(var j = 0; j < 60; j++) s.schritt(w, ruhe, 1 / 60); wahr(Math.abs(s.pos[1] - h) < 0.05, "hängt ohne Eingabe: " + (s.pos[1] - h));
  for(var k = 0; k < 60; k++) s.schritt(w, Object.assign({}, ruhe, { zurueck: true }), 1 / 60); wahr(s.pos[1] < h - 1, "sinkt");
  var f = new SC.Spieler({ id: "b", pos: [2.5, 66, 2.5], blick: [0, 0], modus: "survival" }); for(var m = 0; m < 30; m++) f.schritt(w, ruhe, 1 / 60); wahr(f.pos[1] < 65, "ohne Leiter fällt man");
});
// Wartet auf ein Versprechen und lässt dabei das Test-Netz laufen (sonst kommt keine Antwort an)
function netzWarte(u, p){
  var fertig = false, res, fehl; p.then(function(r){ fertig = true; res = r; }, function(f){ fertig = true; fehl = f; });
  return (function schleife(i){ return raumLauf(u.netz).then(function(){ if(fertig){ if(fehl) throw fehl; return res; } if(i > 30) throw new Error("keine Antwort vom Gastgeber"); return schleife(i + 1); }); })(0);
}
function tdaten(){ return SC.Spielstand.neu({ name: "T", seedText: "t", modus: "survival" }); }
test("Rucksack mit anderer Größe (Truhe: 18 Plätze) (#104)", function(){
  var r = new SC.Rucksack(null, 18); gleich(r.plaetze.length, 18); gleich(r.lege({ block: SC.B.STEIN, anzahl: 18 * 64 }), 0); gleich(r.lege({ block: SC.B.STEIN, anzahl: 1 }), 1, "voll nach 18 Plätzen");
  gleich(new SC.Rucksack().plaetze.length, 36, "Standard bleibt 36");
});
test("Truhen-Daten: legen, nehmen, speichern, leeren, alter Spielstand ohne Feld (#104)", function(){
  var d = tdaten(), planet = new SC.Planet(d.planeten.start); gleich(d.planeten.start.truhen, undefined, "alter Stand hat das Feld nicht");
  var T = SC.Truhen.von(d, planet); gleich(T.inhalt(3, 60, 3).length, 18); gleich(T.inhalt(3, 60, 3).every(function(s){ return s === null; }), true);
  gleich(T.lege(3, 60, 3, { block: SC.B.STEIN, anzahl: 70 }), 0); gleich(T.lege(3, 60, 3, { gegenstand: { id: "g1", art: "helm" } }), 0);
  var d2 = JSON.parse(JSON.stringify(d)); var T2 = SC.Truhen.von(d2, new SC.Planet(d2.planeten.start)); gleich(T2.inhalt(3, 60, 3)[0].anzahl, 64, "überlebt Speichern und Laden"); gleich(T2.inhalt(3, 60, 3)[1].anzahl, 6);
  var s = T2.nimm(3, 60, 3, 2); gleich(s.gegenstand.id, "g1"); gleich(T2.nimm(3, 60, 3, 2), null, "Platz danach leer"); gleich(T2.nimm(9, 9, 9, 0), null, "andere Truhe leer");
  var weg = T2.leeren(3, 60, 3); gleich(weg.length, 2); gleich(T2.leeren(3, 60, 3).length, 0); gleich(T2.inhalt(3, 60, 3).every(function(x){ return x === null; }), true);
  var wickel = SC.Truhen.von(d, planet); wickel.lege(-1, 60, 5, { block: SC.B.ERDE, anzahl: 1 }); gleich(wickel.inhalt(planet.groesse - 1, 60, 5)[0].anzahl, 1, "Koordinaten laufen um den Planeten");
  var voll = SC.Truhen.von(d, planet); for(var i = 0; i < 18; i++) voll.lege(1, 1, 1, { gegenstand: { id: "v" + i } }); gleich(voll.lege(1, 1, 1, { gegenstand: { id: "extra" } }), 1, "volle Truhe nimmt nichts");
});
test("Truhen-Menü: nehmen und hineinlegen über den Anbieter (#104)", function(){
  var a = wb(), d = tdaten(), T = SC.Truhen.von(d, new SC.Planet(d.planeten.start)); T.lege(1, 60, 1, { block: SC.B.EISENERZ, anzahl: 5 });
  var anb = { hole: function(){ return Promise.resolve({ plaetze: T.inhalt(1, 60, 1) }); }, nimm: function(i){ var s = T.nimm(1, 60, 1, i); return Promise.resolve({ sache: s, plaetze: T.inhalt(1, 60, 1) }); }, lege: function(s){ var r = T.lege(1, 60, 1, s); return Promise.resolve({ rest: r, plaetze: T.inhalt(1, 60, 1) }); } };
  a.k.rucksack.lege({ block: SC.B.TITAN, anzahl: 3 });
  a.ui.zeigeTruhe(a.k, anb, {});
  return new Promise(function(ok){ setTimeout(ok, 0); }).then(function(){
    gleich(a.w.querySelectorAll('[data-aktion="tplatz"]').length, 18); gleich(a.w.querySelectorAll('[data-aktion="rplatz"]').length, 36);
    a.w.querySelector('[data-aktion="tplatz"][data-i="0"]').click(); return new Promise(function(ok){ setTimeout(ok, 0); });
  }).then(function(){
    gleich(a.k.rucksack.hat(SC.B.EISENERZ), 5, "in den Rucksack genommen"); gleich(T.inhalt(1, 60, 1)[0], null, "aus der Truhe weg");
    var ti = -1; a.k.rucksack.plaetze.forEach(function(s, i){ if(s && s.block === SC.B.TITAN) ti = i; });
    a.w.querySelector('[data-aktion="rplatz"][data-i="' + ti + '"]').click(); return new Promise(function(ok){ setTimeout(ok, 0); });
  }).then(function(){ gleich(a.k.rucksack.hat(SC.B.TITAN), 0, "aus dem Rucksack"); gleich(T.inhalt(1, 60, 1)[0].anzahl, 3, "in der Truhe"); });
});
test("Truhen-Menü: voller Rucksack nimmt nichts heraus (#104)", function(){
  var a = wb(), d = tdaten(), T = SC.Truhen.von(d, new SC.Planet(d.planeten.start)); T.lege(1, 60, 1, { gegenstand: { id: "schatz", art: "helm", seltenheit: 1 } });
  for(var i = 0; i < 36; i++) a.k.rucksack.lege({ gegenstand: { id: "r" + i } });
  var anb = { hole: function(){ return Promise.resolve({ plaetze: T.inhalt(1, 60, 1) }); }, nimm: function(i){ throw new Error("darf nicht gerufen werden"); }, lege: function(){ throw new Error("nein"); } };
  a.ui.zeigeTruhe(a.k, anb, {}); return new Promise(function(ok){ setTimeout(ok, 0); }).then(function(){ a.w.querySelector('[data-aktion="tplatz"][data-i="0"]').click(); gleich(T.inhalt(1, 60, 1)[0].gegenstand.id, "schatz"); });
});
test("Truhe im Mehrspieler: Gast öffnet, legt und nimmt über den Gastgeber (#104)", function(){
  var u, a, b, H;
  return mspRaum(2).then(function(x){ u = x; a = u.gs[0]; b = u.gs[1]; u.welt.setzeBlock(5, 62, 5, SC.B.TRUHE, "system"); H = SC.Truhen.von(u.daten, u.welt.planet); return netzWarte(u, a.g.truhe(5, 62, 5)); }).then(function(r){
    gleich(r.plaetze.length, 18); return netzWarte(u, a.g.truheLege(5, 62, 5, { block: SC.B.TITAN, anzahl: 7 }));
  }).then(function(r){
    gleich(r.rest, 0); gleich(r.plaetze[0].anzahl, 7); gleich(H.inhalt(5, 62, 5)[0].anzahl, 7, "beim Gastgeber gespeichert");
    return netzWarte(u, Promise.all([a.g.truheNimm(5, 62, 5, 0), b.g.truheNimm(5, 62, 5, 0)]));
  }).then(function(rs){
    var gesamt = rs.filter(function(r){ return r.sache; }); gleich(gesamt.length, 1, "nur einer bekommt die Sache"); gleich(gesamt[0].sache.anzahl, 7); gleich(H.inhalt(5, 62, 5)[0], null);
  });
});
test("Truhe im Mehrspieler: Anfragen an Blöcke, die keine Truhe sind, bleiben leer (#104)", function(){
  var u, a;
  return mspRaum(1).then(function(x){ u = x; a = u.gs[0]; return netzWarte(u, a.g.truheLege(7, 62, 7, { block: SC.B.TITAN, anzahl: 1 })); }).then(function(r){
    gleich(r.plaetze, null, "keine Truhe"); gleich(r.rest, 1, "nichts abgelegt"); return netzWarte(u, a.g.truhe(7, 62, 7));
  }).then(function(r){ gleich(r.plaetze, null); u.welt.setzeBlock(7, 62, 7, SC.B.TRUHE, "system"); return netzWarte(u, a.g.truheLege(7, 62, 7, { block: 9999, anzahl: 1 })); })
  .then(function(r){ gleich(r.plaetze, null, "ungültige Sache abgelehnt"); gleich(r.rest, 1); return netzWarte(u, a.g.truheLege(7, 62, 7, { block: SC.B.TITAN, anzahl: -5 })); })
  .then(function(r){ gleich(r.plaetze, null, "negative Menge abgelehnt"); });
});
test("Truhe abgebaut: Inhalt fällt als Beute heraus (#104)", function(){
  var d = tdaten(), planet = new SC.Planet(d.planeten.start), w = new SC.Welt(planet), T = SC.Truhen.von(d, planet), kugeln = [];
  T.lege(3, 60, 3, { block: SC.B.TITAN, anzahl: 4 }); T.lege(3, 60, 3, { gegenstand: { id: "h", art: "helm" } });
  var fake = { daten: d, welt: w, beuteAuswerfen: function(pos, sachen){ kugeln = kugeln.concat(sachen); } };
  SC.Spiel.prototype._truheWeg.call(fake, { x: 3, y: 60, z: 3, id: SC.B.LUFT, alt: SC.B.TRUHE }); gleich(kugeln.length, 2); gleich(T.inhalt(3, 60, 3).every(function(s){ return s === null; }), true);
  kugeln = []; SC.Spiel.prototype._truheWeg.call(fake, { x: 3, y: 60, z: 3, id: SC.B.STEIN, alt: SC.B.ERDE }); gleich(kugeln.length, 0, "andere Blockänderungen ignorieren");
});
test("Block in der Hand: Fackel, Zaun, Leiter und Tür haben eigene Formen (#102)", function(){
  function geo(id){ return SC.Render.handForm(SC.BLOECKE[id]); }
  gleich(geo(SC.B.STEIN), null, "Würfel bleiben ein Würfel");
  var fackel = geo(SC.B.FACKEL), zaun = geo(SC.B.ZAUN), leiter = geo(SC.B.LEITER_N), tuer = geo(SC.B.TUER_X);
  wahr(fackel && zaun && leiter && tuer, "alle vier haben eine Form");
  gleich(fackel.attributes.position.count, 8, "Fackel: zwei Kreuzflächen"); wahr(zaun.attributes.position.count > 24, "Zaun: Pfosten mit Latten");
  [fackel, zaun, leiter, tuer].forEach(function(g){ gleich(g.attributes.uv.count, g.attributes.position.count, "UV je Ecke"); gleich(g.index.count % 3, 0); });
  leiter.computeBoundingBox(); var d = leiter.boundingBox.max.z - leiter.boundingBox.min.z; wahr(d < 0.06, "Leiter ist dünn: " + d);
  var uvF = SC.Mesher.uvFuer(SC.BLOECKE[SC.B.FACKEL].seiten.seite), u = fackel.attributes.uv; for(var i = 0; i < u.count; i++) wahr(u.getX(i) >= uvF[0] - 1e-6 && u.getX(i) <= uvF[2] + 1e-6, "UV liegt in der Fackelkachel");
});
test("Hand im Survival zeigt den Block aus dem Rucksack, nicht aus der Kreativ-Leiste (#102)", function(){
  var sp = new SC.Spieler({ id: "a", pos: [1, 70, 1], modus: "survival", schnellleiste: [SC.B.GRAS, SC.B.ERDE, SC.B.STEIN, 1, 1, 1, 1, 1, 1] }), rs = new SC.Rucksack();
  rs.plaetze[0] = { block: SC.B.FACKEL, anzahl: 3 }; rs.plaetze[1] = { gegenstand: { id: "w", art: "laserschwert" } };
  var fake = { spieler: sp, kampf: { rucksack: rs } }, setze = SC.Spiel.prototype._handSetzen;
  sp.auswahl = 0; setze.call(fake); gleich(SC.Render.handId(sp), SC.B.FACKEL, "Fackel aus dem Rucksack");
  sp.auswahl = 1; setze.call(fake); gleich(SC.Render.handId(sp), -1, "Waffe: kein Block in der Hand"); sp.auswahl = 2; setze.call(fake); gleich(SC.Render.handId(sp), -1, "leerer Platz");
  sp.modus = "kreativ"; sp.auswahl = 0; setze.call(fake); gleich(SC.Render.handId(sp), SC.B.GRAS, "Kreativ nutzt die Leiste"); sp.modus = "zuschauer"; gleich(SC.Render.handId(sp), -1);
});
function tuerWelt(){ var w = leereWelt(); for(var y = 64; y <= 66; y++) for(var z = 3; z <= 7; z++) if(z !== 5) w.setzeBlock(5, y, z, SC.B.STEIN, "system"); return w; }   // Wand in z-Richtung, Lücke bei z=5
test("Tür ist zwei Blöcke hoch: Oberteile mit eigenen IDs (#106)", function(){
  gleich(SC.B.TUER_X_OBEN, 58); gleich(SC.B.TUER_Z_OBEN, 59); gleich(SC.B.TUER_X_OFFEN_OBEN, 60); gleich(SC.B.TUER_Z_OFFEN_OBEN, 61);
  [SC.B.TUER_X_OBEN, SC.B.TUER_Z_OBEN].forEach(function(id){ wahr(SC.BLOECKE[id].fest, "zu: fest"); }); [SC.B.TUER_X_OFFEN_OBEN, SC.B.TUER_Z_OFFEN_OBEN].forEach(function(id){ wahr(!SC.BLOECKE[id].fest, "offen: durchgängig"); });
  [SC.B.TUER_X_OBEN, SC.B.TUER_Z_OBEN, SC.B.TUER_X_OFFEN_OBEN, SC.B.TUER_Z_OFFEN_OBEN].forEach(function(id){ gleich(SC.Abbau.ergibt(id), SC.B.TUER_X, "Abbau liefert die Tür"); wahr(SC.BLOECKE[id].name && SC.BLOECKE[id].zerstoerbar && !SC.BLOECKE[id].inAuswahl); gleich(SC.BLOECKE[id].form.typ, "platte"); wahr(SC.Mesher.atlasNamen.indexOf(SC.BLOECKE[id].seiten.seite) >= 0); });
  gleich(SC.BLOECKE[SC.B.TUER_X_OBEN].form.achse, SC.BLOECKE[SC.B.TUER_X].form.achse, "Oberteil wie Unterteil ausgerichtet"); gleich(SC.BLOECKE[SC.B.TUER_Z_OFFEN_OBEN].form.versatz, SC.BLOECKE[SC.B.TUER_Z_OFFEN].form.versatz);
});
test("Tür aufstellen: zwei Blöcke, nur mit Platz darüber und ohne Spieler (#106)", function(){
  var w = leereWelt(), sp = new SC.Spieler({ id: "a", pos: [2.5, 64, 2.5], modus: "survival" }), S = SC.Bauteile.setze;
  gleich(S(w, sp, 5, 64, 5, SC.B.TUER_X), true); gleich(w.holeBlock(5, 64, 5), SC.B.TUER_X); gleich(w.holeBlock(5, 65, 5), SC.B.TUER_X_OBEN);
  gleich(S(w, sp, 8, 64, 5, SC.B.TUER_Z), true); gleich(w.holeBlock(8, 65, 5), SC.B.TUER_Z_OBEN);
  w.setzeBlock(10, 65, 5, SC.B.STEIN, "system"); gleich(S(w, sp, 10, 64, 5, SC.B.TUER_X), false, "Decke direkt darüber"); gleich(w.holeBlock(10, 64, 5), SC.B.LUFT, "nichts gesetzt");
  sp.pos = [12.5, 65, 5.5]; gleich(S(w, sp, 12, 64, 5, SC.B.TUER_X), false, "Kopf des Spielers im oberen Block"); gleich(w.holeBlock(12, 64, 5), SC.B.LUFT);
  gleich(S(w, sp, 14, 64, 5, SC.B.STEIN), true); gleich(w.holeBlock(14, 65, 5), SC.B.LUFT, "andere Blöcke bleiben einzeln");
});
test("Tür umschalten: beide Hälften, von oben oder unten, mit Spieler-Prüfung für beide Zellen (#106)", function(){
  var w = leereWelt(), sp = new SC.Spieler({ id: "a", pos: [2.5, 64, 2.5], modus: "survival" }), U = SC.Bauteile.tuerUmschalten; SC.Bauteile.setze(w, sp, 5, 64, 5, SC.B.TUER_X);
  gleich(U(w, 5, 65, 5, [sp]), true, "von oben antippen"); gleich(w.holeBlock(5, 64, 5), SC.B.TUER_X_OFFEN); gleich(w.holeBlock(5, 65, 5), SC.B.TUER_X_OFFEN_OBEN);
  gleich(U(w, 5, 64, 5, [{ pos: [5.5, 65, 5.5] }]), false, "Spieler steht mit dem Kopf im oberen Block"); gleich(w.holeBlock(5, 65, 5), SC.B.TUER_X_OFFEN_OBEN);
  gleich(U(w, 5, 64, 5, [sp]), true, "von unten schließen"); gleich(w.holeBlock(5, 64, 5), SC.B.TUER_X); gleich(w.holeBlock(5, 65, 5), SC.B.TUER_X_OBEN);
  w.setzeBlock(8, 64, 5, SC.B.TUER_Z, "system"); gleich(U(w, 8, 64, 5, []), true, "alte Einzeltür ohne Oberteil geht weiter"); gleich(w.holeBlock(8, 64, 5), SC.B.TUER_Z_OFFEN);
});
test("Durch die offene Tür geht man hindurch, durch die geschlossene nicht (#106)", function(){
  var w = tuerWelt(), sp = new SC.Spieler({ id: "a", pos: [2.5, 64, 2.5], modus: "survival" }); SC.Bauteile.setze(w, sp, 5, 64, 5, SC.B.TUER_X);
  function lauf(){ var p = [3.6, 64, 5.5]; for(var i = 0; i < 12; i++) SC.bewegeKoerper(w, p, 0, 0.2, 0.6, 1.8); return p[0]; }
  wahr(lauf() < 4.75, "zu: nur bis vor die Tür: " + lauf()); SC.Bauteile.tuerUmschalten(w, 5, 64, 5, [sp]); wahr(lauf() > 6, "offen: durch beide Blöcke hindurch: " + lauf());
});
test("Tür abgebaut: die andere Hälfte verschwindet mit (#106)", function(){
  var w = leereWelt(), sp = new SC.Spieler({ id: "a", pos: [2.5, 64, 2.5], modus: "survival" }); SC.Bauteile.setze(w, sp, 5, 64, 5, SC.B.TUER_X); SC.Bauteile.setze(w, sp, 8, 64, 5, SC.B.TUER_Z);
  var fake = { welt: w }; w.ereignisse.an("block", function(b){ SC.Spiel.prototype._tuerWeg.call(fake, b); });
  w.setzeBlock(5, 64, 5, SC.B.LUFT, "spieler"); gleich(w.holeBlock(5, 65, 5), SC.B.LUFT, "unten abgebaut, oben weg");
  w.setzeBlock(8, 65, 5, SC.B.LUFT, "spieler"); gleich(w.holeBlock(8, 64, 5), SC.B.LUFT, "oben abgebaut, unten weg");
  w.setzeBlock(5, 64, 5, SC.B.TUER_X, "system"); w.setzeBlock(5, 65, 5, SC.B.STEIN, "system"); w.setzeBlock(5, 64, 5, SC.B.LUFT, "spieler"); gleich(w.holeBlock(5, 65, 5), SC.B.STEIN, "nur Türteile werden mitgenommen");
  w.setzeBlock(5, 64, 5, SC.B.TUER_X, "system"); w.setzeBlock(5, 65, 5, SC.B.TUER_X_OFFEN_OBEN, "system"); w.setzeBlock(5, 64, 5, SC.B.TUER_X_OFFEN, "spieler"); gleich(w.holeBlock(5, 65, 5), SC.B.TUER_X_OFFEN_OBEN, "Auf- und Zuschalten lässt beide stehen");
});
