// Rucksack: 36 Plätze, die ersten 9 sind die Schnellleiste. Blöcke stapeln bis 64, Gegenstände einzeln.
SC.Rucksack = function(plaetze){
  this.plaetze = [];
  for(var i = 0; i < 36; i++) this.plaetze.push(plaetze && plaetze[i] ? plaetze[i] : null);
};
SC.Rucksack.STAPEL = 64;
(function(){
  var R = SC.Rucksack.prototype;
  // Legt eine Sache ab; liefert, was nicht mehr hineinpasst (Anzahl bzw. 1 für einen Gegenstand)
  R.lege = function(sache){
    var p = this.plaetze, i;
    if(sache.gegenstand){
      for(i = 0; i < 36; i++) if(!p[i]){ p[i] = { gegenstand: sache.gegenstand }; return 0; }
      return 1;
    }
    var rest = sache.anzahl;
    for(i = 0; i < 36 && rest; i++) if(p[i] && p[i].block === sache.block && p[i].anzahl < SC.Rucksack.STAPEL){
      var n = Math.min(rest, SC.Rucksack.STAPEL - p[i].anzahl); p[i].anzahl += n; rest -= n;
    }
    for(i = 0; i < 36 && rest; i++) if(!p[i]){ var m = Math.min(rest, SC.Rucksack.STAPEL); p[i] = { block: sache.block, anzahl: m }; rest -= m; }
    return rest;
  };
  R.nimm = function(platz, anzahl){
    var s = this.plaetze[platz]; if(!s) return null;
    if(s.gegenstand || anzahl === undefined || anzahl >= s.anzahl){ this.plaetze[platz] = null; return s; }
    s.anzahl -= anzahl; return { block: s.block, anzahl: anzahl };
  };
  R.hat = function(block){ var n = 0; this.plaetze.forEach(function(s){ if(s && s.block === block) n += s.anzahl; }); return n; };
  R.verbrauche = function(platz){
    var s = this.plaetze[platz]; if(!s || s.block === undefined) return false;
    if(--s.anzahl <= 0) this.plaetze[platz] = null;
    return true;
  };
  R.tausche = function(a, b){ var t = this.plaetze[a]; this.plaetze[a] = this.plaetze[b]; this.plaetze[b] = t; };
  R.alsDaten = function(){ return this.plaetze.map(function(s){ return s ? JSON.parse(JSON.stringify(s)) : null; }); };
})();

// Abbauen im Survival: Zeit je Härte, Laserschwert halbiert; was ein Block ergibt
SC.Abbau = {};
(function(){
  var B = SC.B, ZEIT = {};
  [B.ERDE, B.GRAS, B.SAND, B.KIES, B.SCHNEE, B.BLAETTER, B.LEUCHTPILZ, B.WOLLE_ROT, B.WOLLE_BLAU, B.WOLLE_GELB, B.WOLLE_WEISS].forEach(function(id){ ZEIT[id] = 0.4; });
  [B.STAMM, B.BRETTER].forEach(function(id){ ZEIT[id] = 0.9; });
  [B.STEIN, B.STEINZIEGEL, B.KRISTALL].forEach(function(id){ ZEIT[id] = 1.4; });
  [B.METALL, B.METALLGITTER, B.TECHNIK, B.BETON, B.LEUCHT_CYAN, B.LEUCHT_PINK, B.LEUCHT_GRUEN].forEach(function(id){ ZEIT[id] = 2; });
  ZEIT[B.GLAS] = 0.3;
  SC.Abbau.zeit = function(id, waffenArt){
    var b = SC.BLOECKE[id];
    if(!b || !b.zerstoerbar) return Infinity;
    var t = ZEIT[id] !== undefined ? ZEIT[id] : 1;
    return waffenArt === "laserschwert" ? t / 2 : t;
  };
  SC.Abbau.ergibt = function(id){ return id === B.GRAS ? B.ERDE : id === B.GLAS ? null : id; };
})();
