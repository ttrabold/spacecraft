# Laserschwert ohne Abbauen – Implementierungsplan (Issue #127)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Im Survival-Modus baut die Angriffstaste mit ausgerüsteter Waffe nie ab; abgebaut wird nur mit leerer Hand – und die Hand bleibt so schnell wie bisher das Laserschwert.

**Architecture:** Die Regel sitzt als Guard in `SC.Spiel#abbauFortschritt` (`js/survival.js`), der Schwert-Zweig in `_survival` ruft das Abbauen nicht mehr. `SC.Abbau.zeit` (`js/rucksack.js`) bekommt einen festen Hand-Faktor ½ statt des Schwert-Bonus. Anleitungstexte (`js/texte.js`) werden umformuliert. Tests auf der echten Testseite in Chrome.

**Tech Stack:** Reines JavaScript ohne Build-Schritt, Namensraum `SC`; Tests in `tests/` über die Testseite (`bash scripts/tests-wsl.sh` mit Windows-Chrome, oder Testseite im Browser).

**Spec:** `docs/superpowers/specs/2026-11-03-schwert-ohne-abbauen-design.md`

## Global Constraints

- Keine ES-Module, kein Bundler, kein npm; `file://` muss laufen.
- Tests im Browser: erwartet keine ❌-Zeilen und `Fertig: N ok, 0 fehlgeschlagen`. Nichts behaupten, ohne die Testseite wirklich geladen zu haben.
- Version `var V="X.Y.Z"` in `index.html` ist die einzige Stelle; Balance-Änderung → MINOR → **0.21.0**.
- Comments und Commit-Nachrichten auf Deutsch; Commit verweist auf Issue #127 (`Fixes #127`).
- Nicht pushen ohne den Nutzer; GitHub-Issues und Board erst nach dem Push auf `main` ändern (AGENTS.md).
- Der Kreativmodus bleibt unverändert (sofortes Abbauen, auch mit Waffe).

## Review Focus

- Waffe ausgerüstet, Angriffstaste auf einen Block gehalten: erwartet nur der Schwung, kein Abbauen und kein Riss-Overlay – Guard-Test in Task 2.
- Blocken mit dem Schwert (Rechtsklick halten) darf nicht zum Abbauen führen – durch den Guard in Task 2 abgedeckt, da `abbauFortschritt` nur aus dem Angriffs-Zweig kommt.
- Kreativmodus mit Waffe muss weiterhin sofort abbauen (Guard gilt nur im Survival-Pfad) – existing Kreativ-Tests in Task 4.
- Mehrspieler: Gast-Abbauen läuft über `setzeBlock`, nicht über `abbauFortschritt` – darf unverändert bleiben – bestehende Mehrspieler-Tests in Task 4.
- Lader-Reihenfolge identisch in `index.html` und `tests/index.html` – hier nichts umgestellt, Task 4 prüft die volle Testseite.

---

### Task 1: Hand-Faktor in `SC.Abbau.zeit`

**Files:**
- Modify: `js/rucksack.js` (Funktion `SC.Abbau.zeit` und Kommentar Zeile 53)
- Modify: `js/survival.js` (zwei Aufrufe von `SC.Abbau.zeit(id, waffe && waffe.art)`)
- Test: `tests/test-rucksack.js` („Abbauzeiten“), `tests/test-spiel.js` („Abbauen dauert und füllt den Rucksack“)

**Interfaces:**
- Produces: `SC.Abbau.zeit(id) → number` (Ein-Argument-Signatur, liefert halbe Tabelle; `Infinity` für unzerstörbar).

- [x] **Step 1: Tests anpassen (failend)**

`tests/test-rucksack.js`, „Abbauzeiten“:
```js
test("Abbauzeiten", function(){ gleich(SC.Abbau.zeit(SC.B.ERDE),0.2); gleich(SC.Abbau.zeit(SC.B.STEIN),0.7); gleich(SC.Abbau.zeit(SC.B.GRUNDGESTEIN),Infinity); });
```
`tests/test-spiel.js`, „Abbauen dauert und füllt den Rucksack“: die beiden `wahr(...)`-Zeiten `1.0` und `0.5` durch `0.3` und `0.4` ersetzen (Stein dauert jetzt 0.7 s).

- [x] **Step 2: Fehlschlag bestätigen**

Run: `bash scripts/tests-wsl.sh Abbau`
Expected: ❌-Zeilen bei „Abbauzeiten“ und „Abbauen dauert …“ (IST 0.4 bzw. 1.4, SOLL 0.2 bzw. 0.7).

- [x] **Step 3: Implementieren**

`js/rucksack.js`: `SC.Abbau.zeit = function(id){ ... return t / 2; }` – Hand-Faktor ½, Kommentar darüber: „Hand: schnelle Abbauart (war bisher das Laserschwert)“. Zeile-53-Kommentar von „Laserschwert halbiert“ auf „Hand halbiert“ umformulieren. In `js/survival.js` die beiden Aufrufe auf `SC.Abbau.zeit(id)` vereinfachen (das `waffe`-Argument fällt weg; das lokale `var waffe` in `abbauAnteil` ist dann ungenutzt und wird entfernt).

- [x] **Step 4: Grüne Testseite**

Run: `bash scripts/tests-wsl.sh Abbau`
Expected: nur ✅-Zeilen, `Fertig: N ok, 0 fehlgeschlagen` (die `< 3`/`< 2`-Tests in mesher/crafting/zauberkugel/betten bleiben grün).

- [x] **Step 5: Commit**

```bash
git add js/rucksack.js js/survival.js tests/test-rucksack.js tests/test-spiel.js
git commit -m "Hand-Abbauen bleibt so schnell wie bisher das Schwert: fester Halbfaktor in SC.Abbau.zeit; Fixes #127"
```

---

### Task 2: Guard – mit Waffe wird nie abgebaut

**Files:**
- Modify: `js/survival.js` (`abbauFortschritt`, Schwert-Zweig in `_survival`)
- Test: `tests/test-spiel.js`

**Interfaces:**
- Consumes: `SC.Kampf#waffe()` (liest `rucksack.plaetze[spieler.auswahl].gegenstand`).
- Produces: `SC.Spiel#abbauFortschritt(ziel, dt)` gibt mit ausgerüsteter Waffe immer `false` zurück und verändert die Welt nicht.

- [x] **Step 1: Failing test schreiben**

In `tests/test-spiel.js` ergänzen:
```js
test("Mit Waffe wird nicht abgebaut (#127)", function(){ var s=survSpiel(),w=s.welt; s.kampf.rucksack.plaetze[0]={gegenstand:{id:"w",art:"laserschwert"}}; s.spieler.auswahl=0; w.setzeBlock(4,89,4,SC.B.STEIN,"system"); var z={x:4,y:89,z:4}; for(var j=0;j<40;j++) s.abbauFortschritt(z,0.05); gleich(w.holeBlock(4,89,4),SC.B.STEIN); gleich(s.abbauAnteil(z),0); });
```
(Ohne Waffe ist „Abbauen dauert und füllt den Rucksack“ der Gegentest aus Task 1.)

- [x] **Step 2: Fehlschlag bestätigen**

Run: `bash scripts/tests-wsl.sh "Mit Waffe"`
Expected: ❌ „Mit Waffe wird nicht abgebaut (#127)“.

- [x] **Step 3: Implementieren**

`js/survival.js`, `abbauFortschritt` am Anfang: `if(this.kampf.waffe()) return false;` (Kommentar: „Mit ausgerüsteter Waffe wird nicht abgebaut – Hieb/Schuss, Abbauen nur mit leerer Hand (#127)“). Im Schwert-Zweig von `_survival` die Zeile `if(wdef.typ === "schwert" && ziel && e.abbauenGehalten) this.abbauFortschritt(ziel, dt);` entfernen (Riss-Overlay und Sound folgen automatisch, da `abbauAnteil` ohne laufenden Abbau 0 liefert).

- [x] **Step 4: Grüne Testseite**

Run: `bash scripts/tests-wsl.sh "Mit Waffe"` dann `bash scripts/tests-wsl.sh Abbau`
Expected: beide grün.

- [x] **Step 5: Commit**

```bash
git add js/survival.js tests/test-spiel.js
git commit -m "Mit ausgerüsteter Waffe nie abbauen: Guard in abbauFortschritt, Schwert-Zweig greift nur noch; Fixes #127"
```

---

### Task 3: Anleitungstexte

**Files:**
- Modify: `js/texte.js` (Zeilen ~183, ~199, ~218)

**Interfaces:** nur Copy, keine Signaturen.

- [x] **Step 1: Umformulieren** (new strings exactly):
  - Maus: `"Linke Maustaste – angreifen (mit Waffe) oder Block abbauen (ohne Waffe); im Fahrzeug schießen"`
  - Touch: `"⛏ oder ⚔ – angreifen (mit Waffe) oder abbauen (ohne Waffe)"`
  - Controller: `"RT – angreifen (mit Waffe) oder Block abbauen (ohne Waffe); im Fahrzeug schießen"`

- [x] **Step 2: Testseite grün** (Hinweis-Tests prüfen Tastennamen, nicht die Zeichenfolgen)

Run: `bash scripts/tests-wsl.sh Tastennamen`
Expected: `Fertig: 1 ok, 0 fehlgeschlagen`.

- [x] **Step 3: Commit**

```bash
git add js/texte.js
git commit -m "Anleitung: Angriffstaste mit Waffe greift nur, abbauen ohne Waffe; Fixes #127"
```

---

### Task 4: Version, ROADMAP, ganze Testseite

**Files:**
- Modify: `index.html` (`var V="0.20.1"` → `var V="0.21.0"`)
- Modify: `docs/ROADMAP.md` (Aktueller Stand + Nächster Schritt)

- [x] **Step 1: Volle Testseite in Chrome**

Run: `bash scripts/tests-wsl.sh`
Expected: keine ❌, `Fertig: 626 ok, 0 fehlgeschlagen` (623 + 3 neue Tests aus Task 2 und dem Fix-Pass).

- [x] **Step 2: ROADMAP-Eintrag** (Stand: Regel + Hand-Faktor entschieden und umgesetzt; GitHub-Status erst nach dem Push) und Commit:
```bash
git add index.html docs/ROADMAP.md
git commit -m "Version 0.21.0: Laserschwert baut nie ab, Hand bleibt schnell; ROADMAP; Fixes #127"
```

- [ ] **Step 3 (nach dem Push auf `main`, nur wenn der Nutzer ihn verlangt):** Issue #127 kommentieren und Board-Eintrag setzen (AGENTS.md: erst nach dem Push).

---

**Optional, nach Abschluss:** Devlog-Entwurf anbieten – hier vermutlich nicht nötig (kleine Balance-Änderung), entscheidet der Nutzer.
