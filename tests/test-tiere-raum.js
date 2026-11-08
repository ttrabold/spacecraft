// Haustiere im Mehrspieler (Aufgabe 10): Protokoll 8, Gast-Tiere beim Gastgeber, Fangen über das Netz, Stand zurück an den Gast
function mpTiere(fn){ return raumOffen({ antwort: true }).then(function(u){ var r = raumGast(u, "Ben"); return raumBeitritt(u, r).then(function(){ return fn(u, r); }); }); }
function gastTier(art, o){ var t = SC.Tier.neu(art, SC.zufall(5)); t.draussen = true; for(var k in o) t[k] = o[k]; return t; }
function zustandMitTieren(ts){ return { pos: [3, 80, 1], blick: [0, 0], modus: "survival", stufe: 1, lebt: true, tiere: SC.Raum.tiereListe(ts) }; }
test("Netzprotokoll mindestens 8 (Haustiere)", function(){ wahr(SC.NETZ_PROTOKOLL >= 8); });
test("tiereBereinigen: höchstens 3, bekannte Arten, Namen und Zahlen begrenzt", function(){
  var l = SC.Raum.tiereBereinigen([{ id: "a", art: "hund", name: "Bello", stufe: 3, lp: 10, lpMax: 30, schaden: 4, fn: 2 }, { id: "b", art: "drache", name: "x", stufe: 1, lp: 1, lpMax: 1, schaden: 1 }, { id: "c", art: "hase", name: "y".repeat(40), stufe: 999, lp: -5, lpMax: 1e9, schaden: -1 },
    { id: "d", art: "katze", name: "K", stufe: 1, lp: 1, lpMax: 1, schaden: 1 }, { id: "e", art: "fuchs", name: "F", stufe: 1, lp: 1, lpMax: 1, schaden: 1 }, null, "x", { art: "hund" }]);
  gleich(l.length, 3, "3 gültige"); gleich(l[0].id, "a"); gleich(l[1].id, "c"); gleich(l[1].name.length, 16); gleich(l[1].stufe, SC.Werte.MAX_STUFE); wahr(l[1].lp >= 0 && l[1].lpMax <= 100000 && l[1].schaden >= 0, "Zahlen begrenzt");
  gleich(SC.Raum.tiereBereinigen("kaputt").length, 0); gleich(SC.Raum.tiereBereinigen(undefined).length, 0);
});
test("tiereListe: nur Tiere draußen und nicht im K.o., mit Werten und Fütterungszähler", function(){
  var a = gastTier("hund"), b = gastTier("hase", { draussen: false }), c = gastTier("katze", { koRest: 5 }); SC.Tier.staerken(a, "fuettern");
  var l = SC.Raum.tiereListe([a, b, c, null]); gleich(l.length, 1); gleich(l[0].id, a.id); gleich(l[0].lpMax, SC.Tier.werte(a).lpMax); gleich(l[0].fn, 1); gleich(l[0].schaden, SC.Tier.werte(a).schaden);
});
test("Tiere in der Wesenliste: Wild und Begleiter reisen zum Gast und werden gespiegelt", function(){
  var w = new SC.Welt(new SC.Planet({ id: "start", seed: 5 })), h = SC.TIERE.hund;
  var wl = SC.Wesen.neu(w, "tier", { tierArt: "hase", wild: true, pos: [5, 90, 5], breite: 0.4, hoehe: 0.7, fangVon: "x", blick: 1.5 });
  var bg = SC.Wesen.neu(w, "tier", { tierArt: "hund", tierId: "t1", besitzer: "g1", name: "Bello", stufe: 3, lp: 20, lpMax: 30, halsband: "#ff0000", pos: [6, 90, 5], breite: h.breite, hoehe: h.hoehe, blick: 0.5 });
  var l = SC.Raum.wesenListe(w, 0); gleich(l.length, 2);
  var w2 = new SC.Welt(new SC.Planet({ id: "start", seed: 5 })); SC.Raum.spiegleWesen(w2, l, 0.1, 0);
  var a = w2.wesen.get(wl.id), b = w2.wesen.get(bg.id); wahr(a && b, "gespiegelt"); gleich(a.art, "tier"); gleich(a.wild, true); gleich(a.fangVon, "x"); gleich(a.breite, SC.TIERE.hase.breite);
  gleich(b.tierId, "t1"); gleich(b.besitzer, "g1"); gleich(b.name, "Bello"); gleich(b.stufe, 3); gleich(b.lp, 20); gleich(b.lpMax, 30); gleich(b.halsband, "#ff0000"); gleich(b.hoehe, h.hoehe);
  SC.Raum.spiegleWesen(w2, [], 0.1, 0); gleich(w2.wesen.size, 0, "verschwunden, wenn nicht mehr in der Liste");
});
test("Gastgeber: Tiere des Gastes laufen als Wesen beim Gast, ändern sich mit dem Zustand und verschwinden mit ihm", function(){
  return mpTiere(function(u, r){
    var ts = [gastTier("hund", { name: "Bello" }), gastTier("hase")];
    r.g.takt(0.1, zustandMitTieren(ts)); return raumLauf(u.netz).then(function(){
      gleich(u.h.spieler[0].tiere.length, 2, "Liste beim Gastgeber");
      var s = { raum: u.h, welt: u.welt }; SC.Spiel.prototype._tiereGaeste.call(s);
      var l = []; u.welt.wesen.forEach(function(e){ if(e.art === "tier" && e.besitzer === r.figur.figurId) l.push(e); }); gleich(l.length, 2, "zwei Wesen"); gleich(l[0].name, "Bello"); gleich(l[0].lp, ts[0].lp);
      SC.Spiel.prototype._tiereGaeste.call(s); gleich(SC.Wesen.anzahl(u.welt, "tier"), 0, "Wild zählt nicht"); var n = 0; u.welt.wesen.forEach(function(e){ if(e.art === "tier") n++; }); gleich(n, 2, "nicht doppelt");
      ts[0].name = "Max"; ts[0].stufe = 4; r.g._tiereJ = null; r.g.takt(0.1, zustandMitTieren(ts)); return raumLauf(u.netz);
    }).then(function(){
      SC.Spiel.prototype._tiereGaeste.call({ raum: u.h, welt: u.welt }); var e = null; u.welt.wesen.forEach(function(x){ if(x.tierArt === "hund") e = x; }); gleich(e.name, "Max"); gleich(e.stufe, 4);
      r.g.takt(0.1, zustandMitTieren([])); return raumLauf(u.netz);
    }).then(function(){ SC.Spiel.prototype._tiereGaeste.call({ raum: u.h, welt: u.welt }); var n = 0; u.welt.wesen.forEach(function(e){ if(e.art === "tier") n++; }); gleich(n, 0, "eingesammelt"); });
  });
});
test("Gastgeber: Fütterung beim Gast heilt sein Tier im Wesen, Heilung nur einmal je Fütterung", function(){
  return mpTiere(function(u, r){
    var t = gastTier("hund"), s = { raum: u.h, welt: u.welt }; r.g.takt(0.1, zustandMitTieren([t])); return raumLauf(u.netz).then(function(){
      SC.Spiel.prototype._tiereGaeste.call(s); var e = null; u.welt.wesen.forEach(function(x){ if(x.art === "tier") e = x; }); e.lp = 3;
      SC.Spiel.prototype._tiereGaeste.call(s); gleich(e.lp, 3, "ohne Fütterung bleibt es");
      SC.Tier.staerken(t, "fuettern"); r.g.takt(0.1, zustandMitTieren([t])); return raumLauf(u.netz).then(function(){ SC.Spiel.prototype._tiereGaeste.call(s); gleich(e.lp, SC.Tier.werte(t).lpMax, "geheilt"); e.lp = 5; SC.Spiel.prototype._tiereGaeste.call(s); gleich(e.lp, 5, "nur einmal"); });
    });
  });
});
test("Gastgeber: K.o. eines Gast-Tiers geht als tierStand an den Gast und kommt nicht wieder", function(){
  return mpTiere(function(u, r){
    var t = gastTier("hund"), s = { raum: u.h, welt: u.welt, ui: { hinweis: function(){} }, render: { wesen: { funken: function(){}, zahl: function(){} } }, audio: { spiele: function(){} }, spieler: { pos: [0, 0, 0] }, daten: u.daten, kampf: { kaefig: new SC.Kaefig() }, _zahl: function(){}, _tierKo: SC.Spiel.prototype._tierKo }; var got = [];
    r.g.o.beiTierStand = function(n){ got.push(n); };
    r.g.takt(0.1, zustandMitTieren([t])); return raumLauf(u.netz).then(function(){
      SC.Spiel.prototype._tiereGaeste.call(s); var e = null; u.welt.wesen.forEach(function(x){ if(x.art === "tier") e = x; });
      SC.Spiel.prototype._tierTreffer.call(s, e, 1e6); return raumLauf(u.netz);
    }).then(function(){
      gleich(got.length >= 1, true, "tierStand angekommen"); gleich(got[0].ko[0], t.id); var n = 0; u.welt.wesen.forEach(function(x){ if(x.art === "tier") n++; }); gleich(n, 0, "Wesen weg");
      SC.Spiel.prototype._tiereGaeste.call(s); n = 0; u.welt.wesen.forEach(function(x){ if(x.art === "tier") n++; }); gleich(n, 0, "veraltete Liste erzeugt es nicht neu");
      r.g.takt(0.1, zustandMitTieren([])); return raumLauf(u.netz);
    }).then(function(){ SC.Spiel.prototype._tiereGaeste.call(s); gleich(u.h.spieler[0].ko && u.h.spieler[0].ko[t.id], undefined, "Merkzettel geleert"); });
  });
});
test("Gastgeber: tierStand schickt Leben der Tiere an den Gast (ein Mal je Sekunde)", function(){
  return mpTiere(function(u, r){
    var t = gastTier("hund"), got = []; r.g.o.beiTierStand = function(n){ got.push(n); }; r.g.takt(0.1, zustandMitTieren([t])); return raumLauf(u.netz).then(function(){
      SC.Spiel.prototype._tiereGaeste.call({ raum: u.h, welt: u.welt }); var e = null; u.welt.wesen.forEach(function(x){ if(x.art === "tier") e = x; }); e.lp = 7;
      u.h.tierStand(r.figur.figurId, [{ id: t.id, lp: e.lp }], []); return raumLauf(u.netz);
    }).then(function(){ gleich(got.length, 1); gleich(got[0].liste[0].id, t.id); gleich(got[0].liste[0].lp, 7); gleich(got[0].ko.length, 0); });
  });
});
test("Fang über das Netz: sperren, zweiter bekommt Nein, Ende frei oder gefangen", function(){
  return mpTiere(function(u, r){
    var e = SC.Wesen.neu(u.welt, "tier", { tierArt: "hase", wild: true, pos: [3, 80, 0], heim: [3, 80, 0], breite: 0.4, hoehe: 0.7 }), nein = [];
    r.g.o.beiFangNein = function(id){ nein.push(id); };
    r.g.takt(0.1, zustandMitTieren([])); r.g.fangStart(e.id); return raumLauf(u.netz).then(function(){
      gleich(e.fangVon, r.figur.figurId, "gesperrt für den Gast"); gleich(e.haeltStill, true); gleich(nein.length, 0);
      r.g.fangStart(e.id); return raumLauf(u.netz);
    }).then(function(){
      gleich(nein.length, 0, "derselbe Fänger darf nochmal"); e.fangVon = "andere"; r.g.fangStart(e.id); return raumLauf(u.netz);
    }).then(function(){
      gleich(nein[0], e.id, "gesperrtes Tier: Nein"); e.fangVon = r.figur.figurId; r.g.fangEnde(e.id, false); return raumLauf(u.netz);
    }).then(function(){
      gleich(e.fangVon || null, null, "frei"); gleich(e.haeltStill, false); gleich(e.modus, "flieht", "hoppelt weg"); wahr(u.welt.wesen.has(e.id));
      r.g.fangStart(e.id); return raumLauf(u.netz).then(function(){ r.g.fangEnde(e.id, true); return raumLauf(u.netz); });
    }).then(function(){ gleich(u.welt.wesen.has(e.id), false, "gefangen: vom Gastgeber entfernt"); });
  });
});
test("Fang: nur der Fänger beendet, fremde Meldungen und weite Entfernung gelten nicht", function(){
  return mpTiere(function(u, r){
    var fern = SC.Wesen.neu(u.welt, "tier", { tierArt: "hase", wild: true, pos: [300, 80, 300], heim: [300, 80, 300], breite: 0.4, hoehe: 0.7 }), nah = SC.Wesen.neu(u.welt, "tier", { tierArt: "hase", wild: true, pos: [3, 80, 0], heim: [3, 80, 0], breite: 0.4, hoehe: 0.7 });
    r.g.takt(0.1, zustandMitTieren([])); r.g.fangStart(fern.id); return raumLauf(u.netz).then(function(){
      gleich(fern.fangVon || null, null, "zu weit weg"); nah.fangVon = "andere"; nah.haeltStill = true; r.g.fangEnde(nah.id, true); return raumLauf(u.netz);
    }).then(function(){ wahr(u.welt.wesen.has(nah.id), "fremder Fang bleibt"); gleich(nah.fangVon, "andere"); });
  });
});
test("Wild-Fang eines getrennten Gastes wird freigegeben", function(){
  var w = new SC.Welt(new SC.Planet({ id: "start", seed: 5 })), e = SC.Wesen.neu(w, "tier", { tierArt: "hase", wild: true, pos: [3, 80, 0], breite: 0.4, hoehe: 0.7, fangVon: "weg", haeltStill: true });
  SC.Spiel.tierFangFreigeben(w, "ich", [{ id: "ich" }]); gleich(e.fangVon, null); gleich(e.haeltStill, false);
  var f = SC.Wesen.neu(w, "tier", { tierArt: "hase", wild: true, pos: [3, 80, 0], breite: 0.4, hoehe: 0.7, fangVon: "da", haeltStill: true }); SC.Spiel.tierFangFreigeben(w, "ich", [{ id: "ich" }, { id: "da" }]); gleich(f.fangVon, "da", "Fänger noch da");
});
