# Crafting – Design

Stand: Entwurf (2026-11-02), im Gespräch mit dem Nutzer entstanden. Was der Nutzer gesagt hat, steht unmarkiert; **[Vorschlag]** sind meine Annahmen, die noch bestätigt werden müssen.

## Wozu

Die Kinder sollen sich ihre Ausrüstung selbst zusammenstellen können, statt nur zu nehmen, was sie finden. Kern der Idee: **Fahrzeuge und Raumschiffe nach eigenen Wünschen zusammenstellen** (Motor, Panzerung, Waffen, Farbe). Dazu Waffen für die Hand, Rüstung und Bauteile für den Blockbau. Damit sich das Bauen lohnt, werden gefundene Waffen und Fahrzeuge **deutlich seltener**.

Spieler bleiben der Vater, sein neunjähriger Sohn und dessen Freund; **kindgerecht** und mit Touch, Tastatur/Maus und Controller bedienbar.

## Ziele

- Rohstoffe sammeln (aus Blöcken und von besiegten Gegnern) und an einer Werkbank in Dinge verwandeln.
- Bessere Teile brauchen seltenere Rohstoffe; seltene Rohstoffe liegen an Orten, die zum Erkunden locken (Bauwerke, fremde Planeten, Höhlen, später das All).
- Rüstung: Stärke nach der Seltenheit der Rohstoffe.
- Handwaffen: die **Farbe** bestimmt ein Kristall (wie bei Star Wars), die **Stärke** die Seltenheit der übrigen Rohstoffe.
- Fahrzeuge und Raumschiffe: **Motor, Panzerung, Waffen und Farbe frei wählen**; bessere Teile brauchen seltenere Rohstoffe.
- Bauteile für den Blockbau: **Türen, Fenster, Leitern, Fackeln, Truhen, Zäune**.
- Die Werkbank ist ein **Block**, den man aus Rohstoffen herstellt und selbst aufstellt.

## Nicht-Ziele

- Kein Zusammenbauen von Fahrzeugen Teil für Teil im Raum (Voxel-Bauen). Es bleibt ein Auswahlmenü an der Werkbank. **[Vorschlag, aus „geht zur Werkbank und wählt ein Rezept“ abgeleitet]**
- Kein Hunger-/Essenssystem und keine Verbrauchs-Haltbarkeit (kein Zerbrechen von Werkzeugen). **[Vorschlag, passt zu „Survival ohne Hunger“]**
- Kein Verlust gebauter Ausrüstung beim Besiegtwerden (Vision: Ausrüstung bleibt erhalten).

## Anti-Ziele (was es zum Misserfolg macht, auch wenn es läuft)

- Crafting, das sich wie Buchhaltung anfühlt (lange Rezeptlisten, viele Schritte). Für einen Neunjährigen muss es mit wenigen Handgriffen funktionieren.
- Seltene Rohstoffe, die so selten sind, dass die Kinder nie etwas Gutes bauen.
- Gefundene Ausrüstung, die so selten ist, dass Survival ohne Crafting frustriert.

## Rohstoffe **[Vorschlag, vom Nutzer für gut befunden]**

Fünf Stufen, passend zu den fünf Seltenheitsstufen der Beute (`SC.SELTENHEIT`):

| Stufe | Rohstoff | Fundort |
|---|---|---|
| gewöhnlich | Holz, Stein | überall (gibt es schon) |
| ungewöhnlich | Eisenerz | Höhlen auf dem Startplaneten |
| selten | Titan | tiefe Höhlen, Bauwerke, Kisten |
| episch | Glutstahl (Glutfrost), Moorsilber (Rankenmoor) | nur auf dem jeweiligen Planeten |
| legendär | Sternenmetall | Bosse, Asteroiden im All |

Gegner lassen zusätzlich Teile fallen, die zu ihnen passen (z. B. Schaltkreise vom Droiden). Die genaue Liste und die Mengen sind Aufgabe des Plans.

**Kristalle** (für die Farbe von Laserschwert und Blaster): Blau und Grün (Startplanet, Höhlen), Rot (Glutfrost, nahe Lava), Gelb (Startplanet, Wüste), Violett (Rankenmoor), Weiß (nur von Bossen, am seltensten). Die Farbe kommt allein vom Kristall.

## Werkbank und Ablauf

1. Er sammelt Rohstoffe (landen im Rucksack wie bisher die Blöcke).
2. Er stellt eine **Werkbank** (Block aus Holz und Stein) auf.
3. Er öffnet sie (wie die Kiste, Antippen/Taste/Controller) und wählt im Menü, was er herstellt.
4. Das Ergebnis liegt im Rucksack (Handwaffen, Bauteile) oder steht neben der Werkbank (Fahrzeuge, Raumschiffe).

Das Menü zeigt, was er herstellen kann, was ihm fehlt und was er dafür braucht. **[Vorschlag]** Rezepte sind von Anfang an sichtbar (kein Freischalten durch Forschen); was fehlt, ist der Rohstoff, nicht das Wissen.

## Umsetzung in drei Stufen **[mit dem Nutzer abgestimmt]**

### Stufe A – Grundlage, Bauteile, Handwaffen

- Neue Rohstoffe als Blöcke/Gegenstände, Fundorte und Gegner-Beute.
- Werkbank-Block mit Menü.
- Bauteile: Fenster, Truhen, Fackeln, Leitern, Zäune, Türen. Neu dabei: **Nicht-Würfel-Formen** (Zaun, Leiter, Fackel, Tür), eine **Tür, die man öffnet**, **Leitern zum Klettern** und eine **Truhe**, die man aufstellen und benutzen kann (die heutige Kiste steht nur in Bauwerken). Fenster entspricht dem vorhandenen Glasblock.
- Handwaffen mit Kristallfarbe und Stärke nach Rohstoff.
- **Rüstung** (Helm, Brust, Handschuhe, Stiefel, Schild) ist baubar; die Stärke ergibt sich aus der Seltenheit des Metalls, Farbe/Aussehen aus dem Material **[Vorschlag]**. Im Spiel gilt Rüstung heute nur über `schutz` und Aussehen der Figur (siehe `js/render-mitspieler.js`).
- Gefundene Handwaffen und gefundene Rüstung werden seltener.

### Stufe B – Fahrzeuge

- Auswahl von Motor (Tempo), Panzerung, Bordwaffe und Farbe aus Teilen mit Stufen.
- Gefundene Fahrzeuge werden seltener; ein Start-Gleiter am Startpunkt bleibt **[Vorschlag, damit der Einstieg nicht blockiert ist]**.

### Stufe C – Raumschiffe

- Dasselbe für Raumschiffe (heute gibt es einen „Sternenläufer“ am Startplaneten, der nie verpufft). Sternenmetall und Asteroiden werden hier wichtig.

## Einschränkungen

- Läuft ohne Build-Schritt, ohne Abhängigkeiten, auch per `file://`; auch ältere Safari-Versionen (iOS).
- **Spielstand-Kompatibilität:** neue Felder beim Laden mit Standardwerten nachziehen; Speicherstände dürfen nie brechen. Der Rucksack hat 36 Plätze, Blöcke stapeln bis 64, Gegenstände einzeln (`js/rucksack.js`); neue Rohstoffe müssen dort hineinpassen.
- **Mehrspieler:** Der Gastgeber hält die Welt (Protokoll heute Version 4). Werkbank, Türen und gebaute Fahrzeuge müssen für alle sichtbar sein und synchron laufen.
- Werte (Rezeptkosten, Stärken) stehen in Tabellen, damit sie sich nach Feedback der Kinder leicht ändern lassen.

## Dem Bauenden überlassen

- Namen und Mengen der Rezepte, Texte, Bilder (Texturen werden im Code erzeugt), Geräusche.
- Genauer Aufbau des Menüs, soweit es mit Touch und Controller bedienbar ist.
- Reihenfolge der Aufgaben innerhalb einer Stufe.

## Meine Entscheidungen beim Schreiben (bitte gegenlesen)

Diese Punkte habe ich selbst festgelegt; der Nutzer hat sie nicht ausdrücklich gesagt.

- **Wie viel seltener sind gefundene Sachen?** Gefundene Handwaffen und Fahrzeuge fallen nur noch mit etwa einem Viertel der heutigen Wahrscheinlichkeit; die Stufen „episch“ und „legendär“ gibt es als Fund nur noch von Bossen. Die Zahlen stehen in der Beute-Tabelle und werden nach Feedback der Kinder angepasst.
- **Gebaute Waffen** haben dieselben Seltenheitsstufen und Namen wie Beute; die Seltenheit ergibt sich aus der Stufe des verwendeten Metalls.
- **Farbe von Fahrzeugen** wählt man frei aus einer Palette von etwa zwölf Farben, ohne Rohstoffkosten.
- **Gebaute Fahrzeuge und Raumschiffe verpuffen nicht** (wie der Sternenläufer), damit nichts Teures verloren geht. Sie lassen sich nicht stehlen und gehören allen Mitspielern in der Welt.
- **Kreativmodus:** Das Menü zeigt alles ohne Kosten.
- **Mehrspieler:** Alle Spieler dürfen jede Werkbank benutzen; Rohstoffe kommen aus dem eigenen Rucksack.
- **Türen** lassen sich nicht abschließen; sie öffnen und schließen per Antippen/Taste.

## Offene Fragen an den Nutzer

Keine mehr. Stand 2026-11-02: Der Nutzer will auch **Rüstung** baubar haben (siehe Stufe A).
