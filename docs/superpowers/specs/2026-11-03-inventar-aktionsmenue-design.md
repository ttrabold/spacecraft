# Rucksack: ein Cursor, Aktionsmenü am Gegenstand, bessere Ausrüstung wird angelegt

Stand: 2026-11-03 · Grundlage: Gespräch mit dem Nutzer nach 0.22.8

## Warum

Der Rucksack aus 0.22.0 (Seitenpanel, `js/ui-rucksack.js`) ist schlecht benutzbar:

- **Touch geht gar nicht.** Safari auf dem iPad verschiebt beim Antippen eines Knopfs den Fokus nicht. Der gelbe Fokus-Rahmen bleibt auf dem Platz stehen, den das Panel beim Öffnen fokussiert hat; die eigentliche Auswahl zeigt nur ein kaum sichtbarer hellerer Hintergrund (`.rs-platz.gewaehlt`). Man tippt, und scheinbar passiert nichts.
- **Anlegen ist zu umständlich.** Gegenstand wählen, rechts im Detail den Knopf „Anlegen“ suchen, noch einmal tippen. Mit Maus und Controller versteht man kaum, was zu tun ist.

Gespielt wird von Kindern, am iPad mit Touch oder Controller, am Rechner mit der Maus. Alle drei Bedienarten sollen denselben, sofort verständlichen Ablauf haben.

## Ziele

1. **Ein Cursor.** Es gibt genau eine deutliche Markierung im Rucksack. Sie sitzt auf dem Platz, den man zuletzt angetippt, angeklickt oder mit dem Controller angesteuert hat. Auf Touch wandert sie mit dem Finger.
2. **Aktionsmenü am Gegenstand.** Antippen/Klicken/A auf einen belegten Platz öffnet ein kleines Menü direkt neben dem Platz, mit großen Knöpfen nur für die Aktionen, die mit diesem Gegenstand gehen. Ein Helm ist mit zwei Tipps angelegt; der Vergleich mit dem getragenen steht im Menü.
3. **Bessere Ausrüstung wird beim Aufheben angelegt**, mit Hinweis. Das häufigste Anlegen braucht dann kein Inventar mehr.
4. **Verschieben als eigene Aktion** statt des versteckten „zweiter Tipp auf einen leeren Platz verschiebt“.

## Nicht-Ziele

- Kein Ziehen und Ablegen (Drag & Drop). Am Controller schlecht, am iPad fehleranfällig.
- Keine Änderung an Werkbank, Truhe und Blockauswahl in diesem Schritt (siehe „Offen für später“).
- Keine neuen Gegenstände, Werte oder Plätze; Rucksack hat weiter 36 Plätze, die ersten 9 sind die Schnellleiste.

## Anti-Ziele (wäre ein Fehlschlag, auch wenn es technisch läuft)

- Auf Touch passiert beim Antippen sichtbar nichts oder etwas anderes als erwartet.
- Ein Kind legt aus Versehen etwas ab oder wirft es weg (Wegwerfen darf nie die erste, vorausgewählte Aktion sein).
- Bessere Ausrüstung wird **still** getauscht, ohne dass man es merkt.
- Am Controller muss man Zonen und Knöpfe suchen, um einen Helm anzulegen.

## Verhalten im Einzelnen

### Cursor

- Der Cursor ist der Fokus (`:focus`) und zugleich die Auswahl; die getrennte Auswahl-Markierung `.gewaehlt` entfällt im Rucksack.
- Antippen oder Klicken eines Platzes setzt den Fokus ausdrücklich auf diesen Platz (`el.focus()` im Klick-Handler), damit es auch in Safari auf iOS funktioniert.
- Der Cursor ist kräftig sichtbar (der gelbe Rahmen aus 0.22.0 genügt, wenn er wirklich mitwandert), auf allen drei Bedienarten gleich.
- Beim Öffnen steht der Cursor wie bisher auf dem ersten Platz der Startzone (Raster), beim Neuzeichnen bleibt er auf seinem Platz (`_fokusMerkmal`/`_holeFokus` gibt es schon).

### Aktionsmenü

- **Öffnen:** Tipp/Klick/A auf einen **belegten** Rucksackplatz oder einen belegten Ausrüstungsplatz. Ein leerer Platz öffnet nichts (außer beim Verschieben, siehe unten).
- **Ort:** direkt neben dem Platz (darüber oder darunter, je nachdem wo Platz ist), im Seitenpanel, nicht über dem Platz selbst.
- **Inhalt:** Name in Seltenheitsfarbe, bei Ausrüstung die Werte mit dem Vergleich zum getragenen Gegenstand (`SC.Beute.vergleiche`, grün ▲ / rot ▼ wie heute), darunter die Knöpfe in dieser Reihenfolge:

| Sache | Knöpfe (erste = vorausgewählt) |
|---|---|
| Ausrüstung im Rucksack (nicht Waffe) | **Anlegen** · Verschieben · Wegwerfen · Abbrechen |
| Waffe im Rucksack, Platz ≥ 9 | **In die Schnellleiste** · Verschieben · Wegwerfen · Abbrechen |
| Waffe oder Block in der Schnellleiste (Platz 0–8) | **Verschieben** · Wegwerfen · Abbrechen |
| Block im Rucksack, Platz ≥ 9 | **In die Schnellleiste** · Verschieben · Wegwerfen · Abbrechen |
| Angelegte Ausrüstung (Ausrüstungsplatz) | **Ablegen** · Abbrechen |

  (Begriffe wie heute in `SC.T`: `anlegen`, `ablegen`, `inSchnellleiste`, `wegwerfen`; neu `verschieben`, `abbrechen` falls nicht vorhanden.)
- **Bestätigen:** Der Fokus springt beim Öffnen auf den ersten Knopf. Ein zweiter Tipp auf denselben Platz oder A führt die erste Aktion aus; man kann aber auch direkt einen anderen Knopf antippen.
- **Schließen:** Abbrechen, B, ein Tipp außerhalb des Menüs oder auf einen anderen Platz (der dann sein eigenes Menü öffnet). Nach dem Schließen steht der Cursor wieder auf dem Platz.
- **Wegwerfen** ist nie vorausgewählt und steht nie an erster Stelle.
- **Controller:** Im offenen Menü bewegen hoch/runter (bzw. links/rechts) zwischen den Knöpfen, A bestätigt, B schließt das Menü (und erst ein weiteres B verlässt wie heute die Zone bzw. den Rucksack). **Y** bleibt die Abkürzung „sofort anlegen“ bzw. „in die Schnellleiste“ auf dem Platz unter dem Cursor, ohne Menü (wie heute `_kurzaktion`).
- **Maus:** wie Touch; Esc schließt das Menü.

### Verschieben

- „Verschieben“ merkt sich den Quellplatz und schließt das Menü; der Quellplatz bekommt eine deutliche Markierung („wird verschoben“), oben im Panel ein kurzer Hinweis („Wohin? Tippe einen Platz an“).
- Der nächste Tipp/A auf einen Rucksackplatz verschiebt dorthin: auf einen leeren Platz verschieben, auf einen belegten tauschen (`rs.tausche`). B oder ein Tipp auf den Quellplatz bricht ab.
- So kommen Dinge auch in die Schnellleiste an eine bestimmte Stelle.

### Bessere Ausrüstung beim Aufheben

- Beim Aufsammeln einer Beutekugel mit Ausrüstung (heute `rucksack.lege` in `js/wesen.js`, Rückgabe „aufgesammelt“) wird geprüft, ob sie **eindeutig besser** ist als das Getragene am selben Platz:
  - Platz leer → besser.
  - Sonst: kein Wert schlechter und mindestens ein Wert besser (nach `SC.Beute.vergleiche`, alle Schlüssel). Sonderfähigkeiten (`sonder`): hat der getragene eine, die der neue nicht hat, gilt der neue **nicht** als eindeutig besser.
- Dann wird angelegt, der alte Gegenstand kommt in den Rucksack (an den Platz, an dem der neue lag), und ein Hinweis erscheint: „Neuer Helm angelegt: Schutz 5 → 9“ (`ui.hinweis`, Text in `SC.T`).
- **Nur Rüstung und Schild** (Plätze helm, brust, handschuhe, stiefel, schild). Waffen nie, sie werden über die Schnellleiste gehalten.
- Gilt überall, wo Ausrüstung in den Rucksack kommt, durch Aufsammeln: auf Planeten (Beutekugel) und im All (`js/raumflug.js`, Beute aus Kämpfen). Nicht für Hergestelltes (Werkbank) und nicht für die Kreativ-Ausrüstung aus der Blockauswahl.
- **Abschaltbar (Entscheidung des Nutzers):** neue Einstellung „Bessere Ausrüstung automatisch anlegen“ in den Einstellungen, **Standard an**. Ist sie aus, landet Beute wie bisher nur im Rucksack. Gespeichert wie die anderen Einstellungen (`SC.Einstellungen`, Standardwert in `standard()`, ältere gespeicherte Einstellungen ohne das Feld gelten als „an“).
- Mehrspieler: Das Anlegen passiert dort, wo die Beute heute im Rucksack des Aufsammelnden landet; ein Gast sieht dasselbe Verhalten wie im Einzelspiel.

## Rahmen

- Klassische Skripte, keine Module, ältere Safari (iOS 16 auf dem alten iPad) muss laufen.
- Spielstände bleiben kompatibel; es kommen keine neuen gespeicherten Felder hinzu (Rucksack und Ausrüstung haben dieselbe Form).
- Texte deutsch in `SC.T`.
- Bestehende Controller-Navigation (Zonen, `navigiere`, LB/RB, Startzone, `menueAktion`) bleibt; das Aktionsmenü ist für die Navigation eine eigene, vorübergehende Zone, aus der man nicht herausnavigiert, solange es offen ist.
- Tests in der Testseite: Cursor folgt dem Antippen, Menüinhalt je Sache, Reihenfolge (Wegwerfen nie zuerst), Anlegen in zwei Schritten, Verschieben/Tauschen, Abbrechen, Controller-Ablauf (A, B, Y), „eindeutig besser“ samt Sonderfähigkeit und leerem Platz, Hinweistext.
- Prüfung auf echtem Gerät (iPad mit Touch) vor dem Livegang; die Testseite prüft kein Antippen in Safari.

## Dem Umsetzer überlassen

- Aussehen des Menüs im Rahmen der ruhigen Panels aus 0.22.0 (Fläche, Rand, Abstände), Knopfgröße mindestens wie die heutigen Knöpfe (48 px hoch).
- Ob das Menü als eigenes Element im Seitenpanel oder als Ersatz des heutigen Detailbereichs `.rs-detail` gebaut wird, solange es sichtbar am Platz erscheint.
- Was aus dem heutigen Detailbereich rechts wird (wegfallen oder nur noch Werte des Spielers zeigen) – Vorschlag: Werte des Spielers (`.rs-werte`) bleiben, das Detail entfällt.
- Wie genau „wird verschoben“ aussieht.

## Entscheidungen von mir (Claude), nicht ausdrücklich vom Nutzer

- „Eindeutig besser“ = kein Wert schlechter, mindestens einer besser, keine Sonderfähigkeit verloren; leerer Platz zählt als besser.
- Nur Rüstung und Schild werden automatisch angelegt, Waffen nie.
- Wegwerfen nie an erster Stelle, Abbrechen immer dabei.
- Werkbank, Truhe, Blockauswahl bleiben in diesem Schritt unverändert.
- Der Ausrüstungsplatz „Waffe“ zeigt die gehaltene Waffe aus der Schnellleiste; ein Tipp darauf öffnet das Menü dieses Schnellleisten-Platzes (Verschieben · Wegwerfen · Abbrechen), kein „Ablegen“.
- Der Hinweis beim automatischen Anlegen nennt den Hauptwert der Art (`SC.GEGENSTAENDE[art].haupt`, z. B. Schutz oder Schild), alt → neu.
- Automatisches Anlegen erst, nachdem die Beute im Rucksack liegt: dann tauscht der Gegenstand mit dem Getragenen, der alte liegt an seinem Platz. Ist der Rucksack voll, bleibt die Beute wie heute liegen und es wird nichts angelegt.

## Offen für später

- Dasselbe Bedienmuster (ein Cursor, Aktionsmenü) für Truhe und Werkbank, falls es sich im Rucksack bewährt.
