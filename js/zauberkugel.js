// Zauberkugel: Tisch mit Kristallkugel. Der Gastgeber (oder Einzelspieler) wird samt allen Gästen zu seinem Bett gebracht, auch auf einen anderen Planeten;
// ein Gast fragt damit den Gastgeber, der zustimmen muss. Ergänzt SC.Spiel.
(function(){
  var S = SC.Spiel.prototype, PAUSE_MS = 10000;   // so lange darf ein Gast nicht noch einmal fragen
  S._jetzt = function(){ return Date.now(); };
  // Block angetippt
  S.zauberkugelBenutzen = function(){
    var T = SC.T, r = this.raum;
    if(r instanceof SC.Gast){
      var t = this._jetzt();
      if(t < (this._zauberBis || 0)){ this.ui.hinweis(T.zauberPause, 3000); return; }
      this._zauberBis = t + PAUSE_MS; this.ui.hinweis(T.zauberWartet, 3000); r.zauber(); return;
    }
    if(!this.daten.spieler.bett){ this.ui.hinweis(T.zauberOhneBett, 4000); return; }
    return this._zumBett();
  };
  // Alle zum Bett des Gastgebers bzw. Einzelspielers → Versprechen (true, wenn es geklappt hat). Anderer Planet: Planetenwechsel, alle Gäste kommen mit.
  S._zumBett = function(){
    var s = this, b = this.daten.spieler.bett, w = this.welt, T = SC.T;
    if(!b){ this.ui.hinweis(T.zauberOhneBett, 4000); return Promise.resolve(false); }
    if(b.planet !== w.planet.id){
      if(!this._bettDa(b)){ this.daten.spieler.bett = null; this.ui.hinweis(T.bettFehlte, 4000); return Promise.resolve(false); }
      return this.wechslePlanet(b.planet, { bett: true }).then(function(){ s.ui.hinweis(T.zauberAngekommen, 2500); return true; }, function(){ return false; });
    }
    var p = this.bettPunkt(); if(!p) return Promise.resolve(false);   // bettPunkt meldet ein fehlendes oder zugebautes Bett
    this._teleportiert(p);
    if(this.raum instanceof SC.Gastgeber) this.raum.teleport(p);
    return Promise.resolve(true);
  };
  // Gast hat gefragt: ohne Bett sofort Nein, sonst Dialog; bei Ja kommen alle zum Bett
  S._zauberFrage = function(info, antwort){
    var s = this, b = this.daten.spieler.bett, w = this.welt;
    var da = b && (b.planet === w.planet.id ? SC.Bauteile.istBettKopf(w.holeBlock(b.x, b.y, b.z)) : this._bettDa(b));
    if(!da){ antwort(false, "bett"); return; }
    this.eingabe.gebeMausFrei();
    this.ui.zeigeAnfrage(info.name, function(ja){ if(!ja){ antwort(false, "nein"); return; } antwort(true); s._zumBett(); }, "zauber:" + info.id, SC.T.zauberFrage);
  };
  // Aus dem Netz oder vom eigenen Bett: an diese Stelle (im All gilt das nicht)
  S._teleportiert = function(pos){
    if(this.all) return;
    var sp = this.spieler;
    if(this._imFahrzeug()) this.aussteigen();
    if(sp.schlaeft) this._aufwachen(false);
    sp.pos = pos.slice(); sp.geschw = [0, 0, 0];
    this.ui.hinweis(SC.T.zauberAngekommen, 2500);
  };
})();
