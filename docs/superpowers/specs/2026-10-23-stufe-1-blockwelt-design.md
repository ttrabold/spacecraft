# Stufe 1: Blockwelt – Design

Stand: 2026-10-23. Gesamtbild und spätere Stufen: `docs/ROADMAP.md`. Regeln fürs Repo: `AGENTS.md`.

Kennzeichnung: Was der Nutzer festgelegt hat, steht ohne Zusatz. Was ich (Claude) entschieden habe, ist mit **[Claude]** markiert und darf vom Nutzer jederzeit umgeworfen werden. Was ausdrücklich beim Umsetzenden liegt, steht im letzten Abschnitt.

## 1. Worum es geht

Spacecraft ist ein Minecraft-artiges Browser-Spiel für einen Vater, seinen neunjährigen Sohn und dessen gleichaltrigen Freund. Sie wollen gemeinsam in einer Welt erkunden, kämpfen und bauen. Es soll spannend und lustig sein und ein wenig Chaos haben. Langfristig kommen futuristische Waffen dazu, selbst gebaute Fahr- und Flugzeuge und Raumschiffe, mit denen man nahtlos zu anderen Planeten fliegt (Vorbild No Man's Sky). Das Spiel muss immer kindgerecht bleiben.

Stufe 1 legt das Fundament: eine schöne, erkundbare Blockwelt, in der man bauen kann, auf Laptop und Tablet, mit sicheren Spielständen. Gegner, Beute und Mehrspieler kommen in späteren Stufen. Die Architektur muss diese Stufen aber schon jetzt mitdenken, vor allem Mehrspieler (Stufe 3) und Planeten (Stufe 5).

### Erfolg

Nach Stufe 1 setzen sich Vater und Sohn an ihre Geräte, legen eine Welt mit einem Seed an, laufen los, finden Höhlen, Dungeons und verlassene Gebäude, bauen sich etwas im Kreativmodus und machen am nächsten Tag genau dort weiter. Es läuft auf einem Tablet flüssig und lässt sich dort gut bedienen.

## 2. Ziele, Nicht-Ziele, Anti-Ziele

**Ziele**
- Prozedural erzeugte Planetenwelt aus einem Seed, mit abwechslungsreichen Landschaften und erzeugten Bauwerken (Dungeons, Herrenhäuser/Festungen, verlassene Stationen, Lager), zunächst ohne Bewohner.
- Blöcke abbauen und setzen.
- Spielmodi Kreativ und Zuschauer; Survival ist sichtbar, aber erst ab Stufe 2 spielbar.
- Tag-Nacht-Wechsel mit dem abgestimmten Look.
- Steuerung mit Tastatur/Maus und mit Touch.
- Mehrere Spielstände (Slots), automatisches Speichern, Export und Import als Datei.

**Nicht-Ziele in Stufe 1** (kommen später, siehe Roadmap): Gegner, Kampf, Waffen, Beute, Lebenspunkte, Inventar mit Mengen, Mehrspieler, Fahrzeuge, andere Planeten, Weltraum, Crafting, Sound **[Claude: Sound erst später, ist kein Wunsch des Nutzers gewesen]**.

**Anti-Ziele** (das wäre ein Fehlschlag, selbst wenn es technisch läuft)
- Nicht kindgerecht: Blut, Grusel, düstere Gewalt, unpassende Texte.
- Geschützte Namen oder Figuren (Star Wars o. ä.). Das Repo ist öffentlich und geht auf itch.io; alles wird selbst erfunden.
- Auf einem Tablet ruckelig oder mit Touch kaum bedienbar.
- Verlorene oder kaputte Spielstände, auch nach Updates.
- Eine Architektur, die Mehrspieler oder Planetenwechsel später nur mit Neuschreiben erlaubt.
- Leere, langweilige Welt: lange Strecken ohne etwas zu entdecken.

## 3. Rahmenbedingungen

- **Repo-Regeln aus AGENTS.md gelten:** reines HTML/CSS/JS, keine ES-Module, kein Bundler, kein npm, läuft per `file://` und auf GitHub Pages, auch auf älteren iOS-Safari-Versionen. Version nur in `index.html` (`var V="X.Y.Z"`), Lader lädt alle Skripte in fester Reihenfolge mit `?v=V`, `sw.js` leitet den Cache-Namen daraus ab. Testseite `tests/index.html` mit derselben Ladereihenfolge. Code, Kommentare, Commits und Docs auf Deutsch.
- **Die vorhandenen Workflows und `scripts/itch-zip.sh` setzen voraus:** `index.html` mit `var V="X.Y.Z"`, Skriptliste im Lader als `"js/….js"`, `css/style.css`, optional `manifest*.webmanifest` mit Icons, `sw.js`. Daran halten.
- **Startversion:** `0.1.0` **[Claude]**.
- **Geräte:** gemischt Laptops/PCs und Tablets (iPad und vermutlich Android). Zielwert **[Claude]**: mindestens 30 FPS auf einem mittleren Tablet (z. B. iPad der 9. Generation), 60 FPS auf einem normalen Laptop. Sichtweite passt sich an oder ist einstellbar.
- **Spielstände auf Live und Test teilen sich einen Origin** (GitHub Pages). Speicherdaten nie löschen oder überschreiben, Formate nur abwärtskompatibel erweitern.

### Folgen aus `file://` und alten Safaris, die die Technik festlegen
- **three.js** als einzelne Datei im Repo (`js/lib/three.min.js`) **[Claude]**. Da keine ES-Module erlaubt sind, muss es ein UMD-/Global-Build sein; den gibt es bis einschließlich r159 (`build/three.min.js`). Version r150–r159 wählen und fest einchecken.
- **Keine lokalen Datei-Ladevorgänge per `fetch`/XHR** (unter `file://` blockiert). Texturen werden beim Start per Canvas prozedural als Pixel-Atlas erzeugt **[Claude]**; es gibt keine Bilddateien für Blöcke. Icons fürs Manifest sind davon unabhängig.
- **Web Worker** sind unter `file://` nicht zuverlässig. Erlaubt ist ein Worker über Blob-URL als Beschleunigung, das Spiel muss aber auch ganz ohne Worker laufen (Generierung in Zeitscheiben auf dem Hauptthread).
- **Speicher:** IndexedDB, mit Rückfall auf `localStorage`, falls IndexedDB nicht verfügbar ist (manche Browser unter `file://`, private Fenster).

## 4. Die Welt

### Planet
- Am Boden wie Minecraft: flach und blockig. Läuft man geradeaus, kommt man einmal um den Planeten herum und wieder am Start an. Später (Stufe 5) sieht man ihn aus dem All als Kugel und kann überall landen.
- **Umsetzung [Claude]:** Die Planetenoberfläche ist eine quadratische Karte, die an beiden Rändern nahtlos umschlägt (x und z modulo Kantenlänge, also topologisch ein Torus). Für die Kugelansicht in Stufe 5 wird diese Karte auf eine Kugel abgebildet; das ist Thema von Stufe 5, die Weltdaten müssen dafür aber genau so aufgebaut sein.
- **Größe:** begrenzt, zu Fuß in etwa 10 Minuten umrundet, dafür dicht mit interessanten Orten. **[Claude]:** Kantenlänge 2048 Blöcke (bei etwa 4,3 Blöcken pro Sekunde Laufen knapp 8 Minuten), Weltgröße als Parameter pro Planet, damit spätere Planeten anders groß sein können. Höhe: 0 bis 127 **[Claude]**.
- **Wichtig für die Generierung:** Alle Rauschfunktionen müssen periodisch über die Kantenlänge sein, sonst entsteht am Umschlagrand eine Kante. Spieler, Kamera, Blockzugriffe und Chunk-Laden müssen die Umschlagkoordinaten durchgängig beherrschen, auch die Darstellung über den Rand hinweg.

### Seed
- Jede Welt entsteht aus einem Seed (Zahl oder Wort). Gleicher Seed, gleiche Welt: dieselbe Landschaft und dieselben Bauwerke, auf jedem Gerät und in jeder späteren Version **[Claude: Erzeugung pro Weltformat-Version einfrieren; ändert sich der Generator, bekommen alte Welten weiter den alten]**.
- Beim Anlegen einen Seed eingeben oder einen zufälligen nehmen. Der Seed ist in der Weltliste sichtbar, damit man ihn weitersagen kann.
- Die Generierung darf ausschließlich aus Seed und Koordinaten rechnen (deterministische Zufallszahlen, kein `Math.random`). Voraussetzung für kleine Spielstände und für Mehrspieler.

### Landschaft des Startplaneten
- Abwechslungsreich auf kleinem Raum **[Claude]:** Wiesen und Wälder, Hügel und Berge, Sandstrände und Seen, eine Wüstenregion, ein Kristallfeld als Sci-Fi-Akzent, Höhlen unter der Erde.
- Wasser **[Claude]:** stehendes Wasser ohne Fließ-Simulation, man kann darin schwimmen.
- Bäume und Pflanzen als Blockstrukturen, einige Pflanzen leuchten nachts.

### Bauwerke
- Das Spiel erzeugt aus dem Seed Bauwerke an passenden Stellen: Dungeons unter der Erde (Räume und Gänge), Herrenhäuser oder Festungen, verlassene Raumstationen bzw. Außenposten, Lager.
- In Stufe 1 sind sie leer, aber schon zum Erkunden gebaut. In Stufe 2 kommen Gegner, Bosse und Schatzkisten hinein. Die Bauwerke sollen deshalb Plätze vorsehen, an denen später Gegner auftauchen und Kisten stehen (z. B. markierte Punkte in der Bauwerksbeschreibung) **[Claude]**.
- Dichte **[Claude]:** Man soll beim Erkunden etwa jede Minute auf etwas Interessantes stoßen.
- Bauwerke dürfen über Chunk-Grenzen gehen; die Platzierung muss trotzdem deterministisch und unabhängig von der Ladereihenfolge sein.
- Bauwerke dürfen nicht über den Umschlagrand kaputtgehen.

### Blöcke
**[Claude]** Etwa 25 Sorten, jede mit prozedural erzeugter Pixel-Textur:
- Natur: Gras, Erde, Stein, Sand, Kies, Holzstamm, Blätter, Wasser, Schnee, Kristall (leuchtet), Leuchtpilz/-pflanze (leuchtet)
- Bauen: Holzbretter, Steinziegel, Glas, Wolle/Farbblöcke in einigen Farben
- Sci-Fi: Metallplatte, Metallgitter, Technikblock (leuchtet), Leuchtblock in mehreren Farben, Bunkerbeton
- Unzerstörbar: Grundgestein auf Höhe 0
Blockdefinitionen in einer zentralen Tabelle (ID, Name, Textur je Seite, durchsichtig ja/nein, leuchtet ja/nein mit Farbe, fest/durchlässig), damit spätere Stufen leicht Blöcke ergänzen.

### Look
- Pixel-Texturen wie Minecraft, dazu gezieltes Leuchten: Kristalle, Technikblöcke, Leuchtpflanzen und später Laserwaffen und Gegneraugen. Referenz: Entwurf „Mischung aus A und C“ aus dem Brainstorming (Startplanet am Tag, fremder Planet in der Dämmerung, Startplanet bei Nacht).
- Jeder Planet hat eine eigene Farbpalette. Der Startplanet ist vertraut grün und braun. Die Palette muss deshalb ein Parameter des Planeten sein, der in die Texturerzeugung, den Himmel und den Nebel eingeht.
- **Tag-Nacht-Wechsel** **[Claude: ein Tag etwa 20 Minuten]**. Nachts ist es dunkler und spannender, leuchtende Blöcke erhellen sichtbar ihre Umgebung. Es darf aber nie so dunkel werden, dass Kinder sich nicht mehr zurechtfinden.
- Licht: Leuchtende Blöcke müssen nachts ihre Umgebung erkennbar erhellen; eine Näherung reicht (z. B. Licht pro Ecke beim Erzeugen des Chunk-Meshes, wie in Minecraft).

## 5. Spielen

### Spielmodi
- **Kreativ:** fliegen (zweimal Springen schaltet um), alle Blöcke unbegrenzt in einer Auswahl, Abbauen sofort, nichts kann einem passieren.
- **Zuschauer:** frei durch alles hindurchfliegen, nichts verändern, keine Schnellleiste.
- **Survival:** im Menü sichtbar mit dem Hinweis „kommt bald“ und nicht auswählbar **[Claude]**. Die Datenstruktur einer Welt hat aber schon ein Feld für den Modus und eines für Inventar, damit Stufe 2 nichts migrieren muss.
- Modus beim Anlegen wählen und im Spiel über das Menü wechseln **[Claude]**.

### Spielfigur
- Einfache blockige Figur, in der Ich-Perspektive nur die Hand oder der gehaltene Block sichtbar. Eine Ansicht von außen **[Claude: umschaltbar, F5 wie Minecraft]** ist nützlich, weil Aussehen und Ausrüstung später wichtig werden (Beute verändert das Aussehen).
- Laufen, Springen, Schwimmen, Fliegen im Kreativmodus, Kollision mit Blöcken.

### Bauen
- Zielen über ein Fadenkreuz in der Bildmitte; der anvisierte Block wird umrandet. Reichweite etwa 6 Blöcke **[Claude]**.
- Schnellleiste mit 9 Plätzen, Blockauswahl im Kreativmodus als Raster mit allen Blöcken.
- Jede Blockänderung läuft über eine einzige zentrale Funktion (z. B. `setzeBlock(x, y, z, id, quelle)`), die die Änderung speichert, Meshes neu baut und ein Ereignis auslöst. Darüber hängt sich in Stufe 3 die Netzwerkschicht ein.

### Steuerung
- **Tastatur/Maus:** wie Minecraft. WASD laufen, Maus umsehen (Pointer Lock), Leertaste springen bzw. im Flug steigen, Umschalt sinken, linke Maustaste abbauen, rechte setzen, Mausrad und 1–9 für die Schnellleiste, E für die Blockauswahl, Esc für das Menü.
- **Touch [Claude]:** virtueller Joystick links, Wischen auf der rechten Hälfte zum Umsehen, Knöpfe für Springen bzw. Steigen und Sinken, Abbauen und Setzen. Gezielt wird über das Fadenkreuz in der Mitte, nicht durch Antippen der Stelle, weil das einheitlicher und später für Waffen besser ist. Schnellleiste antippbar, Knöpfe für Blockauswahl und Menü.
- Erkennen, welche Eingabe genutzt wird, und die Touch-Bedienelemente nur bei Touch zeigen; beides darf gleichzeitig funktionieren.
- Knöpfe groß genug für Kinderhände.

### Menüs
- Oberfläche auf Deutsch **[Claude]**; Texte zentral halten, damit eine Übersetzung später möglich ist, aber in Stufe 1 keine zweite Sprache.
- Startbildschirm: Liste der Welten, „Neue Welt“, „Importieren“.
- Pausemenü: Weiterspielen, Modus wechseln, Einstellungen (Sichtweite, Mausempfindlichkeit, Touch-Größe), Welt exportieren, Zurück zur Weltliste.

## 6. Spielstände

- **Mehrere Slots:** Weltliste mit Name, Seed, Modus und „zuletzt gespielt“. Anlegen, umbenennen, kopieren, löschen; Löschen nur nach Bestätigung im Spiel (keine Browser-Dialoge nötig).
- **Gespeichert wird nur, was sich von der erzeugten Welt unterscheidet:** geänderte Blöcke (pro Chunk), Spielerposition und Blickrichtung, Modus, Tageszeit, Schnellleiste, dazu Seed, Planetenparameter und Weltformat-Version. Später auch Inventar und Beute.
- **Automatisch speichern** **[Claude: etwa alle 30 Sekunden, beim Pausieren und wenn der Tab verborgen wird]**.
- **Export:** Jede Welt als Datei herunterladen (z. B. `meine-welt.spacecraft`), auf jedem Gerät wieder importieren. Zweck: Sicherung und Austausch, solange es keinen Mehrspieler gibt. **[Claude]:** JSON mit Formatversion, wo verfügbar komprimiert (`CompressionStream`), sonst unkomprimiert; der Import erkennt beides. Import legt immer einen neuen Slot an und überschreibt nichts.
- **Kompatibilität:** Jede Datei und jeder Speicherstand trägt eine Formatversion. Neuere Spielversionen lesen alle älteren Formate und ziehen fehlende Felder mit Standardwerten nach. Bestehende Spielstände dürfen nie brechen.

## 7. Vorbereitung auf spätere Stufen

Nichts davon wird in Stufe 1 gebaut, aber die Struktur muss es zulassen:
- **Mehrspieler (Stufe 3):** Ein Gerät ist Gastgeber und hält die Welt, die anderen treten per Raumcode bei, Verbindung per WebRTC über PeerJS, Verbindungsschicht austauschbar. Deshalb: Welt deterministisch aus dem Seed; alle Änderungen über die zentrale Blockfunktion; Spieler als Objekte mit ID, nicht als globaler Einzelspieler; Spielzustand (Welt, Spieler) getrennt von Darstellung und Eingabe.
- **Survival (Stufe 2):** Felder für Modus, Lebenspunkte und Inventar im Weltformat vorsehen; Bauwerke mit markierten Plätzen für Gegner und Kisten.
- **Planeten (Stufe 5):** Planet als Objekt mit Seed, Größe, Palette und Generator-Einstellungen; eine Welt (ein Slot) kann später mehrere Planeten enthalten. Das Weltformat sollte daher Blockänderungen pro Planet ablegen.

## 8. Prüfen

- `tests/index.html` mit Tests im Browser für die reine Logik **[Claude: mindestens]**: deterministische Generierung (gleicher Seed, gleiche Blöcke), nahtloses Umschlagen am Rand (Rauschen und Koordinaten), Bauwerksplatzierung unabhängig von der Ladereihenfolge, Speichern/Laden und Export/Import im Rundlauf, Migration alter Formatversionen.
- Von Hand bzw. per Browsersteuerung: Spiel per `file://` und über einen lokalen Server starten, auf einem Tablet oder in der Touch-Emulation spielen, FPS-Anzeige (zuschaltbar) prüfen.
- Größere Änderungen erst ins Test-Repo (siehe AGENTS.md).

## 9. Projektmanagement

Nach Freigabe dieses Designs: Plan unter `docs/superpowers/plans/`, dann Meilenstein „Stufe 1: Blockwelt“, Bereichs-Labels, Board „Spacecraft“ und Issues aus den Planaufgaben (Ablauf in AGENTS.md, Abschnitt „Projektmanagement“).

## 10. Dem Umsetzenden überlassen

- Dateiaufteilung unter `js/` und `css/` und Reihenfolge im Lader
- Chunk-Größe, Meshing-Verfahren (Flächen ausblenden, Greedy Meshing), Ladestrategie, Sichtweite pro Gerät
- Rauschverfahren und Biom-Logik, solange periodisch und deterministisch
- Konkreter Aufbau der Bauwerke und ihrer Vorlagen
- Physik-Details (Sprunghöhe, Geschwindigkeiten), Aussehen der Menüs im Rahmen des Looks
- Ob ein Blob-Worker verwendet wird
- Icons und Manifest für die PWA
