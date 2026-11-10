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
