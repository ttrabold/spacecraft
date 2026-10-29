# Stufe 5b: Raumschiff und Raumflug – Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ein Raumschiff am Startplaneten, Flug ohne Ladebildschirm durch die Atmosphäre ins All, Sprungantrieb, Asteroiden, Piraten, Eintritt und Landung auf jedem der drei Planeten – allein und gemeinsam – als Version 0.9.0.

**Architecture:** Das Raumschiff ist eine Fahrzeugart (`SC.FAHRZEUGE.raumschiff`) und nutzt Sitze, Abgleich und Steuerung aus Stufe 4. Oberhalb einer Grenzhöhe wechselt das Spiel in den Raumflug-Zustand `spiel.all` mit eigenen Koordinaten im Sonnensystem (`js/all.js`, reine Logik) und eigener Darstellung (`js/render-all.js`: Sterne, Sonne, Planetenkugeln, Schiff, Asteroiden, Piraten); die Blockwelt wird dann nicht gezeichnet. Beim Eintritt rechnet `SC.All.zuTorus` die Anflugstelle auf die Planetenfläche um, und der Planetenwechsel aus 5a setzt Schiff und Insassen dort in die Atmosphäre.

**Tech Stack:** wie bisher.

**Spec:** `docs/superpowers/specs/2026-10-29-stufe-5-planeten-raumflug-design.md` (Teil 5b)

## Global Constraints

- Alles aus AGENTS.md (kein Build, `file://`, iOS-Safari, Texte nur in `texte.js`, Ladereihenfolge gleich, Version nur in `index.html`).
- Version am Ende `var V="0.9.0"`. `SC.NETZ_PROTOKOLL = 4`.
- Kein Ladebildschirm; Übergänge dürfen mit einem Glüh-/Dunst-Overlay (≤ 0,8 s) kaschiert werden.
- Raumschiff: 4 Sitze, Schild statt Panzerung (lädt sich auf), **kann nie verpuffen** *(Ruling dieses Plans: sonst strandet man auf einem fremden Planeten)*. Schild leer im All → Notsprung zum zuletzt besuchten Planeten, Landung am Landepunkt.
- Fundort des Raumschiffs: ID `"schiff"`, nur auf dem Startplaneten, 14–20 Blöcke vom Startpunkt; reist danach mit (wechselt in `planeten[id].fahrzeuge` des jeweiligen Planeten).
- Flugdauer zwischen Nachbarplaneten im normalen Flug 30–60 s; Sprung 3 s Streifen, Ankunft in 2,5 Planetenradien Abstand.
- Ins All nur, wenn alle Spieler des Raums an Bord sind; sonst Halt an der Grenzhöhe und Hinweis „Alle müssen an Bord sein“ (`SC.T.allAlleAnBord`).
- Beute im All direkt in den Rucksack; voller Rucksack → Hinweis, Beute verfällt *(Ruling)*.
- Speichern im All → Laden am Landepunkt des zuletzt besuchten Planeten, Schiff daneben.
- Leistung: im All keine Chunks; ≤ 60 Zeichenaufrufe für die Raumszene; Planetenkugeln ≤ 32×24 Segmente.
- Prüfen: `bash scripts/tests.sh` (ohne Sandbox); Spieltest per DevTools, Tabs danach `about:blank`.
- Commits mit `Fixes #N` (Tabelle am Ende).

## Review Focus

1. **Spieler verlässt im All die Welt oder das Spiel stürzt ab** → beim Laden steht er am Landepunkt des zuletzt besuchten Planeten, das Schiff steht daneben, nicht im All → Test `Speichern im All lädt am Landepunkt` (Task 4).
2. **Anflug genau auf einen Pol oder über eine Lava-/Wasserfläche** → Ankunft in Flughöhe über einer gültigen Torusstelle, Landen bleibt möglich → Test `Kugel ↔ Torus an Polen und Rändern` (Task 2).
3. **Gast verliert im All die Verbindung** → sein Sitz wird frei, die anderen fliegen ungestört weiter; der Gast selbst versucht wie bisher neu zu verbinden bzw. landet in seiner Weltliste → Test `Abriss im All` (Task 6).
4. **Schild im Asteroidenfeld auf 0** → Notsprung, kein Verpuffen, Rucksack und Schiff bleiben → Test `Notsprung statt Verpuffen` (Task 5).
5. **Kein Ziel gewählt und Sprung gedrückt** → nichts passiert außer Hinweis „Erst ein Ziel wählen“ → Test `Sprung ohne Ziel` (Task 4).

---

## Dateistruktur

```
js/all.js           SC.ALL (Sonnensystem: Planetenpositionen, Radius, Grenzhöhe), SC.All (Abbildung Kugel↔Torus, Flugschritt, Sprung,
                    Asteroiden, Piraten, Notsprung) – reine Logik, nach fahrzeuge.js
js/render-all.js    SC.RenderAll: Sterne, Sonne, Planetenkugeln (Textur aus der Palette), Schiff, Asteroiden, Piraten, Streifen – nach render-fahrzeuge.js
js/raumflug.js      Mixin für SC.Spiel: Aufstieg/Austritt/All/Sprung/Eintritt, Zielauswahl, Cockpit-Anzeige – nach fahren.js
geändert: fahrzeuge.js (Raumschiff), render.js (Atmosphärenhöhe, Umschalten auf RenderAll), spiel.js (Planetenwechsel mit Schiff),
          raum.js (Protokoll 4), ui.js/css (Cockpit, Overlay), eingabe/touch/gamepad (Ziel wählen, Sprung), musik.js (Stimmung „all“), texte.js
Tests neu: tests/test-all.js
```

---

### Task 1: Raumschiff als Fahrzeug, Fundort, Atmosphärenhöhe

**Files:** Modify `js/fahrzeuge.js`, `js/fahren.js`, `js/spiel.js`, `js/render.js`, `js/texte.js`; Test `tests/test-all.js`

**Interfaces:**
- Produces: `SC.FAHRZEUGE.raumschiff` (`fliegt: true`, `tempo 18`, `steigen 10`, `maxHoehe: SC.ALL_GRENZE + 20`, `panzerung` = Schild 200, `geschuetz { schaden 20, tempo 50, abklingen 0.25 }`, 4 Sitze, Modell: Star-Wars-angelehnter Frachter, blockig, Triebwerksglühen); `SC.ALL_GRENZE = 160` (Höhe, ab der der Austritt beginnt); `SC.Fahrzeug.schaden` verpufft ein Fahrzeug mit `SC.FAHRZEUGE[art].unzerstoerbar` nie (Panzerung bleibt ≥ 0); `SC.Fahrzeug.sichereSchiff(welt, startpunkt)` legt `"schiff"` auf dem Startplaneten an (Fundort, 14–20 Blöcke). Render: Himmel wird über Höhe 128 bis `SC.ALL_GRENZE` zu Nachtfarben ausgeblendet, Sterne sichtbar (`render.hoehenFaktor(y) → 0..1`).

- [ ] **Step 1: Tests:** `Raumschiff: vier Sitze, unzerstörbar, steigt bis über die Grenzhöhe` (Schaden 9999 → nicht verpufft, Schild 0); `Raumschiff steht nur auf dem Startplaneten, einmal` (sichereSchiff zweimal, Abstand 14–20, frei, nicht auf Glutfrost); `Höhenfaktor: 0 am Boden, 1 an der Grenze`.
- [ ] **Step 2–4:** rot → umsetzen → grün; Spieltest: Schiff finden, einsteigen, aufsteigen, Himmel dunkelt ab (Screenshot).
- [ ] **Step 5:** Commit `Raumflug: Raumschiff, Fundort, Atmosphärenhöhe (Fixes #77)`

### Task 2: Sonnensystem und Abbildung Kugel ↔ Torus

**Files:** Create `js/all.js`; Test `tests/test-all.js`

**Interfaces:**
- Produces: `SC.ALL = { radius: 400, planeten: { start: [0, 0, 0], glutfrost: [5200, 600, -1800], rankenmoor: [-3600, -900, 4400] }, sonne: [0, 9000, -14000] }`; `SC.All.zuKugel(planetId, x, z, h) → [x,y,z]` (Länge = x/2048·2π, Breite = (z/2048 − 0,5)·0,8π, Abstand radius + h); `SC.All.zuTorus(planetId, pos) → { x, z }` (Umkehrung; Breite auf ±0,4π geklemmt); `SC.All.naechster(pos) → { id, abstand }`.

- [ ] **Step 1: Tests:** `Kugel ↔ Torus hin und zurück` (Raster über x, z; Abweichung < 1 Block); `Kugel ↔ Torus an Polen und Rändern` (Punkte über den Polen und bei x = 0/2047 ergeben gültige x, z in [0, 2048)); `Abstände: Nachbarplaneten bei Flugtempo 150 in 30–60 s` (Abstand der Oberflächen / 150 zwischen 30 und 60 für start↔glutfrost und start↔rankenmoor).
- [ ] **Step 2–4:** rot → umsetzen → grün.
- [ ] **Step 5:** Commit `Raumflug: Sonnensystem und Kugel-Torus-Abbildung (Fixes #78)`

### Task 3: Raumszene darstellen

**Files:** Create `js/render-all.js`; Modify `js/render.js`, `css/style.css` (Overlay); Test `tests/test-render.js`

**Interfaces:**
- Consumes: `SC.ALL`, `SC.PALETTEN`.
- Produces: `SC.RenderAll(renderer, kamera)` mit `bild(zustand, dt)` (zustand: `{ schiff: { pos, blick, neigung }, ziel, asteroiden: [{pos, r}], piraten: [{pos, blick}], geschosse, sprung: 0..1 }`), Planetenkugeln mit Texturen aus der jeweiligen Palette (Gras/Stein/Wasser/Lava/Schnee-Farben, gemalt auf eine Canvas 256×128), Atmosphärenleuchten (halbtransparente größere Kugel in Himmelsfarbe), Sterne (Punkte), Sonne, Schiffmodell aus `SC.FAHRZEUGE.raumschiff.modell`, Sternstreifen beim Sprung. `SC.Render.prototype.allModus(an)` schaltet zwischen Blockwelt und Raumszene (Chunks/Wesen/Fahrzeuge der Blockwelt unsichtbar, eigene Szene). `SC.UI.prototype.gluehen(farbe, dauer)` – Vollbild-Overlay zum Kaschieren.

- [ ] **Step 1: Tests:** `RenderAll: drei Planetenkugeln, wenige Zeichenaufrufe` (Szene enthält 3 Kugeln + 3 Atmosphären, Objekte ≤ 60); `allModus blendet Blockwelt aus und wieder ein`.
- [ ] **Step 2–4:** rot → umsetzen → grün; Screenshot der Raumszene an den Nutzer.
- [ ] **Step 5:** Commit `Raumflug: Raumszene (Fixes #79)`

### Task 4: Flugablauf allein

**Files:** Create `js/raumflug.js`; Modify `js/spiel.js`, `js/fahren.js`, `js/eingabe.js`, `js/touch.js`, `js/gamepad.js`, `js/ui.js`, `js/texte.js`, `js/musik.js`, `js/spielstand.js`; Test `tests/test-all.js`

**Interfaces:**
- Consumes: Tasks 1–3, `wechslePlanet` (5a).
- Produces: `spiel.all = null | { phase: "all"|"sprung"|"eintritt", pos, blick, neigung, tempo, ziel, sprungT, vonPlanet }`. `S._raumflugBild(e, dt)`: als Pilot im Raumschiff über `SC.ALL_GRENZE` → Austritt (Glühen 0,6 s, `spiel.all` am Kugelpunkt über der Austrittsstelle, Blick vom Planeten weg, `render.allModus(true)`); im All Steuerung wie Flieger (vor/zurück = Schub bis Tempo 150, links/rechts = drehen, springen/sinken = Neigung); Zielwahl `e.ziel` (Taste `T`, Touch-Knopf „🎯“, Gamepad Steuerkreuz rechts) wechselt reihum durch die anderen Planeten; Sprung `e.sprung` (Taste `J`, Touch „⚡“, Gamepad Steuerkreuz links): 3 s Streifen, Ankunft 2,5 R vor dem Ziel; ohne Ziel Hinweis `SC.T.allKeinZiel`. Eintritt bei Abstand < 1,25 R: Glühen, `SC.All.zuTorus` → `wechslePlanet(id, { ort: [x, z], schiff })` setzt Schiff samt Insassen in Höhe `SC.ALL_GRENZE − 10` über die Stelle, `spiel.all = null`. Notsprung: Schild 0 im All → wie Eintritt beim `vonPlanet` am Landepunkt. Cockpit-Anzeige (`ui.cockpit(info)`): Zielname, Entfernung, Schild. Musikstimmung `"all"`. Speichern im All: Spielerposition = Landepunkt des `vonPlanet`, Schiff daneben.
- `SC.Spiel.prototype.wechslePlanet(id, o)` erweitert: `o.ort` (Torus-x/z) statt Landepunkt, `o.schiff` wird aus der alten Welt in die neue übernommen (Daten in `planeten[neu].fahrzeuge`, aus dem alten entfernt), Insassen bleiben sitzen.

- [ ] **Step 1: Tests:** `Austritt über der Grenzhöhe nur als Pilot im Raumschiff`; `Flug im All: Schub bis 150, Ziel wählen, Sprung kommt 2,5 R vor dem Ziel heraus`; `Sprung ohne Ziel`; `Eintritt: neuer Planet, Schiff samt Insasse über der Anflugstelle, Schiff auf dem alten Planeten weg`; `Speichern im All lädt am Landepunkt`.
- [ ] **Step 2–4:** rot → umsetzen → grün; Spieltest: ganzer Flug Start → Glutfrost (normal) und → Rankenmoor (Sprung), Landung; Leistung im All messen; Screenshots.
- [ ] **Step 5:** Commit `Raumflug: Austritt, All, Sprung, Eintritt (Fixes #80)`

### Task 5: Asteroiden und Piraten

**Files:** Modify `js/all.js`, `js/raumflug.js`, `js/render-all.js`, `js/texte.js`, `js/audio.js`; Test `tests/test-all.js`

**Interfaces:**
- Produces: `SC.All.asteroiden(seed) → [{ pos, r }]` (deterministische Felder auf halbem Weg zwischen Planetenpaaren, 40–80 Brocken, r 6–20); `SC.All.kollision(pos, liste) → Brocken|null`; Treffer: Schild −25, Rückprall. `SC.All.piraten`: alle 40–70 s Flug eine Gruppe von 2–3 Jägern (LP 40, Laser 8 Schaden), fliegen das Schiff an, kreisen, schießen; Bordlaser trifft sie; besiegt → verpuffen, Beute (`SC.Beute.erzeuge` mit Stufe des Spielers) direkt in den Rucksack (`SC.T.allBeute`). `SC.All.notsprung` ausgelöst bei Schild 0.
- [ ] **Step 1: Tests:** `Asteroidenfelder deterministisch und zwischen den Planeten`; `Asteroid kostet Schild, prallt ab`; `Piraten greifen an, Bordlaser besiegt sie, Beute im Rucksack`; `Notsprung statt Verpuffen` (Schild 0 → `spiel.all` null, Planet = vonPlanet, Spieler am Landepunkt im Schiff oder daneben, Rucksack unverändert).
- [ ] **Step 2–4:** rot → umsetzen → grün; Spieltest mit Piraten.
- [ ] **Step 5:** Commit `Raumflug: Asteroiden und Piraten (Fixes #81)`

### Task 6: Gemeinsam fliegen

**Files:** Modify `js/netz.js` (Protokoll 4), `js/raum.js`, `js/raumflug.js`, `js/spiel.js`; Test `tests/test-all.js`, `tests/test-raum.js`

**Interfaces:**
- Produces: Austritt nur, wenn `raum.spieler` (verbundene) + Gastgeber alle in diesem Schiff sitzen; sonst Halt bei `SC.ALL_GRENZE` und Hinweis. Fahrzeugabgleich trägt den Raumflug-Zustand: `zustand.fz.all` (Pilot→Gastgeber) bzw. `fahrzeuge[i].all` (Gastgeber→Gäste) = `{ phase, pos, blick, neigung, tempo, ziel, sprungT }`; Gäste spiegeln ihn in `spiel.all` und zeigen die Raumszene. Asteroiden sind deterministisch (gleicher Seed überall); Piraten rechnet der Gastgeber und schickt sie mit `fahrzeuge` (`piraten: [{id, pos, blick, lp}]`); Gast-Schüsse gehen wie bisher als `schuss` mit All-Koordinaten (`imAll: true`). Eintritt/Notsprung löst der Gastgeber aus (`wechslePlanet` mit Schiff; Gäste kommen über `planet` mit und sitzen danach wieder auf ihren Plätzen). Abriss eines Gastes im All: Sitz frei, Flug geht weiter.
- [ ] **Step 1: Tests:** `Raum: Protokoll 3 wird abgelehnt`; `Gemeinsam: Austritt nur mit allen an Bord`; `Gemeinsam: Gast sieht den Raumflug des Gastgebers`; `Gemeinsam: Gast fliegt, Gastgeber übernimmt den Raumflug-Zustand`; `Gemeinsam: Eintritt bringt alle auf den Planeten, sitzend`; `Abriss im All`.
- [ ] **Step 2–4:** rot → umsetzen → grün; echte Verbindung mit zwei Tabs: gemeinsamer Flug Start → Glutfrost.
- [ ] **Step 5:** Commit `Raumflug: gemeinsam fliegen (Fixes #82)`

### Task 7: Abschluss 0.9.0

- [ ] **Step 1:** Volle Suite grün; Spieltest aller Wege (normaler Flug, Sprung, Notsprung, Piraten, gemeinsam), Tablet-Größe, Leistung am Boden/beim Aufstieg/im All gemessen und notiert.
- [ ] **Step 2:** `var V="0.9.0"`, Roadmap (Stand, Stufe 5 fertig nach Gerätetest; nächste Ideen: Raumstationen #69, Crafting #15).
- [ ] **Step 3:** Commit `Version 0.9.0: Raumflug (Fixes #83)`.

## Issues

| Task | Issue | Label |
|---|---|---|
| 1 Raumschiff, Fundort, Atmosphärenhöhe | #77 | weltraum, fahrzeuge |
| 2 Sonnensystem, Kugel ↔ Torus | #78 | weltraum |
| 3 Raumszene | #79 | weltraum |
| 4 Flugablauf allein | #80 | weltraum, steuerung |
| 5 Asteroiden und Piraten | #81 | weltraum, kampf |
| 6 Gemeinsam fliegen | #82 | weltraum, multiplayer |
| 7 Abschluss 0.9.0 | #83 | weltraum |
