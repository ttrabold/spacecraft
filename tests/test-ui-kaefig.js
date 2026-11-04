// Käfig-Panel (Haustiere, Aufgabe 9)
function kfAuf(fn, optionen){
  var w = document.createElement("div"); document.body.appendChild(w); var ui = ui2(w, { beiWeiter: function(){} }), k = k2(), kf = k.kaefig, ts = [tierNeu("hund"), tierNeu("hase"), tierNeu("katze")]; ts.forEach(function(t){ kf.lege(t); });
  var log = []; var o = { beiRaus: function(id){ log.push("raus:" + id); return kf.rauslassen(id); }, beiRein: function(id){ log.push("rein:" + id); kf.zurueck(id); }, beiUmbenennen: function(id, n){ log.push("name:" + id + ":" + n); kf.umbenennen(id, n); }, beiFreilassen: function(id){ log.push("frei:" + id); kf.freilassen(id); }, beiFertig: function(){ log.push("fertig"); } };
  for(var n in (optionen || {})) o[n] = optionen[n];
  try{ fn(w, ui, k, kf, ts, o, log); } finally { w.remove(); }
}
function kfPlatz(w, i){ return w.querySelector('.rs-platz[data-i="' + i + '"]'); }
function kfKnoepfe(w){ return [].map.call(w.querySelectorAll(".rs-menue button"), function(b){ return b.getAttribute("data-aktion"); }).join(); }
test("Käfig-Panel zeigt 18 Plätze mit Tieren, Stufe und Zustand", function(){ kfAuf(function(w, ui, k, kf, ts, o){
  ts[1].draussen = true; ts[2].koRest = 30; ui.zeigeKaefig(kf, o);
  gleich(w.querySelectorAll(".rs-platz").length, 18); wahr(kfPlatz(w, 0).textContent.indexOf(SC.TIERE.hund.emoji) >= 0, "Emoji"); wahr(kfPlatz(w, 1).classList.contains("draussen"), "draußen markiert"); wahr(kfPlatz(w, 2).classList.contains("ko"), "K.o. markiert"); wahr(!kfPlatz(w, 5).textContent.trim(), "leerer Platz");
  gleich(document.activeElement.closest("[data-zone]").getAttribute("data-zone"), "raster", "Start im Raster");
}); });
test("Käfig-Panel: Menü je Zustand, Freilassen nie zuerst", function(){ kfAuf(function(w, ui, k, kf, ts, o){
  ts[1].draussen = true; ts[2].koRest = 30; ui.zeigeKaefig(kf, o); var l = {};
  kfPlatz(w, 0).click(); l.drin = kfKnoepfe(w); kfPlatz(w, 1).click(); l.draussen = kfKnoepfe(w); kfPlatz(w, 2).click(); l.ko = kfKnoepfe(w);
  gleich(l.drin, "raus,umbenennen,freilassen,abbrechen"); gleich(l.draussen, "rein,umbenennen,freilassen,abbrechen"); gleich(l.ko, "umbenennen,freilassen,abbrechen");
  for(var n in l) wahr(l[n].split(",")[0] !== "freilassen", n);
  kfPlatz(w, 7).click(); wahr(!w.querySelector(".rs-menue"), "leerer Platz: kein Menü");
}); });
test("Käfig-Panel: Rauslassen und Zurückholen, voll und K.o. mit Hinweis", function(){ kfAuf(function(w, ui, k, kf, ts, o, log){
  var hin = []; ui.hinweis = function(t){ hin.push(t); }; var extra = [tierNeu("fuchs"), tierNeu("igel")]; extra.forEach(function(t){ kf.lege(t); }); ui.zeigeKaefig(kf, o);
  kfPlatz(w, 0).click(); w.querySelector('.rs-menue [data-aktion="raus"]').click(); gleich(ts[0].draussen, true); wahr(log.indexOf("raus:" + ts[0].id) >= 0);
  kfPlatz(w, 0).click(); w.querySelector('.rs-menue [data-aktion="rein"]').click(); gleich(ts[0].draussen, false); wahr(log.indexOf("rein:" + ts[0].id) >= 0);
  [0, 1, 2].forEach(function(i){ kf.rauslassen(ts[i].id); }); ui.zeigeKaefig(kf, o); kfPlatz(w, 3).click(); w.querySelector('.rs-menue [data-aktion="raus"]').click(); gleich(extra[0].draussen, false); wahr(hin.indexOf(SC.T.kfDraussenVoll) >= 0, "voll: Hinweis");
  extra[1].koRest = 20; kf.zurueck(ts[0].id); ui.zeigeKaefig(kf, o); kfPlatz(w, 4).click(); wahr(!w.querySelector('.rs-menue [data-aktion="raus"]'), "K.o.: kein Rauslassen");
}); });
test("Käfig-Panel: Freilassen fragt nach", function(){ kfAuf(function(w, ui, k, kf, ts, o, log){
  ui.zeigeKaefig(kf, o); kfPlatz(w, 0).click(); w.querySelector('.rs-menue [data-aktion="freilassen"]').click();
  gleich(kfKnoepfe(w), "freiNein,freiJa"); gleich(document.activeElement.getAttribute("data-aktion"), "freiNein", "Nein vorausgewählt"); wahr(w.querySelector(".rs-menue").textContent.indexOf(ts[0].name) >= 0, "nennt den Namen");
  w.querySelector('.rs-menue [data-aktion="freiNein"]').click(); wahr(kf.tier(ts[0].id), "bleibt"); wahr(log.indexOf("frei:" + ts[0].id) < 0); gleich(kfKnoepfe(w), "raus,umbenennen,freilassen,abbrechen", "Menü bleibt offen");
  w.querySelector('.rs-menue [data-aktion="freilassen"]').click(); w.querySelector('.rs-menue [data-aktion="freiJa"]').click();
  gleich(kf.tier(ts[0].id), null, "frei"); wahr(!kfPlatz(w, 0).textContent.trim(), "Platz leer");
}); });
test("Käfig-Panel: Umbenennen mit Texteingabe", function(){ kfAuf(function(w, ui, k, kf, ts, o, log){
  ui.zeigeKaefig(kf, o); kfPlatz(w, 1).click(); w.querySelector('.rs-menue [data-aktion="umbenennen"]').click();
  var inp = w.querySelector(".kf-name"); wahr(inp, "Eingabe"); gleich(inp.value, ts[1].name, "alter Name vorbelegt"); gleich(inp.maxLength, 16);
  inp.value = "Flocke"; w.querySelector('.rs-menue [data-aktion="nameOk"]').click(); gleich(ts[1].name, "Flocke"); wahr(log.indexOf("name:" + ts[1].id + ":Flocke") >= 0); wahr(kfPlatz(w, 1).getAttribute("title").indexOf("Flocke") >= 0 || w.textContent.indexOf("Flocke") >= 0, "neuer Name angezeigt");
}); });
test("Käfig-Panel: B schließt zuerst Rückfrage und Menü, dann das Panel; Zurück-Knopf", function(){ kfAuf(function(w, ui, k, kf, ts, o, log){
  ui.zeigeKaefig(kf, o); kfPlatz(w, 0).click(); w.querySelector('.rs-menue [data-aktion="freilassen"]').click();
  ui.menueAktion("zurueck"); gleich(kfKnoepfe(w), "raus,umbenennen,freilassen,abbrechen", "zurück ins Menü"); ui.menueAktion("zurueck"); wahr(!w.querySelector(".rs-menue"), "Menü zu"); wahr(!ui.ebene.hidden, "Panel offen");
  w.querySelector('[data-aktion="fertig"]').click(); wahr(log.indexOf("fertig") >= 0, "Fertig"); wahr(ui.ebene.hidden, "Panel zu");
}); });
test("Rucksack hat einen Knopf zum Käfig, Fertig führt zurück", function(){ kfAuf(function(w, ui, k, kf, ts, o){
  ui.zeigeRucksack(k, { kaefig: o }); w.querySelector('[data-aktion="kaefig"]').click(); wahr(w.querySelector(".rs-platz") && !w.querySelector('.rs-platz[data-i="30"]'), "Käfig-Panel (18 Plätze)"); gleich(w.querySelectorAll(".rs-platz").length, 18);
  w.querySelector('[data-aktion="fertig"]').click(); wahr(w.querySelector('.rs-platz[data-i="30"]'), "zurück im Rucksack"); wahr(!w.querySelector('.rs-platz[data-i="30"]').closest(".kf-raster"), "Rucksack-Raster");
}); });
test("Kreativ-Blockauswahl hat den Reiter Tiere", function(){ kfAuf(function(w, ui){
  var art = null; ui.zeigeBlockauswahl(function(){}, { ausruestung: true, beiTier: function(a){ art = a; } });
  w.querySelector('[data-aktion="reiter"][data-id="tiere"]').click(); wahr(!w.querySelector(".raster.tiere").hidden, "Tiere sichtbar"); wahr(w.querySelector(".raster.bl").hidden, "Blöcke weg");
  gleich(w.querySelectorAll('.raster.tiere [data-aktion="tier"]').length, 15); w.querySelector('[data-aktion="tier"][data-art="fuchs"]').click(); gleich(art, "fuchs");
}); });
