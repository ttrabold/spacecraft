// Zauberkugel (#124–#126): Tisch mit Kristallkugel, teleportiert zum Bett
test("Zauberkugel: Block mit Tisch und leuchtender Kugel (#124)", function(){
  gleich(SC.B.ZAUBERKUGEL, 70); var b = SC.BLOECKE[70]; wahr(b && b.name === "Zauberkugel", "Name"); wahr(b.fest && b.durchsichtig && b.zerstoerbar && b.inAuswahl, "fest, nicht deckend, abbaubar, im Kreativ wählbar"); wahr(b.leuchten >= 6 && b.lichtFarbe, "leuchtet violett");
  gleich(b.form.typ, "mehrteilig"); wahr(b.form.teile.length >= 6, "Platte, Beine, Kugel"); ["oben", "seite", "unten", "kugel"].forEach(function(s){ wahr(SC.Mesher.atlasNamen.indexOf(b.seiten[s]) >= 0, "Textur " + s); });
  wahr(b.form.teile.some(function(t){ return t.leuchtet; }), "Kugel glüht"); gleich(SC.Abbau.ergibt(70), 70); wahr(SC.Abbau.zeit(70) < 3);
  var w = leereWelt(); w.setzeBlock(5, 64, 5, 70, "system"); var g = SC.Mesher.chunk(w, 0, 0, SC.Licht.chunk(w, 0, 0)).durchsichtig; wahr(g.indizes.length / 6 >= 30, "viele Flächen: " + g.indizes.length / 6);
  var hoch = -1e9, breit = [1e9, -1e9]; for(var i = 0; i < g.positionen.length; i += 3){ hoch = Math.max(hoch, g.positionen[i + 1]); breit[0] = Math.min(breit[0], g.positionen[i]); breit[1] = Math.max(breit[1], g.positionen[i]); } wahr(hoch > 64.95 && hoch < 65.4, "Kugel ragt etwas über den Block: " + hoch); wahr(breit[1] - breit[0] > 0.8, "Tischplatte fast so breit wie der Block");
  var uv = {}; for(var j = 0; j < g.uv.length; j += 2) uv[Math.round(g.uv[j] * 1000) + "," + Math.round(g.uv[j + 1] * 1000)] = 1; wahr(Object.keys(uv).length >= 12, "Tisch- und Kugelkacheln");
  gleich(SC.Licht.chunk(w, 0, 0).block[SC.idx(5, 64, 5)] >= 6, true, "Lichtquelle");
});
test("Zauberkugel in der Hand und als Rezept (#124)", function(){
  var h = SC.Render.handForm(SC.BLOECKE[70]); wahr(h && h.attributes.position.count >= 36, "Handform"); h.computeBoundingBox(); wahr(h.boundingBox.max.x - h.boundingBox.min.x < 0.35, "klein genug für die Hand");
  var rz = SC.Crafting.rezept("zauberkugel"), B = SC.B; wahr(rz && rz.station === "werkbank" && rz.ergibt.block === 70 && rz.ergibt.anzahl === 1); var s = {}; rz.kosten.forEach(function(x){ s[x.block] = x.anzahl; });
  gleich(s[B.BRETTER], 6); gleich(s[B.KRISTALL_BLAU], 2); gleich(s[B.KRISTALL_GRUEN], 1); gleich(s[B.TITAN], 1);
  var rs = new SC.Rucksack(); [[B.BRETTER, 6], [B.KRISTALL_BLAU, 2], [B.KRISTALL_GRUEN, 1], [B.TITAN, 1]].forEach(function(p){ rs.lege({ block: p[0], anzahl: p[1] }); }); gleich(SC.Crafting.herstelle(rs, rz, null, SC.zufall(1), 1).ok, true); gleich(rs.hat(70), 1); gleich(rs.hat(B.BRETTER), 0);
  var a = wb(); a.ui.zeigeWerkbank(a.k, a.o); wahr(a.w.querySelector('[data-aktion="rezept"][data-id="zauberkugel"]'), "Karte im Menü"); gleich(SC.T.rezeptName.zauberkugel, "Zauberkugel");
});
