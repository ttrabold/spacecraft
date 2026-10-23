// Welt: hält die Chunks eines Planeten. Jede Blockänderung läuft über setzeBlock,
// damit Speichern, Neuzeichnen und später das Netzwerk an einer Stelle hängen.
SC.Welt = function(planet, gespeicherteChunks){
  this.planet = planet;
  this.generator = new SC.Generator(planet);
  this.chunks = new Map();          // geladene Chunks
  this.geaenderte = new Map();      // vom Spieler veränderte Chunks (werden gespeichert)
  this.neuZuZeichnen = new Set();
  this.ereignisse = new SC.Ereignisse();
  this.wesen = new Map();           // Gegner, Geschosse, Beutekugeln
  this.naechsteId = 1;
  var g = gespeicherteChunks || {};
  for(var k in g) this.geaenderte.set(k, g[k]);
};

(function(){
  var H = SC.CHUNK.H;
  SC.Welt.prototype.chunk = function(cx, cz){
    var k = this.planet.chunkSchluessel(cx, cz), c = this.chunks.get(k);
    if(!c){
      c = this.geaenderte.get(k);
      if(!c){ var t = k.split(","); c = this.generator.chunk(+t[0], +t[1]); }
      this.chunks.set(k, c);
    }
    return c;
  };
  SC.Welt.prototype.istGeladen = function(cx, cz){ return this.chunks.has(this.planet.chunkSchluessel(cx, cz)); };
  SC.Welt.prototype.entlade = function(cx, cz){ this.chunks.delete(this.planet.chunkSchluessel(cx, cz)); };

  SC.Welt.prototype.holeBlock = function(x, y, z){
    if(y < 0 || y >= H) return SC.B.LUFT;
    x = this.planet.wickel(x); z = this.planet.wickel(z); y = Math.floor(y);
    return this.chunk(x >> 4, z >> 4)[SC.idx(x & 15, y, z & 15)];
  };

  SC.Welt.prototype.setzeBlock = function(x, y, z, id, quelle){
    y = Math.floor(y);
    if(y < 0 || y >= H) return false;
    x = this.planet.wickel(x); z = this.planet.wickel(z);
    var cx = x >> 4, cz = z >> 4, k = this.planet.chunkSchluessel(cx, cz), c = this.chunk(cx, cz), i = SC.idx(x & 15, y, z & 15), alt = c[i];
    if(alt === id) return false;
    if(alt === SC.B.GRUNDGESTEIN && quelle !== "system") return false;
    c[i] = id;
    this.geaenderte.set(k, c);
    this.neuZuZeichnen.add(k);
    var lx = x & 15, lz = z & 15, p = this.planet;
    if(lx === 0) this.neuZuZeichnen.add(p.chunkSchluessel(cx - 1, cz));
    if(lx === 15) this.neuZuZeichnen.add(p.chunkSchluessel(cx + 1, cz));
    if(lz === 0) this.neuZuZeichnen.add(p.chunkSchluessel(cx, cz - 1));
    if(lz === 15) this.neuZuZeichnen.add(p.chunkSchluessel(cx, cz + 1));
    this.ereignisse.sende("block", { x: x, y: y, z: z, id: id, alt: alt, quelle: quelle });
    return true;
  };
})();
