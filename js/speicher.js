// Speicher: IndexedDB, sonst localStorage, sonst nur flüchtig. Live und Test bekommen
// über den Pfad getrennte Namensräume, obwohl sie denselben Origin teilen.
SC.namensraum = function(ort){
  if(ort.protocol === "file:") return "lokal-datei";
  if(ort.hostname === "localhost" || ort.hostname === "127.0.0.1") return "lokal";
  if(/^\/spacecraft-test(\/|$)/.test(ort.pathname)) return "spacecraft-test";
  return "spacecraft";
};

SC.Speicher = {};
(function(){
  function kopie(v){ return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }

  function idb(ns){
    return new Promise(function(ok, fehl){
      if(typeof indexedDB === "undefined") return fehl(new Error("kein IndexedDB"));
      var r;
      try { r = indexedDB.open("sc-" + ns, 1); } catch(e){ return fehl(e); }
      r.onupgradeneeded = function(){ r.result.createObjectStore("daten"); };
      r.onerror = function(){ fehl(r.error); };
      r.onblocked = function(){ fehl(new Error("IndexedDB blockiert")); };
      r.onsuccess = function(){
        var db = r.result;
        function tx(art, fn){
          return new Promise(function(ok2, fehl2){
            var t;
            try { t = db.transaction("daten", art); } catch(e){ return fehl2(e); }
            var s = t.objectStore("daten"), q = fn(s), wert;
            if(q) q.onsuccess = function(){ wert = q.result; };
            t.oncomplete = function(){ ok2(wert); };
            t.onerror = t.onabort = function(){ fehl2(t.error || new Error("Speichern fehlgeschlagen")); };
          });
        }
        ok({
          art: "indexeddb",
          hole: function(k){ return tx("readonly", function(s){ return s.get(k); }); },
          lege: function(k, v){ return tx("readwrite", function(s){ return s.put(v, k); }); },
          loesche: function(k){ return tx("readwrite", function(s){ return s.delete(k); }); }
        });
      };
    });
  }

  function lokal(ns){
    var p = "sc-" + ns + ":";
    localStorage.setItem(p + "probe", "1"); localStorage.removeItem(p + "probe");
    return {
      art: "localstorage",
      hole: function(k){ try { var t = localStorage.getItem(p + k); return Promise.resolve(t === null ? undefined : JSON.parse(t)); } catch(e){ return Promise.reject(e); } },
      lege: function(k, v){ try { localStorage.setItem(p + k, JSON.stringify(v)); return Promise.resolve(); } catch(e){ return Promise.reject(e); } },
      loesche: function(k){ try { localStorage.removeItem(p + k); return Promise.resolve(); } catch(e){ return Promise.reject(e); } }
    };
  }

  function fluechtig(){
    var m = {};
    return {
      art: "speicher",
      hole: function(k){ return Promise.resolve(kopie(m[k])); },
      lege: function(k, v){ m[k] = kopie(v); return Promise.resolve(); },
      loesche: function(k){ delete m[k]; return Promise.resolve(); }
    };
  }

  // bevorzugt: "localstorage" erzwingt den Rückfall (für Tests)
  SC.Speicher.backend = function(ns, bevorzugt){
    function rueckfall(){ try { return lokal(ns); } catch(e){ return fluechtig(); } }
    if(bevorzugt === "localstorage") return Promise.resolve(rueckfall());
    return idb(ns).catch(rueckfall);
  };

  SC.Speicher.dauerhaftAnfragen = function(){
    if(navigator.storage && navigator.storage.persist) return navigator.storage.persist().catch(function(){ return false; });
    return Promise.resolve(false);
  };
})();

// Slots: Liste der Welten ("welten") und je Welt die Daten ("welt:<id>")
SC.Slots = function(backend){ this.b = backend; this._kette = Promise.resolve(); };
(function(){
  function meta(d){ return { id: d.id, name: d.name, seed: d.seed, modus: d.modus, erstellt: d.erstellt, zuletzt: d.zuletzt, zuletztExport: d.zuletztExport, format: d.format }; }

  SC.Slots.prototype.liste = function(){
    return this.b.hole("welten").then(function(l){
      return (l || []).map(function(m){ m.zuNeu = m.format > SC.FORMAT; return m; }).sort(function(a, b){ return (b.zuletzt || 0) - (a.zuletzt || 0); });
    });
  };

  SC.Slots.prototype.lade = function(id){
    var b = this.b;
    return b.hole("welt:" + id).then(function(d){
      if(!d) throw new Error("Welt nicht gefunden");
      if(d.format > SC.FORMAT) throw new SC.ZuNeuFehler(d.format);
      if(d.format === SC.FORMAT) return SC.Spielstand.migriere(d).daten;
      // Vor der Migration eine Kopie des alten Stands aufheben
      return b.lege("welt:" + id + ":sicherung-f" + d.format, d).then(function(){ return SC.Spielstand.migriere(d).daten; });
    });
  };

  // Listenverändernde Vorgänge laufen nacheinander, sonst überschreibt ein überlappender Vorgang den Eintrag des anderen.
  // Ein Fehlschlag geht nur an den Aufrufer und blockiert die Kette nicht.
  SC.Slots.prototype._nacheinander = function(fn){
    var p = this._kette.then(fn);
    this._kette = p.then(function(){}, function(){});
    return p;
  };

  // Erst Daten, dann Liste: schlägt das Schreiben fehl, bleibt alles beim Alten
  SC.Slots.prototype.speichere = function(daten){
    var b = this.b;
    if(daten && daten.id === "gast") return Promise.reject(new Error("Gastwelt wird nicht gespeichert")); // gehört dem Gastgeber
    daten.zuletzt = Date.now();
    return this._nacheinander(function(){
      return b.lege("welt:" + daten.id, daten).then(function(){ return b.hole("welten"); }).then(function(l){
        l = (l || []).filter(function(m){ return m.id !== daten.id; });
        l.push(meta(daten));
        return b.lege("welten", l);
      });
    });
  };

  SC.Slots.prototype.kopiere = function(id){
    var s = this;
    return this.b.hole("welt:" + id).then(function(d){
      var a = new Uint32Array(2); crypto.getRandomValues(a);
      d.id = a[0].toString(36) + a[1].toString(36); d.name = d.name + " (" + SC.T.kopie + ")"; d.zuletztExport = null;
      return s.speichere(d).then(function(){ return d.id; });
    });
  };

  SC.Slots.prototype.benenneUm = function(id, name){
    var s = this;
    return this.b.hole("welt:" + id).then(function(d){ d.name = name; return s.speichere(d); });
  };

  SC.Slots.prototype.loesche = function(id){
    var b = this.b;
    return this._nacheinander(function(){
      return b.hole("welten").then(function(l){ return b.lege("welten", (l || []).filter(function(m){ return m.id !== id; })); })
        .then(function(){ return b.loesche("welt:" + id); });
    });
  };
})();
