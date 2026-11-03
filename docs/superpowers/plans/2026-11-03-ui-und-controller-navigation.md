# Spiel-UI und Controller-Navigation – Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Ruhige, lesbare Panels und eine Controller-Navigation, die in Inventaren in Reihen und Spalten bewegt (nicht in Leserichtung). Gespielt wird überwiegend am iPad im Querformat mit Controller.

**Architecture:** Zwei thematische Hälften: Look (Tasks 1–3: CSS-Grundgerüst, Statusfeld oben links, Seitenpanels für Rucksack/Werkbank/Truhe) und Navigation (Tasks 4–8: Zonen und Richtungsbewegung in `js/ui.js`, Richtungswerte und Zonentasten in `js/gamepad.js`, Mapping in `js/spiel.js`, Detail folgt dem Fokus in `js/ui-rucksack.js` und `js/ui-werkbank.js`). Committet wird pro Task, wie es die Task-Schritte vorgeben.

**Tech Stack:** Reines JavaScript ohne Build-Schritt, Namensraum `SC`; Tests auf der Testseite (`bash scripts/tests-wsl.sh`, oder `tests/index.html` im Browser).

**Spec:** `docs/superpowers/specs/2026-11-03-ui-und-controller-navigation-design.md`

## Global Constraints

- Keine ES-Module, kein Bundler, kein npm; `file://` muss laufen. Laderihenfolge in `index.html` und `tests/index.html` identisch halten.
- Ältere Safari-Versionen (iOS) müssen laufen: kein `backdrop-filter` im Spiel, `scrollIntoView` nur mit `try`-Fallschirm; `closest`, `gap` und `aspect-ratio` sind bereits im Gebrauch.
- Tests im Browser: erwartet keine ❌-Zeilen und `Fertig: N ok, 0 fehlgeschlagen`. Nichts behaupten, ohne die Testseite wirklich geladen zu haben.
- CSS ist in den Tests nicht prüfbar (`tests/index.html` lädt `css/style.css` nicht): Geometrie-Tests bauen ihre Zeilen mit INLINE-Stilen; die Optik wird im Browser gesehen.
- `data-aktion`-Namen bleiben unverändert (`rezept`, `platz`, `aplatz`, `herstellen`, `fertig`, `weiter`), weil die Tests darauf klicken.
- Spielstand-Kompatibilität: neue UI-Felder brauchen keine Speicherstände; bestehende dürfen nicht brechen.
- Version `var V="X.Y.Z"` in `index.html` ist die einzige Stelle; neue Funktionen → MINOR → **0.22.0**.
- Kommentare und Commit-Nachrichten auf Deutsch. Nicht pushen, ohne der Nutzer verlangt es; GitHub-Issues und Board erst nach dem Push ändern.

## Review Focus

- Steuerkreuz in einem 9×9-Raster: `runter` muss eine ganze Reihe springen, nicht das nächste Feld in Leserichtung – Geometrie-Test in Task 4.
- Ohne Zonen-Marker (Weltliste, Einstellungen) darf die Bewegung nicht schlechter werden: dort bleibt das ganze Fenster eine Zone – Test in Task 4.
- `navigiere` hat sich von einer Zahl auf eine Richtung geändert: der bestehende Test „Menü mit dem Steuerkreuz bedienen“ muss angepasst werden (Task 4), sonst ist die Testseite rot.
- Nach dem Neuladen eines Panels darf der Fokus nicht verloren gehen – Test in Task 7, sonst springt der Cursor bei jedem Detail-Update zurück.
- Regler: `links`/`rechts` verstellen direkt, ohne den extra Modus; `hoch`/`runter` verlassen das Feld – Test in Task 4.
- B und Start dürfen nicht verwechselt werden: B verlässt erst die Zone, Start schließt immer – Tests in Task 4 (UI) und Task 5 (Tasten).
- Die Tests rufen `ui2(w)` ohne `document.body.appendChild(w)`; neue Tests müssen das Fenster anhängen, damit `getBoundingClientRect` und `focus()` funktionieren.
- Laderihenfolge unverändert: es kommen keine neuen Dateien dazu, nur Tests.

## Interfaces (im Plan einheitlich)

```js
// js/ui.js
SC.UI.prototype._zeige(html, aktionen, opt)      // opt: { seite: bool, startZone: "name" }
SC.UI.prototype._zonen()                         // Container mit data-zone; ohne Marker: [fenster]
SC.UI.prototype._zone(el)                        // data-zone-Container von el (oder das Fenster)
SC.UI.prototype._fokusListe(zone)                // fokussierbare Elemente, zone optional
SC.UI.prototype.navigiere(richtung)              // "hoch" | "runter" | "links" | "rechts"
SC.UI.prototype.zone(schritt)                    // -1/1; 0 = erste Zone
SC.UI.prototype.kurzaktion()                     // ruft this._kurzaktion(document.activeElement)
SC.UI.prototype.beiFokus(el)                     // ruft this._beiFokus(el)
SC.UI.prototype.menueAktion(r)                   // Zuordnung eines Gamepad-Werts (Task 6)
SC.UI.prototype.statusSache(name, anzahl)        // Statusfeld oben links, null blendet aus

// js/gamepad.js
SC.Gamepad.neuerZustand()  →  { vorher: [], menueRichtung: null, menueZeit: 0 }
SC.Gamepad.zuMenue(p, z, jetzt)  →  "ok" | "zurueck" | "schliessen" | "hoch" | "runter" |
                                     "links" | "rechts" | "zoneVor" | "zoneZurueck" | "kurzaktion" | null
```

Zonen-Contract: Bewegung bleibt innerhalb der Zone des Fokus; `hoch`/`runter` springen eine Zeile (Zeilen aus `getBoundingClientRect().top`), `links`/`rechts` ein Feld. Am Rand der Zone wird.wrappt (Leserichtung), Zone wechseln nur über LB/RB. B verlässt die Zone, Start schließt das Fenster. Der Fokus wird mit `scrollIntoView({block:"nearest",inline:"nearest"})` ins Sichtbare gerollt.

Test-Helfer (bereits in `tests/helfer.js` und `tests/test-gamepad.js` vorhanden): `test(name, fn)`, `gleich(ist, soll, text)`, `wahr(bed, text)`, `ui2(w)`, `k2()`, `pad(achsen, gedrueckt)`. Knopf-Index für `pad()`: A 0, B 1, Y 3, LB 4, RB 5, START 9, HOCH 12, RUNTER 13, LINKS 14, RECHTS 15.

---

### Task 1: Ruhiges Panel-Grundgerüst (CSS)

**Files:**
- Modify: `css/style.css` (Zeilen 16–19 Fenster, 48–60 HUD, 74–77 Fokus, 91–104 Rucksack)
- Test: keine (CSS ist auf der Testseite nicht prüfbar) – Prüfung im Browser

**Interfaces:**
- Produces: Klassen `.status` und `.fenster.seite`; der Fokus-Rahmen (gelb, 2 px, Abstand 3 px) ist eine Outline-Regel auf `:focus` – es gibt keine `.fokus-cursor`-Klasse. Panels im Spiel ohne `backdrop-filter`, Unscharfe nur in stillstehenden Menüs (`@supports (backdrop-filter: blur(1px))`, Selektor `.ebene .fenster:not(.seite)`).

- [ ] **Step 1: CSS schreiben**

`css/style.css`, neuer Block über dem HUD:
```css
/* Ruhige Panels: dichte Flächen, kein Leuchten, fester Abstandsrhythmus */
.panel{background:#1b1845;border:1px solid #3a3a5a;border-radius:10px;padding:12px 14px;box-sizing:border-box}
.fenster{max-width:860px;border:1px solid #3a3a5a;box-shadow:none;border-radius:12px}
.fenster.seite{position:absolute;right:0;top:0;bottom:0;width:min(420px,42%);max-width:none;border-radius:0;border-left:1px solid #3a3a5a;overflow-y:auto}
.status{position:absolute;left:calc(12px + env(safe-area-inset-left));top:calc(12px + env(safe-area-inset-top));width:min(300px,40%)}
.status .balken{margin:4px 0}
button:focus,label.knopf:focus,input:focus{outline:2px solid #ffd95c;outline-offset:3px}
```
Das Padding kommt nur von `.panel` (`12px 14px`): würden beide Werte geschrieben, stünden zwei Regeln gleicher Spezifität, und die spätere gewinnt – jedes Fenster bekommt über `_zeige` die Klasse `panel`, also die dichte Fläche.
Die Unscharfe nur in stillstehenden Menüs:
```css
@supports (backdrop-filter: blur(1px)){ .ebene .fenster:not(.seite){backdrop-filter:blur(4px)} }
```
Der Fokus-Cursor bleibt gelb (2 px, Abstand 3 px) und steht auf `:focus` – nicht auf `:focus-visible`, weil der Controller-Fokus per `focus()` gesetzt wird und älteres Safari eine unbekannte Pseudo-Klasse im Selektor verwirft. Die bisherige `outline:3px`-Regel (Zeile 75) wird ersetzt; `input[type=range].regeln` (Zeile 76) fällt weg (Task 4). Die Auswahl `.rs-platz.gewaehlt` (Zeile 103) ist keine Outline mehr, sondern eine Flächenfüllung (`background:#2b2766`), damit der gelbe Rahmen nur der Cursor ist. Controller-Hilfe nach oben rechts: `.controller-hilfe` (Zeile 163) von `top:50%` auf `top:calc(12px + env(safe-area-inset-top))` ohne `transform`. Modusanzeige und FPS ziehen in `.status` (Task 2).

- [ ] **Step 2: Im Browser prüfen**

Run: Testseite `http://127.0.0.1:8090/tests/index.html` (Server: `python3 -m http.server 8090` im Repo-Root), erwartet `Fertig: N ok, 0 fehlgeschlagen` und keine ❌-Zeilen.
Run: Spiel `http://127.0.0.1:8090/`, Rucksack öffnen, Screenshots: Welt bleibt links neben dem Seitenpanel sichtbar, Fokus-Rahmen deutlich, keine Unscharfe im HUD.

- [ ] **Step 3: Commit**

```bash
git add css/style.css && git commit -m "Look: ruhige Panels, Fokus-Cursor, Seitenpanel-Grundgerüst"
```

---

### Task 2: Statusfeld oben links

**Files:**
- Modify: `js/ui.js` (`hud`, Zeilen 359–386), `js/survival.js` (`_hudSurvival`, Zeile 271)
- Test: `tests/test-ui.js`

**Interfaces:**
- Produces: `SC.UI.prototype.statusSache(name, anzahl)` – Textzeile im Statusfeld; `null` setzt sie leer.
- Produziert im HUD: `.status` enthält `.modus-anzeige`, `.fps`, `.status-sache` und `.kampf` (die Balken bleiben in `kampfHud` über `hudEl.querySelector(".kampf")` erreichbar).

- [ ] **Step 1: Test schreiben (failend)**

`tests/test-ui.js`, neu am Ende:
```js
test("Statusfeld oben links zeigt Modus und die gewählte Sache", function(){
  var w=document.createElement("div"); document.body.appendChild(w); var ui=ui2(w), k=k2(), s=k.spieler;
  s.schnellleiste=[1,2,3,4,5,6,7,8,9];
  ui.hud(s,{status:{name:"Blauer Helm",anzahl:1}});
  var st=w.querySelector(".status"); wahr(st,"Statusfeld fehlt");
  wahr(st.textContent.indexOf("Blauer Helm")>=0,"Name der gewählten Sache");
  gleich(st.querySelector(".status-sache").textContent,"Blauer Helm");
  wahr(st.contains(w.querySelector(".modus-anzeige")),"Modusanzeige im Statusfeld");
    w.remove();
});
test("Statusfeld zeigt die Stufe und die Kampf-Balken", function(){
  var w=document.createElement("div"); document.body.appendChild(w); var ui=ui2(w), k=k2(), s=k.spieler;
  s.schnellleiste=[1,2,3,4,5,6,7,8,9]; ui.hud(s,{}); ui.kampfHud(k,[]);
    var st=w.querySelector(".status"); wahr(st.contains(w.querySelector(".kampf")),"Balken im Statusfeld");
  gleich(st.querySelector(".status-stufe").textContent,"Stufe 1");
  ui.statusSache(null); gleich(st.querySelector(".status-sache").textContent,"");
  w.remove();
});
```
Erwarteter Fehler: `❌ Statusfeld oben links …: erwartet ".status", war null`.

- [ ] **Step 2: Fehlschlag bestätigen**

Run: `bash scripts/tests-wsl.sh Statusfeld`
Expected: beide ❌, weil `hud()` kein `.status` baut.

- [ ] **Step 3: Implementieren**

In `hud()` das `if(!this._hudGebaut)`-Gerüst umbauen:
```js
h.innerHTML = '<div class="fadenkreuz"></div>' +
  '<div class="status panel"><div class="status-stufe"></div><div class="status-sache"></div>' +
  '<div class="kampf" hidden></div><div class="modus-anzeige"></div><div class="fps"></div></div>' +
  '<div class="leiste"></div>';
```
Stufe: das existing `.kampf-stufe`-Element in `kampfHud` wird durch `.status-stufe` im Statusfeld ersetzt (ein Element, kein zweites), `kampfHud` schreibt es:
```js
var st = this.hudEl.querySelector(".status-stufe");
if(st) st.textContent = SC.T.stufe + " " + w.stufe;
```
`statusSache(name, anzahl)`:
```js
SC.UI.prototype.statusSache = function(name, anzahl){
  var el = this.hudEl.querySelector(".status-sache"); if(!el) return;
  var text = name ? name + (anzahl > 1 ? " × " + anzahl : "") : "";
  if(el.textContent !== text) el.textContent = text;
};
```
In `hud()` nach dem Leisten-Block: `if(extra && extra.status) this.statusSache(extra.status.name, extra.status.anzahl);`

In `js/survival.js` (`_hudSurvival`) das `ui.hud(sp, {...})` um `status` erweitern:
```js
var sache = survival && !imFz ? k.rucksack.plaetze[sp.auswahl] : null;
ui.hud(sp, { fps: this.render.fps, fpsAnzeigen: this.einstellungen.fpsAnzeigen,
  leiste: survival ? k.rucksack.plaetze.slice(0, 9) : null, all: !!this.all, fadenkreuz: kreuz,
  status: sache ? { name: sache.gegenstand ? sache.gegenstand.name : SC.BLOECKE[sache.block].name, anzahl: sache.anzahl || 1 } : { name: "", anzahl: 0 } });
```

- [ ] **Step 4: Grüne Testseite**

Run: `bash scripts/tests-wsl.sh` (volle Testseite), erwartet keine ❌-Zeilen, `Fertig: … 0 fehlgeschlagen`.
Expected: die beiden neuen Tests grün; bestehende „Kampf-HUD zeigt Balken“ bleibt grün (`.kampf` ist weiterhin ein Kind von `hudEl`).

- [ ] **Step 5: Commit**

```bash
git add js/ui.js js/survival.js tests/test-ui.js && git commit -m "Statusfeld oben links: Modus, Stufe, gewählte Sache"
```

---

### Task 3: Seitenpanels für Rucksack, Werkbank und Truhe

**Files:**
- Modify: `js/ui.js` (`_zeige`, Zeile 53), `js/ui-rucksack.js` (`zeigeRucksack`, `zeigeTruhe`), `js/ui-werkbank.js` (`zeigeWerkbank`)
- Modify: `css/style.css` (Regeln für den Inhalt des Statusfelds, siehe Schritt 4)
- Test: `tests/test-ui.js`

**Interfaces:**
- Produces: `_zeige(html, aktionen, opt)` mit `opt.seite` – das Fenster bekommt die Klasse `seite` (Seitenteil, Welt bleibt sichtbar). Weltliste, Einstellungen, Anleitung, Pause und Beitrittsanfrage bleiben zentrale Fenster (kein `seite`).

- [ ] **Step 1: Test schreiben (failend)**

```js
test("Rucksack und Werkbank sind Seitenpanels", function(){
  var w=document.createElement("div"); document.body.appendChild(w); var ui=ui2(w), k=k2();
  ui.zeigeRucksack(k,{}); wahr(w.querySelector(".fenster").classList.contains("seite"),"Rucksack");
  ui.zeigeWerkbank(k,{station:"hand"}); wahr(w.querySelector(".fenster").classList.contains("seite"),"Werkbank");
  var s=new SC.Slots(uiBackend());
  return s.speichere(SC.Spielstand.neu({name:"Sternenhafen",seedText:"a",modus:"kreativ"})).then(function(){
    return leereUI(w,s).zeigeWeltliste();
  }).then(function(){
    wahr(!w.querySelector(".fenster").classList.contains("seite"),"Weltliste bleibt zentrales Fenster");
    w.remove();
  });
});
```
(`uiBackend()` und `leereUI(w,slots)` sind die Helfer aus `tests/test-ui.js`; die Weltliste braucht `slots`.)
Erwarteter Fehler: `❌ Rucksack und Werkbank sind Seitenpanels: Rucksack`.

- [ ] **Step 2: Fehlschlag bestätigen**

Run: `bash scripts/tests-wsl.sh Seitenpanels`
Expected: eine ❌-Zeile.

- [ ] **Step 3: Implementieren**

`js/ui.js`:
```js
SC.UI.prototype._zeige = function(html, aktionen, opt){
  this.ebene.innerHTML = '<div class="fenster panel' + (opt && opt.seite ? " seite" : "") + '">' + html + "</div>";
  this.ebene.hidden = false; this._aktionen = aktionen || {};
  this._startZone = (opt && opt.startZone) || null;
};
```
(`startZone` wird erst in Task 4 wirksam, wenn `zone()` und `_fokusListe(zone)` existieren; hier wird nur das Feld gesetzt.)
In `zeigeRucksack`, `zeigeWerkbank` und `zeigeTruhe` die `ui._zeige(...)`-Aufrufe um ein drittes Argument ergänzen: `{ seite: true, startZone: "raster" }` (Rucksack), `{ seite: true, startZone: "liste" }` (Werkbank), `{ seite: true, startZone: "raster" }` (Truhe). Die Zonen-Marker selbst kommen in Task 4.

- [ ] **Step 4: Statusfeld im CSS (Folgearbeit aus Task 2)**

Die neuen Elemente im Statusfeld haben noch keine Regeln, und zwei alte Regeln richten sich jetzt am Panel aus statt an der HUD-Ecke. In `css/style.css`:
```css
.status-stufe{font-size:20px;letter-spacing:2px;color:#3ef0ff}
.status-sache{font-size:15px;color:#eef2fa;min-height:20px}
.status .modus-anzeige,.status .fps{position:static}
.status .kampf{position:static;width:100%;transform:none}
```
`.modus-anzeige` (Zeile 60) und `.fps` (Zeile 62) verlieren dabei ihre absolute Position und folgen dem Zeilenfluss des Panels; dasselbe gilt für `.kampf` (Zeile 84), dessen `width:min(500px,90%)` nicht zur Panelbreite `min(300px,40%)` passt. `transform:none` ist nötig, weil die Grundregel `transform:translateX(-50%)` steht – eine Transformation wirkt auch bei `position:static` und würde die Balken um die halbe Breite nach links schieben. Die tote Regel `.kampf-stufe` (Zeile 85) fällt weg – das Element existiert seit Task 2 nicht mehr. Diese Regeln sind Optik und auf der Testseite nicht prüfbar; die visuelle Prüfung macht der Controller im Browser.

- [ ] **Step 5: Grüne Testseite**

Run: `bash scripts/tests-wsl.sh Seitenpanels` → keine ❌. Danach die volle Testseite.

- [ ] **Step 6: Commit**

```bash
git add js/ui.js js/ui-rucksack.js js/ui-werkbank.js css/style.css tests/test-ui.js && git commit -m "Seitenpanels im Spiel: Rucksack, Werkbank und Truhe lassen die Welt sichtbar"
```

---

### Task 4: Zonen und Richtungsbewegung in `js/ui.js`

**Files:**
- Modify: `js/ui.js` (`_fokusListe` 60–64, `navigiere` 65–72, `bestaetige` 73–81, `zurueck` 82–87, `schliesse` 89)
- Modify: `js/ui-rucksack.js`, `js/ui-werkbank.js` (die `data-zone`-Marker in den HTML-Vorlagen – Attribute, nicht CSS)
- Modify: `css/style.css` (Zeilen 91–104: Zonen als Panels mit Abstand)
- Modify: `tests/test-gamepad.js` (Zeile 8, bestehender Test „Menü mit dem Steuerkreuz bedienen“)
- Test: `tests/test-ui.js`

**Interfaces:**
- Produziert: `_zonen()`, `_zone(el)`, `_fokusListe(zone)`, `navigiere(richtung)`, `zone(schritt)`, `beiFokus(el)`, `kurzaktion()`.
- Contract: Bewegung bleibt in der Zone des Fokus. `hoch`/`runter` = eine Zeile (Zeilen aus `getBoundingClientRect().top`, Toleranz halbe Elementhöhe), `links`/`rechts` = ein Feld. Eine Zone mit nur einer Zeile geht in Leserichtung. Am Rand wird innerhalb der Zone wrapped. Der Fokus rollt ins Sichtbare.
- `bestaetige()` auf einem Regler tut nichts mehr (`_reglerModus` und die Klasse `regeln` fallen weg).
- `zurueck()`: erst die Zone verlassen (zurück zur Öffnungszone), dann das Fenster schließen.

- [ ] **Step 1: Tests schreiben (failend)**

```js
function zf(html, aktionen){ var w=document.createElement("div"); document.body.appendChild(w); var ui=ui2(w); ui._zeige(html,aktionen); return { w: w, ui: ui }; }
function raster(z){ var h='<div data-zone="'+z+'" style="display:grid;grid-template-columns:repeat(3,40px);grid-auto-rows:40px;gap:0">'; for(var i=0;i<9;i++) h+='<button data-aktion="x" data-i="'+i+'">'+i+'</button>'; return h+'</div>'; }
test("Steuerkreuz springt im Raster eine ganze Reihe", function(){
  var a=zf(raster("raster"),{x:function(){}}); a.ui.zone(0);
  gleich(document.activeElement.getAttribute("data-i"),"0");
  a.ui.navigiere("runter"); gleich(document.activeElement.getAttribute("data-i"),"3","eine Reihe runter");
  a.ui.navigiere("runter"); gleich(document.activeElement.getAttribute("data-i"),"6");
  a.ui.navigiere("rechts"); gleich(document.activeElement.getAttribute("data-i"),"7","ein Feld rechts");
  a.ui.navigiere("hoch"); gleich(document.activeElement.getAttribute("data-i"),"4","eine Reihe hoch");
  a.w.remove();
});
test("Am Rand der Zone wird innerhalb der Zone wrapped", function(){
  var a=zf(raster("liste"),{x:function(){}}); a.ui.zone(0);
  a.ui.navigiere("hoch"); gleich(document.activeElement.getAttribute("data-i"),"6","wrapped zur letzten Reihe");
  a.ui.navigiere("links"); gleich(document.activeElement.getAttribute("data-i"),"8","wrapped in der Reihe");
  a.w.remove();
});
test("Liste ohne Raster: eine Zeile je Element, Bewegung in Leserichtung", function(){
  var b=zf('<div data-zone="liste"><button data-aktion="x" style="display:block">1</button><button data-aktion="x" style="display:block">2</button></div>',{x:function(){}});
  b.ui.zone(0); b.ui.navigiere("runter"); gleich(document.activeElement.textContent,"2");
  b.ui.navigiere("links"); gleich(document.activeElement.textContent,"1","Zeile mit einem Feld: Leserichtung");
  b.w.remove();
});
test("LB/RB wechseln die Zone", function(){
  var a=zf('<div data-zone="ausruestung"><button data-aktion="x">A</button></div><div data-zone="detail"><button data-aktion="x">D</button></div>',{x:function(){}});
  a.ui.zone(0); gleich(document.activeElement.textContent,"A");
  a.ui.zone(1); gleich(document.activeElement.textContent,"D");
  a.ui.zone(-1); gleich(document.activeElement.textContent,"A");
  a.w.remove();
});
test("Bewegung bleibt in der Zone des Fokus", function(){
  var a=zf('<div data-zone="a"><button data-aktion="x" data-i="a0" style="display:block">a0</button><button data-aktion="x" data-i="a1" style="display:block">a1</button></div><div data-zone="b"><button data-aktion="x" data-i="b0" style="display:block">b0</button></div>',{x:function(){}});
  a.ui.zone(0);
  a.ui.navigiere("runter"); gleich(document.activeElement.getAttribute("data-i"),"a1");
  a.ui.navigiere("runter"); gleich(document.activeElement.getAttribute("data-i"),"a0","wrapped in der Zone, nicht in Zone b");
  a.w.remove();
});
test("Der Fokus rollt ins Sichtbare", function(){
  var h='<div data-zone="raster" style="display:block;height:60px;overflow:auto">';
  for(var i=0;i<10;i++) h+='<button data-aktion="x" data-i="'+i+'" style="display:block;height:20px">'+i+'</button>';
  var a=zf(h+'</div>',{x:function(){}}); a.ui.zone(0);
  for(var i=0;i<5;i++) a.ui.navigiere("runter");
  wahr(a.w.querySelector("[data-zone]").scrollTop>0,"gerollt");
  a.w.remove();
});
test("Regler werden direkt verstellt", function(){
  var a=zf('<div data-zone="a"><input type="range" data-aktion="x" value="5" step="1"><button data-aktion="x">ok</button></div>',{x:function(){}});
  a.ui.zone(0); gleich(document.activeElement.type,"range");
  a.ui.navigiere("rechts"); gleich(document.activeElement.value,"6","verstellt");
  a.ui.navigiere("links"); gleich(document.activeElement.value,"5");
  a.ui.navigiere("runter"); gleich(document.activeElement.tagName,"BUTTON","verlässt den Regler");
  a.w.remove();
});
test("B verlässt zuerst die Zone", function(){
  var geschlossen=false, w=document.createElement("div"); document.body.appendChild(w);
  var ui=ui2(w);
  ui._zeige('<div data-zone="raster"><button data-aktion="x">R</button></div><div data-zone="detail"><button data-aktion="x">D</button></div><div data-zone="unten"><button data-aktion="fertig">F</button></div>',
    {x:function(){},fertig:function(){geschlossen=true;}}, { startZone: "raster" });
  ui.zone(1); gleich(document.activeElement.textContent,"D");
  ui.zurueck(); gleich(document.activeElement.textContent,"R","erst die Zone verlassen");
  ui.zurueck(); wahr(geschlossen,"dann geschlossen");
  w.remove();
});
```
Run: `bash scripts/tests-wsl.sh Zone` – erwartet ❌ bei „Steuerkreuz springt …“, „LB/RB …“, „Bewegung bleibt in der Zone …“, „Regler …“ und „B verlässt …“, weil `navigiere` noch eine Zahl erwartet und `zone()`, `beiFokus`, `kurzaktion` noch fehlen.

- [ ] **Step 2: Implementieren**

`js/ui.js`, Referenzform (Zeilen 60–87 ersetzen):
```js
function zeilen(liste){
  var z = [];
  liste.forEach(function(el){
    var r = el.getBoundingClientRect(), hb = Math.max(8, r.height / 2), gef = null;
    for(var i = 0; i < z.length; i++) if(Math.abs(z[i].top - r.top) < hb){ gef = z[i]; break; }
    if(gef) gef.el.push(el); else z.push({ top: r.top, el: [el] });
  });
  return z.sort(function(a, b){ return a.top - b.top; });
}
SC.UI.prototype._zonen = function(){
  var r = this._fenster(); if(!r) return [];
  var z = Array.prototype.filter.call(r.querySelectorAll("[data-zone]"), function(el){ return !el.hidden && el.querySelector("button,input,label.knopf"); });
  return z.length ? z : [r];
};
SC.UI.prototype._zone = function(el){ return (el && el.closest && el.closest("[data-zone]")) || this._fenster(); };
SC.UI.prototype._fokusListe = function(zone){
  var r = zone || this._fenster(); if(!r) return [];
  return Array.prototype.filter.call(r.querySelectorAll("button, input:not([type=file]), label.knopf"), function(el){ return !el.disabled && (el.offsetParent !== null || el.getClientRects().length > 0); });
};
SC.UI.prototype.beiFokus = function(el){
  if(!el) return;
  try{ el.scrollIntoView({ block: "nearest", inline: "nearest" }); }catch(err){ el.scrollIntoView(); }
  if(this._beiFokus) this._beiFokus(el);
};
SC.UI.prototype.kurzaktion = function(){ if(this._kurzaktion) this._kurzaktion(document.activeElement); };
SC.UI.prototype.zone = function(schritt){
  var z = this._zonen(); if(!z.length) return;
  var i = z.indexOf(this._zone(document.activeElement));
  i = i < 0 ? 0 : SC.mod(i + schritt, z.length);
  var l = this._fokusListe(z[i]); if(l.length){ l[0].focus(); this.beiFokus(l[0]); }
};
SC.UI.prototype.navigiere = function(richtung){
  var l = this._fokusListe(this._zone(document.activeElement)); if(!l.length) return;
  var a = document.activeElement, i = l.indexOf(a), vor = (richtung === "runter" || richtung === "rechts") ? 1 : -1;
  if(a && a.type === "range" && i >= 0 && (richtung === "links" || richtung === "rechts")){
    a.value = +a.value + (richtung === "rechts" ? 1 : -1) * (+a.step || 1);
    a.dispatchEvent(new Event("input", { bubbles: true })); return;
  }
  var n;
  if(i < 0) n = vor > 0 ? 0 : l.length - 1;
  else{
    var z = zeilen(l), zi = 0;
    for(var j = 0; j < z.length; j++) if(z[j].el.indexOf(a) >= 0) zi = j;
    if(z.length === 1 || z[zi].el.length === 1) n = SC.mod(i + vor, l.length);
    else if(richtung === "links" || richtung === "rechts"){
      var re = z[zi];
      n = l.indexOf(re.el[(re.el.indexOf(a) + vor + re.el.length) % re.el.length]);
    }
    else{
      var re = z[(zi + vor + z.length) % z.length], c = a.getBoundingClientRect().left + a.width / 2, best = re.el[0], bd = Infinity;
      re.el.forEach(function(el){ var d = Math.abs(el.getBoundingClientRect().left + el.width / 2 - c); if(d < bd){ bd = d; best = el; } });
      n = l.indexOf(best);
    }
  }
  l[n].focus(); this.beiFokus(l[n]);
};
```
`bestaetige()` ohne Regler-Modus (Zeile 76 gelöscht, die CSS-Regel `input[type=range].regeln` fällt weg), `schliesse()` räumt auf:
```js
SC.UI.prototype.schliesse = function(){ this.ebene.hidden = true; this.ebene.innerHTML = ""; this._aktionen = {}; this._beiFokus = null; this._kurzaktion = null; this._startZone = null; };
```
`zurueck()`: erst die Startzone (`_startZone`) – wenn die Zone des Fokus eine andere ist, dorthin zurück; sonst der vorhandene Knopf (`weiter`, `fertig`, `zurueck`, `data-ew="zu"`).
`_zeige` fokussiert beim Öffnen die Startzone: nach dem `innerHTML`, `if(this._startZone){ var z = this.ebene.querySelector('[data-zone="' + this._startZone + '"]'); if(z) this.beiFokus(this._fokusListe(z)[0]); }`.
`css/style.css`: Zonen als Panels mit Abstand (12 px) für `.rs-ausruestung`, `.rs-detail`, `.rs-raster`, `.wb-liste`, `.wb-detail`, `.reihe`; die `data-zone`-Marker stehen in den HTML-Vorlagen von `js/ui-rucksack.js` und `js/ui-werkbank.js` (nicht in CSS); der gelbe Cursor (2 px, Abstand 3 px) steht auf `:focus` (Task 1), nicht auf `:focus-visible`. Die Zonennamen müssen zu den `startZone`-Werten aus Task 3 passen: Rucksack `ausruestung`, `detail`, `raster`, `aktionen`; Werkbank `liste`, `detail`, `aktionen`; Truhe `raster` (Truhenfelder), `rucksack` (Rucksackfelder), `aktionen` – das erste `.rs-raster` der Truhe behält den Namen `raster`. Die Beitrittsanfrage über einer laufenden Welt bekommt keine Unscharfe: der `@supports`-Selektor wird auf `.ebene .fenster:not(.seite):not(.anfrage)` gesetzt.

- [ ] **Step 3: Grüne Testseite**

Run: `bash scripts/tests-wsl.sh` – erwartet keine ❌-Zeilen. Der bestehende Test „Menü mit dem Steuerkreuz bedienen“ ist jetzt rot (`navigiere(1)`): in `tests/test-gamepad.js` Zeile 8 durch `ui.navigiere("runter")` ersetzen.

- [ ] **Step 4: Commit**

```bash
git add js/ui.js css/style.css tests/test-ui.js tests/test-gamepad.js && git commit -m "Controller-Navigation: Zonen, Bewegung in Reihen und Spalten, Regler direkt verstellbar"
```

---

### Task 5: Richtungs- und Zonentasten in `js/gamepad.js`

**Files:**
- Modify: `js/gamepad.js` (`neuerZustand` Zeile 11, `zuMenue` Zeile 35–49, Kopfkommentar Zeile 4)
- Test: `tests/test-gamepad.js`

**Interfaces:**
- Produziert: `SC.Gamepad.zuMenue(p, z, jetzt)` → `"ok" | "zurueck" | "schliessen" | "hoch" | "runter" | "links" | "rechts" | "zoneVor" | "zoneZurueck" | "kurzaktion" | null`.
- `neuerZustand()` → `{ vorher: [], menueRichtung: null, menueZeit: 0 }` (`menueAchse` fällt weg; `js/eingabe.js` Zeile 126 setzt dann `this._gpm.menueRichtung = null`).
- Wiederholung beim Halten: etwa alle **200 ms** (`WIEDER = 200`), für Steuerkreuz und linken Stick.
- Belegung im Menü: A = Aktion, Steuerkreuz/Stick = Bewegung, LB/RB = Zone, Y = Anlegen (Kurzaktion), B = zurück, Start = schließen.

- [ ] **Step 1: Tests schreiben (failend)**

`tests/test-gamepad.js`, neu am Ende:
```js
test("Menü: Steuerkreuz liefert Richtungen", function(){ var z=SC.Gamepad.neuerZustand();
  gleich(SC.Gamepad.zuMenue(pad([0,0,0,0],[12]),z,1000),"hoch");
  gleich(SC.Gamepad.zuMenue(pad([0,0,0,0],[13]),z,1000),"runter");
  gleich(SC.Gamepad.zuMenue(pad([0,0,0,0],[14]),z,1000),"links");
  gleich(SC.Gamepad.zuMenue(pad([0,0,0,0],[15]),z,1000),"rechts");
  gleich(SC.Gamepad.zuMenue(pad([0,-0.9,0,0],[]),z,1000),"hoch","Stick");
  gleich(SC.Gamepad.zuMenue(pad([0.9,0,0,0],[]),z,1000),"rechts","Stick");
});
test("Menü: Halten wiederholt nach etwa 200 ms", function(){ var z=SC.Gamepad.neuerZustand();
  gleich(SC.Gamepad.zuMenue(pad([0,0,0,0],[13]),z,1000),"runter");
  gleich(SC.Gamepad.zuMenue(pad([0,0,0,0],[13]),z,1100),null,"noch nicht wiederholt");
  gleich(SC.Gamepad.zuMenue(pad([0,0,0,0],[13]),z,1250),"runter","nach 250 ms");
});
test("Menü: LB/RB sind die Zonentasten", function(){ var z=SC.Gamepad.neuerZustand();
  gleich(SC.Gamepad.zuMenue(pad([0,0,0,0],[4]),z,1000),"zoneZurueck");
  gleich(SC.Gamepad.zuMenue(pad([0,0,0,0],[5]),z,1000),"zoneVor");
});
test("Menü: A bestätigt, Y legt an, B geht zurück, Start schließt", function(){ var z=SC.Gamepad.neuerZustand();
  gleich(SC.Gamepad.zuMenue(pad([0,0,0,0],[0]),z,1000),"ok");
  gleich(SC.Gamepad.zuMenue(pad([0,0,0,0],[3]),z,1000),"kurzaktion");
  gleich(SC.Gamepad.zuMenue(pad([0,0,0,0],[1]),z,1000),"zurueck");
  gleich(SC.Gamepad.zuMenue(pad([0,0,0,0],[9]),z,1000),"schliessen");
});
```
Run: `bash scripts/tests-wsl.sh Menü` – erwartet ❌, weil `zuMenue` für das Steuerkreuz noch ±1 liefert und Y/Start nichts zurückgeben.

- [ ] **Step 2: Implementieren**

`js/gamepad.js`, `zuMenue` ersetzen:
```js
var WIEDER = 200;
// Menüsteuerung: "ok", "zurueck", "schliessen", "kurzaktion", "zoneVor"/"zoneZurueck"
// oder eine Richtung ("hoch", "runter", "links", "rechts"); Halten wiederholt etwa alle 200 ms
SC.Gamepad.zuMenue = function(p, z, jetzt){
  var neu = function(i){ return gedrueckt(p, i) && !z.vorher[i]; }, r = null;
  if(neu(K.A)) r = "ok";
  else if(neu(K.START)) r = "schliessen";
  else if(neu(K.B)) r = "zurueck";
  else if(neu(K.LB)) r = "zoneZurueck";
  else if(neu(K.RB)) r = "zoneVor";
  else if(neu(K.Y)) r = "kurzaktion";
  else {
    var ax = p.axes || [];
    var s = gedrueckt(p, K.HOCH) ? "hoch" : gedrueckt(p, K.RUNTER) ? "runter" :
            gedrueckt(p, K.LINKS) ? "links" : gedrueckt(p, K.RECHTS) ? "rechts" :
            achse(ax[1]) > 0 ? "runter" : achse(ax[1]) < 0 ? "hoch" : achse(ax[0]) > 0 ? "rechts" : achse(ax[0]) < 0 ? "links" : null;
    if(s && (s !== z.menueRichtung || jetzt - z.menueZeit > WIEDER)){ r = s; z.menueZeit = jetzt; }
    z.menueRichtung = s;
  }
  for(var i = 0; i < p.buttons.length; i++) z.vorher[i] = gedrueckt(p, i);
  return r;
};
```
`neuerZustand` → `{ vorher: [], menueRichtung: null, menueZeit: 0 }`; Kopfkommentar Zeile 4 ergänzen: „In Menüs: Steuerkreuz/Stick bewegt in Reihen und Spalten, LB/RB wechseln die Zone, Y legt an, B zurück, Start schließt.“

- [ ] **Step 3: Grüne Testseite**

Run: `bash scripts/tests-wsl.sh Menü` – keine ❌.

- [ ] **Step 4: Commit**

```bash
git add js/gamepad.js js/eingabe.js tests/test-gamepad.js && git commit -m "Gamepad-Menüsteuerung: Richtungen, Zonentasten, Y als Kurzaktion"
```

---

### Task 6: Mapping in `js/spiel.js` (`menueAktion`)

**Files:**
- Modify: `js/ui.js` (neue Methode `menueAktion`), `js/spiel.js` (Menüschleife Zeile 45–52)
- Test: `tests/test-ui.js`

**Interfaces:**
- Produziert: `SC.UI.prototype.menueAktion(r)` – ruft je nach Gamepad-Wert `bestaetige`, `zurueck`, `schliesse`, `zone`, `kurzaktion` oder `navigiere`.
- Die Menüschleife in `js/spiel.js` wird auf `if(r) ui.menueAktion(r);` verkürzt.

- [ ] **Step 1: Test schreiben (failend)**

```js
test("menueAktion ruft die passende UI-Aktion", function(){
  var gerufen=[], w=document.createElement("div"); document.body.appendChild(w); var ui=ui2(w);
  ui.bestaetige=function(){gerufen.push("ok");}; ui.zurueck=function(){gerufen.push("zurueck");};
  ui.schliesse=function(){gerufen.push("schliesse");};
  ui.zone=function(s){gerufen.push("zone"+s);}; ui.kurzaktion=function(){gerufen.push("kurz");};
  ui.navigiere=function(r){gerufen.push(r);};
  ["ok","zurueck","schliessen","hoch","runter","links","rechts","zoneVor","zoneZurueck","kurzaktion"].forEach(function(r){ ui.menueAktion(r); });
  gleich(gerufen.join(","),"ok,zurueck,schliesse,hoch,runter,links,rechts,zone1,zone-1,kurz");
  w.remove();
});
```
Run: `bash scripts/tests-wsl.sh menueAktion` – erwartet ❌ (`ui.menueAktion ist keine Funktion`).

- [ ] **Step 2: Implementieren**

`js/ui.js`:
```js
SC.UI.prototype.menueAktion = function(r){
  if(r === "ok") this.bestaetige();
  else if(r === "zurueck") this.zurueck();
  else if(r === "schliessen") this.schliesse();
  else if(r === "zoneVor") this.zone(1);
  else if(r === "zoneZurueck") this.zone(-1);
  else if(r === "kurzaktion") this.kurzaktion();
  else if(r) this.navigiere(r);
};
```
`js/spiel.js` (Menüschleife):
```js
var r = s.eingabe.menueGamepad();
if(r) ui.menueAktion(r);
```

- [ ] **Step 3: Grüne Testseite**

Run: `bash scripts/tests-wsl.sh` – keine ❌.

- [ ] **Step 4: Commit**

```bash
git add js/ui.js js/spiel.js tests/test-ui.js && git commit -m "Gamepad-Werte in der Menüschleife über menueAktion"
```

---

### Task 7: Detail folgt dem Fokus, Y legt an, der Fokus bleibt

**Files:**
- Modify: `js/ui.js` (`_fokusMerkmal`, `_holeFokus`, `_zeige`), `js/ui-rucksack.js` (`zeigeRucksack`), `js/ui-werkbank.js` (`zeigeWerkbank`)
- Test: `tests/test-ui-rucksack.js`, `tests/test-crafting.js`

**Interfaces:**
- Produziert: Panels melden ihre Handler: `ui._beiFokus(el)` (Detail zeigen) und `ui._kurzaktion(el)` (Aktion ohne Knopf, Y).
- `SC.UI.prototype._fokusMerkmal()` → `{ aktion, i }` des fokussierten Fensterelements; `SC.UI.prototype._holeFokus(merk)` fokussiert das gleiche Element nach einem Neuladen.
- Zonen-Marker im Rucksack: `data-zone="ausruestung"`, `"detail"`, `"raster"`, `"aktionen"`; in der Werkbank `data-zone="liste"`, `"detail"`, `"aktionen"` (die Namen stehen seit Task 4 in den Vorlagen – die untere Reihe heißt `aktionen`, nicht `unten`; die Truhe hat `raster`, `rucksack`, `aktionen`).

- [ ] **Step 1: Tests schreiben (failend)**

`tests/test-ui-rucksack.js`, neu am Ende:
```js
test("Detail folgt dem Fokus ohne Antippen", function(){
  var w=document.createElement("div"); document.body.appendChild(w); var ui=ui2(w), k=k2();
  var g={id:"b",art:"helm",seltenheit:2,werte:{schutz:9},name:"Blauer Helm"};
  k.rucksack.plaetze[10]={gegenstand:g};
  ui.zeigeRucksack(k,{});
  var f=w.querySelector('.rs-platz[data-i="10"]'); f.focus(); ui.beiFokus(f);
  wahr(w.querySelector(".rs-detail h3").textContent.indexOf("Blauer Helm")>=0,"Name ohne Antippen");
  gleich(document.activeElement.getAttribute("data-i"),"10","Fokus bleibt");
  w.remove();
});
test("Y legt den fokussierten Gegenstand an", function(){
  var w=document.createElement("div"); document.body.appendChild(w); var ui=ui2(w), k=k2();
  k.rucksack.plaetze[10]={gegenstand:{id:"b",art:"helm",seltenheit:2,werte:{schutz:9},name:"Blauer Helm"}};
  ui.zeigeRucksack(k,{});
  var f=w.querySelector('.rs-platz[data-i="10"]'); f.focus(); ui.kurzaktion();
  gleich(k.ausruestung.helm.id,"b","angelegt");
  w.remove();
});
test("Y legt ein Rasterfeld in die Schnellleiste", function(){
  var w=document.createElement("div"); document.body.appendChild(w); var ui=ui2(w), k=k2();
  k.rucksack.plaetze[12]={block:SC.B.STEIN,anzahl:3};
  ui.zeigeRucksack(k,{});
  var f=w.querySelector('.rs-platz[data-i="12"]'); f.focus(); ui.kurzaktion();
  gleich(k.rucksack.plaetze[0].block,SC.B.STEIN,"in die Schnellleiste");
  w.remove();
});
test("Der Rucksack öffnet im Raster", function(){
  var w=document.createElement("div"); document.body.appendChild(w); var ui=ui2(w), k=k2();
  ui.zeigeRucksack(k,{});
  gleich(document.activeElement.closest("[data-zone]").getAttribute("data-zone"),"raster");
  w.remove();
});
```
`tests/test-crafting.js`, neu am Ende:
```js
test("Y stellt das fokussierte Rezept her", function(){
  var a=wb(); a.k.rucksack.lege({ block: SC.B.BRETTER, anzahl: 6 });
  a.ui.zeigeWerkbank(a.k, a.o);
  var r=a.w.querySelector('[data-aktion="rezept"][data-id="zaun"]'); r.focus(); a.ui.beiFokus(r); a.ui.kurzaktion();
  gleich(wb.aend,1,"hergestellt"); gleich(a.k.rucksack.hat(SC.B.ZAUN),4);
});
```
Run: `bash scripts/tests-wsl.sh Fokus` und `bash scripts/tests-wsl.sh "Y stellt"` – erwartet ❌ (`_beiFokus` und `_kurzaktion` sind noch nicht gesetzt).

- [ ] **Step 2: Implementieren**

`js/ui.js` – Fokus über das Neuladen behalten:
```js
function merk(el){ return el && el.getAttribute("data-aktion") ? { aktion: el.getAttribute("data-aktion"), i: el.getAttribute("data-i") || el.getAttribute("data-platz") || el.getAttribute("data-id") } : null; }
SC.UI.prototype._fokusMerkmal = function(){ var a = document.activeElement; return this.ebene.contains(a) ? merk(a) : null; };
SC.UI.prototype._holeFokus = function(m){
  if(!m) return;
  var selector = '[data-aktion="' + m.aktion + '"]';
  if(m.i) selector += '[data-i="' + m.i + '"], [data-aktion="' + m.aktion + '"][data-platz="' + m.i + '"], [data-aktion="' + m.aktion + '"][data-id="' + m.i + '"]';
  var el = this.ebene.querySelector(selector); if(el) el.focus();
};
```
In `_zeige` (Task 3): vor `innerHTML` das Merkmal merken, nach dem Setzen `_holeFokus(merk)` – aber nur, wenn kein `opt.startZone` verlangt ist (beim Öffnen gewinnt die Startzone).

`js/ui-rucksack.js` in `zeigeRucksack`:
- Container mit Zonen: `'<div class="rs-ausruestung" data-zone="ausruestung">'`, `'<div class="rs-detail" data-zone="detail">'`, `'<div class="rs-raster" data-zone="raster">'`, untere Reihe `<div class="reihe" data-zone="aktionen">`.
- Fokus-Handler registrieren:
```js
ui._beiFokus = function(el){
  var i = el.getAttribute("data-i"), p = el.getAttribute("data-platz");
  if(i !== null){ var s = rs.plaetze[+i]; gewaehlt = s ? { i: +i, sache: s } : null; }
  else if(p){ gewaehlt = a[p] ? { platz: p, sache: { gegenstand: a[p] }, ausgeruestet: true } : null; }
  else return;
  zeichne();
};
ui._kurzaktion = function(el){
  var i = el.getAttribute("data-i"); if(i === null) return;
  var s = rs.plaetze[+i]; if(!s) return;
  if(s.gegenstand){ ui._beiFokus(el); aktionen.anlegen.call(ui); return; }
  if(+i >= 9){ ui._beiFokus(el); aktionen.leiste.call(ui); }
};
```
(`zeichne`-Aufrufe rufen `ui._holeFokus(merk)`, damit der Cursor nicht springt.)
- `zeigeRucksack(kampf, o)` wird mit `ui._zeige(html, aktionen, { seite: true, startZone: "raster" })` aufgerufen.

`js/ui-werkbank.js`: `data-zone="liste"` auf `.wb-liste`, `data-zone="detail"` auf das Detail, `data-zone="aktionen"` auf die Reihe mit `fertig`; `ui._beiFokus` setzt das fokussierte Rezept als `gewaehlt`; `ui._kurzaktion` ruft `aktionen.herstellen.call(ui)`, wenn das Rezept herstellbar ist.

- [ ] **Step 3: Grüne Testseite**

Run: `bash scripts/tests-wsl.sh` – keine ❌. Besonders prüfen: bestehende Rucksack-Tests klicken weiter über `data-aktion` und bleiben grün.

- [ ] **Step 4: Commit**

```bash
git add js/ui.js js/ui-rucksack.js js/ui-werkbank.js tests/test-ui-rucksack.js tests/test-crafting.js && git commit -m "Detail folgt dem Fokus; Y legt an oder stellt her"
```

---

### Task 8: Controller-Hilfe in Menüs

**Files:**
- Modify: `js/texte.js` (`steuerHilfe`), `js/gamepad.js` (`controllerHilfe`), `js/ui.js` (`CH_KLASSE`), `js/survival.js` (`_hudSurvival`, Zeilen 262–265)
- Test: `tests/test-ui.js`

**Interfaces:**
- `SC.controllerHilfe(k)` bekommt `k.menue`; für ein offenes Menü liefert sie die Menüzeilen (Steuerkreuz, LB/RB, A, Y, B, Start).
- Neue `SC.T.steuerHilfe`-Schlüssel: `fokus` („Auswahl bewegen“), `zone` („Bereich wechseln“), `auswaehlen` („Auswählen“), `anlegen` („Anlegen“), `zurueck` („Zurück“), `schliessen` („Schließen“).

- [ ] **Step 1: Test schreiben (failend)**

```js
test("Controller-Hilfe in Menüs zeigt die Zonentasten", function(){
  var l=SC.controllerHilfe({menue:true});
  ["✚","LB","RB","A","Y","B","☰"].forEach(function(t){ wahr(l.some(function(z){ return z.taste===t; }), t + " fehlt"); });
  wahr(l.some(function(z){ return z.text===SC.T.steuerHilfe.zone; }), "Zone");
  wahr(l.some(function(z){ return z.taste==="B" && z.text===SC.T.steuerHilfe.zurueck; }), "B zeigt Zurück");
  var s=SC.controllerHilfe({survival:true}); wahr(!s.some(function(z){ return z.text===SC.T.steuerHilfe.zone; }), "ohne Menü keine Zone");
});
test("Das Entwicklerpanel gilt als offenes Menü", function(){
  var w=document.createElement("div"); document.body.appendChild(w); var ui=ui2(w);
  gleich(ui.menueOffen(), false);
  var e=document.createElement("div"); e.className="entwickler"; w.appendChild(e);
  gleich(ui.menueOffen(), true);
  e.hidden = true; gleich(ui.menueOffen(), false);
  w.remove();
});
```
Run: `bash scripts/tests-wsl.sh "Controller-Hilfe"` und `bash scripts/tests-wsl.sh Entwicklerpanel` – erwartet ❌ (`k.menue` wird noch nicht behandelt, `menueOffen` fehlt).

- [ ] **Step 2: Implementieren**

`js/gamepad.js` in `SC.controllerHilfe` ganz oben:
```js
if(k.menue){
  z("✚", "✚", T.fokus); z("LB", "◀▶", T.zone); z("RB", "◀▶", T.zone); z("A", "⬤", T.auswaehlen); z("Y", "⬤", T.anlegen);
  z("B", "⬤", T.zurueck); z("☰", "☰", T.schliessen);
  return l;
}
```
`js/ui.js` Zeile 137: `CH_KLASSE` um `"✚": "kreuz"` ergänzen, damit das Symbol wie die Steuerkreuz-Taste aussieht.
`js/ui.js`: `SC.UI.prototype.menueOffen = function(){ return this.offen() || !!(this.wurzel.querySelector(".entwickler:not([hidden])")); };` – das Entwicklerpanel gilt in der Eingabe (`js/spiel.js:46`) und in `_fenster()` (`js/ui.js:77`) als Menü, sonst zeigt die Hilfe dort Tasten der Welt, obwohl sie im Menü wirken.
`js/survival.js`: das Objekt für `SC.controllerHilfe` um `menue: ui.menueOffen()` ergänzen.

- [ ] **Step 3: Grüne Testseite und im Browser ansehen**

Run: `bash scripts/tests-wsl.sh` – keine ❌. Im Browser (`http://127.0.0.1:8090/`) den Rucksack mit angeschlossenem Controller öffnen: die Hilfe steht oben rechts und zeigt die Menüzeilen.

- [ ] **Step 4: Commit**

```bash
git add js/texte.js js/gamepad.js js/ui.js js/survival.js tests/test-ui.js && git commit -m "Controller-Hilfe für Menüs"
```

---

### Task 9: Version, Testseite, ROADMAP, Devlog, Issues

**Files:**
- Modify: `index.html` (`var V="X.Y.Z"` → `0.22.0`), `docs/ROADMAP.md`
- Neu: `docs/itch-devlog-0.22.0.md` und `docs/itch-devlog-0.22.0.html`

- [ ] **Step 1: Volle Testseite wirklich laden**

Run: `bash scripts/tests-wsl.sh`
Expected: `Fertig: N ok, 0 fehlgeschlagen`, keine ❌-Zeilen (rund 15 neue Tests). Bei einem Fehlschlag: Systematisch debugging, nicht raten.

- [ ] **Step 2: Version**

`index.html` Kopf: `var V="0.22.0"` (einzige Stelle; Service-Worker-Cache folgt der Version). `sw.js` nicht extra ändern.

- [ ] **Step 3: Im Spiel prüfen (iPad-Querformat, Controller)**

Run: `http://127.0.0.1:8090/` im gesteuerten Chrome. Prüfen: Rucksack als Seitenpanel, Welt links sichtbar; Steuerkreuz springt im 9×9-Raster Reihen; LB/RB wechseln die Zone; Y legt an; B verlässt zuerst die Zone; Start schließt; Regler in den Einstellungen direkt verstellbar; Statusfeld oben links zeigt Stufe und die gewählte Sache; Fokus rollt ins Sichtbare.

- [ ] **Step 4: Commits und Doku**

```bash
git add index.html && git commit -m "Version 0.22.0"
```
`docs/ROADMAP.md` aktualisieren (Stand, was zuletzt passiert ist, nächster Schritt) und den Devlog entwerfen (`docs/itch-devlog-0.22.0.md` + `.html` zum Kopieren): Panel-Stil, Statusfeld, Seitenpanels, neue Controller-Belegung. Committen, nicht pushen.

- [ ] **Step 5: GitHub (erst nach dem Push auf `main`)**

Meilenstein „Spiel-UI und Controller-Navigation“ anlegen, ein Issue je Task (Titel auf Deutsch, kurz), Labels `ui` und `steuerung`, jedes Issue ins Projektboard „Spacecraft“ (Nummer 1, Owner `ttrabold`) mit Status Todo. Der Push von `8bcba4d` (ROADMAP), `fd53554` (Design-Doc) und den neuen Commits erfolgt nur, wenn der Nutzer es verlangt.

## Nicht in diesem Plan

- Hochformat: bleibt nutzbar, wird nicht besonders gepflegt (entschieden).
- Kein neues Speicherstand-Feld, keine neuen Einstellungen, kein Umbau des Kampfs.
- Die definierten Deferred Minors aus dem Review zu #127 (Hilfe nennt die Regel nicht in `js/texte.js` ~242–249, kein Hinweis bei Angriff auf einen Block mit Waffe, `tests/test-generator.js:14` wirkungsloses Argument, `tests/test-spiel.js:8` prüft exakt auf der Grenze) bleiben eigene Issues und sind hier nicht enthalten.





