// Spiegel (#188): Spiegelmathematik und Wahl des aktiven Spiegels (reine Funktionen, ohne WebGL); die Zeichnung steht weiter unten.
SC.Spiegel = {};
(function(){
  var B = SC.B, RADIUS = 8, DICKE = 0.08;
  // Spiegelfläche der unteren Hälfte: Normale (nx, nz) in den Raum und Lage der Ebene in der Zelle (Platte wie die Leiter, Dicke 0,08)
  var SEITEN = {};
  SEITEN[B.SPIEGEL_N] = { nx: 0, nz: 1, ex: 0.5, ez: DICKE };
  SEITEN[B.SPIEGEL_S] = { nx: 0, nz: -1, ex: 0.5, ez: 1 - DICKE };
  SEITEN[B.SPIEGEL_O] = { nx: -1, nz: 0, ex: 1 - DICKE, ez: 0.5 };
  SEITEN[B.SPIEGEL_W] = { nx: 1, nz: 0, ex: DICKE, ez: 0.5 };
  SC.Spiegel.RADIUS = RADIUS;
  SC.Spiegel.seite = function(id){ return SEITEN[id] || null; };

  // Punkt p an der Ebene durch ep mit der Normalen n (Länge 1) spiegeln
  SC.Spiegel.spiegelPunkt = function(p, ep, n){
    var d = (p[0] - ep[0]) * n[0] + (p[1] - ep[1]) * n[1] + (p[2] - ep[2]) * n[2];
    return [p[0] - 2 * d * n[0], p[1] - 2 * d * n[1], p[2] - 2 * d * n[2]];
  };
  // Richtung d an einer Ebene mit der Normalen n (Länge 1) spiegeln
  SC.Spiegel.spiegelRichtung = function(d, n){
    var k = d[0] * n[0] + d[1] * n[1] + d[2] * n[2];
    return [d[0] - 2 * k * n[0], d[1] - 2 * k * n[1], d[2] - 2 * k * n[2]];
  };

  // Alle unteren Spiegelhälften im Umkreis (Würfel) um pos [x, y, z]. Jeder Eintrag: Zelle (x, y, z), id, Normale (nx, nz)
  // und Mitte der Spiegelfläche relativ zu pos (ox, oy, oz), um den Ring des Planeten herum gerechnet.
  SC.Spiegel.kandidaten = function(welt, pos){
    var P = welt.planet.groesse, out = [], x0 = Math.floor(pos[0]), y0 = Math.floor(pos[1]), z0 = Math.floor(pos[2]);
    for(var dy = -3; dy <= 2; dy++) for(var dz = -RADIUS; dz <= RADIUS; dz++) for(var dx = -RADIUS; dx <= RADIUS; dx++){
      var x = x0 + dx, y = y0 + dy, z = z0 + dz; if(y < 0) continue;
      var id = welt.holeBlock(SC.mod(x, P), y, SC.mod(z, P)), s = SEITEN[id]; if(!s) continue;
      out.push({ x: SC.mod(x, P), y: y, z: SC.mod(z, P), id: id, nx: s.nx, nz: s.nz, ox: x + s.ex - pos[0], oy: y + 1 - pos[1], oz: z + s.ez - pos[2] });
    }
    return out;
  };

  // Aus Kandidaten den aktiven Spiegel wählen: Spieler vor der Spiegelseite, höchstens 8 Blöcke entfernt, grob im Blickfeld (blick [x, y, z]);
  // der nächste gewinnt. vorher (früherer Treffer) bleibt, solange kein anderer mindestens 1 Block näher liegt (kein Flackern).
  SC.Spiegel.waehle = function(kand, blick, vorher){
    var bl = Math.sqrt(blick[0] * blick[0] + blick[1] * blick[1] + blick[2] * blick[2]) || 1, beste = null, bd = Infinity, alt = null, ad = Infinity;
    for(var i = 0; i < kand.length; i++){
      var k = kand[i], d = Math.sqrt(k.ox * k.ox + k.oy * k.oy + k.oz * k.oz);
      if(d > RADIUS || d < 0.05) continue;
      if(k.ox * k.nx + k.oz * k.nz > -0.05) continue;   // Spieler hinter der Wand oder in der Ebene
      if((blick[0] * k.ox + blick[1] * k.oy + blick[2] * k.oz) / (bl * d) < 0.34) continue;   // außerhalb von rund 70° um die Blickrichtung
      if(d < bd){ bd = d; beste = k; }
      if(vorher && k.x === vorher.x && k.y === vorher.y && k.z === vorher.z){ alt = k; ad = d; }
    }
    return alt && ad < bd + 1 ? alt : beste;
  };
  SC.Spiegel.finde = function(welt, pos, blick, vorher){ return SC.Spiegel.waehle(SC.Spiegel.kandidaten(welt, pos), blick, vorher); };

  // Sucher mit Zwischenspeicher: die Blocksuche läuft höchstens alle 0,25 s oder nach einem Schritt von mehr als 2 Blöcken, dazwischen
  // werden nur die gemerkten Kandidaten neu bewertet (Zelle prüfen = ein Blockzugriff je Kandidat).
  SC.Spiegel.Sucher = function(){ this.kand = []; this.zeit = -1e9; this.pos = null; this.treffer = null; };
  SC.Spiegel.Sucher.prototype.finde = function(welt, pos, blick, jetzt){
    var neu = !this.pos || jetzt - this.zeit > 0.25 || Math.abs(pos[0] - this.pos[0]) + Math.abs(pos[1] - this.pos[1]) + Math.abs(pos[2] - this.pos[2]) > 2;
    if(neu){ this.kand = SC.Spiegel.kandidaten(welt, pos); this.zeit = jetzt; this.pos = pos.slice(); }
    else {
      var P = welt.planet.groesse, k2 = [];
      for(var i = 0; i < this.kand.length; i++){
        var k = this.kand[i]; if(welt.holeBlock(k.x, k.y, k.z) !== k.id) continue;   // inzwischen abgebaut
        var s = SEITEN[k.id]; k2.push(Object.assign({}, k, { ox: SC.mod(k.x + s.ex - pos[0] + P / 2, P) - P / 2, oy: k.y + 1 - pos[1], oz: SC.mod(k.z + s.ez - pos[2] + P / 2, P) - P / 2 }));
      }
      this.kand = k2;
    }
    this.treffer = SC.Spiegel.waehle(this.kand, blick, this.treffer);
    return this.treffer;
  };

  // Schräge Near-Ebene (Lengyel, wie three.js Reflector): proj = Projektionsmatrix (16 Zahlen, spaltenweise), ebene = [a, b, c, d] im
  // Kameraraum (Normale zur Kamera hin, Punkt p liegt auf der Ebene, wenn a·x + b·y + c·z + d = 0). Liefert eine neue Matrix,
  // deren Near-Ebene genau diese Ebene ist; alles dahinter (zwischen Kamera und Ebene) wird weggeschnitten.
  SC.Spiegel.schraegeNear = function(proj, ebene, bias){
    var m = proj.slice(), sg = function(v){ return v > 0 ? 1 : v < 0 ? -1 : 0; };
    var qx = (sg(ebene[0]) + m[8]) / m[0], qy = (sg(ebene[1]) + m[9]) / m[5], qz = -1, qw = (1 + m[10]) / m[14];
    var s = 2 / (ebene[0] * qx + ebene[1] * qy + ebene[2] * qz + ebene[3] * qw);
    m[2] = ebene[0] * s; m[6] = ebene[1] * s; m[10] = ebene[2] * s + 1 - (bias || 0); m[14] = ebene[3] * s;
    return m;
  };
})();
