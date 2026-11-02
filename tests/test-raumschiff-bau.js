// Stufe 6c: selbst gebaute Raumschiffe, Sternenmetall aus Asteroiden
test("Raumschiff-Rezept: Rumpf mit Titan, Schaltkreisen, Sternenmetall und Kristall (#121)", function(){
  var rz = SC.Crafting.rezept("fz-raumschiff"), B = SC.B; wahr(rz && rz.art === "fahrzeug" && rz.fahrzeug === "raumschiff" && rz.station === "werkbank");
  var k = SC.Crafting.kosten(rz, { motor: { stufe: 0, block: B.STEIN }, panzerung: { stufe: 0, block: B.STEIN }, waffe: null, farbe: SC.BAU_FARBEN[0] }), s = {}; k.forEach(function(x){ s[x.block] = x.anzahl; });
  gleich(s[B.TITAN], 10); gleich(s[B.SCHALTKREIS], 12); gleich(s[B.STERNENMETALL], 2); gleich(s[B.KRISTALL_BLAU], 2); gleich(s[B.STEIN], 14);
  var w = wb(); w.k.rucksack.lege({ block: B.STEIN, anzahl: 5 }); w.ui.zeigeWerkbank(w.k, Object.assign({ fahrzeug: fzOrt(true).fahrzeug }, w.o)); wahr(w.w.querySelector('[data-aktion="rezept"][data-id="fz-raumschiff"]'), "Karte im Menü");
  w.w.querySelector('[data-aktion="rezept"][data-id="fz-raumschiff"]').click(); wahr(w.w.querySelector(".wb-fzwerte"), "Auswahl wie bei Fahrzeugen");
});
test("Raumschiff nach Bauplan: Lack, Schild, Triebwerk und Laser (#121)", function(){
  var R = SC.FAHRZEUGE.raumschiff; wahr(R.lack && R.lack.length >= 3, "Lackteile"); R.lack.forEach(function(i){ wahr(R.modell[i] && !R.modell[i].leuchtet, "Teil " + i + " ist kein Leuchtteil"); });
  var d = SC.Fahrzeug.bauDef("raumschiff", { motor: 4, panzerung: 4, waffe: { stufe: 4, kristall: "violett" }, farbe: SC.BAU_FARBEN[6] });
  gleich(Math.round(d.panzerung), Math.round(R.panzerung * 2.6)); wahr(d.tempo > R.tempo * 1.4); gleich(d.unzerstoerbar, true, "verpufft nie"); gleich(Math.round(d.geschuetz.schaden), Math.round(R.geschuetz.schaden * 2)); gleich(d.modell[R.lack[0]].farbe, SC.BAU_FARBEN[6]);
  gleich(SC.Fahrzeug.bauDef("raumschiff", { motor: 0, panzerung: 0, waffe: null, farbe: SC.BAU_FARBEN[0] }).geschuetz, null, "ohne Laser kein Geschütz");
  var w = new SC.Welt(new SC.Planet({ id: "start", seed: 5 })), f = SC.Fahrzeug.neu(w, "raumschiff", [5, 70, 5], 0, { bau: { motor: 2, panzerung: 3, waffe: null, farbe: SC.BAU_FARBEN[2] } });
  var r = SC.Fahrzeug.raumWerte(f); gleich(r.schildMax, Math.round(R.panzerung * 2.2 * 1000) / 1000 === r.schildMax ? r.schildMax : R.panzerung * 2.2); gleich(Math.round(r.faktor * 100), 124); gleich(r.laser, null); gleich(r.lack, SC.BAU_FARBEN[2]);
  var alt = SC.Fahrzeug.neu(w, "raumschiff", [9, 70, 5], 0, { id: "schiff" }), a = SC.Fahrzeug.raumWerte(alt); gleich(a.faktor, 1); gleich(a.schildMax, R.panzerung); gleich(a.laser, R.geschuetz, "Sternenläufer wie bisher"); gleich(a.lack, null);
});
test("Raumflug: gebautes Schiff bringt Triebwerksfaktor, Schild und Lack mit ins All (#121)", function(){
  var w = new SC.Welt(new SC.Planet({ id: "start", seed: 5 })), d = SC.Spielstand.neu({ name: "A", seedText: "a", modus: "survival" });
  var f = SC.Fahrzeug.neu(w, "raumschiff", [100, 170, 100], 0, { id: "bau-x", bau: { motor: 4, panzerung: 4, waffe: { stufe: 0, kristall: "rot" }, farbe: SC.BAU_FARBEN[3] } });
  var fake = { welt: w, daten: d, ui: {}, render: null, _allSzeneAn: function(){}, _austritt: SC.Spiel.prototype._austritt }; fake._austritt(f);
  var a = fake.all; wahr(a, "im All"); wahr(a.faktor > 1.4, "schneller: " + a.faktor); gleich(Math.round(a.schildMax), Math.round(SC.FAHRZEUGE.raumschiff.panzerung * 2.6)); gleich(Math.round(a.schild), Math.round(a.schildMax), "volles Schild"); gleich(a.lack, SC.BAU_FARBEN[3]);
  var o = SC.Fahrzeug.reiseOptionen(f); gleich(o.id, "bau-x"); gleich(JSON.stringify(o.bau), JSON.stringify(f.bau)); gleich(SC.Fahrzeug.reiseOptionen({ id: "schiff", fundort: "schiff" }).bau, undefined, "Sternenläufer ohne Bauplan");
});
test("Asteroiden: Laser bricht manchmal Sternenmetall heraus, mit Pause je Brocken (#122)", function(){
  var rs = new SC.Rucksack(), meldungen = [], zahl = 0.1, fake = { _allAsteroiden: [{ pos: [0, 0, 0], r: 10 }, { pos: [100, 0, 0], r: 8 }], _allZeit: 100, kampf: { rucksack: rs }, spieler: { modus: "survival" }, ui: { hinweis: function(t){ meldungen.push(t); } }, audio: { spiele: function(){} }, _zf: function(){ return zahl; } };
  var T = SC.Spiel.prototype._asteroidTreffer; gleich(T.call(fake, [50, 50, 50]), false, "daneben"); gleich(T.call(fake, [3, 2, 1]), true, "Treffer verbraucht den Schuss"); gleich(rs.hat(SC.B.STERNENMETALL), 1, "Sternenmetall"); wahr(meldungen.length === 1 && meldungen[0].indexOf("Sternenmetall") >= 0);
  gleich(T.call(fake, [3, 2, 1]), true); gleich(rs.hat(SC.B.STERNENMETALL), 1, "gleicher Brocken: Pause"); fake._allZeit += 16; T.call(fake, [3, 2, 1]); gleich(rs.hat(SC.B.STERNENMETALL), 2, "nach 15 s wieder");
  T.call(fake, [101, 0, 0]); gleich(rs.hat(SC.B.STERNENMETALL), 3, "anderer Brocken sofort");
  zahl = 0.9; fake._allZeit += 100; var vor = rs.hat(SC.B.STERNENMETALL); gleich(T.call(fake, [3, 2, 1]), true); gleich(rs.hat(SC.B.STERNENMETALL), vor, "Pech: nichts"); 
  var voll = new SC.Rucksack(); for(var i = 0; i < 36; i++) voll.lege({ gegenstand: { id: "x" + i } }); fake.kampf = { rucksack: voll }; zahl = 0.1; fake._allZeit += 100; meldungen.length = 0; T.call(fake, [101, 0, 0]); gleich(voll.hat(SC.B.STERNENMETALL), 0); gleich(meldungen[0], SC.T.rucksackVoll);
});
