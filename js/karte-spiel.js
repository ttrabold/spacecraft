// Karten (#169): Erkunden mitschreiben und die Karte in der Hand öffnen (Spiel-Anbindung von js/karte.js und js/ui-karte.js)
(function(){
  var S = SC.Spiel.prototype, K = SC.Karte;
  // Erkundete Felder des aktuellen Planeten (live); zwischengespeichert, damit nicht jedes Mal dekodiert wird
  S._erkundetBits = function(){
    var p = this.welt && this.welt.planet; if(!p) return null;
    if(!this._erkBits || this._erkSeed !== p.seed || this._erkMap !== this.daten.spieler.erkundet){ this._erkBits = K.fuerPlanet(this.daten.spieler.erkundet, p); this._erkSeed = p.seed; this._erkMap = this.daten.spieler.erkundet; this._erkFeld = null; }
    return this._erkBits;
  };
  // Je Spieltakt: nur beim Wechsel in ein neues Feld nachführen (im All und ohne Welt nicht)
  S._erkunden = function(){
    var sp = this.spieler, p = this.welt && this.welt.planet, d = this.daten; if(!sp || !p || this.all || !d || !d.spieler) return;
    if(!d.spieler.erkundet || typeof d.spieler.erkundet !== "object" || Array.isArray(d.spieler.erkundet)) d.spieler.erkundet = {};
    var f = K.feldVon(p.groesse, sp.pos[0], sp.pos[2]), schl = p.seed + ":" + f.fx + ":" + f.fz; if(this._erkSchl === schl && this._erkSeed === p.seed && this._erkMap === d.spieler.erkundet) return;
    var bits = this._erkundetBits(); this._erkSchl = schl; this._erkundeteFelder = (this._erkundeteFelder || 0) + 1;
    var r = Math.max(16, Math.min(64, ((this.render && this.render.sichtweite) || 10) * 16));
    if(K.markiere(bits, p.groesse, sp.pos, r) || !d.spieler.erkundet[String(p.seed)]) K.speichereFuerPlanet(d.spieler.erkundet, p, bits);
  };
  S._karteBett = function(){ var b = this.daten.spieler.bett, p = this.welt.planet; return b && b.planet === p.id ? [b.x + 0.5, b.z + 0.5] : null; };
  // Karte in der Hand (Survival: Rucksack, Kreativ: Leiste) → öffnet sie; true, wenn die Karte gemeint war
  S._karte = function(){
    var sp = this.spieler, s = this, p = this.welt && this.welt.planet; if(!sp || !p || this.all) return false;
    var id = sp.modus === "survival" ? (this.kampf.rucksack.plaetze[sp.auswahl] || {}).block : sp.schnellleiste[sp.auswahl];
    if(id !== SC.B.KARTE || sp.modus === "zuschauer") return false;
    this._erkunden(); if(this.eingabe && this.eingabe.gebeMausFrei) this.eingabe.gebeMausFrei();
    var bett = null, bettZeit = -1;
    this.ui.zeigeKarte({
      planet: p, gen: p._gelaende || (p._gelaende = new SC.Generator(p)), name: p.id, bits: function(){ return s._erkundetBits(); },
      ich: function(){ return { pos: sp.pos, blick: sp.blick }; }, mitspieler: function(){ return s._mitspielerListe(); },
      bett: function(){ var t = Date.now(); if(t - bettZeit > 1000){ bett = s._karteBett(); bettZeit = t; } return bett; }
    }, { beiFertig: function(){ s._weiter(); } });
    return true;
  };
})();
