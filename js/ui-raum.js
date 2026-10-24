// Oberfläche für gemeinsames Spielen: Beitreten (Code, Figur), Freunde einladen, Beitrittsanfrage, Figurname
(function(){
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fuelle(t, w){ return t.replace(/\{(\w+)\}/g, function(x, k){ return w[k] == null ? "" : w[k]; }); }
  var FEHLER = { nein: "raumNein", voll: "raumVoll", version: "raumVersion", "kein-raum": "raumKeinRaum", vermittlung: "raumVermittlung", "keine-direkte": "raumKeineDirekte", ende: "raumEnde" };
  SC.UI.raumFehlerText = function(f){ var k = f && FEHLER[f.art]; return k ? SC.T[k] : SC.T.raumFehler; };

  // Neu zeichnen und den Gamepad-Fokus auf demselben Knopf halten (ist er gesperrt: Hauptknopf)
  function behalteFokus(ui, fn){
    var a = document.activeElement, sel = null;
    if(a && ui.ebene.contains(a) && a.getAttribute("data-aktion")) sel = '[data-aktion="' + a.getAttribute("data-aktion") + '"]' + (a.hasAttribute("data-id") ? '[data-id="' + a.getAttribute("data-id") + '"]' : "");
    var r = fn();
    if(sel){ var n = ui.ebene.querySelector(sel); if(!n || n.disabled) n = ui.ebene.querySelector("button.haupt:not(:disabled)"); if(n) n.focus(); }
    return r;
  }
  function kopf(code){ return "<h2>" + esc(SC.T.mitspielen) + "</h2>" + (code ? '<div class="raumcode">' + esc(code) + "</div>" : ""); }

  // --- Beitreten: 1. Wort, 2. Zahl, 3. Figur ---
  // st: { wort, zahl ("" bis zwei Ziffern), zahlFertig, weltId (null = neue Figur), figuren (geladen) }
  SC.UI.prototype.zeigeBeitreten = function(st){
    var ui = this; st = st || { wort: null, zahl: "" };
    this.hudEl.hidden = true;
    if(st.wort && st.zahlFertig) return this._figurWahl(st);
    if(!st.wort){
      this._zeige(kopf("") + '<p class="raum-schritt">' + esc(SC.T.codeWort) + "</p>" +
        '<div class="woerter">' + SC.Netz.WOERTER.map(function(w){ return '<button class="wort" data-aktion="wort" data-id="' + w + '">' + w + "</button>"; }).join("") + "</div>" +
        '<div class="reihe"><button data-aktion="zurueck">' + esc(SC.T.zurueck) + "</button></div>",
        {
          wort: function(el, id){ var fokus = el === document.activeElement; st.wort = id; st.zahl = ""; ui.zeigeBeitreten(st); if(fokus) ui.ebene.querySelector('[data-aktion="ziffer"][data-id="1"]').focus(); },
          zurueck: function(){ return ui.zeigeWeltliste(); }
        });
      return;
    }
    var voll = st.zahl.length >= 2;
    function ziffer(n){ return '<button class="ziffer" data-aktion="ziffer" data-id="' + n + '"' + (voll || (n === 0 && !st.zahl) ? " disabled" : "") + ">" + n + "</button>"; }
    this._zeige(kopf(st.wort + " " + (st.zahl + "__").slice(0, 2)) + '<p class="raum-schritt">' + esc(SC.T.codeZahl) + "</p>" +
      '<div class="ziffern">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map(ziffer).join("") +
      '<button class="ziffer" data-aktion="zifferWeg"' + (st.zahl ? "" : " disabled") + ">" + esc(SC.T.zifferWeg) + "</button>" + ziffer(0) + "</div>" +
      '<div class="reihe"><button data-aktion="zurueck">' + esc(SC.T.zurueck) + '</button><button class="haupt" data-aktion="codeOk"' + (voll ? "" : " disabled") + ">" + esc(SC.T.weiter) + "</button></div>",
      {
        ziffer: function(el, id){ if(st.zahl.length < 2) st.zahl += id; behalteFokus(ui, function(){ ui.zeigeBeitreten(st); }); },
        zifferWeg: function(){ st.zahl = st.zahl.slice(0, -1); behalteFokus(ui, function(){ ui.zeigeBeitreten(st); }); },
        codeOk: function(){ if(st.zahl.length === 2){ st.zahlFertig = true; return ui.zeigeBeitreten(st); } },
        zurueck: function(){ st.wort = null; st.zahl = ""; ui.zeigeBeitreten(st); }
      });
  };

  // Eigene, nicht gesperrte Welten als Figuren (Name, Stufe), dazu „Neue Figur“
  SC.UI.prototype._figurWahl = function(st){
    var ui = this, code = st.wort + " " + st.zahl;
    var laden = st.figuren ? Promise.resolve(st.figuren) : this.slots.liste().then(function(l){
      return Promise.all(l.filter(function(m){ return !m.zuNeu && m.id !== "gast"; }).map(function(m){
        return ui.slots.lade(m.id).then(function(d){ return { id: d.id, welt: d.name, figur: d.spieler.name, stufe: d.spieler.stufe || 1 }; }, function(){ return null; });
      }));
    }).then(function(l){ return l.filter(Boolean); });
    return laden.then(function(fig){
      st.figuren = fig;
      var ids = fig.map(function(f){ return f.id; });
      // Nach einem abgelehnten Beitritt mit neuer Figur gibt es deren Welt schon: die nehmen
      if(st.alteIds){ var neu = ids.filter(function(id){ return st.alteIds.indexOf(id) < 0; })[0]; if(neu && st.weltId === null) st.weltId = neu; st.alteIds = null; }
      if(st.weltId === undefined || (st.weltId !== null && ids.indexOf(st.weltId) < 0)) st.weltId = fig.length ? fig[0].id : null;
      function knopf(id, t){ return '<button class="modus figur' + (st.weltId === id ? " an" : "") + '" data-aktion="figur" data-id="' + esc(id || "") + '">' + esc(t) + "</button>"; }
      ui._zeige(kopf(code) + '<p class="raum-schritt">' + esc(SC.T.figurWaehlen) + "</p>" +
        '<div class="spalte figuren">' + fig.map(function(f){ return knopf(f.id, fuelle(SC.T.figurZeile, { figur: f.figur || f.welt, stufe: f.stufe, welt: f.welt })); }).join("") + knopf(null, SC.T.neueFigur) + "</div>" +
        '<div class="reihe"><button data-aktion="zurueck">' + esc(SC.T.zurueck) + '</button><button class="haupt" data-aktion="beitreten">' + esc(SC.T.beitreten) + "</button></div>",
        {
          figur: function(el, id){ st.weltId = id || null; Array.prototype.forEach.call(ui.ebene.querySelectorAll(".figur"), function(b){ b.classList.toggle("an", b === el); }); },
          zurueck: function(){ st.zahlFertig = false; ui.zeigeBeitreten(st); },
          beitreten: function(){
            var f = null; fig.forEach(function(x){ if(x.id === st.weltId) f = x; });
            // Nicht auf den Eintritt warten: der Klick ist erledigt, sobald der Warte-Bildschirm steht
            if(f && f.figur){ ui._verbinde(st, ""); return; }
            ui.zeigeFigurname(function(n){ ui._verbinde(st, n); }, function(){ return ui._figurWahl(st); });
          }
        });
    });
  };

  // Verbinden: Warten mit Abbrechen; Erfolg → das Spiel läuft schon; Fehler → Text und zurück zur Figurwahl
  SC.UI.prototype._verbinde = function(st, name){
    var ui = this, code = SC.Netz.code(st.wort, +st.zahl), nr = this._beitrittNr = (this._beitrittNr || 0) + 1;
    function aktuell(){ return ui._beitrittNr === nr; }
    this._zeige(kopf(code.text) + '<p class="raum-status">' + esc(SC.T.raumVerbinde) + "</p>" +
      '<div class="reihe"><button data-aktion="zurueck">' + esc(SC.T.abbrechen) + "</button></div>",
      { zurueck: function(){ ui._beitrittNr++; ui.o.beiBeitretenAbbrechen && ui.o.beiBeitretenAbbrechen(); return ui._figurWahl(st); } });
    return Promise.resolve().then(function(){ return ui.o.beiBeitreten(code, st.weltId, name); }).then(function(){
      ui._beitrittNr++; ui.schliesse(); // Spiel läuft (auch wenn vorher abgebrochen wurde, aber der Eintritt schon klappte)
    }, function(f){
      if(st.weltId === null) st.alteIds = (st.figuren || []).map(function(x){ return x.id; });
      st.figuren = null; // eine neue Figur hat jetzt schon ihre Welt
      if(!aktuell()) return;
      ui._beitrittNr++;
      if(f && f.art === "abbruch") return ui._figurWahl(st);
      ui._zeige(kopf(code.text) + '<p class="raum-status fehler">' + esc(SC.UI.raumFehlerText(f)) + "</p>" +
        '<div class="reihe"><button class="haupt" data-aktion="zurueck">' + esc(SC.T.zurueck) + "</button></div>",
        { zurueck: function(){ return ui._figurWahl(st); } });
    });
  };

  // Status des Gasts während des Wartens (raumRueckrufe.status)
  SC.UI.prototype.raumStatus = function(st){
    var el = this.ebene.querySelector(".raum-status:not(.fehler)");
    if(el && st === "warte") el.textContent = SC.T.raumWarte;
  };

  // --- Figurname (Pflicht, 1–16 Zeichen) ---
  SC.UI.prototype.zeigeFigurname = function(fertig, abbrechen){
    var ui = this;
    this._zeige("<h2>" + esc(SC.T.wieHeisstFigur) + "</h2>" +
      '<label class="feld"><input class="eingabe" id="fn-name" maxlength="16" placeholder="' + esc(SC.T.figurNameLeer) + '"></label>' +
      '<p class="raum-status fehler"></p>' +
      '<div class="reihe">' + (abbrechen ? '<button data-aktion="zurueck">' + esc(SC.T.zurueck) + "</button>" : "") + '<button class="haupt" data-aktion="nameOk">' + esc(SC.T.ok) + "</button></div>",
      {
        zurueck: function(){ return abbrechen && abbrechen(); },
        nameOk: function(){
          var inp = ui.ebene.querySelector("#fn-name"), v = inp.value.trim().slice(0, 16);
          if(!v){ ui.ebene.querySelector(".fehler").textContent = SC.T.figurNamePflicht; inp.focus(); return; }
          return fertig(v);
        }
      });
    var inp = this.ebene.querySelector("#fn-name");
    inp.addEventListener("keydown", function(ev){ if(ev.key === "Enter") ui._klick(ui.ebene.querySelector('[data-aktion="nameOk"]')); });
  };

  // --- Einladen (Gastgeber, aus der Pause) ---
  SC.UI.prototype._einladen = function(daten){
    var ui = this;
    function oeffne(name){
      ui._zeige("<h2>" + esc(SC.T.einladen) + '</h2><p class="raum-status raum-oeffnet">' + esc(SC.T.raumOeffnet) + "</p>" +
        '<div class="reihe"><button data-aktion="zurueck">' + esc(SC.T.zurueck) + "</button></div>",
        { zurueck: function(){ ui.zeigePause(daten); } });
      function noch(){ return !!ui.ebene.querySelector(".raum-oeffnet"); }
      return Promise.resolve().then(function(){ return ui.o.beiEinladen(name); }).then(function(){
        if(noch()) ui.zeigeEinladen(ui.o.raumInfo ? ui.o.raumInfo() : {}, function(){ ui.zeigePause(daten); });
      }, function(f){ ui.hinweis(SC.UI.raumFehlerText(f), 6000); if(noch()) ui.zeigePause(daten); });
    }
    if(daten.spieler && daten.spieler.name) return oeffne("");
    this.zeigeFigurname(oeffne, function(){ ui.zeigePause(daten); });
  };

  // Raumcode groß, Spaßkampf-Schalter, Mitspieler mit Farbe und „Hinauswerfen“
  SC.UI.prototype.zeigeEinladen = function(info, zurueck){
    var ui = this, l = info.spieler || [];
    zurueck = zurueck || function(){ ui.zeigePause(ui._pauseDaten); };
    this._einladenZurueck = zurueck;
    this._zeige('<div class="einladen"><h2>' + esc(SC.T.einladen) + "</h2>" +
      '<div class="feld">' + esc(SC.T.raumcode) + '<div class="raumcode">' + esc(info.code) + "</div></div>" +
      '<p class="raum-tipp">' + esc(SC.T.einladenTipp) + "</p>" +
      '<button class="modus pvp' + (info.pvp ? " an" : "") + '" data-aktion="pvp">' + esc(SC.T.pvp) + ": " + esc(info.pvp ? SC.T.an : SC.T.aus) + "</button>" +
      "<h3>" + esc(SC.T.mitspieler) + "</h3>" +
      '<div class="spalte mitspieler">' + (l.length ? l.map(function(e){
        return '<div class="mitspieler-zeile' + (e.verbunden === false ? " getrennt" : "") + '"><span class="farbe" style="background-color:' + esc(e.farbe) + '"></span>' +
          '<span class="mitspieler-name">' + esc(e.name) + "</span>" +
          '<button class="gefahr" data-aktion="hinauswerfen" data-id="' + esc(e.id) + '">' + esc(SC.T.hinauswerfen) + "</button></div>";
      }).join("") : '<p class="leer">' + esc(SC.T.keineMitspieler) + "</p>") + "</div>" +
      '<div class="reihe"><button class="haupt" data-aktion="zurueck">' + esc(SC.T.zurueck) + "</button></div></div>",
      {
        pvp: function(){ ui.o.beiPvp && ui.o.beiPvp(!info.pvp); ui.raumAktualisieren(); },
        hinauswerfen: function(el, id){ ui.o.beiHinauswerfen && ui.o.beiHinauswerfen(id); ui.raumAktualisieren(); },
        zurueck: function(){ zurueck(); }
      });
  };
  // Mitspieler oder Spaßkampf haben sich geändert: offenen Einladen-Bildschirm neu zeichnen
  SC.UI.prototype.raumAktualisieren = function(){
    var ui = this;
    if(!this.ebene.hidden && this.ebene.querySelector(".einladen") && this.o.raumInfo) behalteFokus(this, function(){ ui.zeigeEinladen(ui.o.raumInfo(), ui._einladenZurueck); });
  };

  // --- Beitrittsanfrage: Dialog über allem, mehrere nacheinander ---
  SC.UI.prototype.zeigeAnfrage = function(name, antwort, id){
    (this._anfragen = this._anfragen || []).push({ name: name, antwort: antwort, id: id });
    if(this._anfragen.length === 1) this._naechsteAnfrage();
  };
  // Anfrage hat sich erledigt (Wartender ging, Raum zu): Dialog schließen bzw. die nächste zeigen
  SC.UI.prototype.anfrageWeg = function(id){
    var l = this._anfragen || [], i = -1;
    for(var k = 0; k < l.length; k++) if(l[k].id === id){ i = k; break; }
    if(i < 0) return;
    l.splice(i, 1);
    if(i === 0) this._naechsteAnfrage();
  };
  SC.UI.prototype._naechsteAnfrage = function(){
    var ui = this, a = (this._anfragen || [])[0], war = this.modalOffen();
    if(!a){
      if(this._modal){ this._modal.hidden = true; this._modal.innerHTML = ""; }
      this._modalAktionen = {};
      if(war && this.ebene.hidden && this.o.beiWeiter) this.o.beiWeiter(); // war mitten im Spiel: weiterspielen
      return;
    }
    if(!this._modal){ this._modal = document.createElement("div"); this._modal.className = "ebene anfrage-ebene"; this.wurzel.insertBefore(this._modal, this.hinweisEl); }
    this._modal.innerHTML = '<div class="fenster anfrage"><h2>' + esc(fuelle(SC.T.moechteMitspielen, { name: a.name })) + "</h2>" +
      '<div class="reihe"><button class="haupt" data-aktion="ja">' + esc(SC.T.ja) + '</button><button class="gefahr" data-aktion="nein">' + esc(SC.T.nein) + "</button></div></div>";
    this._modal.hidden = false;
    function antworte(ja){ var l = ui._anfragen, i = l.indexOf(a); if(i < 0) return; l.splice(i, 1); a.antwort(ja); ui._naechsteAnfrage(); }
    this._modalAktionen = { ja: function(){ antworte(true); }, nein: function(){ antworte(false); } };
  };
})();
