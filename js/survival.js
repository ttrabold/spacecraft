// Survival im Spiel: Abbauen mit Zeit, Bauen aus dem Rucksack, Kämpfen, Kisten, Beute, Gegner, Besiegt.
// Ergänzt SC.Spiel; wird von SC.Spiel#_bild jedes Bild aufgerufen, wenn der Modus "survival" ist.
(function(){
  var S = SC.Spiel.prototype;

  function ring(welt, a, b){ var P = welt.planet.groesse; return [SC.mod(b[0] - a[0] + P / 2, P) - P / 2, b[1] - a[1], SC.mod(b[2] - a[2] + P / 2, P) - P / 2]; }

  // Abbauen: Fortschritt je Ziel; fertig → Block in den Rucksack (voll → bleibt stehen)
  S.abbauFortschritt = function(ziel, dt){
    var w = this.welt, k = this.kampf, id = w.holeBlock(ziel.x, ziel.y, ziel.z), waffe = k.waffe();
    var schl = ziel.x + "," + ziel.y + "," + ziel.z;
    if(!this._abbau || this._abbau.schl !== schl) this._abbau = { schl: schl, t: 0 };
    var dauer = SC.Abbau.zeit(id, waffe && waffe.art);
    if(!isFinite(dauer)){ this._abbau.t = 0; return false; }
    this._abbau.t += dt;
    if(this._abbau.t + 1e-9 < dauer) return false;
    var gibt = SC.Abbau.ergibt(id);
    if(gibt !== null && k.rucksack.lege({ block: gibt, anzahl: 1 }) > 0){ this.ui.hinweis(SC.T.rucksackVoll, 1500); this._abbau.t = 0; return false; }
    w.setzeBlock(ziel.x, ziel.y, ziel.z, SC.B.LUFT, "spieler");
    this._abbau = null;
    return true;
  };
  S.abbauAnteil = function(ziel){
    if(!ziel || !this._abbau || this._abbau.schl !== ziel.x + "," + ziel.y + "," + ziel.z) return 0;
    var waffe = this.kampf.waffe(), d = SC.Abbau.zeit(this.welt.holeBlock(ziel.x, ziel.y, ziel.z), waffe && waffe.art);
    return isFinite(d) ? Math.min(1, this._abbau.t / d) : 0;
  };

  S.setzeAusRucksack = function(x, y, z){
    var sp = this.spieler, rs = this.kampf.rucksack, s = rs.plaetze[sp.auswahl];
    if(!s || s.block === undefined || !SC.kannSetzen(this.welt, sp, x, y, z)) return false;
    if(!this.welt.setzeBlock(x, y, z, s.block, "spieler")) return false;
    rs.verbrauche(sp.auswahl);
    return true;
  };

  // Gegenstände als Beutekugeln herausspringen lassen
  S.beuteAuswerfen = function(pos, sachen, o){
    var w = this.welt; o = o || {};
    sachen.forEach(function(s, i){
      var win = o.richtung !== undefined ? o.richtung : Math.random() * Math.PI * 2, v = o.weit ? 7 : 2.5;
      SC.Wesen.neu(w, "kugel", { pos: [pos[0], pos[1] + 0.8, pos[2]], geschw: [Math.cos(win) * v, 5 + i * 0.5, Math.sin(win) * v], sache: s, sperre: o.sperre || 0 });
    });
  };

  // Im Raum als Gastgeber würfelt und verteilt SC.Gastgeber#besiege (eigener Anteil über den Rückruf beiBeute)
  S.besiege = function(g){
    var k = this.kampf, gg = this.raum instanceof SC.Gastgeber ? this.raum : null, r = gg ? gg.besiege(g) : k.besiegtGegner(g), def = SC.GEGNER[g.gegnerArt] || {};
    if(!gg) SC.Wesen.entferne(this.welt, g.id);
    if(this.auftauchen) this.auftauchen.gegnerBesiegt(g, this.daten.spielzeit || 0);
    if(this.render){ this.render.wesen.funken(g.pos, def.boss ? "#ffad47" : "#ffd95c", def.boss ? 60 : 24, this.spieler.pos); if(!gg || r.nah) this.render.wesen.zahl([g.pos[0], g.pos[1] + g.hoehe + 0.6, g.pos[2]], "+" + r.erfahrung + " EP", "#ffd95c", this.spieler.pos); }
    this.audio.spiele("zerfall");
    if(!gg) this.beuteAuswerfen(g.pos, r.beute.map(function(b){ return { gegenstand: b }; }));
    if(r.aufstiege){ this.audio.spiele("aufstieg"); this.ui.hinweis(SC.T.stufeAuf + " " + SC.T.stufe + " " + k.werte.stufe, 3000); }
    return r;
  };

  // Eigener Zustand für den Raum (Ziele der Gegner, „in der Nähe“, zustand-Nachricht)
  S.raumIch = function(offen){ var sp = this.spieler, k = this.kampf, surv = sp.modus === "survival";
    return { pos: sp.pos, blick: sp.blick, modus: sp.modus, stufe: k.werte.stufe, ausr: { ruestung: surv ? k.ausruestung : null, waffe: surv ? k.waffe() : null }, menue: !!offen, lebt: !k.besiegt(), hieb: this._hiebN ? { n: this._hiebN, kombo: this._hiebKombo } : undefined, blockt: !!k.blockt, tageszeit: this.tageszeit }; };
  // Gast: Blöcke nur ändern, solange die Verbindung steht (sonst ginge der Wunsch verloren)
  S._blockErlaubt = function(){ return !(this.raum instanceof SC.Gast) || this.raum.status === "verbunden"; };

  // Eigenes Spieler-Geschoss: als Gast nur optisch (der Schuss geht an den Gastgeber), als Gastgeber mit Schütze
  S._spielerSchuss = function(d){
    if(this.raum instanceof SC.Gast){ this.raum.schuss(d); d.optisch = true; }
    else if(this.raum instanceof SC.Gastgeber) d.schuetze = this.daten.spieler.figurId;
    return SC.Wesen.neu(this.welt, "geschoss", d);
  };

  S._survival = function(e, dt, offen, t){
    var s = this, w = this.welt, sp = this.spieler, k = this.kampf, a = this.audio, ein = this.eingabe;
    // Im Raum: Gastgeber rechnet Gegner für alle Spieler, Gast rechnet keine Gegner (gespiegelt) und meldet eigene Angriffe
    var raum = this.raum, gastgeber = raum instanceof SC.Gastgeber ? raum : null, gast = raum instanceof SC.Gast ? raum : null;
    var survival = sp.modus === "survival", lebt = !k.besiegt();
    this.daten.spielzeit = (this.daten.spielzeit || 0) + dt;
    var waffe = survival ? k.waffe() : null, wdef = waffe && SC.GEGENSTAENDE[waffe.art].waffe;
    var ziel = sp.modus === "zuschauer" || !this._blockErlaubt() ? null : SC.zielen(w, sp.augen(), sp.richtung(), 6);
    this.render.markiere(ziel);
    if(survival && !offen && lebt){
      if(e.ausweichen && !sp.fliegt){
        var bw = [(e.rechts ? 1 : 0) - (e.links ? 1 : 0), (e.zurueck ? 1 : 0) - (e.vor ? 1 : 0)], g0 = sp.blick[0];
        var dir = bw[0] || bw[1] ? [Math.cos(g0) * bw[0] + Math.sin(g0) * bw[1], 0, -Math.sin(g0) * bw[0] + Math.cos(g0) * bw[1]] : [-Math.sin(g0), 0, -Math.cos(g0)];
        if(k.ausweichen(t, dir)) a.spiele("springen");
      }
      k.blocken(e.setzenGehalten && wdef && wdef.typ === "schwert"); s.render.blocke(k.blockt);
      // Angreifen bzw. Abbauen
      if(waffe && (e.abbauen || e.abbauenGehalten)){
        var richtung = sp.richtung();
        if(ein.touchAktiv || ein.gamepadAktiv){ var gl = []; w.wesen.forEach(function(x){ if(x.art === "gegner") gl.push({ pos: [sp.pos[0] + ring(w, sp.pos, x.pos)[0], x.pos[1], sp.pos[2] + ring(w, sp.pos, x.pos)[2]], hoehe: x.hoehe }); }); richtung = SC.zielhilfe(sp, gl, richtung, 1); }
        var akt = k.angriff(t, richtung);
        if(akt && akt.art === "schuss"){
          s._spielerSchuss({ pos: akt.pos, richtung: akt.richtung, tempo: akt.tempo, schaden: akt.schaden, team: "spieler", art: "laser", lebensdauer: akt.reichweite / akt.tempo, farbe: akt.farbe, abprall: akt.abprall });
          a.spiele("blaster");
          if(k.ueberhitztBis > t && !this._heiss){ this._heiss = true; a.spiele("ueberhitzt"); s.ui.hinweis(SC.T.ueberhitzt, 1200); }
        } else if(akt && akt.art === "hieb"){
          a.spiele("schwert");
          s._hiebN = (s._hiebN || 0) + 1; s._hiebKombo = akt.faust ? 3 : akt.kombo; s.render.hieb(s._hiebKombo); // sichtbarer Schwung, im Raum als hieb {n, kombo} an die anderen
          // Funkenhieb: der dritte Hieb der Kombo schleudert eine Welle nach vorn
          if(akt.funkenhieb){ var fr = sp.richtung(); s._spielerSchuss({ pos: sp.augen(), richtung: fr, tempo: 22, schaden: akt.schaden, team: "spieler", art: "laser", lebensdauer: 0.8, farbe: SC.RenderWesen.klingenFarbe(waffe.seltenheit) }); }
          var pz = SC.Raum.pvpZiele(raum, raum && !gast ? s.raumIch(offen) : null); // Spaßkampf: Mitspieler im Bogen
          k.hiebZiele(akt, pz).forEach(function(g){ var d = ring(w, sp.pos, g.pos);
            if(g.art === "spieler"){ if(gast) gast.pvpAngriff(g.id, akt.schaden, [d[0], 0, d[2]]); else gastgeber.pvpTrifft(g.id, akt.schaden, [d[0], 0, d[2]], s.daten.spieler.figurId, null); a.spiele("treffer"); return; }
            if(gast){ gast.angriff(g.id, akt.schaden, [d[0], 0, d[2]]); s._zahl(g, akt.schaden); a.spiele("treffer"); return; } // rechnet der Gastgeber
            var r = k.trifftGegner(g, akt.schaden, [d[0], 0, d[2]]); s._zahl(g, r.schaden); if(r.besiegt) s.besiege(g); else a.spiele("treffer"); });
        }
        if(k.ueberhitztBis <= t) this._heiss = false;
        if(wdef.typ === "schwert" && ziel && e.abbauenGehalten) this.abbauFortschritt(ziel, dt);
      } else if(ziel && e.abbauenGehalten) this.abbauFortschritt(ziel, dt);
      else this._abbau = null;
      // Setzen, Kiste öffnen
      if(e.setzen && ziel){
        if(w.holeBlock(ziel.x, ziel.y, ziel.z) === SC.B.KISTE && gast) gast.kiste(ziel.x, ziel.y, ziel.z);
        else if(w.holeBlock(ziel.x, ziel.y, ziel.z) === SC.B.KISTE && gastgeber){ if(gastgeber.oeffneKiste(ziel.x, ziel.y, ziel.z).length) a.spiele("kiste"); }
        else if(w.holeBlock(ziel.x, ziel.y, ziel.z) === SC.B.KISTE){
          var bw2 = SC.Kampf.bauwerkZuKiste(w, ziel.x, ziel.y, ziel.z), beute = SC.Kampf.oeffneKiste(w, k, ziel.x, ziel.y, ziel.z, bw2, SC.zufall((Math.random() * 4294967296) >>> 0));
          if(beute.length){ a.spiele("kiste"); this.beuteAuswerfen([ziel.x + 0.5, ziel.y + 0.5, ziel.z + 0.5], beute.map(function(b){ return { gegenstand: b }; })); }
        } else if(!(wdef && wdef.typ === "schwert")) this.setzeAusRucksack(ziel.x + ziel.nx, ziel.y + ziel.ny, ziel.z + ziel.nz);
      }
    } else if(!survival && ziel && !offen){
      // Kreativ: sofort abbauen, Blöcke aus der Leiste setzen
      if(e.abbauen && SC.BLOECKE[w.holeBlock(ziel.x, ziel.y, ziel.z)].zerstoerbar) w.setzeBlock(ziel.x, ziel.y, ziel.z, SC.B.LUFT, "spieler");
      else if(e.setzen){ var x = ziel.x + ziel.nx, y = ziel.y + ziel.ny, z = ziel.z + ziel.nz; if(SC.kannSetzen(w, sp, x, y, z)) w.setzeBlock(x, y, z, sp.schnellleiste[sp.auswahl], "spieler"); }
    }
    if(!(survival && !offen && lebt)){ k.blocken(false); this.render.blocke(false); } // Blockhaltung löst sich bei Menü oder Niederlage
    this.render.wesen.risse(survival ? ziel : null, survival ? this.abbauAnteil(ziel) : 0, sp.pos);

    // Ist ein Menü offen, steht die Welt still (Gegner, Geschosse, Beute, Erholung) – im Raum läuft sie weiter
    if(offen){ this.render.wesen.risse(null, 0, sp.pos); if(!raum){ this._hudSurvival(survival, waffe, wdef); return; } }
    // Gegner, Geschosse, Beutekugeln
    var zf = this._zf, schw = this.daten.schwierigkeit, zielSp = survival && lebt ? { pos: sp.pos, sichtbar: true } : null, kampfNah = false, bossNah = false;
    var ziele = gastgeber ? SC.Raum.mitspielerZiele(gastgeber, this.raumIch(offen)) : null, tz = ziele && SC.Raum.trefferZiele(ziele);
    w.wesen.forEach(function(g){
      if(g.art === "gegner"){
        if(!gast){
          if(g.entfernen){ s.auftauchen._entferne(g, false); s.auftauchen.gegnerBesiegt(g, s.daten.spielzeit || 0); return; }
          SC.KI.schritt(w, g, ziele ? SC.Raum.zielFuer(w, g, ziele) : zielSp, dt, zf, schw).forEach(function(akt){
            if(akt.art === "schuss"){ SC.Wesen.neu(w, "geschoss", { pos: akt.pos, richtung: akt.richtung, tempo: akt.tempo, schaden: akt.schaden, team: "gegner", art: akt.geschossArt, lebensdauer: 3, farbe: akt.farbe }); a.spiele(akt.geschossArt === "spucke" ? "spucker" : "blaster"); }
            else { var r = gastgeber ? gastgeber.gegnerAktion(g, akt, ziele) : k.gegnerAktion(g, akt); if(r && r.schaden > 0) a.spiele("getroffen"); else if(r && r.abgeprallt) a.spiele("blocken"); }
          });
        }
        if(g.bemerkt){ var dd = ring(w, sp.pos, g.pos); if(Math.hypot(dd[0], dd[2]) < 32){ kampfNah = true; if(g.boss) bossNah = true; } }
        var def = SC.GEGNER[g.gegnerArt];
        if(def && def.laut && g.bemerkt && Math.random() < dt * 0.4) a.spiele(def.laut);
      } else if(g.art === "geschoss"){
        if(gast && SC.Raum.istGespiegelt(g)) return; // Geschosse des Gastgebers nur gespiegelt
        var r2 = SC.Geschoss.schritt(w, g, dt, g.optisch ? null : tz ? (g.team === "spieler" && !gastgeber.pvp ? null : tz) : survival && lebt ? sp : null);
        if(!r2) return;
        if(r2.treffer === "wesen" && g.optisch){ SC.Wesen.entferne(w, g.id); return; } // optisch: verschwindet am Gegner
        if(r2.treffer === "wesen"){
          var ziel2 = w.wesen.get(r2.id), tg = k.trifftGegner(ziel2, g.schaden, g.geschw || g.richtung, g);
          if(tg.abgeprallt){ g.team = "gegner"; g.geschw = [-g.geschw[0], -g.geschw[1], -g.geschw[2]]; g.lebensdauer = 2; a.spiele("abprall"); return; }
          s._zahl(ziel2, tg.schaden); if(tg.besiegt) s.besiege(ziel2); else a.spiele("treffer");
        } else if(r2.treffer === "spieler"){
          var ts = gastgeber && g.team === "spieler" ? gastgeber.pvpTrifft(r2.id, g.schaden, g.geschw || g.richtung, g.schuetze, g) : gastgeber ? gastgeber.geschossTrifft(g, r2.id) : k.trifftSpieler(g.schaden, g.geschw || g.richtung, g);
          if(ts) a.spiele(ts.abgeprallt ? "abprall" : ts.schaden > 0 ? "getroffen" : "blocken");
        } else if(r2.treffer === "block" && g.abprall && !g.abgeprallt){
          // Abprall-Schüsse prallen einmal von der Wand ab
          var gv = g.geschw, m = Math.abs(gv[0]) > Math.abs(gv[1]) ? (Math.abs(gv[0]) > Math.abs(gv[2]) ? 0 : 2) : (Math.abs(gv[1]) > Math.abs(gv[2]) ? 1 : 2);
          gv[m] = -gv[m]; g.abgeprallt = true; return;
        }
        SC.Wesen.entferne(w, g.id);
      } else if(g.art === "kugel" && survival){
        var sache = g.sache, erg = SC.Kugel.schritt(w, g, sp, k.rucksack, dt);
        if(erg === "voll" && t - (s._vollHinweis || 0) > 3000){ s._vollHinweis = t; s.ui.hinweis(SC.T.rucksackVoll, 1500); }
        if(erg === "aufgesammelt"){ a.spiele("aufsammeln", { seltenheit: sache.gegenstand ? sache.gegenstand.seltenheit : 0 }); if(sache.gegenstand) s.ui.hinweis(sache.gegenstand.name, 2000); if(gast) s.speichere("fund"); }
      }
    });
    k.schritt(t, dt);
    if(!gast && (this._auftZeit = (this._auftZeit || 0) + dt) >= 1){
      this._auftZeit = 0;
      var h = SC.himmelsFarben(SC.PALETTEN[w.planet.palette] || SC.PALETTEN.start, this.tageszeit);
      this.auftauchen.schritt(ziele || sp, h.tageslicht, this.daten.spielzeit);
      this.auftauchen.zerfallen.forEach(function(z){ s.render.wesen.funken(z.pos, "#b9c2cc", 14, sp.pos); }); this.auftauchen.zerfallen = [];
    }
    if(kampfNah) this._kampfBis = t + 8000;
    if(bossNah) this._bossBis = t + 8000;
    this.musikKampf = { kampf: t < (this._kampfBis || 0), boss: t < (this._bossBis || 0) };
    // Besiegt
    if(survival && k.besiegt() && !this._besiegtOffen){
      this._besiegtOffen = true; a.spiele("besiegt"); this.eingabe.gebeMausFrei();
      this.ui.zeigeBesiegt(function(){ k.wiederbeleben(s.daten.startpunkt || SC.Spiel.startpunkt(w.planet)); s._besiegtOffen = false; s._weiter(); });
    }
    this._hudSurvival(survival, waffe, wdef);
  };

  // Ausrüstung an der Figur, HUD, Touch-Beschriftung
  S._hudSurvival = function(survival, waffe, wdef){
    var sp = this.spieler, k = this.kampf, ein = this.eingabe;
    var aKey = JSON.stringify([k.ausruestung, waffe && waffe.id]);
    if(aKey !== this._ausrKey){ this._ausrKey = aKey; this.render.ausruestung(survival ? k.ausruestung : null, waffe); }
    if(ein.touch) ein.touch.beschrifte({ angriff: !!waffe, blocken: !!(wdef && wdef.typ === "schwert"), ausweichen: survival });
    var ui = this.ui;
    ui.hud(sp, { fps: this.render.fps, fpsAnzeigen: this.einstellungen.fpsAnzeigen, leiste: survival ? k.rucksack.plaetze.slice(0, 9) : null });
    ui.kampfHud(survival ? k : null, []);
  };

  S._zahl = function(g, schaden){ if(this.render && g && schaden > 0) this.render.wesen.zahl([g.pos[0], g.pos[1] + g.hoehe + 0.3, g.pos[2]], String(Math.round(schaden)), "#ffffff", this.spieler.pos); };
})();
