// Bauteile (Stufe 6a): Richtung beim Aufstellen (Leiter nach der Wand, Tür nach dem Blick) und Türen umschalten.
// Zustände stecken in eigenen Block-IDs, deshalb brauchen Speichern und Mehrspieler nichts Neues.
SC.Bauteile = {};
(function(){
  var B = SC.B, LEITERN = [B.LEITER_N, B.LEITER_S, B.LEITER_O, B.LEITER_W];
  // Welche Block-ID kommt in die Zelle vor dem getroffenen Block (ziel mit Normale nx, ny, nz)? 0 = hier nicht aufstellbar.
  // blick: Blickrichtung des Spielers [x, y, z]
  SC.Bauteile.aufstellId = function(welt, id, ziel, blick){
    if(SC.BLOECKE[id] && SC.BLOECKE[id].nichtAufstellbar) return 0;   // Netz und Tierfutter bleiben in der Hand
    if(id === B.LEITER_N){
      var treffer = welt.holeBlock(ziel.x, ziel.y, ziel.z);
      if(ziel.ny !== 0) return LEITERN.indexOf(treffer) >= 0 && ziel.ny > 0 ? treffer : 0;    // nur nach oben verlängern
      var d = SC.BLOECKE[treffer]; if(!d.fest || d.durchsichtig && d.form !== "wuerfel") return 0;
      // Die Wand liegt auf der Seite des getroffenen Blocks, also gegen die Normale
      return ziel.nz > 0 ? B.LEITER_N : ziel.nz < 0 ? B.LEITER_S : ziel.nx > 0 ? B.LEITER_W : B.LEITER_O;
    }
    if(id === B.TUER_X) return Math.abs(blick[0]) >= Math.abs(blick[2]) ? B.TUER_X : B.TUER_Z;
    // Bett: Das Kopfende liegt in Blickrichtung vor dem Fußende
    if(id === B.BETT_FUSS_N) return Math.abs(blick[0]) >= Math.abs(blick[2]) ? (blick[0] > 0 ? B.BETT_FUSS_O : B.BETT_FUSS_W) : (blick[2] > 0 ? B.BETT_FUSS_S : B.BETT_FUSS_N);
    return id;
  };
  // Bett: Fußende → { dx, dz, id } des Kopfendes; Kopfende → Richtung zurück zum Fuß
  var KOPF = {}; KOPF[B.BETT_FUSS_N] = { dx: 0, dz: -1, id: B.BETT_KOPF_N }; KOPF[B.BETT_FUSS_S] = { dx: 0, dz: 1, id: B.BETT_KOPF_S }; KOPF[B.BETT_FUSS_O] = { dx: 1, dz: 0, id: B.BETT_KOPF_O }; KOPF[B.BETT_FUSS_W] = { dx: -1, dz: 0, id: B.BETT_KOPF_W };
  var FUSS = {}; for(var fid in KOPF) FUSS[KOPF[fid].id] = { dx: -KOPF[fid].dx, dz: -KOPF[fid].dz, id: +fid };
  SC.Bauteile.istBettFuss = function(id){ return KOPF[id] !== undefined; };
  SC.Bauteile.istBettKopf = function(id){ return FUSS[id] !== undefined; };
  SC.Bauteile.istBett = function(id){ return KOPF[id] !== undefined || FUSS[id] !== undefined; };
  // Die andere Hälfte eines Betts an der Stelle (x, z) → { x, z, id } der erwarteten Nachbarzelle (id = dort erwarteter Blocktyp) oder null
  SC.Bauteile.bettPartner = function(id, x, z){
    var k = KOPF[id] || FUSS[id]; return k ? { x: x + k.dx, z: z + k.dz, id: k.id } : null;
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

  // Türen sind zwei Blöcke hoch: unten TUER_*, oben TUER_*_OBEN (eigene IDs, damit man darunter hindurchgehen und Abbauen/Speichern/Mehrspieler unverändert bleiben).
  // Alte Einzeltüren ohne Oberteil funktionieren weiter.
  var TUER = {}, OBEN = {}, UNTEN = {};   // TUER: Gegenstück offen/zu; OBEN: unten → oben; UNTEN: oben → unten
  [[B.TUER_X, B.TUER_X_OFFEN, B.TUER_X_OBEN, B.TUER_X_OFFEN_OBEN], [B.TUER_Z, B.TUER_Z_OFFEN, B.TUER_Z_OBEN, B.TUER_Z_OFFEN_OBEN]].forEach(function(t){
    TUER[t[0]] = t[1]; TUER[t[1]] = t[0]; TUER[t[2]] = t[3]; TUER[t[3]] = t[2];
    OBEN[t[0]] = t[2]; OBEN[t[1]] = t[3]; UNTEN[t[2]] = t[0]; UNTEN[t[3]] = t[1];
  });
  SC.Bauteile.istTuer = function(id){ return TUER[id] !== undefined; };
  SC.Bauteile.istTuerOben = function(id){ return UNTEN[id] !== undefined; };
  // Das Gegenstück einer Türhälfte: Block-Zelle { y, id } über oder unter (y), wenn dort die passende Hälfte steht, sonst null
  SC.Bauteile.tuerPartner = function(welt, x, y, z){
    var id = welt.holeBlock(x, y, z);
    if(OBEN[id] !== undefined){ var o = welt.holeBlock(x, y + 1, z); return UNTEN[o] !== undefined ? { y: y + 1, id: o } : null; }
    if(UNTEN[id] !== undefined){ var u = welt.holeBlock(x, y - 1, z); return OBEN[u] !== undefined ? { y: y - 1, id: u } : null; }
    return null;
  };
  // Block setzen; Türen belegen zwei Blöcke und brauchen beide Zellen frei (und keinen Spieler darin). → true, wenn gesetzt
  SC.Bauteile.setze = function(welt, spieler, x, y, z, id){
    var oben = OBEN[id], kopf = KOPF[id];
    if(!SC.kannSetzen(welt, spieler, x, y, z, id)) return false;
    if(oben !== undefined && !SC.kannSetzen(welt, spieler, x, y + 1, z, oben)) return false;
    if(kopf){
      // Bett: Kopfzelle frei, unter beiden Hälften fester Boden
      var kx = x + kopf.dx, kz = z + kopf.dz;
      if(!SC.kannSetzen(welt, spieler, kx, y, kz, kopf.id)) return false;
      if(!SC.BLOECKE[welt.holeBlock(x, y - 1, z)].fest || !SC.BLOECKE[welt.holeBlock(kx, y - 1, kz)].fest) return false;
    }
    if(!welt.setzeBlock(x, y, z, id, "spieler")) return false;
    if(oben !== undefined) welt.setzeBlock(x, y + 1, z, oben, "spieler");
    if(kopf) welt.setzeBlock(x + kopf.dx, y, z + kopf.dz, kopf.id, "spieler");
    return true;
  };
  // Tür auf/zu, von beiden Hälften aus. spieler: Liste von Figuren mit pos; beim Schließen darf niemand in einer der beiden Zellen stehen.
  // → true, wenn sich etwas geändert hat. Der Wechsel läuft über setzeBlock("spieler"), damit Mehrspieler ihn wie jede Blockänderung überträgt.
  SC.Bauteile.tuerUmschalten = function(welt, x, y, z, spieler){
    var id = welt.holeBlock(x, y, z); if(TUER[id] === undefined) return false;
    var teil = SC.Bauteile.tuerPartner(welt, x, y, z), zellen = [{ y: y, id: id }]; if(teil) zellen.push(teil);
    var schliesst = TUER[id] === B.TUER_X || TUER[id] === B.TUER_Z || TUER[id] === B.TUER_X_OBEN || TUER[id] === B.TUER_Z_OBEN, P = welt.planet.groesse;
    if(schliesst && (spieler || []).some(function(s){
      var dx = SC.mod(x + 0.5 - s.pos[0] + P / 2, P) - P / 2, dz = SC.mod(z + 0.5 - s.pos[2] + P / 2, P) - P / 2;
      return Math.abs(dx) < 0.5 + SC.PHYSIK.breite / 2 && Math.abs(dz) < 0.5 + SC.PHYSIK.breite / 2 && zellen.some(function(c){ return c.y < s.pos[1] + SC.PHYSIK.hoehe && c.y + 1 > s.pos[1]; });
    })) return false;
    var geaendert = false; zellen.forEach(function(c){ if(welt.setzeBlock(x, c.y, z, TUER[c.id], "spieler")) geaendert = true; });
    return geaendert;
  };
})();
