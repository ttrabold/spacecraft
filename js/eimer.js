// Eimer (Spec 2026-11-08-fliessen-design.md): Wasser und Lava aus einer Quelle schöpfen und als Quelle wieder ausgießen
SC.Eimer = {};
(function(){
  var B = SC.B, F = SC.Fluessig;
  SC.Eimer.voll = function(art){ return art === "lava" ? B.EIMER_LAVA : B.EIMER_WASSER; };
  SC.Eimer.art = function(id){ return id === B.EIMER_WASSER ? "wasser" : id === B.EIMER_LAVA ? "lava" : null; };
  SC.Eimer.istEimer = function(id){ return id === B.EIMER || id === B.EIMER_WASSER || id === B.EIMER_LAVA; };
  // Schöpfen geht nur an einer Quelle (aus fließendem Wasser käme sonst Wasser aus dem Nichts)
  SC.Eimer.schoepfen = function(welt, x, y, z){
    var id = welt.holeBlock(x, y, z); if(!F.quelle(id)) return null;
    return welt.setzeBlock(x, y, z, B.LUFT, "spieler") ? F.art(id) : null;
  };
  // Belegt ein Wesen (Tier, Gegner) oder ein Fahrzeug die Zelle? Dort wird nicht ausgegossen.
  // andere (optional): Positionen der Mitspieler [[x, y, z], …] – auch auf sie wird nicht gegossen
  function belegt(welt, x, y, z, andere){
    var P = welt.planet.groesse, frei = true;
    function nah(p, r, h){ var dx = SC.mod(x + 0.5 - p[0] + P / 2, P) - P / 2, dz = SC.mod(z + 0.5 - p[2] + P / 2, P) - P / 2; return Math.abs(dx) < 0.5 + r && Math.abs(dz) < 0.5 + r && y < p[1] + h && y + 1 > p[1]; }
    welt.wesen.forEach(function(e){ if((e.art === "tier" || e.art === "gegner") && nah(e.pos, (e.breite || 0.6) / 2, e.hoehe || 1)) frei = false; });
    (andere || []).forEach(function(p){ if(p && nah(p, 0.3, 1.8)) frei = false; });
    if(welt.fahrzeuge) welt.fahrzeuge.forEach(function(f){ if(!f.weg && nah(f.pos, 1.5, 2)) frei = false; });
    return !frei;
  }
  // Ausgießen: wie Bauen (nicht in Spieler, Mitspieler, Tiere, Gegner oder Fahrzeuge), die Quelle fließt von dort los
  SC.Eimer.ausgiessen = function(welt, spieler, x, y, z, art, andere){
    if(!SC.kannSetzen(welt, spieler, x, y, z, B.STEIN) || belegt(welt, x, y, z, andere)) return false;
    return welt.setzeBlock(x, y, z, F.id(art, F.MAX[art], false), "spieler");
  };
})();
