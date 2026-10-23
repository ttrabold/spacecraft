// Darstellung mit three.js: Chunks um den Spieler, Himmel, Tag und Nacht.
// Chunks werden immer an der Kopie gezeichnet, die dem Spieler am nächsten ist (Umschlagrand).
SC.chunkVersatz = function(cx, spielerX, groesse){ return cx * 16 + groesse * Math.round((spielerX - cx * 16 - 8) / groesse); };

(function(){
  function c3(h){ return new THREE.Color(h); }
  function glatt(a, b, t){ t = Math.max(0, Math.min(1, (t - a) / (b - a))); return t * t * (3 - 2 * t); }

  // Tageszeit 0 = Mitternacht, 0,5 = Mittag
  SC.himmelsFarben = function(palette, zeit){
    var winkel = (zeit - 0.25) * Math.PI * 2, sonne = Math.sin(winkel);
    var tag = glatt(-0.05, 0.35, sonne), daemmer = Math.max(0, 1 - Math.abs(sonne) / 0.3) * 0.85;
    var h = palette.himmel;
    function farbe(i){ var c = c3(h.nacht[i]).lerp(c3(h.tag[i]), tag); return c.lerp(c3(h.daemmerung[i]), daemmer * (i === 1 ? 1 : 0.5)); }
    return { oben: farbe(0), unten: farbe(1), tageslicht: 0.28 + 0.72 * tag, winkel: winkel, sonne: sonne };
  };

  var VS = [
    "attribute vec2 licht; attribute vec3 farbe;",
    "varying vec2 vUv; varying vec2 vLicht; varying vec3 vFarbe; varying float vTiefe;",
    "void main(){ vUv = uv; vLicht = licht; vFarbe = farbe;",
    "  vec4 mv = modelViewMatrix * vec4(position, 1.0); vTiefe = -mv.z; gl_Position = projectionMatrix * mv; }"
  ].join("\n");
  var FS = [
    "uniform sampler2D atlas; uniform float tageslicht; uniform vec3 nebelFarbe; uniform float nebelNah; uniform float nebelFern; uniform float alphaMin;",
    "varying vec2 vUv; varying vec2 vLicht; varying vec3 vFarbe; varying float vTiefe;",
    "void main(){ vec4 t = texture2D(atlas, vUv); if(t.a < alphaMin) discard;",
    "  vec3 hell = max(vec3(vLicht.x * tageslicht), vLicht.y * vFarbe * 1.15); hell = max(hell, vec3(0.06));",
    "  vec3 c = t.rgb * hell; float n = smoothstep(nebelNah, nebelFern, vTiefe);",
    "  gl_FragColor = vec4(mix(c, nebelFarbe, n), t.a); }"
  ].join("\n");

  SC.Render = function(leinwand, planet){
    // Farben so zeigen, wie sie in den Tabellen stehen (keine sRGB-Umrechnung)
    if(THREE.ColorManagement) THREE.ColorManagement.enabled = false;
    this.planet = planet;
    this.touch = matchMedia && matchMedia("(pointer: coarse)").matches;
    this.sichtweite = this.touch ? 6 : 10;
    this.renderer = new THREE.WebGLRenderer({ canvas: leinwand, antialias: false, powerPreference: "high-performance" });
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.touch ? 1.5 : 2));
    this.szene = new THREE.Scene();
    this.kamera = new THREE.PerspectiveCamera(75, 1, 0.08, 1000);
    this.kamera.rotation.order = "YXZ";
    this.szene.add(this.kamera);
    var atlas = new THREE.CanvasTexture(SC.Texturen.atlas(SC.PALETTEN[planet.palette] || SC.PALETTEN.start));
    atlas.magFilter = THREE.NearestFilter; atlas.minFilter = THREE.NearestFilter; atlas.generateMipmaps = false; atlas.colorSpace = THREE.NoColorSpace;
    this.atlas = atlas;
    var uni = { atlas: { value: atlas }, tageslicht: { value: 1 }, nebelFarbe: { value: new THREE.Color() }, nebelNah: { value: 100 }, nebelFern: { value: 150 }, alphaMin: { value: 0.5 } };
    this.uniforms = uni;
    this.matFest = new THREE.ShaderMaterial({ uniforms: uni, vertexShader: VS, fragmentShader: FS });
    var uniD = Object.assign({}, uni, { alphaMin: { value: 0.02 } });
    this.matDurch = new THREE.ShaderMaterial({ uniforms: uniD, vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.chunks = new Map();
    this._baueHimmel();
    this._baueRahmen();
    this._baueFigur();
    this._baueHand();
    this._baueGrenzen();
    this.wesen = new SC.RenderWesen(this.szene, planet);
    this._baueAusruestung();
    this.fps = 60; this._fpsZeit = 0; this._fpsBilder = 0;
    var r = this; this._groesse = function(){ r.renderer.setSize(window.innerWidth, window.innerHeight, false); r.kamera.aspect = window.innerWidth / window.innerHeight; r.kamera.updateProjectionMatrix(); };
    window.addEventListener("resize", this._groesse); this._groesse();
  };

  SC.Render.prototype._baueHimmel = function(){
    var g = new THREE.SphereGeometry(500, 24, 12);
    this.himmelMat = new THREE.ShaderMaterial({
      uniforms: { oben: { value: new THREE.Color() }, unten: { value: new THREE.Color() } },
      vertexShader: "varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform vec3 oben; uniform vec3 unten; varying float h; void main(){ gl_FragColor = vec4(mix(unten, oben, smoothstep(-0.05, 0.5, h)), 1.0); }",
      side: THREE.BackSide, depthWrite: false, fog: false
    });
    this.himmel = new THREE.Mesh(g, this.himmelMat); this.himmel.renderOrder = -10; this.szene.add(this.himmel);
    var p = SC.PALETTEN[this.planet.palette] || SC.PALETTEN.start;
    this.sonne = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ color: p.sonne, depthWrite: false, fog: false }));
    this.mond = new THREE.Mesh(new THREE.PlaneGeometry(36, 36), new THREE.MeshBasicMaterial({ color: p.mond, depthWrite: false, fog: false }));
    this.sonne.renderOrder = this.mond.renderOrder = -9;
    this.szene.add(this.sonne); this.szene.add(this.mond);
    var zf = SC.zufall(42), pos = [];
    for(var i = 0; i < 700; i++){ var u = zf() * 2 - 1, w = zf() * Math.PI * 2, s = Math.sqrt(1 - u * u); pos.push(s * Math.cos(w) * 450, Math.abs(u) * 450, s * Math.sin(w) * 450); }
    var sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    this.sterneMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, depthWrite: false, fog: false });
    this.sterne = new THREE.Points(sg, this.sterneMat); this.sterne.renderOrder = -9; this.szene.add(this.sterne);
  };

  SC.Render.prototype._baueRahmen = function(){
    var g = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.004, 1.004, 1.004));
    this.rahmen = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x3ef0ff }));
    this.rahmen.visible = false; this.szene.add(this.rahmen);
  };

  // Einfache Blockfigur für die Ansicht von außen
  SC.Render.prototype._baueFigur = function(){
    var f = new THREE.Group();
    function teil(w, h, d, farbe, x, y, z){ var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: farbe })); m.position.set(x, y, z); f.add(m); return m; }
    teil(0.5, 0.75, 0.28, 0x3a6fd8, 0, 1.125, 0);          // Körper
    this.kopf = teil(0.45, 0.45, 0.45, 0xe8b58a, 0, 1.6, 0);
    teil(0.36, 0.08, 0.02, 0x333333, 0, 1.64, -0.23);      // Visier
    this.armL = teil(0.2, 0.7, 0.2, 0x2f5bb8, -0.36, 1.12, 0); this.armR = teil(0.2, 0.7, 0.2, 0x2f5bb8, 0.36, 1.12, 0);
    this.beinL = teil(0.22, 0.75, 0.22, 0x2b3f78, -0.13, 0.375, 0); this.beinR = teil(0.22, 0.75, 0.22, 0x2b3f78, 0.13, 0.375, 0);
    f.visible = false; this.figur = f; this.szene.add(f);
  };

  // Rüstungsteile an der Figur und Waffe in der Hand (Seltenheitsfarbe)
  SC.Render.prototype._baueAusruestung = function(){
    var f = this.figur, b = new THREE.BoxGeometry(1, 1, 1), r = this;
    function teil(eltern, w, h, d, x, y, z){ var m = new THREE.Mesh(b, new THREE.MeshBasicMaterial({ color: 0xffffff })); m.scale.set(w, h, d); m.position.set(x, y, z); m.visible = false; eltern.add(m); return m; }
    this.ruestung = {
      helm: [teil(f, 0.52, 0.3, 0.52, 0, 1.78, 0)],
      brust: [teil(f, 0.56, 0.6, 0.34, 0, 1.2, 0)],
      handschuhe: [teil(this.armL, 0.24, 0.2, 0.24, 0, -0.3, 0), teil(this.armR, 0.24, 0.2, 0.24, 0, -0.3, 0)],
      stiefel: [teil(this.beinL, 0.26, 0.22, 0.28, 0, -0.28, -0.02), teil(this.beinR, 0.26, 0.22, 0.28, 0, -0.28, -0.02)],
      schild: [teil(f, 0.56, 0.1, 0.34, 0, 0.78, 0)]
    };
    // Waffe an der Figur (rechter Arm) und in der Ich-Ansicht
    function waffe(){
      var g = new THREE.Group(), griff = new THREE.Mesh(b, new THREE.MeshBasicMaterial({ color: 0x555a66 })), klinge = new THREE.Mesh(b, new THREE.MeshBasicMaterial({ color: 0xffffff })), lauf = new THREE.Mesh(b, new THREE.MeshBasicMaterial({ color: 0x2a2d36 }));
      griff.scale.set(0.06, 0.22, 0.06); klinge.scale.set(0.045, 0.9, 0.045); klinge.position.y = 0.56; lauf.scale.set(0.08, 0.12, 0.42); lauf.position.set(0, 0.08, -0.16);
      g.add(griff); g.add(klinge); g.add(lauf); g.klinge = klinge; g.lauf = lauf; g.visible = false; return g;
    }
    this.figurWaffe = waffe(); this.figurWaffe.position.set(0, -0.35, -0.1); this.figurWaffe.rotation.x = -1.2; this.armR.add(this.figurWaffe);
    this.handWaffe = waffe(); this.handWaffe.position.set(0.38, -0.42, -0.75); this.handWaffe.rotation.set(-0.5, -0.25, 0); this.kamera.add(this.handWaffe);
  };
  SC.Render.prototype.ausruestung = function(a, waffe){
    var r = this;
    Object.keys(this.ruestung).forEach(function(p){ var g = a && a[p]; r.ruestung[p].forEach(function(m){ m.visible = !!g; if(g) m.material.color.set(SC.SELTENHEIT[g.seltenheit || 0].farbe); }); });
    [this.figurWaffe, this.handWaffe].forEach(function(w){
      w.visible = !!waffe;
      if(!waffe) return;
      var schwert = waffe.art === "laserschwert";
      w.klinge.visible = schwert; w.lauf.visible = !schwert;
      if(schwert) w.klinge.material.color.set(SC.RenderWesen.klingenFarbe(waffe.seltenheit || 0));
      else w.lauf.material.color.set(waffe.seltenheit ? SC.SELTENHEIT[waffe.seltenheit].farbe : "#2a2d36").multiplyScalar(waffe.seltenheit ? 0.6 : 1);
    });
    this._mitWaffe = !!waffe;
  };

  // Chunk-Grenzen (Entwicklerwerkzeuge): Gitter um den Chunk des Spielers
  SC.Render.prototype._baueGrenzen = function(){
    var p = [];
    for(var i = -2; i <= 3; i++) for(var j = -2; j <= 3; j++) p.push(i * 16, 0, j * 16, i * 16, 128, j * 16);
    for(var y = 0; y <= 128; y += 16) for(var k = -2; k <= 3; k++){ p.push(-32, y, k * 16, 48, y, k * 16); p.push(k * 16, y, -32, k * 16, y, 48); }
    var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    this.grenzen = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xffd95c, transparent: true, opacity: 0.6 }));
    this.grenzen.visible = false; this.chunkGrenzen = false; this.szene.add(this.grenzen);
  };

  // Gehaltener Block unten rechts in der Ich-Ansicht
  SC.Render.prototype._baueHand = function(){
    this.hand = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), new THREE.MeshBasicMaterial({ map: this.atlas, transparent: true, alphaTest: 0.1 }));
    this.hand.position.set(0.42, -0.36, -0.7); this.hand.rotation.set(0.2, -0.6, 0);
    this.kamera.add(this.hand); this._handId = -1;
  };
  SC.Render.prototype._handBlock = function(id){
    if(id === this._handId) return;
    this._handId = id;
    var b = SC.BLOECKE[id];
    this.hand.visible = !!(b && b.seiten);
    if(!this.hand.visible) return;
    var seiten = ["seite", "seite", "oben", "unten", "seite", "seite"], uv = this.hand.geometry.attributes.uv;
    for(var f = 0; f < 6; f++){
      var q = SC.Mesher.uvFuer(b.seiten[seiten[f]]);
      for(var k = 0; k < 4; k++){ var i = f * 4 + k, u = [0, 1, 0, 1][k], v = [1, 1, 0, 0][k]; uv.setXY(i, u ? q[2] : q[0], v ? q[3] : q[1]); }
    }
    uv.needsUpdate = true;
  };

  SC.Render.prototype.welt = function(welt){
    var r = this; this.chunks.forEach(function(c){ r._entferne(c); }); this.chunks.clear(); this._welt = welt;
  };

  SC.Render.prototype._entferne = function(c){
    [c.fest, c.durch].forEach(function(m){ if(m){ m.parent && m.parent.remove(m); m.geometry.dispose(); } });
  };

  function geometrie(g){
    var b = new THREE.BufferGeometry();
    b.setAttribute("position", new THREE.BufferAttribute(g.positionen, 3));
    b.setAttribute("uv", new THREE.BufferAttribute(g.uv, 2));
    b.setAttribute("licht", new THREE.BufferAttribute(g.licht, 2));
    b.setAttribute("farbe", new THREE.BufferAttribute(g.farbe, 3));
    b.setIndex(new THREE.BufferAttribute(g.indizes, 1));
    b.computeBoundingSphere();
    return b;
  }

  SC.Render.prototype._baue = function(cx, cz){
    var w = this._welt, k = this.planet.chunkSchluessel(cx, cz), alt = this.chunks.get(k);
    var m = SC.Mesher.chunk(w, cx, cz, SC.Licht.chunk(w, cx, cz)), c = { cx: SC.mod(cx, this.planet.chunksProSeite), cz: SC.mod(cz, this.planet.chunksProSeite), fest: null, durch: null };
    if(m.fest.indizes.length){ c.fest = new THREE.Mesh(geometrie(m.fest), this.matFest); this.szene.add(c.fest); }
    if(m.durchsichtig.indizes.length){ c.durch = new THREE.Mesh(geometrie(m.durchsichtig), this.matDurch); c.durch.renderOrder = 1; this.szene.add(c.durch); }
    if(alt) this._entferne(alt);
    this.chunks.set(k, c);
  };

  // Chunks nachladen: geänderte sofort, sonst die nächsten zuerst, im Zeitbudget
  SC.Render.prototype._verwalte = function(spieler){
    var w = this._welt, n = this.planet.chunksProSeite, r = this;
    var pcx = Math.floor(spieler.pos[0] / 16), pcz = Math.floor(spieler.pos[2] / 16), sw = this.sichtweite;
    w.neuZuZeichnen.forEach(function(k){ if(r.chunks.has(k)){ var t = k.split(","); r._baue(+t[0], +t[1]); } });
    w.neuZuZeichnen.clear();
    var start = performance.now(), fehlend = [];
    for(var dx = -sw; dx <= sw; dx++) for(var dz = -sw; dz <= sw; dz++){
      if(dx * dx + dz * dz > sw * sw) continue;
      var k = this.planet.chunkSchluessel(pcx + dx, pcz + dz);
      if(!this.chunks.has(k)) fehlend.push([dx * dx + dz * dz, pcx + dx, pcz + dz]);
    }
    fehlend.sort(function(a, b){ return a[0] - b[0]; });
    this.ausstehend = fehlend.length;
    for(var i = 0; i < fehlend.length; i++){
      this._baue(fehlend[i][1], fehlend[i][2]);
      if(performance.now() - start > 6) break;
    }
    // Entladen, was weit weg ist (geänderte Chunks bleiben in welt.geaenderte)
    var weg = sw + 2;
    this.chunks.forEach(function(c, k){
      var ddx = Math.abs(SC.mod(c.cx - pcx + n / 2, n) - n / 2), ddz = Math.abs(SC.mod(c.cz - pcz + n / 2, n) - n / 2);
      if(ddx > weg || ddz > weg){ r._entferne(c); r.chunks.delete(k); }
    });
    w.chunks.forEach(function(_, k){
      var t = k.split(","), ddx = Math.abs(SC.mod(+t[0] - pcx + n / 2, n) - n / 2), ddz = Math.abs(SC.mod(+t[1] - pcz + n / 2, n) - n / 2);
      if(ddx > weg + 1 || ddz > weg + 1) w.entlade(+t[0], +t[1]);
    });
  };

  SC.Render.prototype.markiere = function(z){
    this._ziel = z;
  };

  SC.Render.prototype.bild = function(spieler, zeit, dt){
    var P = this.planet.groesse, px = spieler.pos[0], pz = spieler.pos[2];
    this._verwalte(spieler);
    this.chunks.forEach(function(c){
      var x = SC.chunkVersatz(c.cx, px, P), z = SC.chunkVersatz(c.cz, pz, P);
      if(c.fest) c.fest.position.set(x, 0, z);
      if(c.durch) c.durch.position.set(x, 0, z);
    });
    // Kamera
    var a = spieler.augen(), k = this.kamera, aussen = spieler.ansicht === "aussen";
    k.rotation.set(spieler.blick[1], spieler.blick[0], 0);
    if(aussen){ var d = spieler.richtung(); k.position.set(a[0] - d[0] * 4, a[1] - d[1] * 4 + 0.3, a[2] - d[2] * 4); }
    else k.position.set(a[0], a[1], a[2]);
    this.figur.visible = aussen && spieler.modus !== "zuschauer";
    this.figur.position.set(px, spieler.pos[1], pz); this.figur.rotation.y = spieler.blick[0];
    this.kopf.rotation.x = spieler.blick[1];
    var gehen = Math.hypot(spieler.geschw[0], spieler.geschw[2]) > 0.5 && spieler.aufBoden, schw = gehen ? Math.sin(performance.now() / 120) * 0.6 : 0;
    this.armL.rotation.x = schw; this.armR.rotation.x = -schw; this.beinL.rotation.x = -schw; this.beinR.rotation.x = schw;
    this._handBlock(spieler.modus === "zuschauer" ? -1 : spieler.schnellleiste[spieler.auswahl]);
    this.hand.visible = this.hand.visible && !aussen && spieler.modus !== "zuschauer" && !this._mitWaffe;
    this.handWaffe.visible = !!this._mitWaffe && !aussen && spieler.modus !== "zuschauer";
    this.grenzen.visible = this.chunkGrenzen;
    if(this.chunkGrenzen) this.grenzen.position.set(Math.floor(px / 16) * 16, 0, Math.floor(pz / 16) * 16);
    // Rahmen um den anvisierten Block
    var z = this._ziel;
    this.rahmen.visible = !!z;
    if(z) this.rahmen.position.set(z.x + P * Math.round((px - z.x - 0.5) / P) + 0.5, z.y + 0.5, z.z + P * Math.round((pz - z.z - 0.5) / P) + 0.5);
    // Himmel und Licht
    var h = SC.himmelsFarben(SC.PALETTEN[this.planet.palette] || SC.PALETTEN.start, zeit);
    this.himmelMat.uniforms.oben.value.copy(h.oben); this.himmelMat.uniforms.unten.value.copy(h.unten);
    this.himmel.position.copy(k.position);
    var sx = Math.cos(h.winkel), sy = Math.sin(h.winkel);
    this.sonne.position.set(k.position.x + sx * 400, k.position.y + sy * 400, k.position.z - 60); this.sonne.lookAt(k.position);
    this.mond.position.set(k.position.x - sx * 400, k.position.y - sy * 400, k.position.z + 60); this.mond.lookAt(k.position);
    this.sterne.position.copy(k.position); this.sterneMat.opacity = Math.max(0, 1 - h.tageslicht * 1.6);
    this.hand.material.color.setScalar(Math.max(0.35, h.tageslicht));
    this.uniforms.tageslicht.value = h.tageslicht; this.uniforms.nebelFarbe.value.copy(h.unten);
    this.uniforms.nebelNah.value = this.sichtweite * 16 * 0.55; this.uniforms.nebelFern.value = this.sichtweite * 16 * 0.95;
    this.wesen.bild(this._welt, spieler.pos, dt, h.tageslicht, performance.now());
    this.renderer.setClearColor(h.unten);
    this.renderer.render(this.szene, k);
    // FPS
    this._fpsBilder++; this._fpsZeit += dt;
    if(this._fpsZeit >= 0.5){ this.fps = Math.round(this._fpsBilder / this._fpsZeit); this._fpsBilder = 0; this._fpsZeit = 0; }
  };
})();
