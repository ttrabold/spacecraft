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
    if(this.raum instanceof SC.Gast) this.raum.fangStart(best.id);   // der Gastgeber sperrt das Tier; ist es schon vergeben, kommt fangNein
    else { best.haeltStill = true; best.fangVon = this.daten.spieler.figurId || "ich"; best.fangZeit = 0; }
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
  S._fangEnde = function(tier, gefangen){
    if(tier){ tier.haeltStill = false; tier.fangVon = null; }
    if(this._fang && this.raum instanceof SC.Gast) this.raum.fangEnde(this._fang.id, !!gefangen);
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
    if(r === "daneben"){
      // Das Tier hoppelt ein Stück weg; man kann es gleich nochmal versuchen (nichts geht verloren; beim Gast macht das der Gastgeber)
      this._fangEnde(tier, false);
      if(!(this.raum instanceof SC.Gast)){ var l = Math.hypot(d[0], d[2]) || 1; tier.richtung = [d[0] / l, d[2] / l]; tier.modus = "flieht"; tier.bis = (tier.zeit || 0) + 1; tier.geschw[1] = 6; }
      this.ui.hinweis(SC.T.fangDaneben, 1500);
    } else {
      var t = SC.Tier.neu(tier.tierArt, this._zf);
      if(!k.kaefig.lege(t)){ this._fangEnde(tier, false); this.ui.hinweis(SC.T.kaefigVoll, 2500); return; }
      this._fangEnde(tier, true); SC.Wesen.entferne(w, tier.id); this.render.wesen.funken(tier.pos, "#ffe36b", 28, sp.pos); this.audio.spiele("aufsammeln", { seltenheit: 4 });
      this.ui.hinweis(SC.T.neuGefangen.replace("{name}", t.name + " (" + SC.TIERE[t.art].name + ")"), 3000);
    }
  };

  // --- Begleiter: Käfigtiere mit draussen = true laufen als Wesen "tier" (besitzer = figurId, tierId) neben dem Besitzer ---
  // Der Käfig bleibt die Wahrheit (Name, Stufe, Stärkung); das Leben wird aus dem Wesen zurückgeschrieben. Nicht erlaubt (Zuschauer, Fahrzeug, All):
  // Wesen weg, Käfigtier bleibt „draußen“ und kommt danach wieder heraus.
  S._tierWesen = function(t, pos, nr){
    var d = SC.TIERE[t.art], wt = SC.Tier.werte(t);
    return SC.Wesen.neu(this.welt, "tier", { tierArt: t.art, tierId: t.id, besitzer: this.daten.spieler.figurId, nr: nr, name: t.name, stufe: t.stufe, lp: Math.min(t.lp, wt.lpMax), lpMax: wt.lpMax,
      schaden: wt.schaden, halsband: (this.raum && this.raum.farbe) || "#ffd95c", pos: pos, heim: pos.slice(), breite: d.breite, hoehe: d.hoehe });
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
        delete da[t.id]; t.lp = Math.max(0, Math.min(e.lp, wt.lpMax)); e.lp = t.lp; e.lpMax = wt.lpMax; e.schaden = wt.schaden; e.name = t.name; e.stufe = t.stufe;
      }
      n++;
    });
    for(var id in da){ var e2 = da[id], t2 = k.kaefig.tier(id); if(t2 && !e2.ko) t2.lp = Math.max(0, Math.min(e2.lp, SC.Tier.werte(t2).lpMax)); SC.Wesen.entferne(w, e2.id); }
  };
  // --- Kampf: Ziel für Gegner, Treffer auf Begleiter, K.o., Erfahrung ---
  // Nimmt ein Gegner statt des Spielers lieber einen Begleiter ins Ziel? (näher als 80 % des Abstands zum Spieler; Ablenker (Hase, Affe) auch noch bis 4 Blöcke weiter) → Ziel oder null
  S._tierZielFuer = function(g, basis){
    var w = this.welt, best = null, bd = Infinity, db = basis ? Math.hypot(ring(w, g.pos, basis.pos)[0], ring(w, g.pos, basis.pos)[2]) : Infinity;
    w.wesen.forEach(function(e){
      if(e.art !== "tier" || !e.besitzer) return;
      var d = ring(w, g.pos, e.pos), l = Math.hypot(d[0], d[2]);
      if(l > 14 || Math.abs(d[1]) > 3) return;
      var abl = SC.TIERE[e.tierArt].stil === "ablenker";
      if((l < db * 0.8 || (abl && l < 8 && l <= db + 4)) && l < bd){ bd = l; best = e; }
    });
    return best ? { pos: best.pos, sichtbar: true, tier: best, mitte: best.hoehe * 0.5 } : null;
  };
  // Hieb oder Stampfen eines Gegners gegen einen Begleiter
  S._tierGetroffen = function(e, g, akt){
    var t = SC.Kampf.aktionTrifft(this.welt, g, akt, e.pos, true);
    if(t) this._tierTreffer(e, t.schaden * (SC.SCHWIERIGKEIT[this.daten.schwierigkeit] || SC.SCHWIERIGKEIT.normal).schaden);
  };
  S._tierTreffer = function(e, schaden){
    if(!(schaden > 0) || e.ko) return;
    e.lp -= schaden; this.audio.spiele("treffer"); this._zahl({ pos: e.pos, hoehe: e.hoehe }, schaden);
    if(e.lp <= 0) this._tierKo(e);
  };
  // K.o.: freundlich verpuffen, zurück in den Käfig, nach 1 Minute wieder fit (Erfahrung bleibt)
  S._tierKo = function(e){
    var t = e.besitzer === this.daten.spieler.figurId ? this.kampf.kaefig.tier(e.tierId) : null; e.ko = true;
    if(!t && e.besitzer !== this.daten.spieler.figurId && this.raum instanceof SC.Gastgeber){
      // Tier eines Gastes: der Gast bekommt das K.o. gemeldet; die veraltete Liste darf es nicht neu anlegen
      var en = this.raum._eintrag(e.besitzer); if(en) (en.ko || (en.ko = {}))[e.tierId] = true;
      this.raum.tierStand(e.besitzer, [], [e.tierId]);
    }
    if(t){ t.lp = 0; t.koRest = 60; t.draussen = false; t.staerke = null; this.ui.hinweis(SC.T.tierKo.replace("{name}", t.name), 3000); }
    this.render.wesen.funken(e.pos, "#ffe36b", 18, this.spieler.pos); this.audio.spiele("zerfall");
    SC.Wesen.entferne(this.welt, e.id);
  };
  // Erfahrung für den Besitzer besiegter Gegner: Begleiter in 30 Blöcken Umkreis bekommen dieselbe Menge (Stufe höchstens die des Besitzers)
  S._tiereErfahrung = function(xp, pos){
    if(!(xp > 0) || !this.kampf) return;
    var w = this.welt, k = this.kampf, s = this;
    k.kaefig.plaetze.forEach(function(t){
      if(!t || !t.draussen) return;
      var nah = false; w.wesen.forEach(function(e){ if(e.tierId === t.id){ var d = ring(w, e.pos, pos); nah = Math.hypot(d[0], d[2]) < 30; } });
      if(!nah) return;
      if(SC.Tier.gibErfahrung(t, xp, k.werte.stufe)){ s.ui.hinweis(SC.T.tierStufe.replace("{name}", t.name).replace("{stufe}", t.stufe), 2500); s.audio.spiele("aufstieg"); }
    });
  };
  // --- Streicheln und Füttern: Benutzen-Taste (wie Bett und Truhe) auf ein eigenes Begleitertier in Reichweite ---
  // Mit Tierfutter in der Hand wird gefüttert (5 min stärker, heilt), sonst gestreichelt (2 min stärker). → true, wenn ein Tier gemeint war
  S._tierBenutzen = function(){
    var w = this.welt, sp = this.spieler, k = this.kampf, fid = this.daten.spieler.figurId, b = [-Math.sin(sp.blick[0]), -Math.cos(sp.blick[0])], best = null, bd = Infinity;
    w.wesen.forEach(function(e){
      if(e.art !== "tier" || e.besitzer !== fid) return;
      var d = ring(w, sp.pos, e.pos), l = Math.hypot(d[0], d[2]);
      if(l > 4 || Math.abs(d[1]) > 2.5 || (l > 1.2 && (b[0] * d[0] + b[1] * d[2]) / l < 0.5)) return;
      if(l < bd){ bd = l; best = e; }
    });
    var t = best && k.kaefig.tier(best.tierId); if(!t) return false;
    var hand = k.rucksack.plaetze[sp.auswahl], futter = !!(hand && hand.block === SC.B.TIERFUTTER) && !(t.staerke && t.staerke.art === "fuettern" && t.staerke.rest > 295);
    if(futter && SC.Tier.staerken(t, "fuettern")){ k.rucksack.verbrauche(sp.auswahl); best.lp = t.lp; this.ui.hinweis(SC.T.gefuettert.replace("{name}", t.name), 2500); }
    else if(SC.Tier.staerken(t, "streicheln")) this.ui.hinweis(SC.T.gestreichelt.replace("{name}", t.name), 2500);
    this.render.wesen.funken([best.pos[0], best.pos[1] + best.hoehe + 0.2, best.pos[2]], "#ff7fb0", 10, sp.pos); this.audio.spiele("aufsammeln", { seltenheit: 1 });
    return true;
  };
  // --- Mehrspieler (Gastgeber): Tiere der Gäste, Stand zurück an den Gast, Fang-Sperren ---
  // Aus den Listen der Gäste (entry.tiere, vom Gast gemeldet) die Wesen anlegen, aktualisieren und entfernen; Gast-Tiere im K.o. (entry.ko) bleiben draußen vor
  S._tiereGaeste = function(){
    var gg = this.raum, w = this.welt;
    if(!gg || !gg.spieler || !w) return;
    gg.spieler.forEach(function(g){
      if(!g.verbunden || !g.pos) return;
      var roh = g.tiere || [], liste = roh.filter(function(t){ return !(g.ko && g.ko[t.id]); }), da = {};
      if(g.ko) for(var kid in g.ko){ var noch = false; roh.forEach(function(t){ if(t.id === kid) noch = true; }); if(!noch) delete g.ko[kid]; }
      w.wesen.forEach(function(e){ if(e.art === "tier" && e.besitzer === g.id) da[e.tierId] = e; });
      liste.forEach(function(t, n){
        var d = SC.TIERE[t.art], e = da[t.id]; delete da[t.id];
        if(!e){
          e = SC.Wesen.neu(w, "tier", { tierArt: t.art, tierId: t.id, besitzer: g.id, nr: n, name: t.name, stufe: t.stufe, lp: t.lp, lpMax: t.lpMax, schaden: t.schaden, fn: t.fn, halsband: g.farbe || "#ffd95c", pos: g.pos.slice(), heim: g.pos.slice(), breite: d.breite, hoehe: d.hoehe });
          if(e) SC.KI.tierZuBesitzer(w, e, g.pos, n);
          return;
        }
        e.name = t.name; e.stufe = t.stufe; e.lpMax = t.lpMax; e.schaden = t.schaden; if(e.lp > e.lpMax) e.lp = e.lpMax;
        if(t.fn !== e.fn){ e.fn = t.fn; e.lp = t.lpMax; }   // der Gast hat gefüttert
      });
      for(var id in da) SC.Wesen.entferne(w, da[id].id);
    });
  };
  // Gast: Leben und K.o. seiner Tiere vom Gastgeber übernehmen
  S._tierStand = function(n){
    var k = this.kampf, s = this; if(!k) return;
    (n.liste || []).forEach(function(t){ var x = k.kaefig.tier(t.id); if(x && x.draussen) x.lp = Math.max(0, Math.min(t.lp, SC.Tier.werte(x).lpMax)); });
    (n.ko || []).forEach(function(id){ var x = k.kaefig.tier(id); if(x){ x.lp = 0; x.koRest = 60; x.draussen = false; x.staerke = null; s.ui.hinweis(SC.T.tierKo.replace("{name}", x.name), 3000); } });
  };
  // Wildtiere, die ein getrennter Gast (oder zu lange) fängt, wieder freigeben
  SC.Spiel.tierFangFreigeben = function(welt, eigeneId, alle, dt){
    welt.wesen.forEach(function(e){
      if(e.art !== "tier" || !e.wild || !e.fangVon || e.fangVon === eigeneId) return;
      e.fangZeit = (e.fangZeit || 0) + (dt || 0);
      if(e.fangZeit > 30 || !alle.some(function(z){ return z.id === e.fangVon; })){ e.fangVon = null; e.haeltStill = false; e.fangZeit = 0; }
    });
  };
  S._tierRaus = function(id){ var r = this.kampf.kaefig.rauslassen(id); if(r === "ok") this._tiereAbgleichen(); return r; };
  S._tierRein = function(id){ if(!this.kampf.kaefig.tier(id)) return; this.kampf.kaefig.zurueck(id); this._tiereAbgleichen(); };

  // Jedes Bild: Wildtiere einmal pro Sekunde auftauchen lassen, alle Tiere bewegen. Ein offenes Menü hält die Welt an (im Raum läuft sie weiter).
  S._tiere = function(dt, offen){
    var w = this.welt, sp = this.spieler, raum = this.raum, s = this;
    this._fangBild(dt, offen);
    if(!this.auftauchen) return;
    // Gast: die Tiere rechnet der Gastgeber; hier laufen nur die Zeiten der Käfigtiere, und die Liste der Tiere draußen geht mit dem zustand hinaus
    if(raum instanceof SC.Gast){
      this.kampf.kaefig.plaetze.forEach(function(t){ if(t) SC.Tier.zeit(t, dt); });
      this._tiereListe = sp.modus !== "zuschauer" && !this.all && !this._imFahrzeug() ? SC.Raum.tiereListe(this.kampf.kaefig.plaetze) : [];
      return;
    }
    if(this.all){ this._tiereAbgleichen(); return; }
    if(offen && !raum) return;
    var gastgeber = raum instanceof SC.Gastgeber ? raum : null, ziele = gastgeber ? SC.Raum.mitspielerZiele(gastgeber, this.raumIch(offen)) : null, alle = ziele || [{ id: this.daten.spieler.figurId, pos: sp.pos, modus: sp.modus }];
    if((this._tierZeit = (this._tierZeit || 0) + dt) >= 1){
      this._tierZeit = 0;
      this.auftauchen.tiere(alle, SC.himmelsFarben(SC.PALETTEN[w.planet.palette] || SC.PALETTEN.start, this.tageszeit).tageslicht);
    }
    this.kampf.kaefig.plaetze.forEach(function(t){ if(t) SC.Tier.zeit(t, dt); });
    this._tiereAbgleichen();
    if(gastgeber){
      this._tiereGaeste();
      SC.Spiel.tierFangFreigeben(w, this.daten.spieler.figurId, alle, dt);
      if((this._tierStandZeit = (this._tierStandZeit || 0) + dt) >= 1){   // Leben der Gast-Tiere zurück an die Gäste
        this._tierStandZeit = 0;
        gastgeber.spieler.forEach(function(g){ if(!g.verbunden) return; var l = []; w.wesen.forEach(function(e){ if(e.art === "tier" && e.besitzer === g.id) l.push({ id: e.tierId, lp: Math.ceil(e.lp) }); }); if(l.length) gastgeber.tierStand(g.id, l, []); });
      }
    }
    var zf = this._zf || Math.random, ctx = { spieler: alle }, fid = this.daten.spieler.figurId;
    w.wesen.forEach(function(e){
      if(e.art !== "tier") return;
      var c = ctx;
      if(e.besitzer){
        var b = e.besitzer === fid ? sp : null;
        if(!b) alle.forEach(function(z){ if(z.id === e.besitzer) b = z; });
        if(!b){ SC.Wesen.entferne(w, e.id); return; }   // Besitzer weg (Gast getrennt)
        c = { spieler: alle, besitzer: { pos: b.pos } };
        // Ziel: der nächste Gegner, der den Besitzer bemerkt hat (oder von ihm getroffen wurde), nahe beim Besitzer
        var bz = b.pos, zg = null, zd = 16;
        w.wesen.forEach(function(x){ if(x.art !== "gegner" || !x.bemerkt) return; var d = ring(w, bz, x.pos), l = Math.hypot(d[0], d[2]); if(l < zd && Math.abs(d[1]) < 6){ zd = l; zg = x; } });
        c = { spieler: c.spieler, besitzer: c.besitzer, ziel: zg, werte: { schaden: e.schaden || 1 } };
      }
      SC.KI.tier(w, e, c, dt, zf).forEach(function(a){
        if(a.art === "hieb"){
          var gg = w.wesen.get(a.ziel); if(!gg || gg.art !== "gegner") return;
          var d = ring(w, e.pos, gg.pos), r = s.kampf.trifftGegner(gg, a.schaden, [d[0], 0, d[2]]);
          s._zahl(gg, r.schaden); if(r.besiegt) s.besiege(gg); else s.audio.spiele("treffer");
        } else if(a.art === "schuss") s._spielerSchuss({ pos: a.pos, richtung: a.richtung, tempo: a.tempo, schaden: a.schaden, team: "spieler", art: "laser", lebensdauer: 0.6, farbe: a.farbe, tier: true });
      });
    });
  };
})();
