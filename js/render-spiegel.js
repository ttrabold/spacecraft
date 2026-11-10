// Spiegel (#188): Spiegelmathematik und Wahl des aktiven Spiegels (reine Funktionen, ohne WebGL); die Zeichnung steht weiter unten.
SC.Spiegel = {};
(function(){
  var B = SC.B, RADIUS = 8, DICKE = 0.08, ABST = DICKE + 0.01;   // ABST: Spiegelebene 0,01 vor der Platte, damit die Platte der Spiegelkamera hinter der Near-Ebene liegt
  // Spiegelfläche der unteren Hälfte: Normale (nx, nz) in den Raum und Lage der Ebene in der Zelle (Platte wie die Leiter, Dicke 0,08)
  var SEITEN = {};
  SEITEN[B.SPIEGEL_N] = { nx: 0, nz: 1, ex: 0.5, ez: ABST };
  SEITEN[B.SPIEGEL_S] = { nx: 0, nz: -1, ex: 0.5, ez: 1 - ABST };
  SEITEN[B.SPIEGEL_O] = { nx: -1, nz: 0, ex: 1 - ABST, ez: 0.5 };
  SEITEN[B.SPIEGEL_W] = { nx: 1, nz: 0, ex: ABST, ez: 0.5 };
  SC.Spiegel.RADIUS = RADIUS;
  SC.Spiegel.seite = function(id){ return SEITEN[id] || null; };

  // Punkt p an der Ebene durch ep mit der Normalen n (Länge 1) spiegeln
  SC.Spiegel.spiegelPunkt = function(p, ep, n){
    var d = (p[0] - ep[0]) * n[0] + (p[1] - ep[1]) * n[1] + (p[2] - ep[2]) * n[2];
    return [p[0] - 2 * d * n[0], p[1] - 2 * d * n[1], p[2] - 2 * d * n[2]];
  };
  // Richtung d an einer Ebene mit der Normalen n (Länge 1) spiegeln
  SC.Spiegel.spiegelRichtung = function(d, n){
    var k = d[0] * n[0] + d[1] * n[1] + d[2] * n[2];
    return [d[0] - 2 * k * n[0], d[1] - 2 * k * n[1], d[2] - 2 * k * n[2]];
  };

  // Alle unteren Spiegelhälften im Umkreis (Würfel) um pos [x, y, z]. Jeder Eintrag: Zelle (x, y, z), id, Normale (nx, nz)
  // und Mitte der Spiegelfläche relativ zu pos (ox, oy, oz), um den Ring des Planeten herum gerechnet.
  SC.Spiegel.kandidaten = function(welt, pos){
    var P = welt.planet.groesse, out = [], x0 = Math.floor(pos[0]), y0 = Math.floor(pos[1]), z0 = Math.floor(pos[2]);
    for(var dy = -RADIUS; dy <= RADIUS; dy++) for(var dz = -RADIUS; dz <= RADIUS; dz++) for(var dx = -RADIUS; dx <= RADIUS; dx++){
      var x = x0 + dx, y = y0 + dy, z = z0 + dz; if(y < 0) continue;
      var id = welt.holeBlock(SC.mod(x, P), y, SC.mod(z, P)), s = SEITEN[id]; if(!s) continue;
      out.push({ x: SC.mod(x, P), y: y, z: SC.mod(z, P), id: id, nx: s.nx, nz: s.nz, ox: x + s.ex - pos[0], oy: y + 1 - pos[1], oz: z + s.ez - pos[2] });
    }
    return out;
  };

  // Aus Kandidaten den aktiven Spiegel wählen: Spieler vor der Spiegelseite, höchstens 8 Blöcke entfernt, grob im Blickfeld (blick [x, y, z]);
  // der nächste gewinnt. vorher (früherer Treffer) bleibt, solange kein anderer mindestens 1 Block näher liegt (kein Flackern).
  SC.Spiegel.waehle = function(kand, blick, vorher){
    var bl = Math.sqrt(blick[0] * blick[0] + blick[1] * blick[1] + blick[2] * blick[2]) || 1, beste = null, bd = Infinity, alt = null, ad = Infinity;
    for(var i = 0; i < kand.length; i++){
      var k = kand[i], d = Math.sqrt(k.ox * k.ox + k.oy * k.oy + k.oz * k.oz);
      var bleibt = vorher && k.x === vorher.x && k.y === vorher.y && k.z === vorher.z;   // der bisherige Treffer darf großzügiger (1 Block weiter, ~75° statt ~70°): kein Flackern an den Schwellen
      if(d > RADIUS + (bleibt ? 1 : 0) || d < 0.05) continue;
      if(k.ox * k.nx + k.oz * k.nz > -0.05) continue;   // Spieler hinter der Wand oder in der Ebene
      if((blick[0] * k.ox + blick[1] * k.oy + blick[2] * k.oz) / (bl * d) < (bleibt ? 0.25 : 0.34)) continue;   // außerhalb von rund 70° um die Blickrichtung
      if(d < bd){ bd = d; beste = k; }
      if(bleibt){ alt = k; ad = d; }
    }
    return alt && ad < bd + 1 ? alt : beste;
  };
  SC.Spiegel.finde = function(welt, pos, blick, vorher){ return SC.Spiegel.waehle(SC.Spiegel.kandidaten(welt, pos), blick, vorher); };

  // Sucher mit Zwischenspeicher: die Blocksuche läuft höchstens alle 0,25 s oder nach einem Schritt von mehr als 2 Blöcken, dazwischen
  // werden nur die gemerkten Kandidaten neu bewertet (Zelle prüfen = ein Blockzugriff je Kandidat).
  SC.Spiegel.Sucher = function(){ this.kand = []; this.zeit = -1e9; this.pos = null; this.treffer = null; };
  SC.Spiegel.Sucher.prototype.finde = function(welt, pos, blick, jetzt){
    var neu = !this.pos || jetzt - this.zeit > 0.25 || Math.abs(pos[0] - this.pos[0]) + Math.abs(pos[1] - this.pos[1]) + Math.abs(pos[2] - this.pos[2]) > 2;
    if(neu){ this.kand = SC.Spiegel.kandidaten(welt, pos); this.zeit = jetzt; this.pos = pos.slice(); }
    else {
      var P = welt.planet.groesse, k2 = [];
      for(var i = 0; i < this.kand.length; i++){
        var k = this.kand[i]; if(welt.holeBlock(k.x, k.y, k.z) !== k.id) continue;   // inzwischen abgebaut
        var s = SEITEN[k.id]; k2.push(Object.assign({}, k, { ox: SC.mod(k.x + s.ex - pos[0] + P / 2, P) - P / 2, oy: k.y + 1 - pos[1], oz: SC.mod(k.z + s.ez - pos[2] + P / 2, P) - P / 2 }));
      }
      this.kand = k2;
    }
    this.treffer = SC.Spiegel.waehle(this.kand, blick, this.treffer);
    return this.treffer;
  };

  // Sichtfenster der Spiegelkamera. Statt die Hauptkamera zu spiegeln und schräg abzuschneiden, schaut die gespiegelte Kamera (hinter der Wand)
  // „durch das Fenster“ der Spiegelfläche: Blickrichtung = Normale, Near-Ebene = Spiegelebene (nichts dazwischen wird gezeichnet), schiefes
  // Sichtfeld genau über der Glasfläche. Die Textur füllt damit die Fläche ohne Verzerrung, und u läuft in Richtung rechts (ergibt das Spiegelbild).
  // augen: Kameraposition, mitte: Mitte der Spiegelfläche (2 Blöcke hoch), n: Normale [nx, 0, nz]. Fläche ohne Holzrahmen: 0,75 × 1,75.
  SC.Spiegel.BREITE = 0.75; SC.Spiegel.HOEHE = 1.75;
  SC.Spiegel.fenster = function(augen, mitte, n){
    var pos = SC.Spiegel.spiegelPunkt(augen, mitte, n), r = [-n[2], 0, n[0]], dx = mitte[0] - pos[0], dy = mitte[1] - pos[1], dz = mitte[2] - pos[2];
    var q = dx * r[0] + dz * r[2], b2 = SC.Spiegel.BREITE / 2, h2 = SC.Spiegel.HOEHE / 2;
    return { pos: pos, vor: [n[0], 0, n[2]], rechts: r, links: q - b2, rechtsKante: q + b2, unten: dy - h2, oben: dy + h2, near: dx * n[0] + dz * n[2] };
  };
})();

// Zeichnung: das Spiegelbild des aktiven Spiegels in eine kleine Textur rendern und als Fläche vor den Spiegel legen.
SC.RenderSpiegel = function(render){
  this.r = render; this.sucher = new SC.Spiegel.Sucher(); this.ziel = null; this.flaeche = null; this.kam = null; this.treffer = null; this.takt = 0; this._zeit = 0;
};
(function(){
  var P = SC.RenderSpiegel.prototype, WEIT = 52, NEBEL = 40;   // Chunks jenseits von WEIT Blöcken und Nebel ab NEBEL: das Spiegelbild muss nicht weit reichen
  // Alles abbauen (Einstellung „Aus“, neue Welt): Fläche und Textur freigeben
  P.aus = function(){
    if(this.flaeche){ this.r.szene.remove(this.flaeche); this.flaeche.geometry.dispose(); this.flaeche.material.dispose(); this.flaeche = null; }
    if(this.ziel){ this.ziel.dispose(); this.ziel = null; }
    this.treffer = null; this.sucher = new SC.Spiegel.Sucher();
  };
  P._anlegen = function(){
    var r = this.r, gross = !r.touch;
    if(!this.ziel){
      this.ziel = new THREE.WebGLRenderTarget(gross ? 256 : 128, gross ? 512 : 256, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true });
      this.ziel.texture.repeat.set(-1, 1); this.ziel.texture.offset.set(1, 0);   // u läuft in Richtung „rechts“ der Spiegelkamera (die Fläche schaut ihr entgegen)
    }
    if(!this.flaeche){
      this.flaeche = new THREE.Mesh(new THREE.PlaneGeometry(SC.Spiegel.BREITE, SC.Spiegel.HOEHE), new THREE.MeshBasicMaterial({ map: this.ziel.texture, toneMapped: false }));
      this.flaeche.scale.set(1.05, 1.025, 1);   // minimal größer als die Glasfläche: keine hellen Nahtlinien zum Rahmen
      this.flaeche.visible = false; this.r.szene.add(this.flaeche);
    }
  };
  // Je Bild vor dem Hauptbild aufrufen. spieler: Spieler, dt: Sekunden seit dem letzten Bild
  P.bild = function(spieler, dt){
    var r = this.r;
    if(r.spiegelAn === false || !r._welt){ if(this.flaeche || this.ziel) this.aus(); return; }
    if(typeof spieler.sitzt === "number"){ if(this.flaeche) this.flaeche.visible = false; return; }   // im Fahrzeug kein Spiegelbild; Textur bleibt für das Aussteigen
    this._zeit += dt || 0;
    var kc = spieler.kamera(), kp = kc.pos, t = this.sucher.finde(r._welt, kp, kc.richtung, this._zeit);
    if(!t){ if(this.flaeche) this.flaeche.visible = false; this.treffer = null; return; }
    var neu = !this.treffer || this.treffer.x !== t.x || this.treffer.y !== t.y || this.treffer.z !== t.z; this.treffer = t;
    this._anlegen();
    var mitte = [kp[0] + t.ox, kp[1] + t.oy, kp[2] + t.oz], n = [t.nx, 0, t.nz], f = SC.Spiegel.fenster(kp, mitte, n), fl = this.flaeche;
    fl.position.set(mitte[0], mitte[1], mitte[2]);   // die Fläche liegt genau auf der Spiegelebene
    fl.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(-f.rechts[0], 0, -f.rechts[2]), new THREE.Vector3(0, 1, 0), new THREE.Vector3(n[0], 0, n[2])));
    fl.visible = true;
    var gerade = !(this.takt++ & 1);
    if((r.touch || r._weniger) && !neu && !gerade) return;   // schwache Geräte: nur jedes zweite Bild erneuern
    this._zeichne(spieler, f);
  };
  P._zeichne = function(spieler, f){
    var r = this.r, k = r.kamera, kam = this.kam || (this.kam = new THREE.PerspectiveCamera()), merk = [], u = r.uniforms;
    function verstecke(o, v){ merk.push([o, o.visible]); o.visible = v; }
    kam.far = k.far; kam.projectionMatrix.makePerspective(f.links, f.rechtsKante, f.oben, f.unten, f.near, k.far); kam.projectionMatrixInverse.copy(kam.projectionMatrix).invert();
    kam.matrixAutoUpdate = false; kam.matrix.makeBasis(new THREE.Vector3(f.rechts[0], 0, f.rechts[2]), new THREE.Vector3(0, 1, 0), new THREE.Vector3(-f.vor[0], 0, -f.vor[2]));
    kam.matrix.setPosition(f.pos[0], f.pos[1], f.pos[2]); kam.matrixWorldNeedsUpdate = true;
    // Eigene Figur sichtbar (nicht als Zuschauer), alles, was an der Kamera hängt oder nur für den Spieler da ist, weg
    verstecke(this.flaeche, false); verstecke(r.figur, spieler.modus !== "zuschauer"); verstecke(r.hand, false); verstecke(r.handWaffe, false); verstecke(r.rahmen, false); verstecke(r.grenzen, false);
    var px = f.pos[0], pz = f.pos[2];   // gemessen von der Spiegelkamera (steht hinter der Wand), nicht vom Spieler
    r.chunks.forEach(function(c){
      var o = c.fest || c.form || c.durch; if(!o) return;
      if(Math.hypot(o.position.x + 8 - px, o.position.z + 8 - pz) > WEIT){ if(c.fest) verstecke(c.fest, false); if(c.form) verstecke(c.form, false); if(c.durch) verstecke(c.durch, false); }
    });
    // Himmel, Sonne, Mond und Sterne hängen an der Kamera: mit zur Spiegelkamera ziehen (gleiche Richtungen wie in der Welt)
    var dx = f.pos[0] - k.position.x, dy = f.pos[1] - k.position.y, dz = f.pos[2] - k.position.z, himmel = [r.himmel, r.sonne, r.mond, r.sterne].filter(Boolean);
    himmel.forEach(function(o){ o.position.x += dx; o.position.y += dy; o.position.z += dz; });
    var nah = u.nebelNah.value, fern = u.nebelFern.value; u.nebelFern.value = Math.min(fern, NEBEL); u.nebelNah.value = Math.min(nah, NEBEL * 0.5);
    var rt = r.renderer.getRenderTarget();
    try { r.renderer.setRenderTarget(this.ziel); r.renderer.render(r.szene, kam); }
    finally {   // auch bei einem Fehler im Zeichnen alles zurücksetzen (sonst bleiben Chunks unsichtbar und das Bild friert ein)
      r.renderer.setRenderTarget(rt);
      u.nebelNah.value = nah; u.nebelFern.value = fern;
      himmel.forEach(function(o){ o.position.x -= dx; o.position.y -= dy; o.position.z -= dz; });
      merk.forEach(function(m){ m[0].visible = m[1]; });
    }
  };
})();
