// Fang-Minispiel „Zielring“ (reine Logik, ohne Oberfläche): ein Ring zieht sich zusammen, im grünen Bereich drücken.
// Treffer nötig = Seltenheit + 1 (gewöhnlich 1, selten 2, sehr selten 3); jede Runde läuft der Ring schneller; seltene Tiere starten mit schnellerem Ring (die Zone wird dafür etwas breiter, damit es fair bleibt).
SC.Fang = function(seltenheit){
  this.seltenheit = seltenheit || 0; this.noetig = this.seltenheit + 1; this.treffer = 0; this.runde = 0; this.fertig = null;
  this.zone = [0.16 - 0.02 * this.seltenheit, 0.36 + 0.02 * this.seltenheit];
  this._runde();
};
SC.Fang.prototype._runde = function(){ this.ring = 1; this.tempo = 0.5 + 0.12 * this.seltenheit + 0.15 * this.runde; };
// Zeit vergeht → "laeuft" oder "daneben" (Ring an der Zone vorbei)
SC.Fang.prototype.schritt = function(dt){
  if(this.fertig) return this.fertig;
  this.ring -= this.tempo * dt;
  if(this.ring < this.zone[0] - 0.02){ this.fertig = "daneben"; return this.fertig; }
  return "laeuft";
};
// Druck → "treffer" (nächste Runde), "gefangen" oder "daneben"
SC.Fang.prototype.druecken = function(){
  if(this.fertig) return this.fertig === "gefangen" ? "gefangen" : "daneben";
  if(this.ring >= this.zone[0] && this.ring <= this.zone[1]){
    this.treffer++;
    if(this.treffer >= this.noetig){ this.fertig = "gefangen"; return "gefangen"; }
    this.runde++; this._runde(); return "treffer";
  }
  this.fertig = "daneben"; return "daneben";
};
