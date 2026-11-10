// Spiegel (#188): Block, Rezept, Aufstellen, Einstellung, Spiegelmathematik
var SP_IDS = ["SPIEGEL_N", "SPIEGEL_S", "SPIEGEL_O", "SPIEGEL_W", "SPIEGEL_N_OBEN", "SPIEGEL_S_OBEN", "SPIEGEL_O_OBEN", "SPIEGEL_W_OBEN"];
test("Spiegel: acht Blöcke ab ID 89, dünne Platten, nicht fest; Rezept 2 Glas + 1 Eisenerz + 2 Bretter (#188)", function(){
  SP_IDS.forEach(function(n, i){
    var id = SC.B[n]; gleich(id, 89 + i, n);
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
    var f = SC.BLOECKE[SC.B[t[0]]].form, mitte = f.achse === "z" ? s.ez : s.ex;   // Platte [versatz ± 0,04]: die Spiegelebene liegt an der Raumseite der Platte
    wahr(Math.abs(mitte - (f.versatz === 0 ? 0.08 : 0.92)) < 1e-9, t[0] + " Ebene an der Raumseite der Platte");
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
test("Spiegel: schräge Near-Ebene legt die Near-Ebene auf die Spiegelebene (#188)", function(){
  var k = new THREE.PerspectiveCamera(75, 0.5, 0.08, 32), m = SC.Spiegel.schraegeNear(k.projectionMatrix.elements.slice(), [0, 0, 1, 5]);   // Ebene z = -5 im Kameraraum
  function ndcZ(x, y, z){ var cz = m[2] * x + m[6] * y + m[10] * z + m[14], cw = m[3] * x + m[7] * y + m[11] * z + m[15]; return cz / cw; }
  wahr(Math.abs(ndcZ(0, 0, -5) + 1) < 1e-6, "Punkt auf der Ebene liegt auf der Near-Ebene: " + ndcZ(0, 0, -5));
  wahr(ndcZ(0, 0, -3) < -1, "davor (näher an der Kamera) wird weggeschnitten"); wahr(ndcZ(0, 0, -10) > -1 && ndcZ(0, 0, -10) < 1, "dahinter bleibt sichtbar");
});
