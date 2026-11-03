// Oberfläche für Survival: Kampf-HUD, Rucksack und Ausrüstung, Besiegt-Bildschirm, Gegenstandsbilder
(function(){
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var PLAETZE = ["waffe", "helm", "brust", "handschuhe", "stiefel", "schild"];

  // Kleines Pixelbild je Gegenstandsart in der Seltenheitsfarbe (gecacht)
  var MUSTER = {
    laserschwert: ["......F", ".....F.", "....F..", "...F...", "..G....", ".G.....", "G......"],
    blasterpistole: [".......", "FFFFFF.", "FFFFFF.", "..GG...", "..GG...", ".......", "......."],
    blastergewehr: [".......", "FFFFFFF", "FFFFFFF", ".GG.GG.", ".GG....", ".......", "......."],
    helm: [".......", "..FFF..", ".FFFFF.", ".FGGGF.", ".F...F.", ".......", "......."],
    brust: [".......", ".FF.FF.", ".FFFFF.", ".FFFFF.", "..FFF..", ".......", "......."],
    handschuhe: [".......", ".F...F.", ".FF.FF.", ".FF.FF.", ".GG.GG.", ".......", "......."],
    stiefel: [".......", ".F...F.", ".F...F.", ".F...F.", "FF..FFF", ".......", "......."],
    schildgenerator: [".......", "..FFF..", ".F.G.F.", ".FGGGF.", ".F.G.F.", "..FFF..", "......."]
  };
  var bilder = {};
  SC.UI.gegenstandBild = function(g){
    var k = g.art + ":" + (g.seltenheit || 0) + ":" + (g.klinge || "") + ":" + (g.metall || ""); if(bilder[k]) return bilder[k];
    var farbe = SC.Beute.stoffFarbe(g);
    var c = document.createElement("canvas"); c.width = c.height = 14; var x = c.getContext("2d"), m = MUSTER[g.art] || MUSTER.helm;
    m.forEach(function(z, y){ for(var i = 0; i < z.length; i++){ if(z[i] === ".") continue; x.fillStyle = z[i] === "F" ? farbe : "#5a6070"; x.fillRect(i * 2, y * 2, 2, 2); } });
    return (bilder[k] = c.toDataURL());
  };

  function wertZeilen(g, vergleich){
    return Object.keys(g.werte || {}).map(function(k){
      var d = vergleich ? vergleich[k] : 0, pf = d > 0 ? ' <b class="besser">▲ ' + d + "</b>" : d < 0 ? ' <b class="schlechter">▼ ' + (-d) + "</b>" : "";
      return "<div>" + esc(SC.T.werteName[k] || k) + ": " + g.werte[k] + pf + "</div>";
    }).join("") + (g.sonder ? '<div class="sonder">★ ' + esc(SC.T.sonderName[g.sonder]) + "</div>" : "");
  }

  // fahrzeug (optional): { panzerung, max, name } – Panzerungsbalken, solange man im Fahrzeug sitzt
  SC.UI.prototype.kampfHud = function(kampf, bemerkt, fahrzeug){
    var el = this.hudEl.querySelector(".kampf"); if(!el) return;
    if(!kampf){ if(!el.hidden) el.hidden = true; return; }
    if(el.hidden) el.hidden = false;
    if(!el.firstChild) el.innerHTML =
      '<div class="balken balken-xp"><i></i></div>' +
      '<div class="balken balken-lp"><i></i><span></span></div><div class="balken balken-schild"><i></i></div>' +
      '<div class="balken balken-fahrzeug" hidden><i></i><span></span></div><div class="balken balken-hitze"><i></i></div><div class="treffer-rand"></div><div class="treffer-pfeil">▲</div>';
    // Das HUD läuft jedes Bild: nur schreiben, was sich geändert hat – jede Schreibung kostet auf iPad/iPhone Layout und Neuzeichnen des Statusfelds
    var w = kampf.werte, q = function(s){ return el.querySelector(s); };
    function text(e, t){ if(e && e.textContent !== t) e.textContent = t; }
    function zeige(e, an){ if(e.hidden === an) e.hidden = !an; }
    function breite(e, p){ p = p + "%"; if(e._breite !== p){ e._breite = p; e.style.width = p; } }
    // Die Stufe steht im Statusfeld oben links (ein Element, nicht zwei)
    text(this.hudEl.querySelector(".status-stufe"), SC.T.stufe + " " + w.stufe);
    breite(q(".balken-xp i"), w.stufe >= SC.Werte.MAX_STUFE ? 100 : 100 * w.erfahrung / SC.Werte.erfahrungFuer(w.stufe));
    breite(q(".balken-lp i"), 100 * w.lp / w.lpMax); text(q(".balken-lp span"), Math.ceil(w.lp) + " / " + w.lpMax);
    zeige(q(".balken-schild"), !!w.schildMax); breite(q(".balken-schild i"), w.schildMax ? 100 * w.schild / w.schildMax : 0);
    var fz = q(".balken-fahrzeug"); zeige(fz, !!fahrzeug);
    if(fahrzeug){ breite(fz.querySelector("i"), Math.round(100 * fahrzeug.panzerung / fahrzeug.max)); text(fz.querySelector("span"), fahrzeug.name + " · " + (fahrzeug.label || SC.T.fahrzeugPanzerung) + " " + Math.ceil(fahrzeug.panzerung)); }
    var waffe = kampf.waffe(), heiss = waffe && SC.GEGENSTAENDE[waffe.art].waffe.typ === "blaster", hz = q(".balken-hitze");
    zeige(hz, !!heiss); hz.classList.toggle("ueberhitzt", kampf.uhr < kampf.ueberhitztBis); breite(q(".balken-hitze i"), 100 * kampf.hitze);
    // Treffer: roter Rand und Pfeil aus der Richtung des Angriffs
    var t = kampf.letzterTreffer, frisch = !!(t && kampf.uhr - t.zeit < 600);
    // Der Rand ist bildschirmfüllend mit 80 px Weichzeichnung: nur im Dokument, solange er leuchtet – sonst kostet er auf iPad/iPhone jedes Bild
    var rand = q(".treffer-rand"); zeige(rand, frisch); if(frisch) rand.style.opacity = 1 - (kampf.uhr - t.zeit) / 600;
    var pf = q(".treffer-pfeil"); zeige(pf, frisch);
    if(frisch){ var sp = kampf.spieler, w0 = Math.atan2(-t.richtung[0], -t.richtung[2]) - sp.blick[0]; pf.style.transform = "translate(-50%,-50%) rotate(" + (-w0) + "rad) translateY(-90px)"; }
  };

  SC.UI.prototype.zeigeBesiegt = function(beiWeiter){
    this._zeige('<div class="besiegt"><h1>' + esc(SC.T.besiegt) + "</h1><p>" + esc(SC.T.besiegtText) + '</p><button class="haupt" data-aktion="weiter">' + esc(SC.T.weiter) + "</button></div>",
      { weiter: function(){ this.schliesse(); beiWeiter(); } });
  };

  // Rucksack und Ausrüstung; Bedienung durch Antippen (geht auch mit Touch und Gamepad)
  // Rucksack: ein Cursor (der Fokus) und ein Aktionsmenü direkt am Gegenstand. menue = { i } (Rucksackplatz) oder { platz } (angelegte Rüstung) oder null;
  // der Waffenplatz der Ausrüstung steht für das Schnellleistenfeld der gehaltenen Waffe. Spec: docs/superpowers/specs/2026-11-03-inventar-aktionsmenue-design.md
  SC.UI.prototype.zeigeRucksack = function(kampf, o){
    var ui = this, rs = kampf.rucksack, a = kampf.ausruestung, menue = null, cursor = null, verschieben = null;   // verschieben: Quellplatz, solange ein Ziel gesucht wird
    o = o || {};
    function ziel(el){
      var i = el.getAttribute("data-i"), p = el.getAttribute("data-platz");
      if(i !== null) return { i: +i };
      if(p === "waffe") return { i: kampf.spieler.auswahl };
      return p ? { platz: p } : null;
    }
    function sacheVon(m){ return !m ? null : m.platz ? (a[m.platz] ? { gegenstand: a[m.platz] } : null) : rs.plaetze[m.i]; }
    function gleicheStelle(x, y){ return !!x && !!y && x.i === y.i && x.platz === y.platz; }
    function sachName(s){ return s.gegenstand ? s.gegenstand.name : SC.BLOECKE[s.block].name + (s.anzahl > 1 ? " × " + s.anzahl : ""); }
    // Knöpfe des Menüs, erste = vorausgewählt; Wegwerfen nie zuerst
    function knoepfe(m, s){
      if(m.platz) return ["ablegen", "abbrechen"];
      var k = [], g = s.gegenstand, platz = g && SC.GEGENSTAENDE[g.art].platz;
      if(g && platz !== "waffe") k.push("anlegen");
      else if(m.i >= 9) k.push("leiste");
      return k.concat(["verschieben", "wegwerfen", "abbrechen"]);
    }
    var KNOPF = { anlegen: "anlegen", ablegen: "ablegen", leiste: "inSchnellleiste", verschieben: "verschieben", wegwerfen: "wegwerfen", abbrechen: "abbrechen" };
    function menueHtml(m){
      var s = sacheVon(m), g = s.gegenstand, kopf;
      if(g){
        var platz = SC.GEGENSTAENDE[g.art].platz, alt = m.platz || platz === "waffe" ? null : a[platz];
        kopf = '<h3 style="color:' + SC.SELTENHEIT[g.seltenheit || 0].farbe + '">' + esc(g.name) + "</h3>" + wertZeilen(g, m.platz ? null : SC.Beute.vergleiche(g, alt));
      } else kopf = "<h3>" + esc(sachName(s)) + "</h3>";
      return '<div class="rs-menue exklusiv panel" data-zone="menue">' + kopf + '<div class="reihe">' + knoepfe(m, s).map(function(k, n){
        return '<button' + (n === 0 ? ' class="haupt"' : k === "wegwerfen" ? ' class="gefahr"' : "") + ' data-aktion="' + k + '">' + esc(SC.T[KNOPF[k]]) + "</button>";
      }).join("") + "</div></div>";
    }
    function platzHtml(s, i){
      var inhalt = "", stil = "";
      if(s && s.gegenstand){ inhalt = '<img src="' + SC.UI.gegenstandBild(s.gegenstand) + '" alt="">'; stil = ' style="border-color:' + SC.SELTENHEIT[s.gegenstand.seltenheit || 0].farbe + '"'; }
      else if(s){ inhalt = '<img src="' + SC.UI.blockBild(s.block) + '" alt=""><b class="anzahl">' + s.anzahl + "</b>"; }
      var h = '<button class="rs-platz' + (i < 9 ? " leiste" : "") + (verschieben === i ? " verschiebt" : "") + '" data-aktion="platz" data-i="' + i + '"' + stil + ">" + inhalt + "</button>";
      // Das Menü steht als eigene Zeile direkt unter der Reihe des Platzes
      if(menue && !menue.platz && i === Math.floor(menue.i / 9) * 9 + 8) h += menueHtml(menue);
      return h;
    }
    function ausrHtml(p){
      var g = p === "waffe" ? kampf.waffe() : a[p];
      return '<button class="rs-aplatz" data-aktion="aplatz" data-platz="' + p + '"' + (g ? ' style="border-color:' + SC.SELTENHEIT[g.seltenheit || 0].farbe + '"' : "") + ">" +
        (g ? '<img src="' + SC.UI.gegenstandBild(g) + '" alt="">' : "") + "<small>" + esc(SC.T.platzName[p]) + "</small></button>";
    }
    // Info-Zeile: was unter dem Cursor liegt (folgt dem Fokus, ohne neu zu zeichnen)
    function infoText(el){
      var m = el && ziel(el); if(!m) return "";
      var s = sacheVon(m); return s ? sachName(s) : el.getAttribute("data-platz") ? SC.T.platzName[el.getAttribute("data-platz")] : SC.T.rucksackInfoLeer;
    }
    function zeichne(){
      var w = kampf.werte;
      ui._zeige(
        "<h2>" + esc(SC.T.rucksackTitel) + "</h2>" +
        '<div class="rs"><div class="rs-links"><div class="rs-ausruestung" data-zone="ausruestung">' + PLAETZE.map(ausrHtml).join("") + (menue && menue.platz ? menueHtml(menue) : "") + "</div>" +
        '<div class="rs-werte">' + esc(SC.T.stufe) + " " + w.stufe + " · " + esc(SC.T.werteName.lp) + " " + w.lpMax + " · " + esc(SC.T.werteName.schutz) + " " + w.schutz + (w.schildMax ? " · " + esc(SC.T.werteName.schild) + " " + w.schildMax : "") + "</div>" +
        '<div class="rs-info"></div></div>' +
        '<div class="rs-raster" data-zone="raster">' + rs.plaetze.map(platzHtml).join("") + "</div></div>" +
        '<div class="reihe" data-zone="aktionen"><button data-aktion="handwerk">' + esc(SC.T.handwerk) + '</button><button class="haupt" data-aktion="fertig">' + esc(SC.T.fertig) + "</button></div>",
        aktionen, { seite: true, startZone: "raster" });
      // Offenes Menü: Cursor auf die erste Aktion; sonst zurück auf den Platz, an dem man war
      var f = menue ? ui.ebene.querySelector(".rs-menue button") : cursor && ui.ebene.querySelector(cursor.platz ? '.rs-aplatz[data-platz="' + cursor.platz + '"]' : '.rs-platz[data-i="' + cursor.i + '"]');
      if(f) f.focus();
      var info = ui.ebene.querySelector(".rs-info"); if(info) info.textContent = verschieben !== null ? SC.T.wohin : infoText(menue ? null : document.activeElement);
    }
    function fertigMit(){ menue = null; o.beiAenderung && o.beiAenderung(); zeichne(); }
    // Tipp, Klick oder A auf einen Platz: Cursor dorthin; gleicher Platz bei offenem Menü = erste Aktion; belegt = Menü; leer = Menü zu
    function tippe(el){
      el.focus();
      var m = ziel(el), stelle = el.getAttribute("data-platz") ? { platz: el.getAttribute("data-platz") } : { i: +el.getAttribute("data-i") };
      cursor = stelle;
      // Beim Verschieben: ein anderer Rucksackplatz ist das Ziel (leer: dorthin, belegt: tauschen); Quelle oder Ausrüstung brechen ab
      if(verschieben !== null){
        var von = verschieben; verschieben = null;
        if(stelle.i !== undefined && stelle.i !== von){ rs.tausche(von, stelle.i); o.beiAenderung && o.beiAenderung(); }
        menue = null; zeichne(); return;
      }
      if(menue && gleicheStelle(menue, m)){ var erste = ui.ebene.querySelector(".rs-menue button"); if(erste) erste.click(); return; }
      menue = sacheVon(m) ? m : null; zeichne();
    }
    var aktionen = {
      platz: function(el){ tippe(el); },
      aplatz: function(el){ tippe(el); },
      anlegen: function(){
        var i = menue.i, g = rs.plaetze[i].gegenstand, p = SC.GEGENSTAENDE[g.art].platz, alt = a[p];
        a[p] = g; rs.plaetze[i] = alt ? { gegenstand: alt } : null; kampf.ruestungAnwenden(); fertigMit();
      },
      ablegen: function(){
        var p = menue.platz;
        if(rs.lege({ gegenstand: a[p] }) === 0){ a[p] = null; kampf.ruestungAnwenden(); fertigMit(); }
        else { ui.hinweis(SC.T.rucksackVoll); menue = null; zeichne(); }
      },
      leiste: function(){
        var ziel = -1; for(var j = 0; j < 9; j++) if(!rs.plaetze[j]){ ziel = j; break; }
        if(ziel < 0) ziel = kampf.spieler.auswahl;
        rs.tausche(menue.i, ziel); fertigMit();
      },
      wegwerfen: function(){ var s = rs.nimm(menue.i); o.beiWegwerfen && o.beiWegwerfen(s); fertigMit(); },
      verschieben: function(){ verschieben = menue.i; cursor = { i: menue.i }; menue = null; zeichne(); },
      abbrechen: function(){ menue = null; zeichne(); },
      handwerk: function(){ ui.zeigeWerkbank(kampf, { station: "hand", beiAenderung: o.beiAenderung, beiFertig: function(){ ui.zeigeRucksack(kampf, o); } }); },
      fertig: function(){ ui.schliesse(); o.beiFertig ? o.beiFertig() : ui.o.beiWeiter && ui.o.beiWeiter(); }
    };
    // Controller: der Fokus zieht die Info-Zeile nach; Y legt sofort an bzw. legt in die Schnellleiste (ohne Menü); B schließt zuerst das Menü
    ui._beiFokus = function(el){ var info = ui.ebene.querySelector(".rs-info"); if(info && verschieben === null && !(el.closest && el.closest(".rs-menue"))) info.textContent = infoText(el); };
    ui._kurzaktion = function(el){
      var i = el.getAttribute("data-i"); if(i === null) return;
      var s = rs.plaetze[+i]; if(!s) return;
      cursor = { i: +i }; verschieben = null;
      if(s.gegenstand){
        // Waffen werden nicht angelegt: dieselbe Regel wie im Menü, die Ausrüstung hat keinen Waffenplatz
        if(SC.GEGENSTAENDE[s.gegenstand.art].platz === "waffe") return;
        menue = { i: +i }; aktionen.anlegen.call(ui); return;
      }
      if(+i >= 9){ menue = { i: +i }; aktionen.leiste.call(ui); }
    };
    ui._beiZurueck = function(){ if(!menue && verschieben === null) return false; menue = null; verschieben = null; zeichne(); return true; };
    zeichne();
  };
})();
