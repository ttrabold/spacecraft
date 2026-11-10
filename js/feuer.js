// Lagerfeuer und Kamin (Spec 2026-11-09-feuer-design.md): Zahlen, Schalten (zünden/löschen), Karte der brennenden Feuer, Wärme, Gegner-Abstand, Regen.
// Brennende Stellen sind eigene Blöcke (LAGERFEUER_AN, KAMIN_AN), deshalb sehen alle Mitspieler das Feuer und es wird mit der Welt gespeichert.
SC.FEUER = { waermeRadius: 6, gegnerRadius: 5, sperrRadius: 6.5, regenSekunden: 6, scanChunks: 48 };   // Blöcke; sperrRadius: so nah am Feuer verfolgen normale Gegner nicht; regenSekunden: im Mittel bis ein Lagerfeuer im Regen ausgeht
SC.Feuer = {};
(function(){
  var B = SC.B, AN = {}, AUS = {};
  AN[B.LAGERFEUER] = B.LAGERFEUER_AN; AN[B.KAMIN] = B.KAMIN_AN; AUS[B.LAGERFEUER_AN] = B.LAGERFEUER; AUS[B.KAMIN_AN] = B.KAMIN;
  function ring(welt, a, b){ var P = welt.planet.groesse; return [SC.mod(b[0] - a[0] + P / 2, P) - P / 2, b[1] - a[1], SC.mod(b[2] - a[2] + P / 2, P) - P / 2]; }
  SC.Feuer.istStelle = function(id){ return AN[id] !== undefined || AUS[id] !== undefined; };
  SC.Feuer.brennt = function(id){ return AUS[id] !== undefined; };
  SC.Feuer.an = function(id){ return AN[id] !== undefined ? AN[id] : id; };
  SC.Feuer.aus = function(id){ return AUS[id] !== undefined ? AUS[id] : id; };
  // Zündet eine ausgeschaltete Stelle bzw. löscht eine brennende → true, wenn sich etwas geändert hat
  SC.Feuer.zuenden = function(welt, x, y, z, quelle){ var id = welt.holeBlock(x, y, z); return AN[id] !== undefined ? welt.setzeBlock(x, y, z, AN[id], quelle || "spieler") : false; };
  SC.Feuer.loeschen = function(welt, x, y, z, quelle){ var id = welt.holeBlock(x, y, z); return AUS[id] !== undefined ? welt.setzeBlock(x, y, z, AUS[id], quelle || "spieler") : false; };

  // Karte der brennenden Feuer einer Welt: lebt von den Block-Ereignissen und scannt neu geladene Chunks genau einmal; entladene Chunks verschwinden daraus
  SC.Feuer.Karte = function(welt){
    this.welt = welt; this.feuer = {}; this.gescannt = {}; var s = this;
    this._h = function(b){ s._block(b); }; welt.ereignisse.an("block", this._h);
  };
  var K = SC.Feuer.Karte.prototype;
  K.abbauen = function(){ this.welt.ereignisse.aus("block", this._h); };
  K._block = function(b){
    var k = b.x + "," + b.y + "," + b.z;
    if(SC.Feuer.brennt(b.id)){ this.feuer[k] = [b.x, b.y, b.z, SC.BLOECKE[b.id].feuer]; this._l = null; } else if(this.feuer[k]){ delete this.feuer[k]; this._l = null; }
  };
  // Pflegt die Karte: entladene Chunks vergessen, höchstens SC.FEUER.scanChunks neu geladene Chunks scannen (ein Scan ist billig; so ist ein Feuer nach Reise oder Laden gleich da)
  K.aktualisiere = function(){
    var w = this.welt, k, t, i, n = 0, s = this;
    for(k in this.gescannt) if(!w.chunks.has(k)){
      delete this.gescannt[k]; t = k.split(","); var x0 = +t[0] * 16, z0 = +t[1] * 16;
      for(var f in this.feuer){ var e = this.feuer[f]; if(e[0] >= x0 && e[0] < x0 + 16 && e[2] >= z0 && e[2] < z0 + 16){ delete this.feuer[f]; this._l = null; } }
    }
    w.chunks.forEach(function(c, key){
      if(s.gescannt[key] || n >= SC.FEUER.scanChunks) return; s.gescannt[key] = true; n++; var tt = key.split(","), cx = +tt[0] * 16, cz = +tt[1] * 16;
      for(var j = 0; j < c.length; j++){ var id = c[j]; if(id === B.LAGERFEUER_AN || id === B.KAMIN_AN){ var lx = j & 15, lz = (j >> 4) & 15, ly = j >> 8; s.feuer[(cx + lx) + "," + ly + "," + (cz + lz)] = [cx + lx, ly, cz + lz, SC.BLOECKE[id].feuer]; s._l = null; } }
    });
  };
  // Liste der brennenden Feuer [[x, y, z, art], …]; bleibt dieselbe Liste, solange sich nichts ändert (nicht verändern!)
  K.liste = function(){ if(!this._l){ var l = []; for(var k in this.feuer) l.push(this.feuer[k]); this._l = l; } return this._l; };
  // Waagerechter Abstand zum nächsten brennenden Feuer (Infinity ohne Feuer)
  K.naechsterAbstand = function(pos){
    var best = Infinity, w = this.welt; for(var k in this.feuer){ var f = this.feuer[k], d = ring(w, [f[0] + 0.5, f[1], f[2] + 0.5], pos), l = Math.hypot(d[0], d[2]); if(l < best) best = l; }
    return best;
  };
  // Wärme: bis 6 Blöcke waagerecht und 3 Blöcke in der Höhe vom brennenden Feuer
  SC.Feuer.warm = function(karte, pos){
    var w = karte.welt, R = SC.FEUER.waermeRadius;
    for(var k in karte.feuer){ var f = karte.feuer[k], d = ring(w, [f[0] + 0.5, f[1], f[2] + 0.5], pos); if(Math.hypot(d[0], d[2]) <= R && Math.abs(d[1]) <= 3) return true; }
    return false;
  };
  // Schiebt einen normalen Gegner aus dem Umkreis (kleine Schritte, nie in eine Wand) und lässt ihn den Spieler vergessen; Bosse nie → true, wenn geschoben
  SC.Feuer.abstossen = function(welt, karte, g){
    var def = SC.GEGNER[g.gegnerArt]; if((def && def.boss) || g.boss) return false;
    var R = SC.FEUER.gegnerRadius, P = welt.planet.groesse, bewegt = false;
    for(var k in karte.feuer){
      var f = karte.feuer[k], d = ring(welt, [f[0] + 0.5, f[1], f[2] + 0.5], g.pos), l = Math.hypot(d[0], d[2]); if(l >= R || Math.abs(d[1]) > 6) continue;
      var rx = l < 0.01 ? 1 : d[0] / l, rz = l < 0.01 ? 0 : d[2] / l, schritt = Math.min(0.6, R - l + 0.05), nx = SC.mod(g.pos[0] + rx * schritt, P), nz = SC.mod(g.pos[2] + rz * schritt, P);
      var b1 = SC.BLOECKE[welt.holeBlock(nx, g.pos[1] + 0.3, nz)], b2 = SC.BLOECKE[welt.holeBlock(nx, g.pos[1] + 1.2, nz)];
      if(!(b1 && b1.fest) && !(b2 && b2.fest)){ g.pos[0] = nx; g.pos[2] = nz; }
      g.bemerkt = false; bewegt = true;
    }
    return bewegt;
  };
  // Regen löscht Lagerfeuer mit freiem Himmel darüber (im Mittel nach SC.FEUER.regenSekunden); der Kamin und Schnee nie → Anzahl gelöschter Feuer; zf() liefert 0..1
  SC.Feuer.regen = function(welt, karte, eff, dt, zf){
    if(!eff || eff.niederschlag !== "regen" || !(eff.menge > 0)) return 0;
    var n = 0, p = Math.min(1, dt * eff.menge / SC.FEUER.regenSekunden);
    karte.liste().forEach(function(f){
      if(welt.holeBlock(f[0], f[1], f[2]) !== B.LAGERFEUER_AN || !SC.WetterBoden.freierHimmel(welt, f[0], f[1] + 1, f[2])) return;
      if(zf() < p && SC.Feuer.loeschen(welt, f[0], f[1], f[2], "feuer")) n++;
    });
    return n;
  };
})();
