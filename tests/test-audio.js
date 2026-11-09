function tonleiterOk(st, grund, moll){ var dur=[0,2,4,5,7,9,11], mo=[0,2,3,5,7,8,10], l=moll?mo:dur; return st.events.filter(function(e){return e.stimme==="melodie";}).every(function(e){ return l.indexOf(SC.mod(e.midi-grund,12))>=0; }); }
test("Musik ist deterministisch", function(){ gleich(JSON.stringify(SC.Musik.komponiere(7,"tag")), JSON.stringify(SC.Musik.komponiere(7,"tag"))); wahr(JSON.stringify(SC.Musik.komponiere(7,"tag"))!==JSON.stringify(SC.Musik.komponiere(8,"tag"))); });
test("Tag: heldenhaft in Dur, Nacht: Moll", function(){ var t=SC.Musik.komponiere(3,"tag"), n=SC.Musik.komponiere(3,"nacht"); wahr(!t.moll); wahr(n.moll); wahr(tonleiterOk(t,t.grundton,false),"Tag-Melodie außerhalb der Tonleiter"); wahr(tonleiterOk(n,n.grundton,true),"Nacht-Melodie außerhalb der Tonleiter"); wahr(t.tempo>n.tempo); });
test("Stücke haben Melodie, Begleitung und Pauke im Rahmen", function(){ ["tag","nacht","tief"].forEach(function(m){ var s=SC.Musik.komponiere(11,m),stimmen={}; s.events.forEach(function(e){ stimmen[e.instrument]=1; wahr(e.midi>=24&&e.midi<=100,m+": Ton "+e.midi); wahr(e.t>=0&&e.t<s.schlaege,m+": Zeit"); }); wahr(Object.keys(stimmen).length>=3,m+": zu wenige Instrumente"); wahr(s.schlaege>=32,m); }); });
test("Stimmung aus Tageslicht und Tiefe", function(){ gleich(SC.Musik.stimmung({tageslicht:1,unterTage:false}),"tag"); gleich(SC.Musik.stimmung({tageslicht:0.3,unterTage:false}),"nacht"); gleich(SC.Musik.stimmung({tageslicht:1,unterTage:true}),"tief"); });
test("Material der Blöcke für Geräusche", function(){ gleich(SC.Klang.material(SC.B.STEIN),"stein"); gleich(SC.Klang.material(SC.B.BRETTER),"holz"); gleich(SC.Klang.material(SC.B.GLAS),"glas"); gleich(SC.Klang.material(SC.B.METALL),"metall"); gleich(SC.Klang.material(SC.B.GRAS),"erde"); gleich(SC.Klang.material(SC.B.SAND),"sand"); });
test("Instrumente und Geräusche erzeugen hörbaren Klang", function(){ var ctx=new OfflineAudioContext(1,44100,44100),z=ctx.createGain(); z.connect(ctx.destination); SC.Instrumente.blech(ctx,z,0,62,0.4,0.8); SC.Instrumente.pauke(ctx,z,0.3,38,0.5,0.8); SC.Klang.erzeuge(ctx,z,"abbauen",{material:"stein"},0.6); return ctx.startRendering().then(function(b){ var d=b.getChannelData(0),s=0; for(var i=0;i<d.length;i++) s+=d[i]*d[i]; wahr(Math.sqrt(s/d.length)>0.005,"zu leise"); wahr(d.every(function(v){return isFinite(v);}),"ungültige Werte"); }); });
test("Lautstärke-Einstellungen sind vorhanden", function(){ var e=SC.Einstellungen.standard(); wahr(e.musik>0&&e.musik<=1); wahr(e.geraeusche>0&&e.geraeusche<=1); });
test("Entwicklerwerkzeuge zeigen die Version", function(){ var w=document.createElement("div"),spiel={tageszeit:0.25,zeitTempo:1,spieler:new SC.Spieler({id:"a",pos:[1,70,1],modus:"kreativ"}),welt:new SC.Welt(new SC.Planet({id:"start",seed:3})),render:{fps:60,chunks:new Map(),chunkGrenzen:false,sichtweite:6},daten:{seed:"x"}},pn=new SC.Entwickler.Panel(w,spiel); pn.zeige(); wahr(w.textContent.indexOf("Version "+V)>=0); });
test("Kampf und Boss haben Vorrang", function(){ gleich(SC.Musik.stimmung({tageslicht:1,unterTage:true,kampf:true}),"kampf"); gleich(SC.Musik.stimmung({tageslicht:1,kampf:true,boss:true}),"boss"); gleich(SC.Musik.stimmung({tageslicht:1,unterTage:false}),"tag"); });
test("Kampfmusik ist schnell und treibend", function(){ var k=SC.Musik.komponiere(1,"kampf"),b=SC.Musik.komponiere(1,"boss"); wahr(k.tempo>=120); wahr(b.tempo>=128); wahr(k.moll); var pauken=k.events.filter(function(e){return e.instrument==="pauke"&&e.t<4;}).length; wahr(pauken>=4); wahr(tonleiterOk(k,k.grundton,true)); });
test("Kampfgeräusche erzeugen Klang", function(){ var ctx=new OfflineAudioContext(1,44100,44100),z=ctx.createGain(); z.connect(ctx.destination); ["blaster","schwert","blocken","abprall","treffer","getroffen","zerfall","aufsammeln","kiste","aufstieg","besiegt","droide","krabbler","spucker","ueberhitzt"].forEach(function(n){ SC.Klang.erzeuge(ctx,z,n,{seltenheit:3},0.8); }); return ctx.startRendering().then(function(b){ var d=b.getChannelData(0),s=0; for(var i=0;i<d.length;i++) s+=d[i]*d[i]; wahr(Math.sqrt(s/d.length)>0.005); wahr(d.every(function(v){return isFinite(v);})); }); });
test("iOS: Ton als Wiedergabe anmelden, unterbrochenen Ton wieder starten", function(){
  var altA = window.AudioContext, altS = Object.getOwnPropertyDescriptor(navigator, "audioSession"), fortgesetzt = 0;
  function Ctx(){ var c = this; this.state = "interrupted"; this.currentTime = 0; this.destination = {}; this.sampleRate = 44100;
    function knoten(){ return { connect: function(){}, gain: { value: 1, setValueAtTime: function(){}, setTargetAtTime: function(){} }, buffer: null, frequency: { value: 0 }, type: "" }; }
    this.createGain = knoten; this.createDynamicsCompressor = knoten; this.createConvolver = knoten; this.createBiquadFilter = knoten;
    this.createBuffer = function(k, n){ return { getChannelData: function(){ return new Float32Array(n); } }; };
    this.resume = function(){ fortgesetzt++; c.state = "running"; return Promise.resolve(); }; }
  window.AudioContext = Ctx; Object.defineProperty(navigator, "audioSession", { value: { type: "auto" }, configurable: true });
  try{
    var a = new SC.Audio(); a.entsperren();
    gleich(navigator.audioSession.type, "playback", "Wiedergabe statt Umgebungston (Stummschalter)"); gleich(fortgesetzt, 1, "unterbrochener Ton wird fortgesetzt");
    wahr(a._stumm && a._stumm.loop, "stilles Audio-Element als Rückfall für ältere iOS");
    a.ctx.state = "interrupted"; a.entsperren(); gleich(fortgesetzt, 2, "auch nach App-Wechsel");
  } finally { window.AudioContext = altA; if(altS) Object.defineProperty(navigator, "audioSession", altS); else delete navigator.audioSession; }
});
test("Stimmung kennt All und fremde Planeten (nur am Tag an der Oberfläche)", function(){ gleich(SC.Musik.stimmung({all:true,tageslicht:1}),"all"); gleich(SC.Musik.stimmung({tageslicht:1,planet:"glutfrost"}),"glutfrost"); gleich(SC.Musik.stimmung({tageslicht:1,planet:"rankenmoor"}),"rankenmoor"); gleich(SC.Musik.stimmung({tageslicht:0.3,planet:"glutfrost"}),"nacht"); gleich(SC.Musik.stimmung({tageslicht:1,planet:"glutfrost",unterTage:true}),"tief"); gleich(SC.Musik.stimmung({tageslicht:1,planet:"start"}),"tag"); gleich(SC.Musik.stimmung({tageslicht:1,planet:"glutfrost",kampf:true}),"kampf"); });
test("Neuer Komponist: Form A–A′–B–A″, Thema kehrt wieder, im Rahmen", function(){
  SC.MusikNeu.stimmungen.forEach(function(m){
    var s=SC.MusikNeu.komponiere(5,m); wahr(s.events.length>100,m+": zu wenig Noten");
    s.events.forEach(function(e){ wahr(e.midi>=24&&e.midi<=100&&e.t>=0&&e.t<s.schlaege&&e.dauer>0&&e.vel>0,m+": Ereignis außerhalb "+JSON.stringify(e)); wahr(SC.InstrumenteNeu[e.instrument]||SC.Instrumente[e.instrument],m+": Instrument "+e.instrument); });
    gleich(s.form.reduce(function(a,f){ return a+f.takte; },0)*4,s.schlaege,m+": Form deckt das Stück");
    gleich(JSON.stringify(SC.MusikNeu.komponiere(5,m)),JSON.stringify(s),m+": deterministisch");
  });
  var t=SC.MusikNeu.komponiere(5,"tag"); gleich(t.form.map(function(f){return f.name;}).join(),"A,A2,B,A3"); gleich(t.schlaege,128);
  var mel=t.events.filter(function(e){return e.stimme==="melodie"&&e.instrument==="blech";}); wahr(mel.length>0);
  var ende=t.events.filter(function(e){return e.stimme==="melodie"&&e.t>=t.schlaege-4;}); wahr(ende.length>0&&ende.every(function(e){return SC.mod(e.midi-t.grundton,12)===0||e.dauer>=4;}),"Ende auf dem Grundton");
});
test("Neuer Komponist: Thema hängt am Welt-Seed, nicht am Stück", function(){
  var a=SC.MusikNeu.komponiere(1,"tag",{thema:9}), b=SC.MusikNeu.komponiere(2,"tag",{thema:9}), c=SC.MusikNeu.komponiere(1,"tag",{thema:10});
  gleich(JSON.stringify(a.motiv),JSON.stringify(b.motiv),"gleiche Welt, gleiches Thema"); var anders=false; for(var t=11;t<40;t++) if(JSON.stringify(SC.MusikNeu.komponiere(1,"tag",{thema:t}).motiv)!==JSON.stringify(a.motiv)) anders=true; wahr(anders,"andere Welten haben anderes Thema");
  wahr(JSON.stringify(a.events)!==JSON.stringify(b.events),"Stücke unterscheiden sich");
});
test("Neuer Komponist: Kampf in Schleife, lustige Variante tempoärmer", function(){ var k=SC.MusikNeu.komponiere(3,"kampf"), l=SC.MusikNeu.komponiere(3,"kampf",{kampfart:"lustig"}); gleich(k.schlaege,64); wahr(k.tempo>=120); wahr(l.tempo<=112); wahr(l.lustig); });
test("Musikspieler spielt das neue Stück ohne Fehler", function(){
  var a=new SC.Audio(); a.entsperren(); a.thema=42; if(!a.ctx) return;
  Object.defineProperty(a.ctx,"state",{value:"running"});   // ohne Nutzeraktion bleibt der Kontext sonst „suspended“; Planen geht trotzdem
  ["tag","kampf","all"].forEach(function(m){ a._stueck=null; a._pauseBis=0; a.musikTakt(m,true); wahr(a._stueck&&a._stueck.stimmung===m,m+": Stück läuft"); a.musikTakt(m,true); wahr(Object.keys(a._stueck.inst).length>0,m+": Instrumente angeschlossen"); });
  a.musikTakt("nacht",true); wahr(a._stueck.blendetAus,"Wechsel blendet aus"); a.ctx.close();
});

// --- Tierlaute (#185): Tiere rufen ihren Namen ---
test("Tierlaute: jede Art hat Namen und Stimmwerte", function(){
  Object.keys(SC.TIERE).forEach(function(a){ var b = SC.Klang.NAMENSTIMMEN[a]; wahr(SC.Klang.NAMEN[a] && b && b.f0 > 100 && b.form > 0.5 && b.tempo > 0.3, "Name/Stimme fehlt: " + a); });
});
test("Tierlaute: jeder Ruf in jeder Stimmung ist hörbar, endlich und übersteuert nicht", function(){
  var wie = ["ruf", "freude", "schreck", "ko"], ps = [];
  function laut(art, w, e){ var ctx = new OfflineAudioContext(1, 44100 * 5, 44100), z = ctx.createGain(); z.connect(ctx.destination); SC.Klang.erzeuge(ctx, z, "tierlaut", { art: art, wie: w, entfernung: e }, 0.8);
    return ctx.startRendering().then(function(b){ var d = b.getChannelData(0), s = 0, mx = 0; for(var i = 0; i < d.length; i++){ if(!isFinite(d[i])) return { rms: NaN }; s += d[i] * d[i]; mx = Math.max(mx, Math.abs(d[i])); } return { rms: Math.sqrt(s / d.length), peak: mx }; }); }
  Object.keys(SC.TIERE).forEach(function(a){ wie.forEach(function(w){ ps.push(laut(a, w, 0).then(function(r){ wahr(r.rms > 0.002, a + "/" + w + " zu leise: " + r.rms); wahr(r.peak < 0.9, a + "/" + w + " übersteuert: " + r.peak); })); }); });
  ps.push(Promise.all([laut("hund", "ruf", 2), laut("hund", "ruf", 27)]).then(function(r){ wahr(r[1].rms < r[0].rms, "fern leiser"); }));
  return Promise.all(ps);
});
test("Tierlaute: unbekannte Art und fehlendes Audio werfen nicht", function(){
  var ctx = new OfflineAudioContext(1, 4410, 44100), z = ctx.createGain(); SC.Klang.erzeuge(ctx, z, "tierlaut", { art: "gibtesnicht" }, 1); SC.Klang.erzeuge(ctx, z, "tierlaut", undefined, 1);
  var a = Object.create(SC.Audio.prototype); a.ctx = null; a.spiele("tierlaut", { art: "hund" }); wahr(true);
});
test("Tierlaute: Spiel ruft nur nah, mit Entfernung, gedrosselt", function(){
  var gespielt = [], s = { audio: { spiele: function(n, o){ gespielt.push(o); } }, welt: { planet: { groesse: 512 } }, spieler: { pos: [10, 5, 10] } };
  var f = SC.Spiel.prototype._tierLaut;
  f.call(s, "hund", "ruf", [14, 5, 10]); wahr(gespielt.length === 1 && gespielt[0].art === "hund" && gespielt[0].wie === "ruf" && Math.abs(gespielt[0].entfernung - 4) < 0.01, "nah");
  f.call(s, "hund", "ruf", [14, 5, 10]); gleich(gespielt.length, 1, "gedrosselt");
  f.call(s, "hund", "ko", [14, 5, 10], true); gleich(gespielt.length, 2, "immer");
  f.call(s, "hund", "ruf", [200, 5, 10], true); gleich(gespielt.length, 2, "zu weit");
  f.call(s, "gibtesnicht", "ruf", [14, 5, 10], true); gleich(gespielt.length, 2, "unbekannte Art");
});

// --- Tierstimmen-Schalter: Namen oder Tiergeräusche ---
test("Tiergeräusche: jede Art hat eine bekannte Stimme, alle Stimmen sind hörbar", function(){
  Object.keys(SC.TIERE).forEach(function(a){ var l = SC.TIERE[a].laut; wahr(l && SC.Klang.TIERGERAEUSCHE[l[0]] && l[1] > 0, "Laut fehlt: " + a); });
  var ps = [];
  Object.keys(SC.Klang.TIERGERAEUSCHE).forEach(function(n){ ["ruf", "freude", "schreck", "ko"].forEach(function(w){
    var ctx = new OfflineAudioContext(1, 44100 * 2, 44100), z = ctx.createGain(); z.connect(ctx.destination); SC.Klang.tiergeraeusch(ctx, z, 0.01, { stimme: n, hoehe: 1, wie: w }, 0.8);
    ps.push(ctx.startRendering().then(function(b){ var d = b.getChannelData(0), s = 0; for(var i = 0; i < d.length; i++){ if(!isFinite(d[i])) { s = NaN; break; } s += d[i] * d[i]; } wahr(Math.sqrt(s / d.length) > 0.0005, n + "/" + w + " zu leise oder ungültig"); }));
  }); });
  return Promise.all(ps);
});
test("Tierstimmen: Modus geraeusche spielt Geräusch statt Namen, Standard sind Namen", function(){
  function rms(modus){ var ctx = new OfflineAudioContext(1, 44100 * 3, 44100), z = ctx.createGain(); z.connect(ctx.destination); SC.Klang.erzeuge(ctx, z, "tierlaut", { art: "hund", wie: "ruf", modus: modus }, 0.8);
    return ctx.startRendering().then(function(b){ var d = b.getChannelData(0), last = 0, s = 0; for(var i = 0; i < d.length; i++){ s += d[i] * d[i]; if(Math.abs(d[i]) > 0.003) last = i; } return { rms: Math.sqrt(s / d.length), ende: last / 44100 }; }); }
  return Promise.all([rms(undefined), rms("namen"), rms("geraeusche")]).then(function(r){
    wahr(r[0].rms > 0.002 && r[1].rms > 0.002 && r[2].rms > 0.002, "hörbar"); wahr(r[2].ende < r[0].ende - 0.2, "Geräusch deutlich kürzer als der Name: " + r[2].ende + " gegen " + r[0].ende); wahr(Math.abs(r[0].ende - r[1].ende) < 0.05, "Standard = Namen");
  });
});
test("Einstellungen: tierstimmen Standard „namen“, alte Einstellungen ohne Feld, Texte, Auswahl im Panel", function(){
  gleich(SC.Einstellungen.standard().tierstimmen, "namen"); localStorage.setItem("sc-ttest:einstellungen", JSON.stringify({ musik: 0.2 })); gleich(SC.Einstellungen.lade("ttest").tierstimmen, "namen"); localStorage.removeItem("sc-ttest:einstellungen");
  wahr(SC.T.tierstimmen && SC.T.tierstimmenNamen && SC.T.tierstimmenGeraeusche, "Texte");
  var s = { audio: { spiele: function(n, o){ s.o = o; } }, welt: { planet: { groesse: 512 } }, spieler: { pos: [0, 0, 0] }, einstellungen: { tierstimmen: "geraeusche" } };
  SC.Spiel.prototype._tierLaut.call(s, "katze", "ruf", [1, 0, 0], true); gleich(s.o.modus, "geraeusche", "Spiel gibt den Modus weiter");
});
