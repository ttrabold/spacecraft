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

// --- Spaßkampf (PvP) ---
function mspPvpSetup(n, pvp){
  return mspRaum(n).then(function(x){
    var u = x; mspHostKampf(u); u.hint = []; u.hk.daten.spieler.name = "Gast0";
    u.gs.forEach(function(r){ mspGastKampf(r); r.pvpB = []; r.g._k.o.beiPvpBesiegt = function(name){ r.pvpB.push(name); }; });
    u.h.bindeKampf(u.hk, { ich: function(){ return u.hIch; }, beiBeute: function(){}, beiPvpBesiegt: function(name){ u.hint.push(name); } });
    if(pvp) u.h.setzePvp(true);
    return raumLauf(u.netz).then(function(){ return u; });
  });
}
var MSP_HIEB = { reichweite: 3, schaden: 10 };

test("Mehrspieler: PvP aus: Hieb trifft Mitspieler nicht", function(){
  var u, a, hid;
  return mspPvpSetup(1, false).then(function(x){ u = x; a = u.gs[0]; hid = u.daten.spieler.figurId; gleich(u.h.pvp, false); gleich(a.g.pvp, false);
    a.g.takt(0.1, mspIch({ pos: [1, 80, 2] })); u.h.takt(0.1, u.hIch); return raumLauf(u.netz);
  }).then(function(){
    gleich(SC.Raum.pvpZiele(a.g, mspIch()).length, 0, "Gast sieht keine Ziele"); gleich(SC.Raum.pvpZiele(u.h, u.hIch).length, 0, "Gastgeber sieht keine Ziele");
    a.g.sende({ t: "pvp", ziel: hid, schaden: 10, von: [1, 0, 0] }); return raumLauf(u.netz);
  }).then(function(){ gleich(u.hk.werte.lp, u.hk.werte.lpMax, "Nachricht ohne PvP wird ignoriert"); });
});

test("Mehrspieler: PvP an: Hieb trifft Mitspieler", function(){
  var u, a, b, hid, lpB;
  return mspPvpSetup(2, true).then(function(x){ u = x; a = u.gs[0]; b = u.gs[1]; hid = u.daten.spieler.figurId; gleich(u.h.pvp, true); gleich(a.g.pvp, true, "pvpAn erreicht den Gast"); gleich(b.g.pvp, true);
    a.g.takt(0.1, mspIch({ pos: [1, 80, 2], blick: [0, 0] })); b.g.takt(0.1, mspIch({ pos: [1, 80, 0] })); u.hIch.pos = [30, 80, 2]; u.h.takt(0.1, u.hIch); return raumLauf(u.netz);
  }).then(function(){
    a.k.spieler.pos = [1, 80, 2]; a.k.spieler.blick = [0, 0]; lpB = b.k.werte.lp;
    var z = SC.Raum.pvpZiele(a.g, mspIch({ pos: [1, 80, 2] })); gleich(z.length, 2, "Gastgeber und anderer Gast"); wahr(z.every(function(m){ return m.id !== a.id; }));
    var tr = a.k.hiebZiele(MSP_HIEB, z); gleich(tr.length, 1, "nur wer im Bogen steht"); gleich(tr[0].art, "spieler"); gleich(tr[0].id, b.id);
    a.g.pvpAngriff(b.id, 10, [0, 0, -1]); u.h.takt(0.1, u.hIch); return raumLauf(u.netz);
  }).then(function(){
    wahr(b.k.werte.lp < lpB, "Mitspieler verliert LP"); gleich(b.treffer.length, 1); gleich(b.treffer[0].n.pvpVon, a.id); gleich(u.hk.werte.lp, u.hk.werte.lpMax);
    u.hIch.pos = [2, 80, 2]; u.h.takt(0.1, u.hIch); a.g.pvpAngriff(hid, 10, [1, 0, 0]); return raumLauf(u.netz);
  }).then(function(){ wahr(u.hk.werte.lp < u.hk.werte.lpMax, "auch der Gastgeber"); });
});

test("Mehrspieler: Gastgeber schaltet PvP wieder aus, Beitretende bekommen den Stand", function(){
  var u, a;
  return mspPvpSetup(1, true).then(function(x){ u = x; a = u.gs[0]; gleich(a.g.pvp, true); u.h.setzePvp(false); return raumLauf(u.netz);
  }).then(function(){ gleich(a.g.pvp, false); gleich(u.h.pvp, false); });
});

test("Mehrspieler: PvP-besiegt (Gast) verliert nichts und steht am Startpunkt", function(){
  var u, a, b, rs;
  return mspPvpSetup(2, true).then(function(x){ u = x; a = u.gs[0]; b = u.gs[1];
    b.k.rucksack.lege({ block: SC.B.STEIN, anzahl: 5 }); b.k.werte.lp = 1; rs = JSON.stringify(b.k.rucksack.plaetze); var aus0 = JSON.stringify(b.k.ausruestung), xp0 = b.k.werte.erfahrung;
    b.k.spieler.pos = [40, 80, 40]; b.xp = [aus0, xp0];
    a.g.takt(0.1, mspIch({ pos: [1, 80, 2] })); b.g.takt(0.1, mspIch({ pos: [1, 80, 0] })); u.h.takt(0.1, u.hIch); return raumLauf(u.netz);
  }).then(function(){
    a.g.pvpAngriff(b.id, 50, [0, 0, -1]); return raumLauf(u.netz);
  }).then(function(){
    gleich(b.k.werte.lp, b.k.werte.lpMax, "wiederbelebt"); gleich(JSON.stringify(b.k.rucksack.plaetze), rs, "Rucksack gleich"); gleich(JSON.stringify(b.k.ausruestung), b.xp[0]); gleich(b.k.werte.erfahrung, b.xp[1]);
    var sp = u.daten.startpunkt || SC.Spiel.startpunkt(u.welt.planet); gleich(Math.floor(b.k.spieler.pos[0]), Math.floor(sp[0])); gleich(Math.floor(b.k.spieler.pos[2]), Math.floor(sp[2]));
    gleich(b.pvpB.length, 1); gleich(b.pvpB[0], "G0");
  });
});

test("Mehrspieler: PvP-besiegt (Gastgeber): Hinweis, Startpunkt, kein Besiegt-Bildschirm", function(){
  var u, a, s, rs, besiegtZeigt = 0;
  return mspPvpSetup(1, true).then(function(x){ u = x; a = u.gs[0];
    u.hk.rucksack.lege({ block: SC.B.STEIN, anzahl: 3 }); rs = JSON.stringify(u.hk.rucksack.plaetze); u.hk.werte.lp = 1; u.hk.spieler.pos = [40, 80, 40]; u.hIch.pos = [40, 80, 40];
    a.g.takt(0.1, mspIch({ pos: [41, 80, 40] })); u.h.takt(0.1, u.hIch); return raumLauf(u.netz);
  }).then(function(){
    a.g.pvpAngriff(u.daten.spieler.figurId, 50, [1, 0, 0]); return raumLauf(u.netz);
  }).then(function(){
    s = mspSpiel(u.welt, u.daten, u.h, u.hk); s.ui.zeigeBesiegt = function(){ besiegtZeigt++; }; s._survival(MSP_E, 0.016, false, 1000);
    gleich(besiegtZeigt, 0, "kein zeigeBesiegt"); gleich(u.hk.werte.lp, u.hk.werte.lpMax); gleich(JSON.stringify(u.hk.rucksack.plaetze), rs);
    gleich(u.hint.length, 1); wahr(u.hint[0] === a.figur.name, "Name des Angreifers: " + u.hint[0]);
    wahr(Math.abs(u.hk.spieler.pos[0] - 40) > 5, "am Startpunkt");
  });
});

test("Mehrspieler: eigener Schuss trifft den Schützen nicht, fremder Schuss nur bei PvP", function(){
  var u, a, s, hid;
  return mspPvpSetup(1, true).then(function(x){ u = x; a = u.gs[0]; hid = u.daten.spieler.figurId;
    a.g.takt(0.1, mspIch({ pos: [30, 80, 30] })); u.hIch.pos = [1, 80, 2]; u.h.takt(0.1, u.hIch); return raumLauf(u.netz);
  }).then(function(){
    s = mspSpiel(u.welt, u.daten, u.h, u.hk); u.hk.spieler.pos = [1, 80, 2];
    SC.Wesen.neu(u.welt, "geschoss", { pos: [-2, 80.8, 2], richtung: [1, 0, 0], tempo: 30, schaden: 10, team: "spieler", schuetze: hid, art: "laser", lebensdauer: 3 });
    s._survival(MSP_E, 0.2, false, 1000); gleich(u.hk.werte.lp, u.hk.werte.lpMax, "Schütze bleibt heil");
    SC.Wesen.neu(u.welt, "geschoss", { pos: [-2, 80.8, 2], richtung: [1, 0, 0], tempo: 30, schaden: 10, team: "spieler", schuetze: a.id, art: "laser", lebensdauer: 3 });
    s._survival(MSP_E, 0.2, false, 1200); wahr(u.hk.werte.lp < u.hk.werte.lpMax, "fremder Schuss trifft bei PvP");
    var lp = u.hk.werte.lp; u.h.setzePvp(false);
    SC.Wesen.neu(u.welt, "geschoss", { pos: [-2, 80.8, 2], richtung: [1, 0, 0], tempo: 30, schaden: 10, team: "spieler", schuetze: a.id, art: "laser", lebensdauer: 3 });
    s._survival(MSP_E, 0.2, false, 1400); gleich(u.hk.werte.lp, lp, "ohne PvP geht er durch");
  });
});

test("Mehrspieler: Gast-Schuss trifft andern Gast bei PvP (über den Gastgeber)", function(){
  var u, a, b, s;
  return mspPvpSetup(2, true).then(function(x){ u = x; a = u.gs[0]; b = u.gs[1];
    a.g.takt(0.1, mspIch({ pos: [1, 80, 2] })); b.g.takt(0.1, mspIch({ pos: [10, 80, 2] })); u.hIch.pos = [30, 80, 30]; u.hk.spieler.pos = [30, 80, 30]; u.h.takt(0.1, u.hIch); return raumLauf(u.netz);
  }).then(function(){
    a.g.schuss({ pos: [2, 80.8, 2], richtung: [1, 0, 0], tempo: 30, schaden: 10, farbe: "#f00", abprall: false, lebensdauer: 2 }); return raumLauf(u.netz);
  }).then(function(){
    s = mspSpiel(u.welt, u.daten, u.h, u.hk); s._survival(MSP_E, 0.3, false, 1000); return raumLauf(u.netz);
  }).then(function(){ wahr(b.k.werte.lp < b.k.werte.lpMax, "Gast B getroffen"); gleich(b.treffer[0].n.pvpVon, a.id); gleich(a.k.werte.lp, a.k.werte.lpMax); });
});

// --- Spiel verdrahtet: Rollen, Speichern, Abbrüche (zwei SC.Spiel ohne Leinwand) ---
function mspSlots(){ var b = { art: "speicher", m: {}, hole: function(k){ return Promise.resolve(this.m[k] === undefined ? undefined : JSON.parse(JSON.stringify(this.m[k]))); }, lege: function(k, v){ this.m[k] = JSON.parse(JSON.stringify(v)); return Promise.resolve(); }, loesche: function(k){ delete this.m[k]; return Promise.resolve(); } }; var sl = new SC.Slots(b); sl.b = b; return sl; }
function mspSpielVoll(slots){
  var s = Object.create(SC.Spiel.prototype); s.slots = slots; s.hinweise = []; s.weltliste = 0; s.toene = [];
  s.ui = { hinweis: function(t){ s.hinweise.push(t); }, zeigeWeltliste: function(){ s.weltliste++; return Promise.resolve(); }, verbergeHud: function(){}, offen: function(){ return false; }, hud: function(){}, kampfHud: function(){}, zeigeBesiegt: function(){}, schliesse: function(){} };
  s.audio = { spiele: function(n){ s.toene.push(n); }, musikTakt: function(){} }; s.eingabe = { gebeMausFrei: function(){}, touchAktiv: false, gamepadAktiv: false }; s.entwickler = { verberge: function(){} }; s.einstellungen = { fpsAnzeigen: false };
  s._anzeigen = function(){ var r = this.render = { markiere: function(){}, wesen: { risse: function(){}, funken: function(){}, zahl: function(){} }, ausruestung: function(){}, fps: 60, welt: function(){}, renderer: { clear: function(){} }, setzeMitspieler: function(l){ r.mitspieler = l; } }; this._laeuft = true; };
  return s;
}
function mspLauf(netz, n){ var p = Promise.resolve(); for(var i = 0; i < (n || 3); i++) p = p.then(function(){ return raumLauf(netz); }); return p; }
// Gastgeber-Spiel mit offenem Raum (antwortet Ja) und Gast-Spiel mit eigener Welt
function mspZwei(o){
  o = o || {};
  var netz = SC.Netz.speicherNetz(), u = { netz: netz, sH: mspSlots(), sG: mspSlots(), anfragen: 0 };
  SC.Spiel.adapter = function(){ return netz.adapter(); };
  u.h = mspSpielVoll(u.sH); u.g = mspSpielVoll(u.sG);
  var hd = SC.Spielstand.neu({ name: "Mias Welt", seedText: "a", modus: "survival", figurName: "Mia" });
  hd.spieler.pos = [8.5, 100, 8.5]; hd.startpunkt = [8.5, 100, 8.5];
  u.h.raumRueckrufe = { anfrage: function(info, antwort){ u.anfragen++; antwort(true); } };
  u.eigen = SC.Spielstand.neu({ name: "Bens Welt", seedText: "b", modus: "survival", figurName: "Ben" }); u.eigen.spieler.pos = [3.5, 90, 4.5];
  return u.sH.speichere(hd).then(function(){ u.h.starte(hd); u.h.welt.setzeBlock(9, 99, 9, SC.B.GLAS, "system"); return u.sG.speichere(u.eigen); })
    .then(function(){ return u.h.raumOeffnen(); }).then(function(code){ u.code = code;
      if(o.ohneBeitritt) return u;
      var e = {}; u.g.beitreten(code, o.neu ? null : u.eigen.id, "Ben").then(function(){ e.ok = true; }, function(f){ e.fehler = f; }); u.beitritt = e;
      return mspLauf(netz, 4).then(function(){ return u; });
    });
}
var MSP_ADAPTER = SC.Spiel.adapter;
function mspFertig(){ SC.Spiel.adapter = MSP_ADAPTER; }
function mspFehler(f){ SC.Spiel.adapter = MSP_ADAPTER; throw f; }

test("Mehrspieler: Spiel: Gast tritt bei, bekommt die Welt und eine eigene Kugel-ID-Spanne", function(){
  var u;
  return mspZwei().then(function(x){ u = x;
    wahr(u.beitritt.ok, "beitreten erfüllt: " + (u.beitritt.fehler && u.beitritt.fehler.art)); gleich(u.h.rolle, "gastgeber"); gleich(u.g.rolle, "gast"); wahr(u.g.raum instanceof SC.Gast);
    gleich(u.g.welt.holeBlock(9, 99, 9), SC.B.GLAS, "Chunks vom Gastgeber"); wahr(u.g.welt.naechsteId >= 1e9);
    gleich(u.g.daten.id, "gast"); gleich(u.g.kampf.rucksack.plaetze[0].gegenstand.id, "startschwert");
    u.g.welt.setzeBlock(10, 99, 9, SC.B.STEIN, "spieler"); return mspLauf(u.netz);
  }).then(function(){ gleich(u.h.welt.holeBlock(10, 99, 9), SC.B.STEIN, "Welt gebunden: Block kommt an"); }).then(mspFertig, mspFehler);
});

test("Mehrspieler: Spiel: Gast speichert nur seine Figur", function(){
  var u, chunks0;
  return mspZwei().then(function(x){ u = x; chunks0 = JSON.stringify(u.eigen.planeten);
    u.g.kampf.rucksack.lege({ block: SC.B.STEIN, anzahl: 5 }); u.g.spieler.pos = [50, 90, 50];
    return u.g.speichere("auto");
  }).then(function(){ return u.sG.lade(u.eigen.id); }).then(function(d){
    var n = 0; d.spieler.rucksack.forEach(function(p){ if(p && p.block === SC.B.STEIN) n += p.anzahl; }); gleich(n, 5, "Fund in der eigenen Welt");
    gleich(JSON.stringify(d.planeten), chunks0, "Chunks unverändert"); gleich(d.spieler.pos[0], 3.5, "Position unverändert"); gleich(d.spieler.name, "Ben");
    gleich(u.sG.b.m["welt:gast"], undefined, "keine Gastwelt gespeichert"); return u.sG.liste();
  }).then(function(l){ wahr(l.every(function(m){ return m.id !== "gast"; })); gleich(l.length, 1); }).then(mspFertig, mspFehler);
});

test("Mehrspieler: Spiel: Neue Figur legt Survival-Welt an", function(){
  var u;
  return mspZwei({ neu: true }).then(function(x){ u = x; wahr(u.beitritt.ok); return u.sG.liste(); }).then(function(l){
    var neu = l.filter(function(m){ return m.name === "Bens Welt" && m.id !== u.eigen.id; })[0]; wahr(!!neu, "Bens Welt angelegt"); gleich(neu.modus, "survival");
    return u.sG.lade(neu.id);
  }).then(function(d){ gleich(d.spieler.name, "Ben"); gleich(u.g.raum.figur.figurId, d.spieler.figurId); }).then(mspFertig, mspFehler);
});

test("Mehrspieler: Spiel: ende speichert Figur und meldet", function(){
  var u;
  return mspZwei().then(function(x){ u = x; u.g.kampf.rucksack.lege({ block: SC.B.KIES, anzahl: 2 }); return u.h.verlasse();
  }).then(function(){ return mspLauf(u.netz); }).then(function(){ return new Promise(function(ok){ setTimeout(ok, 20); }); }).then(function(){
    wahr(u.g.hinweise.indexOf(SC.T.raumEnde) >= 0, "Hinweis raumEnde: " + u.g.hinweise.join("|")); gleich(u.g.weltliste, 1); gleich(u.g.rolle, "allein"); gleich(u.g.raum, null); gleich(u.g.daten, null);
    gleich(u.h.rolle, "allein"); gleich(u.h.raum, null);
    return u.sG.lade(u.eigen.id);
  }).then(function(d){ var n = 0; d.spieler.rucksack.forEach(function(p){ if(p && p.block === SC.B.KIES) n += p.anzahl; }); gleich(n, 2); gleich(u.sG.b.m["welt:gast"], undefined); }).then(mspFertig, mspFehler);
});

test("Mehrspieler: Spiel: Gastgeber speichert bei Beitritt", function(){
  var u, n = 0, gesehen = null;
  return mspZwei({ ohneBeitritt: true }).then(function(x){ u = x;
    var alt = u.sH.speichere; u.sH.speichere = function(d){ n++; gesehen = JSON.parse(JSON.stringify(d.mitspieler)); return alt.call(this, d); };
    u.g.beitreten(u.code, u.eigen.id, "Ben"); return mspLauf(u.netz, 4);
  }).then(function(){ gleich(u.anfragen, 1); wahr(n >= 1, "speichere beim Annehmen"); wahr(!!gesehen[u.g.raum.figur.figurId], "Gastfigur gemerkt"); }).then(mspFertig, mspFehler);
});

test("Mehrspieler: Spiel: Hinauswerfen meldet, Neuverbinden sperrt Blöcke", function(){
  var u, gid;
  return mspZwei().then(function(x){ u = x; gid = u.g.raum.figur.figurId;
    u.g.raum.status = "neuverbinden"; wahr(!u.g._blockErlaubt(), "Blöcke gesperrt"); u.g.raum.status = "verbunden"; wahr(u.g._blockErlaubt());
    u.h.raum.hinauswerfen(gid); return mspLauf(u.netz);
  }).then(function(){ return new Promise(function(ok){ setTimeout(ok, 20); }); }).then(function(){
    wahr(u.g.hinweise.indexOf(SC.T.raumHinausgeworfen) >= 0, u.g.hinweise.join("|")); gleich(u.g.rolle, "allein"); gleich(u.h.rolle, "gastgeber");
  }).then(mspFertig, mspFehler);
});

test("Mehrspieler: Spiel: Abgelehnter Block bei vollem Rucksack fliegt als Kugel heraus", function(){
  var u;
  return mspZwei().then(function(x){ u = x; var rs = u.g.kampf.rucksack;
    for(var i = 0; i < 36; i++) rs.plaetze[i] = { gegenstand: { id: "x" + i } };
    u.g.raum.o.beiBlockZurueck(5, 99, 5, SC.B.STEIN, { id: SC.B.BRETTER, alt: SC.B.LUFT });
    var k = []; u.g.welt.wesen.forEach(function(e){ if(e.art === "kugel") k.push(e); }); gleich(k.length, 1); gleich(k[0].sache.block, SC.B.BRETTER); wahr(k[0].id >= 1e9);
    rs.plaetze[3] = null; u.g.raum.o.beiBlockZurueck(5, 99, 5, SC.B.STEIN, { id: SC.B.BRETTER, alt: SC.B.LUFT }); gleich(rs.hat(SC.B.BRETTER), 1, "passt: zurück in den Rucksack");
    u.g.modus("kreativ"); u.g.raum.o.beiBlockZurueck(5, 99, 5, SC.B.STEIN, { id: SC.B.BRETTER, alt: SC.B.LUFT }); gleich(rs.hat(SC.B.BRETTER), 1, "Kreativ: Rucksack unberührt");
  }).then(mspFertig, mspFehler);
});

test("Mehrspieler: Spiel: Bild-Takt: Mitspieler, Zeit, Modus, eigener Schuss nur einmal", function(){
  var u, gid, hid;
  return mspZwei().then(function(x){ u = x; gid = u.g.raum.figur.figurId; hid = u.h.daten.spieler.figurId;
    u.h.tageszeit = 0.8; u.h.modus("kreativ"); u.h.daten.schwierigkeit = "schwer";
    // Schuss des Gastes beim Gastgeber (mit Schütze) und ein Gegnerschuss
    SC.Wesen.neu(u.h.welt, "geschoss", { pos: [8, 101, 8], richtung: [1, 0, 0], tempo: 1, schaden: 1, team: "spieler", schuetze: gid, art: "laser", lebensdauer: 3 });
    SC.Wesen.neu(u.h.welt, "geschoss", { pos: [8, 102, 8], richtung: [1, 0, 0], tempo: 1, schaden: 1, team: "gegner", art: "laser", lebensdauer: 3 });
    u.g._raumBild(0.1, false); u.h._raumBild(1.1, false); return mspLauf(u.netz);
  }).then(function(){
    u.g._raumBild(0.1, false); u.h._raumBild(0.1, false);
    var gs = []; u.g.welt.wesen.forEach(function(e){ if(e.art === "geschoss") gs.push(e); }); gleich(gs.length, 1, "eigener gespiegelter Schuss ausgeblendet"); gleich(gs[0].team, "gegner");
    gleich(u.g.tageszeit, 0.8); gleich(u.g.spieler.modus, "kreativ"); gleich(u.g.daten.schwierigkeit, "schwer");
    var lg = u.g.render.mitspieler, lh = u.h.render.mitspieler;
    gleich(lg.length, 1); gleich(lg[0].id, hid); gleich(lg[0].name, "Mia"); gleich(lg[0].farbe, "#3a6fd8"); wahr(!!lg[0].pos);
    gleich(lh.length, 1); gleich(lh[0].id, gid); gleich(lh[0].name, "Ben"); gleich(lh[0].farbe, "#e0533a"); gleich(lh[0].verbunden, true); wahr(lh[0].ausr && "ruestung" in lh[0].ausr, "ausr im Zustand");
  }).then(mspFertig, mspFehler);
});

test("Mehrspieler: Spiel: Anfrage offen, Gastgeber schließt: Dialog-Rückruf", function(){
  var u, weg = [];
  return mspZwei({ ohneBeitritt: true }).then(function(x){ u = x;
    u.h.raumRueckrufe = { anfrage: function(){}, anfrageWeg: function(info){ weg.push(info); } };
    u.g.beitreten(u.code, u.eigen.id, "Ben").catch(function(){}); return mspLauf(u.netz, 4);
  }).then(function(){ gleich(weg.length, 0); return u.h.verlasse(); }).then(function(){ gleich(weg.length, 1); gleich(weg[0].name, "Ben"); }).then(mspFertig, mspFehler);
});

test("Mehrspieler: Spiel: Warten abbrechen setzt zurück", function(){
  var u, e = {};
  return mspZwei({ ohneBeitritt: true }).then(function(x){ u = x; u.h.raumRueckrufe = { anfrage: function(){} };
    u.g.beitreten(u.code, u.eigen.id, "Ben").then(function(){ e.ok = true; }, function(f){ e.f = f; }); return mspLauf(u.netz, 4);
  }).then(function(){ gleich(u.g.rolle, "gast"); gleich(u.g.raum.status, "warte"); u.g.beitretenAbbrechen(); return mspLauf(u.netz); }).then(function(){
    gleich(e.f && e.f.art, "abbruch"); gleich(u.g.rolle, "allein"); gleich(u.g.raum, null);
  }).then(mspFertig, mspFehler);
});
