// Bauwerke: deterministisch pro Region (128 × 128 Blöcke) aus dem Seed platziert.
// In Stufe 1 leer; "plaetze" markieren, wo in Stufe 2 Gegner und Kisten hinkommen.
SC.Bauwerke = {};
(function(){
  var REGION = 128, B = SC.B;

  // Voxelfeld eines Bauwerks; -1 = nicht Teil des Bauwerks (Gelände bleibt)
  function Raster(w, h, d){ this.w = w; this.h = h; this.d = d; this.v = new Int8Array(w * h * d).fill(-1); }
  Raster.prototype.setze = function(x, y, z, id){ if(x >= 0 && y >= 0 && z >= 0 && x < this.w && y < this.h && z < this.d) this.v[(y * this.d + z) * this.w + x] = id; };
  Raster.prototype.hole = function(x, y, z){ return this.v[(y * this.d + z) * this.w + x]; };
  Raster.prototype.fuelle = function(x0, y0, z0, x1, y1, z1, id){ for(var y = y0; y <= y1; y++) for(var z = z0; z <= z1; z++) for(var x = x0; x <= x1; x++) this.setze(x, y, z, id); };
  // Hohler Kasten: Wände und Decke/Boden aus id, innen Luft
  Raster.prototype.kasten = function(x0, y0, z0, x1, y1, z1, id){ this.fuelle(x0, y0, z0, x1, y1, z1, id); this.fuelle(x0 + 1, y0 + 1, z0 + 1, x1 - 1, y1 - 1, z1 - 1, B.LUFT); };

  // --- Vorlagen. Jede liefert { raster, plaetze } in lokalen Koordinaten ---

  function herrenhaus(z){
    var w = 15, d = 13, f = 4, r = new Raster(w, f + 12, d), p = [];
    r.fuelle(0, 0, 0, w - 1, f - 1, d - 1, B.STEIN);                  // Sockel
    r.kasten(0, f - 1, 0, w - 1, f + 4, d - 1, B.STEINZIEGEL);        // Erdgeschoss
    r.kasten(0, f + 4, 0, w - 1, f + 8, d - 1, B.STEINZIEGEL);        // Obergeschoss
    r.fuelle(1, f - 1, 1, w - 2, f - 1, d - 2, B.BRETTER);            // Böden
    r.fuelle(1, f + 4, 1, w - 2, f + 4, d - 2, B.BRETTER);
    for(var i = 0; i < 4; i++) r.fuelle(i, f + 9 + i, i, w - 1 - i, f + 9 + i, d - 1 - i, B.BRETTER); // Dach
    r.fuelle(1, f + 9, 1, w - 2, f + 9, d - 2, B.LUFT);
    r.fuelle(7, f, 0, 7, f + 1, 0, B.LUFT);                           // Tür
    for(var x = 2; x < w - 2; x += 4){ r.setze(x, f + 2, 0, B.GLAS); r.setze(x, f + 2, d - 1, B.GLAS); r.setze(x, f + 6, 0, B.GLAS); r.setze(x, f + 6, d - 1, B.GLAS); }
    for(var s = 0; s < 4; s++) r.setze(w - 3, f + s, 3 + s, B.BRETTER); // Treppe nach oben
    r.fuelle(w - 3, f + 4, 3, w - 3, f + 4, 7, B.LUFT);
    r.setze(1, f + 3, 1, B.LEUCHT_GRUEN); r.setze(w - 2, f + 7, d - 2, B.LEUCHT_GRUEN);
    p.push({ typ: "kiste", x: 2, y: f + 5, z: d - 3 }, { typ: "kiste", x: w - 3, y: f, z: d - 3 });
    p.push({ typ: "gegner", x: 5, y: f, z: 5 }, { typ: "gegner", x: 9, y: f + 5, z: 6 }, { typ: "gegner", x: 4, y: f + 5, z: 3 });
    return { raster: r, plaetze: p };
  }

  function station(z){
    var w = 13, d = 13, f = 3, r = new Raster(w, f + 9, d), p = [];
    r.fuelle(0, 0, 0, w - 1, f - 1, d - 1, B.BETON);
    r.kasten(0, f - 1, 0, w - 1, f + 5, d - 1, B.METALL);
    r.fuelle(1, f - 1, 1, w - 2, f - 1, d - 2, B.METALLGITTER);
    r.kasten(4, f + 5, 4, 8, f + 8, 8, B.METALL);                     // Aufbau mit Antenne
    r.fuelle(5, f + 5, 5, 7, f + 5, 7, B.LUFT);
    r.setze(6, f + 8, 6, B.TECHNIK);
    r.fuelle(6, f, 0, 6, f + 1, 0, B.LUFT);                           // Schleuse
    for(var x = 2; x < w - 2; x += 3){ r.setze(x, f + 2, 0, B.GLAS); r.setze(x, f + 2, d - 1, B.GLAS); r.setze(0, f + 2, x, B.GLAS); r.setze(w - 1, f + 2, x, B.GLAS); }
    r.setze(1, f, 1, B.TECHNIK); r.setze(w - 2, f, 1, B.TECHNIK); r.setze(1, f, d - 2, B.TECHNIK);
    r.setze(3, f + 4, 3, B.LEUCHT_CYAN); r.setze(w - 4, f + 4, d - 4, B.LEUCHT_CYAN);
    p.push({ typ: "kiste", x: w - 2, y: f, z: d - 2 });
    p.push({ typ: "gegner", x: 4, y: f, z: 7 }, { typ: "gegner", x: 8, y: f, z: 4 });
    return { raster: r, plaetze: p };
  }

  function lager(z){
    var w = 11, d = 11, r = new Raster(w, 6, d), p = [];
    r.fuelle(0, 0, 0, w - 1, 0, d - 1, B.KIES);
    for(var x = 0; x < w; x += 2){ r.setze(x, 1, 0, B.STAMM); r.setze(x, 1, d - 1, B.STAMM); r.setze(0, 1, x, B.STAMM); r.setze(w - 1, 1, x, B.STAMM); }
    r.fuelle(1, 1, 1, w - 2, 5, d - 2, B.LUFT);
    function zelt(x0, z0, wolle){ for(var y = 0; y < 3; y++) r.fuelle(x0 + y, 1 + y, z0, x0 + 4 - y, 1 + y, z0 + 2, wolle); r.fuelle(x0 + 2, 1, z0, x0 + 2, 2, z0, B.LUFT); }
    zelt(1, 1, B.WOLLE_ROT); zelt(5, 6, B.WOLLE_BLAU);
    r.setze(5, 1, 4, B.KRISTALL);                                     // Lagerfeuer-Ersatz: leuchtender Kristall
    p.push({ typ: "kiste", x: 3, y: 1, z: 2 });
    p.push({ typ: "gegner", x: 4, y: 1, z: 5 }, { typ: "gegner", x: 7, y: 1, z: 3 });
    return { raster: r, plaetze: p };
  }

  // Unterirdisch: 3 × 3 Räume mit Gängen, Schacht nach oben (schachtHoehe bis zur Oberfläche)
  function dungeon(schachtHoehe){
    var w = 25, d = 25, h = Math.max(8, schachtHoehe + 1), r = new Raster(w, h, d), p = [];
    r.fuelle(0, 0, 0, w - 1, 6, d - 1, B.STEINZIEGEL);
    for(var i = 0; i < 3; i++) for(var j = 0; j < 3; j++){
      var x0 = 1 + i * 8, z0 = 1 + j * 8;
      r.fuelle(x0, 1, z0, x0 + 6, 5, z0 + 6, B.LUFT);
      r.setze(x0 + 3, 5, z0 + 3, B.LEUCHTPILZ);
      if(i < 2) r.fuelle(x0 + 7, 1, z0 + 2, x0 + 7, 3, z0 + 4, B.LUFT);
      if(j < 2) r.fuelle(x0 + 2, 1, z0 + 7, x0 + 4, 3, z0 + 7, B.LUFT);
      p.push({ typ: "gegner", x: x0 + 3, y: 1, z: z0 + 3 });
    }
    r.fuelle(17, 1, 17, 23, 1, 23, B.BETON);                          // Schatzraum
    p.push({ typ: "kiste", x: 20, y: 2, z: 20 }, { typ: "kiste", x: 18, y: 2, z: 22 });
    // Schacht aus dem ersten Raum nach oben
    for(var y = 6; y < h; y++){ r.fuelle(2, y, 2, 4, y, 4, B.STEINZIEGEL); r.setze(3, y, 3, B.LUFT); }
    r.fuelle(3, 5, 3, 3, 5, 3, B.LUFT);
    for(var y2 = 2; y2 < h; y2 += 6) r.setze(2, y2, 3, B.LEUCHTPILZ);
    return { raster: r, plaetze: p };
  }

  var VORLAGEN = { herrenhaus: herrenhaus, station: station, lager: lager };

  function gelaende(planet){ return planet._gelaende || (planet._gelaende = new SC.Generator(planet)); }

  function baue(planet, typ, x, y, z, vorlage){
    var v = vorlage, P = planet.groesse;
    var b = { typ: typ, x: SC.mod(x, P), y: y, z: SC.mod(z, P), breite: v.raster.w, hoehe: v.raster.h, tiefe: v.raster.d, plaetze: [] };
    b.block = function(lx, ly, lz){ return v.raster.hole(lx, ly, lz); };
    v.plaetze.forEach(function(q){ b.plaetze.push({ typ: q.typ, x: SC.mod(b.x + q.x, P), y: b.y + q.y, z: SC.mod(b.z + q.z, P) }); });
    return b;
  }

  SC.Bauwerke.inRegion = function(planet, rx, rz){
    var n = planet.groesse / REGION; rx = SC.mod(rx, n); rz = SC.mod(rz, n);
    var cache = planet._bauwerke || (planet._bauwerke = {}), k = rx + "," + rz;
    if(cache[k]) return cache[k];
    var zf = SC.zufall(SC.hash3(planet.seed, rx, rz, 7001)), liste = [], g = gelaende(planet);
    // Ein Bauwerk an der Oberfläche
    var w = zf(), typ = w < 0.4 ? "herrenhaus" : w < 0.7 ? "station" : "lager";
    var ox = rx * REGION + 8 + Math.floor(zf() * (REGION - 16)), oz = rz * REGION + 8 + Math.floor(zf() * (REGION - 16));
    var vorlage = VORLAGEN[typ]();
    var boden = Math.max(g.hoehe(ox + (vorlage.raster.w >> 1), oz + (vorlage.raster.d >> 1)), 49);
    var sockel = typ === "herrenhaus" ? 4 : typ === "station" ? 3 : 0;
    liste.push(baue(planet, typ, ox, boden + 1 - sockel, oz, vorlage));
    // Meist auch ein Dungeon darunter
    if(zf() < 0.7){
      var dx = rx * REGION + Math.floor(zf() * (REGION - 25)), dz = rz * REGION + Math.floor(zf() * (REGION - 25));
      var dy = 10 + Math.floor(zf() * 14), oben = g.hoehe(dx + 3, dz + 3);
      liste.push(baue(planet, "dungeon", dx, dy, dz, dungeon(Math.max(0, oben - dy))));
    }
    cache[k] = liste;
    return liste;
  };

  // Überlappung zweier Intervalle auf dem umschlagenden Ring der Länge P
  function ueberlappt(a, alen, b, blen, P){ return SC.mod(b - a, P) < alen || SC.mod(a - b, P) < blen; }

  SC.Bauwerke.imChunk = function(planet, cx, cz){
    var P = planet.groesse, n = P / REGION, x0 = SC.mod(cx, P / 16) * 16, z0 = SC.mod(cz, P / 16) * 16;
    var rx = Math.floor(x0 / REGION), rz = Math.floor(z0 / REGION), aus = [];
    for(var i = -1; i <= 0; i++) for(var j = -1; j <= 0; j++){
      SC.Bauwerke.inRegion(planet, rx + i, rz + j).forEach(function(b){
        if(ueberlappt(b.x, b.breite, x0, 16, P) && ueberlappt(b.z, b.tiefe, z0, 16, P)) aus.push(b);
      });
    }
    return aus;
  };
})();
