// Crafting (Stufe 6a): Rezepte und Herstell-Logik gegen den Rucksack, ohne Oberfläche (Menü: js/ui-werkbank.js).
// Bauteile haben feste Kosten; Waffen und Rüstung brauchen ein Metall (Stufe = Seltenheit), Waffen zusätzlich einen Kristall (Farbe).
SC.CRAFTING = {};
(function(){
  var B = SC.B;
  // Index = Seltenheit 0–4; innerhalb einer Stufe sind die Blöcke austauschbar
  SC.METALLE = [[B.STEIN], [B.EISENERZ], [B.TITAN], [B.GLUTSTAHL, B.MOORSILBER], [B.STERNENMETALL]];

  // Rohstoffe, die der Kreativmodus per Knopfdruck in den Rucksack legt (Reiter „Materialien“): alles, woraus die Rezepte bestehen
  SC.CRAFTING_MATERIALIEN = [B.STAMM, B.BRETTER, B.STEIN, B.SAND, B.LEUCHTPILZ, B.EISENERZ, B.TITAN, B.GLUTSTAHL, B.MOORSILBER, B.STERNENMETALL,
    B.KRISTALL_BLAU, B.KRISTALL_GRUEN, B.KRISTALL_ROT, B.KRISTALL_GELB, B.KRISTALL_VIOLETT, B.KRISTALL_WEISS, B.SCHALTKREIS, B.CHITIN,
    B.FLASCHE, B.HASENKLEE, B.KATZENMINZE, B.FUCHSGRAS, B.EISBLUME, B.FROSTBEERE, B.GLUTMOHN, B.FEDERFARN, B.QUAKBLUME, B.DSCHUNGELRANKE];

  function bauteil(id, station, kosten, block, anzahl){ return { id: id, art: "bauteil", station: station, kosten: kosten, ergibt: { block: block, anzahl: anzahl } }; }
  function gegenstand(id, art, metall, kristall, extra){ return { id: id, art: art, station: "werkbank", gegenstand: id, metall: metall, kristall: kristall, extra: extra || [] }; }
  // Fahrzeuge (Stufe 6b): Rumpf mit festen Kosten; Motor (6 Metall), Panzerung (8 Metall) und optional Bordwaffe (5 Metall + 1 Kristall) wählt der Spieler
  function fahrzeug(id, art, rumpf){ return { id: id, art: "fahrzeug", station: "werkbank", fahrzeug: art, rumpf: rumpf }; }
  SC.FAHRZEUG_TEILE = { motor: 6, panzerung: 8, waffe: 5 };
  SC.REZEPTE = [
    bauteil("bretter", "hand", [{ block: B.STAMM, anzahl: 1 }], B.BRETTER, 4),
    bauteil("werkbank", "hand", [{ block: B.BRETTER, anzahl: 4 }, { block: B.STEIN, anzahl: 4 }], B.WERKBANK, 1),
    bauteil("fenster", "werkbank", [{ block: B.SAND, anzahl: 2 }], B.GLAS, 2),
    bauteil("fackel", "werkbank", [{ block: B.STAMM, anzahl: 1 }, { block: B.LEUCHTPILZ, anzahl: 1 }], B.FACKEL, 4),
    bauteil("zaun", "werkbank", [{ block: B.BRETTER, anzahl: 3 }], B.ZAUN, 4),
    bauteil("leiter", "werkbank", [{ block: B.BRETTER, anzahl: 3 }], B.LEITER_N, 3),
    bauteil("tuer", "werkbank", [{ block: B.BRETTER, anzahl: 4 }], B.TUER_X, 1),
    bauteil("truhe", "werkbank", [{ block: B.BRETTER, anzahl: 6 }], B.TRUHE, 1),
    bauteil("zauberkugel", "werkbank", [{ block: B.BRETTER, anzahl: 6 }, { block: B.KRISTALL_BLAU, anzahl: 2 }, { block: B.KRISTALL_GRUEN, anzahl: 1 }, { block: B.TITAN, anzahl: 1 }], B.ZAUBERKUGEL, 1),
    bauteil("wolle", "werkbank", [{ block: B.BLAETTER, anzahl: 2 }], B.WOLLE_ROT, 1),
    bauteil("bett", "werkbank", [{ block: B.WOLLE_ROT, anzahl: 3 }, { block: B.BRETTER, anzahl: 3 }], B.BETT_FUSS_N, 1),
    bauteil("eimer", "werkbank", [{ block: B.EISENERZ, anzahl: 3 }], B.EIMER, 1),
    bauteil("netz", "werkbank", [{ block: B.WOLLE_ROT, anzahl: 2 }, { block: B.BRETTER, anzahl: 2 }], B.NETZ, 1),
    bauteil("tierfutter", "werkbank", [{ block: B.BLAETTER, anzahl: 2 }, { block: B.LEUCHTPILZ, anzahl: 1 }], B.TIERFUTTER, 4),
    bauteil("kessel", "werkbank", [{ block: B.EISENERZ, anzahl: 6 }, { block: B.BRETTER, anzahl: 2 }], B.KESSEL, 1),   // Zaubertränke
    bauteil("flasche", "werkbank", [{ block: B.GLAS, anzahl: 2 }], B.FLASCHE, 3),
    gegenstand("blasterpistole", "waffe", 4, 1), gegenstand("blastergewehr", "waffe", 8, 1), gegenstand("laserschwert", "waffe", 6, 2),
    gegenstand("helm", "ruestung", 5, 0), gegenstand("brust", "ruestung", 8, 0), gegenstand("handschuhe", "ruestung", 4, 0), gegenstand("stiefel", "ruestung", 4, 0),
    gegenstand("schildgenerator", "ruestung", 6, 0, [{ block: B.SCHALTKREIS, anzahl: 1 }]),
    fahrzeug("fz-gleiter", "gleiter", [{ block: B.BRETTER, anzahl: 10 }, { block: B.SCHALTKREIS, anzahl: 3 }]),
    fahrzeug("fz-buggy", "buggy", [{ block: B.BRETTER, anzahl: 14 }, { block: B.STEIN, anzahl: 10 }, { block: B.SCHALTKREIS, anzahl: 5 }]),
    fahrzeug("fz-flieger", "flieger", [{ block: B.BRETTER, anzahl: 12 }, { block: B.SCHALTKREIS, anzahl: 8 }, { block: B.KRISTALL_BLAU, anzahl: 1 }]),
    // Raumschiff (Stufe 6c): Sternenmetall dafür gibt es bei Bossen und aus Asteroiden im All
    fahrzeug("fz-raumschiff", "raumschiff", [{ block: B.TITAN, anzahl: 10 }, { block: B.SCHALTKREIS, anzahl: 12 }, { block: B.STERNENMETALL, anzahl: 2 }, { block: B.KRISTALL_BLAU, anzahl: 2 }])
  ];
  SC.Crafting = {
    rezept: function(id){ for(var i = 0; i < SC.REZEPTE.length; i++) if(SC.REZEPTE[i].id === id) return SC.REZEPTE[i]; return null; },
    // Kosten als Liste { block, anzahl }; null bei ungültiger Wahl (Metall der falschen Stufe, unbekannter Kristall)
    kosten: function(rz, wahl){
      if(rz.art === "bauteil") return rz.kosten;
      if(rz.art === "fahrzeug"){
        if(!wahl || SC.BAU_FARBEN.indexOf(wahl.farbe) < 0) return null;
        function metall(t){ return t && SC.METALLE[t.stufe] !== undefined && SC.METALLE[t.stufe].indexOf(t.block) >= 0; }
        if(!metall(wahl.motor) || !metall(wahl.panzerung) || (wahl.waffe && (!metall(wahl.waffe) || !SC.CRAFTING_KRISTALLE[wahl.waffe.kristall]))) return null;
        var l = rz.rumpf.map(function(x){ return { block: x.block, anzahl: x.anzahl }; });
        function dazu(block, n){ for(var i = 0; i < l.length; i++) if(l[i].block === block){ l[i].anzahl += n; return; } l.push({ block: block, anzahl: n }); }
        dazu(wahl.motor.block, SC.FAHRZEUG_TEILE.motor); dazu(wahl.panzerung.block, SC.FAHRZEUG_TEILE.panzerung);
        if(wahl.waffe){ dazu(wahl.waffe.block, SC.FAHRZEUG_TEILE.waffe); dazu(SC.CRAFTING_KRISTALLE[wahl.waffe.kristall].block, 1); }
        return l;
      }
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
    // Zaubertrank brauen (Spec 2026-11-09): eine Flasche + ein Kristall der Farbe + eine Pflanze → ein Trank "kristall:pflanze".
    // → { ok: true, schluessel } | { ok: false, grund: "zutat"|"voll" }; ganz oder gar nicht (bei "voll" bleibt alles beim Alten)
    brauen: function(rucksack, kristall, pflanze){
      var t = SC.Trank.teile(SC.Trank.schluessel(kristall, pflanze)); if(!t) return { ok: false, grund: "zutat" };
      var zutaten = [{ block: SC.B.FLASCHE, anzahl: 1 }, { block: SC.CRAFTING_KRISTALLE[kristall].block, anzahl: 1 }, { block: SC.PFLANZEN[pflanze].block, anzahl: 1 }];
      if(zutaten.some(function(x){ return rucksack.hat(x.block) < x.anzahl; })) return { ok: false, grund: "zutat" };
      var s = SC.Trank.schluessel(kristall, pflanze), trank = { block: SC.B.TRANK, anzahl: 1, trank: s }, probe = new SC.Rucksack(rucksack.alsDaten(), rucksack.plaetze.length);
      zutaten.forEach(function(x){ probe.entferne(x.block, x.anzahl); });
      if(!probe.passt(trank)) return { ok: false, grund: "voll" };
      zutaten.forEach(function(x){ rucksack.entferne(x.block, x.anzahl); });
      rucksack.lege(trank);
      return { ok: true, schluessel: s };
    },
    // Fahrzeug: o.fahrzeug = { platz(art) → Stelle | null, setze(art, bau, stelle) → Fahrzeug }. Erst Platz suchen, dann bezahlen, dann aufstellen.
    herstelleFahrzeug: function(rucksack, rz, wahl, o){
      if(!o || !o.fahrzeug) return { ok: false, grund: "platz" };
      var pos = o.fahrzeug.platz(rz.fahrzeug); if(!pos) return { ok: false, grund: "platz" };
      if(!o.gratis) SC.Crafting.kosten(rz, wahl).forEach(function(x){ rucksack.entferne(x.block, x.anzahl); });
      var bau = { motor: wahl.motor.stufe, panzerung: wahl.panzerung.stufe, waffe: wahl.waffe ? { stufe: wahl.waffe.stufe, kristall: wahl.waffe.kristall } : null, farbe: wahl.farbe };
      return { ok: true, ergebnis: o.fahrzeug.setze(rz.fahrzeug, bau, pos) };
    },
    // Zieht die Kosten ab und legt das Ergebnis in den Rucksack, ganz oder gar nicht → { ok, ergebnis?, grund? }
    herstelle: function(rucksack, rz, wahl, zf, spielerStufe, o){
      var b = SC.Crafting.baubar(rucksack, rz, wahl, o); if(!b.ok) return b;
      if(rz.art === "fahrzeug") return SC.Crafting.herstelleFahrzeug(rucksack, rz, wahl, o);
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
