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
    beiSchwierigkeit: function(n){ if(s.daten) s.daten.schwierigkeit = n; },
    // Gemeinsam spielen
    raumInfo: function(){ return s.raumInfo(); },
    beiEinladen: function(name){ return s.raumOeffnen(name).then(function(c){ if(name) s.speichere("name"); return c; }); },
    beiPvp: function(an){ if(s.raum instanceof SC.Gastgeber) s.raum.setzePvp(an); },
    beiHinauswerfen: function(id){ if(s.raum instanceof SC.Gastgeber) s.raum.hinauswerfen(id); },
    beiBeitreten: function(code, id, name){ return s.beitreten(code, id, name); },
    beiBeitretenAbbrechen: function(){ s.beitretenAbbrechen(); }
  });
  var ui = this.ui;
  this.raumRueckrufe = {
    anfrage: function(info, antwort){ s.eingabe.gebeMausFrei(); ui.zeigeAnfrage(info.name, antwort, info.id); },
    anfrageWeg: function(info){ ui.anfrageWeg(info.id); },
    spieler: function(){ ui.raumAktualisieren(); },
    status: function(st, info){ ui.raumStatus(st, info); },
    pvp: function(an){ ui.hinweis(SC.T.pvp + ": " + (an ? SC.T.an : SC.T.aus), 3000); }
  };
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
SC.Spiel.gastSpeicherIntervall = 5000; // Gast: Figur in die eigene Welt zurückspeichern
SC.Spiel.prototype.rolle = "allein";   // "allein" | "gastgeber" | "gast"
SC.Spiel.prototype.raum = null;        // SC.Gastgeber, SC.Gast oder null
// Netz-Adapter für Räume (in Tests ersetzbar, z. B. durch SC.Netz.speicherNetz().adapter())
SC.Spiel.adapter = function(){ return SC.Netz.peerjs(); };
// Bildrate begrenzen: Bild zur Zeit t fällig, wenn seit dem letzten gezeichneten genug Zeit vergangen ist (2 ms Spielraum für schwankende Bildtakte)
SC.Spiel.bildFaellig = function(t, letzte, max){ return !max || t - letzte >= 1000 / max - 2; };

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

  // chunks (optional): Chunks als Uint8Array je Schlüssel statt der gespeicherten (Gast: vom Gastgeber übertragen)
  SC.Spiel.prototype.starte = function(daten, chunks){
    this._baue(daten, chunks);
    this._anzeigen();
  };

  // Spielzustand ohne Darstellung: Welt, Spieler, Kampf, Gegner
  SC.Spiel.prototype._baue = function(daten, chunks){
    var s = this;
    this.daten = daten;
    var pd = daten.planeten[daten.aktuellerPlanet], planet = new SC.Planet(pd);
    this.welt = new SC.Welt(planet, chunks || SC.Spielstand.chunksLaden(pd));
    this.welt.ereignisse.an("block", function(b){
      if(b.quelle !== "spieler") return;
      if(b.id === SC.B.LUFT) s.audio.spiele("abbauen", { material: SC.Klang.material(b.alt) });
      else s.audio.spiele("setzen", { material: SC.Klang.material(b.id) });
    });
    this._schritt = 0; this._warBoden = true; this._warWasser = false; this._fall = 0; this._musikZeit = 0;
    var sp = daten.spieler, pos = sp.pos || SC.Spiel.startpunkt(planet);
    this.spieler = new SC.Spieler({ id: "ich", pos: pos, blick: sp.blick, modus: daten.modus, schnellleiste: sp.schnellleisteKreativ || sp.schnellleiste, ansicht: sp.ansicht });
    if(!daten.startpunkt) daten.startpunkt = sp.pos ? SC.Spiel.startpunkt(planet) : pos.slice();
    // Fahrzeuge der Welt; der Start-Gleiter wird auch in alten Welten nachgezogen (nicht in der Gastwelt: die Fahrzeuge kommen vom Gastgeber)
    SC.Fahrzeug.ausDaten(this.welt, pd.fahrzeuge);
    if(daten.id !== "gast") SC.Fahrzeug.sichereStart(this.welt, daten.startpunkt);
    this._fzTakt = 0;
    // Survival: Kampfwerte, Rucksack, Gegner
    this._zf = SC.zufall((Date.now() ^ (Math.random() * 4294967296)) >>> 0);
    this.kampf = new SC.Kampf(this.welt, this.spieler, daten, this._zf);
    this.kampf.fahrzeugTreffer = function(menge){ return s._fahrzeugTreffer(menge); };
    this.auftauchen = new SC.Auftauchen(this.welt, daten, this._zf);
    this._besiegtOffen = false; this._ausrKey = null; this._kampfBis = 0; this._bossBis = 0; this.musikKampf = { kampf: false, boss: false };
    this.tageszeit = typeof daten.tageszeit === "number" ? daten.tageszeit : 0.3;
  };

  // Darstellung, Eingabe, Lebenszyklus, automatisches Speichern und Bildschleife
  SC.Spiel.prototype._anzeigen = function(){
    var s = this, daten = this.daten;
    this.zeitTempo = 1; this.entwickler.verberge();
    if(this.render){ this.render.renderer.dispose(); }
    this.render = new SC.Render(this.leinwand, this.welt.planet);
    this.render.sichtweite = this.einstellungen.sichtweite; this.render.aufloesung(this.einstellungen.aufloesung);
    this.render.welt(this.welt);
    if(this.eingabe.touch) this.eingabe.touch.setzeGroesse(this.einstellungen.touchGroesse);
    this.lebenszyklusAnmelden(document);
    clearInterval(this._takt);
    this._takt = setInterval(function(){ s.speichere("auto"); }, this.rolle === "gast" ? SC.Spiel.gastSpeicherIntervall : SC.Spiel.autoSpeicherIntervall);
    this.eingabe.aktiv = true;
    this.eingabe.sperreMaus();
    this._laeuft = true; this._t0 = performance.now();
    if(!daten.spieler.pos) this.speichere("auto");
    requestAnimationFrame(function bild(t){ if(!s._laeuft) return; if(SC.Spiel.bildFaellig(t, s._t0, +s.einstellungen.bildrate)) s._bild(t); requestAnimationFrame(bild); });
  };

  SC.Spiel.prototype._bild = function(t){
    var dt = Math.min(0.1, (t - this._t0) / 1000); this._t0 = t;
    var ui = this.ui, sp = this.spieler, w = this.welt, ew = this.entwickler;
    var offen = ui.offen() || ew.offen();
    this._menueOffen = offen;
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
        var kp = this.kampf, ich = this; this.eingabe.gebeMausFrei();
        ui.zeigeBlockauswahl(function(id){ sp.schnellleiste[sp.auswahl] = id; ui.hinweis(SC.BLOECKE[id].name, 1200); }, {
          ausruestung: true,
          beiFahrzeug: function(art){ var f = ich.fahrzeugHinstellen(art); if(f) ui.hinweis(SC.FAHRZEUGE[art].name, 1500); },
          beiGegenstand: function(art, selt){ var g = SC.Beute.erzeuge(SC.zufall((Math.random() * 4294967296) >>> 0), { stufe: kp.werte.stufe, art: art, mindest: selt }); g.seltenheit = selt; if(kp.rucksack.lege({ gegenstand: g })) ui.hinweis(SC.T.rucksackVoll); else ui.hinweis(g.name + " → " + SC.T.rucksackTitel, 1500); }
        });
      }
      if(e.ansicht) sp.ansicht = sp.ansicht === "ich" ? "aussen" : "ich";
      if(e.benutzen) this.benutzen();
      if(e.auswahl !== null) sp.auswahl = e.auswahl;
      if(e.auswahlRad) sp.auswahl = SC.mod(sp.auswahl + e.auswahlRad, 9);
    }
    var vorBoden = sp.aufBoden, vy = sp.geschw[1];
    if(this._imFahrzeug()) this._fahren(e, dt, offen);
    else { sp.schritt(w, e, dt); this._geraeusche(e, vorBoden, vy, dt); }
    this._fahrzeugeBild(dt);
    this._survival(e, dt, offen, t);
    this._fahrzeugTakt(dt);
    this.tageszeit = SC.mod(this.tageszeit + dt / 1200 * this.zeitTempo, 1);
    if(this.raum) this._raumBild(dt, offen);
    if(ew.offen() && (this._ewZeit = (this._ewZeit || 0) + dt) > 0.25){ this._ewZeit = 0; ew.aktualisiere(); }
    this.render.bild(sp, this.tageszeit, dt);
  };

  // Einmal pro Sekunde (nicht als Gast): Fundort-Fahrzeuge in der Nähe aller Spieler anlegen, verpuffte zurückholen
  SC.Spiel.prototype._fahrzeugTakt = function(dt){
    if(this.rolle === "gast" || (this._fzTakt = (this._fzTakt || 0) + dt) < 1) return;
    this._fzTakt = 0;
    var w = this.welt, r = this.raum, orte = [this.spieler.pos];
    if(r instanceof SC.Gastgeber) r.spieler.forEach(function(e){ if(e.verbunden && e.pos) orte.push(e.pos); });
    orte.forEach(function(p){ SC.Fahrzeug.fundorteNah(w, p); });
    SC.Fahrzeug.wiederkehr(w, this.daten.spielzeit || 0);
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
    if(m === "zuschauer" && this._imFahrzeug && this._imFahrzeug()) this.aussteigen();
    this.spieler.modus = m; this.daten.modus = m;
    this.spieler.fliegt = m === "zuschauer";
  };

  SC.Spiel.prototype._einstellungen = function(e){
    this.einstellungen = e; SC.Einstellungen.speichere(this.ns, e);
    this.eingabe.empfindlichkeit = e.empfindlichkeit;
    if(this.render){ this.render.sichtweite = e.sichtweite; if(this.render.aufloesung) this.render.aufloesung(e.aufloesung); }
    this.audio.lautstaerke(e.musik, e.geraeusche);
  };

  // Speichern nacheinander; ein Fehlschlag zeigt einen Hinweis, das Spiel läuft weiter
  SC.Spiel.prototype.speichere = function(grund){
    var s = this;
    if(!this.daten || !this.welt) return Promise.resolve();
    var gast = this.rolle === "gast";
    if(gast && this._figurWartet) return this._kette; // schon eingereiht: speichert dann den neuesten Stand
    if(gast) this._figurWartet = true;
    this._kette = (this._kette || Promise.resolve()).then(function(){
      if(gast) s._figurWartet = false;
      if(!s.daten || !s.welt) return; // inzwischen verlassen
      if(s.rolle === "gast") return s._figurSpeichern();
      if(s.daten.id === "gast") return; // die Gastwelt wird nie gespeichert
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

  SC.Spiel.herunterladen = herunterladen; // in Tests ersetzbar

  // Als Gast wird statt der Gastwelt die eigene Welt (mit aktueller Figur) exportiert
  SC.Spiel.prototype.exportiere = function(id){
    var s = this, eigen = this.rolle === "gast" && this._eigen && (id === "gast" || id === this._eigen.id);
    var aktuell = !eigen && this.daten && this.daten.id === id && this._laeuft;
    var holen = eigen ? this.speichere("export").then(function(){ return s._eigen; }) : aktuell ? this.speichere("export").then(function(){ return s.daten; }) : this.slots.lade(id);
    return holen.then(function(d){
      return SC.Spielstand.exportiere(d).then(function(blob){
        SC.Spiel.herunterladen(blob, SC.Spielstand.dateiname(d));
        d.zuletztExport = Date.now();
        s.ui.hinweis(SC.T.exportiert + ": " + SC.Spielstand.dateiname(d));
        return s.slots.speichere(d);
      });
    }).catch(function(f){ s.ui.hinweis(f && f.message || SC.T.speichernFehlgeschlagen); });
  };

  // Als Gastgeber: nach dem Speichern den Raum schließen (sendet „ende“); als Gast: Figur speichern und trennen
  SC.Spiel.prototype.verlasse = function(){
    var s = this;
    if(this._verlaesst) return this._verlaesst;
    return this._verlaesst = this.speichere("verlassen").then(function(){
      var r = s.raum;
      if(r instanceof SC.Gastgeber){ s._anfragenSchliessen(); r.schliesse(); } else if(r instanceof SC.Gast) r.trenne();
      s.raum = null; s.rolle = "allein"; s._eigen = null; s._verlaesst = null;
      s._abbauen();
      return s.ui.zeigeWeltliste();
    });
  };
  // Laufendes (oder halb gestartetes) Spiel ohne Speichern abbauen
  SC.Spiel.prototype._abbauen = function(){
    this._wesenRoh = null; this._laeuft = false; clearInterval(this._takt); this.lebenszyklusAbmelden(document);
    this.eingabe.gebeMausFrei(); this.ui.verbergeHud(); this.entwickler.verberge(); this.audio.musikTakt(null, false);
    if(this.render){ this.render.welt(this.welt); this.render.renderer.clear(); }
    this.daten = null; this.welt = null;
  };

  // --- Gemeinsam spielen: Rollen Gastgeber und Gast ---
  // Rückrufe an die Oberfläche (setzt die UI): this.raumRueckrufe = { anfrage(info {id, name}, antwort(ja)), anfrageWeg(info) (Wartender ging
  // oder der Raum wurde geschlossen → Dialog zu), spieler(liste), status(st, info) (Gast: "warte" | "neuverbinden" | "verbunden" | "getrennt"), pvp(an) }
  function rueck(s, name){ var r = s.raumRueckrufe, f = r && r[name]; if(typeof f === "function") return f.apply(null, Array.prototype.slice.call(arguments, 2)); }

  // Laufende Welt als Raum öffnen → Promise<code> ({wort, zahl, text, peerId}); figurName füllt einen leeren Figurnamen
  SC.Spiel.prototype.raumOeffnen = function(figurName){
    var s = this, d = this.daten;
    if(!d || !this.welt || this.rolle === "gast") return Promise.reject(new Error("kein eigenes Spiel"));
    if(this.raum) return Promise.resolve(this.raum.code);
    if(figurName && !d.spieler.name) d.spieler.name = figurName;
    if(!d.startpunkt) d.startpunkt = this.spieler.pos.slice(); // willkommen.pos braucht einen Startpunkt
    this._anfragen = [];
    var gg = new SC.Gastgeber({ adapter: SC.Spiel.adapter(), daten: d, welt: this.welt, uhr: function(){ return s.kampf.uhr; },
      beiAnfrage: function(info, antwort){ s._anfrage(info, antwort); },
      beiAnfrageWeg: function(info){ s._anfrageWeg(info); },
      beiSpieler: function(l){ rueck(s, "spieler", l); s.speichere("mitspieler"); }, // Beitritt und Abgang: speichern (Position der Gastfigur)
      beiNachricht: function(){},
      beiVerpufft: function(f, r){ s._fahrzeugVerpufft(f, r); } });
    gg.bindeKampf(this.kampf, {
      ich: function(){ return s.raumIch(s._menueOffen); },
      beiBeute: function(pos, l){ s.beuteAuswerfen(pos, l.map(function(b){ return { gegenstand: b }; })); },
      besiege: function(g){ s.besiege(g); },
      beiGetroffen: function(g, r){ s._zahl(g, r.schaden); s.audio.spiele("treffer"); },
      beiPvpGetroffen: function(){ s.audio.spiele("getroffen"); },
      beiPvpBesiegt: function(name){ s._pvpBesiegt(name); }
    });
    this.raum = gg; this.rolle = "gastgeber";
    return gg.oeffne().catch(function(f){ if(s.raum === gg){ s.raum = null; s.rolle = "allein"; } throw f; });
  };
  // Beitrittsanfrage: ohne Oberfläche kommt niemand herein; jede Anfrage wird höchstens einmal beantwortet
  SC.Spiel.prototype._anfrage = function(info, antwort){
    var s = this, e = { info: info, offen: true };
    (this._anfragen = this._anfragen || []).push(e);
    function ant(ja){ if(!e.offen) return; e.offen = false; s._anfragen = s._anfragen.filter(function(x){ return x !== e; }); antwort(!!ja); }
    if(!this.raumRueckrufe || typeof this.raumRueckrufe.anfrage !== "function") return ant(false);
    rueck(this, "anfrage", info, ant);
  };
  SC.Spiel.prototype._anfrageWeg = function(info){
    var l = this._anfragen || [], e = null;
    for(var i = 0; i < l.length; i++) if(l[i].offen && l[i].info.id === info.id){ e = l[i]; break; }
    if(!e) return;
    e.offen = false; this._anfragen = l.filter(function(x){ return x !== e; });
    rueck(this, "anfrageWeg", e.info);
  };
  // Raum geht zu: offene Anfragen verfallen, die Oberfläche schließt ihre Dialoge
  SC.Spiel.prototype._anfragenSchliessen = function(){ var s = this; (this._anfragen || []).slice().forEach(function(e){ s._anfrageWeg(e.info); }); this._anfragen = []; };

  // Einem Raum beitreten. eigeneWeltId: Welt, deren Figur mitkommt; null → neue Survival-Welt „<figurName>s Welt“.
  // figurName: Name für die neue Figur bzw. für eine Figur ohne Namen. → Promise (erfüllt nach dem Eintritt, sonst SC.Netz.Fehler)
  // Jeder Versuch hat eine Marke; nach jedem Zwischenschritt wird geprüft, ob abgebrochen wurde. Ein neuer Versuch wartet, bis ein
  // abgebrochener fertig ist; solange einer läuft, wird ein weiterer abgelehnt.
  SC.Spiel.prototype.beitreten = function(code, eigeneWeltId, figurName){
    var s = this, alt = this._beitritt, neueFigur = eigeneWeltId === null || eigeneWeltId === undefined;
    if(this.daten || this.raum && !(alt && alt.abgebrochen)) return Promise.reject(new Error("Spiel läuft noch")); // nur aus der Weltliste
    if(alt && !alt.abgebrochen) return Promise.reject(new Error("Beitritt läuft schon"));
    if(neueFigur && !(figurName && String(figurName).trim())) return Promise.reject(new Error("Neue Figur braucht einen Namen"));
    var v = { abgebrochen: false }; this._beitritt = v;
    function pruefe(){ if(v.abgebrochen) throw new SC.Netz.Fehler("abbruch"); }
    function neu(){ var d = SC.Spielstand.neu({ name: figurName + "s Welt", figurName: figurName, modus: "survival" }); return s.slots.speichere(d).then(function(){ s._neueFigur = { id: d.id, name: figurName }; return d; }); }
    v.p = (alt ? alt.p.then(null, function(){}) : Promise.resolve()).then(function(){
      pruefe();
      if(s.daten || s.raum) throw new Error("Spiel läuft noch");
      if(neueFigur){
        // Nach Abbruch oder Ablehnung gibt es die Welt der neuen Figur schon: wiederverwenden statt eine zweite anzulegen
        var nf = s._neueFigur;
        return nf && nf.name === figurName ? s.slots.lade(nf.id).then(null, neu) : neu();
      }
      return s.slots.lade(eigeneWeltId).then(function(d){
        if(d.spieler.name || !figurName) return d;
        d.spieler.name = figurName; return s.slots.speichere(d).then(function(){ return d; });
      });
    }).then(function(eigen){
      pruefe();
      var chunks = {}, gast = new SC.Gast({ adapter: SC.Spiel.adapter(), figur: SC.Spielstand.figur(eigen),
        beiWillkommen: function(){ chunks = {}; },
        beiChunk: function(k, u8){ chunks[k] = u8; },
        beiBereit: function(){ var c = chunks; chunks = {}; s._gastBereit(gast, c); },
        beiStatus: function(st, info){ s._gastStatus(gast, st, info || {}); },
        beiBlockZurueck: function(x, y, z, id, wunsch){ if(s.raum === gast) s._blockZurueck(id, wunsch); },
        beiNachricht: function(n){ s._gastNachricht(gast, n); },
        beiPvp: function(an){ rueck(s, "pvp", an); } });
      s._eigen = eigen; s.raum = gast; s.rolle = "gast";
      return gast.verbinde(code).catch(function(f){ if(s.raum === gast){ s.raum = null; s.rolle = "allein"; s._eigen = null; } throw f; });
    }).then(function(){ if(s._beitritt === v) s._beitritt = null; s._neueFigur = null; },
      function(f){ if(s._beitritt === v) s._beitritt = null; throw f; });
    return v.p;
  };
  // Für die Oberfläche: Rolle, Code, Spaßkampf, die anderen Spieler (Gastgeber) bzw. Name des Gastgebers (Gast)
  SC.Spiel.prototype.raumInfo = function(){
    var r = this.raum;
    if(r instanceof SC.Gastgeber) return { rolle: "gastgeber", code: r.code ? r.code.text : "", pvp: !!r.pvp, spieler: r.spieler.map(function(e){ return { id: e.id, name: e.name, farbe: e.farbe, verbunden: e.verbunden }; }) };
    if(r instanceof SC.Gast){ var g = r.spieler[0], w = r.willkommen && r.willkommen.welt; return { rolle: "gast", gastgeber: (g && g.name) || (w && w.name) || "", pvp: !!r.pvp, spieler: r.spieler }; }
    return { rolle: "allein" };
  };
  // Warten auf den Gastgeber abbrechen: beitreten wird mit SC.Netz.Fehler("abbruch") abgelehnt
  SC.Spiel.prototype.beitretenAbbrechen = function(){
    if(this.daten) return;
    if(this._beitritt) this._beitritt.abgebrochen = true; // greift auch, solange die eigene Welt noch lädt
    if(this.raum instanceof SC.Gast) this.raum.trenne();
  };
  // bereit: beim ersten Mal Spiel starten (Welt binden, bevor Block-Tatsachen kommen); beim Neuverbinden Welt behalten, nur Chunks übernehmen
  SC.Spiel.prototype._gastBereit = function(gast, chunks){
    var s = this;
    if(this.raum !== gast) return;
    if(this.daten && this.daten.id === "gast" && this.welt){ this._gastWiederkehr(gast, chunks); return; }
    // Scheitert der erste Eintritt, wird das halb gestartete Spiel abgebaut; der Fehler beendet den Beitritt (SC.Gast lehnt ihn ab)
    try{ this._gastErsterEintritt(gast, chunks); }catch(e){ if(this.daten) this._abbauen(); throw e; }
  };
  SC.Spiel.prototype._gastErsterEintritt = function(gast, chunks){
    var s = this;
    var will = gast.willkommen, wk = will;
    if(!will.pos){ wk = {}; for(var x in will) wk[x] = will[x]; wk.pos = will.welt.startpunkt || [0, 0, 0]; }
    var d = SC.Spielstand.gastDaten(wk, SC.Spielstand.figur(this._eigen));
    if(!will.pos && !will.welt.startpunkt) d.spieler.pos = null;
    this.starte(d, chunks);
    if(this.render && this.render.figurFarbe && gast.farbe) this.render.figurFarbe(gast.farbe); // eigene Figur in Raumfarbe (beim Verlassen entsteht mit dem Spielstart ein neues Render)
    gast.bindeWelt(this.welt);
    this._raumModus = d.modus; this._ausrSpeicher = JSON.stringify(this.kampf.ausruestung);
    gast.bindeKampf(this.kampf, {
      beiBeute: function(pos, l){ s.beuteAuswerfen(pos, l.map(function(b){ return { gegenstand: b }; })); },
      beiTreffer: function(r){ s.audio.spiele(r.abgeprallt ? "abprall" : r.schaden > 0 ? "getroffen" : "blocken"); },
      beiBesiegt: function(n, auf){
        if(n.kiste) s.audio.spiele("kiste");
        if(n.erfahrung > 0 && n.pos && s.render && s.render.wesen) s.render.wesen.zahl([n.pos[0], n.pos[1] + 2, n.pos[2]], "+" + n.erfahrung + " EP", "#ffd95c", s.spieler.pos);
        if(auf){ s.audio.spiele("aufstieg"); s.ui.hinweis(SC.T.stufeAuf + " " + SC.T.stufe + " " + s.kampf.werte.stufe, 3000); s.speichere("stufe"); }
      },
      beiPvpBesiegt: function(name){ s._pvpBesiegt(name); }
    });
  };
  // Neuverbinden: Welt behalten, Stand des Gastgebers übernehmen (nicht gesendete Chunks wieder wie erzeugt). Noch offene Wünsche hat der
  // Gastgeber nie bekommen oder abgelehnt (willkommen hat die bestätigten schon gestrichen): vom neuesten rückwärts im Rucksack rückgängig machen.
  SC.Spiel.prototype._gastWiederkehr = function(gast, chunks){
    var w = this.welt, k, s = this, l = [];
    w.geaenderte.forEach(function(c, key){ if(!chunks[key]){ w.geaenderte.delete(key); w.chunks.delete(key); w.neuZuZeichnen.add(key); } });
    for(k in chunks){ w.geaenderte.set(k, chunks[k]); if(w.chunks.has(k)) w.chunks.set(k, chunks[k]); w.neuZuZeichnen.add(k); }
    for(k in gast._wuensche) l.push(gast._wuensche[k]);
    gast._wuensche = {};
    l.sort(function(a, b){ return b.nr - a.nr; }).forEach(function(wu){ s._blockZurueck(null, { id: wu.id, alt: wu.alt }); });
  };
  SC.Spiel.prototype._gastStatus = function(gast, st, info){
    if(this.raum !== gast) return;
    rueck(this, "status", st, info);
    if(st === "neuverbinden") this.ui.hinweis(SC.T.raumNeuverbinden, 4000);
    else if(st === "getrennt" && this.daten) this._gastGetrennt(info);
  };
  // Verbindung endgültig weg: Figur speichern, Meldung, zurück zur Weltliste (die Gastwelt wird nie gespeichert)
  SC.Spiel.prototype._gastGetrennt = function(info){
    var s = this, t = info.grund === "ende" ? SC.T.raumEnde : info.grund === "hinausgeworfen" ? SC.T.raumHinausgeworfen : SC.T.raumVerloren;
    return this.verlasse().then(function(){ s.ui.hinweis(t, 8000); });
  };
  SC.Spiel.prototype._gastNachricht = function(gast, n){
    if(this.raum !== gast) return;
    if(n.t === "zeit"){
      if(typeof n.tageszeit === "number") this.tageszeit = n.tageszeit;
      if(this.daten && n.schwierigkeit) this.daten.schwierigkeit = n.schwierigkeit;
      if(n.modus && n.modus !== this._raumModus && this.spieler){ this._raumModus = n.modus; this.modus(n.modus); } // Modus legt der Gastgeber fest
    } else if(n.t === "spieler") rueck(this, "spieler", gast.spieler);
    else if(n.t === "verpufft" && n.pos && this.render && this.render.wesen){ this.render.wesen.funken([n.pos[0], n.pos[1] + 1, n.pos[2]], "#ffd95c", 30, this.spieler.pos); this.audio.spiele("zerfall");
      var war = this._fzWar; if(war && war.f.id === n.id) this.ui.hinweis(SC.T.fahrzeugVerpufft.replace("{name}", SC.FAHRZEUGE[war.f.art].name), 4000); } // absetzen übernimmt _gastFahrzeuge
  };
  // Gast, Survival: abgelehnter Block-Wunsch zurück in den Rucksack; passt ein gesetzter Block nicht mehr hinein, fliegt er als Kugel heraus
  SC.Spiel.prototype._blockZurueck = function(id, wunsch){
    if(!this.kampf || this.spieler.modus !== "survival") return;
    var B = SC.B, r = SC.Raum.blockZurueck(this.kampf.rucksack, wunsch, id);
    if(wunsch && wunsch.id !== B.LUFT && (wunsch.alt === B.LUFT || wunsch.alt === B.WASSER) && !r.zurueck) this.beuteAuswerfen(this.spieler.pos.slice(), [{ block: wunsch.id, anzahl: 1 }]);
  };
  SC.Spiel.prototype._figurSpeichern = function(){
    var e = this._eigen; if(!e || !this.kampf) return;
    SC.Spielstand.ausSpieler(this.daten, this.spieler, this.kampf);
    this.daten.spieler.schnellleisteKreativ = this.spieler.schnellleiste.slice();
    SC.Spielstand.figurUebernehmen(e, SC.Spielstand.figur(this.daten));
    return this.slots.speichere(e);
  };
  SC.Spiel.prototype._pvpBesiegt = function(name){ this.ui.hinweis(SC.T.pvpBesiegt.replace("{name}", name || ""), 3500); this.audio.spiele("besiegt"); };

  // Pro Bild im Raum: Takt senden, gespiegelte Wesen (Gast), Mitspieler an die Darstellung
  SC.Spiel.prototype._raumBild = function(dt, offen){
    var r = this.raum, ich = this.raumIch(offen);
    if(r instanceof SC.Gastgeber) r.takt(dt, ich);
    else if(r instanceof SC.Gast){
      if(r.wesen !== this._wesenRoh){ var mein = r.figur.figurId; this._wesenRoh = r.wesen; this._wesenListe = (r.wesen || []).filter(function(n){ return !n || n.schuetze !== mein; }); } // eigene Schüsse zeigt der Gast schon selbst
      SC.Raum.spiegleWesen(this.welt, this._wesenListe, dt, this.kampf.uhr);
      this._gastFahrzeuge(r, dt);
      r.takt(dt, ich);
      var a = JSON.stringify(this.kampf.ausruestung);
      if(a !== this._ausrSpeicher){ this._ausrSpeicher = a; this.speichere("ausruestung"); }
    }
    if(this.render && this.render.setzeMitspieler) this.render.setzeMitspieler(this._mitspielerListe());
  };
  // Die anderen Spieler für SC.Render#setzeMitspieler: {id, name, farbe, pos, blick, modus, ausr, lebt, menue, verbunden}
  SC.Spiel.prototype._mitspielerListe = function(){
    var r = this.raum, l = [];
    if(r instanceof SC.Gastgeber) r.spieler.forEach(function(e){ if(e.pos) l.push(e); });
    else if(r instanceof SC.Gast){
      var mein = r.figur.figurId;
      for(var id in r.mitspieler){
        var m = r.mitspieler[id], e = null; if(id === mein || !m.pos) continue;
        r.spieler.forEach(function(x){ if(x.id === id) e = x; });
        l.push({ id: id, name: e ? e.name : "", farbe: e ? e.farbe : SC.RAUM_FARBEN[0], pos: m.pos, blick: m.blick, modus: m.modus, ausr: m.ausr, lebt: m.lebt, menue: m.menue, hieb: m.hieb, blockt: m.blockt, sitzt: m.sitzt, verbunden: true });
      }
    }
    return l;
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
