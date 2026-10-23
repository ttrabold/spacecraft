// Service-Worker: Cache-Name aus der Version (?v= beim Registrieren)
var V = new URL(self.location).searchParams.get("v") || "0";
var CACHE = "spacecraft-" + V;
self.addEventListener("install", function(e){ self.skipWaiting(); });
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(k){ return Promise.all(k.filter(function(n){ return n.indexOf("spacecraft-") === 0 && n !== CACHE; }).map(function(n){ return caches.delete(n); })); }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener("fetch", function(e){
  var r = e.request;
  if(r.method !== "GET" || new URL(r.url).origin !== self.location.origin) return;
  var seite = r.mode === "navigate" || /\/index\.html$/.test(new URL(r.url).pathname);
  if(seite){
    // Seite: erst Netz, sonst Cache
    e.respondWith(fetch(r).then(function(a){ var k = a.clone(); caches.open(CACHE).then(function(c){ c.put(r, k); }); return a; }).catch(function(){ return caches.match(r); }));
  } else {
    // Dateien mit ?v=: erst Cache, sonst Netz
    e.respondWith(caches.match(r).then(function(t){ return t || fetch(r).then(function(a){ var k = a.clone(); caches.open(CACHE).then(function(c){ c.put(r, k); }); return a; }); }));
  }
});
