// Gamepad (Standard-Belegung, z. B. Xbox-, PlayStation- und MFi-Controller am iPad):
// linker Stick laufen, rechter Stick umsehen, A springen, B sinken, RT abbauen, LT setzen,
// LB/RB Schnellleiste, X Blockauswahl, Y Ansicht, Start Menü, Select Entwicklerwerkzeuge, L3 rennen.
// In Menüs: Steuerkreuz/Stick wählen, A bestätigen, B zurück.
SC.Gamepad = {};
(function(){
  var TOT = 0.25, BLICK = 2.6;
  var K = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, SELECT: 8, START: 9, L3: 10, HOCH: 12, RUNTER: 13, LINKS: 14, RECHTS: 15 };
  SC.Gamepad.K = K;

  SC.Gamepad.neuerZustand = function(){ return { vorher: [], menueAchse: 0, menueZeit: 0 }; };
  function gedrueckt(p, i){ var b = p.buttons[i]; return !!b && (b.pressed || b.value > 0.5); }
  function achse(v){ return Math.abs(v || 0) < TOT ? 0 : v; }

  // Ein Pad-Zustand → Bewegung, Blickänderung und Einmal-Aktionen (Kanten gegenüber dem letzten Aufruf)
  SC.Gamepad.zuEingabe = function(p, z, dt){
    var ax = p.axes || [], neu = function(i){ return gedrueckt(p, i) && !z.vorher[i]; };
    var lx = achse(ax[0]), ly = achse(ax[1]), rx = achse(ax[2]), ry = achse(ax[3]);
    var e = {
      vor: ly < 0, zurueck: ly > 0, links: lx < 0, rechts: lx > 0,
      springen: gedrueckt(p, K.A), sinken: gedrueckt(p, K.B), sprint: gedrueckt(p, K.L3),
      // Quadratische Kurve: feines Zielen bei kleinem Ausschlag
      blickDx: -rx * Math.abs(rx) * BLICK * dt, blickDy: -ry * Math.abs(ry) * BLICK * dt,
      einmal: {
        springenNeu: neu(K.A), abbauen: neu(K.RT), setzen: neu(K.LT), blockauswahl: neu(K.X), ansicht: neu(K.Y),
        menue: neu(K.START), entwickler: neu(K.SELECT), ausweichen: neu(K.B), benutzen: neu(K.HOCH), ziel: neu(K.RECHTS) || neu(K.LB), sprung: neu(K.LINKS) || neu(K.RB), /* im All; am Boden blättern dieselben Knöpfe die Leiste */ platz: neu(K.RUNTER),
        auswahlRad: neu(K.RB) || neu(K.RECHTS) ? 1 : neu(K.LB) || neu(K.LINKS) ? -1 : 0
      },
      gehalten: { abbauen: gedrueckt(p, K.RT), setzen: gedrueckt(p, K.LT) }
    };
    for(var i = 0; i < p.buttons.length; i++) z.vorher[i] = gedrueckt(p, i);
    return e;
  };

  // Menüsteuerung: liefert -1/1 (Auswahl), "ok", "zurueck" oder null; Stick wiederholt beim Halten
  SC.Gamepad.zuMenue = function(p, z, jetzt){
    var neu = function(i){ return gedrueckt(p, i) && !z.vorher[i]; }, r = null;
    if(neu(K.A)) r = "ok";
    else if(neu(K.B) || neu(K.START)) r = "zurueck";
    else if(neu(K.HOCH) || neu(K.LINKS)) r = -1;
    else if(neu(K.RUNTER) || neu(K.RECHTS)) r = 1;
    else {
      var v = achse((p.axes || [])[1]) || achse((p.axes || [])[0]), s = v > 0 ? 1 : v < 0 ? -1 : 0;
      if(s && (s !== z.menueAchse || jetzt - z.menueZeit > 300)){ r = s; z.menueZeit = jetzt; }
      z.menueAchse = s;
    }
    for(var i = 0; i < p.buttons.length; i++) z.vorher[i] = gedrueckt(p, i);
    return r;
  };

  // Aktuell gedrückte Tasten als "schon gedrückt" merken (beim Wechsel zwischen Spiel und Menü)
  SC.Gamepad.vorbereiten = function(p, z){ for(var i = 0; i < p.buttons.length; i++) z.vorher[i] = gedrueckt(p, i); };

  SC.Gamepad.erstes = function(){
    if(!navigator.getGamepads) return null;
    var l = navigator.getGamepads();
    for(var i = 0; i < l.length; i++) if(l[i] && l[i].connected) return l[i];
    return null;
  };
})();

// Controller-Hilfe am Bildrand: Tasten mit Symbol und Text je nach Lage → [{taste, symbol, text}]
// k: { all, zuschauerImAll, fahrzeug: {fahrer, geschuetz}, fahrzeugNah, survival, waffe, schwert }
SC.controllerHilfe = function(k){
  var T = SC.T.steuerHilfe, l = [];
  function z(taste, symbol, text){ l.push({ taste: taste, symbol: symbol, text: text }); }
  if(k.zuschauerImAll){ z("☰", "☰", T.menue); return l; }
  if(k.all){
    z("RT", "💥", T.laser); z("LB", "🎯", T.ziel); z("RB", "⚡", T.sprung);
    z("A", "⤒", T.naseHoch); z("B", "⤓", T.naseRunter); z("☰", "☰", T.menue);
    return l;
  }
  if(k.fahrzeug){
    if(k.fahrzeug.fahrer && k.fahrzeug.geschuetz && k.survival) z("RT", "💥", T.schiessen);
    else if(!k.fahrzeug.fahrer && k.survival && k.waffe) z("RT", "⚔", T.angreifen);
    z("▲", "🚗", T.aussteigen); z("▼", "💺", T.platz); z("Y", "👁", T.ansicht); z("☰", "☰", T.menue);
    return l;
  }
  z("A", "⤒", T.springen); z("B", "⇆", k.survival ? T.ausweichen : T.runter);
  z("RT", k.survival && k.waffe ? "⚔" : "⛏", k.survival && k.waffe ? T.angreifen : T.abbauen);
  z("LT", k.schwert ? "🛡" : "■", k.schwert ? T.blocken : T.setzen);
  z("X", "▦", k.survival ? T.rucksack : T.bloecke); z("Y", "👁", T.ansicht); z("LB", "◀▶", T.leiste);
  if(k.fahrzeugNah) z("▲", "🚗", T.einsteigen);
  z("☰", "☰", T.menue);
  return l;
};
