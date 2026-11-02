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
