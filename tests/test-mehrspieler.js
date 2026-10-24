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
