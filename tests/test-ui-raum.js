// Oberfläche für gemeinsames Spielen: Beitreten, Einladen, Anfrage, Figurname
function uiRaum(w, o){ return new SC.UI(w, Object.assign({ slots: null, beiStart: function(){}, beiImport: function(){}, beiExport: function(){} }, o || {})); }
function raumSlots(){ var b = { art: "speicher", m: {}, hole: function(k){ return Promise.resolve(this.m[k] === undefined ? undefined : JSON.parse(JSON.stringify(this.m[k]))); }, lege: function(k, v){ this.m[k] = JSON.parse(JSON.stringify(v)); return Promise.resolve(); }, loesche: function(k){ delete this.m[k]; return Promise.resolve(); } }; var s = new SC.Slots(b); s.b = b; return s; }
function raumKlick(ui, sel){ var el = ui.ebene.querySelector(sel); wahr(!!el, "Knopf fehlt: " + sel); return ui._klick(el); }
function raumWarte(){ return new Promise(function(ok){ setTimeout(ok, 0); }); }
// Weltliste → Mitspielen → Wort MOND, Zahl 47 → Figurwahl
function raumBisFigur(ui){
  return ui.zeigeWeltliste().then(function(){ return raumKlick(ui, '[data-aktion="mitspielen"]'); })
    .then(function(){ return raumKlick(ui, '[data-aktion="wort"][data-id="MOND"]'); })
    .then(function(){ return raumKlick(ui, '[data-aktion="ziffer"][data-id="4"]'); })
    .then(function(){ return raumKlick(ui, '[data-aktion="ziffer"][data-id="7"]'); })
    .then(function(){ return raumKlick(ui, '[data-aktion="codeOk"]'); });
}
function raumZweiWelten(s){
  var a = SC.Spielstand.neu({ name: "Sternenhafen", seedText: "a", modus: "survival", figurName: "Mia" }), b = SC.Spielstand.neu({ name: "Ohne Namen", seedText: "b", modus: "kreativ" });
  a.spieler.stufe = 3;
  return s.speichere(a).then(function(){ return s.speichere(b); }).then(function(){ s.b.m["welten"].push({ id: "z", name: "Zukunft", format: 99, zuletzt: 1 }); return { a: a, b: b }; });
}

test("Weltliste hat Mitspielen-Knopf", function(){
  var w = document.createElement("div"), ui = uiRaum(w, { slots: raumSlots() });
  return ui.zeigeWeltliste().then(function(){
    var k = w.querySelector('[data-aktion="mitspielen"]'); wahr(!!k, "Knopf da"); gleich(k.textContent, SC.T.mitspielen);
    wahr(k.parentNode.querySelector('[data-aktion="neu"]') !== null, "neben Neue Welt");
    return ui._klick(k);
  }).then(function(){ gleich(w.querySelectorAll('[data-aktion="wort"]').length, 24); wahr(w.textContent.indexOf(SC.T.codeWort) >= 0); });
});

test("Beitreten: Wort + zwei Ziffern ergeben Code", function(){
  var w = document.createElement("div"), ui = uiRaum(w, { slots: raumSlots() });
  ui.zeigeBeitreten();
  return raumKlick(ui, '[data-aktion="wort"][data-id="MOND"]').then(function(){
    wahr(w.textContent.indexOf(SC.T.codeZahl) >= 0, "Schritt 2");
    gleich(w.querySelectorAll('[data-aktion="ziffer"]').length, 10);
    wahr(w.querySelector('[data-aktion="ziffer"][data-id="0"]').disabled, "0 nicht als erste Ziffer");
    wahr(w.querySelector('[data-aktion="codeOk"]').disabled, "erst mit zwei Ziffern");
    return raumKlick(ui, '[data-aktion="ziffer"][data-id="4"]');
  }).then(function(){ return raumKlick(ui, '[data-aktion="ziffer"][data-id="9"]'); })
    .then(function(){ return raumKlick(ui, '[data-aktion="zifferWeg"]'); })
    .then(function(){ return raumKlick(ui, '[data-aktion="ziffer"][data-id="7"]'); })
    .then(function(){
      gleich(w.querySelector(".raumcode").textContent, "MOND 47");
      wahr(w.querySelector('[data-aktion="ziffer"][data-id="1"]').disabled, "höchstens zwei Ziffern");
      wahr(!w.querySelector('[data-aktion="codeOk"]').disabled);
      var weg = w.querySelector('[data-aktion="zifferWeg"]'); gleich(weg.textContent, SC.T.zifferWegZeichen); gleich(weg.getAttribute("aria-label"), SC.T.zifferWeg);
    });
});

test("Figurwahl listet Welten und Neue Figur", function(){
  var w = document.createElement("div"), s = raumSlots(), ui = uiRaum(w, { slots: s });
  return raumZweiWelten(s).then(function(){ return raumBisFigur(ui); }).then(function(){
    wahr(w.textContent.indexOf(SC.T.figurWaehlen) >= 0);
    var t = Array.prototype.map.call(w.querySelectorAll('[data-aktion="figur"]'), function(b){ return b.textContent; });
    gleich(t.length, 3, "zwei Welten und Neue Figur: " + t.join("|"));
    wahr(t.indexOf("Mia – Stufe 3 (aus „Sternenhafen“)") >= 0, t.join("|"));
    wahr(t.indexOf("Ohne Namen – Stufe 1 (aus „Ohne Namen“)") >= 0, t.join("|"));
    wahr(t.indexOf(SC.T.neueFigur) >= 0); wahr(w.textContent.indexOf("Zukunft") < 0, "gesperrte Welt fehlt");
    gleich(w.querySelector(".raumcode").textContent, "MOND 47");
  });
});

test("Beitreten ruft beiBeitreten mit Code und Welt-ID", function(){
  var w = document.createElement("div"), s = raumSlots(), auf = [], abbruch = 0, welten, fertig = {}, ui = uiRaum(w, { slots: s,
    beiBeitreten: function(code, id, name){ auf.push([code, id, name]); return new Promise(function(ok, nein){ fertig.ok = ok; fertig.nein = nein; }); },
    beiBeitretenAbbrechen: function(){ abbruch++; } });
  return raumZweiWelten(s).then(function(x){ welten = x; return raumBisFigur(ui); })
    .then(function(){ return raumKlick(ui, '[data-aktion="figur"][data-id="' + welten.a.id + '"]'); })
    .then(function(){ return raumKlick(ui, '[data-aktion="beitreten"]'); })
    .then(function(){
      gleich(auf.length, 1); gleich(auf[0][0].peerId, "spacecraft-mond-47"); gleich(auf[0][0].text, "MOND 47"); gleich(auf[0][1], welten.a.id);
      ui.raumStatus("warte"); wahr(w.textContent.indexOf(SC.T.raumWarte) >= 0, "Warte-Text");
      return raumKlick(ui, '[data-aktion="zurueck"]');
    }).then(function(){ gleich(abbruch, 1, "Abbrechen"); wahr(w.textContent.indexOf(SC.T.figurWaehlen) >= 0, "sofort zurück zur Figurwahl"); fertig.nein(new SC.Netz.Fehler("abbruch")); return raumWarte(); })
    .then(function(){ wahr(w.textContent.indexOf(SC.T.figurWaehlen) >= 0, "bleibt bei der Figurwahl"); return raumKlick(ui, '[data-aktion="beitreten"]'); })
    .then(function(){ gleich(auf.length, 2); fertig.nein(new SC.Netz.Fehler("nein")); return raumWarte(); })
    .then(function(){ wahr(w.textContent.indexOf(SC.T.raumNein) >= 0, "Fehlertext: " + w.textContent);
      return raumKlick(ui, '[data-aktion="zurueck"]'); })
    .then(function(){ wahr(w.textContent.indexOf(SC.T.figurWaehlen) >= 0, "zurück zur Figurwahl"); return raumKlick(ui, '[data-aktion="beitreten"]'); })
    .then(function(){ gleich(auf.length, 3); gleich(auf[2][1], welten.a.id, "Wahl bleibt"); fertig.ok(); return raumWarte(); })
    .then(function(){ wahr(!ui.offen(), "nach dem Eintritt zu"); });
});

test("Beitreten mit Neuer Figur oder Figur ohne Namen fragt den Namen", function(){
  var w = document.createElement("div"), s = raumSlots(), auf = [], welten, ui = uiRaum(w, { slots: s, beiBeitreten: function(code, id, name){ auf.push([id, name]); return new Promise(function(){}); } });
  return raumZweiWelten(s).then(function(x){ welten = x; return raumBisFigur(ui); })
    .then(function(){ return raumKlick(ui, '[data-aktion="figur"][data-id=""]'); })
    .then(function(){ return raumKlick(ui, '[data-aktion="beitreten"]'); })
    .then(function(){ gleich(auf.length, 0); wahr(w.textContent.indexOf(SC.T.wieHeisstFigur) >= 0); w.querySelector("#fn-name").value = " Ben "; return raumKlick(ui, '[data-aktion="nameOk"]'); })
    .then(function(){ gleich(auf.length, 1); gleich(auf[0][0], null); gleich(auf[0][1], "Ben"); return raumBisFigur(ui); })
    .then(function(){ return raumKlick(ui, '[data-aktion="figur"][data-id="' + welten.b.id + '"]'); })
    .then(function(){ return raumKlick(ui, '[data-aktion="beitreten"]'); })
    .then(function(){ wahr(w.textContent.indexOf(SC.T.wieHeisstFigur) >= 0, "Welt ohne Figurname"); w.querySelector("#fn-name").value = "Lea"; return raumKlick(ui, '[data-aktion="nameOk"]'); })
    .then(function(){ gleich(auf[1][0], welten.b.id); gleich(auf[1][1], "Lea"); });
});

test("Figurname ist Pflicht", function(){
  var w = document.createElement("div"), ui = uiRaum(w), name = null;
  ui.zeigeFigurname(function(n){ name = n; });
  var f = w.querySelector("#fn-name"); gleich(f.getAttribute("maxlength"), "16"); wahr(w.textContent.indexOf(SC.T.wieHeisstFigur) >= 0);
  f.value = "   ";
  return raumKlick(ui, '[data-aktion="nameOk"]').then(function(){
    gleich(name, null); wahr(w.textContent.indexOf(SC.T.figurNamePflicht) >= 0, "Hinweis Pflicht");
    w.querySelector("#fn-name").value = "Ben"; return raumKlick(ui, '[data-aktion="nameOk"]');
  }).then(function(){ gleich(name, "Ben"); });
});

test("Einladen zeigt Code, PvP-Schalter und Mitspieler", function(){
  var w = document.createElement("div"), pvp = [], raus = [], einl = [], info = { rolle: "allein" }, d = SC.Spielstand.neu({ name: "Mias Welt", seedText: "a", modus: "survival", figurName: "Mia" });
  var ui = uiRaum(w, { raumInfo: function(){ return info; },
    beiEinladen: function(n){ einl.push(n); info = { rolle: "gastgeber", code: "MOND 47", pvp: false, spieler: [{ id: "g1", name: "Ben", farbe: "#e0533a", verbunden: true }] }; return Promise.resolve({ text: "MOND 47" }); },
    beiPvp: function(an){ pvp.push(an); info.pvp = an; }, beiHinauswerfen: function(id){ raus.push(id); } });
  ui.zeigePause(d);
  var k = w.querySelector('[data-aktion="einladen"]'); wahr(!!k); gleich(k.textContent, SC.T.einladen);
  return ui._klick(k).then(raumWarte).then(function(){
    gleich(einl.length, 1, "Raum geöffnet ohne Namensabfrage");
    gleich(w.querySelector(".raumcode").textContent, "MOND 47"); wahr(w.textContent.indexOf(SC.T.raumcode) >= 0);
    var p = w.querySelector('[data-aktion="pvp"]'); wahr(!!p, "PvP-Schalter"); wahr(p.textContent.indexOf(SC.T.pvp) >= 0); wahr(!p.classList.contains("an"), "Standard aus");
    var zeile = w.querySelector(".mitspieler-zeile"); wahr(zeile.textContent.indexOf("Ben") >= 0); gleich(zeile.querySelector(".farbe").style.backgroundColor, "rgb(224, 83, 58)");
    return raumKlick(ui, '[data-aktion="pvp"]');
  }).then(function(){ gleich(pvp.join(), "true"); wahr(w.querySelector('[data-aktion="pvp"]').classList.contains("an"));
    return raumKlick(ui, '[data-aktion="hinauswerfen"][data-id="g1"]');
  }).then(function(){ gleich(raus.length, 0, "erster Tipp fragt nur nach"); var h = w.querySelector('[data-aktion="hinauswerfen"][data-id="g1"]'); gleich(h.textContent, SC.T.wirklichHinauswerfen);
    return ui._klick(h);
  }).then(function(){ gleich(raus.join(), "g1");
    info.spieler = []; ui.raumAktualisieren(); wahr(!w.querySelector(".mitspieler-zeile"), "Liste aktualisiert"); wahr(w.textContent.indexOf(SC.T.keineMitspieler) >= 0);
    return raumKlick(ui, '[data-aktion="zurueck"]');
  }).then(function(){ wahr(!!w.querySelector('[data-aktion="einladen"]'), "zurück zur Pause"); });
});

test("Einladen ohne Figurname fragt erst den Namen", function(){
  var w = document.createElement("div"), einl = [], d = SC.Spielstand.neu({ name: "Welt", seedText: "a", modus: "kreativ" });
  var ui = uiRaum(w, { raumInfo: function(){ return { rolle: einl.length ? "gastgeber" : "allein", code: "STERN 12", pvp: false, spieler: [] }; }, beiEinladen: function(n){ einl.push(n); return Promise.resolve({ text: "STERN 12" }); } });
  ui.zeigePause(d);
  return raumKlick(ui, '[data-aktion="einladen"]').then(function(){
    gleich(einl.length, 0); wahr(w.textContent.indexOf(SC.T.wieHeisstFigur) >= 0); w.querySelector("#fn-name").value = "Mia"; return raumKlick(ui, '[data-aktion="nameOk"]');
  }).then(raumWarte).then(function(){ gleich(einl.join(), "Mia"); gleich(w.querySelector(".raumcode").textContent, "STERN 12"); });
});

test("Einladen: Fehler beim Öffnen zeigt Hinweis und Pause", function(){
  var w = document.createElement("div"), d = SC.Spielstand.neu({ name: "Welt", seedText: "a", modus: "kreativ", figurName: "Mia" });
  var ui = uiRaum(w, { raumInfo: function(){ return { rolle: "allein" }; }, beiEinladen: function(){ return Promise.reject(new SC.Netz.Fehler("vermittlung")); } });
  ui.zeigePause(d);
  return raumKlick(ui, '[data-aktion="einladen"]').then(raumWarte).then(function(){
    wahr(w.querySelector(".hinweise").textContent.indexOf(SC.T.raumVermittlung) >= 0); wahr(!!w.querySelector('[data-aktion="einladen"]'));
  });
});

test("Anfrage Ja/Nein ruft antwort", function(){
  var w = document.createElement("div"), ui = uiRaum(w), a = [], b = [], c = [], weiter = 0;
  ui.o.beiWeiter = function(){ weiter++; };
  ui.zeigeAnfrage("Ben", function(ja){ a.push(ja); }, "a");
  ui.zeigeAnfrage("Lea", function(ja){ b.push(ja); }, "b");
  ui.zeigeAnfrage("Tom", function(ja){ c.push(ja); }, "c");
  wahr(ui.offen(), "Dialog zählt als offen");
  var m = w.querySelector(".anfrage-ebene"); wahr(!m.hidden); wahr(m.textContent.indexOf("Ben möchte mitspielen") >= 0, m.textContent);
  var ja = m.querySelector('[data-aktion="ja"]'); gleich(ja.textContent, SC.T.ja); gleich(m.querySelector('[data-aktion="nein"]').textContent, SC.T.nein);
  document.body.appendChild(w); var fl = ui._fokusListe(); w.remove();
  gleich(fl.length, 2, "Gamepad-Fokus nur im Dialog"); wahr(fl.indexOf(ja) >= 0);
  return ui._klick(ja).then(function(){
    gleich(a.join(), "true"); wahr(m.textContent.indexOf("Lea möchte mitspielen") >= 0, "nächste Anfrage");
    ui.anfrageWeg("b"); gleich(b.length, 0, "weggegangen: keine Antwort"); wahr(m.textContent.indexOf("Tom möchte mitspielen") >= 0);
    return ui._klick(m.querySelector('[data-aktion="nein"]'));
  }).then(function(){ gleich(c.join(), "false"); wahr(m.hidden, "alle beantwortet"); wahr(!ui.offen()); gleich(weiter, 1, "Spiel läuft weiter"); });
});

test("Anfrage über der Pause lässt die Pause stehen", function(){
  var w = document.createElement("div"), ui = uiRaum(w, { raumInfo: function(){ return { rolle: "gastgeber", code: "MOND 47", spieler: [] }; } }), weiter = 0, d = SC.Spielstand.neu({ name: "W", seedText: "a", modus: "kreativ" });
  ui.o.beiWeiter = function(){ weiter++; };
  ui.zeigePause(d); ui.zeigeAnfrage("Ben", function(){}, "a");
  return ui._klick(w.querySelector('.anfrage-ebene [data-aktion="ja"]')).then(function(){
    wahr(ui.offen(), "Pause noch offen"); wahr(!!ui.ebene.querySelector('[data-aktion="weiter"]')); gleich(weiter, 0);
    ui.zeigeAnfrage("Lea", function(){}, "b"); ui.anfrageWeg("b"); wahr(w.querySelector(".anfrage-ebene").hidden);
  });
});

test("Gast sieht keinen Moduswechsel", function(){
  var w = document.createElement("div"), d = SC.Spielstand.neu({ name: "Gastwelt", seedText: "a", modus: "survival" }), modus = [];
  var ui = uiRaum(w, { raumInfo: function(){ return { rolle: "gast", gastgeber: "Mia" }; }, beiEinladen: function(){}, beiModus: function(m){ modus.push(m); } });
  ui.zeigePause(d);
  wahr(!w.querySelector('[data-aktion="modus"]'), "kein Modus"); wahr(!w.querySelector('[data-aktion="schwierigkeit"]'), "keine Schwierigkeit");
  wahr(!w.querySelector('[data-aktion="einladen"]')); wahr(w.textContent.indexOf("Du spielst bei Mia") >= 0);
  ui.o.raumInfo = function(){ return { rolle: "gast", gastgeber: "A$&B$1" }; }; ui.zeigePause(d); wahr(w.textContent.indexOf("Du spielst bei A$&B$1") >= 0, "Name wörtlich: " + w.querySelector(".spielt-bei").textContent);
  ui.o.raumInfo = function(){ return { rolle: "gastgeber", code: "MOND 47", spieler: [] }; };
  ui.zeigePause(d);
  wahr(!!w.querySelector('[data-aktion="einladen"]'), "Gastgeber lädt ein");
  return raumKlick(ui, '[data-aktion="modus"][data-modus="kreativ"]').then(function(){ gleich(modus.join(), "kreativ", "Gastgeber wechselt den Modus"); gleich(d.modus, "kreativ"); });
});

test("Spiel: raumInfo je Rolle", function(){
  var s = Object.create(SC.Spiel.prototype);
  gleich(s.raumInfo().rolle, "allein");
  var g = Object.create(SC.Gastgeber.prototype); g.code = SC.Netz.code("MOND", 47); g.pvp = true; g.spieler = [{ id: "x", name: "Ben", farbe: "#e0533a", verbunden: true, pos: [0, 0, 0] }]; s.raum = g;
  var i = s.raumInfo(); gleich(i.rolle, "gastgeber"); gleich(i.code, "MOND 47"); gleich(i.pvp, true); gleich(i.spieler[0].name, "Ben"); gleich(i.spieler[0].farbe, "#e0533a");
  var gg = Object.create(SC.Gast.prototype); gg.spieler = [{ id: "h", name: "Mia", farbe: SC.RAUM_FARBEN[0] }, { id: "y", name: "Ben", farbe: "#e0533a" }]; gg.pvp = false; s.raum = gg;
  i = s.raumInfo(); gleich(i.rolle, "gast"); gleich(i.gastgeber, "Mia");
});

// --- Abbrechen, während die eigene Welt noch lädt (nutzt die Helfer aus test-mehrspieler.js) ---
function raumHalte(slots, name){ var alt = slots[name], h = {}, tor = new Promise(function(ok){ h.los = ok; }); slots[name] = function(x){ var sl = this; slots[name] = alt; return tor.then(function(){ return alt.call(sl, x); }); }; return h; }
test("Spiel: Abbrechen während die Welt lädt startet kein Spiel", function(){
  var u, e = {};
  return mspZwei({ ohneBeitritt: true }).then(function(x){ u = x; var h = raumHalte(u.sG, "lade");
    u.g.beitreten(u.code, u.eigen.id, "Ben").then(function(){ e.ok = true; }, function(f){ e.f = f; });
    u.g.beitretenAbbrechen(); h.los(); return mspLauf(u.netz, 4);
  }).then(function(){ wahr(!e.ok, "nicht beigetreten"); gleich(e.f && e.f.art, "abbruch"); gleich(u.anfragen, 0, "keine Anfrage beim Gastgeber"); gleich(u.g.rolle, "allein"); gleich(u.g.raum, null); gleich(u.g.daten, undefined); })
    .then(mspFertig, mspFehler);
});
test("Spiel: kein zweiter Beitritt gleichzeitig, nach Abbruch genau eine Anfrage", function(){
  var u, e1 = {}, e2 = {}, e3 = {};
  return mspZwei({ ohneBeitritt: true }).then(function(x){ u = x; var h = raumHalte(u.sG, "lade");
    u.g.beitreten(u.code, u.eigen.id, "Ben").then(function(){ e1.ok = true; }, function(f){ e1.f = f; });
    u.g.beitreten(u.code, u.eigen.id, "Ben").then(function(){ e3.ok = true; }, function(f){ e3.f = f; });
    u.g.beitretenAbbrechen();
    u.g.beitreten(u.code, u.eigen.id, "Ben").then(function(){ e2.ok = true; }, function(f){ e2.f = f; });
    h.los(); return mspLauf(u.netz, 5);
  }).then(function(){ wahr(!e3.ok && !!e3.f, "läuft schon: abgelehnt"); gleich(e1.f && e1.f.art, "abbruch"); wahr(e2.ok, "zweiter Versuch klappt: " + (e2.f && (e2.f.art || e2.f.message)));
    gleich(u.anfragen, 1, "genau eine Anfrage"); gleich(u.h.raum.spieler.length, 1); gleich(u.g.rolle, "gast"); })
    .then(mspFertig, mspFehler);
});
test("Spiel: Neue Figur nach Abbruch legt keine zweite Welt an", function(){
  var u, e = {};
  return mspZwei({ ohneBeitritt: true }).then(function(x){ u = x; var h = raumHalte(u.sG, "speichere");
    u.g.beitreten(u.code, null, "Ben").then(null, function(){});
    u.g.beitretenAbbrechen();
    u.g.beitreten(u.code, null, "Ben").then(function(){ e.ok = true; }, function(f){ e.f = f; });
    h.los(); return mspLauf(u.netz, 5);
  }).then(function(){ wahr(e.ok, "beigetreten: " + (e.f && (e.f.art || e.f.message))); return u.sG.liste(); })
    .then(function(l){ var welten = Object.keys(u.sG.b.m).filter(function(k){ return /^welt:[^:]+$/.test(k); }); gleich(welten.length, 2, "eigene Welt und genau eine neue: " + welten.join()); gleich(l.length, 2); gleich(u.anfragen, 1, "genau eine Anfrage"); })
    .then(mspFertig, mspFehler);
});
