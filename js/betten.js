// Betten (Minecraft-Mechanik): rechter Klick setzt den Wiedereinstieg und lässt nachts schlafen, wenn keine Gegner in der Nähe sind.
// Im Mehrspiel überspringt die Nacht erst, wenn alle Mitspieler schlafen (Zuschauer zählen nicht). Ergänzt SC.Spiel.
(function(){
  var S = SC.Spiel.prototype;
  var NACHT = 0.55;       // Tageslicht unter diesem Wert ist Nacht (wie in js/auftauchen.js)
  var MORGEN = 0.27;      // Tageszeit am Morgen (wie der Knopf „Morgen“ der Entwicklerwerkzeuge)
  var SCHLAF_ZEIT = 3;    // so lange liegt man mindestens im Bett, bevor die Nacht vergeht (Sekunden)
  var RADIUS = 8, HOEHE = 5;   // Gegner in diesem Umkreis des Betts verhindern das Schlafen (waagerecht, senkrecht)

  function sperre(e){
    return Object.assign({}, e, { vor: false, zurueck: false, links: false, rechts: false, springen: false, springenNeu: false, sinken: false, sprint: false,
      abbauen: false, abbauenGehalten: false, setzen: false, setzenGehalten: false, blockauswahl: false, benutzen: false, platz: false, ausweichen: false, blickDx: 0, blickDy: 0 });
  }
  S._tageslicht = function(){ return SC.himmelsFarben(SC.PALETTEN[this.welt.planet.palette] || SC.PALETTEN.start, this.tageszeit).tageslicht; };
  S._gegnerBeiBett = function(x, y, z){
    var w = this.welt, P = w.planet.groesse, gefunden = false;
    w.wesen.forEach(function(e){
      if(e.art !== "gegner") return;
      var dx = SC.mod(e.pos[0] - (x + 0.5) + P / 2, P) - P / 2, dz = SC.mod(e.pos[2] - (z + 0.5) + P / 2, P) - P / 2;
      if(Math.hypot(dx, dz) <= RADIUS && Math.abs(e.pos[1] - (y + 0.5)) <= HOEHE) gefunden = true;
    });
    return gefunden;
  };
  // Bett angeklickt (Fuß oder Kopf): Wiedereinstieg am Kopfende merken; nachts und ohne Gegner in der Nähe hinlegen
  S.bettBenutzen = function(ziel){
    var sp = this.spieler, w = this.welt, T = SC.T, id = w.holeBlock(ziel.x, ziel.y, ziel.z);
    var kopf = SC.Bauteile.istBettKopf(id) ? { x: ziel.x, z: ziel.z } : SC.Bauteile.bettPartner(id, ziel.x, ziel.z);
    var neu = { planet: w.planet.id, x: kopf.x, y: ziel.y, z: kopf.z }, alt = this.daten.spieler.bett;
    if(!alt || JSON.stringify(alt) !== JSON.stringify(neu)){ this.daten.spieler.bett = neu; this.ui.hinweis(T.bettGesetzt, 2500); }
    if(sp.modus === "zuschauer" || sp.schlaeft) return;
    if(this._tageslicht() >= NACHT){ this.ui.hinweis(T.nurNachts, 2500); return; }
    if(this._gegnerBeiBett(kopf.x, ziel.y, kopf.z)){ this.ui.hinweis(T.monsterNah, 3000); return; }
    this._einschlafen({ x: kopf.x, y: ziel.y, z: kopf.z });
  };
  S._einschlafen = function(kopf){
    var sp = this.spieler;
    sp.schlaeft = { kopf: kopf, t: 0, treffer0: this.kampf.zuletztGetroffen };
    sp.pos = [kopf.x + 0.5, kopf.y + 0.56, kopf.z + 0.5]; sp.geschw = [0, 0, 0]; sp.blick[1] = 0.9;
    this.ui.schlafBild(0.01, SC.T.schlafZzz);
  };
  S._aufwachen = function(morgen){
    var sp = this.spieler; sp.schlaeft = null; sp.blick[1] = 0;
    this.ui.schlafBild(0, "");
    if(morgen) this.ui.hinweis(SC.T.guterMorgen, 2500);
  };
  // Alle, die mitzählen, liegen im Bett? Einzelspieler und Gastgeber entscheiden selbst; ein Gast wartet auf die Zeit des Gastgebers
  S._alleSchlafen = function(){
    var r = this.raum; if(r instanceof SC.Gast) return false;
    if(r instanceof SC.Gastgeber) return r.spieler.every(function(e){ return !e.verbunden || e.modus === "zuschauer" || !!e.schlaeft; });
    return true;
  };
  // Jedes Bild aufrufen (mit der Eingabe e): sperrt Bewegung und Blick im Bett, blendet ab, lässt die Nacht vergehen und weckt bei Bewegung, Treffer, Tag oder fehlendem Bett
  S._schlafen = function(e, dt){
    var sp = this.spieler, z = sp.schlaeft; if(!z) return e;
    var bett = this.welt.holeBlock(z.kopf.x, z.kopf.y, z.kopf.z), tag = this._tageslicht() >= NACHT;
    var bewegt = e.vor || e.zurueck || e.links || e.rechts || e.springen || e.sinken;
    if(sp.modus === "zuschauer" || !SC.Bauteile.istBett(bett) || bewegt || this.kampf.zuletztGetroffen !== z.treffer0 || tag){ this._aufwachen(tag); return sperre(e); }
    z.t += dt;
    var text = SC.T.schlafZzz;
    if(z.t >= SCHLAF_ZEIT){
      if(this._alleSchlafen()){ this.tageszeit = MORGEN; this._aufwachen(true); return sperre(e); }
      text = SC.T.schlafWarte;
    }
    this.ui.schlafBild(Math.min(1, z.t / 2), text);
    return sperre(e);
  };
})();
