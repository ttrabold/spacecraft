test("Erfahrungskurve", function(){ gleich(SC.Werte.erfahrungFuer(1),100); gleich(SC.Werte.erfahrungFuer(4),800); gleich(SC.Werte.lebenspunkte(1),100); gleich(SC.Werte.lebenspunkte(11),220); });
test("Erfahrung trägt über und endet bei 30", function(){ var w={stufe:1,erfahrung:0}; gleich(SC.Werte.gibErfahrung(w,383),2); gleich(w.stufe,3); gleich(w.erfahrung,383-100-283); var m={stufe:30,erfahrung:0}; gleich(SC.Werte.gibErfahrung(m,1e6),0); gleich(m.stufe,30); });
test("Schutz verringert Schaden", function(){ gleich(SC.Werte.nachSchutz(100,0),100); gleich(SC.Werte.nachSchutz(100,100),50); });
test("Boss gibt fünffache Erfahrung", function(){ gleich(SC.Werte.erfahrungFuerGegner(4,false),40); gleich(SC.Werte.erfahrungFuerGegner(4,true),200); });
test("Schwierigkeiten", function(){ gleich(SC.SCHWIERIGKEIT.friedlich.nachtMax,0); gleich(SC.SCHWIERIGKEIT.leicht.schaden,0.5); gleich(SC.SCHWIERIGKEIT.schwer.nachtMax,9); gleich(SC.ORTSSTUFE.dungeon.join(),"15,25"); });
