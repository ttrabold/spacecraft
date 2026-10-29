test("Uhrzeit aus der Tageszeit", function(){ gleich(SC.Entwickler.uhrzeit(0),"00:00"); gleich(SC.Entwickler.uhrzeit(0.5),"12:00"); gleich(SC.Entwickler.uhrzeit(0.75),"18:00"); gleich(SC.Entwickler.uhrzeit(0.999),"23:58"); });
test("nächstes Bauwerk eines Typs, auch über den Rand", function(){ var p=new SC.Planet({id:"start",seed:4242}); var b=SC.Entwickler.naechstesBauwerk(p,5,5,"dungeon"); wahr(b&&b.typ==="dungeon"); var d=SC.Entwickler.ringAbstand(p,5,5,b.x+b.breite/2,b.z+b.tiefe/2); for(var rx=0;rx<16;rx++)for(var rz=0;rz<16;rz++) SC.Bauwerke.inRegion(p,rx,rz).forEach(function(c){ if(c.typ==="dungeon") wahr(SC.Entwickler.ringAbstand(p,5,5,c.x+c.breite/2,c.z+c.tiefe/2)>=d-1e-9); }); });
test("Ringabstand nutzt den Umschlagrand", function(){ var p=new SC.Planet({id:"start",seed:1}); gleich(SC.Entwickler.ringAbstand(p,2,0,2046,0),4); });
test("Teleportziel im Dungeon ist frei", function(){ var p=new SC.Planet({id:"start",seed:4242}),w=new SC.Welt(p),b=SC.Entwickler.naechstesBauwerk(p,5,5,"dungeon"),z=SC.Entwickler.teleportZiel(w,b); wahr(!SC.BLOECKE[w.holeBlock(z[0],z[1],z[2])].fest); wahr(!SC.BLOECKE[w.holeBlock(z[0],z[1]+1,z[2])].fest); });
test("F3 öffnet die Entwicklerwerkzeuge", function(){ var e=new SC.Eingabe(document.createElement("canvas"),document.createElement("div")); e._druecke("F3"); wahr(e.zustand().entwickler); e._los("F3"); e.entferne(); });
test("Entwicklerwerkzeuge sind standardmäßig aus", function(){ wahr(SC.Einstellungen.standard().entwickler===false); });
test("Panel zeigt Zeitregler und Teleport", function(){ var w=document.createElement("div"),spiel={tageszeit:0.25,zeitTempo:1,spieler:new SC.Spieler({id:"a",pos:[1,70,1],modus:"kreativ"}),welt:new SC.Welt(new SC.Planet({id:"start",seed:3})),render:{fps:60,chunks:new Map(),chunkGrenzen:false,sichtweite:6},daten:{seed:"x"}},pn=new SC.Entwickler.Panel(w,spiel); pn.zeige(); wahr(w.querySelector("#ew-zeit")); wahr(w.querySelector('[data-ew="tp-dungeon"]')); w.querySelector('[data-ew="mittag"]').click(); gleich(spiel.tageszeit,0.5); w.querySelector('[data-ew="anhalten"]').click(); gleich(spiel.zeitTempo,0); pn.aktualisiere(); wahr(w.textContent.indexOf("12:00")>=0); });
test("Entwickler: Gegner erscheinen lassen", function(){ var w=document.createElement("div"),welt=new SC.Welt(new SC.Planet({id:"start",seed:3})),sp=new SC.Spieler({id:"a",pos:[1,70,1],modus:"survival"}),spiel={tageszeit:0.25,zeitTempo:1,spieler:sp,welt:welt,render:{fps:60,chunks:new Map(),chunkGrenzen:false,sichtweite:6},daten:{seed:"x"}},pn=new SC.Entwickler.Panel(w,spiel); pn.zeige(); w.querySelector('[data-ew="gegner"]').click(); var n=0; welt.wesen.forEach(function(e){ if(e.art==="gegner") n++; }); gleich(n,1); w.querySelector('[data-ew="gegner-weg"]').click(); n=0; welt.wesen.forEach(function(e){ if(e.art==="gegner") n++; }); gleich(n,0); });
test("F3 reist zu Glutfrost", function(){
  var sl = mspSlots(), s = mspSpielVoll(sl), d = SC.Spielstand.neu({ name: "F3", seedText: "f3", modus: "kreativ", figurName: "T" }); s.starte(d); s.render.sichtweite = 6; s.render.chunks = new Map(); s.render.chunkGrenzen = false;
  var div = document.createElement("div"), pn = new SC.Entwickler.Panel(div, s); pn.zeige(); var sel = div.querySelector("#ew-planet"); wahr(sel, "Auswahl"); gleich(sel.options.length, 3);
  sel.value = "glutfrost"; div.querySelector('[data-ew="planet"]').click();
  return new Promise(function(ok){ setTimeout(ok, 50); }).then(function(){ gleich(s.welt.planet.id, "glutfrost"); });
});
test("Entwickler: Gast teleportiert sich zum Gastgeber, Gastgeber sieht den Knopf nicht (#85)", function(){
  var u;
  return mspZwei().then(function(x){
    u = x; [u.h, u.g].forEach(function(s){ s.render.sichtweite = 6; s.render.chunks = new Map(); s.render.chunkGrenzen = false; });
    var dh = document.createElement("div"), ph = new SC.Entwickler.Panel(dh, u.h); ph.zeige(); wahr(!dh.querySelector('[data-ew="zum-gastgeber"]'), "Gastgeber ohne Knopf");
    var sp = u.h.spieler; sp.pos = [sp.pos[0] + 300, sp.pos[1], sp.pos[2] + 200];
    u.h._raumBild(0.1, false); return mspLauf(u.netz);
  }).then(function(){
    u.g._raumBild(0.1, false);
    var d = document.createElement("div"), p = new SC.Entwickler.Panel(d, u.g); p.zeige(); var k = d.querySelector('[data-ew="zum-gastgeber"]'); wahr(k, "Knopf beim Gast"); k.click();
    var a = u.g.spieler.pos, b = u.h.spieler.pos, P = 2048, dx = SC.mod(a[0] - b[0] + P / 2, P) - P / 2, dz = SC.mod(a[2] - b[2] + P / 2, P) - P / 2;
    wahr(Math.hypot(dx, dz) < 4, "neben dem Gastgeber: " + a + " / " + b); gleich(u.g.spieler.geschw.join(), "0,0,0");
    mspFertig();
  }, mspFehler);
});
