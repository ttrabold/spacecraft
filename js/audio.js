// Klang: Orchester-Instrumente und Geräusche als Synthesizer (Web Audio, keine Audiodateien)
SC.Instrumente = {};
SC.Klang = {};
(function(){
  function hz(m){ return 440 * Math.pow(2, (m - 69) / 12); }
  function huelle(ctx, ziel, t, an, halten, ab, vel){
    var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vel, t + an); g.gain.setValueAtTime(vel, t + an + halten);
    g.gain.exponentialRampToValueAtTime(0.0001, t + an + halten + ab); g.connect(ziel); return g;
  }
  function osz(ctx, typ, f, ziel, t, ende, verstimmt){ var o = ctx.createOscillator(); o.type = typ; o.frequency.value = f; if(verstimmt) o.detune.value = verstimmt; o.connect(ziel); o.start(t); o.stop(ende); return o; }
  var rauschPuffer = null;
  function rauschen(ctx){
    if(rauschPuffer && rauschPuffer.sampleRate === ctx.sampleRate) return rauschPuffer;
    var b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = b.getChannelData(0), zf = SC.zufall(99);
    for(var i = 0; i < d.length; i++) d[i] = zf() * 2 - 1;
    return (rauschPuffer = b);
  }
  function rausch(ctx, ziel, t, dauer){ var s = ctx.createBufferSource(); s.buffer = rauschen(ctx); s.connect(ziel); s.start(t, Math.random() * 0.5, dauer + 0.05); return s; }
  function filter(ctx, typ, f, q, ziel){ var b = ctx.createBiquadFilter(); b.type = typ; b.frequency.value = f; b.Q.value = q || 0.7; b.connect(ziel); return b; }

  // Instrumente: (ctx, ziel, startzeit, midi, dauer in s, lautstärke 0..1)
  SC.Instrumente.streicher = function(ctx, z, t, m, d, v){
    var g = huelle(ctx, z, t, 0.25, Math.max(0, d - 0.25), 0.6, v * 0.18), lp = filter(ctx, "lowpass", 1600, 0.5, g);
    [-9, 0, 8].forEach(function(dt){ osz(ctx, "sawtooth", hz(m), lp, t, t + d + 0.7, dt); });
  };
  SC.Instrumente.blech = function(ctx, z, t, m, d, v){
    var g = huelle(ctx, z, t, 0.05, Math.max(0.05, d - 0.05), 0.25, v * 0.22), lp = filter(ctx, "lowpass", 500, 1.2, g);
    lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(2600, t + 0.08); lp.frequency.exponentialRampToValueAtTime(1300, t + Math.max(0.15, d));
    osz(ctx, "sawtooth", hz(m), lp, t, t + d + 0.3, -4); osz(ctx, "sawtooth", hz(m), lp, t, t + d + 0.3, 5); osz(ctx, "square", hz(m) / 2, lp, t, t + d + 0.3, 0);
  };
  SC.Instrumente.horn = function(ctx, z, t, m, d, v){
    var g = huelle(ctx, z, t, 0.12, Math.max(0.05, d - 0.12), 0.5, v * 0.2), lp = filter(ctx, "lowpass", 900, 0.8, g);
    osz(ctx, "sawtooth", hz(m), lp, t, t + d + 0.6, -3); osz(ctx, "triangle", hz(m), lp, t, t + d + 0.6, 3);
  };
  SC.Instrumente.harfe = function(ctx, z, t, m, d, v){
    var g = huelle(ctx, z, t, 0.005, 0, Math.max(0.6, d), v * 0.25);
    osz(ctx, "triangle", hz(m), g, t, t + d + 0.7); osz(ctx, "sine", hz(m) * 2, huelle(ctx, z, t, 0.005, 0, 0.4, v * 0.06), t, t + 0.5);
  };
  SC.Instrumente.pauke = function(ctx, z, t, m, d, v){
    var g = huelle(ctx, z, t, 0.005, 0, 0.9, v * 0.7), o = osz(ctx, "sine", hz(m), g, t, t + 1);
    o.frequency.setValueAtTime(hz(m) * 1.5, t); o.frequency.exponentialRampToValueAtTime(hz(m), t + 0.08);
    rausch(ctx, filter(ctx, "lowpass", 300, 0.7, huelle(ctx, z, t, 0.002, 0, 0.25, v * 0.3)), t, 0.3);
  };
  SC.Instrumente.trommel = function(ctx, z, t, m, d, v){
    rausch(ctx, filter(ctx, "highpass", 1400, 0.7, huelle(ctx, z, t, 0.002, 0, 0.12, v * 0.5)), t, 0.15);
  };

  SC.Klang.material = function(id){
    var B = SC.B;
    if([B.STEIN, B.GRUNDGESTEIN, B.STEINZIEGEL, B.BETON, B.KIES, B.KRISTALL].indexOf(id) >= 0) return id === B.KRISTALL ? "glas" : "stein";
    if([B.STAMM, B.BRETTER].indexOf(id) >= 0) return "holz";
    if([B.GLAS, B.LEUCHT_CYAN, B.LEUCHT_PINK, B.LEUCHT_GRUEN].indexOf(id) >= 0) return "glas";
    if([B.METALL, B.METALLGITTER, B.TECHNIK].indexOf(id) >= 0) return "metall";
    if([B.SAND, B.SCHNEE].indexOf(id) >= 0) return "sand";
    if(id === B.WASSER) return "wasser";
    return "erde";
  };

  // Geräusche: (ctx, ziel, name, {material}, lautstärke); Zeitpunkt = jetzt
  SC.Klang.erzeuge = function(ctx, z, name, o, v){
    var t = ctx.currentTime + 0.01, mat = (o && o.material) || "erde";
    var TON = { stein: [700, 1.2], holz: [420, 4], erde: [300, 0.8], sand: [1800, 0.5], glas: [3200, 6], metall: [1500, 9], wasser: [900, 1] };
    var f = TON[mat] || TON.erde;
    if(name === "abbauen" || name === "setzen" || name === "schritt"){
      var laut = name === "schritt" ? 0.25 : name === "setzen" ? 0.5 : 0.7, lang = name === "abbauen" ? 0.22 : 0.1;
      rausch(ctx, filter(ctx, "bandpass", f[0] * (name === "setzen" ? 0.7 : 1), f[1], huelle(ctx, z, t, 0.003, 0, lang, v * laut)), t, lang + 0.05);
      if(mat === "holz") osz(ctx, "triangle", name === "schritt" ? 180 : 240, huelle(ctx, z, t, 0.002, 0, 0.08, v * laut * 0.5), t, t + 0.12);
      if(mat === "glas" && name === "abbauen") [2093, 2637, 3136].forEach(function(fr, i){ osz(ctx, "sine", fr, huelle(ctx, z, t + i * 0.03, 0.002, 0, 0.4, v * 0.12), t + i * 0.03, t + 0.5); });
      if(mat === "metall") osz(ctx, "square", name === "schritt" ? 520 : 780, filter(ctx, "bandpass", 1600, 8, huelle(ctx, z, t, 0.002, 0, 0.18, v * laut * 0.3)), t, t + 0.25);
    } else if(name === "springen"){
      rausch(ctx, filter(ctx, "bandpass", 900, 1, huelle(ctx, z, t, 0.02, 0, 0.15, v * 0.15)), t, 0.2);
    } else if(name === "landen"){
      osz(ctx, "sine", 90, huelle(ctx, z, t, 0.003, 0, 0.15, v * 0.5), t, t + 0.2);
      rausch(ctx, filter(ctx, "lowpass", 500, 0.7, huelle(ctx, z, t, 0.003, 0, 0.1, v * 0.3)), t, 0.15);
    } else if(name === "platsch"){
      var g = huelle(ctx, z, t, 0.01, 0.05, 0.5, v * 0.5), bp = filter(ctx, "bandpass", 1200, 0.8, g);
      bp.frequency.setValueAtTime(2500, t); bp.frequency.exponentialRampToValueAtTime(400, t + 0.5); rausch(ctx, bp, t, 0.6);
    } else if(name === "blaster"){
      var gb = huelle(ctx, z, t, 0.002, 0.03, 0.12, v * 0.35), ob = osz(ctx, "sawtooth", 1400, filter(ctx, "lowpass", 3000, 1, gb), t, t + 0.2);
      ob.frequency.setValueAtTime(1400, t); ob.frequency.exponentialRampToValueAtTime(260, t + 0.16);
    } else if(name === "schwert"){
      var gs = huelle(ctx, z, t, 0.02, 0.05, 0.15, v * 0.4), bs = filter(ctx, "bandpass", 600, 2, gs);
      bs.frequency.setValueAtTime(400, t); bs.frequency.exponentialRampToValueAtTime(2400, t + 0.18); rausch(ctx, bs, t, 0.25);
      osz(ctx, "sawtooth", 110, filter(ctx, "lowpass", 400, 1, huelle(ctx, z, t, 0.01, 0.1, 0.15, v * 0.25)), t, t + 0.3);
    } else if(name === "blocken" || name === "abprall"){
      [1200, 1650, 2300].forEach(function(f2, i){ osz(ctx, "square", f2 * (name === "abprall" ? 1.3 : 1), filter(ctx, "bandpass", f2, 6, huelle(ctx, z, t + i * 0.01, 0.002, 0, 0.25, v * 0.12)), t, t + 0.35); });
      if(name === "abprall"){ var oa = osz(ctx, "sine", 800, huelle(ctx, z, t, 0.002, 0.05, 0.1, v * 0.25), t, t + 0.2); oa.frequency.exponentialRampToValueAtTime(2400, t + 0.15); }
    } else if(name === "treffer" || name === "getroffen"){
      var ot = osz(ctx, "sine", name === "treffer" ? 180 : 110, huelle(ctx, z, t, 0.002, 0, 0.18, v * 0.6), t, t + 0.25); ot.frequency.exponentialRampToValueAtTime(60, t + 0.18);
      rausch(ctx, filter(ctx, "lowpass", 1800, 0.7, huelle(ctx, z, t, 0.002, 0, 0.08, v * 0.35)), t, 0.1);
    } else if(name === "zerfall"){
      [1568, 1319, 1047, 784, 659].forEach(function(f3, i){ osz(ctx, "triangle", f3, huelle(ctx, z, t + i * 0.05, 0.002, 0, 0.2, v * 0.12), t + i * 0.05, t + i * 0.05 + 0.25); });
      rausch(ctx, filter(ctx, "highpass", 3000, 0.7, huelle(ctx, z, t, 0.01, 0.1, 0.3, v * 0.15)), t, 0.45);
    } else if(name === "aufsammeln"){
      var sel = (o && o.seltenheit) || 0, basis = 880 * Math.pow(1.12, sel);
      [1, 1.25, 1.5].forEach(function(f4, i){ osz(ctx, "sine", basis * f4, huelle(ctx, z, t + i * 0.06, 0.003, 0, 0.25 + sel * 0.08, v * 0.2), t + i * 0.06, t + i * 0.06 + 0.5); });
    } else if(name === "kiste"){
      var ok = osz(ctx, "sawtooth", 140, filter(ctx, "lowpass", 600, 4, huelle(ctx, z, t, 0.02, 0.2, 0.1, v * 0.15)), t, t + 0.35); ok.frequency.linearRampToValueAtTime(220, t + 0.3);
      [1047, 1319, 1568, 2093].forEach(function(f5, i){ osz(ctx, "sine", f5, huelle(ctx, z, t + 0.3 + i * 0.07, 0.003, 0, 0.4, v * 0.15), t + 0.3 + i * 0.07, t + 0.9 + i * 0.07); });
    } else if(name === "aufstieg"){
      [60, 64, 67, 72].forEach(function(m, i){ SC.Instrumente.blech(ctx, z, t + i * 0.13, m, i === 3 ? 0.7 : 0.15, v * 0.9); });
    } else if(name === "besiegt"){
      [67, 64, 60, 55].forEach(function(m, i){ SC.Instrumente.horn(ctx, z, t + i * 0.25, m, 0.4, v * 0.7); });
    } else if(name === "droide"){
      [1300, 900, 1600].forEach(function(f6, i){ osz(ctx, "square", f6, filter(ctx, "lowpass", 2500, 1, huelle(ctx, z, t + i * 0.07, 0.002, 0.03, 0.02, v * 0.08)), t + i * 0.07, t + i * 0.07 + 0.08); });
    } else if(name === "krabbler"){
      for(var c = 0; c < 4; c++) rausch(ctx, filter(ctx, "bandpass", 3500, 5, huelle(ctx, z, t + c * 0.04, 0.001, 0, 0.02, v * 0.3)), t + c * 0.04, 0.03);
    } else if(name === "spucker"){
      rausch(ctx, filter(ctx, "highpass", 2500, 0.7, huelle(ctx, z, t, 0.05, 0.1, 0.2, v * 0.25)), t, 0.4);
      var og = osz(ctx, "sine", 300, huelle(ctx, z, t + 0.3, 0.005, 0, 0.1, v * 0.3), t + 0.3, t + 0.45); og.frequency.exponentialRampToValueAtTime(120, t + 0.42);
    } else if(name === "ueberhitzt"){
      rausch(ctx, filter(ctx, "highpass", 4000, 0.7, huelle(ctx, z, t, 0.01, 0.3, 0.4, v * 0.2)), t, 0.8);
    } else if(name === "klick"){
      osz(ctx, "square", 880, filter(ctx, "lowpass", 3000, 0.7, huelle(ctx, z, t, 0.002, 0, 0.05, v * 0.12)), t, t + 0.07);
    }
  };

  // Hall aus erzeugter Impulsantwort (Konzertsaal-Gefühl)
  function hall(ctx, sek){
    var n = Math.floor(ctx.sampleRate * sek), b = ctx.createBuffer(2, n, ctx.sampleRate), zf = SC.zufall(7);
    for(var c = 0; c < 2; c++){ var d = b.getChannelData(c); for(var i = 0; i < n; i++) d[i] = (zf() * 2 - 1) * Math.pow(1 - i / n, 2.5); }
    var k = ctx.createConvolver(); k.buffer = b; return k;
  }

  // Audio-Zentrale: Lautstärken, Geräusche, Musikspieler. Startet erst nach einer Nutzeraktion (iOS).
  SC.Audio = function(){ this.ctx = null; this.musikLaut = 0.5; this.sfxLaut = 0.8; this._stimmung = null; this._stueck = null; this._seed = (Date.now() / 1000) | 0; this._pauseBis = 0; };
  SC.Audio.prototype.entsperren = function(){
    var A = window.AudioContext || window.webkitAudioContext;
    if(!A) return;
    if(!this.ctx){
      var c = this.ctx = new A(), komp = c.createDynamicsCompressor(); komp.connect(c.destination);
      this.musik = c.createGain(); this.sfx = c.createGain(); this.musik.connect(komp); this.sfx.connect(komp);
      var h = hall(c, 2.6), hg = c.createGain(); hg.gain.value = 0.35; h.connect(hg); hg.connect(this.musik);
      this.musikTrocken = c.createGain(); this.musikTrocken.connect(this.musik); this.musikTrocken.connect(h);
      this.lautstaerke(this.musikLaut, this.sfxLaut);
    }
    if(this.ctx.state === "suspended") this.ctx.resume();
  };
  SC.Audio.prototype.lautstaerke = function(m, s){
    this.musikLaut = m; this.sfxLaut = s;
    if(this.ctx){ this.musik.gain.value = m * 0.6; this.sfx.gain.value = s; }
  };
  SC.Audio.prototype.spiele = function(name, o){
    if(!this.ctx || this.ctx.state !== "running" || this.sfxLaut <= 0) return;
    SC.Klang.erzeuge(this.ctx, this.sfx, name, o, 1);
  };

  // Musik: Stück nach Stimmung, vorausplanen in kleinen Häppchen; zwischen Stücken Pausen
  SC.Audio.prototype.musikTakt = function(stimmung, aktiv){
    var c = this.ctx; if(!c || c.state !== "running") return;
    var jetzt = c.currentTime;
    if(!aktiv || this.musikLaut <= 0){ this._ausblenden(jetzt); return; }
    var kampfig = stimmung === "kampf" || stimmung === "boss";
    if(this._stueck && stimmung !== this._stueck.stimmung && !this._stueck.blendetAus){ this._ausblenden(jetzt, kampfig ? 1 : 2.5); this._pauseBis = jetzt + (kampfig ? 0.3 : 4); }
    if(!this._stueck && kampfig && this._pauseBis > jetzt + 0.5) this._pauseBis = jetzt + 0.3;   // Kampf wartet nicht auf die Pause
    if(!this._stueck){
      if(jetzt < this._pauseBis) return;
      var st = SC.Musik.komponiere(this._seed++, stimmung), bus = c.createGain(); bus.gain.value = 1; bus.connect(this.musikTrocken);
      this._stueck = { stimmung: stimmung, daten: st, start: jetzt + 0.2, sek: 60 / st.tempo, i: 0, bus: bus };
    }
    var s = this._stueck, bis = jetzt + 1.5, ev = s.daten.events;
    while(s.i < ev.length && s.start + ev[s.i].t * s.sek < bis){
      var e = ev[s.i++], f = SC.Instrumente[e.instrument];
      if(f && !s.blendetAus) f(c, s.bus, s.start + e.t * s.sek, e.midi, e.dauer * s.sek, e.vel);
    }
    if(s.i >= ev.length && jetzt > s.start + s.daten.schlaege * s.sek + (kampfig ? -0.05 : 2)){
      this._stueck = null; this._pauseBis = kampfig ? jetzt : jetzt + 20 + Math.random() * 25;
    }
  };
  SC.Audio.prototype._ausblenden = function(jetzt, dauer){
    var s = this._stueck; if(!s || s.blendetAus) return;
    s.blendetAus = true; s.bus.gain.setValueAtTime(s.bus.gain.value, jetzt); s.bus.gain.linearRampToValueAtTime(0.0001, jetzt + (dauer || 2.5));
    var a = this; setTimeout(function(){ s.bus.disconnect(); if(a._stueck === s) a._stueck = null; }, 3000);
  };
})();
