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
function fzWahl(o){ return Object.assign({ motor: { stufe: 0, block: SC.B.STEIN }, panzerung: { stufe: 0, block: SC.B.STEIN }, waffe: null, farbe: SC.BAU_FARBEN[1] }, o || {}); }
function fzRs(l){ var r = new SC.Rucksack(); l.forEach(function(x){ r.lege({ block: x[0], anzahl: x[1] }); }); return r; }
function fzOrt(frei){ var o = { gesetzt: [], fahrzeug: { platz: function(art){ return frei ? [5, 61, 5] : null; }, setze: function(art, bau, pos){ var f = { art: art, bau: bau, pos: pos }; o.gesetzt.push(f); return f; } } }; return o; }
test("Fahrzeug-Rezepte: Kosten aus Rumpf, Motor, Panzerung und Bordwaffe (#114)", function(){
  ["fz-gleiter", "fz-buggy", "fz-flieger"].forEach(function(id){ var rz = SC.Crafting.rezept(id); wahr(rz && rz.art === "fahrzeug" && rz.station === "werkbank" && SC.FAHRZEUGE[rz.fahrzeug], id); });
  var B = SC.B, g = SC.Crafting.rezept("fz-gleiter"), K = SC.Crafting.kosten;
  function summe(k){ var s = {}; k.forEach(function(x){ s[x.block] = (s[x.block] || 0) + x.anzahl; }); return s; }
  var k0 = summe(K(g, fzWahl())); gleich(k0[B.BRETTER], 10); gleich(k0[B.SCHALTKREIS], 3); gleich(k0[B.STEIN], 14, "6 für den Motor, 8 für die Panzerung"); gleich(Object.keys(k0).length, 3);
  var k1 = summe(K(g, fzWahl({ motor: { stufe: 2, block: B.TITAN }, panzerung: { stufe: 3, block: B.MOORSILBER }, waffe: { stufe: 1, block: B.EISENERZ, kristall: "rot" } }))); gleich(k1[B.TITAN], 6); gleich(k1[B.MOORSILBER], 8); gleich(k1[B.EISENERZ], 5); gleich(k1[B.KRISTALL_ROT], 1); gleich(k1[B.STEIN], undefined);
  var b = summe(K(SC.Crafting.rezept("fz-buggy"), fzWahl())); gleich(b[B.BRETTER], 14); gleich(b[B.SCHALTKREIS], 5); gleich(b[B.STEIN], 10 + 14);
  var f = summe(K(SC.Crafting.rezept("fz-flieger"), fzWahl())); gleich(f[B.BRETTER], 12); gleich(f[B.SCHALTKREIS], 8); gleich(f[B.KRISTALL_BLAU], 1);
  gleich(K(g, fzWahl({ motor: { stufe: 2, block: B.EISENERZ } })), null, "falsches Metall"); gleich(K(g, fzWahl({ waffe: { stufe: 0, block: B.STEIN, kristall: "pink" } })), null, "falscher Kristall"); gleich(K(g, fzWahl({ farbe: "#123456" })), null, "falsche Farbe"); gleich(K(g, null), null); gleich(K(g, fzWahl({ motor: null })), null);
});
test("Fahrzeug-Rezepte: herstellen zahlt erst nach dem Aufstellen und prüft den Platz (#114)", function(){
  var B = SC.B, rz = SC.Crafting.rezept("fz-gleiter"), reich = function(){ return fzRs([[B.BRETTER, 20], [B.SCHALTKREIS, 5], [B.STEIN, 30]]); };
  var rs = reich(), o = fzOrt(true), e = SC.Crafting.herstelle(rs, rz, fzWahl({ farbe: SC.BAU_FARBEN[5] }), SC.zufall(1), 1, o);
  gleich(e.ok, true); gleich(o.gesetzt.length, 1); gleich(o.gesetzt[0].art, "gleiter"); gleich(JSON.stringify(o.gesetzt[0].bau), JSON.stringify({ motor: 0, panzerung: 0, waffe: null, farbe: SC.BAU_FARBEN[5] })); gleich(e.ergebnis, o.gesetzt[0]);
  gleich(rs.hat(B.BRETTER), 10); gleich(rs.hat(B.STEIN), 16); gleich(rs.hat(B.SCHALTKREIS), 2);
  var rs2 = reich(), o2 = fzOrt(false); e = SC.Crafting.herstelle(rs2, rz, fzWahl(), SC.zufall(1), 1, o2); gleich(e.ok, false); gleich(e.grund, "platz"); gleich(rs2.hat(B.BRETTER), 20, "nichts bezahlt"); gleich(o2.gesetzt.length, 0);
  var arm = fzRs([[B.BRETTER, 3]]), o3 = fzOrt(true); e = SC.Crafting.herstelle(arm, rz, fzWahl(), SC.zufall(1), 1, o3); gleich(e.ok, false); gleich(e.grund, "material"); gleich(o3.gesetzt.length, 0);
  e = SC.Crafting.herstelle(reich(), rz, fzWahl({ farbe: "#000000" }), SC.zufall(1), 1, fzOrt(true)); gleich(e.grund, "wahl");
  e = SC.Crafting.herstelle(reich(), rz, fzWahl(), SC.zufall(1), 1, {}); gleich(e.ok, false, "ohne Aufsteller geht es nicht"); gleich(e.grund, "platz");
  var o4 = fzOrt(true), leer = new SC.Rucksack(); e = SC.Crafting.herstelle(leer, rz, fzWahl({ waffe: { stufe: 4, block: B.STERNENMETALL, kristall: "weiss" } }), SC.zufall(1), 1, Object.assign(o4, { gratis: true })); gleich(e.ok, true, "Entwicklerwerkzeug gratis"); gleich(o4.gesetzt[0].bau.waffe.kristall, "weiss");
});
// --- Menü (#115) ---
function fzMenue(rs, frei){ var a = wb(), ort = fzOrt(frei !== false); a.o.fahrzeug = ort.fahrzeug; (rs || []).forEach(function(x){ a.k.rucksack.lege({ block: x[0], anzahl: x[1] }); }); a.ui.zeigeWerkbank(a.k, a.o); a.ort = ort; return a; }
test("Fahrzeug-Menü: drei Fahrzeug-Karten, Auswahl mit Voreinstellung (#115)", function(){
  var a = fzMenue(); ["fz-gleiter", "fz-buggy", "fz-flieger"].forEach(function(id){ wahr(a.w.querySelector('[data-aktion="rezept"][data-id="' + id + '"]'), id); });
  a.w.querySelector('[data-aktion="rezept"][data-id="fz-buggy"]').click();
  gleich(a.w.querySelectorAll('[data-aktion="fz-motor"]').length, 6, "Motor: sechs Metalle"); gleich(a.w.querySelectorAll('[data-aktion="fz-panzerung"]').length, 6); gleich(a.w.querySelectorAll('[data-aktion="fz-farbe"]').length, 12);
  wahr(a.w.querySelector('[data-aktion="fz-waffe"][data-id="keine"]'), "Bordwaffe: keine wählbar"); gleich(a.w.querySelectorAll('[data-aktion="fz-kristall"]').length, 0, "Kristalle erst mit Bordwaffe");
  ["fz-motor", "fz-panzerung"].forEach(function(t){ gleich(a.w.querySelector('[data-aktion="' + t + '"].an').getAttribute("data-id"), "0:" + SC.B.STEIN, t + " vorgewählt: Stein"); }); gleich(a.w.querySelector('[data-aktion="fz-farbe"].an').getAttribute("data-id"), SC.BAU_FARBEN[0]); wahr(a.w.querySelector('[data-aktion="fz-waffe"][data-id="keine"].an'));
  wahr(a.w.querySelector(".wb-fzwerte").textContent.indexOf("Tempo") >= 0, "Vorschau der Werte");
});
test("Fahrzeug-Menü: Wahl ändert Vorschau und Kosten, Herstellen stellt das Fahrzeug auf (#115)", function(){
  var B = SC.B, a = fzMenue([[B.BRETTER, 20], [B.SCHALTKREIS, 5], [B.STEIN, 20], [B.TITAN, 14], [B.EISENERZ, 6], [B.KRISTALL_ROT, 2]]);
  a.w.querySelector('[data-aktion="rezept"][data-id="fz-gleiter"]').click(); var vorher = a.w.querySelector(".wb-fzwerte").textContent;
  a.w.querySelector('[data-aktion="fz-motor"][data-id="2:' + B.TITAN + '"]').click(); wahr(a.w.querySelector(".wb-fzwerte").textContent !== vorher, "Titan-Motor ändert die Werte");
  a.w.querySelector('[data-aktion="fz-panzerung"][data-id="2:' + B.TITAN + '"]').click(); a.w.querySelector('[data-aktion="fz-waffe"][data-id="1:' + B.EISENERZ + '"]').click(); gleich(a.w.querySelectorAll('[data-aktion="fz-kristall"]').length, 6, "Kristallwahl erscheint");
  a.w.querySelector('[data-aktion="fz-kristall"][data-id="rot"]').click(); a.w.querySelector('[data-aktion="fz-farbe"][data-id="' + SC.BAU_FARBEN[5] + '"]').click();
  var kn = a.w.querySelector('[data-aktion="herstellen"]'); wahr(!kn.disabled, "genug Rohstoffe"); wb.aend = 0; kn.click();
  gleich(a.ort.gesetzt.length, 1); var bau = a.ort.gesetzt[0].bau; gleich(bau.motor, 2); gleich(bau.panzerung, 2); gleich(bau.waffe.stufe, 1); gleich(bau.waffe.kristall, "rot"); gleich(bau.farbe, SC.BAU_FARBEN[5]);
  gleich(a.k.rucksack.hat(B.TITAN), 0, "6 + 8 Titan bezahlt"); gleich(a.k.rucksack.hat(B.EISENERZ), 1); gleich(a.k.rucksack.hat(B.KRISTALL_ROT), 1); gleich(wb.aend, 1, "beiAenderung");
  a.w.querySelector('[data-aktion="fz-waffe"][data-id="keine"]').click(); gleich(a.w.querySelectorAll('[data-aktion="fz-kristall"]').length, 0, "ohne Waffe keine Kristalle");
});
test("Fahrzeug-Menü: zu wenig Rohstoffe und kein Platz sperren (#115)", function(){
  var a = fzMenue([[SC.B.BRETTER, 3]]); a.w.querySelector('[data-aktion="rezept"][data-id="fz-gleiter"]').click(); wahr(a.w.querySelector('[data-aktion="herstellen"]').disabled, "arm"); wahr(a.w.querySelector(".wb-kosten.fehlt"), "Fehlendes rot");
  var b = fzMenue([[SC.B.BRETTER, 20], [SC.B.SCHALTKREIS, 5], [SC.B.STEIN, 20]], false); b.w.querySelector('[data-aktion="rezept"][data-id="fz-gleiter"]').click(); b.w.querySelector('[data-aktion="herstellen"]').click();
  gleich(b.ort.gesetzt.length, 0, "ohne Platz nichts aufgestellt"); gleich(b.k.rucksack.hat(SC.B.BRETTER), 20, "nichts bezahlt");
});
// --- Aufstellen, Heimkehr, Mehrspieler (#116) ---
function fzSpiel(extra){
  var w = new SC.Welt(new SC.Planet({ id: "start", seed: 5 })); for(var x = 0; x < 48; x++) for(var z = 0; z < 48; z++) for(var y = 1; y < 128; y++) w.setzeBlock(x, y, z, y <= 60 ? SC.B.STEIN : SC.B.LUFT, "system");
  var sp = new SC.Spieler({ id: "a", pos: [24.5, 61, 24.5], modus: "survival" }), hinweise = []; sp.blick = [0, 0];
  return Object.assign({ welt: w, spieler: sp, raum: null, ui: { hinweis: function(t){ hinweise.push(t); } }, hinweise: hinweise, _fahrzeugBauer: SC.Spiel.prototype._fahrzeugBauer }, extra || {});
}
test("Fahrzeug aufstellen: fünf Blöcke vor dem Spieler, zuhause am Bauplatz, mit Bauplan (#116)", function(){
  var s = fzSpiel(), b = s._fahrzeugBauer(), pos = b.platz("buggy"); wahr(pos, "Platz gefunden"); wahr(Math.abs(pos[2] - (24.5 - 5)) < 2.5 && Math.abs(pos[0] - 24.5) < 2.5, "vor dem Spieler: " + pos);
  var bau = { motor: 3, panzerung: 1, waffe: { stufe: 2, kristall: "gelb" }, farbe: SC.BAU_FARBEN[4] }, f = b.setze("buggy", bau, pos);
  wahr(f && s.welt.fahrzeuge.get(f.id) === f, "steht in der Welt"); gleich(f.art, "buggy"); gleich(JSON.stringify(f.bau), JSON.stringify(bau)); gleich(f.fundort, f.id, "zuhause: bleibt erhalten"); gleich(JSON.stringify(f.heim), JSON.stringify(pos)); gleich(f.panzerung, SC.Fahrzeug.def(f).panzerung, "volle Panzerung");
  wahr(f.id.indexOf("bau-") === 0, "eigene ID"); wahr(b.setze("gleiter", bau, b.platz("gleiter")).id !== f.id, "jedes Fahrzeug eine eigene ID");
  var eng = fzSpiel(); for(var x = 10; x <= 40; x++) for(var z = 10; z <= 40; z++) for(var y = 61; y <= 126; y++) eng.welt.setzeBlock(x, y, z, SC.B.STEIN, "system"); eng.welt.setzeBlock(24, 61, 24, SC.B.LUFT, "system"); gleich(eng._fahrzeugBauer().platz("buggy"), null, "eingemauert: kein Platz");
});
test("Gebautes Fahrzeug verpufft nie wirklich: kehrt mit vollem Panzer und gleichem Bauplan zurück (#116)", function(){
  var s = fzSpiel(), f = s._fahrzeugBauer().setze("gleiter", { motor: 4, panzerung: 4, waffe: null, farbe: SC.BAU_FARBEN[2] }, [30.5, 61.6, 30.5]), voll = f.panzerung;
  var r = SC.Fahrzeug.schaden(s.welt, f, voll + 50, 100); gleich(r.verpufft, true); gleich(f.weg, true, "weg, aber nicht gelöscht"); wahr(s.welt.fahrzeuge.has(f.id), "bleibt in der Welt"); gleich(f.wiederBei, 100 + SC.Fahrzeug.WIEDERKEHR);
  f.pos = [1, 1, 1]; SC.Fahrzeug.wiederkehr(s.welt, 100 + SC.Fahrzeug.WIEDERKEHR + 1); gleich(f.weg, false); gleich(JSON.stringify(f.pos), JSON.stringify([30.5, 61.6, 30.5])); gleich(f.panzerung, voll); gleich(f.bau.motor, 4);
});
test("Fahrzeugbau als Gast: Wunsch geht mit Bauplan an den Gastgeber, der prüft ihn (#116)", function(){
  var u, a, bau = { motor: 2, panzerung: 3, waffe: { stufe: 0, kristall: "violett" }, farbe: SC.BAU_FARBEN[6] };
  return mspRaum(1).then(function(x){ u = x; a = u.gs[0]; var w = u.welt; for(var xx = 0; xx < 16; xx++) for(var zz = 0; zz < 16; zz++) w.setzeBlock(xx, 61, zz, SC.B.STEIN, "system");
    var sp = new SC.Spieler({ id: "g", pos: [8.5, 62, 8.5], modus: "survival" }), s = fzSpiel({ spieler: sp, raum: a.g, welt: a.welt });
    var ergebnis = s._fahrzeugBauer().setze("gleiter", bau, [8.5, 62.6, 4.5]); gleich(ergebnis.art, "gleiter", "Gast bekommt eine Bestätigung"); return raumLauf(u.netz);
  }).then(function(){
    var f = null; u.welt.fahrzeuge.forEach(function(x){ if(x.bau) f = x; }); wahr(f, "beim Gastgeber aufgestellt"); gleich(JSON.stringify(f.bau), JSON.stringify(bau)); gleich(f.fundort, f.id, "zuhause"); wahr(f.panzerung > 0);
    a.g.fzHinstellen("gleiter", [10.5, 62.6, 4.5], 0, { motor: 9, panzerung: 0, waffe: null, farbe: "#000000" }); return raumLauf(u.netz);
  }).then(function(){ var n = 0; u.welt.fahrzeuge.forEach(function(x){ if(x.bau) n++; }); gleich(n, 1, "ungültiger Bauplan abgelehnt"); a.g.fzHinstellen("gleiter", [12.5, 62.6, 4.5], 0); return raumLauf(u.netz);
  }).then(function(){ var frei = 0; u.welt.fahrzeuge.forEach(function(x){ if(!x.bau && !x.fundort) frei++; }); gleich(frei, 1, "ohne Bauplan weiterhin ein freies Fahrzeug (Kreativ)"); });
});
test("Werkbank übergibt den Fahrzeugbauer ans Menü (#116)", function(){
  var s = fzSpiel(), geoeffnet = null; s.kampf = {}; s.eingabe = { gebeMausFrei: function(){} }; s._weiter = function(){}; s.ui.zeigeWerkbank = function(k, o){ geoeffnet = o; }; s.welt.setzeBlock(3, 61, 3, SC.B.WERKBANK, "system");
  gleich(SC.Spiel.prototype.benutzeBlock.call(s, { x: 3, y: 61, z: 3 }), true); wahr(geoeffnet && typeof geoeffnet.fahrzeug.platz === "function" && typeof geoeffnet.fahrzeug.setze === "function", "o.fahrzeug da");
});
