// Wetter zeichnen (Spec 2026-11-08-wetter-design.md): Regenstriche bzw. Schneeflocken in einem Kasten um die Kamera, Blitzstrahl.
// Himmel, Licht und Nebel mischt SC.Render#bild über SC.Render.wetterNebel / wetterLicht.
SC.RenderWetter = function(szene){
  var MAX = SC.RenderWetter.MAX;
  this.szene = szene; this.anzahl = 0; this.sichtbar = false; this.art = null; this.blitzZeit = 0;
  this._p = new Float32Array(MAX * 3);   // Teilchen im Kasten (relativ zur Kamera, wird verschoben)
  for(var i = 0; i < MAX; i++){ this._p[i * 3] = (Math.random() - 0.5) * 2 * SC.RenderWetter.R; this._p[i * 3 + 1] = (Math.random() - 0.5) * 2 * SC.RenderWetter.HOCH; this._p[i * 3 + 2] = (Math.random() - 0.5) * 2 * SC.RenderWetter.R; }
  var gr = new THREE.BufferGeometry(); gr.setAttribute("position", new THREE.BufferAttribute(new Float32Array(MAX * 6), 3));
  this.regen = new THREE.LineSegments(gr, new THREE.LineBasicMaterial({ color: 0x9fb4d0, transparent: true, opacity: 0.55, depthWrite: false }));
  var gs = new THREE.BufferGeometry(); gs.setAttribute("position", new THREE.BufferAttribute(new Float32Array(MAX * 3), 3));
  this.schnee = new THREE.Points(gs, new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.9, depthWrite: false }));
  [this.regen, this.schnee].forEach(function(o){ o.frustumCulled = false; o.visible = false; o.renderOrder = 2; szene.add(o); });
  var gb = new THREE.BufferGeometry(); gb.setAttribute("position", new THREE.BufferAttribute(new Float32Array(9 * 3), 3));
  this.strahl = new THREE.Line(gb, new THREE.LineBasicMaterial({ color: 0xf4f6ff })); this.strahl.frustumCulled = false; this.strahl.visible = false; szene.add(this.strahl);
};
SC.RenderWetter.MAX = 1500;     // Teilchen bei „Wetter-Effekte: an“
SC.RenderWetter.WENIGER = 300;  // bei „weniger“
SC.RenderWetter.R = 16; SC.RenderWetter.HOCH = 12;   // halbe Kastengröße waagerecht / senkrecht
(function(){
  var RW = SC.RenderWetter.prototype;
  // eff: SC.Wetter#effekte(), kam: Kameraposition [x, y, z], unterDach: kein Niederschlag sichtbar, weniger: Einstellung „weniger“
  RW.bild = function(eff, dt, kam, unterDach, weniger){
    var art = eff.niederschlag, R = SC.RenderWetter.R, HO = SC.RenderWetter.HOCH, p = this._p;
    this.art = art;
    this.anzahl = art && !unterDach ? Math.round(eff.menge * (weniger ? SC.RenderWetter.WENIGER : SC.RenderWetter.MAX)) : 0;
    this.sichtbar = this.anzahl > 0;
    this.regen.visible = this.sichtbar && art === "regen"; this.schnee.visible = this.sichtbar && art === "schnee";
    if(this.sichtbar){
      var fall = art === "regen" ? 18 : 2, wx = eff.wind[0] * (art === "regen" ? 1 : 1.5), wz = eff.wind[1] * (art === "regen" ? 1 : 1.5), t = performance.now() / 1000;
      var ziel = (art === "regen" ? this.regen : this.schnee).geometry.attributes.position, a = ziel.array;
      for(var i = 0; i < this.anzahl; i++){
        var j = i * 3;
        p[j] += (wx + (art === "schnee" ? Math.sin(t + i) * 0.4 : 0)) * dt; p[j + 1] -= fall * dt; p[j + 2] += wz * dt;
        if(p[j + 1] < -HO) p[j + 1] += 2 * HO; if(p[j] < -R) p[j] += 2 * R; else if(p[j] > R) p[j] -= 2 * R; if(p[j + 2] < -R) p[j + 2] += 2 * R; else if(p[j + 2] > R) p[j + 2] -= 2 * R;
        var x = kam[0] + p[j], y = kam[1] + p[j + 1], z = kam[2] + p[j + 2];
        if(art === "regen"){ var k = i * 6; a[k] = x; a[k + 1] = y; a[k + 2] = z; a[k + 3] = x - wx * 0.04; a[k + 4] = y + 0.7; a[k + 5] = z - wz * 0.04; }
        else { a[j] = x; a[j + 1] = y; a[j + 2] = z; }
      }
      ziel.needsUpdate = true; (art === "regen" ? this.regen : this.schnee).geometry.setDrawRange(0, art === "regen" ? this.anzahl * 2 : this.anzahl);
    }
    if(this.blitzZeit > 0){ this.blitzZeit -= dt; if(this.blitzZeit <= 0) this.strahl.visible = false; }
  };
  // Blitzstrahl von oben in Zacken zur Einschlagstelle; liefert nichts – die Helligkeit regelt SC.Render#blitz
  RW.blitz = function(pos){
    var a = this.strahl.geometry.attributes.position.array, n = 9;
    for(var i = 0; i < n; i++){ var f = i / (n - 1); a[i * 3] = pos[0] + 0.5 + (i && i < n - 1 ? (Math.random() - 0.5) * 3 : 0); a[i * 3 + 1] = pos[1] + 1 + (1 - f) * 70; a[i * 3 + 2] = pos[2] + 0.5 + (i && i < n - 1 ? (Math.random() - 0.5) * 3 : 0); }
    this.strahl.geometry.attributes.position.needsUpdate = true; this.strahl.visible = true; this.blitzZeit = 0.25;
  };
})();
