// Mesher: baut die Geometrie eines Chunks. Unsichtbare Flächen entfallen,
// Licht wird pro Ecke weich gemittelt und mit Umgebungsverdeckung abgedunkelt.
SC.Mesher = {};
(function(){
  var H = SC.CHUNK.H, KACHELN = 16;
  var NAMEN = Object.keys(SC.TEXTUREN), KACHEL = {};
  NAMEN.forEach(function(n, i){ KACHEL[n] = i; });
  SC.Mesher.atlasNamen = NAMEN;

  SC.Mesher.uvFuer = function(name){
    var i = KACHEL[name], s = 1 / KACHELN, ein = 0.001;
    var u0 = (i % KACHELN) * s, row = Math.floor(i / KACHELN);
    return [u0 + ein, 1 - (row + 1) * s + ein, u0 + s - ein, 1 - row * s - ein];
  };

  // Flächen: Normale, vier Ecken (unten links, unten rechts, oben rechts, oben links von außen), Seite, Helligkeit
  var FL = [
    { n: [1, 0, 0], e: [[1,0,1],[1,0,0],[1,1,0],[1,1,1]], s: "seite", h: 0.8 },
    { n: [-1, 0, 0], e: [[0,0,0],[0,0,1],[0,1,1],[0,1,0]], s: "seite", h: 0.8 },
    { n: [0, 1, 0], e: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]], s: "oben", h: 1.0 },
    { n: [0, -1, 0], e: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]], s: "unten", h: 0.55 },
    { n: [0, 0, 1], e: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]], s: "seite", h: 0.9 },
    { n: [0, 0, -1], e: [[1,0,0],[0,0,0],[0,1,0],[1,1,0]], s: "seite", h: 0.9 }
  ];
  var AO = [1, 0.78, 0.62, 0.5];

  var fest = new Uint8Array(256), durch = new Uint8Array(256);
  for(var id in SC.BLOECKE){ var b = SC.BLOECKE[id]; fest[id] = b.fest ? 1 : 0; durch[id] = b.durchsichtig ? 1 : 0; }
  var opak = SC.Licht.opak;

  function Puffer(){ this.p = []; this.uv = []; this.l = []; this.f = []; this.i = []; this.n = 0; }
  Puffer.prototype.fertig = function(){
    return { positionen: new Float32Array(this.p), uv: new Float32Array(this.uv), licht: new Float32Array(this.l), farbe: new Float32Array(this.f), indizes: new Uint32Array(this.i) };
  };

  SC.Mesher.chunk = function(welt, cx, cz, licht){
    var rg = licht._region, R = rg.R, M = rg.M, bl = rg.bloecke, hi = rg.himmel, bk = rg.block, qu = rg.quelle;
    var aus = { fest: new Puffer(), durchsichtig: new Puffer() };
    function ri(x, y, z){ return (y * R + z) * R + x; }
    function blockAn(x, y, z){ return y < 0 ? SC.B.GRUNDGESTEIN : y >= H ? SC.B.LUFT : bl[ri(x, y, z)]; }

    for(var y = 0; y < H; y++) for(var z = 0; z < 16; z++) for(var x = 0; x < 16; x++){
      var rx = x + M, rz = z + M, id = bl[ri(rx, y, rz)];
      if(id === SC.B.LUFT) continue;
      var def = SC.BLOECKE[id], dt = durch[id], puf = dt ? aus.durchsichtig : aus.fest;
      for(var f = 0; f < 6; f++){
        var F = FL[f], nx = rx + F.n[0], ny = y + F.n[1], nz = rz + F.n[2];
        if(ny < 0) continue;
        var nb = blockAn(nx, ny, nz);
        // Fläche nur zeichnen, wenn der Nachbar sie nicht verdeckt
        if(nb !== SC.B.LUFT){
          if(opak[nb]) continue;
          if(nb === id) continue;
          if(dt && fest[nb] && !durch[nb]) continue;
        }
        var uv = SC.Mesher.uvFuer(def.seiten[F.s]), basis = puf.n;
        for(var e = 0; e < 4; e++){
          var c = F.e[e];
          puf.p.push(x + c[0], y + c[1], z + c[2]);
          puf.uv.push(e === 0 || e === 3 ? uv[0] : uv[2], e < 2 ? uv[1] : uv[3]);
          // Nachbarzellen in der Ebene vor der Fläche, zur Ecke hin
          var t = [], s = [0, 0, 0];
          for(var a = 0; a < 3; a++) if(F.n[a] === 0){ t.push(a); s[a] = c[a] ? 1 : -1; }
          var d1 = [nx, ny, nz], d2 = [nx, ny, nz], dd = [nx, ny, nz];
          d1[t[0]] += s[t[0]]; d2[t[1]] += s[t[1]]; dd[t[0]] += s[t[0]]; dd[t[1]] += s[t[1]];
          var o1 = opak[blockAn(d1[0], d1[1], d1[2])], o2 = opak[blockAn(d2[0], d2[1], d2[2])], od = opak[blockAn(dd[0], dd[1], dd[2])];
          var ao = o1 && o2 ? 3 : o1 + o2 + od;
          // Weiches Licht: Mittel über die nicht verdeckten Zellen
          var sh = 0, sb = 0, anz = 0, q = 0;
          var zellen = [[nx, ny, nz], d1, d2, dd], ok = [1, !o1, !o2, !od && !(o1 && o2)];
          for(var k = 0; k < 4; k++){
            if(!ok[k]) continue;
            var zy = zellen[k][1];
            if(zy >= H){ sh += 15; anz++; continue; }
            if(zy < 0) continue;
            var zi = ri(zellen[k][0], zy, zellen[k][2]);
            sh += hi[zi]; sb += bk[zi]; anz++; if(!q && bk[zi]) q = qu[zi];
          }
          var lh = anz ? sh / anz / 15 : 0, lb = anz ? sb / anz / 15 : 0;
          if(def.leuchten){ lb = Math.max(lb, def.leuchten / 15); q = id; }
          var fak = AO[ao] * F.h;
          puf.l.push(lh * fak, lb * (def.leuchten ? 1 : fak));
          var lf = q && SC.BLOECKE[q].lichtFarbe || [1, 0.9, 0.75];
          puf.f.push(lf[0], lf[1], lf[2]);
        }
        puf.i.push(basis, basis + 1, basis + 2, basis, basis + 2, basis + 3);
        puf.n += 4;
      }
    }
    return { fest: aus.fest.fertig(), durchsichtig: aus.durchsichtig.fertig() };
  };
})();
