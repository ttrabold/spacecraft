// Crafting (Stufe 6a): Blöcke, Rezepte, Herstellung
var NEUE_BLOECKE = ["EISENERZ","TITAN","GLUTSTAHL","MOORSILBER","STERNENMETALL","KRISTALL_BLAU","KRISTALL_GRUEN","KRISTALL_ROT","KRISTALL_GELB","KRISTALL_VIOLETT","KRISTALL_WEISS","SCHALTKREIS","CHITIN","WERKBANK","FACKEL","ZAUN","LEITER_N","LEITER_S","LEITER_O","LEITER_W","TUER_X","TUER_Z","TUER_X_OFFEN","TUER_Z_OFFEN","TRUHE"];
test("Neue Blöcke haben feste IDs und Namen", function(){
  gleich(SC.B.EISENERZ,33); gleich(SC.B.STERNENMETALL,37); gleich(SC.B.KRISTALL_WEISS,43); gleich(SC.B.TRUHE,57); gleich(SC.B.WERKBANK,46);
  NEUE_BLOECKE.forEach(function(n){ var id=SC.B[n]; wahr(typeof id==="number",n+" fehlt"); var b=SC.BLOECKE[id]; wahr(b,n+": keine Definition"); wahr(b.name&&b.name!=="undefined",n+": Name"); ["oben","seite","unten"].forEach(function(s){ wahr(SC.Mesher.atlasNamen.indexOf(b.seiten[s])>=0,n+": Textur "+b.seiten[s]); }); });
  ["EISENERZ","TITAN","GLUTSTAHL","MOORSILBER","STERNENMETALL","KRISTALL_BLAU","KRISTALL_WEISS"].forEach(function(n){ var b=SC.BLOECKE[SC.B[n]]; wahr(b.fest&&b.zerstoerbar,n+": fest und abbaubar"); });
  ["KRISTALL_BLAU","KRISTALL_GRUEN","KRISTALL_ROT","KRISTALL_GELB","KRISTALL_VIOLETT","KRISTALL_WEISS"].forEach(function(n){ wahr(SC.BLOECKE[SC.B[n]].leuchten>0,n+" leuchtet"); });
  wahr(SC.BLOECKE[SC.B.LEITER_N].klettern===true&&SC.BLOECKE[SC.B.LEITER_W].klettern===true);
  wahr(SC.BLOECKE[SC.B.TUER_X].fest&&!SC.BLOECKE[SC.B.TUER_X_OFFEN].fest,"Tür zu fest, offen nicht");
  wahr(!SC.BLOECKE[SC.B.FACKEL].fest&&SC.BLOECKE[SC.B.ZAUN].fest);
  wahr(SC.Abbau.zeit(SC.B.TITAN)>SC.Abbau.zeit(SC.B.EISENERZ)&&SC.Abbau.zeit(SC.B.EISENERZ)>SC.Abbau.zeit(SC.B.STEIN),"Abbauzeit steigt mit der Seltenheit");
});
test("Abbau liefert Grund-Blöcke statt Varianten", function(){
  gleich(SC.Abbau.ergibt(SC.B.TUER_Z_OFFEN),SC.B.TUER_X); gleich(SC.Abbau.ergibt(SC.B.TUER_X_OFFEN),SC.B.TUER_X); gleich(SC.Abbau.ergibt(SC.B.TUER_Z),SC.B.TUER_X);
  gleich(SC.Abbau.ergibt(SC.B.LEITER_O),SC.B.LEITER_N); gleich(SC.Abbau.ergibt(SC.B.LEITER_W),SC.B.LEITER_N); gleich(SC.Abbau.ergibt(SC.B.KRISTALL_ROT),SC.B.KRISTALL_ROT);
});
test("Kristallfarben für Waffen", function(){ var k=SC.CRAFTING_KRISTALLE; gleich(Object.keys(k).join(),"blau,gruen,rot,gelb,violett,weiss"); gleich(k.blau.farbe,"#3fa0ff"); gleich(k.blau.block,SC.B.KRISTALL_BLAU); gleich(k.weiss.block,SC.B.KRISTALL_WEISS); });
function zaehleErze(planet, n){
  var g = new SC.Generator(planet), z = {}, tiefeMin = {};
  for(var cx = 0; cx < n; cx++) for(var cz = 0; cz < n; cz++){
    var c = g.chunk(cx * 7, cz * 7);
    for(var y = 0; y < 128; y++) for(var zz = 0; zz < 16; zz++) for(var x = 0; x < 16; x++){
      var id = c[SC.idx(x, y, zz)]; if(id < 33 || id > 43) continue;
      z[id] = (z[id] || 0) + 1; var t = g.hoehe(cx * 7 * 16 + x, cz * 7 * 16 + zz) - y; tiefeMin[id] = Math.min(tiefeMin[id] === undefined ? 1e9 : tiefeMin[id], t);
    }
  }
  return { z: z, tiefe: tiefeMin };
}
test("Erze und Kristalle: Startplanet ab Generator 3 (#96)", function(){
  var r = zaehleErze(new SC.Planet({ id: "start", seed: 5, generatorVersion: 3 }), 8);
  wahr(r.z[SC.B.EISENERZ] > 0, "Eisenerz"); wahr(r.z[SC.B.TITAN] > 0, "Titan"); wahr(r.z[SC.B.KRISTALL_BLAU] > 0 && r.z[SC.B.KRISTALL_GRUEN] > 0, "Blau und Grün");
  wahr(r.tiefe[SC.B.EISENERZ] >= 8, "Eisenerz erst ab 8 Blöcken Tiefe: " + r.tiefe[SC.B.EISENERZ]); wahr(r.tiefe[SC.B.TITAN] >= 24, "Titan erst ab 24: " + r.tiefe[SC.B.TITAN]);
  [SC.B.GLUTSTAHL, SC.B.MOORSILBER, SC.B.STERNENMETALL, SC.B.KRISTALL_ROT, SC.B.KRISTALL_VIOLETT, SC.B.KRISTALL_WEISS].forEach(function(id){ wahr(!r.z[id], "Startplanet ohne " + SC.BLOECKE[id].name); });
});
test("Erze: Welten mit Generator 2 bekommen keine neuen Blöcke (#96)", function(){
  var r = zaehleErze(new SC.Planet({ id: "start", seed: 5, generatorVersion: 2 }), 6); gleich(Object.keys(r.z).length, 0);
  var f = zaehleErze(new SC.Planet({ id: "glutfrost", seed: 5, palette: "glutfrost", generatorVersion: 2 }), 4); gleich(Object.keys(f.z).length, 0);
});
test("Erze: Glutfrost und Rankenmoor haben eigene Metalle und Kristalle (#96)", function(){
  var g = zaehleErze(new SC.Planet({ id: "glutfrost", seed: 9, palette: "glutfrost", generatorVersion: 3 }), 8);
  wahr(g.z[SC.B.GLUTSTAHL] > 0 && g.z[SC.B.KRISTALL_ROT] > 0, "Glutfrost: Glutstahl und roter Kristall"); wahr(!g.z[SC.B.MOORSILBER] && !g.z[SC.B.KRISTALL_VIOLETT], "Glutfrost ohne Moor-Funde");
  var m = zaehleErze(new SC.Planet({ id: "rankenmoor", seed: 9, palette: "rankenmoor", generatorVersion: 3 }), 8);
  wahr(m.z[SC.B.MOORSILBER] > 0 && m.z[SC.B.KRISTALL_VIOLETT] > 0, "Rankenmoor: Moorsilber und violetter Kristall"); wahr(!m.z[SC.B.GLUTSTAHL] && !m.z[SC.B.KRISTALL_ROT], "Rankenmoor ohne Glut-Funde");
});
function wuerfleBeute(art, n, boss){
  var zf = SC.zufall(77), gegenstaende = 0, teile = {}, selt = [0,0,0,0,0], alle = 0;
  for(var i = 0; i < n; i++){
    var r = SC.Kampf.beuteFuer({ gegnerArt: art, stufe: 3, ort: boss ? "dungeon" : "station", boss: !!boss }, {}, zf);
    r.beute.forEach(function(b){ if(b.block !== undefined){ teile[b.block] = (teile[b.block] || 0) + b.anzahl; wahr(b.anzahl >= 1, "Anzahl"); } else { gegenstaende++; selt[b.seltenheit]++; } });
    if(r.beute.some(function(b){ return b.block === undefined; })) alle++;
  }
  return { gegenstaende: gegenstaende, anteil: alle / n, teile: teile, selt: selt };
}
test("Gegner lassen Rohstoffe fallen, Gegenstände seltener (#97)", function(){
  var r = wuerfleBeute("patrouillendroide", 3000);
  wahr(Math.abs(r.anteil - 0.35 * SC.CRAFTING_FUND.gegenstandChance) < 0.03, "Gegenstands-Anteil " + r.anteil); wahr(r.teile[SC.B.SCHALTKREIS] > 0, "Schaltkreise");
  var k = wuerfleBeute("krabbler", 1000); wahr(k.teile[SC.B.CHITIN] > 0, "Chitin vom Krabbler"); wahr(!k.teile[SC.B.SCHALTKREIS]);
  wahr(wuerfleBeute("lavagolem", 1000).teile[SC.B.GLUTSTAHL] > 0, "Glutstahl vom Lavagolem"); wahr(wuerfleBeute("sumpfspucker", 1000).teile[SC.B.MOORSILBER] > 0, "Moorsilber vom Sumpfspucker");
});
test("Bosse lassen Sternenmetall und manchmal Weißen Kristall fallen (#97)", function(){
  var r = wuerfleBeute("schattenritter", 400, true); wahr(r.teile[SC.B.STERNENMETALL] >= 400, "Sternenmetall jedes Mal"); wahr(r.teile[SC.B.KRISTALL_WEISS] > 40 && r.teile[SC.B.KRISTALL_WEISS] < 160, "Weiß ~25 %: " + r.teile[SC.B.KRISTALL_WEISS]);
  wahr(r.selt[3] + r.selt[4] > 0, "Bosse dürfen episch und legendär fallen lassen");
});
test("Gefundene Gegenstände sind ohne Boss höchstens selten (#97)", function(){
  var zf = SC.zufall(5), max = 0, bossMax = 0;
  for(var i = 0; i < 2000; i++){ max = Math.max(max, SC.Beute.erzeuge(zf, { stufe: 5, ort: "herrenhaus", bonus: 1 }).seltenheit); bossMax = Math.max(bossMax, SC.Beute.erzeuge(zf, { stufe: 5, boss: true, mindest: 2, bonus: 1 }).seltenheit); }
  wahr(max <= SC.CRAFTING_FUND.maxSeltenheit, "ohne Boss: " + max); gleich(bossMax, 4, "mit Boss bis legendär");
});
function rs(liste){ var r = new SC.Rucksack(); liste.forEach(function(x){ r.lege(x); }); return r; }
function vorrat(r, block){ return r.hat(block); }
test("Rucksack: entferne und passt über mehrere Stapel (#98)", function(){
  var r = rs([{ block: SC.B.STEIN, anzahl: 64 }, { block: SC.B.STEIN, anzahl: 10 }]);
  gleich(vorrat(r, SC.B.STEIN), 74); gleich(r.entferne(SC.B.STEIN, 70), 0); gleich(vorrat(r, SC.B.STEIN), 4); gleich(r.entferne(SC.B.STEIN, 9), 5, "Rest, der fehlt"); gleich(vorrat(r, SC.B.STEIN), 0);
  var leer = new SC.Rucksack(); wahr(leer.passt({ block: SC.B.STEIN, anzahl: 36 * 64 }) && !leer.passt({ block: SC.B.STEIN, anzahl: 36 * 64 + 1 }));
  var teil = rs([{ block: SC.B.STEIN, anzahl: 60 }]); wahr(teil.passt({ block: SC.B.STEIN, anzahl: 4 + 35 * 64 }) && !teil.passt({ block: SC.B.STEIN, anzahl: 5 + 35 * 64 }));
  wahr(leer.passt({ gegenstand: true })); for(var i = 0; i < 36; i++) leer.lege({ gegenstand: { id: "g" + i } }); wahr(!leer.passt({ gegenstand: true }) && !leer.passt({ block: SC.B.ERDE, anzahl: 1 }));
});
test("Rezepte: Werkbank aus Brettern und Stein, fehlende Rohstoffe werden gemeldet (#98)", function(){
  var r = rs([{ block: SC.B.BRETTER, anzahl: 10 }, { block: SC.B.STEIN, anzahl: 5 }]), rz = SC.REZEPTE.filter(function(x){ return x.id === "werkbank"; })[0];
  wahr(rz && rz.station === "hand"); gleich(SC.Crafting.baubar(r, rz).ok, true);
  var e = SC.Crafting.herstelle(r, rz, null, SC.zufall(1), 1); gleich(e.ok, true); gleich(vorrat(r, SC.B.WERKBANK), 1); gleich(vorrat(r, SC.B.BRETTER), 6); gleich(vorrat(r, SC.B.STEIN), 1);
  var arm = rs([{ block: SC.B.BRETTER, anzahl: 3 }]), b = SC.Crafting.baubar(arm, rz); gleich(b.ok, false); gleich(b.grund, "material");
  gleich(JSON.stringify(b.fehlt), JSON.stringify([{ block: SC.B.BRETTER, anzahl: 1 }, { block: SC.B.STEIN, anzahl: 4 }]));
});
test("Rezepte: voller Rucksack verbraucht nichts (#98)", function(){
  var r = rs([{ block: SC.B.BRETTER, anzahl: 10 }, { block: SC.B.STEIN, anzahl: 5 }]); for(var i = 0; i < 34; i++) r.lege({ gegenstand: { id: "g" + i } });
  var vor = JSON.stringify(r.alsDaten()), rz = SC.REZEPTE.filter(function(x){ return x.id === "werkbank"; })[0], e = SC.Crafting.herstelle(r, rz, null, SC.zufall(1), 1);
  gleich(e.ok, false); gleich(e.grund, "voll"); gleich(JSON.stringify(r.alsDaten()), vor, "Rucksack unverändert");
  var r2 = rs([{ block: SC.B.BRETTER, anzahl: 4 }, { block: SC.B.STEIN, anzahl: 4 }]); for(var j = 0; j < 34; j++) r2.lege({ gegenstand: { id: "h" + j } });
  gleich(SC.Crafting.herstelle(r2, rz, null, SC.zufall(1), 1).ok, true, "passt, weil die verbrauchten Stapel Platz machen");
});
test("Rezepte: Waffen aus Metall und Kristall mit Klingenfarbe (#98)", function(){
  var rz = SC.REZEPTE.filter(function(x){ return x.id === "laserschwert"; })[0], wahl = { metallStufe: 2, metallBlock: SC.B.TITAN, kristall: "blau" };
  var r = rs([{ block: SC.B.TITAN, anzahl: 6 }, { block: SC.B.KRISTALL_BLAU, anzahl: 2 }]); var e = SC.Crafting.herstelle(r, rz, wahl, SC.zufall(3), 5);
  gleich(e.ok, true); var g = e.ergebnis; gleich(g.art, "laserschwert"); gleich(g.seltenheit, 2); gleich(g.klinge, "#3fa0ff"); gleich(g.material, 2); gleich(g.stufe, 5);
  wahr(g.werte.schaden > SC.Beute.baue(SC.zufall(3), { art: "laserschwert", seltenheit: 0, stufe: 5 }).werte.schaden, "Titan stärker als Stein"); wahr(r.plaetze.some(function(s){ return s && s.gegenstand === g; }), "liegt im Rucksack");
  gleich(vorrat(r, SC.B.TITAN), 0); gleich(vorrat(r, SC.B.KRISTALL_BLAU), 0);
  var falsch = SC.Crafting.baubar(rs([{ block: SC.B.EISENERZ, anzahl: 6 }, { block: SC.B.KRISTALL_BLAU, anzahl: 2 }]), rz, { metallStufe: 2, metallBlock: SC.B.EISENERZ, kristall: "blau" }); gleich(falsch.ok, false); gleich(falsch.grund, "wahl");
  gleich(SC.Crafting.baubar(rs([]), rz, { metallStufe: 2, metallBlock: SC.B.TITAN, kristall: "pink" }).grund, "wahl", "unbekannter Kristall");
});
test("Rezepte: Rüstung, Schildgenerator braucht einen Schaltkreis, Kreativ ist gratis (#98)", function(){
  var helm = SC.REZEPTE.filter(function(x){ return x.id === "helm"; })[0], sg = SC.REZEPTE.filter(function(x){ return x.id === "schildgenerator"; })[0];
  var r = rs([{ block: SC.B.GLUTSTAHL, anzahl: 6 }]); var e = SC.Crafting.herstelle(r, sg, { metallStufe: 3, metallBlock: SC.B.GLUTSTAHL }, SC.zufall(2), 1); gleich(e.ok, false); gleich(e.grund, "material");
  r.lege({ block: SC.B.SCHALTKREIS, anzahl: 1 }); e = SC.Crafting.herstelle(r, sg, { metallStufe: 3, metallBlock: SC.B.GLUTSTAHL }, SC.zufall(2), 1); gleich(e.ok, true); gleich(e.ergebnis.art, "schildgenerator"); gleich(e.ergebnis.seltenheit, 3); wahr(e.ergebnis.werte.schild > 0);
  var leer = new SC.Rucksack(); e = SC.Crafting.herstelle(leer, helm, { metallStufe: 4, metallBlock: SC.B.STERNENMETALL }, SC.zufall(2), 1, { gratis: true }); gleich(e.ok, true); gleich(e.ergebnis.seltenheit, 4); gleich(e.ergebnis.klinge, undefined, "Rüstung hat keine Klinge");
});
test("Beute.baue: gleiches Format wie erzeuge, Seltenheit exakt (#98)", function(){
  var g = SC.Beute.baue(SC.zufall(9), { art: "blastergewehr", seltenheit: 4, stufe: 3, klinge: "#ff4a4a" }); gleich(g.seltenheit, 4); gleich(g.klinge, "#ff4a4a"); gleich(g.stufe, 3);
  ["id", "art", "stufe", "seltenheit", "werte", "sonder", "name"].forEach(function(k){ wahr(k in g, k); }); wahr(g.sonder, "legendär hat einen Sondereffekt");
  gleich(SC.Beute.baue(SC.zufall(9), { art: "helm", seltenheit: 0 }).stufe, 1);
});
function wb(o){ var w = document.createElement("div"), ui = ui2(w), k = k2(); return { w: w, ui: ui, k: k, o: Object.assign({ station: "werkbank", beiAenderung: function(){ wb.aend = (wb.aend || 0) + 1; } }, o || {}) }; }
test("Werkbank-Menü: eine Karte je Rezept, Handwerk nur die Hand-Rezepte (#99)", function(){
  var a = wb(); a.ui.zeigeWerkbank(a.k, a.o); gleich(a.w.querySelectorAll('[data-aktion="rezept"]').length, SC.REZEPTE.length);
  var h = wb({ station: "hand" }); h.ui.zeigeWerkbank(h.k, h.o); gleich(h.w.querySelectorAll('[data-aktion="rezept"]').length, SC.REZEPTE.filter(function(r){ return r.station === "hand"; }).length);
});
test("Werkbank-Menü: Herstellen nur mit Rohstoffen, Ergebnis im Rucksack (#99)", function(){
  var a = wb(); a.ui.zeigeWerkbank(a.k, a.o); a.w.querySelector('[data-aktion="rezept"][data-id="zaun"]').click();
  var knopf = a.w.querySelector('[data-aktion="herstellen"]'); wahr(knopf && knopf.disabled, "ohne Bretter gesperrt");
  a.k.rucksack.lege({ block: SC.B.BRETTER, anzahl: 6 }); a.ui.zeigeWerkbank(a.k, a.o); a.w.querySelector('[data-aktion="rezept"][data-id="zaun"]').click();
  knopf = a.w.querySelector('[data-aktion="herstellen"]'); wahr(!knopf.disabled, "mit Brettern frei"); wb.aend = 0; knopf.click();
  gleich(a.k.rucksack.hat(SC.B.ZAUN), 4); gleich(a.k.rucksack.hat(SC.B.BRETTER), 3); gleich(wb.aend, 1, "beiAenderung gerufen");
});
test("Werkbank-Menü: Waffe mit Metall und Kristall wählen (#99)", function(){
  var a = wb(); a.k.rucksack.lege({ block: SC.B.TITAN, anzahl: 6 }); a.k.rucksack.lege({ block: SC.B.KRISTALL_ROT, anzahl: 2 });
  a.ui.zeigeWerkbank(a.k, a.o); a.w.querySelector('[data-aktion="rezept"][data-id="laserschwert"]').click();
  gleich(a.w.querySelectorAll('[data-aktion="metall"]').length, 6); gleich(a.w.querySelectorAll('[data-aktion="kristall"]').length, 6);
  wahr(a.w.querySelector('[data-aktion="herstellen"]').disabled, "ohne Wahl gesperrt");
  a.w.querySelector('[data-aktion="metall"][data-id="2:' + SC.B.TITAN + '"]').click(); a.w.querySelector('[data-aktion="kristall"][data-id="rot"]').click();
  var knopf = a.w.querySelector('[data-aktion="herstellen"]'); wahr(!knopf.disabled); knopf.click();
  var g = null; a.k.rucksack.plaetze.forEach(function(s){ if(s && s.gegenstand) g = s.gegenstand; }); wahr(g, "Schwert im Rucksack"); gleich(g.klinge, "#ff4a4a"); gleich(g.seltenheit, 2);
});
test("Werkbank-Menü: voller Rucksack meldet Hinweis, nichts verbraucht (#99)", function(){
  var a = wb(); a.k.rucksack.lege({ block: SC.B.BRETTER, anzahl: 5 }); for(var i = 0; i < 35; i++) a.k.rucksack.lege({ gegenstand: { id: "x" + i } });
  a.ui.zeigeWerkbank(a.k, a.o); a.w.querySelector('[data-aktion="rezept"][data-id="zaun"]').click(); a.w.querySelector('[data-aktion="herstellen"]').click();
  gleich(a.k.rucksack.hat(SC.B.BRETTER), 5); gleich(a.k.rucksack.hat(SC.B.ZAUN), 0);
});
test("Rucksack hat einen Handwerk-Knopf, der die Hand-Rezepte öffnet (#99)", function(){
  var a = wb(); a.ui.zeigeRucksack(a.k, {}); var kn = a.w.querySelector('[data-aktion="handwerk"]'); wahr(kn, "Knopf"); kn.click();
  gleich(a.w.querySelectorAll('[data-aktion="rezept"]').length, 2); a.w.querySelector('[data-aktion="fertig"]').click(); wahr(a.w.querySelector(".rs-raster"), "zurück im Rucksack");
});
test("Werkbank-Block antippen öffnet das Menü (#99)", function(){
  var w = new SC.Welt(new SC.Planet({ id: "start", seed: 5 })), geoeffnet = null, frei = false; w.setzeBlock(3, 60, 3, SC.B.WERKBANK, "system");
  var fake = { welt: w, kampf: {}, _fahrzeugBauer: SC.Spiel.prototype._fahrzeugBauer, eingabe: { gebeMausFrei: function(){ frei = true; } }, ui: { zeigeWerkbank: function(k, o){ geoeffnet = o; } }, _weiter: function(){} };
  gleich(SC.Spiel.prototype.benutzeBlock.call(fake, { x: 3, y: 60, z: 3 }), true); wahr(geoeffnet && geoeffnet.station === "werkbank" && frei);
  geoeffnet = null; gleich(SC.Spiel.prototype.benutzeBlock.call(fake, { x: 3, y: 59, z: 3 }), false); gleich(geoeffnet, null);
});
test("Klingenfarbe: Kristall, sonst Seltenheit (#100)", function(){
  gleich(SC.Beute.klingenFarbe({ klinge: "#ff4a4a", seltenheit: 2 }), "#ff4a4a"); gleich(SC.Beute.klingenFarbe({ seltenheit: 0 }), "#bfe8ff"); gleich(SC.Beute.klingenFarbe({ seltenheit: 3 }), SC.SELTENHEIT[3].farbe);
  gleich(SC.RenderWesen.klingenFarbe(4), SC.SELTENHEIT[4].farbe, "alte Schreibweise bleibt");
  gleich(SC.Beute.strahlFarbe({ klinge: "#3fe06a", seltenheit: 1 }), "#3fe06a"); gleich(SC.Beute.strahlFarbe({ seltenheit: 1 }), SC.SELTENHEIT[1].farbe);
});
test("Gebauter Blaster schießt in Kristallfarbe, Mitspieler sehen sie (#100)", function(){
  var k = k2(), g = SC.Beute.baue(SC.zufall(4), { art: "blasterpistole", seltenheit: 1, klinge: "#ffe14a" }); k.ausruestung.waffe = g; k.rucksack.plaetze[0] = { gegenstand: g }; k.spieler.auswahl = 0; k.ruestungAnwenden();
  var a = k.angriff(1000, [0, 0, -1]); wahr(a && a.art === "schuss", "Schuss"); gleich(a.farbe, "#ffe14a");
  var sz = new THREE.Scene(), rm = new SC.RenderMitspieler(sz, { groesse: 2048 }); rm.aktualisiere([{ id: 1, name: "A", farbe: "#e0533a", pos: [10, 5, 10], blick: [0, 0], modus: "survival", ausr: { ruestung: null, waffe: g }, lebt: true }], [0, 0, 0], 0.1);
  var lauf = rm.figuren.get(1).f.waffe.lauf.material.color; var hx = lauf.getHexString(); wahr(parseInt(hx.slice(0, 2), 16) > 150 && parseInt(hx.slice(2, 4), 16) > 120 && parseInt(hx.slice(4, 6), 16) < 100, "Lauf gelblich: " + hx);
  var s = SC.Beute.baue(SC.zufall(4), { art: "laserschwert", seltenheit: 2, klinge: "#b46bff" }); rm.aktualisiere([{ id: 1, name: "A", farbe: "#e0533a", pos: [10, 5, 10], blick: [0, 0], modus: "survival", ausr: { ruestung: null, waffe: s }, lebt: true }], [0, 0, 0], 0.1);
  gleich("#" + rm.figuren.get(1).f.waffe.klinge.material.color.getHexString(), "#b46bff");
});
test("Waffenbild nutzt die Klingenfarbe (#100)", function(){ var a = SC.UI.gegenstandBild({ art: "laserschwert", seltenheit: 2 }), b = SC.UI.gegenstandBild({ art: "laserschwert", seltenheit: 2, klinge: "#ff4a4a" }), c = SC.UI.gegenstandBild({ art: "laserschwert", seltenheit: 2, klinge: "#ff4a4a" }); wahr(a !== b, "andere Farbe, anderes Bild"); gleich(b, c, "gleiches Bild aus dem Cache"); });
test("Rüstung: Werkbank-Menü, Stärke nach Metall (#101)", function(){
  var a = wb(); a.k.rucksack.lege({ block: SC.B.TITAN, anzahl: 5 }); a.k.rucksack.lege({ block: SC.B.STEIN, anzahl: 5 });
  a.ui.zeigeWerkbank(a.k, a.o); a.w.querySelector('[data-aktion="rezept"][data-id="helm"]').click(); gleich(a.w.querySelectorAll('[data-aktion="kristall"]').length, 0, "Rüstung braucht keinen Kristall");
  a.w.querySelector('[data-aktion="metall"][data-id="2:' + SC.B.TITAN + '"]').click(); a.w.querySelector('[data-aktion="herstellen"]').click();
  a.w.querySelector('[data-aktion="metall"][data-id="0:' + SC.B.STEIN + '"]').click(); a.w.querySelector('[data-aktion="herstellen"]').click();
  var helme = a.k.rucksack.plaetze.filter(function(s){ return s && s.gegenstand && s.gegenstand.art === "helm"; }).map(function(s){ return s.gegenstand; }).sort(function(x, y){ return x.seltenheit - y.seltenheit; });
  gleich(helme.length, 2); gleich(helme[0].seltenheit, 0); gleich(helme[1].seltenheit, 2); wahr(helme[1].werte.schutz > helme[0].werte.schutz, "Titan schützt mehr als Stein");
  gleich(helme[1].metall, SC.B.TITAN); gleich(helme[1].material, 2);
});
test("Rüstungsfarbe nach Metall, Glutstahl und Moorsilber unterscheidbar (#101)", function(){
  var farben = {}; [SC.B.STEIN, SC.B.EISENERZ, SC.B.TITAN, SC.B.GLUTSTAHL, SC.B.MOORSILBER, SC.B.STERNENMETALL].forEach(function(b){ farben[SC.Beute.stoffFarbe({ art: "helm", metall: b, seltenheit: 1 })] = 1; });
  gleich(Object.keys(farben).length, 6, "sechs verschiedene Farben"); gleich(SC.Beute.stoffFarbe({ art: "helm", seltenheit: 3 }), SC.SELTENHEIT[3].farbe, "gefundene Rüstung wie bisher");
  var sz = new THREE.Scene(), rm = new SC.RenderMitspieler(sz, { groesse: 2048 });
  function helmFarbe(g){ rm.aktualisiere([{ id: 1, name: "A", farbe: "#e0533a", pos: [10, 5, 10], blick: [0, 0], modus: "survival", ausr: { ruestung: { helm: g }, waffe: null }, lebt: true }], [0, 0, 0], 0.1); return rm.figuren.get(1).f.ruestung.helm[0].material.color.getHexString(); }
  var glut = helmFarbe({ art: "helm", metall: SC.B.GLUTSTAHL, seltenheit: 3, werte: {} }), moor = helmFarbe({ art: "helm", metall: SC.B.MOORSILBER, seltenheit: 3, werte: {} }); wahr(glut !== moor, "Glut und Moor im Spiel verschieden");
});
test("Entwicklerwerkzeuge: Rohstoffe geben (#105)", function(){
  var w = document.createElement("div"), sp = new SC.Spieler({ id: "a", pos: [1, 70, 1], modus: "survival" }), k = k2(),
    spiel = { tageszeit: 0.25, zeitTempo: 1, spieler: sp, kampf: k, welt: new SC.Welt(new SC.Planet({ id: "start", seed: 3 })), render: { fps: 60, chunks: new Map(), chunkGrenzen: false, sichtweite: 6 }, daten: { seed: "x" } },
    pn = new SC.Entwickler.Panel(w, spiel); pn.zeige(); var kn = w.querySelector('[data-ew="rohstoffe"]'); wahr(kn, "Knopf"); kn.click();
  [SC.B.EISENERZ, SC.B.STERNENMETALL, SC.B.KRISTALL_WEISS, SC.B.KRISTALL_ROT, SC.B.SCHALTKREIS, SC.B.CHITIN].forEach(function(id){ gleich(k.rucksack.hat(id), 16, SC.BLOECKE[id].name); });
  wahr(k.rucksack.hat(SC.B.STAMM) >= 32 && k.rucksack.hat(SC.B.STEIN) >= 32);
});
test("Anleitung erklärt Rohstoffe und Handwerk (#105)", function(){ var a = SC.T.anleitung.abschnitte.filter(function(x){ return x[0] === "Rohstoffe und Handwerk"; })[0]; wahr(a && a[1].length >= 6); wahr(a[1].join(" ").indexOf("Werkbank") >= 0 && a[1].join(" ").indexOf("Kristall") >= 0); });
test("Kreativ: Reiter Materialien legt Rohstoffe in den Rucksack (#99)", function(){
  var w = document.createElement("div"), ui = ui2(w), gewaehlt = [];
  wahr(SC.CRAFTING_MATERIALIEN.indexOf(SC.B.EISENERZ) >= 0 && SC.CRAFTING_MATERIALIEN.indexOf(SC.B.STERNENMETALL) >= 0 && SC.CRAFTING_MATERIALIEN.indexOf(SC.B.KRISTALL_WEISS) >= 0 && SC.CRAFTING_MATERIALIEN.indexOf(SC.B.SCHALTKREIS) >= 0 && SC.CRAFTING_MATERIALIEN.indexOf(SC.B.STAMM) >= 0, "Erze, Kristalle, Teile und Holz");
  ui.zeigeBlockauswahl(function(){}, { ausruestung: true, beiMaterial: function(id){ gewaehlt.push(id); } });
  var reiter = w.querySelector('[data-aktion="reiter"][data-id="material"]'); wahr(reiter, "Reiter Materialien"); reiter.click();
  wahr(!w.querySelector(".raster.mat").hidden && w.querySelector(".raster.bl").hidden && w.querySelector(".raster.ausr").hidden, "nur die Materialien sichtbar");
  gleich(w.querySelectorAll('[data-aktion="material"]').length, SC.CRAFTING_MATERIALIEN.length); w.querySelector('[data-aktion="material"][data-block="' + SC.B.TITAN + '"]').click(); gleich(gewaehlt.join(), String(SC.B.TITAN));
  w.querySelector('[data-aktion="reiter"][data-id="bloecke"]').click(); wahr(w.querySelector(".raster.mat").hidden && !w.querySelector(".raster.bl").hidden, "zurück zu den Blöcken");
  var w2 = document.createElement("div"); ui2(w2).zeigeBlockauswahl(function(){}, {}); gleich(w2.querySelector('[data-id="material"]'), null, "ohne Rückruf kein Reiter");
});
test("Kreativ: Werkbank und Truhe lassen sich antippen (#99)", function(){
  var w = new SC.Welt(new SC.Planet({ id: "start", seed: 5 })), offen = [];
  w.setzeBlock(3, 60, 3, SC.B.WERKBANK, "system"); w.setzeBlock(4, 60, 3, SC.B.TRUHE, "system");
  var fake = { welt: w, _fahrzeugBauer: SC.Spiel.prototype._fahrzeugBauer, daten: SC.Spielstand.neu({ name: "K", seedText: "k", modus: "kreativ" }), spieler: new SC.Spieler({ id: "a", pos: [3.5, 61, 6.5], modus: "kreativ" }), kampf: k2(), eingabe: { gebeMausFrei: function(){} }, _weiter: function(){},
    ui: { zeigeWerkbank: function(){ offen.push("werkbank"); }, zeigeTruhe: function(){ offen.push("truhe"); } }, truheOeffnen: SC.Spiel.prototype.truheOeffnen };
  gleich(SC.Spiel.prototype.benutzeBlock.call(fake, { x: 3, y: 60, z: 3 }), true); gleich(SC.Spiel.prototype.benutzeBlock.call(fake, { x: 4, y: 60, z: 3 }), true); gleich(offen.join(), "werkbank,truhe");
});
