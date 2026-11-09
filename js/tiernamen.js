// Tiere rufen ihren Namen (#185): statt Tiergeräuschen sagt jedes Tier seine Art, hoch und mehrfach wie bei Pokémon. Hörprobe: tests/tiernamen.html.
// Abgespielt als Geräusch "tierlaut" (SC.Klang.erzeuge in js/audio.js), Auslöser in js/haustiere.js.
// Eigene kleine Sprachsynthese (Formant-Synthese, wie ein Klatt-Synthesizer in klein): Ein Stimmton (Sägezahn mit Vibrato) läuft durch drei bewegliche
// Resonanzfilter (F1–F3), die dem Wort Laut für Laut folgen; Zisch- und Verschlusslaute kommen aus gefiltertem Rauschen. Alles wird im Code berechnet,
// deshalb klingt es auf jedem Gerät gleich. Jedes Tier hat eigene Stimmwerte (Tonhöhe, Formant-Faktor = Kopfgröße, Tempo, Vibrato).
SC.Klang = SC.Klang || {};
(function(){
  // --- Laute: Vokale [F1, F2, F3, Dauer]; Diphthonge mit zwei Zielen ---
  var V = {
    "a": [[800, 1250, 2700], 0.09], "a:": [[800, 1250, 2700], 0.18], "e": [[420, 2100, 2800], 0.09], "e:": [[350, 2200, 2900], 0.18], "E": [[600, 1850, 2650], 0.10], "E:": [[560, 1900, 2650], 0.18],
    "i": [[300, 2250, 3000], 0.08], "i:": [[280, 2300, 3050], 0.17], "o": [[450, 850, 2650], 0.09], "o:": [[400, 800, 2600], 0.18], "u": [[330, 850, 2500], 0.08], "u:": [[300, 800, 2500], 0.17],
    "O": [[470, 1550, 2400], 0.09], "O:": [[420, 1500, 2350], 0.18], "Y": [[320, 1700, 2150], 0.08], "Y:": [[300, 1750, 2150], 0.17], "@": [[500, 1500, 2500], 0.06], "A": [[650, 1200, 2550], 0.07]
  };
  var DI = { "ai": [[[800, 1250, 2700], [320, 2200, 2900]], 0.2], "au": [[[800, 1250, 2700], [340, 850, 2500]], 0.2], "oy": [[[450, 850, 2650], [320, 1900, 2800]], 0.2] };
  // Sonore: [Formanten, Lautstärke der Stimme, Dauer]
  var S = { "m": [[250, 1100, 2200], 0.55, 0.07], "n": [[250, 1500, 2500], 0.55, 0.07], "N": [[250, 1300, 2300], 0.55, 0.07], "l": [[380, 1100, 2600], 0.8, 0.06], "r": [[450, 1300, 1700], 0.7, 0.06], "j": [[280, 2200, 2900], 0.8, 0.05] };
  // Verschlusslaute: [Rauschfrequenz, Q, stimmhaft]
  var P = { "p": [1000, 0.8, 0], "t": [3200, 0.8, 0], "k": [2000, 0.8, 0], "b": [900, 0.8, 1], "d": [3000, 0.8, 1], "g": [1900, 0.8, 1] };
  // Reibelaute: [Rauschfrequenz, Q, Rauschstärke, Dauer, Stimme]
  var F = { "f": [4200, 0.5, 0.1, 0.09, 0], "s": [5200, 0.6, 0.12, 0.11, 0], "S": [2600, 0.6, 0.16, 0.12, 0], "x": [2800, 0.6, 0.12, 0.1, 0], "C": [4200, 0.7, 0.12, 0.1, 0], "v": [3800, 0.6, 0.07, 0.06, 0.45], "z": [4800, 0.6, 0.09, 0.09, 0.45] };

  var rp = null;
  function rausch(c){
    if(rp && rp.sampleRate === c.sampleRate) return rp;
    var b = c.createBuffer(1, c.sampleRate, c.sampleRate), d = b.getChannelData(0), zf = SC.zufall(8128);
    for(var i = 0; i < d.length; i++) d[i] = zf() * 2 - 1;
    return (rp = b);
  }
  // Zeichenfolge → Teile; "*" vor einem Laut betont ihn, sonst wird der erste Vokal betont; "pf" und "ts" werden zu zwei Lauten
  function zerlege(text){
    var t = text.split(/\s+/).filter(Boolean), out = [], betont = -1, erster = -1;
    t.forEach(function(w){
      var b = w.charAt(0) === "*"; if(b) w = w.slice(1);
      var teile = w === "pf" ? ["p", "f"] : w === "ts" ? ["t", "s"] : [w];
      teile.forEach(function(x){
        var s;
        if(V[x]) s = { k: "v", ziel: [V[x][0]], d: V[x][1] };
        else if(DI[x]) s = { k: "v", ziel: DI[x][0], d: DI[x][1] };
        else if(S[x]) s = { k: "s", ziel: [S[x][0]], g: S[x][1], d: S[x][2] };
        else if(P[x]) s = { k: "p", f: P[x][0], q: P[x][1], stimme: P[x][2], clos: 0.05, burst: x === "p" || x === "t" || x === "k" ? 0.03 : 0.015, d: 0 };
        else if(F[x]) s = { k: "f", f: F[x][0], q: F[x][1], rg: F[x][2], d: F[x][3], g: F[x][4] };
        else if(x === "h") s = { k: "h", d: 0.06 };
        else return;
        if(s.k === "p") s.d = s.clos + s.burst;
        if(s.k === "v"){ if(erster < 0) erster = out.length; if(b) betont = out.length; }
        out.push(s);
      });
    });
    if(betont < 0) betont = erster; if(out[betont]) out[betont].betont = true;
    return out;
  }
  // Spricht ein Wort. st = { f0, form, tempo, vib, am }; → Dauer in s
  function sprich(c, z, t0, text, st, v){
    var segs = zerlege(text), tempo = st.tempo || 1, form = st.form || 1, f0 = st.f0 || 300, t = t0 + 0.02;
    if(!segs.length) return 0;
    segs.forEach(function(s){ if(s.betont) s.d *= 1.3; s.d /= tempo; s.t = t; t += s.d; });
    var ende = t + 0.05, gesamt = ende - t0;
    // Formanten, die ein Konsonant "mitnimmt": die des nächsten (sonst des vorigen) Vokals
    function vokalNah(i){ for(var j = i + 1; j < segs.length; j++) if(segs[j].k === "v") return segs[j].ziel[0]; for(var j2 = i - 1; j2 >= 0; j2--) if(segs[j2].k === "v") return segs[j2].ziel[segs[j2].ziel.length - 1]; return [500, 1500, 2500]; }
    // Master
    var master = c.createGain(); master.gain.setValueAtTime(0.0001, t0); master.gain.linearRampToValueAtTime(v, t0 + 0.02); master.gain.setValueAtTime(v, ende - 0.06); master.gain.linearRampToValueAtTime(0.0001, ende); master.connect(z);
    // Stimme
    var src = c.createOscillator(), voice = c.createGain(), lp = c.createBiquadFilter(), bus = c.createGain();
    src.type = "sawtooth"; lp.type = "lowpass"; lp.frequency.value = 4200; voice.gain.value = 0; src.connect(voice); voice.connect(lp); lp.connect(bus);
    src.frequency.setValueAtTime(f0, t0);
    segs.forEach(function(s, i){ if(s.k !== "v") return; var hoch = s.betont ? 1.16 : 1, schluss = i === segs.length - 1 || segs.slice(i + 1).every(function(x){ return x.k !== "v"; });
      src.frequency.linearRampToValueAtTime(f0 * hoch * (schluss && !s.betont ? 0.93 : 1), s.t + s.d * 0.4); src.frequency.linearRampToValueAtTime(f0 * hoch * (schluss ? 0.9 : 0.98), s.t + s.d); });
    if(st.vib !== 0){ var vl = c.createOscillator(), vg = c.createGain(); vl.frequency.value = 5.6; vg.gain.value = f0 * (st.vib || 0.012); vl.connect(vg); vg.connect(src.frequency); vl.start(t0); vl.stop(ende + 0.05); }
    if(st.am){ var al = c.createOscillator(), ag = c.createGain(); al.frequency.value = st.am[0]; ag.gain.value = st.am[1]; al.connect(ag); ag.connect(voice.gain); al.start(t0); al.stop(ende + 0.05); }
    // drei Formanten
    var fs = [], Q = [5, 8, 10], G = [1, 0.7, 0.35];
    for(var i = 0; i < 3; i++){ var bp = c.createBiquadFilter(), g = c.createGain(); bp.type = "bandpass"; bp.Q.value = Q[i]; g.gain.value = G[i]; bus.connect(bp); bp.connect(g); g.connect(master); fs.push(bp); }
    var erst = segs[0].k === "v" ? segs[0].ziel[0] : vokalNah(0); for(var k = 0; k < 3; k++) fs[k].frequency.setValueAtTime(erst[k] * form, t0);
    // Rauschen (Zischen, Verschlusslösung) und Hauch (h, geht durch die Formanten)
    var ns = c.createBufferSource(), nf = c.createBiquadFilter(), ng = c.createGain(), hg = c.createGain(); ns.buffer = rausch(c); ns.loop = true; nf.type = "bandpass"; ng.gain.value = 0; hg.gain.value = 0;
    ns.connect(nf); nf.connect(ng); ng.connect(master); ns.connect(hg); hg.connect(bus);
    var vg0 = 0; voice.gain.setValueAtTime(0, t0);
    segs.forEach(function(s, i){
      var a = s.t, b = s.t + s.d, nah;
      function stimme(w, bis){ voice.gain.linearRampToValueAtTime(w, bis); }
      function formant(ziel, bis){ for(var k2 = 0; k2 < 3; k2++) fs[k2].frequency.linearRampToValueAtTime(ziel[k2] * form, bis); }
      if(s.k === "v"){
        stimme(s.betont ? 1.15 : 0.9, a + 0.015);
        if(s.ziel.length === 1){ formant(s.ziel[0], a + s.d * 0.4); }
        else { formant(s.ziel[0], a + s.d * 0.25); formant(s.ziel[1], a + s.d * 0.9); }
        voice.gain.setValueAtTime(s.betont ? 1.15 : 0.9, b - 0.012);
      } else if(s.k === "s"){ stimme(s.g, a + 0.015); formant(s.ziel[0], a + s.d * 0.5); voice.gain.setValueAtTime(s.g, b - 0.012); }
      else if(s.k === "p"){
        nah = vokalNah(i); formant(nah, a + s.clos); stimme(s.stimme ? 0.3 : 0.02, a + 0.012); voice.gain.setValueAtTime(s.stimme ? 0.3 : 0.02, a + s.clos);
        nf.frequency.setValueAtTime(s.f * (form > 1 ? Math.sqrt(form) : 1), a + s.clos); nf.Q.setValueAtTime(s.q, a + s.clos);
        ng.gain.setValueAtTime(0, a + s.clos - 0.002); ng.gain.linearRampToValueAtTime(s.stimme ? 0.2 : 0.45, a + s.clos + 0.006); ng.gain.exponentialRampToValueAtTime(0.0001, a + s.clos + s.burst + 0.01);
        if(!s.stimme && s.burst > 0.02){ hg.gain.setValueAtTime(0, a + s.clos); hg.gain.linearRampToValueAtTime(0.5, a + s.clos + 0.006); hg.gain.linearRampToValueAtTime(0, a + s.clos + s.burst + 0.01); }   // Hauch nach p, t, k
        stimme(0.02, b);
      } else if(s.k === "f"){
        nah = vokalNah(i); formant(nah, a + s.d * 0.5); stimme(s.g, a + 0.015); voice.gain.setValueAtTime(s.g, b - 0.012);
        nf.frequency.setValueAtTime(s.f * (form > 1 ? Math.sqrt(form) : 1), a); nf.Q.setValueAtTime(s.q, a);
        var ra = Math.min(0.04, s.d * 0.4); ng.gain.setValueAtTime(0, a); ng.gain.linearRampToValueAtTime(s.rg, a + ra); ng.gain.setValueAtTime(s.rg, b - ra); ng.gain.linearRampToValueAtTime(0, b);
      } else if(s.k === "h"){
        nah = vokalNah(i); formant(nah, a + 0.01); stimme(0.05, a + 0.012); hg.gain.setValueAtTime(0, a); hg.gain.linearRampToValueAtTime(0.9, a + 0.015); hg.gain.setValueAtTime(0.9, b - 0.015); hg.gain.linearRampToValueAtTime(0, b);
      }
    });
    voice.gain.linearRampToValueAtTime(0, ende);
    src.start(t0); src.stop(ende + 0.05); ns.start(t0, 0, gesamt + 0.1); ns.stop(ende + 0.05);
    return gesamt;
  }

  // --- Wörter (Lautschrift: a e i o u, : = lang, E = ä, O = ö, Y = ü, @ = schwa, A = er, S = sch, x = ach, C = ich, N = ng) und Stimmen je Art ---
  SC.Klang.NAMEN = {
    hase: "h a: z @", frosch: "f r o S", katze: "k a ts @", hund: "h u n t", fuchs: "f u k s", eule: "oy l @", igel: "i: g @ l", pinguin: "p i N g u i: n", schneefuchs: "S n e: f u k s",
    glutsalamander: "z a l a m *a n d A", eisbaer: "ai s b E: A", chamaeleon: "k a m *E: l e: o n", schildkroete: "S i l t k r O: t @", leuchtkaefer: "l oy x t k E: f A", affe: "a f @",
    eichhoernchen: "ai C h O A n C @ n", reh: "r e:", schmetterling: "S m E t A l i N", ente: "E n t @", schaf: "S a: f", schneehase: "S n e: h a: z @", robbe: "r o b @", rentier: "r E n t i: A",
    schneeeule: "S n e: oy l @", lavakrabbe: "k r a b @", papagei: "p a p a g *ai", faultier: "f au l t i: A", libelle: "l i b E l @", laubfrosch: "l au p f r o S", jaguar: "j a: g u a:"
  };
  // f0 = Grundton in Hz, form = Formant-Faktor (größer = kleiner/kindlicher Kopf), tempo, vib = Vibrato-Tiefe (Anteil des Grundtons), am = [Hz, Tiefe] Zittern der Lautstärke
  SC.Klang.NAMENSTIMMEN = {
    hase: { f0: 430, form: 1.28, tempo: 1.1 }, schneehase: { f0: 410, form: 1.26, tempo: 1.05 }, eichhoernchen: { f0: 470, form: 1.3, tempo: 1.2 }, igel: { f0: 350, form: 1.15, tempo: 0.95 },
    frosch: { f0: 320, form: 1.1, tempo: 1.0, am: [30, 0.35] }, laubfrosch: { f0: 400, form: 1.2, tempo: 1.1, am: [34, 0.3] }, katze: { f0: 380, form: 1.18, tempo: 1.0, vib: 0.02 },
    fuchs: { f0: 340, form: 1.1, tempo: 1.1 }, schneefuchs: { f0: 360, form: 1.12, tempo: 1.1 }, hund: { f0: 250, form: 0.98, tempo: 1.05 }, reh: { f0: 330, form: 1.05, tempo: 0.95 },
    rentier: { f0: 230, form: 0.95, tempo: 0.95 }, schaf: { f0: 300, form: 1.0, tempo: 0.9, am: [24, 0.5], vib: 0.02 }, eule: { f0: 280, form: 0.98, tempo: 0.85, vib: 0.015 },
    schneeeule: { f0: 300, form: 1.02, tempo: 0.85, vib: 0.015 }, papagei: { f0: 430, form: 1.2, tempo: 1.25 }, ente: { f0: 380, form: 1.15, tempo: 1.0 }, pinguin: { f0: 300, form: 1.05, tempo: 1.0 },
    eisbaer: { f0: 160, form: 0.88, tempo: 0.85 }, robbe: { f0: 190, form: 0.92, tempo: 0.9 }, schildkroete: { f0: 200, form: 0.9, tempo: 0.75 }, faultier: { f0: 210, form: 0.95, tempo: 0.6, vib: 0.02 },
    chamaeleon: { f0: 390, form: 1.15, tempo: 1.0 }, affe: { f0: 360, form: 1.12, tempo: 1.2 }, schmetterling: { f0: 520, form: 1.35, tempo: 1.1 }, libelle: { f0: 500, form: 1.3, tempo: 1.1 },
    leuchtkaefer: { f0: 480, form: 1.3, tempo: 1.05 }, glutsalamander: { f0: 330, form: 1.05, tempo: 1.0, vib: 0.02 }, lavakrabbe: { f0: 280, form: 1.0, tempo: 1.1 }, jaguar: { f0: 200, form: 0.9, tempo: 0.95 }
  };
  // Das Tier ruft seinen Namen mal-mal (zweiter Ruf etwas höher); o: hoehe/tempo (Faktoren), mal; → Dauer in s
  SC.Klang.tiername = function(c, z, t, art, o, v){
    var w = SC.Klang.NAMEN[art], b = SC.Klang.NAMENSTIMMEN[art]; if(!w || !b) return 0;
    o = o || {}; var mal = o.mal || 2, zeit = 0;
    for(var i = 0; i < mal; i++){
      var st = { f0: b.f0 * (o.hoehe || 1) * (1 + i * 0.08), form: b.form, tempo: b.tempo * (o.tempo || 1), vib: b.vib, am: b.am };
      zeit += sprich(c, z, t + zeit, w, st, v) + 0.07;
    }
    return zeit;
  };
  // Geräusch "tierlaut" (o.art, o.wie = ruf | freude | schreck | ko, o.entfernung in Blöcken: leiser, ab 28 fast still, o.modus "geraeusche" = Tiergeräusche aus js/tierlaut.js statt Namen)
  // ruf: zweimal (lange Namen einmal), freude: zweimal höher, schreck: einmal, hoch und schnell, ko: einmal, tief und langsam
  SC.Klang.tierlaut = function(c, z, t, o, v){
    var art = o.art, w = SC.Klang.NAMEN[art]; if(!w) return 0;
    if(o.modus === "geraeusche"){ var l = SC.TIERE[art] && SC.TIERE[art].laut; return l && SC.Klang.tiergeraeusch ? SC.Klang.tiergeraeusch(c, z, t, { stimme: l[0], hoehe: l[1], wie: o.wie, entfernung: o.entfernung }, v) : 0; }
    var wie = o.wie || "ruf", lt = v * Math.max(0.1, 1 - (o.entfernung || 0) / 28) * 0.6, lang = w.split(/\s+/).length > 6;
    var p = wie === "freude" ? { hoehe: 1.12, mal: 2 } : wie === "schreck" ? { hoehe: 1.3, tempo: 1.3, mal: 1 } : wie === "ko" ? { hoehe: 0.8, tempo: 0.8, mal: 1 } : { mal: lang ? 1 : 2 };
    return SC.Klang.tiername(c, z, t, art, p, lt);
  };
})();
