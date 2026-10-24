function _ms(){ var sz = new THREE.Scene(); return { sz: sz, r: new SC.RenderMitspieler(sz, { groesse: 2048 }) }; }
function _e(id, o){ return Object.assign({ id: id, name: "MOND "+id, farbe: "#e0533a", pos: [10, 5, 10], blick: [0, 0], modus: "survival", ausr: null, lebt: true }, o || {}); }
test("Figur.baue nutzt Farbe", function(){ var f = SC.Figur.baue("#e0533a"); gleich(f.koerper.material.color.getHex(), new THREE.Color("#e0533a").getHex()); wahr(f.armL.material.color.getHex() !== f.koerper.material.color.getHex(), "Arme abgedunkelt"); wahr(f.beinL.material.color.r < f.armL.material.color.r, "Beine dunkler als Arme"); });
test("eigene Figur sieht aus wie vorher", function(){ var f = SC.Figur.baue(); gleich(f.koerper.material.color.getHex(), new THREE.Color(0x3a6fd8).getHex()); gleich(f.kopf.material.color.getHex(), new THREE.Color(0xe8b58a).getHex()); gleich(f.armL.material.color.getHex(), new THREE.Color(0x2f5bb8).getHex()); gleich(f.armR.material.color.getHex(), new THREE.Color(0x2f5bb8).getHex()); gleich(f.beinL.material.color.getHex(), new THREE.Color(0x2b3f78).getHex()); gleich(f.beinR.material.color.getHex(), new THREE.Color(0x2b3f78).getHex()); });
test("besiegter Mitspieler ist unsichtbar", function(){ var m = _ms(); m.r.aktualisiere([_e(1, { lebt: false })], [0, 0, 0], 0.1); wahr(!m.r.figuren.get(1).f.gruppe.visible); m.r.aktualisiere([_e(1)], [0, 0, 0], 0.1); wahr(m.r.figuren.get(1).f.gruppe.visible); });
test("Figur.ausruestung zeigt Seltenheitsfarben", function(){ var f = SC.Figur.baue("#fff"); SC.Figur.ausruestung(f, { helm: { seltenheit: 3 }, brust: null }, { art: "laserschwert", seltenheit: 2 }); wahr(f.ruestung.helm[0].visible); wahr(!f.ruestung.brust[0].visible); wahr(f.waffe.visible); SC.Figur.ausruestung(f, null, null); wahr(!f.ruestung.helm[0].visible && !f.waffe.visible); });
test("aktualisiere legt an und entfernt", function(){ var m = _ms(); m.r.aktualisiere([_e(1), _e(2)], [0, 0, 0], 0.1); gleich(m.r.figuren.size, 2); gleich(m.r.gruppe.children.length, 2); m.r.aktualisiere([_e(2)], [0, 0, 0], 0.1); gleich(m.r.figuren.size, 1); gleich(m.r.gruppe.children.length, 1); });
test("Namensschild trägt den Namen", function(){ var m = _ms(); m.r.aktualisiere([_e(1, { name: "MOND 47" })], [0, 0, 0], 0.1); var o = m.r.figuren.get(1); gleich(o.f.schild.userData.name, "MOND 47"); wahr(o.f.schild.material.map, "Textur"); });
test("Zuschauer ist unsichtbar", function(){ var m = _ms(); m.r.aktualisiere([_e(1, { modus: "zuschauer" })], [0, 0, 0], 0.1); wahr(!m.r.figuren.get(1).f.gruppe.visible); m.r.aktualisiere([_e(1)], [0, 0, 0], 0.1); wahr(m.r.figuren.get(1).f.gruppe.visible); });
test("Ausrüstung der Mitspieler wird gezeigt", function(){ var m = _ms(); m.r.aktualisiere([_e(1, { ausr: { ruestung: { helm: { seltenheit: 2 } }, waffe: { art: "laserschwert", seltenheit: 1 } } })], [0, 0, 0], 0.1); var f = m.r.figuren.get(1).f; wahr(f.ruestung.helm[0].visible && f.waffe.visible); });
test("Mitspieler über die Planetenkante: nächste Kopie", function(){ var m = _ms(); m.r.aktualisiere([_e(1, { pos: [2040, 5, 10] })], [5, 0, 10], 0.1); gleich(m.r.figuren.get(1).f.gruppe.position.x, -8); });
test("Position wird geglättet", function(){ var m = _ms(); m.r.aktualisiere([_e(1, { pos: [10, 5, 10] })], [0, 0, 0], 0.1); m.r.aktualisiere([_e(1, { pos: [12, 5, 10] })], [0, 0, 0], 0.016); var x = m.r.figuren.get(1).f.gruppe.position.x; wahr(x > 10 && x < 12, "x=" + x); });
test("Mitspieler: neuer hieb.n startet den Armschwung, gleicher n nicht erneut", function(){
  var m = _ms(), arm = function(){ return m.r.figuren.get(1).f.armR.rotation; };
  m.r.aktualisiere([_e(1, { hieb: { n: 1, kombo: 2 } })], [0, 0, 0], 0.016); gleich(arm().x, 0, "beim ersten Sehen kein Nachspielen");
  m.r.aktualisiere([_e(1, { hieb: { n: 2, kombo: 2 } })], [0, 0, 0], 0.06); wahr(Math.abs(arm().x) > 0.3, "Schwung läuft");
  m.r.aktualisiere([_e(1, { hieb: { n: 2, kombo: 2 } })], [0, 0, 0], 0.3); gleich(arm().x, 0, "vorbei");
  m.r.aktualisiere([_e(1, { hieb: { n: 2, kombo: 2 } })], [0, 0, 0], 0.1); gleich(arm().x, 0, "gleicher Zähler startet nicht neu");
  m.r.aktualisiere([_e(1, { hieb: { n: 3, kombo: 0 } })], [0, 0, 0], 0.06); wahr(Math.abs(arm().z) > 0.3, "neuer Zähler, Kombo 0 seitlich");
});
test("Mitspieler: ohne hieb-Feld bleibt der Arm ruhig; blockt hält den Arm quer", function(){
  var m = _ms(), arm = function(){ return m.r.figuren.get(1).f.armR.rotation; };
  m.r.aktualisiere([_e(1)], [0, 0, 0], 0.1); gleich(arm().x, 0); gleich(arm().z, 0);
  m.r.aktualisiere([_e(1, { blockt: true })], [0, 0, 0], 0.1); wahr(arm().x > 1 && arm().z < -0.5, "Block");
  m.r.aktualisiere([_e(1, { blockt: false })], [0, 0, 0], 0.1); gleich(arm().x, 0); gleich(arm().z, 0);
});
test("Namensschild wird nach dem Laub gezeichnet (renderOrder über durchsichtigen Blöcken)", function(){ var m = _ms(); m.r.aktualisiere([_e(1)], [0, 0, 0], 0.1); wahr(m.r.figuren.get(1).f.schild.renderOrder > 1, "über Laub (1)"); });
test("Render.figurFarbe: eigene Figur in Raumfarbe, zurück auf Standard, Rüstung bleibt", function(){
  var r = _rb(); r.ausruestung = SC.Render.prototype.ausruestung; r.szene = new THREE.Scene(); r._baueFigur();
  r.figurFarbe("#e0533a"); gleich(r._fig.koerper.material.color.getHex(), new THREE.Color("#e0533a").getHex()); gleich(r.szene.children.filter(function(o){ return o === r.figur; }).length, 1);
  r.ausruestung({ helm: { seltenheit: 2 } }, null); r.figurFarbe("#2fae5a"); wahr(r._fig.ruestung.helm[0].visible, "Rüstung bleibt"); r.figurFarbe();
  var f = r._fig; gleich(f.koerper.material.color.getHex(), 0x3a6fd8); gleich(f.armL.material.color.getHex(), 0x2f5bb8); gleich(f.beinL.material.color.getHex(), 0x2b3f78); gleich(r.kopf, f.kopf);
});
