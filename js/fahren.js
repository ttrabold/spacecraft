// Fahren im Spiel (Stufe 4): Ein- und Aussteigen, Steuern, Insassen mitnehmen, leere Fahrzeuge weiterrechnen.
// Ergänzt SC.Spiel; die Fahrzeuglogik selbst steht in js/fahrzeuge.js.
(function(){
  var S = SC.Spiel.prototype;

  // Eigene ID in den Sitzen: die Figur-ID (im Raum gleich für alle Geräte)
  S._fzId = function(){ return this.daten.spieler.figurId; };
  S._imFahrzeug = function(){ return this.welt ? SC.Fahrzeug.sitzVon(this.welt, this._fzId()) : null; };

  // Benutzen-Taste: im Fahrzeug aussteigen, sonst in das nächste Fahrzeug in Reichweite einsteigen → true, wenn etwas passiert ist
  S.benutzen = function(){
    var sp = this.spieler, im = this._imFahrzeug();
    if(im) return this.aussteigen();
    if(sp.modus === "zuschauer" || (this.kampf && this.kampf.besiegt())) return false;
    var f = SC.Fahrzeug.naechstes(this.welt, sp.pos);
    if(!f) return false;
    var sitz = SC.Fahrzeug.einsteigen(f, this._fzId());
    if(sitz < 0){ this.ui.hinweis(SC.T.fahrzeugVoll, 2000); return false; }
    this._eingestiegen(f, sitz);
    return true;
  };
  // Nach dem Einsteigen: Verfolgeransicht, Blick nach vorn, Hinweis
  S._eingestiegen = function(f, sitz){
    var sp = this.spieler;
    sp._ansichtVorher = sp.ansicht; sp.ansicht = "aussen"; sp.blick[0] = f.blick; sp.geschw = [0, 0, 0];
    this._fahrzeugFolgen(SC.Fahrzeug.sitzVon(this.welt, this._fzId()), true);
    this.audio.spiele("einsteigen");
    this.ui.hinweis((sitz === 0 ? SC.T.fahrzeugFahrer : SC.T.fahrzeugMitfahrer).replace("{name}", SC.FAHRZEUGE[f.art].name), 3000);
  };
  S.aussteigen = function(){
    var sp = this.spieler, im = this._imFahrzeug();
    if(!im) return false;
    SC.Fahrzeug.aussteigen(im.f, this._fzId());
    this._ausgestiegen(SC.Fahrzeug.aussteigePos(this.welt, im.f, im.sitz));
    return true;
  };
  // Spieler steht wieder (pos: Aussteigeposition)
  S._ausgestiegen = function(pos){
    var sp = this.spieler;
    sp.pos = pos.slice(); sp.geschw = [0, 0, 0]; sp.ruhePos = null; sp.sitzt = null;
    sp.ansicht = sp._ansichtVorher || "ich"; sp._ansichtVorher = null;
    if(this.audio.motor) this.audio.motor(null, 0);
  };

  // Insasse: Position am Sitz, Geschwindigkeit des Fahrzeugs, Aussteigeposition fürs Speichern (alle 0,25 s)
  S._fahrzeugFolgen = function(im, sofort){
    var sp = this.spieler, f = im.f;
    // Verfolgeransicht: der Blick dreht mit, wenn das Fahrzeug lenkt
    if(!sofort && this._fzBlick !== undefined) sp.blick[0] += f.blick - this._fzBlick;
    this._fzBlick = f.blick;
    sp.pos = SC.Fahrzeug.sitzPos(f, im.sitz, this.welt.planet.groesse); sp.geschw = f.geschw.slice(); sp.aufBoden = true; sp.sitzt = f.blick;
    if(sofort || !sp.ruhePos || (this._ruheZeit = (this._ruheZeit || 0) + 1) >= 15){ this._ruheZeit = 0; sp.ruhePos = SC.Fahrzeug.aussteigePos(this.welt, f, im.sitz); }
  };

  // Pro Bild, solange man sitzt (statt der Spielerphysik). Der Fahrer steuert; mit offenem Menü rollt das Fahrzeug aus.
  S._fahren = function(e, dt, offen){
    var im = this._imFahrzeug(); if(!im) return;
    var f = im.f, d = SC.FAHRZEUGE[f.art];
    if(im.sitz === 0) SC.Fahrzeug.schritt(this.welt, f, offen ? {} : { vor: e.vor, zurueck: e.zurueck, links: e.links, rechts: e.rechts, hoch: e.springen, runter: e.sinken }, dt);
    this._fahrzeugFolgen(im, false);
    if(this.audio.motor) this.audio.motor(f.art, Math.min(1, Math.hypot(f.geschw[0], f.geschw[2]) / d.tempo));
  };

  // Pro Bild (nicht als Gast): Fahrzeuge ohne Fahrer weiterrechnen, solange sie rollen oder in der Luft sind
  S._fahrzeugeBild = function(dt){
    if(this.rolle === "gast") return;
    var w = this.welt;
    w.fahrzeuge.forEach(function(f){
      if(f.weg || f.sitze[0] !== null) return;
      if(f.tempo !== 0 || !f.aufBoden || f.geschw[1] !== 0) SC.Fahrzeug.schritt(w, f, null, dt);
    });
  };

  // --- Kampf ---
  // Treffer auf den Spieler im Fahrzeug → Panzerung (true = umgeleitet)
  S._fahrzeugTreffer = function(menge){
    var im = this._imFahrzeug(); if(!im) return false;
    var r = SC.Fahrzeug.schaden(this.welt, im.f, menge, this.daten.spielzeit || 0);
    if(r.verpufft) this._fahrzeugVerpufft(im.f, im.sitz, r);
    return true;
  };
  // Verpufft: Funken wie bei Gegnern, Hinweis; wer drin saß, steht neben dem Fahrzeug (sitz: eigener Sitz)
  S._fahrzeugVerpufft = function(f, sitz, r){
    var sp = this.spieler, name = SC.FAHRZEUGE[f.art].name;
    if(this.render && this.render.wesen) this.render.wesen.funken([f.pos[0], f.pos[1] + 1, f.pos[2]], "#ffd95c", 30, sp.pos);
    this.audio.spiele("zerfall");
    if(r.ausgestiegen.indexOf(this._fzId()) >= 0){ this._ausgestiegen(SC.Fahrzeug.aussteigePos(this.welt, f, sitz)); this.ui.hinweis((f.fundort ? SC.T.fahrzeugVerpufftFundort : SC.T.fahrzeugVerpufft).replace("{name}", name), 4000); }
  };
  // Bordgeschütz des Fahrers (Angriffstaste), mit Abklingzeit; t in ms
  S._bordschuss = function(f, t){
    var g = SC.FAHRZEUGE[f.art].geschuetz;
    if(!g || t < (this._bordBereit || 0)) return false;
    this._bordBereit = t + g.abklingen * 1000;
    this._spielerSchuss({ pos: SC.Fahrzeug.dreh(f, g.rohr, this.welt.planet.groesse), richtung: this.spieler.richtung(), tempo: g.tempo, schaden: g.schaden, team: "spieler", art: "laser", lebensdauer: 60 / g.tempo, farbe: g.farbe });
    this.audio.spiele("blaster");
    return true;
  };
  // Pro Bild dort, wo Gegner gerechnet werden (allein oder Gastgeber): Rammen und Erholung
  S._fahrzeugKampf = function(dt){
    var s = this, w = this.welt, k = this.kampf, z = this.daten.spielzeit || 0;
    w.fahrzeuge.forEach(function(f){
      SC.Fahrzeug.erholung(f, dt, z);
      SC.Fahrzeug.rammen(w, f, z).forEach(function(r){
        if(r.boss){ s.audio.spiele("blocken"); return; }
        var g = r.gegner, tr = k.trifftGegner(g, r.schaden, [-Math.sin(f.blick), 0, -Math.cos(f.blick)]);
        s._zahl(g, tr.schaden); if(tr.besiegt) s.besiege(g); else s.audio.spiele("treffer");
      });
    });
  };

  // Hinweis, sobald man neben einem Fahrzeug steht; liefert, ob der Benutzen-Knopf sichtbar sein soll
  S._fahrzeugNah = function(){
    var sp = this.spieler, im = this._imFahrzeug(), f = im ? null : SC.Fahrzeug.naechstes(this.welt, sp.pos);
    if(f && f !== this._fzHinweis && sp.modus !== "zuschauer") this.ui.hinweis(SC.T.fahrzeugEinsteigen.replace("{name}", SC.FAHRZEUGE[f.art].name), 2500);
    this._fzHinweis = f;
    return !!(im || (f && sp.modus !== "zuschauer"));
  };
})();
