// Netzschicht: Raumcode und zwei austauschbare Adapter (Speicher für Tests, PeerJS für echte Verbindungen).
// Adapter: oeffne(peerId)→Promise<Raum>, verbinde(peerId)→Promise<Verbindung>; Raum: an("verbindung",fn), schliesse();
// Verbindung: sende(n), an("daten"|"zu",fn), schliesse(), id (Peer-ID der Gegenseite).
SC.NETZ_PROTOKOLL = 1;
SC.Netz = {};
SC.Netz.Fehler = function(art, text){ this.art = art; this.message = text || art; this.name = "NetzFehler"; };
SC.Netz.Fehler.prototype = Object.create(Error.prototype);
SC.Netz.WOERTER = ["MOND","STERN","KOMET","PLANET","RAKETE","SONNE","NEBEL","ORBIT","LASER","ROBOTER","ALIEN","KRATER","METEOR","GALAXIE","STATION","KAPSEL","ASTRO","NOVA","PULSAR","QUASAR","RADAR","SATURN","VENUS","MARS"];
SC.Netz.code = function(wort, zahl){ return { wort: wort, zahl: zahl, text: wort + " " + zahl, peerId: "spacecraft-" + wort.toLowerCase() + "-" + zahl }; };
SC.Netz.neuerCode = function(zf){ var W = SC.Netz.WOERTER; return SC.Netz.code(W[Math.floor(zf() * W.length)], 10 + Math.floor(zf() * 90)); };
SC.Netz.KEINE_DIREKTE_MS = 10000;

// Kopie wie nach einer Übertragung: Uint8Array bleibt erhalten, sonst JSON-Rundreise
SC.Netz.kopie = function(n){
  if(n instanceof Uint8Array) return new Uint8Array(n);
  if(Array.isArray(n)) return n.map(SC.Netz.kopie);
  if(n && typeof n === "object"){ var o = {}; for(var k in n){ if(n[k] !== undefined && typeof n[k] !== "function") o[k] = SC.Netz.kopie(n[k]); } return o; }
  return n;
};

// Gemeinsames Ereignis-Gerüst: an(name, fn) / ausloesen(name, arg)
SC.Netz._ereignisse = function(o){ var h = {}; o.an = function(n, f){ (h[n] = h[n] || []).push(f); return o; }; o._aus = function(n, a){ (h[n] || []).slice().forEach(function(f){ f(a); }); }; return o; };

// --- Speicher-Adapter (Tests): Zustellung nur bei pumpe() ---
SC.Netz.speicherNetz = function(){
  var raeume = {}, ausfaelle = {}, queue = [], zaehler = 0;
  function seite(paar, ich, id){
    var v = SC.Netz._ereignisse({}); v.id = id;
    v.sende = function(n){ if(paar.zu) return; var k = SC.Netz.kopie(n); queue.push(function(){ if(!paar.zu) paar.seiten[1 - ich]._aus("daten", k); }); };
    v.schliesse = function(){ trenne(v); };
    v._paar = paar; v._ich = ich; return v;
  }
  function trenne(v){ var p = v._paar; queue.push(function(){ if(p.zu) return; p.zu = true; p.seiten.forEach(function(s){ s._aus("zu"); }); }); }
  return {
    adapter: function(){
      var meine = null, eigene = "gast-" + (++zaehler);
      return {
        oeffne: function(peerId){
          if(raeume[peerId]) return Promise.reject(new SC.Netz.Fehler("vergeben"));
          var r = SC.Netz._ereignisse({}), paare = [];
          r._peerId = peerId; r._paare = paare; raeume[peerId] = r; meine = peerId;
          r.schliesse = function(){ if(raeume[peerId] === r) delete raeume[peerId]; paare.forEach(function(p){ trenne(p.seiten[1]); }); };
          return Promise.resolve(r);
        },
        verbinde: function(peerId){
          return new Promise(function(ok, nein){
            queue.push(function(){
              var r = raeume[peerId];
              if(!r || ausfaelle[peerId]) return nein(new SC.Netz.Fehler("kein-raum"));
              var paar = { zu: false, seiten: [] }, ich = meine || eigene;
              var gast = seite(paar, 0, peerId), gastgeber = seite(paar, 1, ich);
              paar.seiten = [gast, gastgeber]; r._paare.push(paar);
              r._aus("verbindung", gastgeber); ok(gast);
            });
          });
        }
      };
    },
    // Stellt alle aufgelaufenen Ereignisse zu (auch solche, die dabei neu entstehen)
    pumpe: function(){ var n = 0; while(queue.length && n++ < 10000) queue.shift()(); },
    trenne: trenne,
    ausfall: function(peerId){ ausfaelle[peerId] = true; }
  };
};

// --- PeerJS-Adapter (dünn, nur über echtes Netz prüfbar) ---
SC.Netz.peerjsFehler = function(e, standard){
  var t = e && e.type;
  if(t === "unavailable-id") return new SC.Netz.Fehler("vergeben");
  if(t === "peer-unavailable") return new SC.Netz.Fehler("kein-raum");
  if(t === "network" || t === "server-error" || t === "socket-error") return new SC.Netz.Fehler("vermittlung");
  return new SC.Netz.Fehler(standard || "unbekannt", e && e.message);
};
SC.Netz.peerjs = function(){
  var peer = null;
  function umhuelle(c){
    var v = SC.Netz._ereignisse({}); v.id = c.peer;
    c.on("data", function(d){ v._aus("daten", d); });
    c.on("close", function(){ v._aus("zu"); });
    c.on("error", function(){ v._aus("zu"); });
    v.sende = function(n){ try{ c.send(n); }catch(e){} };
    v.schliesse = function(){ try{ c.close(); }catch(e){} };
    return v;
  }
  return {
    oeffne: function(peerId){
      return new Promise(function(ok, nein){
        var p; try{ p = new Peer(peerId, { debug: 0 }); }catch(e){ return nein(SC.Netz.peerjsFehler(e)); }
        var offen = false, r = SC.Netz._ereignisse({});
        r.schliesse = function(){ try{ p.destroy(); }catch(e){} };
        p.on("connection", function(c){ r._aus("verbindung", umhuelle(c)); });
        p.on("open", function(){ offen = true; peer = p; ok(r); });
        p.on("error", function(e){ if(!offen){ try{ p.destroy(); }catch(x){} nein(SC.Netz.peerjsFehler(e)); } });
      });
    },
    verbinde: function(peerId){
      return new Promise(function(ok, nein){
        var erledigt = false, timer = null, c = null;
        function fertig(f, v){ if(erledigt) return; erledigt = true; clearTimeout(timer); if(f) nein(f); else ok(v); }
        function los(p){
          try{ c = p.connect(peerId, { serialization: "binary", reliable: true }); }catch(e){ return fertig(SC.Netz.peerjsFehler(e)); }
          timer = setTimeout(function(){ try{ c.close(); }catch(e){} fertig(new SC.Netz.Fehler("keine-direkte")); }, SC.Netz.KEINE_DIREKTE_MS);
          c.on("open", function(){ fertig(null, umhuelle(c)); });
          p.on("error", function(e){ fertig(SC.Netz.peerjsFehler(e)); });
        }
        if(peer && !peer.destroyed){ return los(peer); }
        var p; try{ p = new Peer({ debug: 0 }); }catch(e){ return nein(SC.Netz.peerjsFehler(e)); }
        var offen = false;
        p.on("open", function(){ offen = true; peer = p; los(p); });
        p.on("error", function(e){ if(!offen) fertig(new SC.Netz.Fehler("vermittlung")); });
      });
    }
  };
};
