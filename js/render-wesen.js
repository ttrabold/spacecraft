// Darstellung der Wesen: Gegner als Blockmodelle, Geschosse, Beutekugeln, Funken, Schadenszahlen, Abbau-Risse
SC.RenderWesen = function(szene, planet){
  this.szene = szene; this.planet = planet; this.objekte = new Map(); this.partikel = []; this.zahlen = [];
  this.gruppe = new THREE.Group(); szene.add(this.gruppe);
  var g = new THREE.BoxGeometry(1.01, 1.01, 1.01);
  this.riss = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false }));
  this.riss.visible = false; szene.add(this.riss);
  this.box = new THREE.BoxGeometry(1, 1, 1);
};

(function(){
  var RW = SC.RenderWesen;
  RW.nah = function(x, bezug, P){ return x + P * Math.round((bezug - x) / P); };
  RW.klingenFarbe = function(s){ return s === 0 ? "#bfe8ff" : SC.SELTENHEIT[s].farbe; };
  RW.modellMasse = function(art){
    var lo = Infinity, hi = -Infinity, top = 0;
    SC.GEGNER[art].modell.forEach(function(t){ lo = Math.min(lo, t.x - t.w / 2); hi = Math.max(hi, t.x + t.w / 2); top = Math.max(top, t.y + t.h / 2); });
    return { breite: hi - lo, hoehe: top };
  };

  function schild(text, stufe, anteil, boss){
    var c = document.createElement("canvas"); c.width = 256; c.height = 64;
    var x = c.getContext("2d");
    x.font = "bold 22px system-ui, sans-serif"; x.textAlign = "center"; x.fillStyle = boss ? "#ffad47" : "#ffffff";
    x.strokeStyle = "#000"; x.lineWidth = 4; var t = text + "  Stufe " + stufe; x.strokeText(t, 128, 24); x.fillText(t, 128, 24);
    x.fillStyle = "rgba(0,0,0,.6)"; x.fillRect(28, 36, 200, 14); x.fillStyle = anteil > 0.5 ? "#5fdc5f" : anteil > 0.25 ? "#ffd95c" : "#ff5f5f"; x.fillRect(30, 38, 196 * Math.max(0, anteil), 10);
    return c;
  }

  RW.prototype._modell = function(e){
    var g = new THREE.Group(), teile = [], box = this.box;
    SC.GEGNER[e.gegnerArt].modell.forEach(function(t){
      var m = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: t.farbe }));
      m.scale.set(t.w, t.h, t.d); m.position.set(t.x, t.y, t.z); g.add(m);
      teile.push({ mesh: m, farbe: new THREE.Color(t.farbe), leuchtet: !!t.leuchtet, teil: t.teil });
    });
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false }));
    sp.scale.set(2.2, 0.55, 1); sp.position.y = SC.GEGNER[e.gegnerArt].hoehe + 0.5; sp.visible = false; g.add(sp);
    this.gruppe.add(g);
    return { g: g, teile: teile, schild: sp, lp: -1 };
  };

  RW.prototype._geschoss = function(e){
    var spucke = e.typ === "spucke", m = new THREE.Mesh(this.box, new THREE.MeshBasicMaterial({ color: e.farbe || "#ff4f4f" }));
    if(spucke) m.scale.set(0.28, 0.28, 0.28); else m.scale.set(0.07, 0.07, 0.9);
    this.gruppe.add(m); return { g: m };
  };

  RW.prototype._kugel = function(e){
    var s = e.sache, farbe = s.gegenstand ? SC.SELTENHEIT[s.gegenstand.seltenheit || 0].farbe : "#d6c39a";
    var m = new THREE.Mesh(new THREE.OctahedronGeometry(s.gegenstand ? 0.22 : 0.15), new THREE.MeshBasicMaterial({ color: farbe }));
    var hof = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), new THREE.MeshBasicMaterial({ color: farbe, transparent: true, opacity: 0.25, depthWrite: false }));
    m.add(hof); this.gruppe.add(m); return { g: m };
  };

  RW.prototype.bild = function(welt, spielerPos, dt, licht, uhr){
    var r = this, P = this.planet.groesse, gesehen = new Set();
    welt.wesen.forEach(function(e){
      gesehen.add(e.id);
      var o = r.objekte.get(e.id);
      if(!o){ o = e.art === "gegner" ? r._modell(e) : e.art === "geschoss" ? r._geschoss(e) : r._kugel(e); r.objekte.set(e.id, o); }
      var x = RW.nah(e.pos[0], spielerPos[0], P), z = RW.nah(e.pos[2], spielerPos[2], P);
      o.g.position.set(x, e.pos[1], z);
      if(e.art === "gegner"){
        o.g.rotation.y = e.blick || 0;
        var weiss = e.getroffenBis && uhr < e.getroffenBis, l = Math.max(0.35, licht);
        o.teile.forEach(function(t){ if(weiss) t.mesh.material.color.setRGB(1, 1, 1); else if(t.leuchtet) t.mesh.material.color.copy(t.farbe); else t.mesh.material.color.copy(t.farbe).multiplyScalar(l); });
        // Laufbewegung der Beine
        var gehen = Math.hypot(e.geschw[0], e.geschw[2]) > 0.3, sw = gehen ? Math.sin(uhr / 110 + e.id) * 0.5 : 0;
        o.teile.forEach(function(t){ if(/^bein/.test(t.teil)) t.mesh.rotation.x = /R$/.test(t.teil) ? -sw : sw; });
        o.schild.visible = !!e.bemerkt;
        if(e.bemerkt && Math.round(e.lp) !== o.lp){
          o.lp = Math.round(e.lp);
          if(o.schild.material.map) o.schild.material.map.dispose();
          o.schild.material.map = new THREE.CanvasTexture(schild(SC.T.gegner[e.gegnerArt], e.stufe, e.lp / (e.lpMax || e.lp), e.boss)); o.schild.material.needsUpdate = true;
        }
      } else if(e.art === "geschoss"){
        var gs = e.geschw || [e.richtung[0], e.richtung[1], e.richtung[2]];
        o.g.lookAt(x + gs[0], e.pos[1] + gs[1], z + gs[2]);
      } else {
        o.g.rotation.y += dt * 2; o.g.position.y += 0.25 + Math.sin(uhr / 300 + e.id) * 0.08;
      }
    });
    this.objekte.forEach(function(o, id){
      if(gesehen.has(id)) return;
      r.gruppe.remove(o.g);
      o.g.traverse(function(m){ if(m.material){ if(m.material.map) m.material.map.dispose(); m.material.dispose(); } if(m.geometry && m.geometry !== r.box) m.geometry.dispose(); });
      r.objekte.delete(id);
    });
    // Funken und Zahlen
    this.partikel = this.partikel.filter(function(p){
      p.t -= dt; if(p.t <= 0){ r.gruppe.remove(p.m); p.m.material.dispose(); return false; }
      p.v[1] -= 6 * dt; p.m.position.x += p.v[0] * dt; p.m.position.y += p.v[1] * dt; p.m.position.z += p.v[2] * dt; p.m.material.opacity = Math.min(1, p.t * 2);
      return true;
    });
    this.zahlen = this.zahlen.filter(function(z){
      z.t -= dt; if(z.t <= 0){ r.gruppe.remove(z.s); z.s.material.map.dispose(); z.s.material.dispose(); return false; }
      z.s.position.y += dt * 1.2; z.s.material.opacity = Math.min(1, z.t * 2);
      return true;
    });
  };

  RW.prototype.funken = function(pos, farbe, anzahl, spielerPos){
    var P = this.planet.groesse, x = RW.nah(pos[0], spielerPos[0], P), z = RW.nah(pos[2], spielerPos[2], P);
    for(var i = 0; i < (anzahl || 18); i++){
      var m = new THREE.Mesh(this.box, new THREE.MeshBasicMaterial({ color: farbe || "#ffd95c", transparent: true }));
      m.scale.set(0.1, 0.1, 0.1); m.position.set(x, pos[1] + 0.8, z); this.gruppe.add(m);
      this.partikel.push({ m: m, t: 0.6 + Math.random() * 0.4, v: [(Math.random() - 0.5) * 6, Math.random() * 5 + 1, (Math.random() - 0.5) * 6] });
    }
  };

  RW.prototype.zahl = function(pos, text, farbe, spielerPos){
    var P = this.planet.groesse, c = document.createElement("canvas"); c.width = 128; c.height = 48;
    var x = c.getContext("2d"); x.font = "bold 34px system-ui, sans-serif"; x.textAlign = "center"; x.lineWidth = 5; x.strokeStyle = "#000"; x.fillStyle = farbe || "#ffffff";
    x.strokeText(text, 64, 36); x.fillText(text, 64, 36);
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    s.scale.set(1.2, 0.45, 1); s.position.set(RW.nah(pos[0], spielerPos[0], P), pos[1], RW.nah(pos[2], spielerPos[2], P)); this.gruppe.add(s);
    this.zahlen.push({ s: s, t: 1 });
  };

  RW.prototype.risse = function(ziel, anteil, spielerPos){
    this.riss.visible = !!ziel && anteil > 0;
    if(!this.riss.visible) return;
    var P = this.planet.groesse;
    this.riss.position.set(RW.nah(ziel.x, spielerPos[0] - 0.5, P) + 0.5, ziel.y + 0.5, RW.nah(ziel.z, spielerPos[2] - 0.5, P) + 0.5);
    this.riss.material.opacity = 0.15 + anteil * 0.5;
  };
})();
