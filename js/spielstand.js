// Spielstand: Weltformat, Migration alter Formate, Export und Import als .spacecraft-Datei
SC.FORMAT = 2;

SC.ImportFehler = function(text){ this.message = text; this.name = "ImportFehler"; };
SC.ImportFehler.prototype = Object.create(Error.prototype);
SC.ZuNeuFehler = function(format){ this.message = SC.T.brauchtNeuereVersion; this.format = format; this.name = "ZuNeuFehler"; };
SC.ZuNeuFehler.prototype = Object.create(Error.prototype);

SC.Spielstand = {};
(function(){
  var B = SC.B;
  var LEISTE = [B.GRAS, B.ERDE, B.STEIN, B.BRETTER, B.STEINZIEGEL, B.GLAS, B.METALL, B.LEUCHT_CYAN, B.STAMM];

  function leererRucksack(){ var r = []; for(var i = 0; i < 36; i++) r.push(null); return r; }
  function leereAusruestung(){ return { helm: null, brust: null, handschuhe: null, stiefel: null, schild: null }; }
  function neueId(){ var a = new Uint32Array(2); crypto.getRandomValues(a); return a[0].toString(36) + a[1].toString(36); }
  function zufallsSeed(){ var a = new Uint32Array(1); crypto.getRandomValues(a); return String(a[0] % 1000000000); }

  function inBase64(u8){ var s = "", n = 0x8000; for(var i = 0; i < u8.length; i += n) s += String.fromCharCode.apply(null, u8.subarray(i, i + n)); return btoa(s); }
  function ausBase64(t){ var s = atob(t), u = new Uint8Array(s.length); for(var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }

  SC.Spielstand.neu = function(o){
    var seed = (o.seedText || "").trim() || zufallsSeed(), jetzt = Date.now();
    return {
      format: SC.FORMAT, spielVersion: window.V || "", id: neueId(), name: o.name || SC.T.neueWelt, seed: seed,
      erstellt: jetzt, zuletzt: jetzt, zuletztExport: null, modus: o.modus || "kreativ", tageszeit: 0.3, aktuellerPlanet: "start",
      schwierigkeit: o.schwierigkeit || "leicht", startpunkt: null, spielzeit: 0,
      planeten: { start: { id: "start", seed: SC.hashText(seed + ":start"), groesse: 2048, palette: "start", generatorVersion: SC.GENERATOR_VERSION, chunks: {}, kisten: {}, geraeumt: {} } },
      spieler: { pos: null, blick: [0, 0], schnellleiste: LEISTE.slice(), schnellleisteKreativ: LEISTE.slice(), ansicht: "ich",
        stufe: 1, erfahrung: 0, lebenspunkte: null, schild: null, rucksack: leererRucksack(), ausruestung: leereAusruestung() }
    };
  };

  SC.Spielstand.ausWelt = function(daten, welt, spieler, kampf){
    var pl = daten.planeten[welt.planet.id], chunks = {};
    welt.geaenderte.forEach(function(c, k){ chunks[k] = inBase64(c); });
    pl.chunks = chunks;
    if(spieler){
      daten.spieler.pos = spieler.pos.slice(); daten.spieler.blick = spieler.blick.slice();
      daten.spieler.schnellleiste = spieler.schnellleiste.slice(); daten.spieler.ansicht = spieler.ansicht;
      daten.modus = spieler.modus;
    }
    if(kampf){
      var s = daten.spieler, w = kampf.werte;
      s.stufe = w.stufe; s.erfahrung = w.erfahrung; s.lebenspunkte = w.lp; s.schild = w.schild;
      s.rucksack = kampf.rucksack.alsDaten(); s.ausruestung = JSON.parse(JSON.stringify(kampf.ausruestung));
    }
    daten.spielVersion = window.V || daten.spielVersion;
    return daten;
  };

  SC.Spielstand.chunksLaden = function(planetDaten){
    var aus = {}, c = planetDaten.chunks || {};
    for(var k in c) aus[k] = ausBase64(c[k]);
    return aus;
  };

  // Liest jedes ältere Format; Format 0 ist Format 1 ohne die nachgezogenen Felder
  SC.Spielstand.migriere = function(daten){
    if(!daten || typeof daten.format !== "number") throw new SC.ImportFehler(SC.T.importKaputt);
    if(daten.format > SC.FORMAT) throw new SC.ZuNeuFehler(daten.format);
    var vorher = daten.format, d = daten;
    if(d.zuletztExport === undefined) d.zuletztExport = null;
    if(!d.modus) d.modus = "kreativ";
    if(typeof d.tageszeit !== "number") d.tageszeit = 0.3;
    if(!d.aktuellerPlanet) d.aktuellerPlanet = "start";
    d.spieler = d.spieler || {};
    var s = d.spieler;
    if(s.pos === undefined) s.pos = null;
    if(!s.blick) s.blick = [0, 0];
    if(!s.schnellleiste || s.schnellleiste.length !== 9) s.schnellleiste = LEISTE.slice();
    if(!s.ansicht) s.ansicht = "ich";
    if(s.lebenspunkte === undefined) s.lebenspunkte = null;
    // Format 2: Survival-Felder
    if(!d.schwierigkeit) d.schwierigkeit = "leicht";
    if(d.startpunkt === undefined) d.startpunkt = null;
    if(typeof d.spielzeit !== "number") d.spielzeit = 0;
    if(!s.schnellleisteKreativ || s.schnellleisteKreativ.length !== 9) s.schnellleisteKreativ = s.schnellleiste.slice();
    if(typeof s.stufe !== "number") s.stufe = 1;
    if(typeof s.erfahrung !== "number") s.erfahrung = 0;
    if(s.schild === undefined) s.schild = null;
    if(!s.rucksack || s.rucksack.length !== 36) s.rucksack = leererRucksack();
    if(!s.ausruestung) s.ausruestung = leereAusruestung();
    delete s.inventar;
    for(var id in d.planeten){ var p = d.planeten[id]; if(!p.chunks) p.chunks = {}; if(!p.generatorVersion) p.generatorVersion = 1; if(!p.palette) p.palette = "start"; if(!p.groesse) p.groesse = 2048; if(!p.kisten) p.kisten = {}; if(!p.geraeumt) p.geraeumt = {}; }
    d.format = SC.FORMAT;
    return { daten: d, migriert: vorher !== SC.FORMAT };
  };

  SC.Spielstand.exportiere = function(daten){
    var text = JSON.stringify({ typ: "spacecraft-welt", format: daten.format, daten: daten });
    var roh = new Blob([text], { type: "application/json" });
    if(typeof CompressionStream === "undefined") return Promise.resolve(roh);
    return new Response(roh.stream().pipeThrough(new CompressionStream("gzip"))).blob().then(function(b){ return new Blob([b], { type: "application/octet-stream" }); });
  };

  SC.Spielstand.importiere = function(datei){
    return datei.arrayBuffer().then(function(buf){
      var u = new Uint8Array(buf);
      if(u.length > 2 && u[0] === 0x1f && u[1] === 0x8b){
        if(typeof DecompressionStream === "undefined") throw new SC.ImportFehler(SC.T.importKaputt);
        return new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
      }
      return new TextDecoder().decode(u);
    }).then(function(text){
      var h;
      try { h = JSON.parse(text); } catch(e){ throw new SC.ImportFehler(SC.T.importKaputt); }
      if(!h || h.typ !== "spacecraft-welt" || !h.daten || !h.daten.planeten && h.format <= SC.FORMAT) throw new SC.ImportFehler(SC.T.importKaputt);
      var d;
      try { d = SC.Spielstand.migriere(h.daten).daten; }
      catch(f){ if(f instanceof SC.ZuNeuFehler) throw new SC.ImportFehler(SC.T.importZuNeu); throw f; }
      d.id = neueId();
      return d;
    }, function(f){ if(f instanceof SC.ImportFehler) throw f; throw new SC.ImportFehler(SC.T.importKaputt); });
  };

  SC.Spielstand.dateiname = function(daten){
    var n = (daten.name || "welt").toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return (n || "welt") + ".spacecraft";
  };
})();
