// Lagerfeuer und Kamin (Spec 2026-11-09-feuer-design): Blöcke, Rezepte, Logik, Spielanbindung
var FEUER_IDS = function(){ return [SC.B.LAGERFEUER, SC.B.LAGERFEUER_AN, SC.B.KAMIN, SC.B.KAMIN_AN, SC.B.FEUERZEUG]; };
test("Feuer: Blöcke haben Namen, an/aus, Licht und Eigenschaften", function(){
  FEUER_IDS().forEach(function(id){ wahr(SC.BLOECKE[id] && SC.BLOECKE[id].name, "Block " + id); });
  gleich(SC.BLOECKE[SC.B.LAGERFEUER].brennt, false); gleich(SC.BLOECKE[SC.B.LAGERFEUER_AN].brennt, true); gleich(SC.BLOECKE[SC.B.KAMIN].brennt, false); gleich(SC.BLOECKE[SC.B.KAMIN_AN].brennt, true);
  gleich(SC.BLOECKE[SC.B.LAGERFEUER_AN].leuchten, 15); gleich(SC.BLOECKE[SC.B.KAMIN_AN].leuchten, 13); gleich(SC.BLOECKE[SC.B.LAGERFEUER].leuchten, 0); gleich(SC.BLOECKE[SC.B.KAMIN].leuchten, 0);
  gleich(SC.BLOECKE[SC.B.LAGERFEUER].feuer, "lager"); gleich(SC.BLOECKE[SC.B.KAMIN_AN].feuer, "kamin");
  gleich(SC.BLOECKE[SC.B.LAGERFEUER].fest, false, "Lagerfeuer durchgehbar"); gleich(SC.BLOECKE[SC.B.KAMIN].fest, true, "Kamin fest");
  wahr(SC.BLOECKE[SC.B.FEUERZEUG].nichtAufstellbar, "Feuerzeug nicht aufstellbar");
  var ids = Object.keys(SC.B).map(function(k){ return SC.B[k]; }); gleich(ids.filter(function(v, i){ return ids.indexOf(v) === i; }).length, ids.length, "IDs eindeutig"); wahr(Math.max.apply(null, ids) <= 255, "passt in ein Byte");
});
test("Feuer: Kacheln und Farben für alle Seiten vorhanden", function(){
  FEUER_IDS().forEach(function(id){ var b = SC.BLOECKE[id]; ["oben", "seite", "unten"].forEach(function(s){ wahr(SC.TEXTUREN[b.seiten[s]], "Kachel " + b.seiten[s]); wahr(SC.PALETTEN.start.texturen[b.seiten[s]], "Farben " + b.seiten[s]); }); });
  wahr(Object.keys(SC.TEXTUREN).length < 256, "Atlas voll");
});
test("Feuer: Abbauen ergibt immer die ausgeschaltete Form, alles ist abbaubar", function(){
  gleich(SC.Abbau.ergibt(SC.B.LAGERFEUER_AN), SC.B.LAGERFEUER); gleich(SC.Abbau.ergibt(SC.B.KAMIN_AN), SC.B.KAMIN); gleich(SC.Abbau.ergibt(SC.B.LAGERFEUER), SC.B.LAGERFEUER); gleich(SC.Abbau.ergibt(SC.B.KAMIN), SC.B.KAMIN);
  FEUER_IDS().forEach(function(id){ wahr(SC.Abbau.zeit(id) < Infinity, "abbaubar " + id); });
});
test("Feuer: Rezepte Lagerfeuer, Kamin und Feuerzeug sind herstellbar, mit Namen, Feuerzeug im Kreativ-Material", function(){
  function bau(id, liste){ var r = new SC.Rucksack(); liste.forEach(function(x){ r.lege(x); }); var e = SC.Crafting.herstelle(r, SC.Crafting.rezept(id), null, Math.random, 1); return { r: r, e: e }; }
  var a = bau("lagerfeuer", [{ block: SC.B.STAMM, anzahl: 3 }]); wahr(a.e.ok, "Lagerfeuer"); gleich(a.r.hat(SC.B.LAGERFEUER), 1); gleich(a.r.hat(SC.B.STAMM), 0);
  var k = bau("kamin", [{ block: SC.B.STEIN, anzahl: 6 }, { block: SC.B.STAMM, anzahl: 2 }]); wahr(k.e.ok, "Kamin"); gleich(k.r.hat(SC.B.KAMIN), 1);
  var f = bau("feuerzeug", [{ block: SC.B.EISENERZ, anzahl: 2 }, { block: SC.B.KRISTALL_ROT, anzahl: 1 }]); wahr(f.e.ok, "Feuerzeug"); gleich(f.r.hat(SC.B.FEUERZEUG), 1);
  gleich(bau("lagerfeuer", [{ block: SC.B.STAMM, anzahl: 2 }]).e.ok, false, "zu wenig Holz");
  ["lagerfeuer", "kamin", "feuerzeug"].forEach(function(id){ wahr(SC.T.rezeptName[id], "Name " + id); gleich(SC.Crafting.rezept(id).station, "werkbank"); });
  wahr(SC.CRAFTING_MATERIALIEN.indexOf(SC.B.FEUERZEUG) >= 0, "Feuerzeug im Kreativ-Reiter Materialien");
});

// --- Logik: SC.Feuer ---
function feuerWelt(){ var w = new SC.Welt(new SC.Planet({ id: "start", seed: 5 })); for(var x = 0; x < 32; x++) for(var z = 0; z < 32; z++) for(var y = 1; y < 128; y++) w.setzeBlock(x, y, z, y <= 60 ? SC.B.STEIN : SC.B.LUFT, "system"); return w; }
function feuerGegner(w, art, x, z, boss){ return SC.Wesen.neu(w, "gegner", { gegnerArt: art || "krabbler", stufe: 1, pos: [x + 0.5, 61, z + 0.5], lp: 50, boss: !!boss }); }
test("Feuer: istStelle, brennt, an und aus", function(){
  var B = SC.B; wahr(SC.Feuer.istStelle(B.LAGERFEUER) && SC.Feuer.istStelle(B.KAMIN_AN) && !SC.Feuer.istStelle(B.STEIN) && !SC.Feuer.istStelle(B.FEUERZEUG));
  gleich(SC.Feuer.brennt(B.LAGERFEUER_AN), true); gleich(SC.Feuer.brennt(B.LAGERFEUER), false); gleich(SC.Feuer.brennt(B.STEIN), false);
  gleich(SC.Feuer.an(B.KAMIN), B.KAMIN_AN); gleich(SC.Feuer.an(B.KAMIN_AN), B.KAMIN_AN); gleich(SC.Feuer.aus(B.LAGERFEUER_AN), B.LAGERFEUER); gleich(SC.Feuer.aus(B.STEIN), B.STEIN);
});
test("Feuer: zünden und löschen schalten die Blöcke um, nur bei passenden Blöcken", function(){
  var w = feuerWelt(), B = SC.B; w.setzeBlock(4, 61, 4, B.LAGERFEUER, "system"); w.setzeBlock(8, 61, 4, B.KAMIN, "system"); w.setzeBlock(12, 61, 4, B.STEIN, "system");
  gleich(SC.Feuer.zuenden(w, 4, 61, 4), true); gleich(w.holeBlock(4, 61, 4), B.LAGERFEUER_AN); gleich(SC.Feuer.zuenden(w, 4, 61, 4), false, "brennt schon"); gleich(SC.Feuer.zuenden(w, 12, 61, 4), false, "Stein");
  gleich(SC.Feuer.zuenden(w, 8, 61, 4), true); gleich(w.holeBlock(8, 61, 4), B.KAMIN_AN);
  gleich(SC.Feuer.loeschen(w, 4, 61, 4), true); gleich(w.holeBlock(4, 61, 4), B.LAGERFEUER); gleich(SC.Feuer.loeschen(w, 4, 61, 4), false, "schon aus"); gleich(SC.Feuer.loeschen(w, 12, 61, 4), false);
});
test("Feuer: die Karte findet brennende Feuer (Ereignis, Scan, Entladen, Abbau) und doppelt nie", function(){
  var w = feuerWelt(), B = SC.B, k = new SC.Feuer.Karte(w); w.setzeBlock(4, 61, 4, B.LAGERFEUER_AN, "spieler"); gleich(k.liste().length, 1, "durch das Ereignis"); gleich(k.liste()[0].join(), "4,61,4,lager");
  w.setzeBlock(8, 61, 4, B.KAMIN_AN, "system"); gleich(k.liste().length, 2); gleich(k.liste().map(function(f){ return f[3]; }).sort().join(), "kamin,lager");
  w.setzeBlock(8, 61, 4, B.LUFT, "spieler"); gleich(k.liste().length, 1, "abgebaut");
  var k2 = new SC.Feuer.Karte(w); gleich(k2.liste().length, 0, "neue Karte kennt noch nichts"); k2.aktualisiere(); gleich(k2.liste().length, 1, "Scan findet das Feuer"); k2.aktualisiere(); gleich(k2.liste().length, 1, "kein Doppeln");
  w.entlade(0, 0); k2.aktualisiere(); gleich(k2.liste().length, 0, "entladener Chunk"); w.chunk(0, 0); k2.aktualisiere(); gleich(k2.liste().length, 1, "wieder geladen"); k2.abbauen();
  w.setzeBlock(4, 61, 4, B.LAGERFEUER, "spieler"); gleich(k2.liste().length, 1, "nach abbauen() keine Ereignisse mehr");
});
test("Feuer: Wärme im Umkreis von 6 Blöcken, nicht höher oder weiter, nicht bei ausgeschaltetem Feuer", function(){
  var w = feuerWelt(), B = SC.B, k = new SC.Feuer.Karte(w); w.setzeBlock(10, 61, 10, B.LAGERFEUER_AN, "spieler"); w.setzeBlock(20, 61, 20, B.LAGERFEUER, "spieler");
  wahr(SC.Feuer.warm(k, [10.5, 61, 15.4]), "5 Blöcke"); wahr(!SC.Feuer.warm(k, [10.5, 61, 17]), "7 Blöcke"); wahr(!SC.Feuer.warm(k, [10.5, 66, 10.5]), "5 Blöcke höher"); wahr(!SC.Feuer.warm(k, [20.5, 61, 20.5]), "ausgeschaltet");
  gleich(Math.round(k.naechsterAbstand([10.5, 61, 15.5])), 5); gleich(new SC.Feuer.Karte(w).naechsterAbstand([1, 1, 1]), Infinity);
});
test("Feuer: Gegner im Umkreis werden hinausgeschoben, Bosse nicht, Wände halten sie nicht auf, kein Teleport", function(){
  var w = feuerWelt(), B = SC.B, k = new SC.Feuer.Karte(w); w.setzeBlock(10, 61, 10, B.LAGERFEUER_AN, "spieler");
  var g = feuerGegner(w, "krabbler", 12, 10); g.bemerkt = true; var vorher = g.pos.slice(); gleich(SC.Feuer.abstossen(w, k, g), true); gleich(g.bemerkt, false); wahr(g.pos[0] > vorher[0] && g.pos[0] - vorher[0] <= 0.61, "ein kleiner Schritt nach außen: " + g.pos[0]);
  for(var i = 0; i < 12; i++) SC.Feuer.abstossen(w, k, g); wahr(Math.hypot(g.pos[0] - 10.5, g.pos[2] - 10.5) >= 4.99, "außerhalb von 5 Blöcken"); gleich(SC.Feuer.abstossen(w, k, g), false, "draußen bleibt er in Ruhe");
  var boss = feuerGegner(w, "schattenritter", 12, 10, true); var pb = boss.pos.slice(); gleich(SC.Feuer.abstossen(w, k, boss), false); gleich(boss.pos.join(), pb.join(), "Boss bleibt");
  var g2 = feuerGegner(w, "krabbler", 12, 14); for(var y = 61; y < 64; y++) for(var x = 9; x < 17; x++) w.setzeBlock(x, y, 16, B.STEIN, "system"); var p2 = g2.pos.slice();
  for(i = 0; i < 5; i++) SC.Feuer.abstossen(w, k, g2); wahr(g2.pos[2] < 16, "nicht in die Wand: " + g2.pos[2]);
  var gast = feuerGegner(w, "krabbler", 30, 30); gleich(SC.Feuer.abstossen(w, k, gast), false, "weit weg");
});
test("Feuer: Gegner in Feuernähe verfolgen den Spieler nicht, ohne Feuer schon; Bosse immer", function(){
  var w = feuerWelt(), B = SC.B, k = new SC.Feuer.Karte(w), ziel = { pos: [14.5, 61, 10.5], sichtbar: true, mitte: 1 };
  var g = feuerGegner(w, "krabbler", 18, 10); SC.KI.schritt(w, g, ziel, 0.05, SC.zufall(1), 1); gleich(g.bemerkt, true, "ohne Feuer: bemerkt");
  w.setzeBlock(14, 61, 10, B.LAGERFEUER_AN, "spieler"); w.feuer = k; var g2 = feuerGegner(w, "krabbler", 18, 10); SC.KI.schritt(w, g2, ziel, 0.05, SC.zufall(1), 1); gleich(g2.bemerkt, false, "am Feuer: nicht bemerkt");
  var g3 = feuerGegner(w, "krabbler", 28, 10); SC.KI.schritt(w, g3, { pos: [24.5, 61, 10.5], sichtbar: true, mitte: 1 }, 0.05, SC.zufall(1), 1); gleich(g3.bemerkt, true, "weit vom Feuer: bemerkt");
  var b = feuerGegner(w, "schattenritter", 18, 10, true); SC.KI.schritt(w, b, ziel, 0.05, SC.zufall(1), 1); gleich(b.bemerkt, true, "Boss lässt sich nicht aufhalten");
});
test("Feuer: Regen löscht nur Lagerfeuer mit freiem Himmel, nie den Kamin, nicht bei Schnee oder ohne Regen, nicht unter Dach", function(){
  var w = feuerWelt(), B = SC.B, k = new SC.Feuer.Karte(w), regen = { niederschlag: "regen", menge: 1 }, immer = function(){ return 0; };
  w.setzeBlock(4, 61, 4, B.LAGERFEUER_AN, "spieler"); w.setzeBlock(8, 61, 4, B.KAMIN_AN, "spieler"); w.setzeBlock(12, 61, 4, B.LAGERFEUER_AN, "spieler"); w.setzeBlock(12, 64, 4, B.BRETTER, "system");
  gleich(SC.Feuer.regen(w, k, { niederschlag: "schnee", menge: 1 }, 100, immer), 0, "Schnee"); gleich(SC.Feuer.regen(w, k, { niederschlag: null, menge: 0 }, 100, immer), 0, "kein Niederschlag"); gleich(SC.Feuer.regen(w, k, null, 100, immer), 0, "kein Wetter");
  gleich(SC.Feuer.regen(w, k, regen, 0.1, function(){ return 0.99; }), 0, "Pech beim Würfeln");
  gleich(SC.Feuer.regen(w, k, regen, 100, immer), 1, "nur das offene Lagerfeuer"); gleich(w.holeBlock(4, 61, 4), B.LAGERFEUER); gleich(w.holeBlock(8, 61, 4), B.KAMIN_AN, "Kamin brennt"); gleich(w.holeBlock(12, 61, 4), B.LAGERFEUER_AN, "unter Dach brennt");
});

// --- Spielanbindung ---
function feuerSpiel(){ var s = survSpiel(), w = s.welt; for(var x = 0; x < 32; x++) for(var z = 0; z < 32; z++) for(var y = 60; y < 100; y++) w.setzeBlock(x, y, z, y <= 60 ? SC.B.STEIN : SC.B.LUFT, "system");
  s.feuer = new SC.Feuer.Karte(w); w.feuer = s.feuer; s.klaenge = []; s.hinweise = []; s.audio = { spiele: function(n){ s.klaenge.push(n); } }; s.ui.hinweis = function(t){ s.hinweise.push(t); }; s.spieler.pos = [4.5, 61, 4.5]; s.spieler.auswahl = 0; s.rolle = "allein"; return s; }
test("Feuer: Feuerzeug zündet eine ausgeschaltete Stelle, sonst nichts", function(){
  var s = feuerSpiel(), w = s.welt, B = SC.B; w.setzeBlock(8, 61, 4, B.LAGERFEUER, "system"); w.setzeBlock(10, 61, 4, B.STEIN, "system");
  s.kampf.rucksack.plaetze[0] = null; gleich(s._feuerzeug({ x: 8, y: 61, z: 4 }), false, "ohne Feuerzeug in der Hand");
  s.kampf.rucksack.plaetze[0] = { block: B.FEUERZEUG, anzahl: 1 }; gleich(s._feuerzeug({ x: 10, y: 61, z: 4 }), false, "Stein");
  gleich(s._feuerzeug({ x: 8, y: 61, z: 4 }), true); gleich(w.holeBlock(8, 61, 4), B.LAGERFEUER_AN); gleich(s.klaenge.join(), "zuenden"); gleich(s.hinweise[0], SC.T.feuerAn); gleich(s.kampf.rucksack.plaetze[0].anzahl, 1, "Feuerzeug bleibt");
  s.klaenge = []; gleich(s._feuerzeug({ x: 8, y: 61, z: 4 }), true, "brennt schon: der Tipp gehört trotzdem dem Feuer"); gleich(s.klaenge.length, 0, "kein neuer Klang");
});
test("Feuer: Wassereimer löscht ein brennendes Feuer und wird leer, auf ein ausgeschaltetes verbraucht er sich nicht, Lava löscht nicht", function(){
  var s = feuerSpiel(), w = s.welt, B = SC.B; w.setzeBlock(8, 61, 4, B.LAGERFEUER_AN, "system");
  s.kampf.rucksack.plaetze[0] = { block: B.EIMER_WASSER, anzahl: 1 }; s.eingabe = {}; s._blockErlaubt = function(){ return true; };
  gleich(s._eimer({ x: 8, y: 61, z: 4, nx: 0, ny: 1, nz: 0 }), true); gleich(w.holeBlock(8, 61, 4), B.LAGERFEUER); gleich(s.kampf.rucksack.hat(B.EIMER), 1, "leerer Eimer"); gleich(s.kampf.rucksack.hat(B.EIMER_WASSER), 0); gleich(s.klaenge.join(), "loeschen"); gleich(s.hinweise[0], SC.T.feuerAus);
  var l = feuerSpiel(); l.welt.setzeBlock(8, 61, 4, B.LAGERFEUER_AN, "system"); l.kampf.rucksack.plaetze[0] = { block: B.EIMER_LAVA, anzahl: 1 }; l._mitspielerOrte = function(){ return []; };
  l._eimer({ x: 8, y: 61, z: 4, nx: 0, ny: 1, nz: 0 }); gleich(l.welt.holeBlock(8, 61, 4), B.LAGERFEUER_AN, "Lava löscht nicht");
});
test("Feuer: Wärme am brennenden Feuer, Hinweis höchstens alle 60 Sekunden, Wärme endet mit dem Abstand und im Zuschauermodus", function(){
  var s = feuerSpiel(), w = s.welt, B = SC.B; w.setzeBlock(8, 61, 4, B.LAGERFEUER_AN, "spieler"); s.daten.spielzeit = 10; s.spieler.pos = [10.5, 61, 4.5];
  s._feuerTakt(0.1); gleich(s.kampf.warm, true); gleich(s.hinweise.join(), SC.T.feuerWarm);
  s.spieler.pos = [30.5, 61, 30.5]; s._feuerTakt(0.1); gleich(s.kampf.warm, false); s.daten.spielzeit = 30; s.spieler.pos = [10.5, 61, 4.5]; s._feuerTakt(0.1); gleich(s.hinweise.length, 1, "kein zweiter Hinweis nach 20 s");
  s.daten.spielzeit = 80; s.spieler.pos = [30.5, 61, 30.5]; s._feuerTakt(0.1); s.spieler.pos = [10.5, 61, 4.5]; s._feuerTakt(0.1); gleich(s.hinweise.length, 2, "nach 60 s wieder");
  s.spieler.modus = "zuschauer"; s._feuerTakt(0.1); gleich(s.kampf.warm, false, "Zuschauer wird nicht gewärmt");
});
test("Feuer: Kampf füllt das Leben am Feuer doppelt so schnell auf", function(){
  var s = feuerSpiel(); function gewinn(warm){ var k = feuerSpiel().kampf; k.werte.lp = k.werte.lpMax - 50; k.warm = warm; var vor = k.werte.lp; k.schritt(10000, 1); return k.werte.lp - vor; }
  var n = gewinn(false), w = gewinn(true); wahr(n > 0, "regeneriert"); wahr(Math.abs(w - 2 * n) < 1e-6, "doppelt: " + w + " gegen " + n);
});
test("Feuer: Takt schiebt Gegner aus dem Umkreis; Regen löscht nur als Gastgeber oder allein, nicht als Gast", function(){
  var s = feuerSpiel(), w = s.welt, B = SC.B; w.setzeBlock(8, 61, 4, B.LAGERFEUER_AN, "spieler"); w.setzeBlock(20, 61, 20, B.KAMIN_AN, "spieler"); var g = feuerGegner(w, "krabbler", 10, 4); var vor = g.pos[0];
  s._zf = function(){ return 0; }; s._wetterEff = { niederschlag: "regen", menge: 1 }; s.rolle = "gast"; s._feuerTakt(1); gleich(w.holeBlock(8, 61, 4), B.LAGERFEUER_AN, "Gast löscht nicht"); gleich(g.pos[0], vor, "Gast schiebt nicht (Gegner rechnet der Gastgeber)");
  s.rolle = "allein"; s._feuerTakt(1); gleich(w.holeBlock(8, 61, 4), B.LAGERFEUER, "Regen löscht"); gleich(w.holeBlock(20, 61, 20), B.KAMIN_AN, "Kamin brennt"); wahr(s.klaenge.indexOf("loeschen") >= 0, "Klang"); wahr(g.pos[0] > vor, "Gegner geschoben");
  var s2 = feuerSpiel(); s2._feuerTakt(1); wahr(true, "ohne Feuer und ohne Wetter kein Fehler"); var s3 = feuerSpiel(); s3.feuer = null; s3._feuerTakt(1); wahr(true, "ohne Karte kein Fehler");
});

// --- Funken, Geräusche, Knistern ---
test("Feuer: Funken steigen über den nächsten brennenden Feuern auf, nur in der Nähe, höchstens acht Feuer, weniger bei „Weniger“", function(){
  var sz = new THREE.Scene(), r = new SC.RenderFeuer(sz), P = 2048, kam = [100, 70, 100];
  r.bild([], 1000, kam, P); gleich(r._geo.drawRange.count, 0, "ohne Feuer keine Funken");
  r.bild([[103, 61, 100, "lager"]], 1000, kam, P, false); gleich(r._geo.drawRange.count, 12, "zwölf Funken je Feuer");
  var p = r._p; for(var i = 0; i < 12; i++){ wahr(p[i * 3 + 1] >= 61 && p[i * 3 + 1] <= 61 + 2.5, "Höhe " + p[i * 3 + 1]); wahr(Math.hypot(p[i * 3] - 103.5, p[i * 3 + 2] - 100.5) < 0.8, "bleibt über dem Feuer"); }
  var vor = Array.prototype.slice.call(p, 0, 36); r.bild([[103, 61, 100, "lager"]], 1400, kam, P, false); wahr(vor.join() !== Array.prototype.slice.call(p, 0, 36).join(), "bewegt sich");
  r.bild([[300, 61, 300, "lager"]], 1000, kam, P); gleich(r._geo.drawRange.count, 0, "zu weit weg");
  var viele = []; for(i = 0; i < 12; i++) viele.push([100 + i, 61, 100, "lager"]); r.bild(viele, 1000, kam, P); gleich(r._geo.drawRange.count, 8 * 12, "höchstens acht Feuer");
  r.bild([[103, 61, 100, "lager"]], 1000, kam, P, true); wahr(r._geo.drawRange.count > 0 && r._geo.drawRange.count < 12, "weniger Funken");
  r.bild([[2047, 61, 100, "lager"]], 1000, [1, 70, 100], P); gleich(r._geo.drawRange.count, 12, "über den Planetenrand");
});
test("Klang: zünden, löschen und knistern sind hörbar und endlich, Feuer in der Ferne leiser", function(){
  function messe(name, o){ var ctx = new OfflineAudioContext(1, 44100 * 2, 44100), z = ctx.createGain(); z.connect(ctx.destination); SC.Klang.erzeuge(ctx, z, name, o || {}, 0.8);
    return ctx.startRendering().then(function(b){ var d = b.getChannelData(0), s = 0, mx = 0; for(var i = 0; i < d.length; i++){ if(!isFinite(d[i])) return { rms: NaN, peak: 9 }; s += d[i] * d[i]; mx = Math.max(mx, Math.abs(d[i])); } return { rms: Math.sqrt(s / d.length), peak: mx }; }); }
  return Promise.all([messe("zuenden"), messe("loeschen"), messe("feuer", { entfernung: 1 }), messe("feuer", { entfernung: 13 })]).then(function(r){
    ["zuenden", "loeschen", "feuer"].forEach(function(n, i){ wahr(r[i].rms > 0.003, n + " zu leise: " + r[i].rms); wahr(r[i].peak < 0.9, n + " übersteuert: " + r[i].peak); }); wahr(r[3].rms < r[2].rms, "fern leiser");
  });
});
test("Feuer: In der Nähe eines brennenden Feuers knistert es regelmäßig, in der Ferne nicht", function(){
  var s = feuerSpiel(), w = s.welt; w.setzeBlock(8, 61, 4, SC.B.LAGERFEUER_AN, "spieler"); s.spieler.pos = [12.5, 61, 4.5]; s._zf = function(){ return 0.99; };
  s._feuerTakt(0.9); var n = s.klaenge.filter(function(k){ return k === "feuer"; }).length; gleich(n, 1, "nach 0,9 s ein Knistern"); s._feuerTakt(0.2); gleich(s.klaenge.filter(function(k){ return k === "feuer"; }).length, 1, "nicht schon wieder");
  s.spieler.pos = [31.5, 61, 31.5]; s._feuerTakt(2); gleich(s.klaenge.filter(function(k){ return k === "feuer"; }).length, 1, "weit weg: still");
});

// --- Netz, Anleitung, Kreativ ---
test("Feuer: Netzprotokoll 12 und alle Feuerblöcke sind in der Kreativ-Auswahl (aus und an), das Feuerzeug nicht", function(){
  gleich(SC.NETZ_PROTOKOLL, 12);
  [SC.B.LAGERFEUER, SC.B.LAGERFEUER_AN, SC.B.KAMIN, SC.B.KAMIN_AN].forEach(function(id){ gleich(SC.BLOECKE[id].inAuswahl, true, SC.BLOECKE[id].name); }); gleich(SC.BLOECKE[SC.B.FEUERZEUG].inAuswahl, false);
});
test("Anleitung: Abschnitt Feuer erklärt Feuerzeug, Lagerfeuer, Kamin, Wärme, Löschen", function(){
  var a = SC.T.anleitung.abschnitte.filter(function(x){ return x[0] === "Feuer"; })[0]; wahr(a && a[1].length >= 5, "Abschnitt");
  var t = a[1].join(" "); ["Feuerzeug", "Lagerfeuer", "Kamin", "Wasser", "Regen", "Gegner", "Kreativ"].forEach(function(w){ wahr(t.indexOf(w) >= 0, "nennt " + w); });
});

// --- Befunde der Abschlussprüfung ---
test("Final: Die Funken bekommen die Feuerliste vom Spiel (auch als Gast), die Liste wird zwischengespeichert", function(){
  var s = feuerSpiel(), w = s.welt, B = SC.B, got = []; s.render = { feuer: function(l){ got.push(l); } }; w.setzeBlock(8, 61, 4, B.LAGERFEUER_AN, "spieler");
  s._feuerTakt(0.1); gleich(got.length, 1); gleich(got[0].length, 1, "ein brennendes Feuer"); s.rolle = "gast"; s._feuerTakt(0.1); gleich(got.length, 2, "Gäste bekommen auch Funken");
  wahr(s.feuer.liste() === s.feuer.liste(), "gleiche Liste ohne Änderung (keine Zuweisung pro Bild)"); var alt = s.feuer.liste(); w.setzeBlock(9, 61, 4, B.KAMIN_AN, "spieler"); wahr(s.feuer.liste() !== alt && s.feuer.liste().length === 2, "nach Änderung neu");
  s.render = null; s._feuerTakt(0.1); wahr(true, "ohne Renderer kein Fehler");
});
test("Final: Fernkämpfer schießen nicht auf einen Spieler am Feuer, aber ohne Feuer schon", function(){
  var w = feuerWelt(), B = SC.B, k = new SC.Feuer.Karte(w), ziel = { pos: [14.5, 61, 10.5], sichtbar: true, mitte: 1 };
  var g = feuerGegner(w, "patrouillendroide", 23, 10); SC.KI.schritt(w, g, ziel, 0.05, SC.zufall(1), 1); gleich(g.bemerkt, true, "ohne Feuer bemerkt");
  w.setzeBlock(14, 61, 10, B.LAGERFEUER_AN, "spieler"); w.feuer = k; var g2 = feuerGegner(w, "patrouillendroide", 23, 10); var abst = Math.hypot(g2.pos[0] - 14.5, g2.pos[2] - 10.5); wahr(abst > SC.FEUER.sperrRadius, "Droide steht außerhalb von 6,5 Blöcken: " + abst);
  var akt = SC.KI.schritt(w, g2, ziel, 0.05, SC.zufall(1), 1); gleich(g2.bemerkt, false, "Spieler am Feuer: nicht bemerkt"); gleich(akt.filter(function(a){ return a.art === "schuss"; }).length, 0, "kein Schuss");
  var g3 = feuerGegner(w, "patrouillendroide", 23, 22); SC.KI.schritt(w, g3, { pos: [14.5, 61, 22.5], sichtbar: true, mitte: 1 }, 0.05, SC.zufall(1), 1); gleich(g3.bemerkt, true, "Spieler weit vom Feuer: bemerkt");
});
test("Final: Die Karte findet Feuer in vielen neu geladenen Chunks schon beim ersten Aufruf", function(){
  var w = feuerWelt(), B = SC.B; for(var cx = 0; cx < 7; cx++) for(var cz = 0; cz < 6; cz++) w.chunk(cx, cz);   // 42 Chunks geladen
  w.setzeBlock(6 * 16 + 3, 61, 5 * 16 + 3, B.KAMIN_AN, "system"); var k = new SC.Feuer.Karte(w); k.aktualisiere(); gleich(k.liste().length, 1, "Feuer im zuletzt geladenen Chunk sofort gefunden");
});
test("Final: Wassereimer auf eine ausgeschaltete Feuerstelle gießt nicht daneben und bleibt voll", function(){
  var s = feuerSpiel(), w = s.welt, B = SC.B; w.setzeBlock(8, 61, 4, B.LAGERFEUER, "system"); w.setzeBlock(10, 61, 4, B.KAMIN, "system"); s.kampf.rucksack.plaetze[0] = { block: B.EIMER_WASSER, anzahl: 1 }; s._blockErlaubt = function(){ return true; }; s._mitspielerOrte = function(){ return []; };
  [[8, "lager"], [10, "kamin"]].forEach(function(p){ gleich(s._eimer({ x: p[0], y: 61, z: 4, nx: 0, ny: 1, nz: 0 }), true, p[1] + ": Tipp gehört dem Feuer"); gleich(s.kampf.rucksack.hat(B.EIMER_WASSER), 1, p[1] + ": Eimer bleibt voll"); gleich(w.holeBlock(p[0], 62, 4), B.LUFT, p[1] + ": kein Wasser daneben"); });
});
test("Final: Im Kreativmodus löscht der Wassereimer ein brennendes Feuer, gießt nicht daneben und bleibt voll", function(){
  var s = feuerSpiel(), w = s.welt, B = SC.B; s.spieler.modus = "kreativ"; w.setzeBlock(8, 61, 4, B.LAGERFEUER_AN, "system"); w.setzeBlock(10, 61, 4, B.KAMIN, "system"); s.spieler.schnellleiste[0] = B.EIMER_WASSER; s._mitspielerOrte = function(){ return []; };
  gleich(s._eimerKreativ({ x: 8, y: 61, z: 4, nx: 0, ny: 1, nz: 0 }), true); gleich(w.holeBlock(8, 61, 4), B.LAGERFEUER, "gelöscht"); wahr(s.klaenge.indexOf("loeschen") >= 0, "Klang"); gleich(s.hinweise[0], SC.T.feuerAus);
  gleich(s._eimerKreativ({ x: 10, y: 61, z: 4, nx: 0, ny: 1, nz: 0 }), true, "auf ausgeschaltete Stelle"); gleich(w.holeBlock(10, 62, 4), B.LUFT, "kein Wasser daneben");
  s.spieler.schnellleiste[0] = B.EIMER_LAVA; w.setzeBlock(8, 61, 4, B.LAGERFEUER_AN, "system"); s._eimerKreativ({ x: 8, y: 61, z: 4, nx: 0, ny: 1, nz: 0 }); gleich(w.holeBlock(8, 61, 4), B.LAGERFEUER_AN, "Lava löscht nicht");
});
