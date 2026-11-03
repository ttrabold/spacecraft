function leereWelt(){ var w=new SC.Welt(new SC.Planet({id:"start",seed:5})); for(var x=0;x<16;x++)for(var z=0;z<16;z++)for(var y=1;y<128;y++) w.setzeBlock(x,y,z,SC.B.LUFT,"system"); return w; }
function flaechen(g){ return g.indizes.length/6; }
test("einzelner Block hat 6 Flächen", function(){ var w=leereWelt(); w.setzeBlock(5,64,5,SC.B.STEIN,"system"); gleich(flaechen(SC.Mesher.chunk(w,0,0,SC.Licht.chunk(w,0,0)).fest),6+256); });
test("verdeckte Flächen entfallen", function(){ var w=leereWelt(); w.setzeBlock(5,64,5,SC.B.STEIN,"system"); w.setzeBlock(6,64,5,SC.B.STEIN,"system"); gleich(flaechen(SC.Mesher.chunk(w,0,0,SC.Licht.chunk(w,0,0)).fest),10+256); });
test("Leuchtblock erhellt Höhle", function(){ var w=leereWelt(); for(var x=0;x<16;x++)for(var z=0;z<16;z++) w.setzeBlock(x,100,z,SC.B.STEIN,"system"); w.setzeBlock(8,50,8,SC.B.LEUCHT_CYAN,"system"); var l=SC.Licht.chunk(w,0,0); wahr(l.himmel[SC.idx(8,60,8)]<=15-8,"Himmelslicht unter der Decke"); gleich(l.block[SC.idx(9,50,8)],SC.BLOECKE[SC.B.LEUCHT_CYAN].leuchten-1); });
test("Licht aus dem Nachbar-Chunk kommt an", function(){ var w=leereWelt(); w.setzeBlock(-1,50,8,SC.B.LUFT,"system"); w.setzeBlock(-2,50,8,SC.B.LEUCHT_PINK,"system"); var l=SC.Licht.chunk(w,0,0); gleich(l.block[SC.idx(0,50,8)],13); });
test("Himmelslicht oben", function(){ var w=leereWelt(); gleich(SC.Licht.chunk(w,0,0).himmel[SC.idx(3,90,3)],15); });
test("Glas kommt in den durchsichtigen Teil", function(){ var w=leereWelt(); w.setzeBlock(5,64,5,SC.B.GLAS,"system"); gleich(flaechen(SC.Mesher.chunk(w,0,0,SC.Licht.chunk(w,0,0)).durchsichtig),6); });
test("Pflanze wird als zwei gekreuzte Flächen gezeichnet (#17)", function(){ var w=leereWelt(); w.setzeBlock(5,64,5,SC.B.LEUCHTPILZ,"system"); gleich(flaechen(SC.Mesher.chunk(w,0,0,SC.Licht.chunk(w,0,0)).form),2); });
test("Ganz verdeckte Pflanze entfällt (#17)", function(){ var w=leereWelt(); w.setzeBlock(5,64,5,SC.B.LEUCHTPILZ,"system"); [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].forEach(function(n){ w.setzeBlock(5+n[0],64+n[1],5+n[2],SC.B.STEIN,"system"); }); gleich(flaechen(SC.Mesher.chunk(w,0,0,SC.Licht.chunk(w,0,0)).form),0); });
test("Pflanze ist durchgehbar und lässt Licht durch (#17)", function(){ wahr(!SC.BLOECKE[SC.B.LEUCHTPILZ].fest, "durchgehbar"); gleich(SC.Licht.opak[SC.B.LEUCHTPILZ], 0); wahr(SC.Abbau.zeit(SC.B.LEUCHTPILZ) < 3, "weiter abbaubar"); });
test("Geometrie hat passende Längen", function(){ var w=leereWelt(); w.setzeBlock(5,64,5,SC.B.STEIN,"system"); var g=SC.Mesher.chunk(w,0,0,SC.Licht.chunk(w,0,0)).fest,n=g.positionen.length/3; gleich(g.uv.length,n*2); gleich(g.licht.length,n*2); gleich(g.farbe.length,n*3); });
test("Chunk-Mesh schnell genug", function(){ var w=new SC.Welt(new SC.Planet({id:"start",seed:77})); for(var i=2;i<=4;i++)for(var j=2;j<=4;j++) w.chunk(i,j); var t=performance.now(); var l=SC.Licht.chunk(w,3,3); SC.Mesher.chunk(w,3,3,l); var ms=performance.now()-t; wahr(ms<40,"zu langsam: "+ms.toFixed(1)+" ms"); });
test("Licht rechnet in wiederverwendeten Puffern und bleibt gleich (Leistung: sonst ~3 MB Speicher je Chunk)", function(){
  var w = new SC.Welt(new SC.Planet({ id: "start", seed: 77 })); w.setzeBlock(5, 64, 5, SC.B.LEUCHT_PINK, "system");
  var a = SC.Licht.chunk(w, 0, 0), ah = Array.prototype.slice.call(a.himmel), ab = Array.prototype.slice.call(a.block), am = SC.Mesher.chunk(w, 0, 0, a).fest.positionen.length;
  var b = SC.Licht.chunk(w, 3, 2);
  wahr(b._region.himmel === a._region.himmel && b._region.bloecke === a._region.bloecke, "dieselben Arbeitspuffer");
  var c = SC.Licht.chunk(w, 0, 0);
  gleich(Array.prototype.slice.call(c.himmel).join(), ah.join(), "Himmelslicht gleich"); gleich(Array.prototype.slice.call(c.block).join(), ab.join(), "Blocklicht gleich");
  gleich(SC.Mesher.chunk(w, 0, 0, c).fest.positionen.length, am, "Geometrie gleich");
});
test("Formblöcke (Tür, Bett) kommen in einen eigenen Teil mit Tiefenpuffer, Glas bleibt durchsichtig", function(){
  var w=leereWelt(); w.setzeBlock(5,64,5,SC.B.TUER_X,"system"); w.setzeBlock(8,64,8,SC.B.GLAS,"system");
  var m=SC.Mesher.chunk(w,0,0,SC.Licht.chunk(w,0,0));
  wahr(m.form && m.form.indizes.length>0,"Tür im Formteil");
  gleich(m.durchsichtig.indizes.length/6,6,"im durchsichtigen Teil nur das Glas (6 Flächen)");
});
test("Blätter, Metallgitter und Lava (nur Löcher bzw. deckend) kommen in den Teil mit Tiefenpuffer, Wasser und Eis bleiben durchsichtig", function(){
  ["BLAETTER","METALLGITTER","LAVA"].forEach(function(n){ var w=leereWelt(); w.setzeBlock(5,64,5,SC.B[n],"system"); var m=SC.Mesher.chunk(w,0,0,SC.Licht.chunk(w,0,0)); gleich(flaechen(m.form),6,n+" im Formteil"); gleich(flaechen(m.durchsichtig),0,n+" nicht durchsichtig gezeichnet"); });
  ["WASSER","EIS"].forEach(function(n){ var w=leereWelt(); w.setzeBlock(5,64,5,SC.B[n],"system"); var m=SC.Mesher.chunk(w,0,0,SC.Licht.chunk(w,0,0)); wahr(flaechen(m.durchsichtig)>0,n+" bleibt durchsichtig"); });
});
