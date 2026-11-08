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
    if(!g.fliegt){ g.geschw[1] -= SCHWERE * dt; if(g.geschw[1] < -40) g.geschw[1] = -40; }   // Flieger (def.fliegt) kennen keine Schwerkraft
    var vorher = [g.pos[0], g.pos[2]];
    // Keine Stürze über 3 Blöcke
    var nx = g.pos[0] + vx * dt * 3, nz = g.pos[2] + vz * dt * 3;
    if(!g.fliegt && g.aufBoden && !bodenNah(welt, nx, g.pos[1] + 0.5, nz)){ vx = 0; vz = 0; }
    var stoss = false;
    if(SC.bewegeKoerper(welt, g.pos, 0, vx * dt, g.breite, g.hoehe)) stoss = true;
    if(SC.bewegeKoerper(welt, g.pos, 2, vz * dt, g.breite, g.hoehe)) stoss = true;
    var dy = g.geschw[1] * dt, unten = SC.bewegeKoerper(welt, g.pos, 1, dy, g.breite, g.hoehe);
    if(unten){ g.aufBoden = dy < 0; g.geschw[1] = 0; } else g.aufBoden = false;
    if(g.fliegt) g.aufBoden = false;
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
    var dz = [d[0], d[1] + (ziel.mitte !== undefined ? ziel.mitte : 1.1) - g.hoehe * 0.75, d[2]];
    if(w.art === "spucke" || w.art === "glut"){ var hd = Math.hypot(dz[0], dz[2]); dz[1] += hd * hd * 6 / (w.tempo * w.tempo); }   // im Bogen zielen
    var l = Math.hypot(dz[0], dz[1], dz[2]) || 1, r = [dz[0] / l + (zf() - 0.5) * str, dz[1] / l + (zf() - 0.5) * str, dz[2] / l + (zf() - 0.5) * str];
    var rl = Math.hypot(r[0], r[1], r[2]);
    return { art: "schuss", pos: auge, richtung: [r[0] / rl, r[1] / rl, r[2] / rl], tempo: w.tempo, schaden: def.schaden(g.stufe), geschossArt: w.art, farbe: w.farbe };
  }

  SC.KI.schritt = function(welt, g, ziel, dt, zf, schw){
    var def = SC.GEGNER[g.gegnerArt], akt = [];
    if(!def || g.entfernen){ g.entfernen = true; return akt; }
    var drin = SC.BLOECKE[welt.holeBlock(g.pos[0], g.pos[1] + 0.3, g.pos[2])];
    if(drin && drin.fest){ aufgeben(g); if(g.entfernen) return akt; }
    g.cd = Math.max(0, (g.cd || 0) - dt); g.cd2 = Math.max(0, (g.cd2 || 0) - dt); g.cd3 = Math.max(0, (g.cd3 || 0) - dt); g.cdH = Math.max(0, (g.cdH || 0) - dt); g.zeit = (g.zeit || 0) + dt;
    g.fliegt = !!def.fliegt;
    if(g.sturmBis > 0) g.sturmBis -= dt;
    var heim = ring(welt, g.pos, g.heim || g.pos), heimAbst = Math.hypot(heim[0], heim[2]);
    var d = ziel ? ring(welt, g.pos, ziel.pos) : null, abst = d ? Math.hypot(d[0], d[2]) : Infinity;
    var sieht = !!(ziel && ziel.sichtbar && abst <= def.sicht && SC.KI.sieht(welt, [g.pos[0], g.pos[1] + g.hoehe * 0.8, g.pos[2]], [ziel.pos[0], ziel.pos[1] + (ziel.mitte !== undefined ? ziel.mitte : 1.5), ziel.pos[2]], def.sicht));
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
      if(v === "fernkampf" || v === "ausweicher" || v === "spucker" || v === "schweber"){
        var a = def.abstand, m = abst < a[0] ? -1 : abst > a[1] ? 1 : 0, s = v === "ausweicher" ? 0.7 : 0.5;
        vx = (r[0] * m + seit[0] * g.seite * s) * tempo; vz = (r[1] * m + seit[1] * g.seite * s) * tempo;
        if(v === "ausweicher" && g.aufBoden && zf() < 0.02) g.geschw[1] = SPRUNG;
        // Schweber halten sich über dem Ziel
        if(v === "schweber") g.geschw[1] = Math.max(-3, Math.min(3, (d[1] + (def.schwebehoehe || 3)) * 1.5));
        if(sieht && g.cd <= 0 && abst <= a[1] + 6){ akt.push(schuss(g, def, ziel, d, zf, schw)); g.cd = def.waffe.rate * (0.8 + zf() * 0.4); }
      } else if(v === "nahkampf"){
        // Ansturm (def.sturm): aus mittlerer Entfernung kurz mit dreifachem Tempo geradeaus
        var rammt = def.sturm && g.sturmBis > 0;
        if(def.sturm && !rammt && sieht && abst >= def.sturm.min && abst <= def.sturm.max && g.cd2 <= 0 && g.aufBoden){ g.sturmBis = def.sturm.dauer; g.sturmRichtung = r; g.cd2 = def.sturm.rate; rammt = true; }
        if(rammt){ vx = g.sturmRichtung[0] * tempo * 3; vz = g.sturmRichtung[1] * tempo * 3; }
        else if(abst > def.hieb.reichweite * 0.8){ vx = r[0] * tempo; vz = r[1] * tempo; if(g.aufBoden && zf() < 0.03) g.geschw[1] = 6; }
        // Bodenstampfer (def.stampf) wie beim Koloss, nur kleiner
        if(def.stampf && abst < def.stampf.radius && g.cd3 <= 0){ akt.push({ art: "stampf", radius: def.stampf.radius, schaden: def.schaden(g.stufe) }); g.cd3 = def.stampf.rate; }
        // Anspringen (Rankenschleicher): aus mittlerer Entfernung hoch und schnell auf das Ziel zu
        if(def.sprung && sieht && abst > 2.5 && abst <= def.sprung.reichweite && g.cd2 <= 0 && g.aufBoden){ g.geschw[1] = 10; g.sprungRichtung = r; g.sprungZeit = 0.5; g.cd2 = def.sprung.rate; }
        if(def.sprung && g.sprungZeit > 0){ g.sprungZeit -= dt; vx = g.sprungRichtung[0] * tempo * 2.5; vz = g.sprungRichtung[1] * tempo * 2.5; }
        if(abst <= def.hieb.reichweite && g.cd <= 0){ akt.push({ art: "hieb", reichweite: def.hieb.reichweite, schaden: def.schaden(g.stufe) }); g.cd = def.hieb.rate; }
      } else if(v === "kamikaze"){
        // Rennt los, bleibt in Zündreichweite stehen, nach der Zündschnur knallt es (Flächenschaden), dann ist er weg
        if(g.zuendBis > 0){
          g.zuendet = true; g.zuendBis -= dt;
          if(g.zuendBis <= 0){ akt.push({ art: "stampf", radius: def.explosion.radius, schaden: def.schaden(g.stufe) }); g.entfernen = true; g.zuendet = false; }
        } else if(abst <= def.zuend.reichweite) g.zuendBis = def.zuend.zeit;
        else { vx = r[0] * tempo; vz = r[1] * tempo; if(g.aufBoden && zf() < 0.04) g.geschw[1] = 6; }
      } else if(v === "ritter"){
        g.blockt = g.cd < def.hieb.rate - 0.5;      // direkt nach seinem Hieb kurz verwundbar, sonst blockt er
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
          // Magmakönig: Glutbrocken auf Ziele außerhalb der Hiebreichweite
          if(def.waffe && sieht && abst > def.hieb.reichweite + 1 && abst < 22 && g.cd3 <= 0){ akt.push(schuss(g, def, ziel, d, zf, schw)); g.cd3 = def.waffe.rate * (0.8 + zf() * 0.4); }
          // Sumpfkoloss: ruft Helfer (höchstens def.ruft.max gleichzeitig; das Spiel legt sie an und setzt gerufenVon)
          if(def.ruft && g.cd3 <= 0){
            var dabei = 0; welt.wesen.forEach(function(e){ if(e.gerufenVon === g.id) dabei++; });
            if(dabei < def.ruft.max){ var wk = zf() * Math.PI * 2; akt.push({ art: "ruf", gegnerArt: def.ruft.art, pos: [g.pos[0] + Math.sin(wk) * 3, g.pos[1] + 0.5, g.pos[2] + Math.cos(wk) * 3] }); }
            g.cd3 = def.ruft.rate;
          }
        }
      }
      // Heiler (def.heilt): verletzte Gegner in der Nähe (keine Bosse, nicht sich selbst) bekommen einen Teil ihrer Höchst-LP zurück
      if(def.heilt && g.cdH <= 0){
        g.cdH = def.heilt.rate; var geheilt = false;
        welt.wesen.forEach(function(e){
          if(e === g || e.art !== "gegner" || e.boss || !(e.lpMax > 0) || e.lp >= e.lpMax || e.lp <= 0) return;
          var q = ring(welt, g.pos, e.pos); if(Math.hypot(q[0], q[2]) > def.heilt.radius) return;
          e.lp = Math.min(e.lpMax, e.lp + e.lpMax * def.heilt.anteil); geheilt = true;
        });
        if(geheilt) akt.push({ art: "heilung", radius: def.heilt.radius });
      }
    } else if(heimAbst > 2 && !g.bemerkt){
      var hh = richtungZu(heim); vx = hh[0] * tempo * 0.4; vz = hh[1] * tempo * 0.4;
    }
    bewege(welt, g, vx, vz, dt);
    return akt;
  };

  // --- Tiere (Haustiere, Spec 2026-11-04) ---
  // Wildtiere streifen friedlich umher und weichen Spielern aus; Begleiter folgen ihrem Besitzer und kämpfen von selbst (js/haustiere.js).
  // ctx: { spieler: [{ pos }] } für Wildtiere. Liefert Aktionen wie SC.KI.schritt (hier zunächst keine).
  function tierGefahr(welt, x, y, z){
    var ix = Math.floor(x), iz = Math.floor(z), id = welt.holeBlock(ix, Math.floor(y + 0.1), iz), u = welt.holeBlock(ix, Math.floor(y - 0.5), iz);
    return !!SC.Fluessig.art(id) || !!SC.Fluessig.art(u);
  }
  SC.KI.tierGefahr = tierGefahr;
  // Begleiter neben den Besitzer setzen (n = laufende Nummer, damit mehrere Tiere nicht aufeinander stehen)
  SC.KI.tierZuBesitzer = function(welt, g, pos, n){
    var P = welt.planet.groesse, w = (n || 0) * 2.1 + 0.7, x = pos[0] + Math.sin(w) * 1.8, z = pos[2] + Math.cos(w) * 1.8;
    var frei = !SC.BLOECKE[welt.holeBlock(x, pos[1] + 0.3, z)].fest && !SC.BLOECKE[welt.holeBlock(x, pos[1] + 1.3, z)].fest && !tierGefahr(welt, x, pos[1], z);
    if(!frei){ x = pos[0]; z = pos[2]; }
    g.pos = [SC.mod(x, P), pos[1], SC.mod(z, P)]; g.geschw = [0, 0, 0]; g.entfernen = false; g.fest = 0; g.aufBoden = false;
  };
  SC.KI.tier = function(welt, g, ctx, dt, zf){
    var def = SC.TIERE[g.tierArt], akt = [];
    if(!def){ g.entfernen = true; return akt; }
    var drin = SC.BLOECKE[welt.holeBlock(g.pos[0], g.pos[1] + 0.3, g.pos[2])];
    if(drin && drin.fest){
      if(g.besitzer && ctx.besitzer){ SC.KI.tierZuBesitzer(welt, g, ctx.besitzer.pos, g.nr); return akt; }
      aufgeben(g); if(g.entfernen) return akt;
    }
    g.fliegt = !!def.fliegt;   // Flieger (Eule, Leuchtkäfer) schweben, kennen weder Schwerkraft noch Lava- oder Wasserfurcht
    var la = def.gang === "huepfen" ? 2.2 : 0.7;   // Hüpfer überspringen schmale Streifen: weiter vorausschauen
    var gefahr = g.fliegt ? function(){ return false; } : tierGefahr;
    g.zeit = (g.zeit || 0) + dt; g.cd = Math.max(0, (g.cd || 0) - dt);
    var vx = 0, vz = 0;
    if(!g.haeltStill && g.wild){
      var sd = 3.5, weg = null;
      (ctx.spieler || []).forEach(function(s){ var d = ring(welt, g.pos, s.pos), l = Math.hypot(d[0], d[2]); if(l < sd){ sd = l; weg = d; } });
      if(weg){ var f = richtungZu(weg); g.richtung = [-f[0], -f[1]]; g.modus = "flieht"; g.bis = g.zeit + 0.8; }
      else if(!g.modus || g.zeit > g.bis){
        if(g.modus === "steht" || !g.modus){ var win = zf() * Math.PI * 2; g.richtung = [Math.sin(win), Math.cos(win)]; g.modus = "geht"; g.bis = g.zeit + 1.5 + zf() * 2.5; }
        else { g.modus = "steht"; g.bis = g.zeit + 1 + zf() * 3; }
      }
      if(g.modus !== "steht" && g.richtung){
        var t = def.tempo * (g.modus === "flieht" ? 1 : 0.35); vx = g.richtung[0] * t; vz = g.richtung[1] * t; g.blick = Math.atan2(-vx, -vz);
        // Gefahr voraus (Lava, Wasser): stehen bleiben und neu überlegen
        if(gefahr(welt, g.pos[0] + g.richtung[0] * la, g.pos[1], g.pos[2] + g.richtung[1] * la)){ vx = 0; vz = 0; g.modus = "steht"; g.bis = g.zeit + 0.3; }
      }
    } else if(!g.haeltStill && g.besitzer && ctx.besitzer){
      // Begleiter: dem Besitzer folgen (schneller, wenn er weit weg ist); zu weit, in Lava/Wasser oder feststeckend → neben den Besitzer
      var o = ring(welt, g.pos, ctx.besitzer.pos), dist = Math.hypot(o[0], o[2]);
      if(dist > 24 || Math.abs(o[1]) > 12 || gefahr(welt, g.pos[0], g.pos[1], g.pos[2])){ SC.KI.tierZuBesitzer(welt, g, ctx.besitzer.pos, g.nr); return akt; }
      var zg = ctx.ziel;
      if(zg && dist <= 18){
        // Kampf (ctx.ziel: ein Gegner in der Nähe des Besitzers, ctx.werte.schaden): Stil je Art
        var dz = ring(welt, g.pos, zg.pos), dl = Math.hypot(dz[0], dz[2]), rz = richtungZu(dz), sz = [-rz[1], rz[0]], st = def.stil, tz = def.tempo;
        g.blick = Math.atan2(-dz[0], -dz[2]);
        if(!g.seiteZeit || g.zeit > g.seiteZeit){ g.seite = zf() < 0.5 ? -1 : 1; g.seiteZeit = g.zeit + 1.5 + zf() * 1.5; }
        if(st === "nah" || st === "robust"){
          if(dl > 1.1){ vx = rz[0] * tz * 1.1; vz = rz[1] * tz * 1.1; if(g.aufBoden && zf() < 0.03) g.geschw[1] = 6; }
          else if(g.cd <= 0){ akt.push({ art: "hieb", ziel: zg.id, schaden: ctx.werte.schaden }); g.cd = st === "robust" ? 1.4 : 1.0; }
        } else if(st === "ablenker"){
          var ma = dl > 3.2 ? 1 : dl < 1.8 ? -1 : 0; vx = (rz[0] * ma + sz[0] * 0.9 * g.seite) * tz; vz = (rz[1] * ma + sz[1] * 0.9 * g.seite) * tz;
          if(dl < 2.4 && g.cd <= 0){ akt.push({ art: "hieb", ziel: zg.id, schaden: ctx.werte.schaden * 0.8 }); g.cd = 1.6; }
        } else {
          var mf = dl < 4 ? -1 : dl > 8 ? 1 : 0; vx = (rz[0] * mf + sz[0] * 0.3 * g.seite) * tz * 0.8; vz = (rz[1] * mf + sz[1] * 0.3 * g.seite) * tz * 0.8;
          if(dl <= 11 && g.cd <= 0){
            var von = [g.pos[0], g.pos[1] + g.hoehe * 0.7, g.pos[2]], dy = zg.pos[1] + zg.hoehe * 0.5 - von[1], ln = Math.hypot(dz[0], dy, dz[2]) || 1;
            akt.push({ art: "schuss", pos: von, richtung: [dz[0] / ln, dy / ln, dz[2] / ln], tempo: 26, schaden: ctx.werte.schaden, farbe: def.schussFarbe || "#ffe36b" }); g.cd = 1.3;
          }
        }
        if((vx || vz) && gefahr(welt, g.pos[0] + vx * 0.2, g.pos[1], g.pos[2] + vz * 0.2)){ vx = 0; vz = 0; }
      } else {
        // Jedes Tier hat seinen Platz um den Besitzer (nach Nummer), damit sie nicht aufeinander stehen; weit weg: dem Besitzer nach
        var wi = (g.nr || 0) * 2.1 + 0.7, os = dist > 6 ? o : [o[0] + Math.sin(wi) * 2.4, o[1], o[2] + Math.cos(wi) * 2.4], od = Math.hypot(os[0], os[2]);
        if(od > 0.8){
          var fo = richtungZu(os), tb = def.tempo * (dist > 9 ? 1.6 : dist > 6 ? 1.2 : od > 2 ? 0.9 : 0.5); vx = fo[0] * tb; vz = fo[1] * tb; g.blick = Math.atan2(-vx, -vz);
          if(gefahr(welt, g.pos[0] + fo[0] * la, g.pos[1], g.pos[2] + fo[1] * la)){ vx = 0; vz = 0; }
        } else g.blick = Math.atan2(-o[0], -o[2]);
      }
    }
    // Abstand halten: andere Tiere und der Besitzer schieben sich gegenseitig sanft auseinander (Begleiter laufen nicht ineinander)
    if(!g.haeltStill && (g.besitzer || g.wild)){
      var ab = function(pos, radius){
        var d = ring(welt, pos, g.pos), l = Math.hypot(d[0], d[2]), mind = (g.breite + radius) / 2 + 0.55;
        if(l >= mind) return;
        if(l < 0.01){ d = [Math.cos(g.id || 1), 0, Math.sin(g.id || 1)]; l = 1; }
        var k = (mind - l) / mind * 3.5; vx += d[0] / l * k; vz += d[2] / l * k;
      };
      (ctx.nachbarn || []).forEach(function(n){ if(n !== g && Math.abs(n.pos[1] - g.pos[1]) < 2) ab(n.pos, n.breite); });
      if(g.besitzer && ctx.besitzer) ab(ctx.besitzer.pos, 0.6);
    }
    // Gangart: Hüpfer bewegen sich nur in Sprüngen (am Boden Pause, in der Luft Schwung in Sprungrichtung); Schleicher gehen stockend; Schlängler pendeln seitlich
    if(def.gang === "huepfen" && !g.fliegt){
      if(g.aufBoden){
        g.hopWait = (g.hopWait === undefined ? 0 : g.hopWait) - dt; g.hopV = null;
        if((vx || vz) && g.hopWait <= 0){ g.geschw[1] = def.hupf; g.hopWait = def.pause[0] + zf() * (def.pause[1] - def.pause[0]); g.hopV = [vx * 2.2, vz * 2.2]; }
        vx = 0; vz = 0;
      } else if(g.hopV){ vx = g.hopV[0]; vz = g.hopV[1]; }
    } else if(def.gang === "schleichen"){
      g.schl = (g.schl || 0) + dt; if(Math.floor(g.schl / 0.7) % 2 === 1){ vx = 0; vz = 0; }
    } else if(def.gang === "schlaengeln" && (vx || vz)){
      var sl = Math.hypot(vx, vz), sw = Math.sin(g.zeit * 5) * 0.6; vx += -vz / sl * sw * sl; vz += vx / sl * sw * sl;
    }
    // Flieger halten ihre Höhe: Wildtiere über dem Boden, Begleiter über dem Besitzer, mit leichtem Auf und Ab
    if(g.fliegt){
      var ziel = g.besitzer && ctx.besitzer ? ctx.besitzer.pos[1] : (function(){ for(var y = Math.floor(g.pos[1]); y > g.pos[1] - 12; y--) if(SC.BLOECKE[welt.holeBlock(g.pos[0], y, g.pos[2])].fest) return y + 1; return g.pos[1]; })();
      g.geschw[1] = Math.max(-4, Math.min(4, (ziel + (def.flughoehe || 1.6) + Math.sin(g.zeit * 2 + (g.id || 0)) * 0.25 - g.pos[1]) * 3));
    }
    g.geschw[0] = vx; g.geschw[2] = vz;
    bewege(welt, g, vx, vz, dt);
    if(g.entfernen && g.besitzer && ctx.besitzer){ SC.KI.tierZuBesitzer(welt, g, ctx.besitzer.pos, g.nr); return akt; }   // festgesteckt
    if(g.wild && gefahr(welt, g.pos[0], g.pos[1], g.pos[2])) g.entfernen = true;
    return akt;
  };
})();
