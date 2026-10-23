// Gegenstände: Arten, Seltenheit, Beute erzeugen, Namen und Vergleich. Zufall kommt immer als zf herein.
SC.SELTENHEIT = [
  { name: "gewoehnlich", farbe: "#b9c2cc" }, { name: "ungewoehnlich", farbe: "#5fdc5f" }, { name: "selten", farbe: "#4aa3ff" },
  { name: "episch", farbe: "#b06bff" }, { name: "legendaer", farbe: "#ffad47" }
];

SC.GEGENSTAENDE = {
  laserschwert: { platz: "waffe", haupt: { schaden: 14 }, waffe: { typ: "schwert", rate: 0.35, reichweite: 3 } },
  blasterpistole: { platz: "waffe", haupt: { schaden: 6 }, waffe: { typ: "blaster", rate: 0.22, tempo: 45, hitze: 0.09, reichweite: 40 } },
  blastergewehr: { platz: "waffe", haupt: { schaden: 13 }, waffe: { typ: "blaster", rate: 0.45, tempo: 60, hitze: 0.16, reichweite: 60 } },
  helm: { platz: "helm", haupt: { schutz: 4 } },
  brust: { platz: "brust", haupt: { schutz: 7 } },
  handschuhe: { platz: "handschuhe", haupt: { schutz: 3 } },
  stiefel: { platz: "stiefel", haupt: { schutz: 3 } },
  schildgenerator: { platz: "schild", haupt: { schild: 25 } }
};

SC.Beute = {};
(function(){
  var ANTEILE = [0.55, 0.83, 0.95, 0.99, 1];
  var ORT = {
    station: { blasterpistole: 2, blastergewehr: 3, schildgenerator: 2, helm: 1, brust: 1, handschuhe: 1, stiefel: 1, laserschwert: 0.5 },
    herrenhaus: { laserschwert: 3, brust: 2, helm: 2, handschuhe: 1, stiefel: 1, blasterpistole: 0.7, blastergewehr: 0.5, schildgenerator: 1 },
    lager: { blasterpistole: 3, stiefel: 2, handschuhe: 2, helm: 1, brust: 1, blastergewehr: 1, laserschwert: 0.7, schildgenerator: 0.7 }
  };
  SC.Beute.SONDER = {
    doppelsprung: { plaetze: ["stiefel"] },
    abprall: { plaetze: ["waffe"], arten: ["blasterpistole", "blastergewehr"] },
    funkenhieb: { plaetze: ["waffe"], arten: ["laserschwert"] },
    leuchten: { plaetze: ["helm", "brust"] },
    schnellladen: { plaetze: ["schild"] }
  };
  var ZUSATZ = ["lp", "tempo", "schadenProzent", "erholung"];

  SC.Beute.seltenheit = function(zf, o){
    var r = zf(), s = 0; while(r >= ANTEILE[s]) s++;
    s = Math.min(4, s + ((o && o.bonus) || 0));
    return Math.max(s, (o && o.mindest) || 0);
  };

  function waehleArt(zf, ort){
    var g = ORT[ort], arten = Object.keys(SC.GEGENSTAENDE), sum = 0, w;
    arten.forEach(function(a){ sum += g ? (g[a] || 0) : 1; });
    w = zf() * sum;
    for(var i = 0; i < arten.length; i++){ w -= g ? (g[arten[i]] || 0) : 1; if(w < 0) return arten[i]; }
    return arten[arten.length - 1];
  }

  function name(art, seltenheit, zf){
    var n = SC.T.gegenstand[art], T = SC.T;
    if(seltenheit === 4) return T.legendaereNamen[Math.floor(zf() * T.legendaereNamen.length)] + "-" + n[0];
    var endung = { m: "er", f: "e", n: "es", pl: "e" }[n[1]];
    return T.seltenheitWort[seltenheit] + endung + " " + n[0];
  }

  SC.Beute.erzeuge = function(zf, o){
    var art = o.art || waehleArt(zf, o.ort), def = SC.GEGENSTAENDE[art], stufe = Math.max(1, o.stufe || 1);
    var selt = SC.Beute.seltenheit(zf, { mindest: o.mindest, bonus: o.bonus });
    var faktor = (1 + 0.15 * (stufe - 1)) * (1 + 0.18 * selt), werte = {};
    for(var k in def.haupt) werte[k] = Math.max(1, Math.round(def.haupt[k] * faktor));
    var anzahl = [0, 1, 1, 2, 3][selt], pool = ZUSATZ.slice();
    for(var i = 0; i < anzahl && pool.length; i++){
      var z = pool.splice(Math.floor(zf() * pool.length), 1)[0];
      werte[z] = z === "lp" ? 5 + 2 * stufe + Math.round(zf() * stufe) : z === "tempo" ? 3 + Math.round(zf() * 5) : z === "schadenProzent" ? 4 + Math.round(zf() * 8) : 10 + Math.round(zf() * 20);
    }
    var sonder = null;
    if(selt >= 3 && (selt === 4 || zf() < 0.7)){
      var moegl = Object.keys(SC.Beute.SONDER).filter(function(s){ var d = SC.Beute.SONDER[s]; return d.plaetze.indexOf(def.platz) >= 0 && (!d.arten || d.arten.indexOf(art) >= 0); });
      if(moegl.length) sonder = moegl[Math.floor(zf() * moegl.length)];
    }
    var id = Math.floor(zf() * 2176782336).toString(36) + Math.floor(zf() * 2176782336).toString(36);
    return { id: id, art: art, stufe: stufe, seltenheit: selt, werte: werte, sonder: sonder, name: name(art, selt, zf) };
  };

  SC.Beute.vergleiche = function(neu, alt){
    var v = {}, a = (alt && alt.werte) || {}, k;
    for(k in neu.werte) v[k] = neu.werte[k] - (a[k] || 0);
    for(k in a) if(!(k in v)) v[k] = -a[k];
    return v;
  };
})();
