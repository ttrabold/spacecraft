// Weltgenerator: rechnet jeden Chunk nur aus Seed und Koordinaten (kein Math.random)
SC.GENERATOR_VERSION = 2;
SC.MEER = 48;

SC.Generator = function(planet){
  this.planet = planet;
  var s = planet.seed;
  this.rHoehe = new SC.Rauschen(SC.hash3(s, 1, 0));
  this.rBerge = new SC.Rauschen(SC.hash3(s, 2, 0));
  this.rTemp = new SC.Rauschen(SC.hash3(s, 3, 0));
  this.rFeucht = new SC.Rauschen(SC.hash3(s, 4, 0));
  this.rKristall = new SC.Rauschen(SC.hash3(s, 5, 0));
  this.rHoehle = new SC.Rauschen(SC.hash3(s, 6, 0));
  this.rAder = new SC.Rauschen(SC.hash3(s, 7, 0));
  this._hCache = {}; this._hAnzahl = 0; this._bCache = {}; this._bAnzahl = 0;
};

(function(){
  var B = SC.B, H = SC.CHUNK.H;

  SC.Generator.prototype.hoehe = function(x, z){
    var P = this.planet.groesse; x = SC.mod(Math.floor(x), P); z = SC.mod(Math.floor(z), P);
    var k = x * P + z, c = this._hCache[k];
    if(c !== undefined) return c;
    var h = 56 + this.rHoehe.oktaven(x, z, P, 256, 5) * 16;
    var m = this.rBerge.oktaven(x, z, P, 512, 3);
    if(m > 0.15) h += (m - 0.15) * 110;
    var t = this.rTemp.oktaven(x, z, P, 512, 2);
    if(t > 0.3 && h > 50) h = 50 + (h - 50) * 0.5;                    // Wüste flacher
    h = Math.max(6, Math.min(120, Math.round(h)));
    if(this._hAnzahl++ > 200000){ this._hCache = {}; this._hAnzahl = 0; }
    this._hCache[k] = h;
    return h;
  };

  SC.Generator.prototype.biom = function(x, z){
    var P = this.planet.groesse; x = SC.mod(Math.floor(x), P); z = SC.mod(Math.floor(z), P);
    var k = x * P + z, c = this._bCache[k];
    if(c === undefined){ c = this._biom(x, z); if(this._bAnzahl++ > 200000){ this._bCache = {}; this._bAnzahl = 0; } this._bCache[k] = c; }
    return c;
  };
  SC.Generator.prototype._biom = function(x, z){
    var P = this.planet.groesse, h = this.hoehe(x, z);
    if(h <= SC.MEER) return "see";
    if(h <= SC.MEER + 2) return "strand";
    if(h >= 82) return "berge";
    if(this.rTemp.oktaven(x, z, P, 512, 2) > 0.3) return "wueste";
    if(this.rKristall.flach(x, z, P, 256) > 0.5) return "kristallfeld";
    if(this.rFeucht.oktaven(x, z, P, 512, 2) > 0.05) return "wald";
    return "wiese";
  };

  // Höhlenrauschen grob abtasten (alle 4 Blöcke) und dazwischen interpolieren
  function grobFeld(rausch, P, skala, x0, z0){
    var ny = H / 4 + 1, f = new Float32Array(5 * ny * 5);
    for(var i = 0; i < 5; i++) for(var k = 0; k < 5; k++) for(var j = 0; j < ny; j++)
      f[(j * 5 + k) * 5 + i] = rausch.raum(x0 + i * 4, j * 4, z0 + k * 4, P, skala);
    return function(x, y, z){
      var i = x >> 2, j = y >> 2, k = z >> 2, fx = (x & 3) / 4, fy = (y & 3) / 4, fz = (z & 3) / 4;
      function v(a, b, c){ return f[((j + b) * 5 + (k + c)) * 5 + (i + a)]; }
      var a0 = v(0,0,0) + (v(1,0,0) - v(0,0,0)) * fx, a1 = v(0,0,1) + (v(1,0,1) - v(0,0,1)) * fx;
      var b0 = v(0,1,0) + (v(1,1,0) - v(0,1,0)) * fx, b1 = v(0,1,1) + (v(1,1,1) - v(0,1,1)) * fx;
      var a = a0 + (a1 - a0) * fz, b = b0 + (b1 - b0) * fz;
      return a + (b - a) * fy;
    };
  }

  // Baum mit Ursprung (tx, tz) in den Chunk schreiben (nur der Teil, der hineinfällt)
  function baum(c, g, x0, z0, tx, tz, h, hoch){
    var P = g.planet.groesse;
    function setze(wx, y, wz, id, nurLuft){
      var lx = SC.mod(wx - x0, P), lz = SC.mod(wz - z0, P);
      if(lx > 15 || lz > 15 || y < 0 || y >= H) return;
      var i = SC.idx(lx, y, lz);
      if(!nurLuft || c[i] === B.LUFT) c[i] = id;
    }
    for(var y = h + 1; y <= h + hoch; y++) setze(tx, y, tz, B.STAMM, false);
    for(var dy = -2; dy <= 1; dy++){
      var r = dy >= 0 ? 1 : 2;
      for(var dx = -r; dx <= r; dx++) for(var dz = -r; dz <= r; dz++){
        if(Math.abs(dx) === r && Math.abs(dz) === r && dy < 0) continue;
        setze(tx + dx, h + hoch + dy, tz + dz, B.BLAETTER, true);
      }
    }
  }

  SC.Generator.prototype.chunk = function(cx, cz){
    var P = this.planet.groesse, n = P / 16, s = this.planet.seed;
    cx = SC.mod(cx, n); cz = SC.mod(cz, n);
    var x0 = cx * 16, z0 = cz * 16, c = new Uint8Array(16 * H * 16);
    var hoehle = grobFeld(this.rHoehle, P, 32, x0, z0), ader = grobFeld(this.rAder, P, 16, x0, z0);
    for(var x = 0; x < 16; x++) for(var z = 0; z < 16; z++){
      var wx = x0 + x, wz = z0 + z, h = this.hoehe(wx, wz), biom = this.biom(wx, wz);
      var oben = B.GRAS, unter = B.ERDE;
      if(biom === "wueste" || biom === "strand") { oben = B.SAND; unter = B.SAND; }
      else if(biom === "see") { oben = h < SC.MEER - 6 ? B.KIES : B.SAND; unter = B.SAND; }
      else if(biom === "berge") { oben = h > 96 ? B.SCHNEE : B.STEIN; unter = h > 96 ? B.ERDE : B.STEIN; }
      c[SC.idx(x, 0, z)] = B.GRUNDGESTEIN;
      for(var y = 1; y <= h; y++){
        var id = y === h ? oben : y > h - 4 ? unter : B.STEIN;
        if(id === B.STEIN && y < h - 6 && ader(x, y, z) > 0.55) id = B.KRISTALL;
        // Höhlen nicht dicht unter Wasserflächen öffnen
        if(y > 4 && y < h - 1 + (h > SC.MEER + 3 ? 2 : -6) && hoehle(x, y, z) > 0.42) id = B.LUFT;
        c[SC.idx(x, y, z)] = id;
      }
      for(var yw = h + 1; yw <= SC.MEER; yw++) c[SC.idx(x, yw, z)] = B.WASSER;
      // Leuchtpilze auf Höhlenböden
      for(var yc = 5; yc < h - 2; yc++){
        var i0 = SC.idx(x, yc, z);
        if(c[i0] === B.LUFT && c[i0 - 256] !== B.LUFT && c[i0 - 256] !== B.LEUCHTPILZ && (SC.hash3(s, wx, wz, yc) & 1023) < 12) c[i0] = B.LEUCHTPILZ;
      }
      var hz = SC.hash3(s, wx, wz, 501) & 1023;
      if(c[SC.idx(x, h, z)] !== oben) continue;                     // Oberfläche weggehöhlt
      if(biom === "kristallfeld" && hz < 20){ for(var k = 1; k <= 1 + (hz % 3); k++) if(h + k < H) c[SC.idx(x, h + k, z)] = B.KRISTALL; }
      else if((biom === "wald" || biom === "wiese") && hz >= 1021 && h + 1 < H) c[SC.idx(x, h + 1, z)] = B.LEUCHTPILZ;
    }
    // Bäume: Ursprünge aus dem Chunk und einem 2-Block-Rand, damit Kronen über Grenzen passen
    for(var bx = -2; bx < 18; bx++) for(var bz = -2; bz < 18; bz++){
      var tx = SC.mod(x0 + bx, P), tz = SC.mod(z0 + bz, P), hb = SC.hash3(s, tx, tz, 777) & 1023, bi = this.biom(tx, tz);
      var dichte = bi === "wald" ? 28 : bi === "wiese" ? 3 : bi === "kristallfeld" ? 2 : 0;
      if(hb >= dichte) continue;
      var th = this.hoehe(tx, tz);
      if(th <= SC.MEER + 1 || th > 100) continue;
      baum(c, this, x0, z0, tx, tz, th, 4 + (hb % 3));
    }
    // Bauwerke zuletzt einprägen
    var liste = SC.Bauwerke.imChunk(this.planet, cx, cz);
    for(var b = 0; b < liste.length; b++){
      var bw = liste[b];
      for(var lx0 = 0; lx0 < 16; lx0++){
        var lx = SC.mod(x0 + lx0 - bw.x, P); if(lx >= bw.breite) continue;
        for(var lz0 = 0; lz0 < 16; lz0++){
          var lz = SC.mod(z0 + lz0 - bw.z, P); if(lz >= bw.tiefe) continue;
          for(var ly = 0; ly < bw.hoehe; ly++){
            var wy = bw.y + ly; if(wy < 1 || wy >= H) continue;
            var bid = bw.block(lx, ly, lz);
            if(bid >= 0) c[SC.idx(lx0, wy, lz0)] = bid;
          }
        }
      }
    }
    return c;
  };
})();
