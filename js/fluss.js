// Wasser und Lava fließen (Spec 2026-11-08-fliessen-design.md): Quellen bleiben, Fließstufen breiten sich wie in Minecraft aus.
// Je Welt eine Warteschlange aktiver Zellen je Art, gefüllt über das block-Ereignis; nur Einzelspieler und Gastgeber rechnen (Gäste bekommen die Blöcke).
// Gerechnet wird nur in geladenen Chunks; ungeladene Zellen gelten als fest, damit nie ein Chunk nachgeladen wird.
SC.Fluss = function(welt){
  var s = this;
  this.welt = welt; this.an = true; this.takt = { wasser: 0.25, lava: 1 }; this.zuletzt = 0;
  this._zeit = { wasser: 0, lava: 0 }; this._warte = { wasser: new Map(), lava: new Map() };
  this._beiBlock = function(b){ s._umgebung(b.x, b.y, b.z); };
  welt.ereignisse.an("block", this._beiBlock);
};
SC.Fluss.JE_SCHRITT = 64;   // Zellen je Takt und Art (Grenze gegen Ruckeln, Rest wartet)
SC.Fluss.SUCHE = 4;         // so weit sucht fließendes Wasser einen Abhang
SC.Fluss.STROEMUNG = 0.4 * SC.PHYSIK.laufen;   // Schub der Strömung; Schwimmen (0,6 × laufen) ist stärker, man kommt immer dagegen an

(function(){
  var B = SC.B, F = SC.Fluessig, H = SC.CHUNK.H, SEITE = [[1, 0], [-1, 0], [0, 1], [0, -1]], ALLE = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  var P = SC.Fluss.prototype;

  // Block lesen, ohne Chunks zu laden (ungeladen = fest)
  P.hole = function(x, y, z){
    if(y < 0) return B.GRUNDGESTEIN; if(y >= H) return B.LUFT;
    var w = this.welt; x = w.planet.wickel(x); z = w.planet.wickel(z);
    return w.istGeladen(x >> 4, z >> 4) ? w.holeBlock(x, y, z) : B.GRUNDGESTEIN;
  };
  function frei(id, art){ return id === B.LUFT || (F.art(id) === art && !F.quelle(id)); }   // dort darf die Flüssigkeit hin

  // Zelle und ihre sechs Nachbarn einreihen
  P._umgebung = function(x, y, z){ this._reihe(x, y, z); for(var i = 0; i < 6; i++) this._reihe(x + ALLE[i][0], y + ALLE[i][1], z + ALLE[i][2]); };
  P._reihe = function(x, y, z){
    if(y < 0 || y >= H) return;
    var w = this.welt; x = w.planet.wickel(x); z = w.planet.wickel(z);
    if(!w.istGeladen(x >> 4, z >> 4)) return;
    var id = w.holeBlock(x, y, z), art = F.art(id), k = x + "," + y + "," + z;
    if(art){ this._warte[art].set(k, [x, y, z]); return; }
    if(id !== B.LUFT) return;
    for(var i = 0; i < 6; i++){ if(ALLE[i][1] < 0) continue; var a = F.art(this.hole(x + ALLE[i][0], y + ALLE[i][1], z + ALLE[i][2])); if(a) this._warte[a].set(k, [x, y, z]); }
  };
  P.wartend = function(){ return this._warte.wasser.size + this._warte.lava.size; };

  P.schritt = function(dt){
    if(!this.an) return;
    for(var art in this._zeit){
      this._zeit[art] += dt;
      if(this._zeit[art] >= this.takt[art]){ this._zeit[art] = Math.min(this._zeit[art] - this.takt[art], this.takt[art]); this._takte(art); }   // höchstens ein Takt je Bild
    }
  };
  // Tests: Takte ohne Zeit bis zur Ruhe, Lava jeden vierten
  P.bisRuhe = function(max){
    for(var i = 0; i < max && this.wartend(); i++){ this._takte("wasser"); if(i % 4 === 3) this._takte("lava"); }
    return i;
  };
  // Strömung an einem Punkt [vx, vz]: fließende Blöcke schieben zu flacheren Nachbarn, zu fallenden und an den Rand (Luft); Quellen und fallende ruhen
  SC.Fluss.stroemung = function(welt, x, y, z){
    var f = { hole: function(x, y, z){ return welt.istGeladen && !welt.istGeladen(SC.mod(x, welt.planet.groesse) >> 4, SC.mod(z, welt.planet.groesse) >> 4) ? B.GRUNDGESTEIN : welt.holeBlock(x, y, z); } }, ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), id = f.hole(ix, iy, iz), art = F.art(id);
    if(!art || F.quelle(id) || F.fallend(id)) return [0, 0];
    var vx = 0, vz = 0;
    for(var j = 0; j < 4; j++){
      var n = f.hole(ix + SEITE[j][0], iy, iz + SEITE[j][1]);
      if(n === B.LUFT || (F.art(n) === art && !F.quelle(n) && (F.fallend(n) || F.stufe(n) < F.stufe(id)))){ vx += SEITE[j][0]; vz += SEITE[j][1]; }
    }
    var l = Math.hypot(vx, vz);
    return l ? [vx / l * SC.Fluss.STROEMUNG, vz / l * SC.Fluss.STROEMUNG] : [0, 0];
  };
  P.abbauen = function(){ this.welt.ereignisse.aus("block", this._beiBlock); };

  P._takte = function(art){
    var q = this._warte[art], liste = [], it = q.entries(), e;
    while(liste.length < SC.Fluss.JE_SCHRITT && !(e = it.next()).done){ liste.push(e.value[1]); q.delete(e.value[0]); }
    this.zuletzt = liste.length;
    for(var i = 0; i < liste.length; i++) this._zelle(liste[i][0], liste[i][1], liste[i][2], art);
  };

  P._zelle = function(x, y, z, art){
    var id = this.hole(x, y, z), w = this.welt;
    if(art === "lava" && F.istLava(id)){   // Lava trifft Wasser → Basalt
      for(var i = 0; i < 6; i++) if(F.istWasser(this.hole(x + ALLE[i][0], y + ALLE[i][1], z + ALLE[i][2]))){ w.setzeBlock(x, y, z, B.BASALT, "fluss"); return; }
    }
    if(!frei(id, art)) return;   // Quelle, fester Block oder andere Flüssigkeit
    var soll = this._soll(x, y, z, art);
    if(soll !== id) w.setzeBlock(x, y, z, soll, "fluss");
  };

  // Gewünschter Block an einer freien Zelle
  P._soll = function(x, y, z, art){
    var MAX = F.MAX[art], unten = this.hole(x, y - 1, z);
    if(F.art(this.hole(x, y + 1, z)) === art) return F.id(art, MAX, true);
    if(art === "wasser"){   // zwischen zwei Quellen entsteht eine neue
      var qn = 0; for(var i = 0; i < 4; i++) if(F.quelle(this.hole(x + SEITE[i][0], y, z + SEITE[i][1])) && F.istWasser(this.hole(x + SEITE[i][0], y, z + SEITE[i][1]))) qn++;
      if(qn >= 2 && (SC.BLOECKE[unten].fest || (F.quelle(unten) && F.istWasser(unten))) && !(this.welt.quelleVerboten && this.welt.quelleVerboten(x, y, z))) return B.WASSER;   // quelleVerboten: Wetter trocknet gerade aus (js/wetter-boden.js)
    }
    var best = 0;
    for(var j = 0; j < 4; j++){
      var nx = x + SEITE[j][0], nz = z + SEITE[j][1], n = this.hole(nx, y, nz);
      if(F.art(n) !== art || F.stufe(n) - 1 <= best) continue;
      if(frei(this.hole(nx, y - 1, nz), art) && !F.quelle(this.hole(nx, y - 1, nz))) continue;   // fällt selbst → gibt nicht zur Seite ab
      if(this._richtungen(nx, y, nz, art).indexOf(j ^ 1) < 0) continue;   // fließt lieber zum Abhang (j ^ 1: Richtung vom Nachbarn hierher)
      best = F.stufe(n) - 1;
    }
    return best > 0 ? F.id(art, best, false) : B.LUFT;
  };

  // Richtungen (Index in SEITE), in die eine Flüssigkeit bei (x, y, z) zur Seite abgibt: die mit dem kürzesten Weg zu einem Abhang, sonst alle
  P._richtungen = function(x, y, z, art){
    var besteD = Infinity, beste = [];
    for(var j = 0; j < 4; j++){
      var d = this._abhang(x + SEITE[j][0], y, z + SEITE[j][1], art, 1, j);
      if(d < besteD){ besteD = d; beste = [j]; } else if(d === besteD && d < Infinity) beste.push(j);
    }
    return beste.length ? beste : [0, 1, 2, 3];
  };
  // Tiefensuche ohne Umkehr: Abstand zum nächsten Abhang ab (x, y, z) oder Infinity
  P._abhang = function(x, y, z, art, d, von){
    if(!frei(this.hole(x, y, z), art)) return Infinity;
    if(frei(this.hole(x, y - 1, z), art)) return d;
    if(d >= SC.Fluss.SUCHE) return Infinity;
    var m = Infinity, zurueck = von ^ 1;   // SEITE paarweise: 0↔1, 2↔3
    for(var j = 0; j < 4; j++) if(j !== zurueck) m = Math.min(m, this._abhang(x + SEITE[j][0], y, z + SEITE[j][1], art, d + 1, j));
    return m;
  };
})();
