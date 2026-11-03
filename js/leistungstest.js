// Leistungsmessung auf dem Gerät: nur mit ?leistung in der Adresse. Sobald eine Welt läuft, wird ein UI-Teil nach dem anderen
// abgeschaltet und die Spielbilder pro Sekunde gezählt; die Tabelle steht oben auf dem Bildschirm (für einen Screenshot).
(function(){
  if(window.SC_TEST || !/[?&]leistung/.test(location.search)) return;
  var FAELLE = [
    ["Basis", ""],
    ["ohne ganze UI", "#ui>*:not(.leistung){display:none!important}"],
    ["ohne HUD", ".hud{display:none!important}"],
    ["ohne Statusfeld", ".status{display:none!important}"],
    ["Statusfeld ohne Panel-Look", ".status{background:none!important;border:0!important;border-radius:0!important}"],
    ["ohne Kampf-Balken", ".kampf{display:none!important}"],
    ["Fadenkreuz ohne Blend", ".fadenkreuz{mix-blend-mode:normal!important}"],
    ["ohne Fadenkreuz", ".fadenkreuz{display:none!important}"],
    ["ohne Schnellleiste", ".leiste{display:none!important}"],
    ["ohne Touch-Knöpfe", ".touch{display:none!important}"],
    ["ohne Controller-Hilfe", ".controller-hilfe{display:none!important}"],
    ["Basis (nochmal)", ""]
  ];
  var MESSEN = 4000, RUHE = 1500, ANLAUF = 15000;
  function warte(){
    var s = SC.spiel;
    if(!s || !s._laeuft){ setTimeout(warte, 500); return; }
    setTimeout(function(){ los(s); }, ANLAUF);
  }
  function los(s){
    // Während der Messung nur ein kleines Kästchen in der Ecke (ein großes Feld über der Leinwand verfälscht die Messung); die Tabelle kommt erst am Ende
    var anz = document.createElement("div"); anz.className = "leistung";
    anz.style.cssText = "position:absolute;right:4px;bottom:4px;z-index:9;background:#000;color:#fff;font:11px monospace;padding:2px 4px;pointer-events:none";
    document.getElementById("ui").appendChild(anz);
    var st = document.createElement("style"); document.head.appendChild(st);
    var re = s.render.renderer, n = 0, ms = 0, alt = s._bild, altR = re.render;
    s._bild = function(t){ n++; return alt.call(this, t); };
    re.render = function(){ var a = performance.now(); altR.apply(this, arguments); ms += performance.now() - a; };
    var kopf = "Spacecraft " + (window.V || "") + "  dpr " + devicePixelRatio + "  Leinwand " + s.leinwand.width + "x" + s.leinwand.height + "  Bildrate " + s.einstellungen.bildrate + "\n" + navigator.userAgent.replace(/^Mozilla\/5\.0 /, "").slice(0, 90) + "\n" + "Fall                        Bilder/s  Zeichnen/Bild\n", zeilen = [];
    (function fall(i){
      if(i >= FAELLE.length){
        st.textContent = ""; s._bild = alt; re.render = altR;
        anz.style.cssText = "position:absolute;left:50%;top:8px;transform:translateX(-50%);z-index:9;background:#000;color:#fff;font:14px/1.35 monospace;padding:8px 12px;white-space:pre;pointer-events:none";
        anz.textContent = kopf + zeilen.join("\n") + "\nfertig"; console.log(anz.textContent); return;
      }
      st.textContent = FAELLE[i][1]; anz.textContent = (i + 1) + "/" + FAELLE.length;
      setTimeout(function(){
        n = 0; ms = 0; var t0 = performance.now();
        setTimeout(function(){
          var fps = Math.round(n * 1000 / (performance.now() - t0));
          zeilen.push((FAELLE[i][0] + "                              ").slice(0, 28) + ("   " + fps).slice(-4) + "      " + (n ? (ms / n).toFixed(2) : "-") + " ms");
          fall(i + 1);
        }, MESSEN);
      }, RUHE);
    })(0);
  }
  window.addEventListener("load", warte);
})();
