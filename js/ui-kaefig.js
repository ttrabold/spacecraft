// Käfig (Haustier-Inventar) als Seitenpanel: 18 Plätze, Aktionsmenü am Tier (Rauslassen/Zurückholen, Umbenennen, Freilassen mit Rückfrage).
// Wie der Rucksack: ein Cursor (der Fokus), das Menü steht als eigene Zeile unter der Reihe. Spec: docs/superpowers/specs/2026-11-04-haustiere-design.md
(function(){
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var RAND = ["#5a6070", "#4a86e8", "#a479e2"];   // Seltenheit 0–2

  // o: beiRaus(id) → "ok"|"voll"|"ko"|"fehlt", beiRein(id), beiUmbenennen(id, name), beiFreilassen(id), beiFertig()
  SC.UI.prototype.zeigeKaefig = function(kaefig, o){
    var ui = this, menue = null, cursor = null;   // menue: { i, modus: "menue" | "name" | "frei" }
    o = o || {};
    function zeit(s){ s = Math.ceil(s); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
    function infoText(t){
      if(!t) return SC.T.kfLeer;
      var d = SC.TIERE[t.art], w = SC.Tier.werte(t), z = t.koRest > 0 ? SC.T.kfInfoKo + " " + zeit(t.koRest) : t.draussen ? SC.T.kfInfoDraussen : SC.T.kfInfoDrin;
      return t.name + " · " + d.name + " · " + SC.T.stufe + " " + t.stufe + " · " + SC.T.werteName.lp + " " + Math.ceil(t.lp) + "/" + w.lpMax + " · " + z + (t.staerke ? " · ⬆ " + zeit(t.staerke.rest) : "");
    }
    function knoepfe(t, m){
      if(m.modus === "name") return ["nameOk", "abbrechen"];
      if(m.modus === "frei") return ["freiNein", "freiJa"];
      var k = []; if(t.koRest <= 0) k.push(t.draussen ? "rein" : "raus");
      return k.concat(["umbenennen", "freilassen", "abbrechen"]);
    }
    var TEXT = { raus: "kfRaus", rein: "kfRein", umbenennen: "kfName", freilassen: "kfFrei", abbrechen: "abbrechen", nameOk: "kfNameOk", freiNein: "kfFreiNein", freiJa: "kfFreiJa" };
    function menueHtml(m){
      var t = kaefig.plaetze[m.i], d = SC.TIERE[t.art], kopf = "<h3>" + d.emoji + " " + esc(t.name) + "</h3>";
      if(m.modus === "name") kopf += '<input class="kf-name" type="text" maxlength="16" value="' + esc(t.name) + '" autocomplete="off">';
      else if(m.modus === "frei") kopf += "<div>" + esc(SC.T.kfFreiFrage.replace("{name}", t.name)) + "</div>";
      else kopf += "<div>" + esc(infoText(t)) + "</div>";
      return '<div class="rs-menue exklusiv panel" data-zone="menue">' + kopf + '<div class="reihe">' + knoepfe(t, m).map(function(k, n){
        return '<button' + (n === 0 ? ' class="haupt"' : k === "freiJa" || k === "freilassen" ? ' class="gefahr"' : "") + ' data-aktion="' + k + '">' + esc(SC.T[TEXT[k]]) + "</button>";
      }).join("") + "</div></div>";
    }
    function platzHtml(t, i){
      var inhalt = "", stil = "", kl = "rs-platz";
      if(t){
        var d = SC.TIERE[t.art]; stil = ' style="border-color:' + RAND[d.seltenheit] + '"';
        inhalt = '<span class="kf-emoji">' + (t.koRest > 0 ? "💤" : d.emoji) + '</span><b class="anzahl">' + t.stufe + "</b>";
        if(t.draussen) kl += " draussen"; if(t.koRest > 0) kl += " ko";
      }
      var h = '<button class="' + kl + '" data-aktion="platz" data-i="' + i + '"' + (t ? ' title="' + esc(t.name) + '"' : "") + stil + ">" + inhalt + "</button>";
      if(menue && i === Math.floor(menue.i / 9) * 9 + 8) h += menueHtml(menue);
      return h;
    }
    function zeichne(){
      ui._zeige("<h2>" + esc(SC.T.kfTitel) + "</h2>" +
        '<div class="rs"><div class="rs-links"><div class="rs-info"></div></div><div class="rs-raster kf-raster" data-zone="raster">' + kaefig.plaetze.map(platzHtml).join("") + "</div></div>" +
        '<div class="reihe" data-zone="aktionen"><button class="haupt" data-aktion="fertig">' + esc(SC.T.fertig) + "</button></div>", aktionen, { seite: true, startZone: "raster" });
      var f = menue ? (menue.modus === "name" ? ui.ebene.querySelector(".kf-name") : ui.ebene.querySelector(".rs-menue button")) : cursor && ui.ebene.querySelector('.rs-platz[data-i="' + cursor.i + '"]');
      if(f){ f.focus(); if(f.select && menue && menue.modus === "name") f.select(); }
      var info = ui.ebene.querySelector(".rs-info"); if(info) info.textContent = menue ? "" : cursor ? infoText(kaefig.plaetze[cursor.i]) : kaefig.plaetze.some(Boolean) ? "" : SC.T.kfLeer;
    }
    function tierMenue(){ return menue && kaefig.plaetze[menue.i]; }
    function zu(){ menue = null; zeichne(); }
    // Tipp auf einen Platz: Cursor dorthin; gleicher Platz bei offenem Menü = erste Aktion; belegt = Menü; leer = Menü zu
    function tippe(el){
      el.focus(); var i = +el.getAttribute("data-i"); cursor = { i: i };
      if(menue && menue.i === i && menue.modus === "menue"){ var erste = ui.ebene.querySelector(".rs-menue button"); if(erste) erste.click(); return; }
      menue = kaefig.plaetze[i] ? { i: i, modus: "menue" } : null; zeichne();
    }
    var aktionen = {
      platz: function(el){ tippe(el); },
      raus: function(){
        var t = tierMenue(), r = o.beiRaus ? o.beiRaus(t.id) : "fehlt";
        if(r === "voll") ui.hinweis(SC.T.kfDraussenVoll, 2500); else if(r === "ko") ui.hinweis(SC.T.kfKo.replace("{name}", t.name), 2500);
        zu();
      },
      rein: function(){ var t = tierMenue(); if(o.beiRein) o.beiRein(t.id); zu(); },
      umbenennen: function(){ menue.modus = "name"; zeichne(); },
      nameOk: function(){ var t = tierMenue(), inp = ui.ebene.querySelector(".kf-name"); if(o.beiUmbenennen) o.beiUmbenennen(t.id, inp ? inp.value : t.name); zu(); },
      freilassen: function(){ menue.modus = "frei"; zeichne(); },
      freiNein: function(){ menue.modus = "menue"; zeichne(); },
      freiJa: function(){ var t = tierMenue(); if(o.beiFreilassen) o.beiFreilassen(t.id); zu(); },
      abbrechen: function(){ zu(); },
      fertig: function(){ ui.schliesse(); if(o.beiFertig) o.beiFertig(); }
    };
    function aktiv(){ return ui._aktionen === aktionen && !ui.ebene.hidden; }
    // Der Fokus zieht die Info-Zeile nach (Controller); B schließt zuerst Rückfrage und Menü
    ui._beiFokus = function(el){ var info = ui.ebene.querySelector(".rs-info"); if(!info || (el.closest && el.closest(".rs-menue")) || el.getAttribute("data-i") === null) return; info.textContent = infoText(kaefig.plaetze[+el.getAttribute("data-i")]); };
    ui._beiZurueck = function(){
      if(!aktiv() || !menue) return false;
      if(menue.modus !== "menue") menue.modus = "menue"; else menue = null;
      zeichne(); return true;
    };
    ui._beiKlickLeer = function(ziel){ if(!aktiv() || !menue || (ziel.closest && ziel.closest(".rs-menue"))) return; menue = null; zeichne(); };
    zeichne();
  };
})();
