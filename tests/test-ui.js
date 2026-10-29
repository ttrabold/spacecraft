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
