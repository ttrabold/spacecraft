test("mod liefert nie negative Werte", function(){ gleich(SC.mod(-1,2048),2047); gleich(SC.mod(2048,2048),0); gleich(SC.mod(-4097,2048),2047); });
test("hashText ist stabil", function(){ gleich(SC.hashText("Spacecraft"), SC.hashText("Spacecraft")); wahr(SC.hashText("a")!==SC.hashText("b")); });
test("zufall ist deterministisch", function(){ var a=SC.zufall(42),b=SC.zufall(42); for(var i=0;i<5;i++){ var x=a(); gleich(x,b()); wahr(x>=0&&x<1); } });
test("hash3 unterscheidet Koordinaten", function(){ wahr(SC.hash3(1,2,3)!==SC.hash3(1,3,2)); });
test("Ereignisse kommen an", function(){ var e=new SC.Ereignisse(),n=0; e.an("x",function(d){n+=d;}); e.sende("x",2); gleich(n,2); });
