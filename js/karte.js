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
    var k = String(planet.seed), z = (Array.isArray(erkundet.__zuletzt) ? erkundet.__zuletzt : Object.keys(erkundet)).filter(function(s){ return s !== k && s !== "__zuletzt" && erkundet[s] !== undefined; });
    Object.keys(erkundet).forEach(function(s){ if(s !== k && s !== "__zuletzt" && z.indexOf(s) < 0) z.unshift(s); });   // Schlüssel ohne Eintrag in __zuletzt (altes oder kaputtes Feld) gelten als die ältesten
    erkundet[k] = SC.Karte.kodiere(bits); z.push(k);
    while(z.length > MAX) delete erkundet[z.shift()];   // der am längsten nicht besuchte Planet fliegt raus
    erkundet.__zuletzt = z;
  };
})();
(function(){
  var MEER = function(){ return SC.MEER; };
  SC.Karte.UNERKUNDET = [18, 20, 30];
  function hex(c){ var n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function pal(planet, name, fallback){ var P = SC.PALETTEN[planet.palette] || SC.PALETTEN.start, t = P && P.texturen && P.texturen[name]; return hex(t ? t[0] : fallback); }
  function mul(c, f){ return [Math.max(0, Math.min(255, Math.round(c[0] * f))), Math.max(0, Math.min(255, Math.round(c[1] * f))), Math.max(0, Math.min(255, Math.round(c[2] * f)))]; }
  function mix(a, b, t){ return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)]; }
  // Farbe des Felds (fx, fz) aus der Landschaft in der Feldmitte: Biom und Höhe, nichts wird gespeichert (gebaute Dinge erscheinen deshalb nicht)
  SC.Karte.farbe = function(gen, planet, fx, fz){
    var x = fx * SC.Karte.FELD + SC.Karte.FELD / 2, z = fz * SC.Karte.FELD + SC.Karte.FELD / 2, h = gen.hoehe(x, z), b = gen.biom(x, z), meer = MEER();
    var licht = 0.78 + 0.42 * Math.max(0, Math.min(1, (h - meer) / 50));
    if(b === "lavasee") return mul([232, 92, 24], 0.85 + 0.3 * Math.max(0, Math.min(1, (h - meer + 8) / 8)));
    if(h <= meer){ var tief = Math.max(0, Math.min(1, (meer - h) / 24)); return mul(pal(planet, "wasser", "#2f7fd8"), 1.1 - 0.5 * tief); }
    var c;
    if(b === "wueste" || b === "strand") c = pal(planet, "sand", "#e3cf8a");
    else if(b === "berge") c = mix(pal(planet, "stein", "#8c8f96"), [255, 255, 255], Math.max(0, Math.min(0.5, (h - 82) / 60)));
    else if(b === "schneefeld") c = pal(planet, "schnee_oben", "#f4f8ff");
    else if(b === "vulkan") c = pal(planet, "grundgestein", "#3e3f45");
    else if(b === "kristallfeld") c = pal(planet, "kristall", "#ff6fd8");
    else if(b === "wald" || b === "dschungel") c = pal(planet, "blaetter", "#3f9a35");
    else if(b === "sumpf") c = mix(pal(planet, "gras_oben", "#5cb83a"), pal(planet, "erde", "#8a5a33"), 0.55);
    else c = pal(planet, "gras_oben", "#5cb83a");
    return mul(c, licht);
  };
})();
