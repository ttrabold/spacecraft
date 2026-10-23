function welt(){ return new SC.Welt(new SC.Planet({id:"start",seed:99})); }
test("setzeBlock und holeBlock", function(){ var w=welt(); wahr(w.setzeBlock(10,70,10,SC.B.GLAS,"spieler")); gleich(w.holeBlock(10,70,10),SC.B.GLAS); gleich(w.holeBlock(10+2048,70,10-2048),SC.B.GLAS); });
test("Grundgestein bleibt", function(){ var w=welt(); wahr(!w.setzeBlock(5,0,5,SC.B.LUFT,"spieler")); });
test("Ereignis bei Blockänderung", function(){ var w=welt(),e=null; w.ereignisse.an("block",function(d){e=d;}); w.setzeBlock(1,70,1,SC.B.METALL,"spieler"); gleich(e.id,SC.B.METALL); gleich(e.quelle,"spieler"); });
test("setzeBlock am Rand markiert beide Nachbar-Chunks", function(){ var w=welt(); w.setzeBlock(2047,70,5,SC.B.STEIN,"spieler"); w.neuZuZeichnen.clear(); w.setzeBlock(2047,70,5,SC.B.GLAS,"spieler"); wahr(w.neuZuZeichnen.has("127,0")); wahr(w.neuZuZeichnen.has("0,0")); });
test("entladen behält geänderte Chunks", function(){ var w=welt(); w.setzeBlock(20,70,20,SC.B.TECHNIK,"spieler"); w.entlade(1,1); wahr(!w.istGeladen(1,1)); gleich(w.holeBlock(20,70,20),SC.B.TECHNIK); });
test("gespeicherte Chunks haben Vorrang vor dem Generator", function(){ var c=new Uint8Array(16*128*16); c[SC.idx(0,100,0)]=SC.B.KRISTALL; var w=new SC.Welt(new SC.Planet({id:"start",seed:99}),{"2,2":c}); gleich(w.holeBlock(32,100,32),SC.B.KRISTALL); });
test("unveränderte Chunks werden nicht als geändert gespeichert", function(){ var w=welt(); w.holeBlock(300,60,300); gleich(w.geaenderte.size,0); });
