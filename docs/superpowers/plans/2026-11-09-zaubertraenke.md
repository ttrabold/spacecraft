# Zaubertränke Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kinder brauen am Kessel aus Flasche, Kristall und Pflanze Zaubertränke, trinken sie und verwandeln sich sichtbar (Tier-Teile und Leuchten) mit einem Buff von etwa 3 Minuten.

**Architecture:** Ein neues Modul `js/traenke.js` hält Tabellen (Pflanzen, Wirkungen) und die reine Logik (Brauen, Trank-Zustand, Bonuswerte). Die Wirkung läuft über die vorhandenen Bonuswerte in `SC.Kampf` (`tempoBonus`, `schadenBonus`, `schildMax`) und zwei neue Faktoren am Spieler (Sprung, Schwerkraft). Das Aussehen hängt als Zusatzteile an `SC.Figur` und reist als ein Feld `trank` im Netz-Zustand (Protokoll 11). Ein Trank im Rucksack ist ein Platz `{ block: B.TRANK, anzahl, trank: "<kristall>:<pflanze>" }`.

**Tech Stack:** Klassische Skripte unter dem Namensraum `SC`, three.js r158, Web Audio. Keine Module, kein npm.

**Spec:** `docs/superpowers/specs/2026-11-09-zaubertraenke-design.md`

## Global Constraints

- Keine ES-Module, kein Bundler, kein npm, keine neuen Bibliotheken; läuft per `file://` und auf älteren iPads/Safari.
- Ladereihenfolge in `index.html` und `tests/index.html` identisch halten; neue Skripte in beide eintragen.
- Spielstand-Kompatibilität: neue Felder beim Laden mit Standardwert nachziehen; alte Spielstände, Rucksäcke und Welten dürfen nie brechen.
- Code-Kommentare, Commit-Nachrichten, Texte und Docs sind Deutsch. Commits verweisen mit `Refs #146`.
- Version: MINOR erhöhen auf `0.31.0` (`var V` in `index.html`, einzige Stelle). Netzprotokoll `SC.NETZ_PROTOKOLL` 10 → 11 (`js/netz.js`, Kommentar ergänzen).
- Wirkung: 3 Minuten Spielzeit (`SC.TRANK.dauer = 180`), ein neuer Trank ersetzt den laufenden. Kein Trank bei „besiegt“, im Zuschauermodus nicht trinkbar.
- Tests: `bash scripts/tests-wsl.sh <Text>` (WSL, ohne Sandbox) bzw. `bash scripts/tests.sh <Text>`; am Ende die ganze Testseite: `Fertig: N ok, 0 fehlgeschlagen`. Neue Tests in `tests/test-traenke.js`, eingetragen in `tests/index.html` neben `test-tiere.js`.
- Nicht pushen, ohne dass der Nutzer es verlangt. Der Code ist dicht (Einzeiler): beim Bearbeiten `Read` mit `offset`/`limit` und kleine eindeutige `Edit`s.

## Review Focus

- Alter Spielstand und alter Rucksack ohne `trank`-Felder lädt und spielt wie vorher (Figur ohne Feld → kein Trank; Platz ohne `trank` stapelt wie bisher).
- Brauen mit fehlender Zutat verbraucht nichts und ändert nichts; Brauen bei vollem Rucksack verliert keine Zutaten.
- Besiegt werden, Wiedereinstieg, Moduswechsel zu Zuschauer und Planetenwechsel lassen keinen Trank mit Restzeit „hängen“ (kein Buff ohne Aussehen, kein Aussehen ohne Buff).
- Ein Gast mit Trank, der sich trennt und wieder verbindet, behält Trank und Restzeit (Figur wird in der eigenen Welt gespeichert); der Gastgeber zeigt sein Aussehen.
- Eine Welt mit Generator-Version 3 bekommt keine Pflanzenblöcke und bleibt Bit für Bit unverändert; Pflanzen als Beute gibt es dort trotzdem. Nachwachsen überschreibt nie einen Block, den ein Spieler inzwischen dort gebaut hat.

---

### Task 1: Tabellen und Blöcke

**Files:**
- Create: `js/traenke.js` (Tabellen), `tests/test-traenke.js`
- Modify: `js/bloecke.js` (Block-IDs, Eintrag je Block), `js/texturen.js` (Kacheln), `js/rucksack.js` (`SC.Abbau`-Zeiten), `js/crafting.js` (`SC.CRAFTING_MATERIALIEN`), `js/texte.js`, `index.html`, `tests/index.html`

**Interfaces:**
- Produces: Block-IDs `SC.B.KESSEL` 89, `FLASCHE` 90, `TRANK` 91 (Gegenstandsblock, `nichtAufstellbar`, `form: "gegenstand"` wie `EIMER_WASSER`), Pflanzen `HASENKLEE` 92, `KATZENMINZE` 93, `FUCHSGRAS` 94, `EISBLUME` 95, `FROSTBEERE` 96, `GLUTMOHN` 97, `FEDERFARN` 98, `QUAKBLUME` 99, `DSCHUNGELRANKE` 100 (Pflanzen mit `form: "pflanze"`, durchgehbar, wie `LEUCHTPILZ`).
- Produces: `SC.PFLANZEN` (Objekt id → `{ id, block, planet, name, teil }`, `planet` ist `start`, `glutfrost` oder `rankenmoor`, `teil` ist der Name des Tier-Teils aus Task 7) und `SC.PFLANZEN_REIHE` (Array der neun ids in Tabellenreihenfolge des Specs).
- Produces: `SC.TRANK` mit `dauer: 180`, `wirkung` (Objekt Kristallname → `{ art, wert, farbe }`, Kristallnamen sind die Schlüssel von `SC.CRAFTING_KRISTALLE`: `blau gruen rot gelb violett weiss`; Arten `tempo gelb`, `sprung gruen`, `schaden rot`, `schild blau`, `schweben violett`, `nachtsicht weiss`; Startwerte: tempo 30 (Prozent), sprung 1.4 (Faktor), schaden 25 (Prozent), schild 30 (Punkte), schweben 0.35 (Schwerkraft-Faktor), nachtsicht 1), `beuteChance: 0.15`, `nachwuchs: 600` (Sekunden).
- Produces: `SC.Trank.schluessel(kristall, pflanze) -> string "kristall:pflanze"` und `SC.Trank.teile(schluessel) -> { kristall, pflanze } | null` (null bei ungültigem Schlüssel).

- [ ] **Step 1: Tests schreiben** in `tests/test-traenke.js`: „Pflanzen: neun, drei je Planet, Blöcke vorhanden“ (`Object.keys(SC.PFLANZEN).length === 9`, je Planet 3, `SC.BLOECKE[p.block]` gesetzt, Name nicht leer); „Wirkungen: sechs Kristalle, jede Art einmal“ (Schlüssel gleich `Object.keys(SC.CRAFTING_KRISTALLE)`, Arten alle verschieden, `farbe` gleich der Farbe in `SC.CRAFTING_KRISTALLE`); „Schlüssel: Hin und Zurück, ungültig gibt null“ (`SC.Trank.teile(SC.Trank.schluessel("rot","hasenklee"))` gleich `{kristall:"rot",pflanze:"hasenklee"}`, `SC.Trank.teile("rot:gibtesnicht")` und `teile("x")` sind `null`); „Blöcke: Kessel, Flasche, Trank sind abbaubar und haben Kacheln“ (`SC.Abbau.zeit(SC.B.KESSEL) < Infinity`).
- [ ] **Step 2: Fehlschlag prüfen:** `bash scripts/tests-wsl.sh Pflanzen` → Fehler „SC.PFLANZEN ist nicht definiert“.
- [ ] **Step 3: Blöcke und Tabellen anlegen.** IDs in `js/bloecke.js` (nach 88), Einträge nach dem Muster von `LEUCHTPILZ` (Pflanzen) und `EIMER_LAVA` (Flasche, Trank), Kessel als fester Block wie `WERKBANK`. Kacheln in `js/texturen.js` nach dem Muster der vorhandenen Pixel-Kacheln (Pflanzen farbig nach Namen, Kessel dunkles Metall mit grünem Sud, Flasche und Trank als Glasflasche, Trank mit Farbfüllung). `js/traenke.js` mit `SC.PFLANZEN`, `SC.PFLANZEN_REIHE`, `SC.TRANK`, `SC.Trank.schluessel`, `SC.Trank.teile`. `SC.Abbau`-Zeiten in `js/rucksack.js` (Pflanzen 0.1, Kessel 0.9, Flasche/Trank 1). In `SC.CRAFTING_MATERIALIEN` die neun Pflanzen und die Flasche ergänzen (Kreativ-Reiter „Materialien“). Die Namen der Blöcke sind die Pflanzennamen des Specs („Hasenklee“ …), „Kessel“, „Flasche“, „Zaubertrank“. `js/traenke.js` in beide Skriptlisten nach `js/crafting.js`, `tests/test-traenke.js` in `tests/index.html`.
- [ ] **Step 4: Tests laufen lassen:** `bash scripts/tests-wsl.sh Pflanzen` und `Wirkungen`, `Schlüssel`, `Blöcke` → grün; dann die ganze Testseite → `0 fehlgeschlagen` (ein Prüfsummen-Test des Generators darf sich nicht ändern, da noch nichts generiert wird).
- [ ] **Step 5: Commit:** `git add -A js tests index.html && git commit -m "Tränke: Blöcke, Pflanzen- und Wirkungstabellen; Refs #146"`.

### Task 2: Tränke im Rucksack

**Files:**
- Modify: `js/rucksack.js` (`lege`, `passt`, `hat`, `entferne`, `nimm`), `tests/test-traenke.js`

**Interfaces:**
- Consumes: `SC.B.TRANK`, `SC.Trank.schluessel` (Task 1).
- Produces: Rucksack-Platz `{ block: SC.B.TRANK, anzahl, trank: "kristall:pflanze" }`. `lege(sache)` mit `sache.trank` stapelt nur mit Plätzen gleichen `block` **und** gleichen `trank`; `nimm(platz, anzahl)` gibt bei Teilmenge `{ block, anzahl, trank }` zurück; `passt`, `entferne`, `hat` ohne `trank` im Argument verhalten sich wie bisher. Neue Methode `R.hatTrank(schluessel) -> Anzahl`.

- [ ] **Step 1: Tests:** „Rucksack: gleiche Tränke stapeln, verschiedene nicht“ (zwei `lege({block:TRANK,anzahl:2,trank:"rot:hasenklee"})` ergeben einen Platz mit 4; `lege` mit `"gelb:hasenklee"` belegt einen zweiten Platz); „Rucksack: nimm einer Teilmenge behält den Trank-Schlüssel“; „Rucksack: alte Plätze ohne trank stapeln unverändert“ (`lege({block:STEIN,anzahl:70})` gibt 64+6 wie im vorhandenen Test); „Rucksack: alsDaten übersteht JSON mit trank“.
- [ ] **Step 2: Fehlschlag prüfen:** `bash scripts/tests-wsl.sh Rucksack:` → FAIL bei „verschiedene nicht“.
- [ ] **Step 3: `lege` anpassen:** beim Stapeln zusätzlich `(p[i].trank || null) === (sache.trank || null)` vergleichen und beim neuen Platz `trank` mitschreiben, wenn gesetzt; `nimm` gibt `trank` weiter, wenn gesetzt; `hatTrank` summiert die Anzahl mit dem Schlüssel.
- [ ] **Step 4: Tests laufen lassen:** `bash scripts/tests-wsl.sh Rucksack` → grün, ganze Testseite grün.
- [ ] **Step 5: Commit:** „Rucksack: Tränke stapeln nach Kristall und Pflanze; Refs #146“.

### Task 3: Rezepte und Brauen

**Files:**
- Modify: `js/crafting.js` (Rezepte `kessel`, `flasche`; `SC.Crafting.brauen`), `tests/test-traenke.js`

**Interfaces:**
- Consumes: Task 1 (Blöcke, `SC.PFLANZEN`, `SC.CRAFTING_KRISTALLE`), Task 2 (Trank-Platz).
- Produces: `SC.Crafting.brauen(rucksack, kristall, pflanze) -> { ok: true, schluessel } | { ok: false, grund }`; `grund` ist `"zutat"` (Flasche, Kristall oder Pflanze fehlt oder unbekannter Name) oder `"voll"` (Trank passt nicht in den Rucksack). Bei `ok: false` bleibt der Rucksack unverändert. Bei Erfolg verbraucht es je 1 Flasche, 1 Kristall, 1 Pflanze und legt 1 Trank ab.
- Rezepte (Bauteile an der Werkbank, im Stil der vorhandenen): `kessel` = 6 `EISENERZ` + 2 `BRETTER` → 1 `KESSEL`; `flasche` = 2 `GLAS` → 3 `FLASCHE`.

- [ ] **Step 1: Tests:** „Rezepte: Kessel und Flasche sind herstellbar“ (`SC.Crafting.rezept("kessel")` mit `ergibt.block === SC.B.KESSEL`, `flasche` ergibt 3); „Brauen: verbraucht je eine Zutat und legt einen Trank ab“ (Rucksack mit 1 Flasche, 1 `KRISTALL_ROT`, 1 `HASENKLEE`; Ergebnis `{ok:true, schluessel:"rot:hasenklee"}`, `hatTrank("rot:hasenklee") === 1`, Zutaten weg); „Brauen: fehlende Zutat ändert nichts“ (ohne Flasche → `{ok:false, grund:"zutat"}`, Rucksack-Daten gleich vorher); „Brauen: voller Rucksack verliert keine Zutaten“ (36 Plätze belegt, Zutaten noch in einem Stapel, der nach dem Verbrauch frei würde: Trank passt trotzdem nicht → `grund:"voll"`, Daten unverändert); „Brauen: unbekannter Kristall/Pflanze“ → `grund:"zutat"`.
- [ ] **Step 2: Fehlschlag prüfen:** `bash scripts/tests-wsl.sh Brauen`.
- [ ] **Step 3: Implementieren.** Rezepte in `SC.REZEPTE` (`bauteil("kessel", "werkbank", …)`), `SC.Crafting.brauen` nach dem Muster der Herstell-Funktionen in `js/crafting.js`: erst prüfen (`rucksack.hat` je Zutat, unbekannte Namen), dann eine Kopie der Plätze mit den Verbräuchen auf Platz prüfen (`passt` auf der Kopie), erst dann am echten Rucksack ausführen.
- [ ] **Step 4: Tests laufen lassen:** `bash scripts/tests-wsl.sh Brauen` und `Rezepte`, danach ganze Testseite (die vorhandenen Crafting-Tests prüfen die Rezeptliste).
- [ ] **Step 5: Commit:** „Crafting: Kessel, Flasche und Brauen; Refs #146“.

### Task 4: Trank-Zustand und Wirkung

**Files:**
- Modify: `js/traenke.js`, `js/kampf.js` (`ruestungAnwenden`, ca. Zeile 39–53), `js/spieler.js` (Sprung Zeilen 82–83, Schwerkraft), `tests/test-traenke.js`

**Interfaces:**
- Consumes: `SC.TRANK`, `SC.Trank.teile` (Task 1).
- Produces: Zustand `{ kristall, pflanze, rest }` (`rest` in Sekunden Spielzeit) oder `null`. `SC.Trank.neu(schluessel) -> Zustand | null`; `SC.Trank.zeit(zustand, dt) -> Zustand | null` (zählt `rest` herunter, gibt `null` zurück, wenn abgelaufen); `SC.Trank.bonus(zustand) -> { tempo, schaden, schild, sprung, schwerkraft, nachtsicht }` (Standardwerte `0, 0, 0, 1, 1, false`; sonst nur die Art des Kristalls gesetzt).
- `SC.Kampf` bekommt Feld `trank` (Zustand oder `null`) und `ruestungAnwenden` addiert `bonus.tempo` auf `werte.tempoBonus`, `bonus.schaden` auf `werte.schadenBonus`, `bonus.schild` auf `werte.schildMax`. `SC.Kampf.prototype.trinke(schluessel) -> boolean` (setzt `trank = SC.Trank.neu(…)`, ersetzt einen laufenden, ruft `ruestungAnwenden`, `false` bei ungültigem Schlüssel); `zeitTrank(dt)` zählt herunter und ruft `ruestungAnwenden`, wenn der Trank endet; `trankEnde()` setzt `trank = null` (bei Besiegt-Werden).
- `SC.Spieler` bekommt `sprungFaktor` (Standard 1, multipliziert `F.sprung` an beiden Sprungstellen) und `schwerkraftFaktor` (Standard 1, multipliziert `F.schwerkraft`; Schweben ist langsames Fallen, denn das Spiel kennt keinen Fallschaden); `SC.Kampf` setzt sie aus `bonus` in `ruestungAnwenden`.

- [ ] **Step 1: Tests:** „Trank: neu aus Schlüssel, ungültig gibt null, rest = 180“; „Trank: zeit zählt herunter und endet bei 0“ (`zeit(neu, 100)` bleibt mit `rest` 80, `zeit(…, 81)` gibt `null`); „Trank: Bonus je Kristall“ (`gelb` → `tempo 30`, `gruen` → `sprung 1.4`, `rot` → `schaden 25`, `blau` → `schild 30`, `violett` → `schwerkraft 0.35`, `weiss` → `nachtsicht true`; ohne Trank alle Standardwerte); „Kampf: trinken erhöht tempoBonus, Ende stellt zurück“ (`new SC.Kampf(...)` wie in `tests/test-kampf.js`, `trinke("gelb:hasenklee")` → `werte.tempoBonus` um 30 höher, `spieler.tempoFaktor` ≈ 1.3 mal vorher, nach `zeitTrank(181)` wieder wie vorher); „Kampf: neuer Trank ersetzt den laufenden“ (nach `trinke("gelb:…")` dann `trinke("rot:…")`: tempoBonus wieder Ausgangswert, schadenBonus +25); „Spieler: sprungFaktor wirkt auf die Sprunghöhe“ (`SC.Spieler` aus `tests/test-spieler.js`: mit `sprungFaktor 1.4` ist die Anfangsgeschwindigkeit nach dem Sprung `SC.PHYSIK.sprung * 1.4`).
- [ ] **Step 2: Fehlschlag prüfen:** `bash scripts/tests-wsl.sh Trank:`.
- [ ] **Step 3: Implementieren** wie in Interfaces; `Read` von `js/kampf.js` Zeilen 1–60 und `js/spieler.js` Zeilen 33–100 zuerst. `trank` im Kampf beim Laden aus `s.trank` (Task 5 gibt den Wert) mit Standard `null`.
- [ ] **Step 4: Tests laufen lassen:** `bash scripts/tests-wsl.sh Trank` und `Kampf`, `Spieler`, danach ganze Testseite.
- [ ] **Step 5: Commit:** „Tränke: Zustand, Ablauf und Wirkung; Refs #146“.

### Task 5: Speichern, Trinken und Spielablauf

**Files:**
- Modify: `js/spielstand.js` (`FIGUR_FELDER`, Standardwerte), `js/kampf.js` (Laden/Speichern des Felds), `js/survival.js` (Trinken, Besiegt, Zeit), `js/spiel.js` (Zeit-Aufruf, Wiedereinstieg), `tests/test-traenke.js`

**Interfaces:**
- Consumes: `SC.Kampf.prototype.trinke/zeitTrank/trankEnde`, `SC.Crafting.brauen`.
- Produces: `daten.spieler.trank` (Zustand oder `null`; fehlt in alten Spielständen → `null`); `"trank"` in `SC.Spielstand.FIGUR_FELDER`. `SC.Spiel.prototype.trankTrinken() -> boolean`: nimmt den Trank aus dem aktuellen Schnellleistenplatz (`kampf.rucksack`, im Kreativmodus ohne Verbrauch), ruft `kampf.trinke`, spielt `this.audio.spiele("trinken")` (Klang in Task 9) und zeigt `SC.T.trankGetrunken` als Hinweis; im Zuschauermodus `false`.

- [ ] **Step 1: Tests:** „Spielstand: Figur ohne trank lädt mit null“ (`SC.Spielstand.figur({spieler:{…}})` enthält `trank: null`, ein Spielstand ohne das Feld wird beim Laden zu `null`, siehe vorhandene Muster in `tests/test-spielstand.js`); „Spielstand: laufender Trank überlebt Speichern und Laden mit Restzeit“; „Spiel: trankTrinken im Survival verbraucht einen Trank und setzt den Zustand“; „Spiel: trankTrinken im Kreativ verbraucht nichts“; „Spiel: Zuschauer kann nicht trinken (false, kein Zustand)“; „Spiel: Besiegt-Werden beendet den Trank“ (`trankEnde` über den vorhandenen Besiegt-Pfad in `js/survival.js` nahe Zeile 279).
- [ ] **Step 2: Fehlschlag prüfen:** `bash scripts/tests-wsl.sh Spiel: ` und `Spielstand:`.
- [ ] **Step 3: Implementieren.** `trank` in `FIGUR_FELDER`; beim Gast wird das Feld mit der Figur in die eigene Welt gespeichert (`figurUebernehmen` tut das für Felder der Liste). Trinken: Benutzen-Taste mit einem Trank in der Hand ruft `trankTrinken()` (an der Stelle, an der `survival.js` Benutzen-Blöcke behandelt, vor dem Setzen eines Blocks; Trank ist `nichtAufstellbar`). Zeit: `kampf.zeitTrank(dt)` in der Survival-Schleife (Spielzeit, nicht im Menü). Wiedereinstieg und Planetenwechsel: Der Trank läuft weiter, außer bei „besiegt“ (`trankEnde`).
- [ ] **Step 4: Tests laufen lassen**, danach ganze Testseite.
- [ ] **Step 5: Commit:** „Tränke: Trinken, Speichern und Ablauf im Spiel; Refs #146“.

### Task 6: Kessel und Rezeptbuch (Fenster)

**Files:**
- Create: `js/ui-kessel.js`
- Modify: `js/ui.js` (Kreativ-Reiter „Tränke“ nach dem Muster `beiTier`, Zeilen 452–460), `js/survival.js` (Kessel benutzen, Zeile 56–66), `js/ui-rucksack.js` (Knopf Rezeptbuch), `js/texte.js`, `index.html`, `tests/index.html`, `tests/test-traenke.js`

**Interfaces:**
- Consumes: `SC.Crafting.brauen` (Task 3), `SC.PFLANZEN_REIHE`, `SC.TRANK.wirkung`.
- Produces: `SC.UI.prototype.zeigeKessel(kampf, opt)` mit `opt.beiFertig`; `SC.UI.prototype.zeigeRezeptbuch(zurueck)`. Fenster als Seitenpanel (`fenster panel seite`) mit `data-zone` für Controller und Touch, nach dem Muster von `zeigeWerkbank` in `js/ui-werkbank.js`. Kessel: je eine Auswahlreihe für Kristall (die sechs) und Pflanze (die neun), Vorschau (Wirkung und Tier-Teil in Worten), Knopf „Brauen“ (aus, wenn Zutaten fehlen; zeigt, was fehlt). Das Rezeptbuch hat zwei Listen (Kristalle → Wirkung; Pflanzen → Tier-Teil und Planet) und ist am Kessel und im Rucksack erreichbar.
- Kreativ: Reiter „Tränke“ in der Blockauswahl (`opt.beiTrank`), Kacheln für alle 54 Kombinationen, Antippen legt einen Trank in den Rucksack (ohne Zutaten, `anzahl` 1), dazu Kessel, Flasche und die Pflanzen über den Reiter „Materialien“ (Task 1).

- [ ] **Step 1: Tests:** nach dem Muster von `tests/test-ui-kaefig.js`: „Kessel: Fenster zeigt sechs Kristalle und neun Pflanzen“ (Zählen der Auswahlknöpfe), „Kessel: Brauen-Knopf ist gesperrt ohne Zutaten und braut mit Zutaten“ (Rucksack füllen, Knopf antippen, `hatTrank(…) === 1`), „Rezeptbuch: nennt jede Wirkung und jede Pflanze“ (Text enthält alle `SC.PFLANZEN[*].name`), „Kreativ-Reiter Tränke: 54 Kacheln, Antippen legt einen Trank in den Rucksack“.
- [ ] **Step 2: Fehlschlag prüfen:** `bash scripts/tests-wsl.sh Kessel`.
- [ ] **Step 3: Implementieren** nach den Mustern in `js/ui-werkbank.js` und `js/ui.js`; Texte in `SC.T` (`kesselTitel`, `rezeptbuchTitel`, `trankBrauen`, `trankFehlt`, `trankGetrunken`, Wirkungsnamen und Tier-Teil-Beschreibungen, `traenkeTitel`). Benutzen auf `SC.B.KESSEL` in `js/survival.js` öffnet `zeigeKessel` (wie bei der Werkbank). Skriptlisten ergänzen (`js/ui-kessel.js` nach `js/ui-werkbank.js`).
- [ ] **Step 4: Tests laufen lassen**, dann im echten Spiel (Chrome, `file://`) mit Maus und simuliertem Touch Kessel, Rezeptbuch und Kreativ-Reiter öffnen und einen Trank brauen; Ergebnis im Abschlussbericht nennen (Controller-Navigation nur, wenn im Browser prüfbar).
- [ ] **Step 5: Commit:** „Tränke: Kessel-Fenster, Rezeptbuch und Kreativ-Reiter; Refs #146“.

### Task 7: Verwandlung (Aussehen) und Netz

**Files:**
- Modify: `js/render-mitspieler.js` (`SC.Figur.verwandle`, Aufruf in `_neu` und `aktualisiere`), `js/render.js` (eigene Figur, Zeile ca. 112), `js/raum.js` (Zustand Zeilen 150, 221, 331), `js/netz.js` (Protokoll), `js/spiel.js` (Wert `trank` der eigenen Figur an Raum/Gast), `tests/test-render-mitspieler.js`, `tests/test-raum.js`, `tests/test-traenke.js`

**Interfaces:**
- Consumes: `SC.TRANK.wirkung[kristall].farbe`, `SC.PFLANZEN[pflanze].teil`.
- Produces: `SC.Figur.verwandle(figur, schluessel)` — `figur` ist das Rückgabeobjekt von `SC.Figur.baue(farbe)`; `schluessel` ist `"kristall:pflanze"` oder `null`. Baut vorhandene Trank-Teile ab und die neuen auf (idempotent, gleicher Schlüssel baut nichts neu). Teile je `teil`: `hasenohren` (zwei lange Ohren auf dem Kopf, Puschelschwanz), `katzenoehrchen` (zwei kurze Ohren, schlanker Schwanz), `fuchsohren` (zwei Ohren, buschiger Schwanz), `eisbaerohren` (zwei runde Ohren), `pinguinfluegel` (kleine Flügel an den Armen), `salamanderschwanz` (Schwanz mit leuchtender Spitze), `papageienfedern` (drei bunte Federn am Kopf), `froschaugen` (zwei große Augen oben am Kopf), `affenschwanz` (langer dünner Schwanz). Dazu **Leuchten**: Körperteile emissiv in der Kristallfarbe (leuchtende Materialien wie bei `leuchtet: true` in den Wesen-Modellen) und höchstens 6 kleine Funken-Würfel, die um die Figur kreisen (wenige Meshes, kein Echtzeitlicht je Figur).
- Netz: Zustand der Figur (`zustand()` in `js/raum.js`) und Gast-Meldung bekommen das Feld `trank` (String `"kristall:pflanze"` oder `null`, gebildet mit `SC.Trank.schluessel(kampf.trank.kristall, kampf.trank.pflanze)`, `null` ohne Trank); Gastgeber leitet es an alle weiter wie `ausr`; `SC.NETZ_PROTOKOLL = 11` mit Kommentar „11: Tränke (zustand.trank)“. `SC.RenderMitspieler#aktualisiere` ruft `SC.Figur.verwandle(o.f, e.trank || null)`.
- Nachtsicht (Weiß): Die eigene Figur schaltet das vorhandene Punktlicht für leuchtende Blöcke in der Hand ein (im Renderer suchen, wo es für einen gehaltenen Leuchtblock aktiv wird) und liefert damit helleres Licht um die Figur, solange `kampf.trank` Weiß ist.

- [ ] **Step 1: Tests:** „Verwandlung: jede der neun Pflanzen baut Teile, null baut sie ab“ (Anzahl Kinder der Figurgruppe nach `verwandle(f, "rot:"+id)` größer als vorher, nach `verwandle(f, null)` wieder gleich vorher); „Verwandlung: gleicher Schlüssel ändert nichts“ (Kinderzahl bleibt, Objektidentität der Teile bleibt); „Verwandlung: Leuchtfarbe folgt dem Kristall“ (Material-Emissivfarbe bei `gelb` ≠ bei `blau`); „Verwandlung: höchstens 40 zusätzliche Meshes je Figur“ (Obergrenze für die iPad-Leistung); „Netz: zustand enthält trank und Protokoll 11“ (`SC.NETZ_PROTOKOLL === 11`, Gast-Zustand `trank` kommt beim Gastgeber an, nach dem Muster der vorhandenen Tests in `tests/test-raum.js`); „Netz: ein Zustand ohne trank (alter Gast) zeigt keine Verwandlung und wirft nicht“.
- [ ] **Step 2: Fehlschlag prüfen:** `bash scripts/tests-wsl.sh Verwandlung`.
- [ ] **Step 3: Implementieren.** Vor dem Schreiben `Read` von `js/render-mitspieler.js` Zeilen 1–100 (Aufbau von `SC.Figur.baue`); die Teile als Gruppe `figur.traenke` am Kopf bzw. Körper, damit `verwandle` sie in einem Zug entfernt und ihre Materialien freigibt (wie `_weg`).
- [ ] **Step 4: Tests laufen lassen**, danach ganze Testseite; im echten Spiel mit zwei Tabs (Gastgeber und Gast über Raumcode, falls PeerJS erreichbar; sonst im Bericht ausdrücklich „nicht geprüft“) die Verwandlung bei sich und beim Mitspieler ansehen.
- [ ] **Step 5: Commit:** „Tränke: Verwandlung mit Tier-Teilen und Leuchten, Netzprotokoll 11; Refs #146“.

### Task 8: Pflanzen in der Welt (Beute, Wachsen, Nachwachsen)

**Files:**
- Modify: `js/generator.js` (Pflanzen platzieren, `SC.GENERATOR_VERSION = 4`), `js/kampf.js` (Beute, Zeile ca. 199), `js/traenke.js` (`SC.Trank.beute`, `SC.Trank.nachwuchs…`), `js/welt.js` oder `js/spiel.js` (Pflücken merken, Nachwuchs-Takt), `js/spielstand.js` (Liste speichern), `tests/test-generator.js`, `tests/test-traenke.js`

**Interfaces:**
- Produces: `SC.Trank.beute(planetId, boss, zf) -> { block, anzahl } | null`: wählt eine der drei Pflanzen des Planeten (`SC.PFLANZEN[*].planet === planetId`) mit Chance `SC.TRANK.beuteChance` (Boss: immer), Menge 1; `zf` ist die Zufallsfunktion (`zf()` in 0..1) wie in `js/kampf.js`. Die Beute wird an der vorhandenen Stelle zur Gegner-Beute (`def.teile`-Schleife) hinzugefügt.
- Produces: Generator: auf Welten mit `planet.generatorVersion >= 4` stehen die Pflanzen des jeweiligen Planeten auf Bodenblöcken (Gras, Schnee, Moos je nach Planet) mit Hash `SC.hash3` wie `LEUCHTPILZ`, etwa eine Pflanze auf 200 Bodenzellen; Version 3 und älter bleiben unverändert. Neue Welten bekommen `SC.GENERATOR_VERSION = 4`.
- Produces: Nachwachsen: `SC.Trank.pflueckeMerken(liste, x, y, z, block, jetzt) -> void` hängt `[x, y, z, block, jetzt + SC.TRANK.nachwuchs]` an `daten.nachwuchs[planetId]` an (höchstens 400 Einträge, älteste fallen weg); `SC.Trank.nachwuchsTakt(welt, liste, jetzt) -> Anzahl` setzt jeden fälligen Eintrag, dessen Zelle noch **Luft** ist und deren Chunk geladen ist, zurück auf den Pflanzenblock und entfernt ihn aus der Liste; ist die Zelle belegt (z. B. gebaut), wird der Eintrag verworfen; noch nicht geladene Einträge bleiben. `jetzt` ist `daten.spielzeit`. Aufruf einmal pro Sekunde. Fehlt `daten.nachwuchs` (alter Stand), gilt `{}`.

- [ ] **Step 1: Tests:** „Beute: Pflanze des Planeten mit Chance, Boss immer“ (feste `zf`-Werte; `beute("start", false, ()=>0)` → eine Pflanze mit `SC.PFLANZEN[…].planet === "start"`, `()=>0.99` → `null`, Boss → nie `null`); „Generator: Version 4 enthält Pflanzen, Version 3 ist unverändert“ (gleicher Seed zweimal: Chunk mit `generatorVersion 3` identisch zum Ergebnis vor dieser Änderung — die vorhandene Prüfsumme in `tests/test-generator.js` bzw. `tests/test-planeten.js` bleibt gleich; Version 4 hat mindestens eine Pflanze in einer Probe von 16 Chunks); „Nachwachsen: fälliger Eintrag setzt die Pflanze, Zelle belegt verwirft, nicht fällig bleibt, ungeladen bleibt“; „Nachwachsen: Liste ist auf 400 begrenzt“; „Nachwachsen: Stand ohne daten.nachwuchs wirft nicht“.
- [ ] **Step 2: Fehlschlag prüfen:** `bash scripts/tests-wsl.sh Nachwachsen` und `Beute:`.
- [ ] **Step 3: Implementieren.** `Read` von `js/generator.js` Zeilen 90–145 (Erze, `LEUCHTPILZ`). Pflücken: beim Abbauen einer Pflanze (`SC.Abbau.ergibt` liefert den Pflanzenblock, weil Pflanzen ihre eigene ID ergeben) `pflueckeMerken` aufrufen, im Survival und im Kreativ; im Mehrspieler rechnet der Gastgeber (Gäste bekommen die neuen Blöcke über die normale Block-Synchronisation).
- [ ] **Step 4: Tests laufen lassen**, danach ganze Testseite (Prüfsummen-Tests unverändert grün); im echten Spiel eine neue Welt anlegen, Pflanzen suchen und pflücken, `daten.spielzeit` per Entwicklerwerkzeug vorstellen und das Nachwachsen sehen.
- [ ] **Step 5: Commit:** „Tränke: Pflanzen als Beute, in neuen Welten und Nachwachsen; Refs #146“.

### Task 9: Geräusche, Anleitung, Version, Doku

**Files:**
- Modify: `js/audio.js` (Geräusche `brauen`, `trinken`), `js/texte.js` (Anleitung), `docs/ANLEITUNG.md` (neu erzeugen), `index.html` (Version), `docs/ROADMAP.md`, `tests/test-audio.js`, `tests/test-traenke.js`

**Interfaces:**
- Produces: Geräusche `brauen` (blubbernde Töne, ca. 0,6 s) und `trinken` (Schluck-Glucksen, dann kurzer Klingelton aufwärts, ca. 0,5 s) in `SC.Klang.erzeuge`; Aufruf `this.audio.spiele("brauen")` beim erfolgreichen Brauen (Task 6) und `"trinken"` in `trankTrinken` (Task 5). Beide sind im Code erzeugt, ohne Audiodateien.
- Produces: Anleitung (`SC.T.anleitung`) um Abschnitt „Zaubertränke“ erweitert: Kessel an der Werkbank bauen, Flasche aus Glas, Kristallfarbe gibt die Wirkung, Pflanze die Tier-Teile, Rezeptbuch im Kessel und im Rucksack, Trank mit der Benutzen-Taste trinken, 3 Minuten, ein neuer Trank ersetzt den alten, im Kreativmodus gibt es alle Tränke im Reiter „Tränke“.

- [ ] **Step 1: Tests:** „Klang: brauen und trinken sind hörbar und endlich“ (Muster aus `tests/test-audio.js`, `OfflineAudioContext`, `rms > 0.005`, keine NaN); „Anleitung: nennt Kessel, Rezeptbuch und Trank“ (`SC.T.anleitung` enthält die drei Wörter, sofern die Anleitung ein String ist; sonst die vorhandene Struktur prüfen).
- [ ] **Step 2: Fehlschlag prüfen:** `bash scripts/tests-wsl.sh Klang:`.
- [ ] **Step 3: Implementieren;** `docs/ANLEITUNG.md` mit dem Skript erzeugen, das die bisherige Datei erzeugt hat (im Repo suchen: `grep -rn "ANLEITUNG.md" scripts docs`; falls kein Skript existiert, den Abschnitt von Hand identisch zu `SC.T.anleitung` eintragen). Version `0.31.0`. `docs/ROADMAP.md`: Stand, Netzprotokoll 11, nicht Geprüftes (Controller am Gerät, iPad-Leistung der Verwandlung, zu zweit über PeerJS), Werte als Vorschläge (Wirkungsstärken, Dauer, Beutechance, Wachstumszeit, Pflanzennamen).
- [ ] **Step 4: Ganze Testseite:** `bash scripts/tests-wsl.sh` → `Fertig: N ok, 0 fehlgeschlagen`, keine ❌-Zeilen.
- [ ] **Step 5: Commit:** „Tränke: Geräusche, Anleitung, Version 0.31.0; Refs #146“. Danach Abschlussbericht an den Nutzer mit ehrlicher Liste, was nur per Test und was im echten Spiel geprüft wurde; kein Push ohne Auftrag.
