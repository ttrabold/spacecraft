// Haustiere im Spiel: Wildtiere auftauchen und bewegen, Begleiter, Fangen, Streicheln. Ergänzt SC.Spiel; wird von SC.Spiel#_bild nach _survival aufgerufen.
// Der Gast rechnet nichts (die Wesen kommen gespiegelt vom Gastgeber). Spec: docs/superpowers/specs/2026-11-04-haustiere-design.md
(function(){
  var S = SC.Spiel.prototype;

  // Jedes Bild: Wildtiere einmal pro Sekunde auftauchen lassen, alle Tiere bewegen. Ein offenes Menü hält die Welt an (im Raum läuft sie weiter).
  S._tiere = function(dt, offen){
    var w = this.welt, sp = this.spieler, raum = this.raum, s = this;
    if(raum instanceof SC.Gast || (offen && !raum) || this.all || !this.auftauchen) return;
    var gastgeber = raum instanceof SC.Gastgeber ? raum : null, ziele = gastgeber ? SC.Raum.mitspielerZiele(gastgeber, this.raumIch(offen)) : null, alle = ziele || [{ id: this.daten.spieler.figurId, pos: sp.pos, modus: sp.modus }];
    if((this._tierZeit = (this._tierZeit || 0) + dt) >= 1){
      this._tierZeit = 0;
      this.auftauchen.tiere(alle, SC.himmelsFarben(SC.PALETTEN[w.planet.palette] || SC.PALETTEN.start, this.tageszeit).tageslicht);
    }
    var zf = this._zf || Math.random, ctx = { spieler: alle };
    w.wesen.forEach(function(e){
      if(e.art !== "tier") return;
      SC.KI.tier(w, e, ctx, dt, zf);
    });
  };
})();
