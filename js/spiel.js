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
    beiEinstellungen: function(e){ s._einstellungen(e); }
  });
  this.eingabe = new SC.Eingabe(o.leinwand, o.uiWurzel);
  this.eingabe.empfindlichkeit = this.einstellungen.empfindlichkeit;
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
    var sp = daten.spieler, pos = sp.pos || SC.Spiel.startpunkt(planet);
    this.spieler = new SC.Spieler({ id: "ich", pos: pos, blick: sp.blick, modus: daten.modus, schnellleiste: sp.schnellleiste, ansicht: sp.ansicht });
    this.tageszeit = typeof daten.tageszeit === "number" ? daten.tageszeit : 0.3;
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
    var ui = this.ui, sp = this.spieler, w = this.welt, offen = ui.offen();
    this.eingabe.aktiv = !offen;
    if(this.eingabe.touch){ this.eingabe.touch.sichtbar(!offen); this.eingabe.touch.setzeGroesse(this.einstellungen.touchGroesse); }
    var e = this.eingabe.zustand();
    if(!offen){
      sp.blick[0] += e.blickDx; sp.blick[1] = Math.max(-1.55, Math.min(1.55, sp.blick[1] + e.blickDy));
      if(e.menue){ this.pause(); return; }
      if(e.blockauswahl && sp.modus !== "zuschauer"){ this.eingabe.gebeMausFrei(); ui.zeigeBlockauswahl(function(id){ sp.schnellleiste[sp.auswahl] = id; ui.hinweis(SC.BLOECKE[id].name, 1200); }); }
      if(e.ansicht) sp.ansicht = sp.ansicht === "ich" ? "aussen" : "ich";
      if(e.auswahl !== null) sp.auswahl = e.auswahl;
      if(e.auswahlRad) sp.auswahl = SC.mod(sp.auswahl + e.auswahlRad, 9);
    }
    sp.schritt(w, e, dt);
    var ziel = sp.modus === "zuschauer" ? null : SC.zielen(w, sp.augen(), sp.richtung(), 6);
    this.render.markiere(ziel);
    if(ziel && !offen){
      if(e.abbauen && SC.BLOECKE[w.holeBlock(ziel.x, ziel.y, ziel.z)].zerstoerbar) w.setzeBlock(ziel.x, ziel.y, ziel.z, SC.B.LUFT, "spieler");
      else if(e.setzen){
        var x = ziel.x + ziel.nx, y = ziel.y + ziel.ny, z = ziel.z + ziel.nz;
        if(SC.kannSetzen(w, sp, x, y, z)) w.setzeBlock(x, y, z, sp.schnellleiste[sp.auswahl], "spieler");
      }
    }
    this.tageszeit = (this.tageszeit + dt / 1200) % 1;
    this.render.bild(sp, this.tageszeit, dt);
    ui.hud(sp, { fps: this.render.fps, fpsAnzeigen: this.einstellungen.fpsAnzeigen });
  };

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
  };

  // Speichern nacheinander; ein Fehlschlag zeigt einen Hinweis, das Spiel läuft weiter
  SC.Spiel.prototype.speichere = function(grund){
    var s = this;
    if(!this.daten || !this.welt) return Promise.resolve();
    this._kette = (this._kette || Promise.resolve()).then(function(){
      SC.Spielstand.ausWelt(s.daten, s.welt, s.spieler);
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
      s.eingabe.gebeMausFrei(); s.ui.verbergeHud();
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
