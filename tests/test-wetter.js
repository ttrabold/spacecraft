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
// Boden: Welt mit Gelände auf Generatorhöhe in Chunk 0, eine Grube bei (8, 8)
function wbWelt(){
  var w = leereWelt(), g = w.generator, h = {};
  for(var x = 0; x < 16; x++) for(var z = 0; z < 16; z++){ var y = g.hoehe(x, z); h[x + "," + z] = y; w.setzeBlock(x, y, z, SC.B.GRAS, "system"); w.setzeBlock(x, y - 1, z, SC.B.ERDE, "system"); w.setzeBlock(x, y - 2, z, SC.B.ERDE, "system"); w.setzeBlock(x, y - 3, z, SC.B.STEIN, "system"); }
  var m = h["8,8"]; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function(d){ w.setzeBlock(8 + d[0], m + 1, 8 + d[1], SC.B.GRAS, "system"); });
  return { w: w, m: m, pd: { wetterSpuren: [] } };
}
function wbEff(o){ var e = { niederschlag: null, pfuetzen: 0, einsinken: false, schneeRate: 0, seitEnde: 0 }; for(var k in o) e[k] = o[k]; return e; }
function wbTakte(b, n, eff, orte, schutz){ for(var i = 0; i < n; i++) b.schritt(1, eff, orte || [[8.5, 0, 8.5]], schutz || []); }
test("Boden: Regen füllt nur natürliche Mulden", function(){
  var t = wbWelt(); gleich(SC.WetterBoden.mulde(t.w, 8, 8), t.m, "Grube ist eine Mulde"); var b = new SC.WetterBoden(t.w, t.pd, SC.zufall(1)); b.radius = 0; wbTakte(b, 20, wbEff({ niederschlag: "regen", pfuetzen: 60 }));
  gleich(t.w.holeBlock(8, t.m + 1, 8), SC.B.WASSER, "Grube gefüllt");
  var l = wbWelt(); l.w.setzeBlock(8, l.m, 8, SC.B.LUFT, "spieler"); var bl = new SC.WetterBoden(l.w, l.pd, SC.zufall(1)); bl.radius = 0; wbTakte(bl, 20, wbEff({ niederschlag: "regen", pfuetzen: 60 }));
  wahr(!SC.Fluessig.art(l.w.holeBlock(8, l.m, 8)) && !SC.Fluessig.art(l.w.holeBlock(8, l.m - 1, 8)), "gegrabenes Loch bleibt trocken");
  var s = wbWelt(); s.w.setzeBlock(8, s.m, 8, SC.B.STEIN, "spieler"); gleich(SC.WetterBoden.mulde(s.w, 8, 8), null, "Becken aus Stein");
  var p = wbWelt(), bp = new SC.WetterBoden(p.w, p.pd, SC.zufall(1)); bp.radius = 0; wbTakte(bp, 20, wbEff({ niederschlag: "regen", pfuetzen: 60 }), null, [[10, p.m, 10]]);
  gleich(p.w.holeBlock(8, p.m + 1, 8), SC.B.LUFT, "nicht neben dem Bett");
});
test("Boden: Unwetter senkt Boden unter Pfützen, höchstens 2", function(){
  var t = wbWelt(), b = new SC.WetterBoden(t.w, t.pd, SC.zufall(2)); b.radius = 0; wbTakte(b, 60, wbEff({ niederschlag: "regen", pfuetzen: 60, einsinken: true }));
  gleich(t.w.holeBlock(8, t.m, 8), SC.B.WASSER); gleich(t.w.holeBlock(8, t.m - 1, 8), SC.B.WASSER); gleich(t.w.holeBlock(8, t.m - 2, 8), SC.B.ERDE, "höchstens 2 tief");
});
function wbBild(w, m){ var a = []; for(var x = 0; x < 16; x++) for(var z = 0; z < 16; z++) for(var y = m - 6; y < m + 8; y++) a.push(w.holeBlock(x, y, z)); return a.join(","); }
test("Boden: nach dem Regen ist alles wie vorher, auch nach Speichern und Laden", function(){
  var t = wbWelt(), f = new SC.Fluss(t.w), vorher = wbBild(t.w, t.m), b = new SC.WetterBoden(t.w, t.pd, SC.zufall(3)); b.radius = 3;
  wbTakte(b, 120, wbEff({ niederschlag: "regen", pfuetzen: 60, einsinken: true })); f.bisRuhe(2000); wahr(t.pd.wetterSpuren.length > 0, "Spuren: " + t.pd.wetterSpuren.length);
  wbTakte(b, 30, wbEff({ seitEnde: 10 })); wahr(t.pd.wetterSpuren.length > 0, "trocknet erst nach TROCKNEN");
  var pd2 = JSON.parse(JSON.stringify(t.pd)), b2 = new SC.WetterBoden(t.w, pd2, SC.zufall(4)); t.pd = pd2;   // gespeichert und geladen
  for(var i = 0; i < 400 && pd2.wetterSpuren.length; i++){ wbTakte(b2, 1, wbEff({ seitEnde: SC.WETTER.TROCKNEN + i })); f.bisRuhe(200); }
  f.bisRuhe(2000); gleich(pd2.wetterSpuren.length, 0, "alle Spuren weg"); gleich(wbBild(t.w, t.m), vorher, "wie vorher");
});
test("Boden: Spieler baut an einer Spur, die Stelle bleibt", function(){
  var t = wbWelt(), b = new SC.WetterBoden(t.w, t.pd, SC.zufall(1)); b.radius = 0; wbTakte(b, 5, wbEff({ niederschlag: "regen", pfuetzen: 60 }));
  t.w.setzeBlock(8, t.m + 1, 8, SC.B.BRETTER, "spieler"); gleich(t.pd.wetterSpuren.length, 0); wbTakte(b, 10, wbEff({ seitEnde: 1000 })); gleich(t.w.holeBlock(8, t.m + 1, 8), SC.B.BRETTER);
});
test("Boden: Quelle, die das Fließen neben Regenwasser bildet, trocknet mit", function(){
  var t = wbWelt(), b = new SC.WetterBoden(t.w, t.pd, SC.zufall(1)); b.radius = 0; wbTakte(b, 5, wbEff({ niederschlag: "regen", pfuetzen: 60 }));
  t.w.setzeBlock(9, t.m + 1, 8, SC.B.LUFT, "system"); t.w.setzeBlock(9, t.m + 1, 8, SC.B.WASSER, "fluss"); wahr(t.pd.wetterSpuren.some(function(s){ return s[0] === 9 && s[1] === t.m + 1; }), "aufgenommen (gleiche Höhe wie das Regenwasser)");
  t.w.setzeBlock(3, t.m + 5, 3, SC.B.WASSER, "fluss"); wahr(!t.pd.wetterSpuren.some(function(s){ return s[0] === 3; }), "fern vom Regenwasser nicht");
});
test("Boden: Schneedecke unter freiem Himmel, eine Schicht, taut wieder", function(){
  var w = flWelt(); for(var x = 2; x <= 6; x++) for(var z = 2; z <= 6; z++) w.setzeBlock(x, 68, z, SC.B.STEIN, "spieler");   // Dach
  var pd = { wetterSpuren: [] }, b = new SC.WetterBoden(w, pd, SC.zufall(5)); b.radius = 7;
  wbTakte(b, 120, wbEff({ niederschlag: "schnee", schneeRate: 600 }), [[8.5, 64, 8.5]]);
  var auf = 0, unter = 0, doppelt = 0; for(var x2 = 0; x2 < 16; x2++) for(var z2 = 0; z2 < 16; z2++){ if(w.holeBlock(x2, 64, z2) === SC.B.SCHNEESCHICHT){ if(x2 >= 2 && x2 <= 6 && z2 >= 2 && z2 <= 6) unter++; else auf++; } if(w.holeBlock(x2, 65, z2) === SC.B.SCHNEESCHICHT) doppelt++; }
  wahr(auf > 20, "Schnee draußen: " + auf); gleich(unter, 0, "nicht unter dem Dach"); gleich(doppelt, 0, "eine Schicht"); wahr(w.holeBlock(4, 69, 4) === SC.B.SCHNEESCHICHT || w.holeBlock(3, 69, 3) === SC.B.SCHNEESCHICHT || w.holeBlock(5, 69, 5) === SC.B.SCHNEESCHICHT, "auch auf dem Dach");
  for(var i = 0; i < 400 && pd.wetterSpuren.length; i++) wbTakte(b, 1, wbEff({ seitEnde: 1000 }), [[8.5, 64, 8.5]]); gleich(pd.wetterSpuren.length, 0, "getaut");
  w.setzeBlock(9, 64, 9, SC.B.SCHNEESCHICHT, "wetter"); pd.wetterSpuren.push([9, 64, 9, SC.B.LUFT, SC.B.SCHNEESCHICHT]); b = new SC.WetterBoden(w, pd, SC.zufall(5));
  w.setzeBlock(10, 64, 9, SC.B.LAVA, "spieler"); gleich(w.holeBlock(9, 64, 9), SC.B.LUFT, "neben Lava sofort");
});
test("Boden: höchstens JE_TAKT Änderungen je Takt, lädt keine Chunks", function(){
  var w = flWelt(), pd = { wetterSpuren: [] }, b = new SC.WetterBoden(w, pd, SC.zufall(6)), n = 0; b.radius = 32; w.ereignisse.an("block", function(e){ if(e.quelle === "wetter") n++; });
  b.schritt(1, wbEff({ niederschlag: "schnee", schneeRate: 60000 }), [[14.5, 64, 8.5]], []); wahr(n > 0 && n <= SC.WetterBoden.JE_TAKT, "Änderungen: " + n); gleich(w.istGeladen(1, 0), false);
});
function rwEff(art){ var w = new SC.Wetter("start", null, SC.zufall(1)); w.setze(art, 200); return w.effekte(); }
test("Render-Wetter: Teilchenzahl je Einstellung, unter Dach keine", function(){
  var r = new SC.RenderWetter(new THREE.Scene()), e = rwEff("gewitter");
  r.bild(e, 0.05, [0, 70, 0], false, false); var an = r.anzahl; r.bild(e, 0.05, [0, 70, 0], false, true); var wenig = r.anzahl;
  wahr(an > wenig && wenig > 0 && wenig <= 300, "an " + an + ", weniger " + wenig); wahr(r.sichtbar, "sichtbar");
  r.bild(e, 0.05, [0, 70, 0], true, false); gleich(r.sichtbar, false, "unter Dach"); r.bild(rwEff(null), 0.05, [0, 70, 0], false, false); gleich(r.sichtbar, false, "klar");
  r.bild(rwEff("schnee"), 0.05, [0, 70, 0], false, false); wahr(r.sichtbar && r.art === "schnee", "Flocken");
});
test("Render: Sicht und Dunkelheit aus den Effekten", function(){
  var klar = SC.Render.wetterNebel(10, rwEff(null), false), sturm = SC.Render.wetterNebel(10, rwEff("gewitter"), false), dach = SC.Render.wetterNebel(10, rwEff("gewitter"), true);
  gleich(klar.join(), [88, 152].join()); wahr(sturm[1] < klar[1] && dach[1] > sturm[1] && dach[1] < klar[1], "Sturm < Dach < klar: " + [sturm[1], dach[1], klar[1]]);
  gleich(SC.Render.wetterLicht(1, rwEff(null)), 1); wahr(Math.abs(SC.Render.wetterLicht(1, rwEff("gewitter")) - SC.WETTER.ARTEN.gewitter.dunkel) < 1e-6);
});
test("Einstellungen: wetterEffekte Standard an, alte Einstellungen ohne Feld", function(){
  gleich(SC.Einstellungen.standard().wetterEffekte, "an"); localStorage.setItem("sc-wtest:einstellungen", JSON.stringify({ musik: 0.2 })); gleich(SC.Einstellungen.lade("wtest").wetterEffekte, "an"); localStorage.removeItem("sc-wtest:einstellungen");
  wahr(SC.T.wetterEffekte && SC.T.wetterEffekteWeniger, "Texte");
});
test("Klang: Donner ist hörbar, fern leiser", function(){
  function laut(o){ var ctx = new OfflineAudioContext(1, 44100 * 2, 44100), z = ctx.createGain(); z.connect(ctx.destination); SC.Klang.erzeuge(ctx, z, "donner", o, 0.8);
    return ctx.startRendering().then(function(b){ var d = b.getChannelData(0), s = 0; for(var i = 0; i < d.length; i++) s += d[i] * d[i]; return Math.sqrt(s / d.length); }); }
  return Promise.all([laut({ entfernung: 10 }), laut({ entfernung: 200 })]).then(function(r){ wahr(r[0] > 0.005, "hörbar: " + r[0]); wahr(r[1] < r[0], "fern leiser"); });
});
test("Audio: wetter und donner ohne AudioContext werfen nicht", function(){ var a = Object.create(SC.Audio.prototype); a.ctx = null; a.wetter(1, 1); a.spiele("donner", { entfernung: 5 }); wahr(true); });
test("Audio: wetter regelt einen Dauerklang", function(){
  var ctx = new OfflineAudioContext(1, 44100, 44100), a = Object.create(SC.Audio.prototype); a.ctx = { state: "running", currentTime: 0, createGain: ctx.createGain.bind(ctx), createBiquadFilter: ctx.createBiquadFilter.bind(ctx), createBufferSource: ctx.createBufferSource.bind(ctx), createBuffer: ctx.createBuffer.bind(ctx), createOscillator: ctx.createOscillator.bind(ctx), sampleRate: 44100 };
  a.sfx = ctx.createGain(); a.sfxLaut = 1; a.wetter(1, 0.5); wahr(a._wetter && a._wetter.regen && a._wetter.wind, "Regen und Wind angelegt"); a.wetter(0, 0); wahr(a._wetter, "bleibt, blendet nur aus");
});
function auEff(art, planet){ var w = new SC.Wetter(planet || "start", null, SC.zufall(1)); w.setze(art, 200); return w.effekte(); }
test("Auftauchen: Gewitter tagsüber halb so viele Nachtgegner, bleiben bis Wetterende", function(){
  var u = umgebung("leicht"), s = new SC.Spieler({ id: "s", pos: [1024.5, 90, 1024.5], modus: "survival" }), eff = auEff("gewitter"), n = 0;
  for(var i = 0; i < 40; i++) u.a.schritt(s, 1, i, eff); u.w.wesen.forEach(function(e){ if(e.art === "gegner" && e.wetter) n++; });
  wahr(n > 0 && n <= Math.ceil(SC.SCHWIERIGKEIT.leicht.nachtMax * eff.gegnerTag), "Wetter-Gegner: " + n);
  for(var j = 0; j < 3; j++) u.a.schritt(s, 1, 50 + j, eff); var m = 0; u.w.wesen.forEach(function(e){ if(e.wetter) m++; }); gleich(m, n, "bleiben tagsüber, solange es gewittert");
  u.a.schritt(s, 1, 60, auEff(null)); var r = 0; u.w.wesen.forEach(function(e){ if(e.wetter) r++; }); gleich(r, 0, "nach dem Gewitter weg");
  var k = umgebung("leicht"), kr = new SC.Spieler({ id: "k", pos: [1024.5, 90, 1024.5], modus: "kreativ" }); for(var q = 0; q < 20; q++) k.a.schritt(kr, 1, q, eff); var kn = 0; k.w.wesen.forEach(function(e){ if(e.wetter) kn++; }); gleich(kn, 0, "Kreativ: keine");
  var f = umgebung("friedlich"); for(var q2 = 0; q2 < 20; q2++) f.a.schritt(s, 1, q2, eff); var fn = 0; f.w.wesen.forEach(function(e){ if(e.art === "gegner") fn++; }); gleich(fn, 0, "friedlich: keine");
});
test("Auftauchen: Schneesturm bevorzugt Frostgegner", function(){
  var liste = ["lavagolem", "frostkrabbler", "frostgolem", "eisrutscher", "glutflatterer"], zf = SC.zufall(8), ohne = 0, mit = 0, g = auEff("schneesturm", "glutfrost").gegnerArten;
  for(var i = 0; i < 2000; i++){ if(/frost|eis/.test(SC.Auftauchen.waehleArt(liste, {}, zf))) ohne++; if(/frost|eis/.test(SC.Auftauchen.waehleArt(liste, g, zf))) mit++; }
  wahr(mit > ohne * 1.3, "mit " + mit + ", ohne " + ohne);
});
test("Auftauchen: Regen weniger Wildtiere, mehr Frösche", function(){
  var arten = SC.Tier.arten("start"), klar = SC.Auftauchen.tierGewichte(arten, auEff(null)), regen = SC.Auftauchen.tierGewichte(arten, auEff("regen")), i = arten.indexOf("frosch"), h = arten.indexOf("hase");
  wahr(regen[i] / regen[h] > klar[i] / klar[h] * 2, "Frosch relativ häufiger"); gleich(SC.Auftauchen.tierGrenze(1, auEff("regen")), Math.floor(SC.Wesen.GRENZE.tier * SC.WETTER.ARTEN.regen.tiere));
});
test("Wind: schiebt, man kommt dagegen an, auf Eis begrenzt", function(){
  var w = flWelt(), s = new SC.Spieler({ id: "a", pos: [8.5, 64, 8.5], blick: [0, 0], modus: "survival" }); s.wind = [1.5, 0];
  for(var i = 0; i < 10; i++) s.schritt(w, flRuhe, 0.05); wahr(s.pos[0] > 8.8, "treibt: " + s.pos[0]);
  var g = new SC.Spieler({ id: "b", pos: [12.5, 64, 4.5], blick: [Math.PI / 2, 0], modus: "survival" }); g.wind = [5, 0]; for(var j = 0; j < 10; j++) g.schritt(w, Object.assign({}, flRuhe, { vor: true }), 0.05); wahr(g.pos[0] < 12.3, "gegen den Sturm: " + g.pos[0]);
  for(var x = 0; x < 16; x++) for(var z = 0; z < 16; z++) w.setzeBlock(x, 63, z, SC.B.EIS, "system"); var e = new SC.Spieler({ id: "c", pos: [8.5, 64, 12.5], blick: [0, 0], modus: "survival" }), max = 0; e.wind = [5, 0];
  for(var k = 0; k < 40; k++){ e.schritt(w, flRuhe, 0.05); max = Math.max(max, Math.abs(e.geschw[0])); } wahr(max <= 0.5 * SC.PHYSIK.laufen + 0.01, "begrenzt: " + max);
});
test("Blitz: trifft hohe Stelle, nie näher als 6 an Spieler oder Tier", function(){
  var w = fzWelt(), ort = [100.5, 60, 100.5], P = w.planet.groesse;
  for(var x = 101; x < 145; x++) for(var z = 55; z < 146; z++) w.setze(x, 70, z, SC.B.STEIN);   // östliche Hälfte hoch
  var z1 = SC.Wetter.blitzZiel(w, [ort], SC.zufall(3)); wahr(z1 && z1[1] === 70, "hohe Stelle: " + z1);
  for(var a = 0; a < 40; a++) w.wesen.set(a, { id: a, art: "tier", pos: [80 + (a % 8) * 8 + 0.5, 60, 70 + Math.floor(a / 8) * 12 + 0.5] });
  for(var s = 0; s < 60; s++){ var z2 = SC.Wetter.blitzZiel(w, [ort], SC.zufall(s)); if(!z2) continue; [ort].concat(Array.from(w.wesen.values()).map(function(e){ return e.pos; })).forEach(function(p){ wahr(Math.hypot(z2[0] + 0.5 - p[0], z2[2] + 0.5 - p[2]) >= 6, "Abstand"); }); }
});
test("Blitz: manchmal weißer Kristall, nichts zerstört", function(){
  var zf = SC.zufall(4), n = 0; for(var i = 0; i < 1000; i++){ var b = SC.Wetter.blitzBeute(zf); if(b.length){ n++; gleich(b[0].block, SC.B.KRISTALL_WEISS); } }
  wahr(n > 120 && n < 280, "Anteil " + n);
});
