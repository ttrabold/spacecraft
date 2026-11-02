// Crafting (Stufe 6a): Blöcke, Rezepte, Herstellung
var NEUE_BLOECKE = ["EISENERZ","TITAN","GLUTSTAHL","MOORSILBER","STERNENMETALL","KRISTALL_BLAU","KRISTALL_GRUEN","KRISTALL_ROT","KRISTALL_GELB","KRISTALL_VIOLETT","KRISTALL_WEISS","SCHALTKREIS","CHITIN","WERKBANK","FACKEL","ZAUN","LEITER_N","LEITER_S","LEITER_O","LEITER_W","TUER_X","TUER_Z","TUER_X_OFFEN","TUER_Z_OFFEN","TRUHE"];
test("Neue Blöcke haben feste IDs und Namen", function(){
  gleich(SC.B.EISENERZ,33); gleich(SC.B.STERNENMETALL,37); gleich(SC.B.KRISTALL_WEISS,43); gleich(SC.B.TRUHE,57); gleich(SC.B.WERKBANK,46);
  NEUE_BLOECKE.forEach(function(n){ var id=SC.B[n]; wahr(typeof id==="number",n+" fehlt"); var b=SC.BLOECKE[id]; wahr(b,n+": keine Definition"); wahr(b.name&&b.name!=="undefined",n+": Name"); ["oben","seite","unten"].forEach(function(s){ wahr(SC.Mesher.atlasNamen.indexOf(b.seiten[s])>=0,n+": Textur "+b.seiten[s]); }); });
  ["EISENERZ","TITAN","GLUTSTAHL","MOORSILBER","STERNENMETALL","KRISTALL_BLAU","KRISTALL_WEISS"].forEach(function(n){ var b=SC.BLOECKE[SC.B[n]]; wahr(b.fest&&b.zerstoerbar,n+": fest und abbaubar"); });
  ["KRISTALL_BLAU","KRISTALL_GRUEN","KRISTALL_ROT","KRISTALL_GELB","KRISTALL_VIOLETT","KRISTALL_WEISS"].forEach(function(n){ wahr(SC.BLOECKE[SC.B[n]].leuchten>0,n+" leuchtet"); });
  wahr(SC.BLOECKE[SC.B.LEITER_N].klettern===true&&SC.BLOECKE[SC.B.LEITER_W].klettern===true);
  wahr(SC.BLOECKE[SC.B.TUER_X].fest&&!SC.BLOECKE[SC.B.TUER_X_OFFEN].fest,"Tür zu fest, offen nicht");
  wahr(!SC.BLOECKE[SC.B.FACKEL].fest&&SC.BLOECKE[SC.B.ZAUN].fest);
  wahr(SC.Abbau.zeit(SC.B.TITAN)>SC.Abbau.zeit(SC.B.EISENERZ)&&SC.Abbau.zeit(SC.B.EISENERZ)>SC.Abbau.zeit(SC.B.STEIN),"Abbauzeit steigt mit der Seltenheit");
});
test("Abbau liefert Grund-Blöcke statt Varianten", function(){
  gleich(SC.Abbau.ergibt(SC.B.TUER_Z_OFFEN),SC.B.TUER_X); gleich(SC.Abbau.ergibt(SC.B.TUER_X_OFFEN),SC.B.TUER_X); gleich(SC.Abbau.ergibt(SC.B.TUER_Z),SC.B.TUER_X);
  gleich(SC.Abbau.ergibt(SC.B.LEITER_O),SC.B.LEITER_N); gleich(SC.Abbau.ergibt(SC.B.LEITER_W),SC.B.LEITER_N); gleich(SC.Abbau.ergibt(SC.B.KRISTALL_ROT),SC.B.KRISTALL_ROT);
});
test("Kristallfarben für Waffen", function(){ var k=SC.CRAFTING_KRISTALLE; gleich(Object.keys(k).join(),"blau,gruen,rot,gelb,violett,weiss"); gleich(k.blau.farbe,"#3fa0ff"); gleich(k.blau.block,SC.B.KRISTALL_BLAU); gleich(k.weiss.block,SC.B.KRISTALL_WEISS); });
