// Auftauchen: Gegner an den Plätzen der Bauwerke, nachts an der Oberfläche; Verschwinden und Obergrenzen.
// Einmal pro Sekunde aufrufen. Entfernte Gegner landen in this.zerfallen (für Funken in der Darstellung).
SC.Auftauchen = function(welt, daten, zf){
  this.welt = welt; this.daten = daten; this.zf = zf;
  this.platzGegner = {};      // "<schluessel>#<i>" → Gegner-ID
  this.besiegt = {};          // "<schluessel>" → { "<i>": true }
  this.plaetze = {};          // "<schluessel>" → Zahl der Plätze mit Gegnern
  this.zerfallen = [];
};

(function(){
  var NAH = 40, WEG = 80, NACHT = 0.55;
  var ARTEN = { station: ["patrouillendroide"], lager: ["weltraumbandit"], herrenhaus: ["weltraumbandit", "patrouillendroide"], dungeon: ["krabbler", "spucker"] };
  var A = SC.Auftauchen.prototype;

  function ring(welt, a, x, z){ var P = welt.planet.groesse; return [SC.mod(x - a[0] + P / 2, P) - P / 2, SC.mod(z - a[2] + P / 2, P) - P / 2]; }
  function planet(a){ return a.daten.planeten[a.welt.planet.id]; }

  A._entferne = function(e, funken){
    SC.Wesen.entferne(this.welt, e.id);
    if(e.platzKey && this.platzGegner[e.platzKey] === e.id) delete this.platzGegner[e.platzKey];
    if(funken) this.zerfallen.push({ pos: e.pos.slice(), art: e.gegnerArt });
  };

  A._neu = function(art, stufe, pos, extra){
    var def = SC.GEGNER[art];
    var d = { gegnerArt: art, stufe: stufe, pos: pos, heim: pos.slice(), lp: def.lp(stufe), lpMax: def.lp(stufe), breite: def.breite, hoehe: def.hoehe, boss: !!def.boss };
    for(var k in extra) d[k] = extra[k];
    return SC.Wesen.neu(this.welt, "gegner", d);
  };

  // spieler: eine Figur oder (im Raum) ein Array [{id, pos, blick, modus, stufe}] aller Spieler
  A.schritt = function(spieler, tageslicht, spielzeit){
    var a = this, w = this.welt, schw = SC.SCHWIERIGKEIT[this.daten.schwierigkeit] || SC.SCHWIERIGKEIT.normal, zf = this.zf;
    var mehr = Array.isArray(spieler), alle = mehr ? spieler : [spieler];
    // Friedlich: alle weg
    if(!schw.gegner){ w.wesen.forEach(function(e){ if(e.art === "gegner") a._entferne(e, true); }); return; }
    // Weit weg (von allen Spielern), morgens oder feststeckend: entfernen
    w.wesen.forEach(function(e){
      if(e.art !== "gegner") return;
      var weit = alle.every(function(sp){ var d = ring(w, sp.pos, e.pos[0], e.pos[2]); return Math.hypot(d[0], d[1]) > WEG; });
      if(weit) a._entferne(e, false);
      else if(e.nacht && tageslicht >= NACHT) a._entferne(e, true);
      else if(e.entfernen){ a._entferne(e, false); a.gegnerBesiegt(e, spielzeit); }
    });
    // Bauwerke wachen bei jedem Spieler auf (außer Zuschauern)
    alle.forEach(function(sp){ if(sp.modus !== "zuschauer") a._bauwerke(sp, spielzeit, schw); });
    // Nachts an der Oberfläche (nur Survival), um zufällig gewählte Survival-Spieler, gemeinsame Obergrenze
    var surv = alle.filter(function(sp){ return sp.modus === "survival"; });
    if(!surv.length || tageslicht >= NACHT) return;
    var nacht = 0; w.wesen.forEach(function(e){ if(e.nacht) nacht++; });
    for(var v = 0; v < 3 && nacht < schw.nachtMax; v++){
      var sp = surv.length === 1 ? surv[0] : surv[Math.floor(zf() * surv.length)];
      var blick = [-Math.sin(sp.blick[0]), -Math.cos(sp.blick[0])], ss = (mehr ? sp.stufe : this.daten.spieler.stufe) || 1;
      var win = zf() * Math.PI * 2, ab = 24 + zf() * 24, dx = Math.sin(win), dz = Math.cos(win);
      if(dx * blick[0] + dz * blick[1] > 0.5) continue;               // nicht direkt im Blickfeld
      var x = Math.floor(SC.mod(sp.pos[0] + dx * ab, w.planet.groesse)), z = Math.floor(SC.mod(sp.pos[2] + dz * ab, w.planet.groesse));
      var y = w.generator.hoehe(x, z) + 1;
      if(y <= SC.MEER + 1 || SC.BLOECKE[w.holeBlock(x, y, z)].fest || SC.BLOECKE[w.holeBlock(x, y + 1, z)].fest || !SC.BLOECKE[w.holeBlock(x, y - 1, z)].fest) continue;
      var art2 = zf() < 0.6 ? "krabbler" : "spucker", st = Math.max(1, Math.min(12, ss + Math.floor(zf() * 3) - 1));
      if(this._neu(art2, st, [x + 0.5, y, z + 0.5], { nacht: true, ort: "dungeon" })) nacht++;
    }
  };

  // Bauwerke in der Nähe eines Spielers wecken
  A._bauwerke = function(spieler, spielzeit, schw){
    var a = this, w = this.welt, zf = this.zf;
    var R = 128, n = w.planet.groesse / R, rx = Math.floor(SC.mod(spieler.pos[0], w.planet.groesse) / R), rz = Math.floor(SC.mod(spieler.pos[2], w.planet.groesse) / R), pl = planet(this);
    pl.geraeumt = pl.geraeumt || {};
    for(var i = -1; i <= 1; i++) for(var j = -1; j <= 1; j++) SC.Bauwerke.inRegion(w.planet, SC.mod(rx + i, n), SC.mod(rz + j, n)).forEach(function(b){
      var d = ring(w, spieler.pos, b.x + b.breite / 2, b.z + b.tiefe / 2), dy = spieler.pos[1] - Math.max(b.y, Math.min(b.y + Math.min(b.hoehe, 10), spieler.pos[1]));
      // Abstand mit Höhe: ein Dungeon tief unter dem Spieler erwacht erst, wenn man hinabsteigt
      if(Math.hypot(d[0], d[1]) > NAH + Math.max(b.breite, b.tiefe) / 2 || Math.abs(dy) > 24) return;
      var t = pl.geraeumt[b.schluessel];
      if(t !== undefined){ if(spielzeit - t < 900) return; delete pl.geraeumt[b.schluessel]; delete a.besiegt[b.schluessel]; }
      var plaetze = b.plaetze.filter(function(q){ return q.typ === "gegner" || q.typ === "boss"; });
      var normale = plaetze.filter(function(q){ return q.typ === "gegner"; }), anzahl = Math.max(1, normale.length + schw.gruppenBonus);
      var liste = normale.slice(0, anzahl).concat(plaetze.filter(function(q){ return q.typ === "boss"; }));
      if(anzahl > normale.length && normale.length) liste.push({ typ: "gegner", x: normale[0].x + 1, y: normale[0].y, z: normale[0].z, extra: true });
      a.plaetze[b.schluessel] = liste.length;
      var arten = ARTEN[b.typ] || ARTEN.dungeon, bes = a.besiegt[b.schluessel] || {};
      liste.forEach(function(q, k){
        var key = b.schluessel + "#" + k;
        if(bes[k] || (a.platzGegner[key] && w.wesen.has(a.platzGegner[key]))) return;
        var boss = q.typ === "boss", art = boss ? b.bossArt : arten[Math.floor(zf() * arten.length)];
        var stufe = Math.max(1, b.stufe + Math.floor(zf() * 3) - 1 + (boss ? 2 : 0));
        var e = a._neu(art, stufe, [q.x + 0.5, q.y, q.z + 0.5], { ort: b.typ, bauwerk: b.schluessel, platzKey: key, platzIndex: k });
        if(e) a.platzGegner[key] = e.id;
      });
    });
  };

  A.gegnerBesiegt = function(g, spielzeit){
    if(!g.platzKey) return;
    delete this.platzGegner[g.platzKey];
    var b = g.bauwerk, bes = this.besiegt[b] || (this.besiegt[b] = {});
    bes[g.platzIndex] = true;
    if(Object.keys(bes).length >= (this.plaetze[b] || 1)){ planet(this).geraeumt[b] = spielzeit; delete this.besiegt[b]; }
  };
})();
