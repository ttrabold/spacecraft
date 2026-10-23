test("Chunk-Versatz nimmt die nächste Kopie", function(){ gleich(SC.chunkVersatz(127,3,2048),-16); gleich(SC.chunkVersatz(0,2040,2048),2048); gleich(SC.chunkVersatz(10,170,2048),160); });
test("Atlas hat die richtige Größe", function(){ var a=SC.Texturen.atlas(SC.PALETTEN.start); gleich(a.width,256); gleich(a.height,256); });
test("Atlas ist deterministisch", function(){ gleich(SC.Texturen.atlas(SC.PALETTEN.start).toDataURL(), SC.Texturen.atlas(SC.PALETTEN.start).toDataURL()); });
test("Paletten ergeben verschiedene Atlanten", function(){ wahr(SC.Texturen.atlas(SC.PALETTEN.start).toDataURL()!==SC.Texturen.atlas(SC.PALETTEN.fremd).toDataURL()); });
test("Himmelsfarbe folgt der Tageszeit", function(){ var m=SC.himmelsFarben(SC.PALETTEN.start,0.5),n=SC.himmelsFarben(SC.PALETTEN.start,0.0); wahr(m.tageslicht>0.95,"Mittag hell"); wahr(n.tageslicht>=0.25&&n.tageslicht<0.4,"Nacht dunkel, aber nicht schwarz: "+n.tageslicht); });
