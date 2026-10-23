// Eingabe: Tastatur und Maus wie in Minecraft; Touch kommt aus touch.js dazu.
// zustand() liefert pro Bild Bewegung, Blickänderung und Einmal-Aktionen.
SC.tastenZuEingabe = function(t){
  return {
    vor: t.has("KeyW") || t.has("ArrowUp"), zurueck: t.has("KeyS") || t.has("ArrowDown"),
    links: t.has("KeyA") || t.has("ArrowLeft"), rechts: t.has("KeyD") || t.has("ArrowRight"),
    springen: t.has("Space"), sinken: t.has("ShiftLeft") || t.has("ShiftRight"),
    sprint: t.has("ControlLeft") || t.has("ControlRight")
  };
};

SC.Eingabe = function(leinwand, uiWurzel){
  var e = this;
  this.leinwand = leinwand; this.ui = uiWurzel;
  this.tasten = new Set(); this.touchAktiv = false; this.touch = null; this.empfindlichkeit = 1;
  this.aktiv = true;                                      // false, solange ein Menü offen ist
  this._blick = [0, 0]; this._einmal = {}; this._rad = 0; this._springenVorher = false;
  this._maus = { abbauen: false, setzen: false, tAbbauen: 0, tSetzen: 0 };
  this._h = {
    keydown: function(ev){
      if(ev.code === "F5" || ev.code === "F3" || ev.code === "Space" || ev.code === "Tab") ev.preventDefault();
      if(ev.target && /INPUT|TEXTAREA/.test(ev.target.tagName)) return;
      e._druecke(ev.code);
    },
    keyup: function(ev){ e._los(ev.code); },
    blur: function(){ e.tasten.clear(); e._maus.abbauen = e._maus.setzen = false; },
    mousemove: function(ev){
      if(document.pointerLockElement !== leinwand) return;
      e._blick[0] -= ev.movementX * 0.0025 * e.empfindlichkeit; e._blick[1] -= ev.movementY * 0.0025 * e.empfindlichkeit;
    },
    mousedown: function(ev){
      if(e.touchAktiv || !e.aktiv) return;
      if(document.pointerLockElement !== leinwand){ e.sperreMaus(); return; }
      if(ev.button === 0){ e._maus.abbauen = true; e._einmal.abbauen = true; e._maus.tAbbauen = performance.now(); }
      if(ev.button === 2){ e._maus.setzen = true; e._einmal.setzen = true; e._maus.tSetzen = performance.now(); }
    },
    mouseup: function(ev){ if(ev.button === 0) e._maus.abbauen = false; if(ev.button === 2) e._maus.setzen = false; },
    contextmenu: function(ev){ ev.preventDefault(); },
    wheel: function(ev){ if(document.pointerLockElement === leinwand){ e._rad += ev.deltaY > 0 ? 1 : -1; ev.preventDefault(); } },
    sperre: function(){ if(document.pointerLockElement !== leinwand && e.aktiv && !e.touchAktiv) e._einmal.menue = true; },
    touchstart: function(){ if(!e.touchAktiv){ e.touchAktiv = true; e.touch = new SC.Touch(e, uiWurzel); } }
  };
  window.addEventListener("keydown", this._h.keydown); window.addEventListener("keyup", this._h.keyup); window.addEventListener("blur", this._h.blur);
  document.addEventListener("mousemove", this._h.mousemove); leinwand.addEventListener("mousedown", this._h.mousedown);
  document.addEventListener("mouseup", this._h.mouseup); leinwand.addEventListener("contextmenu", this._h.contextmenu);
  leinwand.addEventListener("wheel", this._h.wheel, { passive: false }); document.addEventListener("pointerlockchange", this._h.sperre);
  window.addEventListener("touchstart", this._h.touchstart, { passive: true });
};

(function(){
  var EINMAL = { KeyE: "blockauswahl", Escape: "menue", F5: "ansicht", KeyV: "ansicht", F3: "entwickler" };
  SC.Eingabe.prototype._druecke = function(code){
    if(!this.tasten.has(code)){
      if(EINMAL[code]) this._einmal[EINMAL[code]] = true;
      var m = /^Digit([1-9])$/.exec(code); if(m) this._einmal.auswahl = +m[1] - 1;
    }
    this.tasten.add(code);
  };
  SC.Eingabe.prototype._los = function(code){ this.tasten.delete(code); };

  SC.Eingabe.prototype.sperreMaus = function(){
    if(this.touchAktiv || !this.leinwand.requestPointerLock) return;
    try { var p = this.leinwand.requestPointerLock(); if(p && p.catch) p.catch(function(){}); } catch(err){}
  };
  SC.Eingabe.prototype.gebeMausFrei = function(){ if(document.pointerLockElement === this.leinwand) document.exitPointerLock(); };

  // Gedrückt gehaltene Aktion alle 0,25 s wiederholen
  function wiederhole(m, feld, zeit, jetzt){ if(m[feld] && jetzt - m[zeit] > 250){ m[zeit] = jetzt; return true; } return false; }

  SC.Eingabe.prototype.zustand = function(){
    var b = SC.tastenZuEingabe(this.tasten), t = this.touch, jetzt = performance.now();
    if(t){ var j = t.bewegung(); for(var k in j) b[k] = b[k] || j[k]; }
    if(!this.aktiv){ for(var k2 in b) b[k2] = false; }
    b.springenNeu = b.springen && !this._springenVorher; this._springenVorher = b.springen;
    var e1 = this._einmal; this._einmal = {};
    if(t){ var te = t.einmal(); for(var k3 in te) e1[k3] = e1[k3] || te[k3]; t.blick(this._blick, this.empfindlichkeit); }
    b.blickDx = this._blick[0]; b.blickDy = this._blick[1]; this._blick = [0, 0];
    b.abbauen = !!e1.abbauen || wiederhole(this._maus, "abbauen", "tAbbauen", jetzt) || !!(t && t.wiederhole("abbauen", jetzt));
    b.setzen = !!e1.setzen || wiederhole(this._maus, "setzen", "tSetzen", jetzt) || !!(t && t.wiederhole("setzen", jetzt));
    b.auswahl = e1.auswahl === undefined ? null : e1.auswahl;
    b.auswahlRad = this._rad; this._rad = 0;
    b.menue = !!e1.menue; b.blockauswahl = !!e1.blockauswahl; b.ansicht = !!e1.ansicht; b.entwickler = !!e1.entwickler;
    if(!this.aktiv){ b.abbauen = b.setzen = false; b.blickDx = b.blickDy = 0; b.auswahlRad = 0; }
    return b;
  };

  SC.Eingabe.prototype.entferne = function(){
    var h = this._h, l = this.leinwand;
    window.removeEventListener("keydown", h.keydown); window.removeEventListener("keyup", h.keyup); window.removeEventListener("blur", h.blur);
    document.removeEventListener("mousemove", h.mousemove); l.removeEventListener("mousedown", h.mousedown);
    document.removeEventListener("mouseup", h.mouseup); l.removeEventListener("contextmenu", h.contextmenu);
    l.removeEventListener("wheel", h.wheel); document.removeEventListener("pointerlockchange", h.sperre);
    window.removeEventListener("touchstart", h.touchstart);
    if(this.touch) this.touch.entferne();
  };
})();
