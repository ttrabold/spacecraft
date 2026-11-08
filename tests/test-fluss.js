// Wasser und Lava fließen (Spec 2026-11-08-fliessen-design.md)
function flWelt(){ var w = leereWelt(); for(var x = 0; x < 16; x++) for(var z = 0; z < 16; z++) w.setzeBlock(x, 63, z, SC.B.STEIN, "system"); return w; }
var flRuhe = { vor: false, zurueck: false, links: false, rechts: false, springen: false, sinken: false, sprint: false, springenNeu: false };
test("Fluessig: Stufen, IDs und Höhen", function(){
  var F = SC.Fluessig, B = SC.B;
  gleich(F.id("wasser", 8, false), B.WASSER); gleich(F.id("wasser", 3, false), B.WASSER_3); gleich(F.id("lava", 2, true), B.LAVA_FALL); gleich(F.id("lava", 4, false), B.LAVA);
  gleich(F.stufe(B.WASSER_FALL), 8); gleich(F.stufe(B.LAVA_2), 2); gleich(F.quelle(B.LAVA), true); gleich(F.quelle(B.LAVA_2), false); gleich(F.fallend(B.WASSER_FALL), true);
  gleich(F.hoehe(B.WASSER_4), 0.5); gleich(F.hoehe(B.WASSER), 1); gleich(F.art(B.STEIN), null); gleich(F.art(B.LAVA_3), "lava"); wahr(F.istWasser(B.WASSER_7)); wahr(!F.istWasser(B.LAVA));
  gleich(SC.BLOECKE[B.WASSER_5].inAuswahl, false); gleich(SC.BLOECKE[B.WASSER_5].fest, false); gleich(SC.BLOECKE[B.WASSER_5].name, SC.BLOECKE[B.WASSER].name);
});
test("Fließendes Wasser: Spieler schwimmt, fließende Lava schadet", function(){
  var w = flWelt(); w.setzeBlock(5, 64, 5, SC.B.WASSER_3, "system"); w.setzeBlock(9, 64, 9, SC.B.LAVA_1, "system");
  var s = new SC.Spieler({ id: "a", pos: [5.5, 64, 5.5], blick: [0, 0], modus: "survival" }); s.schritt(w, flRuhe, 1 / 60); wahr(s.imWasser, "im fließenden Wasser");
  var l = new SC.Spieler({ id: "b", pos: [9.5, 64, 9.5], blick: [0, 0], modus: "survival" }); l.schritt(w, flRuhe, 1 / 60); wahr(l.imLava, "in fließender Lava");
});
test("Fließendes Wasser ist kein Ziel, man kann hineinbauen", function(){
  var w = flWelt(); w.setzeBlock(5, 64, 5, SC.B.WASSER_4, "system"); w.setzeBlock(5, 64, 7, SC.B.LAVA_2, "system"); w.setzeBlock(5, 64, 9, SC.B.LAVA, "system");
  var t = SC.zielen(w, [5.5, 65.5, 5.5], [0, -1, 0], 6); gleich([t.x, t.y, t.z].join(), "5,63,5", "Strahl geht durch fließendes Wasser");
  var s = new SC.Spieler({ id: "a", pos: [1.5, 64, 1.5], blick: [0, 0], modus: "survival" });
  wahr(SC.kannSetzen(w, s, 5, 64, 5), "in fließendes Wasser"); wahr(SC.kannSetzen(w, s, 5, 64, 7), "in fließende Lava"); wahr(!SC.kannSetzen(w, s, 5, 64, 9), "nicht in eine Lava-Quelle");
});
test("Tiere meiden fließendes Wasser", function(){ var w = flWelt(); w.setzeBlock(5, 64, 5, SC.B.WASSER_2, "system"); wahr(SC.KI.tierGefahr(w, 5.5, 64, 5.5)); });
test("Licht: fließendes Wasser dämpft wie Wasser", function(){
  function unter(id){ var w = flWelt(); for(var y = 64; y < 70; y++) w.setzeBlock(5, y, 5, id, "system"); return SC.Licht.chunk(w, 0, 0).himmel[SC.idx(5, 64, 5)]; }
  gleich(unter(SC.B.WASSER_6), unter(SC.B.WASSER));
});
function flMesh(w){ return SC.Mesher.chunk(w, 0, 0, SC.Licht.chunk(w, 0, 0)); }
function flMaxY(g){ var m = -1e9; for(var i = 1; i < g.positionen.length; i += 3) m = Math.max(m, g.positionen[i]); return m; }
test("Mesher: fließendes Wasser ist niedriger", function(){
  var w = leereWelt(); w.setzeBlock(5, 64, 5, SC.B.WASSER_4, "system"); wahr(flMaxY(flMesh(w).durchsichtig) <= 64.51, "Stufe 4 halb hoch: " + flMaxY(flMesh(w).durchsichtig));
  var q = leereWelt(); q.setzeBlock(5, 64, 5, SC.B.WASSER, "system"); gleich(flMaxY(flMesh(q).durchsichtig), 65, "Quelle wie bisher");
});
function flMinY(g){ var m = 1e9; for(var i = 1; i < g.positionen.length; i += 3) m = Math.min(m, g.positionen[i]); return m; }
test("Mesher: Stufe zwischen Wasserhöhen hat eine Seite, nur über dem Nachbarn", function(){
  var w = leereWelt(); w.setzeBlock(5, 64, 5, SC.B.WASSER, "system"); w.setzeBlock(6, 64, 5, SC.B.WASSER_4, "system");
  var g = flMesh(w).durchsichtig, p = g.positionen, seite = 0;
  for(var i = 0; i < p.length; i += 12){ var xs = [p[i], p[i + 3], p[i + 6], p[i + 9]], ys = [p[i + 1], p[i + 4], p[i + 7], p[i + 10]];
    if(xs.every(function(x){ return Math.abs(x - 6) < 1e-6; }) && Math.min.apply(null, ys) > 64.49 && Math.max.apply(null, ys) > 64.99) seite++; }
  gleich(seite, 1, "eine Seitenfläche von 64,5 bis 65 an x = 6");
});
test("Mesher: keine Fläche zwischen gleich hohem Wasser", function(){
  var a = leereWelt(); a.setzeBlock(5, 64, 5, SC.B.WASSER, "system"); a.setzeBlock(6, 64, 5, SC.B.WASSER_FALL, "system");
  var b = leereWelt(); b.setzeBlock(5, 64, 5, SC.B.WASSER, "system"); b.setzeBlock(6, 64, 5, SC.B.WASSER, "system");
  gleich(flMesh(a).durchsichtig.indizes.length, flMesh(b).durchsichtig.indizes.length);
});
function flB(w, x, y, z){ return w.holeBlock(x, y, z); }
test("Fluss: Wasser breitet sich 7 Blöcke weit aus", function(){
  var w = flWelt(), f = new SC.Fluss(w); w.setzeBlock(4, 64, 8, SC.B.WASSER, "system"); f.bisRuhe(500);
  gleich(flB(w, 5, 64, 8), SC.B.WASSER_7); gleich(flB(w, 11, 64, 8), SC.B.WASSER_1); gleich(flB(w, 12, 64, 8), SC.B.LUFT); gleich(flB(w, 4, 64, 15), SC.B.WASSER_1); gleich(flB(w, 4, 65, 8), SC.B.LUFT);
});
test("Fluss: Lava nur 3 weit, Wasser 4-mal so schnell", function(){
  var w = flWelt(), f = new SC.Fluss(w); w.setzeBlock(8, 64, 8, SC.B.LAVA, "system"); w.setzeBlock(2, 64, 2, SC.B.WASSER, "system");
  f.schritt(0.25); gleich(flB(w, 9, 64, 8), SC.B.LUFT, "Lava nach 0,25 s noch nicht"); gleich(flB(w, 3, 64, 2), SC.B.WASSER_7, "Wasser nach 0,25 s");
  f.schritt(0.75); gleich(flB(w, 9, 64, 8), SC.B.LAVA_3, "Lava nach 1 s"); gleich(flB(w, 10, 64, 8), SC.B.LUFT, "genau einen Block");
  f.bisRuhe(500); gleich(flB(w, 11, 64, 8), SC.B.LAVA_1); gleich(flB(w, 12, 64, 8), SC.B.LUFT);
});
test("Fluss: Wasser fällt die Stufe hinunter und läuft dorthin", function(){
  var w = flWelt(), f = new SC.Fluss(w);
  for(var x = 0; x < 16; x++) for(var z = 0; z < 16; z++){ if(x >= 8) w.setzeBlock(x, 63, z, SC.B.LUFT, "system"); w.setzeBlock(x, 60, z, SC.B.STEIN, "system"); }   // Stufe bei x = 8, Boden unten durchgehend
  w.setzeBlock(6, 64, 8, SC.B.WASSER, "system"); f.bisRuhe(2000);
  gleich(flB(w, 8, 64, 8), SC.B.WASSER_6); gleich(flB(w, 8, 62, 8), SC.B.WASSER_FALL); gleich(flB(w, 8, 61, 8), SC.B.WASSER_FALL); gleich(flB(w, 9, 61, 8), SC.B.WASSER_7);
  gleich(flB(w, 5, 64, 8), SC.B.LUFT, "läuft zum Abhang, nicht zurück");
});
test("Fluss: Quelle weg, Strom läuft aus; Damm stoppt ihn", function(){
  var w = flWelt(), f = new SC.Fluss(w); w.setzeBlock(4, 64, 8, SC.B.WASSER, "system"); f.bisRuhe(500);
  w.setzeBlock(6, 64, 8, SC.B.STEIN, "spieler"); f.bisRuhe(500); gleich(flB(w, 7, 64, 8), SC.B.WASSER_3, "um den Damm herum (5 Blöcke Weg)"); gleich(flB(w, 11, 64, 8), SC.B.LUFT, "hinter dem Damm leer");
  w.setzeBlock(4, 64, 8, SC.B.LUFT, "spieler"); f.bisRuhe(500);
  var rest = 0; for(var x = 0; x < 16; x++) for(var z = 0; z < 16; z++) if(SC.Fluessig.art(flB(w, x, 64, z))) rest++; gleich(rest, 0, "kein Wasser mehr");
});
test("Fluss: neue Quelle zwischen zwei Quellen, See läuft nicht leer", function(){
  var w = flWelt(), f = new SC.Fluss(w); w.setzeBlock(6, 64, 8, SC.B.WASSER, "system"); w.setzeBlock(8, 64, 8, SC.B.WASSER, "system"); f.bisRuhe(500);
  gleich(flB(w, 7, 64, 8), SC.B.WASSER, "Lücke wird Quelle");
  var s = flWelt(), g = new SC.Fluss(s); for(var x = 4; x < 8; x++) for(var z = 4; z < 8; z++) s.setzeBlock(x, 64, z, SC.B.WASSER, "system");
  g.bisRuhe(1000); s.setzeBlock(9, 62, 5, SC.B.STEIN, "system"); s.setzeBlock(9, 63, 5, SC.B.LUFT, "spieler"); g.bisRuhe(1000);
  var q = 0; for(x = 4; x < 8; x++) for(z = 4; z < 8; z++) if(flB(s, x, 64, z) === SC.B.WASSER) q++; gleich(q, 16, "alle Quellen bleiben");
  wahr(SC.Fluessig.istWasser(flB(s, 9, 63, 5)), "Loch füllt sich");
});
test("Fluss: Lava trifft Wasser, Basalt entsteht", function(){
  var w = flWelt(), f = new SC.Fluss(w); w.setzeBlock(5, 64, 5, SC.B.LAVA, "system"); w.setzeBlock(7, 64, 5, SC.B.WASSER, "system"); f.bisRuhe(500);
  gleich(flB(w, 5, 64, 5), SC.B.BASALT); gleich(flB(w, 7, 64, 5), SC.B.WASSER, "Wasser bleibt");
  var r = 0; for(var x = 0; x < 16; x++) for(var z = 0; z < 16; z++) if(SC.Fluessig.istLava(flB(w, x, 64, z))) r++; gleich(r, 0, "keine Lava neben Wasser übrig");
});
test("Fluss: lädt keine Chunks", function(){ var w = flWelt(), f = new SC.Fluss(w); w.setzeBlock(15, 64, 8, SC.B.WASSER, "system"); f.bisRuhe(500); gleich(w.istGeladen(1, 0), false); gleich(flB(w, 14, 64, 8), SC.B.WASSER_7); });
test("Fluss: Grenze je Takt, Rest wartet", function(){
  var w = flWelt(), f = new SC.Fluss(w); for(var x = 0; x < 16; x++) for(var z = 0; z < 16; z += 2) w.setzeBlock(x, 64, z, SC.B.WASSER, "system");
  wahr(f.wartend() > SC.Fluss.JE_SCHRITT, "viel zu tun: " + f.wartend()); f.schritt(0.25); wahr(f.zuletzt <= SC.Fluss.JE_SCHRITT && f.zuletzt > 0, "bearbeitet: " + f.zuletzt); wahr(f.wartend() > 0);
});
test("Fluss: aus heißt aus", function(){ var w = flWelt(), f = new SC.Fluss(w); f.an = false; w.setzeBlock(4, 64, 8, SC.B.WASSER, "system"); f.schritt(5); gleich(flB(w, 5, 64, 8), SC.B.LUFT); f.abbauen(); });
// Strömungs-Welt: Wasserbecken bei y = 64, nach Osten (x+) immer flacher, Wände rundum
function flStrom(){
  var w = flWelt(); for(var x = 0; x < 16; x++) for(var z = 0; z < 16; z++) for(var y = 64; y < 67; y++) w.setzeBlock(x, y, z, z < 4 || z > 6 ? SC.B.STEIN : SC.B.LUFT, "system");
  for(var x2 = 2; x2 <= 8; x2++) for(var z2 = 4; z2 <= 6; z2++) w.setzeBlock(x2, 64, z2, SC.Fluessig.id("wasser", 9 - x2, false), "system");
  return w;
}
test("Strömung: Quelle schiebt nicht, Fließstufe schiebt zur niedrigeren", function(){
  var w = flStrom(), s = SC.Fluss.stroemung(w, 4.5, 64.4, 5.5); wahr(Math.abs(s[0] - SC.Fluss.STROEMUNG) < 1e-6 && Math.abs(s[1]) < 1e-6, "nach Osten: " + s);
  gleich(SC.Fluss.STROEMUNG, 0.4 * SC.PHYSIK.laufen); w.setzeBlock(4, 64, 5, SC.B.WASSER, "system"); gleich(SC.Fluss.stroemung(w, 4.5, 64.4, 5.5).join(), "0,0", "Quelle ruht");
  gleich(SC.Fluss.stroemung(w, 12.5, 64.4, 5.5).join(), "0,0", "Luft schiebt nicht");
});
test("Strömung: Spieler treibt mit, kommt aber dagegen an", function(){
  var w = flStrom(), s = new SC.Spieler({ id: "a", pos: [4.5, 64, 5.5], blick: [0, 0], modus: "survival" });
  for(var i = 0; i < 20; i++) s.schritt(w, flRuhe, 0.05); wahr(s.pos[0] > 4.8, "treibt nach Osten: " + s.pos[0]);
  var g = new SC.Spieler({ id: "b", pos: [6.5, 64, 5.5], blick: [Math.PI / 2, 0], modus: "survival" }), e = Object.assign({}, flRuhe, { vor: true });   // Blick nach Westen
  for(var j = 0; j < 20; j++) g.schritt(w, e, 0.05); wahr(g.pos[0] < 6.3, "schwimmt dagegen an: " + g.pos[0]);
});
test("Strömung: Tiere treiben mit", function(){
  var w = flStrom(), d = SC.TIERE.hase, e = SC.Wesen.neu(w, "tier", { tierArt: "hase", wild: true, pos: [4.5, 64, 5.5], heim: [4.5, 64, 5.5], breite: d.breite, hoehe: d.hoehe }); e.haeltStill = true;
  for(var i = 0; i < 20; i++) SC.KI.tier(w, e, { spieler: [] }, 0.05, SC.zufall(3)); wahr(e.pos[0] > 4.8, "treibt: " + e.pos[0]);
});
test("Eimer: Rezept 3 Eisenerz an der Werkbank", function(){
  var r = SC.Crafting.rezept("eimer"); wahr(r, "Rezept da"); gleich(JSON.stringify(r.kosten), JSON.stringify([{ block: SC.B.EISENERZ, anzahl: 3 }]));
  var rs = new SC.Rucksack(); rs.lege({ block: SC.B.EISENERZ, anzahl: 3 }); gleich(SC.Crafting.herstelle(rs, r, {}, SC.zufall(1), 1).ok, true); gleich(rs.hat(SC.B.EIMER), 1);
  wahr(SC.BLOECKE[SC.B.EIMER].nichtAufstellbar && SC.BLOECKE[SC.B.EIMER_WASSER].nichtAufstellbar, "nicht aufstellbar"); wahr(SC.BLOECKE[SC.B.EIMER_LAVA].inAuswahl && !SC.BLOECKE[SC.B.EIMER].inAuswahl, "volle Eimer im Kreativ");
});
test("Eimer: schöpfen nur an Quellen", function(){
  var w = flWelt(); w.setzeBlock(5, 64, 5, SC.B.WASSER, "system"); w.setzeBlock(6, 64, 5, SC.B.WASSER_3, "system"); w.setzeBlock(7, 64, 5, SC.B.LAVA, "system");
  gleich(SC.Eimer.schoepfen(w, 5, 64, 5), "wasser"); gleich(w.holeBlock(5, 64, 5), SC.B.LUFT); gleich(SC.Eimer.schoepfen(w, 6, 64, 5), null); gleich(w.holeBlock(6, 64, 5), SC.B.WASSER_3);
  gleich(SC.Eimer.schoepfen(w, 7, 64, 5), "lava"); gleich(SC.Eimer.voll("lava"), SC.B.EIMER_LAVA); gleich(SC.Eimer.art(SC.B.EIMER_WASSER), "wasser"); gleich(SC.Eimer.art(SC.B.EIMER), null);
});
test("Eimer: zielen mit quellen trifft die Quelle", function(){
  var w = flWelt(); w.setzeBlock(5, 64, 5, SC.B.WASSER, "system"); var t = SC.zielen(w, [5.5, 66.5, 5.5], [0, -1, 0], 6, { quellen: true }); gleich([t.x, t.y, t.z].join(), "5,64,5");
  gleich([SC.zielen(w, [5.5, 66.5, 5.5], [0, -1, 0], 6).y].join(), "63", "ohne quellen wie bisher");
});
test("Eimer: ausgießen nicht in den Spieler oder ein Tier", function(){
  var w = flWelt(), s = new SC.Spieler({ id: "a", pos: [5.5, 64, 5.5], blick: [0, 0], modus: "survival" }), d = SC.TIERE.hase;
  gleich(SC.Eimer.ausgiessen(w, s, 5, 64, 5, "lava"), false, "nicht in den Spieler"); SC.Wesen.neu(w, "tier", { tierArt: "hase", wild: true, pos: [9.5, 64, 9.5], heim: [9.5, 64, 9.5], breite: d.breite, hoehe: d.hoehe });
  gleich(SC.Eimer.ausgiessen(w, s, 9, 64, 9, "lava"), false, "nicht in ein Tier"); gleich(SC.Eimer.ausgiessen(w, s, 2, 64, 2, "wasser"), true); gleich(w.holeBlock(2, 64, 2), SC.B.WASSER);
});
test("Eimer: abgelehnter Gast-Wunsch tauscht den Eimer zurück", function(){
  var rs = new SC.Rucksack(); rs.lege({ block: SC.B.EIMER, anzahl: 1 }); SC.Raum.blockZurueck(rs, { id: SC.B.WASSER, alt: SC.B.LUFT }, SC.B.STEIN);
  gleich(rs.hat(SC.B.EIMER_WASSER), 1, "voller Eimer zurück"); gleich(rs.hat(SC.B.EIMER), 0); gleich(rs.hat(SC.B.WASSER), 0, "kein Wasserblock");
  SC.Raum.blockZurueck(rs, { id: SC.B.LUFT, alt: SC.B.LAVA }, SC.B.LUFT); gleich(rs.hat(SC.B.EIMER), 1, "Schöpfen zurück: leerer Eimer"); gleich(rs.hat(SC.B.EIMER_WASSER), 1); gleich(rs.hat(SC.B.EIMER_LAVA), 0);
});
test("Eimer: Brunnen aus zwei Eimern", function(){
  var w = flWelt(), f = new SC.Fluss(w), s = new SC.Spieler({ id: "a", pos: [1.5, 64, 1.5], blick: [0, 0], modus: "survival" });
  SC.Eimer.ausgiessen(w, s, 6, 64, 8, "wasser"); SC.Eimer.ausgiessen(w, s, 8, 64, 8, "wasser"); f.bisRuhe(500); gleich(w.holeBlock(7, 64, 8), SC.B.WASSER);
  gleich(SC.Eimer.schoepfen(w, 7, 64, 8), "wasser"); f.bisRuhe(500); gleich(w.holeBlock(7, 64, 8), SC.B.WASSER, "füllt sich wieder");
});
function flSurv(){ var s = survSpiel(), w = s.welt; for(var x = 0; x < 9; x++) for(var z = 0; z < 9; z++){ w.setzeBlock(x, 88, z, SC.B.STEIN, "system"); for(var y = 89; y < 94; y++) w.setzeBlock(x, y, z, SC.B.LUFT, "system"); } s.spieler.pos = [4.5, 89, 4.5]; s.spieler.blick = [0, -Math.PI / 2]; s.spieler.auswahl = 0; s.beuteAuswerfen = function(){ s._raus = true; }; return s; }
test("Eimer im Spiel: schöpfen tauscht leer gegen voll", function(){
  var s = flSurv(), w = s.welt, rs = s.kampf.rucksack; w.setzeBlock(4, 88, 4, SC.B.WASSER, "system"); rs.plaetze[0] = { block: SC.B.EIMER, anzahl: 2 };
  wahr(s._eimer(null), "Eimer benutzt"); gleich(w.holeBlock(4, 88, 4), SC.B.LUFT); gleich(rs.hat(SC.B.EIMER), 1); gleich(rs.hat(SC.B.EIMER_WASSER), 1);
  wahr(s._eimer(null), "Eimer in der Hand verbraucht den Tipp, auch ohne Quelle"); gleich(rs.hat(SC.B.EIMER), 1);
});
test("Eimer im Spiel: ausgießen tauscht voll gegen leer, Kreativ verbraucht nichts", function(){
  var s = flSurv(), w = s.welt, rs = s.kampf.rucksack, z = { x: 2, y: 88, z: 2, nx: 0, ny: 1, nz: 0 }; rs.plaetze[0] = { block: SC.B.EIMER_LAVA, anzahl: 1 };
  wahr(s._eimer(z)); gleich(w.holeBlock(2, 89, 2), SC.B.LAVA); gleich(rs.hat(SC.B.EIMER_LAVA), 0); gleich(rs.hat(SC.B.EIMER), 1);
  gleich(rs.plaetze[0].block, SC.B.EIMER, "leerer Eimer wieder in der Hand"); rs.plaetze[0] = null; gleich(s._eimer(z), false, "ohne Eimer in der Hand");
  var k = flSurv(); k.spieler.modus = "kreativ"; k.spieler.schnellleiste[0] = SC.B.EIMER_WASSER; wahr(k._eimerKreativ({ x: 6, y: 88, z: 6, nx: 0, ny: 1, nz: 0 })); gleich(k.welt.holeBlock(6, 89, 6), SC.B.WASSER);
});
test("Fluss im Raum: Gastgeber bündelt, Gast setzt", function(){
  var u, a, gesendet = [];
  return mspRaum(1).then(function(x){ u = x; a = u.gs[0]; var echt = u.h.sendeAlle; u.h.sendeAlle = function(n, aus){ gesendet.push(n); return echt.call(u.h, n, aus); };
    var nr = a.g._nr; a.nrVorher = nr;
    u.welt.setzeBlock(5, 62, 5, SC.B.WASSER_3, "fluss"); u.welt.setzeBlock(6, 62, 5, SC.B.WASSER_2, "fluss"); u.welt.setzeBlock(7, 62, 5, SC.B.WASSER_1, "fluss");
    gleich(gesendet.filter(function(n){ return n.t === "block"; }).length, 0, "nicht einzeln");
    u.h.takt(0.016, mspIch()); return raumLauf(u.netz);
  }).then(function(){
    var b = gesendet.filter(function(n){ return n.t === "bloecke"; }); gleich(b.length, 1, "eine Nachricht"); gleich(b[0].l.length, 12);
    gleich(a.welt.holeBlock(5, 62, 5), SC.B.WASSER_3); gleich(a.welt.holeBlock(7, 62, 5), SC.B.WASSER_1); gleich(a.g._nr, a.nrVorher, "kein Wunsch zurück an den Gastgeber");
  });
});
test("Fluss: im Spiel nur für Einzelspieler und Gastgeber", function(){
  var s = survSpiel(); s.fluss = new SC.Fluss(s.welt); s.rolle = "gast"; s.welt.setzeBlock(4, 90, 4, SC.B.WASSER, "system"); s._flussTakt(1); gleich(s.welt.holeBlock(5, 90, 4), SC.B.LUFT, "Gast rechnet nicht");
  gleich(s.fluss, null, "Gast meldet das Fließen ab"); s = survSpiel(); s.fluss = new SC.Fluss(s.welt); s.welt.setzeBlock(4, 90, 4, SC.B.WASSER, "system"); s._flussTakt(1); wahr(SC.Fluessig.istWasser(s.welt.holeBlock(5, 90, 4)) || SC.Fluessig.istWasser(s.welt.holeBlock(4, 89, 4)), "allein fließt es");
});
test("Netzprotokoll 9", function(){ gleich(SC.NETZ_PROTOKOLL, 9); });
test("Anleitung erklärt Wasser, Lava und Eimer", function(){
  var a = SC.T.anleitung.abschnitte.filter(function(x){ return x[0] === "Wasser und Lava"; })[0]; wahr(a && a[1].length >= 4, "Abschnitt"); var t = a[1].join(" "); wahr(t.indexOf("Eimer") >= 0 && t.indexOf("Basalt") >= 0 && t.indexOf("Eisenerz") >= 0);
  wahr(SC.T.ewFluss, "Text für den Schalter im Entwicklerpanel");
});
test("Eimer in der Hand: flaches Bild statt Würfel", function(){
  [SC.B.EIMER, SC.B.EIMER_WASSER, SC.B.EIMER_LAVA].forEach(function(id){
    var h = SC.Render.handForm(SC.BLOECKE[id]); wahr(h, "eigene Handform: " + id); gleich(h.attributes.position.count, 4, "eine Fläche"); gleich(h.index.count, 6);
    h.computeBoundingBox(); wahr(h.boundingBox.max.z - h.boundingBox.min.z < 0.01, "flach");
  });
});
test("Strömung auf Eis schleudert nicht", function(){
  var w = flStrom(); for(var x = 2; x <= 8; x++) for(var z = 4; z <= 6; z++) w.setzeBlock(x, 63, z, SC.B.EIS, "system");
  var s = new SC.Spieler({ id: "a", pos: [3.5, 64, 5.5], blick: [0, 0], modus: "survival" }), max = 0;
  for(var i = 0; i < 40; i++){ s.schritt(w, flRuhe, 0.05); max = Math.max(max, Math.hypot(s.geschw[0], s.geschw[2])); }
  wahr(max <= SC.Fluss.STROEMUNG + 0.01, "höchstens Strömungstempo: " + max);
});
test("Eimer: nicht auf Mitspieler ausgießen", function(){
  var w = flWelt(), s = new SC.Spieler({ id: "a", pos: [1.5, 64, 1.5], blick: [0, 0], modus: "survival" });
  gleich(SC.Eimer.ausgiessen(w, s, 9, 64, 9, "lava", [[9.5, 64, 9.5]]), false, "Mitspieler steht dort"); gleich(SC.Eimer.ausgiessen(w, s, 9, 65, 9, "lava", [[9.5, 64, 9.5]]), false, "Kopfhöhe");
  gleich(SC.Eimer.ausgiessen(w, s, 12, 64, 9, "lava", [[9.5, 64, 9.5]]), true);
  var g = flSurv(), ziel = { x: 2, y: 88, z: 2, nx: 0, ny: 1, nz: 0 }; g.kampf.rucksack.plaetze[0] = { block: SC.B.EIMER_LAVA, anzahl: 1 }; g._mitspielerListe = function(){ return [{ pos: [2.5, 89, 2.5] }]; };
  g._eimer(ziel); gleich(g.welt.holeBlock(2, 89, 2), SC.B.LUFT, "Spiel gibt die Mitspieler weiter");
});
