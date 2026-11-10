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
test("Karte: Ansicht – Welt ↔ Bild rund umkehrbar, auch an der Weltkante; Zoom hält den Punkt unter dem Finger; Zu mir zentriert (#169)", function(){
  var A = new SC.Karte.Ansicht(2048, 400, 300); A.mitte = [2040, 5]; A.zoom = 2;
  [[2040, 5], [2047, 2040], [6, 20], [1990, 2040]].forEach(function(p){ var b = A.zuBild(p[0], p[1]), w = A.zuWelt(b[0], b[1]);
    wahr(Math.abs(SC.mod(w[0] - p[0] + 1024, 2048) - 1024) < 1e-6 && Math.abs(SC.mod(w[1] - p[1] + 1024, 2048) - 1024) < 1e-6, "Roundtrip " + p); });
  var b0 = A.zuBild(2047, 3); wahr(b0[0] > 200 - 20 && b0[0] < 200 + 20, "Punkt links der Naht liegt nahe der Mitte: " + b0);
  var vor = A.zuWelt(100, 80); A.zoomen(2, 100, 80); var nach = A.zuWelt(100, 80); wahr(Math.abs(SC.mod(nach[0] - vor[0] + 1024, 2048) - 1024) < 1e-6 && Math.abs(SC.mod(nach[1] - vor[1] + 1024, 2048) - 1024) < 1e-6, "Punkt bleibt unter dem Finger");
  A.zoomen(1e6, 200, 150); wahr(A.zoom <= 400 / 128 + 1e-9, "Zoom nach oben begrenzt (128 Blöcke breit): " + A.zoom); A.zoomen(1e-9, 200, 150); wahr(A.zoom >= 300 / 2048 - 1e-9, "Zoom nach unten: ganzer Planet: " + A.zoom);
  A.zuMir([500.5, 60, 700.2]); wahr(Math.abs(A.mitte[0] - 500.5) < 1e-9 && Math.abs(A.mitte[1] - 700.2) < 1e-9, "Zu mir zentriert");
  A.verschieben(-100, 0); wahr(A.mitte[0] > 500.5, "Ziehen nach links schiebt die Karte nach rechts"); A.mitte = [1, 1]; A.verschieben(10, 0); wahr(A.mitte[0] >= 0 && A.mitte[0] < 2048, "Mitte bleibt im Ring");
});
test("Karte: punkte – Mitspieler nur vom gleichen Planeten, ohne Position keine (#169)", function(){
  var l = [{ id: "a", name: "A", pos: [1, 2, 3], planet: "start" }, { id: "b", name: "B", pos: [4, 5, 6], planet: "glutfrost" }, { id: "c", name: "C", pos: null }, { id: "d", name: "D", pos: [7, 8, 9] }];
  var p = SC.Karte.punkte(l, "start"); gleich(p.map(function(x){ return x.id; }).join(), "a,d", "gleicher Planet oder ohne Angabe");
});
test("Karte: zeichne – Unerkundetes dunkel, Erkundetes in Feldfarbe, Mitspieler als Punkt (#169)", function(){
  var u = kaGen("start"), K = SC.Karte, bits = K.neu(2048); K.markiere(bits, 2048, [1000, 60, 1000], 24);
  var cv = document.createElement("canvas"); cv.width = 120; cv.height = 120; var ctx = cv.getContext("2d"), A = new K.Ansicht(2048, 120, 120); A.mitte = [1000, 1000]; A.zoom = 1;
  K.zeichne(ctx, A, { planet: u.p, gen: u.g, bits: bits, ich: null, punkte: [], bett: null, cache: {} });
  function px(x, y){ var d = ctx.getImageData(x, y, 1, 1).data; return [d[0], d[1], d[2]]; }
  gleich(JSON.stringify(px(2, 2)), JSON.stringify(K.UNERKUNDET), "Ecke unerkundet");
  var f = K.feldVon(2048, 1000, 1000), soll = K.farbe(u.g, u.p, f.fx, f.fz); gleich(JSON.stringify(px(60, 60)), JSON.stringify(soll), "Mitte in Feldfarbe");
  K.zeichne(ctx, A, { planet: u.p, gen: u.g, bits: bits, ich: { pos: [1000, 60, 1000], blick: [0, 0] }, punkte: [{ id: "x", name: "Ben", farbe: "#ff0000", pos: [1010, 60, 1000] }], bett: [990, 1000], cache: {} });
  var rot = false; for(var x = 66; x <= 74 && !rot; x++) for(var y = 56; y <= 64; y++){ var c = px(x, y); if(c[0] > 200 && c[1] < 80 && c[2] < 80) rot = true; } wahr(rot, "roter Punkt bei x = 1010");
});
function kaSpiel(extra){
  var p = new SC.Planet({ id: "start", seed: 4711 }), f = { daten: { aktuellerPlanet: "start", spieler: { erkundet: {}, bett: null } }, welt: { planet: p }, spieler: { pos: [1000.5, 60, 1000.5], blick: [0, 0], auswahl: 0, modus: "survival", schnellleiste: [SC.B.KARTE, 0, 0, 0, 0, 0, 0, 0, 0] },
    render: { sichtweite: 10 }, all: false, kampf: { rucksack: { plaetze: [{ block: SC.B.KARTE, anzahl: 1 }] } }, eingabe: { gebeMausFrei: function(){} }, geoeffnet: [], _weiter: function(){},
    ui: { zeigeKarte: function(d, o){ f.geoeffnet.push(d); } }, _mitspielerListe: function(){ return []; } };
  Object.assign(f, extra || {}); f._erkunden = SC.Spiel.prototype._erkunden; f._erkundetBits = SC.Spiel.prototype._erkundetBits; f._karte = SC.Spiel.prototype._karte; f._karteBett = SC.Spiel.prototype._karteBett; return f;
}
test("Karte im Spiel: _erkunden schreibt je Planeten-Seed, rechnet nur bei Feldwechsel neu, nicht im All (#169)", function(){
  var s = kaSpiel(), K = SC.Karte, e = s.daten.spieler.erkundet;
  s._erkunden(); wahr(e["4711"], "unter dem Seed gespeichert"); wahr(K.istErkundet(K.dekodiere(e["4711"], 2048), 2048, 125, 125), "Feld unter dem Spieler");
  var vor = e["4711"]; s.spieler.pos = [1002, 60, 1002]; s._erkunden(); gleich(e["4711"], vor, "gleiches Feld: nichts geschrieben"); gleich(s._erkundeteFelder, 1, "nur einmal gerechnet");
  s.spieler.pos = [1030, 60, 1000]; s._erkunden(); wahr(e["4711"] !== vor, "neues Feld: fortgeschrieben");
  var a = kaSpiel({ all: true }); a._erkunden(); gleich(Object.keys(a.daten.spieler.erkundet).length, 0, "im All nichts");
  var z = kaSpiel(); z.spieler.pos = [3, 60, 2045]; z._erkunden(); wahr(z.daten.spieler.erkundet["4711"], "an der Weltkante ohne Fehler");
  var q = kaSpiel(); q.daten.spieler.erkundet = null; q._erkunden(); wahr(q.daten.spieler.erkundet && q.daten.spieler.erkundet["4711"], "kaputtes Feld wird ersetzt");
  var wechsel = kaSpiel(); wechsel._erkunden(); wechsel.welt = { planet: new SC.Planet({ id: "glutfrost", seed: 99, palette: "glutfrost" }) }; wechsel._erkunden();
  wahr(wechsel.daten.spieler.erkundet["99"] && wechsel.daten.spieler.erkundet["4711"], "Planetenwechsel: beide getrennt");
});
test("Karte im Spiel: _karte öffnet nur mit Karte in der Hand, zeigt Mitspieler und Bett (#169)", function(){
  var s = kaSpiel(); gleich(s._karte(), true, "Survival: Karte in der Hand"); gleich(s.geoeffnet.length, 1); var d = s.geoeffnet[0];
  gleich(d.name, "start"); wahr(d.gen && d.bits() && d.ich().pos, "Daten für die Karte"); gleich(d.bett(), null, "ohne Bett");
  s.daten.spieler.bett = { planet: "start", x: 10, y: 60, z: 20 }; gleich(JSON.stringify(s._karteBett()), JSON.stringify([10.5, 20.5]), "Bett als Symbol");
  s.daten.spieler.bett = { planet: "glutfrost", x: 10, y: 60, z: 20 }; gleich(s._karteBett(), null, "Bett auf anderem Planeten");
  var l = kaSpiel({ kampf: { rucksack: { plaetze: [{ block: SC.B.STEIN, anzahl: 3 }] } } }); gleich(l._karte(), false, "andere Sache in der Hand"); gleich(l.geoeffnet.length, 0);
  var k = kaSpiel(); k.spieler.modus = "kreativ"; k.spieler.schnellleiste[0] = SC.B.KARTE; gleich(k._karte(), true, "Kreativ: Karte in der Leiste");
  var k2 = kaSpiel(); k2.spieler.modus = "kreativ"; k2.spieler.schnellleiste[0] = SC.B.STEIN; gleich(k2._karte(), false, "Kreativ: Stein");
  var im = kaSpiel({ all: true }); gleich(im._karte(), false, "im All keine Karte");
});
test("Anleitung erklärt die Karte, ANLEITUNG.md enthält denselben Satz (#169)", function(){
  var sp = SC.T.anleitung.abschnitte.reduce(function(a, x){ return a.concat(x[1]); }, []).filter(function(t){ return t.indexOf("Die Karte baust du") >= 0; })[0];
  wahr(sp && sp.indexOf("immer mit") >= 0 && sp.indexOf("dunkel") >= 0, "Satz in SC.T.anleitung");
  var req = new XMLHttpRequest(); req.open("GET", "../docs/ANLEITUNG.md", false); try { req.send(); } catch(e){ return; }
  if(req.status === 200 || req.responseText) wahr(req.responseText.indexOf(sp) >= 0, "ANLEITUNG.md enthält denselben Satz");
});
