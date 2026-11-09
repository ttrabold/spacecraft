// Zaubertränke (Spec 2026-11-09-zaubertraenke-design): Tabellen, Blöcke, Brauen, Wirkung, Verwandlung
test("Pflanzen: neun, drei je Planet, Blöcke vorhanden", function(){
  var ids = Object.keys(SC.PFLANZEN), je = { start: 0, glutfrost: 0, rankenmoor: 0 };
  gleich(ids.length, 9); gleich(SC.PFLANZEN_REIHE.length, 9);
  ids.forEach(function(i){ var p = SC.PFLANZEN[i]; je[p.planet]++; wahr(SC.BLOECKE[p.block] && SC.BLOECKE[p.block].name, "Block fehlt: " + i); wahr(p.name && p.teil && p.id === i, "Angaben fehlen: " + i); gleich(SC.PFLANZEN_REIHE.indexOf(i) >= 0, true); });
  gleich(je.start, 3); gleich(je.glutfrost, 3); gleich(je.rankenmoor, 3);
});
test("Wirkungen: sechs Kristalle, jede Art einmal, Farbe wie die Kristallfarbe", function(){
  var k = Object.keys(SC.TRANK.wirkung), arten = {};
  gleich(k.sort().join(), Object.keys(SC.CRAFTING_KRISTALLE).sort().join());
  k.forEach(function(n){ var w = SC.TRANK.wirkung[n]; arten[w.art] = true; gleich(w.farbe, SC.CRAFTING_KRISTALLE[n].farbe); wahr(w.wert !== undefined, "Wert fehlt: " + n); });
  gleich(Object.keys(arten).length, 6);
  gleich(SC.TRANK.dauer, 180);
});
test("Schlüssel: Hin und Zurück, ungültig gibt null", function(){
  var s = SC.Trank.schluessel("rot", "hasenklee"); gleich(s, "rot:hasenklee");
  var t = SC.Trank.teile(s); gleich(t.kristall, "rot"); gleich(t.pflanze, "hasenklee");
  gleich(SC.Trank.teile("rot:gibtesnicht"), null); gleich(SC.Trank.teile("x"), null); gleich(SC.Trank.teile(null), null); gleich(SC.Trank.teile("gibtes:hasenklee"), null);
});
test("Blöcke: Kessel, Flasche, Trank sind abbaubar und haben Kacheln", function(){
  [SC.B.KESSEL, SC.B.FLASCHE, SC.B.TRANK].concat(SC.PFLANZEN_REIHE.map(function(i){ return SC.PFLANZEN[i].block; })).forEach(function(id){
    var b = SC.BLOECKE[id]; wahr(b && b.name, "Block " + id); wahr(SC.Abbau.zeit(id) < Infinity, "abbaubar " + id);
    ["oben", "seite", "unten"].forEach(function(s){ wahr(SC.TEXTUREN[b.seiten[s]], "Kachel " + b.seiten[s]); });
    wahr(SC.PALETTEN.start.texturen[b.seiten.oben], "Farben " + b.seiten.oben);
  });
  wahr(SC.BLOECKE[SC.B.TRANK].nichtAufstellbar && SC.BLOECKE[SC.B.FLASCHE].nichtAufstellbar, "Flasche und Trank nicht aufstellbar");
  gleich(SC.BLOECKE[SC.B.HASENKLEE].form, "pflanze"); gleich(SC.BLOECKE[SC.B.HASENKLEE].fest, false);
  gleich(Object.keys(SC.TEXTUREN).length < 256, true);
});

// --- Rucksack: Tränke stapeln nach Kristall und Pflanze ---
function trankSache(s, n){ return { block: SC.B.TRANK, anzahl: n || 1, trank: s }; }
test("Rucksack: gleiche Tränke stapeln, verschiedene nicht", function(){
  var r = new SC.Rucksack();
  gleich(r.lege(trankSache("rot:hasenklee", 2)), 0); gleich(r.lege(trankSache("rot:hasenklee", 2)), 0);
  gleich(r.plaetze[0].anzahl, 4); gleich(r.plaetze[0].trank, "rot:hasenklee"); gleich(r.plaetze[1], null);
  gleich(r.lege(trankSache("gelb:hasenklee", 1)), 0); gleich(r.plaetze[1].trank, "gelb:hasenklee"); gleich(r.plaetze[1].anzahl, 1);
  gleich(r.hatTrank("rot:hasenklee"), 4); gleich(r.hatTrank("gelb:hasenklee"), 1); gleich(r.hatTrank("blau:eisblume"), 0);
});
test("Rucksack: nimm einer Teilmenge behält den Trank-Schlüssel", function(){
  var r = new SC.Rucksack(); r.lege(trankSache("blau:eisblume", 5));
  var n = r.nimm(0, 2); gleich(n.trank, "blau:eisblume"); gleich(n.anzahl, 2); gleich(r.plaetze[0].anzahl, 3); gleich(r.plaetze[0].trank, "blau:eisblume");
});
test("Rucksack: Tränke und Blöcke ohne trank stapeln unverändert", function(){
  var r = new SC.Rucksack(); gleich(r.lege({ block: SC.B.STEIN, anzahl: 70 }), 0); gleich(r.plaetze[0].anzahl, 64); gleich(r.plaetze[1].anzahl, 6);
  wahr(r.plaetze[0].trank === undefined, "kein trank-Feld bei Blöcken");
  var r2 = new SC.Rucksack([{ block: SC.B.TRANK, anzahl: 1 }]); gleich(r2.lege(trankSache("rot:hasenklee", 1)), 0); gleich(r2.plaetze[1].trank, "rot:hasenklee");   // alter Platz ohne trank bleibt eigener Stapel
});
test("Rucksack: passt und alsDaten mit Trank", function(){
  var r = new SC.Rucksack(); for(var i = 0; i < 36; i++) r.lege({ gegenstand: { id: "g" + i } });
  gleich(r.passt(trankSache("rot:hasenklee", 1)), false);
  var r2 = new SC.Rucksack(); r2.lege(trankSache("rot:hasenklee", 3)); var d = JSON.parse(JSON.stringify(r2.alsDaten())); var r3 = new SC.Rucksack(d);
  gleich(r3.hatTrank("rot:hasenklee"), 3); gleich(r3.passt(trankSache("rot:hasenklee", 61)), true); gleich(r3.passt(trankSache("rot:hasenklee", 61 * 40)), false);
});

// --- Rezepte und Brauen ---
function rucksackMit(liste){ var r = new SC.Rucksack(); liste.forEach(function(x){ r.lege(x); }); return r; }
test("Rezepte: Kessel und Flasche sind an der Werkbank herstellbar", function(){
  var k = SC.Crafting.rezept("kessel"), f = SC.Crafting.rezept("flasche");
  gleich(k.ergibt.block, SC.B.KESSEL); gleich(k.ergibt.anzahl, 1); gleich(f.ergibt.block, SC.B.FLASCHE); gleich(f.ergibt.anzahl, 3); gleich(k.station, "werkbank"); gleich(f.station, "werkbank");
  var r = rucksackMit([{ block: SC.B.EISENERZ, anzahl: 6 }, { block: SC.B.BRETTER, anzahl: 2 }, { block: SC.B.GLAS, anzahl: 2 }]);
  wahr(SC.Crafting.herstelle(r, k, null, Math.random, 1).ok, "Kessel"); wahr(SC.Crafting.herstelle(r, f, null, Math.random, 1).ok, "Flasche");
  gleich(r.hat(SC.B.KESSEL), 1); gleich(r.hat(SC.B.FLASCHE), 3); gleich(r.hat(SC.B.EISENERZ), 0);
});
test("Brauen: verbraucht je eine Zutat und legt einen Trank ab", function(){
  var r = rucksackMit([{ block: SC.B.FLASCHE, anzahl: 2 }, { block: SC.B.KRISTALL_ROT, anzahl: 1 }, { block: SC.B.HASENKLEE, anzahl: 3 }]);
  var e = SC.Crafting.brauen(r, "rot", "hasenklee"); gleich(e.ok, true); gleich(e.schluessel, "rot:hasenklee");
  gleich(r.hatTrank("rot:hasenklee"), 1); gleich(r.hat(SC.B.FLASCHE), 1); gleich(r.hat(SC.B.KRISTALL_ROT), 0); gleich(r.hat(SC.B.HASENKLEE), 2);
});
test("Brauen: fehlende Zutat ändert nichts", function(){
  var r = rucksackMit([{ block: SC.B.KRISTALL_ROT, anzahl: 1 }, { block: SC.B.HASENKLEE, anzahl: 1 }]), vorher = JSON.stringify(r.alsDaten());
  var e = SC.Crafting.brauen(r, "rot", "hasenklee"); gleich(e.ok, false); gleich(e.grund, "zutat"); gleich(JSON.stringify(r.alsDaten()), vorher);
  var r2 = rucksackMit([{ block: SC.B.FLASCHE, anzahl: 1 }, { block: SC.B.HASENKLEE, anzahl: 1 }]); gleich(SC.Crafting.brauen(r2, "rot", "hasenklee").grund, "zutat");
});
test("Brauen: voller Rucksack verliert keine Zutaten", function(){
  var r = new SC.Rucksack(); r.lege({ block: SC.B.FLASCHE, anzahl: 1 }); r.lege({ block: SC.B.KRISTALL_ROT, anzahl: 2 }); r.lege({ block: SC.B.HASENKLEE, anzahl: 2 });
  for(var i = 0; i < 40; i++) r.lege({ gegenstand: { id: "g" + i } });
  wahr(r.plaetze.every(Boolean), "Rucksack voll");
  var vorher = JSON.stringify(r.alsDaten()), e = SC.Crafting.brauen(r, "rot", "hasenklee");
  gleich(e.ok, true, "die Flasche gibt beim Verbrauch einen Platz frei, der Trank passt dorthin");   // Flasche war ein Einzelplatz: Platz frei, Trank passt
  gleich(r.hatTrank("rot:hasenklee"), 1);
  var r2 = new SC.Rucksack(); r2.lege({ block: SC.B.FLASCHE, anzahl: 2 }); r2.lege({ block: SC.B.KRISTALL_ROT, anzahl: 2 }); r2.lege({ block: SC.B.HASENKLEE, anzahl: 2 });
  for(i = 0; i < 40; i++) r2.lege({ gegenstand: { id: "g" + i } });
  var v2 = JSON.stringify(r2.alsDaten()); gleich(SC.Crafting.brauen(r2, "rot", "hasenklee").grund, "voll"); gleich(JSON.stringify(r2.alsDaten()), v2);
});
test("Brauen: unbekannter Kristall oder unbekannte Pflanze", function(){
  var r = rucksackMit([{ block: SC.B.FLASCHE, anzahl: 1 }, { block: SC.B.KRISTALL_ROT, anzahl: 1 }, { block: SC.B.HASENKLEE, anzahl: 1 }]), vorher = JSON.stringify(r.alsDaten());
  gleich(SC.Crafting.brauen(r, "pink", "hasenklee").grund, "zutat"); gleich(SC.Crafting.brauen(r, "rot", "gibtesnicht").grund, "zutat"); gleich(SC.Crafting.brauen(r, undefined, undefined).grund, "zutat"); gleich(SC.Crafting.brauen(r, "constructor", "hasenklee").grund, "zutat"); gleich(SC.Crafting.brauen(r, "rot", "__proto__").grund, "zutat"); gleich(SC.Trank.teile("constructor:hasenklee"), null); gleich(SC.Trank.teile("rot:toString"), null); gleich(JSON.stringify(r.alsDaten()), vorher);
});

// --- Trank-Zustand, Ablauf und Wirkung ---
function trankKampf(trank){ var w = new SC.Welt(new SC.Planet({ id: "start", seed: 5 })), d = SC.Spielstand.neu({ name: "T", seedText: "t", modus: "survival", schwierigkeit: "normal" }), s = new SC.Spieler({ id: "a", pos: [4.5, 61, 4.5], modus: "survival" });
  if(trank !== undefined) d.spieler.trank = trank; return new SC.Kampf(w, s, d, SC.zufall(1)); }
function trankWelt(){ var w = new SC.Welt(new SC.Planet({ id: "start", seed: 5 })); for(var x = 0; x < 8; x++) for(var z = 0; z < 8; z++) for(var y = 1; y < 128; y++) w.setzeBlock(x, y, z, y <= 60 ? SC.B.STEIN : SC.B.LUFT, "system"); return w; }
var trankRuhe = { vor: false, zurueck: false, links: false, rechts: false, springen: false, sinken: false, sprint: false, springenNeu: false };
test("Trank: neu aus Schlüssel, ungültig gibt null, Dauer 180", function(){
  var z = SC.Trank.neu("rot:hasenklee"); gleich(z.kristall, "rot"); gleich(z.pflanze, "hasenklee"); gleich(z.rest, 180);
  gleich(SC.Trank.neu("rot:gibtesnicht"), null); gleich(SC.Trank.neu(undefined), null);
});
test("Trank: zeit zählt herunter und endet bei 0", function(){
  var z = SC.Trank.neu("rot:hasenklee"); z = SC.Trank.zeit(z, 100); gleich(z.rest, 80); gleich(SC.Trank.zeit(z, 81), null); gleich(SC.Trank.zeit(null, 5), null);
});
test("Trank: Bonus je Kristall, ohne Trank Standardwerte", function(){
  function b(k){ return SC.Trank.bonus(SC.Trank.neu(k + ":hasenklee")); }
  var s = SC.Trank.bonus(null); gleich(s.tempo, 0); gleich(s.schaden, 0); gleich(s.schild, 0); gleich(s.sprung, 1); gleich(s.schwerkraft, 1); gleich(s.nachtsicht, false);
  gleich(b("gelb").tempo, 30); gleich(b("gruen").sprung, 1.4); gleich(b("rot").schaden, 25); gleich(b("blau").schild, 30); gleich(b("violett").schwerkraft, 0.35); gleich(b("weiss").nachtsicht, true);
  gleich(b("gelb").schaden, 0); gleich(b("rot").tempo, 0);   // nur die Art des Kristalls
});
test("Trank: pruefe lässt nur gültige Zustände durch (alte Stände, Müll)", function(){
  gleich(SC.Trank.pruefe(null), null); gleich(SC.Trank.pruefe(undefined), null); gleich(SC.Trank.pruefe("x"), null); gleich(SC.Trank.pruefe({ kristall: "rot", pflanze: "nix", rest: 50 }), null);
  gleich(SC.Trank.pruefe({ kristall: "rot", pflanze: "hasenklee", rest: "viel" }), null); gleich(SC.Trank.pruefe({ kristall: "rot", pflanze: "hasenklee", rest: 0 }), null);
  gleich(SC.Trank.pruefe({ kristall: "rot", pflanze: "hasenklee", rest: 50 }).rest, 50); gleich(SC.Trank.pruefe({ kristall: "rot", pflanze: "hasenklee", rest: 5000 }).rest, 180);
});
test("Kampf: trinken erhöht tempoBonus, Ende stellt zurück", function(){
  var k = trankKampf(), t0 = k.werte.tempoBonus, f0 = k.spieler.tempoFaktor;
  gleich(k.trinke("gelb:hasenklee"), true); gleich(k.werte.tempoBonus, t0 + 30); wahr(Math.abs(k.spieler.tempoFaktor - (f0 + 0.3)) < 1e-9, "tempoFaktor");
  k.zeitTrank(100); gleich(k.werte.tempoBonus, t0 + 30); k.zeitTrank(81); gleich(k.trank, null); gleich(k.werte.tempoBonus, t0); gleich(k.spieler.tempoFaktor, f0);
});
test("Kampf: neuer Trank ersetzt den laufenden, ungültiger ändert nichts", function(){
  var k = trankKampf(), t0 = k.werte.tempoBonus, s0 = k.werte.schadenBonus;
  k.trinke("gelb:hasenklee"); k.trinke("rot:fuchsgras"); gleich(k.werte.tempoBonus, t0); gleich(k.werte.schadenBonus, s0 + 25); gleich(k.trank.rest, 180);
  gleich(k.trinke("pink:hasenklee"), false); gleich(k.werte.schadenBonus, s0 + 25); gleich(k.trank.kristall, "rot");
});
test("Kampf: Schild-Trank erhöht schildMax und nimmt es am Ende zurück", function(){
  var k = trankKampf(), m0 = k.werte.schildMax; k.trinke("blau:eisblume"); gleich(k.werte.schildMax, m0 + 30); k.werte.schild = m0 + 30; k.trankEnde(); gleich(k.werte.schildMax, m0); gleich(k.werte.schild, m0);
});
test("Kampf: Trank wird aus dem Spielstand geladen, Müll und fehlendes Feld ergeben keinen Trank", function(){
  var k = trankKampf({ kristall: "gruen", pflanze: "federfarn", rest: 70 }); gleich(k.trank.rest, 70); gleich(k.spieler.sprungFaktor, 1.4);
  gleich(trankKampf(undefined).trank, null); gleich(trankKampf(null).trank, null); gleich(trankKampf({ kristall: "x" }).trank, null);
});
test("Kampf: Nachtsicht schaltet das Leuchten der Figur ein und wieder aus", function(){
  var k = trankKampf(); gleich(!!k.spieler.leuchten, false); k.trinke("weiss:hasenklee"); gleich(k.spieler.leuchten, true); k.trankEnde(); gleich(!!k.spieler.leuchten, false);
});
test("Spieler: sprungFaktor wirkt auf die Anfangsgeschwindigkeit des Sprungs", function(){
  var w = trankWelt(), s = new SC.Spieler({ id: "a", pos: [4.5, 61, 4.5], blick: [0, 0], modus: "survival" }); s.schritt(w, trankRuhe, 1 / 60); s.sprungFaktor = 1.4;
  s.schritt(w, Object.assign({}, trankRuhe, { springen: true, springenNeu: true }), 1 / 60); wahr(Math.abs(s.geschw[1] - SC.PHYSIK.sprung * 1.4) < 0.01, "geschw " + s.geschw[1]);
});
test("Spieler: Schwerkraftfaktor bremst das Fallen, die Sprunghöhe bleibt", function(){
  function fall(f){ var w = trankWelt(), s = new SC.Spieler({ id: "a", pos: [4.5, 90, 4.5], blick: [0, 0], modus: "survival" }); if(f) s.schwerkraftFaktor = f; for(var i = 0; i < 15; i++) s.schritt(w, trankRuhe, 1 / 60); return s.geschw[1]; }
  wahr(Math.abs(fall(0.35) - 0.35 * fall()) < 0.01, "Fallgeschwindigkeit " + fall(0.35) + " gegen " + fall());
  var w = trankWelt(), s = new SC.Spieler({ id: "a", pos: [4.5, 61, 4.5], blick: [0, 0], modus: "survival" }); s.schritt(w, trankRuhe, 1 / 60); s.schwerkraftFaktor = 0.35;
  s.schritt(w, Object.assign({}, trankRuhe, { springen: true, springenNeu: true }), 1 / 60); wahr(Math.abs(s.geschw[1] - SC.PHYSIK.sprung * Math.sqrt(0.35)) < 0.01, "Sprunggeschwindigkeit " + s.geschw[1]);
});

// --- Speichern, Trinken und Spielablauf ---
test("Spielstand: neuer Stand hat trank null, alter Stand ohne Feld wird zu null", function(){
  var d = SC.Spielstand.neu({ name: "T", seedText: "t", modus: "survival" }); gleich(d.spieler.trank, null);
  var alt = JSON.parse(JSON.stringify(d)); delete alt.spieler.trank; gleich(SC.Spielstand.migriere(alt).daten.spieler.trank, null);
  gleich(SC.Spielstand.figur(d).trank, null);
});
test("Spielstand: laufender Trank überlebt Speichern und Laden mit Restzeit, auch als Gast-Figur", function(){
  var k = trankKampf(); k.trinke("rot:fuchsgras"); k.zeitTrank(50);
  SC.Spielstand.ausSpieler(k.daten, k.spieler, k); var j = JSON.parse(JSON.stringify(k.daten));
  gleich(j.spieler.trank.kristall, "rot"); gleich(j.spieler.trank.pflanze, "fuchsgras"); gleich(j.spieler.trank.rest, 130);
  var k2 = new SC.Kampf(k.welt, new SC.Spieler({ id: "b", pos: [4.5, 61, 4.5], modus: "survival" }), SC.Spielstand.migriere(j).daten, SC.zufall(2)); gleich(k2.trank.rest, 130); gleich(k2.werte.schadenBonus >= 25, true);
  var f = SC.Spielstand.figur(j); gleich(f.trank.pflanze, "fuchsgras");
  var ein = SC.Spielstand.neu({ name: "G", seedText: "g", modus: "survival" }); SC.Spielstand.figurUebernehmen(ein, f); gleich(ein.spieler.trank.rest, 130);
  k.trankEnde(); SC.Spielstand.ausSpieler(k.daten, k.spieler, k); gleich(k.daten.spieler.trank, null);
});
test("Kampf: Besiegtwerden und Zuschauermodus beenden den Trank", function(){
  var k = trankKampf(); k.trinke("gelb:hasenklee"); k.werte.lp = 0; k.zeitTrank(1); gleich(k.trank, null); wahr(k.werte.tempoBonus < 30, "Bonus weg");
  var k2 = trankKampf(); k2.trinke("gelb:hasenklee"); k2.spieler.modus = "zuschauer"; k2.zeitTrank(1); gleich(k2.trank, null);
  var k3 = trankKampf(); k3.trinke("gelb:hasenklee"); k3.zeitTrank(1); gleich(k3.trank.rest, 179);
});
function trankSpiel(modus, plaetze){
  var k = trankKampf(); k.spieler.modus = modus; plaetze.forEach(function(p, i){ k.rucksack.plaetze[i] = p; }); k.spieler.auswahl = 0;
  var log = { hinweis: [], klang: [] };
  return { s: { kampf: k, spieler: k.spieler, ui: { hinweis: function(t){ log.hinweis.push(t); } }, audio: { spiele: function(n){ log.klang.push(n); } } }, k: k, log: log };
}
test("Spiel: trankTrinken im Survival verbraucht einen Trank und setzt den Zustand", function(){
  var t = trankSpiel("survival", [{ block: SC.B.TRANK, anzahl: 2, trank: "gelb:hasenklee" }]);
  gleich(SC.Spiel.prototype.trankTrinken.call(t.s, 0), true); gleich(t.k.rucksack.plaetze[0].anzahl, 1); gleich(t.k.trank.kristall, "gelb"); gleich(t.log.klang[0], "trinken"); gleich(t.log.hinweis.length, 1);
  wahr(t.log.hinweis[0].indexOf("Hasenklee") >= 0, "Hinweis nennt die Pflanze: " + t.log.hinweis[0]);
  SC.Spiel.prototype.trankTrinken.call(t.s, 0); gleich(t.k.rucksack.plaetze[0], null);
  gleich(SC.Spiel.prototype.trankTrinken.call(t.s, 0), false);   // Platz leer
});
test("Spiel: trankTrinken im Kreativ verbraucht nichts, im Zuschauermodus geht es nicht", function(){
  var t = trankSpiel("kreativ", [{ block: SC.B.TRANK, anzahl: 1, trank: "rot:hasenklee" }]);
  gleich(SC.Spiel.prototype.trankTrinken.call(t.s, 0), true); gleich(t.k.rucksack.plaetze[0].anzahl, 1); gleich(t.k.trank.kristall, "rot");
  var z = trankSpiel("zuschauer", [{ block: SC.B.TRANK, anzahl: 1, trank: "rot:hasenklee" }]);
  gleich(SC.Spiel.prototype.trankTrinken.call(z.s, 0), false); gleich(z.k.trank, null); gleich(z.k.rucksack.plaetze[0].anzahl, 1);
  var kein = trankSpiel("survival", [{ block: SC.B.STEIN, anzahl: 3 }]); gleich(SC.Spiel.prototype.trankTrinken.call(kein.s, 0), false); gleich(kein.k.rucksack.plaetze[0].anzahl, 3);
  var kaputt = trankSpiel("survival", [{ block: SC.B.TRANK, anzahl: 1, trank: "kaputt" }]); gleich(SC.Spiel.prototype.trankTrinken.call(kaputt.s, 0), false); gleich(kaputt.k.rucksack.plaetze[0].anzahl, 1);
});
