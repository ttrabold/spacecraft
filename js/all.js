// Raumflug (Stufe 5b): Sonnensystem und reine Logik des Flugs im All (ohne DOM und three.js).
// Planeten bleiben Tori (Größe 2048); im All sind sie Kugeln. Länge = x / 2048 · 2π, Breite = (z / 2048 − 0,5) · 0,8π,
// damit landet man dort, wo man hinfliegt; die Pole (über ±0,4π) werden auf den Rand geklemmt.
SC.ALL = {
  radius: 400, tempo: 150,
  planeten: { start: [0, 0, 0], glutfrost: [5200, 600, -1800], rankenmoor: [-3600, -900, 4400] },
  sonne: [0, 9000, -14000]
};
SC.All = {};
(function(){
  var A = SC.All, P = 2048, BREITE = 0.4 * Math.PI;
  A.zuKugel = function(id, x, z, h){
    var c = SC.ALL.planeten[id], lon = x / P * Math.PI * 2, lat = (z / P - 0.5) * 2 * BREITE, r = SC.ALL.radius + (h || 0);
    return [c[0] + Math.cos(lat) * Math.cos(lon) * r, c[1] + Math.sin(lat) * r, c[2] + Math.cos(lat) * Math.sin(lon) * r];
  };
  A.zuTorus = function(id, pos){
    var c = SC.ALL.planeten[id], d = [pos[0] - c[0], pos[1] - c[1], pos[2] - c[2]], l = Math.hypot(d[0], d[1], d[2]) || 1;
    var lat = Math.max(-BREITE, Math.min(BREITE, Math.asin(Math.max(-1, Math.min(1, d[1] / l))))), lon = Math.atan2(d[2], d[0]);
    var x = SC.mod(lon / (Math.PI * 2) * P, P), z = Math.min(P - 0.01, Math.max(0, (lat / (2 * BREITE) + 0.5) * P));
    return { x: x, z: z };
  };
  // Asteroidenfelder auf halbem Weg zwischen je zwei Planeten (deterministisch aus seed): [{ pos, r }]
  A.asteroiden = function(seed){
    var zf = SC.zufall(seed >>> 0), P = SC.ALL.planeten, l = [];
    [["start", "glutfrost"], ["start", "rankenmoor"], ["glutfrost", "rankenmoor"]].forEach(function(p){
      var a = P[p[0]], b = P[p[1]], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], n = 40 + Math.floor(zf() * 40);
      for(var i = 0; i < n; i++){ var u = zf() * 2 - 1, w = zf() * Math.PI * 2, s = Math.sqrt(1 - u * u), r = Math.cbrt(zf()) * 600;
        l.push({ pos: [m[0] + s * Math.cos(w) * r, m[1] + u * r * 0.5, m[2] + s * Math.sin(w) * r], r: 6 + Math.floor(zf() * 15) }); }
    });
    return l;
  };
  // Erster Brocken, den eine Kugel um pos (Radius rs) berührt
  A.kollision = function(pos, liste, rs){
    for(var i = 0; i < liste.length; i++){ var a = liste[i]; if(Math.hypot(pos[0] - a.pos[0], pos[1] - a.pos[1], pos[2] - a.pos[2]) < a.r + rs) return a; }
    return null;
  };
  // Nächster Planet zur Position (Abstand zur Oberfläche)
  A.naechster = function(pos){
    var best = null;
    for(var id in SC.ALL.planeten){ var c = SC.ALL.planeten[id], a = Math.hypot(pos[0] - c[0], pos[1] - c[1], pos[2] - c[2]) - SC.ALL.radius; if(!best || a < best.abstand) best = { id: id, abstand: a }; }
    return best;
  };
})();
