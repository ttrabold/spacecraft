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
var KP = { seed: 111, groesse: 2048 }, KQ = { seed: 222, groesse: 2048 };
test("Karte: markiere am Weltrand läuft um den Ring, ohne Feld außerhalb; zweiter Aufruf ändert nichts (#169)", function(){
  var K = SC.Karte, b = K.neu(2048); gleich(K.FELD, 8); gleich(K.markiere(b, 2048, [3, 60, 2045], 16), true, "etwas markiert");
  var a = K.feldVon(2048, 3, 2045); gleich(a.fx, 0); gleich(a.fz, 255); wahr(K.istErkundet(b, 2048, 0, 255), "Feld der Position");
  wahr(K.istErkundet(b, 2048, 255, 255), "Wrap in x (Feld 255 liegt 4 Blöcke links von x = 3)"); wahr(K.istErkundet(b, 2048, 0, 0), "Wrap in z");
  wahr(!K.istErkundet(b, 2048, 128, 128), "weit weg nicht"); gleich(K.markiere(b, 2048, [3, 60, 2045], 16), false, "nichts Neues");
  var n = 0; for(var i = 0; i < b.length; i++) for(var j = 0; j < 8; j++) if(b[i] >> j & 1) n++; wahr(n >= 9 && n <= 25, "Anzahl markierter Felder bei Radius 16: " + n);
  var b2 = K.neu(2048); K.markiere(b2, 2048, [1000, 60, 1000], 64); var m = 0; for(i = 0; i < b2.length; i++) for(j = 0; j < 8; j++) if(b2[i] >> j & 1) m++; wahr(m > 150 && m < 260, "Radius 64 ≈ π·8² Felder: " + m);
});
test("Karte: kodieren und dekodieren, kaputte Daten ergeben eine leere Karte (#169)", function(){
  var K = SC.Karte, b = K.neu(2048); K.markiere(b, 2048, [500, 60, 700], 40); var t = K.kodiere(b); wahr(t.length < 12000, "Größe: " + t.length);
  var c = K.dekodiere(t, 2048); gleich(c.length, b.length); var gleichBits = true; for(var i = 0; i < b.length; i++) if(b[i] !== c[i]) gleichBits = false; wahr(gleichBits, "Roundtrip");
  [null, undefined, "x", "###", t.slice(0, 100), 42, {}].forEach(function(bad){ var l = K.dekodiere(bad, 2048), s = 0; gleich(l.length, b.length, "Länge bei " + bad); for(var j = 0; j < l.length; j++) s += l[j]; gleich(s, 0, "leer bei " + bad); });
});
test("Karte: Planeten gleicher Id aber anderem Seed sind getrennt, höchstens 6 Planeten je Figur (#169)", function(){
  var K = SC.Karte, e = {}, a = K.fuerPlanet(e, KP); K.markiere(a, 2048, [100, 60, 100], 16); K.speichereFuerPlanet(e, KP, a);
  var q = K.fuerPlanet(e, KQ); gleich(K.istErkundet(q, 2048, 12, 12), false, "anderer Seed zeigt nichts"); wahr(K.istErkundet(K.fuerPlanet(e, KP), 2048, 12, 12), "eigener Seed zeigt es");
  for(var i = 1; i <= 7; i++){ var p = { seed: 1000 + i, groesse: 2048 }, bb = K.fuerPlanet(e, p); K.markiere(bb, 2048, [10, 60, 10], 8); K.speichereFuerPlanet(e, p, bb); }
  var seeds = Object.keys(e).filter(function(k){ return k !== "__zuletzt"; }); gleich(seeds.length, 6, "höchstens 6 Planeten"); gleich(e["111"], undefined, "der am längsten nicht besuchte ist raus"); wahr(e["1007"], "der neueste bleibt");
});
test("Karte: Spielstand ohne erkundet lädt mit leerer Karte, Figur trägt erkundet (#169)", function(){
  wahr(SC.Spielstand.FIGUR_FELDER.indexOf("erkundet") >= 0, "Figurfeld");
  var d = SC.Spielstand.neu({ name: "t", seedText: "k", modus: "kreativ" }); wahr(d.spieler.erkundet && typeof d.spieler.erkundet === "object", "neue Welt");
  [undefined, null, 5, []].forEach(function(bad){ var alt = JSON.parse(JSON.stringify(d)); if(bad === undefined) delete alt.spieler.erkundet; else alt.spieler.erkundet = bad; SC.Spielstand.migriere(alt); var g = alt;
    wahr(g.spieler.erkundet && typeof g.spieler.erkundet === "object" && !Array.isArray(g.spieler.erkundet), "Standardwert bei " + JSON.stringify(bad)); });
  d.spieler.erkundet = { "9": "AA" }; gleich(SC.Spielstand.figur(d).erkundet["9"], "AA", "Figur enthält erkundet");
});
function kaGen(id, seed){ var p = new SC.Planet({ id: id, seed: seed || 4711, palette: id === "glutfrost" ? "glutfrost" : "start" }); return { p: p, g: new SC.Generator(p) }; }
function kaHell(c){ return c[0] + c[1] + c[2]; }
function kaSuche(u, bed, von){ for(var fz = von || 0; fz < 256; fz += 3) for(var fx = 0; fx < 256; fx += 3){ var m = u.g.biom(fx * 8 + 4, fz * 8 + 4); if(bed(m, u.g.hoehe(fx * 8 + 4, fz * 8 + 4))) return [fx, fz]; } return null; }
test("Karte: Farbe eines Felds aus dem Generator – Meer blau, Berg heller als Ebene, deterministisch, Unerkundetes dunkel (#169)", function(){
  var u = kaGen("start"), K = SC.Karte, see = kaSuche(u, function(b){ return b === "see"; }), berg = kaSuche(u, function(b){ return b === "berge"; }), wiese = kaSuche(u, function(b){ return b === "wiese"; });
  wahr(see && wiese, "Gelände mit Meer und Wiese gefunden"); var cs = K.farbe(u.g, u.p, see[0], see[1]); wahr(cs[2] > cs[0], "Meer ist bläulich: " + cs);
  var cw = K.farbe(u.g, u.p, wiese[0], wiese[1]); wahr(cw[1] > cw[2], "Wiese ist grünlich: " + cw);
  if(berg) wahr(kaHell(K.farbe(u.g, u.p, berg[0], berg[1])) > kaHell(cw), "Berg heller als Wiese");
  gleich(JSON.stringify(K.farbe(u.g, u.p, see[0], see[1])), JSON.stringify(cs), "deterministisch");
  [cs, cw].forEach(function(c){ wahr(kaHell(c) > kaHell(K.UNERKUNDET) + 60, "Feld heller als Unerkundet: " + c); });
});
test("Karte: Lava ist orange (Glutfrost) (#169)", function(){
  var u = kaGen("glutfrost"), lava = kaSuche(u, function(b){ return b === "lavasee"; }); if(!lava) return;   // Seed ohne Lavasee im Raster: nichts zu prüfen
  var c = SC.Karte.farbe(u.g, u.p, lava[0], lava[1]); wahr(c[0] > c[2] + 60 && c[0] > 150, "orange: " + c);
});
