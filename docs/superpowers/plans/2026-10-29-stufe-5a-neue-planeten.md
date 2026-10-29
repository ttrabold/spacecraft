# Stufe 5a: Neue Planeten – Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zwei neue Planeten (Glutfrost, Rankenmoor) mit eigener Landschaft, Blöcken, Gegnern und Bossen, Planetenwechsel allein und im gemeinsamen Spiel (vorerst über F3), als Version 0.8.0.

**Architecture:** Eine Planetentabelle `SC.PLANETEN` beschreibt je Planet Name, Palette, Landschaft, Gegner, Bosse und Stufenaufschlag. `SC.Generator` wählt nach `planet.landschaft` die Landschaftsregeln; der Startplanet läuft unverändert über den bisherigen Pfad. Der Planetenwechsel speichert den aktuellen Planeten und startet die Welt auf dem neuen neu (wie `starte`); im Raum schickt der Gastgeber allen Gästen die neue Welt wie beim Beitritt.

**Tech Stack:** wie bisher (klassische Skripte unter `SC`, three.js r158, PeerJS über `SC.Netz`).

**Spec:** `docs/superpowers/specs/2026-10-29-stufe-5-planeten-raumflug-design.md` (nur Teil 5a)

## Global Constraints

- Alles aus AGENTS.md: keine Module, `file://`, ältere iOS-Safari, Texte nur in `js/texte.js`, Ladereihenfolge in `index.html` und `tests/index.html` gleich, Version nur in `index.html`.
- Version am Ende `var V="0.8.0"`.
- **Startplanet unverändert:** gleiche Chunks, Bauwerke, Stufen und Bosse wie bisher. Prüfsummen (FNV-1a 32 Bit über `new SC.Generator(new SC.Planet({id:"start",seed:1234,generatorVersion:2})).chunk(cx,cz)`): `0,0 → 4113621621`, `5,7 → 4105641303`, `64,100 → 3441392342`, `127,3 → 2523961076`. Bauwerke `inRegion(p, 0..2, 1)`: `herrenhaus:93:53:164:14:schattenritter`, `dungeon:68:23:138:25:panzerkoloss`, `herrenhaus:170:51:180:18:schattenritter`, `dungeon:165:20:225:21:schattenritter`, `herrenhaus:302:49:144:15:schattenritter`, `dungeon:270:17:187:24:panzerkoloss` (Format `typ:x:y:z:stufe:bossArt`).
- `SC.FORMAT` bleibt 2, `SC.GENERATOR_VERSION` bleibt 2. Neue Planeten werden in `daten.planeten` beim ersten Besuch angelegt: Seed `SC.hashText(daten.seed + ":" + id)`, Größe 2048, Palette = Planet-Id.
- Blöcke neu (IDs fest): `LAVA: 29`, `EIS: 30`, `SCHLAMM: 31`, `BASALT: 32`. Neue Texturnamen `lava`, `eis`, `schlamm`, `basalt` (auch in der Startpalette, damit der Atlas vollständig ist).
- Planet-Ids und Namen: `start` (Name aus `SC.T.planeten.start` = „Heimatplanet“), `glutfrost` („Glutfrost“), `rankenmoor` („Rankenmoor“).
- Gegner neu: `lavagolem`, `frostkrabbler`, Boss `magmakoenig` (Glutfrost); `rankenschleicher`, `sumpfspucker`, Boss `sumpfkoloss` (Rankenmoor). Anzeigenamen „Lavagolem“, „Frostkrabbler“, „Magmakönig“, „Rankenschleicher“, „Sumpfspucker“, „Sumpfkoloss“.
- Stufenaufschlag auf Ortsstufen: start 0, glutfrost +8, rankenmoor +15; Stufen höchstens `SC.Werte.MAX_STUFE`.
- Mehrspieler-Protokoll `SC.NETZ_PROTOKOLL = 3` (neue Nachricht `planet`).
- Kindgerecht: Lava „stößt heraus“, nichts verbrennt sichtbar; besiegte Gegner verpuffen.
- Prüfen: `bash scripts/tests.sh` (ohne Sandbox) → `0 fehlgeschlagen`; `bash scripts/tests.sh <Text>` für einzelne Tests. Spieltest per Chrome DevTools MCP (`file://`, Tabs danach auf `about:blank`).
- Commits mit `Fixes #N` laut Tabelle am Ende (Meilenstein „Stufe 5: Raumschiffe und Planeten“).

## Review Focus

1. **Alter Spielstand ohne die neuen Planeten**: Laden ändert den Startplaneten nicht, `planetAnlegen` erzeugt die neuen erst beim Besuch, zweimal anlegen ändert nichts → Test `Planet anlegen ist idempotent, Startplanet bleibt` (Task 1).
2. **Landepunkt auf einem Planeten voller Lava oder Sumpf**: Der Landepunkt liegt auf festem, trockenem Boden ohne Lava in direkter Nähe → Test `Landepunkt ist sicher` (Task 2).
3. **Spieler steht beim Planetenwechsel in einem Fahrzeug**: Er steigt vorher aus, das Fahrzeug bleibt auf dem alten Planeten gespeichert → Test `Planetenwechsel im Fahrzeug steigt aus` (Task 5).
4. **Gast hat beim Planetenwechsel des Gastgebers offene Blockwünsche**: Sie werden verworfen, nicht auf dem neuen Planeten ausgeführt → Test `Planetenwechsel verwirft offene Wünsche` (Task 6).
5. **Spieler fällt in einen Lavasee ohne Ufer in Reichweite**: Er wird nach oben herausgestoßen und landet nicht in einer Endlosschleife aus Schaden → Test `Lava stößt nach oben heraus` (Task 3).

---

## Dateistruktur

```
js/planeten.js        SC.PLANETEN (Tabelle), SC.Planeten.anlegen(daten, id), SC.Planeten.def(planet) – nach planet.js
js/landschaft.js      SC.LANDSCHAFTEN.glutfrost / .rankenmoor: Höhe, Biom, Oberfläche, Flüssigkeit, Bäume – nach generator.js
geändert: bloecke.js, planet.js (Paletten, landschaft), generator.js (Verteiler), texturen.js (Muster lava/eis/schlamm/basalt),
          bauwerke.js (Boss/Stufe aus der Planetentabelle), auftauchen.js (Arten aus der Planetentabelle), gegner.js, ki.js,
          spieler.js (Lava, Eis, Schlamm), fahrzeuge.js (Lava), kampf.js (Lavaschaden), spielstand.js, spiel.js, survival.js,
          raum.js, entwickler.js, ui.js (Ankunftsanzeige), texte.js, css/style.css, index.html, tests/index.html
Tests neu: tests/test-planeten.js
```

---

### Task 1: Planetentabelle, Paletten, neue Blöcke

**Files:** Create `js/planeten.js`; Modify `js/bloecke.js`, `js/planet.js`, `js/texturen.js`, `js/texte.js`, `js/spielstand.js`, `index.html`, `tests/index.html`; Test `tests/test-planeten.js`

**Interfaces:**
- Produces: `SC.PLANETEN[id] = { id, name, palette, landschaft, stufenBonus, gegner: { station, lager, herrenhaus, dungeon, nacht: [Arten] }, boss: { herrenhaus, dungeon } }` für `start`, `glutfrost`, `rankenmoor` (Start: Arten und Bosse genau wie heute in `auftauchen.js`/`bauwerke.js`); `SC.PLANET_REIHENFOLGE = ["start", "glutfrost", "rankenmoor"]`; `SC.Planeten.anlegen(daten, id) → planetDaten` (legt `daten.planeten[id]` an, falls fehlend; Felder wie in `SC.Spielstand.neu` plus `landepunkt: null`); `SC.Planeten.def(planet) → SC.PLANETEN[planet.landschaft]`; `SC.Planet` bekommt `landschaft` (= `o.landschaft || (SC.PLANETEN && SC.PLANETEN[o.id] ? o.id : "start")`). Blöcke `SC.B.LAVA/EIS/SCHLAMM/BASALT` (Lava: nicht fest, durchsichtig, leuchtet 15, Lichtfarbe `[1.0, 0.5, 0.15]`, nicht zerstörbar, in Auswahl; Eis: fest, durchsichtig; Schlamm, Basalt: fest). Paletten `SC.PALETTEN.glutfrost`, `SC.PALETTEN.rankenmoor` (alle Texturen + Himmel/Sonne/Mond); Startpalette um `lava, eis, schlamm, basalt` ergänzt.

- [ ] **Step 1: Tests in `tests/test-planeten.js`:** `Startplanet: Chunks und Bauwerke unverändert` (Prüfsummen und Bauwerkszeilen aus Global Constraints); `Planetentabelle: drei Planeten mit Namen, Palette, Gegnern und Bossen` (jede Art existiert in `SC.GEGNER`, jede Palette in `SC.PALETTEN` hat alle Namen aus `SC.Mesher.atlasNamen`); `Planet anlegen ist idempotent, Startplanet bleibt` (alter Stand ohne `glutfrost` → `anlegen` erzeugt Seed `SC.hashText(seed + ":glutfrost")`, zweites Anlegen gibt dasselbe Objekt zurück, `daten.planeten.start` unverändert per JSON-Vergleich); `Neue Blöcke haben feste IDs und Eigenschaften` (29–32, Lava nicht fest und leuchtend).
- [ ] **Step 2:** `bash scripts/tests.sh Planet` → rot.
- [ ] **Step 3:** Umsetzen. Texturmuster in `texturen.js`: `lava` (glühende Adern), `eis` (hell, wenige Risse, leicht durchsichtig a≈200), `schlamm`, `basalt`.
- [ ] **Step 4:** Suite grün (Startplanet-Prüfsummen müssen weiter passen).
- [ ] **Step 5:** Commit `Planeten: Tabelle, Paletten, Lava, Eis, Schlamm, Basalt (Fixes #70)`

### Task 2: Landschaften Glutfrost und Rankenmoor

**Files:** Create `js/landschaft.js`; Modify `js/generator.js`, `js/spiel.js` (`SC.Spiel.startpunkt` → Landepunkt je Landschaft); Test `tests/test-planeten.js`

**Interfaces:**
- Consumes: Task 1.
- Produces: `SC.LANDSCHAFTEN[art] = { hoehe(gen, x, z) → int, biom(gen, x, z, h) → Text, saeule(gen, x, z, h, biom) → { oben, unter, fluessig (Block-Id oder null), fluessigBis (y) }, baum(gen, x, z, biom, hash) → null | { hoehe, krone, stamm, blatt } }`; `SC.Generator.prototype.chunk/hoehe/biom` verzweigen nur, wenn `planet.landschaft !== "start"` (Startpfad bleibt Zeichen für Zeichen). Glutfrost: Biome `eisfeld` (Eis/Schnee), `gletscher` (hoch, Eis), `lavasee` (Basalt-Ufer, Lava bis Meereshöhe), `vulkan` (Basaltkegel mit Lavakrater), Bäume selten (kahle Stämme). Rankenmoor: Biome `dschungel` (Gras, Riesenbäume 10–16 hoch, Krone 3–4), `sumpf` (Schlamm, flaches Wasser 1–2 Blöcke, Leuchtpilze häufig), `see`. Höhlen und Bauwerke wie bisher.
- `SC.Spiel.startpunkt(planet)` meidet Lava, Wasser und Schlamm im Umkreis von 2 Blöcken.

- [ ] **Step 1: Tests:** `Glutfrost: deterministisch, hat Eis, Lava und Basalt` (zwei Generatoren gleicher Seed → gleiche Prüfsumme; über 6 Chunks Lava > 0, Eis > 0, Basalt > 0, kein Gras); `Rankenmoor: deterministisch, hat Schlamm, Wasser und hohe Bäume` (Stammsäule ≥ 10 Blöcke irgendwo in 9 Chunks); `Landepunkt ist sicher` (für beide Planeten und 3 Seeds: Block darunter fest und nicht Lava/Schlamm, zwei Blöcke darüber frei, kein Lava/Wasser im Umkreis 2).
- [ ] **Step 2:** rot. **Step 3:** umsetzen. **Step 4:** grün (Startplanet-Test weiter grün). Kurzer Blick per DevTools (F3-Teleport folgt erst in Task 5; hier per `SC.spiel.starte` mit Planet-Daten) und Screenshot je Planet an den Nutzer.
- [ ] **Step 5:** Commit `Planeten: Landschaften Glutfrost und Rankenmoor (Fixes #71)`

### Task 3: Lava, Eis und Schlamm im Spiel

**Files:** Modify `js/spieler.js`, `js/kampf.js`, `js/fahrzeuge.js`, `js/survival.js`, `js/audio.js` (Zischen); Test `tests/test-planeten.js`

**Interfaces:**
- Produces: `SC.Spieler.prototype.schritt`: Lava wie Wasser zum Schwimmen (`imLava`), Eis unter den Füßen → Geschwindigkeit nähert sich dem Ziel mit Faktor `min(1, 3·dt)` statt sofort; Schlamm unter den Füßen oder in Hüfthöhe → Tempo × 0,6. `SC.Kampf.prototype.lava(dt) → { schaden }`: im Survival alle 0,5 s Schaden 6 (mit Schwierigkeit, durch Rüstung gemindert wie andere Treffer) und Schub nach oben (`geschw[1] = 9`), Kreativ/Zuschauer nichts. Fahrzeuge: Lava zählt für den Gleiter als Oberfläche wie Wasser; Buggy/Flieger in Lava nehmen im Survival 15 Panzerung/s.

- [ ] **Step 1: Tests:** `Lava stößt nach oben heraus` (Spieler in 4 Blöcke tiefem Lavabecken, Survival: nach 3 s Spielzeit-Schritten ist er oberhalb der Lava; Schaden insgesamt ≤ 6·6, lp > 0 bei vollem Leben; Kreativ: kein Schaden); `Eis rutscht nach, Schlamm bremst` (gleiche Eingabe 0,5 s: auf Eis nach Loslassen noch > 1 Block Weg in 0,3 s, auf Stein < 0,1; auf Schlamm Strecke ≈ 0,6× Stein ±10 %); `Gleiter schwebt über Lava, Buggy nimmt Schaden`.
- [ ] **Step 2–4:** rot → umsetzen → grün.
- [ ] **Step 5:** Commit `Planeten: Lava, Eis und Schlamm (Fixes #72)`

### Task 4: Neue Gegner und Bosse

**Files:** Modify `js/gegner.js`, `js/ki.js`, `js/bauwerke.js`, `js/auftauchen.js`, `js/texte.js`, `js/audio.js`; Test `tests/test-planeten.js`, `tests/test-ki.js`

**Interfaces:**
- Consumes: `SC.PLANETEN` (Task 1).
- Produces: sechs Einträge in `SC.GEGNER` mit vorhandenen Verhalten: `lavagolem` (`nahkampf`, langsam ≈1,8, viel LP, Glutteile `leuchtet`), `frostkrabbler` (`nahkampf`, schnell ≈4,6, wenig LP), `magmakoenig` (`koloss`, boss, zusätzlich `waffe: { art: "glut", rate: 2.5, tempo: 12, farbe: "#ff7a2a" }` – wirft Glutbrocken wie Spucke, wenn das Ziel außerhalb der Hiebreichweite ist), `rankenschleicher` (`nahkampf`, `sprung: { reichweite: 6, rate: 4 }` – springt aus 6 Blöcken an), `sumpfspucker` (`spucker`, Schleim grün), `sumpfkoloss` (`koloss`, boss, `ruft: { art: "rankenschleicher", rate: 12, max: 3 }`). Werte so, dass sie bei gleicher Stufe zum Startplaneten passen; der Stufenaufschlag macht sie stärker. KI: `koloss` nutzt `def.waffe` und `def.ruft`, `nahkampf` nutzt `def.sprung` (neue Aktionen als Rückgabe von `SC.KI.schritt`, Survival legt gerufene Gegner mit `SC.Wesen.neu` an). `SC.Bauwerke.inRegion`: `bossArt` und Stufe aus `SC.Planeten.def(planet)` (Start unverändert), Stufe + `stufenBonus`, höchstens `MAX_STUFE`. `SC.Auftauchen`: Arten je Bauwerkstyp und nachts aus der Planetentabelle.

- [ ] **Step 1: Tests:** `Neue Gegner haben Modelle mit Leuchtteilen und Texte`; `Bauwerke auf Glutfrost haben Magmakönig, Stufen mit Aufschlag` (inRegion über 4 Regionen: alle Bosse aus der Tabelle, jede Stufe ≥ Ortsstufe-Minimum + 8 oder MAX); `Startplanet: Chunks und Bauwerke unverändert` bleibt grün; KI-Tests in `test-ki.js`: `Magmakönig wirft aus der Ferne`, `Sumpfkoloss ruft höchstens 3 Schleicher`, `Rankenschleicher springt an`.
- [ ] **Step 2–4:** rot → umsetzen → grün. Spieltest: Gegner per F3 erscheinen lassen, Screenshot.
- [ ] **Step 5:** Commit `Planeten: neue Gegner und Bosse (Fixes #73)`

### Task 5: Planetenwechsel allein

**Files:** Modify `js/spiel.js`, `js/survival.js`, `js/fahren.js`, `js/entwickler.js`, `js/ui.js`, `js/texte.js`, `css/style.css`; Test `tests/test-planeten.js`, `tests/test-entwickler.js`

**Interfaces:**
- Consumes: Tasks 1–2.
- Produces: `SC.Spiel.prototype.landepunkt() → [x,y,z]` (Landepunkt des aktuellen Planeten; Start: `daten.startpunkt`; sonst `planeten[id].landepunkt`, beim ersten Besuch per `SC.Spiel.startpunkt` gesetzt). Alle Wiederbelebungen (`wiederbeleben(...)` in survival.js, raum.js PvP, Gast) nutzen `landepunkt()` bzw. im Raum den Landepunkt des Gastgebers. `SC.Spiel.prototype.wechslePlanet(id) → Promise`: steigt aus einem Fahrzeug aus, speichert (`ausWelt` des alten Planeten), `SC.Planeten.anlegen`, setzt `aktuellerPlanet`, Spieler auf `landepunkt()` (Blick 0), startet die Welt neu wie `starte`; nicht als Gast. Start-Gleiter: `SC.Fahrzeug.sichereStart` am Landepunkt jedes Planeten. Nach dem Wechsel `ui.ankunft(name)`: großer Planetenname, 3 s eingeblendet, dann ausgeblendet (CSS-Klasse `ankunft`). F3: Auswahl `#ew-planet` mit den drei Planeten + Knopf `data-ew="planet"` (als Gast deaktiviert).

- [ ] **Step 1: Tests:** `Planetenwechsel: neuer Planet, Landepunkt, zurück zum alten mit seinen Änderungen` (Block auf Start setzen, nach Glutfrost wechseln → `welt.planet.landschaft === "glutfrost"`, Spieler am Landepunkt; zurück → Block noch da); `Planetenwechsel im Fahrzeug steigt aus` (Fahrzeug bleibt in `planeten.start.fahrzeuge`); `Wiederbelebung am Landepunkt des aktuellen Planeten`; `Speichern und Laden auf Rankenmoor startet dort`; Entwickler: `F3 reist zu Glutfrost`.
- [ ] **Step 2–4:** rot → umsetzen → grün. Spieltest beider Planeten per F3 mit Leistungsmessung (Bildzeit und Zeichenaufrufe wie in 0.7.3 gemessen, Sichtweite 10) – nicht schlechter als auf dem Startplaneten.
- [ ] **Step 5:** Commit `Planeten: Planetenwechsel, Landepunkte, Ankunft (Fixes #74)`

### Task 6: Planetenwechsel im gemeinsamen Spiel

**Files:** Modify `js/netz.js` (Protokoll 3), `js/raum.js`, `js/spiel.js`; Test `tests/test-raum.js`, `tests/test-mehrspieler.js`

**Interfaces:**
- Consumes: Task 5.
- Produces: `SC.Gastgeber.prototype.setzeWelt(welt)` (Blockereignisse der neuen Welt abonnieren, alte ignorieren); `SC.Gastgeber.prototype.planetWechsel()` → an jeden verbundenen Gast `{ t: "planet" }`, danach dieselbe Folge wie beim Beitritt (`willkommen` mit `_weltInfo()` des neuen Planeten und Position = Landepunkt, `chunk`s, `bereit`), Wunschzähler je Gast zurück auf 0; die Folge aus `_annehmenRoh` wird dafür als `_sendeWelt(c, pos)` herausgelöst. Gast: `GN.planet` setzt `_planetWechsel = true` und verwirft offene Wünsche; `SC.Spiel._gastBereit` baut bei `_planetWechsel` die Gastwelt neu auf (wie beim ersten Eintritt), behält Raum, Figur und Rucksack. `wechslePlanet` ruft als Gastgeber nach dem Neustart `raum.setzeWelt(welt)` und `raum.planetWechsel()`.

- [ ] **Step 1: Tests:** `Raum: Protokoll 2 wird abgelehnt`; `Mehrspieler: Gastgeber wechselt Planet, Gast kommt mit` (Gast hat danach `welt.planet.id === "glutfrost"`, steht am Landepunkt, Rucksack unverändert, Mitspieler sichtbar); `Planetenwechsel verwirft offene Wünsche` (Gast setzt Block ohne Bestätigung, Wechsel → Block erscheint nicht auf Glutfrost und auch nicht später auf Start); `Mehrspieler: Blockänderung nach dem Wechsel kommt an` (alte Welt sendet nichts mehr).
- [ ] **Step 2–4:** rot → umsetzen → grün. Echte Verbindung mit zwei Tabs (`localhost`): Gastgeber reist per F3, Gast kommt mit.
- [ ] **Step 5:** Commit `Planeten: Planetenwechsel im gemeinsamen Spiel (Fixes #75)`

### Task 7: Abschluss 0.8.0

- [ ] **Step 1:** Volle Suite grün; Spieltest beider Planeten (Survival: Lava, Eis, Gegner, Boss), Tablet-Größe, Leistung gemessen.
- [ ] **Step 2:** `var V="0.8.0"`, Roadmap (Stand, nächster Schritt: Gerätetest, danach Plan 5b).
- [ ] **Step 3:** Commit `Version 0.8.0: Neue Planeten (Fixes #76)`; nicht pushen ohne Auftrag.

## Issues

| Task | Issue | Label |
|---|---|---|
| 1 Planetentabelle, Paletten, Blöcke | #70 | weltraum, welt |
| 2 Landschaften | #71 | weltraum, welt |
| 3 Lava, Eis, Schlamm | #72 | welt |
| 4 Gegner und Bosse | #73 | kampf |
| 5 Planetenwechsel allein | #74 | weltraum |
| 6 Planetenwechsel gemeinsam | #75 | weltraum, multiplayer |
| 7 Abschluss 0.8.0 | #76 | weltraum |
