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

  // --- Begleiter: Käfigtiere mit draussen = true laufen als Wesen "tier" (besitzer = figurId, tierId) neben dem Besitzer ---
  // Der Käfig bleibt die Wahrheit (Name, Stufe, Stärkung); das Leben wird aus dem Wesen zurückgeschrieben. Nicht erlaubt (Zuschauer, Fahrzeug, All):
  // Wesen weg, Käfigtier bleibt „draußen“ und kommt danach wieder heraus.
  S._tierWesen = function(t, pos, nr){
    var d = SC.TIERE[t.art], wt = SC.Tier.werte(t);
    return SC.Wesen.neu(this.welt, "tier", { tierArt: t.art, tierId: t.id, besitzer: this.daten.spieler.figurId, nr: nr, name: t.name, stufe: t.stufe, lp: Math.min(t.lp, wt.lpMax), lpMax: wt.lpMax,
      halsband: "#ffd95c", pos: pos, heim: pos.slice(), breite: d.breite, hoehe: d.hoehe });
  };
  S._tiereAbgleichen = function(){
    var w = this.welt, sp = this.spieler, k = this.kampf, s = this, fid = this.daten.spieler.figurId, n = 0;
    var erlaubt = sp.modus !== "zuschauer" && !this.all && !this._imFahrzeug(), da = {};
    w.wesen.forEach(function(e){ if(e.art === "tier" && e.besitzer === fid) da[e.tierId] = e; });
    k.kaefig.plaetze.forEach(function(t){
      if(!t || !t.draussen || !erlaubt || t.koRest > 0) return;
      var e = da[t.id], wt = SC.Tier.werte(t);
      if(!e){ e = s._tierWesen(t, sp.pos.slice(), n); if(e) SC.KI.tierZuBesitzer(w, e, sp.pos, n); }
      else {
        delete da[t.id]; t.lp = Math.max(0, Math.min(e.lp, wt.lpMax)); e.lp = t.lp; e.lpMax = wt.lpMax; e.name = t.name; e.stufe = t.stufe;
      }
      n++;
    });
    for(var id in da){ var e2 = da[id], t2 = k.kaefig.tier(id); if(t2 && !e2.ko) t2.lp = Math.max(0, Math.min(e2.lp, SC.Tier.werte(t2).lpMax)); SC.Wesen.entferne(w, e2.id); }
  };
  S._tierRaus = function(id){ var r = this.kampf.kaefig.rauslassen(id); if(r === "ok") this._tiereAbgleichen(); return r; };
  S._tierRein = function(id){ if(!this.kampf.kaefig.tier(id)) return; this.kampf.kaefig.zurueck(id); this._tiereAbgleichen(); };

  // Jedes Bild: Wildtiere einmal pro Sekunde auftauchen lassen, alle Tiere bewegen. Ein offenes Menü hält die Welt an (im Raum läuft sie weiter).
  S._tiere = function(dt, offen){
    var w = this.welt, sp = this.spieler, raum = this.raum, s = this;
    this._fangBild(dt, offen);
    if(raum instanceof SC.Gast || !this.auftauchen) return;
    if(this.all){ this._tiereAbgleichen(); return; }
    if(offen && !raum) return;
    var gastgeber = raum instanceof SC.Gastgeber ? raum : null, ziele = gastgeber ? SC.Raum.mitspielerZiele(gastgeber, this.raumIch(offen)) : null, alle = ziele || [{ id: this.daten.spieler.figurId, pos: sp.pos, modus: sp.modus }];
    if((this._tierZeit = (this._tierZeit || 0) + dt) >= 1){
      this._tierZeit = 0;
      this.auftauchen.tiere(alle, SC.himmelsFarben(SC.PALETTEN[w.planet.palette] || SC.PALETTEN.start, this.tageszeit).tageslicht);
    }
    this.kampf.kaefig.plaetze.forEach(function(t){ if(t) SC.Tier.zeit(t, dt); });
    this._tiereAbgleichen();
    var zf = this._zf || Math.random, ctx = { spieler: alle }, fid = this.daten.spieler.figurId;
    w.wesen.forEach(function(e){
      if(e.art !== "tier") return;
      var c = ctx;
      if(e.besitzer){
        var b = e.besitzer === fid ? sp : null;
        if(!b) alle.forEach(function(z){ if(z.id === e.besitzer) b = z; });
        if(!b){ SC.Wesen.entferne(w, e.id); return; }   // Besitzer weg (Gast getrennt)
        c = { spieler: alle, besitzer: { pos: b.pos } };
      }
      SC.KI.tier(w, e, c, dt, zf);
    });
  };
})();
