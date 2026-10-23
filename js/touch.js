// Touch-Steuerung: Joystick links, Wischen rechts zum Umsehen, Knöpfe für Springen, Sinken, Abbauen, Setzen.
// Gezielt wird über das Fadenkreuz in der Mitte.
SC.Touch = function(eingabe, wurzel){
  var t = this;
  this.wurzel = wurzel; this.groesse = 1;
  this._j = { id: null, x0: 0, y0: 0, dx: 0, dy: 0 }; this._b = { id: null, x: 0, y: 0, dx: 0, dy: 0 };
  this._knopf = {}; this._einmal = {}; this._zeit = {};
  var el = document.createElement("div"); el.className = "touch"; this.el = el;
  el.innerHTML =
    '<div class="touch-blick"></div>' +
    '<div class="touch-joy"><div class="touch-joy-knauf"></div></div>' +
    '<button class="touch-knopf" data-k="springen" style="right:24px;bottom:120px">⤒</button>' +
    '<button class="touch-knopf" data-k="sinken" style="right:24px;bottom:30px">⤓</button>' +
    '<button class="touch-knopf" data-k="abbauen" style="right:120px;bottom:160px">⛏</button>' +
    '<button class="touch-knopf" data-k="setzen" style="right:120px;bottom:70px">■</button>' +
    '<button class="touch-knopf" data-k="ausweichen" style="right:24px;bottom:210px">⇆</button>' +
    '<button class="touch-knopf klein" data-k="blockauswahl" style="right:24px;top:24px">▦</button>' +
    '<button class="touch-knopf klein" data-k="ansicht" style="right:100px;top:24px">👁</button>' +
    '<button class="touch-knopf klein" data-k="menue" style="left:24px;top:24px">☰</button>';
  wurzel.appendChild(el);
  this.joyEl = el.querySelector(".touch-joy"); this.knaufEl = el.querySelector(".touch-joy-knauf"); this.blickEl = el.querySelector(".touch-blick");

  function finde(liste, id){ for(var i = 0; i < liste.length; i++) if(liste[i].identifier === id) return liste[i]; return null; }
  this._h = {
    joyStart: function(ev){ ev.preventDefault(); var p = ev.changedTouches[0], r = t.joyEl.getBoundingClientRect(); t._j.id = p.identifier; t._j.x0 = r.left + r.width / 2; t._j.y0 = r.top + r.height / 2; t._h.joyZieh(ev); },
    joyZieh: function(ev){ var p = finde(ev.changedTouches, t._j.id); if(!p) return; ev.preventDefault(); var r = t.joyEl.offsetWidth / 2 || 60;
      var dx = (p.clientX - t._j.x0) / r, dy = (p.clientY - t._j.y0) / r, l = Math.hypot(dx, dy); if(l > 1){ dx /= l; dy /= l; }
      t._j.dx = dx; t._j.dy = dy; t.knaufEl.style.transform = "translate(" + dx * r * 0.6 + "px," + dy * r * 0.6 + "px)"; },
    joyEnde: function(ev){ if(!finde(ev.changedTouches, t._j.id)) return; t._j.id = null; t._j.dx = t._j.dy = 0; t.knaufEl.style.transform = ""; },
    blickStart: function(ev){ ev.preventDefault(); var p = ev.changedTouches[0]; t._b.id = p.identifier; t._b.x = p.clientX; t._b.y = p.clientY; },
    blickZieh: function(ev){ var p = finde(ev.changedTouches, t._b.id); if(!p) return; ev.preventDefault(); t._b.dx += p.clientX - t._b.x; t._b.dy += p.clientY - t._b.y; t._b.x = p.clientX; t._b.y = p.clientY; },
    blickEnde: function(ev){ if(finde(ev.changedTouches, t._b.id)) t._b.id = null; },
    knopfStart: function(ev){ ev.preventDefault(); var k = ev.currentTarget.getAttribute("data-k"); t._knopf[k] = true; t._einmal[k] = true; t._zeit[k] = performance.now(); ev.currentTarget.classList.add("an"); },
    knopfEnde: function(ev){ ev.preventDefault(); var k = ev.currentTarget.getAttribute("data-k"); t._knopf[k] = false; ev.currentTarget.classList.remove("an"); }
  };
  this.joyEl.addEventListener("touchstart", this._h.joyStart, { passive: false });
  this.blickEl.addEventListener("touchstart", this._h.blickStart, { passive: false });
  window.addEventListener("touchmove", this._h.joyZieh, { passive: false }); window.addEventListener("touchmove", this._h.blickZieh, { passive: false });
  window.addEventListener("touchend", this._h.joyEnde); window.addEventListener("touchcancel", this._h.joyEnde);
  window.addEventListener("touchend", this._h.blickEnde); window.addEventListener("touchcancel", this._h.blickEnde);
  Array.prototype.forEach.call(el.querySelectorAll(".touch-knopf"), function(b){
    b.addEventListener("touchstart", t._h.knopfStart, { passive: false }); b.addEventListener("touchend", t._h.knopfEnde, { passive: false }); b.addEventListener("touchcancel", t._h.knopfEnde, { passive: false });
  });
};

// Joystick-Ausschlag (x rechts, y unten, je -1..1) → Richtungen, mit Totzone
SC.Touch.joystickZuEingabe = function(dx, dy){
  var tot = 0.3;
  return { vor: dy < -tot, zurueck: dy > tot, links: dx < -tot, rechts: dx > tot, sprint: Math.hypot(dx, dy) > 0.95 && dy < -0.8 };
};

SC.Touch.prototype.bewegung = function(){
  var b = SC.Touch.joystickZuEingabe(this._j.dx, this._j.dy);
  b.springen = !!this._knopf.springen; b.sinken = !!this._knopf.sinken;
  return b;
};
SC.Touch.prototype.einmal = function(){
  var e = this._einmal, aus = { abbauen: e.abbauen, setzen: e.setzen, blockauswahl: e.blockauswahl, menue: e.menue, ansicht: e.ansicht, ausweichen: e.ausweichen };
  this._einmal = {}; return aus;
};
SC.Touch.prototype.blick = function(ziel, empf){ ziel[0] -= this._b.dx * 0.006 * empf; ziel[1] -= this._b.dy * 0.006 * empf; this._b.dx = this._b.dy = 0; };
SC.Touch.prototype.wiederhole = function(k, jetzt){ if(this._knopf[k] && jetzt - this._zeit[k] > 250){ this._zeit[k] = jetzt; return true; } return false; };
SC.Touch.prototype.setzeGroesse = function(g){ this.groesse = g; this.el.style.setProperty("--touch-skala", g); };
SC.Touch.prototype.sichtbar = function(an){ this.el.hidden = !an; };
// Beschriftung je nach gewählter Sache: Waffe → ⚔, Laserschwert → 🛡 (Blocken); Ausweichen nur im Survival
SC.Touch.prototype.beschrifte = function(o){
  var a = this.el.querySelector('[data-k="abbauen"]'), s = this.el.querySelector('[data-k="setzen"]'), w = this.el.querySelector('[data-k="ausweichen"]');
  a.textContent = o.angriff ? "⚔" : "⛏"; s.textContent = o.blocken ? "🛡" : "■"; w.hidden = !o.ausweichen && o.ausweichen !== undefined;
};
SC.Touch.prototype.entferne = function(){
  var h = this._h;
  window.removeEventListener("touchmove", h.joyZieh); window.removeEventListener("touchmove", h.blickZieh);
  window.removeEventListener("touchend", h.joyEnde); window.removeEventListener("touchcancel", h.joyEnde);
  window.removeEventListener("touchend", h.blickEnde); window.removeEventListener("touchcancel", h.blickEnde);
  this.el.remove();
};
