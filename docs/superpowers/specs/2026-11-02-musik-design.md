# Bessere Musik – Design

Stand: Entwurf (2026-11-02), noch nicht mit dem Nutzer abgestimmt.

## Ausgangslage

Die Musik wird im Code erzeugt (`js/musik.js` komponiert, `js/audio.js` spielt mit Synthesizer-Instrumenten). Vision bleibt: selbst komponiert, generativ, keine Audiodateien, keine fremden Melodien (siehe Roadmap).

Rückmeldung des Nutzers: „wirklich schlecht“. Genannte Probleme: Melodie klingt zufällig, Klang wie Synthesizer, zu eintönig, passt nicht zur Stimmung. Gewählter Ansatz: den Komponisten verbessern (nicht Audiodateien, nicht Handnoten).

Ursachen im heutigen Code:

- **Melodie ist ein Zufallsweg.** Pro Takt wird ein Rhythmus gewürfelt, dann springt die Melodie zum nächsten Akkordton und macht Schritte ±1–2. Es gibt kein Motiv, das wiederkehrt.
- **Keine Form.** 16 Takte, vier gewürfelte Akkordfolgen aneinandergehängt, kein Anfang/Höhepunkt/Schluss außer der Schlusskadenz bei „tag“.
- **Begleitung starr.** Jeder Takt hat dieselbe Streicher-/Pauke-/Trommelfigur, keine Dynamik über das Stück.
- **Klang.** Instrumente sind rohe Sägezahn-/Dreieckwellen durch einen Tiefpass: kein Vibrato, ein Hall für alles, alle Instrumente mittig.
- **Stimmung.** Es gibt nur Tag/Nacht/Tief/Kampf/Boss. Alle Planeten klingen gleich; im All läuft die „nacht“-Musik (`js/spiel.js` ruft dort `musikTakt("nacht")`).

## Ziel

Die Musik soll sich wie ein Stück anfühlen: ein wiedererkennbares Thema, das sich entwickelt und wiederkehrt, Steigerung und Beruhigung, und ein weicherer, orchestralerer Klang. Kindgerecht bleibt Pflicht: heldenhaft und abenteuerlich, nicht düster; die Nacht geheimnisvoll, nicht gruselig.

## Design

### 1. Thema und Form (musik.js)

- **Motiv statt Zufall.** Pro Stück wird ein Motiv (3–5 Töne mit Rhythmus) aus einem Katalog je Stimmung gewählt, z. B. „Heldenruf“ (Quinte hoch, punktierter Abstieg) für den Tag, „Frage“ (kleine Sekunde, Terz) für die Nacht. Das Motiv wird nur diatonisch verschoben, umgekehrt oder verkürzt, nie neu gewürfelt.
- **Phrasen als Frage und Antwort.** 2 Takte Frage enden auf einem Spannungston (Terz/Quinte), 2 Takte Antwort enden auf dem Grundton.
- **Form A–A′–B–A″, 32 Takte** (bei Tag/Nacht/Tief; Kampf/Boss bleiben 16 Takte in Schleife):
  - A: Thema.
  - A′: Thema als Sequenz auf anderer Akkordstufe, Antwort leicht verändert.
  - B: Kontrast – andere Akkordfolge, höhere oder tiefere Lage, Gegenmelodie im zweiten Instrument.
  - A″: Thema zurück, voller instrumentiert, mit Schlusskadenz.
- **Thema pro Welt.** Das Motiv hängt vom Welt-Seed ab (heute zählt `_seed` ab Startzeit), damit jede Welt ihr eigenes Hauptthema hat, das über alle Stücke und Tageszeiten wiederkehrt. Die Variation (Form, Begleitung) ändert sich pro Stück.

### 2. Begleitung und Dynamik

- Dynamikkurve über das Stück (leiser Beginn, Steigerung zum A″, Ausklang), über einen Lautstärkefaktor je Abschnitt.
- Abschnitte unterscheiden sich: A nur Streicher + Pauke, A′ dazu Blech-Akzente, B ohne Blech aber mit Harfen-Arpeggio, A″ alles.
- Basslinie mit Grundton/Quinte-Wechsel statt Dauerton, Arpeggio-Ostinato in den Streichern bei Kampf/Tief.
- Auftakt und Ritardando am Stückende statt hartem Abbruch.

### 3. Klang (audio.js)

- **Vibrato** (LFO ~5 Hz, einblendend) bei Streichern, Horn, Blech.
- **Streicher:** langsamerer Ansatz, mehrere leicht verstimmte Stimmen, Formantfilter für Wärme.
- **Holzbläser neu** (Flöte, Klarinette) für die Gegenmelodie, mit eigener Wellenform über `PeriodicWave` (Obertöne wie ein echtes Instrument), mit Rückfall auf Sinus.
- **Glockenspiel/Celesta** für Nacht und All.
- **Hall:** längerer, dunklerer Hall; Anteil je Instrument (Pauke trocken, Streicher nass).
- **Stereo:** `StereoPannerNode` je Instrument (links Streicher, rechts Blech, Mitte Pauke), nur wenn der Browser ihn kennt (ältere Safari-Versionen ohne Schwenk, kein Fehler).

### 4. Stimmungen je Ort

Neue Stimmungen und Tonarten (Modi), damit die Planeten verschieden klingen:

| Ort | Modus / Charakter |
|---|---|
| Startplanet, Tag | Dur, heldenhaft, wie heute (neu komponiert) |
| Startplanet, Nacht | Moll, geheimnisvoll, Celesta und Harfe |
| Glutfrost | harte Quinten, Mixolydisch/Phrygisch, Blech und Pauken |
| Rankenmoor | Dorisch, Holzbläser, leichter Dreiertakt, verspielt-mystisch |
| unter Tage | wie heute, aber mit Thema und Form |
| All (neu) | weit und ruhig, offene Quinten, Streicherflächen, Celesta; ersetzt das „nacht“ im Raumflug |
| Kampf / Boss | treibend, aber nicht lauter als der Rest, Boss mit Motiv des Planeten in Moll |

### 5. Hören und Prüfen

Ob Musik gut klingt, lässt sich nicht automatisch testen. Deshalb:

- **Hörprobe-Seite** `tests/musik.html` (lädt dieselben Skripte): Stimmung, Seed und Abschnitt wählen, abspielen, vorherigen/nächsten Seed anhören, Notenfolge als Text. So kann der Nutzer schnell vergleichen und Rückmeldung geben.
- **Automatische Tests** für das Messbare: Determinismus, Länge/Form, Thema kehrt in A″ wieder (gleiche Intervallfolge), Tonumfang, Melodie endet auf Grundton, Phrasenende auf Akkordton, höchstens drei Wiederholungen desselben Tons, Dynamik steigt zu A″, neue Stimmungen im Katalog, alle Instrumente in `SC.Instrumente` vorhanden.

## Umsetzung in Schritten (jeweils mit Hörprobe durch den Nutzer)

1. **Komponist:** Motiv, Phrasen, Form und Dynamik in `musik.js`, Hörprobe-Seite. Klang noch wie bisher.
2. **Klang:** Vibrato, Streicher, Holzbläser, Celesta, Hall, Stereo in `audio.js`.
3. **Orte:** Planeten-Modi und All-Stimmung, Verdrahtung in `spiel.js`/`raumflug.js`.

Version: pro Schritt MINOR (neue Funktion/Balance) oder PATCH, je nach Umfang.

## Offene Fragen an den Nutzer

- Soll das Welt-Thema (Motiv aus dem Seed) kommen, oder lieber ein festes Spielthema für alle Welten?
- Kampfmusik: vor allem „stärker“ (treibend) oder eher „lustig-bedrohlich“ passend zu den Gegnern?
- Hörprobe-Seite ok, oder lieber einen Eintrag in den Entwicklerwerkzeugen (F3) statt eigener Seite?
