// Raum-Protokoll über das Speicher-Netz: Beitritt, Bestätigung, Weltübertragung, Neuverbinden, Abgang
// Zustellen: abwechselnd pumpen und Mikroaufgaben (Promise-then) laufen lassen
function raumLauf(netz){ return new Promise(function(ok){ var i = 0; (function s(){ netz.pumpe(); if(++i < 8) setTimeout(s, 0); else ok(); })(); }); }
// Unechte Uhr für Neuverbinden: jetzt() und warte(ms, fn), vor(ms) feuert fällige Zeitgeber der Reihe nach
function raumUhr(){ var t = 0, l = []; return { jetzt: function(){ return t; }, warte: function(ms, fn){ l.push({ z: t + ms, fn: fn }); }, vor: function(ms){ var ziel = t + ms; for(;;){ l.sort(function(a, b){ return a.z - b.z; }); if(!l.length || l[0].z > ziel) break; var e = l.shift(); t = e.z; e.fn(); } t = ziel; } }; }
function aufbau(o){
  o = o || {};
  var netz = SC.Netz.speicherNetz(), p = new SC.Planet({ id: "start", seed: 1234 }), w = new SC.Welt(p), d = SC.Spielstand.neu({ name: "Mias Welt", seedText: "a", modus: "survival", figurName: "Mia" });
  d.planeten.start.seed = p.seed; d.startpunkt = [1, 80, 2]; w.setzeBlock(3, 60, 3, SC.B.STEIN);
  var u = { netz: netz, welt: w, daten: d, anfragen: [], anfragenWeg: [], spielerListen: [], nachrichten: [], uhr: raumUhr() };
  u.h = new SC.Gastgeber({ adapter: netz.adapter(), daten: d, welt: w, zf: SC.zufall(7), warte: u.uhr.warte, beiAnfrageWeg: function(info){ u.anfragenWeg.push(info); },
    beiAnfrage: function(info, antwort){ u.anfragen.push(info); if(o.antwort !== undefined) antwort(o.antwort); else u.antwort = antwort; },
    beiSpieler: function(l){ u.spielerListen.push(l); }, beiNachricht: function(id, n){ u.nachrichten.push({ id: id, n: n }); } });
  return u;
}
function raumGast(u, name, o){
  o = o || {};
  var r = { status: [], infos: [], willkommen: [], chunks: [], bereit: 0, uhr: raumUhr() };
  r.figur = o.figur || SC.Spielstand.figur(SC.Spielstand.neu({ name: "x", figurName: name }));
  r.g = new SC.Gast({ adapter: u.netz.adapter(), figur: r.figur, protokoll: o.protokoll, jetzt: r.uhr.jetzt, warte: r.uhr.warte,
    beiWillkommen: function(w){ r.willkommen.push(w); }, beiChunk: function(k, u8){ r.chunks.push({ k: k, u8: u8 }); }, beiBereit: function(){ r.bereit++; if(o.bereitWirft) throw new Error("Testfehler"); },
    beiNachricht: function(){}, beiStatus: function(s, info){ r.status.push(s); r.infos.push(info || {}); } });
  return r;
}
// Gast verbindet sich; liefert {erfolg, fehler} nach dem Zustellen
function raumBeitritt(u, r){ var e = {}; r.p = r.g.verbinde(u.code).then(function(){ e.erfolg = true; }, function(f){ e.fehler = f; }); return raumLauf(u.netz).then(function(){ return e; }); }
function raumOffen(o){ var u = aufbau(o); return u.h.oeffne().then(function(c){ u.code = c; return u; }); }
function letzter(a){ return a[a.length - 1]; }

test("Raum: Beitritt mit Bestätigung", function(){
  var u, r;
  return raumOffen().then(function(x){ u = x; r = raumGast(u, "Ben"); return raumBeitritt(u, r); }).then(function(e){
    gleich(r.status[0], "warte"); gleich(u.anfragen.length, 1); gleich(u.anfragen[0].name, "Ben"); gleich(u.anfragen[0].id, r.figur.figurId); wahr(!e.erfolg, "noch nicht drin");
    u.antwort(true); return raumLauf(u.netz).then(function(){ return e; });
  }).then(function(e){
    wahr(e.erfolg, "Promise erfüllt"); gleich(r.willkommen.length, 1); var w = r.willkommen[0];
    gleich(w.farbe, "#e0533a"); gleich(w.welt.seed, "a"); gleich(w.welt.planet.id, "start"); gleich(w.welt.planet.seed, u.welt.planet.seed); gleich(w.pos[1], 80); gleich(w.pvp, false); gleich(w.chunkAnzahl, 1);
    gleich(r.chunks.length, 1); wahr(r.chunks[0].u8 instanceof Uint8Array); gleich(r.chunks[0].u8.length, 16 * 16 * 128); gleich(r.chunks[0].k, u.welt.geaenderte.keys().next().value);
    gleich(r.bereit, 1); gleich(letzter(r.status), "verbunden"); gleich(u.h.spieler.length, 1); gleich(u.h.spieler[0].name, "Ben"); gleich(u.h.spieler[0].farbe, "#e0533a"); gleich(u.h.spieler[0].verbunden, true); gleich(u.h.farbe, "#3a6fd8");
    wahr(w.spieler.some(function(s){ return s.name === "Mia" && s.farbe === "#3a6fd8"; }), "Gastgeber in der Liste"); wahr(u.spielerListen.length >= 1);
    // gastDaten versteht das willkommen
    var gd = SC.Spielstand.gastDaten(w, r.figur); gleich(gd.planeten.start.seed, u.welt.planet.seed); gleich(gd.spieler.name, "Ben");
  });
});

test("Raum: Fehler im Rückruf des Gastes lässt den Beitritt nicht hängen", function(){
  var u, r, alt = console.error; console.error = function(){};
  return raumOffen({ antwort: true }).then(function(x){ u = x; r = raumGast(u, "Ben", { bereitWirft: true }); return raumBeitritt(u, r); }).then(function(e){
    console.error = alt;
    wahr(e.fehler instanceof SC.Netz.Fehler, "abgelehnt statt hängen"); gleich(e.fehler.art, "unbekannt"); gleich(r.g.verb, null);
    r.uhr.vor(20000); return raumLauf(u.netz);
  }).then(function(){ wahr(r.status.indexOf("neuverbinden") < 0, "kein Neuverbinden"); gleich(u.h.spieler.length === 0 || u.h.spieler[0].verbunden === false, true); },
    function(f){ console.error = alt; throw f; });
});

test("Raum: Fehler beim Annehmen lehnt den Gast ab", function(){
  var u, r, alt = console.error; console.error = function(){};
  return raumOffen({ antwort: true }).then(function(x){ u = x; u.h._weltInfo = function(){ throw new Error("Testfehler"); }; r = raumGast(u, "Ben"); return raumBeitritt(u, r); }).then(function(e){
    console.error = alt;
    wahr(e.fehler instanceof SC.Netz.Fehler, "abgelehnt statt hängen"); gleich(e.fehler.art, "fehler"); gleich(Object.keys(u.h._verb).length, 0);
  }, function(f){ console.error = alt; throw f; });
});

test("Raum: Nein lehnt ab", function(){
  var u, r;
  return raumOffen({ antwort: false }).then(function(x){ u = x; r = raumGast(u, "Ben"); return raumBeitritt(u, r); }).then(function(e){
    wahr(e.fehler instanceof SC.Netz.Fehler); gleich(e.fehler.art, "nein"); gleich(u.h.spieler.length, 0); gleich(r.willkommen.length, 0);
    r.uhr.vor(20000); return raumLauf(u.netz);
  }).then(function(){ wahr(r.status.indexOf("neuverbinden") < 0, "kein Neuverbinden"); });
});

test("Raum: Falsches Protokoll wird abgelehnt", function(){
  var u, r;
  return raumOffen({ antwort: true }).then(function(x){ u = x; r = raumGast(u, "Ben", { protokoll: SC.NETZ_PROTOKOLL + 1 }); return raumBeitritt(u, r); }).then(function(e){
    gleich(e.fehler && e.fehler.art, "version"); gleich(u.anfragen.length, 0); gleich(u.h.spieler.length, 0);
  });
});

test("Raum: Fünfter Spieler: voll", function(){
  var u, gs = [];
  return raumOffen({ antwort: true }).then(function(x){ u = x; var p = Promise.resolve(); ["A", "B", "C"].forEach(function(n){ p = p.then(function(){ var r = raumGast(u, n); gs.push(r); return raumBeitritt(u, r); }).then(function(e){ wahr(e.erfolg, n + " drin"); }); }); return p; }).then(function(){
    gleich(u.h.spieler.length, 3); gleich(gs.map(function(r){ return r.willkommen[0].farbe; }).join(" "), "#e0533a #2fae5a #c9a227");
    var r = raumGast(u, "D"); return raumBeitritt(u, r);
  }).then(function(e){ gleich(e.fehler && e.fehler.art, "voll"); gleich(u.h.spieler.length, 3); });
});

test("Raum: Bestätigte Figur kommt ohne Rückfrage zurück", function(){
  var u, r;
  return raumOffen({ antwort: true }).then(function(x){ u = x; r = raumGast(u, "Ben"); return raumBeitritt(u, r); }).then(function(e){
    wahr(e.erfolg); gleich(u.anfragen.length, 1); u.netz.trenne(r.g.verb); return raumLauf(u.netz);
  }).then(function(){
    gleich(letzter(r.status), "neuverbinden"); gleich(u.h.spieler.length, 1, "Platz bleibt frei"); gleich(u.h.spieler[0].verbunden, false, "Gastgeber hat den Abgang bemerkt");
    r.uhr.vor(2000); return raumLauf(u.netz);
  }).then(function(){
    gleich(u.anfragen.length, 1, "keine neue Rückfrage"); gleich(r.status.slice(-2).join(" "), "neuverbinden verbunden");
    gleich(r.willkommen.length, 2); gleich(r.chunks.length, 2); gleich(r.bereit, 2); gleich(u.h.spieler.length, 1); gleich(u.h.spieler[0].farbe, "#e0533a");
    r.uhr.vor(20000); return raumLauf(u.netz);
  }).then(function(){ gleich(letzter(r.status), "verbunden", "Aufgeben-Zeitgeber greift nicht mehr"); });
});

test("Raum: Neuverbinden gibt nach 15 s auf", function(){
  var u, r;
  return raumOffen({ antwort: true }).then(function(x){ u = x; r = raumGast(u, "Ben"); return raumBeitritt(u, r); }).then(function(){
    u.netz.ausfall(u.code.peerId); u.netz.trenne(r.g.verb); return raumLauf(u.netz);
  }).then(function(){
    var p = Promise.resolve(), versuche = 0;
    for(var i = 0; i < 7; i++) p = p.then(function(){ versuche++; r.uhr.vor(2000); return raumLauf(u.netz); }).then(function(){ gleich(letzter(r.status), "neuverbinden", "nach " + versuche * 2 + " s noch am Versuchen"); });
    return p.then(function(){ r.uhr.vor(2000); return raumLauf(u.netz); });
  }).then(function(){
    gleich(letzter(r.status), "getrennt"); gleich(letzter(r.infos).grund, "abbruch"); var n = r.status.length;
    r.uhr.vor(10000); return raumLauf(u.netz).then(function(){ gleich(r.status.length, n, "danach Ruhe"); });
  });
});

test("Raum: Position wird gemerkt", function(){
  var u, r, id;
  return raumOffen({ antwort: true }).then(function(x){ u = x; r = raumGast(u, "Ben"); id = r.figur.figurId; return raumBeitritt(u, r); }).then(function(){
    r.g.sende({ t: "zustand", id: id, pos: [5, 70, 5], blick: [1, 0.5], modus: "survival", stufe: 2, ausr: {}, menue: false, lebt: true }); return raumLauf(u.netz);
  }).then(function(){
    gleich(u.daten.mitspieler[id].pos[0], 5); gleich(u.daten.mitspieler[id].blick[0], 1); gleich(u.daten.mitspieler[id].name, "Ben"); gleich(u.h.spieler[0].pos[2], 5); gleich(u.h.spieler[0].stufe, 2);
    r.g.trenne(); return raumLauf(u.netz);
  }).then(function(){
    gleich(u.h.spieler[0].verbunden, false); var r2 = raumGast(u, "Ben", { figur: r.figur }); return raumBeitritt(u, r2).then(function(e){ wahr(e.erfolg); gleich(u.anfragen.length, 1); gleich(r2.willkommen[0].pos.join(","), "5,70,5"); gleich(r2.willkommen[0].blick[0], 1); });
  });
});

test("Raum: Hinauswerfen", function(){
  var u, r;
  return raumOffen({ antwort: true }).then(function(x){ u = x; r = raumGast(u, "Ben"); return raumBeitritt(u, r); }).then(function(){
    u.h.hinauswerfen(r.figur.figurId); return raumLauf(u.netz);
  }).then(function(){
    gleich(letzter(r.status), "getrennt"); gleich(letzter(r.infos).grund, "hinausgeworfen"); gleich(u.h.spieler.length, 0);
    r.uhr.vor(20000); return raumLauf(u.netz);
  }).then(function(){
    wahr(r.status.indexOf("neuverbinden") < 0, "kein Neuverbinden"); var r2 = raumGast(u, "Ben", { figur: r.figur }); return raumBeitritt(u, r2);
  }).then(function(){ gleich(u.anfragen.length, 2, "wieder Rückfrage"); });
});

test("Raum: Ende", function(){
  var u, r;
  return raumOffen({ antwort: true }).then(function(x){ u = x; r = raumGast(u, "Ben"); return raumBeitritt(u, r); }).then(function(){
    u.h.schliesse(); u.uhr.vor(SC.RAUM_NACHLAUF_MS); return raumLauf(u.netz);
  }).then(function(){
    gleich(letzter(r.status), "getrennt"); gleich(letzter(r.infos).grund, "ende"); r.uhr.vor(20000); return raumLauf(u.netz);
  }).then(function(){ wahr(r.status.indexOf("neuverbinden") < 0, "kein Neuverbinden"); var r2 = raumGast(u, "Ben"); return raumBeitritt(u, r2); }).then(function(e){ gleich(e.fehler && e.fehler.art, "kein-raum"); });
});

test("Raum: vergebener Code wird neu gewürfelt", function(){
  var u = aufbau(), netz = u.netz, belegt = SC.Netz.neuerCode(SC.zufall(7));
  return netz.adapter().oeffne(belegt.peerId).then(function(){ return u.h.oeffne(); }).then(function(c){ wahr(c.peerId !== belegt.peerId); gleich(u.h.code.peerId, c.peerId); });
});

test("Raum: Gastgeber verteilt Spielerliste und reicht Nachrichten weiter", function(){
  var u, a, b, listen = [];
  return raumOffen({ antwort: true }).then(function(x){ u = x; a = raumGast(u, "A"); a.g.o.beiNachricht = function(n){ if(n.t === "spieler") listen.push(n.liste.length); }; return raumBeitritt(u, a); }).then(function(){
    b = raumGast(u, "B"); return raumBeitritt(u, b);
  }).then(function(){
    gleich(letzter(listen), 3, "A erfährt von B (mit Gastgeber)"); b.g.sende({ t: "etwas", x: 1 }); return raumLauf(u.netz);
  }).then(function(){
    var n = letzter(u.nachrichten); gleich(n.id, b.figur.figurId); gleich(n.n.t, "etwas");
    b.g.trenne(); return raumLauf(u.netz).then(function(){ u.uhr.vor(SC.RAUM_PLATZ_MS); return raumLauf(u.netz); });
  }).then(function(){ gleich(letzter(listen), 2, "A erfährt von Bs Abgang"); gleich(u.h.spieler.length, 1); });
});

test("Raum: Wartender Gast geht vor der Antwort", function(){
  var u, r;
  return raumOffen().then(function(x){ u = x; r = raumGast(u, "Ben"); return raumBeitritt(u, r); }).then(function(){
    gleich(u.anfragen.length, 1); r.g.trenne(); return raumLauf(u.netz);
  }).then(function(){
    gleich(u.anfragenWeg.length, 1); gleich(u.anfragenWeg[0].id, r.figur.figurId); gleich(u.anfragenWeg[0].name, "Ben");
    u.antwort(true); return raumLauf(u.netz);
  }).then(function(){ gleich(u.h.spieler.length, 0, "kein Geisterspieler"); gleich(Object.keys(u.h._verb).length, 0); gleich(u.anfragenWeg.length, 1); });
});

test("Raum: Platz bleibt 20 s frei", function(){
  var u, gs = [], neu;
  return raumOffen({ antwort: true }).then(function(x){ u = x; var p = Promise.resolve(); ["A", "B", "C"].forEach(function(n){ p = p.then(function(){ var r = raumGast(u, n); gs.push(r); return raumBeitritt(u, r); }); }); return p; }).then(function(){
    gs[1].g.trenne(); return raumLauf(u.netz); // B geht
  }).then(function(){
    gleich(u.h.spieler.length, 3); gleich(u.h.spieler[1].verbunden, false); gleich(u.h.spieler[1].farbe, "#2fae5a");
    u.uhr.vor(SC.RAUM_PLATZ_MS - 1000); var d = raumGast(u, "D"); return raumBeitritt(u, d);
  }).then(function(e){
    gleich(e.fehler && e.fehler.art, "voll", "Platz von B ist noch belegt");
    neu = raumGast(u, "B", { figur: gs[1].figur }); return raumBeitritt(u, neu); // B kommt zurück
  }).then(function(e){
    wahr(e.erfolg); gleich(u.anfragen.length, 3, "ohne Rückfrage"); gleich(neu.willkommen[0].farbe, "#2fae5a"); gleich(u.h.spieler.length, 3); gleich(u.h.spieler[1].verbunden, true);
    u.uhr.vor(SC.RAUM_PLATZ_MS); return raumLauf(u.netz);
  }).then(function(){
    gleich(u.h.spieler.length, 3, "alter Zeitgeber räumt den Zurückgekehrten nicht ab");
    neu.g.trenne(); return raumLauf(u.netz);
  }).then(function(){
    gleich(u.h.spieler.length, 3); u.uhr.vor(SC.RAUM_PLATZ_MS); return raumLauf(u.netz);
  }).then(function(){
    gleich(u.h.spieler.length, 2, "nach 20 s weg"); wahr(u.h.spieler.every(function(e){ return e.name !== "B"; }));
    gleich(letzter(gs[0].g.spieler.map(function(x){ return x.name; })), "C"); gleich(gs[0].g.spieler.length, 3, "A hat die neue Liste (mit Gastgeber)");
  });
});

test("Raum: Zweite Verbindung derselben Figur ersetzt die alte", function(){
  var u, r, r2;
  return raumOffen({ antwort: true }).then(function(x){ u = x; r = raumGast(u, "Ben"); return raumBeitritt(u, r); }).then(function(){
    r2 = raumGast(u, "Ben", { figur: r.figur }); return raumBeitritt(u, r2); // alte Verbindung noch offen
  }).then(function(e){
    wahr(e.erfolg); gleich(u.anfragen.length, 1); gleich(u.h.spieler.length, 1); gleich(u.h.spieler[0].verbunden, true); gleich(r2.willkommen[0].farbe, "#e0533a");
    wahr(r.g.verb === null, "alte Verbindung ist zu"); u.uhr.vor(SC.RAUM_PLATZ_MS); return raumLauf(u.netz);
  }).then(function(){
    gleich(u.h.spieler.length, 1); gleich(u.h.spieler[0].verbunden, true, "zu der alten Verbindung ändert nichts");
    r2.g.sende({ t: "zustand", pos: [9, 70, 9] }); return raumLauf(u.netz);
  }).then(function(){ gleich(u.h.spieler[0].pos[0], 9, "neue Verbindung ist die gültige"); });
});

// --- Fahrzeuge im Raum (Stufe 4, Protokoll 2) ---
test("Raum: Protokoll 1 wird abgelehnt", function(){
  var u, r;
  return raumOffen({ antwort: true }).then(function(x){ u = x; r = raumGast(u, "Alt", { protokoll: 1 }); return raumBeitritt(u, r); }).then(function(e){ wahr(SC.NETZ_PROTOKOLL >= 2); gleich(e.fehler && e.fehler.art, "version"); });
});
function rfMehr(u, namen){ var l = []; return namen.reduce(function(p, n){ return p.then(function(){ var r = raumGast(u, n); l.push(r); return raumBeitritt(u, r); }); }, Promise.resolve()).then(function(){ return l; }); }
test("Raum: Vier Spieler in einem Fahrzeug, Liste geht an die Gäste", function(){
  var u, gs, f;
  return raumOffen({ antwort: true }).then(function(x){ u = x; f = SC.Fahrzeug.neu(u.welt, "gleiter", [3, 80, 2], 0); SC.Fahrzeug.einsteigen(f, u.daten.spieler.figurId); return rfMehr(u, ["Ben", "Cem", "Dana"]); }).then(function(l){
    gs = l; gs.forEach(function(r){ r.g.einsteigen(f.id); }); return raumLauf(u.netz);
  }).then(function(){
    gleich(f.sitze[0], u.daten.spieler.figurId, "Gastgeber fährt"); gs.forEach(function(r, i){ gleich(f.sitze[i + 1], r.figur.figurId); });
    gs[0].g.einsteigen(f.id); return raumLauf(u.netz);
  }).then(function(){
    gleich(f.sitze.filter(function(x){ return x === gs[0].figur.figurId; }).length, 1, "nicht doppelt");
    u.h.takt(0.1, { pos: [1, 80, 2], blick: [0, 0], modus: "survival", stufe: 1, lebt: true }); return raumLauf(u.netz);
  }).then(function(){
    var l = gs[1].g.fahrzeuge, e = l && l.filter(function(x){ return x.id === f.id; })[0]; wahr(e, "Liste beim Gast"); gleich(JSON.stringify(e.sitze), JSON.stringify(f.sitze)); gleich(e.art, "gleiter"); gleich(e.frei, true);
    gs[1].g.aussteigen(); return raumLauf(u.netz);
  }).then(function(){ gleich(f.sitze[2], null, "ausgestiegen"); });
});
test("Raum: Gast fährt, Gastgeber übernimmt die Lage nur vom Fahrer", function(){
  var u, gs, f;
  return raumOffen({ antwort: true }).then(function(x){ u = x; f = SC.Fahrzeug.neu(u.welt, "buggy", [3, 80, 2], 0); return rfMehr(u, ["Ben", "Cem"]); }).then(function(l){
    gs = l; gs[0].g.einsteigen(f.id); return raumLauf(u.netz);
  }).then(function(){
    gs[1].g.einsteigen(f.id); return raumLauf(u.netz);
  }).then(function(){
    gleich(f.sitze[0], gs[0].figur.figurId); gleich(f.sitze[1], gs[1].figur.figurId);
    gs[0].g.takt(0.1, { pos: [3, 80, 1], blick: [0, 0], modus: "survival", stufe: 1, lebt: true, fz: { id: f.id, pos: [9, 81, 4], blick: 0.5, geschw: [1, 0, 2], tempo: 3 } });
    gs[1].g.takt(0.1, { pos: [3, 80, 1], blick: [0, 0], modus: "survival", stufe: 1, lebt: true, fz: { id: f.id, pos: [99, 81, 4], blick: 2, geschw: [0, 0, 0], tempo: 0 } });
    return raumLauf(u.netz);
  }).then(function(){ gleich(JSON.stringify(f.pos), "[9,81,4]"); gleich(f.blick, 0.5); gleich(f.tempo, 3); });
});
test("Raum: Abriss gibt Sitz frei, Mitfahrer bleiben", function(){
  var u, gs, f;
  return raumOffen({ antwort: true }).then(function(x){ u = x; f = SC.Fahrzeug.neu(u.welt, "flieger", [3, 90, 2], 0); return rfMehr(u, ["Ben", "Cem"]); }).then(function(l){
    gs = l; gs[0].g.einsteigen(f.id); return raumLauf(u.netz);
  }).then(function(){ gs[1].g.einsteigen(f.id); return raumLauf(u.netz); }).then(function(){
    u.netz.trenne(gs[0].g.verb); return raumLauf(u.netz);
  }).then(function(){ gleich(f.sitze[0], null, "Fahrersitz frei"); gleich(f.sitze[1], gs[1].figur.figurId, "Mitfahrer bleibt"); wahr(u.welt.fahrzeuge.has(f.id)); });
});
test("Raum: Treffer auf sitzenden Gast gehen aufs Fahrzeug, Verpuffen geht an alle", function(){
  var u, gs, f, verpufft = [];
  return raumOffen({ antwort: true }).then(function(x){ u = x; u.h.o.beiVerpufft = function(fz, r){ verpufft.push(r); }; f = SC.Fahrzeug.neu(u.welt, "gleiter", [3, 80, 2], 0); return rfMehr(u, ["Ben", "Cem"]); }).then(function(l){
    gs = l; gs.forEach(function(r){ r.nachr = []; r.g.o.beiNachricht = function(n){ r.nachr.push(n); }; }); gs[0].g.einsteigen(f.id); return raumLauf(u.netz);
  }).then(function(){
    u.h.treffer(gs[0].figur.figurId, 10, [0, 0, 1], null); return raumLauf(u.netz);
  }).then(function(){
    wahr(f.panzerung < SC.FAHRZEUGE.gleiter.panzerung, "Panzerung sinkt"); gleich(gs[0].nachr.filter(function(n){ return n.t === "treffer"; }).length, 0, "kein treffer an den Gast");
    u.h.treffer(gs[0].figur.figurId, 9999, [0, 0, 1], null); return raumLauf(u.netz);
  }).then(function(){
    gleich(u.welt.fahrzeuge.has(f.id), false, "freies Fahrzeug verpufft"); gleich(verpufft.length, 1); gleich(verpufft[0].sitze[0], gs[0].figur.figurId);
    gs.forEach(function(r){ wahr(r.nachr.some(function(n){ return n.t === "verpufft" && n.id === f.id; }), "verpufft an " + r.figur.name); });
  });
});
test("Raum: Gast misst die Laufzeit per Ping, Gastgeber rechnet die Fahrerlage um sie voraus", function(){
  var u, gs, f;
  return raumOffen({ antwort: true }).then(function(x){ u = x; f = SC.Fahrzeug.neu(u.welt, "buggy", [3, 80, 2], 0); return rfMehr(u, ["Ben"]); }).then(function(l){
    gs = l; var r = gs[0]; gleich(r.g.latenz, null, "anfangs unbekannt");
    r.g.takt(1.1, { pos: [3, 80, 1], blick: [0, 0], modus: "survival", stufe: 1, lebt: true }); r.uhr.vor(200); // Antwort trifft 200 ms später ein
    return raumLauf(u.netz).then(function(){ return r; });
  }).then(function(r){
    // Speicher-Netz stellt sofort zu; Laufzeit aus der unechten Uhr: Ping bei t, Antwort verarbeitet bei t+200 → 0,1 s
    wahr(Math.abs(r.g.latenz - 0.1) < 1e-6, "Laufzeit 0,1 s: " + r.g.latenz);
    r.g.einsteigen(f.id); return raumLauf(u.netz).then(function(){ return r; });
  }).then(function(r){
    r.g.takt(0.1, { pos: [3, 80, 1], blick: [0, 0], modus: "survival", stufe: 1, lebt: true, fz: { id: f.id, pos: [10, 81, 4], blick: 0, geschw: [10, 0, 0], tempo: 10 } }); return raumLauf(u.netz);
  }).then(function(){ wahr(Math.abs(f.pos[0] - 11) < 1e-6, "um 0,1 s vorausgerechnet: " + f.pos[0]); });
});
test("Raum: Spiegel rechnet Fahrzeuge um die Laufzeit voraus", function(){
  var w = { planet: { groesse: 2048 }, fahrzeuge: new Map() }, l = [{ id: "a", art: "gleiter", pos: [100, 60, 100], blick: 0, geschw: [10, 0, 0], tempo: 10, panzerung: 120, sitze: ["x", null, null, null], weg: false, frei: true }];
  SC.Raum.spiegleFahrzeuge(w, l, 0, "ich", 0.15); wahr(Math.abs(w.fahrzeuge.get("a").pos[0] - 101.5) < 1e-6, "neu angelegt schon vorausgerechnet: " + w.fahrzeuge.get("a").pos[0]);
});
test("Raum: Protokoll 2 wird abgelehnt", function(){
  var u, r;
  return raumOffen({ antwort: true }).then(function(x){ u = x; r = raumGast(u, "Alt", { protokoll: 2 }); return raumBeitritt(u, r); }).then(function(e){ wahr(SC.NETZ_PROTOKOLL >= 3); gleich(e.fehler && e.fehler.art, "version"); });
});
test("Raum: Protokoll 3 wird abgelehnt", function(){
  var u, r;
  return raumOffen({ antwort: true }).then(function(x){ u = x; r = raumGast(u, "Alt", { protokoll: 3 }); return raumBeitritt(u, r); }).then(function(e){ gleich(SC.NETZ_PROTOKOLL, 4); gleich(e.fehler && e.fehler.art, "version"); });
});
