function boden(){ var w=new SC.Welt(new SC.Planet({id:"start",seed:5})); for(var x=0;x<32;x++)for(var z=0;z<32;z++)for(var y=1;y<128;y++) w.setzeBlock(x,y,z,y<=60?SC.B.STEIN:SC.B.LUFT,"system"); return w; }
function gegner(w,art,pos){ return SC.Wesen.neu(w,"gegner",{gegnerArt:art,stufe:3,pos:pos,heim:pos.slice(),lp:SC.GEGNER[art].lp(3),breite:SC.GEGNER[art].breite,hoehe:SC.GEGNER[art].hoehe}); }
test("Tabelle hat sechs Arten mit Modell", function(){ ["patrouillendroide","weltraumbandit","krabbler","spucker","schattenritter","panzerkoloss"].forEach(function(a){ wahr(SC.GEGNER[a]&&SC.GEGNER[a].modell.length>0,a); wahr(SC.T.gegner[a],a+" Name"); }); });
test("Sichtlinie durch Wand blockiert", function(){ var w=boden(); wahr(SC.KI.sieht(w,[4,62,4],[4,62,14],24)); for(var x=0;x<8;x++) for(var y=61;y<65;y++) w.setzeBlock(x,y,9,SC.B.STEIN,"system"); wahr(!SC.KI.sieht(w,[4,62,4],[4,62,14],24)); wahr(!SC.KI.sieht(boden(),[4,62,4],[4,62,30],10),"zu weit"); });
test("Droide schießt, wenn er den Spieler sieht", function(){ var w=boden(),g=gegner(w,"patrouillendroide",[16.5,61,6.5]),zf=SC.zufall(1),schuss=false; for(var i=0;i<60;i++) SC.KI.schritt(w,g,{pos:[16.5,61,18.5],sichtbar:true},1/10,zf,"normal").forEach(function(a){ if(a.art==="schuss") schuss=true; }); wahr(schuss); wahr(g.bemerkt); });
test("Krabbler läuft zum Spieler und haut zu", function(){ var w=boden(),g=gegner(w,"krabbler",[8,61,8]),zf=SC.zufall(2),d0=Math.hypot(10,10),hieb=false; for(var i=0;i<60;i++) SC.KI.schritt(w,g,{pos:[18,61,18],sichtbar:true},1/10,zf,"normal").forEach(function(a){ if(a.art==="hieb") hieb=true; }); wahr(Math.hypot(18-g.pos[0],18-g.pos[2])<d0-5); wahr(hieb); });
test("Gegner bleibt an der Leine", function(){ var w=boden(),g=gegner(w,"weltraumbandit",[4.5,61,4.5]),zf=SC.zufall(3); for(var i=0;i<400;i++) SC.KI.schritt(w,g,{pos:[60,61,60],sichtbar:true},1/10,zf,"normal"); wahr(Math.hypot(g.pos[0]-4.5,g.pos[2]-4.5)<=31); });
test("ohne Ziel bleibt der Gegner ruhig", function(){ var w=boden(),g=gegner(w,"patrouillendroide",[16.5,61,6.5]),zf=SC.zufall(5),n=0; for(var i=0;i<50;i++) n+=SC.KI.schritt(w,g,null,1/10,zf,"normal").length; gleich(n,0); wahr(!g.bemerkt); });
test("Boss Koloss stampft in der Nähe", function(){ var w=boden(),g=gegner(w,"panzerkoloss",[10.5,61,10.5]),zf=SC.zufall(6),st=false; for(var i=0;i<80;i++) SC.KI.schritt(w,g,{pos:[12.5,61,12.5],sichtbar:true},1/10,zf,"normal").forEach(function(a){ if(a.art==="stampf") st=true; }); wahr(st); });
test("feststeckender Gegner wird entfernt", function(){ var w=boden(),g=gegner(w,"krabbler",[4.5,61,4.5]),zf=SC.zufall(4); for(var x=3;x<7;x++)for(var z=3;z<7;z++) for(var y=61;y<64;y++) if(x===3||x===6||z===3||z===6) w.setzeBlock(x,y,z,SC.B.STEIN,"system"); w.setzeBlock(4,63,4,SC.B.STEIN,"system"); w.setzeBlock(5,63,4,SC.B.STEIN,"system"); w.setzeBlock(4,63,5,SC.B.STEIN,"system"); w.setzeBlock(5,63,5,SC.B.STEIN,"system"); g.heim=[14.5,61,14.5]; for(var i=0;i<50;i++) SC.KI.schritt(w,g,null,1/10,zf,"normal"); wahr(g.entfernen); });
test("Magmakönig wirft aus der Ferne Glutbrocken", function(){ var w=boden(),g=gegner(w,"magmakoenig",[6.5,61,6.5]),zf=SC.zufall(3),glut=0; for(var i=0;i<40;i++) SC.KI.schritt(w,g,{pos:[6.5,61,26.5],sichtbar:true},1/10,zf,"normal").forEach(function(a){ if(a.art==="schuss"&&a.geschossArt==="glut") glut++; }); wahr(glut>=1,"Glutbrocken: "+glut); });
test("Sumpfkoloss ruft höchstens 3 Schleicher", function(){ var w=boden(),g=gegner(w,"sumpfkoloss",[16.5,61,16.5]),zf=SC.zufall(4),rufe=0; for(var i=0;i<600;i++) SC.KI.schritt(w,g,{pos:[16.5,61,28.5],sichtbar:true},1/10,zf,"normal").forEach(function(a){ if(a.art==="ruf"){ rufe++; gleich(a.gegnerArt,"rankenschleicher"); var s=gegner(w,a.gegnerArt,a.pos); s.gerufenVon=g.id; } }); gleich(rufe,3); });
test("Rankenschleicher springt an", function(){ var w=boden(),g=gegner(w,"rankenschleicher",[16.5,61,8.5]),zf=SC.zufall(5),hoch=0; for(var i=0;i<20;i++){ SC.KI.schritt(w,g,{pos:[16.5,61,13.5],sichtbar:true},1/20,zf,"normal"); hoch=Math.max(hoch,g.pos[1]); } wahr(hoch>62,"gesprungen: "+hoch); });
test("Schattenritter ist direkt nach dem Hieb kurz verwundbar, sonst blockt er (#39)", function(){ var w=boden(),g=gegner(w,"schattenritter",[10.5,61,10.5]),r=SC.GEGNER.schattenritter.hieb.rate,zf=SC.zufall(7); g.cd=r; SC.KI.schritt(w,g,{pos:[10.5,61,20.5],sichtbar:true},0.01,zf,"normal"); gleich(g.blockt,false,"direkt nach dem Hieb"); g.cd=0.2; SC.KI.schritt(w,g,{pos:[10.5,61,20.5],sichtbar:true},0.01,zf,"normal"); gleich(g.blockt,true,"später blockt er"); });
// --- Gegner-Vielfalt: neue Verhaltensbausteine (#107, #108); eigene Test-Arten, damit die Prüfung nicht von der Tabelle abhängt ---
function kiArt(name, d){ SC.GEGNER[name] = Object.assign({ lp: function(s){ return 100; }, schaden: function(s){ return 5; }, tempo: 3, breite: 0.7, hoehe: 1.2, sicht: 30, hieb: { reichweite: 1.5, rate: 1 }, beute: { chance: 0 }, modell: [] }, d); return name; }
function kiLauf(w, g, ziel, sek, zf, dt){ var akt = []; dt = dt || 0.1; for(var t = 0; t < sek; t += dt) SC.KI.schritt(w, g, ziel, dt, zf, "normal").forEach(function(a){ akt.push({ a: a, t: t }); }); return akt; }
test("Kamikaze: rennt los, zündet in Reichweite, explodiert erst nach der Zündschnur (#107)", function(){
  var w = boden(), art = kiArt("tKamikaze", { verhalten: "kamikaze", tempo: 5, zuend: { reichweite: 2, zeit: 0.8 }, explosion: { radius: 3.5 } }), g = gegner(w, art, [8.5, 61, 8.5]), zf = SC.zufall(1);
  var ziel = { pos: [8.5, 61, 16.5], sichtbar: true }, akt = kiLauf(w, g, ziel, 0.5, zf); gleich(akt.length, 0, "unterwegs keine Aktion"); wahr(Math.hypot(g.pos[0] - 8.5, g.pos[2] - 8.5) > 1, "läuft los");
  akt = kiLauf(w, g, ziel, 6, zf); var st = akt.filter(function(x){ return x.a.art === "stampf"; }); gleich(st.length, 1, "genau eine Explosion"); gleich(st[0].a.radius, 3.5); gleich(st[0].a.schaden, 5); gleich(g.entfernen, true, "danach weg");
  wahr(g.zuendet === true || g.entfernen, "Zündschnur war an"); gleich(delete SC.GEGNER.tKamikaze, true);
});
test("Kamikaze: Zündschnur hält den Gegner an, ohne Sicht passiert nichts (#107)", function(){
  var w = boden(), art = kiArt("tKamikaze2", { verhalten: "kamikaze", tempo: 5, zuend: { reichweite: 3, zeit: 5 }, explosion: { radius: 3 } }), g = gegner(w, art, [8.5, 61, 8.5]), zf = SC.zufall(2);
  kiLauf(w, g, { pos: [8.5, 61, 10.5], sichtbar: true }, 0.3, zf); wahr(g.zuendBis > 0, "Zündschnur brennt"); var x = g.pos[2]; kiLauf(w, g, { pos: [8.5, 61, 14.5], sichtbar: true }, 1, zf); wahr(Math.abs(g.pos[2] - x) < 0.3, "steht still");
  var g2 = gegner(w, art, [20.5, 61, 20.5]); gleich(kiLauf(w, g2, { pos: [20.5, 61, 24.5], sichtbar: false }, 3, zf).length, 0, "blind: keine Aktion"); gleich(g2.zuendBis > 0, false); delete SC.GEGNER.tKamikaze2;
});
test("Schweber: fliegt über dem Ziel, fällt nicht, schießt (#107)", function(){
  var w = boden(), art = kiArt("tSchweber", { verhalten: "schweber", fliegt: true, schwebehoehe: 3, abstand: [6, 10], waffe: { art: "laser", rate: 1, tempo: 30, streuung: 0.05, farbe: "#fff" } }), g = gegner(w, art, [12.5, 61, 8.5]), zf = SC.zufall(3);
  var ziel = { pos: [12.5, 61, 20.5], sichtbar: true }, akt = kiLauf(w, g, ziel, 6, zf);
  wahr(g.pos[1] > 62.5, "schwebt über dem Boden: " + g.pos[1]); wahr(g.pos[1] < 66, "nicht zu hoch: " + g.pos[1]); gleich(g.aufBoden, false, "nicht auf dem Boden");
  wahr(akt.some(function(x){ return x.a.art === "schuss"; }), "schießt"); var y = g.pos[1]; kiLauf(w, g, ziel, 2, zf); wahr(Math.abs(g.pos[1] - y) < 0.8, "bleibt oben");
  var drohne = gegner(w, art, [4.5, 61, 4.5]); kiLauf(w, drohne, null, 3, zf); wahr(drohne.pos[1] < 63, "ohne Ziel: ruhig"); delete SC.GEGNER.tSchweber;
});
test("Heilen: verletzte Gegner in Reichweite, nicht sich selbst und keine Bosse (#108)", function(){
  var w = boden(), art = kiArt("tHeiler", { verhalten: "fernkampf", abstand: [8, 14], waffe: { art: "laser", rate: 9, tempo: 30, streuung: 0.1, farbe: "#fff" }, heilt: { rate: 2, radius: 6, anteil: 0.25 } }), zf = SC.zufall(4);
  var h = gegner(w, art, [10.5, 61, 10.5]), nah = gegner(w, "krabbler", [12.5, 61, 10.5]), fern = gegner(w, "krabbler", [24.5, 61, 10.5]), boss = gegner(w, "schattenritter", [10.5, 61, 13.5]);
  [nah, fern, boss].forEach(function(e){ e.lpMax = e.lp; e.lp = e.lpMax / 2; }); h.lpMax = h.lp; h.lp = h.lpMax / 2; boss.boss = true;
  var ziel = { pos: [10.5, 61, 24.5], sichtbar: true }; h.cdH = 0; var akt = []; for(var t = 0; t < 1.5; t += 0.1) [h, nah, fern, boss].forEach(function(e){ if(e === h) SC.KI.schritt(w, h, ziel, 0.1, zf, "normal").forEach(function(a){ akt.push(a); }); });
  gleich(Math.round(nah.lp / nah.lpMax * 100), 75, "Nachbar +25 %"); gleich(fern.lp / fern.lpMax, 0.5, "zu weit weg"); gleich(boss.lp / boss.lpMax, 0.5, "Bosse nicht"); gleich(h.lp / h.lpMax, 0.5, "nicht sich selbst");
  wahr(akt.some(function(a){ return a.art === "heilung"; }), "Heilungs-Aktion für Effekt und Ton"); for(var u = 0; u < 60; u++) SC.KI.schritt(w, h, ziel, 0.1, zf, "normal"); gleich(nah.lp, nah.lpMax, "nie über das Maximum");
  var ruhig = gegner(w, art, [30.5, 61, 30.5]), v = gegner(w, "krabbler", [31.5, 61, 30.5]); v.lpMax = v.lp; v.lp = 1; for(var r = 0; r < 40; r++) SC.KI.schritt(w, ruhig, null, 0.1, zf, "normal"); gleich(v.lp, 1, "ohne Kampf wird nicht geheilt"); delete SC.GEGNER.tHeiler;
});
test("Ansturm: aus der Ferne dreifaches Tempo, dann Pause (#108)", function(){
  var w = boden(), art = kiArt("tRammer", { verhalten: "nahkampf", tempo: 3, sturm: { min: 5, max: 14, rate: 6, dauer: 0.8 } }), g = gegner(w, art, [8.5, 61, 8.5]), zf = SC.zufall(5), ziel = { pos: [8.5, 61, 22.5], sichtbar: true };
  var z0 = g.pos[2]; SC.KI.schritt(w, g, ziel, 0.1, zf, "normal"); SC.KI.schritt(w, g, ziel, 0.1, zf, "normal"); var schritt = g.pos[2] - z0; wahr(g.sturmBis > 0, "Ansturm läuft");
  var z1 = g.pos[2]; SC.KI.schritt(w, g, ziel, 0.1, zf, "normal"); var rennt = g.pos[2] - z1; wahr(rennt > 0.8 * 3 * 3 * 0.1 * 0.7, "schnell: " + rennt);
  var normal = gegner(w, kiArt("tNormal", { verhalten: "nahkampf", tempo: 3 }), [30.5, 61, 8.5]); var n0 = normal.pos[2]; SC.KI.schritt(w, normal, { pos: [30.5, 61, 22.5], sichtbar: true }, 0.1, zf, "normal"); SC.KI.schritt(w, normal, { pos: [30.5, 61, 22.5], sichtbar: true }, 0.1, zf, "normal"); wahr(normal.pos[2] - n0 < schritt, "ohne Fähigkeit langsamer");
  for(var i = 0; i < 12; i++) SC.KI.schritt(w, g, { pos: [8.5, 61, 40.5], sichtbar: true }, 0.1, zf, "normal"); gleich(g.cd2 > 0, true, "Abklingzeit"); delete SC.GEGNER.tRammer; delete SC.GEGNER.tNormal;
});
test("Stampfen im Nahkampf: einmal je Abklingzeit, nur in Reichweite (#108)", function(){
  var w = boden(), art = kiArt("tStampfer", { verhalten: "nahkampf", tempo: 2, stampf: { radius: 3, rate: 4 } }), g = gegner(w, art, [8.5, 61, 8.5]), zf = SC.zufall(6);
  var fern = kiLauf(w, g, { pos: [8.5, 61, 22.5], sichtbar: true }, 0.5, zf).filter(function(x){ return x.a.art === "stampf"; }); gleich(fern.length, 0, "zu weit");
  var g2 = gegner(w, art, [20.5, 61, 8.5]), akt = kiLauf(w, g2, { pos: [20.5, 61, 10.5], sichtbar: true }, 3.5, zf).filter(function(x){ return x.a.art === "stampf"; }); gleich(akt.length, 1, "nur einmal in 3,5 s"); gleich(akt[0].a.radius, 3);
  akt = kiLauf(w, g2, { pos: [20.5, 61, 10.5], sichtbar: true }, 2, zf).filter(function(x){ return x.a.art === "stampf"; }); gleich(akt.length, 1, "nach der Abklingzeit wieder"); delete SC.GEGNER.tStampfer;
});
test("Zündschnur wird an Gäste gemeldet und gespiegelt (#107)", function(){
  var w = boden(), g = gegner(w, "krabbler", [8.5, 61, 8.5]); g.zuendet = true; var l = SC.Raum.wesenListe(w, 0); gleich(l[0].zuendet, true);
  var w2 = boden(); SC.Raum.spiegleWesen(w2, l, 0.1, 0); var e = null; w2.wesen.forEach(function(x){ if(x.art === "gegner") e = x; }); gleich(e.zuendet, true, "beim Gast angekommen");
});
