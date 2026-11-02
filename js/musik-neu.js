// Neuer Komponist (Entwurf, noch nicht im Spiel – Hörprobe: tests/musik.html).
// Statt Zufallsmelodie: ein Motiv, das den Akkorden folgt, in Frage-/Antwort-Phrasen, Form A–A′–B–A″, Dynamik.
// Liefert dasselbe Ereignisformat wie SC.Musik.komponiere (t, dauer in Schlägen), dazu form[] und motiv.
SC.MusikNeu = {};
(function(){
  var MODI = {
    dur: [0, 2, 4, 5, 7, 9, 11], moll: [0, 2, 3, 5, 7, 8, 10], dorisch: [0, 2, 3, 5, 7, 9, 10],
    mixo: [0, 2, 4, 5, 7, 9, 10], lydisch: [0, 2, 4, 6, 7, 9, 11]
  };
  var CODE = { tag: 1, nacht: 2, tief: 3, kampf: 4, boss: 5, glutfrost: 6, rankenmoor: 7, all: 8 };
  var VOLL = ["A", "A2", "B", "A3"];
  var KONF = {
    tag:        { modus: "dur",     grund: [62, 60, 58], tempo: [100, 112], mitte: 5,  form: VOLL },
    nacht:      { modus: "moll",    grund: [57, 62, 55], tempo: [66, 74],   mitte: 4,  form: VOLL },
    tief:       { modus: "moll",    grund: [52, 55],     tempo: [58, 64],   mitte: -3, form: VOLL },
    kampf:      { modus: "moll",    grund: [57, 55, 52], tempo: [124, 132], mitte: 5,  form: ["A", "B"], schleife: true },
    boss:       { modus: "moll",    grund: [55, 52, 50], tempo: [130, 138], mitte: 4,  form: ["A", "B"], schleife: true },
    glutfrost:  { modus: "mixo",    grund: [55, 57],     tempo: [92, 100],  mitte: 4,  form: VOLL },
    rankenmoor: { modus: "dorisch", grund: [58, 62],     tempo: [84, 92],   mitte: 5,  form: VOLL },
    all:        { modus: "lydisch", grund: [60, 58],     tempo: [54, 60],   mitte: 7,  form: VOLL }
  };
  // Motive: [Stufen über dem Akkord-Grundton (0 Grundton, 2 Terz, 4 Quinte, 7 Oktave), Dauer in Schlägen], zusammen ein Takt
  var MOTIVE = {
    tag:        [[[0, 1.5], [4, 0.5], [3, 1], [2, 1]], [[0, 1], [2, 0.5], [4, 0.5], [7, 2]], [[0, 0.5], [0, 0.5], [4, 1], [3, 0.5], [2, 0.5], [4, 1]]],
    nacht:      [[[0, 2], [1, 1], [-1, 1]], [[2, 1], [0, 1], [1, 2]], [[4, 2], [3, 1], [2, 1]]],
    tief:       [[[0, 1], [0, 1], [1, 2]], [[0, 2], [-1, 2]]],
    kampf:      [[[0, 0.5], [0, 0.5], [2, 1], [0, 0.5], [-1, 0.5], [0, 1]], [[0, 1], [2, 0.5], [0, 0.5], [4, 2]]],
    boss:       [[[0, 1], [0, 1], [1, 1], [0, 1]], [[0, 0.5], [1, 0.5], [0, 0.5], [-1, 0.5], [0, 2]]],
    glutfrost:  [[[0, 2], [4, 1], [3, 1]], [[0, 1], [0, 1], [4, 2]]],
    rankenmoor: [[[0, 1 / 3], [2, 1 / 3], [4, 1 / 3], [3, 1], [2, 1], [0, 1]], [[0, 1], [2, 1 / 3], [1, 1 / 3], [0, 1 / 3], [2, 2]]],
    all:        [[[0, 3], [4, 1]], [[0, 2], [2, 2]]]
  };
  var MOTIVE_LUSTIG = [[[0, 0.5], [2, 0.5], [0, 0.5], [-1, 0.5], [0, 1], [4, 1]], [[0, 0.5], [0, 0.5], [4, 1], [2, 0.5], [0, 0.5], [1, 1]]];
  // Melodie-Instrumente je Abschnitt: [Instrument, Oktavversatz in Halbtönen]
  var MEL = {
    tag:        { A: [["horn", 0]], A2: [["blech", 0]], B: [["floete", 0]], A3: [["blech", 0], ["horn", -12]] },
    nacht:      { A: [["celesta", 0]], A2: [["floete", 0]], B: [["horn", 0]], A3: [["horn", 0], ["celesta", 12]] },
    tief:       { A: [["horn", 0]], A2: [["horn", 0]], B: [["horn", 0]], A3: [["horn", 0], ["blech", -12]] },
    kampf:      { A: [["blech", 0]], B: [["blech", 0], ["floete", 12]] },
    boss:       { A: [["blech", 0]], B: [["blech", 0], ["blech", -12]] },
    glutfrost:  { A: [["blech", 0]], A2: [["blech", 0], ["horn", -12]], B: [["horn", 0]], A3: [["blech", 0], ["blech", -12]] },
    rankenmoor: { A: [["floete", 0]], A2: [["floete", 0], ["celesta", 12]], B: [["celesta", 0]], A3: [["floete", 0], ["horn", -12]] },
    all:        { A: [["horn", 0]], A2: [["celesta", 0]], B: [["floete", 0]], A3: [["horn", 0], ["floete", 12]] }
  };
  var MEL_LUSTIG = { A: [["floete", 0]], B: [["blech", 0], ["floete", 12]] };
  // Akkordfolgen als Stufen der Tonleiter (0 = Tonika, 4 = Dominante); Frage endet auf der Dominante, Antwort auf der Tonika
  var PROG = {
    frage: [[0, 5, 3, 4], [0, 3, 5, 4], [0, 2, 3, 4]], antwort: [[0, 5, 3, 0], [0, 3, 4, 0], [0, 3, 1, 0]],
    b1: [[5, 3, 5, 4], [3, 2, 5, 4]], b2: [[3, 4, 5, 4], [5, 4, 3, 4]]
  };

  function inOktave(m, von){ while(m < von) m += 12; while(m >= von + 12) m -= 12; return m; }
  // Motiv-Abwandlungen
  function senke(m){ return m.map(function(x){ return [x[0] > 0 ? x[0] - 7 : x[0], x[1]]; }); }          // obere Töne eine Oktave tiefer
  function hoch(m){ var k = m.map(function(x){ return [x[0], x[1]]; }); k[k.length - 1][0] += 2; return k; }  // Schlusston höher
  var HALBSCHLUSS = [[2, 2], [0, 2]], GANZSCHLUSS = [[2, 1], [1, 1], [0, 2]], ENDE = [[0, 4]];

  function taktMelodie(typ, b, motiv, ende){
    if(typ === "frage") return b === 3 ? HALBSCHLUSS : b === 2 ? hoch(motiv) : motiv;
    if(typ === "antwort") return b === 3 ? (ende ? ENDE : GANZSCHLUSS) : b === 1 ? senke(motiv) : motiv;
    return b === 3 ? HALBSCHLUSS : b === 2 ? [[0, 2], [2, 2]] : senke(motiv);   // B-Teil: ruhiger, abwärts
  }

  SC.MusikNeu.stimmungen = Object.keys(KONF);

  SC.MusikNeu.komponiere = function(seed, stimmung, opt){
    opt = opt || {};
    var K = KONF[stimmung] || KONF.tag, code = CODE[stimmung] || 1, modus = MODI[K.modus];
    var lustig = stimmung === "kampf" && opt.kampfart === "lustig";
    var zf = SC.zufall(SC.hash3(seed >>> 0, code, 9001)), w = function(l){ return l[Math.floor(zf() * l.length)]; };
    var zt = SC.zufall(SC.hash3((opt.thema === undefined ? seed : opt.thema) >>> 0, code, 31337));   // Thema: aus der Welt, nicht vom Stück
    var katalog = lustig ? MOTIVE_LUSTIG : MOTIVE[stimmung] || MOTIVE.tag, motiv = katalog[Math.floor(zt() * katalog.length)];
    var grund = w(K.grund), tempo = lustig ? 104 + Math.floor(zf() * 6) : K.tempo[0] + Math.floor(zf() * (K.tempo[1] - K.tempo[0] + 1));
    var mel = lustig ? MEL_LUSTIG : MEL[stimmung] || MEL.tag;
    function ton(k){ return grund + 12 * Math.floor(k / 7) + modus[SC.mod(k, 7)]; }

    var phrasen = [];
    K.form.forEach(function(s){ if(s === "B") phrasen.push([s, "b1"], [s, "b2"]); else phrasen.push([s, "frage"], [s, "antwort"]); });
    var ev = [], form = [], kVor = K.mitte, ersterTakt = {};
    function n(t, dauer, instrument, midi, vel, stimme){ ev.push({ t: t, dauer: dauer, instrument: instrument, midi: midi, vel: vel, stimme: stimme || "begleitung" }); }
    function dyn(sec, ib){ return K.schleife ? 0.85 + 0.02 * ib : sec === "A" ? 0.62 + 0.02 * ib : sec === "A2" ? 0.8 + 0.02 * ib : sec === "B" ? 0.5 + 0.06 * ib : 1; }

    phrasen.forEach(function(p, pi){
      var sec = p[0], typ = p[1], letzte = pi === phrasen.length - 1, ende = letzte && !K.schleife;
      var prog = w(PROG[typ]), voll = sec === "A2" || sec === "A3", lift = sec === "A2" ? 2 : sec === "A3" ? 1 : 0;
      if(ersterTakt[sec] === undefined){ ersterTakt[sec] = pi * 4; form.push({ name: sec, takt: pi * 4, takte: 0 }); }
      form[form.length - 1].takte += 4;
      for(var b = 0; b < 4; b++){
        var takt = pi * 4 + b, t0 = takt * 4, ib = takt - ersterTakt[sec], d = prog[b], dy = dyn(sec, ib);
        var lage = [ton(d), ton(d + 2), ton(d + 4)].map(function(m){ return inOktave(m, stimmung === "tief" ? 43 : 55); });
        var bass = inOktave(ton(d), stimmung === "tief" ? 28 : 36);
        // ----- Begleitung -----
        if(stimmung === "tag"){
          lage.forEach(function(m){ n(t0, 4, "streicher", m, 0.26 * dy); });
          n(t0, 2, "streicher", bass, 0.38 * dy); n(t0 + 2, 2, "streicher", bass + 7, 0.32 * dy);
          if(voll){
            n(t0 + 1, 0.4, "blech", lage[1] + 12, 0.22 * dy); n(t0 + 3, 0.4, "blech", lage[2] + 12, 0.22 * dy);
            n(t0, 0.8, "pauke", inOktave(ton(d), 38), 0.55 * dy); n(t0 + 2, 0.8, "pauke", inOktave(ton(d + 4), 38), 0.4 * dy);
            [0, 1, 1.5, 2, 3, 3.5].forEach(function(x){ n(t0 + x, 0.2, "trommel", 60, (x % 1 ? 0.16 : 0.26) * dy); });
          } else if(sec === "B"){
            for(var h = 0; h < 8; h++) n(t0 + h * 0.5, 1.2, "harfe", lage[h % 3] + (h >= 3 && h < 6 ? 12 : 0), 0.28 * dy);
            if(ib >= 6) for(var q = 0; q < 4; q++) n(t0 + q, 0.6, "pauke", inOktave(ton(d), 38), (0.25 + 0.1 * (ib - 6)) * dy);
          } else if(ib % 2 === 0) n(t0, 0.8, "pauke", inOktave(ton(d), 38), 0.4 * dy);
        } else if(stimmung === "nacht" || stimmung === "all"){
          var leise = stimmung === "all" ? 0.2 : 0.22;
          lage.forEach(function(m){ n(t0, 4, "streicher", m, leise * dy); });
          n(t0, 4, "streicher", bass, 0.28 * dy);
          if(stimmung === "nacht") for(var h2 = 0; h2 < 8; h2++) n(t0 + h2 * 0.5, 1.2, "harfe", lage[h2 % 3] + (h2 >= 3 && h2 < 6 ? 12 : 0), 0.26 * dy);
          else { n(t0, 4, "streicher", bass + 7, 0.18 * dy); for(var s2 = 0; s2 < 3; s2++) n(t0 + 0.5 + zf() * 3, 1.5, "celesta", lage[s2] + 12, 0.16 * dy); }
          if(voll && ib % 4 === 0) n(t0, 1.5, "pauke", inOktave(ton(d), 38), 0.25 * dy);
        } else if(stimmung === "tief"){
          for(var o = 0; o < 8; o++) n(t0 + o * 0.5, 0.45, "streicher", o === 7 ? bass + 1 : bass, (o % 2 ? 0.28 : 0.4) * dy);
          n(t0, 4, "streicher", inOktave(ton(d + 4), 40), 0.18 * dy);
          if(sec === "B") for(var r = 0; r < 16; r++) n(t0 + r * 0.25, 0.3, "pauke", inOktave(ton(d), 36), (0.1 + r * 0.02) * dy);
          else if(ib % 2 === 0) n(t0, 1, "pauke", inOktave(ton(d), 36), 0.5 * dy);
          if(sec === "A3") n(t0, 2, "blech", inOktave(ton(d), 43), 0.25 * dy);
        } else if(stimmung === "glutfrost"){
          n(t0, 3.6, "blech", inOktave(ton(d), 40), 0.3 * dy); n(t0, 3.6, "blech", inOktave(ton(d + 4), 40), 0.24 * dy);
          for(var g = 0; g < 4; g++) n(t0 + g, 0.8, "streicher", bass, (g === 0 ? 0.42 : 0.28) * dy);
          n(t0, 0.9, "pauke", inOktave(ton(d), 36), 0.6 * dy); n(t0 + 2.5, 0.6, "pauke", inOktave(ton(d), 36), 0.45 * dy); n(t0 + 3.5, 0.6, "pauke", inOktave(ton(d), 36), 0.4 * dy);
          if(voll) [1, 3].forEach(function(x){ n(t0 + x, 0.15, "trommel", 60, 0.28 * dy); });
        } else if(stimmung === "rankenmoor"){
          lage.forEach(function(m){ n(t0, 4, "streicher", m, 0.18 * dy); });
          for(var hh = 0; hh < 12; hh++) n(t0 + hh / 3, 0.9, "harfe", lage[hh % 3] + (hh % 6 >= 3 ? 12 : 0), (hh % 3 ? 0.2 : 0.3) * dy);
          n(t0, 2, "streicher", bass, 0.3 * dy);
          if(voll) [1, 3].forEach(function(x){ n(t0 + x, 0.15, "trommel", 60, 0.2 * dy); });
        } else if(lustig){
          // Oom-pah: Bass auf 1 und 3, Akkord-Tupfer auf 2 und 4 – tapsig-bedrohlich
          [0, 2].forEach(function(x){ n(t0 + x, 0.35, "blech", inOktave(ton(d), 36) + (x ? 7 : 0), 0.45 * dy); n(t0 + x, 0.5, "pauke", inOktave(ton(d), 36), 0.5 * dy); });
          [1, 3].forEach(function(x){ lage.forEach(function(m){ n(t0 + x, 0.25, "streicher", m, 0.26 * dy); }); n(t0 + x, 0.12, "trommel", 60, 0.24 * dy); });
          if(b === 3) [0.5, 1.5, 2.5, 3.5].forEach(function(x){ n(t0 + x, 0.2, "trommel", 60, 0.14 * dy); });
        } else {   // Kampf und Boss, treibend
          for(var e = 0; e < 8; e++) n(t0 + e * 0.5, 0.42, "streicher", e % 4 === 3 ? bass + 7 : bass, (e % 2 ? 0.3 : 0.45) * dy);
          lage.forEach(function(m){ n(t0, 2, "streicher", m, 0.22 * dy); n(t0 + 2, 2, "streicher", m, 0.22 * dy); });
          for(var pk = 0; pk < 4; pk++) n(t0 + pk, 0.6, "pauke", inOktave(ton(d), 36), (pk === 0 ? 0.7 : 0.45) * dy);
          for(var tr = 0; tr < 8; tr++) n(t0 + tr * 0.5, 0.15, "trommel", 60, (tr % 2 ? 0.15 : 0.25) * dy);
          if(stimmung === "boss"){ n(t0, 1, "blech", inOktave(ton(d), 43), 0.4 * dy); n(t0 + 2, 1, "blech", inOktave(ton(d), 43), 0.35 * dy); if(b === 3) for(var rw = 0; rw < 8; rw++) n(t0 + 2 + rw * 0.25, 0.3, "pauke", inOktave(ton(d), 36), (0.3 + rw * 0.05) * dy); }
        }
        // ----- Melodie: Motiv folgt dem Akkord-Grundton -----
        if(stimmung === "tief" && b % 2 === 1) continue;
        var kA = d + 7 * Math.round((kVor - d) / 7), mitte = K.mitte + lift;
        while(kA > mitte + 3) kA -= 7; while(kA < mitte - 4) kA += 7;
        kVor = kA;
        var pos = 0, notiz = taktMelodie(typ, b, motiv, ende), insts = mel[sec] || mel.A;
        notiz.forEach(function(x){
          insts.forEach(function(ins, i){ n(t0 + pos, lustig ? x[1] * 0.6 : x[1], ins[0], ton(kA + x[0]) + ins[1], (i ? 0.3 : 0.55) * dy * (stimmung === "nacht" || stimmung === "tief" || stimmung === "all" ? 0.75 : 1), "melodie"); });
          pos += x[1];
        });
      }
    });
    var moll = K.modus === "moll" || K.modus === "dorisch";
    return { stimmung: stimmung, tempo: tempo, grundton: grund, moll: moll, modus: K.modus, schlaege: phrasen.length * 16, events: ev, form: form, motiv: motiv, lustig: lustig };
  };
})();
