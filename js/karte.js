// Karten (#169): Erkundungsraster (ein Bit je 8 × 8-Feld), Kodierung für den Spielstand und die Farbe eines Felds. Reine Funktionen.
SC.Karte = {};
(function(){
  var FELD = 8, MAX = 6;
  SC.Karte.FELD = FELD; SC.Karte.MAX_PLANETEN = MAX;
  function seite(groesse){ return Math.floor(groesse / FELD); }
  function mod(a, n){ return ((a % n) + n) % n; }
  SC.Karte.neu = function(groesse){ var n = seite(groesse); return new Uint8Array(Math.ceil(n * n / 8)); };
  SC.Karte.feldVon = function(groesse, x, z){ var n = seite(groesse); return { fx: mod(Math.floor(x / FELD), n), fz: mod(Math.floor(z / FELD), n) }; };
  SC.Karte.istErkundet = function(bits, groesse, fx, fz){ var n = seite(groesse), i = mod(fz, n) * n + mod(fx, n); return !!(bits[i >> 3] >> (i & 7) & 1); };
  // Alle Felder, deren Mitte höchstens radius Blöcke von pos entfernt liegt, als erkundet markieren (um den Ring herum) → true, wenn etwas neu ist
  SC.Karte.markiere = function(bits, groesse, pos, radius){
    var n = seite(groesse), geaendert = false, P = groesse, r = radius, f0 = Math.floor((pos[0] - r) / FELD), f1 = Math.floor((pos[0] + r) / FELD), g0 = Math.floor((pos[2] - r) / FELD), g1 = Math.floor((pos[2] + r) / FELD);
    for(var gz = g0; gz <= g1; gz++) for(var gx = f0; gx <= f1; gx++){
      var dx = gx * FELD + FELD / 2 - pos[0], dz = gz * FELD + FELD / 2 - pos[2];
      if(Math.hypot(dx, dz) > r) continue;
      var i = mod(gz, n) * n + mod(gx, n), m = 1 << (i & 7);
      if(!(bits[i >> 3] & m)){ bits[i >> 3] |= m; geaendert = true; }
    }
    return geaendert;
  };
  SC.Karte.kodiere = function(bits){
    var s = ""; for(var i = 0; i < bits.length; i += 4096) s += String.fromCharCode.apply(null, bits.subarray(i, Math.min(i + 4096, bits.length)));
    return btoa(s);
  };
  // Ungültige oder falsch lange Daten ergeben eine leere Karte
  SC.Karte.dekodiere = function(text, groesse){
    var leer = SC.Karte.neu(groesse); if(typeof text !== "string" || !text) return leer;
    try { var s = atob(text); if(s.length !== leer.length) return leer; for(var i = 0; i < s.length; i++) leer[i] = s.charCodeAt(i); return leer; } catch(e){ return SC.Karte.neu(groesse); }
  };
  // erkundet: { [planet.seed]: base64, __zuletzt: [seed, …] } (Figurfeld); die Karte reist so mit der Figur
  SC.Karte.fuerPlanet = function(erkundet, planet){ return SC.Karte.dekodiere(erkundet[String(planet.seed)], planet.groesse); };
  SC.Karte.speichereFuerPlanet = function(erkundet, planet, bits){
    var k = String(planet.seed), z = Array.isArray(erkundet.__zuletzt) ? erkundet.__zuletzt.filter(function(s){ return s !== k && erkundet[s] !== undefined; }) : [];
    erkundet[k] = SC.Karte.kodiere(bits); z.push(k);
    while(z.length > MAX) delete erkundet[z.shift()];   // der am längsten nicht besuchte Planet fliegt raus
    erkundet.__zuletzt = z;
  };
})();
