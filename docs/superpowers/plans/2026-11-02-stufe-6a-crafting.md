# Stufe 6a: Crafting – Rohstoffe, Werkbank, Bauteile, Waffen, Rüstung – Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Kinder sammeln Rohstoffe, stellen eine Werkbank auf und stellen daran Bauteile (Fenster, Leitern, Fackeln, Truhen, Zäune, Türen), Handwaffen mit Kristallfarbe und Rüstung her; gefundene Waffen und Rüstung werden seltener.

**Architecture:** Neue Blöcke (Erze, Kristalle, Gegnerteile, Werkbank, Bauteile) in der Blocktabelle; Rezepte als Tabelle in `js/crafting.js` mit reiner Logik gegen den Rucksack; gebaute Gegenstände erzeugt `SC.Beute.baue` im selben Format wie Beute. Nicht-Würfel-Formen bekommt der Mesher über ein `form`-Feld der Blockdefinition. Zustände (Tür offen/zu, Leiterrichtung) stecken in eigenen Block-IDs, damit Speichern und Mehrspieler unverändert funktionieren.

**Tech Stack:** Klassische Skripte unter `SC`, kein Build, keine Abhängigkeiten, auch per `file://`; Tests im Browser (`tests/index.html`, Kurzform `bash scripts/tests.sh` bzw. unter WSL `bash scripts/tests-wsl.sh`, mit Text-Filter als Argument).

**Spec:** `docs/superpowers/specs/2026-11-02-crafting-design.md`. Meilenstein auf GitHub: „Stufe 6a: Crafting – Rohstoffe, Werkbank, Bauteile, Waffen, Rüstung“.

## Global Constraints

- Keine ES-Module, kein Bundler, kein npm; Ladereihenfolge in `index.html` und `tests/index.html` identisch halten; neue Dateien in beide eintragen.
- Auch ältere Safari-Versionen (iOS): kein `for…of` über Map-Iteratoren, keine neuen Sprachmerkmale ohne Not.
- Block-IDs nie umnummerieren, nur anhängen (ab 33). Eine ID passt in 1 Byte (höchstens 255).
- Spielstände dürfen nie brechen: neue Felder beim Laden mit Standardwerten nachziehen; bestehende Welten behalten ihr Terrain (Generator-Version, siehe Task 2).
- Code-Kommentare, Commit-Nachrichten, Docs und Texte auf Deutsch; Texte in `js/texte.js`.
- Kindgerecht; bedienbar mit Tastatur/Maus, Touch und Controller.
- Version nach jeder Änderung an ausgelieferten Dateien erhöhen (`var V` in `index.html`), Stufe 6a = MINOR.
- Commits verweisen auf Issues (`Fixes #N`); nicht pushen, ohne dass der Nutzer es verlangt; Test-Repo vor `main`.
- Rohstoffstufen (Spec): gewöhnlich Holz/Stein; ungewöhnlich Eisenerz; selten Titan; episch Glutstahl (Glutfrost) und Moorsilber (Rankenmoor); legendär Sternenmetall. Kristalle: Blau, Grün, Rot, Gelb, Violett, Weiß.

## Review Focus

- Voller Rucksack (36 Plätze): Herstellen darf keine Rohstoffe verbrauchen, wenn das Ergebnis nicht hineinpasst (Test in Task 4).
- Alte Speicherstände: Welt mit Generator-Version 2 bekommt keine Erze nachträglich in bestehende Chunks und lädt ohne Fehler (Task 2).
- Tür/Leiter/Zaun als Block im Raum eines Mitspielers oder in einer Höhle: Aufstellen auf Luft ohne Stützblock bzw. in einen Spieler hinein wird abgelehnt (Task 8, 9).
- Gast bedient Werkbank, Tür und Truhe: Zustand kommt über den Gastgeber an, Rohstoffe werden nur einmal abgezogen (Task 5, 9, 10).
- Abbauen von Tür-Varianten, Leiter-Richtungen und offener Tür liefert immer den Grund-Block, nie eine Variante (Task 9).

## Dateiübersicht

| Datei | Zweck |
|---|---|
| `js/bloecke.js` (ändern) | neue IDs 33–63, Tabelleneinträge, `form`/`klettern`-Felder |
| `js/texturen.js`, `js/texte.js` (ändern) | Muster und Namen der neuen Blöcke und Menütexte |
| `js/abbau.js` (ändern) | Abbauzeiten; `ergibt` bildet Varianten auf Grund-Blöcke ab |
| `js/generator.js`, `js/landschaft.js` (ändern) | Erze und Kristalle (nur Generator-Version ≥ 3) |
| `js/crafting.js` (neu) | `SC.REZEPTE`, `SC.Crafting` (Logik, ohne UI) |
| `js/gegenstaende.js` (ändern) | `SC.Beute.baue`, Deckel für Fund-Seltenheit, `klinge`-Feld |
| `js/kampf.js`, `js/gegner.js` (ändern) | Rohstoff-Drops der Gegner, seltenere Gegenstands-Funde |
| `js/ui-werkbank.js` (neu) | Werkbank-Menü und Rucksack-Handwerk |
| `js/mesher.js`, `js/licht.js`, `js/spieler.js` (ändern) | Nicht-Würfel-Formen, Licht, Kollision, Klettern |
| `js/bauteile.js` (neu) | Aufstellen (Richtung/Stütze), Tür umschalten |
| `js/survival.js`, `js/spiel.js`, `js/raum.js` (ändern) | Interaktion, Truhen, Protokoll |
| `tests/test-crafting.js`, `tests/test-bauteile.js` (neu) | Tests; beide in `tests/index.html` eintragen |

---

### Task 1: Rohstoffe und Bauteile als Blöcke

**Files:**
- Modify: `js/bloecke.js`, `js/texturen.js`, `js/texte.js`, `js/abbau.js`, `js/ui.js` (Kreativ-Reiter nimmt `inAuswahl`-Blöcke automatisch)
- Test: `tests/test-crafting.js` (neu, in `tests/index.html` eintragen)

**Interfaces:**
- Produces: `SC.B.EISENERZ`=33, `TITAN`=34, `GLUTSTAHL`=35, `MOORSILBER`=36, `STERNENMETALL`=37, `KRISTALL_BLAU`=38, `KRISTALL_GRUEN`=39, `KRISTALL_ROT`=40, `KRISTALL_GELB`=41, `KRISTALL_VIOLETT`=42, `KRISTALL_WEISS`=43, `SCHALTKREIS`=44, `CHITIN`=45, `WERKBANK`=46, `FACKEL`=47, `ZAUN`=48, `LEITER_N`=49, `LEITER_S`=50, `LEITER_O`=51, `LEITER_W`=52, `TUER_X`=53, `TUER_Z`=54, `TUER_X_OFFEN`=55, `TUER_Z_OFFEN`=56, `TRUHE`=57.
- Produces: `SC.CRAFTING_KRISTALLE = { blau: {block, farbe:"#3fa0ff"}, gruen: {…"#3fe06a"}, rot: {…"#ff4a4a"}, gelb: {…"#ffe14a"}, violett: {…"#b46bff"}, weiss: {…"#f4f4ff"} }` (Schlüssel → Block-ID und Hex-Farbe der Klinge/des Strahls).
- Produces: Blockdefinition bekommt optional `form` (String `"wuerfel"` Standard) und `klettern` (bool); Tabellenzeile um zwei Felder erweitert.

- [ ] **Step 1: Failing test** in `tests/test-crafting.js`: `test("Neue Blöcke haben feste IDs und Namen")` prüft `SC.B.EISENERZ===33`, `SC.B.TRUHE===57`, jeder neue Block hat `SC.BLOECKE[id].name` (kein `undefined`) und eine Textur im Atlas (`SC.Mesher.uvFuer(seiten.*)` wirft nicht); Erze und Kristalle `fest` und `zerstoerbar`; Kristalle `leuchten>0`; `SC.BLOECKE[SC.B.LEITER_N].klettern===true`; `SC.Abbau.zeit(SC.B.TITAN)>SC.Abbau.zeit(SC.B.EISENERZ)>SC.Abbau.zeit(SC.B.STEIN)`.
- [ ] **Step 2: Run** `bash scripts/tests.sh Neue Blöcke` → FAIL (IDs fehlen).
- [ ] **Step 3: Implement** IDs, Tabellenzeilen, Texturmuster (Erze: Stein-Muster mit farbigen Punkten, Farben aus der Palette wie bei bestehenden; Kristalle: Muster `kristall` mit eigener Farbe, leuchtend), Namen in `SC.T.bloecke`. Abbauzeit je Stufe 1,6 / 2,2 / 3,0 / 3,0 / 4,0 s (Eisenerz, Titan, Glutstahl/Moorsilber, Sternenmetall); Kristalle 1,4 s. `SC.Abbau.ergibt` bildet `LEITER_*`→`LEITER_N`, `TUER_Z`/`*_OFFEN`→`TUER_X`, `KRISTALL_*` bleibt sich selbst. Bauteile/Werkbank/Truhe zerstörbar in 0,9 s. `fest`/`durchsichtig` je Block: Werkbank, Zaun, Truhe, geschlossene Türen `fest`; Fackel, Leitern, offene Türen nicht `fest` und `durchsichtig`.
- [ ] **Step 4: Run** `bash scripts/tests.sh` (alle) → keine ❌.
- [ ] **Step 5: Commit** `Crafting: neue Blöcke (Erze, Kristalle, Werkbank, Bauteile)`.

### Task 2: Erze und Kristalle in der Welt (Generator-Version 3)

**Files:** Modify `js/generator.js` (`SC.GENERATOR_VERSION` 2→3, Erz-Regel), `js/landschaft.js`, `js/bauwerke.js` (Kistenbeute bleibt, nur Seltenheit siehe Task 3); Test `tests/test-crafting.js`.

**Interfaces:**
- Consumes: Block-IDs aus Task 1; `planet.generatorVersion`.
- Produces: `SC.Generator.prototype.erzAn(x, y, z, tiefe) -> blockId|0`: liefert für Stein in Höhlen-Nähe das Erz (Wert 0, wenn keins). Regeln (Version ≥ 3): Startplanet Eisenerz ab 8 Blöcken unter der Oberfläche, Titan ab 24 Blöcken Tiefe (seltener), Kristall Blau/Grün in Adern wie `rAder`, Kristall Gelb in Sand-Biomen (Wüste); Glutfrost: Glutstahl + Kristall Rot nahe Lava; Rankenmoor: Moorsilber + Kristall Violett. Sternenmetall und Weiß gibt es nicht im Boden (nur Bosse, Stufe 6a).

- [ ] **Step 1: Failing tests**: (a) Planet mit `generatorVersion:3` und Seed 5: in einem Bereich von 64×64×(Tiefe) kommen Eisenerz und Titan vor, Titan nur tiefer als Eisenerz-Mindesttiefe; (b) derselbe Seed mit `generatorVersion:2` erzeugt **byte-identische** Chunks wie vor dieser Änderung (Prüfsummen-Test des Startplaneten bleibt unverändert grün); (c) Glutfrost enthält `GLUTSTAHL` und `KRISTALL_ROT`, Rankenmoor `MOORSILBER` und `KRISTALL_VIOLETT`, Startplanet keins davon.
- [ ] **Step 2: Run** `bash scripts/tests.sh Erz` → FAIL.
- [ ] **Step 3: Implement** die Regel nur hinter `this.planet.generatorVersion >= 3`; Hash über `SC.hash3` für Verteilung (keine neuen Zufallsströme, die alte Chunks verändern). `SC.GENERATOR_VERSION = 3` gilt nur für neue Welten, bestehende Planetendaten behalten ihre gespeicherte Version.
- [ ] **Step 4: Run** komplette Tests (Prüfsumme!) → grün.
- [ ] **Step 5: Commit** `Crafting: Erze und Kristalle in neuen Welten (Generator 3)`.

### Task 3: Rohstoff-Beute und seltenere Funde

**Files:** Modify `js/gegner.js` (Feld `teile`), `js/kampf.js` (`beuteFuer`, `oeffneKiste`), `js/gegenstaende.js` (`SC.Beute.erzeuge`), `js/survival.js` (Abwurf), `js/raum.js` (Beute an Gäste); Test `tests/test-crafting.js`.

**Interfaces:**
- Produces: `SC.CRAFTING_FUND = { gegenstandChance: 0.25, maxSeltenheit: 2 }`.
- Produces: `SC.Kampf.beuteFuer(g, daten, zf)` liefert zusätzlich `rohstoffe: [{ block, anzahl }]`; Gegnerdefinition erhält `teile: [{ block, chance, menge:[min,max] }]` (Droiden/Banditen: `SCHALTKREIS`; Krabbler/Frostkrabbler/Rankenschleicher: `CHITIN`; Lavagolem: `GLUTSTAHL`; Sumpfspucker/Sumpfkoloss: `MOORSILBER`; Bosse zusätzlich `STERNENMETALL` 1–2 und je `KRISTALL_WEISS` mit Chance 0,25).
- Produces: `SC.Beute.erzeuge(zf, o)` begrenzt `seltenheit` auf `SC.CRAFTING_FUND.maxSeltenheit`, außer `o.boss` ist wahr.

- [ ] **Step 1: Failing tests**: (a) 2000 Würfe `beuteFuer` für `patrouillendroide`: Anteil mit Gegenstand ≈ 0,35×0,25 (±0,03), Anteil mit `SCHALTKREIS` > 0; (b) 1000 `erzeuge`-Würfe ohne `boss` liefern nie Seltenheit > 2, mit `boss:true` kommen 3 und 4 vor; (c) Boss-`beuteFuer` enthält über viele Würfe `STERNENMETALL`; (d) Kisten (`oeffneKiste`) liefern ohne Boss-Ort höchstens Seltenheit 2.
- [ ] **Step 2: Run** `bash scripts/tests.sh beute` → FAIL.
- [ ] **Step 3: Implement**. Gegenstands-Chance = `def.beute.chance * SC.CRAFTING_FUND.gegenstandChance`. `rohstoffe` werden wie Beute als Kugeln abgeworfen (`sache:{block, anzahl}`, gibt es schon) und im Raum wie Gegenstände an Gäste gemeldet.
- [ ] **Step 4: Run** komplette Tests; vorhandene Beute-Tests ggf. auf die neuen Chancen anpassen (Erwartungen nennen, nicht abschwächen).
- [ ] **Step 5: Commit** `Crafting: Rohstoff-Beute, seltenere Gegenstands-Funde`.

### Task 4: Rezepte und Herstell-Logik

**Files:** Create `js/crafting.js` (in beide Ladelisten nach `js/rucksack.js`/`js/gegenstaende.js`); Modify `js/rucksack.js`, `js/gegenstaende.js`; Test `tests/test-crafting.js`.

**Interfaces:**
- Produces: `SC.Rucksack.prototype.zaehle(block) -> number`, `SC.Rucksack.prototype.entferne(block, anzahl) -> number` (entfernt höchstens so viele, gibt Rest zurück), `SC.Rucksack.prototype.passt(sache) -> boolean`.
- Produces: `SC.Beute.baue(zf, { art, seltenheit, stufe, klinge? }) -> Gegenstand` (gleiches Format wie `erzeuge`, Seltenheit exakt; `klinge` = Hex-Farbe von Waffen).
- Produces: `SC.METALLE = [[STEIN],[EISENERZ],[TITAN],[GLUTSTAHL,MOORSILBER],[STERNENMETALL]]` (Index = Seltenheit 0–4; in einer Stufe sind die Blöcke austauschbar).
- Produces: `SC.REZEPTE`: Liste `{ id, art:"bauteil"|"waffe"|"ruestung", station:"hand"|"werkbank", kosten:[{block, anzahl}], ergibt:{block, anzahl} }`; für `waffe`/`ruestung` statt fester Kosten `{ gegenstand:"laserschwert", metall:6, kristall:1|0, extra:[{block,anzahl}] }`.
- Produces: `SC.Crafting.baubar(rucksack, rezept, wahl) -> { ok, fehlt:[{block,anzahl}], grund? }` und `SC.Crafting.herstelle(rucksack, rezept, wahl, zf, spielerStufe) -> { ok, ergebnis?, grund? }`; `wahl = { metallStufe, metallBlock, kristall }`.

Festgelegte Rezepte (Anzahl Ergebnis ← Kosten): Bretter 4 ← 1 Stamm (hand); Werkbank 1 ← 4 Bretter + 4 Stein (hand); Fenster (Glas) 2 ← 2 Sand; Fackel 4 ← 1 Stamm + 1 Leuchtpilz; Zaun 4 ← 3 Bretter; Leiter 3 ← 3 Bretter; Tür 1 ← 4 Bretter; Truhe 1 ← 6 Bretter (alle anderen `werkbank`). Waffen: Metall `blasterpistole` 4, `blastergewehr` 8, `laserschwert` 6, dazu 1 Kristall (Schwert 2). Rüstung: Metall `helm` 5, `brust` 8, `handschuhe` 4, `stiefel` 4, `schildgenerator` 6 + 1 `SCHALTKREIS`.

- [ ] **Step 1: Failing tests**: Rucksack `zaehle/entferne/passt` (über mehrere Stapel); `baubar` meldet `fehlt`; `herstelle` Werkbank zieht 4 Bretter + 4 Stein ab und legt 1 `WERKBANK` hinein; **voller Rucksack** (36 Plätze mit unterschiedlichen Gegenständen): `herstelle` liefert `{ok:false, grund:"voll"}` und der Rucksack bleibt unverändert; Waffe `laserschwert`, `metallStufe:2`, `kristall:"blau"` ergibt Gegenstand mit `seltenheit===2`, `klinge==="#3fa0ff"`, `werte.schaden` > Stufe-1-Wert; Metall der falschen Stufe wird abgelehnt; Rüstung `schildgenerator` braucht Schaltkreis.
- [ ] **Step 2: Run** `bash scripts/tests.sh Crafting` → FAIL.
- [ ] **Step 3: Implement** `herstelle` atomar: erst prüfen (inkl. `passt`), dann abziehen, dann ablegen. `SC.Beute.baue` teilt Werte/Zusatz/Sonder-Logik mit `erzeuge` (herausgezogene gemeinsame Funktion, kein Kopieren).
- [ ] **Step 4: Run** komplette Tests.
- [ ] **Step 5: Commit** `Crafting: Rezepte und Herstell-Logik, Beute.baue`.

### Task 5: Werkbank-Block und Menü

**Files:** Create `js/ui-werkbank.js` (in beide Ladelisten nach `js/ui-rucksack.js`); Modify `js/survival.js` (Interaktion neben der Kiste, Zeile ~115), `js/ui-rucksack.js` (Knopf „Werkbank bauen“ im Rucksack = Handwerk), `js/texte.js`, `css/style.css`; Test `tests/test-crafting.js`.

**Interfaces:**
- Consumes: `SC.REZEPTE`, `SC.Crafting.baubar/herstelle` (Task 4).
- Produces: `SC.UI.prototype.zeigeWerkbank(kampf, o)` mit `o = { station:"werkbank"|"hand", beiAenderung, beiFertig }`; das Menü zeigt Rezepte als Karten (Name, Kosten mit Bild und Anzahl, fehlende rot), Antippen/Taste/Controller wählt, „Herstellen“ führt `herstelle` aus; Waffen und Rüstung öffnen eine Auswahl Metall (nur Stufen mit genug Rohstoffen anwählbar) und Kristall; Kreativmodus: alle Rezepte kostenlos (`baubar` ignoriert Kosten, wenn `kampf.spieler.modus==="kreativ"` oder `o.gratis`).
- Produces: Antippen eines `SC.B.WERKBANK`-Blocks (wie Kiste: `e.setzen && ziel`) öffnet das Menü mit `station:"werkbank"`; im Rucksack-Menü öffnet „Handwerk“ das gleiche Menü mit `station:"hand"` (nur Bretter und Werkbank).

- [ ] **Step 1: Failing tests** (DOM, wie `tests/test-ui-rucksack.js`): `zeigeWerkbank` rendert pro Rezept eine Karte; Karte ohne genug Rohstoffe ist als nicht herstellbar markiert; Klick auf „Herstellen“ bei passenden Rohstoffen legt das Ergebnis in den Rucksack und ruft `beiAenderung`; Handwerk zeigt nur `station:"hand"`-Rezepte; Werkbank-Block antippen ruft `zeigeWerkbank` (Test über `Spiel`-Stub).
- [ ] **Step 2: Run** `bash scripts/tests.sh Werkbank` → FAIL.
- [ ] **Step 3: Implement** nach dem Muster von `zeigeRucksack` (`ui._zeige(html, aktionen)`); alle Texte in `SC.T`; Bedienung komplett über Knöpfe (Touch/Controller wie das Rucksack-Menü). Im Raum: Gast schickt Herstellwunsch an den Gastgeber nicht nötig – der Rucksack ist lokal; nur der Block wird lokal getestet (siehe Review Focus: Rohstoffe nur einmal abziehen).
- [ ] **Step 4: Run** komplette Tests.
- [ ] **Step 5: Commit** `Crafting: Werkbank-Block und Menü`.

### Task 6: Handwaffen in Kristallfarbe

**Files:** Modify `js/kampf.js:68` (Schussfarbe), `js/render-wesen.js:14` und `:50`, `js/render-mitspieler.js:23` und `:69`, `js/ui-rucksack.js:21` und `:68`, `js/survival.js` (Klingenfarbe der eigenen Waffe); Test `tests/test-crafting.js`, `tests/test-render-wesen.js`.

**Interfaces:**
- Consumes: Gegenstandsfeld `klinge` (Hex) aus Task 4.
- Produces: `SC.Beute.klingenFarbe(g) -> string` (liefert `g.klinge` oder die Seltenheitsfarbe); alle Stellen oben nutzen sie statt direkt `SC.SELTENHEIT[…].farbe` für Klinge, Strahl und Waffenbild; Rahmen im Rucksack bleibt Seltenheitsfarbe.

- [ ] **Step 1: Failing tests**: `klingenFarbe` mit/ohne `klinge`; `Kampf.angriff` für gebaute Blasterpistole mit `klinge:"#ff4a4a"` liefert `farbe:"#ff4a4a"`; Mitspieler-Waffe nimmt dieselbe Farbe (`SC.RenderMitspieler`-Test); Gegenstandsbild der Waffe enthält die Klingenfarbe.
- [ ] **Step 2: Run** `bash scripts/tests.sh Klinge` → FAIL.
- [ ] **Step 3: Implement**. Gefundene Waffen ohne `klinge` bleiben unverändert.
- [ ] **Step 4: Run** komplette Tests.
- [ ] **Step 5: Commit** `Crafting: Kristallfarbe für Klinge und Strahl`.

### Task 7: Rüstung im Menü und Aussehen

**Files:** Modify `js/ui-werkbank.js`, `js/render-mitspieler.js:69` (Rüstungsfarbe aus Metall: Stein grau, Eisen stahlblau, Titan silber, Glutstahl glutrot, Moorsilber grünsilber, Sternenmetall violettgold) ; Test `tests/test-crafting.js`.

**Interfaces:** Gegenstandsfeld `material` (Metallstufen-Index 0–4) auf gebauter Rüstung; `SC.Beute.rustungsFarbe(g) -> Hex`.

- [ ] **Step 1: Failing tests**: Rüstungsrezept im Menü wählbar; gebauter Helm mit Titan hat `seltenheit===2` und `werte.schutz` > gleichwertige Stufe 0; `rustungsFarbe` liefert je Material eine andere Farbe.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** komplette Tests. **Step 5: Commit** `Crafting: Rüstung herstellen`.

### Task 8: Nicht-Würfel-Formen (Fackel, Zaun) mit Licht und Kollision

**Files:** Modify `js/bloecke.js` (`form`), `js/mesher.js`, `js/licht.js` (`opak` nur für volle Würfel), `js/spieler.js`/`js/zielen.js` (Auswahl und Kollision), `js/texturen.js`; Create `js/bauteile.js` (in beide Ladelisten nach `js/zielen.js`); Test `tests/test-bauteile.js` (neu, in `tests/index.html`), `tests/test-mesher.js`.

**Interfaces:**
- Produces: `form`-Werte `"kreuz"` (zwei gekreuzte Flächen, Fackel), `"pfosten"` (Quader 4/16 breit, volle Höhe, Zaun; Nachbarzäune verbindet der Mesher mit Querlatten), `{typ:"platte", achse:"x"|"z", versatz:0..1}` (dünne Platte, Türen und Leitern).
- Produces: `SC.Bauteile.aufstellId(blockId, ziel, blickRichtung) -> blockId|0`: Leiter wählt die Variante nach getroffener Wandseite (nur wenn dahinter ein fester Block liegt, sonst 0), Tür nach Blickrichtung (`TUER_X` oder `TUER_Z`); Fackel und Zaun unverändert; 0 = ablehnen.
- Produces: `SC.kannSetzen` lehnt Bauteile ab, die einen Spieler überlappen.

- [ ] **Step 1: Failing tests**: Mesher liefert für `FACKEL` 8 Flächen (zwei Kreuzflächen), für `ZAUN` weniger Dreiecke als ein voller Würfel, für `TUER_X` genau die dünne Platte; `SC.Licht.opak[FACKEL]===0` und Fackel leuchtet (Lichtquelle, Farbe warm); `aufstellId(LEITER_N, ziel an Südwand, …)` liefert die zur Wand passende Variante, ohne festen Block dahinter 0; Zaun ist `fest` für die Kollision (Spieler kommt nicht durch).
- [ ] **Step 2: Run** `bash scripts/tests.sh Bauteil` → FAIL.
- [ ] **Step 3: Implement** im Mesher eine Funktion `formFlaechen(def, x, y, z)` für die Sonderformen, Standardpfad unverändert; Licht und AO nehmen Sonderformen als nicht deckend an.
- [ ] **Step 4: Run** komplette Tests (Mesher-Tests dürfen für Würfel nicht ändern).
- [ ] **Step 5: Commit** `Crafting: Fackel und Zaun, Sonderformen im Mesher`.

### Task 9: Türen und Leitern

**Files:** Modify `js/bauteile.js`, `js/survival.js` (Antippen einer Tür), `js/spieler.js` (Klettern), `js/abbau.js`; Test `tests/test-bauteile.js`.

**Interfaces:**
- Produces: `SC.Bauteile.tuerUmschalten(welt, x, y, z, ursprung) -> boolean` (tauscht `TUER_X`↔`TUER_X_OFFEN`, `TUER_Z`↔`TUER_Z_OFFEN` über `welt.setzeBlock(…, "spieler")`, damit Mehrspieler den Wechsel wie eine Blockänderung überträgt).
- Produces: `Spieler.schritt` kennt `klettern`: steht der Körper in einem Block mit `klettern`, entfällt die Schwerkraft; Vor/Zurück bewegt nach oben/unten (Blickrichtung egal), Springen steigt schneller.

- [ ] **Step 1: Failing tests**: Umschalten wechselt die ID und zurück; offene Tür ist begehbar, geschlossene nicht (`SC.bewegeKoerper`); Spieler in einer Leiter fällt nicht und steigt bei „vor“; Abbauen von `TUER_Z_OFFEN` liefert `TUER_X` (Rucksack), von `LEITER_O` liefert `LEITER_N`; Gast: Umschalten läuft über denselben Weg wie Blocksetzen (Test mit Stub-Raum, dass `setzeBlock` mit Ursprung `"spieler"` aufgerufen wird).
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** komplette Tests. **Step 5: Commit** `Crafting: Türen und Leitern`.

### Task 10: Truhe mit Inhalt

**Files:** Modify `js/survival.js`, `js/raum.js` (Protokoll), `js/spielstand.js` (`truhen` je Planet, Standard `{}`), `js/ui-werkbank.js` oder neue Funktion `zeigeTruhe` in `js/ui-rucksack.js`; Test `tests/test-crafting.js`, `tests/test-raum.js`.

**Interfaces:**
- Produces: Planetendaten `truhen: { "x,y,z": [18 Plätze im Rucksack-Format] }`; Migration in `SC.Spielstand` setzt fehlendes Feld auf `{}`.
- Produces: `SC.UI.prototype.zeigeTruhe(kampf, platzListe, o)` (Tipp verschiebt zwischen Rucksack und Truhe); Gastgeber hält den Inhalt, Gäste öffnen über Nachrichten `truhe` (Gast→Gastgeber `{x,y,z}`) und `truheInhalt`/`truheLege`/`truheNimm`; `SC.RAUM_PROTOKOLL` um 1 erhöhen und im Protokollkommentar von `js/raum.js` beschreiben.
- Abbauen einer Truhe wirft den Inhalt als Beutekugeln ab.

- [ ] **Step 1: Failing tests**: alter Spielstand ohne `truhen` lädt und bekommt `{}`; Inhalt bleibt nach Speichern/Laden; Gast `truheLege` verändert den Inhalt beim Gastgeber und meldet ihn zurück; zwei Gäste legen nicht dieselbe Sache doppelt; Abbau wirft Inhalt ab.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** (Gastgeber ist maßgeblich, Quittung wie bei Bauwünschen). **Step 4: Run** komplette Tests inkl. Mehrspieler. **Step 5: Commit** `Crafting: Truhe mit Inhalt`.

### Task 11: Abschluss Stufe 6a

**Files:** Modify `js/texte.js` (Spielanleitung `SC.T.anleitung`), `docs/ANLEITUNG.md` (neu erzeugt), `docs/ROADMAP.md`, `index.html` (Version), Entwicklerwerkzeuge (`js/entwickler.js`: Reiter „Rohstoffe geben“ legt je einen Stapel aller Rohstoffe in den Rucksack); Test `tests/test-entwickler.js`.

- [ ] **Step 1: Failing test** für den Entwicklerknopf „Rohstoffe“ (Rucksack enthält danach 16 Stück jedes Erzes und Kristalls).
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement**, Anleitung ergänzen (Werkbank, Rohstoffe, Kristallfarben, Bauteile), Roadmap-Stand und nächster Schritt (Stufe 6b), Version auf die nächste MINOR-Zahl.
- [ ] **Step 4: Run** komplette Tests; im Browser von Hand: Welt starten, Rohstoffe geben, Werkbank bauen, jedes Bauteil aufstellen und benutzen, Waffe in zwei Farben bauen, Rüstung anlegen; zu zweit eine Tür und Truhe prüfen.
- [ ] **Step 5: Commit** `Crafting Stufe 6a: Anleitung, Entwicklerknopf, Version`; Meilenstein erst nach Gerätetest des Nutzers schließen.

---

## Self-Review

- **Spec-Abdeckung:** Rohstoffe/Fundorte (T1–T3), Werkbank als Block mit Menü (T5), Bauteile Fenster/Leitern/Fackeln/Truhen/Zäune/Türen (T4 Rezepte, T8–T10), Handwaffen mit Kristallfarbe und Stärke nach Metall (T4, T6), Rüstung (T7), seltenere Funde (T3), Kreativmodus kostenlos (T5), Mehrspieler (T9, T10), Spielstand-Kompatibilität (T2, T10). Fahrzeug-/Raumschiff-Teile sind bewusst Stufen 6b und 6c.
- **Typen:** `SC.Crafting.herstelle` (T4) wird in T5 genutzt; `klinge`/`material` am Gegenstand (T4) in T6/T7; `SC.Bauteile` (T8) in T9.
- **Proportion:** Plan bewusst ohne Funktionskörper; Werte (Kosten, Abbauzeiten, Chancen) stehen als Zahlen drin, damit nach Feedback der Kinder leicht nachgestellt werden kann.
- **Offen für den Nutzer:** keine; Annahmen stehen im Spec unter „Meine Entscheidungen“. Wir bauen Werkbank und Bretter als „Handwerk“ im Rucksack (meine Festlegung, damit der Einstieg ohne Werkbank möglich ist).
