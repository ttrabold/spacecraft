// Verwandlung der Figur durch Zaubertränke (Spec 2026-11-09-zaubertraenke-design.md, Überarbeitung „Kostüm + Bewegung“):
// Die Pflanze (SC.PFLANZEN[..].teil) macht die ganze Figur zum Tier: Fell in Tierfarben, Bauchfleck, Pfoten, Schnauze, Ohren, Schwanz, Flügel usw.
// Der Kristall gibt das Leuchten (durchsichtige Hüllen) und die Funken. Ohren, Schwänze, Flügel und Flammen bewegen sich (trankBild).
// Alles aus Quadern mit geteilter Geometrie; die Farben der Figur werden gemerkt und beim Ablegen des Tranks zurückgesetzt.
(function(){
  var TEILE = SC.Figur.TEILE = {};
  var KOERPER = ["kopf", "koerper", "armL", "armR", "beinL", "beinR"];

  // Bauhelfer für ein Kostüm: t = Quader (Breite, Höhe, Tiefe, Farbe, x, y, z, { rz, rx, g }), paar = links und rechts gespiegelt,
  // piv = beweglicher Drehpunkt (kind: ohr | schwanz | schwanzhoch | fluegel | flamme | feder | puls; side: ±1 für links/rechts), fell = Farben von Kopf, Körper, Armen, Beinen
  function helfer(figur, gruppe){
    var box = SC.Figur._box || (SC.Figur._box = new THREE.BoxGeometry(1, 1, 1));
    var c = {
      t: function(w, h, d, farbe, x, y, z, o){
        var m = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: farbe })); m.scale.set(w, h, d); m.position.set(x, y, z);
        if(o){ if(o.rz) m.rotation.z = o.rz; if(o.rx) m.rotation.x = o.rx; }
        (o && o.g || gruppe).add(m); return m;
      },
      paar: function(w, h, d, farbe, x, y, z, o){ c.t(w, h, d, farbe, -x, y, z, o && o.rz ? { rz: -o.rz, rx: o.rx } : o); c.t(w, h, d, farbe, x, y, z, o); },
      piv: function(kind, x, y, z, side, rz0){
        var g = new THREE.Group(); g.position.set(x, y, z); g.userData.rz0 = rz0 || 0; g.rotation.z = g.userData.rz0; gruppe.add(g);
        figur.trankAnim.push({ g: g, art: kind, side: side || 0 }); return g;
      },
      fell: function(kopf, koerper, arm, bein){
        var f = figur, farben = { kopf: kopf, koerper: koerper, armL: arm, armR: arm, beinL: bein, beinR: bein };
        KOERPER.forEach(function(n){ f[n].material.color.set(farben[n]); });
      }
    };
    return c;
  }

  TEILE.hasenohren = function(c){
    var fe = 0xe9e4da, rosa = 0xf4a8b8, w = 0xffffff; c.fell(fe, fe, fe, fe);
    [-1, 1].forEach(function(s){ var p = c.piv("ohr", s * 0.11, 1.825, 0, s); c.t(0.12, 0.8, 0.06, fe, 0, 0.4, 0, { g: p }); c.t(0.05, 0.6, 0.065, rosa, 0, 0.38, -0.01, { g: p }); });
    var sw = c.piv("schwanz", 0, 0.95, 0.12, 0); c.t(0.24, 0.24, 0.24, w, 0, 0, 0.12, { g: sw });
    c.t(0.07, 0.06, 0.04, rosa, 0, 1.55, -0.24); c.t(0.06, 0.08, 0.04, w, 0, 1.46, -0.24); c.t(0.34, 0.5, 0.02, w, 0, 1.1, -0.15);
    c.paar(0.24, 0.1, 0.38, fe, 0.13, 0.05, -0.08); c.paar(0.22, 0.14, 0.22, w, 0.36, 0.8, 0); c.t(0.24, 0.16, 0.12, w, 0, 1.5, -0.28); c.paar(0.06, 0.06, 0.02, rosa, 0.15, 1.5, -0.24);
  };
  TEILE.katzenoehrchen = function(c){
    var fe = 0xd99b52, dk = 0x8a5a20, bl = 0xf5dcae, rosa = 0xf4a8b8, w = 0xffffff; c.fell(fe, fe, fe, fe);
    [-1, 1].forEach(function(s){ var p = c.piv("ohr", s * 0.15, 1.84, 0, s); c.t(0.17, 0.22, 0.06, fe, 0, 0.11, 0, { g: p }); c.t(0.08, 0.12, 0.07, rosa, 0, 0.1, -0.005, { g: p }); });
    var sw = c.piv("schwanzhoch", 0, 0.9, 0.17, 0); c.t(0.09, 0.09, 0.55, fe, 0, 0, 0.275, { g: sw }); c.t(0.09, 0.5, 0.09, fe, 0, 0.25, 0.5, { g: sw }); c.t(0.1, 0.1, 0.1, dk, 0, 0.52, 0.5, { g: sw });
    c.t(0.07, 0.05, 0.04, rosa, 0, 1.54, -0.24); c.paar(0.3, 0.012, 0.01, w, 0.3, 1.5, -0.24);
    [1.3, 1.15, 1.0].forEach(function(y){ c.t(0.52, 0.05, 0.3, dk, 0, y, 0); });
    c.t(0.34, 0.5, 0.02, bl, 0, 1.1, -0.15); c.paar(0.22, 0.12, 0.22, bl, 0.36, 0.8, 0); c.paar(0.24, 0.1, 0.3, bl, 0.13, 0.05, -0.05); c.t(0.22, 0.14, 0.1, bl, 0, 1.5, -0.27);
  };
  TEILE.fuchsohren = function(c){
    var fe = 0xe0722a, dk = 0x3a2a22, w = 0xffffff; c.fell(fe, fe, fe, dk);
    [-1, 1].forEach(function(s){ var p = c.piv("ohr", s * 0.14, 1.825, 0, s); c.t(0.16, 0.36, 0.06, fe, 0, 0.18, 0, { g: p }); c.t(0.16, 0.1, 0.065, dk, 0, 0.32, 0, { g: p }); });
    var sw = c.piv("schwanz", 0, 0.9, 0.17, 0); c.t(0.26, 0.26, 0.6, 0xe8803a, 0, 0, 0.3, { g: sw }); c.t(0.27, 0.27, 0.16, w, 0, 0, 0.62, { g: sw });
    c.t(0.07, 0.06, 0.04, dk, 0, 1.54, -0.24); c.paar(0.1, 0.14, 0.02, w, 0.17, 1.5, -0.24); c.t(0.34, 0.5, 0.02, w, 0, 1.1, -0.15);
    c.paar(0.22, 0.18, 0.22, dk, 0.36, 0.82, 0); c.paar(0.24, 0.1, 0.36, dk, 0.13, 0.05, -0.08); c.t(0.22, 0.14, 0.14, w, 0, 1.5, -0.29); c.t(0.08, 0.06, 0.04, dk, 0, 1.54, -0.37);
  };
  TEILE.eisbaerohren = function(c){
    var w = 0xf4f8fc, sh = 0xdde6ee, dk = 0x1b1b2a; c.fell(w, w, w, w);
    [-1, 1].forEach(function(s){ var p = c.piv("ohr", s * 0.2, 1.84, 0, s); c.t(0.16, 0.16, 0.1, w, 0, 0.04, 0, { g: p }); });
    c.t(0.09, 0.07, 0.04, dk, 0, 1.52, -0.24); var sw = c.piv("schwanz", 0, 0.95, 0.13, 0); c.t(0.16, 0.16, 0.14, w, 0, 0, 0.07, { g: sw }); c.t(0.2, 0.14, 0.1, sh, 0, 1.5, -0.27);
    c.paar(0.26, 0.2, 0.26, w, 0.36, 0.8, 0); c.paar(0.2, 0.04, 0.05, dk, 0.36, 0.68, -0.14); c.paar(0.28, 0.12, 0.4, w, 0.13, 0.05, -0.1); c.t(0.34, 0.5, 0.02, sh, 0, 1.1, -0.15); c.t(0.62, 0.1, 0.38, w, 0, 1.46, 0);
  };
  TEILE.pinguinfluegel = function(c){
    var dk = 0x1e2a40, w = 0xf4f8ff, o = 0xf0a02a; c.fell(dk, dk, dk, dk);
    c.t(0.2, 0.09, 0.2, o, 0, 1.52, -0.3); c.t(0.34, 0.62, 0.02, w, 0, 1.1, -0.15); c.t(0.3, 0.26, 0.02, w, 0, 1.58, -0.235); c.t(0.12, 0.1, 0.2, dk, 0, 0.9, 0.22); c.paar(0.22, 0.07, 0.36, o, 0.13, 0.04, -0.1);
    [-1, 1].forEach(function(s){ var p = c.piv("fluegel", s * 0.4, 1.45, 0.05, s, s * 0.22); c.t(0.05, 0.62, 0.3, dk, 0, -0.31, 0, { g: p }); });
  };
  TEILE.salamanderschwanz = function(c){
    var dk = 0x3a2420, o = 0xff7a2a, em = 0xffb347; c.fell(dk, dk, dk, dk);
    var sw = c.piv("schwanz", 0, 0.9, 0.17, 0); c.t(0.14, 0.1, 0.6, dk, 0, 0, 0.3, { g: sw }); c.t(0.1, 0.12, 0.1, o, 0, 0, 0.2, { g: sw }); c.t(0.16, 0.14, 0.16, o, 0, 0, 0.65, { g: sw }); c.t(0.1, 0.1, 0.1, em, 0, 0, 0.78, { g: sw });
    [-1, 1].forEach(function(s){ var p = c.piv("flamme", s * 0.12, 1.825, 0, s); c.t(0.08, 0.2, 0.08, o, 0, 0.1, 0, { g: p }); });
    var m = c.piv("flamme", 0, 1.825, 0, 0); c.t(0.08, 0.28, 0.08, em, 0, 0.14, 0, { g: m });
    c.paar(0.07, 0.07, 0.03, em, 0.1, 1.66, -0.24); c.t(0.1, 0.6, 0.02, o, 0, 1.15, 0.15); c.paar(0.1, 0.1, 0.2, o, 0.36, 1.2, 0); c.paar(0.12, 0.1, 0.24, o, 0.13, 0.4, 0); c.t(0.34, 0.5, 0.02, em, 0, 1.1, -0.15);
    [1.4, 1.2, 1.0].forEach(function(y){ c.t(0.06, 0.1, 0.06, o, 0, y, 0.17); });
  };
  TEILE.papageienfedern = function(c){
    var rt = 0xe83a3a, ge = 0xf2d03a, bl = 0x3a7ae8, gr = 0x3fae4a; c.fell(rt, rt, bl, ge);
    [[-0.08, rt, 0.5, 0.25], [0, ge, 0.56, 0], [0.08, bl, 0.5, -0.25]].forEach(function(f, i){ var p = c.piv("feder", f[0], 1.825, 0, i - 1, f[3]); c.t(0.07, f[2], 0.07, f[1], 0, f[2] / 2, 0, { g: p }); });
    c.t(0.2, 0.16, 0.2, 0xf4f0d0, 0, 1.5, -0.3); c.t(0.12, 0.08, 0.1, 0x3a3a3a, 0, 1.43, -0.38); c.t(0.34, 0.5, 0.02, ge, 0, 1.1, -0.15);
    [-1, 1].forEach(function(s){ var p = c.piv("fluegel", s * 0.4, 1.45, 0.15, s, s * 0.3); c.t(0.08, 0.9, 0.55, bl, 0, -0.4, 0, { g: p }); c.t(0.08, 0.3, 0.5, gr, 0, -0.8, 0.03, { g: p }); });
    var sw = c.piv("schwanz", 0, 0.9, 0.17, 0); c.t(0.08, 0.1, 0.8, rt, 0, 0, 0.4, { g: sw }); c.t(0.08, 0.1, 0.55, bl, 0.1, -0.04, 0.28, { g: sw }); c.t(0.08, 0.1, 0.55, gr, -0.1, -0.04, 0.28, { g: sw });
  };
  TEILE.froschaugen = function(c){
    var gn = 0x4fbf5a, li = 0xcdee9a, dk = 0x2a8a3a; c.fell(gn, gn, gn, gn);
    c.paar(0.2, 0.2, 0.2, 0xfff8c8, 0.13, 1.95, -0.08); c.paar(0.1, 0.1, 0.04, 0x1b1b2a, 0.13, 1.95, -0.19); c.t(0.4, 0.04, 0.02, dk, 0, 1.45, -0.235); c.t(0.34, 0.5, 0.02, li, 0, 1.1, -0.15);
    c.paar(0.3, 0.05, 0.3, gn, 0.36, 0.78, -0.05); c.paar(0.3, 0.06, 0.46, gn, 0.13, 0.03, -0.12);
    var k = c.piv("puls", 0, 1.38, -0.2, 0); c.t(0.3, 0.14, 0.1, li, 0, 0, 0, { g: k });
    [1.35, 1.1].forEach(function(y){ c.paar(0.1, 0.1, 0.02, dk, 0.12, y, 0.15); });
  };
  TEILE.affenschwanz = function(c){
    var br = 0x8a5a3a, cr = 0xe8c8a0, dk = 0x5a3a22; c.fell(br, br, br, br);
    c.t(0.32, 0.3, 0.02, cr, 0, 1.56, -0.235);
    [-1, 1].forEach(function(s){ var p = c.piv("ohr", s * 0.28, 1.62, 0, s); c.t(0.16, 0.16, 0.08, br, 0, 0, 0, { g: p }); c.t(0.09, 0.09, 0.09, cr, 0, 0, -0.005, { g: p }); });
    var sw = c.piv("schwanzhoch", 0, 0.9, 0.2, 0); c.t(0.07, 0.07, 0.55, br, 0, 0, 0.275, { g: sw }); c.t(0.07, 0.45, 0.07, br, 0, 0.2, 0.5, { g: sw }); c.t(0.07, 0.07, 0.2, br, 0, 0.42, 0.4, { g: sw });
    c.t(0.34, 0.5, 0.02, cr, 0, 1.1, -0.15); c.paar(0.2, 0.14, 0.2, cr, 0.36, 0.8, 0); c.paar(0.24, 0.1, 0.34, cr, 0.13, 0.05, -0.08); c.t(0.2, 0.12, 0.1, cr, 0, 1.5, -0.28); c.t(0.3, 0.05, 0.04, dk, 0, 1.7, -0.24);
  };

  // schluessel "kristall:pflanze" oder null; derselbe Schlüssel baut nichts neu, ein ungültiger wirkt wie null; beim Wechsel und Ablegen kehren die Farben der Figur zurück
  SC.Figur.verwandle = function(figur, schluessel){
    var t = schluessel ? SC.Trank.teile(schluessel) : null, key = t ? schluessel : null;
    if((figur.trankKey || null) === key) return;
    if(figur.traenke){ figur.gruppe.remove(figur.traenke); figur.traenke.traverse(function(m){ if(m.material) m.material.dispose(); }); }
    if(figur.trankOrig){ KOERPER.forEach(function(n){ figur[n].material.color.copy(figur.trankOrig[n]); }); figur.trankOrig = null; }
    figur.traenke = null; figur.trankKey = key; figur.trankAura = []; figur.trankFunken = []; figur.trankAnim = [];
    if(!t) return;
    figur.trankOrig = {}; KOERPER.forEach(function(n){ figur.trankOrig[n] = figur[n].material.color.clone(); });
    var g = new THREE.Group(), farbe = SC.TRANK.wirkung[t.kristall].farbe, c = helfer(figur, g), box = SC.Figur._box;
    var bauen = TEILE[SC.PFLANZEN[t.pflanze].teil]; if(bauen) bauen(c);
    function huelle(w, h, d, x, y, z){ var m = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: farbe, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending })); m.scale.set(w, h, d); m.position.set(x, y, z); m.material.userData.grund = 0.2; g.add(m); figur.trankAura.push(m.material); }
    huelle(0.62, 0.87, 0.42, 0, 1.125, 0); huelle(0.57, 0.57, 0.57, 0, 1.6, 0);
    for(var i = 0; i < 6; i++){ var f = c.t(0.07, 0.07, 0.07, farbe, 0, 1, 0); f.userData.i = i; figur.trankFunken.push(f); }
    figur.gruppe.add(g); figur.traenke = g;
  };
  // Bewegung und Funken (jetzt in ms): Ohren wackeln, Schwänze wedeln, Flügel schlagen, Flammen und Kehle flackern, Funken kreisen
  SC.Figur.trankBild = function(figur, jetzt){
    if(!figur.trankKey) return;
    var s = jetzt / 1000;
    figur.trankAnim.forEach(function(a, i){
      var g = a.g, rz0 = g.userData.rz0 || 0, ph = i * 1.3;
      if(a.art === "ohr") g.rotation.z = -a.side * 0.1 + Math.sin(s * 2.6 + ph) * 0.16;
      else if(a.art === "schwanz") g.rotation.y = Math.sin(s * 5 + ph) * 0.4;
      else if(a.art === "schwanzhoch") g.rotation.y = Math.sin(s * 2.2 + ph) * 0.35;
      else if(a.art === "fluegel") g.rotation.z = a.side * (0.2 + (Math.sin(s * 7) * 0.5 + 0.5) * 0.4);
      else if(a.art === "flamme") g.scale.y = 1 + Math.sin(s * 9 + ph) * 0.22;
      else if(a.art === "feder") g.rotation.z = rz0 + Math.sin(s * 3 + ph) * 0.1;
      else if(a.art === "puls") g.scale.y = 1 + Math.sin(s * 5) * 0.15;
    });
    figur.trankFunken.forEach(function(f){ var i = f.userData.i, w = jetzt / 700 + i * Math.PI / 3; f.position.set(Math.cos(w) * 0.55, 0.3 + ((jetzt / 1500 + i / 6) % 1) * 1.7, Math.sin(w) * 0.55); });
  };
})();
