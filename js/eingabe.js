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
  this._gp = SC.Gamepad.neuerZustand(); this._gpm = SC.Gamepad.neuerZustand(); this._gpModus = null; this._gpT = 0;
  this._gpHalten = { abbauen: false, setzen: false, tAbbauen: 0, tSetzen: 0 };
  this._h = {
    keydown: function(ev){
      if(ev.target && (/INPUT|TEXTAREA|SELECT/.test(ev.target.tagName) || ev.target.isContentEditable)) return; // in Textfeldern nichts abfangen (Leertaste!)
      if(ev.code === "F5" || ev.code === "F3" || ev.code === "Space" || ev.code === "Tab") ev.preventDefault();
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
    touchstart: function(){ e.gamepadAktiv = false; if(!e.touchAktiv){ e.touchAktiv = true; e.touch = new SC.Touch(e, uiWurzel); } }
  };
  window.addEventListener("keydown", this._h.keydown); window.addEventListener("keyup", this._h.keyup); window.addEventListener("blur", this._h.blur);
  document.addEventListener("mousemove", this._h.mousemove); leinwand.addEventListener("mousedown", this._h.mousedown);
  document.addEventListener("mouseup", this._h.mouseup); leinwand.addEventListener("contextmenu", this._h.contextmenu);
  leinwand.addEventListener("wheel", this._h.wheel, { passive: false }); document.addEventListener("pointerlockchange", this._h.sperre);
  window.addEventListener("touchstart", this._h.touchstart, { passive: true });
};

(function(){
  var EINMAL = { KeyE: "blockauswahl", Escape: "menue", F5: "ansicht", KeyV: "ansicht", F3: "entwickler", KeyQ: "ausweichen" };
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

  function gpBenutzt(p){ for(var i = 0; i < p.buttons.length; i++) if(p.buttons[i] && (p.buttons[i].pressed || p.buttons[i].value > 0.5)) return true; return (p.axes || []).some(function(a){ return Math.abs(a) > 0.3; }); }
  // Touch-Knöpfe nur, solange nicht mit dem Controller gespielt wird (Issue #21)
  SC.Eingabe.prototype.touchSichtbar = function(){ return this.touchAktiv && !this.gamepadAktiv; };

  // Gedrückt gehaltene Aktion alle 0,25 s wiederholen
  function wiederhole(m, feld, zeit, jetzt){ if(m[feld] && jetzt - m[zeit] > 250){ m[zeit] = jetzt; return true; } return false; }

  SC.Eingabe.prototype.zustand = function(){
    var b = SC.tastenZuEingabe(this.tasten), t = this.touch, jetzt = performance.now();
    if(t){ var j = t.bewegung(); for(var k in j) b[k] = b[k] || j[k]; }
    // Gamepad im Spiel (im Menü übernimmt menueGamepad)
    var gp = SC.Gamepad.erstes(), gpe = null, dtg = this._gpT ? Math.min(0.1, (jetzt - this._gpT) / 1000) : 0;
    this._gpT = jetzt;
    if(gp && this.aktiv){
      if(this._gpModus !== "spiel"){ SC.Gamepad.vorbereiten(gp, this._gp); this._gpModus = "spiel"; }
      gpe = SC.Gamepad.zuEingabe(gp, this._gp, dtg);
      ["vor", "zurueck", "links", "rechts", "springen", "sinken", "sprint"].forEach(function(k){ b[k] = b[k] || gpe[k]; });
      this._blick[0] += gpe.blickDx * this.empfindlichkeit; this._blick[1] += gpe.blickDy * this.empfindlichkeit;
      var h = this._gpHalten;
      if(gpe.einmal.abbauen) h.tAbbauen = jetzt; if(gpe.einmal.setzen) h.tSetzen = jetzt;
      h.abbauen = gpe.gehalten.abbauen; h.setzen = gpe.gehalten.setzen;
      if(gpBenutzt(gp)) this.gamepadAktiv = true;
    }
    if(!this.aktiv){ for(var k2 in b) b[k2] = false; }
    b.springenNeu = b.springen && !this._springenVorher; this._springenVorher = b.springen;
    var e1 = this._einmal; this._einmal = {};
    if(gpe){ var ge = gpe.einmal; ["abbauen", "setzen", "blockauswahl", "ansicht", "menue", "entwickler", "ausweichen"].forEach(function(k){ if(ge[k]) e1[k] = true; }); if(ge.auswahlRad) this._rad += ge.auswahlRad; }
    if(t){ var te = t.einmal(); for(var k3 in te) e1[k3] = e1[k3] || te[k3]; t.blick(this._blick, this.empfindlichkeit); }
    b.blickDx = this._blick[0]; b.blickDy = this._blick[1]; this._blick = [0, 0];
    b.abbauen = !!e1.abbauen || wiederhole(this._maus, "abbauen", "tAbbauen", jetzt) || wiederhole(this._gpHalten, "abbauen", "tAbbauen", jetzt) || !!(t && t.wiederhole("abbauen", jetzt));
    b.setzen = !!e1.setzen || wiederhole(this._maus, "setzen", "tSetzen", jetzt) || wiederhole(this._gpHalten, "setzen", "tSetzen", jetzt) || !!(t && t.wiederhole("setzen", jetzt));
    b.auswahl = e1.auswahl === undefined ? null : e1.auswahl;
    b.auswahlRad = this._rad; this._rad = 0;
    b.menue = !!e1.menue; b.blockauswahl = !!e1.blockauswahl; b.ansicht = !!e1.ansicht; b.entwickler = !!e1.entwickler; b.ausweichen = !!e1.ausweichen;
    b.abbauenGehalten = this._maus.abbauen || this._gpHalten.abbauen || !!(t && t._knopf.abbauen);
    b.setzenGehalten = this._maus.setzen || this._gpHalten.setzen || !!(t && t._knopf.setzen);
    if(!this.aktiv){ b.abbauen = b.setzen = b.abbauenGehalten = b.setzenGehalten = b.ausweichen = false; b.blickDx = b.blickDy = 0; b.auswahlRad = 0; }
    return b;
  };

  // Gamepad in Menüs: liefert -1/1, "ok", "zurueck" oder null
  SC.Eingabe.prototype.menueGamepad = function(){
    var gp = SC.Gamepad.erstes(); if(!gp) return null;
    if(this._gpModus !== "menue"){ SC.Gamepad.vorbereiten(gp, this._gpm); this._gpModus = "menue"; this._gpm.menueAchse = 0; return null; }
    var r = SC.Gamepad.zuMenue(gp, this._gpm, performance.now());
    if(r !== null) this.gamepadAktiv = true;
    return r;
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

// Zielhilfe für Touch und Gamepad: dreht bis zu 4° auf den nächsten Gegner innerhalb 12° um die Bildmitte
SC.zielhilfe = function(spieler, gegner, richtung, staerke){
  var a = spieler.augen(), best = null, bw = 12 * Math.PI / 180;
  gegner.forEach(function(g){
    var d = [g.pos[0] - a[0], g.pos[1] + (g.hoehe || 1.8) * 0.6 - a[1], g.pos[2] - a[2]], l = Math.hypot(d[0], d[1], d[2]);
    if(l < 1 || l > 40) return;
    var w = Math.acos(Math.max(-1, Math.min(1, (d[0] * richtung[0] + d[1] * richtung[1] + d[2] * richtung[2]) / l)));
    if(w < bw){ bw = w; best = [d[0] / l, d[1] / l, d[2] / l]; }
  });
  if(!best) return richtung.slice();
  var max = 4 * Math.PI / 180 * (staerke || 1), t = Math.min(1, max / Math.max(bw, 1e-6));
  var r = [richtung[0] + (best[0] - richtung[0]) * t, richtung[1] + (best[1] - richtung[1]) * t, richtung[2] + (best[2] - richtung[2]) * t], l2 = Math.hypot(r[0], r[1], r[2]);
  return [r[0] / l2, r[1] / l2, r[2] / l2];
};
