// Wetter am Boden (Spec 2026-11-08-wetter-design.md): Regenwasser in natürlichen Mulden, einsinkender Boden bei Unwetter, Schneedecke –
// und alles wieder zurück, wenn das Wetter eine Weile vorbei ist. Jede Änderung steht als Spur [x, y, z, alt, neu] in pd.wetterSpuren
// (wird mit dem Planeten gespeichert). Baut ein Spieler an einer Spur, gehört die Stelle ihm. Nur Einzelspieler und Gastgeber rechnen.
SC.WetterBoden = function(welt, pd, zf){
  var s = this;
  this.welt = welt; this.pd = pd; this.zf = zf || Math.random; this.radius = SC.WetterBoden.RADIUS;
  if(!Array.isArray(pd.wetterSpuren)) pd.wetterSpuren = [];
  this.spuren = pd.wetterSpuren; this._index = new Map(); this._zeit = 0; this._regen = 0; this._schnee = 0;
  this.spuren.forEach(function(sp){ s._index.set(sp[0] + "," + sp[1] + "," + sp[2], sp); });
  this._beiBlock = function(b){ s._block(b); };
  welt.ereignisse.an("block", this._beiBlock);
  // Während des Austrocknens bildet das Fließen neben Regenwasser keine neuen Quellen (sonst füllte sich jede geleerte Stelle sofort wieder)
  this._trocknet = false;
  welt.quelleVerboten = function(x, y, z){ return s._trocknet && s._nebenRegen(x, y, z); };
};
SC.WetterBoden.RADIUS = 32;   // so weit um die Spieler sucht das Wetter Stellen
SC.WetterBoden.JE_TAKT = 8;   // höchstens so viele Änderungen je Takt (1 s)
SC.WetterBoden.SCHUTZ = 4;
SC.WetterBoden.MAX_PFUETZEN = 30;   // höchstens so viele Regenwasser-Quellen gleichzeitig (es soll nicht alles absaufen)
SC.WetterBoden.VERSUCHE = 20;       // so viele Stellen prüft das Wetter je gewünschter Pfütze    // so weit (waagerecht) um Betten, Werkbänke, Truhen, Start- und Landepunkt keine Pfützen

(function(){
  var B = SC.B, F = SC.Fluessig, H = SC.CHUNK.H, P = SC.WetterBoden.prototype, ALLE = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  var BODEN = {}; [B.GRAS, B.ERDE, B.SAND, B.SCHLAMM].forEach(function(id){ BODEN[id] = 1; });   // natürlicher Boden für Pfützen

  function geladen(welt, x, z){ return welt.istGeladen(welt.planet.wickel(x) >> 4, welt.planet.wickel(z) >> 4); }
  function hole(welt, x, y, z){ return y < 0 ? B.GRUNDGESTEIN : y >= H ? B.LUFT : geladen(welt, x, z) ? welt.holeBlock(x, y, z) : B.GRUNDGESTEIN; }
  function schluessel(welt, x, y, z){ return welt.planet.wickel(x) + "," + y + "," + welt.planet.wickel(z); }

  // Über (x, y, z) bis zum Himmel nur Luft? (Blätter und alles andere sind ein Dach)
  SC.WetterBoden.freierHimmel = function(welt, x, y, z){ for(var yy = y; yy < H; yy++) if(hole(welt, x, yy, z) !== B.LUFT) return false; return true; };
  // Mulde: Boden auf der Höhe, die der Generator erzeugt, natürlicher Bodenblock, darüber freier Himmel; kein Nachbar tiefer (sonst liefe es ab), mindestens einer höher → Bodenhöhe oder null
  function nachbarn(welt, x, y, z){ var hoch = 0, tief = false; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function(d){ if(SC.BLOECKE[hole(welt, x + d[0], y + 1, z + d[1])].fest) hoch++; else if(!SC.BLOECKE[hole(welt, x + d[0], y, z + d[1])].fest) tief = true; }); return { hoch: hoch, tief: tief }; }
  function naturBoden(welt, x, z){ if(!geladen(welt, x, z)) return null; var y = welt.generator.hoehe(welt.planet.wickel(x), welt.planet.wickel(z)); return BODEN[hole(welt, x, y, z)] && SC.WetterBoden.freierHimmel(welt, x, y + 1, z) ? y : null; }
  // Flacher natürlicher Boden (kein Nachbar höher oder tiefer): sinkt bei Unwetter zur Pfütze ein → Bodenhöhe oder null
  SC.WetterBoden.flach = function(welt, x, z){ var y = naturBoden(welt, x, z); if(y === null) return null; var n = nachbarn(welt, x, y, z); return !n.tief && n.hoch === 0 ? y : null; };
  SC.WetterBoden.mulde = function(welt, x, z){
    var yb = naturBoden(welt, x, z); if(yb === null) return null; var nb = nachbarn(welt, x, yb, z); return !nb.tief && nb.hoch >= 1 ? yb : null;
  };
  // Werkbank, Truhe oder Bett in der Nähe (waagerecht SCHUTZ, Höhe −2 … +4)? Dort keine Pfützen
  var BAU = {}; [B.WERKBANK, B.TRUHE, B.BETT_FUSS_N, B.BETT_FUSS_S, B.BETT_FUSS_O, B.BETT_FUSS_W, B.BETT_KOPF_N, B.BETT_KOPF_S, B.BETT_KOPF_O, B.BETT_KOPF_W].forEach(function(id){ BAU[id] = 1; });
  SC.WetterBoden.nahBauwerk = function(welt, x, y, z){ var r = SC.WetterBoden.SCHUTZ; for(var dx = -r; dx <= r; dx++) for(var dz = -r; dz <= r; dz++) for(var dy = -2; dy <= 4; dy++) if(BAU[hole(welt, x + dx, y + dy, z + dz)]) return true; return false; };
  SC.WetterBoden.geschuetzt = function(x, y, z, schutz){ var r = SC.WetterBoden.SCHUTZ; return (schutz || []).some(function(p){ return p && Math.abs(Math.floor(p[0]) - x) <= r && Math.abs(Math.floor(p[2]) - z) <= r; }); };

  P._setze = function(x, y, z, id, alt){
    var w = this.welt; x = w.planet.wickel(x); z = w.planet.wickel(z);
    if(!w.setzeBlock(x, y, z, id, "wetter")) return false;
    var k = x + "," + y + "," + z; if(!this._index.has(k)){ var sp = [x, y, z, alt, id]; this.spuren.push(sp); this._index.set(k, sp); } else this._index.get(k)[4] = id;
    return true;
  };
  P._weg = function(sp){ var i = this.spuren.indexOf(sp); if(i >= 0) this.spuren.splice(i, 1); this._index.delete(sp[0] + "," + sp[1] + "," + sp[2]); };
  // Spur zurücksetzen; false = Chunk nicht geladen (Spur bleibt für später)
  P._zurueck = function(sp){
    var w = this.welt; if(!geladen(w, sp[0], sp[2])) return false;
    var jetzt = w.holeBlock(sp[0], sp[1], sp[2]);
    this._weg(sp);
    if(jetzt === sp[4] || (F.istWasser(sp[4]) && F.istWasser(jetzt))) w.setzeBlock(sp[0], sp[1], sp[2], sp[3], "wetter");
    return true;
  };
  P._block = function(b){
    var q = String(b.quelle || ""), w = this.welt, s = this;
    if(q === "wetter" || q === "system") return;
    if(q === "fluss"){
      // Quelle, die das Fließen neben Regenwasser bildet, trocknet mit
      if(b.id === B.WASSER && !this._index.has(b.x + "," + b.y + "," + b.z) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(function(d){ var n = s._index.get(schluessel(w, b.x + d[0], b.y, b.z + d[1])); return n && F.istWasser(n[4]); })){
        var sp = [b.x, b.y, b.z, F.art(b.alt) ? B.LUFT : b.alt, B.WASSER]; this.spuren.push(sp); this._index.set(b.x + "," + b.y + "," + b.z, sp);
      }
    } else {
      var eigen = this._index.get(b.x + "," + b.y + "," + b.z); if(eigen) this._weg(eigen);   // der Spieler hat hier gebaut: die Stelle gehört ihm
    }
    if(F.istLava(b.id)) ALLE.forEach(function(d){ var n = s._index.get(schluessel(w, b.x + d[0], b.y + d[1], b.z + d[2])); if(n && n[4] === B.SCHNEESCHICHT) s._zurueck(n); });   // neben Lava taut Schnee sofort
  };

  P._nebenRegen = function(x, y, z){ var w = this.welt, s = this; return [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(function(d){ var n = s._index.get(schluessel(w, x + d[0], y, z + d[1])); return n && F.istWasser(n[4]); }); };
  P._spalte = function(orte){
    var o = orte[Math.floor(this.zf() * orte.length)], r = this.radius;
    return [Math.floor(o[0] + (this.zf() * 2 - 1) * r), Math.floor(o[2] + (this.zf() * 2 - 1) * r)];
  };
  // schritt(dt, eff aus SC.Wetter#effekte, orte [[x, y, z], …] der Spieler, schutz [[x, y, z], …])
  P.schritt = function(dt, eff, orte, schutz){
    this._zeit += dt; if(this._zeit < 1 || !orte || !orte.length) return;
    this._zeit = Math.min(this._zeit - 1, 1);
    var w = this.welt, zf = this.zf, n = SC.WetterBoden.JE_TAKT, s = this;
    this._trocknet = !eff.niederschlag && eff.seitEnde >= SC.WETTER.TROCKNEN;
    if(eff.niederschlag === "regen" && eff.pfuetzen > 0){
      this._regen = Math.min(this._regen + eff.pfuetzen / 60, n);
      var regenQ = this.spuren.filter(function(sp){ return sp[4] === B.WASSER; }).length;
      for(; this._regen >= 1 && n > 0 && regenQ < SC.WetterBoden.MAX_PFUETZEN; this._regen--){
        for(var v = 0; v < SC.WetterBoden.VERSUCHE; v++){   // mehrere Stellen prüfen, bis eine Mulde passt
          var c = this._spalte(orte), y = SC.WetterBoden.mulde(w, c[0], c[1]);
          var hoehe = y !== null ? y + 1 : eff.einsinken ? SC.WetterBoden.flach(w, c[0], c[1]) : null;   // Unwetter: flacher Boden sinkt selbst zur Pfütze ein
          if(hoehe === null || hoehe === undefined || SC.WetterBoden.geschuetzt(c[0], hoehe, c[1], schutz) || SC.WetterBoden.nahBauwerk(w, c[0], hoehe - 1, c[1])) continue;
          if(this._setze(c[0], hoehe, c[1], B.WASSER, hole(w, c[0], hoehe, c[1]))){ n--; regenQ++; break; }
        }
      }
      if(eff.einsinken && n > 0){   // Boden unter einer Pfütze sinkt ein (höchstens 2 tief)
        var pf = this.spuren.filter(function(sp){ return sp[4] === B.WASSER && geladen(w, sp[0], sp[2]); });
        if(pf.length){
          var p = pf[Math.floor(zf() * pf.length)], gy = w.generator.hoehe(p[0], p[2]), u = p[1] - 1;
          while(u >= gy - 1 && F.istWasser(hole(w, p[0], u, p[2]))) u--;
          if(u >= gy - 1 && BODEN[hole(w, p[0], u, p[2])] && !SC.WetterBoden.geschuetzt(p[0], u, p[2], schutz) && this._setze(p[0], u, p[2], B.WASSER, hole(w, p[0], u, p[2]))) n--;
        }
      }
    } else if(eff.niederschlag === "schnee" && eff.schneeRate > 0){
      this._schnee = Math.min(this._schnee + eff.schneeRate / 60, n * 4);
      for(; this._schnee >= 1 && n > 0; this._schnee--){
        var d = this._spalte(orte); if(!geladen(w, d[0], d[1])) continue;
        var oy = H - 1; while(oy > 0 && w.holeBlock(d[0], oy, d[1]) === B.LUFT) oy--;
        var t = w.holeBlock(d[0], oy, d[1]);
        if(t === B.SCHNEESCHICHT || !SC.BLOECKE[t].fest || oy + 1 >= H) continue;   // höchstens eine Schicht, nur auf festen Blöcken (auch Blätter, Dächer)
        if(ALLE.some(function(a){ return F.istLava(hole(w, d[0] + a[0], oy + 1 + a[1], d[1] + a[2])); })) continue;
        if(this._setze(d[0], oy + 1, d[1], B.SCHNEESCHICHT, B.LUFT)) n--;
      }
    } else if(!eff.niederschlag && eff.seitEnde >= SC.WETTER.TROCKNEN){
      // Austrocknen und Tauen: zuletzt Geändertes zuerst (abgesunkener Boden vor dem Wasser darüber)
      for(var i = this.spuren.length - 1; i >= 0 && n > 0; i--){ if(this._zurueck(this.spuren[i])) n--; }
    }
  };
  P.abbauen = function(){ this.welt.ereignisse.aus("block", this._beiBlock); this.welt.quelleVerboten = null; };
})();
