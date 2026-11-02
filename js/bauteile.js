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
})();
