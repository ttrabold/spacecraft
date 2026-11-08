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
