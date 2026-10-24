// Kampf: Werte und Ausrüstung der Spielfigur, eigene Angriffe, Treffer in beide Richtungen,
// Schild, Erholung, Erfahrung, Besiegt und Wiedereinstieg. Zeiten in Millisekunden (jetzt).
SC.Kampf = function(welt, spieler, daten, zf){
  this.welt = welt; this.spieler = spieler; this.daten = daten; this.zf = zf;
  var s = daten.spieler;
  this.rucksack = new SC.Rucksack(s.rucksack);
  this.ausruestung = JSON.parse(JSON.stringify(s.ausruestung || { helm: null, brust: null, handschuhe: null, stiefel: null, schild: null }));
  this.werte = { stufe: s.stufe || 1, erfahrung: s.erfahrung || 0, lp: 0, lpMax: 0, schild: 0, schildMax: 0, schutz: 0, schadenBonus: 0, tempoBonus: 0, erholungBonus: 0 };
  this.ruestungAnwenden();
  this.werte.lp = s.lebenspunkte == null ? this.werte.lpMax : Math.min(s.lebenspunkte, this.werte.lpMax);
  this.werte.schild = s.schild == null ? this.werte.schildMax : Math.min(s.schild, this.werte.schildMax);
  this.uhr = 0; this.hitze = 0; this.ueberhitztBis = 0; this.ausweichenBis = 0; this.ausweichenBereit = 0;
  this.zuletztGetroffen = -1e9; this.letzterAngriff = -1e9; this.kombo = 0; this.blockt = false; this.letzterTreffer = null;
  this.unverwundbar = false;
};

(function(){
  var K = SC.Kampf.prototype, PLAETZE = ["helm", "brust", "handschuhe", "stiefel", "schild"];

  function flach(v){ var l = Math.hypot(v[0], v[2]) || 1; return [v[0] / l, v[2] / l]; }
  function blickFlach(sp){ return [-Math.sin(sp.blick[0]), -Math.cos(sp.blick[0])]; }
  function ring(welt, a, b){ var P = welt.planet.groesse; return [SC.mod(b[0] - a[0] + P / 2, P) - P / 2, b[1] - a[1], SC.mod(b[2] - a[2] + P / 2, P) - P / 2]; }

  K.ruestungAnwenden = function(){
    var w = this.werte, a = this.ausruestung, sonder = new Set();
    w.schutz = 0; w.schildMax = 0; w.schadenBonus = 0; w.tempoBonus = 0; w.erholungBonus = 0;
    var lpBonus = 0;
    PLAETZE.forEach(function(p){
      var g = a[p]; if(!g) return;
      var v = g.werte || {};
      w.schutz += v.schutz || 0; w.schildMax += v.schild || 0; lpBonus += v.lp || 0;
      w.schadenBonus += v.schadenProzent || 0; w.tempoBonus += v.tempo || 0; w.erholungBonus += v.erholung || 0;
      if(g.sonder) sonder.add(g.sonder);
    });
    w.lpMax = SC.Werte.lebenspunkte(w.stufe) + lpBonus;
    w.lp = Math.min(w.lp, w.lpMax); w.schild = Math.min(w.schild, w.schildMax);
    this.sonder = sonder;
    this.spieler.doppelsprung = sonder.has("doppelsprung");
    this.spieler.leuchten = sonder.has("leuchten");
    this.spieler.tempoFaktor = 1 + w.tempoBonus / 100;
  };

  K.waffe = function(){
    var s = this.rucksack.plaetze[this.spieler.auswahl], g = s && s.gegenstand;
    return g && SC.GEGENSTAENDE[g.art] && SC.GEGENSTAENDE[g.art].platz === "waffe" ? g : null;
  };

  K.angriff = function(jetzt, richtung){
    this.uhr = jetzt;
    var w = this.waffe();
    if(!w){
      // Ohne Waffe: schwacher Faustschlag
      if(jetzt - this.letzterAngriff < 500) return null;
      this.letzterAngriff = jetzt; this.kombo = 0;
      return { art: "hieb", reichweite: 2, schaden: 3 + this.werte.stufe * 0.5, kombo: 0, faust: true };
    }
    var def = SC.GEGENSTAENDE[w.art].waffe, schaden = w.werte.schaden * (1 + this.werte.schadenBonus / 100);
    if(jetzt - this.letzterAngriff < def.rate * 1000) return null;
    if(def.typ === "schwert"){
      this.kombo = jetzt - this.letzterAngriff < 900 ? (this.kombo + 1) % 3 : 0;
      this.letzterAngriff = jetzt;
      return { art: "hieb", reichweite: def.reichweite, schaden: schaden * (this.kombo === 2 ? 1.5 : 1), kombo: this.kombo, funkenhieb: w.sonder === "funkenhieb" && this.kombo === 2 };
    }
    if(jetzt < this.ueberhitztBis) return null;
    this.hitze += def.hitze;
    if(this.hitze >= 1){ this.hitze = 1; this.ueberhitztBis = jetzt + 1500; }
    this.letzterAngriff = jetzt;
    return { art: "schuss", pos: this.spieler.augen(), richtung: richtung, tempo: def.tempo, schaden: schaden, abprall: w.sonder === "abprall", farbe: SC.SELTENHEIT[w.seltenheit].farbe, reichweite: def.reichweite };
  };

  K.blocken = function(an){ var w = this.waffe(); this.blockt = !!an && !!w && SC.GEGENSTAENDE[w.art].waffe.typ === "schwert"; };

  K.ausweichen = function(jetzt, richtung){
    this.uhr = jetzt;
    if(jetzt < this.ausweichenBereit) return false;
    this.ausweichenBis = jetzt + 300; this.ausweichenBereit = jetzt + 1500;
    var r = flach(richtung); this.spieler.schub = { v: [r[0] * 12, r[1] * 12], t: 0.2 };
    return true;
  };

  // von = Flugrichtung des Angriffs; von vorn heißt: entgegen der Blickrichtung
  function vonVorn(sp, von){ var b = blickFlach(sp), v = flach(von); return b[0] * v[0] + b[1] * v[1] < -0.5; }

  K.trifftSpieler = function(schaden, von, geschoss){
    var sp = this.spieler, w = this.werte;
    if(sp.modus !== "survival" || this.unverwundbar || this.uhr < this.ausweichenBis) return { abgeprallt: false, schaden: 0 };
    if(this.blockt && vonVorn(sp, von)){
      if(geschoss && (geschoss.typ || geschoss.art) === "laser"){
        SC.Wesen.neu(this.welt, "geschoss", { pos: geschoss.pos.slice(), richtung: [-geschoss.richtung[0], -geschoss.richtung[1], -geschoss.richtung[2]], tempo: 35, schaden: schaden, team: "spieler", art: "laser", lebensdauer: 2, farbe: "#7cf3ff" });
        return { abgeprallt: true, schaden: 0 };
      }
      schaden *= 0.5;
    }
    var s = schaden * (SC.SCHWIERIGKEIT[this.daten.schwierigkeit] || SC.SCHWIERIGKEIT.normal).schaden;
    var ab = Math.min(w.schild, s); w.schild -= ab; s -= ab;
    var rest = SC.Werte.nachSchutz(s, w.schutz);
    w.lp = Math.max(0, w.lp - rest);
    this.zuletztGetroffen = this.uhr; this.letzterTreffer = { zeit: this.uhr, richtung: von.slice() };
    return { abgeprallt: false, schaden: ab + rest };
  };

  K.trifftGegner = function(g, schaden, von, geschoss){
    var def = SC.GEGNER[g.gegnerArt] || {}, f = 1;
    if(def.rueckenFaktor){
      var b = [-Math.sin(g.blick || 0), -Math.cos(g.blick || 0)], v = flach(von);
      f = b[0] * v[0] + b[1] * v[1] < 0 ? def.vorneFaktor : def.rueckenFaktor;
    }
    if(def.blockt && g.blockt && geschoss && (geschoss.typ || geschoss.art) === "laser"){
      var bb = [-Math.sin(g.blick || 0), -Math.cos(g.blick || 0)], vv = flach(von);
      if(bb[0] * vv[0] + bb[1] * vv[1] < -0.3) return { abgeprallt: true, besiegt: false, schaden: 0 };
    }
    var s = schaden * f;
    g.lp -= s; g.getroffenBis = this.uhr + 150; g.bemerkt = true; g.vergessen = 6;
    if(!def.boss){ var r = flach(von); g.geschw[0] += r[0] * 3; g.geschw[2] += r[1] * 3; }
    return { abgeprallt: false, besiegt: g.lp <= 0, schaden: s };
  };

  // Gegner im Bogen vor dem Spieler (für Laserschwert-Hiebe)
  K.hiebZiele = function(hieb){
    var sp = this.spieler, b = blickFlach(sp), aus = [], welt = this.welt;
    welt.wesen.forEach(function(e){
      if(e.art !== "gegner") return;
      var d = ring(welt, sp.pos, e.pos), l = Math.hypot(d[0], d[2]);
      if(l > hieb.reichweite + e.breite / 2 || Math.abs(d[1]) > 2.5) return;
      if(l < 0.5 || (b[0] * d[0] + b[1] * d[2]) / l > 0.3) aus.push(e);
    });
    return aus;
  };

  // Hieb oder Stampfen eines Gegners gegen den Spieler (Schüsse laufen über Geschosse)
  K.gegnerAktion = function(g, a){
    var t = SC.Kampf.aktionTrifft(this.welt, g, a, this.spieler.pos, this.spieler.aufBoden);
    return t ? this.trifftSpieler(t.schaden, t.von, null) : null;
  };
  // Reine Geometrie: trifft Hieb oder Stampfen eines Gegners einen Spieler an pos? → {schaden, von} oder null
  SC.Kampf.aktionTrifft = function(welt, g, a, pos, aufBoden){
    var d = ring(welt, g.pos, pos), l = Math.hypot(d[0], d[2]), von = [d[0] / (l || 1), 0, d[2] / (l || 1)];
    if(a.art === "hieb" && l <= a.reichweite + 0.6 && Math.abs(d[1]) < 2) return { schaden: a.schaden, von: von };
    if(a.art === "stampf" && l <= a.radius && aufBoden !== false) return { schaden: a.schaden, von: von };
    return null;
  };

  K.besiegtGegner = function(g){
    var r = SC.Kampf.beuteFuer(g, this.daten, this.zf);
    return { erfahrung: r.erfahrung, aufstiege: this.gibErfahrung(r.erfahrung), beute: r.beute };
  };
  // Erfahrung verbuchen; bei Aufstieg Werte neu und voll aufgefüllt. Liefert die Zahl der Aufstiege.
  K.gibErfahrung = function(xp){
    var auf = SC.Werte.gibErfahrung(this.werte, xp);
    if(auf){ this.ruestungAnwenden(); this.werte.lp = this.werte.lpMax; this.werte.schild = this.werte.schildMax; }
    return auf;
  };
  // Erfahrung und Beute für einen besiegten Gegner würfeln (ohne sie zu verbuchen); im Raum einmal für alle
  SC.Kampf.beuteFuer = function(g, daten, zf){
    var def = SC.GEGNER[g.gegnerArt] || {}, boss = !!(def.boss || g.boss);
    var xp = SC.Werte.erfahrungFuerGegner(g.stufe, boss);
    var beute = [], bonus = (SC.SCHWIERIGKEIT[daten.schwierigkeit] || {}).seltenheitBonus || 0;
    if(zf() < ((def.beute && def.beute.chance) || 0.3)){
      for(var i = 0; i < (boss ? 2 : 1); i++) beute.push(SC.Beute.erzeuge(zf, { stufe: g.stufe, ort: g.ort, mindest: boss ? 2 : 0, bonus: bonus }));
    }
    return { erfahrung: xp, beute: beute, boss: boss };
  };

  K.schritt = function(jetzt, dt){
    var w = this.werte; this.uhr = jetzt;
    this.hitze = Math.max(0, this.hitze - 0.25 * dt);
    if(jetzt >= this.ueberhitztBis && this.ueberhitztBis && this.hitze > 0.6 && jetzt - this.ueberhitztBis < 50) this.hitze = 0.6;
    if(w.lp > 0 && jetzt - this.zuletztGetroffen > 5000) w.lp = Math.min(w.lpMax, w.lp + w.lpMax * 0.04 * dt * (1 + w.erholungBonus / 100));
    if(jetzt - this.zuletztGetroffen > 3000) w.schild = Math.min(w.schildMax, w.schild + w.schildMax * 0.2 * dt * (this.sonder.has("schnellladen") ? 2 : 1));
  };

  K.besiegt = function(){ return this.werte.lp <= 0; };

  K.wiederbeleben = function(startpunkt){
    var w = this.werte; w.lp = w.lpMax; w.schild = w.schildMax;
    // Freie Stelle über dem Startpunkt suchen (dort kann inzwischen gebaut worden sein)
    var p = startpunkt.slice(), welt = this.welt, y = Math.floor(p[1]);
    function fest(yy){ var b = SC.BLOECKE[welt.holeBlock(p[0], yy, p[2])]; return b && b.fest; }
    while(y < 126 && (fest(y) || fest(y + 1))) y++;
    p[1] = y;
    this.spieler.pos = p; this.spieler.geschw = [0, 0, 0];
    this.zuletztGetroffen = -1e9; this.letzterTreffer = null; this.hitze = 0; this.ueberhitztBis = 0;
    this.welt.wesen.forEach(function(e){ if(e.art === "gegner") e.bemerkt = false; });
  };

  // Bauwerk zu einer Kiste finden (für Stufe und Ort der Beute)
  SC.Kampf.bauwerkZuKiste = function(w, x, y, z){
    var l = SC.Bauwerke.imChunk(w.planet, x >> 4, z >> 4);
    for(var i = 0; i < l.length; i++) if(l[i].plaetze.some(function(q){ return q.typ === "kiste" && q.x === x && q.y === y && q.z === z; })) return l[i];
    return null;
  };

  SC.Kampf.oeffneKiste = function(welt, kampf, x, y, z, bauwerk, zf){
    if(welt.holeBlock(x, y, z) !== SC.B.KISTE) return [];
    var n = 2 + Math.floor(zf() * 3), aus = [], bonus = (SC.SCHWIERIGKEIT[kampf.daten.schwierigkeit] || {}).seltenheitBonus || 0;
    for(var i = 0; i < n; i++) aus.push(SC.Beute.erzeuge(zf, { stufe: (bauwerk && bauwerk.stufe) || kampf.werte.stufe, ort: bauwerk && bauwerk.typ, mindest: 1, bonus: bonus }));
    welt.setzeBlock(x, y, z, SC.B.KISTE_OFFEN, "spieler");
    var pl = kampf.daten.planeten[welt.planet.id]; (pl.kisten || (pl.kisten = {}))[welt.planet.wickel(x) + "," + y + "," + welt.planet.wickel(z)] = true;
    return aus;
  };
})();
