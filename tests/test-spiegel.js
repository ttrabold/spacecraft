// Spiegel (#188): Block, Rezept, Aufstellen, Einstellung, Spiegelmathematik
var SP_IDS = ["SPIEGEL_N", "SPIEGEL_S", "SPIEGEL_O", "SPIEGEL_W", "SPIEGEL_N_OBEN", "SPIEGEL_S_OBEN", "SPIEGEL_O_OBEN", "SPIEGEL_W_OBEN"];
test("Spiegel: acht Blöcke ab ID 106, dünne Platten, nicht fest; Rezept 2 Glas + 1 Eisenerz + 2 Bretter (#188)", function(){
  SP_IDS.forEach(function(n, i){
    var id = SC.B[n]; gleich(id, 106 + i, n);
    var d = SC.BLOECKE[id]; wahr(d && d.form && d.form.typ === "platte", n + " ist eine Platte"); gleich(d.fest, false, n + " nicht fest"); wahr(!d.klettern, n + " nicht kletterbar");
    gleich(d.inAuswahl === true, id === SC.B.SPIEGEL_N, n + " nur SPIEGEL_N in der Auswahl");
  });
  var rz = SC.REZEPTE.filter(function(x){ return x.id === "spiegel"; })[0]; wahr(rz, "Rezept vorhanden");
  gleich(rz.station, "werkbank"); gleich(rz.ergibt.block, SC.B.SPIEGEL_N); gleich(rz.ergibt.anzahl, 1);
  var k = {}; rz.kosten.forEach(function(c){ k[c.block] = c.anzahl; });
  gleich(k[SC.B.GLAS], 2); gleich(k[SC.B.EISENERZ], 1); gleich(k[SC.B.BRETTER], 2); gleich(rz.kosten.length, 3);
});
test("Spiegel: Abbau ergibt immer SPIEGEL_N; Namen und Texturen vorhanden (#188)", function(){
  SP_IDS.forEach(function(n){ gleich(SC.Abbau.ergibt(SC.B[n]), SC.B.SPIEGEL_N, n); });
  wahr(SC.T.rezeptName.spiegel, "Rezeptname"); wahr(SC.T.bloecke.spiegel, "Blockname");
  wahr(SC.TEXTUREN.spiegel_unten && SC.TEXTUREN.spiegel_oben, "Muster");
  wahr(SC.PALETTEN.start.texturen.spiegel_unten && SC.PALETTEN.start.texturen.spiegel_oben, "Palette");
});
function spWelt(){ var w = leereWelt(); w.setzeBlock(5, 64, 5, SC.B.STEIN, "system"); w.setzeBlock(5, 65, 5, SC.B.STEIN, "system"); return w; }
test("Spiegel: Richtung aus der Wand wie die Leiter, Boden, Decke, Luft und Glas → 0 (#188)", function(){
  var w = spWelt(), A = SC.Bauteile.aufstellId, S = SC.B.SPIEGEL_N;
  gleich(A(w, S, { x: 5, y: 64, z: 5, nx: 0, ny: 0, nz: 1 }, [0, 0, -1]), SC.B.SPIEGEL_N, "Wand im Norden");
  gleich(A(w, S, { x: 5, y: 64, z: 5, nx: 0, ny: 0, nz: -1 }, [0, 0, 1]), SC.B.SPIEGEL_S, "Wand im Süden");
  gleich(A(w, S, { x: 5, y: 64, z: 5, nx: 1, ny: 0, nz: 0 }, [-1, 0, 0]), SC.B.SPIEGEL_W, "Wand im Westen");
  gleich(A(w, S, { x: 5, y: 64, z: 5, nx: -1, ny: 0, nz: 0 }, [1, 0, 0]), SC.B.SPIEGEL_O, "Wand im Osten");
  gleich(A(w, S, { x: 5, y: 64, z: 5, nx: 0, ny: 1, nz: 0 }, [0, 0, -1]), 0, "Oberseite (Boden)");
  gleich(A(w, S, { x: 5, y: 64, z: 5, nx: 0, ny: -1, nz: 0 }, [0, 0, -1]), 0, "Unterseite (Decke)");
  gleich(A(w, S, { x: 9, y: 64, z: 9, nx: 0, ny: 0, nz: 1 }, [0, 0, -1]), 0, "gegen Luft");
  w.setzeBlock(7, 64, 7, SC.B.GLAS, "system"); gleich(A(w, S, { x: 7, y: 64, z: 7, nx: 0, ny: 0, nz: 1 }, [0, 0, -1]), 0, "gegen Glas");
  gleich(A(w, S, { x: 5, y: 64, z: 5, nx: 0, ny: 1, nz: 0 }, [0, 0, -1]), 0, "kein Verlängern nach oben wie bei der Leiter");
});
test("Spiegel: Setzen belegt zwei Zellen, obere Zelle belegt → nichts gesetzt (#188)", function(){
  var w = leereWelt(), sp = new SC.Spieler({ id: "a", pos: [2.5, 64, 2.5], modus: "survival" });
  gleich(SC.Bauteile.setze(w, sp, 5, 64, 5, SC.B.SPIEGEL_S), true); gleich(w.holeBlock(5, 64, 5), SC.B.SPIEGEL_S); gleich(w.holeBlock(5, 65, 5), SC.B.SPIEGEL_S_OBEN);
  w.setzeBlock(8, 65, 5, SC.B.STEIN, "system"); gleich(SC.Bauteile.setze(w, sp, 8, 64, 5, SC.B.SPIEGEL_N), false, "oben belegt"); gleich(w.holeBlock(8, 64, 5), SC.B.LUFT, "unten bleibt leer");
  gleich(SC.Bauteile.istSpiegel(SC.B.SPIEGEL_W_OBEN), true); gleich(SC.Bauteile.istSpiegelOben(SC.B.SPIEGEL_W_OBEN), true); gleich(SC.Bauteile.istSpiegelOben(SC.B.SPIEGEL_W), false); gleich(SC.Bauteile.istSpiegel(SC.B.TUER_X), false);
});
test("Spiegel: eine Hälfte abgebaut, die andere verschwindet mit; halber Zustand und fremde Blöcke bleiben heil (#188)", function(){
  var w = leereWelt(), sp = new SC.Spieler({ id: "a", pos: [2.5, 64, 2.5], modus: "survival" }); SC.Bauteile.setze(w, sp, 5, 64, 5, SC.B.SPIEGEL_N); SC.Bauteile.setze(w, sp, 8, 64, 5, SC.B.SPIEGEL_O);
  var fake = { welt: w }; w.ereignisse.an("block", function(b){ SC.Spiel.prototype._spiegelWeg.call(fake, b); });
  w.setzeBlock(5, 64, 5, SC.B.LUFT, "spieler"); gleich(w.holeBlock(5, 65, 5), SC.B.LUFT, "unten abgebaut, oben weg");
  w.setzeBlock(8, 65, 5, SC.B.LUFT, "spieler"); gleich(w.holeBlock(8, 64, 5), SC.B.LUFT, "oben abgebaut, unten weg");
  w.setzeBlock(5, 64, 5, SC.B.SPIEGEL_N, "system"); w.setzeBlock(5, 65, 5, SC.B.STEIN, "system"); w.setzeBlock(5, 64, 5, SC.B.LUFT, "spieler"); gleich(w.holeBlock(5, 65, 5), SC.B.STEIN, "Stein darüber bleibt");
  w.setzeBlock(11, 65, 5, SC.B.SPIEGEL_N_OBEN, "system"); w.setzeBlock(11, 65, 5, SC.B.LUFT, "spieler"); gleich(w.holeBlock(11, 64, 5), SC.B.LUFT, "einzelne Hälfte: kein Fehler");
});
test("Spiegel: Einstellung Standard „an“, alte Einstellungen ohne das Feld gelten als „an“, „aus“ bleibt (#188)", function(){
  gleich(SC.Einstellungen.standard().spiegel, "an");
  var ns = "test-spiegel-einst", k = "sc-" + ns + ":einstellungen";
  try {
    localStorage.setItem(k, JSON.stringify({ sichtweite: 7 })); var e = SC.Einstellungen.lade(ns); gleich(e.spiegel, "an", "Feld fehlt"); gleich(e.sichtweite, 7);
    localStorage.setItem(k, JSON.stringify({ spiegel: "aus" })); gleich(SC.Einstellungen.lade(ns).spiegel, "aus");
  } finally { localStorage.removeItem(k); }
  wahr(SC.T.spiegel && SC.T.spiegelAn && SC.T.spiegelAus, "Beschriftungen");
});
function spPos(x, y, z){ return [x, y, z]; }
test("Spiegelmathematik: Punkt und Richtung an einer Ebene spiegeln (#188)", function(){
  var S = SC.Spiegel, n = [0, 0, 1], e = [0, 0, 5], p = S.spiegelPunkt([1, 2, 7], e, n);
  gleich(p[0], 1); gleich(p[1], 2); gleich(p[2], 3); gleich(S.spiegelPunkt([4, 4, 5], e, n)[2], 5, "Punkt in der Ebene bleibt");
  var r = S.spiegelRichtung([0.6, 0.2, -0.8], n); gleich(r[0], 0.6); gleich(r[1], 0.2); gleich(r[2], 0.8, "nur die Normalen-Komponente kippt");
  var q = S.spiegelPunkt([3, 1, 2], [2, 0, 0], [1, 0, 0]); gleich(q[0], 1, "Ebene x = 2"); gleich(q[1], 1); gleich(q[2], 2);
});
test("Spiegel: Normale und Ebene aus der ID – Spiegelseite zeigt in den Raum (#188)", function(){
  var S = SC.Spiegel;
  [["SPIEGEL_N", 0, 1], ["SPIEGEL_S", 0, -1], ["SPIEGEL_O", -1, 0], ["SPIEGEL_W", 1, 0]].forEach(function(t){
    var s = S.seite(SC.B[t[0]]); gleich(s.nx, t[1], t[0]); gleich(s.nz, t[2], t[0]);
    var f = SC.BLOECKE[SC.B[t[0]]].form, mitte = f.achse === "z" ? s.ez : s.ex;   // Platte [versatz ± 0,04]: die Spiegelebene liegt 0,01 vor der Raumseite der Platte
    wahr(Math.abs(mitte - (f.versatz === 0 ? 0.09 : 0.91)) < 1e-9, t[0] + " Ebene an der Raumseite der Platte");
  });
  gleich(S.seite(SC.B.SPIEGEL_N_OBEN), null, "obere Hälfte hat keine eigene Fläche"); gleich(S.seite(SC.B.STEIN), null);
});
test("Spiegel: aktiver Spiegel – davor, nah genug, im Blick; hinter der Wand, zu weit, weggedreht und in der Ebene keiner (#188)", function(){
  var w = leereWelt(), S = SC.Spiegel; w.setzeBlock(8, 64, 2, SC.B.SPIEGEL_N, "system"); w.setzeBlock(8, 65, 2, SC.B.SPIEGEL_N_OBEN, "system");
  var vor = S.finde(w, spPos(8.5, 65.6, 7.5), [0, 0, -1], null); wahr(vor, "davor"); gleich(vor.x, 8); gleich(vor.y, 64); gleich(vor.z, 2); gleich(vor.nz, 1);
  gleich(S.finde(w, spPos(8.5, 65.6, 7.5), [0, 0, 1], null), null, "weggedreht");
  gleich(S.finde(w, spPos(8.5, 65.6, 0.5), [0, 0, 1], null), null, "hinter der Wand");
  gleich(S.finde(w, spPos(8.5, 65.6, 11.5), [0, 0, -1], null), null, "über 8 Blöcke");
  wahr(S.finde(w, spPos(8.5, 65.6, 9.5), [0, 0, -1], null), "7,4 Blöcke: noch aktiv");
  var inE = S.finde(w, spPos(8.5, 65.6, 2.08), [0, 0, -1], null); gleich(inE, null, "genau in der Ebene (keine Division durch null)");
  w.setzeBlock(8, 64, 2, SC.B.LUFT, "system"); gleich(S.finde(w, spPos(8.5, 65.6, 7.5), [0, 0, -1], null), null, "abgebauter Spiegel");
});
test("Spiegel: zwei Spiegel – der nähere gewinnt, der bisherige bleibt bei kleinem Unterschied (#188)", function(){
  var w = leereWelt(), S = SC.Spiegel; w.setzeBlock(4, 64, 2, SC.B.SPIEGEL_N, "system"); w.setzeBlock(8, 64, 2, SC.B.SPIEGEL_N, "system");
  var a = S.finde(w, spPos(4.5, 65.6, 7.5), [0, 0, -1], null); gleich(a.x, 4, "vor A");
  var b = S.finde(w, spPos(8.5, 65.6, 7.5), [0, 0, -1], null); gleich(b.x, 8, "vor B");
  gleich(S.finde(w, spPos(7.2, 65.6, 7.5), [0, 0, -1], a).x, 4, "Unterschied unter 1 Block: A bleibt");
  gleich(S.finde(w, spPos(8.5, 65.6, 7.5), [0, 0, -1], a).x, 8, "deutlich näher an B: wechselt");
});
test("Spiegel: Sucher fragt zwischen zwei Suchläufen kaum Blöcke ab und bemerkt Abbau (#188)", function(){
  var w = leereWelt(), S = SC.Spiegel; w.setzeBlock(8, 64, 2, SC.B.SPIEGEL_N, "system");
  var n = 0, orig = w.holeBlock; w.holeBlock = function(x, y, z){ n++; return orig.call(w, x, y, z); };
  var s = new S.Sucher(), p = spPos(8.5, 65.6, 7.5);
  wahr(s.finde(w, p, [0, 0, -1], 0), "erster Lauf findet"); var voll = n; wahr(voll > 1000, "Suche liest den Umkreis: " + voll);
  n = 0; wahr(s.finde(w, spPos(8.6, 65.6, 7.4), [0, 0, -1], 0.1), "zweiter Aufruf aus dem Zwischenspeicher"); wahr(n <= 3, "nur Kandidaten geprüft: " + n);
  w.holeBlock = orig; w.setzeBlock(8, 64, 2, SC.B.LUFT, "system"); gleich(s.finde(w, spPos(8.6, 65.6, 7.4), [0, 0, -1], 0.15), null, "Abbau im Zwischenspeicher bemerkt");
});
test("Spiegel: Sichtfenster der gespiegelten Kamera – Near-Ebene ist die Spiegelebene, Fenster über der Glasfläche (#188)", function(){
  var f = SC.Spiegel.fenster([0, 1.6, 5], [0, 1, 0], [0, 0, 1]);
  gleich(f.pos[0], 0); gleich(f.pos[1], 1.6); gleich(f.pos[2], -5, "Kamera hinter der Wand"); gleich(f.near, 5, "Abstand zur Ebene");
  gleich(f.vor[2], 1, "schaut in den Raum"); gleich(f.rechts[0], -1, "rechts der Spiegelkamera ist −x");
  wahr(Math.abs(f.links + 0.375) < 1e-9 && Math.abs(f.rechtsKante - 0.375) < 1e-9, "Breite 0,75 mittig: " + f.links + " " + f.rechtsKante);
  wahr(Math.abs(f.unten + 1.475) < 1e-9 && Math.abs(f.oben - 0.275) < 1e-9, "Höhe 1,75 um die Mitte, schief zur Augenhöhe: " + f.unten + " " + f.oben);
  var g = SC.Spiegel.fenster([2, 1.6, 0.5], [0, 1, 0], [1, 0, 0]);   // Spiegelnormale +x, Spieler seitlich versetzt in z
  gleich(g.pos[0], -2); gleich(g.near, 2); wahr(Math.abs(g.rechts[2] - 1) < 1e-9, "rechts der Spiegelkamera ist +z"); wahr(Math.abs(g.links - (0 - 0.5 - 0.375)) < 1e-9, "Versatz seitlich: " + g.links);
});
// Attrappe für SC.Render: nur, was RenderSpiegel braucht; der Renderer zeichnet nichts, sondern merkt sich die Sichtbarkeiten im Spiegel-Durchgang
function spRender(w, extra){
  var o = function(v){ var x = new THREE.Object3D(); x.visible = v; return x; }, r = {
    szene: new THREE.Scene(), kamera: new THREE.PerspectiveCamera(75, 1, 0.08, 1000), chunks: new Map(), _welt: w, touch: false, _weniger: false, spiegelAn: true,
    figur: o(false), hand: o(true), handWaffe: o(true), rahmen: o(true), grenzen: o(true), himmel: o(true), sonne: o(true), mond: o(true), sterne: o(true),
    uniforms: { nebelNah: { value: 90 }, nebelFern: { value: 150 } }, aufgenommen: [], ziele: [],
    renderer: { ziel: null, getRenderTarget: function(){ return this.ziel; }, setRenderTarget: function(t){ this.ziel = t; },
      render: function(){ r.ziele.push(this.ziel); r.aufgenommen.push({ figur: r.figur.visible, hand: r.hand.visible, waffe: r.handWaffe.visible, rahmen: r.rahmen.visible, flaeche: r.spiegel.flaeche.visible, nebel: r.uniforms.nebelFern.value }); } }
  };
  Object.assign(r, extra || {}); r.spiegel = new SC.RenderSpiegel(r); return r;
}
function spSpieler(modus){ return { pos: [8, 64, 7], modus: modus || "survival", ansicht: "ich", blick: [Math.PI, 0], sitzt: false, augen: function(){ return [8, 65.6, 7]; }, richtung: function(){ return [0, 0, -1]; }, kamera: function(){ return { pos: [8, 65.6, 7], richtung: [0, 0, -1] }; } };
}
function spWeltMitSpiegel(){ var w = leereWelt(); w.setzeBlock(8, 64, 2, SC.B.SPIEGEL_N, "system"); w.setzeBlock(8, 65, 2, SC.B.SPIEGEL_N_OBEN, "system"); return w; }
test("RenderSpiegel: Spiegel-Durchgang zeigt die eigene Figur, versteckt Hand, Rahmen und Fläche und stellt alles wieder her (#188)", function(){
  var r = spRender(spWeltMitSpiegel()); r.spiegel.bild(spSpieler(), 0.016);
  gleich(r.aufgenommen.length, 1, "ein Durchgang"); var a = r.aufgenommen[0];
  gleich(a.figur, true, "Figur sichtbar (auch in der Ich-Ansicht)"); gleich(a.hand, false); gleich(a.waffe, false); gleich(a.rahmen, false); gleich(a.flaeche, false, "Spiegelfläche selbst unsichtbar"); gleich(a.nebel, 40, "kürzere Sicht");
  gleich(r.figur.visible, false, "danach wieder wie vorher"); gleich(r.hand.visible, true); gleich(r.handWaffe.visible, true); gleich(r.rahmen.visible, true); gleich(r.spiegel.flaeche.visible, true, "Fläche liegt vor dem Spiegel");
  gleich(r.uniforms.nebelFern.value, 150); gleich(r.renderer.ziel, null, "Render-Ziel zurückgesetzt"); wahr(r.ziele[0] === r.spiegel.ziel, "gezeichnet in die Spiegeltextur");
  r.sonne.position.set(1, 2, 3); r.spiegel.bild(spSpieler(), 0.016); gleich(r.sonne.position.x, 1, "Himmelskörper wieder an ihrem Platz");
  var z = spRender(spWeltMitSpiegel()); z.spiegel.bild(spSpieler("zuschauer"), 0.016); gleich(z.aufgenommen[0].figur, false, "Zuschauer: keine eigene Figur"); 
});
test("RenderSpiegel: aus, kein Spiegel in der Nähe, im Fahrzeug → keine Textur, kein Durchgang (#188)", function(){
  var r = spRender(spWeltMitSpiegel(), { spiegelAn: false }); r.spiegel.bild(spSpieler(), 0.016); gleich(r.aufgenommen.length, 0); gleich(r.spiegel.ziel, null, "ausgeschaltet: keine Render-Textur"); gleich(r.spiegel.flaeche, null);
  var e = spRender(leereWelt()); e.spiegel.bild(spSpieler(), 0.016); gleich(e.aufgenommen.length, 0, "kein Spiegel"); gleich(e.spiegel.ziel, null);
  var f = spRender(spWeltMitSpiegel()), sp = spSpieler(); sp.sitzt = 1.5; f.spiegel.bild(sp, 0.016); gleich(f.aufgenommen.length, 0, "im Fahrzeug"); gleich(f.spiegel.ziel, null);
  var an = spRender(spWeltMitSpiegel()); an.spiegel.bild(spSpieler(), 0.016); wahr(an.spiegel.ziel && an.spiegel.flaeche, "angelegt"); an.spiegelAn = false; an.spiegel.bild(spSpieler(), 0.016);
  gleich(an.spiegel.ziel, null, "Ausschalten gibt die Textur frei"); gleich(an.spiegel.flaeche, null); gleich(an.szene.children.length, 0, "Fläche aus der Szene entfernt");
});
test("RenderSpiegel: Touch oder „weniger“ erneuert das Spiegelbild nur jedes zweite Bild, Textur kleiner (#188)", function(){
  var r = spRender(spWeltMitSpiegel(), { touch: true }), sp = spSpieler(); for(var i = 0; i < 5; i++) r.spiegel.bild(sp, 0.016);
  gleich(r.aufgenommen.length, 3, "5 Bilder → 3 Durchgänge (erstes, drittes, fünftes)"); gleich(r.spiegel.ziel.height, 256); gleich(r.spiegel.ziel.width, 128);
  var d = spRender(spWeltMitSpiegel()); for(i = 0; i < 4; i++) d.spiegel.bild(sp, 0.016); gleich(d.aufgenommen.length, 4, "am Computer jedes Bild"); gleich(d.spiegel.ziel.height, 512); gleich(d.spiegel.ziel.width, 256);
  var w = spRender(spWeltMitSpiegel(), { _weniger: true }); for(i = 0; i < 4; i++) w.spiegel.bild(sp, 0.016); gleich(w.aufgenommen.length, 2, "„weniger“: jedes zweite");
});
test("Anleitung erklärt den Spiegel, ANLEITUNG.md enthält denselben Abschnitt (#188)", function(){
  var sp = SC.T.anleitung.abschnitte.reduce(function(a, x){ return a.concat(x[1]); }, []).filter(function(t){ return t.indexOf("Spiegel hängst") >= 0; })[0];
  wahr(sp && sp.indexOf("zwei Blöcke hoch") >= 0 && sp.indexOf("Einstellungen") >= 0, "Satz in SC.T.anleitung");
  var req = new XMLHttpRequest(); req.open("GET", "../docs/ANLEITUNG.md", false); try { req.send(); } catch(e){ return; }   // per file:// nicht lesbar: dann nur der Text oben
  if(req.status === 200 || req.responseText) wahr(req.responseText.indexOf(sp) >= 0, "ANLEITUNG.md enthält denselben Satz");
});
test("Netzprotokoll 13 wegen der neuen Block-IDs des Spiegels, alte Gäste werden abgelehnt (#188)", function(){ gleich(SC.NETZ_PROTOKOLL, 13); });
test("Spiegel: Suche reicht 8 Zellen nach oben und unten; der bisherige Treffer bleibt an den Schwellen (#188)", function(){
  var w = leereWelt(), S = SC.Spiegel; w.setzeBlock(8, 70, 2, SC.B.SPIEGEL_N, "system");
  wahr(S.finde(w, spPos(8.5, 65.6, 7.5), [0, 0.3, -1], null), "Spiegel 5 Zellen über dem Auge");
  var w2 = spWeltMitSpiegel(), a = S.finde(w2, spPos(8.5, 65.6, 7.5), [0, 0, -1], null);
  gleich(S.finde(w2, spPos(8.5, 65.6, 10.2), [0, 0, -1], null), null, "neu gesucht: knapp über 8 Blöcke");
  gleich(S.finde(w2, spPos(8.5, 65.6, 10.2), [0, 0, -1], a).x, 8, "bisheriger Treffer bleibt bis 9 Blöcke");
  gleich(S.finde(w2, spPos(8.5, 65.6, 12.0), [0, 0, -1], a), null, "über 9 Blöcke weg");
  var seit = [1.9, 65.6, 4.29]; gleich(S.finde(w2, seit, [0, 0, -1], null), null, "Winkel knapp außerhalb 70° neu gesucht"); gleich(S.finde(w2, seit, [0, 0, -1], a).x, 8, "bisheriger Treffer bleibt bis ~75°");
});
test("RenderSpiegel: Fehler im Zeichnen stellt trotzdem alles zurück; im Fahrzeug bleibt die Textur; Chunks nach Abstand der Spiegelkamera (#188)", function(){
  var r = spRender(spWeltMitSpiegel()), fern = new THREE.Object3D(), nah = new THREE.Object3D(), kopf = new THREE.Object3D(); fern.visible = nah.visible = true;
  fern.position.set(8 - 8, 0, 7 + 50); nah.position.set(8 - 8, 0, 7 - 24);   // Chunk-Mitte (x + 8, z + 8): 58 Blöcke hinter dem Spieler bzw. 24 vor ihm
  r.chunks.set("a", { fest: fern }); r.chunks.set("b", { fest: nah });
  r.spiegel.bild(spSpieler(), 0.016); gleich(r.aufgenommen.length, 1); gleich(fern.visible, true, "nach dem Durchgang wieder sichtbar");
  var orig = r.renderer.render; r.renderer.render = function(){ throw new Error("kaputt"); }; r.spiegel.takt = 0;
  var wurf = false; try { r.spiegel._zeichne(spSpieler(), SC.Spiegel.fenster([8, 65.6, 7], [8.5, 65, 2.09], [0, 0, 1])); } catch(e){ wurf = true; }
  wahr(wurf, "Fehler wird weitergereicht"); gleich(r.figur.visible, false, "Figur wie vorher"); gleich(r.hand.visible, true); gleich(fern.visible, true, "Chunk wieder sichtbar"); gleich(r.renderer.ziel, null, "Render-Ziel zurückgesetzt"); gleich(r.uniforms.nebelFern.value, 150);
  r.renderer.render = orig; var sp = spSpieler(); sp.sitzt = 1.5; r.spiegel.bild(sp, 0.016); wahr(r.spiegel.ziel, "Textur bleibt im Fahrzeug"); gleich(r.spiegel.flaeche.visible, false, "Fläche aus");
});
