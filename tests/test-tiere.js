// Haustiere (Spec 2026-11-04-haustiere-design): Tiertabelle, Werte, Stärkung, Erfahrung
function tierNeu(art){ return SC.Tier.neu(art || "hund", SC.zufall(3)); }
test("Tiertabelle: jede Art hat Planet, Stil, Modell und Namen", function(){
  var n = 0;
  for(var a in SC.TIERE){ var d = SC.TIERE[a]; n++; wahr(d.modell.length && d.namen.length && d.name && ["start","glutfrost","rankenmoor"].indexOf(d.planet) >= 0, a); wahr(d.seltenheit >= 0 && d.seltenheit <= 2, a + " Seltenheit"); wahr(d.lp(1) > 0 && d.schaden(1) > 0, a + " Werte"); }
  gleich(n, 15);
  gleich(SC.Tier.arten("glutfrost").sort().join(), "eisbaer,glutsalamander,pinguin,schneefuchs");
  gleich(SC.Tier.arten("start").length, 7); gleich(SC.Tier.arten("rankenmoor").length, 4);
});
test("Stärkung: Streicheln 120 s, Füttern 300 s, ersetzt statt zu stapeln", function(){
  var t = tierNeu(), s0 = SC.Tier.werte(t).schaden;
  SC.Tier.staerken(t, "streicheln"); gleich(t.staerke.rest, 120); gleich(t.staerke.art, "streicheln"); wahr(SC.Tier.werte(t).schaden > s0, "stärker");
  var s1 = SC.Tier.werte(t).schaden;
  SC.Tier.staerken(t, "fuettern"); gleich(t.staerke.rest, 300); gleich(t.staerke.art, "fuettern"); wahr(SC.Tier.werte(t).schaden > s1, "Füttern stärker als Streicheln");
  SC.Tier.staerken(t, "fuettern"); gleich(t.staerke.rest, 300, "stapelt nicht");
  SC.Tier.zeit(t, 300); gleich(t.staerke, null); gleich(SC.Tier.werte(t).schaden, s0, "wieder normal");
});
test("Füttern heilt", function(){ var t = tierNeu(); t.lp = 1; SC.Tier.staerken(t, "fuettern"); gleich(t.lp, SC.Tier.werte(t).lpMax); });
test("K.o.-Erholung nach 60 s", function(){
  var t = tierNeu(); t.lp = 0; t.koRest = 60; SC.Tier.zeit(t, 59); wahr(t.koRest > 0, "noch K.o."); gleich(t.lp, 0);
  SC.Tier.zeit(t, 1); gleich(t.koRest, 0); gleich(t.lp, SC.Tier.werte(t).lpMax);
});
test("Tierstufe nie über der Besitzerstufe", function(){
  var t = tierNeu(); var auf = SC.Tier.gibErfahrung(t, 1e6, 3); gleich(t.stufe, 3); gleich(auf, 2);
  SC.Tier.gibErfahrung(t, 0, 5); gleich(t.stufe, 5, "folgt, sobald der Besitzer aufsteigt");
});
test("Höhere Tierstufe gibt mehr Leben und Schaden", function(){ var t = tierNeu(), w1 = SC.Tier.werte(t); SC.Tier.gibErfahrung(t, 1e6, 10); var w2 = SC.Tier.werte(t); wahr(w2.lpMax > w1.lpMax && w2.schaden > w1.schaden); });
test("Neues Tier: Name aus der Liste, volles Leben, nicht draußen", function(){
  var t = tierNeu("katze"); wahr(SC.TIERE.katze.namen.indexOf(t.name) >= 0); gleich(t.stufe, 1); gleich(t.draussen, false); gleich(t.koRest, 0); gleich(t.lp, SC.Tier.werte(t).lpMax); wahr(typeof t.id === "string" && t.id.length > 3);
  wahr(tierNeu().id !== tierNeu().id, "Ids verschieden");
});
// Käfig (Haustier-Inventar)
test("Käfig: 18 Plätze, voll lehnt ab", function(){
  var k = new SC.Kaefig(); gleich(k.alsDaten().length, 18);
  for(var i = 0; i < 18; i++) wahr(k.lege(tierNeu()), "Platz " + i);
  gleich(k.lege(tierNeu()), false, "voll");
});
test("Käfig: höchstens 3 draußen, K.o. nicht", function(){
  var k = new SC.Kaefig(), ts = [1, 2, 3, 4, 5].map(function(){ var t = tierNeu(); k.lege(t); return t; });
  gleich(k.rauslassen(ts[0].id), "ok"); gleich(k.rauslassen(ts[1].id), "ok"); gleich(k.rauslassen(ts[2].id), "ok"); gleich(k.rauslassen(ts[3].id), "voll");
  gleich(k.draussen().length, 3); k.zurueck(ts[0].id); gleich(k.draussen().length, 2); gleich(k.rauslassen(ts[3].id), "ok");
  ts[4].koRest = 30; gleich(k.rauslassen(ts[4].id), "ko");
  gleich(k.rauslassen("gibtsnicht"), "fehlt");
});
test("Käfig: freilassen macht den Platz frei, umbenennen prüft den Namen", function(){
  var k = new SC.Kaefig(), t = tierNeu("hase"), alt = t.name; k.lege(t);
  k.umbenennen(t.id, "   "); gleich(k.tier(t.id).name, alt, "leer bleibt");
  k.umbenennen(t.id, "x".repeat(17)); gleich(k.tier(t.id).name, alt, "zu lang bleibt");
  k.umbenennen(t.id, "  Flocke "); gleich(k.tier(t.id).name, "Flocke");
  k.freilassen(t.id); gleich(k.tier(t.id), null); gleich(k.lege(tierNeu()), true);
});
test("Käfig aus Daten: null, kurze und fremde Listen werden aufgefüllt", function(){
  gleich(new SC.Kaefig(null).alsDaten().length, 18); gleich(new SC.Kaefig([tierNeu()]).alsDaten().length, 18);
  var t = tierNeu(); var k = new SC.Kaefig(JSON.parse(JSON.stringify(new SC.Kaefig([t]).alsDaten()))); gleich(k.tier(t.id).name, t.name);
});
test("Alter Spielstand ohne Käfig lädt, Kampf hat einen leeren Käfig", function(){
  var d = SC.Spielstand.neu({ name: "A" }); delete d.spieler.kaefig;
  var m = SC.Spielstand.migriere(d).daten; wahr(Array.isArray(m.spieler.kaefig), "Array"); gleich(m.spieler.kaefig.length, 18);
  var w = new SC.Welt(new SC.Planet({ id: "start", seed: 5 })), k = new SC.Kampf(w, new SC.Spieler({ id: "a", pos: [4.5, 61, 4.5], modus: "survival" }), m, SC.zufall(9));
  gleich(k.kaefig.alsDaten().length, 18); gleich(k.kaefig.draussen().length, 0);
});
test("Käfig wird mit der Figur gespeichert und reist mit", function(){
  var d = SC.Spielstand.neu({ name: "A", modus: "survival" }), w = new SC.Welt(new SC.Planet({ id: "start", seed: 5 })), sp = new SC.Spieler({ id: "a", pos: [4.5, 61, 4.5], modus: "survival" });
  var k = new SC.Kampf(w, sp, d, SC.zufall(9)), t = tierNeu("fuchs"); k.kaefig.lege(t); k.kaefig.rauslassen(t.id);
  SC.Spielstand.ausSpieler(d, sp, k); gleich(d.spieler.kaefig.length, 18); var f = SC.Spielstand.figur(d);
  var eigen = SC.Spielstand.figurUebernehmen(SC.Spielstand.neu({ name: "E" }), f);
  var k2 = new SC.Kampf(w, sp, eigen, SC.zufall(9)); gleich(k2.kaefig.tier(t.id).name, t.name); gleich(k2.kaefig.tier(t.id).draussen, true);
  wahr(SC.Spielstand.FIGUR_FELDER.indexOf("kaefig") >= 0, "Figurfeld");
});
// Netz und Tierfutter (Aufgabe 3)
test("Netz und Tierfutter an der Werkbank", function(){
  var rs = new SC.Rucksack(), B = SC.B;
  wahr(SC.Crafting.rezept("netz") && SC.Crafting.rezept("tierfutter"), "Rezepte");
  gleich(SC.Crafting.herstelle(rs, SC.Crafting.rezept("netz"), {}, SC.zufall(1), 1).ok, false, "ohne Material");
  rs.lege({ block: B.WOLLE_ROT, anzahl: 4 }); rs.lege({ block: B.BRETTER, anzahl: 4 }); rs.lege({ block: B.BLAETTER, anzahl: 2 }); rs.lege({ block: B.LEUCHTPILZ, anzahl: 1 });
  gleich(SC.Crafting.herstelle(rs, SC.Crafting.rezept("netz"), {}, SC.zufall(1), 1).ok, true); gleich(rs.hat(B.NETZ), 1);
  gleich(SC.Crafting.herstelle(rs, SC.Crafting.rezept("tierfutter"), {}, SC.zufall(1), 1).ok, true); gleich(rs.hat(B.TIERFUTTER), 4);
  wahr(SC.BLOECKE[B.NETZ].name && SC.BLOECKE[B.TIERFUTTER].name, "Namen"); wahr(SC.T.rezeptName.netz && SC.T.rezeptName.tierfutter, "Rezeptnamen");
});
test("Netz und Tierfutter lassen sich nicht aufstellen", function(){
  var w = new SC.Welt(new SC.Planet({ id: "start", seed: 5 })), z = { x: 4, y: 89, z: 4, nx: 0, ny: 1, nz: 0 };
  gleich(SC.Bauteile.aufstellId(w, SC.B.NETZ, z, [0, 0, -1]), 0); gleich(SC.Bauteile.aufstellId(w, SC.B.TIERFUTTER, z, [0, 0, -1]), 0);
  gleich(SC.Bauteile.aufstellId(w, SC.B.STEIN, z, [0, 0, -1]), SC.B.STEIN, "andere Blöcke wie bisher");
});
test("Netz ist keine Waffe: k.netz() findet es, k.waffe() nicht", function(){
  var s = survSpiel(), k = s.kampf; gleich(k.netz(), null, "leer"); k.rucksack.plaetze[0] = { block: SC.B.NETZ, anzahl: 1 }; s.spieler.auswahl = 0;
  gleich(k.waffe(), null); wahr(k.netz(), "Netz in der Hand"); s.spieler.auswahl = 1; gleich(k.netz(), null, "Netz nicht in der Hand");
});
test("Mit dem Netz in der Hand wird nicht abgebaut", function(){
  var s = survSpiel(), w = s.welt; s.kampf.rucksack.plaetze[0] = { block: SC.B.NETZ, anzahl: 1 }; s.spieler.auswahl = 0; w.setzeBlock(4, 89, 4, SC.B.STEIN, "system"); var z = { x: 4, y: 89, z: 4 };
  for(var j = 0; j < 40; j++) s.abbauFortschritt(z, 0.05); gleich(w.holeBlock(4, 89, 4), SC.B.STEIN); gleich(s.abbauAnteil(z), 0);
  gleich(s.setzeAusRucksack(4, 90, 4, { x: 4, y: 89, z: 4, nx: 0, ny: 1, nz: 0 }), false, "Netz wird nicht gesetzt"); gleich(s.kampf.rucksack.hat(SC.B.NETZ), 1);
});
// Wildtiere (Aufgabe 4)
function tierWelt(){ var w = new SC.Welt(new SC.Planet({ id: "start", seed: 5 })), d = SC.Spielstand.neu({ name: "W", seedText: "w", modus: "survival" }); return { w: w, d: d, a: new SC.Auftauchen(w, d, SC.zufall(7)) }; }
function wild(w, artId, pos){ var d = SC.TIERE[artId]; return SC.Wesen.neu(w, "tier", { tierArt: artId, wild: true, pos: pos, heim: pos.slice(), breite: d.breite, hoehe: d.hoehe }); }
test("Wildtiere tauchen auf dem eigenen Planeten auf", function(){
  var t = tierWelt(), sp = { id: "a", pos: [100.5, 70, 100.5], blick: [0, 0], modus: "survival" };
  for(var i = 0; i < 60; i++) t.a.tiere(sp, 1);
  var n = 0, arten = SC.Tier.arten("start"); t.w.wesen.forEach(function(e){ if(e.art === "tier"){ n++; wahr(e.wild, "wild"); wahr(arten.indexOf(e.tierArt) >= 0, e.tierArt); } });
  wahr(n > 0, "mindestens ein Tier"); wahr(n <= SC.Wesen.GRENZE.tier, "Obergrenze");
});
test("Zuschauer bekommen keine Wildtiere", function(){ var t = tierWelt(); for(var i = 0; i < 60; i++) t.a.tiere({ id: "a", pos: [100.5, 70, 100.5], blick: [0, 0], modus: "zuschauer" }, 1); gleich(SC.Wesen.anzahl(t.w, "tier"), 0); });
test("Wildtiere verschwinden in der Ferne", function(){
  var t = tierWelt(), e = wild(t.w, "hase", [200.5, 90, 200.5]), nah = wild(t.w, "hund", [105.5, 90, 100.5]);
  t.a.tiere({ id: "a", pos: [100.5, 70, 100.5], blick: [0, 0], modus: "survival" }, 1);
  wahr(!t.w.wesen.has(e.id), "100 Blöcke weg: entfernt"); wahr(t.w.wesen.has(nah.id), "nah: bleibt");
});
test("Begleiter zählen nicht zur Obergrenze der Wildtiere", function(){
  var t = tierWelt(), n = 0; for(var i = 0; i < SC.Wesen.GRENZE.tier + 3; i++) if(wild(t.w, "hase", [10.5, 90, 10.5 + i])) n++;
  gleich(n, SC.Wesen.GRENZE.tier, "Wildtiere begrenzt"); wahr(SC.Wesen.neu(t.w, "tier", { tierArt: "hund", tierId: "x", besitzer: "a", pos: [1, 90, 1] }), "Begleiter geht immer");
});
test("Wildtier läuft nicht in Lava oder Wasser", function(){
  var t = tierWelt(), w = t.w;
  for(var x = 0; x < 20; x++) for(var z = 0; z < 20; z++){ w.setzeBlock(x, 89, z, SC.B.STEIN, "system"); for(var y = 90; y < 93; y++) w.setzeBlock(x, y, z, SC.B.LUFT, "system"); if(x >= 8) w.setzeBlock(x, 90, z, x < 14 ? SC.B.LAVA : SC.B.WASSER, "system"); }
  var e = wild(w, "katze", [6.5, 90, 10.5]), zf = SC.zufall(4);
  for(var i = 0; i < 600; i++){ SC.KI.tier(w, e, { spieler: [] }, 0.1, zf); var b = w.holeBlock(Math.floor(e.pos[0]), Math.floor(e.pos[1] + 0.1), Math.floor(e.pos[2])); wahr(b !== SC.B.LAVA && b !== SC.B.WASSER, "Schritt " + i + " in " + b); }
});
test("Wildtier streift umher und bleibt stehen, wenn es gefangen wird", function(){
  var t = tierWelt(), w = t.w; for(var x = 0; x < 20; x++) for(var z = 0; z < 20; z++){ w.setzeBlock(x, 89, z, SC.B.STEIN, "system"); for(var y = 90; y < 93; y++) w.setzeBlock(x, y, z, SC.B.LUFT, "system"); }
  var e = wild(w, "hase", [10.5, 90, 10.5]), zf = SC.zufall(2), start = e.pos.slice(), weg = 0;
  for(var i = 0; i < 300; i++){ SC.KI.tier(w, e, { spieler: [] }, 0.1, zf); weg = Math.max(weg, Math.hypot(e.pos[0] - start[0], e.pos[2] - start[2])); } wahr(weg > 1, "bewegt sich: " + weg);
  e.haeltStill = true; var p = e.pos.slice(); for(var j = 0; j < 50; j++) SC.KI.tier(w, e, { spieler: [] }, 0.1, zf); gleich(Math.hypot(e.pos[0] - p[0], e.pos[2] - p[2]) < 0.05, true, "steht still");
});
test("Wildtiere weichen einem nahen Spieler aus", function(){
  var t = tierWelt(), w = t.w; for(var x = 0; x < 20; x++) for(var z = 0; z < 20; z++){ w.setzeBlock(x, 89, z, SC.B.STEIN, "system"); for(var y = 90; y < 93; y++) w.setzeBlock(x, y, z, SC.B.LUFT, "system"); }
  var e = wild(w, "hase", [10.5, 90, 10.5]), zf = SC.zufall(2), sp = { pos: [9.5, 90, 10.5] }, d0 = 1;
  for(var i = 0; i < 10; i++) SC.KI.tier(w, e, { spieler: [sp] }, 0.1, zf);
  wahr(Math.hypot(e.pos[0] - sp.pos[0], e.pos[2] - sp.pos[2]) > 2, "Abstand wächst");
});
test("Hieb und Schuss des Spielers gehen durch Tiere", function(){
  var k = kampf(), w = k.welt; SC.Wesen.neu(w, "tier", { tierArt: "hund", tierId: "x", besitzer: "a", wild: false, pos: [4.5, 61, 2.5], breite: 0.5, hoehe: 0.7 }); wild(w, "hase", [4.5, 61, 2.4]);
  k.spieler.blick = [0, 0]; gleich(k.hiebZiele({ reichweite: 3 }).length, 0, "Hieb");
  var g = { pos: [4.5, 61.3, 8], richtung: [0, 0, -1], tempo: 30, team: "spieler", lebensdauer: 5 }, r = SC.Geschoss.schritt(w, g, 0.2, null);
  wahr(!r || r.treffer !== "wesen", "Schuss"); wahr(g.pos[2] < 2.4, "Schuss flog hindurch: " + g.pos[2]);
});
// Darstellung (Aufgabe 5)
function tierEnt(id, art, extra){ var e = { id: id, art: "tier", tierArt: art, pos: [10, 60, 10], geschw: [0, 0, 0], blick: 0, breite: 0.5, hoehe: 0.7 }; for(var k in extra) e[k] = extra[k]; return e; }
test("Tiermodell wird gebaut, beschriftet und entfernt", function(){
  var rw = new SC.RenderWesen(new THREE.Scene(), { groesse: 2048 }), welt = { wesen: new Map() };
  welt.wesen.set(1, tierEnt(1, "hund", { besitzer: "a", name: "Bello", stufe: 3, lp: 40, lpMax: 50, halsband: "#ff0000" })); welt.wesen.set(2, tierEnt(2, "hase", { wild: true }));
  rw.bild(welt, [10, 60, 10], 0.016, 1, 1000);
  var o = rw.objekte.get(1), w2 = rw.objekte.get(2); wahr(o && w2, "Objekte");
  wahr(o.schild.visible, "Haustier hat Schild"); wahr(!w2.schild.visible, "Wildtier ohne Schild");
  gleich(o.g.children.length, SC.TIERE.hund.modell.length + 2, "Teile + Halsband + Schild"); gleich(w2.g.children.length, SC.TIERE.hase.modell.length + 1, "Teile + Schild");
  welt.wesen.delete(1); rw.bild(welt, [10, 60, 10], 0.016, 1, 1100); wahr(!rw.objekte.has(1), "entfernt"); wahr(rw.objekte.has(2));
});
test("Jede Tierart lässt sich zeichnen, laufen und Chamäleon wechselt die Farbe", function(){
  var rw = new SC.RenderWesen(new THREE.Scene(), { groesse: 2048 }), welt = { wesen: new Map() }, i = 0;
  Object.keys(SC.TIERE).forEach(function(a){ i++; welt.wesen.set(i, tierEnt(i, a, { geschw: [2, 0, 0], besitzer: "a", name: "X", stufe: 1, lp: 10, lpMax: 10 })); });
  rw.bild(welt, [10, 60, 10], 0.016, 1, 1000); gleich(rw.objekte.size, 15);
  var ch = rw.objekte.get(Object.keys(SC.TIERE).indexOf("chamaeleon") + 1), r = ch.teile.filter(function(t){ return t.teil === "rumpf"; })[0], c1 = r.mesh.material.color.getHex();
  rw.bild(welt, [10, 60, 10], 0.016, 1, 3000); wahr(r.mesh.material.color.getHex() !== c1, "Farbe wechselt");
});
// Fangen mit dem Zielring (Aufgabe 6)
function fangBisZone(f){ var n = 0; while(f.ring > (f.zone[0] + f.zone[1]) / 2 && n++ < 10000) f.schritt(0.01); }
test("Zielring: Druck in der grünen Zone trifft, sonst daneben", function(){
  var f = new SC.Fang(0); gleich(f.druecken(), "daneben", "sofort gedrückt"); gleich(f.fertig, "daneben");
  f = new SC.Fang(0); fangBisZone(f); gleich(f.druecken(), "gefangen"); gleich(f.fertig, "gefangen");
});
test("Zielring: selten braucht zwei, sehr selten drei Treffer, jede Runde schneller", function(){
  var f = new SC.Fang(1), v0 = f.tempo; gleich(f.noetig, 2); fangBisZone(f); gleich(f.druecken(), "treffer"); wahr(f.tempo > v0, "schneller"); gleich(f.ring, 1, "neue Runde"); fangBisZone(f); gleich(f.druecken(), "gefangen");
  f = new SC.Fang(2); gleich(f.noetig, 3); fangBisZone(f); f.druecken(); fangBisZone(f); gleich(f.druecken(), "treffer"); fangBisZone(f); gleich(f.druecken(), "gefangen");
});
test("Zielring: verpasst = daneben, danach läuft nichts mehr", function(){
  var f = new SC.Fang(0), r = "laeuft", n = 0; while(r === "laeuft" && n++ < 10000) r = f.schritt(0.01); gleich(r, "daneben"); gleich(f.druecken(), "daneben"); gleich(f.schritt(0.01), "daneben");
});
function fangSpiel(artId){
  var s = survSpiel(), w = s.welt; s.kampf.rucksack.plaetze[0] = { block: SC.B.NETZ, anzahl: 1 }; s.spieler.auswahl = 0; s.spieler.blick = [0, 0];
  s.render = { wesen: { funken: function(){}, zahl: function(){} } }; s._zf = SC.zufall(1); s.ui.fangRing = function(z){ s._ring = z; }; s._hinweise = []; s.ui.hinweis = function(t){ s._hinweise.push(t); };
  var d = SC.TIERE[artId || "hase"], e = SC.Wesen.neu(w, "tier", { tierArt: artId || "hase", wild: true, pos: [4.5, 90, 2.5], heim: [4.5, 90, 2.5], breite: d.breite, hoehe: d.hoehe }); return { s: s, e: e, w: w };
}
test("Fang legt das Tier in den Käfig, das Netz bleibt", function(){
  var t = fangSpiel("hase"), s = t.s; s._fangVersuch(); wahr(s._fang, "Fang läuft"); wahr(t.e.haeltStill, "Tier hält still"); wahr(t.e.fangVon, "gesperrt");
  fangBisZone(s._fang.fang); s._fangDruck = true; s._fangBild(0.01, false);
  gleich(s.kampf.kaefig.plaetze.filter(Boolean).length, 1, "im Käfig"); gleich(s.kampf.kaefig.plaetze[0].art, "hase"); wahr(!t.w.wesen.has(t.e.id), "Wesen weg"); gleich(s.kampf.rucksack.hat(SC.B.NETZ), 1, "Netz bleibt"); gleich(s._fang, null);
  wahr(s._hinweise.some(function(h){ return h.indexOf(s.kampf.kaefig.plaetze[0].name) >= 0 || h.indexOf("gefangen") >= 0; }), "Hinweis: " + s._hinweise.join("|"));
});
test("Daneben: Tier hoppelt weg, nichts geht verloren, neuer Versuch geht", function(){
  var t = fangSpiel("hase"), s = t.s; s._fangVersuch(); s._fangDruck = true; s._fangBild(0.01, false);
  gleich(s._fang, null, "Fang vorbei"); gleich(t.e.haeltStill, false); gleich(t.e.fangVon, null); wahr(t.w.wesen.has(t.e.id), "Tier noch da"); gleich(s.kampf.rucksack.hat(SC.B.NETZ), 1);
  t.e.pos = [4.5, 90, 2.5]; t.e.geschw = [0, 0, 0]; s._fangVersuch(); wahr(s._fang, "zweiter Versuch");
});
test("Käfig voll: kein Fang, Hinweis", function(){
  var t = fangSpiel(), s = t.s; for(var i = 0; i < 18; i++) s.kampf.kaefig.lege(tierNeu());
  s._fangVersuch(); gleich(s._fang || null, null); wahr(s._hinweise.indexOf(SC.T.kaefigVoll) >= 0, "Hinweis"); gleich(t.e.fangVon || null, null);
});
test("Gesperrtes Tier kann kein zweiter fangen; zu weit weg geht nicht", function(){
  var t = fangSpiel(), s = t.s; t.e.fangVon = "andere"; s._fangVersuch(); gleich(s._fang || null, null, "gesperrt");
  t.e.fangVon = null; t.e.pos = [4.5, 90, -20.5]; s._fangVersuch(); gleich(s._fang || null, null, "zu weit");
});
test("Fang bricht ab, wenn das Netz weg ist oder ein Menü aufgeht", function(){
  var t = fangSpiel(), s = t.s; s._fangVersuch(); s.spieler.auswahl = 1; s._fangBild(0.01, false); gleich(s._fang, null, "Netz nicht mehr in der Hand"); gleich(t.e.haeltStill, false); gleich(t.e.fangVon, null);
  s.spieler.auswahl = 0; s._fangVersuch(); wahr(s._fang); s._fangBild(0.01, true); gleich(s._fang, null, "Menü offen");
});
test("Eingaben beim Fangen: Bewegung gesperrt, Klick, Leertaste und A zählen als Druck", function(){
  var t = fangSpiel(), s = t.s; s._fangVersuch();
  ["abbauen", "springenNeu", "setzen"].forEach(function(k){ s._fangDruck = false; var e = { vor: true, links: true, springen: true, blickDx: 5, blickDy: 5, abbauen: false, springenNeu: false, setzen: false }; e[k] = true; s._fangEingabe(e); wahr(s._fangDruck, k + " zählt"); gleich(e.vor, false); gleich(e.springen, false); gleich(e.blickDx, 0); });
  s._fangDruck = false; var e2 = { vor: true }; s._fangEingabe(e2); gleich(s._fangDruck, false, "ohne Druck kein Druck");
  s._fang = null; var e3 = { vor: true }; s._fangEingabe(e3); gleich(e3.vor, true, "ohne Fang bleibt alles");
});
// Begleiter: rauslassen, folgen, Zustände (Aufgabe 7)
function tierBoden(w){ for(var x = -10; x < 40; x++) for(var z = -10; z < 40; z++){ w.setzeBlock(x, 89, z, SC.B.STEIN, "system"); for(var y = 90; y < 93; y++) w.setzeBlock(x, y, z, SC.B.LUFT, "system"); } }
function tierSpiel(){
  var s = survSpiel(); tierBoden(s.welt); s.spieler.pos = [4.5, 90, 4.5]; s.render = { wesen: { funken: function(){}, zahl: function(){}, risse: function(){} } }; s._zf = SC.zufall(1); s.tageszeit = 0.5; s.eingabe = {}; s.raum = null; s.all = null;
  s.auftauchen = { tiere: function(){}, schritt: function(){}, zerfallen: [] }; s._imFzOrig = s._imFahrzeug; s._fz = null; s._imFahrzeug = function(){ return s._fz; }; s._hinweise = []; s.ui.hinweis = function(t){ s._hinweise.push(t); };
  s.begleiter = function(){ var l = []; s.welt.wesen.forEach(function(e){ if(e.art === "tier" && e.besitzer) l.push(e); }); return l; };
  s.laufe = function(n, dt){ for(var i = 0; i < n; i++) s._tiere(dt || 0.1, false); };
  return s;
}
function tierDrin(s, art){ var t = tierNeu(art); s.kampf.kaefig.lege(t); return t; }
test("Rauslassen erzeugt ein folgendes Wesen, Zurückholen entfernt es", function(){
  var s = tierSpiel(), t = tierDrin(s, "hund"); gleich(s._tierRaus(t.id), "ok"); gleich(s.begleiter().length, 1); gleich(s.begleiter()[0].tierId, t.id); gleich(t.draussen, true);
  s.spieler.pos = [24.5, 90, 4.5]; s.laufe(80);
  var e = s.begleiter()[0]; wahr(Math.hypot(e.pos[0] - 24.5, e.pos[2] - 4.5) < 6, "folgt: " + e.pos);
  s._tierRein(t.id); gleich(s.begleiter().length, 0); gleich(t.draussen, false);
});
test("Draußen gewesene Tiere kommen nach dem Laden wieder heraus", function(){
  var s = tierSpiel(), t = tierDrin(s, "katze"); t.draussen = true; gleich(s.begleiter().length, 0); s.laufe(1); gleich(s.begleiter().length, 1); gleich(s.begleiter()[0].tierId, t.id);
  s.laufe(5); gleich(s.begleiter().length, 1, "nicht doppelt");
});
test("Im Fahrzeug warten die Tiere im Käfig, nach dem Aussteigen sind sie wieder da", function(){
  var s = tierSpiel(), t = tierDrin(s, "fuchs"); s._tierRaus(t.id); s.laufe(1); gleich(s.begleiter().length, 1);
  s._fz = { f: {}, sitz: 0 }; s.laufe(1); gleich(s.begleiter().length, 0, "im Fahrzeug"); gleich(t.draussen, true, "bleibt draußen-markiert");
  s._fz = null; s.laufe(1); gleich(s.begleiter().length, 1, "wieder da");
});
test("Zuschauer: Tiere warten im Käfig und kommen zurück", function(){
  var s = tierSpiel(), t = tierDrin(s, "hase"); s._tierRaus(t.id); s.laufe(1); s.spieler.modus = "zuschauer"; s.laufe(1); gleich(s.begleiter().length, 0); gleich(t.draussen, true);
  s.spieler.modus = "survival"; s.laufe(1); gleich(s.begleiter().length, 1);
});
test("Zu weit weg oder in Lava: neben den Besitzer, Leben unverändert", function(){
  var s = tierSpiel(), t = tierDrin(s, "hund"); s._tierRaus(t.id); s.laufe(1); var e = s.begleiter()[0], lp = e.lp;
  e.pos = [38.5, 90, 38.5]; s.laufe(2); wahr(Math.hypot(e.pos[0] - 4.5, e.pos[2] - 4.5) < 6, "von weit: " + e.pos);
  s.welt.setzeBlock(8, 90, 4, SC.B.LAVA, "system"); e.pos = [8.5, 90, 4.5]; s.laufe(2); wahr(s.welt.holeBlock(Math.floor(e.pos[0]), Math.floor(e.pos[1] + 0.1), Math.floor(e.pos[2])) !== SC.B.LAVA, "aus der Lava"); gleich(e.lp, lp, "kein Schaden");
});
test("Besiegt: die Tiere kommen zum Wiedereinstieg mit", function(){
  var s = tierSpiel(), t = tierDrin(s, "hund"); s._tierRaus(t.id); s.laufe(1); s.kampf.trifftSpieler(1e6, [0, 0, 1]); wahr(s.kampf.besiegt()); s.kampf.wiederbeleben([30.5, 90, 30.5]); s.spieler.pos = [30.5, 90, 30.5]; s.laufe(3);
  var e = s.begleiter()[0]; wahr(e && Math.hypot(e.pos[0] - 30.5, e.pos[2] - 30.5) < 6, "beim Wiedereinstieg");
});
test("Name, Stufe und Leben im Wesen folgen dem Käfigtier, Leben zurück in den Käfig", function(){
  var s = tierSpiel(), t = tierDrin(s, "hund"); s._tierRaus(t.id); s.laufe(1); var e = s.begleiter()[0];
  s.kampf.kaefig.umbenennen(t.id, "Max"); t.stufe = 4; s.laufe(1); gleich(e.name, "Max"); gleich(e.stufe, 4); gleich(e.lpMax, SC.Tier.werte(t).lpMax);
  e.lp = 7; s.laufe(1); gleich(t.lp, 7, "Käfigtier übernimmt das Leben");
});
test("Zeit vergeht für Stärkung der Käfigtiere, nicht bei offenem Menü", function(){
  var s = tierSpiel(), t = tierDrin(s, "hund"); SC.Tier.staerken(t, "streicheln"); s._tiere(10, true); gleich(t.staerke.rest, 120, "Menü offen: steht"); s._tiere(10, false); gleich(Math.round(t.staerke.rest), 110);
});
// Begleiter kämpfen, Gegner greifen sie an, K.o., Erfahrung (Aufgabe 8)
function gegnerNah(s, pos, lp){ var d = SC.GEGNER.krabbler; return SC.Wesen.neu(s.welt, "gegner", { gegnerArt: "krabbler", stufe: 1, pos: pos, heim: pos.slice(), lp: lp || 500, lpMax: lp || 500, breite: d.breite, hoehe: d.hoehe, bemerkt: true, vergessen: 6 }); }
function kampfSpiel(art){
  var s = tierSpiel(); s.auftauchen.gegnerBesiegt = function(){}; s.audio = { spiele: function(){} };
  var t = tierDrin(s, art); s._tierRaus(t.id); s.laufe(1); return { s: s, t: t, e: s.begleiter()[0] };
}
test("Begleiter (Nahkampf) greift einen bemerkten Gegner in der Nähe des Besitzers an", function(){
  var k = kampfSpiel("hund"), g = gegnerNah(k.s, [4.5, 90, -1.5]); k.s.laufe(60);
  wahr(g.lp < 500, "Gegner hat Schaden: " + g.lp);
});
test("Begleiter ignoriert Gegner, die den Besitzer nicht bemerkt haben, und ferne", function(){
  var k = kampfSpiel("hund"), g = gegnerNah(k.s, [4.5, 90, -1.5]); g.bemerkt = false; k.s.laufe(40); gleich(g.lp, 500, "nicht bemerkt");
  g.bemerkt = true; g.pos = [4.5, 90, -30.5]; k.s.laufe(40); gleich(g.lp, 500, "zu weit vom Besitzer");
});
test("Fernkämpfer schießt, der Schuss trifft nur Gegner und nie Mitspieler", function(){
  var k = kampfSpiel("frosch"), g = gegnerNah(k.s, [4.5, 90, -4.5]); var n = 0;
  for(var i = 0; i < 60; i++){ k.s.laufe(1); k.s.welt.wesen.forEach(function(e){ if(e.art === "geschoss" && e.tier){ n = Math.max(n, 1); wahr(e.team === "spieler", "Team"); } }); }
  wahr(n > 0, "Schuss gesehen");
  var sg = { id: 9, pos: [4.5, 90, 0.5], richtung: [0, 0, -1], tempo: 30, team: "spieler", tier: true, lebensdauer: 5, schaden: 5 }, r = SC.Geschoss.schritt(k.s.welt, sg, 0.2, [{ id: "mitspieler", pos: [4.5, 90, -1.5] }]);
  wahr(!r || r.treffer !== "spieler", "Tierschuss trifft keinen Mitspieler");
});
test("Begleiter besiegt den Gegner: Besitzer und Tier bekommen Erfahrung", function(){
  var k = kampfSpiel("hund"), g = gegnerNah(k.s, [4.5, 90, -1.5], 1); k.s.laufe(40);
  wahr(!k.s.welt.wesen.has(g.id), "Gegner besiegt"); wahr(k.t.erfahrung > 0 || k.t.stufe > 1, "Tier hat Erfahrung: " + k.t.erfahrung + "/" + k.t.stufe); wahr(k.s.kampf.werte.erfahrung > 0 || k.s.kampf.werte.stufe > 1, "Besitzer auch");
});
test("Gegner nehmen den Begleiter als Ziel, wenn er näher ist; Ablenker bevorzugt", function(){
  var k = kampfSpiel("hund"), s = k.s, g = gegnerNah(s, [4.5, 90, -8.5]); k.e.pos = [4.5, 90, -6.5];
  var basis = { pos: s.spieler.pos, sichtbar: true }, z = s._tierZielFuer(g, basis); wahr(z && z.tier === k.e && z.sichtbar, "Hund näher");
  k.e.pos = [4.5, 90, 3.5]; gleich(s._tierZielFuer(g, basis), null, "Spieler näher");
  var h = kampfSpiel("hase"), g2 = gegnerNah(h.s, [4.5, 90, 4.5 + 7]); h.e.pos = [4.5, 90, 4.5 + 6]; // Spieler 7 weg (näher als 8), Hase 1 weg: Hase näher ohnehin
  wahr(h.s._tierZielFuer(g2, { pos: h.s.spieler.pos, sichtbar: true }), "Hase wird gewählt");
});
test("Gegnerhieb und Gegnerschuss treffen den Begleiter; bei 0 Leben K.o. im Käfig", function(){
  var k = kampfSpiel("hund"), s = k.s, g = gegnerNah(s, [4.5, 90, -1.5]); k.e.pos = [4.5, 90, -0.5];
  var lp0 = k.e.lp; s._tierGetroffen(k.e, g, { art: "hieb", reichweite: 1.5, schaden: 5 }); wahr(k.e.lp < lp0, "Hieb trifft");
  var gs = { id: 99, pos: [4.5, 90.3, -6.5], richtung: [0, 0, 1], tempo: 30, team: "gegner", lebensdauer: 5, schaden: 5 }, r = SC.Geschoss.schritt(s.welt, gs, 0.3, null); wahr(r && r.treffer === "tier" && r.id === k.e.id, "Schuss trifft das Tier: " + JSON.stringify(r));
  s._tierTreffer(k.e, 1e6); gleich(s.begleiter().length, 0, "Wesen weg"); gleich(k.t.koRest, 60); gleich(k.t.draussen, false); gleich(k.t.lp, 0); gleich(s.kampf.kaefig.rauslassen(k.t.id), "ko");
  wahr(s._hinweise.some(function(h){ return h.indexOf(k.t.name) >= 0; }), "Hinweis mit Namen");
  SC.Tier.zeit(k.t, 60); gleich(s.kampf.kaefig.rauslassen(k.t.id), "ok", "nach 1 Minute wieder fit");
});
// Streicheln und Füttern (Aufgabe 9)
test("Streicheln überschreibt keine stärkere Fütterung", function(){
  var t = tierNeu(); gleich(SC.Tier.staerken(t, "fuettern"), true); gleich(SC.Tier.staerken(t, "streicheln"), false, "Fütterung bleibt"); gleich(t.staerke.art, "fuettern"); gleich(t.staerke.rest, 300);
  var u = tierNeu(); gleich(SC.Tier.staerken(u, "streicheln"), true); gleich(SC.Tier.staerken(u, "fuettern"), true); gleich(u.staerke.art, "fuettern");
});
test("Streicheln stärkt 120 s, Füttern verbraucht Futter und stärkt 300 s", function(){
  var k = kampfSpiel("hund"), s = k.s; k.e.pos = [4.5, 90, 2.5];
  gleich(s._tierBenutzen(), true); gleich(k.t.staerke.art, "streicheln"); gleich(k.t.staerke.rest, 120);
  s.kampf.rucksack.plaetze[0] = { block: SC.B.TIERFUTTER, anzahl: 2 }; s.spieler.auswahl = 0; k.t.lp = 1; k.e.lp = 1;
  gleich(s._tierBenutzen(), true); gleich(k.t.staerke.art, "fuettern"); gleich(k.t.staerke.rest, 300); gleich(s.kampf.rucksack.plaetze[0].anzahl, 1, "ein Futter verbraucht"); gleich(k.e.lp, SC.Tier.werte(k.t).lpMax, "geheilt (Wesen)");
  gleich(s._tierBenutzen(), true); gleich(s.kampf.rucksack.plaetze[0].anzahl, 1, "frisch gefüttert: kein Futter verschwenden");
  k.t.staerke.rest = 100; gleich(s._tierBenutzen(), true); gleich(s.kampf.rucksack.plaetze[0], null, "letztes Futter weg"); gleich(k.t.staerke.rest, 300, "verlängert");
  gleich(s._tierBenutzen(), true); gleich(k.t.staerke.art, "fuettern", "ohne Futter nur Streicheln, Fütterung bleibt");
});
test("Fremdes Tier, Wildtier oder weit entferntes: Benutzen tut nichts", function(){
  var k = kampfSpiel("hund"), s = k.s; k.e.pos = [4.5, 90, -30.5]; gleich(s._tierBenutzen(), false, "weit weg");
  k.e.pos = [4.5, 90, 2.5]; k.e.besitzer = "andere"; gleich(s._tierBenutzen(), false, "fremd"); gleich(k.t.staerke, null);
  k.e.besitzer = s.daten.spieler.figurId; k.e.pos = [4.5, 90, 20.5]; wild(s.welt, "hase", [4.5, 90, 2.5]); gleich(s._tierBenutzen(), false, "Wildtier"); gleich(k.t.staerke, null);
});
test("Rechtsklick auf das eigene Tier streichelt es, Blöcke setzt man dann nicht", function(){
  var k = kampfSpiel("hund"), s = k.s; k.e.pos = [4.5, 90, 2.5]; s.render.markiere = function(){}; s.render.wesen.risse = function(){}; s.render.blocke = function(){}; s.render.ausruestung = function(){}; s.render.hieb = function(){}; s.render.fps = 60; s.eingabe = { touchAktiv: false, gamepadAktiv: false };
  s.einstellungen = { fpsAnzeigen: false }; s.ui.hud = function(){}; s.ui.kampfHud = function(){}; s.ui.zeigeBesiegt = function(){}; s.kampf.rucksack.plaetze[0] = { block: SC.B.STEIN, anzahl: 5 }; s.spieler.auswahl = 0;
  var e = { ausweichen: false, setzenGehalten: false, abbauen: false, abbauenGehalten: false, setzen: true, vor: false, zurueck: false, links: false, rechts: false };
  s._survival(e, 0.05, false, 1000); gleich(k.t.staerke && k.t.staerke.art, "streicheln"); gleich(s.kampf.rucksack.plaetze[0].anzahl, 5, "kein Block gesetzt");
});
