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
