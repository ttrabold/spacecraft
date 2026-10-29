// Landschaften der neuen Planeten (Stufe 5a). Der Startplanet läuft weiter über den bisherigen Pfad in js/generator.js.
// Je Landschaft: hoehe(gen, x, z), biom(gen, x, z, h), saeule(gen, x, z, h, biom) → {oben, unter, tiefe, fluessig, fluessigBis},
// baum(gen, x, z, biom, hash) → null | {hoehe, krone, blatt}; keinLanden: Biome, in denen kein Landepunkt liegt.
SC.LANDSCHAFTEN = {};
SC.Landschaft = {};
(function(){
  var B = SC.B, H = SC.CHUNK.H, MEER = SC.MEER;

  // Feuer und Eis: Eisfelder, Schnee, Gletscher; Vulkankegel aus Basalt mit Lavakrater; Lavaseen statt Wasser
  SC.LANDSCHAFTEN.glutfrost = {
    keinLanden: ["lavasee", "vulkan"],
    hoehe: function(g, x, z){
      var P = g.planet.groesse, h = 51 + g.rHoehe.oktaven(x, z, P, 256, 5) * 14, m = g.rBerge.oktaven(x, z, P, 512, 3);
      if(m > 0.2) h += (m - 0.2) * 150;                                       // Vulkankegel
      if(m > 0.42) h -= (m - 0.42) * 260;                                     // Krater oben im Kegel
      return Math.max(6, Math.min(118, Math.round(h)));
    },
    biom: function(g, x, z, h){
      var P = g.planet.groesse, m = g.rBerge.oktaven(x, z, P, 512, 3);
      if(m > 0.2) return "vulkan";
      if(h <= MEER) return "lavasee";
      if(g.rTemp.oktaven(x, z, P, 512, 2) > 0.15) return h > 62 ? "gletscher" : "eisfeld";
      return "schneefeld";
    },
    saeule: function(g, x, z, h, biom){
      var P = g.planet.groesse;
      if(biom === "vulkan"){ var krater = g.rBerge.oktaven(x, z, P, 512, 3) > 0.42; return { oben: B.BASALT, unter: B.BASALT, tiefe: 8, fluessig: krater ? B.LAVA : null, fluessigBis: krater ? h + 2 : 0 }; }
      if(biom === "lavasee") return { oben: B.BASALT, unter: B.BASALT, tiefe: 4, fluessig: B.LAVA, fluessigBis: MEER };
      if(biom === "gletscher") return { oben: B.EIS, unter: B.EIS, tiefe: 5 };
      if(biom === "eisfeld") return { oben: B.EIS, unter: B.STEIN, tiefe: 2 };
      return { oben: B.SCHNEE, unter: B.ERDE, tiefe: 3 };
    },
    // Eisbäume: wenige, kurze Stämme mit eisblauer Krone (Blätter in der Palette)
    baum: function(g, x, z, biom, hash){ return biom === "schneefeld" && hash < 6 ? { hoehe: 4 + hash % 2, krone: 2, blatt: B.BLAETTER } : null; }
  };

  // Dschungel und Sumpf: Riesenbäume, Schlamm und flaches trübes Wasser, viele Leuchtpflanzen
  SC.LANDSCHAFTEN.rankenmoor = {
    keinLanden: ["sumpf", "see"],
    hoehe: function(g, x, z){
      var P = g.planet.groesse, h = 54 + g.rHoehe.oktaven(x, z, P, 256, 5) * 10, m = g.rBerge.oktaven(x, z, P, 512, 3);
      if(m > 0.3) h += (m - 0.3) * 70;
      // Sümpfe: flach um den Meeresspiegel
      if(g.rFeucht.oktaven(x, z, P, 512, 2) > 0.12 && h < MEER + 8) h = MEER - 1 + Math.round(g.rHoehe.flach(x, z, P, 32) * 2);
      return Math.max(6, Math.min(110, Math.round(h)));
    },
    biom: function(g, x, z, h){
      var P = g.planet.groesse;
      if(g.rFeucht.oktaven(x, z, P, 512, 2) > 0.12 && h <= MEER + 2) return "sumpf";
      if(h <= MEER) return "see";
      return "dschungel";
    },
    saeule: function(g, x, z, h, biom){
      if(biom === "sumpf") return { oben: B.SCHLAMM, unter: B.ERDE, tiefe: 3, fluessig: B.WASSER, fluessigBis: MEER };
      if(biom === "see") return { oben: B.SCHLAMM, unter: B.ERDE, tiefe: 3, fluessig: B.WASSER, fluessigBis: MEER };
      return { oben: B.GRAS, unter: B.ERDE, tiefe: 3 };
    },
    // Riesenbäume im Dschungel (10–16 hoch, Krone 3–4), im Sumpf kleinere
    baum: function(g, x, z, biom, hash){
      if(biom === "dschungel" && hash < 16) return { hoehe: 10 + hash % 7, krone: 3, blatt: B.BLAETTER };
      if(biom === "sumpf" && hash < 8) return { hoehe: 5 + hash % 3, krone: 2, blatt: B.BLAETTER };
      return null;
    },
    leuchtpilze: 40 // je 1024 Säulen, deutlich mehr als auf dem Startplaneten
  };

  // Baum mit Stamm und kugeliger Krone in den Chunk c schreiben (Teile außerhalb des Chunks entfallen)
  function baum(c, x0, z0, P, tx, tz, th, b){
    function setze(wx, y, wz, id, nurLuft){
      var lx = SC.mod(wx - x0, P), lz = SC.mod(wz - z0, P);
      if(lx >= 16 || lz >= 16 || y < 1 || y >= H) return;
      var i = SC.idx(lx, y, lz); if(nurLuft && c[i] !== B.LUFT) return; c[i] = id;
    }
    var spitze = th + b.hoehe;
    for(var dy = -b.krone; dy <= b.krone; dy++) for(var dx = -b.krone; dx <= b.krone; dx++) for(var dz = -b.krone; dz <= b.krone; dz++)
      if(dx * dx + dy * dy * 1.6 + dz * dz <= b.krone * b.krone + 1) setze(tx + dx, spitze + dy, tz + dz, b.blatt, true);
    for(var y = th + 1; y <= spitze; y++) setze(tx, y, tz, B.STAMM, false);
  }

  // Chunk eines neuen Planeten: Säulen nach den Regeln, Höhlen und Kristalladern wie auf dem Startplaneten, Bäume, Bauwerke
  SC.Landschaft.chunk = function(g, cx, cz){
    var L = g._land(), P = g.planet.groesse, n = P / 16, s = g.planet.seed;
    cx = SC.mod(cx, n); cz = SC.mod(cz, n);
    var x0 = cx * 16, z0 = cz * 16, c = new Uint8Array(16 * H * 16);
    var hoehle = SC.Generator.grobFeld(g.rHoehle, P, 32, x0, z0), ader = SC.Generator.grobFeld(g.rAder, P, 16, x0, z0);
    for(var x = 0; x < 16; x++) for(var z = 0; z < 16; z++){
      var wx = x0 + x, wz = z0 + z, h = g.hoehe(wx, wz), biom = g.biom(wx, wz), sl = L.saeule(g, wx, wz, h, biom);
      c[SC.idx(x, 0, z)] = B.GRUNDGESTEIN;
      for(var y = 1; y <= h; y++){
        var id = y === h ? sl.oben : y > h - (sl.tiefe || 3) ? sl.unter : B.STEIN;
        if(id === B.STEIN && y < h - 6 && ader(x, y, z) > 0.55) id = B.KRISTALL;
        if(y > 4 && y < h - 1 + (h > MEER + 3 ? 2 : -6) && hoehle(x, y, z) > 0.42) id = B.LUFT;
        c[SC.idx(x, y, z)] = id;
      }
      if(sl.fluessig) for(var yw = h + 1; yw <= sl.fluessigBis && yw < H; yw++) c[SC.idx(x, yw, z)] = sl.fluessig;
      for(var yc = 5; yc < h - 2; yc++){
        var i0 = SC.idx(x, yc, z);
        if(c[i0] === B.LUFT && c[i0 - 256] !== B.LUFT && c[i0 - 256] !== B.LEUCHTPILZ && (SC.hash3(s, wx, wz, yc) & 1023) < 12) c[i0] = B.LEUCHTPILZ;
      }
      var hz = SC.hash3(s, wx, wz, 501) & 1023;
      if(L.leuchtpilze && hz < L.leuchtpilze && c[SC.idx(x, h, z)] === sl.oben && !sl.fluessig && h + 1 < H) c[SC.idx(x, h + 1, z)] = B.LEUCHTPILZ;
    }
    // Bäume: Ursprünge aus dem Chunk und einem 5-Block-Rand (Kronen bis Radius 4)
    for(var bx = -5; bx < 21; bx++) for(var bz = -5; bz < 21; bz++){
      var tx = SC.mod(x0 + bx, P), tz = SC.mod(z0 + bz, P), hb = SC.hash3(s, tx, tz, 777) & 1023, bi = g.biom(tx, tz), b = L.baum(g, tx, tz, bi, hb);
      if(!b) continue;
      var th = g.hoehe(tx, tz);
      if(th + b.hoehe + b.krone >= H - 1) continue;
      if(L.saeule(g, tx, tz, th, bi).fluessigBis > th) continue;              // nicht im Wasser oder in Lava
      baum(c, x0, z0, P, tx, tz, th, b);
    }
    g._bauwerkePraegen(c, cx, cz);
    return c;
  };
})();
