// Zauberkugel (#124–#126): Tisch mit Kristallkugel, teleportiert zum Bett
test("Zauberkugel: Block mit Tisch und leuchtender Kugel (#124)", function(){
  gleich(SC.B.ZAUBERKUGEL, 70); var b = SC.BLOECKE[70]; wahr(b && b.name === "Zauberkugel", "Name"); wahr(b.fest && b.durchsichtig && b.zerstoerbar && b.inAuswahl, "fest, nicht deckend, abbaubar, im Kreativ wählbar"); wahr(b.leuchten >= 6 && b.lichtFarbe, "leuchtet violett");
  gleich(b.form.typ, "mehrteilig"); wahr(b.form.teile.length >= 6, "Platte, Beine, Kugel"); ["oben", "seite", "unten", "kugel"].forEach(function(s){ wahr(SC.Mesher.atlasNamen.indexOf(b.seiten[s]) >= 0, "Textur " + s); });
  wahr(b.form.teile.some(function(t){ return t.leuchtet; }), "Kugel glüht"); gleich(SC.Abbau.ergibt(70), 70); wahr(SC.Abbau.zeit(70) < 3);
  var w = leereWelt(); w.setzeBlock(5, 64, 5, 70, "system"); var g = SC.Mesher.chunk(w, 0, 0, SC.Licht.chunk(w, 0, 0)).form; wahr(g.indizes.length / 6 >= 30, "viele Flächen: " + g.indizes.length / 6);
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
// --- Zum Bett teleportieren (#125) ---
function zSpiel(o){
  var s = wiederSpiel(o); s.aussteigenAufrufe = 0; s.aussteigen = function(){ s.aussteigenAufrufe++; }; s._imFahrzeug = function(){ return s.imFz || null; };
  ["zauberkugelBenutzen", "_zumBett", "_zauberFrage", "_teleportiert", "_aufwachen", "_bettHier"].forEach(function(n){ if(SC.Spiel.prototype[n]) s[n] = SC.Spiel.prototype[n]; });
  s.hinweise.length = 0; return s;
}
function zBett(s){ s.welt.setzeBlock(20, 64, 20, SC.B.LUFT, "system"); s.daten.spieler.bett = { planet: "start", x: 9, y: 64, z: 8 }; }
test("Zauberkugel benutzen: ohne Bett kommt ein Hinweis (#125)", function(){
  var s = zSpiel(); s.zauberkugelBenutzen(); gleich(s.hinweise[0], SC.T.zauberOhneBett); gleich(s.log.length, 0, "keine Bewegung"); gleich(JSON.stringify(s.spieler.pos), JSON.stringify([4.5, 64, 4.5]));
});
test("Zauberkugel benutzen: Einzelspieler und Gastgeber stehen neben dem Bett, Gäste werden mitgeschickt (#125)", function(){
  var gesendet = []; var h = Object.create(SC.Gastgeber.prototype); h.spieler = [{ id: "g1", verbunden: true }]; h.teleport = function(p){ gesendet.push(p.slice()); };
  var s = zSpiel({ raum: h }); zBett(s); s.spieler.schlaeft = { kopf: { x: 9, y: 64, z: 8 }, t: 1, treffer0: 0 };
  return Promise.resolve(s.zauberkugelBenutzen()).then(function(){
    var p = s.spieler.pos; wahr(Math.abs(p[0] - 9.5) <= 2 && Math.abs(p[2] - 8.5) <= 2 && !(p[0] === 8.5 && p[2] === 8.5), "neben dem Bett: " + p); gleich(gesendet.length, 1, "Gäste bekommen die Stelle"); gleich(JSON.stringify(gesendet[0]), JSON.stringify(p)); gleich(s.hinweise[s.hinweise.length - 1], SC.T.zauberAngekommen);
    gleich(s.spieler.schlaeft, null, "ein Schläfer wird geweckt");
    var solo = zSpiel(); zBett(solo); return Promise.resolve(solo.zauberkugelBenutzen()).then(function(){ wahr(Math.abs(solo.spieler.pos[0] - 9.5) <= 2, "auch allein"); gleich(solo.log.length, 0, "kein Planetenwechsel auf demselben Planeten"); });
  });
});
test("Zauberkugel: Bett auf einem anderen Planeten, Wechsel samt Gästen zum Bett (#125)", function(){
  var s = zSpiel(); bettAufPlanet(s, "glutfrost", 500, 70, 500); s.daten.spieler.bett = { planet: "glutfrost", x: 500, y: 70, z: 500 };
  return Promise.resolve(s.zauberkugelBenutzen()).then(function(){ gleich(s.log.length, 1); gleich(s.log[0][0], "wechsel"); gleich(s.log[0][1], "glutfrost"); gleich(JSON.parse(s.log[0][2]).bett, true, "am Ziel zum Bett"); });
});
test("Zauberkugel: fehlendes Bett und Fahrzeug (#125)", function(){
  var s = zSpiel(); s.daten.spieler.bett = { planet: "start", x: 40, y: 64, z: 40 }; s.zauberkugelBenutzen(); gleich(s.hinweise[0], SC.T.bettFehlte, "Bett fehlt: Meldung"); gleich(s.daten.spieler.bett, null, "vergessen"); gleich(JSON.stringify(s.spieler.pos), JSON.stringify([4.5, 64, 4.5]), "bleibt stehen");
  var f = zSpiel(); zBett(f); f.imFz = { f: {}, sitz: 0 }; return Promise.resolve(f.zauberkugelBenutzen()).then(function(){ gleich(f.aussteigenAufrufe, 1, "erst aussteigen"); wahr(Math.abs(f.spieler.pos[0] - 9.5) <= 2); });
});
test("Gastgeber holt alle zu einer Stelle: planetWechsel mit Ziel und teleport-Nachricht (#125)", function(){
  var u, a;
  return mspRaum(1).then(function(x){ u = x; a = u.gs[0]; a.teleports = []; a.g.o.beiTeleport = function(p){ a.teleports.push(p); }; u.h.teleport([7.5, 64, 8.5]); u.h.teleport([1, 2]); u.h.teleport("x"); return raumLauf(u.netz); }).then(function(){
    gleich(a.teleports.length, 1, "nur die gültige Stelle"); gleich(JSON.stringify(a.teleports[0]), JSON.stringify([7.5, 64, 8.5]));
    a.g.o.beiNachricht = function(){}; u.h._verb[a.id].verb.sende({ t: "x" }); u.h.planetWechsel([30.5, 70, 30.5]); var e = u.h.spieler.filter(function(q){ return q.id === a.id; })[0]; gleich(JSON.stringify(e.pos), JSON.stringify([30.5, 70, 30.5]), "Gäste stehen am Ziel statt am Landepunkt");
    gleich(JSON.stringify(u.daten.mitspieler[a.id].pos), JSON.stringify([30.5, 70, 30.5])); return raumLauf(u.netz);
  });
});
test("Teleport kommt beim Mitspieler an: Fahrzeug, Schlaf und Raumflug (#125)", function(){
  var s = zSpiel(); s.imFz = { f: {}, sitz: 1 }; s.spieler.schlaeft = { kopf: { x: 9, y: 64, z: 8 }, t: 1, treffer0: 0 }; s.spieler.geschw = [3, 4, 5];
  s._teleportiert([12.5, 64, 12.5]); gleich(JSON.stringify(s.spieler.pos), JSON.stringify([12.5, 64, 12.5])); gleich(JSON.stringify(s.spieler.geschw), "[0,0,0]"); gleich(s.aussteigenAufrufe, 1); gleich(s.spieler.schlaeft, null); gleich(s.hinweise[s.hinweise.length - 1], SC.T.zauberAngekommen);
  var all = zSpiel(); all.all = { phase: "all" }; all._teleportiert([12.5, 64, 12.5]); gleich(JSON.stringify(all.spieler.pos), JSON.stringify([4.5, 64, 4.5]), "im All keine Teleportation");
});
test("Netzprotokoll mindestens 7 wegen der Zauberkugel (#125)", function(){ wahr(SC.NETZ_PROTOKOLL >= 7); });
// --- Gast fragt den Gastgeber (#126) ---
test("Gast benutzt die Zauberkugel: fragt den Gastgeber, mit Pause gegen Dauerklicken (#126)", function(){
  var fragen = 0, g = Object.create(SC.Gast.prototype); g.zauber = function(){ fragen++; }; var s = zSpiel({ rolle: "gast", raum: g }), jetzt = 1000; s._jetzt = function(){ return jetzt; };
  s.zauberkugelBenutzen(); gleich(fragen, 1); gleich(s.hinweise[0], SC.T.zauberWartet); jetzt += 3000; s.zauberkugelBenutzen(); gleich(fragen, 1, "nicht noch einmal"); gleich(s.hinweise[1], SC.T.zauberPause);
  jetzt += 8000; s.zauberkugelBenutzen(); gleich(fragen, 2, "nach der Pause wieder"); gleich(JSON.stringify(s.spieler.pos), JSON.stringify([4.5, 64, 4.5]), "Gast bewegt sich nicht selbst");
});
test("Anfrage des Gastes über das Netz: Antwort Ja, Nein und doppelte Anfrage (#126)", function(){
  var u, a, offen = [], antworten = [];
  return mspRaum(1).then(function(x){ u = x; a = u.gs[0]; u.h.o.beiZauber = function(info, antwort){ offen.push({ info: info, antwort: antwort }); }; a.g.o.beiZauberAntwort = function(n){ antworten.push(n); };
    a.g.zauber(); a.g.zauber(); return raumLauf(u.netz);
  }).then(function(){
    gleich(offen.length, 1, "nur eine offene Frage je Gast"); gleich(offen[0].info.id, a.id); wahr(offen[0].info.name); gleich(antworten.length, 1, "zweite Anfrage sofort beantwortet"); gleich(antworten[0].ja, false); gleich(antworten[0].grund, "warte");
    offen[0].antwort(true); return raumLauf(u.netz);
  }).then(function(){
    gleich(antworten.length, 2); gleich(antworten[1].ja, true); a.g.zauber(); return raumLauf(u.netz);
  }).then(function(){ gleich(offen.length, 2, "neue Frage nach der Antwort"); offen[1].antwort(false, "nein"); return raumLauf(u.netz); }).then(function(){ gleich(antworten[2].ja, false); gleich(antworten[2].grund, "nein"); });
});
test("Gastgeber beantwortet die Frage: ohne Bett sofort Nein, sonst Dialog und Teleport (#126)", function(){
  var s = zSpiel(), erg = []; s.ui.zeigeAnfrage = function(name, antwort, id, vorlage){ s.dialog = { name: name, antwort: antwort, id: id, vorlage: vorlage }; }; s.eingabe = { gebeMausFrei: function(){} }; var teleports = 0; s._zumBett = function(){ teleports++; return Promise.resolve(); };
  s._zauberFrage({ id: "g1", name: "Mia" }, function(ja, grund){ erg.push([ja, grund]); }); gleich(JSON.stringify(erg), JSON.stringify([[false, "bett"]]), "ohne Bett sofort Nein"); gleich(s.dialog, undefined, "kein Dialog");
  zBett(s); s._zauberFrage({ id: "g1", name: "Mia" }, function(ja, grund){ erg.push([ja, grund]); }); wahr(s.dialog, "Dialog"); gleich(s.dialog.name, "Mia"); gleich(s.dialog.vorlage, SC.T.zauberFrage); wahr(s.dialog.vorlage.indexOf("{name}") >= 0); gleich(erg.length, 1, "noch keine Antwort");
  s.dialog.antwort(false); gleich(JSON.stringify(erg[1]), JSON.stringify([false, "nein"])); gleich(teleports, 0, "Nein: nichts passiert");
  s._zauberFrage({ id: "g1", name: "Mia" }, function(ja, grund){ erg.push([ja, grund]); }); s.dialog.antwort(true); gleich(teleports, 1, "Ja: alle zum Bett"); gleich(JSON.stringify(erg[2]), JSON.stringify([true, undefined]));
});
test("Anfrage-Dialog mit eigenem Text (#126)", function(){
  var w = document.createElement("div"), ui = ui2(w), antw = null; ui.zeigeAnfrage("Mia", function(ja){ antw = ja; }, "zauber:g1", SC.T.zauberFrage); wahr(w.textContent.indexOf("Mia") >= 0 && w.textContent.indexOf("Bett") >= 0, "Text mit Namen"); w.querySelector('[data-aktion="ja"]').click(); gleich(antw, true);
  var w2 = document.createElement("div"), u2 = ui2(w2); u2.zeigeAnfrage("Ben", function(){}, "x"); wahr(w2.textContent.indexOf("Ben") >= 0 && w2.textContent.indexOf("Bett") < 0, "ohne Vorlage der Beitrittstext");
});
