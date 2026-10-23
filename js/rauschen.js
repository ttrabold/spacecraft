// Periodisches Gradientenrauschen: die Gitterpunkte werden über die Planetenkante gefaltet,
// damit das Gelände am Umschlagrand nahtlos weitergeht
SC.Rauschen = function(seed){ this.seed = seed >>> 0; };

(function(){
  var G2 = [[1,0],[-1,0],[0,1],[0,-1],[0.7071,0.7071],[-0.7071,0.7071],[0.7071,-0.7071],[-0.7071,-0.7071]];
  var G3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
  function glatt(t){ return t * t * t * (t * (t * 6 - 15) + 10); }
  function misch(a, b, t){ return a + (b - a) * t; }
  function begrenze(v){ return v > 1 ? 1 : v < -1 ? -1 : v; }
  function zellen(periode, skala){
    var n = periode / skala;
    if(n !== Math.floor(n)) throw new Error("Periode muss ein Vielfaches der Skala sein");
    return n;
  }

  SC.Rauschen.prototype.flach = function(x, z, periode, skala){
    var n = zellen(periode, skala), u = x / skala, v = z / skala;
    var i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, s = this.seed;
    function g(a, b, du, dv){ var h = G2[SC.hash3(s, SC.mod(a, n), SC.mod(b, n)) & 7]; return h[0] * du + h[1] * dv; }
    var a = glatt(fu), b = glatt(fv);
    var r = misch(misch(g(i, j, fu, fv), g(i + 1, j, fu - 1, fv), a), misch(g(i, j + 1, fu, fv - 1), g(i + 1, j + 1, fu - 1, fv - 1), a), b);
    return begrenze(r * 1.414);
  };

  // Periodisch in x und z, nicht in y (für Höhlen)
  SC.Rauschen.prototype.raum = function(x, y, z, periode, skala){
    var n = zellen(periode, skala), u = x / skala, w = y / skala, v = z / skala;
    var i = Math.floor(u), k = Math.floor(w), j = Math.floor(v), fu = u - i, fw = w - k, fv = v - j, s = this.seed ^ 0x51ed27;
    function g(a, c, b, du, dw, dv){ var h = G3[SC.hash3(s, SC.mod(a, n), SC.mod(b, n), c) % 12]; return h[0] * du + h[1] * dw + h[2] * dv; }
    var a = glatt(fu), c = glatt(fw), b = glatt(fv);
    function ebene(kk, dw){
      return misch(misch(g(i, kk, j, fu, dw, fv), g(i + 1, kk, j, fu - 1, dw, fv), a), misch(g(i, kk, j + 1, fu, dw, fv - 1), g(i + 1, kk, j + 1, fu - 1, dw, fv - 1), a), b);
    }
    return begrenze(misch(ebene(k, fw), ebene(k + 1, fw - 1), c));
  };

  // Mehrere Oktaven; jede halbiert die Skala, die Periode bleibt gleich
  SC.Rauschen.prototype.oktaven = function(x, z, periode, skala, anzahl){
    var summe = 0, gewicht = 1, gesamt = 0, sk = skala;
    for(var o = 0; o < anzahl; o++){
      summe += this.flach(x, z, periode, sk) * gewicht;
      gesamt += gewicht; gewicht *= 0.5; sk /= 2;
      if(sk < 1) break;
    }
    return summe / gesamt;
  };
})();
