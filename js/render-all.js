// Darstellung des Alls (Stufe 5b): Sterne, Sonne, Planetenkugeln mit Oberfläche aus der echten Landschaft, Atmosphärenleuchten,
// Raumschiff von hinten, Asteroiden (ein InstancedMesh), Piraten, Geschosse, Sternstreifen beim Sprung. Eigene Szene und Kamera;
// SC.Render zeichnet sie statt der Blockwelt, solange allModus an ist. Wenige Zeichenaufrufe (unter 40).
SC.RenderAll = function(){
  var s = this;
  this.szene = new THREE.Scene();
  this.kamera = new THREE.PerspectiveCamera(70, 1, 1, 60000); this.kamera.rotation.order = "YXZ";
  this.box = new THREE.BoxGeometry(1, 1, 1);
  // Sterne auf einer großen Kugel um die Kamera
  var zf = SC.zufall(7), pos = [];
  for(var i = 0; i < 1500; i++){ var u = zf() * 2 - 1, w = zf() * Math.PI * 2, r = Math.sqrt(1 - u * u); pos.push(r * Math.cos(w) * 30000, u * 30000, r * Math.sin(w) * 30000); }
  var sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  this.sterne = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.8, sizeAttenuation: false, fog: false })); this.szene.add(this.sterne);
  this.sonne = new THREE.Mesh(new THREE.SphereGeometry(700, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff2b0 }));
  this.sonne.position.set(SC.ALL.sonne[0], SC.ALL.sonne[1], SC.ALL.sonne[2]); this.szene.add(this.sonne);
  // Schiff
  this.schiff = new THREE.Group(); this.schiff.rotation.order = "YXZ";
  SC.FAHRZEUGE.raumschiff.modell.forEach(function(t){ var m = new THREE.Mesh(s.box, new THREE.MeshBasicMaterial({ color: t.farbe })); m.scale.set(t.w, t.h, t.d); m.position.set(t.x, t.y - 1, t.z); s.schiff.add(m); });
  this.szene.add(this.schiff);
  // Asteroiden und Geschosse als InstancedMesh, Piraten als kleine Gruppen
  this.asteroiden = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshBasicMaterial({ color: 0x8a8580 }), 150); this.asteroiden.count = 0; this.szene.add(this.asteroiden);
  this.geschosse = new THREE.InstancedMesh(this.box, new THREE.MeshBasicMaterial({ color: 0xff5a3c }), 60); this.geschosse.count = 0; this.szene.add(this.geschosse);
  // Die Begrenzungskugel eines InstancedMesh wird nur einmal bestimmt (beim ersten Bild, ohne Schüsse, am Heimatplaneten) –
  // danach würden Schüsse und Asteroiden abseits davon weggeschnitten. Wenige Teile: immer zeichnen.
  this.asteroiden.frustumCulled = false; this.geschosse.frustumCulled = false;
  this.piraten = [];
  for(var p = 0; p < 4; p++){
    var g = new THREE.Group(), rumpf = new THREE.Mesh(this.box, new THREE.MeshBasicMaterial({ color: 0x5a3a4a })), fl = new THREE.Mesh(this.box, new THREE.MeshBasicMaterial({ color: 0xff3b5c }));
    rumpf.scale.set(1.6, 1, 3.2); fl.scale.set(5, 0.2, 1.4); g.add(rumpf); g.add(fl); g.visible = false; g.rotation.order = "YXZ"; this.szene.add(g); this.piraten.push(g);
  }
  // Sternstreifen beim Sprung
  var lp = new Float32Array(200 * 6); this._streifenStart = [];
  for(var k = 0; k < 200; k++) this._streifenStart.push([(zf() - 0.5) * 400, (zf() - 0.5) * 300, -zf() * 600]);
  var lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.BufferAttribute(lp, 3));
  this.streifen = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.9 })); this.streifen.visible = false; this.streifen.frustumCulled = false; this.szene.add(this.streifen);
  this.kugeln = []; this._gen = {};
  this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._v = new THREE.Vector3(); this._s = new THREE.Vector3();
};
(function(){
  var RA = SC.RenderAll.prototype, BREITE = 0.4 * Math.PI;

  // Oberflächenfarbe der Planetenstelle x, z (Hex aus der Palette): Flüssigkeit, sonst oberster Block
  RA.farbeAn = function(id, x, z){
    var g = this._gen[id], h = g.hoehe(x, z), b = g.biom(x, z), L = g._land(), B = SC.B, blk;
    if(L){ var sl = L.saeule(g, x, z, h, b); blk = sl.fluessig && sl.fluessigBis > h ? sl.fluessig : sl.oben; }
    else blk = h <= SC.MEER ? B.WASSER : b === "strand" || b === "wueste" ? B.SAND : b === "berge" ? (h > 96 ? B.SCHNEE : B.STEIN) : B.GRAS;
    return (SC.PALETTEN[g.planet.palette] || SC.PALETTEN.start).texturen[SC.BLOECKE[blk].seiten.oben][0];
  };
  // Planetenkugeln mit Texturen aus der echten Landschaft (128 × 64 Punkte) und Atmosphärenleuchten
  RA.setzePlaneten = function(daten){
    var s = this;
    this.kugeln.forEach(function(k){ s.szene.remove(k.kugel); s.szene.remove(k.hauch); k.kugel.material.map.dispose(); });
    this.kugeln = [];
    SC.PLANET_REIHENFOLGE.forEach(function(id){
      var pd = daten.planeten[id], seed = pd ? pd.seed : SC.hashText(daten.seed + ":" + id);
      s._gen[id] = new SC.Generator(new SC.Planet({ id: id, seed: seed, palette: SC.PLANETEN[id].palette, generatorVersion: pd ? pd.generatorVersion : SC.GENERATOR_VERSION }));
      var W = 128, H = 64, cv = document.createElement("canvas"); cv.width = W; cv.height = H; var cx = cv.getContext("2d");
      for(var i = 0; i < W; i++) for(var j = 0; j < H; j++){
        // Kugel-UV von three.js: Länge = π − 2π·u, Breite = (v − 0,5)·π; dieselbe Abbildung wie SC.All.zuKugel
        var lon = Math.PI - 2 * Math.PI * (i + 0.5) / W, lat = Math.max(-BREITE, Math.min(BREITE, (0.5 - (j + 0.5) / H) * Math.PI));
        var x = SC.mod(lon / (2 * Math.PI) * 2048, 2048), z = Math.min(2047, (lat / (2 * BREITE) + 0.5) * 2048);
        // Relief: höhere Stellen heller, tiefere dunkler
        var fx = Math.floor(x), fz = Math.floor(z), hx = s.farbeAn(id, fx, fz), n = parseInt(hx.slice(1), 16), f = Math.max(0.7, Math.min(1.25, 0.8 + (s._gen[id].hoehe(fx, fz) - 40) / 140));
        cx.fillStyle = "rgb(" + Math.min(255, (n >> 16 & 255) * f | 0) + "," + Math.min(255, (n >> 8 & 255) * f | 0) + "," + Math.min(255, (n & 255) * f | 0) + ")"; cx.fillRect(i, j, 1, 1);
      }
      var tex = new THREE.CanvasTexture(cv); tex.magFilter = THREE.NearestFilter; tex.colorSpace = THREE.NoColorSpace;
      var c = SC.ALL.planeten[id], kugel = new THREE.Mesh(new THREE.SphereGeometry(SC.ALL.radius, 32, 24), new THREE.MeshBasicMaterial({ map: tex }));
      var hauch = new THREE.Mesh(new THREE.SphereGeometry(SC.ALL.radius * 1.06, 32, 24), new THREE.MeshBasicMaterial({ color: (SC.PALETTEN[SC.PLANETEN[id].palette] || SC.PALETTEN.start).himmel.tag[0], transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
      kugel.position.set(c[0], c[1], c[2]); hauch.position.copy(kugel.position);
      s.szene.add(kugel); s.szene.add(hauch); s.kugeln.push({ id: id, kugel: kugel, hauch: hauch });
    });
  };
  // Planetenmarker für ein Bild der Größe breite × hoehe (Kamera des letzten Bildes): [{id, x, y, aussen, winkel}].
  // Liegt ein Planet hinter dem Schiff oder außerhalb des Bildes, sitzt sein Marker am Rand (seitlich 40 px, oben 70, unten 110 über der Schnellleiste), winkel zeigt vom Bildmittelpunkt zu ihm.
  RA.marker = function(breite, hoehe){
    var k = this.kamera, v = this._v, RAND = { l: 40, r: 40, o: 70, u: 110 };
    k.updateMatrixWorld();
    var l = this.kugeln.map(function(e){
      v.copy(e.kugel.position).project(k);
      var hinten = v.z > 1, x = v.x, y = v.y;
      if(hinten){ x = -x; y = -y; if(Math.abs(x) < 1e-6 && Math.abs(y) < 1e-6) y = -1; } // hinter dem Schiff: gespiegelt, notfalls unten
      var aussen = hinten || x < -1 || x > 1 || y < -1 || y > 1, sx = (x + 1) / 2 * breite, sy = (1 - y) / 2 * hoehe, mx = breite / 2, my = hoehe / 2, w = Math.atan2(sy - my, sx - mx);
      if(aussen){
        // vom Mittelpunkt in Richtung des Planeten bis an den Rand
        var dx = Math.cos(w), dy = Math.sin(w), f = Math.min(Math.abs(dx) > 1e-6 ? (mx - (dx > 0 ? RAND.r : RAND.l)) / Math.abs(dx) : Infinity, Math.abs(dy) > 1e-6 ? (my - (dy > 0 ? RAND.u : RAND.o)) / Math.abs(dy) : Infinity);
        sx = mx + dx * f; sy = my + dy * f;
      }
      return { id: e.id, x: Math.round(sx), y: Math.round(sy), aussen: aussen, winkel: w };
    });
    // Nahe beieinander liegende Marker (z. B. zwei Planeten hinter dem Schiff) zur Bildmitte hin auseinanderschieben
    for(var i = 1; i < l.length; i++) for(var j = 0; j < i; j++){
      if(Math.abs(l[i].x - l[j].x) < 170 && Math.abs(l[i].y - l[j].y) < 22){ l[i].y = l[j].y + (l[j].y > hoehe / 2 ? -24 : 24); j = -1; }
    }
    return l;
  };
  // Ein Bild: zustand = { schiff: {pos, blick, neigung}, asteroiden: [{pos, r}], piraten: [{pos, blick}], geschosse: [{pos, richtung}], sprung: 0..1 }
  RA.bild = function(z, dt){
    var s = this, sch = z.schiff, k = this.kamera, m = this._m, q = this._q;
    this.schiff.position.set(sch.pos[0], sch.pos[1], sch.pos[2]); this.schiff.rotation.set(sch.neigung || 0, sch.blick || 0, 0);
    var vor = [-Math.sin(sch.blick) * Math.cos(sch.neigung || 0), Math.sin(sch.neigung || 0), -Math.cos(sch.blick) * Math.cos(sch.neigung || 0)];
    k.position.set(sch.pos[0] - vor[0] * 16, sch.pos[1] - vor[1] * 16 + 4, sch.pos[2] - vor[2] * 16); k.rotation.set((sch.neigung || 0) - 0.12, sch.blick, 0);
    this.sterne.position.copy(k.position);
    var a = z.asteroiden || []; this.asteroiden.count = Math.min(150, a.length);
    for(var i = 0; i < this.asteroiden.count; i++){ var r = a[i].r; q.setFromAxisAngle(this._v.set(0.3, 1, 0.2).normalize(), i * 1.7); m.compose(this._s.set(a[i].pos[0], a[i].pos[1], a[i].pos[2]), q, new THREE.Vector3(r, r * 0.8, r)); this.asteroiden.setMatrixAt(i, m); }
    this.asteroiden.instanceMatrix.needsUpdate = true;
    var gs = z.geschosse || []; this.geschosse.count = Math.min(60, gs.length);
    for(var j = 0; j < this.geschosse.count; j++){ var g = gs[j], d = g.richtung; q.setFromUnitVectors(this._v.set(0, 0, 1), new THREE.Vector3(d[0], d[1], d[2]).normalize()); m.compose(this._s.set(g.pos[0], g.pos[1], g.pos[2]), q, new THREE.Vector3(0.3, 0.3, 4)); this.geschosse.setMatrixAt(j, m); }
    this.geschosse.instanceMatrix.needsUpdate = true;
    var pl = z.piraten || [];
    this.piraten.forEach(function(p, n){ var e = pl[n]; p.visible = !!e; if(e){ p.position.set(e.pos[0], e.pos[1], e.pos[2]); p.rotation.set(0, e.blick || 0, 0); } });
    // Sternstreifen: Linien vor der Kamera, Länge wächst mit dem Sprung
    var sp = z.sprung || 0; this.streifen.visible = sp > 0;
    if(sp > 0){
      var arr = this.streifen.geometry.attributes.position.array, len = 40 + sp * 500; k.updateMatrixWorld();
      this._streifenStart.forEach(function(p0, n){ var v1 = new THREE.Vector3(p0[0], p0[1], p0[2]).applyMatrix4(k.matrixWorld), v2 = new THREE.Vector3(p0[0], p0[1], p0[2] - len).applyMatrix4(k.matrixWorld); arr.set([v1.x, v1.y, v1.z, v2.x, v2.y, v2.z], n * 6); });
      this.streifen.geometry.attributes.position.needsUpdate = true;
    }
  };
})();
