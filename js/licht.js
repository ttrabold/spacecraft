// Licht pro Chunk: Himmelslicht (von oben, seitlich abnehmend) und Blocklicht aus leuchtenden Blöcken.
// Gerechnet wird auf dem Chunk plus Rand, damit Licht aus Nachbar-Chunks hereinreicht.
SC.Licht = {};
(function(){
  var M = 14, R = 16 + 2 * M, H = SC.CHUNK.H, RR = R * R;
  var opak = new Uint8Array(256), leuchten = new Uint8Array(256), daempf = new Uint8Array(256);
  for(var id in SC.BLOECKE){ var b = SC.BLOECKE[id]; opak[id] = b.fest && !b.durchsichtig ? 1 : 0; leuchten[id] = b.leuchten; daempf[id] = id == SC.B.WASSER ? 2 : id == SC.B.BLAETTER ? 1 : 0; }
  SC.Licht.opak = opak;

  function ri(x, y, z){ return (y * R + z) * R + x; }

  // Blöcke von Chunk und Rand in ein Feld kopieren
  function region(welt, cx, cz){
    var bl = new Uint8Array(R * H * R);
    for(var i = -1; i <= 1; i++) for(var j = -1; j <= 1; j++){
      var c = welt.chunk(cx + i, cz + j), ox = M + i * 16, oz = M + j * 16;
      var xa = Math.max(0, -ox), xb = Math.min(16, R - ox), za = Math.max(0, -oz), zb = Math.min(16, R - oz);
      if(xa >= xb || za >= zb) continue;
      for(var y = 0; y < H; y++) for(var z = za; z < zb; z++){
        var q = SC.idx(0, y, z), d = ri(ox, y, oz + z);
        for(var x = xa; x < xb; x++) bl[d + x] = c[q + x];
      }
    }
    return bl;
  }

  var NB = [1, -1, R, -R, RR, -RR];

  function flut(feld, schlange, laenge, bl, quelle){
    for(var k = 0; k < laenge; k++){
      var i = schlange[k], v = feld[i];
      if(v <= 1) continue;
      var x = i % R, z = ((i / R) | 0) % R;
      for(var n = 0; n < 6; n++){
        if(n === 0 && x === R - 1 || n === 1 && x === 0 || n === 2 && z === R - 1 || n === 3 && z === 0) continue;
        var j = i + NB[n];
        if(j < 0 || j >= feld.length || opak[bl[j]]) continue;
        var w = v - 1 - daempf[bl[j]];
        if(w > feld[j]){ feld[j] = w; if(quelle) quelle[j] = quelle[i]; schlange[laenge++] = j; }
      }
    }
  }

  SC.Licht.chunk = function(welt, cx, cz){
    var bl = region(welt, cx, cz), n = R * H * R;
    var himmel = new Uint8Array(n), block = new Uint8Array(n), quelle = new Uint8Array(n), schlange = new Int32Array(n * 2);
    // Himmel: von oben bis zum ersten undurchsichtigen Block volles Licht
    var l = 0;
    for(var z = 0; z < R; z++) for(var x = 0; x < R; x++){
      var v = 15;
      for(var y = H - 1; y >= 0; y--){
        var i = ri(x, y, z);
        if(opak[bl[i]]) break;
        v -= daempf[bl[i]]; if(v <= 0) break;
        himmel[i] = v;
      }
    }
    // Nur Zellen mit Licht neben dunklen Zellen müssen weiterfluten
    for(var i2 = 0; i2 < n; i2++){
      if(himmel[i2] < 2) continue;
      var x2 = i2 % R, z2 = ((i2 / R) | 0) % R;
      if((x2 > 0 && himmel[i2 - 1] < himmel[i2] - 1) || (x2 < R - 1 && himmel[i2 + 1] < himmel[i2] - 1) ||
         (z2 > 0 && himmel[i2 - R] < himmel[i2] - 1) || (z2 < R - 1 && himmel[i2 + R] < himmel[i2] - 1) ||
         (i2 >= RR && himmel[i2 - RR] < himmel[i2] - 1)) schlange[l++] = i2;
    }
    flut(himmel, schlange, l, bl, null);
    // Blocklicht aus leuchtenden Blöcken
    l = 0;
    for(var i3 = 0; i3 < n; i3++){ var le = leuchten[bl[i3]]; if(le){ block[i3] = le; quelle[i3] = bl[i3]; schlange[l++] = i3; } }
    flut(block, schlange, l, bl, quelle);
    // Chunk-Ausschnitt für die Schnittstelle
    var ch = new Uint8Array(16 * H * 16), cb = new Uint8Array(16 * H * 16);
    for(var y4 = 0; y4 < H; y4++) for(var z4 = 0; z4 < 16; z4++) for(var x4 = 0; x4 < 16; x4++){
      var r = ri(x4 + M, y4, z4 + M), c = SC.idx(x4, y4, z4); ch[c] = himmel[r]; cb[c] = block[r];
    }
    return { himmel: ch, block: cb, _region: { R: R, M: M, bloecke: bl, himmel: himmel, block: block, quelle: quelle } };
  };
})();
