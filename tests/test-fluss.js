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
test("Mesher: keine Fläche zwischen Wasserstufen", function(){
  var a = leereWelt(); a.setzeBlock(5, 64, 5, SC.B.WASSER, "system"); a.setzeBlock(6, 64, 5, SC.B.WASSER_7, "system");
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
