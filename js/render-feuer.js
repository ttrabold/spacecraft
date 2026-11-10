// Funken über brennenden Feuern (Lagerfeuer und Kamin, Spec 2026-11-09-feuer-design.md): eine Punktwolke für die nächsten Feuer, kein Echtzeitlicht
SC.RenderFeuer = function(szene){
  this._p = new Float32Array(SC.RenderFeuer.FEUER * SC.RenderFeuer.JE * 3);
  this._geo = new THREE.BufferGeometry(); this._geo.setAttribute("position", new THREE.BufferAttribute(this._p, 3)); this._geo.setDrawRange(0, 0);
  this._pkt = new THREE.Points(this._geo, new THREE.PointsMaterial({ color: 0xffb347, size: 0.13, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending }));
  this._pkt.frustumCulled = false; this._pkt.renderOrder = 3; szene.add(this._pkt);
};
SC.RenderFeuer.FEUER = 8;      // höchstens so viele Feuer bekommen Funken (die nächsten)
SC.RenderFeuer.JE = 12;        // Funken je Feuer
SC.RenderFeuer.WENIGER = 5;    // bei „Wetter-Effekte: Weniger“
SC.RenderFeuer.REICHWEITE = 40;
// liste: [[x, y, z, art], …] der brennenden Feuer; jetzt in ms; kam = Kameraposition [x, y, z]; P = Planetengröße (Ränder)
SC.RenderFeuer.prototype.bild = function(liste, jetzt, kam, P, weniger){
  var R = SC.RenderFeuer.REICHWEITE, je = weniger ? SC.RenderFeuer.WENIGER : SC.RenderFeuer.JE, nah = [], p = this._p, n = 0;
  liste.forEach(function(f){
    var dx = SC.mod(f[0] + 0.5 - kam[0] + P / 2, P) - P / 2, dz = SC.mod(f[2] + 0.5 - kam[2] + P / 2, P) - P / 2, d = Math.hypot(dx, dz);
    if(d <= R) nah.push({ d: d, x: kam[0] + dx, y: f[1], z: kam[2] + dz, s: f[0] * 7 + f[2] * 13 + f[1] });
  });
  nah.sort(function(a, b){ return a.d - b.d; });
  nah.slice(0, SC.RenderFeuer.FEUER).forEach(function(f){
    for(var k = 0; k < je; k++){
      var ph = (jetzt / 1400 + k / je + (f.s % 7) / 7) % 1, a = k * 2.399 + f.s;
      p[n * 3] = f.x + Math.sin(a) * 0.28 * (0.4 + ph); p[n * 3 + 1] = f.y + 0.35 + ph * 1.9; p[n * 3 + 2] = f.z + Math.cos(a) * 0.28 * (0.4 + ph); n++;
    }
  });
  this._geo.attributes.position.needsUpdate = true; this._geo.setDrawRange(0, n);
};
