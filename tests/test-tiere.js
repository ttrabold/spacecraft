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
