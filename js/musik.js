// Musik-Komponist: erzeugt aus Seed und Stimmung ein Orchesterstück (eigene Musik, im Stil
// abenteuerlicher Filmmusik). Reine Logik ohne Audio – gespielt wird es in audio.js.
//   tag   – heldenhaft, Dur, Marschtempo, Blechbläser
//   nacht – geheimnisvoll, Moll, ruhig, Horn und Harfe
//   tief  – Höhlen und Dungeons: tiefes Streicher-Ostinato, Pauken, Spannung
SC.Musik = {};
(function(){
  var DUR = [0, 2, 4, 5, 7, 9, 11], MOLL = [0, 2, 3, 5, 7, 8, 10];
  var CODE = { tag: 1, nacht: 2, tief: 3 };

  SC.Musik.stimmung = function(o){ return o.unterTage ? "tief" : o.tageslicht < 0.55 ? "nacht" : "tag"; };

  // Alle Tonleitertöne im Bereich [von, bis]
  function leiter(grund, moll, von, bis){ var l = moll ? MOLL : DUR, a = []; for(var m = von; m <= bis; m++) if(l.indexOf(SC.mod(m - grund, 12)) >= 0) a.push(m); return a; }
  function akkordTon(grund, stufe, art){ var r = grund + stufe; return art === "moll" ? [r, r + 3, r + 7] : [r, r + 4, r + 7]; }
  function inOktave(m, von){ while(m < von) m += 12; while(m >= von + 12) m -= 12; return m; }
  function naechster(liste, ziel){ var b = liste[0]; liste.forEach(function(m){ if(Math.abs(m - ziel) < Math.abs(b - ziel)) b = m; }); return b; }

  var FOLGEN = {
    tag: [[[0, "dur"], [10, "dur"], [5, "dur"], [0, "dur"]], [[0, "dur"], [7, "dur"], [9, "moll"], [5, "dur"]], [[0, "dur"], [5, "dur"], [10, "dur"], [7, "dur"]], [[9, "moll"], [5, "dur"], [7, "dur"], [0, "dur"]]],
    nacht: [[[0, "moll"], [8, "dur"], [3, "dur"], [10, "dur"]], [[0, "moll"], [5, "moll"], [8, "dur"], [7, "moll"]], [[0, "moll"], [10, "dur"], [8, "dur"], [7, "moll"]]],
    tief: [[[0, "moll"], [0, "moll"], [8, "dur"], [7, "moll"]], [[0, "moll"], [5, "moll"], [0, "moll"], [8, "dur"]]]
  };
  var RHYTHMEN = {
    tag: [[[0, 1.5], [1.5, 0.5], [2, 2]], [[0, 1 / 3], [1 / 3, 1 / 3], [2 / 3, 1 / 3], [1, 3]], [[0, 1], [1, 1], [2, 1], [3, 1]], [[0, 3], [3, 1]], [[0, 0.5], [0.5, 0.5], [1, 1], [2, 2]]],
    nacht: [[[0, 4]], [[0, 2], [2, 2]], [[0, 3], [3, 1]], [[1, 3]]],
    tief: [[[0, 4]], [[2, 2]], []]
  };

  SC.Musik.komponiere = function(seed, stimmung){
    var zf = SC.zufall(SC.hash3(seed >>> 0, CODE[stimmung] || 1, 4711)), w = function(l){ return l[Math.floor(zf() * l.length)]; };
    var moll = stimmung !== "tag";
    var grund = stimmung === "tag" ? w([62, 60, 58]) : stimmung === "nacht" ? w([57, 62, 55]) : w([52, 55]);
    var tempo = stimmung === "tag" ? 100 + Math.floor(zf() * 14) : stimmung === "nacht" ? 66 + Math.floor(zf() * 8) : 58 + Math.floor(zf() * 6);
    var takte = 16, ev = [], folge = [];
    for(var f = 0; f < takte / 4; f++){ var p = w(FOLGEN[stimmung]); folge = folge.concat(p); }
    if(stimmung === "tag"){ folge[takte - 2] = [7, "dur"]; folge[takte - 1] = [0, "dur"]; }
    else folge[takte - 1] = [0, "moll"];
    function n(t, dauer, instrument, midi, vel, stimme){ ev.push({ t: t, dauer: dauer, instrument: instrument, midi: midi, vel: vel, stimme: stimme || "begleitung" }); }

    var melBereich = stimmung === "tag" ? [67, 86] : stimmung === "nacht" ? [60, 79] : [45, 60];
    var mLeiter = leiter(grund, moll, melBereich[0], melBereich[1]), ton = naechster(mLeiter, melBereich[0] + 7);
    var melInstr = stimmung === "tag" ? "blech" : stimmung === "nacht" ? "horn" : "horn";

    for(var k = 0; k < takte; k++){
      var t0 = k * 4, a = folge[k], akk = akkordTon(grund, a[0], a[1]), letzter = k === takte - 1;
      // Begleitung
      var lage = akk.map(function(m){ return inOktave(m, stimmung === "tief" ? 43 : 55); });
      var bass = inOktave(akk[0], stimmung === "tief" ? 28 : 36);
      if(stimmung === "tag"){
        lage.forEach(function(m){ n(t0, 4, "streicher", m, 0.32); });
        n(t0, 2, "streicher", bass, 0.4); n(t0 + 2, 2, "streicher", bass, 0.35);
        n(t0 + 1, 0.4, "blech", lage[1] + 12, 0.25); n(t0 + 3, 0.4, "blech", lage[2] + 12, 0.25);
        n(t0, 0.8, "pauke", inOktave(akk[0], 38), 0.6); n(t0 + 2, 0.8, "pauke", inOktave(akk[0] + 7, 38), 0.45);
        [0, 1, 1.5, 2, 3, 3.5].forEach(function(b){ n(t0 + b, 0.2, "trommel", 60, b % 1 ? 0.18 : 0.28); });
      } else if(stimmung === "nacht"){
        lage.forEach(function(m){ n(t0, 4, "streicher", m, 0.26); });
        n(t0, 4, "streicher", bass, 0.3);
        for(var h = 0; h < 8; h++) n(t0 + h * 0.5, 1.2, "harfe", lage[h % 3] + (h >= 3 && h < 6 ? 12 : 0), 0.3);
        if(k % 2 === 0) n(t0, 1.5, "pauke", inOktave(akk[0], 38), 0.25);
      } else {
        for(var o = 0; o < 8; o++) n(t0 + o * 0.5, 0.45, "streicher", o === 7 ? bass + 1 : bass, o % 2 ? 0.3 : 0.42);
        n(t0, 4, "streicher", inOktave(akk[0] + 7, 40), 0.18);
        if(k % 4 === 3) for(var r = 0; r < 16; r++) n(t0 + r * 0.25, 0.3, "pauke", inOktave(akk[0], 36), 0.15 + r * 0.03);
        else if(k % 2 === 0) n(t0, 1, "pauke", inOktave(akk[0], 36), 0.5);
      }
      // Melodie: Akkordtöne auf betonten Zählzeiten, sonst Schritte; heldenhafte Quart-/Quintsprünge
      var rh = letzter ? [[0, 4]] : w(RHYTHMEN[stimmung]);
      if(stimmung === "tief" && k % 2 === 1) rh = [];
      var akkTon = mLeiter.filter(function(m){ return akk.some(function(c){ return SC.mod(m - c, 12) === 0; }); });
      if(!akkTon.length) akkTon = mLeiter;
      rh.forEach(function(r, i){
        if(i === 0){
          var ziel = stimmung === "tag" && zf() < 0.3 ? ton + w([5, 7]) : ton + w([-2, 0, 2]);
          ton = letzter ? naechster(mLeiter.filter(function(m){ return SC.mod(m - grund, 12) === 0; }), ton) : naechster(akkTon, ziel);
        } else {
          var idx = mLeiter.indexOf(ton), sch = w([-2, -1, 1, 1, 2]);
          ton = mLeiter[Math.max(0, Math.min(mLeiter.length - 1, idx + sch))];
        }
        n(t0 + r[0], r[1], melInstr, ton, stimmung === "tag" ? 0.55 : 0.4, "melodie");
      });
    }
    return { stimmung: stimmung, tempo: tempo, grundton: grund, moll: moll, schlaege: takte * 4, events: ev };
  };
})();
