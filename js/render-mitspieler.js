// Figuren-Fabrik (eigene Figur und Mitspieler) und Darstellung der Mitspieler mit Namensschild
SC.Figur = {
  // Farbe (CSS-Text oder Zahl) in sRGB-Kanälen abdunkeln
  dunkler: function(farbe, f){
    var h = new THREE.Color(farbe).getHex(), r = (h >> 16) & 255, g = (h >> 8) & 255, b = h & 255;
    return ((Math.round(r * f) << 16) | (Math.round(g * f) << 8) | Math.round(b * f));
  },
  waffe: function(){
    var b = SC.Figur._box || (SC.Figur._box = new THREE.BoxGeometry(1, 1, 1));
    var g = new THREE.Group(), griff = new THREE.Mesh(b, new THREE.MeshBasicMaterial({ color: 0x555a66 })), klinge = new THREE.Mesh(b, new THREE.MeshBasicMaterial({ color: 0xffffff })), lauf = new THREE.Mesh(b, new THREE.MeshBasicMaterial({ color: 0x2a2d36 }));
    griff.scale.set(0.06, 0.22, 0.06); klinge.scale.set(0.045, 0.9, 0.045); klinge.position.y = 0.56; lauf.scale.set(0.08, 0.12, 0.42); lauf.position.set(0, 0.08, -0.16);
    g.add(griff); g.add(klinge); g.add(lauf); g.klinge = klinge; g.lauf = lauf; g.visible = false; return g;
  },
  waffeStil: function(w, waffe){
    w.visible = !!waffe;
    if(!waffe) return;
    var schwert = waffe.art === "laserschwert";
    w.klinge.visible = schwert; w.lauf.visible = !schwert;
    if(schwert) w.klinge.material.color.set(SC.RenderWesen.klingenFarbe(waffe.seltenheit || 0));
    else w.lauf.material.color.set(waffe.seltenheit ? SC.SELTENHEIT[waffe.seltenheit].farbe : "#2a2d36").multiplyScalar(waffe.seltenheit ? 0.6 : 1);
  },
  // Blockfigur in Spielerfarbe mit Rüstungsteilen (unsichtbar bis ausgerüstet) und Waffe in der rechten Hand
  baue: function(farbe){
    farbe = farbe || "#3a6fd8";
    var f = new THREE.Group(), box = SC.Figur._box || (SC.Figur._box = new THREE.BoxGeometry(1, 1, 1));
    function teil(w, h, d, c, x, y, z){ var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: c })); m.position.set(x, y, z); f.add(m); return m; }
    var koerper = teil(0.5, 0.75, 0.28, farbe, 0, 1.125, 0), std = new THREE.Color(farbe).getHex() === 0x3a6fd8, arm = std ? 0x2f5bb8 : SC.Figur.dunkler(farbe, 0.82), bein = std ? 0x2b3f78 : SC.Figur.dunkler(farbe, 0.58); // eigene Standardfarbe: Gliedmaßen exakt wie früher
    var kopf = teil(0.45, 0.45, 0.45, 0xe8b58a, 0, 1.6, 0);
    teil(0.36, 0.08, 0.02, 0x333333, 0, 1.64, -0.23);      // Visier
    var armL = teil(0.2, 0.7, 0.2, arm, -0.36, 1.12, 0), armR = teil(0.2, 0.7, 0.2, arm, 0.36, 1.12, 0);
    var beinL = teil(0.22, 0.75, 0.22, bein, -0.13, 0.375, 0), beinR = teil(0.22, 0.75, 0.22, bein, 0.13, 0.375, 0);
    function rt(eltern, w, h, d, x, y, z){ var m = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: 0xffffff })); m.scale.set(w, h, d); m.position.set(x, y, z); m.visible = false; eltern.add(m); return m; }
    var ruestung = {
      helm: [rt(f, 0.52, 0.3, 0.52, 0, 1.78, 0)],
      brust: [rt(f, 0.56, 0.6, 0.34, 0, 1.2, 0)],
      handschuhe: [rt(armL, 0.24, 0.2, 0.24, 0, -0.3, 0), rt(armR, 0.24, 0.2, 0.24, 0, -0.3, 0)],
      stiefel: [rt(beinL, 0.26, 0.22, 0.28, 0, -0.28, -0.02), rt(beinR, 0.26, 0.22, 0.28, 0, -0.28, -0.02)],
      schild: [rt(f, 0.56, 0.1, 0.34, 0, 0.78, 0)]
    };
    var waffe = SC.Figur.waffe(); waffe.position.set(0, -0.35, -0.1); waffe.rotation.x = -1.2; armR.add(waffe);
    return { gruppe: f, koerper: koerper, kopf: kopf, armL: armL, armR: armR, beinL: beinL, beinR: beinR, ruestung: ruestung, waffe: waffe };
  },
  // Hieb-Schwung: Drehung (x = Arm nach vorn, z = zur Seite, +z = nach rechts außen) zum Zeitpunkt t (s) seit Hiebbeginn; nach SCHWUNG_DAUER null.
  // kombo 0 rechts nach links, 1 links nach rechts, 2 von oben nach unten, 3 Faust-Stoß. aus (optional) wird wiederverwendet (keine Zuweisung pro Bild).
  SCHWUNG_DAUER: 0.24,
  SCHWUNG: [[0.4, 1.0, 0.5, -1.1], [0.4, -1.1, 0.5, 1.0], [-0.9, 0, 1.3, 0], [-0.3, 0, 1.5, 0]], // je kombo: x0, z0 (Ausholen), x1, z1 (Ende des Hiebs)
  schwung: function(kombo, t, aus){
    var k = SC.Figur.SCHWUNG[kombo], D = SC.Figur.SCHWUNG_DAUER; if(!k || !(t >= 0) || t >= D) return null;
    var u = t / D, a, b, f;
    if(u < 0.2){ a = null; b = k; f = u / 0.2; } else if(u < 0.7){ a = k; b = k; f = (u - 0.2) / 0.5; } else { a = k; b = null; f = (u - 0.7) / 0.3; }
    f = f * f * (3 - 2 * f);
    var o = aus || {}, x0, z0, x1, z1;
    if(u < 0.2){ x0 = 0; z0 = 0; x1 = k[0]; z1 = k[1]; } else if(u < 0.7){ x0 = k[0]; z0 = k[1]; x1 = k[2]; z1 = k[3]; } else { x0 = k[2]; z0 = k[3]; x1 = 0; z1 = 0; }
    o.x = x0 + (x1 - x0) * f; o.y = 0; o.z = z0 + (z1 - z0) * f; return o;
  },
  // Rechter Arm: Gehschwung walk, Hiebschwung sw (oder null), Blockhaltung b (0..1: Arm quer vor den Körper)
  haltungArm: function(arm, walk, sw, b){
    arm.rotation.x = walk * (1 - b) + 1.1 * b + (sw ? sw.x : 0); arm.rotation.z = -0.8 * b + (sw ? sw.z : 0);
  },
  // Waffe in der Ich-Ansicht: Ruhelage, Hiebschwung sw (oder null), Blockhaltung b (0..1: Schwert quer vor dem Körper)
  haltungIch: function(w, sw, b){
    w.position.set(0.38 - 0.33 * b, -0.42 + 0.06 * b, -0.75); w.rotation.set(-0.5 + 0.35 * b - (sw ? sw.x : 0), -0.25 * (1 - b), 1.3 * b - (sw ? sw.z : 0));
  },
  // Rüstung (Platz -> Gegenstand oder null) und Waffe in Seltenheitsfarben zeigen
  ausruestung: function(figur, ruestung, waffe){
    Object.keys(figur.ruestung).forEach(function(p){ var g = ruestung && ruestung[p]; figur.ruestung[p].forEach(function(m){ m.visible = !!g; if(g) m.material.color.set(SC.SELTENHEIT[g.seltenheit || 0].farbe); }); });
    SC.Figur.waffeStil(figur.waffe, waffe);
  }
};

SC.RenderMitspieler = function(szene, planet){
  this.szene = szene; this.P = planet ? planet.groesse : 2048; this.figuren = new Map();
  this.gruppe = new THREE.Group(); szene.add(this.gruppe);
};

(function(){
  var RM = SC.RenderMitspieler, nah = function(x, b, P){ return x + P * Math.round((b - x) / P); };
  // Namensschild: weiße Schrift auf halbtransparentem dunklem Grund, Rand in Spielerfarbe
  RM.schildBild = function(name, farbe){
    var c = document.createElement("canvas"); c.width = 256; c.height = 64; var x = c.getContext("2d");
    x.fillStyle = "rgba(0,0,0,.55)"; x.fillRect(4, 8, 248, 48);
    x.strokeStyle = farbe; x.lineWidth = 5; x.strokeRect(4, 8, 248, 48);
    x.font = "bold 26px system-ui, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = "#ffffff"; x.fillText(name || "", 128, 33, 236);
    return c;
  };
  RM.prototype._neu = function(e){
    var f = SC.Figur.baue(e.farbe), sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(RM.schildBild(e.name, e.farbe)), transparent: true, depthWrite: false }));
    sp.renderOrder = 2; // nach Laub (renderOrder 1), sonst verdeckt es das Schild; feste Blöcke verdecken weiterhin (Tiefentest bleibt an)
    sp.userData.name = e.name; sp.position.y = 2.0 + 0.5 + 0.2; f.gruppe.add(sp); this.gruppe.add(f.gruppe);
    var o = { f: f, schild: sp, name: e.name, farbe: e.farbe, p: null, schlag: 0, ausr: null, hN: undefined, hK: -1, hT: 0, sw: { x: 0, y: 0, z: 0 } };
    f.schild = sp; return o;
  };
  RM.prototype._weg = function(o){
    this.gruppe.remove(o.f.gruppe);
    o.f.gruppe.traverse(function(m){ if(m.material){ if(m.material.map) m.material.map.dispose(); m.material.dispose(); } if(m.geometry && !m.isSprite && m.geometry !== SC.Figur._box) m.geometry.dispose(); });
  };
  RM.prototype.aktualisiere = function(liste, ichPos, dt, kamPos){
    var r = this, P = this.P, gesehen = {}, k0 = 1 - Math.exp(-15 * (dt || 0));
    (liste || []).forEach(function(e){
      gesehen[e.id] = true;
      var o = r.figuren.get(e.id);
      if(o && (o.farbe !== e.farbe)){ r._weg(o); o = null; }
      if(!o){ o = r._neu(e); r.figuren.set(e.id, o); }
      if(o.name !== e.name){ o.name = e.name; o.schild.userData.name = e.name; o.schild.material.map.dispose(); o.schild.material.map = new THREE.CanvasTexture(RM.schildBild(e.name, e.farbe)); o.schild.material.needsUpdate = true; }
      var k = k0, alt = o.p ? o.p.slice() : null;
      if(!o.p) o.p = e.pos.slice();
      else { var tx = nah(e.pos[0], o.p[0], P), tz = nah(e.pos[2], o.p[2], P); if(Math.abs(tx - o.p[0]) + Math.abs(tz - o.p[2]) + Math.abs(e.pos[1] - o.p[1]) > 8) k = 1; o.p[0] += (tx - o.p[0]) * k; o.p[1] += (e.pos[1] - o.p[1]) * k; o.p[2] += (tz - o.p[2]) * k; o.p[0] = (o.p[0] % P + P) % P; o.p[2] = (o.p[2] % P + P) % P; }
      var x = nah(o.p[0], ichPos[0], P), z = nah(o.p[2], ichPos[2], P), g = o.f.gruppe, blick = e.blick || [0, 0];
      g.position.set(x, o.p[1], z); g.rotation.y = blick[0]; o.f.kopf.rotation.x = blick[1];
      var tempo = alt && dt > 0 ? Math.hypot(nah(o.p[0], alt[0], P) - alt[0], nah(o.p[2], alt[2], P) - alt[2]) / dt : 0;
      if(tempo > 0.5) o.schlag += dt * 8.3; var sw = tempo > 0.5 ? Math.sin(o.schlag) * 0.6 : 0;
      o.f.armL.rotation.x = sw; o.f.beinL.rotation.x = -sw; o.f.beinR.rotation.x = sw;
      // Hieb: neuer Zähler hieb.n startet den Armschwung (beim ersten Sehen nur merken); blockt hält das Schwert quer
      if(e.hieb){ if(o.hN !== undefined && e.hieb.n !== o.hN){ o.hK = e.hieb.kombo; o.hT = 0; } o.hN = e.hieb.n; }
      var hs = null; if(o.hK >= 0){ o.hT += dt || 0; hs = SC.Figur.schwung(o.hK, o.hT, o.sw); if(!hs) o.hK = -1; }
      SC.Figur.haltungArm(o.f.armR, -sw, hs, e.blockt ? 1 : 0);
      g.visible = e.modus !== "zuschauer" && e.lebt !== false;
      var a = e.ausr || {}, key = JSON.stringify([a.ruestung || null, a.waffe || null]);
      if(key !== o.ausr){ o.ausr = key; SC.Figur.ausruestung(o.f, a.ruestung || null, a.waffe || null); }
      var halb = e.verbunden === false;
      if(halb !== !!o.halb){ o.halb = halb; g.traverse(function(m){ if(m.material && m !== o.schild){ m.material.transparent = halb || m.material.transparent; m.material.opacity = halb ? 0.4 : 1; m.material.needsUpdate = true; } }); }
      // Schild bleibt bis 64 Blöcke gleich lesbar: mit der Entfernung mitwachsen
      var d = Math.hypot(x - (kamPos ? kamPos.x : ichPos[0]), o.p[1] - (kamPos ? kamPos.y : ichPos[1]), z - (kamPos ? kamPos.z : ichPos[2])), s = 1.6 * Math.max(1, Math.min(d, 64) / 10);
      o.schild.scale.set(s, s / 4, 1); o.schild.position.y = 2.0 + 0.5 + s / 8;
    });
    this.figuren.forEach(function(o, id){ if(!gesehen[id]){ r._weg(o); r.figuren.delete(id); } });
  };
})();
