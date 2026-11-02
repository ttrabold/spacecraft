// Gegner-Vielfalt (#109–#112): je Planet fünf neue Arten
var GV = {
  start: ["funkenling", "flatterdroide", "schildwaechter", "spaeher", "reparaturdroide"],
  glutfrost: ["eisrutscher", "glutfunke", "schneewerfer", "frostgolem", "glutflatterer"],
  rankenmoor: ["moorirrlicht", "pilzling", "lianenwuerger", "moosmutter", "dornenbock"]
};
var GV_ALLE = GV.start.concat(GV.glutfrost, GV.rankenmoor);
var GV_VERHALTEN = ["fernkampf", "ausweicher", "spucker", "nahkampf", "kamikaze", "schweber", "ritter", "koloss"];
test("Gegner-Vielfalt: 15 neue Arten, vollständig beschrieben (#109)", function(){
  gleich(GV_ALLE.length, 15);
  GV_ALLE.forEach(function(n){
    var d = SC.GEGNER[n]; wahr(d, n + ": fehlt"); wahr(GV_VERHALTEN.indexOf(d.verhalten) >= 0, n + ": Verhalten " + d.verhalten); wahr(!d.boss, n + ": gewöhnlicher Gegner");
    [1, 10, 30].forEach(function(s){ wahr(d.lp(s) > 0 && d.schaden(s) > 0, n + ": Werte bei Stufe " + s); }); wahr(d.lp(10) > d.lp(1) && d.schaden(10) > d.schaden(1), n + ": steigen mit der Stufe");
    wahr(d.breite > 0 && d.hoehe > 0 && d.sicht > 0 && d.tempo >= 0, n + ": Maße"); wahr(d.beute && d.beute.chance > 0 && d.beute.chance <= 1, n + ": Beute");
    wahr(d.teile && d.teile.length > 0 && d.teile.every(function(t){ return SC.BLOECKE[t.block] && t.chance > 0 && t.menge[0] >= 1 && t.menge[1] >= t.menge[0]; }), n + ": Rohstoff-Teile");
    wahr(d.laut === null || ["droide", "krabbler", "spucker"].indexOf(d.laut) >= 0, n + ": Laut " + d.laut); wahr(SC.T.gegner[n] && SC.T.gegner[n].length > 3, n + ": Name");
    wahr(d.modell.length >= 4, n + ": mindestens vier Teile"); var farben = {}; var oben = 0;
    d.modell.forEach(function(t){ wahr(t.w > 0 && t.h > 0 && t.d > 0 && /^#[0-9a-f]{6}$/i.test(t.farbe), n + ": Teil " + t.teil); oben = Math.max(oben, t.y + t.h / 2); farben[t.farbe] = 1; });
    wahr(Object.keys(farben).length >= 3, n + ": mindestens drei Farben"); wahr(oben <= d.hoehe + 0.7 && oben >= d.hoehe * 0.6, n + ": Modell passt zur Hitbox (" + oben.toFixed(2) + " / " + d.hoehe + ")");
    wahr(d.modell.some(function(t){ return t.leuchtet; }) || /^(schildwaechter|spaeher|schneewerfer|frostgolem|eisrutscher|lianenwuerger|moosmutter|dornenbock)$/.test(n), n + ": Augen oder Glut leuchten");
  });
  gleich(Object.keys(SC.GEGNER).filter(function(n){ return GV_ALLE.indexOf(n) < 0 && !SC.GEGNER[n].boss; }).length, 8, "die acht alten gewöhnlichen Arten bleiben");
});
test("Gegner-Vielfalt: Bausteine sind vollständig eingestellt (#109)", function(){
  GV_ALLE.forEach(function(n){
    var d = SC.GEGNER[n], v = d.verhalten;
    if(v === "kamikaze") wahr(d.zuend && d.zuend.reichweite > 0 && d.zuend.zeit >= 0.5 && d.explosion && d.explosion.radius >= d.zuend.reichweite, n + ": Zündschnur und Explosion");
    if(v === "schweber") wahr(d.fliegt === true && d.schwebehoehe >= 2 && d.abstand && d.waffe, n + ": Schweber");
    if(v === "fernkampf" || v === "schweber") wahr(d.abstand && d.abstand[0] < d.abstand[1] && d.waffe && d.waffe.rate > 0 && d.waffe.tempo > 0 && /^#/.test(d.waffe.farbe), n + ": Fernkampf");
    if(v === "nahkampf") wahr(d.hieb && d.hieb.reichweite > 0 && d.hieb.rate > 0, n + ": Hieb");
    if(d.heilt) wahr(d.heilt.rate >= 2 && d.heilt.radius >= 5 && d.heilt.anteil > 0 && d.heilt.anteil <= 0.5, n + ": Heilen ist sinnvoll begrenzt");
    if(d.sturm) wahr(d.sturm.min < d.sturm.max && d.sturm.rate > d.sturm.dauer && d.sturm.dauer > 0, n + ": Ansturm");
    if(d.stampf) wahr(d.stampf.radius > 0 && d.stampf.rate > 1, n + ": Stampfen");
  });
  gleich(SC.GEGNER.schildwaechter.vorneFaktor < 0.5 && SC.GEGNER.schildwaechter.rueckenFaktor > 1, true, "Schild schützt vorn");
  gleich(SC.GEGNER.lianenwuerger.tempo, 0, "Lianenwürger steht fest"); wahr(SC.GEGNER.lianenwuerger.hieb.reichweite >= 3.5, "dafür lange Reichweite");
  wahr(SC.GEGNER.spaeher.abstand[0] >= 14 && SC.GEGNER.spaeher.sicht >= 30, "Späher schießt aus der Ferne");
  ["reparaturdroide", "moosmutter"].forEach(function(n){ wahr(SC.GEGNER[n].heilt, n + " heilt"); });
});
test("Gegner-Vielfalt: jeder Planet hat fünf neue Arten in seinen Ortslisten (#109)", function(){
  Object.keys(GV).forEach(function(pid){
    var t = SC.PLANETEN[pid].gegner, alle = {}; Object.keys(t).forEach(function(ort){ wahr(t[ort].length >= 2, pid + "/" + ort + ": mehrere Arten"); t[ort].forEach(function(a){ wahr(SC.GEGNER[a], pid + "/" + ort + ": " + a + " fehlt"); alle[a] = ort; }); });
    GV[pid].forEach(function(n){ wahr(alle[n], pid + ": " + n + " kommt in keiner Ortsliste vor"); var orte = SC.GEGNER[n].orte; Object.keys(t).forEach(function(ort){ if(t[ort].indexOf(n) >= 0) wahr(orte.indexOf(ort) >= 0, n + ": Ort " + ort + " nicht in orte"); }); orte.forEach(function(o){ wahr(t[o] && t[o].indexOf(n) >= 0, n + ": " + o + " steht in orte, aber nicht in der Liste von " + pid); }); });
    gleich(Object.keys(alle).filter(function(a){ return GV[pid].indexOf(a) >= 0; }).length, 5, pid + ": fünf neue");
    Object.keys(GV).forEach(function(q){ if(q !== pid) GV[q].forEach(function(n){ wahr(!alle[n], n + " gehört nicht nach " + pid); }); });
  });
});
test("Gegner-Vielfalt: Auftauchen nutzt die ganze Nachtliste (#109)", function(){
  Object.keys(GV).forEach(function(pid){
    var p = new SC.Planet({ id: pid, seed: 99, palette: pid }), w = new SC.Welt(p), d = SC.Spielstand.neu({ name: "A", seedText: "a", modus: "survival", schwierigkeit: "schwer" }); SC.Planeten.anlegen(d, pid); d.planeten[pid].seed = p.seed;
    var a = new SC.Auftauchen(w, d, SC.zufall(7)), sp = new SC.Spieler({ id: "s", pos: [1024.5, 90, 1024.5], modus: "survival" }), gesehen = {};
    for(var i = 0; i < 400; i++){ a.schritt(sp, 0.2, i); w.wesen.forEach(function(e){ if(e.art === "gegner" && e.nacht) gesehen[e.gegnerArt] = 1; }); w.wesen.forEach(function(e){ if(e.art === "gegner") SC.Wesen.entferne(w, e.id); }); }
    var erwartet = SC.PLANETEN[pid].gegner.nacht; gleich(Object.keys(gesehen).length, erwartet.length, pid + ": nachts alle " + erwartet.length + " Arten (" + Object.keys(gesehen).join() + ")");
  });
});
test("Gegner-Vielfalt: alle 15 laufen in der KI ohne Fehler und zeigen ihr Verhalten (#109)", function(){
  GV_ALLE.forEach(function(n){
    var w = boden(), d = SC.GEGNER[n], g = gegner(w, n, [10.5, 61, 10.5]), zf = SC.zufall(11), ziel = { pos: [10.5, 61, 22.5], sichtbar: true }, aktionen = {}, weg0 = g.pos[2];
    if(d.heilt){ var v = gegner(w, "krabbler", [12.5, 61, 10.5]); v.lpMax = v.lp; v.lp = 1; }
    for(var t = 0; t < 20; t += 0.1){ SC.KI.schritt(w, g, ziel, 0.1, zf, "normal").forEach(function(a){ aktionen[a.art] = (aktionen[a.art] || 0) + 1; }); if(g.entfernen) break; wahr(isFinite(g.pos[0]) && isFinite(g.pos[1]) && isFinite(g.pos[2]), n + ": Position endlich"); }
    if(d.verhalten === "kamikaze"){ gleich(aktionen.stampf, 1, n + ": explodiert genau einmal"); wahr(g.entfernen, n + ": danach weg"); }
    else if(d.verhalten === "schweber"){ wahr(aktionen.schuss > 3, n + ": schießt"); wahr(g.pos[1] > 62, n + ": schwebt"); gleich(g.aufBoden, false); }
    else if(d.verhalten === "fernkampf"){ wahr(aktionen.schuss > 0, n + ": schießt"); }
    else if(d.verhalten === "nahkampf" && d.tempo > 0){ wahr(Math.abs(g.pos[2] - weg0) > 4 || aktionen.hieb > 0, n + ": läuft los und schlägt zu"); }
    else if(n === "lianenwuerger"){ gleich(Math.round(g.pos[2]), Math.round(weg0), "bleibt stehen"); var nah = gegner(w, n, [30.5, 61, 30.5]), a2 = kiLauf(w, nah, { pos: [30.5, 61, 33.5], sichtbar: true }, 2, zf); wahr(a2.some(function(x){ return x.a.art === "hieb"; }), "schlägt aus 3 Blöcken zu"); }
    if(d.heilt) wahr(aktionen.heilung > 0, n + ": heilt");
  });
});
