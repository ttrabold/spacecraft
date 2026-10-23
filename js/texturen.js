// Pixel-Texturatlas: 16 × 16 Kacheln à 16 px, beim Start aus der Planetenpalette gemalt (keine Bilddateien)
SC.Texturen = {};
(function(){
  var K = 16;

  function hex(c){ var n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mische(a, b, t){ return [a[0] + (b[0] - a[0]) * t | 0, a[1] + (b[1] - a[1]) * t | 0, a[2] + (b[2] - a[2]) * t | 0]; }

  // Malt eine Kachel in ein RGBA-Feld (16 × 16)
  function male(muster, farben, zf){
    var g = hex(farben[0]), d = hex(farben[1]), h = hex(farben[2]), px = new Uint8ClampedArray(K * K * 4);
    function setze(x, y, c, a){ var i = (y * K + x) * 4; px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = a === undefined ? 255 : a; }
    function rausch(x, y, anteil){ var r = zf(); return r < anteil / 2 ? d : r < anteil ? h : g; }
    var x, y;
    for(y = 0; y < K; y++) for(x = 0; x < K; x++){
      var c = g, a = 255, r;
      switch(muster){
        case "rauschen": c = rausch(x, y, 0.35); break;
        case "stein": r = zf(); c = r < 0.18 ? d : r < 0.3 ? h : g; if((x * 7 + y * 3) % 11 === 0) c = d; break;
        case "kies": r = zf(); c = r < 0.33 ? d : r < 0.66 ? h : g; break;
        case "grasrand": c = y < 3 + ((x * 5) % 3 === 0 ? 1 : 0) ? d : rausch(x, y, 0.3); if(c === d && zf() < 0.25) c = mische(d, [0, 0, 0], 0.15); break;
        case "schneerand": c = y < 3 + (x % 4 === 0 ? 1 : 0) ? d : rausch(x, y, 0.3); break;
        case "wellen": c = (y + (x >> 2)) % 5 === 0 ? h : zf() < 0.2 ? d : g; a = 190; break;
        case "rinde": c = x % 4 === 0 ? d : x % 4 === 2 && zf() < 0.5 ? h : g; break;
        case "ringe": var m = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5)) | 0; c = m === 7 ? d : m % 2 ? h : g; break;
        case "blaetter": r = zf(); c = r < 0.25 ? d : r < 0.4 ? h : g; if(zf() < 0.14) a = 0; break;
        case "kristall": c = (x + y) % 6 === 0 || (x - y + 16) % 6 === 0 ? h : (x + y) % 3 === 0 ? d : g; break;
        case "pilz":
          a = 0;
          if(x >= 7 && x <= 8 && y >= 9) { c = h; a = 255; }
          else if(y >= 4 && y <= 8 && Math.abs(x - 7.5) <= 6 - (8 - y) * 0.6) { c = (x + y) % 4 === 0 ? h : g; a = 255; }
          break;
        case "bretter": c = y % 4 === 3 ? d : (x === (y >> 2) * 5 % 16) ? d : zf() < 0.2 ? h : g; break;
        case "ziegel": var reihe = y >> 2, ver = reihe % 2 ? 4 : 0; c = y % 4 === 3 || (x + ver) % 8 === 7 ? d : zf() < 0.2 ? h : g; break;
        case "glas": var rand = x === 0 || y === 0 || x === 15 || y === 15; c = rand ? h : (x === y + 3 || x === y + 4) && x < 10 ? h : g; a = rand ? 230 : 70; break;
        case "wolle": c = zf() < 0.3 ? d : g; if((x + y * 2) % 7 === 0) c = h; break;
        case "platte": var r2 = x === 0 || y === 0 || x === 15 || y === 15; c = r2 ? d : (x === 2 || x === 13) && (y === 2 || y === 13) ? h : zf() < 0.08 ? d : g; break;
        case "gitter": var linie = x % 5 === 0 || y % 5 === 0; c = linie ? (zf() < 0.3 ? h : g) : g; a = linie ? 255 : 0; break;
        case "technik": c = x === 0 || y === 0 || x === 15 || y === 15 ? d : (y === 5 || y === 10) && x > 2 && x < 13 ? h : (x === 3 && y === 13) || (x === 6 && y === 13) ? h : g; break;
        case "leucht": var m2 = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5)); c = m2 > 6.5 ? d : m2 < 3 ? h : mische(g, h, 0.3); break;
        case "beton": c = zf() < 0.25 ? d : zf() < 0.1 ? h : g; if(y === 7) c = d; break;
      }
      setze(x, y, c, a);
    }
    return px;
  }

  SC.Texturen.atlas = function(palette){
    var cv = document.createElement("canvas"); cv.width = 256; cv.height = 256;
    var ctx = cv.getContext("2d"), bild = ctx.createImageData(K, K);
    SC.Mesher.atlasNamen.forEach(function(name, i){
      var farben = palette.texturen[name], zf = SC.zufall(SC.hashText(name + ":" + palette.id));
      bild.data.set(male(SC.TEXTUREN[name], farben, zf));
      ctx.putImageData(bild, (i % 16) * K, Math.floor(i / 16) * K);
    });
    return cv;
  };
})();
