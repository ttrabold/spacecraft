test("flach ist nahtlos über die Periode", function(){ var r=new SC.Rauschen(7); for(var i=0;i<20;i++){ var x=i*37.3,z=i*11.1; wahr(Math.abs(r.flach(x,z,2048,64)-r.flach(x+2048,z,2048,64))<1e-9); wahr(Math.abs(r.flach(x,z,2048,64)-r.flach(x,z-2048,2048,64))<1e-9); } });
test("flach bleibt im Bereich", function(){ var r=new SC.Rauschen(1); for(var i=0;i<1000;i++){ var v=r.flach(i*3.7,i*1.3,2048,32); wahr(v>=-1&&v<=1); } });
test("gleicher Seed gleiches Rauschen", function(){ gleich(new SC.Rauschen(5).oktaven(100,200,2048,256,4), new SC.Rauschen(5).oktaven(100,200,2048,256,4)); });
test("raum ist nahtlos in x und z", function(){ var r=new SC.Rauschen(3); gleich(r.raum(10,40,20,2048,16), r.raum(2058,40,2068,2048,16)); wahr(r.raum(10,40,20,2048,16)!==0||r.raum(11.5,40.5,20.5,2048,16)!==0); });
test("Rand ohne Sprung", function(){ var r=new SC.Rauschen(9); wahr(Math.abs(r.oktaven(2047.5,500,2048,256,4)-r.oktaven(-0.5,500,2048,256,4))<1e-9); });
