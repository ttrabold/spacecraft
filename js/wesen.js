// Wesen: Gegner, Geschosse und Beutekugeln in welt.wesen (Map nach ID) – in Stufe 3 rechnet sie der Gastgeber.
// Dazu die Körperphysik, die Spieler und Gegner gemeinsam nutzen.
SC.bewegeKoerper = function(welt, pos, achse, d, breite, hoehe){
  if(d === 0) return false;
  var hb = breite / 2, eps = 1e-4, neu = pos.slice(); neu[achse] += d;
  var x0 = Math.floor(neu[0] - hb), x1 = Math.floor(neu[0] + hb - eps);
  var y0 = Math.floor(neu[1]), y1 = Math.floor(neu[1] + hoehe - eps);
  var z0 = Math.floor(neu[2] - hb), z1 = Math.floor(neu[2] + hb - eps);
  for(var x = x0; x <= x1; x++) for(var y = y0; y <= y1; y++) for(var z = z0; z <= z1; z++){
    var b = SC.BLOECKE[welt.holeBlock(x, y, z)];
    if(!b || !b.fest) continue;
    // An die Blockkante setzen
    if(achse === 0) pos[0] = d > 0 ? x - hb : x + 1 + hb;
    else if(achse === 1) pos[1] = d > 0 ? y - hoehe : y + 1;
    else pos[2] = d > 0 ? z - hb : z + 1 + hb;
    return true;
  }
  pos[achse] = neu[achse];
  return false;
};

SC.Wesen = { GRENZE: { gegner: 12, geschoss: 60, kugel: 40 } };
SC.Wesen.anzahl = function(welt, art){ var n = 0; welt.wesen.forEach(function(e){ if(e.art === art) n++; }); return n; };
SC.Wesen.neu = function(welt, art, daten){
  if(SC.Wesen.anzahl(welt, art) >= (SC.Wesen.GRENZE[art] || Infinity)) return null;
  var e = { id: welt.naechsteId++, art: art, pos: [0, 0, 0], geschw: [0, 0, 0], breite: 0.8, hoehe: 1.8, alter: 0 };
  for(var k in daten) e[k] = daten[k];
  // Bei Geschossen heißt die Geschossart "typ"; "art" bleibt die Kategorie
  if(daten && daten.art){ e.typ = daten.art; }
  e.art = art;
  e.pos = e.pos.slice(); e.geschw = e.geschw.slice();
  welt.wesen.set(e.id, e);
  return e;
};
SC.Wesen.entferne = function(welt, id){ welt.wesen.delete(id); };

// Strecke von a nach b gegen den Quader eines Körpers (Füße mittig); liefert Anteil 0..1 oder -1
SC.Wesen.strecke = function(a, b, pos, breite, hoehe){
  var lo = [pos[0] - breite / 2, pos[1], pos[2] - breite / 2], hi = [pos[0] + breite / 2, pos[1] + hoehe, pos[2] + breite / 2], t0 = 0, t1 = 1;
  for(var i = 0; i < 3; i++){
    var d = b[i] - a[i];
    if(Math.abs(d) < 1e-9){ if(a[i] < lo[i] || a[i] > hi[i]) return -1; continue; }
    var u = (lo[i] - a[i]) / d, v = (hi[i] - a[i]) / d;
    if(u > v){ var t = u; u = v; v = t; }
    t0 = Math.max(t0, u); t1 = Math.min(t1, v);
    if(t0 > t1) return -1;
  }
  return t0;
};

SC.Geschoss = {};
// Bewegt ein Geschoss um dt; Treffer gegen Blöcke, Gegner (Team Spieler) oder den Spieler (Team Gegner).
// spieler: eine Figur oder (im Raum) ein Array [{id, pos}]
SC.Geschoss.schritt = function(welt, g, dt, spieler){
  if(!g._fliegt){ g.geschw = [g.richtung[0] * g.tempo, g.richtung[1] * g.tempo, g.richtung[2] * g.tempo]; g._fliegt = true; }
  var typ = g.typ || g.art;
  if(typ === "spucke") g.geschw[1] -= 12 * dt;
  g.lebensdauer -= dt;
  if(g.lebensdauer <= 0) return { treffer: "ende" };
  var a = g.pos, b = [a[0] + g.geschw[0] * dt, a[1] + g.geschw[1] * dt, a[2] + g.geschw[2] * dt];
  var d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], len = Math.hypot(d[0], d[1], d[2]);
  var bestT = 2, best = null;
  var zb = len > 0 ? SC.zielen(welt, a, [d[0] / len, d[1] / len, d[2] / len], len) : null;
  if(zb){
    // Abstand bis zur getroffenen Blockfläche grob über den Blockmittelpunkt
    var P = welt.planet.groesse, mx = zb.x + 0.5 + P * Math.round((a[0] - zb.x - 0.5) / P), mz = zb.z + 0.5 + P * Math.round((a[2] - zb.z - 0.5) / P);
    bestT = Math.max(0, (Math.hypot(mx - a[0], zb.y + 0.5 - a[1], mz - a[2]) - 0.5) / len); best = { treffer: "block", x: zb.x, y: zb.y, z: zb.z };
  }
  if(g.team === "spieler"){
    welt.wesen.forEach(function(e){
      if(e.art !== "gegner") return;
      var t = SC.Wesen.strecke(a, b, [e.pos[0], e.pos[1] - 0.1, e.pos[2]], e.breite + 0.5, e.hoehe + 0.3);
      if(t >= 0 && t < bestT){ bestT = t; best = { treffer: "wesen", id: e.id }; }
    });
    // Spaßkampf: mit Spieler-Array (nur dann übergeben) treffen Spieler-Geschosse alle außer dem Schützen
    if(Array.isArray(spieler)) spieler.forEach(function(p){
      if(p.id === g.schuetze) return;
      var tp = SC.Wesen.strecke(a, b, p.pos, SC.PHYSIK.breite, SC.PHYSIK.hoehe);
      if(tp >= 0 && tp < bestT){ bestT = tp; best = { treffer: "spieler", id: p.id }; }
    });
  } else if(Array.isArray(spieler)){
    // Im Raum: mehrere Spieler {id, pos}; Treffer nennt die ID
    spieler.forEach(function(p){
      var tp = SC.Wesen.strecke(a, b, p.pos, SC.PHYSIK.breite, SC.PHYSIK.hoehe);
      if(tp >= 0 && tp < bestT){ bestT = tp; best = { treffer: "spieler", id: p.id }; }
    });
  } else if(spieler){
    var ts = SC.Wesen.strecke(a, b, spieler.pos, SC.PHYSIK.breite, SC.PHYSIK.hoehe);
    if(ts >= 0 && ts < bestT){ bestT = ts; best = { treffer: "spieler" }; }
  }
  var f = best ? Math.min(1, bestT) : 1;
  g.pos = [a[0] + d[0] * f, a[1] + d[1] * f, a[2] + d[2] * f];
  return best;
};

SC.Kugel = {};
// Beutekugel: fällt, schwebt, wird beim Darüberlaufen eingesammelt, verschwindet nach 5 Minuten
SC.Kugel.schritt = function(welt, k, spieler, rucksack, dt){
  k.alter += dt;
  if(k.alter > 300){ SC.Wesen.entferne(welt, k.id); return "verschwunden"; }
  k.geschw[1] -= 12 * dt;
  for(var a = 0; a < 3; a++) if(SC.bewegeKoerper(welt, k.pos, a, k.geschw[a] * dt, 0.3, 0.3)){ k.geschw[a] = 0; if(a !== 1) k.geschw[a] = 0; }
  k.geschw[0] *= 0.9; k.geschw[2] *= 0.9;
  var p = spieler.pos, P = welt.planet.groesse;
  var dx = SC.mod(k.pos[0] - p[0] + P / 2, P) - P / 2, dz = SC.mod(k.pos[2] - p[2] + P / 2, P) - P / 2, dy = k.pos[1] - (p[1] + 0.9);
  var abst = Math.hypot(dx, dy, dz);
  // Weggeworfenes bleibt eine Weile liegen
  if(k.sperre > 0){ k.sperre -= dt; return "liegt"; }
  // Sanfter Magnet: Beute in der Nähe schwebt zum Spieler
  if(abst < 3.5 && abst > 0.01 && k.alter > 0.6){ var f = Math.min(1, 5 * dt / abst); k.pos[0] -= dx * f; k.pos[1] -= dy * f * 0.5; k.pos[2] -= dz * f; }
  if(abst <= 1.5){
    var rest = rucksack.lege(k.sache);
    if(rest === 0){ SC.Wesen.entferne(welt, k.id); return "aufgesammelt"; }
    if(k.sache.block !== undefined) k.sache.anzahl = rest;
    return "voll";
  }
  return "liegt";
};
