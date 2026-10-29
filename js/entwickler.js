// Entwicklerwerkzeuge: Anzeige (Position, Biom, Zeit …) und Werkzeuge (Zeit, Teleport, Sichtweite …).
// Nur sichtbar, wenn in den Einstellungen eingeschaltet; Aufruf mit F3 oder über das Pausemenü.
SC.Entwickler = {};
(function(){
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function zwei(n){ return (n < 10 ? "0" : "") + n; }

  SC.Entwickler.uhrzeit = function(t){ var m = Math.floor(SC.mod(t, 1) * 1440); return zwei(Math.floor(m / 60)) + ":" + zwei(m % 60); };

  SC.Entwickler.ringAbstand = function(planet, x1, z1, x2, z2){
    var P = planet.groesse, dx = SC.mod(x2 - x1 + P / 2, P) - P / 2, dz = SC.mod(z2 - z1 + P / 2, P) - P / 2;
    return Math.hypot(dx, dz);
  };

  SC.Entwickler.naechstesBauwerk = function(planet, x, z, typ){
    var n = planet.groesse / 128, best = null, bd = Infinity;
    for(var rx = 0; rx < n; rx++) for(var rz = 0; rz < n; rz++) SC.Bauwerke.inRegion(planet, rx, rz).forEach(function(b){
      if(b.typ !== typ) return;
      var d = SC.Entwickler.ringAbstand(planet, x, z, b.x + b.breite / 2, b.z + b.tiefe / 2);
      if(d < bd){ bd = d; best = b; }
    });
    return best;
  };

  // Freie Stelle am Bauwerk: im Dungeon im ersten Raum, sonst vor dem Eingang auf dem Boden
  SC.Entwickler.teleportZiel = function(welt, b){
    if(b.typ === "dungeon") return [b.x + 4.5, b.y + 1, b.z + 4.5];
    var x = b.x + Math.floor(b.breite / 2), z = b.z - 2, y = 127;
    while(y > 1 && !SC.BLOECKE[welt.holeBlock(x, y - 1, z)].fest) y--;
    return [x + 0.5, y, z + 0.5];
  };

  SC.Entwickler.Panel = function(wurzel, spiel){
    var p = this;
    this.spiel = spiel;
    this.el = document.createElement("div"); this.el.className = "entwickler"; this.el.hidden = true;
    wurzel.appendChild(this.el);
    this.el.addEventListener("click", function(ev){ var t = ev.target.closest && ev.target.closest("[data-ew]"); if(t) p._aktion(t.getAttribute("data-ew"), t); });
  };

  var TYPEN = ["dungeon", "herrenhaus", "station", "lager"];

  SC.Entwickler.Panel.prototype.offen = function(){ return !this.el.hidden; };
  SC.Entwickler.Panel.prototype.verberge = function(){ this.el.hidden = true; };
  SC.Entwickler.Panel.prototype.zeige = function(){
    var s = this.spiel, T = SC.T, p = this;
    this.el.innerHTML =
      '<div class="ew-kopf">' + esc(T.entwickler) + ' <button data-ew="zu">✕</button></div>' +
      '<pre class="ew-info"></pre>' +
      '<div class="ew-gruppe"><b>' + esc(T.ewZeit) + '</b><input type="range" id="ew-zeit" min="0" max="1" step="0.001" value="' + s.tageszeit + '">' +
      '<div class="ew-reihe"><button data-ew="morgen">' + esc(T.ewMorgen) + '</button><button data-ew="mittag">' + esc(T.ewMittag) + '</button><button data-ew="abend">' + esc(T.ewAbend) + '</button><button data-ew="mitternacht">' + esc(T.ewMitternacht) + "</button></div>" +
      '<div class="ew-reihe"><button data-ew="anhalten">' + esc(T.ewAnhalten) + '</button><button data-ew="normal">×1</button><button data-ew="x10">×10</button><button data-ew="x60">×60</button></div></div>' +
      '<div class="ew-gruppe"><b>' + esc(T.ewTeleport) + '</b><div class="ew-reihe"><input id="ew-x" type="number" placeholder="x"><input id="ew-y" type="number" placeholder="y"><input id="ew-z" type="number" placeholder="z"><button data-ew="tp">' + esc(T.ewLos) + "</button></div>" +
      '<div class="ew-reihe">' + TYPEN.map(function(t){ return '<button data-ew="tp-' + t + '">' + esc(T.ewBauwerk[t]) + "</button>"; }).join("") + "</div></div>" +
      '<div class="ew-gruppe"><b>' + esc(T.modus) + '</b><div class="ew-reihe"><button data-ew="m-kreativ">' + esc(T.kreativ) + '</button><button data-ew="m-zuschauer">' + esc(T.zuschauer) + "</button></div></div>" +
      '<div class="ew-gruppe"><label>' + esc(T.sichtweite) + ' <b id="ew-sicht-w">' + s.render.sichtweite + '</b><input type="range" id="ew-sicht" min="2" max="16" step="1" value="' + s.render.sichtweite + '"></label>' +
      '<label>' + esc(T.ewFlug) + ' <b id="ew-flug-w">' + (s.spieler.flugFaktor || 1) + '</b><input type="range" id="ew-flug" min="0.5" max="5" step="0.5" value="' + (s.spieler.flugFaktor || 1) + '"></label>' +
      '<label class="ew-zeile"><input type="checkbox" id="ew-grenzen"' + (s.render.chunkGrenzen ? " checked" : "") + "> " + esc(T.ewGrenzen) + "</label></div>" +
      // Survival
      '<div class="ew-gruppe"><b>' + esc(T.survival) + "</b>" +
      '<div class="ew-reihe"><select id="ew-art">' + Object.keys(SC.GEGNER).map(function(a){ return '<option value="' + a + '">' + esc(T.gegner[a]) + "</option>"; }).join("") + '</select><input id="ew-gstufe" type="number" min="1" max="30" value="3"><button data-ew="gegner">' + esc(T.ewErscheinen) + '</button><button data-ew="gegner-weg">' + esc(T.ewGegnerWeg) + "</button></div>" +
      '<div class="ew-reihe"><select id="ew-gart">' + Object.keys(SC.GEGENSTAENDE).map(function(a){ return '<option value="' + a + '">' + esc(T.gegenstand[a][0]) + "</option>"; }).join("") + '</select><select id="ew-selt">' + [0, 1, 2, 3, 4].map(function(i){ return '<option value="' + i + '">' + esc(T.seltenheitName[i]) + "</option>"; }).join("") + '</select><button data-ew="gegenstand">' + esc(T.ewErzeugen) + "</button></div>" +
      '<div class="ew-reihe"><input id="ew-sstufe" type="number" min="1" max="30" value="' + (s.kampf ? s.kampf.werte.stufe : 1) + '"><button data-ew="stufe">' + esc(T.ewStufeSetzen) + '</button><button data-ew="bauwerke">' + esc(T.ewBauwerkeReset) + "</button></div>" +
      '<label class="ew-zeile"><input type="checkbox" id="ew-unverwundbar"' + (s.kampf && s.kampf.unverwundbar ? " checked" : "") + "> " + esc(T.ewUnverwundbar) + "</label></div>" +
      // Fahrzeuge
      '<div class="ew-gruppe"><b>' + esc(T.fahrzeugeTitel) + '</b><div class="ew-reihe"><select id="ew-fz">' + Object.keys(SC.FAHRZEUGE).map(function(a){ return '<option value="' + a + '">' + esc(SC.FAHRZEUGE[a].name) + "</option>"; }).join("") + '</select><button data-ew="fahrzeug">' + esc(T.ewErscheinen) + '</button><button data-ew="fahrzeuge-weg">' + esc(T.ewFahrzeugeWeg) + "</button></div></div>";
    this.el.hidden = false;
    var q = function(id){ return p.el.querySelector(id); };
    q("#ew-zeit").addEventListener("input", function(){ s.tageszeit = +this.value; });
    q("#ew-sicht").addEventListener("input", function(){ s.render.sichtweite = +this.value; q("#ew-sicht-w").textContent = this.value; });
    q("#ew-flug").addEventListener("input", function(){ s.spieler.flugFaktor = +this.value; q("#ew-flug-w").textContent = this.value; });
    q("#ew-grenzen").addEventListener("change", function(){ s.render.chunkGrenzen = this.checked; });
    q("#ew-unverwundbar").addEventListener("change", function(){ if(s.kampf) s.kampf.unverwundbar = this.checked; });
    var pos = s.spieler.pos; q("#ew-x").value = Math.floor(pos[0]); q("#ew-y").value = Math.floor(pos[1]); q("#ew-z").value = Math.floor(pos[2]);
    this.aktualisiere();
  };

  SC.Entwickler.Panel.prototype._aktion = function(a){
    var s = this.spiel, sp = s.spieler, zeiten = { morgen: 0.27, mittag: 0.5, abend: 0.74, mitternacht: 0 }, tempo = { anhalten: 0, normal: 1, x10: 10, x60: 60 };
    if(a === "zu"){ this.verberge(); if(s.beiEntwicklerZu) s.beiEntwicklerZu(); return; }
    if(a in zeiten){ s.tageszeit = zeiten[a]; var r = this.el.querySelector("#ew-zeit"); if(r) r.value = s.tageszeit; }
    if(a in tempo) s.zeitTempo = tempo[a];
    if(a === "tp"){
      var x = +this.el.querySelector("#ew-x").value, y = +this.el.querySelector("#ew-y").value, z = +this.el.querySelector("#ew-z").value;
      if(isFinite(x) && isFinite(y) && isFinite(z)){ sp.pos = [SC.mod(x, s.welt.planet.groesse) + 0.5, Math.max(1, Math.min(126, y)), SC.mod(z, s.welt.planet.groesse) + 0.5]; sp.geschw = [0, 0, 0]; }
    }
    if(a.indexOf("tp-") === 0){
      var b = SC.Entwickler.naechstesBauwerk(s.welt.planet, sp.pos[0], sp.pos[2], a.slice(3));
      if(b){ sp.pos = SC.Entwickler.teleportZiel(s.welt, b); sp.geschw = [0, 0, 0]; }
    }
    if(a === "gegner"){
      var art = this.el.querySelector("#ew-art").value, st = Math.max(1, +this.el.querySelector("#ew-gstufe").value || 1), def = SC.GEGNER[art];
      var vx = sp.pos[0] - Math.sin(sp.blick[0]) * 6, vz = sp.pos[2] - Math.cos(sp.blick[0]) * 6, vy = 127;
      while(vy > 1 && !SC.BLOECKE[s.welt.holeBlock(vx, vy - 1, vz)].fest) vy--;
      if(vy <= 1) vy = sp.pos[1];
      SC.Wesen.neu(s.welt, "gegner", { gegnerArt: art, stufe: st, pos: [vx, vy, vz], heim: [vx, vy, vz], lp: def.lp(st), lpMax: def.lp(st), breite: def.breite, hoehe: def.hoehe, boss: !!def.boss, ort: "dungeon" });
    }
    if(a === "gegner-weg"){ var w = s.welt; w.wesen.forEach(function(e){ if(e.art === "gegner" || e.art === "geschoss") SC.Wesen.entferne(w, e.id); }); }
    if(a === "gegenstand" && s.kampf){
      var sel = +this.el.querySelector("#ew-selt").value, g = SC.Beute.erzeuge(SC.zufall((Math.random() * 4294967296) >>> 0), { stufe: s.kampf.werte.stufe, art: this.el.querySelector("#ew-gart").value, mindest: sel });
      g.seltenheit = sel; s.kampf.rucksack.lege({ gegenstand: g });
    }
    if(a === "stufe" && s.kampf){ s.kampf.werte.stufe = Math.max(1, Math.min(30, +this.el.querySelector("#ew-sstufe").value || 1)); s.kampf.werte.erfahrung = 0; s.kampf.ruestungAnwenden(); s.kampf.werte.lp = s.kampf.werte.lpMax; }
    if(a === "bauwerke" && s.daten.planeten){ var pl = s.daten.planeten[s.welt.planet.id]; pl.geraeumt = {}; if(s.auftauchen){ s.auftauchen.besiegt = {}; } }
    if(a === "fahrzeug" && s.fahrzeugHinstellen) s.fahrzeugHinstellen(this.el.querySelector("#ew-fz").value);
    if(a === "fahrzeuge-weg" && s.fahrzeugeWeg) s.fahrzeugeWeg();
    if(a.indexOf("m-") === 0){ var m = a.slice(2); if(s.modus) s.modus(m); else sp.modus = m; }
    this.aktualisiere();
  };

  SC.Entwickler.Panel.prototype.aktualisiere = function(){
    var info = this.el.querySelector(".ew-info"); if(!info || this.el.hidden) return;
    var s = this.spiel, sp = s.spieler, p = sp.pos, g = s.welt.generator;
    var grad = Math.round(SC.mod(-sp.blick[0] * 180 / Math.PI, 360)), neig = Math.round(sp.blick[1] * 180 / Math.PI);
    info.textContent =
      "FPS " + s.render.fps + "   Chunks " + s.render.chunks.size + "\n" +
      "x " + p[0].toFixed(1) + "  y " + p[1].toFixed(1) + "  z " + p[2].toFixed(1) + "\n" +
      "Chunk " + Math.floor(p[0] / 16) + "," + Math.floor(p[2] / 16) + "   Biom " + g.biom(p[0], p[2]) + "\n" +
      "Blick " + grad + "° / " + neig + "°   " + sp.modus + (sp.fliegt ? " (fliegt)" : "") + "\n" +
      "Gegner " + SC.Wesen.anzahl(s.welt, "gegner") + "  Geschosse " + SC.Wesen.anzahl(s.welt, "geschoss") + "  Beute " + SC.Wesen.anzahl(s.welt, "kugel") + "\n" +
      "Version " + (window.V || "?") + "   Musik " + (s.audio && s.audio._stueck ? s.audio._stueck.stimmung : "–") + "\n" +
      "Zeit " + SC.Entwickler.uhrzeit(s.tageszeit) + (s.zeitTempo === 0 ? " angehalten" : s.zeitTempo !== 1 ? " ×" + s.zeitTempo : "") + "   Seed " + s.daten.seed;
  };
})();
