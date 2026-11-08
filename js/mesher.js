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
  // Fließ-Animation: Tempo des Musters (Kacheln je Sekunde) oben und an den Seiten; Lava fließt langsamer
  var FLIESS = { 1: { oben: 0.5, seite: 0.75 }, 2: { oben: 0.25, seite: 0.35 } };

  var fest = new Uint8Array(256), durch = new Uint8Array(256), fart = new Uint8Array(256), fhoehe = new Float32Array(256);   // fart: 1 Wasser, 2 Lava (Fließstufen gehören zusammen), fhoehe: Oberfläche
  for(var id in SC.BLOECKE){ var b = SC.BLOECKE[id]; fest[id] = b.fest ? 1 : 0; durch[id] = b.durchsichtig ? 1 : 0; fart[id] = b.fluessig === "wasser" ? 1 : b.fluessig === "lava" ? 2 : 0; fhoehe[id] = fart[id] ? SC.Fluessig.hoehe(+id) : 1; }
  var opak = SC.Licht.opak;

  function Puffer(){ this.p = []; this.uv = []; this.l = []; this.f = []; this.s = []; this.i = []; this.n = 0; }   // s: Fließ-Animation je Ecke (Richtung des Musters in Kacheln je Sekunde)
  Puffer.prototype.fertig = function(){
    return { positionen: new Float32Array(this.p), uv: new Float32Array(this.uv), licht: new Float32Array(this.l), farbe: new Float32Array(this.f), stroemung: new Float32Array(this.s), indizes: new Uint32Array(this.i) };
  };

  SC.Mesher.chunk = function(welt, cx, cz, licht){
    var rg = licht._region, R = rg.R, M = rg.M, bl = rg.bloecke, hi = rg.himmel, bk = rg.block, qu = rg.quelle;
    // form: Sonderformen (Tür, Bett, Leiter, Zaun, Pflanzen …) mit Tiefenpuffer und Ausschnitt statt Mischung; im durchsichtigen Teil
    // ohne Tiefenpuffer lagen ihre Flächen je nach Zeichenreihenfolge übereinander (Türen flackerten, Bettseiten über der Decke)
    var aus = { fest: new Puffer(), durchsichtig: new Puffer(), form: new Puffer() };
    function ri(x, y, z){ return (y * R + z) * R + x; }
    function blockAn(x, y, z){ return y < 0 ? SC.B.GRUNDGESTEIN : y >= H ? SC.B.LUFT : bl[ri(x, y, z)]; }

    // Sonderformen (def.form): Fackel/Kreuz, Zaun/Pfosten, Platten für Türen und Leitern. Licht aus der eigenen Zelle, alles im durchsichtigen Teil
    // (doppelseitig gezeichnet, deshalb genügt eine Fläche je Ebene).
    // dreh (0–3, optional): Kachel um dreh × 90° gedreht auflegen (Bettdecke je Richtung)
    function viereck(puf, x, y, z, ecken, uv, L, fak, glueht, dreh){
      var basis = puf.n;
      for(var e = 0; e < 4; e++){
        var c = ecken[e], k = (e + (dreh || 0)) % 4;
        puf.p.push(x + c[0], y + c[1], z + c[2]);
        puf.uv.push(k === 0 || k === 3 ? uv[0] : uv[2], k < 2 ? uv[1] : uv[3]);
        puf.l.push(L.h * fak, L.b * (glueht ? 1 : fak));
        puf.f.push(L.f[0], L.f[1], L.f[2]); puf.s.push(0, 0);
      }
      puf.i.push(basis, basis + 1, basis + 2, basis, basis + 2, basis + 3);
      puf.n += 4;
    }
    function kasten(puf, x, y, z, a, b, uv, L, glueht, ohneUnten, uvJeFlaeche, drehOben){   // uvJeFlaeche(f) (optional): eigene Kachel je Fläche, z. B. Oberseite des Betts
      for(var f = 0; f < 6; f++){
        if(ohneUnten && f === 3) continue;
        var F = FL[f];
        viereck(puf, x, y, z, F.e.map(function(c){ return [c[0] ? b[0] : a[0], c[1] ? b[1] : a[1], c[2] ? b[2] : a[2]]; }), uvJeFlaeche ? uvJeFlaeche(f) : uv, L, F.h, glueht, f === 2 ? drehOben : 0);
      }
    }
    function verbunden(id){ var d = SC.BLOECKE[id]; return d.form === "pfosten" || (d.fest && !d.durchsichtig); }
    function formBlock(puf, x, y, z, rx, rz, id, def){
      var zi = ri(rx, y, rz), lb = bk[zi] / 15, q = lb ? qu[zi] : 0;
      if(def.leuchten){ lb = Math.max(lb, def.leuchten / 15); q = id; }
      var L = { h: hi[zi] / 15, b: lb, f: q && SC.BLOECKE[q].lichtFarbe || [1, 0.9, 0.75] }, uv = SC.Mesher.uvFuer(def.seiten.seite), fm = def.form, gl = !!def.leuchten;
      if(fm === "kreuz"){
        viereck(puf, x, y, z, [[0.15, 0, 0.15], [0.85, 0, 0.85], [0.85, 1, 0.85], [0.15, 1, 0.15]], uv, L, 0.95, gl);
        viereck(puf, x, y, z, [[0.85, 0, 0.15], [0.15, 0, 0.85], [0.15, 1, 0.85], [0.85, 1, 0.15]], uv, L, 0.95, gl);
      } else if(fm === "pflanze"){
        // Gekreuzte Flächen über die ganze Zelle wie Minecraft-Pflanzen (Issue #17);
        // entfällt, wenn die Zelle rundum von undurchsichtigen Blöcken verdeckt ist
        var verdeckt = true;
        for(var f = 0; f < 6; f++) if(!opak[blockAn(rx + FL[f].n[0], y + FL[f].n[1], rz + FL[f].n[2])]){ verdeckt = false; break; }
        if(verdeckt) return;
        viereck(puf, x, y, z, [[0, 0, 0], [1, 0, 1], [1, 1, 1], [0, 1, 0]], uv, L, 0.95, gl);
        viereck(puf, x, y, z, [[1, 0, 0], [0, 0, 1], [0, 1, 1], [1, 1, 0]], uv, L, 0.95, gl);
      } else if(fm === "pfosten"){
        kasten(puf, x, y, z, [0.375, 0, 0.375], [0.625, 1, 0.625], uv, L, gl, true);
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function(n){
          if(!verbunden(blockAn(rx + n[0], y, rz + n[1]))) return;
          [[0.3, 0.42], [0.65, 0.77]].forEach(function(h){
            var a = n[0] > 0 ? [0.625, h[0], 0.4375] : n[0] < 0 ? [0, h[0], 0.4375] : [0.4375, h[0], n[1] > 0 ? 0.625 : 0];
            var b = n[0] > 0 ? [1, h[1], 0.5625] : n[0] < 0 ? [0.375, h[1], 0.5625] : [0.5625, h[1], n[1] > 0 ? 1 : 0.375];
            kasten(puf, x, y, z, a, b, uv, L, gl, true);
          });
        });
      } else if(fm.typ === "mehrteilig"){
        // Mehrere Kästen mit je eigener Kachel (Tisch, Kugel); leuchtende Teile bleiben bei Nacht hell
        fm.teile.forEach(function(p){
          var uT = SC.Mesher.uvFuer(def.seiten[p.t]), uO = p.o ? SC.Mesher.uvFuer(def.seiten[p.o]) : null;
          kasten(puf, x, y, z, p.a, p.b, uT, L, gl || !!p.leuchtet, false, uO ? function(f){ return f === 2 ? uO : uT; } : null);
        });
      } else if(fm.typ === "kasten"){
        var uO = SC.Mesher.uvFuer(def.seiten.oben), uU = SC.Mesher.uvFuer(def.seiten.unten);
        kasten(puf, x, y, z, fm.a, fm.b, uv, L, gl, false, function(f){ return f === 2 ? uO : f === 3 ? uU : uv; }, fm.drehOben);
      } else if(fm.typ === "platte"){
        var t = 0.08, c = Math.max(t / 2, Math.min(1 - t / 2, fm.versatz));
        kasten(puf, x, y, z, fm.achse === "x" ? [c - t / 2, 0, 0] : [0, 0, c - t / 2], fm.achse === "x" ? [c + t / 2, 1, 1] : [1, 1, c + t / 2], uv, L, gl, false);
      }
    }

    for(var y = 0; y < H; y++) for(var z = 0; z < 16; z++) for(var x = 0; x < 16; x++){
      var rx = x + M, rz = z + M, id = bl[ri(rx, y, rz)];
      if(id === SC.B.LUFT) continue;
      var def = SC.BLOECKE[id], dt = durch[id], puf = dt ? (def.ausschnitt ? aus.form : aus.durchsichtig) : aus.fest;
      if(def.form !== "wuerfel"){ formBlock(aus.form, x, y, z, rx, rz, id, def); continue; }
      // Fließende Blöcke: oben läuft das Muster zu flacheren Nachbarn, Luft oder Wasserfall (+u = +x, +v = −z), an den Seiten nach unten; Quellen ruhen
      var fo = null, fsd = null;
      if(fart[id] && !def.quelle){
        var T = FLIESS[fart[id]], sx = 0, sz = 0;
        if(!def.fallend) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function(d){ var n = blockAn(rx + d[0], y, rz + d[1]); if(n === SC.B.LUFT || (fart[n] === fart[id] && !SC.BLOECKE[n].quelle && (SC.BLOECKE[n].fallend || fhoehe[n] < fhoehe[id]))){ sx += d[0]; sz += d[1]; } });
        var fl = Math.hypot(sx, sz); fo = fl ? [sx / fl * T.oben, -sz / fl * T.oben] : null; fsd = [0, -T.seite];
      }
      for(var f = 0; f < 6; f++){
        var F = FL[f], nx = rx + F.n[0], ny = y + F.n[1], nz = rz + F.n[2];
        if(ny < 0) continue;
        var nb = blockAn(nx, ny, nz);
        // Fläche nur zeichnen, wenn der Nachbar sie nicht verdeckt
        if(nb !== SC.B.LUFT){
          if(opak[nb]) continue;
          if(nb === id && !fart[id]) continue;
          if(fart[id] && fart[nb] === fart[id] && (F.n[1] !== 0 || fhoehe[nb] >= fhoehe[id])) continue;   // Wasser untereinander: nur die Stufe zu einem niedrigeren Nachbarn
          if(dt && fest[nb] && !durch[nb]) continue;
        }
        var uv = SC.Mesher.uvFuer(def.seiten[F.s]), basis = puf.n, oh = fhoehe[id], uh = fart[id] && F.n[1] === 0 && fart[nb] === fart[id] ? fhoehe[nb] : 0;   // uh: Seite beginnt über dem niedrigeren Wasser
        for(var e = 0; e < 4; e++){
          var c = F.e[e];
          puf.p.push(x + c[0], y + (c[1] ? oh : uh), z + c[2]);   // Fließstufen: Oberfläche niedriger
          puf.uv.push(e === 0 || e === 3 ? uv[0] : uv[2], F.n[1] !== 0 ? (e < 2 ? uv[1] : uv[3]) : uv[1] + (uv[3] - uv[1]) * (c[1] ? oh : uh));   // Seiten: Kachel nicht stauchen
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
          var fv = F.n[1] > 0 ? fo : F.n[1] === 0 ? fsd : null; puf.s.push(fv ? fv[0] : 0, fv ? fv[1] : 0);
        }
        puf.i.push(basis, basis + 1, basis + 2, basis, basis + 2, basis + 3);
        puf.n += 4;
      }
    }
    return { fest: aus.fest.fertig(), durchsichtig: aus.durchsichtig.fertig(), form: aus.form.fertig() };
  };
})();
