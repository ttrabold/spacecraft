# Karten – Design

Issue #169. Mit dem Nutzer am 2026-11-10 abgestimmt. Vom Nutzer festgelegt: Die Karte zeigt nur, wo man schon war; der Rest der Welt bleibt im Fog of War. Das Erkunden wird schon aufgezeichnet, bevor man eine Karte hat. Alles andere ist Claudes Vorschlag, vom Nutzer bis dahin unwidersprochen (unten als „Claudes Entscheidung“ markiert, wo es wirklich offen ist).

## Absicht

Ein Wunsch der Kinder (Issue-Text sinngemäß): Es gibt Landkarten, auf denen man seinen Standort sieht; andere Spieler erscheinen darauf als Punkte, auch die, die der Gastgeber sieht. Die Welt ist ein Ring von 2048 × 2048 Blöcken. Ohne Karte verläuft man sich leicht, und das gemeinsame Spiel (wo ist die andere Person?) wird schwer.

## Ziele

- Neuer Gegenstand **Karte**, an der Werkbank herzustellen. In der Hand angetippt zeigt er die Karte im Vollbild.
- Die Karte zeigt das **Gelände von oben** (Höhe, Wasser, Lava), **nur dort, wo man schon war**. Der Rest bleibt dunkel (Fog of War).
- **Man selbst** als Pfeil mit Blickrichtung, **alle Mitspieler** als farbige Punkte mit Namen (auch in unerkundeter Gegend). Gilt für Gastgeber und Gäste.
- **Erkunden wird immer aufgezeichnet**, auch ohne Karte; die erste Karte zeigt sofort alles, wo man schon war.
- Pro **Spieler und Planet** getrennt; im **Spielstand** gespeichert; Zoomen und Verschieben.
- Funktioniert in Kreativ und Survival, allein und im Mehrspieler, mit Maus, Touch und Controller.

## Nicht-Ziele

- Kleine Karte dauernd im Bild (Minimap).
- Gegner, Tiere, Fahrzeuge, Kisten oder Bauwerke auf der Karte. Nur Mitspieler und (falls vorhanden) das eigene Bett.
- Karte des Mitspielers einsehen oder gemeinsames Erkunden.
- Karte im All (dort gibt es keine Blockwelt; die Sternenkarte bleibt, wie sie ist).
- Wegpunkte setzen oder Beschriftungen malen.
- Von Spielern gebaute Dinge in der Karte (Häuser, abgebaute Berge): die Karte zeigt das ursprüngliche Gelände.

## Anti-Ziele (wäre ein Fehlschlag, auch wenn es technisch geht)

- Der Spielstand wird spürbar größer oder das Speichern langsamer.
- Das Erkunden kostet im Spiel Leistung (iPad!), etwa durch Block-Abfragen jedes Bild.
- Alte Spielstände brechen (sie starten mit leerer Karte).
- Die Karte verrät mehr, als man erlebt hat (unerkundetes Gelände sichtbar), auch nicht durch den Rand oder durch Mitspieler-Punkte.
- Im Mehrspieler sieht jemand die Karte oder die erkundeten Flächen eines anderen.

## Festlegungen

### Erkunden (Aufzeichnung)

- Raster: **8 × 8 Blöcke je Feld** → 256 × 256 Felder je Planet (2048 / 8).
- Als erkundet gilt, was im Umkreis um den Spieler liegt (Richtwert: die Sichtweite, höchstens 64 Blöcke; Kreis oder Quadrat, Builders Wahl). Aktualisiert wird nur, wenn der Spieler in ein neues Feld tritt, nicht jedes Bild.
- Aufgezeichnet wird immer (Kreativ, Survival, Zuschauer; mit und ohne Karte im Rucksack), nur auf Planeten mit Blockwelt, nicht im All.
- Speicher: ein Bit je Feld, je Spieler und Planet, kompakt codiert (Richtwert 8 KB je Planet, z. B. base64). Im Spielstand an der Figur des Spielers (wie Rucksack und Ausrüstung), für Gäste in deren Figurdaten. Fehlt das Feld beim Laden → leere Karte (Standardwert nachziehen, bestehende Spielstände dürfen nie brechen).
- Die Farbe eines erkundeten Feldes wird beim Zeichnen aus der **Landschaftsfunktion des Generators** (Höhe, Biom, Wasser) abgeleitet, nicht gespeichert. Damit bleibt der Spielstand klein; Folge: gebaute Dinge erscheinen nicht (siehe Nicht-Ziele).

### Gegenstand und Rezept

- Neuer Gegenstand **Karte** mit Block-ID **114** (nach `SPIEGEL_W_OBEN: 113`; Stand der IDs vorher prüfen; nie umnummerieren). Wie der Eimer: kein Block zum Aufstellen (`nichtAufstellbar`), Gegenstandsform, Name „Karte“ in `SC.T`, Textur „karte“ (Pixel-Look: gefaltetes Papier, ein paar Linien und ein roter Punkt).
- Rezept an der Werkbank: **2 Bretter + 1 Eisenerz → 1 Karte** (Claudes Entscheidung, ohne Anspruch auf Realismus; leicht anzupassen). Eine Karte genügt; mehrere im Rucksack ändern nichts.
- In der Kreativ-Auswahl vorhanden.

### Bedienung

- **Karte in der Hand + Setzen/Benutzen** öffnet die Karte im Vollbild; dieselbe Taste oder Schließen-Knopf schließt sie. Eine zusätzliche feste Taste (z. B. M) und ein Touch-Knopf sind nicht nötig; die genaue Belegung für Maus, Touch und Controller wählt der Builder passend zu den bestehenden Gegenständen (Eimer, Werkbank).
- Solange die Karte offen ist, pausiert das Spiel nicht im Mehrspieler (wie bei Werkbank und Truhe); Eingaben fürs Laufen sind gesperrt.
- **Zoom** (Stufen oder stufenlos, Richtwert vom ganzen Planeten bis etwa 128 Blöcke Breite) und **Verschieben**; beim Öffnen zentriert auf den eigenen Standort. Das Verschieben und Zoomen geht mit Maus (Ziehen, Rad), Touch (Wischen, Zwei-Finger-Zoom oder Knöpfe) und Controller (Stick, Schultertasten); Knöpfe + / − und „Zu mir“ sind überall verfügbar.
- Karte rundet am Ring des Planeten um (Wrap), wie die Welt selbst.

### Darstellung

- Ansicht von oben, Norden oben (−z oben, entsprechend dem Koordinatensystem der Welt; Builder prüft die Richtung im Spiel).
- Erkundete Felder: Farbe nach Höhe und Untergrund; Wasser blau, Lava orange, Schnee hell (Palette des Planeten). Unerkundet: dunkel, etwas heller Rand zum Erkundeten.
- **Eigene Figur**: Pfeil in der Blickrichtung. **Mitspieler**: Punkt in der Farbe ihrer Figur mit Namen daneben; auch außerhalb des erkundeten Gebiets, nur im selben Planeten; ein Mitspieler auf einem anderen Planeten erscheint nicht.
- **Eigenes Bett** (Spawnpunkt), falls das Spiel ihn bereits speichert: kleines Symbol. Falls nicht, entfällt das Symbol (kein neues Speichern nur dafür).
- Textanzeige: Koordinaten des Mauszeigers oder Mittelpunkts, der Planetenname und die eigene Position.

### Mehrspieler

- Jeder Spieler erkundet für sich; nichts wird zwischen den Spielern abgeglichen.
- Die Positionen der Mitspieler kennt jedes Gerät bereits (Figuren in der Welt, `_mitspielerListe`); es wird **nichts Neues übertragen**.
- Die neue Block-ID 114 (Gegenstand im Rucksack) ist für Alt-Gäste unbekannt; deshalb wird das **Netzprotokoll auf 14 erhöht** (wie bei früheren neuen IDs), damit Alt-Gäste abgelehnt werden.

### Texte

- Name „Karte“ und ein Satz in `SC.T.anleitung` (zusammen mit dem Hinweis, dass das Erkunden immer mitgeschrieben wird); `docs/ANLEITUNG.md` mit demselben Satz von Hand nachziehen.
- Beschriftungen für Karte, Zoom, „Zu mir“, „Unerkundet“ in `SC.T`.

## Dem Builder überlassen

- Genaue Größe des Erkundungsradius und seine Form.
- Codierung der Bits im Spielstand, Ort der Datenhaltung im Spielzustand und im Spielstand-Code.
- Zeichnen: Canvas 2D (ein `ImageData` je Zoomstufe oder Kacheln), Cache der abgeleiteten Farben, damit das Öffnen nicht ruckelt.
- Ablage in Dateien (Vorschlag: `js/karte.js` für Daten und Erkunden, `js/ui-karte.js` für das Vollbild; in `index.html` und `tests/index.html` in gleicher Reihenfolge laden).
- Belegung von Tasten, Knöpfen und Controller; Texturmuster.
- Version: neue Funktion → MINOR (0.34.0, Stand dann 0.33.1 live).

## Tests (Testseite)

- Rezept vorhanden, Kosten wie oben, ergibt den Gegenstand `KARTE` (ID 114), in der Kreativ-Auswahl.
- Erkunden: Aufruf mit Position markiert die erwarteten Felder; nur bei Feldwechsel wird neu gerechnet; Rand und Wrap an der Weltkante; im All keine Aufzeichnung.
- Speichern und Laden der erkundeten Felder (Roundtrip, Größe unter dem Richtwert); alter Spielstand ohne das Feld lädt mit leerer Karte.
- Gäste: eigene erkundete Felder je Figur, kein Abgleich mit den anderen.
- Farbe eines Feldes aus dem Generator: Wasser, Land und Berg unterscheiden sich; unerkundetes ist dunkel.
- Mitspieler-Punkte: nur gleicher Planet, auch in unerkundeter Gegend; Koordinatenumrechnung Welt ↔ Bild ist rund umkehrbar (Zoom und Verschieben, Wrap).
- Netzprotokoll 14: Gast mit 13 wird abgelehnt.

Im echten Spiel (Chrome, `file://`) prüfen: Karte bauen, öffnen, Gelände erkunden und beim erneuten Öffnen wachsen sehen; Fog of War an den Rändern; Zoom und Verschieben; zweiter Spieler (zwei Browserfenster oder Test-Vorschau) als Punkt mit Name; Speichern, Neuladen. Nicht prüfbar ohne Gerät: Touch und iPad-Leistung.
