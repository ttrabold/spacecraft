// Kessel und Rezeptbuch (Zaubertränke, Spec 2026-11-09): Kristall und Pflanze wählen, Vorschau, brauen. Muster: js/ui-werkbank.js
(function(){
  function esc(s){ return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function bild(id){ return '<img src="' + SC.UI.blockBild(id) + '" alt="">'; }

  // o: { beiBrauen?(schluessel), beiAenderung?, beiFertig? } – Brauen verbraucht Zutaten aus dem Rucksack von kampf
  SC.UI.prototype.zeigeKessel = function(kampf, o){
    var ui = this, rs = kampf.rucksack, T = SC.T, kristall = null, pflanze = null; o = o || {};
    function zutaten(){ return [["flasche", SC.B.FLASCHE], ["kristall", kristall && SC.CRAFTING_KRISTALLE[kristall].block], ["pflanze", pflanze && SC.PFLANZEN[pflanze].block]]; }
    function kann(){ return !!kristall && !!pflanze && zutaten().every(function(z){ return rs.hat(z[1]) >= 1; }); }
    function kristallKnopf(key){
      var k = SC.CRAFTING_KRISTALLE[key];
      return '<button class="wb-opt' + (kristall === key ? " an" : "") + '" data-aktion="kristall" data-id="' + key + '" style="border-color:' + k.farbe + '">' + bild(k.block) + "<small>" + esc(T.kristallName[key]) + " ×" + rs.hat(k.block) + "</small></button>";
    }
    function pflanzeKnopf(id){
      var p = SC.PFLANZEN[id];
      return '<button class="wb-opt' + (pflanze === id ? " an" : "") + '" data-aktion="pflanze" data-id="' + id + '">' + bild(p.block) + "<small>" + esc(p.name) + " ×" + rs.hat(p.block) + "</small></button>";
    }
    function detail(){
      if(!kristall || !pflanze) return '<p class="leer">' + esc(T.trankWaehle) + "</p>";
      var w = SC.TRANK.wirkung[kristall], p = SC.PFLANZEN[pflanze], h = "<h3>" + esc(SC.Trank.name(SC.Trank.schluessel(kristall, pflanze))) + "</h3>";
      h += "<p><b>" + esc(T.trankWirkungKopf) + ":</b> " + esc(T.trankWirkungLang[w.art]) + "</p><p><b>" + esc(T.trankAussehenKopf) + ":</b> " + esc(T.trankTeil[p.teil]) + ", " + esc(T.kristallName[kristall]) + "</p>";
      h += '<div class="wb-kostenzeile">' + zutaten().map(function(z){ var hat = rs.hat(z[1]); return '<span class="wb-kosten' + (hat >= 1 ? "" : " fehlt") + '">' + bild(z[1]) + " " + Math.min(hat, 1) + "/1 " + esc(SC.BLOECKE[z[1]].name) + "</span>"; }).join("") + "</div>";
      if(!kann()) h += "<p>" + esc(T.trankFehlt) + "</p>";
      return h + '<button class="haupt" data-aktion="brauen"' + (kann() ? "" : " disabled") + ">" + esc(T.trankBrauen) + "</button>";
    }
    function zeichne(){
      var nebenbei = !kristall || !pflanze ? '<button class="haupt" data-aktion="brauen" disabled>' + esc(T.trankBrauen) + "</button>" : "";
      ui._zeige("<h2>" + esc(T.kesselTitel) + "</h2>" +
        '<div class="wb"><div class="wb-liste kz" data-zone="liste"><div class="wb-wahl"><b>' + esc(T.trankKristallWahl) + "</b> " + Object.keys(SC.TRANK.wirkung).map(kristallKnopf).join("") + '</div><div class="wb-wahl"><b>' + esc(T.trankPflanzeWahl) + "</b> " + SC.PFLANZEN_REIHE.map(pflanzeKnopf).join("") + "</div></div>" +
        '<div class="wb-detail" data-zone="detail">' + detail() + nebenbei + "</div></div>" +
        '<div class="reihe" data-zone="aktionen"><button data-aktion="rezeptbuch">' + esc(T.rezeptbuch) + '</button><button data-aktion="fertig">' + esc(T.fertig) + "</button></div>", aktionen, { seite: true, startZone: "liste" });
    }
    var aktionen = {
      kristall: function(el, id){ kristall = id; zeichne(); },
      pflanze: function(el, id){ pflanze = id; zeichne(); },
      brauen: function(){
        var r = kristall && pflanze ? SC.Crafting.brauen(rs, kristall, pflanze) : { ok: false, grund: "zutat" };
        if(r.ok){ ui.hinweis(T.trankGebraut.replace("{name}", SC.Trank.name(r.schluessel))); o.beiBrauen && o.beiBrauen(r.schluessel); o.beiAenderung && o.beiAenderung(); }
        else ui.hinweis(r.grund === "voll" ? T.rucksackVoll : T.trankFehlt);
        zeichne();
      },
      rezeptbuch: function(){ ui.zeigeRezeptbuch(function(){ ui.zeigeKessel(kampf, o); }); },
      fertig: function(){ ui.schliesse(); o.beiFertig ? o.beiFertig() : ui.o.beiWeiter && ui.o.beiWeiter(); }
    };
    zeichne();
  };

  // Rezeptbuch: von Anfang an alles – je Kristall die Wirkung, je Pflanze Aussehen und Planet; zurueck wird beim Schließen gerufen
  SC.UI.prototype.zeigeRezeptbuch = function(zurueck){
    var ui = this, T = SC.T;
    var kr = Object.keys(SC.TRANK.wirkung).map(function(key){
      var k = SC.CRAFTING_KRISTALLE[key], w = SC.TRANK.wirkung[key];
      return '<div class="rb-zeile" style="border-left:4px solid ' + k.farbe + ';padding-left:6px">' + bild(k.block) + " <b>" + esc(T.kristallName[key]) + "</b>: " + esc(T.trankWirkungLang[w.art]) + "</div>";
    }).join("");
    var pf = SC.PFLANZEN_REIHE.map(function(id){
      var p = SC.PFLANZEN[id];
      return '<div class="rb-zeile">' + bild(p.block) + " <b>" + esc(p.name) + "</b> (" + esc(T.trankPlanet[p.planet]) + "): " + esc(T.trankTeil[p.teil]) + "</div>";
    }).join("");
    ui._zeige("<h2>" + esc(T.rezeptbuch) + "</h2><p>" + esc(T.rezeptbuchTipp) + '</p><div class="wb"><div class="wb-liste kz" data-zone="liste"><h3>' + esc(T.trankKristallWahl) + "</h3>" + kr + '</div><div class="wb-detail" data-zone="detail"><h3>' + esc(T.trankPflanzeWahl) + "</h3>" + pf + "</div></div>" +
      '<div class="reihe" data-zone="aktionen"><button class="haupt" data-aktion="zurueck">' + esc(T.trankZurueck) + "</button></div>",
      { zurueck: function(){ zurueck && zurueck(); } }, { seite: true, startZone: "aktionen" });
  };
})();
