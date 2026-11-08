// Wetter (Spec 2026-11-08-wetter-design.md)
function wtLauf(w, sek){ var e = []; for(var i = 0; i < sek; i++) w.schritt(1).forEach(function(x){ x.t = i; e.push(x); }); return e; }
test("Wetter: höchstens eine Phase je Spieltag, mindestens PAUSE klar", function(){
  var w = new SC.Wetter("rankenmoor", null, SC.zufall(3)), ev = wtLauf(w, 24 * 3600), beg = ev.filter(function(e){ return e.art === "beginn"; }), end = ev.filter(function(e){ return e.art === "ende"; });
  wahr(beg.length > 10 && beg.length <= 24 * 3600 / SC.WETTER.TAG + 1, "Phasen: " + beg.length);
  for(var i = 1; i < beg.length; i++){ wahr(beg[i].t - beg[i - 1].t >= SC.WETTER.TAG, "Abstand " + (beg[i].t - beg[i - 1].t)); wahr(beg[i].t - end[i - 1].t >= SC.WETTER.PAUSE, "Pause"); }
  end.forEach(function(e, j){ var d = e.t - beg[j].t; wahr(d >= SC.WETTER.DAUER[0] - 1 && d <= SC.WETTER.DAUER[1] + 1, "Dauer " + d); });
});
test("Wetter: Arten je Planet", function(){
  var erlaubt = { start: ["regen", "gewitter"], glutfrost: ["schnee", "schneesturm"], rankenmoor: ["regen", "nebel", "wolkenbruch"] };
  for(var p in erlaubt){ var w = new SC.Wetter(p, null, SC.zufall(9)), arten = {}; for(var i = 0; i < 24 * 3600 * 2; i++){ w.schritt(1); if(w.art) arten[w.art] = 1; }
    Object.keys(arten).forEach(function(a){ wahr(erlaubt[p].indexOf(a) >= 0, p + ": " + a); }); wahr(Object.keys(arten).length >= 2, p + " mehrere Arten"); }
});
test("Wetter: Unwetter etwa jede dritte Phase", function(){
  var w = new SC.Wetter("rankenmoor", null, SC.zufall(5)), n = 0, u = 0; w.schritt(0);
  for(var i = 0; i < 1200 * 800 && n < 300; i++) w.schritt(1).forEach(function(e){ if(e.art === "beginn") n++; if(e.art === "unwetter") u++; });
  wahr(n >= 300 && u / n > 0.2 && u / n < 0.45, "Anteil " + u + "/" + n);
});
test("Wetter: Ankündigung vor dem Beginn", function(){
  var w = new SC.Wetter("rankenmoor", null, SC.zufall(4)), ev = wtLauf(w, 3 * 3600), a = ev.filter(function(e){ return e.art === "ankuendigung"; }), b = ev.filter(function(e){ return e.art === "beginn"; });
  wahr(a.length && a.length === b.length, "je Beginn eine Ankündigung"); a.forEach(function(x, i){ gleich(b[i].t - x.t, SC.WETTER.ANKUENDIGUNG); wahr(x.wetter, "mit Art"); });
});
test("Wetter: Effekte klar = neutral, voll = Tabelle", function(){
  var w = new SC.Wetter("start", null, SC.zufall(1)), e = w.effekte();
  gleich(e.sicht, 1); gleich(e.dunkel, 1); gleich(e.wind.join(), "0,0"); gleich(e.gegnerTag, 0); gleich(e.niederschlag, null); gleich(e.tiere, 1);
  w.setze("gewitter", 200); e = w.effekte(); gleich(e.art, "gewitter"); gleich(e.staerke, 1); gleich(e.dunkel, SC.WETTER.ARTEN.gewitter.dunkel); gleich(e.gegnerTag, SC.WETTER.ARTEN.gewitter.gegnerTag); gleich(e.niederschlag, "regen");
  w.setze("schneesturm", 200); e = w.effekte(); wahr(Math.abs(Math.hypot(e.wind[0], e.wind[1]) - SC.WETTER.ARTEN.schneesturm.wind) < 1e-6, "Wind"); w.setze(null); gleich(w.effekte().art, null);
});
test("Wetter: speichern, laden und an Gäste geben", function(){
  var w = new SC.Wetter("glutfrost", null, SC.zufall(2)); wtLauf(w, 5000); w.setze("schnee", 250); w.schritt(10);
  var d = JSON.parse(JSON.stringify(w.alsDaten())), v = new SC.Wetter("glutfrost", d, SC.zufall(7)); gleich(v.art, "schnee"); gleich(v.rest, w.rest); gleich(v.bisNaechste, w.bisNaechste);
  var g = SC.Wetter.vonNetz(w.netz()); gleich(g.effekte().art, "schnee"); gleich(g.effekte().staerke, w.effekte().staerke); gleich(g.schritt(1).length, 0, "Gast rechnet nicht selbst");
});
test("Spielstand: alte Planeten bekommen wetter null und wetterSpuren []", function(){
  var d = SC.Spielstand.neu({ name: "W", seedText: "w" }); delete d.planeten.start.wetter; delete d.planeten.start.wetterSpuren;
  var m = SC.Spielstand.migriere(d).daten; gleich(m.planeten.start.wetter, null); gleich(JSON.stringify(m.planeten.start.wetterSpuren), "[]");
  gleich(JSON.stringify(SC.Spielstand.neu({ name: "N", seedText: "n" }).planeten.start.wetterSpuren), "[]");
});
test("Schneeschicht: flach, durchgehbar, Block setzen ersetzt sie", function(){
  var w = flWelt(); w.setzeBlock(5, 64, 5, SC.B.SCHNEESCHICHT, "system"); var g = flMesh(w).form; wahr(g.positionen.length > 0 && flMaxY(g) <= 64.13, "flach: " + flMaxY(g));
  gleich(SC.bewegeKoerper(w, [4.5, 64, 5.5], 0, 0.9, 0.6, 1.8), false, "man läuft hindurch");
  var s = new SC.Spieler({ id: "a", pos: [1.5, 64, 1.5], blick: [0, 0], modus: "survival" }); wahr(SC.kannSetzen(w, s, 5, 64, 5), "Block darauf setzen");
  var t = SC.zielen(w, [5.5, 66.5, 5.5], [0, -1, 0], 6); gleich([t.x, t.y, t.z].join(), "5,64,5", "anvisierbar"); gleich(SC.BLOECKE[SC.B.SCHNEESCHICHT].inAuswahl, true);
});
test("Schneeschicht: ein Schlag, ergibt nichts", function(){ wahr(SC.Abbau.zeit(SC.B.SCHNEESCHICHT) <= 0.2); gleich(SC.Abbau.ergibt(SC.B.SCHNEESCHICHT), null); });
test("Schneeschicht: abgelehnter Gast-Block kommt zurück", function(){ var rs = new SC.Rucksack(); SC.Raum.blockZurueck(rs, { id: SC.B.STEIN, alt: SC.B.SCHNEESCHICHT }, SC.B.SCHNEESCHICHT); gleich(rs.hat(SC.B.STEIN), 1); });
