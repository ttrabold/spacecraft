// Spiel: verbindet Welt, Spieler, Darstellung, Eingabe und Oberfläche; speichert automatisch
SC.Spiel = function(o){
  var s = this;
  this.leinwand = o.leinwand; this.slots = o.slots; this.ns = o.ns || "lokal";
  this.einstellungen = SC.Einstellungen.lade(this.ns);
  this.ui = new SC.UI(o.uiWurzel, {
    slots: o.slots, einstellungen: this.einstellungen,
    beiStart: function(d){ s.starte(d); },
    beiExport: function(id){ return s.exportiere(id); },
    beiWeiter: function(){ s._weiter(); },
    beiModus: function(m){ s.modus(m); },
    beiVerlassen: function(){ return s.verlasse(); },
    beiEinstellungen: function(e){ s._einstellungen(e); },
    beiEntwickler: function(){ s._entwicklerAuf(); },
    beiSchwierigkeit: function(n){ if(s.daten) s.daten.schwierigkeit = n; }
  });
  this.eingabe = new SC.Eingabe(o.leinwand, o.uiWurzel);
  this.eingabe.empfindlichkeit = this.einstellungen.empfindlichkeit;
  this.audio = new SC.Audio();
  this.audio.lautstaerke(this.einstellungen.musik, this.einstellungen.geraeusche);
  // Audio darf erst nach einer Nutzeraktion starten (iOS); Menü-Klicks klicken hörbar
  var entsperren = function(){ s.audio.entsperren(); };
  ["pointerdown", "touchend", "keydown"].forEach(function(n){ window.addEventListener(n, entsperren, true); });
  o.uiWurzel.addEventListener("click", function(ev){ if(ev.target.closest && ev.target.closest("button")) s.audio.spiele("klick"); }, true);
  this.zeitTempo = 1;
  this.entwickler = new SC.Entwickler.Panel(o.uiWurzel, this);
  this.beiEntwicklerZu = function(){ s.eingabe.aktiv = true; s.eingabe.sperreMaus(); };
  // Gamepad in Menüs und in der Weltliste: eigene Schleife, läuft auch ohne Spiel
  window.addEventListener("gamepadconnected", function(){ s.ui.hinweis(SC.T.controllerVerbunden, 2500); });
  (function menueSchleife(){
    var ui = s.ui, imMenue = !s._laeuft || ui.offen() || s.entwickler.offen();
    if(imMenue){
      var r = s.eingabe.menueGamepad();
      if(r === "ok") ui.bestaetige(); else if(r === "zurueck") ui.zurueck(); else if(r) ui.navigiere(r);
    }
    requestAnimationFrame(menueSchleife);
  })();
  this._kette = Promise.resolve();
};

SC.Spiel.autoSpeicherIntervall = 30000;

// Startpunkt neuer Welten: Spalte über Land, spiralförmig um die Planetenmitte gesucht
SC.Spiel.startpunkt = function(planet){
  var g = new SC.Generator(planet), m = planet.groesse / 2, chunks = {};
  // Tatsächliche Blöcke prüfen: fester Boden, darüber zwei freie Blöcke (kein Baum, keine Wand)
  function block(x, y, z){ var k = (x >> 4) + "," + (z >> 4); var c = chunks[k] || (chunks[k] = g.chunk(x >> 4, z >> 4)); return SC.BLOECKE[c[SC.idx(x & 15, y, z & 15)]]; }
  for(var r = 0; r < 400; r += 4){
    var schritte = Math.max(1, r * 2);
    for(var i = 0; i < schritte; i++){
      var w = i / schritte * Math.PI * 2, x = SC.mod(Math.floor(m + Math.cos(w) * r), planet.groesse), z = SC.mod(Math.floor(m + Math.sin(w) * r), planet.groesse), b = g.biom(x, z), h = g.hoehe(x, z);
      if(h <= SC.MEER + 1 || b === "see" || b === "strand" || b === "berge" || h + 2 >= SC.CHUNK.H) continue;
      if(block(x, h, z).fest && !block(x, h + 1, z).fest && !block(x, h + 2, z).fest && block(x, h + 1, z).id !== SC.B.WASSER) return [x + 0.5, h + 1, z + 0.5];
    }
  }
  return [m + 0.5, g.hoehe(m, m) + 1, m + 0.5];
};

(function(){
  SC.Spiel.prototype.lebenszyklusAnmelden = function(doc){
    var s = this;
    this._lz = {
      sicht: function(){ if(doc.visibilityState === "hidden") s.speichere("verbergen"); },
      weg: function(){ s.speichere("verbergen"); }
    };
    doc.addEventListener("visibilitychange", this._lz.sicht);
    window.addEventListener("pagehide", this._lz.weg);
  };
  SC.Spiel.prototype.lebenszyklusAbmelden = function(doc){
    if(!this._lz) return;
    doc.removeEventListener("visibilitychange", this._lz.sicht);
    window.removeEventListener("pagehide", this._lz.weg);
    this._lz = null;
  };

  SC.Spiel.prototype.starte = function(daten){
    var s = this;
    this.daten = daten;
    var pd = daten.planeten[daten.aktuellerPlanet], planet = new SC.Planet(pd);
    this.welt = new SC.Welt(planet, SC.Spielstand.chunksLaden(pd));
    this.welt.ereignisse.an("block", function(b){
      if(b.quelle !== "spieler") return;
      if(b.id === SC.B.LUFT) s.audio.spiele("abbauen", { material: SC.Klang.material(b.alt) });
      else s.audio.spiele("setzen", { material: SC.Klang.material(b.id) });
    });
    this._schritt = 0; this._warBoden = true; this._warWasser = false; this._fall = 0; this._musikZeit = 0;
    var sp = daten.spieler, pos = sp.pos || SC.Spiel.startpunkt(planet);
    this.spieler = new SC.Spieler({ id: "ich", pos: pos, blick: sp.blick, modus: daten.modus, schnellleiste: sp.schnellleisteKreativ || sp.schnellleiste, ansicht: sp.ansicht });
    if(!daten.startpunkt) daten.startpunkt = sp.pos ? SC.Spiel.startpunkt(planet) : pos.slice();
    // Survival: Kampfwerte, Rucksack, Gegner
    this._zf = SC.zufall((Date.now() ^ (Math.random() * 4294967296)) >>> 0);
    this.kampf = new SC.Kampf(this.welt, this.spieler, daten, this._zf);
    this.auftauchen = new SC.Auftauchen(this.welt, daten, this._zf);
    this._besiegtOffen = false; this._ausrKey = null; this._kampfBis = 0; this._bossBis = 0; this.musikKampf = { kampf: false, boss: false };
    this.tageszeit = typeof daten.tageszeit === "number" ? daten.tageszeit : 0.3;
    this.zeitTempo = 1; this.entwickler.verberge();
    if(this.render){ this.render.renderer.dispose(); }
    this.render = new SC.Render(this.leinwand, planet);
    this.render.sichtweite = this.einstellungen.sichtweite;
    this.render.welt(this.welt);
    if(this.eingabe.touch) this.eingabe.touch.setzeGroesse(this.einstellungen.touchGroesse);
    this.lebenszyklusAnmelden(document);
    clearInterval(this._takt);
    this._takt = setInterval(function(){ s.speichere("auto"); }, SC.Spiel.autoSpeicherIntervall);
    this.eingabe.aktiv = true;
    this.eingabe.sperreMaus();
    this._laeuft = true; this._t0 = performance.now();
    if(!daten.spieler.pos) this.speichere("auto");
    requestAnimationFrame(function bild(t){ if(!s._laeuft) return; s._bild(t); requestAnimationFrame(bild); });
  };

  SC.Spiel.prototype._bild = function(t){
    var dt = Math.min(0.1, (t - this._t0) / 1000); this._t0 = t;
    var ui = this.ui, sp = this.spieler, w = this.welt, ew = this.entwickler;
    var offen = ui.offen() || ew.offen();
    this.eingabe.aktiv = !offen;
    if(this.eingabe.touch){ this.eingabe.touch.sichtbar(!offen); this.eingabe.touch.setzeGroesse(this.einstellungen.touchGroesse); }
    var e = this.eingabe.zustand();
    // F3 öffnet und schließt die Entwicklerwerkzeuge (nur wenn in den Einstellungen eingeschaltet)
    if(e.entwickler && this.einstellungen.entwickler && !ui.offen()){
      if(ew.offen()){ ew.verberge(); this.beiEntwicklerZu(); } else this._entwicklerAuf();
      return;
    }
    if(!offen){
      sp.blick[0] += e.blickDx; sp.blick[1] = Math.max(-1.55, Math.min(1.55, sp.blick[1] + e.blickDy));
      if(e.menue){ this.pause(); return; }
      if(e.blockauswahl && sp.modus === "survival"){ this.eingabe.gebeMausFrei(); this.zeigeRucksack(); }
      else if(e.blockauswahl && sp.modus !== "zuschauer"){
        var kp = this.kampf; this.eingabe.gebeMausFrei();
        ui.zeigeBlockauswahl(function(id){ sp.schnellleiste[sp.auswahl] = id; ui.hinweis(SC.BLOECKE[id].name, 1200); }, {
          ausruestung: true,
          beiGegenstand: function(art, selt){ var g = SC.Beute.erzeuge(SC.zufall((Math.random() * 4294967296) >>> 0), { stufe: kp.werte.stufe, art: art, mindest: selt }); g.seltenheit = selt; if(kp.rucksack.lege({ gegenstand: g })) ui.hinweis(SC.T.rucksackVoll); else ui.hinweis(g.name + " → " + SC.T.rucksackTitel, 1500); }
        });
      }
      if(e.ansicht) sp.ansicht = sp.ansicht === "ich" ? "aussen" : "ich";
      if(e.auswahl !== null) sp.auswahl = e.auswahl;
      if(e.auswahlRad) sp.auswahl = SC.mod(sp.auswahl + e.auswahlRad, 9);
    }
    var vorBoden = sp.aufBoden, vy = sp.geschw[1];
    sp.schritt(w, e, dt);
    this._geraeusche(e, vorBoden, vy, dt);
    this._survival(e, dt, offen, t);
    this.tageszeit = SC.mod(this.tageszeit + dt / 1200 * this.zeitTempo, 1);
    if(ew.offen() && (this._ewZeit = (this._ewZeit || 0) + dt) > 0.25){ this._ewZeit = 0; ew.aktualisiere(); }
    this.render.bild(sp, this.tageszeit, dt);
  };

  SC.Spiel.prototype.zeigeRucksack = function(){
    var s = this;
    this.ui.zeigeRucksack(this.kampf, {
      beiWegwerfen: function(sache){ if(sache) s.beuteAuswerfen([s.spieler.pos[0] - Math.sin(s.spieler.blick[0]) * 1.5, s.spieler.pos[1], s.spieler.pos[2] - Math.cos(s.spieler.blick[0]) * 1.5], [sache], { sperre: 4, weit: true, richtung: Math.atan2(-Math.cos(s.spieler.blick[0]), -Math.sin(s.spieler.blick[0])) }); },
      beiFertig: function(){ s._weiter(); }
    });
  };

  // Schritte, Springen, Landen, Wasser; Musik nach Stimmung (Tag, Nacht, unter Tage)
  SC.Spiel.prototype._geraeusche = function(e, vorBoden, vy, dt){
    var sp = this.spieler, w = this.welt, a = this.audio, zus = sp.modus === "zuschauer";
    if(!zus){
      var tempo = Math.hypot(sp.geschw[0], sp.geschw[2]);
      if(sp.aufBoden && tempo > 1){
        this._schritt += dt * tempo;
        if(this._schritt > 1.8){ this._schritt = 0; a.spiele("schritt", { material: SC.Klang.material(w.holeBlock(sp.pos[0], sp.pos[1] - 0.5, sp.pos[2])) }); }
      }
      if(vorBoden && !sp.aufBoden && e.springen && sp.geschw[1] > 0) a.spiele("springen");
      if(!vorBoden && sp.aufBoden && vy < -6) a.spiele("landen");
      if(sp.imWasser && !this._warWasser) a.spiele("platsch");
    }
    this._warWasser = sp.imWasser;
    if((this._musikZeit += dt) > 0.5){
      this._musikZeit = 0;
      var h = SC.himmelsFarben(SC.PALETTEN[w.planet.palette] || SC.PALETTEN.start, this.tageszeit);
      var unter = sp.pos[1] < w.generator.hoehe(sp.pos[0], sp.pos[2]) - 6;
      var mk = this.musikKampf || {};
      a.musikTakt(SC.Musik.stimmung({ tageslicht: h.tageslicht, unterTage: unter, kampf: mk.kampf, boss: mk.boss }), true);
    }
  };

  SC.Spiel.prototype._entwicklerAuf = function(){ this.eingabe.gebeMausFrei(); this.eingabe.aktiv = false; this.entwickler.zeige(); };

  SC.Spiel.prototype.pause = function(){
    this.eingabe.gebeMausFrei();
    this.daten.modus = this.spieler.modus;
    this.ui.zeigePause(this.daten);
    this.speichere("pause");
  };
  SC.Spiel.prototype._weiter = function(){ this.ui.schliesse(); this.eingabe.aktiv = true; this.eingabe.sperreMaus(); };

  SC.Spiel.prototype.modus = function(m){
    this.spieler.modus = m; this.daten.modus = m;
    this.spieler.fliegt = m === "zuschauer";
  };

  SC.Spiel.prototype._einstellungen = function(e){
    this.einstellungen = e; SC.Einstellungen.speichere(this.ns, e);
    this.eingabe.empfindlichkeit = e.empfindlichkeit;
    if(this.render) this.render.sichtweite = e.sichtweite;
    this.audio.lautstaerke(e.musik, e.geraeusche);
  };

  // Speichern nacheinander; ein Fehlschlag zeigt einen Hinweis, das Spiel läuft weiter
  SC.Spiel.prototype.speichere = function(grund){
    var s = this;
    if(!this.daten || !this.welt) return Promise.resolve();
    this._kette = (this._kette || Promise.resolve()).then(function(){
      SC.Spielstand.ausWelt(s.daten, s.welt, s.spieler, s.kampf);
      s.daten.spieler.schnellleisteKreativ = s.spieler.schnellleiste.slice();
      s.daten.tageszeit = s.tageszeit;
      return s.slots.speichere(s.daten);
    }).catch(function(){ s.ui.hinweis(SC.T.speichernFehlgeschlagen, 6000); });
    return this._kette;
  };

  function herunterladen(blob, name){
    var url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 10000);
  }

  SC.Spiel.prototype.exportiere = function(id){
    var s = this, aktuell = this.daten && this.daten.id === id && this._laeuft;
    var holen = aktuell ? this.speichere("export").then(function(){ return s.daten; }) : this.slots.lade(id);
    return holen.then(function(d){
      return SC.Spielstand.exportiere(d).then(function(blob){
        herunterladen(blob, SC.Spielstand.dateiname(d));
        d.zuletztExport = Date.now();
        s.ui.hinweis(SC.T.exportiert + ": " + SC.Spielstand.dateiname(d));
        return s.slots.speichere(d);
      });
    }).catch(function(f){ s.ui.hinweis(f && f.message || SC.T.speichernFehlgeschlagen); });
  };

  SC.Spiel.prototype.verlasse = function(){
    var s = this;
    return this.speichere("verlassen").then(function(){
      s._laeuft = false; clearInterval(s._takt); s.lebenszyklusAbmelden(document);
      s.eingabe.gebeMausFrei(); s.ui.verbergeHud(); s.entwickler.verberge(); s.audio.musikTakt(null, false);
      if(s.render){ s.render.welt(s.welt); s.render.renderer.clear(); }
      s.daten = null; s.welt = null;
      return s.ui.zeigeWeltliste();
    });
  };

  // Start beim Laden (nicht auf der Testseite)
  SC.starteSpiel = function(){
    var ns = SC.namensraum(location);
    return SC.Speicher.backend(ns).then(function(b){
      var spiel = new SC.Spiel({ leinwand: document.getElementById("leinwand"), uiWurzel: document.getElementById("ui"), slots: new SC.Slots(b), ns: ns });
      SC.spiel = spiel;
      SC.Speicher.dauerhaftAnfragen();
      return spiel.ui.zeigeWeltliste().then(function(){ spiel.ui.startHinweise(b.art, ns); });
    });
  };
  if(!window.SC_TEST) window.addEventListener("load", SC.starteSpiel);
})();
