// Stufe 6b: selbst gebaute Fahrzeuge (#113–#117)
function bauTest(o){ return Object.assign({ motor: 0, panzerung: 0, waffe: null, farbe: "#e0533a" }, o || {}); }
test("Fahrzeugbau: Farben und Prüfung des Bauplans (#113)", function(){
  gleich(SC.BAU_FARBEN.length, 12); SC.BAU_FARBEN.forEach(function(c){ wahr(/^#[0-9a-f]{6}$/i.test(c), c); });
  var G = SC.Fahrzeug.gueltigeBau;
  gleich(JSON.stringify(G({ motor: 2, panzerung: 3, waffe: { stufe: 1, kristall: "rot" }, farbe: SC.BAU_FARBEN[3] })), JSON.stringify({ motor: 2, panzerung: 3, waffe: { stufe: 1, kristall: "rot" }, farbe: SC.BAU_FARBEN[3] }));
  gleich(G({ motor: 5, panzerung: 0, waffe: null, farbe: SC.BAU_FARBEN[0] }), null, "Stufe zu hoch"); gleich(G({ motor: -1, panzerung: 0, waffe: null, farbe: SC.BAU_FARBEN[0] }), null); gleich(G({ motor: 1.5, panzerung: 0, waffe: null, farbe: SC.BAU_FARBEN[0] }), null, "ganze Zahlen");
  gleich(G({ motor: 0, panzerung: 0, waffe: { stufe: 0, kristall: "pink" }, farbe: SC.BAU_FARBEN[0] }), null, "unbekannter Kristall"); gleich(G({ motor: 0, panzerung: 0, waffe: null, farbe: "#123456" }), null, "Farbe nicht in der Palette");
  gleich(G(null), null); gleich(G("x"), null); gleich(G({ motor: 0, panzerung: 0, farbe: SC.BAU_FARBEN[0] }).waffe, null, "Waffe fehlt = keine");
});
test("Fahrzeugbau: Werte steigen mit den Stufen, Stufe 0 gleicht dem Fund (#113)", function(){
  var B = SC.FAHRZEUGE.buggy, d0 = SC.Fahrzeug.bauDef("buggy", bauTest({ waffe: { stufe: 0, kristall: "rot" } })), d4 = SC.Fahrzeug.bauDef("buggy", bauTest({ motor: 4, panzerung: 4, waffe: { stufe: 4, kristall: "gruen" } }));
  gleich(d0.tempo, B.tempo); gleich(d0.panzerung, B.panzerung); gleich(d0.geschuetz.schaden, B.geschuetz.schaden);
  gleich(Math.round(d4.tempo * 100), Math.round(B.tempo * 1.48 * 100)); gleich(Math.round(d4.panzerung), Math.round(B.panzerung * 2.6)); gleich(Math.round(d4.geschuetz.schaden), Math.round(B.geschuetz.schaden * 2)); gleich(d4.geschuetz.farbe, "#3fe06a", "Strahl in Kristallfarbe");
  gleich(SC.Fahrzeug.bauDef("buggy", bauTest()).geschuetz, null, "ohne Waffe kein Geschütz, auch beim Kraterkäfer"); gleich(d4.breite, B.breite, "übrige Werte bleiben"); gleich(d4.sitze, B.sitze);
  var g = SC.Fahrzeug.bauDef("gleiter", bauTest({ waffe: { stufe: 2, kristall: "blau" } })); wahr(g.geschuetz && g.geschuetz.schaden > 0 && g.geschuetz.rohr.length === 3, "auch der Schwebeflitzer bekommt ein Geschütz"); gleich(SC.FAHRZEUGE.gleiter.geschuetz, null, "Vorlage unverändert");
  gleich(SC.FAHRZEUGE.buggy.tempo, 8.5, "Vorlage unverändert");
});
test("Fahrzeugbau: Lackfarbe und Bordwaffenrohr im Modell (#113)", function(){
  var B = SC.FAHRZEUGE.gleiter, d = SC.Fahrzeug.bauDef("gleiter", bauTest({ farbe: "#3fa0ff", waffe: { stufe: 1, kristall: "rot" } }));
  B.lack.forEach(function(i){ gleich(d.modell[i].farbe, "#3fa0ff", "Lackteil " + i); gleich(B.modell[i].farbe === "#3fa0ff", false, "Vorlage nicht verändert"); });
  gleich(d.modell.length, B.modell.length + 2, "Rohr und Mündungsglühen kommen dazu"); var spitze = d.modell[d.modell.length - 1]; wahr(spitze.leuchtet && spitze.farbe === "#ff4a4a", "Mündung leuchtet in Kristallfarbe");
  var ohne = SC.Fahrzeug.bauDef("gleiter", bauTest({ farbe: "#3fa0ff" })); gleich(ohne.modell.length, B.modell.length); gleich(SC.Fahrzeug.bauDef("buggy", bauTest({ farbe: "#3fa0ff" })).modell.length, SC.FAHRZEUGE.buggy.modell.length, "Kraterkäfer hat sein Rohr schon");
  SC.FAHRZEUGE.flieger.lack.forEach(function(i){ wahr(SC.FAHRZEUGE.flieger.modell[i] && !SC.FAHRZEUGE.flieger.modell[i].leuchtet, "Lackteile sind keine Leuchtteile"); });
});
test("Fahrzeugbau: def(f) nutzt den Bauplan, Fahrzeuge ohne Bauplan bleiben gleich (#113)", function(){
  var w = new SC.Welt(new SC.Planet({ id: "start", seed: 5 })), a = SC.Fahrzeug.neu(w, "buggy", [5, 70, 5], 0), b = SC.Fahrzeug.neu(w, "buggy", [9, 70, 5], 0, { bau: bauTest({ motor: 4, panzerung: 4 }) });
  gleich(SC.Fahrzeug.def(a), SC.FAHRZEUGE.buggy, "gleiches Objekt wie die Vorlage"); wahr(SC.Fahrzeug.def(b).tempo > SC.FAHRZEUGE.buggy.tempo); gleich(SC.Fahrzeug.def(b), SC.Fahrzeug.def(b), "zwischengespeichert");
  gleich(b.panzerung, SC.Fahrzeug.def(b).panzerung, "startet mit voller Panzerung"); wahr(b.panzerung > a.panzerung);
  function schnell(f){ f.pos = [f.pos[0], 61, f.pos[2]]; var s = 0; for(var i = 0; i < 400; i++){ SC.Fahrzeug.schritt(w, f, { vor: true }, 1 / 30); s = Math.max(s, Math.abs(f.tempo)); } return s; }
  var bo = new SC.Welt(new SC.Planet({ id: "start", seed: 5 })); for(var x = 0; x < 64; x++) for(var z = 0; z < 64; z++) for(var y = 1; y < 128; y++) bo.setzeBlock(x, y, z, y <= 60 ? SC.B.STEIN : SC.B.LUFT, "system");
  var fa = SC.Fahrzeug.neu(bo, "buggy", [10, 61, 30], 0), fb = SC.Fahrzeug.neu(bo, "buggy", [20, 61, 30], 0, { bau: bauTest({ motor: 4 }) }), ma = 0, mb = 0; for(var i = 0; i < 90; i++){ SC.Fahrzeug.schritt(bo, fa, { vor: true }, 1 / 30); SC.Fahrzeug.schritt(bo, fb, { vor: true }, 1 / 30); ma = Math.max(ma, Math.abs(fa.tempo)); mb = Math.max(mb, Math.abs(fb.tempo)); }
  wahr(mb > ma * 1.3, "Motor Stufe 4 fährt schneller: " + ma.toFixed(1) + " gegen " + mb.toFixed(1));
});
test("Fahrzeugbau: Speichern, Laden, Gastliste und Spiegel behalten den Bauplan (#113)", function(){
  var w = new SC.Welt(new SC.Planet({ id: "start", seed: 5 })), bau = bauTest({ motor: 3, panzerung: 2, waffe: { stufe: 1, kristall: "gelb" }, farbe: SC.BAU_FARBEN[5] });
  var f = SC.Fahrzeug.neu(w, "gleiter", [5, 70, 5], 0, { id: "bau-1", bau: bau, fundort: "bau-1", heim: [5, 70, 5] }); f.panzerung = 50;
  var d = JSON.parse(JSON.stringify(SC.Fahrzeug.inDaten(w))); gleich(JSON.stringify(d["bau-1"].bau), JSON.stringify(bau));
  var w2 = new SC.Welt(new SC.Planet({ id: "start", seed: 5 })); SC.Fahrzeug.ausDaten(w2, d); var g = w2.fahrzeuge.get(f.id); gleich(JSON.stringify(g.bau), JSON.stringify(bau)); gleich(g.panzerung, 50);
  var alt = { alt: { art: "gleiter", pos: [1, 70, 1], blick: 0, panzerung: 10, fundort: null, heim: null, weg: false, wiederBei: null } }; SC.Fahrzeug.ausDaten(w2, alt); gleich(w2.fahrzeuge.get("alt").bau, undefined, "alte Spielstände ohne Bauplan laden");
  var l = JSON.parse(JSON.stringify(SC.Raum.fahrzeugListe(w))); gleich(JSON.stringify(l[0].bau), JSON.stringify(bau));
  var w3 = new SC.Welt(new SC.Planet({ id: "start", seed: 5 })); SC.Raum.spiegleFahrzeuge(w3, l, 0.1, "ich", 0); var s = w3.fahrzeuge.get(f.id); gleich(JSON.stringify(s.bau), JSON.stringify(bau), "beim Gast angekommen");
  l[0].bau = bauTest({ farbe: SC.BAU_FARBEN[7] }); l = JSON.parse(JSON.stringify(l)); SC.Raum.spiegleFahrzeuge(w3, l, 0.1, "ich", 0); gleich(w3.fahrzeuge.get(f.id).bau.farbe, SC.BAU_FARBEN[7], "geänderter Bauplan wird übernommen");
  l[0].bau = { motor: 99 }; l = JSON.parse(JSON.stringify(l)); SC.Raum.spiegleFahrzeuge(w3, l, 0.1, "ich", 0); gleich(w3.fahrzeuge.get(f.id).bau, undefined, "ungültiger Bauplan wird ignoriert");
});
