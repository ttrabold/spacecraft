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
  return { s: { kampf: k, spieler: k.spieler, trankSchluck: SC.Spiel.prototype.trankSchluck, ui: { hinweis: function(t){ log.hinweis.push(t); } }, audio: { spiele: function(n){ log.klang.push(n); } } }, k: k, log: log };
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

// --- Kessel, Rezeptbuch, Kreativ-Reiter, Trinken im Rucksack ---
function kesselAuf(fn){ var w = document.createElement("div"); document.body.appendChild(w); var ui = ui2(w, { beiWeiter: function(){} }), k = k2(); try{ fn(w, ui, k); } finally { w.remove(); } }
function kq(w, a, id){ return w.querySelector('[data-aktion="' + a + '"]' + (id ? '[data-id="' + id + '"]' : "")); }
test("Rezeptnamen: Kessel und Flasche haben Namen für die Werkbank", function(){
  SC.REZEPTE.filter(function(r){ return r.art === "bauteil"; }).forEach(function(r){ wahr(SC.T.rezeptName[r.id], "Name fehlt: " + r.id); });
});
test("Kessel: Fenster zeigt sechs Kristalle und neun Pflanzen", function(){ kesselAuf(function(w, ui, k){
  ui.zeigeKessel(k, {}); gleich(w.querySelectorAll('[data-aktion="kristall"]').length, 6); gleich(w.querySelectorAll('[data-aktion="pflanze"]').length, 9);
  wahr(kq(w, "brauen").disabled, "Brauen gesperrt ohne Auswahl"); wahr(kq(w, "rezeptbuch"), "Rezeptbuch-Knopf"); wahr(kq(w, "fertig"), "Fertig-Knopf");
}); });
test("Kessel: Brauen ist gesperrt ohne Zutaten und braut mit Zutaten", function(){ kesselAuf(function(w, ui, k){
  ui.zeigeKessel(k, {}); kq(w, "kristall", "rot").click(); kq(w, "pflanze", "hasenklee").click(); wahr(kq(w, "brauen").disabled, "ohne Zutaten gesperrt"); gleich(k.rucksack.hatTrank("rot:hasenklee"), 0);
  k.rucksack.lege({ block: SC.B.FLASCHE, anzahl: 1 }); k.rucksack.lege({ block: SC.B.KRISTALL_ROT, anzahl: 1 }); k.rucksack.lege({ block: SC.B.HASENKLEE, anzahl: 1 });
  var log = []; ui.zeigeKessel(k, { beiBrauen: function(s){ log.push(s); } }); kq(w, "kristall", "rot").click(); kq(w, "pflanze", "hasenklee").click(); wahr(!kq(w, "brauen").disabled, "mit Zutaten frei");
  kq(w, "brauen").click(); gleich(k.rucksack.hatTrank("rot:hasenklee"), 1); gleich(log.join(), "rot:hasenklee"); wahr(kq(w, "brauen").disabled, "danach wieder gesperrt");
}); });
test("Rezeptbuch: nennt jede Wirkung und jede Pflanze", function(){ kesselAuf(function(w, ui){
  var zu = 0; ui.zeigeRezeptbuch(function(){ zu++; }); var t = w.textContent;
  SC.PFLANZEN_REIHE.forEach(function(i){ wahr(t.indexOf(SC.PFLANZEN[i].name) >= 0, "Pflanze " + i); });
  Object.keys(SC.TRANK.wirkung).forEach(function(n){ wahr(t.indexOf(SC.T.trankWirkungLang[SC.TRANK.wirkung[n].art]) >= 0, "Wirkung " + n); });
  kq(w, "zurueck").click(); gleich(zu, 1);
}); });
test("Kreativ-Reiter Tränke: 54 Kacheln, Antippen meldet den Schlüssel", function(){ kesselAuf(function(w, ui){
  var log = []; ui.zeigeBlockauswahl(function(){}, { beiTrank: function(s){ log.push(s); } });
  var kn = w.querySelectorAll('[data-aktion="trank"]'); gleich(kn.length, 54); kn[0].click(); gleich(log.length, 1); wahr(SC.Trank.teile(log[0]), "gültiger Schlüssel " + log[0]);
  var ohne = document.createElement("div"); document.body.appendChild(ohne); ui2(ohne, { beiWeiter: function(){} }).zeigeBlockauswahl(function(){}, {}); gleich(ohne.querySelectorAll('[data-aktion="trank"]').length, 0, "ohne beiTrank kein Reiter"); ohne.remove();
}); });
test("Rucksack: Trank hat Trinken als erste Aktion und ruft beiTrinken", function(){ kesselAuf(function(w, ui, k){
  k.rucksack.lege({ block: SC.B.TRANK, anzahl: 2, trank: "gelb:hasenklee" }); var log = [], pl = -1; k.rucksack.plaetze.forEach(function(s, i){ if(s && s.block === SC.B.TRANK) pl = i; });
  ui.zeigeRucksack(k, { beiTrinken: function(i){ log.push(i); } }); w.querySelector('.rs-platz[data-i="' + pl + '"]').click(); var knoepfe = [].map.call(w.querySelectorAll(".rs-menue button"), function(b){ return b.getAttribute("data-aktion"); });
  gleich(knoepfe[0], "trinken"); wahr(knoepfe.indexOf("wegwerfen") > 0, "Wegwerfen nie zuerst"); wahr(w.querySelector(".rs-menue h3").textContent.indexOf("Hasenklee") >= 0, "Name nennt die Pflanze");
  w.querySelector('.rs-menue [data-aktion="trinken"]').click(); gleich(log.join(), String(pl));
}); });

// --- Verwandlung (Aussehen) und Netz ---
function meshZahl(g){ var n = 0; g.traverse(function(o){ if(o.isMesh) n++; }); return n; }
test("Verwandlung: jede der neun Pflanzen baut Teile, null baut sie ab", function(){
  var f = SC.Figur.baue("#3a6fd8"), basis = meshZahl(f.gruppe);
  SC.PFLANZEN_REIHE.forEach(function(id){ SC.Figur.verwandle(f, "rot:" + id); wahr(meshZahl(f.gruppe) > basis + 2, "Teile für " + id); SC.Figur.verwandle(f, null); gleich(meshZahl(f.gruppe), basis, "abgebaut nach " + id); });
});
test("Verwandlung: gleicher Schlüssel ändert nichts, ungültiger baut nichts", function(){
  var f = SC.Figur.baue("#3a6fd8"), basis = meshZahl(f.gruppe); SC.Figur.verwandle(f, "gelb:fuchsgras"); var g1 = f.traenke, n = meshZahl(f.gruppe);
  SC.Figur.verwandle(f, "gelb:fuchsgras"); wahr(f.traenke === g1, "gleiche Gruppe"); gleich(meshZahl(f.gruppe), n);
  SC.Figur.verwandle(f, "kaputt"); gleich(meshZahl(f.gruppe), basis, "ungültig wie kein Trank"); SC.Figur.verwandle(f, undefined); gleich(meshZahl(f.gruppe), basis);
});
test("Verwandlung: Leuchtfarbe folgt dem Kristall", function(){
  var f = SC.Figur.baue("#3a6fd8"); SC.Figur.verwandle(f, "gelb:hasenklee"); var c1 = f.trankAura[0].color.getHex(); SC.Figur.verwandle(f, "blau:hasenklee"); var c2 = f.trankAura[0].color.getHex();
  gleich(c1, new THREE.Color(SC.TRANK.wirkung.gelb.farbe).getHex()); gleich(c2, new THREE.Color(SC.TRANK.wirkung.blau.farbe).getHex()); wahr(c1 !== c2, "verschieden");
});
test("Verwandlung: höchstens 40 zusätzliche Meshes je Figur, bei allen 54 Tränken", function(){
  var f = SC.Figur.baue("#3a6fd8"), basis = meshZahl(f.gruppe);
  Object.keys(SC.TRANK.wirkung).forEach(function(k){ SC.PFLANZEN_REIHE.forEach(function(p){ SC.Figur.verwandle(f, k + ":" + p); wahr(meshZahl(f.gruppe) - basis <= 40, k + ":" + p + " " + (meshZahl(f.gruppe) - basis)); }); });
});
test("Verwandlung: Funken bewegen sich, ohne Trank wirft trankBild nicht", function(){
  var f = SC.Figur.baue("#3a6fd8"); SC.Figur.trankBild(f, 123); SC.Figur.verwandle(f, "rot:hasenklee"); SC.Figur.trankBild(f, 0); var p0 = f.trankFunken[0].position.clone(); SC.Figur.trankBild(f, 700); wahr(f.trankFunken[0].position.distanceTo(p0) > 0.05, "bewegt");
  SC.Figur.verwandle(f, null); SC.Figur.trankBild(f, 900); wahr(true);
});
test("Netz: trank geht vom Gast zum Gastgeber, ungültig und fehlend ergeben keinen Trank", function(){
  wahr(SC.NETZ_PROTOKOLL >= 11, "Protokoll mindestens 11 (Zaubertränke)");
  var u, r;
  return raumOffen({ antwort: true }).then(function(x){ u = x; r = raumGast(u, "Ben"); return raumBeitritt(u, r); }).then(function(){
    var ich = { pos: [5, 70, 5], blick: [0, 0], modus: "survival", stufe: 1, lebt: true, trank: "rot:hasenklee" }; r.g.takt(0.1, ich); return raumLauf(u.netz);
  }).then(function(){
    gleich(u.h.spieler[0].trank, "rot:hasenklee");
    r.g.takt(0.1, { pos: [5, 70, 5], blick: [0, 0], modus: "survival", stufe: 1, lebt: true, trank: "kaputt" }); return raumLauf(u.netz);
  }).then(function(){
    gleich(u.h.spieler[0].trank, null, "ungültiger Schlüssel wird verworfen");
    r.g.takt(0.1, { pos: [5, 70, 5], blick: [0, 0], modus: "survival", stufe: 1, lebt: true, trank: "gelb:fuchsgras" }); return raumLauf(u.netz);
  }).then(function(){
    gleich(u.h.spieler[0].trank, "gelb:fuchsgras");
    r.g.takt(0.1, { pos: [5, 70, 5], blick: [0, 0], modus: "survival", stufe: 1, lebt: true }); return raumLauf(u.netz);   // alter Gast ohne Feld
  }).then(function(){ gleich(u.h.spieler[0].trank, null, "ohne Feld kein Trank"); });
});
test("Netz: der Gastgeber meldet den eigenen Trank an die Gäste", function(){
  var u, r, hid;
  return raumOffen({ antwort: true }).then(function(x){ u = x; hid = u.daten.spieler.figurId; r = raumGast(u, "Ben"); return raumBeitritt(u, r); }).then(function(){
    u.h.takt(0.1, { pos: [1, 80, 2], blick: [0, 0], modus: "survival", stufe: 1, lebt: true, trank: "blau:eisblume" }); return raumLauf(u.netz);
  }).then(function(){
    gleich(r.g.mitspieler[hid].trank, "blau:eisblume");
    var l = SC.Spiel.prototype._mitspielerListe.call({ raum: r.g, welt: null }), e = l.filter(function(x){ return x.id === hid; })[0];
    wahr(e, "Gastgeber in der Liste der Darstellung"); gleich(e.trank, "blau:eisblume", "Mitspielerliste reicht trank weiter");
  });
});
test("Render: Weiß (Nachtsicht) schaltet das Eigenlicht der Figur ein, andere Tränke nicht", function(){
  var r = { uniforms: { leuchtStaerke: { value: 0 }, leuchtPos: { value: new THREE.Vector3() } }, _fig: SC.Figur.baue("#3a6fd8"), trank: SC.Render.prototype.trank, _leuchtBild: SC.Render.prototype._leuchtBild };
  r._leuchtBild(1, 2, 3); gleich(r.uniforms.leuchtStaerke.value, 0, "ohne Trank kein Licht");
  r.trank("weiss:hasenklee"); r._leuchtBild(1, 2, 3); gleich(r.uniforms.leuchtStaerke.value, SC.LEUCHT_STAERKE); gleich(r.uniforms.leuchtPos.value.y, 3.2, "Licht um die Figur");
  r.trank("rot:hasenklee"); r._leuchtBild(1, 2, 3); gleich(r.uniforms.leuchtStaerke.value, 0, "Rot gibt kein Licht");
  r.trank("weiss:hasenklee"); r.trank(null); r._leuchtBild(1, 2, 3); gleich(r.uniforms.leuchtStaerke.value, 0, "Ende des Tranks");
  r._leuchtet = true; r._leuchtBild(1, 2, 3); gleich(r.uniforms.leuchtStaerke.value, SC.LEUCHT_STAERKE, "Rüstung leuchtet weiter");
});

// --- Pflanzen in der Welt: Beute, Wachsen, Nachwachsen ---
function pflanzenIds(){ return SC.PFLANZEN_REIHE.map(function(i){ return SC.PFLANZEN[i].block; }); }
test("Beute: Pflanze des Planeten mit Chance, Boss immer", function(){
  var mit = SC.Trank.beute("start", false, function(){ return 0; }); wahr(mit && mit.anzahl === 1, "Pflanze"); var p = SC.PFLANZEN_REIHE.filter(function(i){ return SC.PFLANZEN[i].block === mit.block; })[0]; gleich(SC.PFLANZEN[p].planet, "start");
  gleich(SC.Trank.beute("start", false, function(){ return 0.99; }), null); wahr(SC.Trank.beute("glutfrost", true, function(){ return 0.99; }), "Boss immer");
  gleich(SC.Trank.beute("gibtesnicht", true, function(){ return 0; }), null, "unbekannter Planet");
  var arten = {}; for(var i = 0; i < 30; i++){ var b = SC.Trank.beute("rankenmoor", true, (function(w){ return function(){ return w; }; })(i / 30)); arten[b.block] = 1; } gleich(Object.keys(arten).length, 3, "alle drei Pflanzen des Planeten kommen vor");
});
test("Beute: Gegner lassen Pflanzen ihres Planeten fallen, auch in Welten ohne Pflanzen", function(){
  var d = SC.Spielstand.neu({ name: "B", seedText: "b", modus: "survival" }); d.planeten.start.generatorVersion = 3;
  var g = SC.Wesen.neu(new SC.Welt(new SC.Planet({ id: "start", seed: 5 })), "gegner", { gegnerArt: "krabbler", stufe: 1, pos: [4, 61, 4], lp: 1 });
  var r = SC.Kampf.beuteFuer(g, d, function(){ return 0; }), ids = pflanzenIds(); wahr(r.beute.some(function(x){ return ids.indexOf(x.block) >= 0; }), "Pflanze in der Beute");
  d.aktuellerPlanet = "glutfrost"; var r2 = SC.Kampf.beuteFuer(g, d, function(){ return 0; }); wahr(r2.beute.some(function(x){ return ids.indexOf(x.block) >= 0 && SC.BLOECKE[x.block] && ["Eisblume", "Frostbeere", "Glutmohn"].indexOf(SC.BLOECKE[x.block].name) >= 0; }), "Pflanze von Glutfrost");
  var r3 = SC.Kampf.beuteFuer(g, d, function(){ return 0.99; }); gleich(r3.beute.some(function(x){ return ids.indexOf(x.block) >= 0; }), false, "ohne Glück keine");
});
function chunkMitVersion(id, v, cx, cz){ var p = new SC.Planet({ id: id, seed: 5, palette: id, generatorVersion: v }); return new SC.Generator(p).chunk(cx, cz); }
test("Generator: Version 4 hat Pflanzen, Version 3 bleibt Byte für Byte unverändert (alle drei Planeten)", function(){
  var ids = pflanzenIds();
  ["start", "glutfrost", "rankenmoor"].forEach(function(pl){
    var n3 = 0, n4 = 0, gleichOhne = true;
    for(var cx = 0; cx < 4; cx++) for(var cz = 0; cz < 4; cz++){
      var a = chunkMitVersion(pl, 3, cx, cz), b = chunkMitVersion(pl, 4, cx, cz);
      for(var i = 0; i < a.length; i++){ if(ids.indexOf(a[i]) >= 0) n3++; var bi = b[i]; if(ids.indexOf(bi) >= 0){ n4++; bi = SC.B.LUFT; } if(a[i] !== bi) gleichOhne = false; }
    }
    gleich(n3, 0, pl + ": Version 3 ohne Pflanzen"); wahr(n4 >= 3, pl + ": Version 4 mit Pflanzen (" + n4 + ")"); wahr(gleichOhne, pl + ": ohne die Pflanzen identisch zu Version 3");
  });
});
test("Generator: neue Welten bekommen Version 4, alte Pflanzen stehen nur auf Planeten, zu denen sie gehören", function(){
  gleich(SC.GENERATOR_VERSION, 4);
  var ids = pflanzenIds(), ok = true, planetVon = {}; SC.PFLANZEN_REIHE.forEach(function(i){ planetVon[SC.PFLANZEN[i].block] = SC.PFLANZEN[i].planet; });
  ["start", "glutfrost", "rankenmoor"].forEach(function(pl){ var c = chunkMitVersion(pl, 4, 1, 1); for(var i = 0; i < c.length; i++) if(ids.indexOf(c[i]) >= 0 && planetVon[c[i]] !== pl) ok = false; }); wahr(ok, "falsche Pflanze auf dem Planeten");
});
function nwWelt(){ var w = new SC.Welt(new SC.Planet({ id: "start", seed: 5 })); for(var x = 0; x < 16; x++) for(var z = 0; z < 16; z++){ for(var y = 1; y < 128; y++) w.setzeBlock(x, y, z, y <= 60 ? SC.B.STEIN : SC.B.LUFT, "system"); } return w; }
test("Nachwachsen: fälliger Eintrag setzt die Pflanze, nicht fälliger bleibt", function(){
  var w = nwWelt(), l = []; SC.Trank.pflueckeMerken(l, 4, 61, 4, SC.B.HASENKLEE, 0); SC.Trank.pflueckeMerken(l, 6, 61, 6, SC.B.EISBLUME, 50);
  gleich(l[0][4], SC.TRANK.nachwuchs, "fällig nach der Wartezeit"); gleich(SC.Trank.nachwuchsTakt(w, l, SC.TRANK.nachwuchs - 1), 0); gleich(w.holeBlock(4, 61, 4), SC.B.LUFT);
  gleich(SC.Trank.nachwuchsTakt(w, l, SC.TRANK.nachwuchs), 1); gleich(w.holeBlock(4, 61, 4), SC.B.HASENKLEE); gleich(l.length, 1, "erledigter Eintrag weg"); gleich(l[0][3], SC.B.EISBLUME);
  gleich(SC.Trank.nachwuchsTakt(w, l, 50 + SC.TRANK.nachwuchs), 1); gleich(w.holeBlock(6, 61, 6), SC.B.EISBLUME); gleich(l.length, 0);
});
test("Nachwachsen: belegte Zelle und fehlender Boden werden verworfen, nichts wird überschrieben", function(){
  var w = nwWelt(), l = []; w.setzeBlock(4, 61, 4, SC.B.BRETTER, "spieler"); SC.Trank.pflueckeMerken(l, 4, 61, 4, SC.B.HASENKLEE, 0);
  w.setzeBlock(8, 60, 8, SC.B.LUFT, "spieler"); SC.Trank.pflueckeMerken(l, 8, 61, 8, SC.B.HASENKLEE, 0);
  gleich(SC.Trank.nachwuchsTakt(w, l, 1e6), 0); gleich(w.holeBlock(4, 61, 4), SC.B.BRETTER, "Bau bleibt"); gleich(w.holeBlock(8, 61, 8), SC.B.LUFT, "keine Pflanze in der Luft"); gleich(l.length, 0, "beide verworfen");
});
test("Nachwachsen: ungeladene Chunks warten, Liste ist auf 400 begrenzt", function(){
  var w = nwWelt(), l = []; SC.Trank.pflueckeMerken(l, 1000, 61, 1000, SC.B.HASENKLEE, 0); gleich(w.istGeladen(62, 62), false);
  gleich(SC.Trank.nachwuchsTakt(w, l, 1e6), 0); gleich(l.length, 1, "bleibt"); gleich(w.istGeladen(62, 62), false, "Chunk wurde nicht geladen");
  var v = []; for(var i = 0; i < 450; i++) SC.Trank.pflueckeMerken(v, i, 61, 0, SC.B.HASENKLEE, i); gleich(v.length, 400); gleich(v[0][0], 50, "die ältesten fallen weg");
});
test("Nachwachsen: Pflücken wird gemerkt (Spieler und Gast), anderes nicht; Stand ohne nachwuchs wirft nicht", function(){
  var d = { nachwuchs: undefined, spielzeit: 12 };
  SC.Trank.beiBlock(d, "start", { x: 1, y: 2, z: 3, id: SC.B.LUFT, alt: SC.B.FUCHSGRAS, quelle: "spieler" }); gleich(d.nachwuchs.start.length, 1); gleich(d.nachwuchs.start[0][3], SC.B.FUCHSGRAS); gleich(d.nachwuchs.start[0][4], 12 + SC.TRANK.nachwuchs);
  SC.Trank.beiBlock(d, "start", { x: 1, y: 2, z: 4, id: SC.B.LUFT, alt: SC.B.EISBLUME, quelle: "netz:abc" }); gleich(d.nachwuchs.start.length, 2);
  SC.Trank.beiBlock(d, "start", { x: 1, y: 2, z: 5, id: SC.B.LUFT, alt: SC.B.EISBLUME, quelle: "system" }); SC.Trank.beiBlock(d, "start", { x: 1, y: 2, z: 5, id: SC.B.STEIN, alt: SC.B.EISBLUME, quelle: "spieler" }); SC.Trank.beiBlock(d, "start", { x: 1, y: 2, z: 5, id: SC.B.LUFT, alt: SC.B.STEIN, quelle: "spieler" });
  gleich(d.nachwuchs.start.length, 2, "nur Pflücken von Spieler oder Gast");
  var alt = SC.Spielstand.neu({ name: "N", seedText: "n", modus: "survival" }); delete alt.nachwuchs; gleich(JSON.stringify(SC.Spielstand.migriere(alt).daten.nachwuchs), "{}");
  var s = { daten: { spielzeit: 5 }, welt: nwWelt(), rolle: "einzel" }; SC.Spiel.prototype._nachwuchsTakt.call(s, 1); wahr(true);
});

// --- Geräusche, Anleitung ---
test("Klang: brauen und trinken sind hörbar, endlich und übersteuern nicht", function(){
  function messe(name){ var ctx = new OfflineAudioContext(1, 44100 * 2, 44100), z = ctx.createGain(); z.connect(ctx.destination); SC.Klang.erzeuge(ctx, z, name, {}, 0.8);
    return ctx.startRendering().then(function(b){ var d = b.getChannelData(0), s = 0, mx = 0; for(var i = 0; i < d.length; i++){ if(!isFinite(d[i])) return { rms: NaN, peak: 9 }; s += d[i] * d[i]; mx = Math.max(mx, Math.abs(d[i])); } return { rms: Math.sqrt(s / d.length), peak: mx }; }); }
  return Promise.all([messe("brauen"), messe("trinken")]).then(function(r){ r.forEach(function(x, i){ wahr(x.rms > 0.005, ["brauen", "trinken"][i] + " zu leise: " + x.rms); wahr(x.peak < 0.9, "übersteuert: " + x.peak); }); });
});
test("Anleitung: Abschnitt Zaubertränke erklärt Kessel, Flasche, Kristall, Pflanze, Rezeptbuch und Trinken", function(){
  var a = SC.T.anleitung.abschnitte.filter(function(x){ return x[0] === "Zaubertränke"; })[0]; wahr(a && a[1].length >= 6, "Abschnitt");
  var t = a[1].join(" "); ["Kessel", "Flasche", "Kristall", "Pflanze", "Rezeptbuch", "3 Minuten", "Kreativ"].forEach(function(w){ wahr(t.indexOf(w) >= 0, "nennt " + w); });
});

// --- Befunde der Abschlussprüfung ---
test("Final: Aussehen und Licht der eigenen Figur kommen auch auf einem neuen Renderer an (Planetenwechsel, Neustart)", function(){
  var s = { kampf: { trank: { kristall: "weiss", pflanze: "hasenklee", rest: 100 } }, _trankSync: SC.Spiel.prototype._trankSync };
  function neuRender(){ return { _fig: SC.Figur.baue("#3a6fd8"), trank: SC.Render.prototype.trank }; }
  var r1 = neuRender(); s.render = r1; s._trankSync(); gleich(r1._trankKey, "weiss:hasenklee"); wahr(r1._trankLicht, "Nachtsicht-Licht");
  var teile = meshZahl(r1._fig.gruppe); s._trankSync(); gleich(meshZahl(r1._fig.gruppe), teile, "gleicher Schlüssel baut nichts neu");
  var r2 = neuRender(); s.render = r2; s._trankSync(); gleich(r2._trankKey, "weiss:hasenklee", "neuer Renderer bekommt den Trank"); wahr(meshZahl(r2._fig.gruppe) > meshZahl(SC.Figur.baue("#3a6fd8").gruppe), "Teile gebaut");
  s.kampf.trank = null; s._trankSync(); gleich(r2._trankKey, null, "Ende des Tranks"); gleich(r2._trankLicht, false);
});
test("Final: Trank aus der Truhe nehmen und zurücklegen behält den Schlüssel", function(){
  var a = wb(), d = tdaten(), T = SC.Truhen.von(d, new SC.Planet(d.planeten.start));
  var anb = { hole: function(){ return Promise.resolve({ plaetze: T.inhalt(1, 60, 1) }); }, nimm: function(i){ var s = T.nimm(1, 60, 1, i); return Promise.resolve({ sache: s, plaetze: T.inhalt(1, 60, 1) }); }, lege: function(s){ var r = T.lege(1, 60, 1, s); return Promise.resolve({ rest: r, plaetze: T.inhalt(1, 60, 1) }); } };
  a.k.rucksack.lege({ block: SC.B.TRANK, anzahl: 2, trank: "rot:hasenklee" }); var pl = -1; a.k.rucksack.plaetze.forEach(function(s, i){ if(s && s.block === SC.B.TRANK) pl = i; });
  a.ui.zeigeTruhe(a.k, anb, {});
  function warte(){ return new Promise(function(ok){ setTimeout(ok, 0); }); }
  return warte().then(function(){ a.w.querySelector('[data-aktion="rplatz"][data-i="' + pl + '"]').click(); return warte(); }).then(function(){
    gleich(T.inhalt(1, 60, 1)[0].trank, "rot:hasenklee", "in der Truhe"); gleich(a.k.rucksack.hatTrank("rot:hasenklee"), 0);
    a.w.querySelector('[data-aktion="tplatz"][data-i="0"]').click(); return warte();
  }).then(function(){ gleich(a.k.rucksack.hatTrank("rot:hasenklee"), 2, "zurück im Rucksack mit Schlüssel"); });
});
test("Final: Rückkehr eines getrennten Gastes lässt das Leuchten durchsichtig (Deckkraft wird wiederhergestellt)", function(){
  var m = _ms(); m.r.aktualisiere([_e(1, { trank: "weiss:hasenklee" })], [0, 0, 0], 0.1); var f = m.r.figuren.get(1).f, grund = f.trankAura[0].opacity;
  gleich(grund, 0.2); m.r.aktualisiere([_e(1, { trank: "weiss:hasenklee", verbunden: false })], [0, 0, 0], 0.1); wahr(f.trankAura[0].opacity < grund, "getrennt: noch durchsichtiger");
  m.r.aktualisiere([_e(1, { trank: "weiss:hasenklee", verbunden: true })], [0, 0, 0], 0.1); gleich(f.trankAura[0].opacity, grund, "wieder verbunden: wie vorher"); gleich(f.trankFunken[0].material.opacity, 1, "Funken wieder deckend");
});
function trankSurv(){
  var s = survSpiel(); s.render = { markiere: function(){}, wesen: { risse: function(){}, funken: function(){}, zahl: function(){} }, ausruestung: function(){}, trank: function(){}, hieb: function(){}, blocke: function(){}, fps: 60 };
  s.eingabe = { touchAktiv: false, gamepadAktiv: false, gebeMausFrei: function(){} }; s.auftauchen = { schritt: function(){}, zerfallen: [] }; s.einstellungen = { fpsAnzeigen: false };
  s.ui = { hinweis: function(){}, hud: function(){}, kampfHud: function(){}, zeigeBesiegt: function(){}, zeigeKessel: function(){ s._kessel = true; }, zeigeRezeptbuch: function(){} };
  s._zf = SC.zufall(1); s.tageszeit = 0.5; s.kampf.rucksack.plaetze[0] = { block: SC.B.TRANK, anzahl: 1, trank: "gelb:hasenklee" }; s.spieler.auswahl = 0; return s;
}
var trankE = function(o){ return Object.assign({ ausweichen: false, setzenGehalten: false, abbauen: false, abbauenGehalten: false, setzen: false, vor: false, zurueck: false, links: false, rechts: false }, o || {}); };
test("Final: Setzen auf einen Kessel mit einem Trank in der Hand öffnet den Kessel, trinkt nicht", function(){
  var s = trankSurv(); s.welt.setzeBlock(4, 91, 3, SC.B.KESSEL, "system"); wahr(SC.zielen(s.welt, s.spieler.augen(), s.spieler.richtung(), 6), "Kessel anvisiert");
  s._survival(trankE({ setzen: true }), 0.05, false, 1000); wahr(s._kessel, "Kessel offen"); gleich(s.kampf.trank, null, "nichts getrunken"); gleich(s.kampf.rucksack.plaetze[0].anzahl, 1, "Trank noch da");
});
test("Final: Setzen auf einen gewöhnlichen Block mit einem Trank in der Hand trinkt ihn", function(){
  var s = trankSurv(); s.welt.setzeBlock(4, 91, 3, SC.B.STEIN, "system");
  s._survival(trankE({ setzen: true }), 0.05, false, 1000); gleich(s.kampf.trank && s.kampf.trank.kristall, "gelb"); gleich(s.kampf.rucksack.plaetze[0], null, "verbraucht");
});
test("Final: Der Trank läuft nicht ab, solange ein Menü offen ist", function(){
  var s = trankSurv(); s.kampf.trinke("gelb:hasenklee"); s._survival(trankE(), 5, true, 1000); gleich(s.kampf.trank.rest, 180, "Menü offen: keine Zeit vergangen");
  s._survival(trankE(), 5, false, 2000); gleich(s.kampf.trank.rest, 175, "Spiel läuft: Zeit vergeht");
});

// --- Kostüm und Bewegung (Überarbeitung nach dem Probespiel: Verwandlung deutlich stärker) ---
var KOSTUEM_TEILE = ["koerper", "kopf", "armL", "armR", "beinL", "beinR"];
function figurFarben(f){ return KOSTUEM_TEILE.map(function(n){ return f[n].material.color.getHex(); }); }
test("Kostüm: jede Pflanze färbt die ganze Figur in Tierfarben, Ablegen und Wechseln stellt die Spielerfarben wieder her", function(){
  var f = SC.Figur.baue("#3a6fd8"), orig = figurFarben(f), haupt = {};
  SC.PFLANZEN_REIHE.forEach(function(id){
    SC.Figur.verwandle(f, "rot:" + id); var c = figurFarben(f); haupt[c[0]] = id; wahr(c.join() !== orig.join(), id + ": Farben geändert");
    wahr(c[0] !== orig[0] && c[1] !== orig[1] && c[2] !== orig[2] && c[4] !== orig[4], id + ": Körper, Kopf, Arme und Beine sind Tier");
    SC.Figur.verwandle(f, null); gleich(figurFarben(f).join(), orig.join(), id + ": Spielerfarben zurück");
  });
  gleich(Object.keys(haupt).length, 9, "jedes Tier hat eine eigene Körperfarbe");
  SC.Figur.verwandle(f, "rot:hasenklee"); SC.Figur.verwandle(f, "blau:katzenminze"); SC.Figur.verwandle(f, null); gleich(figurFarben(f).join(), orig.join(), "Wechsel von Trank zu Trank und dann Ende");
});
test("Bewegung: jedes Tier hat bewegte Teile (Ohren, Schwänze, Flügel, Flammen), die sich über die Zeit ändern", function(){
  SC.PFLANZEN_REIHE.forEach(function(id){
    var f = SC.Figur.baue("#3a6fd8"); SC.Figur.verwandle(f, "gelb:" + id); wahr(f.trankAnim && f.trankAnim.length >= 1, id + ": bewegte Teile");
    function stand(){ return f.trankAnim.map(function(a){ return [a.g.rotation.x, a.g.rotation.y, a.g.rotation.z, a.g.scale.y].map(function(x){ return x.toFixed(3); }).join(","); }).join("|"); }
    SC.Figur.trankBild(f, 0); var s0 = stand(); SC.Figur.trankBild(f, 333); var s1 = stand(); wahr(s0 !== s1, id + ": bewegt sich"); SC.Figur.trankBild(f, 0); gleich(stand(), s0, id + ": gleiche Zeit, gleiche Lage");
  });
  var f2 = SC.Figur.baue("#3a6fd8"); SC.Figur.verwandle(f2, "gelb:hasenklee"); SC.Figur.verwandle(f2, null); gleich(f2.trankAnim.length, 0, "ohne Trank keine bewegten Teile");
});
test("Bewegung: Ohren links und rechts schwingen nicht im Gleichtakt, Flügel schlagen nach außen", function(){
  var f = SC.Figur.baue("#3a6fd8"); SC.Figur.verwandle(f, "gelb:hasenklee"); SC.Figur.trankBild(f, 500);
  var ohren = f.trankAnim.filter(function(a){ return a.art === "ohr"; }); gleich(ohren.length, 2); wahr(Math.abs(ohren[0].g.rotation.z - ohren[1].g.rotation.z) > 0.01, "nicht im Gleichtakt");
  var p = SC.Figur.baue("#3a6fd8"); SC.Figur.verwandle(p, "gelb:federfarn"); var fl = p.trankAnim.filter(function(a){ return a.art === "fluegel"; }); gleich(fl.length, 2);
  for(var t = 0; t < 1000; t += 50){ SC.Figur.trankBild(p, t); wahr(fl[0].g.rotation.z * fl[1].g.rotation.z < 0, "Flügel spiegelbildlich bei " + t); wahr(Math.abs(fl[0].g.rotation.z) > 0.1, "weg vom Körper bei " + t); }
});
