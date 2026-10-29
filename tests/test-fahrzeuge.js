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
