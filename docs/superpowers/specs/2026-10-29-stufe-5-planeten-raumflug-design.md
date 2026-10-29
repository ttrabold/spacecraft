# Stufe 5: Neue Planeten und Raumflug – Design

Stand 2026-10-29, mit dem Nutzer abgestimmt. Entscheidungen, die ich (Claude) selbst getroffen habe, sind mit *(eigene Entscheidung)* markiert.

## Absicht

Die Kinder sollen mit dem Raumschiff vom Startplaneten abheben, durch die Atmosphäre ins All fliegen, unterwegs etwas erleben und auf einem neuen Planeten landen, ohne Ladebildschirm. Neue Planeten sind neue Abenteuer: andere Landschaft, andere Gegner, bessere Beute. Vorbild bleibt Star Wars (Sprungantrieb mit Sternstreifen) und No Man's Sky (nahtloser Übergang Boden ↔ All). Kindgerecht bleibt Pflicht.

Stufe 5 hat zwei Teile, die nacheinander umgesetzt und jeweils als eigene Version veröffentlicht werden:

- **5a: Neue Planeten** – zwei neue Planeten zum Erkunden, zunächst erreichbar über die Entwicklerwerkzeuge. Dazu der Planetenwechsel im Spiel und im gemeinsamen Spiel.
- **5b: Raumschiff und Raumflug** – Raumschiff finden, abheben, All, Sprungantrieb, Asteroiden, Piraten, Landung.

Je ein eigener Plan; dieses Design gilt für beide.

## Ziele 5a: Neue Planeten

**Drei Planeten** in jeder Welt: der bisherige Startplanet und zwei neue. Jeder hat eine eigene Farbpalette, eigene Landschaft, eigene Gegner und einen eigenen Boss.

| Planet | Name *(eigene Entscheidung)* | Landschaft | Gegner *(eigene Entscheidung)* | Boss |
|---|---|---|---|---|
| Start | (wie bisher) | wie bisher | wie bisher | wie bisher |
| Feuer und Eis | **Glutfrost** | Eisflächen, Schneefelder, Gletscher; dazwischen Lavaseen und Vulkankegel | **Lavagolem** (langsam, kräftiger Nahkampf, glüht), **Frostkrabbler** (schnell, in Gruppen, kleiner Biss) | **Magmakönig** (großer Lavariese, stampft, wirft Glutbrocken) |
| Dschungel und Sumpf | **Rankenmoor** | dichter, hoher Dschungel mit Riesenbäumen, Sümpfe mit trübem Wasser und Schlamm, viele Leuchtpflanzen | **Rankenschleicher** (lauert im Dickicht, springt an), **Sumpfspucker** (Fernkampf, spuckt Schleim) | **Sumpfkoloss** (riesiges Sumpfwesen, zieht Ranken, ruft Schleicher) |

Alle Gegner lustig-bedrohlich statt düster, blockig wie die bisherigen, mit Leuchtteilen (Augen, Glut, Pflanzen); besiegte verpuffen.

**Neue Blöcke**
- **Lava**: flüssig wie Wasser (nicht fest), leuchtet stark. Im Survival: Schaden und Rückstoß aus der Lava heraus, man verpufft nicht dramatisch darin; im Kreativmodus harmlos. Fahrzeuge (Gleiter) schweben über Lava wie über Wasser.
- **Eis**: fest, glatt – zu Fuß und mit Fahrzeugen rutscht man etwas nach.
- **Schlamm**: fest, man läuft darin langsamer.
- Weitere Blöcke nach Bedarf der Landschaft (z. B. Basalt, Vulkangestein, Riesenblätter), über die vorhandene Blocktabelle und Palette je Planet.

**Fortschritt** *(eigene Entscheidung)*: Gegner und Beute auf den neuen Planeten sind stärker als auf dem Startplaneten (höhere Ortsstufen, bessere Seltenheiten), damit sich die Reise lohnt und man spürbar stärker wird. Glutfrost mittel, Rankenmoor am schwersten.

**Bauwerke**: Die vorhandenen Bauwerksarten (Lager, Station, Herrenhaus, Dungeon) gibt es auch auf den neuen Planeten, in den Farben des Planeten, mit dessen Gegnern und Bossen. Fahrzeug-Fundorte gelten dort ebenso.

**Planetenwechsel (Grundlage für 5b)**
- Die Welt speichert jeden Planeten getrennt (Chunks, Kisten, geräumte Bauwerke, Fahrzeuge), das Format kann das schon (`daten.planeten`, `aktuellerPlanet`). Neue Planeten werden in bestehenden Spielständen beim ersten Besuch angelegt; Seed aus dem Welt-Seed abgeleitet.
- Im Spiel kann man den aktuellen Planeten wechseln, ohne die Welt zu verlassen. In 5a nur über die Entwicklerwerkzeuge (F3: Planet wählen → man steht am Landepunkt des Planeten).
- Bei der Ankunft auf einem Planeten erscheint sein Name groß im Bild *(eigene Entscheidung)*.
- Jeder Planet hat einen **Landepunkt** (wie der Startpunkt), dort steigt man nach einer Niederlage wieder ein.
- **Gemeinsames Spiel:** Alle Spieler sind immer auf demselben Planeten. Wechselt der Gastgeber den Planeten, kommen alle Gäste mit. Gäste können in 5a nicht selbst wechseln.

## Ziele 5b: Raumschiff und Raumflug

**Raumschiff**
- Ein Raumschiff mit **vier Plätzen** (wie die Fahrzeuge: 1 Pilot, 3 Mitfahrer), Star-Wars-angelehnt, blockig, mit Leuchtstreifen und Triebwerksglühen.
- Es steht auf einem **Landeplatz nahe dem Startpunkt** (wie der Start-Gleiter), auch in bestehenden Welten. Einsteigen wie bei Fahrzeugen.
- In der Atmosphäre fliegt es wie der Flieger, aber schneller und höher; Bordlaser; Schild statt Panzerung (lädt sich wieder auf).
- Man kann überall landen und jederzeit zu jedem bekannten Planeten fliegen, auch zurück.

**Ablauf eines Flugs (ohne Ladebildschirm)**
1. **Abheben und Aufstieg:** Steigt das Schiff über die normale Flughöhe, wird der Himmel dunkler, die Landschaft bleibt unter einer Dunst-/Wolkenschicht zurück.
2. **Verlassen der Atmosphäre:** Ein kurzer Glüh- und Schütteleffekt; danach ist man im All und sieht den Planeten als Kugel unter sich kleiner werden.
3. **Im All:** Sterne, Sonne, die anderen Planeten als Kugeln in den Farben ihrer Palette. Man fliegt frei (Steuerung wie in der Atmosphäre, ohne Boden). Ein Flug zum Nachbarplaneten dauert etwa **30–60 Sekunden**.
4. **Sprungantrieb:** Ein Ziel anwählen (einfache Zielauswahl, auch per Touch und Gamepad) und springen: Sterne ziehen zu Streifen, nach wenigen Sekunden kommt man kurz vor dem Zielplaneten heraus.
5. **Unterwegs:** **Asteroidenfelder** zum Ausweichen (Treffer kosten Schild) und gelegentlich **Weltraumpiraten** – kleine Jäger, lustig-bedrohlich, mit dem Bordlaser abzuwehren, sie verpuffen und lassen Beute fallen. Beute im All geht direkt in den Rucksack *(eigene Entscheidung)*.
6. **Eintritt und Landung:** Auf den Planeten zufliegen → Glühen beim Eintritt → man kommt über der Stelle des Planeten heraus, auf die man zugeflogen ist, und kann frei landen.

**Kindgerecht und fehlerverzeihend**
- Im All kann das Schiff **nicht verpuffen**. Ist der Schild leer, gibt es einen **Notsprung** zum zuletzt besuchten Planeten (Landung am Landepunkt), ohne Verlust *(Vorschlag des Nutzers bestätigt)*.
- Wird man im Survival besiegt, steigt man **am Raumschiff bzw. am Landepunkt** des aktuellen Planeten wieder ein.
- Speichern und Verlassen im All: Beim nächsten Laden ist man auf dem zuletzt besuchten Planeten am Landepunkt, das Schiff daneben *(eigene Entscheidung)*.

**Gemeinsames Spiel**
- Ins All geht es **nur, wenn alle Spieler an Bord sind**; sonst bleibt das Schiff an der Grenze der Atmosphäre und zeigt „Alle müssen an Bord sein“. Weil das Schiff vier Plätze hat und höchstens vier Spieler im Raum sind, passt das immer.
- Landen und Aussteigen auf dem neuen Planeten: alle sind dort; der Planetenwechsel läuft für alle gleichzeitig (Mechanik aus 5a).
- Wer fliegt, steuert (auch ein Gast); Piraten, Asteroiden und Schild rechnet der Gastgeber, wie bei Gegnern und Fahrzeugen.

## Nicht-Ziele in Stufe 5

- Erkundbare Raumstationen (später, als Issue festhalten).
- Spieler auf verschiedenen Planeten gleichzeitig.
- Fahrzeuge im Raumschiff mitnehmen; Raumschiffe bauen oder verbessern (Crafting kommt nach Stufe 5).
- Mehr als drei Planeten, zufällig erzeugte Sonnensysteme.
- Realistische Raumfahrtphysik (Schwerkraft, Umlaufbahnen); Planeten stehen fest.
- Andocken, Handeln, Weltraumkämpfe mit großen Schiffen.

## Anti-Ziele (wäre ein Fehlschlag, auch wenn es technisch läuft)

- Ladebildschirm oder harter Schnitt zwischen Boden und All.
- Der Flug ist langweilig oder zu lang; oder so schwer, dass Kinder im All die Orientierung verlieren und den Zielplaneten nicht finden.
- Man verliert im All das Schiff, die Ausrüstung oder hängt fest.
- Ein Mitspieler bleibt allein auf einem Planeten zurück oder sieht die anderen nicht mehr.
- Lava oder Gegner wirken grausam.
- Leistungseinbruch: Das Spiel wird beim Aufstieg, im All oder auf den neuen Planeten spürbar langsamer als heute (Tablet, Chrome/Firefox am Mac; siehe 0.7.2–0.7.4).
- Bestehende Spielstände brechen oder verlieren den Startplaneten.

## Rahmenbedingungen

- Alles aus AGENTS.md: kein Build, keine Module, `file://`, ältere iOS-Safari, Deutsch, Ladereihenfolge in `index.html` und `tests/index.html` gleich.
- **Spielstand-Kompatibilität:** Neue Planeten und Felder werden beim Laden nachgezogen; der Startplanet bleibt unverändert (gleiche Chunks, gleicher Generator). Neue Planeten dürfen eine neue Generatorlogik haben.
- **Planeten bleiben Tori** wie bisher (Größe 2048, umlaufend); die Kugel im All ist nur die Darstellung. Ein Punkt auf der Kugel entspricht einer Stelle auf dem Torus (Längen-/Breitengrad → x/z), damit man dort landet, wo man hinfliegt.
- **Leistung:** Planetenkugeln und All mit wenig Geometrie (keine Chunks im All); beim Aufstieg werden Chunks wie gewohnt entladen.
- Mehrspieler-Protokoll wird erhöht, wenn neue Nachrichten nötig sind.
- Steuerung für Tastatur/Maus, Touch und Gamepad.
- Versionen: 5a als 0.8.0, 5b als 0.9.0.

## Technische Entscheidungen (getroffen)

- Planeten über eine Planetentabelle (Id, Name, Palette, Landschaftsregeln, Gegner, Boss, Ortsstufen), so dass weitere Planeten später nur Einträge sind.
- Gegner der neuen Planeten als Einträge in `SC.GEGNER`, Bauwerke über die vorhandenen Vorlagen.
- Fahrzeug- und Raumschifflogik baut auf `SC.Fahrzeug` auf (Sitze, Abgleich, Panzerung → Schild).

## Was dem Planer überlassen ist

- Konkrete Landschaftsregeln, Blockfarben, Paletten, Gegnerwerte, Ortsstufen und Beutetabellen je Planet.
- Wie der Übergang Boden → All technisch umgesetzt wird (Höhe, ab der das All beginnt; Kaschieren des Wechsels durch Wolken/Glühen; Koordinaten im All; Abbildung Kugel ↔ Torus).
- Größe und Anordnung des Sonnensystems, Flugtempo, Sprungdauer, Häufigkeit von Asteroiden und Piraten.
- Zielauswahl und Anzeige im Cockpit (Ziel-Markierung, Entfernung) für alle Eingabegeräte.
- Musikstimmung für das All im vorhandenen Musiksystem *(Vorschlag: eigene ruhige, weite Stimmung)*.
- Nachrichten für Planetenwechsel und Raumflug im gemeinsamen Spiel.
- Aufteilung in Aufgaben.

## Prüfen

- Testseite grün mit neuen Tests (Planetentabelle, Generator je Planet deterministisch, Lava/Eis/Schlamm, neue Gegner, Planetenwechsel und Speichern je Planet, Nachziehen in alten Spielständen, Mehrspieler-Planetenwechsel, Kugel↔Torus-Abbildung, Notsprung, „alle an Bord“).
- Spieltest per DevTools auf beiden neuen Planeten und für einen ganzen Flug; Leistung messen (Bildzeit, Zeichenaufrufe) am Boden, beim Aufstieg und im All.
- Mehrspieler mit zwei Browserfenstern: gemeinsamer Planetenwechsel, gemeinsamer Flug.
- Gerätetest durch den Nutzer in der Test-Vorschau (iPad, iPhone, Mac mit Chrome/Firefox/Safari).
