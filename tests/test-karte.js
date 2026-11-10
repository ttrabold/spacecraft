// Karten (#169): Gegenstand, Erkundung, Ansicht
test("Karte: Block 114, nicht aufstellbar, Rezept 2 Bretter + 1 Eisenerz an der Werkbank, in der Kreativ-Auswahl (#169)", function(){
  gleich(SC.B.KARTE, 114); var d = SC.BLOECKE[114]; wahr(d, "Block vorhanden"); gleich(d.nichtAufstellbar, true); gleich(d.inAuswahl, true); gleich(d.form, "gegenstand");
  var rz = SC.REZEPTE.filter(function(x){ return x.id === "karte"; })[0]; wahr(rz, "Rezept vorhanden");
  gleich(rz.station, "werkbank"); gleich(rz.ergibt.block, SC.B.KARTE); gleich(rz.ergibt.anzahl, 1);
  var k = {}; rz.kosten.forEach(function(c){ k[c.block] = c.anzahl; }); gleich(k[SC.B.BRETTER], 2); gleich(k[SC.B.EISENERZ], 1); gleich(rz.kosten.length, 2);
});
test("Netzprotokoll 14 wegen der neuen Block-ID der Karte (#169)", function(){ gleich(SC.NETZ_PROTOKOLL, 14); });
test("Karte: Name und Textur vorhanden (#169)", function(){
  wahr(SC.T.rezeptName.karte, "Rezeptname"); wahr(SC.T.bloecke.karte, "Blockname"); wahr(SC.TEXTUREN.karte, "Muster"); wahr(SC.PALETTEN.start.texturen.karte, "Palette");
});
