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
        case "kiste": var rk = x === 0 || x === 15 || y === 0 || y === 15 || y === 7; c = rk ? d : (x >= 6 && x <= 9 && y >= 6 && y <= 9) ? h : (y % 4 === 2 ? mische(g, [0, 0, 0], 0.2) : g); break;
        case "kistedeckel": c = x === 0 || x === 15 || y === 0 || y === 15 ? d : (x === 7 || x === 8) ? d : y % 4 === 1 ? mische(g, [0, 0, 0], 0.2) : g; break;
        case "kisteoffen": var ro = x === 0 || x === 15 || y === 0 || y === 15; c = ro ? d : h; break;
        case "beton": c = zf() < 0.25 ? d : zf() < 0.1 ? h : g; if(y === 7) c = d; break;
        // Stufe 5a: glühende Adern, glattes Eis mit Rissen, Schlamm mit Blasen, dunkles Vulkangestein
        case "lava": var ad = Math.sin(x * 0.9 + y * 0.5) + Math.sin(y * 1.3 - x * 0.4); c = ad > 1.1 ? h : ad < -0.8 ? d : g; break;
        case "eis": c = (x + 2 * y) % 13 === 0 || (x === 11 && y > 3 && y < 9) ? h : zf() < 0.08 ? d : g; a = 215; break;
        case "schlamm": c = rausch(x, y, 0.4); if((x - 4) * (x - 4) + (y - 10) * (y - 10) < 3 || (x - 11) * (x - 11) + (y - 4) * (y - 4) < 2) c = h; break;
        case "erz": r = zf(); c = r < 0.18 ? d : g; if((x * 3 + y * 5) % 9 === 0 || (x * 7 + y * 2) % 13 === 0) c = h; break;
        case "schaltkreis": c = x % 4 === 0 || y % 5 === 0 ? d : g; if((x * y) % 7 === 0 && x % 4 !== 0) c = h; break;
        case "chitin": c = y % 5 === 0 ? d : (x + y) % 6 === 0 ? h : zf() < 0.15 ? d : g; break;
        case "netz": c = x % 4 === 0 || y % 4 === 0 ? h : g; if((x + y) % 8 === 0) c = d; a = (x % 4 === 0 || y % 4 === 0) ? 255 : 90; break;
        // Eimer: Kübel aus Blech mit Henkel, die dritte Farbe ist der Inhalt (leer: dunkel, Wasser, Lava)
        case "eimer": a = 0; if(y >= 5 && y <= 14 && x >= 3 + (y < 10 ? 0 : 1) && x <= 12 - (y < 10 ? 0 : 1)){ a = 255; c = x === 3 || x === 12 || y === 14 || y === 9 ? d : g; if(y >= 6 && y <= 7 && x > 3 && x < 12) c = h; } else if((y === 2 && x >= 5 && x <= 10) || ((x === 4 || x === 11) && y >= 3 && y <= 4)){ a = 255; c = d; } break;
        case "kraut": a = 0; if(x >= 7 && x <= 8 && y >= 6){ c = d; a = 255; } if(((x >= 4 && x <= 6 && y >= 9 && y <= 11) || (x >= 9 && x <= 11 && y >= 8 && y <= 10))){ c = g; a = 255; } if(y >= 3 && y <= 6 && x >= 5 && x <= 10 && !(y === 3 && (x === 5 || x === 10))){ c = x >= 7 && x <= 8 && y >= 4 && y <= 5 ? d : h; a = 255; } break;
        case "kesseloben": c = x < 2 || x > 13 || y < 2 || y > 13 ? d : (x + y) % 7 === 0 ? h : g; break;
        case "kesselseite": c = y < 2 || y === 8 ? h : x % 5 === 0 ? d : g; break;
        case "flasche": a = 0; if(x >= 7 && x <= 8 && y >= 2 && y <= 5){ a = 255; c = y === 2 ? d : h; } if(y >= 6 && y <= 14 && x >= 4 && x <= 11){ if(y === 6 || y === 14 || x === 4 || x === 11){ a = 255; c = d; } else { a = 120; c = g; if(x === 5 && y >= 8 && y <= 10){ a = 255; c = h; } } } break;
        case "trank": a = 0; if(x >= 7 && x <= 8 && y >= 2 && y <= 5){ a = 255; c = y === 2 ? d : h; } if(y >= 6 && y <= 14 && x >= 4 && x <= 11){ if(y === 6 || y === 14 || x === 4 || x === 11){ a = 255; c = d; } else if(y >= 8){ a = 255; c = x === 5 && y <= 10 ? h : g; } else { a = 100; c = h; } } break;
        case "holzstoss": case "holzstossfeuer":
          a = 0;
          if(y >= 10 && y <= 13 && x >= 2 && x <= 13){ a = 255; c = y === 10 || y === 13 || x === 2 || x === 13 ? d : g; }
          else if(y >= 7 && y <= 9 && x >= 4 && x <= 11){ a = 255; c = y === 7 || x === 4 || x === 11 ? d : g; }
          else if(y >= 14 && x >= 1 && x <= 14 && (x + y) % 2 === 0){ a = 255; c = muster === "holzstoss" ? h : d; }
          if(muster === "holzstossfeuer" && y >= 2 && y <= 9){ var br = 1 + (y - 2) * 0.55; if(Math.abs(x - 7.5) <= br){ a = 255; c = Math.abs(x - 7.5) < br * 0.45 && y >= 5 ? mische(h, [255, 240, 120], 0.65) : h; } }
          break;
        case "kaminoben": c = x < 1 || x > 14 || y < 1 || y > 14 ? d : rausch(x, y, 0.3); break;
        case "kaminloch": case "kaminfeuer":
          c = y % 4 === 3 || (x + (y >> 2) * 4) % 8 === 0 ? d : g;
          if(x >= 4 && x <= 11 && y >= 6){ c = [32, 24, 22]; if(muster === "kaminfeuer" && y >= 8 && y <= 14 && Math.abs(x - 7.5) <= 1.2 + (y - 8) * 0.3) c = y < 11 ? mische(h, [255, 240, 120], 0.6) : h; }
          else if(x >= 5 && x <= 10 && y === 5) c = d;
          break;
        case "feuerzeug":
          a = 0;
          if(x >= 5 && x <= 10 && y >= 6 && y <= 14){ a = 255; c = x === 5 || x === 10 || y === 14 ? d : g; }
          if(x >= 5 && x <= 10 && y >= 4 && y <= 5){ a = 255; c = y === 4 || x === 5 || x === 10 ? d : h; }
          if(x >= 7 && x <= 8 && y >= 1 && y <= 3){ a = 255; c = [255, 160, 40]; }
          break;
        case "tierfutter": c = zf() < 0.2 ? d : g; if((x * 5 + y * 3) % 11 === 0) c = h; break;
        case "werkbankoben": c = x === 0 || x === 15 || y === 0 || y === 15 ? d : y % 4 === 3 ? d : g; if(x >= 4 && x <= 11 && y >= 6 && y <= 9) c = h; break;
        case "werkbankseite": c = y < 3 || x < 2 || x > 13 ? d : g; if(y >= 6 && y <= 9 && x % 4 === 1) c = h; break;
        case "fackel": a = 0; if(x >= 7 && x <= 8 && y >= 6) { c = g; a = 255; } else if(x >= 6 && x <= 9 && y >= 1 && y <= 5){ c = (x === 7 || x === 8) && y >= 3 ? h : d; a = 255; } break;
        case "zaun": c = x % 3 === 0 ? d : zf() < 0.2 ? h : g; break;
        case "leiter": a = 0; if(x <= 2 || x >= 13 || y % 4 === 1){ c = x <= 2 || x >= 13 ? g : d; a = 255; } break;
        case "tuer": c = x < 2 || x > 13 || y < 2 || y > 13 ? d : (y === 7 || y === 8) ? d : g; if(x === 12 && (y === 7 || y === 8)) c = h; break;
        case "tueroben": c = x < 2 || x > 13 || y < 2 || y > 13 ? d : (x >= 4 && x <= 11 && y >= 3 && y <= 9) ? h : g; break;
        // Spiegel: Holzrahmen, silbrig-blaue Fläche, diagonale Glanzstreifen, die über beide Hälften durchlaufen (unten = untere Hälfte, y läuft nach unten)
        case "spiegelunten": var su = x < 2 || x > 13 || y > 13; c = su ? d : g; if(!su && ((x + y + 16) % 11 === 0 || (x + y + 16) % 11 === 1 && x % 2)) c = h; break;
        case "spiegeloben": var so = x < 2 || x > 13 || y < 2; c = so ? d : g; if(!so && ((x + y) % 11 === 0 || (x + y) % 11 === 1 && x % 2)) c = h; break;
        case "bettfuss": c = y % 5 === 4 ? d : (x === 0 || x === 15 || y === 0) ? d : g; break;
        case "bettkopf": c = (x === 0 || x === 15 || y === 15) ? d : (x >= 2 && x <= 13 && y >= 1 && y <= 6) ? h : g; if(y === 7 && x >= 2 && x <= 13) c = d; break;
        case "bettseite": c = y < 6 ? (y === 5 ? d : h) : (y % 4 === 3 ? d : g); break;
        case "zaubertisch": c = (x === 0 || x === 15 || y === 0 || y === 15) ? d : ((x + y) % 4 === 0 ? h : g); break;
        case "zaubertischseite": c = y % 5 === 4 ? d : (x % 4 === 1 ? h : g); break;
        case "zauberkugel": var dd = Math.hypot(x - 7.5, y - 7.5); c = dd < 3 ? h : dd < 6.5 ? ((x * 3 + y * 5) % 7 === 0 ? h : g) : d; break;
        case "basalt": r = zf(); c = r < 0.25 ? d : r < 0.33 ? h : g; if(x % 5 === 0 && y % 4 !== 0) c = d; break;
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
