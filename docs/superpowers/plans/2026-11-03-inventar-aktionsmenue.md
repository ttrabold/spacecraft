# Rucksack mit Aktionsmenü – Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Der Rucksack bekommt einen einzigen Cursor, der auch auf Touch mitwandert, ein Aktionsmenü direkt am Gegenstand, Verschieben als eigene Aktion und das automatische Anlegen eindeutig besserer Rüstung beim Aufheben (abschaltbar, Standard an).

**Architecture:** Die Entscheidung „eindeutig besser“ und das Tauschen liegen ohne Oberfläche in `SC.Beute`/`SC.Kampf` (testbar ohne DOM). `zeigeRucksack` in `js/ui-rucksack.js` hält zwei Zustände – `menue` (für welchen Platz das Aktionsmenü offen ist) und `verschieben` (Quellplatz) – und zeichnet das Menü als eigene Zeile im Raster direkt unter der Reihe des Platzes. `SC.UI` bekommt zwei kleine Haken: eine exklusive Zone (solange das Menü offen ist, navigiert der Controller nur darin) und `_beiZurueck` (B/Esc schließt zuerst das Menü).

**Tech Stack:** Klassisches JavaScript ohne Module unter `SC`, Testseite `tests/index.html` (`bash scripts/tests.sh [Text]`).

**Spec:** `docs/superpowers/specs/2026-11-03-inventar-aktionsmenue-design.md`

## Global Constraints

- Keine ES-Module, kein Bundler; ältere Safari (iOS 16) muss laufen – keine neueren Sprachmittel als im übrigen Code (`var`, `function`, kein `?.`).
- Spielstände bleiben kompatibel; Rucksack und Ausrüstung behalten ihre Form, keine neuen gespeicherten Felder im Spielstand.
- Ältere gespeicherte Einstellungen ohne das neue Feld gelten als „automatisch anlegen: an“.
- Texte deutsch in `SC.T`; Begriffe wie bisher: `anlegen`, `ablegen`, `inSchnellleiste`, `wegwerfen`, `abbrechen` (gibt es schon).
- Wegwerfen ist nie vorausgewählt und steht nie an erster Stelle; Abbrechen ist in jedem Menü.
- Automatisch angelegt werden nur die Plätze `helm`, `brust`, `handschuhe`, `stiefel`, `schild`, nie Waffen, nur beim Aufsammeln (Beutekugel, Piratenbeute im All).
- „Eindeutig besser“: Platz leer, oder kein Wert schlechter und mindestens einer besser (`SC.Beute.vergleiche`, alle Schlüssel), und keine Sonderfähigkeit des Getragenen geht verloren.
- Knöpfe mindestens 48 px hoch (wie heute `button`).
- Version: `var V` in `index.html` auf `0.23.0` (neue Funktion → MINOR), einmal am Ende.

## Review Focus

- Rucksack voll beim „Ablegen“ aus dem Menü einer angelegten Rüstung: Hinweis „Rucksack voll“, Gegenstand bleibt angelegt, Menü schließt (Test in Task 3).
- Tipp auf einen leeren Platz bei offenem Menü: Menü schließt, kein neues Menü, Cursor auf dem leeren Platz (Test in Task 3).
- Tipp auf einen Ausrüstungsplatz während „Verschieben“: bricht das Verschieben ab, nichts wird getauscht (Test in Task 4).
- Gleiche Werte wie das Getragene: nicht „eindeutig besser“, nichts wird angelegt (Test in Task 1).
- Neuladen des Panels (z. B. nach Anlegen per Y) bei offenem Menü: Menü schließt, Cursor bleibt auf dem Platz, kein Fokus auf entfernten Knöpfen (Test in Task 3).

---

### Task 1: „Eindeutig besser“ und automatisches Anlegen ohne Oberfläche

**Files:**
- Modify: `js/gegenstaende.js` (neben `SC.Beute.vergleiche`)
- Modify: `js/kampf.js` (neben `K.ruestungAnwenden`)
- Test: `tests/test-beute.js`, `tests/test-kampf.js`

**Interfaces:**
- Produces: `SC.Beute.eindeutigBesser(neu, alt) -> boolean`; `K.automatischAnlegen(gegenstand) -> { platz, alt, neu } | null` (Kampf-Instanz; `alt` ist der vorher getragene Gegenstand oder `null`).

- [ ] **Step 1: Failing tests**

In `tests/test-beute.js`:
```js
test("Eindeutig besser: leerer Platz, besser ohne Verlust, gleich, schlechter, Sonderfähigkeit", function(){
  var h = function(w, sonder){ return { id: "x", art: "helm", werte: w, sonder: sonder || null }; };
  wahr(SC.Beute.eindeutigBesser(h({ schutz: 5 }), null), "leer");
  wahr(SC.Beute.eindeutigBesser(h({ schutz: 9 }), h({ schutz: 5 })), "besser");
  wahr(!SC.Beute.eindeutigBesser(h({ schutz: 5 }), h({ schutz: 5 })), "gleich");
  wahr(!SC.Beute.eindeutigBesser(h({ schutz: 9, lp: 0 }), h({ schutz: 5, lp: 10 })), "ein Wert schlechter");
  wahr(SC.Beute.eindeutigBesser(h({ schutz: 9, lp: 10 }), h({ schutz: 5 })), "neuer Wert dazu");
  wahr(!SC.Beute.eindeutigBesser(h({ schutz: 9 }), h({ schutz: 5 }, "dornen")), "Sonderfähigkeit ginge verloren");
  wahr(SC.Beute.eindeutigBesser(h({ schutz: 9 }, "dornen"), h({ schutz: 5 }, "dornen")), "gleiche Sonderfähigkeit");
});
```
In `tests/test-kampf.js` (Kampf wie in `tests/test-ui-rucksack.js` `k2()` bauen):
```js
test("Automatisch anlegen tauscht bessere Rüstung aus dem Rucksack, Waffen nie", function(){
  var k = k2Kampf(), alt = { id: "a", art: "helm", seltenheit: 0, werte: { schutz: 5 }, name: "Alt" }, neu = { id: "n", art: "helm", seltenheit: 1, werte: { schutz: 9 }, name: "Neu" };
  k.ausruestung.helm = alt; k.rucksack.plaetze[12] = { gegenstand: neu };
  var r = k.automatischAnlegen(neu);
  gleich(r.platz, "helm"); gleich(r.alt.id, "a"); gleich(k.ausruestung.helm.id, "n"); gleich(k.rucksack.plaetze[12].gegenstand.id, "a"); wahr(k.werte.schutz >= 9);
  var w = { id: "w", art: "laserschwert", seltenheit: 4, werte: { schaden: 99 }, name: "W" }; k.rucksack.plaetze[13] = { gegenstand: w };
  gleich(k.automatischAnlegen(w), null, "Waffe nie");
  var gleichgut = { id: "g", art: "helm", seltenheit: 0, werte: { schutz: 9 }, name: "G" }; k.rucksack.plaetze[14] = { gegenstand: gleichgut };
  gleich(k.automatischAnlegen(gleichgut), null, "gleich gut: nichts");
  gleich(k.automatischAnlegen({ id: "fehlt", art: "helm", werte: { schutz: 50 } }), null, "nicht im Rucksack: nichts");
});
```
(`k2Kampf` = dieselbe Bauweise wie `k2()` in `tests/test-ui-rucksack.js`; als Hilfsfunktion in `tests/test-kampf.js` anlegen, falls dort keine passende existiert.)

- [ ] **Step 2: Run** `bash scripts/tests.sh "Eindeutig besser"` und `bash scripts/tests.sh "Automatisch anlegen"` → beide ❌ (Funktion fehlt).

- [ ] **Step 3: Implement** `SC.Beute.eindeutigBesser(neu, alt)` in `js/gegenstaende.js` (über `SC.Beute.vergleiche`; `alt` null → true; `alt.sonder && alt.sonder !== neu.sonder` → false) und `K.automatischAnlegen(g)` in `js/kampf.js`: Platz aus `SC.GEGENSTAENDE[g.art].platz`, nur die fünf Rüstungsplätze; Index im Rucksack per `id` suchen (nicht gefunden → null); nur wenn `eindeutigBesser(g, this.ausruestung[platz])`: tauschen (`ausruestung[platz] = g`, Rucksackplatz = `{ gegenstand: alt }` oder `null`), `this.ruestungAnwenden()`, Rückgabe `{ platz, alt, neu: g }`.

- [ ] **Step 4: Run** beide Filter → ✅; dann `bash scripts/tests.sh` → `0 fehlgeschlagen`.

- [ ] **Step 5: Commit** `git commit -m "Eindeutig bessere Rüstung erkennen und anlegen (ohne Oberfläche)"`

---

### Task 2: Beim Aufsammeln anlegen, Hinweis, Einstellung

**Files:**
- Modify: `js/survival.js` (Zweig `erg === "aufgesammelt"`, Zeile ~228; neuer Helfer `S._beuteAnlegen`)
- Modify: `js/raumflug.js` (`S._piratBesiegt`)
- Modify: `js/ui.js` (`SC.Einstellungen.standard`, `zeigeEinstellungen`)
- Modify: `js/texte.js`
- Test: `tests/test-spiel.js`, `tests/test-ui.js`

**Interfaces:**
- Consumes: `K.automatischAnlegen(g)` aus Task 1.
- Produces: `S._beuteAnlegen(g) -> boolean` (true = angelegt und Hinweis gezeigt); Einstellung `einstellungen.autoAnlegen` (boolean, Standard `true`); Texte `SC.T.autoAnlegen` = "Bessere Ausrüstung automatisch anlegen", `SC.T.autoAngelegt` = "Neu angelegt: {name} ({wert} {alt} → {neu})".

- [ ] **Step 1: Failing tests**

In `tests/test-spiel.js` (Survival-Spiel wie bei den bestehenden `survSpiel()`-Tests, `s.ui.hinweis` aufzeichnen):
```js
test("Aufgesammelte bessere Rüstung wird angelegt, mit Hinweis; abgeschaltet nicht", function(){
  var s = survSpiel(), k = s.kampf, h = []; s.ui.hinweis = function(t){ h.push(t); };
  var neu = { id: "n", art: "helm", seltenheit: 1, werte: { schutz: 9 }, name: "Blauer Helm" }; k.rucksack.plaetze[10] = { gegenstand: neu };
  wahr(s._beuteAnlegen(neu)); gleich(k.ausruestung.helm.id, "n"); wahr(h[0].indexOf("Blauer Helm") >= 0 && h[0].indexOf("→ 9") >= 0, h[0]);
  var neu2 = { id: "m", art: "helm", seltenheit: 2, werte: { schutz: 20 }, name: "Roter Helm" }; k.rucksack.plaetze[11] = { gegenstand: neu2 };
  s.einstellungen.autoAnlegen = false; wahr(!s._beuteAnlegen(neu2)); gleich(k.ausruestung.helm.id, "n");
});
```
In `tests/test-ui.js`:
```js
test("Einstellung automatisch anlegen: Standard an, alte Einstellungen gelten als an, Schalter in den Einstellungen", function(){
  gleich(SC.Einstellungen.standard().autoAnlegen, true);
  localStorage.setItem("sc-testalt:einstellungen", JSON.stringify({ sichtweite: 6 })); gleich(SC.Einstellungen.lade("testalt").autoAnlegen, true); localStorage.removeItem("sc-testalt:einstellungen");
  var w = document.createElement("div"), ui = leereUI(w); ui.zeigeEinstellungen(function(){}); var c = w.querySelector("#e-auto"); wahr(c && c.checked, "Schalter an");
});
```

- [ ] **Step 2: Run** `bash scripts/tests.sh "Aufgesammelte bessere"` und `bash scripts/tests.sh "automatisch anlegen: Standard"` → ❌.

- [ ] **Step 3: Implement**
  - `autoAnlegen: true` in `SC.Einstellungen.standard()`; in `zeigeEinstellungen` ein Schalter `<label class="feld zeile"><input type="checkbox" id="e-auto">` mit `SC.T.autoAnlegen`, angebunden wie `e-fps` über `an("e-auto", "autoAnlegen")`.
  - `S._beuteAnlegen(g)` in `js/survival.js`: nur wenn `this.einstellungen.autoAnlegen !== false`; `this.kampf.automatischAnlegen(g)`; bei Erfolg `this.ui.hinweis(SC.T.autoAngelegt …, 2500)` mit `{name}` = `g.name`, `{wert}` = `SC.T.werteName[haupt]`, `{alt}`/`{neu}` = Hauptwert alt (0 bei leerem Platz) und neu, `haupt` = erster Schlüssel von `SC.GEGENSTAENDE[g.art].haupt`.
  - Aufrufen: im Zweig `erg === "aufgesammelt"` (statt des Namens-Hinweises, wenn angelegt wurde; sonst bleibt der Namens-Hinweis) und in `S._piratBesiegt` nach erfolgreichem `lege` (statt `allBeute`-Hinweis, wenn angelegt).

- [ ] **Step 4: Run** beide Filter → ✅; `bash scripts/tests.sh` → `0 fehlgeschlagen`.

- [ ] **Step 5: Commit** `git commit -m "Beute: bessere Rüstung beim Aufsammeln anlegen, Einstellung (Standard an)"`

---

### Task 3: Ein Cursor und Aktionsmenü im Rucksack

**Files:**
- Modify: `js/ui-rucksack.js` (`zeigeRucksack`)
- Modify: `js/ui.js` (`_zonen`, `zurueck`, `schliesse`, Konstruktor: Esc)
- Modify: `css/style.css` (Rucksack-Abschnitt)
- Modify: `js/texte.js`
- Test: `tests/test-ui-rucksack.js`

**Interfaces:**
- Consumes: bestehende `SC.UI.prototype._zeige`, `beiFokus`, `kurzaktion`, `navigiere`, `zone`.
- Produces:
  - Markup: Aktionsmenü `<div class="rs-menue exklusiv" data-zone="menue">` mit Name (Seltenheitsfarbe), bei Ausrüstung den Wertzeilen samt Vergleich (`wertZeilen`, `.besser`/`.schlechter` wie heute) und Knöpfen `data-aktion` = `anlegen` | `leiste` | `verschieben` | `wegwerfen` | `ablegen` | `abbrechen`. Es steht als Rasterzeile (`grid-column: 1 / -1`) direkt nach der Reihe des Platzes im `.rs-raster` bzw. nach der Ausrüstungsreihe.
  - `.rs-info` ersetzt `.rs-detail`: eine Zeile mit Name (und Anzahl bei Blöcken) der Sache unter dem Cursor; folgt dem Fokus (`_beiFokus`), keine Knöpfe.
  - `SC.UI.prototype._beiZurueck` (Funktion → `true`, wenn erledigt), von `zurueck()` zuerst gefragt; in `schliesse()` auf `null`. Esc (`keydown` an der UI-Wurzel, Ziel innerhalb) ruft `_beiZurueck` und stoppt die Weitergabe, wenn es `true` liefert.
  - `_zonen()`: gibt es im Fenster ein `[data-zone].exklusiv`, ist nur dieses die Zonenliste.
  - Text `SC.T.rucksackInfoLeer` (für leere Plätze, z. B. "Leerer Platz").

Menüinhalt (erste Zeile = vorausgewählt, Reihenfolge fest):

| Sache | Knöpfe |
|---|---|
| Rüstung/Schild im Rucksack | anlegen · verschieben · wegwerfen · abbrechen |
| Waffe im Rucksack, Platz ≥ 9 | leiste · verschieben · wegwerfen · abbrechen |
| Waffe oder Block, Platz 0–8 | verschieben · wegwerfen · abbrechen |
| Block, Platz ≥ 9 | leiste · verschieben · wegwerfen · abbrechen |
| Angelegte Rüstung (Ausrüstungsplatz) | ablegen · abbrechen |
| Ausrüstungsplatz „waffe“ | Menü des Schnellleisten-Platzes `kampf.spieler.auswahl` |

- [ ] **Step 1: Failing tests** (alle in `tests/test-ui-rucksack.js`; `k2()`, `ui2()` gibt es dort; das Menü per Klick wie ein Tipp öffnen)
```js
test("Antippen setzt den Cursor und öffnet das Menü am Gegenstand", function(){
  var w=document.createElement("div"); document.body.appendChild(w); var ui=ui2(w),k=k2(),h={id:"h",art:"helm",seltenheit:1,werte:{schutz:9},name:"Blauer Helm"}; k.rucksack.plaetze[12]={gegenstand:h};
  ui.zeigeRucksack(k,{}); var p=w.querySelector('.rs-platz[data-i="12"]'); p.click();
  gleich(document.activeElement.getAttribute("data-aktion"),"anlegen","Fokus auf erster Aktion");
  gleich([].map.call(w.querySelectorAll(".rs-menue button"),function(b){return b.getAttribute("data-aktion");}).join(),"anlegen,verschieben,wegwerfen,abbrechen");
  wahr(!w.querySelector(".rs-platz.gewaehlt"),"keine zweite Markierung"); w.remove();
});
test("Zweiter Tipp auf denselben Platz legt an", function(){ /* wie oben, p zweimal klicken → k.ausruestung.helm.id === "h", Menü zu */ });
test("Menüinhalt je Sache, Wegwerfen nie zuerst", function(){ /* Block auf 3 → verschieben,wegwerfen,abbrechen; Block auf 20 → leiste,…; Waffe auf 20 → leiste,…; angelegter Helm → ablegen,abbrechen; für jede Liste: erste ≠ wegwerfen */ });
test("Abbrechen, B und Esc schließen das Menü, Cursor bleibt auf dem Platz", function(){ /* öffnen, abbrechen klicken → kein .rs-menue, activeElement ist Platz 12; öffnen, ui.menueAktion("zurueck") → zu, Rucksack noch offen; öffnen, Escape-keydown auf dem Knopf → zu */ });
test("Tipp auf leeren Platz schließt das Menü ohne neues", function(){ /* Menü an 12 offen, Platz 30 (leer) klicken → kein .rs-menue, activeElement Platz 30 */ });
test("Ablegen bei vollem Rucksack: Hinweis, bleibt angelegt", function(){ /* alle 36 Plätze belegt, Helm angelegt, Ausrüstungsplatz helm antippen, ablegen → Hinweis SC.T.rucksackVoll, k.ausruestung.helm bleibt, Menü zu */ });
test("Controller: A öffnet, Steuerkreuz bleibt im Menü, A bestätigt", function(){ /* Platz 12 fokussieren, ui.bestaetige() → Menü offen; ui.navigiere("runter") → activeElement im .rs-menue; ui.zone(1) → bleibt im .rs-menue; zurück auf anlegen, ui.bestaetige() → angelegt */ });
test("Info-Zeile folgt dem Cursor", function(){ /* Platz 12 fokussieren + ui.beiFokus(el) → .rs-info enthält "Blauer Helm"; leeren Platz → SC.T.rucksackInfoLeer */ });
test("Neuladen bei offenem Menü schließt es, Cursor bleibt", function(){ /* Menü an 12 offen; Platz 13 (Block) fokussieren und ui.kurzaktion() (Y) → kein .rs-menue, activeElement ist ein .rs-platz */ });
```
Die mit `/* … */` beschriebenen Tests nach demselben Muster wie der erste ausschreiben; die Kommentare nennen Aufbau und Erwartungen. Die bestehenden Tests „Detail folgt dem Fokus ohne Antippen“ und „Fokus auf dem Waffenplatz zeigt dasselbe wie das Antippen“ auf `.rs-info` umstellen (sie prüfen dann den Namen in der Info-Zeile); „Anlegen tauscht…“ und „Vergleich zeigt besser und schlechter“ bleiben unverändert grün (Knopf `anlegen` und `.besser` stehen jetzt im Menü).

- [ ] **Step 2: Run** `bash scripts/tests.sh Rucksack` und `bash scripts/tests.sh Menü` → die neuen ❌.

- [ ] **Step 3: Implement** in `zeigeRucksack`: Zustand `menue` (`{ i }` oder `{ platz }` oder `null`) statt `gewaehlt` für die Knöpfe; `platz`-Aktion: `el.focus()`, dann – gleicher Platz und Menü offen → erste Aktion ausführen; belegter Platz → Menü öffnen; leerer Platz → Menü schließen. Nach `zeichne()` mit offenem Menü den ersten Menüknopf fokussieren, nach dem Schließen den Platz. `ui._beiZurueck` schließt ein offenes Menü (true), sonst false. Jede Aktion schließt das Menü. `_kurzaktion` (Y) bleibt wie heute und schließt ein offenes Menü. Zweiter-Tipp-Verschieben aus dem alten `platz`-Handler entfällt (kommt in Task 4 als Aktion).
  In `js/ui.js`: `_zonen()` mit Exklusiv-Regel, `zurueck()` fragt zuerst `this._beiZurueck`, `schliesse()` setzt `_beiZurueck = null`, Esc an der Wurzel wie im Interface beschrieben.
  CSS: `.rs-menue` als ruhiges Panel (`#1b1845`, 1 px `#3a3a5a`, Radius 10 px, Padding 12 px) über die ganze Rasterbreite, Knöpfe in einer Reihe; `.rs-platz.gewaehlt` entfernen; Cursor = vorhandener `:focus`-Rahmen.

- [ ] **Step 4: Run** `bash scripts/tests.sh` → `0 fehlgeschlagen`.

- [ ] **Step 5: Commit** `git commit -m "Rucksack: ein Cursor, Aktionsmenü am Gegenstand, B und Esc schließen es"`

---

### Task 4: Verschieben als Aktion

**Files:**
- Modify: `js/ui-rucksack.js`, `css/style.css`, `js/texte.js`
- Test: `tests/test-ui-rucksack.js`

**Interfaces:**
- Consumes: Menü und Zustände aus Task 3.
- Produces: Zustand `verschieben` (Quellindex oder `null`); Klasse `.rs-platz.verschiebt` am Quellplatz; `.rs-info` zeigt `SC.T.wohin` = "Wohin? Tippe einen Platz an."; Text `SC.T.verschieben` = "Verschieben".

- [ ] **Step 1: Failing tests**
```js
test("Verschieben: auf leeren Platz, auf belegten tauschen, Abbruch", function(){
  /* Block auf 20, Menü öffnen, verschieben klicken → .rs-platz[data-i="20"].verschiebt, .rs-info enthält SC.T.wohin;
     Platz 2 (leer) klicken → plaetze[2] ist der Block, plaetze[20] null, keine .verschiebt mehr.
     Erneut verschieben von 2, Platz 5 (belegt) klicken → getauscht.
     Verschieben starten, ui.menueAktion("zurueck") → abgebrochen, nichts getauscht.
     Verschieben starten, Ausrüstungsplatz helm klicken → abgebrochen, nichts getauscht.
     Verschieben starten, Quellplatz selbst klicken → abgebrochen. */
});
```
Nach dem Muster der Tests in Task 3 ausschreiben.

- [ ] **Step 2: Run** `bash scripts/tests.sh Verschieben` → ❌.

- [ ] **Step 3: Implement**: Aktion `verschieben` setzt `verschieben = menue.i`, schließt das Menü. Solange `verschieben !== null`: Tipp/A auf einen Rucksackplatz ≠ Quelle → `rs.tausche(verschieben, i)`, `o.beiAenderung`, Zustand zurück; Quelle, Ausrüstungsplatz, B oder Esc (`_beiZurueck`) → Abbruch. Am Ausrüstungsplatz „waffe“ wird `verschieben` mit dem Index `kampf.spieler.auswahl` gestartet.

- [ ] **Step 4: Run** `bash scripts/tests.sh` → `0 fehlgeschlagen`.

- [ ] **Step 5: Commit** `git commit -m "Rucksack: Verschieben als Aktion statt zweitem Tipp"`

---

### Task 5: Version, Prüfung im Browser und am iPad

**Files:**
- Modify: `index.html` (`var V="0.23.0"`)
- Modify: `docs/ROADMAP.md` (Stand)

- [ ] **Step 1:** `var V` auf `"0.23.0"`; `bash scripts/tests.sh` → `0 fehlgeschlagen`.
- [ ] **Step 2: Browserprüfung** (Chrome, 1180×820 mit Touch-Emulation und mit Maus, `file://` oder `localhost`, nie auf dem gemeinsamen GitHub-Origin): Rucksack öffnen, Helm in zwei Tipps anlegen, Menü am Platz sichtbar, Abbrechen/Esc, Verschieben, Y, Controller über `ui.menueAktion` simuliert. Ergebnis mit Screenshot festhalten.
- [ ] **Step 3: Commit** `git commit -m "Version 0.23.0: Rucksack mit Aktionsmenü"` und nach Freigabe des Nutzers `git push test <branch>:main` für die Prüfung am iPad (Touch in Safari prüft die Testseite nicht).
- [ ] **Step 4:** ROADMAP-Stand nachtragen (was geprüft ist, was am Gerät offen ist); Commit.
