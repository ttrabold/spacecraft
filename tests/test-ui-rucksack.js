function k2(){ var w=new SC.Welt(new SC.Planet({id:"start",seed:5})),d=SC.Spielstand.neu({name:"K",seedText:"k",modus:"survival"}),s=new SC.Spieler({id:"a",pos:[4.5,61,4.5],modus:"survival"}); return new SC.Kampf(w,s,d,SC.zufall(9)); }
function ui2(w,o){ return new SC.UI(w,Object.assign({slots:null,beiStart:function(){},beiImport:function(){},beiExport:function(){}},o||{})); }
test("Survival und Schwierigkeit in Neue Welt", function(){ var w=document.createElement("div"),ui=ui2(w); ui.zeigeNeueWelt(); wahr(!w.querySelector('[data-modus="survival"]').disabled); gleich(w.querySelectorAll("[data-schwierigkeit]").length,4); wahr(w.querySelector('[data-schwierigkeit="leicht"]').classList.contains("an")); });
test("Neue Welt übernimmt die Schwierigkeit", function(){ var w=document.createElement("div"),gest=null,b={art:"speicher",m:{},hole:function(k){return Promise.resolve(this.m[k]);},lege:function(k,v){this.m[k]=v;return Promise.resolve();},loesche:function(){return Promise.resolve();}},ui=ui2(w,{slots:new SC.Slots(b),beiStart:function(d){gest=d;}}); ui.zeigeNeueWelt(); w.querySelector('[data-schwierigkeit="schwer"]').click(); w.querySelector('[data-modus="survival"]').click(); return ui._klick(w.querySelector('[data-aktion="los"]')).then(function(){ gleich(gest.schwierigkeit,"schwer"); gleich(gest.modus,"survival"); }); });
test("Rucksack zeigt 36 Plätze und Ausrüstung", function(){ var w=document.createElement("div"),ui=ui2(w),k=k2(); ui.zeigeRucksack(k,{}); gleich(w.querySelectorAll(".rs-platz").length,36); gleich(w.querySelectorAll(".rs-ausruestung [data-platz]").length,6); });
test("Anlegen tauscht mit dem Ausrüstungsplatz", function(){ var w=document.createElement("div"),ui=ui2(w),k=k2(),h=SC.Beute.erzeuge(SC.zufall(1),{stufe:2,art:"helm",mindest:1}); k.rucksack.plaetze[10]={gegenstand:h}; ui.zeigeRucksack(k,{}); w.querySelector('.rs-platz[data-i="10"]').click(); w.querySelector('[data-aktion="anlegen"]').click(); gleich(k.ausruestung.helm.id,h.id); gleich(k.rucksack.plaetze[10],null); wahr(k.werte.schutz>0); });
test("Vergleich zeigt besser und schlechter", function(){ var w=document.createElement("div"),ui=ui2(w),k=k2(); k.ausruestung.helm={id:"a",art:"helm",seltenheit:0,werte:{schutz:5},name:"Einfacher Helm"}; k.rucksack.plaetze[3]={gegenstand:{id:"b",art:"helm",seltenheit:2,werte:{schutz:9},name:"Blauer Helm"}}; ui.zeigeRucksack(k,{}); w.querySelector('.rs-platz[data-i="3"]').click(); wahr(w.querySelector(".besser")); });
test("Besiegt-Bildschirm ist freundlich", function(){ var w=document.createElement("div"),ui=ui2(w),weiter=false; ui.zeigeBesiegt(function(){weiter=true;}); wahr(w.textContent.indexOf(SC.T.besiegt)>=0); wahr(!/tot|gestorben/i.test(w.textContent)); w.querySelector('[data-aktion="weiter"]').click(); wahr(weiter); });
test("Kampf-HUD zeigt Balken", function(){ var w=document.createElement("div"),ui=ui2(w),k=k2(),s=k.spieler; s.schnellleiste=[1,2,3,4,5,6,7,8,9]; ui.hud(s,{}); ui.kampfHud(k,[]); wahr(w.querySelector(".balken-lp")&&w.querySelector(".balken-xp")); ui.kampfHud(null); wahr(w.querySelector(".kampf").hidden); });
test("Kreativ-Ausrüstung in der Blockauswahl", function(){ var w=document.createElement("div"),ui=ui2(w),g=null; ui.zeigeBlockauswahl(function(){},{ausruestung:true,beiGegenstand:function(a,s){g=[a,s];}}); w.querySelector('[data-aktion="reiter"][data-id="ausruestung"]').click(); w.querySelector('[data-art="laserschwert"][data-selt="4"]').click(); gleich(g.join(),"laserschwert,4"); });
test("Kampf-HUD: Panzerungsbalken nur im Fahrzeug", function(){ var w=document.createElement("div"),ui=ui2(w),k=k2(),s=k.spieler; s.schnellleiste=[1,2,3,4,5,6,7,8,9]; ui.hud(s,{}); ui.kampfHud(k,[]); var b=w.querySelector(".balken-fahrzeug"); wahr(b&&b.hidden,"ohne Fahrzeug aus"); ui.kampfHud(k,[],{ panzerung: 60, max: 120, name: "Schwebeflitzer" }); wahr(!b.hidden,"sichtbar"); gleich(b.querySelector("i").style.width,"50%"); wahr(b.textContent.indexOf("Schwebeflitzer")>=0,"Name"); });
test("Info-Zeile folgt dem Fokus ohne Antippen", function(){
  var w=document.createElement("div"); document.body.appendChild(w); var ui=ui2(w), k=k2();
  var g={id:"b",art:"helm",seltenheit:2,werte:{schutz:9},name:"Blauer Helm"};
  k.rucksack.plaetze[10]={gegenstand:g};
  ui.zeigeRucksack(k,{});
  var f=w.querySelector('.rs-platz[data-i="10"]'); f.focus(); ui.beiFokus(f);
  wahr(w.querySelector(".rs-info").textContent.indexOf("Blauer Helm")>=0,"Name ohne Antippen");
  gleich(document.activeElement.getAttribute("data-i"),"10","Fokus bleibt");
  w.remove();
});
test("Y legt den fokussierten Gegenstand an", function(){
  var w=document.createElement("div"); document.body.appendChild(w); var ui=ui2(w), k=k2();
  k.rucksack.plaetze[10]={gegenstand:{id:"b",art:"helm",seltenheit:2,werte:{schutz:9},name:"Blauer Helm"}};
  ui.zeigeRucksack(k,{});
  var f=w.querySelector('.rs-platz[data-i="10"]'); f.focus(); ui.kurzaktion();
  gleich(k.ausruestung.helm.id,"b","angelegt");
  w.remove();
});
test("Y legt ein Rasterfeld in die Schnellleiste", function(){
  var w=document.createElement("div"); document.body.appendChild(w); var ui=ui2(w), k=k2();
  k.rucksack.plaetze[12]={block:SC.B.STEIN,anzahl:3};
  k.rucksack.plaetze[0]=null;   // Feld 0 ist sonst durch das Startschwert belegt
  ui.zeigeRucksack(k,{});
  var f=w.querySelector('.rs-platz[data-i="12"]'); f.focus(); ui.kurzaktion();
  gleich(k.rucksack.plaetze[0].block,SC.B.STEIN,"in die Schnellleiste");
  w.remove();
});
test("Der Rucksack öffnet im Raster", function(){
  var w=document.createElement("div"); document.body.appendChild(w); var ui=ui2(w), k=k2();
  ui.zeigeRucksack(k,{});
  gleich(document.activeElement.closest("[data-zone]").getAttribute("data-zone"),"raster");
  w.remove();
});
test("Y bei einer Waffe legt nichts an", function(){
  var w=document.createElement("div"); document.body.appendChild(w); var ui=ui2(w), k=k2();
  var feld=k.rucksack.plaetze[0], waffe=feld && feld.gegenstand;
  wahr(waffe, "Startwaffe im Schnellleistenfeld 0");
  ui.zeigeRucksack(k,{});
  var f=w.querySelector('.rs-platz[data-i="0"]'); f.focus(); ui.kurzaktion();
  gleich(k.waffe(), waffe, "die Waffe bleibt");
  gleich(k.rucksack.plaetze[0], feld, "Feld unverändert");
  w.remove();
});
test("Fokus auf dem Waffenplatz zeigt dasselbe wie das Antippen", function(){
  var w=document.createElement("div"); document.body.appendChild(w); var ui=ui2(w), k=k2();
  ui.zeigeRucksack(k,{});
  var g=k.waffe(); wahr(g, "Startwaffe");
  var f=w.querySelector('.rs-aplatz[data-platz="waffe"]'); f.focus(); ui.beiFokus(f);
  wahr(w.querySelector(".rs-info").textContent.indexOf(g.name)>=0, "Info zeigt den Namen");
  gleich(document.activeElement.getAttribute("data-platz"), "waffe", "Fokus bleibt auf dem Knopf");
  w.remove();
});
test("Vom Rucksack zur Werkbank fällt der Fokus in die Rezeptliste", function(){
  var w=document.createElement("div"); document.body.appendChild(w); var ui=ui2(w), k=k2();
  ui.zeigeRucksack(k,{});
  var kn=w.querySelector('[data-aktion="handwerk"]'); kn.focus(); kn.click();
  gleich(document.activeElement.closest("[data-zone]").getAttribute("data-zone"),"liste","das gemerkte Feld gibt es hier nicht");
  w.remove();
});
test("Kampf-HUD: roter Trefferrand nur kurz nach einem Treffer im Dokument (Leistung auf iPad/iPhone)", function(){ var w=document.createElement("div"),ui=ui2(w),k=k2(),s=k.spieler; s.schnellleiste=[1,2,3,4,5,6,7,8,9]; ui.hud(s,{}); ui.kampfHud(k,[]); var r=w.querySelector(".treffer-rand"); wahr(r.hidden,"ohne Treffer verborgen"); k.letzterTreffer={zeit:k.uhr,richtung:[1,0,0]}; ui.kampfHud(k,[]); wahr(!r.hidden,"frisch getroffen sichtbar"); k.uhr+=700; ui.kampfHud(k,[]); wahr(r.hidden,"nach 600 ms wieder verborgen"); });
test("HUD schreibt in ruhigen Bildern nichts ins DOM (Leistung auf iPad/iPhone)", function(){ var w=document.createElement("div"),ui=ui2(w),k=k2(),s=k.spieler; s.schnellleiste=[1,2,3,4,5,6,7,8,9]; var ex={fps:60,fpsAnzeigen:true,status:{name:"Erde",anzahl:3}}; ui.hud(s,ex); ui.kampfHud(k,[]); var mo=new MutationObserver(function(){}); mo.observe(w,{subtree:true,childList:true,attributes:true,characterData:true}); ui.hud(s,ex); ui.kampfHud(k,[]); ui.hud(s,ex); ui.kampfHud(k,[]); var r=mo.takeRecords(); mo.disconnect(); gleich(r.map(function(m){ var t=m.target.nodeType===3?m.target.parentNode:m.target; return m.type+":"+t.className+(m.attributeName?"@"+m.attributeName:""); }).join(" "),""); });
// Aktionsmenü am Gegenstand (Spec 2026-11-03-inventar-aktionsmenue)
function rsAuf(fn){ var w=document.createElement("div"); document.body.appendChild(w); var ui=ui2(w,{beiWeiter:function(){}}), k=k2(); k.rucksack.plaetze[12]={gegenstand:{id:"h",art:"helm",seltenheit:1,werte:{schutz:9},name:"Blauer Helm"}}; try{ fn(w,ui,k); } finally { w.remove(); } }
function rsKnoepfe(w){ return [].map.call(w.querySelectorAll(".rs-menue button"),function(b){return b.getAttribute("data-aktion");}).join(); }
function rsPlatz(w,i){ return w.querySelector('.rs-platz[data-i="'+i+'"]'); }
test("Antippen setzt den Cursor und öffnet das Menü am Gegenstand", function(){ rsAuf(function(w,ui,k){
  ui.zeigeRucksack(k,{}); rsPlatz(w,12).click();
  gleich(document.activeElement.getAttribute("data-aktion"),"anlegen","Fokus auf erster Aktion");
  gleich(rsKnoepfe(w),"anlegen,verschieben,wegwerfen,abbrechen");
  wahr(w.querySelector(".rs-menue .besser"),"Vergleich im Menü");
  wahr(!w.querySelector(".rs-platz.gewaehlt"),"keine zweite Markierung");
}); });
test("Zweiter Tipp auf denselben Platz legt an", function(){ rsAuf(function(w,ui,k){
  ui.zeigeRucksack(k,{}); rsPlatz(w,12).click(); rsPlatz(w,12).click();
  gleich(k.ausruestung.helm.id,"h","angelegt"); wahr(!w.querySelector(".rs-menue"),"Menü zu");
}); });
test("Menüinhalt je Sache, Wegwerfen nie zuerst", function(){ rsAuf(function(w,ui,k){
  var pl=k.rucksack.plaetze; pl[3]={block:SC.B.STEIN,anzahl:2}; pl[20]={block:SC.B.STEIN,anzahl:2}; pl[21]={gegenstand:SC.Beute.erzeuge(SC.zufall(3),{stufe:1,art:"laserschwert"})};
  k.ausruestung.brust={id:"b",art:"brust",seltenheit:0,werte:{schutz:7},name:"Brust"};
  ui.zeigeRucksack(k,{}); var listen={};
  rsPlatz(w,3).click(); listen.block08=rsKnoepfe(w);
  rsPlatz(w,20).click(); listen.block=rsKnoepfe(w);
  rsPlatz(w,21).click(); listen.waffe=rsKnoepfe(w);
  w.querySelector('.rs-aplatz[data-platz="brust"]').click(); listen.angelegt=rsKnoepfe(w);
  gleich(listen.block08,"verschieben,wegwerfen,abbrechen"); gleich(listen.block,"leiste,verschieben,wegwerfen,abbrechen");
  gleich(listen.waffe,"leiste,verschieben,wegwerfen,abbrechen"); gleich(listen.angelegt,"ablegen,abbrechen");
  for(var n in listen) wahr(listen[n].split(",")[0]!=="wegwerfen",n);
}); });
test("Abbrechen, B und Esc schließen das Menü, Cursor bleibt auf dem Platz", function(){ rsAuf(function(w,ui,k){
  ui.zeigeRucksack(k,{});
  rsPlatz(w,12).click(); w.querySelector('.rs-menue [data-aktion="abbrechen"]').click();
  wahr(!w.querySelector(".rs-menue"),"Abbrechen"); gleich(document.activeElement.getAttribute("data-i"),"12","Cursor nach Abbrechen");
  rsPlatz(w,12).click(); ui.menueAktion("zurueck");
  wahr(!w.querySelector(".rs-menue"),"B"); wahr(!ui.ebene.hidden,"Rucksack bleibt offen"); gleich(document.activeElement.getAttribute("data-i"),"12","Cursor nach B");
  rsPlatz(w,12).click(); document.activeElement.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}));
  wahr(!w.querySelector(".rs-menue"),"Esc"); wahr(!ui.ebene.hidden,"Rucksack bleibt offen nach Esc");
}); });
test("Tipp auf leeren Platz schließt das Menü ohne neues", function(){ rsAuf(function(w,ui,k){
  ui.zeigeRucksack(k,{}); rsPlatz(w,12).click(); rsPlatz(w,30).click();
  wahr(!w.querySelector(".rs-menue"),"zu"); gleich(document.activeElement.getAttribute("data-i"),"30","Cursor auf leerem Platz");
}); });
test("Ablegen bei vollem Rucksack: Hinweis, bleibt angelegt", function(){ rsAuf(function(w,ui,k){
  var hin=[]; ui.hinweis=function(t){hin.push(t);};
  k.ausruestung.helm={id:"alt",art:"helm",seltenheit:0,werte:{schutz:5},name:"Alt"};
  for(var i=0;i<36;i++) if(!k.rucksack.plaetze[i]) k.rucksack.plaetze[i]={block:SC.B.STEIN,anzahl:SC.Rucksack.STAPEL};
  ui.zeigeRucksack(k,{}); w.querySelector('.rs-aplatz[data-platz="helm"]').click(); w.querySelector('.rs-menue [data-aktion="ablegen"]').click();
  gleich(k.ausruestung.helm.id,"alt","bleibt angelegt"); wahr(hin.indexOf(SC.T.rucksackVoll)>=0,"Hinweis"); wahr(!w.querySelector(".rs-menue"),"Menü zu");
}); });
test("Controller: A öffnet, Steuerkreuz und LB/RB bleiben im Menü, A bestätigt", function(){ rsAuf(function(w,ui,k){
  ui.zeigeRucksack(k,{}); var p=rsPlatz(w,12); p.focus(); ui.beiFokus(p); ui.bestaetige();
  wahr(w.querySelector(".rs-menue"),"offen"); ui.navigiere("rechts"); wahr(document.activeElement.closest(".rs-menue"),"Steuerkreuz im Menü");
  ui.zone(1); wahr(document.activeElement.closest(".rs-menue"),"LB/RB im Menü");
  w.querySelector('.rs-menue [data-aktion="anlegen"]').focus(); ui.bestaetige();
  gleich(k.ausruestung.helm.id,"h","angelegt");
}); });
test("Info-Zeile zeigt leere Plätze", function(){ rsAuf(function(w,ui,k){
  ui.zeigeRucksack(k,{}); var p=rsPlatz(w,30); p.focus(); ui.beiFokus(p);
  wahr(w.querySelector(".rs-info").textContent.indexOf(SC.T.rucksackInfoLeer)>=0);
}); });
test("Neuladen bei offenem Menü schließt es, Cursor bleibt", function(){ rsAuf(function(w,ui,k){
  k.rucksack.plaetze[13]={block:SC.B.STEIN,anzahl:3}; k.rucksack.plaetze[1]=null;
  ui.zeigeRucksack(k,{}); rsPlatz(w,12).click(); var f=rsPlatz(w,13); f.focus(); ui.kurzaktion();
  wahr(!w.querySelector(".rs-menue"),"Menü zu"); wahr(document.activeElement.classList.contains("rs-platz"),"Cursor auf einem Platz");
}); });
test("Verschieben: auf leeren Platz, auf belegten tauschen, Abbruch", function(){ rsAuf(function(w,ui,k){
  var pl=k.rucksack.plaetze; pl[20]={block:SC.B.STEIN,anzahl:2}; pl[2]=null; pl[5]={block:SC.B.SAND,anzahl:4};
  ui.zeigeRucksack(k,{});
  rsPlatz(w,20).click(); w.querySelector('.rs-menue [data-aktion="verschieben"]').click();
  wahr(rsPlatz(w,20).classList.contains("verschiebt"),"Quelle markiert"); wahr(w.querySelector(".rs-info").textContent.indexOf(SC.T.wohin)>=0,"Hinweis Wohin");
  wahr(!w.querySelector(".rs-menue"),"Menü zu");
  rsPlatz(w,2).click(); gleich(pl[2].block,SC.B.STEIN,"auf leeren Platz"); gleich(pl[20],null); wahr(!w.querySelector(".verschiebt"),"Markierung weg");
  rsPlatz(w,2).click(); w.querySelector('.rs-menue [data-aktion="verschieben"]').click(); rsPlatz(w,5).click();
  gleich(pl[5].block,SC.B.STEIN,"getauscht"); gleich(pl[2].block,SC.B.SAND,"getauscht zurück");
  rsPlatz(w,5).click(); w.querySelector('.rs-menue [data-aktion="verschieben"]').click(); ui.menueAktion("zurueck");
  wahr(!w.querySelector(".verschiebt"),"B bricht ab"); gleich(pl[5].block,SC.B.STEIN,"nichts getauscht nach B"); wahr(!ui.ebene.hidden,"Rucksack offen");
  rsPlatz(w,5).click(); w.querySelector('.rs-menue [data-aktion="verschieben"]').click(); w.querySelector('.rs-aplatz[data-platz="helm"]').click();
  wahr(!w.querySelector(".verschiebt"),"Ausrüstungsplatz bricht ab"); gleich(pl[5].block,SC.B.STEIN,"nichts getauscht nach Ausrüstungsplatz");
  rsPlatz(w,5).click(); w.querySelector('.rs-menue [data-aktion="verschieben"]').click(); rsPlatz(w,5).click();
  wahr(!w.querySelector(".verschiebt"),"Quelle bricht ab"); gleich(pl[5].block,SC.B.STEIN,"nichts getauscht nach Quelle"); wahr(!w.querySelector(".rs-menue"),"kein Menü nach Abbruch");
}); });
test("Verschieben: der Hinweis bleibt, wenn der Controller den Cursor bewegt", function(){ rsAuf(function(w,ui,k){
  k.rucksack.plaetze[20]={block:SC.B.STEIN,anzahl:2}; ui.zeigeRucksack(k,{});
  rsPlatz(w,20).click(); w.querySelector('.rs-menue [data-aktion="verschieben"]').click();
  var p=rsPlatz(w,21); p.focus(); ui.beiFokus(p); wahr(w.querySelector(".rs-info").textContent.indexOf(SC.T.wohin)>=0);
}); });
test("Menü offen, dann Werkbank: B führt zu einem frischen Rucksack ohne altes Menü", function(){ rsAuf(function(w,ui,k){
  ui.zeigeRucksack(k,{}); rsPlatz(w,12).click(); w.querySelector('[data-aktion="handwerk"]').click();
  wahr(!w.querySelector(".rs-raster"),"Werkbank offen"); ui.menueAktion("zurueck");
  wahr(w.querySelector(".rs-raster"),"zurück im Rucksack (Zurück der Werkbank)"); wahr(!w.querySelector(".rs-menue"),"kein altes Menü");
  var f=rsPlatz(w,12); f.focus(); ui.kurzaktion(); gleich(k.ausruestung.helm && k.ausruestung.helm.id,"h","Y wirkt wieder (Haken des Rucksacks)");
}); });
test("Menü offen, dann besiegt: B führt zum Weiter", function(){ rsAuf(function(w,ui,k){
  var weiter=false; ui.zeigeRucksack(k,{}); rsPlatz(w,12).click(); ui.zeigeBesiegt(function(){weiter=true;});
  ui.menueAktion("zurueck"); wahr(weiter,"Weiter ausgelöst"); wahr(!w.querySelector(".rs-raster"),"kein Rucksack");
}); });
test("Tipp neben das Menü schließt es", function(){ rsAuf(function(w,ui,k){
  ui.zeigeRucksack(k,{}); rsPlatz(w,12).click(); w.querySelector(".rs-werte").click();
  wahr(!w.querySelector(".rs-menue"),"zu"); gleich(document.activeElement.getAttribute("data-i"),"12","Cursor auf dem Platz");
  rsPlatz(w,12).click(); w.querySelector(".rs-menue h3").click(); wahr(w.querySelector(".rs-menue"),"Tipp ins Menü schließt nicht");
}); });
test("Rucksack-Raster: die Schnellleisten-Reihe sitzt im Raster wie die anderen (iPad: 34 px zu hoch durch die HUD-Regel .leiste)", function(){
  var f = document.createElement("iframe"); f.style.cssText = "position:absolute;left:-3000px;top:0;width:1366px;height:938px;border:0"; document.body.appendChild(f);
  var d = f.contentDocument; d.open(); d.write('<link rel="stylesheet" href="../css/style.css"><div class="ebene" style="position:fixed;inset:0"></div>'); d.close();
  return new Promise(function(fertig){ f.onload = fertig; setTimeout(fertig, 1500); }).then(function(){
    var w = document.createElement("div"), ui = ui2(w), k = k2(); ui.zeigeRucksack(k, {}); d.querySelector(".ebene").innerHTML = ui.ebene.innerHTML;
    var top = function(s){ return d.querySelector(s).getBoundingClientRect().top; }, g = top(".rs-raster"), p0 = top('.rs-platz[data-i="0"]'), p9 = top('.rs-platz[data-i="9"]'), p18 = top('.rs-platz[data-i="18"]');
    document.body.removeChild(f);
    wahr(p0 > g, "erste Reihe im Panel: " + p0 + " > " + g);
    wahr(Math.abs((p9 - p0) - (p18 - p9)) < 1, "gleiche Reihenabstände: " + (p9 - p0) + " / " + (p18 - p9));
  });
});
