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
  // Wiedereinstieg am Bett: freie Stelle neben dem gemerkten Bett (Kopfende) → Position oder null (Startpunkt). Fehlt das Bett, wird es vergessen;
  // ist es nur zugebaut, bleibt es gemerkt. Betten auf anderen Planeten gelten dort, hier bleiben sie unberührt.
  S.bettPunkt = function(){
    var b = this.daten.spieler.bett, w = this.welt, T = SC.T; if(!b || b.planet !== w.planet.id) return null;
    var id = w.holeBlock(b.x, b.y, b.z);
    if(!SC.Bauteile.istBettKopf(id)){ this.daten.spieler.bett = null; this.ui.hinweis(T.bettFehlte, 4000); return null; }
    var fuss = SC.Bauteile.bettPartner(id, b.x, b.z);
    function frei(x, y, z){ var f = SC.BLOECKE[w.holeBlock(x, y, z)], k = SC.BLOECKE[w.holeBlock(x, y + 1, z)], u = w.holeBlock(x, y - 1, z); return !f.fest && !k.fest && !SC.Fluessig.art(w.holeBlock(x, y, z)) && SC.BLOECKE[u].fest && !SC.Fluessig.istLava(u); }
    var zellen = [[b.x, b.z], [fuss.x, fuss.z]];
    for(var i = 0; i < zellen.length; i++) for(var dx = -1; dx <= 1; dx++) for(var dz = -1; dz <= 1; dz++){
      if(!dx && !dz) continue;
      var x = zellen[i][0] + dx, z = zellen[i][1] + dz;
      if(SC.Bauteile.istBett(w.holeBlock(x, b.y, z))) continue;
      if(frei(x, b.y, z)) return [w.planet.wickel(x) + 0.5, b.y, w.planet.wickel(z) + 0.5];
    }
    this.ui.hinweis(T.bettBlockiert, 4000); return null;
  };
  // Steht das Bett b (aus daten.spieler.bett) auf seinem Planeten noch? Prüft eine kurz geladene Kopie des Planeten.
  S._bettDa = function(b){
    var pd = this.daten.planeten[b.planet]; if(!pd) return false;
    var w = new SC.Welt(new SC.Planet(pd), SC.Spielstand.chunksLaden(pd));
    return SC.Bauteile.istBettKopf(w.holeBlock(b.x, b.y, b.z));
  };
  // Nach dem Besiegtwerden: am Bett wieder einsteigen, auch von einem anderen Planeten aus (dorthin wechseln). → Versprechen
  // Ausnahmen: Gäste (die Welt gehört dem Gastgeber) und ein Gastgeber mit Gästen (ein Tod soll nicht alle auf einen anderen Planeten bringen) bleiben auf dem Planeten.
  S._wiederEinstieg = function(){
    var s = this, k = this.kampf, b = this.daten.spieler.bett, w = this.welt;
    function hier(){ k.wiederbeleben(s.bettPunkt() || s.landepunkt() || SC.Spiel.startpunkt(w.planet)); return Promise.resolve(); }
    var gaeste = this.raum instanceof SC.Gastgeber && this.raum.spieler.some(function(e){ return e.verbunden; });
    if(!b || b.planet === w.planet.id || this.rolle === "gast" || gaeste || !SC.PLANETEN[b.planet]) return hier();
    if(!this._bettDa(b)){ this.daten.spieler.bett = null; this.ui.hinweis(SC.T.bettFehlte, 4000); return hier(); }
    k.wiederbeleben(this.spieler.pos.slice());   // erst wiederbeleben, sonst wäre der Spieler nach dem Wechsel noch besiegt
    return this.wechslePlanet(b.planet, { bett: true }).catch(function(){ /* Wechsel nicht möglich: hier weiterspielen */ });
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
