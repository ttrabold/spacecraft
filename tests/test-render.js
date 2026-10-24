test("Chunk-Versatz nimmt die nächste Kopie", function(){ gleich(SC.chunkVersatz(127,3,2048),-16); gleich(SC.chunkVersatz(0,2040,2048),2048); gleich(SC.chunkVersatz(10,170,2048),160); });
test("Atlas hat die richtige Größe", function(){ var a=SC.Texturen.atlas(SC.PALETTEN.start); gleich(a.width,256); gleich(a.height,256); });
test("Atlas ist deterministisch", function(){ gleich(SC.Texturen.atlas(SC.PALETTEN.start).toDataURL(), SC.Texturen.atlas(SC.PALETTEN.start).toDataURL()); });
test("Paletten ergeben verschiedene Atlanten", function(){ wahr(SC.Texturen.atlas(SC.PALETTEN.start).toDataURL()!==SC.Texturen.atlas(SC.PALETTEN.fremd).toDataURL()); });
test("Himmelsfarbe folgt der Tageszeit", function(){ var m=SC.himmelsFarben(SC.PALETTEN.start,0.5),n=SC.himmelsFarben(SC.PALETTEN.start,0.0); wahr(m.tageslicht>0.95,"Mittag hell"); wahr(n.tageslicht>=0.25&&n.tageslicht<0.4,"Nacht dunkel, aber nicht schwarz: "+n.tageslicht); });
// Laserschwert-Schwung (Issue #54): reine Schwungfunktion und Haltung in der Ich-Ansicht
test("Schwung: je Kombo bewegt sich der Arm, nach der Dauer ist er vorbei", function(){
  [0, 1, 2, 3].forEach(function(k){
    var a = SC.Figur.schwung(k, 0), m = SC.Figur.schwung(k, 0.06), e = SC.Figur.schwung(k, 0.2);
    gleich(a.x, 0); gleich(a.z, 0); wahr(Math.abs(m.x) + Math.abs(m.z) > 0.2, "Mitte bewegt: " + k); wahr(Math.abs(m.x - e.x) + Math.abs(m.z - e.z) > 0.05, "Anfang und Ende verschieden: " + k);
    gleich(SC.Figur.schwung(k, SC.Figur.SCHWUNG_DAUER), null); gleich(SC.Figur.schwung(k, 1), null);
  });
  gleich(SC.Figur.schwung(7, 0.1), null); gleich(SC.Figur.schwung(0, -1), null);
});
test("Schwung: Richtungen rechts nach links, links nach rechts, oben nach unten", function(){
  var z0a = SC.Figur.schwung(0, 0.05).z, z0b = SC.Figur.schwung(0, 0.16).z, z1a = SC.Figur.schwung(1, 0.05).z, z1b = SC.Figur.schwung(1, 0.16).z, x2a = SC.Figur.schwung(2, 0.05).x, x2b = SC.Figur.schwung(2, 0.16).x;
  wahr(z0a > 0 && z0b < z0a, "kombo 0: nach links (z fällt)"); wahr(z1a < 0 && z1b > z1a, "kombo 1: nach rechts (z steigt)"); wahr(x2b > x2a + 1, "kombo 2: von oben nach unten (x steigt)");
});
test("Schwung: aus-Objekt wird wiederverwendet", function(){ var o = { x: 9, y: 9, z: 9 }; wahr(SC.Figur.schwung(0, 0.1, o) === o); });
function _rb(){ var r = Object.create(SC.Render.prototype); r.handWaffe = SC.Figur.waffe(); r.armR = new THREE.Object3D(); r._baueAusruestung = SC.Render.prototype._baueAusruestung; r.kamera = new THREE.Object3D(); r._baueAusruestung(); r.armR = new THREE.Object3D(); return r; }
test("Ich-Ansicht: Hieb dreht die Waffe, danach wieder Ruhelage", function(){
  var r = _rb(); r._schwungBild(0.016, 0); var rx = r.handWaffe.rotation.x, rz = r.handWaffe.rotation.z; gleich(rx, -0.5); gleich(rz, 0);
  r.hieb(0); r._schwungBild(0.06, 0); wahr(Math.abs(r.handWaffe.rotation.z - rz) > 0.2, "gedreht");
  r._schwungBild(0.05, 0); r._schwungBild(0.2, 0);
  gleich(r.handWaffe.rotation.x, -0.5); gleich(r.handWaffe.rotation.z, 0); gleich(r.handWaffe.rotation.y, -0.25); gleich(r.handWaffe.position.x, 0.38); wahr(!r.schweif.visible, "Schweif aus");
});
test("Ich-Ansicht: Schweif in Klingenfarbe blendet aus", function(){
  var r = _rb(); r.ausruestung = SC.Render.prototype.ausruestung; r._fig = SC.Figur.baue("#3a6fd8"); r.szene = new THREE.Scene();
  r.ausruestung(null, { art: "laserschwert", seltenheit: 3 }); gleich(r.schweif.material.color.getHex(), r.handWaffe.klinge.material.color.getHex());
  r.hieb(1); r._schwungBild(0.05, 0); wahr(r.schweif.visible && r.schweif.material.opacity > 0.5, "sichtbar"); r._schwungBild(0.17, 0); wahr(r.schweif.material.opacity < 0.2, "blendet aus");
});
test("Ich-Ansicht und Figur: Block hält Schwert und Arm quer, Loslassen löst", function(){
  var r = _rb(); r.blocke(true); r._schwungBild(0.5, 0); wahr(r.handWaffe.rotation.z > 1.2, "Schwert quer"); wahr(r.armR.rotation.x > 1 && r.armR.rotation.z < -0.5, "Arm quer");
  r.blocke(false); r._schwungBild(0.5, 0); gleich(r.handWaffe.rotation.z, 0); gleich(r.armR.rotation.x, 0); gleich(r.armR.rotation.z, 0);
});
test("Figur von außen: Hieb schwingt den rechten Arm mit", function(){
  var r = _rb(); r.hieb(2); r._schwungBild(0.06, 0); wahr(Math.abs(r.armR.rotation.x) > 0.3, "Arm schwingt"); r._schwungBild(0.2, 0); gleich(r.armR.rotation.x, 0);
});
