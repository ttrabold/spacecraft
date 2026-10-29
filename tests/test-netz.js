test("Raumcode hat Wort und Zahl 10–99", function(){ var zf=SC.zufall(1); for(var i=0;i<200;i++){ var c=SC.Netz.neuerCode(zf); wahr(SC.Netz.WOERTER.indexOf(c.wort)>=0); wahr(c.zahl>=10&&c.zahl<=99); gleich(c.text,c.wort+" "+c.zahl); gleich(c.peerId,"spacecraft-"+c.wort.toLowerCase()+"-"+c.zahl); } gleich(SC.Netz.WOERTER.length,24); wahr(SC.Netz.WOERTER.every(function(w){ return /^[A-Z]+$/.test(w); })); });
test("Speicher-Netz: verbinden, senden, empfangen", function(){ var n=SC.Netz.speicherNetz(),h=n.adapter(),g=n.adapter(),erhalten=[],hv=null; return h.oeffne("spacecraft-mond-47").then(function(r){ r.an("verbindung",function(v){ hv=v; v.an("daten",function(d){ erhalten.push(d); }); }); var p=g.verbinde("spacecraft-mond-47"); n.pumpe(); return p; }).then(function(v){ v.sende({t:"hallo"}); gleich(erhalten.length,0,"erst beim Pumpen"); n.pumpe(); gleich(erhalten[0].t,"hallo"); wahr(hv!==null); }); });
test("Speicher-Netz: vergebene ID und fehlender Raum", function(){ var n=SC.Netz.speicherNetz(),a=n.adapter(),b=n.adapter(); return a.oeffne("x").then(function(){ return b.oeffne("x").then(function(){ throw new Error("doppelt"); },function(f){ gleich(f.art,"vergeben"); }); }).then(function(){ var p=b.verbinde("y"); n.pumpe(); return p.then(function(){ throw new Error("verbunden"); },function(f){ gleich(f.art,"kein-raum"); }); }); });
test("Speicher-Netz: Abbruch meldet beiden Seiten zu", function(){ var n=SC.Netz.speicherNetz(),h=n.adapter(),g=n.adapter(),zu=0; return h.oeffne("r").then(function(r){ r.an("verbindung",function(v){ v.an("zu",function(){ zu++; }); }); var p=g.verbinde("r"); n.pumpe(); return p; }).then(function(v){ v.an("zu",function(){ zu++; }); n.trenne(v); n.pumpe(); gleich(zu,2); }); });
test("Speicher-Netz überträgt Uint8Array", function(){ var n=SC.Netz.speicherNetz(),h=n.adapter(),g=n.adapter(),erh=null; return h.oeffne("r").then(function(r){ r.an("verbindung",function(v){ v.an("daten",function(d){ erh=d; }); }); var p=g.verbinde("r"); n.pumpe(); return p; }).then(function(v){ v.sende({t:"chunk",daten:new Uint8Array([1,2,3])}); n.pumpe(); wahr(erh.daten instanceof Uint8Array); gleich(erh.daten[2],3); }); });
test("PeerJS ist geladen", function(){ wahr(typeof Peer==="function"); wahr(typeof SC.Netz.peerjs==="function"); });
test("PeerJS-Fehlertypen werden abgebildet", function(){ var f=function(t){ return SC.Netz._peerjsFehler({type:t}).art; }; gleich(f("unavailable-id"),"vergeben"); gleich(f("peer-unavailable"),"kein-raum"); gleich(f("network"),"vermittlung"); gleich(f("server-error"),"vermittlung"); gleich(f("socket-error"),"vermittlung"); gleich(f("disconnected"),"vermittlung"); gleich(f("webrtc"),"unbekannt"); });
test("PeerJS-Gastgeber meldet sich nach Verlust der Vermittlung neu an", function(){
  var altPeer = window.Peer, altMs = SC.Netz.NEU_ANMELDEN_MS, p = null;
  function Fake(id){ var h = {}; p = this; this.id = id; this.disconnected = false; this.destroyed = false; this.neu = 0;
    this.on = function(n, f){ h[n] = f; }; this.aus = function(n){ if(h[n]) h[n](); };
    this.reconnect = function(){ this.neu++; this.disconnected = false; }; this.destroy = function(){ this.destroyed = true; }; }
  window.Peer = Fake; SC.Netz.NEU_ANMELDEN_MS = 0;
  function zurueck(){ window.Peer = altPeer; SC.Netz.NEU_ANMELDEN_MS = altMs; }
  var warte = function(){ return new Promise(function(ok){ setTimeout(ok, 5); }); }, raum;
  var v = SC.Netz.peerjs().oeffne("spacecraft-mond-47"); p.aus("open");
  return v.then(function(r){ raum = r; p.disconnected = true; p.aus("disconnected"); return warte(); }).then(function(){
    gleich(p.neu, 1, "neu angemeldet");
    raum.schliesse(); p.disconnected = true; p.aus("disconnected"); return warte();
  }).then(function(){ gleich(p.neu, 1, "nach dem Schließen nicht mehr"); zurueck(); }, function(f){ zurueck(); throw f; });
});
