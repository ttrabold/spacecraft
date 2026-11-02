// Werkbank-Menü (Stufe 6a): Rezept wählen, bei Waffen und Rüstung Metall und Kristall, dann herstellen.
// Dasselbe Menü dient als „Handwerk“ im Rucksack (nur Rezepte mit station "hand").
(function(){
  function esc(s){ return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  // o: { station: "werkbank" | "hand", gratis?, beiAenderung?, beiFertig? }
  SC.UI.prototype.zeigeWerkbank = function(kampf, o){
    var ui = this, rs = kampf.rucksack, T = SC.T, gewaehlt = null, wahl = {};
    o = o || {};
    var liste = SC.REZEPTE.filter(function(r){ return o.station !== "hand" || r.station === "hand"; });

    function name(rz){ return rz.art === "bauteil" ? T.rezeptName[rz.id] : rz.art === "fahrzeug" ? T.fahrzeuge[rz.fahrzeug] : T.gegenstand[rz.gegenstand][0]; }
    function kostenHtml(k){
      return k.map(function(x){
        var hat = o.gratis ? x.anzahl : rs.hat(x.block);
        return '<span class="wb-kosten' + (hat >= x.anzahl ? "" : " fehlt") + '"><img src="' + SC.UI.blockBild(x.block) + '" alt=""> ' + Math.min(hat, x.anzahl) + "/" + x.anzahl + " " + esc(SC.BLOECKE[x.block].name) + "</span>";
      }).join("");
    }
    function karte(rz){
      var bild = rz.art === "fahrzeug" ? '<span class="wb-fz">' + { gleiter: "🛷", buggy: "🚙", flieger: "🛩️" }[rz.fahrzeug] + "</span>" : rz.art === "bauteil" ? '<img src="' + SC.UI.blockBild(rz.ergibt.block) + '" alt="">' : '<img src="' + SC.UI.gegenstandBild({ art: rz.gegenstand, seltenheit: 0 }) + '" alt="">';
      return '<button class="wb-rezept' + (gewaehlt === rz ? " an" : "") + '" data-aktion="rezept" data-id="' + rz.id + '">' + bild + "<small>" + esc(name(rz)) + (rz.art === "bauteil" && rz.ergibt.anzahl > 1 ? " ×" + rz.ergibt.anzahl : "") + "</small></button>";
    }
    // Fahrzeug (Stufe 6b): Motor, Panzerung, Bordwaffe und Farbe wählen; Vorschau der Werte; Vorauswahl = einfachstes Fahrzeug aus Stein
    function fzStandard(){ return { motor: { stufe: 0, block: SC.B.STEIN }, panzerung: { stufe: 0, block: SC.B.STEIN }, waffe: null, farbe: SC.BAU_FARBEN[0] }; }
    function fzMetalle(aktion, aktuell){
      var h = ""; SC.METALLE.forEach(function(bloecke, s){ bloecke.forEach(function(bl){
        var an = aktuell && aktuell.stufe === s && aktuell.block === bl;
        h += '<button class="wb-opt' + (an ? " an" : "") + '" data-aktion="' + aktion + '" data-id="' + s + ":" + bl + '" style="border-color:' + SC.SELTENHEIT[s].farbe + '"><img src="' + SC.UI.blockBild(bl) + '" alt=""><small>' + esc(SC.BLOECKE[bl].name) + "</small></button>";
      }); });
      return h;
    }
    function fzDetail(){
      var rz = gewaehlt, k = SC.Crafting.kosten(rz, wahl), b = SC.Crafting.baubar(rs, rz, wahl, o), h = "<h3>" + esc(name(rz)) + "</h3>";
      h += '<div class="wb-wahl"><b>' + esc(T.fzMotor) + "</b> " + fzMetalle("fz-motor", wahl.motor) + "</div>";
      h += '<div class="wb-wahl"><b>' + esc(T.fzPanzerung) + "</b> " + fzMetalle("fz-panzerung", wahl.panzerung) + "</div>";
      h += '<div class="wb-wahl"><b>' + esc(T.fzWaffe) + '</b> <button class="wb-opt' + (wahl.waffe ? "" : " an") + '" data-aktion="fz-waffe" data-id="keine"><small>' + esc(T.fzKeine) + "</small></button>" + fzMetalle("fz-waffe", wahl.waffe) + "</div>";
      if(wahl.waffe){
        h += '<div class="wb-wahl"><b>' + esc(T.kristallWahl) + "</b> ";
        Object.keys(SC.CRAFTING_KRISTALLE).forEach(function(key){
          h += '<button class="wb-opt' + (wahl.waffe.kristall === key ? " an" : "") + '" data-aktion="fz-kristall" data-id="' + key + '" style="border-color:' + SC.CRAFTING_KRISTALLE[key].farbe + '"><img src="' + SC.UI.blockBild(SC.CRAFTING_KRISTALLE[key].block) + '" alt=""><small>' + esc(T.kristallName[key]) + "</small></button>";
        });
        h += "</div>";
      }
      h += '<div class="wb-wahl"><b>' + esc(T.fzFarbe) + "</b> ";
      SC.BAU_FARBEN.forEach(function(c){ h += '<button class="wb-farbe' + (wahl.farbe === c ? " an" : "") + '" data-aktion="fz-farbe" data-id="' + c + '" style="background:' + c + '" title="' + c + '"></button>'; });
      h += "</div>";
      var d = SC.Fahrzeug.bauDef(rz.fahrzeug, { motor: wahl.motor.stufe, panzerung: wahl.panzerung.stufe, waffe: wahl.waffe, farbe: wahl.farbe });
      h += '<div class="wb-fzwerte">' + esc(T.fzTempo) + " " + Math.round(d.tempo * 10) / 10 + " · " + esc(T.fzPanzerungWert) + " " + Math.round(d.panzerung) + " · " + (d.geschuetz ? esc(T.fzSchaden) + " " + Math.round(d.geschuetz.schaden * 10) / 10 : esc(T.fzOhneWaffe)) + "</div>";
      h += '<div class="wb-kostenzeile">' + kostenHtml(k) + "</div>";
      if(b.grund === "material") h += "<p>" + esc(T.fehltMaterial) + "</p>";
      return h + '<button class="haupt" data-aktion="herstellen"' + (b.ok ? "" : " disabled") + ">" + esc(T.herstellen) + "</button>";
    }
    function detail(){
      if(!gewaehlt) return '<p class="leer">' + esc(T.wahlTipp) + "</p>";
      if(gewaehlt.art === "fahrzeug") return fzDetail();
      var rz = gewaehlt, h = "<h3>" + esc(name(rz)) + "</h3>", k = SC.Crafting.kosten(rz, wahl), b = SC.Crafting.baubar(rs, rz, wahl, o);
      if(rz.art !== "bauteil"){
        h += '<div class="wb-wahl"><b>' + esc(T.metallWahl) + "</b> ";
        SC.METALLE.forEach(function(bloecke, s){
          bloecke.forEach(function(bl){
            var an = wahl.metallStufe === s && wahl.metallBlock === bl;
            h += '<button class="wb-opt' + (an ? " an" : "") + '" data-aktion="metall" data-id="' + s + ":" + bl + '" style="border-color:' + SC.SELTENHEIT[s].farbe + '"><img src="' + SC.UI.blockBild(bl) + '" alt=""><small>' + esc(SC.BLOECKE[bl].name) + "</small></button>";
          });
        });
        h += "</div>";
        if(rz.kristall){
          h += '<div class="wb-wahl"><b>' + esc(T.kristallWahl) + "</b> ";
          Object.keys(SC.CRAFTING_KRISTALLE).forEach(function(key){
            h += '<button class="wb-opt' + (wahl.kristall === key ? " an" : "") + '" data-aktion="kristall" data-id="' + key + '" style="border-color:' + SC.CRAFTING_KRISTALLE[key].farbe + '"><img src="' + SC.UI.blockBild(SC.CRAFTING_KRISTALLE[key].block) + '" alt=""><small>' + esc(T.kristallName[key]) + "</small></button>";
          });
          h += "</div>";
        }
      }
      h += k ? '<div class="wb-kostenzeile">' + kostenHtml(k) + "</div>" : '<p class="leer">' + esc(T.wahlMetallKristall) + "</p>";
      if(k && b.grund === "material") h += "<p>" + esc(T.fehltMaterial) + "</p>";
      h += '<button class="haupt" data-aktion="herstellen"' + (b.ok ? "" : " disabled") + ">" + esc(T.herstellen) + "</button>";
      return h;
    }
    function zeichne(){
      ui._zeige("<h2>" + esc(o.station === "hand" ? T.handwerkTitel : T.werkbankTitel) + "</h2>" +
        '<div class="wb"><div class="wb-liste">' + liste.map(karte).join("") + '</div><div class="wb-detail">' + detail() + "</div></div>" +
        '<div class="reihe"><button data-aktion="fertig">' + esc(T.fertig) + "</button></div>", aktionen);
    }
    var aktionen = {
      rezept: function(el, id){ gewaehlt = SC.Crafting.rezept(id); wahl = gewaehlt.art === "fahrzeug" ? fzStandard() : {}; zeichne(); },
      "fz-motor": function(el, id){ var t = id.split(":"); wahl.motor = { stufe: +t[0], block: +t[1] }; zeichne(); },
      "fz-panzerung": function(el, id){ var t = id.split(":"); wahl.panzerung = { stufe: +t[0], block: +t[1] }; zeichne(); },
      "fz-waffe": function(el, id){ if(id === "keine") wahl.waffe = null; else { var t = id.split(":"); wahl.waffe = { stufe: +t[0], block: +t[1], kristall: wahl.waffe ? wahl.waffe.kristall : "blau" }; } zeichne(); },
      "fz-kristall": function(el, id){ if(wahl.waffe) wahl.waffe.kristall = id; zeichne(); },
      "fz-farbe": function(el, id){ wahl.farbe = id; zeichne(); },
      metall: function(el, id){ var t = id.split(":"); wahl.metallStufe = +t[0]; wahl.metallBlock = +t[1]; zeichne(); },
      kristall: function(el, id){ wahl.kristall = id; zeichne(); },
      herstellen: function(){
        var r = SC.Crafting.herstelle(rs, gewaehlt, wahl, SC.zufall((Math.random() * 4294967296) >>> 0), kampf.werte ? kampf.werte.stufe : 1, o);
        if(r.ok){ ui.hinweis(T.hergestellt + ": " + name(gewaehlt)); o.beiAenderung && o.beiAenderung(); }
        else ui.hinweis(r.grund === "voll" ? T.rucksackVoll : r.grund === "platz" ? T.fahrzeugKeinPlatz : T.fehltMaterial);
        zeichne();
      },
      fertig: function(){ ui.schliesse(); o.beiFertig ? o.beiFertig() : ui.o.beiWeiter && ui.o.beiWeiter(); }
    };
    zeichne();
  };

  // Truhe (Stufe 6a): oben der Inhalt, unten der Rucksack; Antippen verschiebt den ganzen Platz.
  // anbieter: { hole(), nimm(platz), lege(sache) } liefern Versprechen auf { plaetze | null, sache?, rest? } (Einzelspieler/Gastgeber direkt, Gast über den Gastgeber)
  SC.UI.prototype.zeigeTruhe = function(kampf, anbieter, o){
    var ui = this, rs = kampf.rucksack, T = SC.T, plaetze = null;
    o = o || {};
    function platz(s, aktion, i){
      var inhalt = "", stil = "";
      if(s && s.gegenstand){ inhalt = '<img src="' + SC.UI.gegenstandBild(s.gegenstand) + '" alt="">'; stil = ' style="border-color:' + SC.SELTENHEIT[s.gegenstand.seltenheit || 0].farbe + '"'; }
      else if(s) inhalt = '<img src="' + SC.UI.blockBild(s.block) + '" alt=""><b class="anzahl">' + s.anzahl + "</b>";
      return '<button class="rs-platz" data-aktion="' + aktion + '" data-i="' + i + '"' + stil + ">" + inhalt + "</button>";
    }
    function zeichne(){
      ui._zeige("<h2>" + esc(T.truheTitel) + "</h2>" +
        (plaetze ? '<div class="rs-raster">' + plaetze.map(function(s, i){ return platz(s, "tplatz", i); }).join("") + "</div>" : "<p>…</p>") +
        "<h3>" + esc(T.rucksackTitel) + '</h3><div class="rs-raster">' + rs.plaetze.map(function(s, i){ return platz(s, "rplatz", i); }).join("") + "</div>" +
        '<p class="leer">' + esc(T.truheTipp) + '</p><div class="reihe"><button class="haupt" data-aktion="fertig">' + esc(T.fertig) + "</button></div>", aktionen);
    }
    function antwort(r){
      if(r.plaetze === null){ ui.hinweis(T.truheWeg); plaetze = plaetze || []; } else plaetze = r.plaetze;
      o.beiAenderung && o.beiAenderung(); zeichne();
    }
    function ablegen(sache){ return sache.gegenstand ? rs.lege({ gegenstand: sache.gegenstand }) : rs.lege({ block: sache.block, anzahl: sache.anzahl }); }
    var aktionen = {
      tplatz: function(el){
        var s = plaetze && plaetze[+el.getAttribute("data-i")]; if(!s) return;
        if(!rs.passt(s.gegenstand ? { gegenstand: true } : s)){ ui.hinweis(T.rucksackVoll); return; }
        return anbieter.nimm(+el.getAttribute("data-i")).then(function(r){
          if(r.sache){
            var rest = ablegen(r.sache);
            if(rest) return anbieter.lege(r.sache.gegenstand ? r.sache : { block: r.sache.block, anzahl: rest }).then(antwort);   // Rest zurücklegen (z. B. nach einem Wettlauf um den Platz)
          }
          antwort(r);
        });
      },
      rplatz: function(el){
        var i = +el.getAttribute("data-i"); if(!rs.plaetze[i]) return;
        var sache = rs.nimm(i);
        return anbieter.lege(sache).then(function(r){
          var zurueck = r.plaetze === null ? sache : r.rest ? (sache.gegenstand ? sache : { block: sache.block, anzahl: r.rest }) : null;
          if(zurueck){ ablegen(zurueck); if(r.plaetze !== null) ui.hinweis(T.truheVoll); }
          antwort(r);
        });
      },
      fertig: function(){ ui.schliesse(); o.beiFertig ? o.beiFertig() : ui.o.beiWeiter && ui.o.beiWeiter(); }
    };
    zeichne();
    anbieter.hole().then(antwort);
  };
})();
