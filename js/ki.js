// Gegner-KI: Sichtlinie, Zustände (ruhe, angriff), Verhalten je Art; bewegt den Gegner selbst
// und liefert Aktionen (Schuss, Hieb, Stampfen), die der Kampf umsetzt. Keine volle Wegsuche.
SC.KI = {};
(function(){
  var SCHWERE = 32, SPRUNG = 8.6, LEINE = 30;

  function ring(welt, a, b){ var P = welt.planet.groesse; return [SC.mod(b[0] - a[0] + P / 2, P) - P / 2, b[1] - a[1], SC.mod(b[2] - a[2] + P / 2, P) - P / 2]; }

  SC.KI.sieht = function(welt, von, zu, reichweite){
    var d = ring(welt, von, zu), l = Math.hypot(d[0], d[1], d[2]);
    if(l > reichweite) return false;
    if(l < 0.5) return true;
    var t = SC.zielen(welt, von, [d[0] / l, d[1] / l, d[2] / l], l);
    if(!t) return true;
    var b = SC.BLOECKE[welt.holeBlock(t.x, t.y, t.z)];
    return !!b && b.durchsichtig;          // Glas und Gitter verdecken nicht
  };

  // Boden in höchstens 3 Blöcken unter der Stelle?
  function bodenNah(welt, x, y, z){ for(var i = 1; i <= 4; i++){ var b = SC.BLOECKE[welt.holeBlock(x, y - i, z)]; if(b && b.fest) return true; } return false; }

  function bewege(welt, g, vx, vz, dt){
    g.geschw[1] -= SCHWERE * dt; if(g.geschw[1] < -40) g.geschw[1] = -40;
    var vorher = [g.pos[0], g.pos[2]];
    // Keine Stürze über 3 Blöcke
    var nx = g.pos[0] + vx * dt * 3, nz = g.pos[2] + vz * dt * 3;
    if(g.aufBoden && !bodenNah(welt, nx, g.pos[1] + 0.5, nz)){ vx = 0; vz = 0; }
    var stoss = false;
    if(SC.bewegeKoerper(welt, g.pos, 0, vx * dt, g.breite, g.hoehe)) stoss = true;
    if(SC.bewegeKoerper(welt, g.pos, 2, vz * dt, g.breite, g.hoehe)) stoss = true;
    var dy = g.geschw[1] * dt, unten = SC.bewegeKoerper(welt, g.pos, 1, dy, g.breite, g.hoehe);
    if(unten){ g.aufBoden = dy < 0; g.geschw[1] = 0; } else g.aufBoden = false;
    if(stoss && g.aufBoden) g.geschw[1] = SPRUNG;        // über eine Stufe springen
    var P = welt.planet.groesse; g.pos[0] = SC.mod(g.pos[0], P); g.pos[2] = SC.mod(g.pos[2], P);
    // Feststecken erkennen
    var weg = Math.hypot(SC.mod(g.pos[0] - vorher[0] + P / 2, P) - P / 2, SC.mod(g.pos[2] - vorher[1] + P / 2, P) - P / 2);
    if(Math.hypot(vx, vz) > 0.3 && weg < 0.02 * Math.hypot(vx, vz) * dt * 10) g.fest = (g.fest || 0) + dt; else g.fest = 0;
    if(g.fest > 3 || g.pos[1] < 1) aufgeben(g);
  }

  // Feststecken: Bosse kehren geheilt heim (verschwinden nie), andere Gegner werden entfernt
  function aufgeben(g){
    if(g.boss){ g.pos = (g.heim || g.pos).slice(); g.geschw = [0, 0, 0]; g.lp = g.lpMax || g.lp; g.fest = 0; g.bemerkt = false; }
    else g.entfernen = true;
  }

  function richtungZu(d){ var l = Math.hypot(d[0], d[2]) || 1; return [d[0] / l, d[2] / l]; }

  function schuss(g, def, ziel, d, zf, schw){
    var w = def.waffe, gen = SC.SCHWIERIGKEIT[schw] ? SC.SCHWIERIGKEIT[schw].genauigkeit : 0.6;
    var str = w.streuung * (1.6 - gen), auge = [g.pos[0], g.pos[1] + g.hoehe * 0.75, g.pos[2]];
    var dz = [d[0], d[1] + 1.1 - g.hoehe * 0.75, d[2]];
    if(w.art === "spucke"){ var hd = Math.hypot(dz[0], dz[2]); dz[1] += hd * hd * 6 / (w.tempo * w.tempo); }   // im Bogen zielen
    var l = Math.hypot(dz[0], dz[1], dz[2]) || 1, r = [dz[0] / l + (zf() - 0.5) * str, dz[1] / l + (zf() - 0.5) * str, dz[2] / l + (zf() - 0.5) * str];
    var rl = Math.hypot(r[0], r[1], r[2]);
    return { art: "schuss", pos: auge, richtung: [r[0] / rl, r[1] / rl, r[2] / rl], tempo: w.tempo, schaden: def.schaden(g.stufe), geschossArt: w.art, farbe: w.farbe };
  }

  SC.KI.schritt = function(welt, g, ziel, dt, zf, schw){
    var def = SC.GEGNER[g.gegnerArt], akt = [];
    if(!def){ g.entfernen = true; return akt; }
    var drin = SC.BLOECKE[welt.holeBlock(g.pos[0], g.pos[1] + 0.3, g.pos[2])];
    if(drin && drin.fest){ aufgeben(g); if(g.entfernen) return akt; }
    g.cd = Math.max(0, (g.cd || 0) - dt); g.cd2 = Math.max(0, (g.cd2 || 0) - dt); g.zeit = (g.zeit || 0) + dt;
    if(g.sturmBis > 0) g.sturmBis -= dt;
    var heim = ring(welt, g.pos, g.heim || g.pos), heimAbst = Math.hypot(heim[0], heim[2]);
    var d = ziel ? ring(welt, g.pos, ziel.pos) : null, abst = d ? Math.hypot(d[0], d[2]) : Infinity;
    var sieht = !!(ziel && ziel.sichtbar && abst <= def.sicht && SC.KI.sieht(welt, [g.pos[0], g.pos[1] + g.hoehe * 0.8, g.pos[2]], [ziel.pos[0], ziel.pos[1] + 1.5, ziel.pos[2]], def.sicht));
    if(sieht){ g.bemerkt = true; g.vergessen = 6; }
    else if(g.bemerkt && (g.vergessen -= dt) <= 0) g.bemerkt = false;
    if(!ziel) g.bemerkt = false;

    var vx = 0, vz = 0, tempo = def.tempo;
    g.blockt = false;
    if(heimAbst > LEINE){
      var h = richtungZu(heim); vx = h[0] * tempo; vz = h[1] * tempo; g.bemerkt = false;
    } else if(g.bemerkt && d){
      var r = richtungZu(d), seit = [-r[1], r[0]];
      g.blick = Math.atan2(-d[0], -d[2]);
      if(!g.seiteZeit || g.zeit > g.seiteZeit){ g.seite = zf() < 0.5 ? -1 : 1; g.seiteZeit = g.zeit + 1.5 + zf() * 1.5; }
      var v = def.verhalten;
      if(v === "fernkampf" || v === "ausweicher" || v === "spucker"){
        var a = def.abstand, m = abst < a[0] ? -1 : abst > a[1] ? 1 : 0, s = v === "ausweicher" ? 0.7 : 0.5;
        vx = (r[0] * m + seit[0] * g.seite * s) * tempo; vz = (r[1] * m + seit[1] * g.seite * s) * tempo;
        if(v === "ausweicher" && g.aufBoden && zf() < 0.02) g.geschw[1] = SPRUNG;
        if(sieht && g.cd <= 0 && abst <= a[1] + 6){ akt.push(schuss(g, def, ziel, d, zf, schw)); g.cd = def.waffe.rate * (0.8 + zf() * 0.4); }
      } else if(v === "nahkampf"){
        if(abst > def.hieb.reichweite * 0.8){ vx = r[0] * tempo; vz = r[1] * tempo; if(g.aufBoden && zf() < 0.03) g.geschw[1] = 6; }
        if(abst <= def.hieb.reichweite && g.cd <= 0){ akt.push({ art: "hieb", reichweite: def.hieb.reichweite, schaden: def.schaden(g.stufe) }); g.cd = def.hieb.rate; }
      } else if(v === "ritter"){
        g.blockt = g.cd > 0.3;                     // blockt, solange er nicht selbst angreift
        if(abst > 2){ vx = r[0] * tempo; vz = r[1] * tempo; }
        if(abst > 4 && abst < 9 && g.cd2 <= 0 && g.aufBoden){ g.geschw[1] = 9; g.sprungRichtung = r; g.sprungZeit = 0.6; g.cd2 = 4; }
        if(g.sprungZeit > 0){ g.sprungZeit -= dt; vx = g.sprungRichtung[0] * tempo * 3; vz = g.sprungRichtung[1] * tempo * 3; }
        if(abst <= def.hieb.reichweite && g.cd <= 0){ akt.push({ art: "hieb", reichweite: def.hieb.reichweite, schaden: def.schaden(g.stufe) }); g.cd = def.hieb.rate; }
      } else if(v === "koloss"){
        if(g.sturmBis > 0){ vx = g.sturmRichtung[0] * tempo * 3.5; vz = g.sturmRichtung[1] * tempo * 3.5; }
        else {
          if(abst > 3){ vx = r[0] * tempo; vz = r[1] * tempo; }
          if(abst < def.stampf.radius && g.cd2 <= 0){ akt.push({ art: "stampf", radius: def.stampf.radius, schaden: def.schaden(g.stufe) }); g.cd2 = def.stampf.rate; }
          else if(abst > 7 && abst < 16 && g.cd <= 0){ g.sturmBis = 1.2; g.sturmRichtung = r; g.cd = 6; }
          if(abst <= def.hieb.reichweite && g.cd <= 0){ akt.push({ art: "hieb", reichweite: def.hieb.reichweite, schaden: def.schaden(g.stufe) }); g.cd = def.hieb.rate; }
        }
      }
    } else if(heimAbst > 2 && !g.bemerkt){
      var hh = richtungZu(heim); vx = hh[0] * tempo * 0.4; vz = hh[1] * tempo * 0.4;
    }
    bewege(welt, g, vx, vz, dt);
    return akt;
  };
})();
