// Tiergeräusche (#185): die Alternative zu den Namensrufen (js/tiernamen.js), Einstellung "Tierstimmen" → "Tiergeräusche". Stimme je Art in SC.TIERE[art].laut (js/tiere.js),
// aufgerufen von SC.Klang.tierlaut (js/tiernamen.js).
// Formant-Synthese: eine Stimmquelle (Sägezahn mit Vibrato und Zittern) und/oder Rauschen läuft durch bewegliche Resonanzfilter (Formanten),
// dazu Tonhöhenverlauf, Amplituden-Zittern (AM) und Hauch. Jeder Aufruf variiert die Tonhöhe leicht, damit sich nichts wie ein Sample wiederholt.
// Stimmen haben die Form (ctx, ziel, startzeit, lautstärke, tonhöhe-Faktor) → Dauer in s.
SC.Klang = SC.Klang || {};
(function(){
  var rp = null;
  function rauschPuffer(c){
    if(rp && rp.sampleRate === c.sampleRate) return rp;
    var b = c.createBuffer(1, c.sampleRate, c.sampleRate), d = b.getChannelData(0), zf = SC.zufall(4711);
    for(var i = 0; i < d.length; i++) d[i] = zf() * 2 - 1;
    return (rp = b);
  }
  // Wert über die Zeit: pts = [[Sekunde, Wert], …], linear, alle Werte mal faktor
  function kurve(param, pts, t, faktor){
    param.setValueAtTime(pts[0][1] * faktor, t);
    for(var i = 1; i < pts.length; i++) param.linearRampToValueAtTime(pts[i][1] * faktor, t + pts[i][0]);
  }
  // Eine Silbe. o: quelle ("sawtooth"|"square"|"triangle"|"sine"|"noise"), f (Tonhöhenverlauf), dauer, v, an/ab (Einschwingen/Ausklingen in s),
  // vib [Hz, Tiefe in Hz], am [Hz, Tiefe 0..1], rausch (Hauchanteil 0..1), formanten [{f: Verlauf, q, g}], p (Tonhöhe-Faktor)
  function silbe(c, z, t, o){
    var p = o.p || 1, d = o.dauer, an = o.an || 0.02, ab = o.ab || d * 0.4, ende = t + d + 0.06;
    var master = c.createGain(); master.gain.setValueAtTime(0.0001, t); master.gain.linearRampToValueAtTime(o.v, t + an);
    master.gain.setValueAtTime(o.v, t + Math.max(an, d - ab)); master.gain.exponentialRampToValueAtTime(0.0001, t + d); master.connect(z);
    var ziel = master;
    if(o.am){   // Zittern der Lautstärke (Meckern, Rollen, Knurren)
      var amg = c.createGain(), lfo = c.createOscillator(), lg = c.createGain(); amg.gain.value = 1 - o.am[1] / 2; lfo.frequency.value = o.am[0]; lg.gain.value = o.am[1] / 2;
      lfo.connect(lg); lg.connect(amg.gain); lfo.start(t); lfo.stop(ende); amg.connect(master); ziel = amg;
    }
    var bus = c.createGain(), fs = o.formanten || [];
    if(fs.length) fs.forEach(function(fm){
      var bp = c.createBiquadFilter(), g = c.createGain(); bp.type = "bandpass"; bp.Q.value = fm.q || 4; kurve(bp.frequency, fm.f, t, Math.sqrt(p)); g.gain.value = fm.g == null ? 1 : fm.g;
      bus.connect(bp); bp.connect(g); g.connect(ziel);
    }); else bus.connect(ziel);
    if(o.quelle !== "noise"){
      var os = c.createOscillator(); os.type = o.quelle || "sawtooth"; kurve(os.frequency, o.f, t, p);
      if(o.vib){ var vl = c.createOscillator(), vg = c.createGain(); vl.frequency.value = o.vib[0]; vg.gain.value = o.vib[1] * p; vl.connect(vg); vg.connect(os.frequency); vl.start(t); vl.stop(ende); }
      os.connect(bus); os.start(t); os.stop(ende);
    }
    if(o.quelle === "noise" || o.rausch){
      var ns = c.createBufferSource(), ng = c.createGain(); ns.buffer = rauschPuffer(c); ng.gain.value = o.quelle === "noise" ? 1 : o.rausch;
      ns.connect(ng); ng.connect(bus); ns.start(t, Math.random() * 0.5, d + 0.1);
    }
    return d;
  }
  // Kurze Klicks (Krabbe, Knistern): n Stück, jeder ein kurzer Stoß durch einen scharfen Resonanzfilter
  function klicks(c, z, t, n, abstand, f, v, streu){
    for(var i = 0; i < n; i++){
      var ti = t + i * abstand + (streu ? Math.random() * streu : 0), ns = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
      ns.buffer = rauschPuffer(c); bp.type = "bandpass"; bp.frequency.value = f * (0.85 + Math.random() * 0.3); bp.Q.value = 9;
      g.gain.setValueAtTime(v * (0.5 + Math.random() * 0.5), ti); g.gain.exponentialRampToValueAtTime(0.0001, ti + 0.025);
      ns.connect(bp); bp.connect(g); g.connect(z); ns.start(ti, Math.random() * 0.5, 0.05);
    }
    return n * abstand;
  }
  function S(c, z, t, v, p, o){ o.v = v; o.p = p; return silbe(c, z, t, o); }

  SC.Klang.TIERGERAEUSCHE = {
    // Hase/Eichhörnchen: zwei helle, kurze Quietscher, der zweite etwas höher
    fiep: function(c, z, t, v, p){
      S(c, z, t, v * 0.22, p, { quelle: "square", f: [[0, 2700], [0.05, 3700], [0.1, 3300]], dauer: 0.1, an: 0.008, formanten: [{ f: [[0, 3400]], q: 5 }], vib: [38, 90] });
      S(c, z, t + 0.15, v * 0.2, p, { quelle: "square", f: [[0, 2900], [0.06, 4000], [0.12, 3500]], dauer: 0.12, an: 0.008, formanten: [{ f: [[0, 3600]], q: 5 }], vib: [38, 90] }); return 0.3;
    },
    // Frosch: rollendes „rrribb“ – tiefer Puls mit schnellem Zittern, Formanten wandern nach oben
    quaken: function(c, z, t, v, p){
      S(c, z, t, v * 0.5, p, { quelle: "sawtooth", f: [[0, 140], [0.18, 105]], dauer: 0.22, an: 0.01, am: [48, 0.9], formanten: [{ f: [[0, 380], [0.2, 520]], q: 5 }, { f: [[0, 1100], [0.2, 1500]], q: 4, g: 0.7 }] });
      S(c, z, t + 0.27, v * 0.45, p, { quelle: "sawtooth", f: [[0, 150], [0.12, 110]], dauer: 0.14, an: 0.01, am: [48, 0.9], formanten: [{ f: [[0, 400], [0.12, 560]], q: 5 }, { f: [[0, 1200], [0.12, 1600]], q: 4, g: 0.7 }] }); return 0.5;
    },
    // Katze: „mi-a-u“ – Vokalfarbe wandert von i über a nach u, Tonhöhe steigt und fällt, leichtes Vibrato und Hauch
    miau: function(c, z, t, v, p){
      return S(c, z, t, v * 0.55, p, { quelle: "sawtooth", f: [[0, 470], [0.12, 640], [0.3, 820], [0.5, 660], [0.65, 480]], dauer: 0.68, an: 0.04, ab: 0.3, vib: [6, 14], rausch: 0.12,
        formanten: [{ f: [[0, 420], [0.25, 900], [0.5, 720], [0.68, 380]], q: 6 }, { f: [[0, 2300], [0.25, 1500], [0.5, 1100], [0.68, 900]], q: 5, g: 0.7 }, { f: [[0, 3200]], q: 6, g: 0.25 }] });
    },
    // Hund: zwei knappe „Wau“ – Stoß Rauschen am Anfang, Tonhöhe fällt, Vokal von a nach o
    bellen: function(c, z, t, v, p){
      for(var i = 0; i < 2; i++){
        var ti = t + i * 0.24;
        S(c, z, ti, v * 0.55, p, { quelle: "sawtooth", f: [[0, 360 - i * 20], [0.05, 330], [0.16, 210]], dauer: 0.18, an: 0.008, ab: 0.1, rausch: 0.35,
          formanten: [{ f: [[0, 650], [0.16, 480]], q: 6 }, { f: [[0, 1150], [0.16, 850]], q: 5, g: 0.7 }, { f: [[0, 2600]], q: 4, g: 0.2 }] });
      }
      return 0.5;
    },
    // Eule: weiches, hohles „hu-huuu“ – fast reiner Ton mit Hauch und langsamem Vibrato
    uhu: function(c, z, t, v, p){
      S(c, z, t, v * 0.55, p, { quelle: "triangle", f: [[0, 400], [0.1, 450], [0.3, 410]], dauer: 0.3, an: 0.07, ab: 0.14, vib: [5, 5], rausch: 0.08, formanten: [{ f: [[0, 520]], q: 3 }] });
      S(c, z, t + 0.42, v * 0.6, p, { quelle: "triangle", f: [[0, 360], [0.2, 350], [0.6, 300]], dauer: 0.7, an: 0.09, ab: 0.4, vib: [5, 6], rausch: 0.1, formanten: [{ f: [[0, 480]], q: 3 }] }); return 1.1;
    },
    // Pinguin: schnelles, krächzendes Schnattern – abwechselnd hohe und tiefe Silben
    schnattern: function(c, z, t, v, p){
      for(var i = 0; i < 6; i++) S(c, z, t + i * 0.085, v * 0.4, p, { quelle: "sawtooth", f: [[0, 520 + (i % 2) * 140], [0.06, 400 + (i % 2) * 100]], dauer: 0.07, an: 0.006, ab: 0.04, rausch: 0.3, formanten: [{ f: [[0, 800], [0.07, 600]], q: 5 }, { f: [[0, 1700]], q: 4, g: 0.6 }] });
      return 0.55;
    },
    // Schaf: „määäh“ – Blöken mit schnellem Zittern der Lautstärke, Vokal von e nach ä
    maeh: function(c, z, t, v, p){
      return S(c, z, t, v * 0.5, p, { quelle: "sawtooth", f: [[0, 330], [0.1, 300], [0.55, 270], [0.75, 230]], dauer: 0.8, an: 0.05, ab: 0.3, am: [26, 0.7], vib: [7, 8], rausch: 0.1,
        formanten: [{ f: [[0, 520], [0.3, 860], [0.75, 700]], q: 7 }, { f: [[0, 1900], [0.3, 1400], [0.75, 1300]], q: 5, g: 0.6 }] });
    },
    // Bär/Rentier: tiefes Brummen mit Rollen
    brummen: function(c, z, t, v, p){
      return S(c, z, t, v * 0.7, p, { quelle: "sawtooth", f: [[0, 105], [0.25, 95], [0.7, 72]], dauer: 0.75, an: 0.08, ab: 0.35, am: [14, 0.5], vib: [4, 3], rausch: 0.2,
        formanten: [{ f: [[0, 250], [0.7, 190]], q: 4 }, { f: [[0, 520], [0.7, 420]], q: 4, g: 0.6 }] });
    },
    // Leuchtkäfer/Libelle: Zirpen – kurze Töne mit schnellem Zittern, mehrere dicht hintereinander
    zirpen: function(c, z, t, v, p){
      for(var i = 0; i < 4; i++) S(c, z, t + i * 0.07, v * 0.2, p, { quelle: "sine", f: [[0, 4300 + i * 60], [0.05, 4500 + i * 60]], dauer: 0.05, an: 0.005, ab: 0.02, am: [180, 0.9], formanten: [{ f: [[0, 4400]], q: 3 }] });
      return 0.32;
    },
    // Papagei: schrilles „kraah“ mit Krächzen; der zweite Schrei fällt ab
    kreischen: function(c, z, t, v, p){
      S(c, z, t, v * 0.35, p, { quelle: "sawtooth", f: [[0, 1100], [0.08, 1900], [0.25, 1500]], dauer: 0.3, an: 0.01, ab: 0.15, vib: [55, 70], rausch: 0.3, formanten: [{ f: [[0, 1500], [0.25, 1100]], q: 6 }, { f: [[0, 2900]], q: 5, g: 0.6 }] });
      S(c, z, t + 0.38, v * 0.3, p, { quelle: "sawtooth", f: [[0, 1700], [0.2, 1000]], dauer: 0.25, an: 0.01, ab: 0.15, vib: [55, 70], rausch: 0.3, formanten: [{ f: [[0, 1600], [0.2, 1000]], q: 6 }, { f: [[0, 2800]], q: 5, g: 0.6 }] }); return 0.7;
    },
    // Chamäleon: leises Fauchen
    zischen: function(c, z, t, v, p){
      return S(c, z, t, v * 0.3, p, { quelle: "noise", f: [[0, 1]], dauer: 0.5, an: 0.08, ab: 0.3, formanten: [{ f: [[0, 5000], [0.5, 4200]], q: 1.2 }, { f: [[0, 8500]], q: 1, g: 0.5 }] });
    },
    // Jaguar: tiefes, rollendes Knurren
    knurren: function(c, z, t, v, p){
      return S(c, z, t, v * 0.8, p, { quelle: "sawtooth", f: [[0, 85], [0.3, 70], [0.9, 58]], dauer: 0.95, an: 0.1, ab: 0.4, am: [32, 0.85], vib: [3, 3], rausch: 0.35,
        formanten: [{ f: [[0, 230]], q: 4 }, { f: [[0, 480], [0.9, 360]], q: 4, g: 0.7 }, { f: [[0, 900]], q: 3, g: 0.25 }] });
    },
    // Faultier: gedehntes, hohes „aiii-aiii“ – zwei sanfte Töne, der erste steigt, der zweite fällt
    pfeifen: function(c, z, t, v, p){
      S(c, z, t, v * 0.3, p, { quelle: "sawtooth", f: [[0, 1100], [0.35, 1700]], dauer: 0.45, an: 0.1, ab: 0.2, vib: [5, 18], rausch: 0.06, formanten: [{ f: [[0, 900], [0.4, 2000]], q: 6 }, { f: [[0, 2800]], q: 4, g: 0.4 }] });
      S(c, z, t + 0.6, v * 0.28, p, { quelle: "sawtooth", f: [[0, 1700], [0.5, 1050]], dauer: 0.6, an: 0.1, ab: 0.3, vib: [5, 18], rausch: 0.06, formanten: [{ f: [[0, 2000], [0.55, 900]], q: 6 }, { f: [[0, 2800]], q: 4, g: 0.4 }] }); return 1.2;
    },
    // Lavakrabbe: trockenes Klackern
    klacken: function(c, z, t, v, p){ return klicks(c, z, t, 4, 0.085, 2300 * p, v * 0.6, 0.02); },
    // Glutsalamander: dichtes Knistern wie Feuer, unregelmäßig
    knistern: function(c, z, t, v, p){ return klicks(c, z, t, 14, 0.04, 3600 * p, v * 0.4, 0.05); },
    // Igel/Schildkröte: zwei kurze Atemstöße
    schnaufen: function(c, z, t, v, p){
      S(c, z, t, v * 0.4, p, { quelle: "noise", f: [[0, 1]], dauer: 0.22, an: 0.04, ab: 0.15, formanten: [{ f: [[0, 900], [0.22, 1500]], q: 1.5 }] });
      S(c, z, t + 0.3, v * 0.36, p, { quelle: "noise", f: [[0, 1]], dauer: 0.25, an: 0.04, ab: 0.18, formanten: [{ f: [[0, 1000], [0.25, 1400]], q: 1.5 }] }); return 0.58;
    },
    // Affe: aufgeregtes „u-u-aah“ – drei Silben, jede höher
    juchzen: function(c, z, t, v, p){
      for(var i = 0; i < 3; i++) S(c, z, t + i * 0.19, v * 0.45, p, { quelle: "sawtooth", f: [[0, 420 + i * 90], [0.1, 760 + i * 120]], dauer: 0.16 + i * 0.03, an: 0.012, ab: 0.09, vib: [8, 14], rausch: 0.1,
        formanten: [{ f: [[0, 350], [0.12, 750]], q: 6 }, { f: [[0, 900], [0.12, 1300]], q: 5, g: 0.7 }] });
      return 0.65;
    },
    // Schmetterling: kaum hörbares Flügelflattern
    flattern: function(c, z, t, v, p){
      return S(c, z, t, v * 0.25, p, { quelle: "noise", f: [[0, 1]], dauer: 0.4, an: 0.05, ab: 0.2, am: [24, 0.95], formanten: [{ f: [[0, 1800], [0.4, 2400]], q: 1.5 }] });
    }
  };
  // Wie SC.Klang.tierlaut, mit zufälliger Abweichung der Tonhöhe (±4 %)
  SC.Klang.tiergeraeusch = function(ctx, z, t, o, v){
    var st = SC.Klang.TIERGERAEUSCHE[o.stimme]; if(!st) return;
    var e = o.entfernung || 0, lt = v * Math.max(0.1, 1 - e / 28), wie = o.wie || "ruf", zufall = 1 + (Math.random() - 0.5) * 0.08;
    var p = (o.hoehe || 1) * zufall * (wie === "freude" ? 1.15 : wie === "schreck" ? 1.4 : wie === "ko" ? 0.75 : 1);
    var d = st(ctx, z, t, lt, p);
    if(wie === "freude") st(ctx, z, t + Math.max(0.3, d) + 0.05, lt * 0.8, p * 1.08);
  };
})();
