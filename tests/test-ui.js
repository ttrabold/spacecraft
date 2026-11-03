function uiBackend(){ return {art:"speicher",m:{},hole:function(k){return Promise.resolve(this.m[k]===undefined?undefined:JSON.parse(JSON.stringify(this.m[k])));},lege:function(k,v){this.m[k]=JSON.parse(JSON.stringify(v));return Promise.resolve();},loesche:function(k){delete this.m[k];return Promise.resolve();}}; }
function leereUI(w,slots){ return new SC.UI(w,{slots:slots||null,beiStart:function(){},beiImport:function(){},beiExport:function(){}}); }
test("Export-Erinnerung", function(){ var tag=864e5,jetzt=100*tag; wahr(!SC.UI.exportErinnerung({erstellt:jetzt-tag,zuletztExport:null},jetzt)); wahr(SC.UI.exportErinnerung({erstellt:jetzt-4*tag,zuletztExport:null},jetzt)); wahr(SC.UI.exportErinnerung({erstellt:0,zuletztExport:jetzt-8*tag},jetzt)); wahr(!SC.UI.exportErinnerung({erstellt:0,zuletztExport:jetzt-2*tag},jetzt)); });
test("Weltliste zeigt Welten", function(){ var w=document.createElement("div"),s=new SC.Slots(uiBackend()); return s.speichere(SC.Spielstand.neu({name:"Sternenhafen",seedText:"a",modus:"kreativ"})).then(function(){ return leereUI(w,s).zeigeWeltliste(); }).then(function(){ wahr(w.textContent.indexOf("Sternenhafen")>=0); }); });
test("Welt aus neuerer Version ist gesperrt", function(){ var w=document.createElement("div"),b=uiBackend(),s=new SC.Slots(b); b.m["welten"]=[{id:"z",name:"Zukunft",format:99,zuletzt:1}]; return leereUI(w,s).zeigeWeltliste().then(function(){ wahr(w.textContent.indexOf(SC.T.brauchtNeuereVersion)>=0); var k=w.querySelector('[data-aktion="spielen"][data-id="z"]'); wahr(k&&k.disabled); }); });
test("Löschen braucht zwei Klicks", function(){ var w=document.createElement("div"),s=new SC.Slots(uiBackend()),d=SC.Spielstand.neu({name:"Weg",seedText:"a",modus:"kreativ"}),ui; return s.speichere(d).then(function(){ ui=leereUI(w,s); return ui.zeigeWeltliste(); }).then(function(){ w.querySelector('[data-aktion="loeschen"]').click(); return s.liste(); }).then(function(l){ gleich(l.length,1,"nach erstem Klick"); return ui._klick(w.querySelector('[data-aktion="loeschen"]')); }).then(function(){ return s.liste(); }).then(function(l){ gleich(l.length,0); }); });
// "Survival ist sichtbar, aber gesperrt" ist seit Stufe 2 ersetzt durch test-ui-rucksack.js "Survival und Schwierigkeit in Neue Welt"
test("Blockauswahl zeigt nur auswählbare Blöcke", function(){ var w=document.createElement("div"),ui=leereUI(w),gewaehlt=null; ui.zeigeBlockauswahl(function(id){gewaehlt=id;}); wahr(!w.querySelector('[data-block="'+SC.B.GRUNDGESTEIN+'"]')); w.querySelector('[data-block="'+SC.B.GLAS+'"]').click(); gleich(gewaehlt,SC.B.GLAS); });
test("Schnellleiste im HUD", function(){ var w=document.createElement("div"),ui=leereUI(w),s=new SC.Spieler({id:"a",pos:[0,0,0],modus:"kreativ",schnellleiste:[1,2,3,4,5,6,7,8,9]}); s.auswahl=4; ui.hud(s,{fps:60}); gleich(w.querySelectorAll(".leiste-platz").length,9); wahr(w.querySelectorAll(".leiste-platz")[4].classList.contains("gewaehlt")); });
test("Neue Welt hat Feld Figurname und übergibt es", function(){ var w=document.createElement("div"),gest=null,ui=new SC.UI(w,{slots:new SC.Slots(uiBackend()),beiStart:function(d){gest=d;},beiImport:function(){},beiExport:function(){}}); ui.zeigeNeueWelt(); var f=w.querySelector("#nw-figur"); wahr(!!f); gleich(f.getAttribute("maxlength"),"16"); f.value="Ben"; return ui._klick(w.querySelector('[data-aktion="los"]')).then(function(){ gleich(gest.spieler.name,"Ben"); }); });
test("Einstellungen: Bildrate standardmäßig 60, wählbar 30 / 60 / unbegrenzt", function(){
  gleich(SC.Einstellungen.standard().bildrate, 60);
  var w = document.createElement("div"), e = SC.Einstellungen.standard(), neu = null, ui = new SC.UI(w, { einstellungen: e, beiEinstellungen: function(x){ neu = x; } });
  ui.zeigeEinstellungen(function(){}); var sel = w.querySelector("#e-bildrate"); wahr(sel, "Auswahl da"); gleich(sel.options.length, 3); gleich(sel.value, "60");
  sel.value = "0"; sel.dispatchEvent(new Event("change")); gleich(neu && neu.bildrate, 0, "unbegrenzt");
});
test("Einstellungen: Auflösung wählbar, am Computer standardmäßig normal", function(){
  var e = SC.Einstellungen.standard(); gleich(e.aufloesung, matchMedia("(pointer: coarse)").matches ? "hoch" : "normal");
  var w = document.createElement("div"), neu = null, ui = new SC.UI(w, { einstellungen: e, beiEinstellungen: function(x){ neu = x; } });
  ui.zeigeEinstellungen(function(){}); var sel = w.querySelector("#e-aufloesung"); wahr(sel, "Auswahl da"); gleich(sel.options.length, 2);
  sel.value = "hoch"; sel.dispatchEvent(new Event("change")); gleich(neu && neu.aufloesung, "hoch");
});
test("Touch: Schnellleiste und Entwicklerfenster liegen über der Blickfläche (#84)", function(){
  // eigenes Fenster im iPhone-Format mit dem echten Stylesheet
  var f = document.createElement("iframe"); f.style.cssText = "position:absolute;left:-2000px;top:0;width:390px;height:700px;border:0"; document.body.appendChild(f);
  var d = f.contentDocument; d.open(); d.write('<link rel="stylesheet" href="../css/style.css"><div class="ui" style="position:fixed;inset:0"><div class="touch"><div class="touch-blick"></div></div><div class="leiste"></div><div class="entwickler" style="width:300px;height:80px"></div></div>'); d.close();
  return new Promise(function(fertig){ f.onload = fertig; setTimeout(fertig, 1500); }).then(function(){
    var w = d.createElement("div"), ui = leereUI(w), s = new SC.Spieler({ id: "a", pos: [0, 0, 0], modus: "kreativ", schnellleiste: [1, 2, 3, 4, 5, 6, 7, 8, 9] });
    ui.hud(s, { fps: 60 }); d.querySelector(".leiste").innerHTML = w.querySelector(".leiste").innerHTML;
    var fehl = [];
    Array.prototype.forEach.call(d.querySelectorAll(".leiste-platz"), function(b, i){ var r = b.getBoundingClientRect(), el = d.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); if(!(el === b || b.contains(el))) fehl.push(i + 1); });
    var e = d.querySelector(".entwickler"), r = e.getBoundingClientRect(), el = d.elementFromPoint(r.right - 5, r.top + 5);
    document.body.removeChild(f);
    gleich(fehl.join(","), "", "verdeckte Plätze"); wahr(el === e, "Entwicklerfenster frei");
  });
});
test("Spielanleitung über Pausenmenü und Weltliste, Zurück führt zurück (#88)", function(){
  var A = SC.T.anleitung; wahr(A && A.abschnitte.length >= 8, "Abschnitte da");
  var w = document.createElement("div"), zur = 0, ui = leereUI(w);
  ui.zeigeAnleitung(function(){ zur++; });
  A.abschnitte.forEach(function(a){ wahr(w.textContent.indexOf(a[0]) >= 0, "Abschnitt " + a[0]); });
  wahr(w.textContent.indexOf("Platz wechseln") >= 0, "Sitzwechsel erwähnt");
  w.querySelector('[data-aktion="zurueck"]').click(); gleich(zur, 1);
  var w2 = document.createElement("div"), ui2 = leereUI(w2); ui2.zeigePause({ name: "Welt", modus: "kreativ", schwierigkeit: "leicht" });
  w2.querySelector('[data-aktion="anleitung"]').click(); wahr(w2.textContent.indexOf(A.titel) >= 0, "aus der Pause");
  w2.querySelector('[data-aktion="zurueck"]').click(); wahr(w2.querySelector('[data-aktion="weiter"]'), "zurück in der Pause");
  var w3 = document.createElement("div"), s = new SC.Slots(uiBackend()), ui3 = leereUI(w3, s);
  return ui3.zeigeWeltliste().then(function(){ w3.querySelector('[data-aktion="anleitung"]').click(); wahr(w3.textContent.indexOf(A.titel) >= 0, "aus der Weltliste"); });
});
test("Sternenkarte: Planeten antippbar, Marker, ausblenden (#89, #90)", function(){
  var w = document.createElement("div"), ui = leereUI(w), gew = null;
  ui.allKarte({ planeten: [{ id: "start", name: "Heimatplanet", x: 0, z: 0, ziel: false }, { id: "glutfrost", name: "Glutfrost", x: 5200, z: -1800, ziel: true }], schiff: { x: 100, z: 50, blick: 0.5 },
    marker: [{ id: "glutfrost", name: "Glutfrost", text: "Glutfrost · 30 s", x: 300, y: 200, aussen: false, ziel: true }, { id: "start", name: "Heimatplanet", text: "Heimatplanet · 2 s", x: 0, y: 100, aussen: true, winkel: Math.PI }] }, function(id){ gew = id; });
  var k = w.querySelector(".sternenkarte"); wahr(k && !k.hidden, "Karte da"); gleich(k.querySelectorAll("[data-planet]").length, 2);
  wahr(k.querySelector('[data-planet="glutfrost"]').classList.contains("ziel"), "Ziel markiert");
  k.querySelector('[data-planet="start"]').click(); gleich(gew, "start");
  var m = w.querySelectorAll(".planet-marker:not([hidden])"); gleich(m.length, 2); wahr(w.textContent.indexOf("Glutfrost · 30 s") >= 0, "Markertext");
  ui.allKarte(null); wahr(k.hidden, "Karte aus"); gleich(w.querySelectorAll(".planet-marker:not([hidden])").length, 0, "Marker aus");
});
test("Schnellleiste im All ausgeblendet", function(){ var w=document.createElement("div"),ui=leereUI(w),s=new SC.Spieler({id:"a",pos:[0,0,0],modus:"kreativ",schnellleiste:[1,2,3,4,5,6,7,8,9]}); ui.hud(s,{fps:60}); wahr(!w.querySelector(".leiste").hidden,"am Boden da"); ui.hud(s,{fps:60,all:true}); wahr(w.querySelector(".leiste").hidden,"im All weg"); ui.hud(s,{fps:60}); wahr(!w.querySelector(".leiste").hidden,"wieder da"); });
test("Spielanleitung: Xbox-Controller am Boden und im All", function(){ var t=JSON.stringify(SC.T.anleitung.abschnitte); ["Controller (Xbox)","Controller im All","LB","RB","Ansichtstaste","Menütaste"].forEach(function(x){ wahr(t.indexOf(x)>=0,x); }); });
test("Cockpit im All: Hinweise rücken darunter", function(){ var w=document.createElement("div"),ui=leereUI(w); wahr(!w.classList.contains("mit-cockpit"),"ohne Cockpit"); ui.cockpit({ziel:null,sekunden:null,schild:100,sprung:false}); wahr(w.classList.contains("mit-cockpit"),"mit Cockpit"); ui.cockpit(null); wahr(!w.classList.contains("mit-cockpit"),"wieder normal"); });
test("HUD: Fadenkreuz im Fahrzeug", function(){ var w=document.createElement("div"),ui=leereUI(w),s=new SC.Spieler({id:"a",pos:[0,0,0],modus:"survival"}); ui.hud(s,{fps:60,fadenkreuz:"fahrzeug"}); var f=w.querySelector(".fadenkreuz"); wahr(f.classList.contains("fahrzeug")&&!f.classList.contains("ziel")); ui.hud(s,{fps:60,fadenkreuz:"fahrzeug-ziel"}); wahr(f.classList.contains("ziel")); ui.hud(s,{fps:60}); wahr(!f.classList.contains("fahrzeug")&&!f.classList.contains("ziel")); });
test("Sternenkarte: Tipp neben einen Planeten wählt den nächstgelegenen", function(){
  var w = document.createElement("div"), ui = leereUI(w), gew = null; document.body.appendChild(w);
  ui.allKarte({ planeten: [{ id: "a", name: "A", x: -100, z: -100 }, { id: "b", name: "B", x: 100, z: 100 }], schiff: { x: 0, z: 0, blick: 0 }, marker: [] }, function(id){ gew = id; });
  var k = w.querySelector(".sternenkarte"); k.style.cssText = "position:fixed;left:0;top:0;width:100px;height:100px";
  k.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 70, clientY: 75 })); gleich(gew, "b", "unten rechts");
  k.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 20, clientY: 30 })); gleich(gew, "a", "oben links");
  document.body.removeChild(w);
});
test("Controller-Hilfe am Rand: zeigen, aktualisieren, ausblenden", function(){
  var w = document.createElement("div"), ui = leereUI(w);
  ui.controllerHilfe([{ taste: "A", symbol: "⤒", text: "Springen" }, { taste: "RT", symbol: "⛏", text: "Abbauen" }]);
  var h = w.querySelector(".controller-hilfe"); wahr(h && !h.hidden); gleich(h.querySelectorAll(".ch-zeile").length, 2); wahr(h.textContent.indexOf("Springen") >= 0); wahr(h.querySelector(".ch-taste.a"), "A farbig");
  ui.controllerHilfe(null); wahr(h.hidden, "weg");
});
test("Statusfeld oben links zeigt Modus und die gewählte Sache", function(){
  var w=document.createElement("div"); document.body.appendChild(w); var ui=ui2(w), k=k2(), s=k.spieler;
  s.schnellleiste=[1,2,3,4,5,6,7,8,9];
  ui.hud(s,{status:{name:"Blauer Helm",anzahl:1}});
  var st=w.querySelector(".status"); wahr(st,"Statusfeld fehlt");
  wahr(st.textContent.indexOf("Blauer Helm")>=0,"Name der gewählten Sache");
  gleich(st.querySelector(".status-sache").textContent,"Blauer Helm");
  wahr(st.contains(w.querySelector(".modus-anzeige")),"Modusanzeige im Statusfeld");
    w.remove();
});
test("Statusfeld zeigt die Anzahl der gewählten Sache mit ×", function(){
  var w=document.createElement("div"); document.body.appendChild(w); var ui=ui2(w), s=new SC.Spieler({id:"a",pos:[0,0,0],modus:"kreativ",schnellleiste:[1,2,3,4,5,6,7,8,9]});
  ui.hud(s,{status:{name:"Erz",anzahl:7}});
  gleich(w.querySelector(".status-sache").textContent,"Erz × 7","Anzahl über 1 mit ×");
  ui.hud(s,{status:{name:"Erz",anzahl:1}});
  gleich(w.querySelector(".status-sache").textContent,"Erz","bei einer Sache kein ×");
  w.remove();
});
test("Statusfeld zeigt die Stufe und die Kampf-Balken", function(){
  var w=document.createElement("div"); document.body.appendChild(w); var ui=ui2(w), k=k2(), s=k.spieler;
  s.schnellleiste=[1,2,3,4,5,6,7,8,9]; ui.hud(s,{}); ui.kampfHud(k,[]);
    var st=w.querySelector(".status"); wahr(st.contains(w.querySelector(".kampf")),"Balken im Statusfeld");
  gleich(st.querySelector(".status-stufe").textContent,"Stufe 1");
  ui.statusSache(null); gleich(st.querySelector(".status-sache").textContent,"");
  w.remove();
});
function zf(html, aktionen){ var w=document.createElement("div"); document.body.appendChild(w); var ui=ui2(w); ui._zeige(html,aktionen); return { w: w, ui: ui }; }
function raster(z){ var h='<div data-zone="'+z+'" style="display:grid;grid-template-columns:repeat(3,40px);grid-auto-rows:40px;gap:0">'; for(var i=0;i<9;i++) h+='<button data-aktion="x" data-i="'+i+'">'+i+'</button>'; return h+'</div>'; }
test("Steuerkreuz springt im Raster eine ganze Reihe", function(){
  var a=zf(raster("raster"),{x:function(){}}); a.ui.zone(0);
  gleich(document.activeElement.getAttribute("data-i"),"0");
  a.ui.navigiere("runter"); gleich(document.activeElement.getAttribute("data-i"),"3","eine Reihe runter");
  a.ui.navigiere("runter"); gleich(document.activeElement.getAttribute("data-i"),"6");
  a.ui.navigiere("rechts"); gleich(document.activeElement.getAttribute("data-i"),"7","ein Feld rechts");
  a.ui.navigiere("hoch"); gleich(document.activeElement.getAttribute("data-i"),"4","eine Reihe hoch");
  a.w.remove();
});
test("Am Rand der Zone wird innerhalb der Zone wrapped", function(){
  var a=zf(raster("liste"),{x:function(){}}); a.ui.zone(0);
  a.ui.navigiere("hoch"); gleich(document.activeElement.getAttribute("data-i"),"6","wrapped zur letzten Reihe");
  a.ui.navigiere("links"); gleich(document.activeElement.getAttribute("data-i"),"8","wrapped in der Reihe");
  a.w.remove();
});
test("Liste ohne Raster: eine Zeile je Element, Bewegung in Leserichtung", function(){
  var b=zf('<div data-zone="liste"><button data-aktion="x" style="display:block">1</button><button data-aktion="x" style="display:block">2</button></div>',{x:function(){}});
  b.ui.zone(0); b.ui.navigiere("runter"); gleich(document.activeElement.textContent,"2");
  b.ui.navigiere("links"); gleich(document.activeElement.textContent,"1","Zeile mit einem Feld: Leserichtung");
  b.w.remove();
});
test("LB/RB wechseln die Zone", function(){
  var a=zf('<div data-zone="ausruestung"><button data-aktion="x">A</button></div><div data-zone="detail"><button data-aktion="x">D</button></div>',{x:function(){}});
  a.ui.zone(0); gleich(document.activeElement.textContent,"A");
  a.ui.zone(1); gleich(document.activeElement.textContent,"D");
  a.ui.zone(-1); gleich(document.activeElement.textContent,"A");
  a.w.remove();
});
test("Bewegung bleibt in der Zone des Fokus", function(){
  var a=zf('<div data-zone="a"><button data-aktion="x" data-i="a0" style="display:block">a0</button><button data-aktion="x" data-i="a1" style="display:block">a1</button></div><div data-zone="b"><button data-aktion="x" data-i="b0" style="display:block">b0</button></div>',{x:function(){}});
  a.ui.zone(0);
  a.ui.navigiere("runter"); gleich(document.activeElement.getAttribute("data-i"),"a1");
  a.ui.navigiere("runter"); gleich(document.activeElement.getAttribute("data-i"),"a0","wrapped in der Zone, nicht in Zone b");
  a.w.remove();
});
test("Der Fokus rollt ins Sichtbare", function(){
  var h='<div data-zone="raster" style="display:block;height:60px;overflow:auto">';
  for(var i=0;i<10;i++) h+='<button data-aktion="x" data-i="'+i+'" style="display:block;height:20px">'+i+'</button>';
  var a=zf(h+'</div>',{x:function(){}}); a.ui.zone(0);
  for(var i=0;i<5;i++) a.ui.navigiere("runter");
  wahr(a.w.querySelector("[data-zone]").scrollTop>0,"gerollt");
  a.w.remove();
});
test("Regler werden direkt verstellt", function(){
  var a=zf('<div data-zone="a"><input type="range" data-aktion="x" value="5" step="1"><button data-aktion="x">ok</button></div>',{x:function(){}});
  a.ui.zone(0); gleich(document.activeElement.type,"range");
  a.ui.navigiere("rechts"); gleich(document.activeElement.value,"6","verstellt");
  a.ui.navigiere("links"); gleich(document.activeElement.value,"5");
  a.ui.navigiere("runter"); gleich(document.activeElement.tagName,"BUTTON","verlässt den Regler");
  a.w.remove();
});
test("B verlässt zuerst die Zone", function(){
  var geschlossen=false, w=document.createElement("div"); document.body.appendChild(w);
  var ui=ui2(w);
  ui._zeige('<div data-zone="raster"><button data-aktion="x">R</button></div><div data-zone="detail"><button data-aktion="x">D</button></div><div data-zone="unten"><button data-aktion="fertig">F</button></div>',
    {x:function(){},fertig:function(){geschlossen=true;}}, { startZone: "raster" });
  ui.zone(1); gleich(document.activeElement.textContent,"D");
  ui.zurueck(); gleich(document.activeElement.textContent,"R","erst die Zone verlassen");
  ui.zurueck(); wahr(geschlossen,"dann geschlossen");
  w.remove();
});
test("Rucksack, Werkbank und Truhe sind Seitenpanels", function(){
  var w=document.createElement("div"); document.body.appendChild(w); var ui=ui2(w), k=k2();
  ui.zeigeRucksack(k,{}); wahr(w.querySelector(".fenster").classList.contains("seite"),"Rucksack");
  ui.zeigeWerkbank(k,{station:"hand"}); wahr(w.querySelector(".fenster").classList.contains("seite"),"Werkbank");
  var anb={hole:function(){ return Promise.resolve({ plaetze: [] }); },nimm:function(){ return Promise.resolve({ plaetze: [] }); },lege:function(){ return Promise.resolve({ plaetze: [] }); }};
  ui.zeigeTruhe(k,anb,{});
  return new Promise(function(ok){ setTimeout(ok,0); }).then(function(){
    wahr(w.querySelector(".fenster").classList.contains("seite"),"Truhe");
    var s=new SC.Slots(uiBackend());
    return s.speichere(SC.Spielstand.neu({name:"Sternenhafen",seedText:"a",modus:"kreativ"})).then(function(){
      return leereUI(w,s).zeigeWeltliste();
    }).then(function(){
      wahr(!w.querySelector(".fenster").classList.contains("seite"),"Weltliste bleibt zentrales Fenster");
      w.remove();
    });
  });
});
test("Seitenpanels: die Blockauswahl mit ihrer Raster-Zone", function(){
  var w=document.createElement("div"); document.body.appendChild(w); var ui=ui2(w);
  ui.zeigeBlockauswahl(function(){},{});
  var fehlt=[];
  if(!w.querySelector(".fenster").classList.contains("seite")) fehlt.push("Blockauswahl ohne Seitenpanel");
  var r=w.querySelector(".raster.bl");
  if(!r || r.getAttribute("data-zone")!=="raster") fehlt.push("Blockraster ohne Zone");
  gleich(fehlt.join(","),"","Beides da");
  w.remove();
});
test("menueAktion ruft die passende UI-Aktion", function(){
  var gerufen=[], w=document.createElement("div"); document.body.appendChild(w); var ui=ui2(w);
  ui.bestaetige=function(){gerufen.push("ok");}; ui.zurueck=function(){gerufen.push("zurueck");};
  ui.schliesse=function(){gerufen.push("schliesse");};
  ui.zone=function(s){gerufen.push("zone"+s);}; ui.kurzaktion=function(){gerufen.push("kurz");};
  ui.navigiere=function(r){gerufen.push(r);};
  ["ok","zurueck","schliessen","hoch","runter","links","rechts","zoneVor","zoneZurueck","kurzaktion"].forEach(function(r){ ui.menueAktion(r); });
  gleich(gerufen.join(","),"ok,zurueck,schliesse,hoch,runter,links,rechts,zone1,zone-1,kurz");
  w.remove();
});
test("Controller-Hilfe in Menüs zeigt die Zonentasten", function(){
  var l=SC.controllerHilfe({menue:true});
  ["✚","LB","RB","A","Y","B","☰"].forEach(function(t){ wahr(l.some(function(z){ return z.taste===t; }), t + " fehlt"); });
  wahr(l.some(function(z){ return z.text===SC.T.steuerHilfe.zone; }), "Zone");
  wahr(l.some(function(z){ return z.taste==="B" && z.text===SC.T.steuerHilfe.zurueck; }), "B zeigt Zurück");
  var s=SC.controllerHilfe({survival:true}); wahr(!s.some(function(z){ return z.text===SC.T.steuerHilfe.zone; }), "ohne Menü keine Zone");
});
test("Das Entwicklerpanel gilt als offenes Menü", function(){
  var w=document.createElement("div"); document.body.appendChild(w); var ui=ui2(w);
  gleich(ui.menueOffen(), false);
  var e=document.createElement("div"); e.className="entwickler"; w.appendChild(e);
  gleich(ui.menueOffen(), true);
  e.hidden = true; gleich(ui.menueOffen(), false);
  w.remove();
});
test("Bei einem Seitenpanel liegt das HUD über der Menüebene", function(){
  var w=document.createElement("div"); document.body.appendChild(w); var ui=ui2(w), k=k2();
  ui.zeigeRucksack(k,{});
  wahr(w.querySelector(".hud").classList.contains("seitenpanel"),"Klasse am HUD fehlt");
  ui.schliesse();
  wahr(!w.querySelector(".hud").classList.contains("seitenpanel"),"Klasse bleibt nach dem Schließen");
  w.remove();
});
test("Blockauswahl: Zonen erreichen die Reiter und die untere Reihe", function(){
  var w=document.createElement("div"); document.body.appendChild(w); var ui=ui2(w);
  ui.zeigeBlockauswahl(function(){}, {ausruestung:true});
  var f=w.querySelector('.raster.bl button'); f.focus();
  wahr(w.querySelector('.reihe.reiter').getAttribute("data-zone")==="reiter","Reiter-Zone fehlt");
  wahr(w.querySelector('.reihe:not(.reiter)').getAttribute("data-zone")==="aktionen","untere Reihe ohne Zone");
  // Im Dokument stehen die Reiter vor dem Raster: von der Raster-Zone führt LB zu den Reitern, RB zur unteren Reihe
  ui.zone(-1); gleich(document.activeElement.getAttribute("data-aktion"), "reiter", "LB von der Raster-Zone zu den Reitern");
  ui.zone(1); gleich(document.activeElement.getAttribute("data-aktion"), "block", "RB zurück ins Raster");
  ui.zone(1); gleich(document.activeElement.getAttribute("data-aktion"), "fertig", "RB zur unteren Reihe");
  w.remove();
});
