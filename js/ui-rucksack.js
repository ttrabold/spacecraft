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
    var k = g.art + ":" + (g.seltenheit || 0); if(bilder[k]) return bilder[k];
    var c = document.createElement("canvas"); c.width = c.height = 14; var x = c.getContext("2d"), m = MUSTER[g.art] || MUSTER.helm;
    m.forEach(function(z, y){ for(var i = 0; i < z.length; i++){ if(z[i] === ".") continue; x.fillStyle = z[i] === "F" ? SC.SELTENHEIT[g.seltenheit || 0].farbe : "#5a6070"; x.fillRect(i * 2, y * 2, 2, 2); } });
    return (bilder[k] = c.toDataURL());
  };

  function wertZeilen(g, vergleich){
    return Object.keys(g.werte || {}).map(function(k){
      var d = vergleich ? vergleich[k] : 0, pf = d > 0 ? ' <b class="besser">▲ ' + d + "</b>" : d < 0 ? ' <b class="schlechter">▼ ' + (-d) + "</b>" : "";
      return "<div>" + esc(SC.T.werteName[k] || k) + ": " + g.werte[k] + pf + "</div>";
    }).join("") + (g.sonder ? '<div class="sonder">★ ' + esc(SC.T.sonderName[g.sonder]) + "</div>" : "");
  }

  SC.UI.prototype.kampfHud = function(kampf, bemerkt){
    var el = this.hudEl.querySelector(".kampf"); if(!el) return;
    if(!kampf){ el.hidden = true; return; }
    el.hidden = false;
    if(!el.firstChild) el.innerHTML =
      '<div class="kampf-stufe"></div><div class="balken balken-xp"><i></i></div>' +
      '<div class="balken balken-lp"><i></i><span></span></div><div class="balken balken-schild"><i></i></div>' +
      '<div class="balken balken-hitze"><i></i></div><div class="treffer-rand"></div><div class="treffer-pfeil">▲</div>';
    var w = kampf.werte, q = function(s){ return el.querySelector(s); };
    q(".kampf-stufe").textContent = SC.T.stufe + " " + w.stufe;
    q(".balken-xp i").style.width = (w.stufe >= SC.Werte.MAX_STUFE ? 100 : 100 * w.erfahrung / SC.Werte.erfahrungFuer(w.stufe)) + "%";
    q(".balken-lp i").style.width = 100 * w.lp / w.lpMax + "%"; q(".balken-lp span").textContent = Math.ceil(w.lp) + " / " + w.lpMax;
    q(".balken-schild").hidden = !w.schildMax; q(".balken-schild i").style.width = (w.schildMax ? 100 * w.schild / w.schildMax : 0) + "%";
    var waffe = kampf.waffe(), heiss = waffe && SC.GEGENSTAENDE[waffe.art].waffe.typ === "blaster";
    q(".balken-hitze").hidden = !heiss; q(".balken-hitze").classList.toggle("ueberhitzt", kampf.uhr < kampf.ueberhitztBis); q(".balken-hitze i").style.width = 100 * kampf.hitze + "%";
    // Treffer: roter Rand und Pfeil aus der Richtung des Angriffs
    var t = kampf.letzterTreffer, frisch = t && kampf.uhr - t.zeit < 600;
    q(".treffer-rand").style.opacity = frisch ? 1 - (kampf.uhr - t.zeit) / 600 : 0;
    var pf = q(".treffer-pfeil"); pf.hidden = !frisch;
    if(frisch){ var sp = kampf.spieler, w0 = Math.atan2(-t.richtung[0], -t.richtung[2]) - sp.blick[0]; pf.style.transform = "translate(-50%,-50%) rotate(" + (-w0) + "rad) translateY(-90px)"; }
  };

  SC.UI.prototype.zeigeBesiegt = function(beiWeiter){
    this._zeige('<div class="besiegt"><h1>' + esc(SC.T.besiegt) + "</h1><p>" + esc(SC.T.besiegtText) + '</p><button class="haupt" data-aktion="weiter">' + esc(SC.T.weiter) + "</button></div>",
      { weiter: function(){ this.schliesse(); beiWeiter(); } });
  };

  // Rucksack und Ausrüstung; Bedienung durch Antippen (geht auch mit Touch und Gamepad)
  SC.UI.prototype.zeigeRucksack = function(kampf, o){
    var ui = this, rs = kampf.rucksack, a = kampf.ausruestung, gewaehlt = null;
    o = o || {};
    function platzHtml(s, i){
      var inhalt = "", stil = "";
      if(s && s.gegenstand){ inhalt = '<img src="' + SC.UI.gegenstandBild(s.gegenstand) + '" alt="">'; stil = ' style="border-color:' + SC.SELTENHEIT[s.gegenstand.seltenheit || 0].farbe + '"'; }
      else if(s){ inhalt = '<img src="' + SC.UI.blockBild(s.block) + '" alt=""><b class="anzahl">' + s.anzahl + "</b>"; }
      return '<button class="rs-platz' + (i < 9 ? " leiste" : "") + (gewaehlt && gewaehlt.i === i ? " gewaehlt" : "") + '" data-aktion="platz" data-i="' + i + '"' + stil + ">" + inhalt + "</button>";
    }
    function ausrHtml(p){
      var g = p === "waffe" ? kampf.waffe() : a[p];
      return '<button class="rs-aplatz" data-aktion="aplatz" data-platz="' + p + '"' + (g ? ' style="border-color:' + SC.SELTENHEIT[g.seltenheit || 0].farbe + '"' : "") + ">" +
        (g ? '<img src="' + SC.UI.gegenstandBild(g) + '" alt="">' : "") + "<small>" + esc(SC.T.platzName[p]) + "</small></button>";
    }
    function detail(){
      if(!gewaehlt) return '<p class="leer">' + esc(SC.T.rucksackTipp) + "</p>";
      var s = gewaehlt.sache;
      if(s.block !== undefined) return "<h3>" + esc(SC.BLOECKE[s.block].name) + " × " + s.anzahl + "</h3>" + knoepfe(false);
      var g = s.gegenstand, platz = SC.GEGENSTAENDE[g.art].platz, alt = gewaehlt.ausgeruestet ? null : platz === "waffe" ? kampf.waffe() : a[platz];
      return '<h3 style="color:' + SC.SELTENHEIT[g.seltenheit || 0].farbe + '">' + esc(g.name) + "</h3><div>" + esc(SC.T.seltenheitName[g.seltenheit || 0]) + " · " + esc(SC.T.stufe) + " " + g.stufe + "</div>" +
        wertZeilen(g, alt && alt !== g ? SC.Beute.vergleiche(g, alt) : null) + knoepfe(true, platz);
    }
    function knoepfe(istGegenstand, platz){
      var k = [];
      if(gewaehlt.ausgeruestet) k.push('<button data-aktion="ablegen">' + esc(SC.T.ablegen) + "</button>");
      else {
        if(istGegenstand && platz !== "waffe") k.push('<button class="haupt" data-aktion="anlegen">' + esc(SC.T.anlegen) + "</button>");
        if(gewaehlt.i >= 9) k.push('<button data-aktion="leiste">' + esc(SC.T.inSchnellleiste) + "</button>");
        k.push('<button class="gefahr" data-aktion="wegwerfen">' + esc(SC.T.wegwerfen) + "</button>");
      }
      return '<div class="reihe">' + k.join("") + "</div>";
    }
    function zeichne(){
      var w = kampf.werte;
      ui._zeige(
        "<h2>" + esc(SC.T.rucksackTitel) + "</h2>" +
        '<div class="rs"><div class="rs-links"><div class="rs-ausruestung">' + PLAETZE.map(ausrHtml).join("") + "</div>" +
        '<div class="rs-werte">' + esc(SC.T.stufe) + " " + w.stufe + " · " + esc(SC.T.werteName.lp) + " " + w.lpMax + " · " + esc(SC.T.werteName.schutz) + " " + w.schutz + (w.schildMax ? " · " + esc(SC.T.werteName.schild) + " " + w.schildMax : "") + "</div>" +
        '<div class="rs-detail">' + detail() + "</div></div>" +
        '<div class="rs-raster">' + rs.plaetze.map(platzHtml).join("") + "</div></div>" +
        '<div class="reihe"><button class="haupt" data-aktion="fertig">' + esc(SC.T.fertig) + "</button></div>",
        aktionen);
    }
    var aktionen = {
      platz: function(el, i){
        i = +el.getAttribute("data-i"); var s = rs.plaetze[i];
        // Zweiter Tipp auf einen anderen Platz verschiebt dorthin
        if(gewaehlt && !gewaehlt.ausgeruestet && gewaehlt.i !== i && !s){ rs.tausche(gewaehlt.i, i); gewaehlt = null; o.beiAenderung && o.beiAenderung(); zeichne(); return; }
        gewaehlt = s ? { i: i, sache: s } : null; zeichne();
      },
      aplatz: function(el){
        var p = el.getAttribute("data-platz"); if(p === "waffe"){ var wi = kampf.spieler.auswahl; if(rs.plaetze[wi]) gewaehlt = { i: wi, sache: rs.plaetze[wi] }; zeichne(); return; }
        gewaehlt = a[p] ? { platz: p, sache: { gegenstand: a[p] }, ausgeruestet: true } : null; zeichne();
      },
      anlegen: function(){
        var g = gewaehlt.sache.gegenstand, p = SC.GEGENSTAENDE[g.art].platz, alt = a[p];
        a[p] = g; rs.plaetze[gewaehlt.i] = alt ? { gegenstand: alt } : null;
        kampf.ruestungAnwenden(); gewaehlt = null; o.beiAenderung && o.beiAenderung(); zeichne();
      },
      ablegen: function(){
        if(rs.lege({ gegenstand: a[gewaehlt.platz] }) === 0){ a[gewaehlt.platz] = null; kampf.ruestungAnwenden(); gewaehlt = null; o.beiAenderung && o.beiAenderung(); }
        else ui.hinweis(SC.T.rucksackVoll);
        zeichne();
      },
      leiste: function(){
        var ziel = -1; for(var j = 0; j < 9; j++) if(!rs.plaetze[j]){ ziel = j; break; }
        if(ziel < 0) ziel = kampf.spieler.auswahl;
        rs.tausche(gewaehlt.i, ziel); gewaehlt = null; o.beiAenderung && o.beiAenderung(); zeichne();
      },
      wegwerfen: function(){ var s = rs.nimm(gewaehlt.i); gewaehlt = null; o.beiWegwerfen && o.beiWegwerfen(s); o.beiAenderung && o.beiAenderung(); zeichne(); },
      fertig: function(){ ui.schliesse(); o.beiFertig ? o.beiFertig() : ui.o.beiWeiter && ui.o.beiWeiter(); }
    };
    zeichne();
  };
})();
