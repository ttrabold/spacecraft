// Werte der Spielfigur: Stufen, Erfahrung, Lebenspunkte, Schaden; Schwierigkeitsgrade und Ortsstufen
SC.Werte = {};
SC.Werte.MAX_STUFE = 30;
SC.Werte.erfahrungFuer = function(stufe){ return Math.round(100 * Math.pow(stufe, 1.5)); };
SC.Werte.lebenspunkte = function(stufe){ return 100 + 12 * (stufe - 1); };
SC.Werte.erfahrungFuerGegner = function(stufe, boss){ return 10 * stufe * (boss ? 5 : 1); };
SC.Werte.nachSchutz = function(schaden, schutz){ return schaden * 100 / (100 + Math.max(0, schutz || 0)); };
// Erfahrung gutschreiben; Überlauf trägt in die nächste Stufe; liefert die Zahl der Aufstiege
SC.Werte.gibErfahrung = function(w, menge){
  if(w.stufe >= SC.Werte.MAX_STUFE) return 0;
  var auf = 0; w.erfahrung += menge;
  while(w.stufe < SC.Werte.MAX_STUFE && w.erfahrung >= SC.Werte.erfahrungFuer(w.stufe)){ w.erfahrung -= SC.Werte.erfahrungFuer(w.stufe); w.stufe++; auf++; }
  if(w.stufe >= SC.Werte.MAX_STUFE) w.erfahrung = 0;
  return auf;
};

SC.SCHWIERIGKEIT = {
  friedlich: { schaden: 0, nachtMax: 0, gruppenBonus: 0, genauigkeit: 0, seltenheitBonus: 0, gegner: false },
  leicht: { schaden: 0.5, nachtMax: 3, gruppenBonus: -1, genauigkeit: 0.35, seltenheitBonus: 0, gegner: true },
  normal: { schaden: 1, nachtMax: 6, gruppenBonus: 0, genauigkeit: 0.6, seltenheitBonus: 0, gegner: true },
  schwer: { schaden: 1.5, nachtMax: 9, gruppenBonus: 1, genauigkeit: 0.85, seltenheitBonus: 1, gegner: true }
};
SC.ORTSSTUFE = { lager: [1, 5], station: [5, 12], herrenhaus: [10, 20], dungeon: [15, 25] };
