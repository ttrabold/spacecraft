// Karten (#169): Vollbild-Karte (Ansicht, Zeichnen, Bedienung). Das Erkunden selbst steht in js/karte.js.
(function(){
  var K = SC.Karte;
  function mod(a, n){ return ((a % n) + n) % n; }
  function rund(a, P){ return mod(a + P / 2, P) - P / 2; }   // kürzester Abstand um den Ring (−P/2 … P/2)

  // Ausschnitt der Karte: mitte = Weltpunkt [x, z] in der Bildmitte, zoom = Pixel je Block
  K.Ansicht = function(groesse, breite, hoehe){
    this.P = groesse; this.b = breite; this.h = hoehe; this.mitte = [groesse / 2, groesse / 2]; this.zoom = Math.min(breite, hoehe) / groesse;
  };
  var A = K.Ansicht.prototype;
  A.minZoom = function(){ return Math.min(this.b, this.h) / this.P; };   // ganzer Planet im Bild
  A.maxZoom = function(){ return this.b / 128; };                       // etwa 128 Blöcke breit
  A.groesse = function(b, h){ this.b = b; this.h = h; this.setzeZoom(this.zoom); };
  A.setzeZoom = function(z){ this.zoom = Math.max(this.minZoom(), Math.min(this.maxZoom(), z)); };
  A.zuBild = function(x, z){ return [this.b / 2 + rund(x - this.mitte[0], this.P) * this.zoom, this.h / 2 + rund(z - this.mitte[1], this.P) * this.zoom]; };
  A.zuWelt = function(px, py){ return [mod(this.mitte[0] + (px - this.b / 2) / this.zoom, this.P), mod(this.mitte[1] + (py - this.h / 2) / this.zoom, this.P)]; };
  A.zoomen = function(faktor, px, py){   // der Weltpunkt unter (px, py) bleibt unter dem Finger
    var vx = (px - this.b / 2) / this.zoom, vz = (py - this.h / 2) / this.zoom, px0 = this.mitte[0] + vx, pz0 = this.mitte[1] + vz;
    this.setzeZoom(this.zoom * faktor);
    this.mitte = [mod(px0 - (px - this.b / 2) / this.zoom, this.P), mod(pz0 - (py - this.h / 2) / this.zoom, this.P)];
  };
  A.verschieben = function(dpx, dpy){ this.mitte = [mod(this.mitte[0] - dpx / this.zoom, this.P), mod(this.mitte[1] - dpy / this.zoom, this.P)]; };
  A.zuMir = function(pos){ this.mitte = [mod(pos[0], this.P), mod(pos[2], this.P)]; };

  // Mitspieler für die Karte: nur vom gleichen Planeten (ohne Angabe gilt der Planet als gleich) und mit Position
  K.punkte = function(liste, planetId){ return (liste || []).filter(function(e){ return e && e.pos && (!e.planet || e.planet === planetId); }); };

  // Karte zeichnen: d = { planet, gen, bits, ich: { pos, blick } | null, punkte: [{ name, farbe, pos }], bett: [x, z] | null, cache: {} }
  K.zeichne = function(ctx, a, d){
    var P = a.P, n = Math.floor(P / K.FELD), b = Math.max(1, Math.floor(a.b)), h = Math.max(1, Math.floor(a.h));
    var farben = d.cache.farben || (d.cache.farben = new Uint32Array(n * n)), img = ctx.createImageData(b, h), px = img.data, un = K.UNERKUNDET, spalte = new Int32Array(b);
    for(var x = 0; x < b; x++) spalte[x] = Math.floor(mod(a.mitte[0] + (x + 0.5 - a.b / 2) / a.zoom, P) / K.FELD);
    for(var y = 0; y < h; y++){
      var fz = Math.floor(mod(a.mitte[1] + (y + 0.5 - a.h / 2) / a.zoom, P) / K.FELD), zeile = fz * n;
      for(x = 0; x < b; x++){
        var fx = spalte[x], i = (y * b + x) * 4, r = un[0], g = un[1], bl = un[2];
        if(K.istErkundet(d.bits, P, fx, fz)){
          var c = farben[zeile + fx]; if(!c){ var f = K.farbe(d.gen, d.planet, fx, fz); c = farben[zeile + fx] = ((f[0] << 16) | (f[1] << 8) | f[2]) + 1; }
          c -= 1; r = c >> 16 & 255; g = c >> 8 & 255; bl = c & 255;
        }
        px[i] = r; px[i + 1] = g; px[i + 2] = bl; px[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    if(d.bett){ var bp = a.zuBild(d.bett[0], d.bett[1]); ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#000000"; ctx.lineWidth = 2; ctx.strokeRect(bp[0] - 5, bp[1] - 3, 10, 6); ctx.fillRect(bp[0] - 5, bp[1] - 3, 10, 6); }
    ctx.font = "13px system-ui, sans-serif"; ctx.textBaseline = "middle";
    (d.punkte || []).forEach(function(e){
      var p = a.zuBild(e.pos[0], e.pos[2]); ctx.beginPath(); ctx.arc(p[0], p[1], 5, 0, 6.2832); ctx.fillStyle = e.farbe || "#ffd24a"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "#000000"; ctx.stroke();
      if(e.name){ ctx.lineWidth = 3; ctx.strokeText(e.name, p[0] + 9, p[1]); ctx.fillStyle = "#ffffff"; ctx.fillText(e.name, p[0] + 9, p[1]); }
    });
    if(d.ich){   // eigener Pfeil in Blickrichtung (Blick 0 = nach Norden, −z = oben)
      var q = a.zuBild(d.ich.pos[0], d.ich.pos[2]), yaw = d.ich.blick[0], dx = -Math.sin(yaw), dz = -Math.cos(yaw), nx = -dz, nz = dx;
      ctx.beginPath(); ctx.moveTo(q[0] + dx * 9, q[1] + dz * 9); ctx.lineTo(q[0] - dx * 6 + nx * 6, q[1] - dz * 6 + nz * 6); ctx.lineTo(q[0] - dx * 3, q[1] - dz * 3); ctx.lineTo(q[0] - dx * 6 - nx * 6, q[1] - dz * 6 - nz * 6); ctx.closePath();
      ctx.fillStyle = "#ffffff"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "#000000"; ctx.stroke();
    }
  };

  // Fenster: d = { planet, gen, bits, name, ich: () => { pos, blick }, mitspieler: () => Liste, bett: () => [x, z] | null }, o = { beiFertig }
  SC.UI.prototype.zeigeKarte = function(d, o){
    var ui = this, T = SC.T, esc = SC.UI.esc || function(t){ return String(t).replace(/[&<>"]/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }; o = o || {};
    var aktionen = { fertig: function(){ stop = true; ui.schliesse(); o.beiFertig ? o.beiFertig() : ui.o.beiWeiter && ui.o.beiWeiter(); } }, stop = false;
    var zusatz = '<div class="reihe"><button data-aktion="plus">+</button><button data-aktion="minus">−</button><button data-aktion="mir">' + esc(T.karteZuMir) + '</button><button class="haupt" data-aktion="fertig">' + esc(T.fertig) + "</button></div>";
    ui._zeige("<h2>" + esc(T.karteTitel) + (d.name ? " – " + esc(d.name) : "") + '</h2><canvas class="karte-fl"></canvas><p class="leer" id="karte-pos"></p><p class="leer">' + esc(T.karteTipp) + "</p>" + zusatz, aktionen, { startZone: null });
    var cv = ui.ebene.querySelector(".karte-fl"), pos = ui.ebene.querySelector("#karte-pos"), b = Math.max(200, Math.min(820, window.innerWidth - 48)), h = Math.max(160, Math.min(560, window.innerHeight - 250));
    cv.width = b; cv.height = h; var ctx = cv.getContext("2d"), a = new K.Ansicht(d.gen.planet.groesse, b, h), cache = {}, schmutzig = true, letzte = "";
    var ich0 = d.ich(); if(ich0) { a.zuMir(ich0.pos); a.setzeZoom(a.b / 256); }
    aktionen.plus = function(){ a.zoomen(1.5, b / 2, h / 2); schmutzig = true; }; aktionen.minus = function(){ a.zoomen(1 / 1.5, b / 2, h / 2); schmutzig = true; };
    aktionen.mir = function(){ var i = d.ich(); if(i) a.zuMir(i.pos); schmutzig = true; };
    // Maus und Touch: Ziehen, Rad, Zwei-Finger-Zoom
    var zeiger = {}, abst = 0;
    function lokal(ev){ var r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) * b / r.width, (ev.clientY - r.top) * h / r.height]; }
    function anzahl(){ return Object.keys(zeiger).length; }
    cv.addEventListener("pointerdown", function(ev){ zeiger[ev.pointerId] = lokal(ev); if(cv.setPointerCapture) try { cv.setPointerCapture(ev.pointerId); } catch(e){} abst = 0; });
    cv.addEventListener("pointermove", function(ev){
      var alt = zeiger[ev.pointerId]; if(!alt) return; var neu = lokal(ev);
      if(anzahl() === 2){ zeiger[ev.pointerId] = neu; var ids = Object.keys(zeiger), p = zeiger[ids[0]], q = zeiger[ids[1]], dist = Math.hypot(p[0] - q[0], p[1] - q[1]); if(abst > 0 && dist > 0) a.zoomen(dist / abst, (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); abst = dist; }
      else { a.verschieben(neu[0] - alt[0], neu[1] - alt[1]); zeiger[ev.pointerId] = neu; }
      schmutzig = true;
    });
    function los(ev){ delete zeiger[ev.pointerId]; abst = 0; }
    cv.addEventListener("pointerup", los); cv.addEventListener("pointercancel", los);
    cv.addEventListener("wheel", function(ev){ ev.preventDefault(); var p = lokal(ev); a.zoomen(ev.deltaY < 0 ? 1.25 : 0.8, p[0], p[1]); schmutzig = true; }, { passive: false });
    function bild(){
      if(stop || !cv.isConnected){ return; }
      var i = d.ich(), ml = K.punkte(d.mitspieler(), d.planet.id), sig = JSON.stringify([i && i.pos.map(Math.round), i && Math.round(i.blick[0] * 10), ml.map(function(e){ return [e.id, Math.round(e.pos[0]), Math.round(e.pos[2])]; })]);
      // Controller: linker Stick verschiebt, LB/RB zoomen
      var gp = navigator.getGamepads ? navigator.getGamepads() : []; for(var g = 0; g < gp.length; g++){ var p = gp[g]; if(!p) continue;
        var sx = Math.abs(p.axes[0]) > 0.2 ? p.axes[0] : 0, sy = Math.abs(p.axes[1]) > 0.2 ? p.axes[1] : 0; if(sx || sy){ a.verschieben(-sx * 8, -sy * 8); schmutzig = true; }
        if(p.buttons[5] && p.buttons[5].pressed){ a.zoomen(1.03, b / 2, h / 2); schmutzig = true; } if(p.buttons[4] && p.buttons[4].pressed){ a.zoomen(1 / 1.03, b / 2, h / 2); schmutzig = true; } }
      if(schmutzig || sig !== letzte){
        letzte = sig; schmutzig = false;
        K.zeichne(ctx, a, { planet: d.planet, gen: d.gen, bits: d.bits(), ich: i, punkte: ml.map(function(e){ return { id: e.id, name: e.name, farbe: e.farbe, pos: e.pos }; }), bett: d.bett(), cache: cache });
        if(i) pos.textContent = T.karteDu.replace("{x}", Math.floor(i.pos[0])).replace("{z}", Math.floor(i.pos[2]));
      }
      requestAnimationFrame(bild);
    }
    requestAnimationFrame(bild);
  };
})();
