# Stufe 4: Fahrzeuge – Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drei gefundene Viersitzer-Fahrzeuge (Gleiter, Buggy, Flieger) zum Fahren, Fliegen und gemeinsamen Kämpfen, im Einzelspiel und im Raum, als Version 0.7.0.

**Architecture:** Fahrzeuge sind eigene Objekte der Welt (`welt.fahrzeuge`, Map nach Text-ID), getrennt von `welt.wesen`. Reine Logik ohne DOM und three.js in `js/fahrzeuge.js` (Werte, Physik, Sitze, Fundorte, Panzerung); Spielanbindung als Mixin in `js/fahren.js` (wie `survival.js`); Darstellung in `js/render-fahrzeuge.js`. Im Raum hält der Gastgeber Sitze und Panzerung, der Fahrer rechnet sein Fahrzeug selbst und schickt die Lage mit seinem Zustand.

**Tech Stack:** wie bisher (klassische Skripte unter `SC`, three.js r158, Web Audio, PeerJS über `SC.Netz`).

**Spec:** `docs/superpowers/specs/2026-10-29-stufe-4-fahrzeuge-design.md`

## Global Constraints

- Alles aus AGENTS.md: keine Module, `file://` läuft, ältere Safari (iOS), Texte nur in `js/texte.js`, Ladereihenfolge in `index.html` und `tests/index.html` identisch, Version nur in `index.html`.
- Version am Ende: `var V="0.7.0"`.
- `SC.FORMAT` bleibt 2, `SC.GENERATOR_VERSION` bleibt 2. Neues Feld je Planet `fahrzeuge: {}` zieht `SC.Spielstand.migriere` nach. Alte Stände dürfen nie brechen.
- `SC.NETZ_PROTOKOLL = 2` (neue Nachrichten); verschiedene Versionen lehnen sich mit Grund `"version"` ab wie bisher.
- Vier Sitze je Fahrzeug, Sitz 0 = Fahrer. Fahrersitz wird nie automatisch nachbesetzt.
- Fundorte: Lager → Buggy, Station → Flieger, Herrenhaus → Gleiter, dazu Fundort `"start"` (Gleiter beim Startpunkt). Ein Fundort liefert sein Fahrzeug genau einmal; die Fahrzeug-ID eines Fundort-Fahrzeugs ist der Fundort-Schlüssel (`"start"` bzw. `b.schluessel` des Bauwerks), frei hingestellte Fahrzeuge heißen `"frei-" + Zufallstext`.
- Verpufft: Fundort-Fahrzeug kommt nach 120 s Spielzeit mit voller Panzerung an den Fundort zurück; freies Fahrzeug ist weg.
- Fahrzeuge bauen keine Blöcke ab und setzen keine; aus dem Fahrzeug kein Abbauen/Bauen. Rammen schadet nie Spielern. Bordgeschütz trifft Spieler nur im Spaßkampf (vorhandene PvP-Regeln der Spieler-Geschosse).
- Kreativ: kein Fahrzeugschaden, keine Panzerungsanzeige. Zuschauer: kein Einsteigen; Wechsel zu Zuschauer steigt aus.
- Gast speichert nie Fahrzeuge der Gastwelt.
- Anzeigenamen (texte.js): Gleiter „Schwebeflitzer“, Buggy „Kraterkäfer“, Flieger „Kometenjäger“. Kindgerecht: „verpufft“, nie „explodiert/zerstört“.
- Prüfen: `bash scripts/tests.sh` → `Fertig: N ok, 0 fehlgeschlagen` (ohne Sandbox). Spieltest per Chrome DevTools MCP auf `file://` in isoliertem Kontext.
- Commits mit `Fixes #N`; Task N ↔ Issue laut Tabelle am Ende (Meilenstein „Stufe 4: Fahrzeuge“).

## Review Focus

1. **Aussteigen an engen Stellen** (Fahrzeug in einer Höhle, an einer Wand, über Wasser oder hoch in der Luft): man landet nie in einem Block, sondern auf dem nächsten freien Platz in bis zu 3 Blöcken Umkreis, sonst obenauf → Test `aussteigePos findet freien Platz, nie im Block` (Task 2).
2. **Speichern im Fahrzeug, laden in alter Version oder ohne Fahrzeuge**: gespeicherte Spielerposition ist die Aussteigeposition; alte Welten bekommen genau einen Start-Gleiter, auch nach mehrfachem Laden → Tests `Speichern im Fahrzeug speichert Aussteigeposition`, `Start-Gleiter nur einmal` (Task 3).
3. **Fundort-Fahrzeug wird weggefahren und Spieler kommt zum Bauwerk zurück**: kein zweites Fahrzeug erscheint; nach Verpuffen kommt nur dieses eine zurück → Test `Fundort liefert genau einmal` (Task 3).
4. **Gast-Fahrer verliert die Verbindung mitten in der Fahrt**: Gastgeber gibt den Sitz frei, Fahrzeug bleibt stehen (Flieger sinkt), Mitfahrer sitzen weiter → Test `Abriss gibt Sitz frei` (Task 7).
5. **Schnelle Fahrt durch eine Gruppe Gegner mit Boss**: jeder Gegner wird höchstens alle 0,5 s gerammt, der Boss bewegt sich nicht und das Fahrzeug prallt zurück → Test `Rammen: Abklingzeit und Boss` (Task 5).

---

## Dateistruktur (neu bzw. geändert)

```
js/fahrzeuge.js          SC.FAHRZEUGE (Werte, Modelle), SC.Fahrzeug (Physik, Sitze, Panzerung, Rammen, Fundorte, Speichern)
js/fahren.js             Mixin für SC.Spiel: Einsteigen/Aussteigen, Steuerung, Bordgeschütz, Kreativ-Hinstellen, HUD-Anteil
js/render-fahrzeuge.js   SC.RenderFahrzeuge: Modelle aus Quadern mit Leuchtstreifen, Verpuffen-Funken
geändert: welt.js (welt.fahrzeuge), spielstand.js, spiel.js, survival.js, kampf.js, raum.js, render.js, render-mitspieler.js,
          eingabe.js, touch.js, gamepad.js, entwickler.js, ui.js, texte.js, audio.js, css/style.css, index.html, tests/index.html
```
Ladereihenfolge: `fahrzeuge.js` nach `wesen.js`; `fahren.js` nach `survival.js`; `render-fahrzeuge.js` nach `render-mitspieler.js`. Neue Testdateien `tests/test-fahrzeuge.js`, `tests/test-fahren.js` (nach den vorhandenen).

## Datenmodell

Fahrzeug `f` in `welt.fahrzeuge` (Map id → f):
`{ id, art: "gleiter"|"buggy"|"flieger", pos: [x,y,z] (Mitte unten), blick: Drehwinkel (wie Gegner), geschw: [3], panzerung, fundort: Schlüssel|null, heim: [x,y,z]|null (Fundort-Position), sitze: [figurId|null ×4], weg: false, wiederBei: Spielzeit|null, aufBoden }`
Gespeichert je Planet: `planeten[id].fahrzeuge = { <id>: { art, pos, blick, panzerung, fundort, heim, weg, wiederBei } }` (ohne Sitze, ohne Geschwindigkeit).

`SC.FAHRZEUGE[art]` (Ausgangswerte; Feintuning im Spieltest erlaubt, Tests prüfen nur Verhältnisse und Grenzen):

| Feld | gleiter | buggy | flieger |
|---|---|---|---|
| `tempo` (Blöcke/s) | 13 | 8.5 | 11 |
| `beschl` / `lenk` (rad/s) | 18 / 2.2 | 10 / 1.8 | 14 / 2.0 |
| `breite` × `hoehe` | 2.4 × 1.4 | 2.6 × 2.0 | 2.6 × 1.6 |
| `panzerung` | 120 | 250 | 160 |
| `geschuetz` | null | `{ schaden: 18, tempo: 40, abklingen: 0.35, farbe: "#ff5a3c" }` | `{ schaden: 14, tempo: 45, abklingen: 0.25, farbe: "#5ad1ff" }` |
| Bewegung | `schwebt: 0.6` (über Boden und Wasser) | `stufe: 1` (Räder, Schwerkraft) | `fliegt: true`, `maxHoehe: 118` |
| `sitze` | 4 Versätze `[x,y,z]` relativ zur Mitte, Sitz 0 vorn links |
| `modell` | Liste von Quadern `{ w,h,d,x,y,z,farbe,leuchtet }` wie `SC.GEGNER[...].teile` |

Erholung der Panzerung: 4 je Sekunde, wenn 8 s kein Treffer. Rammen: ab Tempo 4, Schaden `round(tempo * 1.5)`, Rückstoß 8 in Fahrtrichtung, je Gegner Abklingzeit 0,5 s; Boss: kein Schaden durch Wegschleudern, Fahrzeug-Geschwindigkeit × −0,5.

## Nachrichten (neu, Protokoll 2)

| `t` | Richtung | Inhalt |
|---|---|---|
| `einsteigen` | G→H | `id` (Fahrzeug) |
| `aussteigen` | G→H | – |
| `fahrzeuge` | H→G (15 Hz) | `liste: [{ id, art, pos, blick, geschw, panzerung, sitze, weg }]` für Fahrzeuge im Umkreis von 96 Blöcken (Ring) um den Empfänger |
| `zustand` | G→H | zusätzlich `fz: { id, pos, blick, geschw }`, wenn der Gast Fahrer ist |
| `verpufft` | H→G | `id, pos` (für Funken und Geräusch) |

---

### Task 1: Fahrzeugwerte und Physik

**Files:**
- Create: `js/fahrzeuge.js`
- Modify: `js/welt.js` (`this.fahrzeuge = new Map()` im Konstruktor), `index.html`, `tests/index.html`, `js/texte.js` (Namen)
- Test: `tests/test-fahrzeuge.js`

**Interfaces:**
- Produces: `SC.FAHRZEUGE` (Tabelle oben, `name` aus `SC.T.fahrzeuge[art]`); `SC.Fahrzeug.neu(welt, art, pos, blick, o) → f` (o: `{ id?, fundort?, heim? }`, legt in `welt.fahrzeuge` ab, volle Panzerung, leere Sitze); `SC.Fahrzeug.schritt(welt, f, e, dt)` mit `e = { vor, zurueck, links, rechts, hoch, runter }` (ohne Fahrer `e = null`): beschleunigt in Blickrichtung `f.blick`, lenkt, kollidiert über `SC.bewegeKoerper` mit quadratischer Grundfläche `breite`, Planet-Ring über `SC.mod`.

- [ ] **Step 1: Tests schreiben** in `tests/test-fahrzeuge.js` (Testwelt wie in `test-raum.js`: `new SC.Welt(new SC.Planet({ id: "start", seed: 1234 }))`, flacher Boden per `setzeBlock`):
  - `Fahrzeug: neu hat volle Panzerung und vier leere Sitze` → `f.panzerung === SC.FAHRZEUGE.buggy.panzerung`, `f.sitze` = `[null,null,null,null]`, `welt.fahrzeuge.get(f.id) === f`.
  - `Fahrzeug: Gas beschleunigt bis Höchsttempo, ohne Gas rollt es aus` → nach 3 s `vor` Tempo ≈ `tempo` (±5 %), nach weiteren 3 s ohne Eingabe < 1.
  - `Fahrzeug: Lenken dreht blick` → 1 s `links` ändert `f.blick` um ≈ `lenk` (nur bei Fahrt > 1).
  - `Fahrzeug: Gleiter schwebt über Wasser` → über Wasserfläche bleibt `pos[1]` ≥ Wasseroberfläche + 0.5.
  - `Fahrzeug: Buggy nimmt Stufe von 1 Block, nicht von 2` → gegen Stufe 1 hoch kommt er drüber, gegen Wand 2 bleibt er davor.
  - `Fahrzeug: Flieger steigt, sinkt, bleibt stehen, nie über maxHoehe` → `hoch` 20 s → `pos[1] <= 118`; ohne Eingabe bleibt Höhe gleich (±0.05); ohne Fahrer (`e = null`) sinkt er und landet auf dem Boden ohne in Blöcke zu geraten.
  - `Fahrzeug: fährt nie in Blöcke` → 5 s Vollgas gegen eine Wand: keine der Eckpunkte der Grundfläche steckt in einem festen Block.
- [ ] **Step 2: Tests laufen lassen** – `bash scripts/tests.sh` → neue Tests ❌ (`SC.Fahrzeug` fehlt).
- [ ] **Step 3: `js/fahrzeuge.js` umsetzen** mit Werten und Modellen aus der Tabelle; Modelle blockig, Star-Wars-angelehnt (Gleiter offener Landgleiter, Buggy große Räder und Geschützturm, Flieger Cockpit und Flügel), je 10–25 Quader, Leuchtstreifen `leuchtet: true`. In `index.html` und `tests/index.html` nach `wesen.js` laden.
- [ ] **Step 4: Tests grün** – `bash scripts/tests.sh` → `0 fehlgeschlagen`.
- [ ] **Step 5: Commit** `Fahrzeuge: Werte und Physik (Fixes #60)`

### Task 2: Sitze, Ein- und Aussteigen

**Files:**
- Modify: `js/fahrzeuge.js`
- Test: `tests/test-fahrzeuge.js`

**Interfaces:**
- Consumes: `SC.Fahrzeug.neu`, `SC.FAHRZEUGE[art].sitze`.
- Produces: `SC.Fahrzeug.naechstes(welt, pos, reichweite = 3.5) → f|null` (Ringabstand waagerecht zur Grundfläche, ohne `weg`); `SC.Fahrzeug.einsteigen(f, figurId) → sitz (0..3) | -1` (Fahrer, wenn Sitz 0 frei, sonst erster freier; schon drin → sein Sitz); `SC.Fahrzeug.aussteigen(f, figurId) → bool`; `SC.Fahrzeug.sitzVon(welt, figurId) → { f, sitz }|null`; `SC.Fahrzeug.sitzPos(f, sitz, planetGroesse) → [x,y,z]` (gedrehter Versatz); `SC.Fahrzeug.aussteigePos(welt, f, sitz) → [x,y,z]` (freier Platz für einen Spieler-Körper `SC.PHYSIK`, zuerst seitlich am Sitz, dann Umkreis 3, sonst auf dem Fahrzeug).

- [ ] **Step 1: Tests schreiben**:
  - `Sitze: erster wird Fahrer, weitere Mitfahrer, fünfter passt nicht` → Sitze 0,1,2,3, dann −1.
  - `Sitze: Fahrer steigt aus, niemand rückt nach` → nach `aussteigen(f, "a")` ist `sitze[0] === null`, `sitze[1] === "b"`; neuer Einsteiger `"e"` bekommt Sitz 0.
  - `Sitze: Doppeltes Einsteigen ändert nichts` → zweimal `"a"` → derselbe Sitz, nur einmal in `sitze`.
  - `Sitze: sitzPos dreht mit blick` → bei `blick` π/2 liegen die Sitze um 90° gedreht.
  - `aussteigePos findet freien Platz, nie im Block` → Fahrzeug in 3×3-Höhle, an Wand, über Wasser, in 60 Blöcken Höhe: Ergebnis-Körper schneidet keinen festen Block (Prüfung über `SC.bewegeKoerper(welt, p, 1, 0.001, SC.PHYSIK.breite, SC.PHYSIK.hoehe) === false` und Blockabfrage der Eckpunkte).
  - `naechstes: findet nur in Reichweite, nicht verpuffte, über die Ringgrenze` → Fahrzeug bei x = 2047, Spieler bei x = 1 wird gefunden.
- [ ] **Step 2: Tests ❌** – `bash scripts/tests.sh`.
- [ ] **Step 3: Umsetzen** in `js/fahrzeuge.js`.
- [ ] **Step 4: Tests grün.**
- [ ] **Step 5: Commit** `Fahrzeuge: Sitze, Ein- und Aussteigen (Fixes #61)`

### Task 3: Fundorte, Start-Gleiter, Speichern und Laden

**Files:**
- Modify: `js/fahrzeuge.js`, `js/spielstand.js` (`neu`, `migriere`, `ausWelt`), `js/spiel.js` (`_baue`: Fahrzeuge laden; `speichere`)
- Test: `tests/test-fahrzeuge.js`, `tests/test-spielstand.js`

**Interfaces:**
- Consumes: `SC.Bauwerke.inRegion(planet, rx, rz)` (Bauwerke mit `typ`, `x`, `z`, `breite`, `tiefe`, `schluessel`), `SC.Spiel.startpunkt(planet)`.
- Produces: `SC.Fahrzeug.FUNDORT_ART = { lager: "buggy", station: "flieger", herrenhaus: "gleiter" }`; `SC.Fahrzeug.fundortPos(welt, b) → [x,y,z]` (neben dem Bauwerk: `x = b.x + b.breite + 2`, `z = b.z + (b.tiefe >> 1)`, auf dem obersten festen Block, deterministisch); `SC.Fahrzeug.startPos(welt, startpunkt) → [x,y,z]` (freie, trockene Stelle 6–10 Blöcke vom Startpunkt, erste Treffer in fester Suchreihenfolge); `SC.Fahrzeug.fundorteNah(welt, pos, planDaten, r = 96)` legt für jedes Bauwerk mit Fundort-Art im Umkreis, dessen Schlüssel noch nicht in `welt.fahrzeuge` ist, das Fahrzeug an; `SC.Fahrzeug.sichereStart(welt, startpunkt)` legt `"start"` an, wenn es fehlt; `SC.Fahrzeug.ausDaten(welt, objekt)` / `SC.Fahrzeug.inDaten(welt) → objekt` (Speicherform siehe Datenmodell); `SC.Fahrzeug.wiederkehr(welt, spielzeit)` setzt fällige verpuffte Fundort-Fahrzeuge an `heim` mit voller Panzerung zurück. `SC.Spieler.prototype.ruhePos` (gesetzt von Task 4, solange man sitzt) – `SC.Spielstand.ausSpieler` speichert `ruhePos` statt `pos`, wenn vorhanden.

- [ ] **Step 1: Tests schreiben**:
  - `Fundort liefert genau einmal` → `fundorteNah` zweimal → ein Fahrzeug je Bauwerk; Fahrzeug wegbewegen und erneut `fundorteNah` → kein zweites.
  - `Fundorte sind deterministisch und passen zur Bauwerksart` → zwei Welten mit gleichem Seed liefern gleiche IDs, Arten und Positionen.
  - `Start-Gleiter nur einmal` → `sichereStart` dreimal → genau ein `"start"`; Position 6–10 Blöcke vom Startpunkt, nicht im Wasser.
  - `Speichern und Laden behält Lage, Panzerung, Verpuffen` → `inDaten` → JSON-Rundreise → `ausDaten` gleich (ohne Sitze).
  - `Alte Welt ohne fahrzeuge lädt` (test-spielstand.js) → `migriere` setzt `planeten.start.fahrzeuge = {}`, Format bleibt 2.
  - `Speichern im Fahrzeug speichert Aussteigeposition` (test-spielstand.js) → Spieler mit `ruhePos` → gespeicherte `spieler.pos` = `ruhePos`.
  - `Wiederkehr nach 120 s` → verpufftes Fundort-Fahrzeug mit `wiederBei` 120: bei 119 noch `weg`, bei 120 an `heim`, volle Panzerung.
- [ ] **Step 2: Tests ❌.**
- [ ] **Step 3: Umsetzen.** `_baue` lädt Fahrzeuge aus `planeten[aktuell].fahrzeuge` und ruft (nicht als Gast) `sichereStart`; `fundorteNah` und `wiederkehr` laufen im Spiel einmal pro Sekunde (bei Gastgeber für alle Spieler-Positionen). `ausWelt` schreibt `inDaten`.
- [ ] **Step 4: Tests grün.**
- [ ] **Step 5: Commit** `Fahrzeuge: Fundorte, Start-Gleiter, Speichern (Fixes #62)`

### Task 4: Darstellung und Fahren im Spiel (Einzelspiel)

**Files:**
- Create: `js/render-fahrzeuge.js`, `js/fahren.js`
- Modify: `js/render.js` (RenderFahrzeuge anlegen und pro Bild aufrufen; Verfolgerkamera), `js/render-mitspieler.js` (sitzende Haltung), `js/spiel.js` (`_bild`: im Fahrzeug `_fahren` statt `sp.schritt`), `js/survival.js` (im Fahrzeug kein Abbauen/Setzen/Ausweichen), `js/eingabe.js` (`KeyF` → Einmal-Aktion `benutzen`), `js/gamepad.js` (`K.HOCH` → `benutzen`), `js/touch.js` (Knopf `benutzen`, nur sichtbar in der Nähe eines Fahrzeugs oder im Fahrzeug), `js/texte.js`, `js/audio.js` (Klänge `einsteigen`, Motor), `css/style.css`
- Test: `tests/test-fahren.js`, `tests/test-eingabe.js`

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: `SC.Spiel.prototype.benutzen()` (einsteigen in `SC.Fahrzeug.naechstes` bzw. aussteigen; nicht im Zuschauermodus, nicht besiegt); `SC.Spiel.prototype._fahren(e, dt)` (Fahrer: `SC.Fahrzeug.schritt` mit Bewegungstasten, `hoch = springen`, `runter = sinken`; alle Insassen: `sp.pos = sitzPos`, `sp.geschw = f.geschw`, `sp.ruhePos = aussteigePos`); `SC.Spiel.prototype._imFahrzeug() → { f, sitz }|null`; beim Einsteigen `sp.ansicht = "aussen"` (vorherige gemerkt, beim Aussteigen zurück); `SC.Spiel.prototype.modus(m)` steigt bei `"zuschauer"` aus. `SC.RenderFahrzeuge(szene, planet)` mit `bild(welt, spielerPos, dt, licht)` und `verpuffen(pos)`. Kamera: `aussen` im Fahrzeug mit Abstand 7 statt 4.

- [ ] **Step 1: Tests schreiben** (`tests/test-fahren.js`, Spiel ohne Render wie in `test-mehrspieler.js` `mspSpielVoll`):
  - `Fahren: Benutzen neben dem Start-Gleiter steigt als Fahrer ein, nochmal steigt aus` → `_imFahrzeug().sitz === 0`, danach `null`, Spieler steht auf `aussteigePos`.
  - `Fahren: Fahrer bewegt das Fahrzeug, Spieler sitzt mit` → 1 s `vor` → Fahrzeug bewegt, `sp.pos` = `sitzPos(f, 0)`.
  - `Fahren: Im Fahrzeug kein Abbauen und Setzen` → Block vor dem Fahrzeug bleibt nach `abbauen`/`setzen`.
  - `Fahren: Zuschauer steigt aus und kann nicht einsteigen`.
  - `Fahren: Ansicht wechselt auf außen und zurück`.
  - `Eingabe: F ist benutzen` (test-eingabe.js).
- [ ] **Step 2: Tests ❌.**
- [ ] **Step 3: Umsetzen.** Mitspieler in Fahrzeugen sitzen (Beine angewinkelt). Touch-Knopf „🚗“ bzw. Beschriftung aus texte.js; Motorgeräusch leise, Höhe folgt Tempo.
- [ ] **Step 4: Tests grün; Spieltest per DevTools** (`file://`, isolierter Kontext): Start-Gleiter vom Startpunkt sichtbar, einsteigen, fahren, Buggy (Entwickler-Teleport zum Lager) über Stufen, Flieger steigen/sinken/landen, Laptop- und Tablet-Größe (`emulate` viewport `1024x768x2,mobile,touch`). Screenshot an den Nutzer schicken.
- [ ] **Step 5: Commit** `Fahrzeuge: Darstellung und Fahren (Fixes #63)`

### Task 5: Kampf mit Fahrzeugen

**Files:**
- Modify: `js/fahrzeuge.js` (Panzerung, Rammen), `js/kampf.js` (`trifftSpieler` mit Umleitung), `js/fahren.js` (Bordgeschütz, HUD), `js/survival.js` (Rammen und Wiederkehr im Takt), `js/ui.js` (`hud`: Panzerungsbalken über `extra.fahrzeug`), `js/texte.js`, `js/audio.js`
- Test: `tests/test-fahrzeuge.js`, `tests/test-fahren.js`

**Interfaces:**
- Produces: `SC.Fahrzeug.schaden(welt, f, menge, spielzeit) → { verpufft: bool, ausgestiegen: [figurId] }` (setzt `f.zuletztGetroffen`; bei 0 steigen alle aus, Fundort-Fahrzeug: `weg = true`, `wiederBei = spielzeit + 120`; freies Fahrzeug wird aus `welt.fahrzeuge` entfernt); `SC.Fahrzeug.erholung(f, dt, spielzeit)`; `SC.Fahrzeug.rammen(welt, f, uhr) → [{ gegner, schaden, boss }]` (Abklingzeit je Gegner in `f._gerammt[id]`); `Kampf.fahrzeugTreffer` (optionaler Rückruf `function(schaden) → bool`; `K.trifftSpieler` ruft ihn nach der Unverwundbarkeitsprüfung zuerst und liefert bei `true` `{ abgeprallt: false, schaden: 0, fahrzeug: true }`). Bordgeschütz: Angriffstaste als Fahrer mit `geschuetz` → `_spielerSchuss({ pos: Rohrspitze, richtung: sp.richtung(), tempo, schaden, team: "spieler", art: "laser", lebensdauer: 60 / tempo, farbe })`, Abklingzeit `abklingen`. Mitfahrer nutzen ihre Waffen unverändert.

- [ ] **Step 1: Tests schreiben**:
  - `Panzerung: Treffer auf Insassen gehen aufs Fahrzeug` → Spieler im Survival im Buggy, Gegner-Hieb → `kampf.werte.lp` unverändert, `f.panzerung` kleiner.
  - `Panzerung: leer → verpufft, alle stehen frei, Fundort-Fahrzeug kommt wieder` → `schaden` bis 0: `weg`, `sitze` leer, Spielerpositionen nicht im Block; freies Fahrzeug fehlt in `welt.fahrzeuge`.
  - `Panzerung: Kreativ nimmt keinen Schaden`.
  - `Panzerung: erholt sich nach 8 s ohne Treffer`.
  - `Rammen: Abklingzeit und Boss` → Gegner bei Tempo 10 → Schaden 15, Rückstoß; sofort nochmal → nichts; nach 0,5 s wieder; Boss → kein Rückstoß, `f.geschw` umgedreht und halbiert; unter Tempo 4 → nichts.
  - `Bordgeschütz: Buggy schießt mit Abklingzeit, Gleiter hat keins` → Anzahl Geschosse nach zwei Angriffen innerhalb 0,35 s = 1.
- [ ] **Step 2: Tests ❌.**
- [ ] **Step 3: Umsetzen.** Rammen und Erholung laufen nur dort, wo Gegner gerechnet werden (allein oder Gastgeber). Verpuffen mit Funken (`render.fahrzeuge.verpuffen`) und Geräusch wie besiegter Gegner. HUD-Balken „Panzerung“ nur im Survival, nur im Fahrzeug.
- [ ] **Step 4: Tests grün; Spieltest**: Gegner per Entwicklerwerkzeug erzeugen, rammen, Bordlaser, Fahrzeug verpuffen lassen.
- [ ] **Step 5: Commit** `Fahrzeuge: Kampf, Panzerung, Rammen (Fixes #64)`

### Task 6: Kreativ-Hinstellen und Entwicklerwerkzeuge

**Files:**
- Modify: `js/fahren.js`, `js/ui.js` (`zeigeBlockauswahl`: Bereich „Fahrzeuge“ mit drei Knöpfen, Rückruf `beiFahrzeug(art)`), `js/entwickler.js` (Auswahl Art + „Erscheinen“, „Fahrzeuge weg“), `js/texte.js`
- Test: `tests/test-fahren.js`, `tests/test-entwickler.js`

**Interfaces:**
- Produces: `SC.Spiel.prototype.fahrzeugHinstellen(art) → f` (vor dem Spieler, 5 Blöcke in Blickrichtung, auf dem Boden, ID `"frei-…"`; im Raum als Gast: Wunsch an den Gastgeber, siehe Task 7); `SC.Spiel.prototype.fahrzeugeWeg()` (freie im Umkreis 64 entfernen, Fundort-Fahrzeuge unbesetzt an `heim` zurück); Kreativ: Abbauen-Taste auf ein freies Fahrzeug in 6 Blöcken (Strahl gegen Grundfläche über `SC.Wesen.strecke`) entfernt es, wenn es leer ist.

- [ ] **Step 1: Tests schreiben**: `Kreativ: Fahrzeug hinstellen und wieder entfernen`; `Kreativ: Fundort-Fahrzeug lässt sich nicht entfernen`; `Entwickler: Erscheinen in jedem Modus, Fahrzeuge weg schickt Fundort-Fahrzeuge heim`.
- [ ] **Step 2: Tests ❌.**
- [ ] **Step 3: Umsetzen.**
- [ ] **Step 4: Tests grün; Spieltest** Blockauswahl und F3-Panel.
- [ ] **Step 5: Commit** `Fahrzeuge: Kreativ und Entwicklerwerkzeuge (Fixes #65)`

### Task 7: Fahrzeuge im gemeinsamen Spiel

**Files:**
- Modify: `js/raum.js` (Protokoll 2, Nachrichten siehe Tabelle), `js/spiel.js`, `js/fahren.js`, `js/survival.js`
- Test: `tests/test-raum.js`, `tests/test-mehrspieler.js`

**Interfaces:**
- Consumes: Tasks 1–6.
- Produces: Gastgeber: `HN.einsteigen(c, n)`, `HN.aussteigen(c)`, Fahrer-Lage aus `zustand.fz` übernehmen, wenn `c.id` auf Sitz 0 dieses Fahrzeugs sitzt; `H.takt` sendet je Gast `fahrzeuge` (15 Hz, Umkreis 96); `H._weg(c)` und `hinauswerfen` lassen den Gast aussteigen; `H.treffer(id, …)` leitet Treffer auf sitzende Gäste als `SC.Fahrzeug.schaden` um und schickt keinen `treffer`; bei Verpuffen `verpufft` an alle. Gast: `G.einsteigen(id)`, `G.aussteigen()`, `GN.fahrzeuge` spiegelt (Lage glätten wie `spiegleWesen`, eigenes gefahrenes Fahrzeug nicht überschreiben), `GN.verpufft`; Gast-Takt hängt `fz` an, wenn er fährt; Gast-Hinstellen (Kreativ/Entwickler) als Nachricht `fzHinstellen { art, pos, blick }` an den Gastgeber.

- [ ] **Step 1: Tests schreiben** (Speicher-Netz):
  - `Raum: Protokoll 1 wird abgelehnt` → alter Gast bekommt `version`.
  - `Mehrspieler: Vier Spieler in einem Fahrzeug, fünfter Wunsch scheitert` (3 Gäste + Gastgeber).
  - `Mehrspieler: Gast fährt, Gastgeber und Mitfahrer sehen die Lage` → nach `mspLauf` Abweichung < 0,5 Blöcke.
  - `Mehrspieler: Treffer auf sitzenden Gast gehen aufs Fahrzeug` → keine `treffer`-Nachricht, Panzerung sinkt beim Gastgeber und beim Gast (Spiegel).
  - `Abriss gibt Sitz frei` → Gast-Fahrer trennt → `sitze[0] === null`, Fahrzeug bleibt, Mitfahrer bleiben.
  - `Mehrspieler: Gast speichert keine Fahrzeuge` → nach Verlassen hat die eigene Welt des Gastes `fahrzeuge` unverändert.
- [ ] **Step 2: Tests ❌.**
- [ ] **Step 3: Umsetzen.**
- [ ] **Step 4: Tests grün; echte Verbindung** mit zwei isolierten Tabs auf `localhost`: Gast steigt beim Gastgeber ein, Gast fährt, Gastgeber fährt mit Gast.
- [ ] **Step 5: Commit** `Fahrzeuge im gemeinsamen Spiel (Fixes #66)`

### Task 8: Abschluss 0.7.0

**Files:**
- Modify: `index.html` (`var V="0.7.0"`), `docs/ROADMAP.md`

- [ ] **Step 1: Gesamtprüfung** `bash scripts/tests.sh` → `0 fehlgeschlagen`; Spieltest aller Fahrzeuge in Survival und Kreativ, Tablet-Größe, Gamepad-Belegung im Code geprüft; alter Spielstand (Export 0.6.x aus `tests/`-Fixture oder per `SC.Spielstand.neu` ohne `fahrzeuge`) lädt.
- [ ] **Step 2: Version 0.7.0, Roadmap** (Stand, nächster Schritt: Gerätetest durch den Nutzer in der Test-Vorschau).
- [ ] **Step 3: Commit** `Version 0.7.0: Fahrzeuge (Fixes #67)`; nicht pushen ohne Auftrag.

## Issues

| Task | Issue | Label |
|---|---|---|
| 1 Fahrzeugwerte und Physik | #60 | fahrzeuge |
| 2 Sitze, Ein- und Aussteigen | #61 | fahrzeuge |
| 3 Fundorte, Start-Gleiter, Speichern | #62 | fahrzeuge, welt |
| 4 Darstellung und Fahren | #63 | fahrzeuge, steuerung |
| 5 Kampf mit Fahrzeugen | #64 | fahrzeuge, kampf |
| 6 Kreativ und Entwicklerwerkzeuge | #65 | fahrzeuge |
| 7 Gemeinsames Spiel | #66 | fahrzeuge, multiplayer |
| 8 Abschluss 0.7.0 | #67 | fahrzeuge |
