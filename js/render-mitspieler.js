// Figuren-Fabrik (eigene Figur und Mitspieler) und Darstellung der Mitspieler mit Namensschild
SC.Figur = {
  SITZEN: 1.4, // Beinwinkel im Fahrzeug (Füße nach vorn)
  // Schwung von Armen und Beinen der eigenen Figur beim Laufen; im Fahrzeug (sitzt) und im Stand keiner
  laufSchwung: function(sp, jetzt){ return typeof sp.sitzt !== "number" && sp.aufBoden && Math.hypot(sp.geschw[0], sp.geschw[2]) > 0.5 ? Math.sin(jetzt / 120) * 0.6 : 0; },
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
    if(schwert) w.klinge.material.color.set(SC.Beute.klingenFarbe(waffe));
    else w.lauf.material.color.set(waffe.klinge || (waffe.seltenheit ? SC.SELTENHEIT[waffe.seltenheit].farbe : "#2a2d36")).multiplyScalar(waffe.klinge || waffe.seltenheit ? 0.6 : 1);
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
    Object.keys(figur.ruestung).forEach(function(p){ var g = ruestung && ruestung[p]; figur.ruestung[p].forEach(function(m){ m.visible = !!g; if(g) m.material.color.set(SC.Beute.stoffFarbe(g)); }); });
    SC.Figur.waffeStil(figur.waffe, waffe);
  },
  // Zaubertrank (Spec 2026-11-09): Tier-Teile je Pflanze (SC.PFLANZEN[..].teil, Tabelle SC.Figur.TEILE) und ein Leuchten in der Farbe des Kristalls
  // (leicht durchsichtige Hüllen und kreisende Funken, kein Echtzeitlicht). schluessel "kristall:pflanze" oder null; derselbe Schlüssel baut nichts neu, ein ungültiger wirkt wie null.
  verwandle: function(figur, schluessel){
    var t = schluessel ? SC.Trank.teile(schluessel) : null, key = t ? schluessel : null;
    if((figur.trankKey || null) === key) return;
    if(figur.traenke){ figur.gruppe.remove(figur.traenke); figur.traenke.traverse(function(m){ if(m.material) m.material.dispose(); }); }
    figur.traenke = null; figur.trankKey = key; figur.trankAura = []; figur.trankFunken = [];
    if(!t) return;
    var box = SC.Figur._box || (SC.Figur._box = new THREE.BoxGeometry(1, 1, 1)), g = new THREE.Group(), farbe = SC.TRANK.wirkung[t.kristall].farbe;
    function teil(w, h, d, c, x, y, z, rz){ var m = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: c })); m.scale.set(w, h, d); m.position.set(x, y, z); if(rz) m.rotation.z = rz; g.add(m); return m; }
    function huelle(w, h, d, x, y, z){ var m = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: farbe, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending })); m.scale.set(w, h, d); m.position.set(x, y, z); g.add(m); m.material.userData.grund = 0.2; figur.trankAura.push(m.material); return m; }
    var tt = SC.Figur.TEILE[SC.PFLANZEN[t.pflanze].teil]; if(tt) tt(teil);
    huelle(0.62, 0.87, 0.42, 0, 1.125, 0); huelle(0.57, 0.57, 0.57, 0, 1.6, 0);
    for(var i = 0; i < 6; i++){ var f = teil(0.07, 0.07, 0.07, farbe, 0, 1, 0); f.userData.i = i; figur.trankFunken.push(f); }
    figur.gruppe.add(g); figur.traenke = g;
  },
  // Funken kreisen um die Figur (jetzt in ms); ohne Trank nichts zu tun
  trankBild: function(figur, jetzt){
    if(!figur.trankKey) return;
    figur.trankFunken.forEach(function(f){ var i = f.userData.i, w = jetzt / 700 + i * Math.PI / 3; f.position.set(Math.cos(w) * 0.55, 0.3 + ((jetzt / 1500 + i / 6) % 1) * 1.7, Math.sin(w) * 0.55); });
  }
};
// Tier-Teile je Name aus SC.PFLANZEN: Kopf (y 1.6, ±0.225), Rücken (z = +0.14 hinten); t(Breite, Höhe, Tiefe, Farbe, x, y, z, Drehung z)
SC.Figur.TEILE = {
  hasenohren: function(t){ t(0.1, 0.5, 0.06, 0xfff2f2, -0.1, 2.08, 0); t(0.1, 0.5, 0.06, 0xfff2f2, 0.1, 2.08, 0); t(0.16, 0.16, 0.16, 0xffffff, 0, 0.95, 0.2); },
  katzenoehrchen: function(t){ t(0.12, 0.16, 0.06, 0xd99b52, -0.15, 1.9, 0); t(0.12, 0.16, 0.06, 0xd99b52, 0.15, 1.9, 0); t(0.07, 0.07, 0.45, 0xd99b52, 0, 1.0, 0.37); },
  fuchsohren: function(t){ t(0.12, 0.22, 0.06, 0xe0722a, -0.14, 1.94, 0); t(0.12, 0.22, 0.06, 0xe0722a, 0.14, 1.94, 0); t(0.12, 0.07, 0.065, 0x3a2a22, -0.14, 2.07, 0); t(0.12, 0.07, 0.065, 0x3a2a22, 0.14, 2.07, 0); t(0.16, 0.16, 0.5, 0xe8803a, 0, 0.9, 0.4); t(0.17, 0.17, 0.12, 0xffffff, 0, 0.9, 0.68); },
  eisbaerohren: function(t){ t(0.14, 0.14, 0.08, 0xf4f8fc, -0.2, 1.85, 0); t(0.14, 0.14, 0.08, 0xf4f8fc, 0.2, 1.85, 0); },
  pinguinfluegel: function(t){ t(0.06, 0.4, 0.2, 0x1e2a40, -0.3, 1.15, 0.2); t(0.06, 0.4, 0.2, 0x1e2a40, 0.3, 1.15, 0.2); },
  salamanderschwanz: function(t){ t(0.12, 0.1, 0.55, 0x3a2420, 0, 0.9, 0.4); t(0.14, 0.12, 0.14, 0xff7a2a, 0, 0.9, 0.72); },
  papageienfedern: function(t){ t(0.06, 0.4, 0.05, 0xe83a3a, -0.08, 2.03, 0, 0.3); t(0.06, 0.45, 0.05, 0xf2d03a, 0, 2.05, 0); t(0.06, 0.4, 0.05, 0x3a7ae8, 0.08, 2.03, 0, -0.3); },
  froschaugen: function(t){ t(0.14, 0.14, 0.14, 0xfff8c8, -0.12, 1.9, -0.1); t(0.14, 0.14, 0.14, 0xfff8c8, 0.12, 1.9, -0.1); t(0.06, 0.06, 0.03, 0x1b1b2a, -0.12, 1.9, -0.18); t(0.06, 0.06, 0.03, 0x1b1b2a, 0.12, 1.9, -0.18); },
  affenschwanz: function(t){ t(0.06, 0.06, 0.5, 0x8a5a3a, 0, 0.9, 0.35); t(0.06, 0.3, 0.06, 0x8a5a3a, 0, 1.05, 0.62); }
};

SC.RenderMitspieler = function(szene, planet){
  this.szene = szene; this.P = planet ? planet.groesse : 2048; this.figuren = new Map();
  this.gruppe = new THREE.Group(); szene.add(this.gruppe);
};

(function(){
  var RM = SC.RenderMitspieler, nah = function(x, b, P){ return x + P * Math.round((b - x) / P); };
  // Namensschild: weiße Schrift auf halbtransparentem dunklem Grund, Rand in Spielerfarbe
  // balken (optional): { lp, schild } als Anteil 0..1 – Leben (grün/gelb/rot) und darunter Schild (blau); ohne balken nur der Name
  RM.schildBild = function(name, farbe, balken){
    var c = document.createElement("canvas"); c.width = 256; c.height = 64; var x = c.getContext("2d");
    x.fillStyle = "rgba(0,0,0,.55)"; x.fillRect(4, 8, 248, 48);
    x.strokeStyle = farbe; x.lineWidth = 5; x.strokeRect(4, 8, 248, 48);
    x.font = "bold " + (balken ? 22 : 26) + "px system-ui, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = "#ffffff"; x.fillText(name || "", 128, balken ? 24 : 33, 236);
    if(balken){
      x.fillStyle = "rgba(255,255,255,.18)"; x.fillRect(16, 36, 224, 9); if(balken.schild !== null) x.fillRect(16, 47, 224, 5);
      x.fillStyle = balken.lp > 0.5 ? "#4cd964" : balken.lp > 0.25 ? "#ffd93d" : "#ff5a5a"; x.fillRect(16, 36, 224 * balken.lp, 9);
      if(balken.schild !== null){ x.fillStyle = "#58b4ff"; x.fillRect(16, 47, 224 * balken.schild, 5); }
    }
    return c;
  };
  // Anteile aus den übertragenen Werten (nur Survival, lebend, mit Leben); sonst null. In Zwanzigstel gerundet, damit das Bild nicht dauernd neu entsteht.
  RM.balken = function(e){
    if(e.modus !== "survival" || e.lebt === false || !(e.lpMax > 0) || typeof e.lp !== "number") return null;
    var q = function(a, b){ return Math.round(Math.max(0, Math.min(1, a / b)) * 20) / 20; };
    return { lp: q(e.lp, e.lpMax), schild: e.schildMax > 0 && typeof e.schild === "number" ? q(e.schild, e.schildMax) : null };
  };
  RM.schildSchluessel = function(e){ var b = RM.balken(e); return e.name + "|" + e.farbe + (b ? "|" + b.lp + "|" + b.schild : ""); };
  RM.prototype._neu = function(e){
    var f = SC.Figur.baue(e.farbe), sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(RM.schildBild(e.name, e.farbe, RM.balken(e))), transparent: true, depthWrite: false }));
    sp.renderOrder = 2; // nach Laub (renderOrder 1), sonst verdeckt es das Schild; feste Blöcke verdecken weiterhin (Tiefentest bleibt an)
    sp.userData.name = e.name; sp.position.y = 2.0 + 0.5 + 0.2; f.gruppe.add(sp); this.gruppe.add(f.gruppe);
    var o = { f: f, schild: sp, name: e.name, schildKey: RM.schildSchluessel(e), farbe: e.farbe, p: null, schlag: 0, ausr: null, hN: undefined, hK: -1, hT: 0, sw: { x: 0, y: 0, z: 0 } };
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
      var sk = RM.schildSchluessel(e);
      if(o.schildKey !== sk){ o.schildKey = sk; o.name = e.name; o.schild.userData.name = e.name; o.schild.material.map.dispose(); o.schild.material.map = new THREE.CanvasTexture(RM.schildBild(e.name, e.farbe, RM.balken(e))); o.schild.material.needsUpdate = true; }
      var k = e.imFahrzeug ? 1 : k0, alt = o.p ? o.p.slice() : null; // im Fahrzeug: schon am Sitz, nicht glätten
      if(!o.p) o.p = e.pos.slice();
      else { var tx = nah(e.pos[0], o.p[0], P), tz = nah(e.pos[2], o.p[2], P); if(Math.abs(tx - o.p[0]) + Math.abs(tz - o.p[2]) + Math.abs(e.pos[1] - o.p[1]) > 8) k = 1; o.p[0] += (tx - o.p[0]) * k; o.p[1] += (e.pos[1] - o.p[1]) * k; o.p[2] += (tz - o.p[2]) * k; o.p[0] = (o.p[0] % P + P) % P; o.p[2] = (o.p[2] % P + P) % P; }
      var x = nah(o.p[0], ichPos[0], P), z = nah(o.p[2], ichPos[2], P), g = o.f.gruppe, blick = e.blick || [0, 0];
      var sitzt = typeof e.sitzt === "number"; // im Fahrzeug: Blick in Fahrtrichtung, Beine angewinkelt
      g.rotation.order = "YXZ"; g.position.set(x, o.p[1], z); g.rotation.y = sitzt ? e.sitzt : blick[0]; g.rotation.x = e.schlaeft ? Math.PI / 2 : 0; o.f.kopf.rotation.x = e.schlaeft ? 0 : blick[1];   // schlafend: auf dem Rücken
      var tempo = alt && dt > 0 ? Math.hypot(nah(o.p[0], alt[0], P) - alt[0], nah(o.p[2], alt[2], P) - alt[2]) / dt : 0;
      if(tempo > 0.5) o.schlag += dt * 8.3; var sw = tempo > 0.5 ? Math.sin(o.schlag) * 0.6 : 0;
      if(sitzt) sw = 0;
      o.f.armL.rotation.x = sw; o.f.beinL.rotation.x = sitzt ? SC.Figur.SITZEN : -sw; o.f.beinR.rotation.x = sitzt ? SC.Figur.SITZEN : sw;
      // Hieb: neuer Zähler hieb.n startet den Armschwung (beim ersten Sehen nur merken); blockt hält das Schwert quer
      if(e.hieb){ if(o.hN !== undefined && e.hieb.n !== o.hN){ o.hK = e.hieb.kombo; o.hT = 0; } o.hN = e.hieb.n; }
      var hs = null; if(o.hK >= 0){ o.hT += dt || 0; hs = SC.Figur.schwung(o.hK, o.hT, o.sw); if(!hs) o.hK = -1; }
      SC.Figur.haltungArm(o.f.armR, -sw, hs, e.blockt ? 1 : 0);
      g.visible = e.modus !== "zuschauer" && e.lebt !== false;
      var a = e.ausr || {}, key = JSON.stringify([a.ruestung || null, a.waffe || null]);
      if(key !== o.ausr){ o.ausr = key; SC.Figur.ausruestung(o.f, a.ruestung || null, a.waffe || null); }
      SC.Figur.verwandle(o.f, e.trank || null); SC.Figur.trankBild(o.f, performance.now());   // Zaubertrank: Tier-Teile und Leuchten
      var halb = e.verbunden === false;
      if(halb !== !!o.halb){ o.halb = halb; g.traverse(function(m){ if(m.material && m !== o.schild){ var grund = m.material.userData.grund || 1; m.material.transparent = halb || m.material.transparent; m.material.opacity = halb ? 0.4 * grund : grund; m.material.needsUpdate = true; } }); }
      // Schild bleibt bis 64 Blöcke gleich lesbar: mit der Entfernung mitwachsen
      var d = Math.hypot(x - (kamPos ? kamPos.x : ichPos[0]), o.p[1] - (kamPos ? kamPos.y : ichPos[1]), z - (kamPos ? kamPos.z : ichPos[2])), s = 1.6 * Math.max(1, Math.min(d, 64) / 10);
      o.schild.scale.set(s, s / 4, 1); o.schild.position.y = 2.0 + 0.5 + s / 8;
    });
    this.figuren.forEach(function(o, id){ if(!gesehen[id]){ r._weg(o); r.figuren.delete(id); } });
  };
})();
