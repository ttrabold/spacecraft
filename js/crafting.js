// Crafting (Stufe 6a): Rezepte und Herstell-Logik gegen den Rucksack, ohne Oberfläche (Menü: js/ui-werkbank.js).
// Bauteile haben feste Kosten; Waffen und Rüstung brauchen ein Metall (Stufe = Seltenheit), Waffen zusätzlich einen Kristall (Farbe).
SC.CRAFTING = {};
(function(){
  var B = SC.B;
  // Index = Seltenheit 0–4; innerhalb einer Stufe sind die Blöcke austauschbar
  SC.METALLE = [[B.STEIN], [B.EISENERZ], [B.TITAN], [B.GLUTSTAHL, B.MOORSILBER], [B.STERNENMETALL]];

  // Rohstoffe, die der Kreativmodus per Knopfdruck in den Rucksack legt (Reiter „Materialien“): alles, woraus die Rezepte bestehen
  SC.CRAFTING_MATERIALIEN = [B.STAMM, B.BRETTER, B.STEIN, B.SAND, B.LEUCHTPILZ, B.EISENERZ, B.TITAN, B.GLUTSTAHL, B.MOORSILBER, B.STERNENMETALL,
    B.KRISTALL_BLAU, B.KRISTALL_GRUEN, B.KRISTALL_ROT, B.KRISTALL_GELB, B.KRISTALL_VIOLETT, B.KRISTALL_WEISS, B.SCHALTKREIS, B.CHITIN];

  function bauteil(id, station, kosten, block, anzahl){ return { id: id, art: "bauteil", station: station, kosten: kosten, ergibt: { block: block, anzahl: anzahl } }; }
  function gegenstand(id, art, metall, kristall, extra){ return { id: id, art: art, station: "werkbank", gegenstand: id, metall: metall, kristall: kristall, extra: extra || [] }; }
  SC.REZEPTE = [
    bauteil("bretter", "hand", [{ block: B.STAMM, anzahl: 1 }], B.BRETTER, 4),
    bauteil("werkbank", "hand", [{ block: B.BRETTER, anzahl: 4 }, { block: B.STEIN, anzahl: 4 }], B.WERKBANK, 1),
    bauteil("fenster", "werkbank", [{ block: B.SAND, anzahl: 2 }], B.GLAS, 2),
    bauteil("fackel", "werkbank", [{ block: B.STAMM, anzahl: 1 }, { block: B.LEUCHTPILZ, anzahl: 1 }], B.FACKEL, 4),
    bauteil("zaun", "werkbank", [{ block: B.BRETTER, anzahl: 3 }], B.ZAUN, 4),
    bauteil("leiter", "werkbank", [{ block: B.BRETTER, anzahl: 3 }], B.LEITER_N, 3),
    bauteil("tuer", "werkbank", [{ block: B.BRETTER, anzahl: 4 }], B.TUER_X, 1),
    bauteil("truhe", "werkbank", [{ block: B.BRETTER, anzahl: 6 }], B.TRUHE, 1),
    bauteil("wolle", "werkbank", [{ block: B.BLAETTER, anzahl: 2 }], B.WOLLE_ROT, 1),
    bauteil("bett", "werkbank", [{ block: B.WOLLE_ROT, anzahl: 3 }, { block: B.BRETTER, anzahl: 3 }], B.BETT_FUSS_N, 1),
    gegenstand("blasterpistole", "waffe", 4, 1), gegenstand("blastergewehr", "waffe", 8, 1), gegenstand("laserschwert", "waffe", 6, 2),
    gegenstand("helm", "ruestung", 5, 0), gegenstand("brust", "ruestung", 8, 0), gegenstand("handschuhe", "ruestung", 4, 0), gegenstand("stiefel", "ruestung", 4, 0),
    gegenstand("schildgenerator", "ruestung", 6, 0, [{ block: B.SCHALTKREIS, anzahl: 1 }])
  ];
  SC.Crafting = {
    rezept: function(id){ for(var i = 0; i < SC.REZEPTE.length; i++) if(SC.REZEPTE[i].id === id) return SC.REZEPTE[i]; return null; },
    // Kosten als Liste { block, anzahl }; null bei ungültiger Wahl (Metall der falschen Stufe, unbekannter Kristall)
    kosten: function(rz, wahl){
      if(rz.art === "bauteil") return rz.kosten;
      if(!wahl || SC.METALLE[wahl.metallStufe] === undefined || SC.METALLE[wahl.metallStufe].indexOf(wahl.metallBlock) < 0) return null;
      var k = [{ block: wahl.metallBlock, anzahl: rz.metall }];
      if(rz.kristall){ var kr = SC.CRAFTING_KRISTALLE[wahl.kristall]; if(!kr) return null; k.push({ block: kr.block, anzahl: rz.kristall }); }
      return k.concat(rz.extra);
    },
    // → { ok, grund?: "wahl"|"material"|"voll", fehlt?: [{ block, anzahl }] }; o.gratis: Kreativmodus, keine Kosten
    baubar: function(rucksack, rz, wahl, o){
      var k = SC.Crafting.kosten(rz, wahl); if(!k) return { ok: false, grund: "wahl", fehlt: [] };
      if(o && o.gratis) return { ok: true };
      var fehlt = []; k.forEach(function(x){ var n = rucksack.hat(x.block); if(n < x.anzahl) fehlt.push({ block: x.block, anzahl: x.anzahl - n }); });
      return fehlt.length ? { ok: false, grund: "material", fehlt: fehlt } : { ok: true };
    },
    // Zieht die Kosten ab und legt das Ergebnis in den Rucksack, ganz oder gar nicht → { ok, ergebnis?, grund? }
    herstelle: function(rucksack, rz, wahl, zf, spielerStufe, o){
      var b = SC.Crafting.baubar(rucksack, rz, wahl, o); if(!b.ok) return b;
      var k = SC.Crafting.kosten(rz, wahl), gratis = o && o.gratis, sache;
      if(rz.art === "bauteil") sache = { block: rz.ergibt.block, anzahl: rz.ergibt.anzahl };
      else {
        var def = SC.GEGENSTAENDE[rz.gegenstand], opt = { art: rz.gegenstand, seltenheit: wahl.metallStufe, stufe: spielerStufe, material: wahl.metallStufe, metall: wahl.metallBlock };
        if(def.platz === "waffe") opt.klinge = SC.CRAFTING_KRISTALLE[wahl.kristall].farbe;
        sache = { gegenstand: SC.Beute.baue(zf, opt) };
      }
      // Passt es auch nach dem Abziehen? (Probe an einer Kopie, damit bei „voll“ nichts verbraucht wird)
      var probe = new SC.Rucksack(rucksack.alsDaten());
      if(!gratis) k.forEach(function(x){ probe.entferne(x.block, x.anzahl); });
      if(!probe.passt(sache.gegenstand ? { gegenstand: true } : sache)) return { ok: false, grund: "voll" };
      if(!gratis) k.forEach(function(x){ rucksack.entferne(x.block, x.anzahl); });
      rucksack.lege(sache.gegenstand ? { gegenstand: sache.gegenstand } : sache);
      return { ok: true, ergebnis: sache.gegenstand || sache };
    }
  };
})();
