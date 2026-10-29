// Spieler: Position (Füße, Mitte), Blick, Modus und Physik. Kein globaler Einzelspieler,
// damit in Stufe 3 mehrere Spieler mit eigener ID in einer Welt sein können.
SC.Spieler = function(o){
  this.id = o.id; this.pos = o.pos.slice(); this.blick = (o.blick || [0, 0]).slice(); this.modus = o.modus || "kreativ";
  this.geschw = [0, 0, 0]; this.fliegt = this.modus === "zuschauer"; this.aufBoden = false; this.imWasser = false;
  this.schnellleiste = (o.schnellleiste || []).slice(); this.auswahl = 0; this.ansicht = o.ansicht || "ich";
  this._zeit = 0; this._letzterSprung = -1;
};

SC.PHYSIK = { laufen: 4.3, sprint: 5.6, fliegen: 11, schwerkraft: 32, sprung: Math.sqrt(2 * 32 * 1.25), breite: 0.6, hoehe: 1.8, augen: 1.62 };

(function(){
  var F = SC.PHYSIK, HB = F.breite / 2, EPS = 1e-4;


  // Achsenweise bewegen (gemeinsame Körperphysik aus wesen.js)
  function bewege(welt, pos, achse, d){ return SC.bewegeKoerper(welt, pos, achse, d, F.breite, F.hoehe); }

  SC.Spieler.prototype.richtung = function(){
    var g = this.blick[0], n = this.blick[1];
    return [-Math.sin(g) * Math.cos(n), Math.sin(n), -Math.cos(g) * Math.cos(n)];
  };
  SC.Spieler.prototype.augen = function(){ return [this.pos[0], this.pos[1] + F.augen, this.pos[2]]; };

  SC.Spieler.prototype.schritt = function(welt, e, dt){
    if(dt > 0.05){ var n = Math.ceil(dt / 0.05); for(var i = 0; i < n; i++) this.schritt(welt, i === 0 ? e : Object.assign({}, e, { springenNeu: false }), dt / n); return; }
    this._zeit += dt;
    var zus = this.modus === "zuschauer";
    if(zus) this.fliegt = true;
    if(this.modus === "kreativ" && e.springenNeu){
      if(this._zeit - this._letzterSprung < 0.3){ this.fliegt = !this.fliegt; this.geschw[1] = 0; this._letzterSprung = -1; }
      else this._letzterSprung = this._zeit;
    }
    if(this.modus !== "kreativ" && !zus) this.fliegt = false;

    var fb = SC.BLOECKE[welt.holeBlock(this.pos[0], this.pos[1] + 0.4, this.pos[2])];
    this.imWasser = !!fb && (fb.id === SC.B.WASSER || fb.id === SC.B.LAVA); this.imLava = !!fb && fb.id === SC.B.LAVA; // in Lava schwimmt man wie in Wasser
    // Untergrund: Eis rutscht, Schlamm bremst
    var unter = this.aufBoden && !this.fliegt ? welt.holeBlock(this.pos[0], this.pos[1] - 0.05, this.pos[2]) : SC.B.LUFT;

    // Gewünschte Richtung in der Ebene, relativ zur Blickrichtung
    var g = this.blick[0], vx = 0, vz = 0;
    var vor = (e.vor ? 1 : 0) - (e.zurueck ? 1 : 0), seit = (e.rechts ? 1 : 0) - (e.links ? 1 : 0);
    vx = -Math.sin(g) * vor + Math.cos(g) * seit; vz = -Math.cos(g) * vor - Math.sin(g) * seit;
    var l = Math.hypot(vx, vz); if(l > 0){ vx /= l; vz /= l; }
    var tempo = this.fliegt ? F.fliegen * (this.flugFaktor || 1) * (e.sprint ? 1.6 : 1) : e.sprint ? F.sprint : F.laufen;
    if(this.imWasser && !this.fliegt) tempo *= 0.6;
    if(unter === SC.B.SCHLAMM) tempo *= 0.6;
    tempo *= this.tempoFaktor || 1;
    if(unter === SC.B.EIS){ var k = Math.min(1, 3 * dt); this.geschw[0] += (vx * tempo - this.geschw[0]) * k; this.geschw[2] += (vz * tempo - this.geschw[2]) * k; }
    else { this.geschw[0] = vx * tempo; this.geschw[2] = vz * tempo; }
    // Ausweichen: kurzer Schub zusätzlich zur Laufrichtung
    if(this.schub && this.schub.t > 0){ this.geschw[0] += this.schub.v[0]; this.geschw[2] += this.schub.v[1]; this.schub.t -= dt; }

    if(this.fliegt){
      this.geschw[1] = ((e.springen ? 1 : 0) - (e.sinken ? 1 : 0)) * F.fliegen * (this.flugFaktor || 1);
    } else if(this.imWasser){
      this.geschw[1] -= 8 * dt;
      if(e.springen) this.geschw[1] = 3.5;
      if(this.geschw[1] < -3) this.geschw[1] = -3;
    } else {
      this.geschw[1] -= F.schwerkraft * dt;
      if(e.springen && this.aufBoden){ this.geschw[1] = F.sprung; this._zweiterSprung = true; }
      else if(e.springenNeu && !this.aufBoden && this.doppelsprung && this._zweiterSprung){ this.geschw[1] = F.sprung; this._zweiterSprung = false; }
      if(this.geschw[1] < -60) this.geschw[1] = -60;
    }

    if(zus){
      for(var a = 0; a < 3; a++) this.pos[a] += this.geschw[a] * dt;
      this.aufBoden = false;
    } else {
      bewege(welt, this.pos, 0, this.geschw[0] * dt);
      bewege(welt, this.pos, 2, this.geschw[2] * dt);
      var dy = this.geschw[1] * dt, stopp = bewege(welt, this.pos, 1, dy);
      this.aufBoden = stopp && dy < 0;
      if(stopp) this.geschw[1] = 0;
      if(this.aufBoden && this.fliegt && this.modus === "kreativ" && e.sinken) this.fliegt = false;
    }
    if(this.pos[1] < -20) this.pos[1] = 130;                        // Sicherheitsnetz
    var P = welt.planet.groesse;
    this.pos[0] = SC.mod(this.pos[0], P); this.pos[2] = SC.mod(this.pos[2], P);
  };

  // Kann an (x,y,z) ein Block gesetzt werden?
  SC.kannSetzen = function(welt, spieler, x, y, z){
    if(spieler.modus === "zuschauer") return false;
    if(y < 1 || y >= SC.CHUNK.H) return false;
    var vorhanden = welt.holeBlock(x, y, z);
    if(vorhanden !== SC.B.LUFT && vorhanden !== SC.B.WASSER) return false;
    var P = welt.planet.groesse, p = spieler.pos;
    // Abstand auf dem Ring, damit es auch am Rand stimmt
    var dx = SC.mod(x + 0.5 - p[0] + P / 2, P) - P / 2, dz = SC.mod(z + 0.5 - p[2] + P / 2, P) - P / 2;
    var ueberX = Math.abs(dx) < 0.5 + HB, ueberZ = Math.abs(dz) < 0.5 + HB, ueberY = y < p[1] + F.hoehe && y + 1 > p[1];
    return !(ueberX && ueberZ && ueberY);
  };
})();
