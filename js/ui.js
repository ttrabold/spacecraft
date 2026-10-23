// Oberfläche: Weltliste, Neue Welt, Pause, Einstellungen, Blockauswahl, HUD und Hinweise
SC.Einstellungen = {
  standard: function(){ return { sichtweite: matchMedia("(pointer: coarse)").matches ? 6 : 10, empfindlichkeit: 1, touchGroesse: 1, fpsAnzeigen: false, entwickler: false, musik: 0.5, geraeusche: 0.8 }; },
  lade: function(ns){ var e = SC.Einstellungen.standard(); try { var t = localStorage.getItem("sc-" + ns + ":einstellungen"); if(t) Object.assign(e, JSON.parse(t)); } catch(err){} return e; },
  speichere: function(ns, e){ try { localStorage.setItem("sc-" + ns + ":einstellungen", JSON.stringify(e)); } catch(err){} }
};

SC.UI = function(wurzel, o){
  var ui = this;
  this.wurzel = wurzel; this.o = o; this.slots = o.slots;
  wurzel.innerHTML = '<div class="hud" hidden></div><div class="ebene" hidden></div><div class="hinweise"></div>';
  this.hudEl = wurzel.querySelector(".hud"); this.ebene = wurzel.querySelector(".ebene"); this.hinweisEl = wurzel.querySelector(".hinweise");
  this._aktionen = {};
  this._klickH = function(ev){ var el = ev.target.closest && ev.target.closest("[data-aktion]"); if(el && wurzel.contains(el)) ui._klick(el); };
  wurzel.addEventListener("click", this._klickH);
};

(function(){
  var T = function(){ return SC.T; };
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function datum(ms){ if(!ms) return SC.T.nie; var d = new Date(ms); return d.toLocaleDateString("de-DE") + " " + d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }); }
  var MODI = { kreativ: function(){ return SC.T.kreativ; }, zuschauer: function(){ return SC.T.zuschauer; }, survival: function(){ return SC.T.survival; } };

  // Kachelbild eines Blocks aus dem Atlas (gecacht)
  var bilder = {}, atlas = null;
  SC.UI.blockBild = function(id){
    if(bilder[id]) return bilder[id];
    var b = SC.BLOECKE[id]; if(!b || !b.seiten) return "";
    atlas = atlas || SC.Texturen.atlas(SC.PALETTEN.start);
    var i = SC.Mesher.atlasNamen.indexOf(b.seiten.seite), cv = document.createElement("canvas"); cv.width = cv.height = 16;
    cv.getContext("2d").drawImage(atlas, (i % 16) * 16, Math.floor(i / 16) * 16, 16, 16, 0, 0, 16, 16);
    return (bilder[id] = cv.toDataURL());
  };

  SC.UI.exportErinnerung = function(meta, jetzt){
    var tag = 864e5;
    if(!meta.zuletztExport) return jetzt - (meta.erstellt || jetzt) > 3 * tag;
    return jetzt - meta.zuletztExport > 7 * tag;
  };
  SC.UI.istIOS = function(){ return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); };
  SC.UI.istEigenstaendig = function(){ return (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || (matchMedia && matchMedia("(display-mode: fullscreen)").matches) || navigator.standalone === true; };

  SC.UI.prototype._klick = function(el){
    var a = el.getAttribute("data-aktion"), f = this._aktionen[a] || (this._hudAktionen || {})[a];
    return Promise.resolve(f ? f.call(this, el, el.getAttribute("data-id")) : null);
  };
  SC.UI.prototype._zeige = function(html, aktionen){
    this.ebene.innerHTML = '<div class="fenster">' + html + "</div>"; this.ebene.hidden = false; this._aktionen = aktionen || {};
  };
  // Bedienung mit Gamepad: Fokus über die Knöpfe und Eingaben des offenen Fensters bewegen
  SC.UI.prototype._fokusListe = function(){
    var r = this.ebene.hidden ? this.wurzel.querySelector(".entwickler:not([hidden])") : this.ebene;
    if(!r) return [];
    return Array.prototype.filter.call(r.querySelectorAll("button, input:not([type=file]), label.knopf"), function(el){ return !el.disabled && (el.offsetParent !== null || el.getClientRects().length > 0); });
  };
  SC.UI.prototype.navigiere = function(schritt){
    var l = this._fokusListe(); if(!l.length) return;
    var a = document.activeElement;
    // Regler mit links/rechts verstellen, solange sie den Fokus haben
    if(a && a.type === "range" && l.indexOf(a) >= 0 && this._reglerModus){ a.value = +a.value + schritt * (+a.step || 1); a.dispatchEvent(new Event("input", { bubbles: true })); return; }
    var i = l.indexOf(a), n = i < 0 ? (schritt > 0 ? 0 : l.length - 1) : SC.mod(i + schritt, l.length);
    l[n].focus(); this._reglerModus = false;
  };
  SC.UI.prototype.bestaetige = function(){
    var a = document.activeElement, l = this._fokusListe();
    if(!a || l.indexOf(a) < 0){ if(l.length) l[0].focus(); return; }
    if(a.type === "range"){ this._reglerModus = !this._reglerModus; a.classList.toggle("regeln", this._reglerModus); return; }
    if(a.type === "checkbox"){ a.click(); return; }
    if(a.tagName === "LABEL"){ var inp = a.querySelector("input"); if(inp) inp.click(); return; }
    if(a.tagName === "INPUT") return;
    a.click();
  };
  SC.UI.prototype.zurueck = function(){
    var r = this.ebene.hidden ? this.wurzel.querySelector(".entwickler:not([hidden])") : this.ebene;
    if(!r) return;
    var k = r.querySelector('[data-aktion="weiter"], [data-aktion="fertig"], [data-aktion="zurueck"], [data-ew="zu"]');
    if(k) k.click();
  };

  SC.UI.prototype.schliesse = function(){ this.ebene.hidden = true; this.ebene.innerHTML = ""; this._aktionen = {}; };
  SC.UI.prototype.offen = function(){ return !this.ebene.hidden; };

  SC.UI.prototype.hinweis = function(text, dauer){
    var d = document.createElement("div"); d.className = "hinweis"; d.textContent = text; this.hinweisEl.appendChild(d);
    setTimeout(function(){ d.remove(); }, dauer || 3500);
  };

  // --- Weltliste ---
  SC.UI.prototype.zeigeWeltliste = function(){
    var ui = this; this.hudEl.hidden = true;
    return this.slots.liste().then(function(liste){
      var jetzt = Date.now(), zeilen = liste.map(function(m){
        var erinnern = !m.zuNeu && SC.UI.exportErinnerung(m, jetzt);
        return '<div class="welt' + (m.zuNeu ? " gesperrt" : "") + '">' +
          '<div class="welt-text"><div class="welt-name">' + esc(m.name) + '</div>' +
          '<div class="welt-info">' + (m.zuNeu ? esc(SC.T.brauchtNeuereVersion) : esc(SC.T.seed) + ": " + esc(m.seed) + " · " + esc((MODI[m.modus] || MODI.kreativ)()) +
          " · " + esc(SC.T.zuletztGespielt) + ": " + esc(datum(m.zuletzt)) + " · " + esc(SC.T.zuletztExportiert) + ": " + esc(datum(m.zuletztExport))) + "</div>" +
          (erinnern ? '<div class="welt-erinnerung">' + esc(SC.T.exportErinnerung) + "</div>" : "") + "</div>" +
          '<div class="welt-knoepfe">' +
          '<button class="haupt" data-aktion="spielen" data-id="' + esc(m.id) + '"' + (m.zuNeu ? " disabled" : "") + ">" + esc(SC.T.spielen) + "</button>" +
          (m.zuNeu ? "" : '<button data-aktion="umbenennen" data-id="' + esc(m.id) + '">' + esc(SC.T.umbenennen) + "</button>" +
            '<button data-aktion="kopieren" data-id="' + esc(m.id) + '">' + esc(SC.T.kopieren) + "</button>" +
            '<button data-aktion="exportieren" data-id="' + esc(m.id) + '">' + esc(SC.T.exportieren) + "</button>") +
          '<button class="gefahr" data-aktion="loeschen" data-id="' + esc(m.id) + '">' + esc(SC.T.loeschen) + "</button>" +
          "</div></div>";
      }).join("");
      ui._zeige(
        '<h1 class="titel">Spacecraft</h1>' +
        '<div class="welten">' + (zeilen || '<p class="leer">' + esc(SC.T.nochKeineWelt) + "</p>") + "</div>" +
        '<div class="reihe"><button class="haupt" data-aktion="neu">' + esc(SC.T.neueWelt) + '</button>' +
        '<label class="knopf" tabindex="0">' + esc(SC.T.importieren) + '<input type="file" accept=".spacecraft,application/json,application/octet-stream" hidden></label></div>' +
        '<div class="version">Version ' + esc(window.V || "") + "</div>",
        {
          spielen: function(el, id){ return ui.slots.lade(id).then(function(d){ ui.schliesse(); ui.o.beiStart(d); }, function(f){ ui.hinweis(f.message || String(f)); }); },
          neu: function(){ ui.zeigeNeueWelt(); },
          kopieren: function(el, id){ return ui.slots.kopiere(id).then(function(){ return ui.zeigeWeltliste(); }); },
          exportieren: function(el, id){ return Promise.resolve(ui.o.beiExport(id)).then(function(){ return ui.zeigeWeltliste(); }); },
          umbenennen: function(el, id){
            var name = el.closest(".welt").querySelector(".welt-name"), alt = name.textContent;
            name.innerHTML = '<input class="eingabe" maxlength="40" value="' + esc(alt) + '"> <button data-aktion="umbenennenOk" data-id="' + esc(id) + '">' + esc(SC.T.ok) + "</button>";
            name.querySelector("input").focus();
          },
          umbenennenOk: function(el, id){ var v = el.parentNode.querySelector("input").value.trim(); return (v ? ui.slots.benenneUm(id, v) : Promise.resolve()).then(function(){ return ui.zeigeWeltliste(); }); },
          loeschen: function(el, id){
            if(el.getAttribute("data-sicher") !== "1"){ el.setAttribute("data-sicher", "1"); el.textContent = SC.T.wirklichLoeschen; el.classList.add("sicher"); return; }
            return ui.slots.loesche(id).then(function(){ return ui.zeigeWeltliste(); });
          }
        });
      var inp = ui.ebene.querySelector('input[type="file"]');
      inp.addEventListener("change", function(){
        var f = inp.files && inp.files[0]; if(!f) return;
        SC.Spielstand.importiere(f).then(function(d){ return ui.slots.speichere(d).then(function(){ ui.hinweis(SC.T.importiert + ": " + d.name); return ui.zeigeWeltliste(); }); },
          function(e){ ui.hinweis(e.message || SC.T.importKaputt, 6000); });
      });
    });
  };

  // --- Neue Welt ---
  SC.UI.prototype.zeigeNeueWelt = function(){
    var ui = this, modus = "kreativ";
    this._zeige(
      "<h2>" + esc(SC.T.neueWelt) + "</h2>" +
      '<label class="feld">' + esc(SC.T.name) + '<input class="eingabe" id="nw-name" maxlength="40" value="' + esc(SC.T.meineWelt) + '"></label>' +
      '<label class="feld">' + esc(SC.T.seed) + '<input class="eingabe" id="nw-seed" maxlength="40" placeholder="' + esc(SC.T.seedLeer) + '"></label>' +
      '<div class="feld">' + esc(SC.T.modus) + '<div class="reihe modi">' +
      '<button class="modus an" data-aktion="modus" data-modus="kreativ">' + esc(SC.T.kreativ) + "</button>" +
      '<button class="modus" data-aktion="modus" data-modus="zuschauer">' + esc(SC.T.zuschauer) + "</button>" +
      '<button class="modus" data-modus="survival" disabled>' + esc(SC.T.survival) + ' <small>' + esc(SC.T.kommtBald) + "</small></button></div></div>" +
      '<div class="reihe"><button data-aktion="zurueck">' + esc(SC.T.zurueck) + '</button><button class="haupt" data-aktion="los">' + esc(SC.T.welterzeugen) + "</button></div>",
      {
        modus: function(el){ modus = el.getAttribute("data-modus"); Array.prototype.forEach.call(ui.ebene.querySelectorAll(".modus"), function(b){ b.classList.toggle("an", b === el); }); },
        zurueck: function(){ return ui.zeigeWeltliste(); },
        los: function(){
          var d = SC.Spielstand.neu({ name: ui.ebene.querySelector("#nw-name").value.trim() || SC.T.meineWelt, seedText: ui.ebene.querySelector("#nw-seed").value, modus: modus });
          return ui.slots.speichere(d).then(function(){ ui.schliesse(); ui.o.beiStart(d); }, function(f){ ui.hinweis(SC.T.speichernFehlgeschlagen); });
        }
      });
  };

  // --- Pause ---
  SC.UI.prototype.zeigePause = function(daten){
    var ui = this, o = this.o;
    this._zeige(
      "<h2>" + esc(daten.name) + "</h2>" +
      '<div class="spalte">' +
      '<button class="haupt" data-aktion="weiter">' + esc(SC.T.weiterspielen) + "</button>" +
      '<div class="reihe modi"><span>' + esc(SC.T.modus) + ":</span>" +
      '<button class="modus' + (daten.modus === "kreativ" ? " an" : "") + '" data-aktion="modus" data-modus="kreativ">' + esc(SC.T.kreativ) + "</button>" +
      '<button class="modus' + (daten.modus === "zuschauer" ? " an" : "") + '" data-aktion="modus" data-modus="zuschauer">' + esc(SC.T.zuschauer) + "</button>" +
      '<button class="modus" data-modus="survival" disabled>' + esc(SC.T.survival) + " <small>" + esc(SC.T.kommtBald) + "</small></button></div>" +
      '<button data-aktion="einstellungen">' + esc(SC.T.einstellungen) + "</button>" +
      ((o.einstellungen || {}).entwickler ? '<button data-aktion="entwickler">' + esc(SC.T.entwickler) + "</button>" : "") +
      '<button data-aktion="export">' + esc(SC.T.weltExportieren) + "</button>" +
      '<button data-aktion="verlassen">' + esc(SC.T.zurWeltliste) + "</button></div>",
      {
        weiter: function(){ ui.schliesse(); o.beiWeiter && o.beiWeiter(); },
        modus: function(el){ var m = el.getAttribute("data-modus"); o.beiModus && o.beiModus(m); daten.modus = m; ui.zeigePause(daten); },
        einstellungen: function(){ ui.zeigeEinstellungen(function(){ ui.zeigePause(daten); }); },
        entwickler: function(){ ui.schliesse(); o.beiEntwickler && o.beiEntwickler(); },
        export: function(){ return Promise.resolve(o.beiExport(daten.id)); },
        verlassen: function(){ return Promise.resolve(o.beiVerlassen && o.beiVerlassen()); }
      });
  };

  // --- Einstellungen ---
  SC.UI.prototype.zeigeEinstellungen = function(zurueck){
    var ui = this, e = this.o.einstellungen || SC.Einstellungen.standard();
    function regler(id, text, min, max, schritt, wert){ return '<label class="feld">' + esc(text) + ' <b id="' + id + '-w">' + wert + '</b><input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + schritt + '" value="' + wert + '"></label>'; }
    this._zeige(
      "<h2>" + esc(SC.T.einstellungen) + "</h2>" +
      regler("e-sicht", SC.T.sichtweite, 3, 16, 1, e.sichtweite) +
      regler("e-maus", SC.T.empfindlichkeit, 0.3, 3, 0.1, e.empfindlichkeit) +
      regler("e-touch", SC.T.touchGroesse, 0.7, 1.6, 0.1, e.touchGroesse) +
      regler("e-musik", SC.T.musik, 0, 1, 0.05, e.musik) +
      regler("e-geraeusche", SC.T.geraeusche, 0, 1, 0.05, e.geraeusche) +
      '<label class="feld zeile"><input type="checkbox" id="e-fps"' + (e.fpsAnzeigen ? " checked" : "") + "> " + esc(SC.T.fpsAnzeigen) + "</label>" +
      '<label class="feld zeile"><input type="checkbox" id="e-entw"' + (e.entwickler ? " checked" : "") + "> " + esc(SC.T.entwicklerAn) + "</label>" +
      '<div class="reihe"><button class="haupt" data-aktion="fertig">' + esc(SC.T.fertig) + "</button></div>",
      { fertig: function(){ zurueck(); } });
    var ui2 = this;
    function an(id, feld, zahl){
      var el = ui2.ebene.querySelector("#" + id);
      el.addEventListener("input", function(){
        e[feld] = zahl ? +el.value : el.checked;
        var w = ui2.ebene.querySelector("#" + id + "-w"); if(w) w.textContent = el.value;
        ui.o.beiEinstellungen && ui.o.beiEinstellungen(e);
      });
    }
    an("e-sicht", "sichtweite", true); an("e-maus", "empfindlichkeit", true); an("e-touch", "touchGroesse", true); an("e-musik", "musik", true); an("e-geraeusche", "geraeusche", true); an("e-fps", "fpsAnzeigen", false); an("e-entw", "entwickler", false);
  };

  // --- Blockauswahl ---
  SC.UI.prototype.zeigeBlockauswahl = function(beiWahl){
    var ui = this, kacheln = Object.keys(SC.BLOECKE).map(Number).filter(function(id){ return SC.BLOECKE[id].inAuswahl; }).map(function(id){
      return '<button class="block" data-aktion="block" data-block="' + id + '" title="' + esc(SC.BLOECKE[id].name) + '"><img src="' + SC.UI.blockBild(id) + '" alt=""><span>' + esc(SC.BLOECKE[id].name) + "</span></button>";
    }).join("");
    this._zeige("<h2>" + esc(SC.T.bloeckeTitel) + '</h2><div class="raster">' + kacheln + '</div><div class="reihe"><button class="haupt" data-aktion="fertig">' + esc(SC.T.fertig) + "</button></div>",
      { block: function(el){ beiWahl(+el.getAttribute("data-block")); }, fertig: function(){ ui.schliesse(); ui.o.beiWeiter && ui.o.beiWeiter(); } });
  };

  // --- HUD ---
  SC.UI.prototype.hud = function(spieler, extra){
    var h = this.hudEl, zus = spieler.modus === "zuschauer";
    h.hidden = false;
    if(!this._hudGebaut){
      h.innerHTML = '<div class="fadenkreuz"></div><div class="modus-anzeige"></div><div class="fps"></div><div class="leiste"></div>';
      this._hudGebaut = true; this._leisteSchl = "";
    }
    var schl = spieler.schnellleiste.join(",") + "|" + spieler.auswahl + "|" + zus;
    if(schl !== this._leisteSchl){
      this._leisteSchl = schl;
      var l = h.querySelector(".leiste"); l.hidden = zus;
      l.innerHTML = spieler.schnellleiste.map(function(id, i){ return '<button class="leiste-platz' + (i === spieler.auswahl ? " gewaehlt" : "") + '" data-aktion="leiste" data-id="' + i + '"><img src="' + SC.UI.blockBild(id) + '" alt=""><span>' + (i + 1) + "</span></button>"; }).join("");
      h.querySelector(".modus-anzeige").textContent = (MODI[spieler.modus] || MODI.kreativ)() + (spieler.fliegt && !zus ? " · " + SC.T.fliegt : "");
      var ui = this; this._hudAktionen = { leiste: function(el, i){ spieler.auswahl = +i; ui._leisteSchl = ""; } };
    }
    var f = h.querySelector(".fps"); f.hidden = !(extra && extra.fpsAnzeigen); if(!f.hidden) f.textContent = (extra.fps || 0) + " FPS";
  };
  SC.UI.prototype.verbergeHud = function(){ this.hudEl.hidden = true; };

  // Hinweise beim Start: iPad/iPhone zum Home-Bildschirm, kein dauerhafter Speicher
  SC.UI.prototype.startHinweise = function(backendArt, ns){
    if(backendArt === "speicher") this.hinweis(SC.T.keinSpeicher, 10000);
    var k = "sc-" + ns + ":homeHinweis";
    try {
      if(SC.UI.istIOS() && !SC.UI.istEigenstaendig() && !localStorage.getItem(k)){ this.hinweis(SC.T.homeBildschirm, 12000); localStorage.setItem(k, "1"); }
    } catch(e){}
  };
})();
