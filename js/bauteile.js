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
  // Inhalt aufgestellter Truhen (Stufe 6a): daten.planeten[planet].truhen["x,y,z"] = 18 Plätze im Rucksack-Format. Das Feld entsteht erst bei Bedarf,
  // alte Spielstände brauchen deshalb keine Umstellung. Maßgeblich ist immer der Einzelspieler bzw. der Gastgeber.
  SC.Truhen = {
    PLAETZE: 18,
    von: function(daten, planet){
      var pl = daten.planeten[planet.id];
      function schluessel(x, y, z){ return planet.wickel(x) + "," + Math.floor(y) + "," + planet.wickel(z); }
      function laden(x, y, z){ return new SC.Rucksack(pl.truhen && pl.truhen[schluessel(x, y, z)], SC.Truhen.PLAETZE); }
      function speichern(x, y, z, rs){ (pl.truhen || (pl.truhen = {}))[schluessel(x, y, z)] = rs.alsDaten(); }
      return {
        inhalt: function(x, y, z){ return laden(x, y, z).alsDaten(); },
        // Legt die Sache hinein → was nicht mehr passt (0 = alles, bei Gegenständen 0 oder 1)
        lege: function(x, y, z, sache){ var rs = laden(x, y, z), rest = rs.lege(sache); speichern(x, y, z, rs); return rest; },
        // Nimmt den ganzen Platz heraus → Sache oder null
        nimm: function(x, y, z, platz){ var rs = laden(x, y, z), s = rs.nimm(platz); if(s) speichern(x, y, z, rs); return s; },
        // Leert die Truhe (abgebaut) → Liste der Sachen
        leeren: function(x, y, z){
          var k = schluessel(x, y, z), d = pl.truhen && pl.truhen[k]; if(!d) return [];
          delete pl.truhen[k]; return d.filter(function(s){ return !!s; });
        }
      };
    }
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
