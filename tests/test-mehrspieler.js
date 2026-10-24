// Laufender Abgleich im Raum: Blöcke, Zustand der Spieler, Tageszeit, gespiegelte Gegner (nutzt die Helfer aus test-raum.js)
// Gastgeber + n Gäste, alle drin; jeder Gast hat eine eigene Welt aus den übertragenen Chunks
function mspRaum(n){
  var u, gs = [];
  return raumOffen({ antwort: true }).then(function(x){
    u = x; u.welt.setzeBlock(5, 62, 5, SC.B.LUFT, "system"); u.welt.setzeBlock(6, 62, 5, SC.B.LUFT, "system");
    u.ereignisse = []; u.welt.ereignisse.an("block", function(b){ u.ereignisse.push(b); });
    var p = Promise.resolve();
    for(var i = 0; i < n; i++) (function(i){
      p = p.then(function(){ var r = raumGast(u, "G" + i); gs.push(r); return raumBeitritt(u, r).then(function(){
        var ch = {}; r.chunks.forEach(function(c){ ch[c.k] = c.u8; });
        r.welt = new SC.Welt(new SC.Planet({ id: "start", seed: 1234 }), ch); r.zurueck = []; r.nachr = []; r.id = r.figur.figurId;
        r.g.o.beiBlockZurueck = function(x, y, z, id, w){ r.zurueck.push({ x: x, y: y, z: z, id: id, wunsch: w }); };
        r.g.o.beiNachricht = function(m){ r.nachr.push(m); };
        r.g.bindeWelt(r.welt);
      }); });
    })(i);
    return p;
  }).then(function(){ u.gs = gs; return u; });
}
function mspIch(o){ var i = { pos: [1, 80, 2], blick: [0, 0], modus: "survival", stufe: 1, ausr: { ruestung: null, waffe: null }, menue: false, lebt: true }; for(var k in o) i[k] = o[k]; return i; }

test("Mehrspieler: Block vom Gast landet beim Gastgeber und beim zweiten Gast", function(){
  var u, a, b;
  return mspRaum(2).then(function(x){ u = x; a = u.gs[0]; b = u.gs[1];
    wahr(a.welt.naechsteId >= 1e9, "Gast-Kugeln ab 1e9");
    a.welt.setzeBlock(5, 62, 5, SC.B.BRETTER, "spieler"); return raumLauf(u.netz);
  }).then(function(){
    gleich(u.welt.holeBlock(5, 62, 5), SC.B.BRETTER); gleich(b.welt.holeBlock(5, 62, 5), SC.B.BRETTER); gleich(a.welt.holeBlock(5, 62, 5), SC.B.BRETTER);
    gleich(letzter(u.ereignisse).quelle, "netz:" + a.id); gleich(a.zurueck.length, 0); gleich(b.zurueck.length, 0);
  });
});

test("Mehrspieler: Block vom Gastgeber landet beim Gast", function(){
  var u, a, gastEreignisse = [];
  return mspRaum(1).then(function(x){ u = x; a = u.gs[0]; a.welt.ereignisse.an("block", function(e){ gastEreignisse.push(e); });
    u.welt.setzeBlock(6, 62, 5, SC.B.STEIN, "spieler"); return raumLauf(u.netz);
  }).then(function(){
    gleich(a.welt.holeBlock(6, 62, 5), SC.B.STEIN); gleich(gastEreignisse.length, 1); gleich(gastEreignisse[0].quelle, "netz");
    gleich(u.ereignisse.length, 1, "kein Echo zurück zum Gastgeber");
  });
});

test("Mehrspieler: Blockkonflikt: Gastgeber gewinnt, Rucksack bekommt Block zurück", function(){
  var u, a, rs = new SC.Rucksack([{ block: SC.B.BRETTER, anzahl: 3 }]);
  return mspRaum(1).then(function(x){ u = x; a = u.gs[0];
    a.g.o.beiBlockZurueck = function(x, y, z, id, w){ a.zurueck.push({ id: id, wunsch: w }); SC.Raum.blockZurueck(rs, w, id); };
    u.welt.setzeBlock(5, 62, 5, SC.B.STEIN, "spieler");
    // Gast setzt vor dem Zustellen Bretter aus dem Rucksack an dieselbe Stelle
    wahr(a.welt.setzeBlock(5, 62, 5, SC.B.BRETTER, "spieler")); rs.verbrauche(0); gleich(rs.hat(SC.B.BRETTER), 2);
    return raumLauf(u.netz);
  }).then(function(){
    gleich(u.welt.holeBlock(5, 62, 5), SC.B.STEIN); gleich(a.welt.holeBlock(5, 62, 5), SC.B.STEIN);
    gleich(a.zurueck.length, 1); gleich(a.zurueck[0].id, SC.B.STEIN); gleich(a.zurueck[0].wunsch.id, SC.B.BRETTER); gleich(rs.hat(SC.B.BRETTER), 3);
  });
});

test("Mehrspieler: blockZurueck nimmt einen abgebauten Block wieder heraus", function(){
  var rs = new SC.Rucksack([{ block: SC.B.ERDE, anzahl: 2 }, { block: SC.B.STEIN, anzahl: 1 }]);
  gleich(SC.Raum.blockZurueck(rs, { id: SC.B.LUFT, alt: SC.B.GRAS }, SC.B.LUFT).heraus, 1); gleich(rs.hat(SC.B.ERDE), 1, "Gras ergibt Erde");
  SC.Raum.blockZurueck(rs, { id: SC.B.LUFT, alt: SC.B.STEIN }, SC.B.STEIN); gleich(rs.hat(SC.B.STEIN), 0); gleich(rs.plaetze[1], null);
  gleich(SC.Raum.blockZurueck(rs, { id: SC.B.LUFT, alt: SC.B.KIES }, SC.B.KIES).heraus, 0, "nicht mehr da: nichts");
  gleich(SC.Raum.blockZurueck(rs, null, SC.B.STEIN).zurueck, 0);
});

test("Mehrspieler: Abbauen zweimal: der zweite Gast bekommt keinen Block geschenkt", function(){
  var u, a, b, rsB = new SC.Rucksack();
  return mspRaum(2).then(function(x){ u = x; a = u.gs[0]; b = u.gs[1];
    u.welt.setzeBlock(5, 62, 5, SC.B.STEIN, "spieler"); return raumLauf(u.netz);
  }).then(function(){
    b.g.o.beiBlockZurueck = function(x, y, z, id, w){ SC.Raum.blockZurueck(rsB, w, id); };
    a.welt.setzeBlock(5, 62, 5, SC.B.LUFT, "spieler"); rsB.lege({ block: SC.B.STEIN, anzahl: 1 }); b.welt.setzeBlock(5, 62, 5, SC.B.LUFT, "spieler");
    return raumLauf(u.netz);
  }).then(function(){ gleich(u.welt.holeBlock(5, 62, 5), SC.B.LUFT); gleich(rsB.hat(SC.B.STEIN), 0); gleich(a.zurueck.length, 0); });
});

test("Mehrspieler: Zustand wird verteilt", function(){
  var u, a, b, hId;
  return mspRaum(2).then(function(x){ u = x; a = u.gs[0]; b = u.gs[1]; hId = u.daten.spieler.figurId;
    a.g.takt(0.01, mspIch({ pos: [7, 70, 7] })); return raumLauf(u.netz);
  }).then(function(){
    wahr(u.h.spieler[0].pos[0] !== 7, "unter 15 Hz noch nichts gesendet");
    a.g.takt(0.06, mspIch({ pos: [7, 70, 7], stufe: 3, ausr: { ruestung: null, waffe: { art: "blaster" } } })); return raumLauf(u.netz);
  }).then(function(){
    gleich(u.h.spieler[0].pos[0], 7); gleich(u.h.spieler[0].stufe, 3); gleich(u.h.spieler[0].ausr.waffe.art, "blaster"); wahr(letzter(u.nachrichten).n.ausr !== undefined);
    a.g.takt(0.1, mspIch({ pos: [8, 70, 7], stufe: 3, ausr: { ruestung: null, waffe: { art: "blaster" } } })); return raumLauf(u.netz);
  }).then(function(){
    gleich(u.h.spieler[0].pos[0], 8); gleich(letzter(u.nachrichten).n.ausr, undefined, "Ausrüstung nur bei Änderung"); gleich(u.h.spieler[0].ausr.waffe.art, "blaster");
    u.h.takt(0.1, mspIch({ pos: [2, 75, 3], menue: true })); return raumLauf(u.netz);
  }).then(function(){
    var m = b.g.mitspieler[a.id]; wahr(!!m, "B kennt A"); gleich(m.pos[0], 8); gleich(m.stufe, 3); gleich(m.ausr.waffe.art, "blaster");
    gleich(b.g.mitspieler[hId].pos[1], 75); gleich(b.g.mitspieler[hId].menue, true); gleich(a.g.mitspieler[a.id], undefined, "eigener Zustand kommt nicht zurück");
    var ziele = SC.Raum.mitspielerZiele(u.h, mspIch({ pos: [2, 75, 3] }));
    gleich(ziele.length, 3); gleich(ziele[0].id, hId); gleich(ziele[1].id, a.id); gleich(ziele[1].pos[0], 8); gleich(ziele[1].lebt, true); gleich(ziele[1].modus, "survival");
  });
});

test("Mehrspieler: Gastgeber spiegelt Gegner und Geschosse an die Gäste", function(){
  var u, a, g;
  return mspRaum(1).then(function(x){ u = x; a = u.gs[0];
    g = SC.Wesen.neu(u.welt, "gegner", { gegnerArt: "krabbler", stufe: 2, pos: [4, 70, 4], lp: 10, lpMax: 12, boss: false, blick: 1.5 });
    SC.Wesen.neu(u.welt, "geschoss", { pos: [5, 71, 5], richtung: [1, 0, 0], tempo: 20, team: "gegner", art: "spucke", farbe: "#00ff00", lebensdauer: 3 });
    SC.Wesen.neu(u.welt, "kugel", { pos: [1, 70, 1], sache: { block: 1, anzahl: 1 } });
    u.h.takt(0.1, mspIch()); return raumLauf(u.netz);
  }).then(function(){
    var l = a.g.wesen; gleich(l.length, 2, "ohne Beutekugeln");
    var e = l.filter(function(n){ return n.art === "gegner"; })[0], s = l.filter(function(n){ return n.art === "geschoss"; })[0];
    gleich(e.id, g.id); gleich(e.gegnerArt, "krabbler"); gleich(e.stufe, 2); gleich(e.lp, 10); gleich(e.lpMax, 12); gleich(e.blick, 1.5); gleich(e.pos[1], 70);
    gleich(s.typ, "spucke"); gleich(s.team, "gegner"); gleich(s.farbe, "#00ff00"); gleich(s.blick[0], 1);
    SC.Raum.spiegleWesen(a.welt, l, 0.016); var m = a.welt.wesen.get(g.id); wahr(!!m); gleich(m.gegnerArt, "krabbler");
  });
});

test("Mehrspieler: spiegleWesen setzt, glättet und entfernt", function(){
  var w = new SC.Welt(new SC.Planet({ id: "start", seed: 1234 })); SC.Raum.gastWelt(w); gleich(w.naechsteId, 1e9);
  var kugel = SC.Wesen.neu(w, "kugel", { pos: [0, 70, 0], sache: { block: 1, anzahl: 1 } }); gleich(kugel.id, 1e9);
  SC.Raum.spiegleWesen(w, [{ id: 3, art: "gegner", gegnerArt: "krabbler", stufe: 1, pos: [10, 70, 10], blick: 0.5, lp: 5, lpMax: 5, boss: false, bemerkt: true }], 0.016, 1000);
  var e = w.wesen.get(3); wahr(!!e); gleich(e.art, "gegner"); gleich(e.pos[0], 10); gleich(e.bemerkt, true); gleich(e.blick, 0.5); wahr(e.breite > 0);
  SC.Raum.spiegleWesen(w, [{ id: 3, art: "gegner", gegnerArt: "krabbler", stufe: 1, pos: [11, 70, 10], blick: 0.5, lp: 3, lpMax: 5, getroffen: 150 }], 0.05, 2000);
  wahr(Math.abs(e.pos[0] - 10.6) < 1e-9, "geglättet: " + e.pos[0]); gleich(e.lp, 3); gleich(e.getroffenBis, 2150); wahr(e.geschw[0] > 0, "Laufbewegung");
  var l = [{ id: 3, art: "gegner", gegnerArt: "krabbler", stufe: 1, pos: [30, 70, 10], blick: 0.5, lp: 3, lpMax: 5 }];
  SC.Raum.spiegleWesen(w, l, 0.05, 3000); gleich(e.pos[0], 30, "Sprung bei mehr als 8 Blöcken");
  SC.Raum.spiegleWesen(w, [{ id: 4, art: "geschoss", typ: "laser", pos: [1, 71, 1], blick: [0, 0, 1], team: "spieler", farbe: "#7cf3ff" }], 0.016);
  gleich(w.wesen.has(3), false, "fehlender Gegner entfernt"); gleich(w.wesen.get(4).typ, "laser"); gleich(w.wesen.get(4).geschw[2], 1); wahr(w.wesen.has(1e9), "eigene Kugel bleibt");
  SC.Raum.spiegleWesen(w, [], 0.016); gleich(w.wesen.size, 1);
});

test("Mehrspieler: Tageszeit folgt dem Gastgeber", function(){
  var u, a;
  return mspRaum(1).then(function(x){ u = x; a = u.gs[0]; u.daten.schwierigkeit = "schwer";
    u.h.takt(0.5, mspIch({ tageszeit: 0.75 })); return raumLauf(u.netz);
  }).then(function(){
    gleich(a.nachr.filter(function(n){ return n.t === "zeit"; }).length, 0, "erst nach 1 s");
    u.h.takt(0.5, mspIch({ tageszeit: 0.75 })); return raumLauf(u.netz);
  }).then(function(){
    var z = a.nachr.filter(function(n){ return n.t === "zeit"; }); gleich(z.length, 1); gleich(z[0].tageszeit, 0.75); gleich(z[0].modus, "survival"); gleich(z[0].schwierigkeit, "schwer");
    gleich(a.g.tageszeit, 0.75);
  });
});

test("Mehrspieler: Setzen und gleich wieder Abbauen bei Konflikt: Rucksack bleibt gleich", function(){
  var u, a, rs = new SC.Rucksack([{ block: SC.B.BRETTER, anzahl: 3 }]);
  return mspRaum(1).then(function(x){ u = x; a = u.gs[0];
    a.g.o.beiBlockZurueck = function(x, y, z, id, w){ a.zurueck.push({ id: id, wunsch: w }); SC.Raum.blockZurueck(rs, w, id); };
    u.welt.setzeBlock(5, 62, 5, SC.B.STEIN, "spieler");
    // innerhalb einer Runde: Bretter setzen (nr1) und wieder abbauen (nr2), beides sieht der Gastgeber anders
    a.welt.setzeBlock(5, 62, 5, SC.B.BRETTER, "spieler"); rs.verbrauche(0);
    a.welt.setzeBlock(5, 62, 5, SC.B.LUFT, "spieler"); rs.lege({ block: SC.B.BRETTER, anzahl: 1 });
    return raumLauf(u.netz);
  }).then(function(){
    gleich(a.zurueck.length, 2); wahr(a.zurueck.every(function(z){ return !!z.wunsch; }), "beide Wünsche erkannt");
    gleich(rs.hat(SC.B.BRETTER), 3); gleich(a.welt.holeBlock(5, 62, 5), SC.B.STEIN); gleich(u.welt.holeBlock(5, 62, 5), SC.B.STEIN);
  });
});

test("Mehrspieler: blockZurueck legt nur aus Luft oder Wasser gesetzte Blöcke zurück", function(){
  var rs = new SC.Rucksack();
  gleich(SC.Raum.blockZurueck(rs, { id: SC.B.BRETTER, alt: SC.B.STEIN }, SC.B.STEIN).zurueck, 0); gleich(rs.hat(SC.B.BRETTER), 0);
  gleich(SC.Raum.blockZurueck(rs, { id: SC.B.BRETTER, alt: SC.B.WASSER }, SC.B.STEIN).zurueck, 1); gleich(rs.hat(SC.B.BRETTER), 1);
});

test("Mehrspieler: Ausrüstung kommt nach erneutem Beitritt wieder an", function(){
  var u, a, b, b2, ausr = { ruestung: null, waffe: { art: "blaster" } };
  return mspRaum(2).then(function(x){ u = x; a = u.gs[0]; b = u.gs[1];
    b.g.takt(0.1, mspIch({ ausr: ausr })); return raumLauf(u.netz);
  }).then(function(){
    u.h.takt(0.1, mspIch()); return raumLauf(u.netz);
  }).then(function(){
    gleich(a.g.mitspieler[b.id].ausr.waffe.art, "blaster");
    b.g.trenne(); return raumLauf(u.netz).then(function(){ u.uhr.vor(SC.RAUM_PLATZ_MS); return raumLauf(u.netz); });
  }).then(function(){
    gleich(a.g.mitspieler[b.id], undefined, "A hat B vergessen");
    b2 = raumGast(u, "G1", { figur: b.figur }); return raumBeitritt(u, b2);
  }).then(function(){
    b2.g.takt(0.1, mspIch({ ausr: ausr })); return raumLauf(u.netz);
  }).then(function(){
    u.h.takt(0.1, mspIch()); return raumLauf(u.netz);
  }).then(function(){ var m = a.g.mitspieler[b.id]; wahr(!!m, "A kennt B wieder"); gleich(m.ausr && m.ausr.waffe.art, "blaster"); });
});

// --- Gemeinsam kämpfen ---
function mspKampf(welt, daten, seed){ var s = new SC.Spieler({ id: "k", pos: [1, 80, 2], modus: "survival" }); return new SC.Kampf(welt, s, daten || SC.Spielstand.neu({ name: "K", seedText: "k", modus: "survival" }), SC.zufall(seed || 5)); }
function mspBoss(w, pos){ return SC.Wesen.neu(w, "gegner", { gegnerArt: "schattenritter", stufe: 3, pos: pos, lp: 1, lpMax: 1000, boss: true, breite: 0.8, hoehe: 2 }); }
// Gastgeber mit eigenem Kampf; ich steht bei [1, 80, 2]
function mspHostKampf(u){ u.hk = mspKampf(u.welt, u.daten, 11); u.hBeute = []; u.hIch = mspIch(); u.h.bindeKampf(u.hk, { ich: function(){ return u.hIch; }, beiBeute: function(pos, l){ u.hBeute.push({ pos: pos, beute: l }); } }); }
function mspGastKampf(r){ r.k = mspKampf(r.welt, null, 3); r.beute = []; r.treffer = []; r.g.bindeKampf(r.k, { beiBeute: function(pos, l){ r.beute.push({ pos: pos, beute: l }); }, beiTreffer: function(e, n){ r.treffer.push({ r: e, n: n }); } }); }

test("Mehrspieler: beuteFuer würfelt wie besiegtGegner", function(){
  var w = new SC.Welt(new SC.Planet({ id: "start", seed: 1234 })), d = SC.Spielstand.neu({ name: "K", seedText: "k", modus: "survival" });
  var g = { gegnerArt: "schattenritter", stufe: 4, ort: "dungeon", boss: true };
  var a = mspKampf(w, d, 42).besiegtGegner(g), b = SC.Kampf.beuteFuer(g, d, SC.zufall(42));
  gleich(JSON.stringify(b.beute), JSON.stringify(a.beute)); gleich(b.erfahrung, a.erfahrung); wahr(b.beute.length === 2, "Boss: zwei Teile"); gleich(b.boss, true);
  var k = mspKampf(w, d, 1), xp0 = k.werte.erfahrung; gleich(k.gibErfahrung(5), 0); gleich(k.werte.erfahrung, xp0 + 5);
});

test("Mehrspieler: Gegner wählt den nächsten Spieler", function(){
  var w = new SC.Welt(new SC.Planet({ id: "start", seed: 1234 })), g = { pos: [10, 70, 10] };
  var z = SC.Raum.zielFuer(w, g, [{ id: "h", pos: [40, 70, 10], modus: "survival", lebt: true }, { id: "g1", pos: [14, 70, 10], modus: "survival", lebt: true }, { id: "g2", pos: [20, 70, 10], modus: "survival", lebt: true }]);
  gleich(z.id, "g1"); gleich(z.sichtbar, true); gleich(z.pos[0], 14);
  var P = w.planet.groesse; gleich(SC.Raum.zielFuer(w, g, [{ id: "a", pos: [30, 70, 10], modus: "survival", lebt: true }, { id: "b", pos: [P - 2, 70, 10], modus: "survival", lebt: true }]).id, "b", "über den Rand des Planeten");
  gleich(SC.Raum.zielFuer(w, g, []), null);
});

test("Mehrspieler: Menü offen ist kein Ziel", function(){
  var w = new SC.Welt(new SC.Planet({ id: "start", seed: 1234 })), g = { pos: [10, 70, 10] };
  gleich(SC.Raum.zielFuer(w, g, [{ id: "h", pos: [11, 70, 10], modus: "survival", lebt: true, menue: true }, { id: "g1", pos: [30, 70, 10], modus: "survival", lebt: true }]).id, "g1");
  gleich(SC.Raum.zielFuer(w, g, [{ id: "h", pos: [11, 70, 10], modus: "survival", lebt: false }]), null, "Besiegte auch nicht");
});

test("Mehrspieler: Zuschauer ist kein Ziel", function(){
  var w = new SC.Welt(new SC.Planet({ id: "start", seed: 1234 })), g = { pos: [10, 70, 10] };
  gleich(SC.Raum.zielFuer(w, g, [{ id: "h", pos: [11, 70, 10], modus: "zuschauer", lebt: true }, { id: "k", pos: [12, 70, 10], modus: "kreativ", lebt: true }]), null);
});

test("Mehrspieler: Gegnerschuss trifft Gast", function(){
  var w = new SC.Welt(new SC.Planet({ id: "start", seed: 1234 }));
  var g = SC.Wesen.neu(w, "geschoss", { pos: [10, 101, 10], richtung: [1, 0, 0], tempo: 20, schaden: 5, team: "gegner", art: "laser", lebensdauer: 3 });
  var r = SC.Geschoss.schritt(w, g, 0.25, [{ id: "h", pos: [10, 100, 30] }, { id: "g1", pos: [13, 100, 10] }]);
  wahr(!!r, "Treffer"); gleich(r.treffer, "spieler"); gleich(r.id, "g1");
  var g2 = SC.Wesen.neu(w, "geschoss", { pos: [10, 101, 10], richtung: [1, 0, 0], tempo: 20, schaden: 5, team: "gegner", art: "laser", lebensdauer: 3 });
  gleich(SC.Geschoss.schritt(w, g2, 0.25, []), null, "leere Liste: kein Treffer");
});

test("Mehrspieler: Gegner bleibt bei fernem Gastgeber, wenn Gast nah ist", function(){
  var p = new SC.Planet({ id: "start", seed: 1234 }), w = new SC.Welt(p), d = SC.Spielstand.neu({ name: "A", seedText: "a", modus: "survival" }); d.planeten.start.seed = p.seed;
  var a = new SC.Auftauchen(w, d, SC.zufall(1)), e = SC.Wesen.neu(w, "gegner", { gegnerArt: "krabbler", stufe: 1, pos: [500, 90, 500], lp: 5, lpMax: 5 });
  var fern = { id: "h", pos: [800, 90, 500], blick: [0, 0], modus: "survival", stufe: 1 }, nah = { id: "g1", pos: [510, 90, 500], blick: [0, 0], modus: "survival", stufe: 1 };
  a.schritt([fern, nah], 1, 1); wahr(w.wesen.has(e.id), "Gast ist nah");
  a.schritt([fern, { id: "g1", pos: [700, 90, 500], blick: [0, 0], modus: "survival", stufe: 1 }], 1, 2); gleich(w.wesen.has(e.id), false, "alle weit weg");
});

test("Mehrspieler: Nachtgegner um Gäste mit ihrer Stufe, gemeinsame Obergrenze", function(){
  var p = new SC.Planet({ id: "start", seed: 1234 }), w = new SC.Welt(p), d = SC.Spielstand.neu({ name: "A", seedText: "a", modus: "survival", schwierigkeit: "leicht" }); d.planeten.start.seed = p.seed;
  var a = new SC.Auftauchen(w, d, SC.zufall(1)), zu = { id: "h", pos: [1024.5, 90, 1024.5], blick: [0, 0], modus: "zuschauer", stufe: 1 }, g1 = { id: "g1", pos: [1500.5, 90, 1500.5], blick: [0, 0], modus: "survival", stufe: 9 };
  for(var i = 0; i < 30; i++) a.schritt([zu, g1], 0.28, i);
  var n = 0; w.wesen.forEach(function(e){ if(e.nacht){ n++; wahr(Math.hypot(e.pos[0] - 1500.5, e.pos[2] - 1500.5) < 50, "beim Survival-Gast"); wahr(e.stufe >= 8, "Stufe des Gastes: " + e.stufe); } });
  wahr(n > 0 && n <= SC.SCHWIERIGKEIT.leicht.nachtMax, "n=" + n);
});

test("Mehrspieler: Besiegt: alle in 40 Blöcken bekommen gleiche Beute und volle Erfahrung", function(){
  var u, a, b, g;
  return mspRaum(2).then(function(x){ u = x; a = u.gs[0]; b = u.gs[1]; mspHostKampf(u); mspGastKampf(a); mspGastKampf(b);
    a.g.takt(0.1, mspIch({ pos: [11, 80, 2] })); b.g.takt(0.1, mspIch({ pos: [61, 80, 2] })); return raumLauf(u.netz);
  }).then(function(){
    g = mspBoss(u.welt, [1, 70, 2]); var xpA = a.k.werte.erfahrung, xpH = u.hk.werte.erfahrung;
    var r = u.h.besiege(g); a.xp0 = xpA; u.xp0 = xpH; u.r = r;
    gleich(u.welt.wesen.has(g.id), false, "Gegner weg"); wahr(r.beute.length === 2); gleich(r.nah, true);
    return raumLauf(u.netz);
  }).then(function(){
    var r = u.r; gleich(u.hBeute.length, 1); gleich(JSON.stringify(u.hBeute[0].beute), JSON.stringify(r.beute)); gleich(u.hk.werte.erfahrung > u.xp0 || r.aufstiege > 0, true, "Gastgeber bekommt Erfahrung");
    gleich(a.beute.length, 1); gleich(JSON.stringify(a.beute[0].beute), JSON.stringify(r.beute), "identische Beute"); gleich(a.beute[0].pos[0], 1);
    wahr(a.k.werte.erfahrung === a.xp0 + r.erfahrung || a.k.werte.stufe > 1, "volle Erfahrung");
    gleich(b.beute.length, 0, "B ist zu weit weg"); gleich(b.k.werte.erfahrung, 0);
  });
});

test("Mehrspieler: Gastgeber weit weg bekommt nichts, Gast trifft per angriff", function(){
  var u, a, g;
  return mspRaum(1).then(function(x){ u = x; a = u.gs[0]; mspHostKampf(u); mspGastKampf(a); u.hIch = mspIch({ pos: [200, 80, 2] });
    a.g.takt(0.1, mspIch({ pos: [11, 80, 2] })); return raumLauf(u.netz);
  }).then(function(){
    g = SC.Wesen.neu(u.welt, "gegner", { gegnerArt: "krabbler", stufe: 1, pos: [12, 80, 2], lp: 30, lpMax: 30, breite: 0.8, hoehe: 1 });
    a.g.angriff(g.id, 10, [1, 0, 0]); return raumLauf(u.netz);
  }).then(function(){
    gleich(g.lp, 20, "Treffer verrechnet"); wahr(g.bemerkt);
    a.g.angriff(g.id, 25, [1, 0, 0]); return raumLauf(u.netz);
  }).then(function(){
    gleich(u.welt.wesen.has(g.id), false, "besiegt"); gleich(u.hBeute.length, 0, "Gastgeber weit weg"); wahr(a.k.werte.erfahrung > 0, "Gast bekommt Erfahrung");
    a.g.angriff(g.id, 25, [1, 0, 0]); return raumLauf(u.netz);
  }).then(function(){ wahr(true); });
});

test("Mehrspieler: Schuss vom Gast wird beim Gastgeber ein Spieler-Geschoss", function(){
  var u, a;
  return mspRaum(1).then(function(x){ u = x; a = u.gs[0]; mspHostKampf(u); mspGastKampf(a);
    a.g.schuss({ pos: [3, 81, 3], richtung: [1, 0, 0], tempo: 40, schaden: 7, farbe: "#ff0000", abprall: true, lebensdauer: 0.5 }); return raumLauf(u.netz);
  }).then(function(){
    var l = []; u.welt.wesen.forEach(function(e){ if(e.art === "geschoss") l.push(e); });
    gleich(l.length, 1); var e = l[0]; gleich(e.team, "spieler"); gleich(e.schuetze, a.id); gleich(e.typ, "laser"); gleich(e.schaden, 7); gleich(e.tempo, 40); gleich(e.abprall, true); gleich(e.farbe, "#ff0000"); gleich(e.richtung[0], 1); gleich(e.pos[1], 81);
  });
});

test("Mehrspieler: Kiste vom Gast: alle in der Nähe, danach offen", function(){
  var u, a, b;
  return mspRaum(2).then(function(x){ u = x; a = u.gs[0]; b = u.gs[1]; mspHostKampf(u); mspGastKampf(a); mspGastKampf(b);
    u.welt.setzeBlock(5, 62, 5, SC.B.KISTE, "system");
    a.g.takt(0.1, mspIch({ pos: [5, 63, 6] })); b.g.takt(0.1, mspIch({ pos: [90, 63, 6] })); return raumLauf(u.netz);
  }).then(function(){
    gleich(a.welt.holeBlock(5, 62, 5), SC.B.KISTE); a.g.kiste(5, 62, 5); return raumLauf(u.netz);
  }).then(function(){
    gleich(u.welt.holeBlock(5, 62, 5), SC.B.KISTE_OFFEN); gleich(a.welt.holeBlock(5, 62, 5), SC.B.KISTE_OFFEN, "auch beim Gast"); gleich(b.welt.holeBlock(5, 62, 5), SC.B.KISTE_OFFEN);
    gleich(a.beute.length, 1); wahr(a.beute[0].beute.length >= 2); gleich(u.hBeute.length, 1); gleich(JSON.stringify(u.hBeute[0].beute), JSON.stringify(a.beute[0].beute)); gleich(b.beute.length, 0);
    wahr(u.daten.planeten.start.kisten["5,62,5"], "Gastgeber merkt die Kiste");
    a.g.kiste(5, 62, 5); return raumLauf(u.netz);
  }).then(function(){ gleich(a.beute.length, 1, "zweites Öffnen: nichts"); gleich(u.hBeute.length, 1); });
});

test("Mehrspieler: Treffer am Gast verrechnet seine Ausrüstung", function(){
  var u, a, lp0;
  return mspRaum(1).then(function(x){ u = x; a = u.gs[0]; mspHostKampf(u); mspGastKampf(a);
    a.k.ausruestung.brust = { art: "brust", werte: { schutz: 50 } }; a.k.ruestungAnwenden(); lp0 = a.k.werte.lp; gleich(a.k.werte.schild, 0);
    u.h.treffer(a.id, 20, [1, 0, 0], null); return raumLauf(u.netz);
  }).then(function(){
    var verlust = lp0 - a.k.werte.lp; wahr(verlust > 0 && verlust < 20, "Verlust " + verlust); gleich(a.treffer.length, 1); gleich(a.treffer[0].n.pvpVon, null);
  });
});

test("Mehrspieler: Gast blockt Laser: abprall wird beim Gastgeber ein Spieler-Geschoss", function(){
  var u, a, gs;
  return mspRaum(1).then(function(x){ u = x; a = u.gs[0]; mspHostKampf(u); mspGastKampf(a);
    a.k.blockt = true; a.k.spieler.blick = [0, 0]; // blickt nach -z, Laser kommt von vorn (fliegt nach +z)
    gs = SC.Wesen.neu(u.welt, "geschoss", { pos: [1, 81, -3], richtung: [0, 0, 1], tempo: 20, schaden: 9, team: "gegner", art: "laser", lebensdauer: 3 });
    u.h.treffer(a.id, 9, [0, 0, 1], gs); SC.Wesen.entferne(u.welt, gs.id); return raumLauf(u.netz);
  }).then(function(){
    gleich(a.k.werte.lp, a.k.werte.lpMax, "kein Schaden");
    var l = []; u.welt.wesen.forEach(function(e){ if(e.art === "geschoss") l.push(e); });
    gleich(l.length, 1, "zurückgeworfen"); gleich(l[0].team, "spieler"); gleich(l[0].schuetze, a.id); gleich(l[0].richtung[2], -1); gleich(l[0].schaden, 9);
    var eigen = []; a.welt.wesen.forEach(function(e){ if(e.art === "geschoss") eigen.push(e); }); wahr(eigen.length === 1 && eigen[0].optisch && eigen[0].id >= 1e9, "beim Gast nur optisch");
    a.g.sende({ t: "abprall", geschossId: gs.id }); return raumLauf(u.netz);
  }).then(function(){ var n = 0; u.welt.wesen.forEach(function(e){ if(e.art === "geschoss") n++; }); gleich(n, 1, "nur einmal"); });
});

test("Mehrspieler: Neuverbinden schickt keine Beute doppelt", function(){
  var u, a;
  return mspRaum(1).then(function(x){ u = x; a = u.gs[0]; mspHostKampf(u); mspGastKampf(a);
    a.roh = []; a.g.verb.an("daten", function(n){ if(n && n.t === "besiegt") a.roh.push(n); });
    a.g.takt(0.1, mspIch({ pos: [11, 80, 2] })); return raumLauf(u.netz);
  }).then(function(){ u.h.besiege(mspBoss(u.welt, [1, 70, 2])); return raumLauf(u.netz);
  }).then(function(){
    gleich(a.beute.length, 1); gleich(a.roh.length, 1); var alt = a.roh[0];
    u.netz.trenne(a.g.verb); return raumLauf(u.netz).then(function(){ a.uhr.vor(2000); return raumLauf(u.netz); }).then(function(){ return alt; });
  }).then(function(alt){
    gleich(letzter(a.status), "verbunden"); a.roh2 = []; a.g.verb.an("daten", function(n){ if(n && n.t === "besiegt") a.roh2.push(n); });
    u.h.takt(0.1, mspIch()); return raumLauf(u.netz).then(function(){ return alt; });
  }).then(function(alt){
    gleich(a.roh2.length, 0, "keine weitere besiegt-Nachricht"); gleich(a.beute.length, 1);
    SC.Gast.NACHRICHTEN.besiegt.call(a.g, alt); gleich(a.beute.length, 1, "Doppeltes wird erkannt");
  });
});

// Durchstich durch SC.Spiel#_survival mit einem echten Raum
function mspSpiel(welt, daten, raum, kampf){
  var s = Object.create(SC.Spiel.prototype); s.welt = welt; s.daten = daten; s.kampf = kampf; s.spieler = kampf.spieler; s.raum = raum;
  s.render = { markiere: function(){}, wesen: { risse: function(){}, funken: function(){}, zahl: function(){} }, ausruestung: function(){}, fps: 60 };
  s.eingabe = { touchAktiv: false, gamepadAktiv: false }; s.auftauchen = { schritt: function(l){ s._auftArg = l; }, zerfallen: [], gegnerBesiegt: function(){} }; s.einstellungen = { fpsAnzeigen: false };
  s.ui = { hinweis: function(){}, hud: function(){}, kampfHud: function(){}, zeigeBesiegt: function(){} }; s.audio = { spiele: function(){} }; s._zf = SC.zufall(1); s.tageszeit = 0.5;
  return s;
}
var MSP_E = { ausweichen: false, setzenGehalten: false, abbauen: false, abbauenGehalten: false, setzen: false, vor: false, zurueck: false, links: false, rechts: false };

test("Mehrspieler: Gastgeber-Bild: Gegnerschuss trifft den Gast, auch bei offenem Menü", function(){
  var u, a, s, lp0;
  return mspRaum(1).then(function(x){ u = x; a = u.gs[0]; mspHostKampf(u); mspGastKampf(a); lp0 = a.k.werte.lp;
    a.g.takt(0.1, mspIch({ pos: [20, 100, 2] })); return raumLauf(u.netz);
  }).then(function(){
    s = mspSpiel(u.welt, u.daten, u.h, u.hk); s.spieler.pos = [1, 100, 30];
    SC.Wesen.neu(u.welt, "geschoss", { pos: [17, 101, 2], richtung: [1, 0, 0], tempo: 30, schaden: 10, team: "gegner", art: "laser", lebensdauer: 3 });
    s._survival(MSP_E, 0.2, true, 1000); return raumLauf(u.netz);
  }).then(function(){
    wahr(a.k.werte.lp < lp0, "Gast getroffen: " + a.k.werte.lp); gleich(a.treffer.length, 1); gleich(u.hk.werte.lp, u.hk.werte.lpMax, "Gastgeber nicht");
    var n = 0; u.welt.wesen.forEach(function(e){ if(e.art === "geschoss") n++; }); gleich(n, 0, "Geschoss verbraucht");
    s._survival(MSP_E, 1.1, false, 2200); wahr(Array.isArray(s._auftArg) && s._auftArg.length === 2, "Auftauchen mit allen Spielern");
  });
});

test("Mehrspieler: Gast-Bild: gespiegelte Wesen laufen nicht lokal, Kiste geht an den Gastgeber", function(){
  var u, a, s;
  return mspRaum(1).then(function(x){ u = x; a = u.gs[0]; mspHostKampf(u); mspGastKampf(a);
    u.welt.setzeBlock(5, 62, 5, SC.B.KISTE, "system"); return raumLauf(u.netz);
  }).then(function(){
    SC.Raum.spiegleWesen(a.welt, [{ id: 7, art: "gegner", gegnerArt: "krabbler", stufe: 1, pos: [3, 100, 3], blick: 0, lp: 5, lpMax: 5 }, { id: 8, art: "geschoss", typ: "laser", pos: [3, 101, 6], blick: [0, 0, -1], team: "gegner" }], 0.016);
    s = mspSpiel(a.welt, SC.Spielstand.neu({ name: "G", seedText: "g", modus: "survival" }), a.g, a.k); s.spieler.pos = [5.5, 63, 7.5]; s.spieler.blick = [0, -0.6];
    var auft = 0; s.auftauchen.schritt = function(){ auft++; };
    s._survival(MSP_E, 1.2, false, 1000);
    gleich(a.welt.wesen.get(7).pos[1], 100, "keine KI beim Gast"); gleich(a.welt.wesen.get(8).pos[2], 6, "kein Geschoss-Schritt"); gleich(auft, 0, "kein Auftauchen beim Gast");
    gleich(a.k.werte.lp, a.k.werte.lpMax);
    var z = SC.zielen(a.welt, s.spieler.augen(), s.spieler.richtung(), 6); wahr(!!z && z.x === 5 && z.y === 62 && z.z === 5, "zielt auf die Kiste");
    var e = {}; for(var k in MSP_E) e[k] = MSP_E[k]; e.setzen = true; s._survival(e, 0.016, false, 1100);
    gleich(a.welt.holeBlock(5, 62, 5), SC.B.KISTE, "Gast öffnet nicht selbst"); return raumLauf(u.netz);
  }).then(function(){ gleich(u.welt.holeBlock(5, 62, 5), SC.B.KISTE_OFFEN); gleich(a.welt.holeBlock(5, 62, 5), SC.B.KISTE_OFFEN); gleich(a.beute.length, 1); });
});
