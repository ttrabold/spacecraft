// Fahrzeuge (Stufe 4): Werte, Physik, Sitze, Fundorte, Panzerung
// Kleine Testwelt ohne Generator: Boden bis y = 59 (Stein), darüber Luft; Zusatzblöcke über setze(x, y, z, id)
function fzWelt(o){
  o = o || {};
  var extra = {}, w = { planet: { groesse: 2048, id: "start" }, fahrzeuge: new Map(), wesen: new Map(), naechsteId: 1 };
  w.holeBlock = function(x, y, z){
    x = SC.mod(Math.floor(x), 2048); y = Math.floor(y); z = SC.mod(Math.floor(z), 2048);
    var k = x + "," + y + "," + z; if(k in extra) return extra[k];
    if(o.wasser && x >= o.wasser[0] && x < o.wasser[1] && y >= 55 && y < 60) return SC.B.WASSER;
    return y < 60 ? SC.B.STEIN : SC.B.LUFT;
  };
  w.setze = function(x, y, z, id){ extra[SC.mod(x, 2048) + "," + y + "," + SC.mod(z, 2048)] = id; };
  return w;
}
// Läuft n Sekunden in Schritten von 1/60 s
function fzLauf(w, f, e, s){ for(var i = 0; i < Math.round(s * 60); i++) SC.Fahrzeug.schritt(w, f, e, 1 / 60); }
function fzTempo(f){ return Math.hypot(f.geschw[0], f.geschw[2]); }
// Steckt die Grundfläche (Ecken und Mitte, unten und oben) in einem festen Block?
function fzImBlock(w, f){
  var d = SC.FAHRZEUGE[f.art], hb = d.breite / 2 - 0.01, im = false;
  [-hb, 0, hb].forEach(function(dx){ [-hb, 0, hb].forEach(function(dz){ [0.01, d.hoehe - 0.01].forEach(function(dy){
    var b = SC.BLOECKE[w.holeBlock(f.pos[0] + dx, f.pos[1] + dy, f.pos[2] + dz)]; if(b && b.fest) im = true; }); }); });
  return im;
}

test("Fahrzeug: neu hat volle Panzerung und vier leere Sitze", function(){
  var w = new SC.Welt(new SC.Planet({ id: "start", seed: 1234 })), f = SC.Fahrzeug.neu(w, "buggy", [10, 80, 10], 0);
  gleich(f.panzerung, SC.FAHRZEUGE.buggy.panzerung); gleich(JSON.stringify(f.sitze), "[null,null,null,null]"); wahr(w.fahrzeuge.get(f.id) === f, "in welt.fahrzeuge");
  wahr(/^frei-/.test(f.id), "freie ID"); gleich(f.weg, false); gleich(f.fundort, null);
  var g = SC.Fahrzeug.neu(w, "flieger", [0, 80, 0], 1, { id: "start", fundort: "start", heim: [0, 80, 0] }); gleich(g.id, "start"); gleich(g.fundort, "start");
  ["gleiter", "buggy", "flieger"].forEach(function(a){ var d = SC.FAHRZEUGE[a]; wahr(d.name && d.name.length > 2, "Name " + a); gleich(d.sitze.length, 4); wahr(d.modell.length >= 8, "Modell " + a); });
  gleich(SC.FAHRZEUGE.gleiter.geschuetz, null); wahr(SC.FAHRZEUGE.buggy.geschuetz.schaden > 0);
});

test("Fahrzeug: Gas beschleunigt bis Höchsttempo, ohne Gas rollt es aus", function(){
  ["gleiter", "buggy", "flieger"].forEach(function(a){
    var w = fzWelt(), f = SC.Fahrzeug.neu(w, a, [20, 60.6, 20], 0);
    fzLauf(w, f, { vor: true }, 3); var v = fzTempo(f), soll = SC.FAHRZEUGE[a].tempo;
    wahr(Math.abs(v - soll) <= soll * 0.05, a + ": Tempo " + v + " statt " + soll);
    fzLauf(w, f, {}, 3); wahr(fzTempo(f) < 1, a + ": rollt aus, noch " + fzTempo(f));
  });
});

test("Fahrzeug: Lenken dreht blick", function(){
  var w = fzWelt(), f = SC.Fahrzeug.neu(w, "gleiter", [20, 60.6, 20], 0);
  SC.Fahrzeug.schritt(w, f, { links: true }, 0.5); gleich(f.blick, 0, "im Stand keine Drehung");
  fzLauf(w, f, { vor: true }, 2); var b0 = f.blick;
  fzLauf(w, f, { vor: true, links: true }, 1);
  wahr(Math.abs(f.blick - b0 - SC.FAHRZEUGE.gleiter.lenk) < 0.1, "Drehung " + (f.blick - b0));
  fzLauf(w, f, { vor: true, rechts: true }, 1); wahr(Math.abs(f.blick - b0) < 0.1, "rechts dreht zurück");
});

test("Fahrzeug: Gleiter schwebt über Wasser", function(){
  var w = fzWelt({ wasser: [0, 4096] }), f = SC.Fahrzeug.neu(w, "gleiter", [20, 63, 20], 0);
  fzLauf(w, f, { vor: true }, 3);
  wahr(f.pos[1] >= 60.5, "über dem Wasser: " + f.pos[1]); wahr(f.pos[1] < 61.5, "nicht zu hoch: " + f.pos[1]);
  var b = SC.Fahrzeug.neu(w, "buggy", [40, 63, 40], 0); fzLauf(w, b, {}, 3); wahr(b.pos[1] < 60, "Buggy sinkt im Wasser");
});

test("Fahrzeug: Buggy nimmt Stufe von 1 Block, nicht von 2", function(){
  var w = fzWelt(); for(var z = 0; z < 40; z++) for(var x = 0; x < 40; x++) w.setze(x, 60, z, SC.B.STEIN); // Stufe 1 ab z < 40 (vor dem Fahrzeug, Blick -z)
  var f = SC.Fahrzeug.neu(w, "buggy", [20, 60, 50], 0); fzLauf(w, f, { vor: true }, 3);
  wahr(f.pos[2] < 38, "über die Stufe gekommen: z " + f.pos[2]); wahr(f.pos[1] >= 60.99, "oben: y " + f.pos[1]);
  var w2 = fzWelt(); for(var z2 = 0; z2 < 40; z2++) for(var x2 = 0; x2 < 40; x2++){ w2.setze(x2, 60, z2, SC.B.STEIN); w2.setze(x2, 61, z2, SC.B.STEIN); }
  var g = SC.Fahrzeug.neu(w2, "buggy", [20, 60, 50], 0); fzLauf(w2, g, { vor: true }, 3);
  wahr(g.pos[2] >= 40 + SC.FAHRZEUGE.buggy.breite / 2 - 0.01, "vor der Wand: z " + g.pos[2]); wahr(g.pos[1] < 60.01, "unten");
});

test("Fahrzeug: Flieger steigt, sinkt, bleibt stehen, nie über maxHoehe", function(){
  var w = fzWelt(), f = SC.Fahrzeug.neu(w, "flieger", [20, 60, 20], 0), max = SC.FAHRZEUGE.flieger.maxHoehe;
  fzLauf(w, f, { hoch: true }, 2); var y = f.pos[1]; wahr(y > 65, "steigt: " + y);
  fzLauf(w, f, {}, 2); wahr(Math.abs(f.pos[1] - y) < 0.05, "bleibt stehen: " + f.pos[1]);
  fzLauf(w, f, { runter: true }, 1); wahr(f.pos[1] < y - 2, "sinkt");
  fzLauf(w, f, { hoch: true }, 30); wahr(f.pos[1] <= max, "Höhengrenze: " + f.pos[1]); wahr(f.pos[1] > max - 1, "erreicht Grenze");
  fzLauf(w, f, null, 40); wahr(Math.abs(f.pos[1] - 60) < 0.01, "ohne Fahrer gelandet: " + f.pos[1]); wahr(!fzImBlock(w, f), "nicht im Block");
});

test("Fahrzeug: fährt nie in Blöcke", function(){
  ["gleiter", "buggy", "flieger"].forEach(function(a){
    var w = fzWelt(); for(var x = 0; x < 40; x++) for(var y = 60; y < 66; y++) w.setze(x, y, 10, SC.B.STEIN);
    var f = SC.Fahrzeug.neu(w, a, [20, 60.6, 20], 0); fzLauf(w, f, { vor: true }, 5);
    wahr(!fzImBlock(w, f), a + " steckt im Block bei " + f.pos.map(function(v){ return v.toFixed(2); }));
    wahr(f.pos[2] > 10, a + " durch die Wand");
    var g = SC.Fahrzeug.neu(w, a, [20, 60.6, 20], 0.7); fzLauf(w, g, { vor: true, links: true }, 5); wahr(!fzImBlock(w, g), a + " schräg im Block");
  });
});

test("Fahrzeug: über die Ringgrenze", function(){
  var w = fzWelt(), f = SC.Fahrzeug.neu(w, "gleiter", [20, 60.6, 2], 0); fzLauf(w, f, { vor: true }, 1);
  wahr(f.pos[2] >= 0 && f.pos[2] < 2048 && f.pos[2] > 2000, "umgeschlagen: " + f.pos[2]);
});

// --- Sitze, Ein- und Aussteigen ---
function fzKoerperFrei(w, p){
  var hb = SC.PHYSIK.breite / 2 - 0.01, frei = true;
  [-hb, hb].forEach(function(dx){ [-hb, hb].forEach(function(dz){ [0.01, 0.9, SC.PHYSIK.hoehe - 0.01].forEach(function(dy){
    var b = SC.BLOECKE[w.holeBlock(p[0] + dx, p[1] + dy, p[2] + dz)]; if(b && b.fest) frei = false; }); }); });
  return frei;
}
test("Sitze: erster wird Fahrer, weitere Mitfahrer, fünfter passt nicht", function(){
  var w = fzWelt(), f = SC.Fahrzeug.neu(w, "gleiter", [20, 60.6, 20], 0);
  gleich(SC.Fahrzeug.einsteigen(f, "a"), 0); gleich(SC.Fahrzeug.einsteigen(f, "b"), 1); gleich(SC.Fahrzeug.einsteigen(f, "c"), 2); gleich(SC.Fahrzeug.einsteigen(f, "d"), 3);
  gleich(SC.Fahrzeug.einsteigen(f, "e"), -1); gleich(JSON.stringify(f.sitze), '["a","b","c","d"]');
  var s = SC.Fahrzeug.sitzVon(w, "c"); wahr(s && s.f === f && s.sitz === 2, "sitzVon"); gleich(SC.Fahrzeug.sitzVon(w, "e"), null);
});
test("Sitze: Platz wechseln geht reihum zum nächsten freien Sitz (#86)", function(){
  var w = fzWelt(), f = SC.Fahrzeug.neu(w, "gleiter", [20, 60.6, 20], 0);
  gleich(SC.Fahrzeug.platzWechseln(f, "a"), -1, "nicht drin");
  SC.Fahrzeug.einsteigen(f, "a"); SC.Fahrzeug.einsteigen(f, "b"); SC.Fahrzeug.einsteigen(f, "c");
  gleich(SC.Fahrzeug.platzWechseln(f, "a"), 3); gleich(JSON.stringify(f.sitze), '[null,"b","c","a"]');
  gleich(SC.Fahrzeug.platzWechseln(f, "b"), 0, "reihum, auch auf den freien Fahrersitz"); gleich(JSON.stringify(f.sitze), '["b",null,"c","a"]');
  SC.Fahrzeug.einsteigen(f, "d"); gleich(SC.Fahrzeug.platzWechseln(f, "c"), -1, "voll"); gleich(JSON.stringify(f.sitze), '["b","d","c","a"]');
});
test("Sitze: Fahrer steigt aus, niemand rückt nach", function(){
  var w = fzWelt(), f = SC.Fahrzeug.neu(w, "buggy", [20, 60, 20], 0);
  SC.Fahrzeug.einsteigen(f, "a"); SC.Fahrzeug.einsteigen(f, "b");
  gleich(SC.Fahrzeug.aussteigen(f, "a"), true); gleich(f.sitze[0], null); gleich(f.sitze[1], "b"); gleich(SC.Fahrzeug.aussteigen(f, "a"), false);
  gleich(SC.Fahrzeug.einsteigen(f, "e"), 0, "neuer Einsteiger fährt");
});
test("Sitze: Doppeltes Einsteigen ändert nichts", function(){
  var w = fzWelt(), f = SC.Fahrzeug.neu(w, "flieger", [20, 60, 20], 0);
  SC.Fahrzeug.einsteigen(f, "x"); gleich(SC.Fahrzeug.einsteigen(f, "a"), 1); gleich(SC.Fahrzeug.einsteigen(f, "a"), 1);
  gleich(f.sitze.filter(function(s){ return s === "a"; }).length, 1);
});
test("Sitze: sitzPos dreht mit blick", function(){
  var w = fzWelt(), f = SC.Fahrzeug.neu(w, "gleiter", [100, 60.6, 100], 0), o = SC.FAHRZEUGE.gleiter.sitze[0];
  var p0 = SC.Fahrzeug.sitzPos(f, 0, 2048); wahr(Math.abs(p0[0] - (100 + o[0])) < 1e-6 && Math.abs(p0[2] - (100 + o[2])) < 1e-6, "blick 0"); wahr(Math.abs(p0[1] - (60.6 + o[1])) < 1e-6, "Höhe");
  f.blick = Math.PI / 2; var p1 = SC.Fahrzeug.sitzPos(f, 0, 2048);
  // vorn zeigt jetzt nach -x: lokales z (vorn = -z) wird zu x, lokales x zu -z
  wahr(Math.abs(p1[0] - (100 + o[2])) < 1e-6 && Math.abs(p1[2] - (100 - o[0])) < 1e-6, "gedreht: " + p1);
  f.pos = [0.1, 60.6, 0.1]; f.blick = 0; var p2 = SC.Fahrzeug.sitzPos(f, 0, 2048); wahr(p2[0] > 2000, "Ring: " + p2[0]);
});
test("aussteigePos findet freien Platz, nie im Block", function(){
  // Höhle 3×3 Blöcke Grundfläche um das Fahrzeug, 3 hoch
  var w = fzWelt(); for(var x = 14; x < 27; x++) for(var z = 14; z < 27; z++) for(var y = 60; y < 70; y++) if(x < 18 || x > 22 || z < 18 || z > 22 || y > 62) w.setze(x, y, z, SC.B.STEIN);
  var f = SC.Fahrzeug.neu(w, "gleiter", [20.5, 60, 20.5], 0);
  for(var s = 0; s < 4; s++){ var p = SC.Fahrzeug.aussteigePos(w, f, s); wahr(fzKoerperFrei(w, p), "Höhle Sitz " + s + ": " + p); }
  // An einer Wand: links neben dem Fahrzeug Stein
  var w2 = fzWelt(); for(var z2 = 0; z2 < 40; z2++) for(var y2 = 60; y2 < 64; y2++) w2.setze(18, y2, z2, SC.B.STEIN);
  var g = SC.Fahrzeug.neu(w2, "buggy", [20.4, 60, 20], 0), pg = SC.Fahrzeug.aussteigePos(w2, g, 0); wahr(fzKoerperFrei(w2, pg), "Wand: " + pg);
  // Über Wasser und hoch in der Luft: frei, auch wenn man fällt oder schwimmt
  var w3 = fzWelt({ wasser: [0, 4096] }), h = SC.Fahrzeug.neu(w3, "gleiter", [20, 60.6, 20], 0); wahr(fzKoerperFrei(w3, SC.Fahrzeug.aussteigePos(w3, h, 1)), "Wasser");
  var k = SC.Fahrzeug.neu(w, "flieger", [100, 110, 100], 0), pk = SC.Fahrzeug.aussteigePos(w, k, 0); wahr(fzKoerperFrei(w, pk), "Luft"); wahr(Math.abs(pk[1] - 110) < 2, "in Fahrzeughöhe");
  // Ganz eingemauert: obenauf
  var w4 = fzWelt(); for(var x4 = 10; x4 < 31; x4++) for(var z4 = 10; z4 < 31; z4++) for(var y4 = 60; y4 < 64; y4++) if(Math.abs(x4 - 20) > 1 || Math.abs(z4 - 20) > 1) w4.setze(x4, y4, z4, SC.B.STEIN);
  var m = SC.Fahrzeug.neu(w4, "gleiter", [20.5, 60, 20.5], 0), pm = SC.Fahrzeug.aussteigePos(w4, m, 0); wahr(fzKoerperFrei(w4, pm), "eingemauert: " + pm);
});
test("naechstes: findet nur in Reichweite, nicht verpuffte, über die Ringgrenze", function(){
  var w = fzWelt(), f = SC.Fahrzeug.neu(w, "gleiter", [2047, 60.6, 10], 0);
  gleich(SC.Fahrzeug.naechstes(w, [1, 60, 10]), f, "über die Grenze"); gleich(SC.Fahrzeug.naechstes(w, [10, 60, 10]), null, "zu weit");
  var g = SC.Fahrzeug.neu(w, "buggy", [500, 60, 500], 0); gleich(SC.Fahrzeug.naechstes(w, [503, 60, 500]), g);
  g.weg = true; gleich(SC.Fahrzeug.naechstes(w, [503, 60, 500]), null, "verpufft");
  gleich(SC.Fahrzeug.naechstes(w, [1, 80, 10]), null, "weit darüber");
});

// --- Fundorte, Start-Gleiter, Speichern ---
function fzEchteWelt(seed){ return new SC.Welt(new SC.Planet({ id: "start", seed: seed || 1234 })); }
function fzBauwerkMitFundort(w){ for(var r = 0; r < 16; r++){ var l = SC.Bauwerke.inRegion(w.planet, r, 0).filter(function(b){ return SC.Fahrzeug.FUNDORT_ART[b.typ]; }); if(l.length) return l[0]; } return null; }
test("Fundort liefert genau einmal", function(){
  var w = fzEchteWelt(), b = fzBauwerkMitFundort(w), pos = [b.x, 80, b.z];
  SC.Fahrzeug.fundorteNah(w, pos); SC.Fahrzeug.fundorteNah(w, pos);
  var f = w.fahrzeuge.get(b.schluessel); wahr(f, "Fahrzeug am Bauwerk"); gleich(f.art, SC.Fahrzeug.FUNDORT_ART[b.typ]); gleich(f.fundort, b.schluessel);
  var n = 0; w.fahrzeuge.forEach(function(x){ if(x.fundort === b.schluessel) n++; }); gleich(n, 1);
  f.pos = [SC.mod(b.x + 300, 2048), 90, b.z]; SC.Fahrzeug.fundorteNah(w, pos); n = 0; w.fahrzeuge.forEach(function(x){ if(x.fundort === b.schluessel) n++; }); gleich(n, 1, "weggefahren: kein zweites");
  var leer = fzEchteWelt(); SC.Fahrzeug.fundorteNah(leer, [SC.mod(b.x + 1000, 2048), 80, SC.mod(b.z + 1000, 2048)]); gleich(leer.fahrzeuge.has(b.schluessel), false, "nur in der Nähe");
});
test("Fundorte sind deterministisch und passen zur Bauwerksart", function(){
  var a = fzEchteWelt(77), c = fzEchteWelt(77), b = fzBauwerkMitFundort(a);
  SC.Fahrzeug.fundorteNah(a, [b.x, 80, b.z]); SC.Fahrzeug.fundorteNah(c, [b.x, 80, b.z]);
  var fa = a.fahrzeuge.get(b.schluessel), fc = c.fahrzeuge.get(b.schluessel); gleich(JSON.stringify(fa.pos), JSON.stringify(fc.pos)); gleich(fa.art, fc.art);
  gleich(SC.Fahrzeug.FUNDORT_ART.lager, "buggy"); gleich(SC.Fahrzeug.FUNDORT_ART.station, "flieger"); gleich(SC.Fahrzeug.FUNDORT_ART.herrenhaus, "gleiter"); gleich(SC.Fahrzeug.FUNDORT_ART.dungeon, undefined);
  wahr(!fzImBlock(a, fa), "steht frei"); wahr(JSON.stringify(fa.heim) === JSON.stringify(fa.pos), "heim = Fundort");
});
test("Start-Gleiter nur einmal", function(){
  var w = fzEchteWelt(), sp = SC.Spiel.startpunkt(w.planet);
  SC.Fahrzeug.sichereStart(w, sp); SC.Fahrzeug.sichereStart(w, sp); SC.Fahrzeug.sichereStart(w, sp);
  var n = 0; w.fahrzeuge.forEach(function(){ n++; }); gleich(n, 1); var f = w.fahrzeuge.get("start"); gleich(f.art, "gleiter"); gleich(f.fundort, "start");
  var d = Math.hypot(f.pos[0] - sp[0], f.pos[2] - sp[2]); wahr(d >= 6 && d <= 10.5, "Abstand " + d); wahr(!fzImBlock(w, f), "frei");
  var unter = SC.BLOECKE[w.holeBlock(f.pos[0], Math.floor(f.pos[1] - SC.FAHRZEUGE.gleiter.schwebt) - 1, f.pos[2])]; wahr(unter.fest && unter.id !== SC.B.WASSER, "auf festem Boden");
});
test("Speichern und Laden behält Lage, Panzerung, Verpuffen", function(){
  var w = fzWelt(), f = SC.Fahrzeug.neu(w, "flieger", [5, 70, 6], 1.2, { id: "station@0,0", fundort: "station@0,0", heim: [5, 61, 6] });
  f.panzerung = 33; f.weg = true; f.wiederBei = 500; SC.Fahrzeug.einsteigen(f, "a"); var g = SC.Fahrzeug.neu(w, "buggy", [9, 61, 9], 0);
  var daten = JSON.parse(JSON.stringify(SC.Fahrzeug.inDaten(w))), w2 = fzWelt(); SC.Fahrzeug.ausDaten(w2, daten);
  var f2 = w2.fahrzeuge.get("station@0,0"); gleich(f2.art, "flieger"); gleich(JSON.stringify(f2.pos), "[5,70,6]"); gleich(f2.blick, 1.2); gleich(f2.panzerung, 33); gleich(f2.weg, true); gleich(f2.wiederBei, 500);
  gleich(JSON.stringify(f2.heim), "[5,61,6]"); gleich(JSON.stringify(f2.sitze), "[null,null,null,null]", "Sitze leer"); wahr(w2.fahrzeuge.get(g.id), "freies Fahrzeug");
});
test("Wiederkehr nach 120 s", function(){
  var w = fzWelt(), f = SC.Fahrzeug.neu(w, "buggy", [50, 61, 50], 0.4, { id: "lager@0,0", fundort: "lager@0,0", heim: [5, 60, 6] });
  f.panzerung = 0; f.weg = true; f.wiederBei = 120;
  SC.Fahrzeug.wiederkehr(w, 119); gleich(f.weg, true);
  SC.Fahrzeug.wiederkehr(w, 120); gleich(f.weg, false); gleich(JSON.stringify(f.pos), "[5,60,6]"); gleich(f.panzerung, SC.FAHRZEUGE.buggy.panzerung); gleich(f.wiederBei, null); gleich(f.blick, 0);
});
test("Spiel: neue Welt hat Start-Gleiter, Fundorte im Takt, Speichern und Laden behält Fahrzeuge", function(){
  var sl = mspSlots(), s = mspSpielVoll(sl), d = SC.Spielstand.neu({ name: "F", seedText: "fz", modus: "survival", figurName: "Mia" });
  s.starte(d); wahr(s.welt.fahrzeuge.get("start"), "Start-Gleiter");
  var b = fzBauwerkMitFundort(s.welt); s.spieler.pos = [b.x, 90, b.z]; s._fahrzeugTakt(1.1); wahr(s.welt.fahrzeuge.get(b.schluessel), "Fundort im Takt");
  s.welt.fahrzeuge.get("start").panzerung = 7;
  return s.speichere("test").then(function(){
    var s2 = mspSpielVoll(sl); return sl.lade(d.id).then(function(d2){ s2.starte(d2); gleich(s2.welt.fahrzeuge.get("start").panzerung, 7); wahr(s2.welt.fahrzeuge.get(b.schluessel), "Fundort-Fahrzeug geladen"); var n = 0; s2.welt.fahrzeuge.forEach(function(f){ if(f.fundort === "start") n++; }); gleich(n, 1); });
  });
});
test("Fahrzeug: fährt durch Laub, Stämme halten auf", function(){
  var w = fzWelt(); for(var x = 0; x < 40; x++) for(var y = 60; y < 64; y++) w.setze(x, y, 10, SC.B.BLAETTER);
  var f = SC.Fahrzeug.neu(w, "buggy", [20, 60, 20], 0); fzLauf(w, f, { vor: true }, 3); wahr(f.pos[2] < 9 || f.pos[2] > 2000, "durchs Laub: " + f.pos[2]); gleich(w.holeBlock(20, 61, 10), SC.B.BLAETTER, "Laub bleibt");
  var w2 = fzWelt(); for(var x2 = 0; x2 < 40; x2++) for(var y2 = 60; y2 < 64; y2++) w2.setze(x2, y2, 10, SC.B.STAMM);
  var g = SC.Fahrzeug.neu(w2, "buggy", [20, 60, 20], 0); fzLauf(w2, g, { vor: true }, 3); wahr(g.pos[2] > 10, "Stamm hält auf");
});

// --- Panzerung, Verpuffen, Erholung, Rammen ---
test("Panzerung: leer → verpufft, Fundort-Fahrzeug wartet, freies ist weg", function(){
  var w = fzWelt(), f = SC.Fahrzeug.neu(w, "buggy", [20, 60, 20], 0, { id: "lager@0,0", fundort: "lager@0,0", heim: [20, 60, 20] });
  SC.Fahrzeug.einsteigen(f, "a"); SC.Fahrzeug.einsteigen(f, "b");
  var r = SC.Fahrzeug.schaden(w, f, 50, 10); gleich(r.verpufft, false); gleich(f.panzerung, 200); gleich(f.zuletztGetroffen, 10);
  r = SC.Fahrzeug.schaden(w, f, 500, 11); gleich(r.verpufft, true); gleich(JSON.stringify(r.ausgestiegen), '["a","b"]'); gleich(f.weg, true); gleich(f.wiederBei, 131); gleich(f.panzerung, 0);
  gleich(JSON.stringify(f.sitze), "[null,null,null,null]"); wahr(w.fahrzeuge.get(f.id), "bleibt gespeichert");
  gleich(SC.Fahrzeug.schaden(w, f, 5, 12).verpufft, false, "verpufft nur einmal");
  var g = SC.Fahrzeug.neu(w, "gleiter", [40, 60.6, 20], 0); SC.Fahrzeug.schaden(w, g, 999, 1); gleich(w.fahrzeuge.has(g.id), false, "freies ist weg");
});
test("Panzerung: erholt sich nach 8 s ohne Treffer", function(){
  var w = fzWelt(), f = SC.Fahrzeug.neu(w, "gleiter", [20, 60.6, 20], 0); SC.Fahrzeug.schaden(w, f, 40, 100);
  SC.Fahrzeug.erholung(f, 1, 107); gleich(f.panzerung, 80, "zu früh");
  SC.Fahrzeug.erholung(f, 1, 108); gleich(f.panzerung, 84); SC.Fahrzeug.erholung(f, 100, 200); gleich(f.panzerung, 120, "nicht über das Maximum");
});
test("Rammen: Abklingzeit und Boss", function(){
  var w = fzWelt(), f = SC.Fahrzeug.neu(w, "buggy", [20, 60, 20], 0); f.tempo = 10;
  var g = SC.Wesen.neu(w, "gegner", { gegnerArt: "krabbler", pos: [20, 60, 18.6], breite: 0.9, hoehe: 0.8, lp: 100, lpMax: 100 });
  var r = SC.Fahrzeug.rammen(w, f, 0); gleich(r.length, 1); gleich(r[0].gegner, g); gleich(r[0].schaden, 15); gleich(r[0].boss, false); wahr(g.geschw[2] < -4, "weggeschleudert in Fahrtrichtung: " + g.geschw[2]);
  gleich(SC.Fahrzeug.rammen(w, f, 0.3).length, 0, "Abklingzeit"); gleich(SC.Fahrzeug.rammen(w, f, 0.6).length, 1, "danach wieder");
  f.tempo = 3; gleich(SC.Fahrzeug.rammen(w, f, 5).length, 0, "zu langsam");
  var w2 = fzWelt(), b = SC.Fahrzeug.neu(w2, "buggy", [20, 60, 20], 0); b.tempo = 8;
  var boss = SC.Wesen.neu(w2, "gegner", { gegnerArt: "panzerkoloss", pos: [20, 60, 18.4], breite: 1.6, hoehe: 2.6, lp: 900, lpMax: 900, boss: true });
  var rb = SC.Fahrzeug.rammen(w2, b, 0); gleich(rb.length, 1); gleich(rb[0].boss, true); gleich(rb[0].schaden, 0); gleich(b.tempo, -4, "prallt zurück"); gleich(boss.geschw[2], 0, "Boss bleibt stehen");
  var w3 = fzWelt(), c = SC.Fahrzeug.neu(w3, "gleiter", [20, 60.6, 20], 0); c.tempo = 12; SC.Wesen.neu(w3, "gegner", { gegnerArt: "krabbler", pos: [26, 60, 26], breite: 0.9, hoehe: 0.8, lp: 10, lpMax: 10 });
  gleich(SC.Fahrzeug.rammen(w3, c, 0).length, 0, "nur Gegner an der Grundfläche");
});
test("Fundort ohne freien Platz wird nicht jede Sekunde neu durchsucht", function(){
  var w = fzEchteWelt(), b = fzBauwerkMitFundort(w), alt = SC.Fahrzeug.fundortPos, n = 0;
  SC.Fahrzeug.fundortPos = function(){ n++; return null; };
  try{ SC.Fahrzeug.fundorteNah(w, [b.x, 80, b.z]); var erst = n; SC.Fahrzeug.fundorteNah(w, [b.x, 80, b.z]); SC.Fahrzeug.fundorteNah(w, [b.x, 80, b.z]); wahr(erst > 0, "einmal gesucht"); gleich(n, erst, "nicht erneut"); }
  finally{ SC.Fahrzeug.fundortPos = alt; }
});
