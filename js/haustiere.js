// Haustiere im Spiel: Wildtiere auftauchen und bewegen, Begleiter, Fangen, Streicheln. Ergänzt SC.Spiel; wird von SC.Spiel#_bild nach _survival aufgerufen.
// Der Gast rechnet nichts (die Wesen kommen gespiegelt vom Gastgeber). Spec: docs/superpowers/specs/2026-11-04-haustiere-design.md
(function(){
  var S = SC.Spiel.prototype;

  function ring(welt, a, b){ var P = welt.planet.groesse; return [SC.mod(b[0] - a[0] + P / 2, P) - P / 2, b[1] - a[1], SC.mod(b[2] - a[2] + P / 2, P) - P / 2]; }
  var FANG_REICHWEITE = 4.5;

  // --- Fangen mit dem Netz (Zielring, js/fang.js) ---
  // Netz in der Hand + Angriffstaste: das nächste Wildtier im Blickfeld (Kegel von etwa 60°, bis 4,5 Blöcke) wird gefangen, sofern der Käfig Platz hat und kein anderer es gerade fängt
  S._fangVersuch = function(){
    if(this._fang) return false;
    var w = this.welt, sp = this.spieler, k = this.kampf, b = [-Math.sin(sp.blick[0]), -Math.cos(sp.blick[0])], best = null, bd = Infinity;
    w.wesen.forEach(function(e){
      if(e.art !== "tier" || !e.wild || e.fangVon) return;
      var d = ring(w, sp.pos, e.pos), l = Math.hypot(d[0], d[2]);
      if(l > FANG_REICHWEITE || Math.abs(d[1]) > 2.5 || (l > 1.2 && (b[0] * d[0] + b[1] * d[2]) / l < 0.5)) return;
      if(l < bd){ bd = l; best = e; }
    });
    if(!best) return false;
    if(k.kaefig.plaetze.every(Boolean)){ this.ui.hinweis(SC.T.kaefigVoll, 2500); return false; }
    best.haeltStill = true; best.fangVon = this.daten.spieler.figurId || "ich";
    this._fang = { fang: new SC.Fang(SC.TIERE[best.tierArt].seltenheit), id: best.id };
    return true;
  };
  // Eingabe beim Fangen: Bewegung und Blick sind gesperrt; Klick/Angriff, Leertaste/A und Setzen zählen als Druck auf den Ring
  S._fangEingabe = function(e){
    if(!this._fang) return;
    if(e.abbauen || e.springenNeu || e.setzen) this._fangDruck = true;
    e.vor = e.zurueck = e.links = e.rechts = e.springen = e.springenNeu = e.sinken = e.sprint = false;
    e.blickDx = e.blickDy = 0; e.abbauen = e.abbauenGehalten = e.setzen = e.setzenGehalten = e.ausweichen = e.benutzen = false;
  };
  S._fangEnde = function(tier){
    if(tier){ tier.haeltStill = false; tier.fangVon = null; }
    this._fang = null; this._fangDruck = false; if(this.ui.fangRing) this.ui.fangRing(null);
  };
  // Jedes Bild: Ring weiterlaufen lassen; Ergebnis umsetzen
  S._fangBild = function(dt, offen){
    var f = this._fang; if(!f) return;
    var w = this.welt, sp = this.spieler, k = this.kampf, s = this, tier = w.wesen.get(f.id);
    var weg = tier ? Math.hypot.apply(null, [ring(w, sp.pos, tier.pos)[0], ring(w, sp.pos, tier.pos)[2]]) : Infinity;
    if(!tier || offen || k.besiegt() || sp.modus !== "survival" || !k.netz() || weg > FANG_REICHWEITE + 2){ this._fangEnde(tier); return; }
    var d = ring(w, sp.pos, tier.pos); tier.blick = Math.atan2(d[0], d[2]);   // das Tier schaut den Spieler an
    var druck = this._fangDruck; this._fangDruck = false;
    var r = druck ? f.fang.druecken() : f.fang.schritt(dt);
    if(r === "laeuft"){ this.ui.fangRing({ ring: f.fang.ring, zone: f.fang.zone, treffer: f.fang.treffer, noetig: f.fang.noetig }, function(){ s._fangDruck = true; }); return; }
    if(r === "treffer"){ this.audio.spiele("treffer"); this.render.wesen.funken(tier.pos, "#7dff9a", 10, sp.pos); this.ui.hinweis(SC.T.fangTreffer, 900); this.ui.fangRing({ ring: f.fang.ring, zone: f.fang.zone, treffer: f.fang.treffer, noetig: f.fang.noetig }, function(){ s._fangDruck = true; }); return; }
    this._fangEnde(tier);
    if(r === "daneben"){
      // Das Tier hoppelt ein Stück weg; man kann es gleich nochmal versuchen (nichts geht verloren)
      var l = Math.hypot(d[0], d[2]) || 1; tier.richtung = [d[0] / l, d[2] / l]; tier.modus = "flieht"; tier.bis = (tier.zeit || 0) + 1; tier.geschw[1] = 6;
      this.ui.hinweis(SC.T.fangDaneben, 1500);
    } else {
      var t = SC.Tier.neu(tier.tierArt, this._zf);
      if(!k.kaefig.lege(t)){ this.ui.hinweis(SC.T.kaefigVoll, 2500); return; }
      SC.Wesen.entferne(w, tier.id); this.render.wesen.funken(tier.pos, "#ffe36b", 28, sp.pos); this.audio.spiele("aufsammeln", { seltenheit: 4 });
      this.ui.hinweis(SC.T.neuGefangen.replace("{name}", t.name + " (" + SC.TIERE[t.art].name + ")"), 3000);
    }
  };

  // Jedes Bild: Wildtiere einmal pro Sekunde auftauchen lassen, alle Tiere bewegen. Ein offenes Menü hält die Welt an (im Raum läuft sie weiter).
  S._tiere = function(dt, offen){
    var w = this.welt, sp = this.spieler, raum = this.raum, s = this;
    this._fangBild(dt, offen);
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
