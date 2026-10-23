// Kern: Namensraum SC und kleine Hilfen, die überall gebraucht werden
var SC = window.SC || {};
window.SC = SC;

// Modulo, das nie negativ wird (für Koordinaten auf dem Planeten)
SC.mod = function(a, n){ var r = a % n; return r < 0 ? r + n : r; };

// Text → uint32 (cyrb53, auf 32 Bit gekürzt)
SC.hashText = function(text){
  var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for(var i = 0; i < text.length; i++){ var c = text.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h1 ^ h2) >>> 0;
};

// Koordinaten-Hash → uint32, deterministisch
SC.hash3 = function(seed, a, b, c){
  var h = (seed ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (a | 0), 0x85ebca6b); h ^= h >>> 13;
  h = Math.imul(h ^ (b | 0), 0xc2b2ae35); h ^= h >>> 16;
  h = Math.imul(h ^ ((c || 0) | 0), 0x27d4eb2f); h ^= h >>> 15;
  return h >>> 0;
};

// Deterministischer Zufall (mulberry32), Werte in [0,1)
SC.zufall = function(seed){
  var a = seed >>> 0;
  return function(){
    a = (a + 0x6d2b79f5) >>> 0;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Chunk-Maße und Blockindex im Chunk (lokale Koordinaten)
SC.CHUNK = { B: 16, H: 128 };
SC.idx = function(x, y, z){ return (y * 16 + z) * 16 + x; };

// Einfache Ereignisse
SC.Ereignisse = function(){ this._h = {}; };
SC.Ereignisse.prototype.an = function(name, fn){ (this._h[name] = this._h[name] || []).push(fn); };
SC.Ereignisse.prototype.aus = function(name, fn){ var l = this._h[name]; if(l){ var i = l.indexOf(fn); if(i >= 0) l.splice(i, 1); } };
SC.Ereignisse.prototype.sende = function(name, daten){ var l = this._h[name]; if(l) l.slice().forEach(function(fn){ fn(daten); }); };
