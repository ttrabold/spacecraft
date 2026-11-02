// Neue Orchester-Klänge (Entwurf, noch nicht im Spiel – Hörprobe: tests/musik.html).
// Unterschied zu SC.Instrumente: Vibrato, weichere Ansätze, Obertonmischung per PeriodicWave (Flöte), Celesta.
// Pauke und Trommel bleiben die alten. Aufruf wie dort: (ctx, ziel, startzeit, midi, dauer in s, lautstärke).
SC.InstrumenteNeu = {};
(function(){
  function hz(m){ return 440 * Math.pow(2, (m - 69) / 12); }
  function huelle(ctx, ziel, t, an, halten, ab, vel){
    var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vel, t + an); g.gain.setValueAtTime(vel, t + an + halten);
    g.gain.exponentialRampToValueAtTime(0.0001, t + an + halten + ab); g.connect(ziel); return g;
  }
  function osz(ctx, typ, f, ziel, t, ende, verstimmt){
    var o = ctx.createOscillator();
    if(typeof typ !== "string") o.setPeriodicWave(typ); else o.type = typ;
    o.frequency.value = f; if(verstimmt) o.detune.value = verstimmt; o.connect(ziel); o.start(t); o.stop(ende); return o;
  }
  // Vibrato: langsame Schwingung der Tonhöhe (Cent), setzt verzögert ein wie bei einem Spieler
  function vibrato(ctx, osziller, t, tiefe, rate, verzoegerung){
    var l = ctx.createOscillator(), g = ctx.createGain();
    l.frequency.value = rate; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(tiefe, t + verzoegerung + 0.3);
    l.connect(g); osziller.forEach(function(o){ g.connect(o.detune); });
    l.start(t); l.stop(t + 6); return l;
  }
  function filter(ctx, typ, f, q, ziel){ var b = ctx.createBiquadFilter(); b.type = typ; b.frequency.value = f; b.Q.value = q || 0.7; b.connect(ziel); return b; }
  var wellen = {};
  function welle(ctx, name, anteile){
    if(wellen[name] && wellen[name].ctx === ctx) return wellen[name].w;
    if(!ctx.createPeriodicWave) return "sine";
    var re = new Float32Array(anteile.length + 1), im = new Float32Array(anteile.length + 1);
    anteile.forEach(function(a, i){ im[i + 1] = a; });
    var w; try{ w = ctx.createPeriodicWave(re, im); }catch(e){ return "sine"; }
    wellen[name] = { ctx: ctx, w: w }; return w;
  }

  // Streicher: mehrere leicht verstimmte Stimmen, weicher Ansatz, Vibrato
  SC.InstrumenteNeu.streicher = function(ctx, z, t, m, d, v){
    var an = Math.min(0.35, d * 0.4), g = huelle(ctx, z, t, an, Math.max(0, d - an), 0.7, v * 0.17);
    var lp = filter(ctx, "lowpass", 1100 + Math.min(1800, hz(m) * 2.2), 0.4, g), os = [];
    [-12, -4, 5, 13].forEach(function(dt){ os.push(osz(ctx, "sawtooth", hz(m), lp, t, t + d + 0.9, dt)); });
    vibrato(ctx, os, t, 12, 5.2, 0.15);
  };
  // Blech: Anblasen (Filter öffnet sich), danach leichtes Vibrato
  SC.InstrumenteNeu.blech = function(ctx, z, t, m, d, v){
    var g = huelle(ctx, z, t, 0.07, Math.max(0.05, d - 0.07), 0.3, v * 0.2), lp = filter(ctx, "lowpass", 450, 1.1, g);
    lp.frequency.setValueAtTime(450, t); lp.frequency.linearRampToValueAtTime(2300, t + 0.1); lp.frequency.exponentialRampToValueAtTime(1200, t + Math.max(0.2, d));
    var os = [osz(ctx, "sawtooth", hz(m), lp, t, t + d + 0.4, -5), osz(ctx, "sawtooth", hz(m), lp, t, t + d + 0.4, 6)];
    osz(ctx, "square", hz(m) / 2, filter(ctx, "lowpass", 600, 0.7, g), t, t + d + 0.4, 0);
    vibrato(ctx, os, t, 8, 5, 0.3);
  };
  // Horn: rund und dunkel, weicher Ansatz
  SC.InstrumenteNeu.horn = function(ctx, z, t, m, d, v){
    var an = Math.min(0.18, d * 0.4), g = huelle(ctx, z, t, an, Math.max(0.05, d - an), 0.55, v * 0.22), lp = filter(ctx, "lowpass", 800, 0.9, g);
    lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(1000, t + an + 0.1);
    var os = [osz(ctx, "sawtooth", hz(m), lp, t, t + d + 0.7, -3), osz(ctx, "triangle", hz(m), lp, t, t + d + 0.7, 3)];
    vibrato(ctx, os, t, 6, 4.8, 0.4);
  };
  // Flöte: fast reiner Ton mit wenigen Obertönen, etwas Atem
  SC.InstrumenteNeu.floete = function(ctx, z, t, m, d, v){
    var an = Math.min(0.09, d * 0.3), g = huelle(ctx, z, t, an, Math.max(0.04, d - an), 0.2, v * 0.3);
    var o = osz(ctx, welle(ctx, "floete", [1, 0.35, 0.12, 0.05]), hz(m), g, t, t + d + 0.3, 0);
    vibrato(ctx, [o], t, 14, 5.4, 0.25);
    var b = ctx.createBuffer(1, ctx.sampleRate >> 1, ctx.sampleRate), da = b.getChannelData(0); for(var i = 0; i < da.length; i++) da[i] = Math.random() * 2 - 1;
    var s = ctx.createBufferSource(); s.buffer = b; s.connect(filter(ctx, "bandpass", hz(m) * 2, 2.5, huelle(ctx, z, t, an, Math.max(0.04, d - an), 0.2, v * 0.025))); s.start(t, 0, d + 0.3);
  };
  // Celesta: glockenartig, Anschlag mit hohem Oberton, langes Ausklingen
  SC.InstrumenteNeu.celesta = function(ctx, z, t, m, d, v){
    var f = hz(m), lang = Math.max(0.9, d);
    osz(ctx, "sine", f, huelle(ctx, z, t, 0.003, 0, lang, v * 0.28), t, t + lang + 0.1);
    osz(ctx, "sine", f * 4, huelle(ctx, z, t, 0.002, 0, 0.35, v * 0.12), t, t + 0.4);
    osz(ctx, "sine", f * 2.01, huelle(ctx, z, t, 0.002, 0, 0.6, v * 0.08), t, t + 0.7);
  };
  // Harfe: gezupft, Oberton verklingt schneller als der Grundton
  SC.InstrumenteNeu.harfe = function(ctx, z, t, m, d, v){
    var f = hz(m), lang = Math.max(0.7, d);
    osz(ctx, "triangle", f, filter(ctx, "lowpass", 3200, 0.5, huelle(ctx, z, t, 0.004, 0, lang, v * 0.26)), t, t + lang + 0.1);
    osz(ctx, "sine", f * 2, huelle(ctx, z, t, 0.003, 0, 0.35, v * 0.08), t, t + 0.4);
  };
})();
