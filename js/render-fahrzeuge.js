// Darstellung der Fahrzeuge: Blockmodelle aus SC.FAHRZEUGE[art].modell, Leuchtstreifen unabhängig vom Tageslicht
SC.RenderFahrzeuge = function(szene, planet){
  this.planet = planet; this.objekte = new Map();
  this.gruppe = new THREE.Group(); szene.add(this.gruppe);
  this.box = SC.Figur._box || (SC.Figur._box = new THREE.BoxGeometry(1, 1, 1));
};
(function(){
  var RF = SC.RenderFahrzeuge.prototype;
  RF._modell = function(f){
    var g = new THREE.Group(), teile = [], box = this.box;
    SC.FAHRZEUGE[f.art].modell.forEach(function(t){
      var m = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: t.farbe }));
      m.scale.set(t.w, t.h, t.d); m.position.set(t.x, t.y, t.z); g.add(m);
      teile.push({ mesh: m, farbe: new THREE.Color(t.farbe), leuchtet: !!t.leuchtet });
    });
    this.gruppe.add(g);
    return { g: g, teile: teile, art: f.art, licht: -1 };
  };
  // reichweite: nur Fahrzeuge so weit (waagerecht, Ring) werden dargestellt; weiter entfernte geben ihr Modell frei wie entfernte Chunks
  RF.bild = function(welt, spielerPos, licht, reichweite){
    var r = this, P = this.planet.groesse, gesehen = {}, l = Math.max(0.35, licht);
    welt.fahrzeuge.forEach(function(f, id){
      if(reichweite && Math.hypot(SC.mod(f.pos[0] - spielerPos[0] + P / 2, P) - P / 2, SC.mod(f.pos[2] - spielerPos[2] + P / 2, P) - P / 2) > reichweite) return;
      var o = r.objekte.get(id);
      if(o && o.art !== f.art){ r._weg(o); o = null; }
      if(!o){ o = r._modell(f); r.objekte.set(id, o); }
      gesehen[id] = true;
      o.g.visible = !f.weg;
      o.g.position.set(SC.RenderWesen.nah(f.pos[0], spielerPos[0], P), f.pos[1], SC.RenderWesen.nah(f.pos[2], spielerPos[2], P));
      o.g.rotation.y = f.blick;
      if(Math.abs(o.licht - l) > 0.01){ o.licht = l; o.teile.forEach(function(t){ if(t.leuchtet) t.mesh.material.color.copy(t.farbe); else t.mesh.material.color.copy(t.farbe).multiplyScalar(l); }); }
    });
    this.objekte.forEach(function(o, id){ if(!gesehen[id]){ r._weg(o); r.objekte.delete(id); } });
  };
  RF._weg = function(o){ this.gruppe.remove(o.g); o.teile.forEach(function(t){ t.mesh.material.dispose(); }); };
})();
