# Design: Spiel-UI und Controller-Navigation

**Intent:** Das Spiel-UI soll ruhiger und besser lesbar werden, und die Menüs – besonders
die Inventare – sollen sich mit dem Controller flüssig bedienen lassen. Gespielt wird
überwiegend am **iPad im Querformat mit Controller** (Nutzer, 2026-11-03). Touch bleibt
zweite Bedienung, Desktop drittes.

**Warum:** Heute ist das HUD über vier Ecken verteilt und der Text liegt nur mit Schatten
über der Welt; ohne Maus gibt es auf dem iPad keinen Hover, also sieht man nicht, was man
ausgewählt hat. Die Controller-Navigation in Menüs ist eine flache Liste: `js/gamepad.js:36`
liefert für hoch, runter, links und rechts nur eine gemeinsame Stufe ±1, und `js/ui.js:60`
geht die Elemente in der Reihenfolge des DOM ab. Im Rucksack stehen die Ausrüstungsfelder vor
dem Raster, das Raster vor den Knöpfen unter dem Detail – von Feld 60 zu „Anlegen“ muss man
durch alles durchwandern, und nichts rollt ins Sichtbare.

## Ziele

- Ein festes Statusfeld zeigt Stufe, Werte und die gerade gewählte Sache dauerhaft.
- Menüs im Spiel (Rucksack, Werkbank, Truhe, Blockauswahl) verdecken die Welt nicht mehr.
- Steuerkreuz und linker Stick bewegen in Inventaren in Reihen und Spalten, nicht in Leserichtung.
- Der Fokus rollt ins Sichtbare und ist als Cursor deutlich sichtbar.
- Bereich (Zone) wechseln mit einer Taste, Anlegen ohne Umweg über den Knopf.
- Touch- und Mausbedienung bleiben nutzbar, die Tests bleiben grün.

## Nicht-Ziele

- Keine neuen Spielregeln, keine neuen Fenster, kein Umbau des Kampfs oder der Speicherstände.
- Kein neuer Speicherstand, keine neuen Einstellungsfelder.
- Kein Bundle, keine ES-Module, keine Abhängigkeiten; `file://` muss weiter laufen.

## Ansätze (im Chat entschieden)

1. *Feinschliff im bisherigen Stil* (Cyan auf Dunkelblau, feste Schrittgrößen, HUD-Cluster):
   billig, Look bleibt unverwechselbar → nicht gewählt, weil Menüs die Welt weiter verdunkeln
   und für Kinder klein und detailreich bleiben.
2. **Ruhige Panels, Welt bleibt sichtbar** (gewählt): weiche Panels, kein Leuchten, fester
   Abstandsrhythmus, Status oben links, Hotbar unten Mitte, Menüs als Seitenenteil.
   Abwägung: schwächt den eigenen Charakter; Durchscheinen gibt es auf älterem Safari nicht
   überall, und Unscharfe über dem WebGL-Bild kostet Bilder.
3. *Bordcomputer* (Monospace, Bernstein, Konsolenrahmen): thematisch passend zur Weltraumstufe
   → nicht gewählt, aufwendig und auf dem iPad schnell unleserlich.

Layout (iPad Querformat): **Status oben links, Hotbar unten Mitte** (gewählt, vor den
Alternativen „alles unten in einer Zone“ und „Hotbar in der rechten Daumenzone“).

## Decisions

- **Panels im Spiel dicht, ohne Unscharfe.** `backdrop-filter` über dem Leinwandbild kostet auf
  älteren iPads Bilder pro Sekunde. Unscharfe nur dort, wo die Welt stillsteht (offene Menüs).
- **Seitenpanels im Spiel, Fenster bleiben Fenster.** Rucksack, Werkbank, Truhe und Blockauswahl
  werden Seitenteil (Welt sichtbar, weil ein offenes Menü die Welt ohnehin anhält – `js/survival.js:189`);
  Weltliste, Einstellungen und Anleitung bleiben zentrale Fenster.
- **Statusfeld oben links:** Stufe, Lebensanzeige, Schutz, Schild, Hitze, Name und Anzahl der
  gewählten Sache. Die Modusanzeige unten links und die FPS-Anzeige ziehen in dieses Feld;
  die Controller-Hilfe rückt nach oben rechts.
- **Zonen statt flacher Liste.** Die Bereiche eines Fensters werden durch Container markiert
  (Ausrüstung, Detail und Knöpfe, Raster, untere Knöpfe). Reihen und Spalten werden aus der
  Geometrie der fokussierbaren Elemente ermittelt (Zeilen über `getBoundingClientRect`), damit
  Raster, Listen und gemischte Layouts denselben Code benutzen.
- **Knöpfe im Menü:** Steuerkreuz/Stick = Bewegung in der Zone, **LB/RB = Zone wechseln**,
  A = Aktion des fokussierten Elements, Y = Anlegen bzw. in die Schnellleiste legen,
  B = zurück (erst Zone verlassen, dann Fenster schließen), Start = schließen.
  LB/RB sind im Menü frei, weil die Schnellleiste dort nicht gebraucht wird (Entscheidung des
  Nutzers, Vorschlag 1).
- **Detail folgt dem Fokus** (mein Vorschlag): das fokussierte Feld zeigt Name und Werte sofort,
  ohne dass man es erst mit A antippt. A bleibt die Aktions-Taste; das Zweite-Klicken-Verschieben
  (`js/ui-rucksack.js:108`) bleibt, aber der zweite Tipp gilt für das fokussierte Feld.
- **Regler ohne Modus:** Hat ein Regler den Fokus, verstellt das Steuerkreuz ihn direkt; hoch und
  runter verlässt ihn. Der `_reglerModus`-Umschalter in `js/ui.js:73` fällt weg.
- **Halten bewegt schneller:** Wiederholung etwa alle 200 ms statt 300 ms, weil Raster groß sind.
- **Fokus sichtbar:** eigener Cursor-Rahmen (2–3 px) mit deutlichem Abstand zum Spielfeld;
  `:focus-visible` bleibt für Tastatur und Gamepad bestehen.
- **Aufwärtskompatibel:** `aspect-ratio` und `gap` bleiben (nutzt der Code schon); zusätzlich
  `@supports not (backdrop-filter: none)` als Fallschirm für dichte Panels.
- **Action-Namen bleiben:** `data-aktion`-Namen (zum Beispiel `rezept`, `platz`, `aplatz`) ändern
  sich nicht, weil die Tests darauf klicken (`tests/test-crafting.js:114`, `tests/test-bauteile.js:118`).
- **Tests:** neu in `tests/test-gamepad.js` (Zeilen- und Spaltenbewegung in einem Raster,
  Zonenwechsel über LB/RB, Anlegen ohne Knopf, Regler direkt verstellen) und in
  `tests/test-ui.js` (Statusfeld zeigt gewählte Sache, Fokus rollt ins Sichtbare).
  Bestehender Test „Menü mit dem Steuerkreuz bedienen“ muss auf das Richtungmodell angepasst werden.
- **Version:** 0.22.0 (neue Funktionen im UI → MINOR).

## Offene Fragen an den Nutzer

1. Zone beim Öffnen des Rucksacks: direkt ins Raster oder in die Ausrüstung? (Vorschlag: Raster.)
2. Querformat ist gesetzt – soll das Hochformat mit gleichen Abständen weiter funktionieren
   (Status oben links bleibt, Knöpfe rücken), oder wird es bewusst nicht gepflegt?
3. Zwei Commits oder einer: erst der Look, dann die Navigation – oder beides zusammen?

## Entschieden

- Bedienung primär am iPad im Querformat mit Controller (Nutzer, 2026-11-03).
- Ruhige Panels (Ansatz 2) und Status oben links mit Hotbar unten Mitte (Nutzer, 2026-11-03).
- Zonenwechsel über die Schultertasten, Bewegung in Reihen und Spalten (Nutzer, 2026-11-03).
