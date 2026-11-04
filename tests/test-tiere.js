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
