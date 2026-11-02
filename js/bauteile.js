// Bauteile (Stufe 6a): Richtung beim Aufstellen (Leiter nach der Wand, Tür nach dem Blick) und Türen umschalten.
// Zustände stecken in eigenen Block-IDs, deshalb brauchen Speichern und Mehrspieler nichts Neues.
SC.Bauteile = {};
(function(){
  var B = SC.B, LEITERN = [B.LEITER_N, B.LEITER_S, B.LEITER_O, B.LEITER_W];
  // Welche Block-ID kommt in die Zelle vor dem getroffenen Block (ziel mit Normale nx, ny, nz)? 0 = hier nicht aufstellbar.
  // blick: Blickrichtung des Spielers [x, y, z]
  SC.Bauteile.aufstellId = function(welt, id, ziel, blick){
    if(id === B.LEITER_N){
      var treffer = welt.holeBlock(ziel.x, ziel.y, ziel.z);
      if(ziel.ny !== 0) return LEITERN.indexOf(treffer) >= 0 && ziel.ny > 0 ? treffer : 0;    // nur nach oben verlängern
      var d = SC.BLOECKE[treffer]; if(!d.fest || d.durchsichtig && d.form !== "wuerfel") return 0;
      // Die Wand liegt auf der Seite des getroffenen Blocks, also gegen die Normale
      return ziel.nz > 0 ? B.LEITER_N : ziel.nz < 0 ? B.LEITER_S : ziel.nx > 0 ? B.LEITER_W : B.LEITER_O;
    }
    if(id === B.TUER_X) return Math.abs(blick[0]) >= Math.abs(blick[2]) ? B.TUER_X : B.TUER_Z;
    return id;
  };
  var TUER = {}; TUER[B.TUER_X] = B.TUER_X_OFFEN; TUER[B.TUER_X_OFFEN] = B.TUER_X; TUER[B.TUER_Z] = B.TUER_Z_OFFEN; TUER[B.TUER_Z_OFFEN] = B.TUER_Z;
  SC.Bauteile.istTuer = function(id){ return TUER[id] !== undefined; };
  // Tür auf/zu. spieler: Liste von Figuren mit pos; beim Schließen darf niemand in der Tür stehen. → true, wenn sich etwas geändert hat.
  // Der Wechsel läuft über setzeBlock("spieler"), damit Mehrspieler ihn wie jede Blockänderung überträgt.
  SC.Bauteile.tuerUmschalten = function(welt, x, y, z, spieler){
    var id = welt.holeBlock(x, y, z), neu = TUER[id]; if(neu === undefined) return false;
    var schliesst = neu === B.TUER_X || neu === B.TUER_Z, P = welt.planet.groesse;
    if(schliesst && (spieler || []).some(function(s){
      var dx = SC.mod(x + 0.5 - s.pos[0] + P / 2, P) - P / 2, dz = SC.mod(z + 0.5 - s.pos[2] + P / 2, P) - P / 2;
      return Math.abs(dx) < 0.5 + SC.PHYSIK.breite / 2 && Math.abs(dz) < 0.5 + SC.PHYSIK.breite / 2 && y < s.pos[1] + SC.PHYSIK.hoehe && y + 1 > s.pos[1];
    })) return false;
    return welt.setzeBlock(x, y, z, neu, "spieler");
  };
})();
