# Wasser und Lava fließen – Design

Stand: 2026-11-08, mit dem Nutzer abgestimmt (Issue #170 „Wetter“, Teil 1 von 2).

## Warum

Die Kinder wünschen sich Wetter: Bei Regen und Sturm soll sich Wasser in Mulden sammeln (#170). Dafür und auf ausdrücklichen Wunsch des Nutzers soll Wasser – wie in Minecraft – **fließen**, Lava ebenfalls, aber langsamer. Das Wetter (Regen, Pfützen, die später austrocknen, Gewitter, Schnee, Nebel) ist ein eigenes, zweites Projekt mit eigener Spec und baut auf diesem auf: Der Regen muss dann nur Wasser auf den Boden bringen, das Fließen erledigt den Rest.

Heute sind `WASSER` (ID 8) und `LAVA` (ID 29) feste Blöcke, die sich nie bewegen.

## Ziele

- Wasser und Lava fließen wie in Minecraft: Gräbt man neben einem See, strömt Wasser ins Loch; ein gesetzter Wasserblock läuft den Hang hinunter.
- Strömung schiebt Spieler, Tiere und Gegner mit (abgestimmt).
- Lava fließt langsamer und weniger weit; trifft sie auf Wasser, entsteht Basalt.
- Läuft flüssig auf dem iPad, funktioniert im Mehrspieler, bricht keine Spielstände.

## Nicht-Ziele

- Kein Wetter in diesem Projekt (kommt danach).
- Keine physikalische Wassersimulation (Druck, Volumen, Wellen). Es gilt das einfache Minecraft-Modell.
- Wasser zerstört keine Blöcke (auch keine Fackeln, Pflanzen o. Ä.) – fließt nur in Luft. (Annahme: Minecraft spült Fackeln weg; das wäre ein späterer Wunsch.)
- Keine Eimer/kein Wasser-Aufheben im Survival (kann später kommen).

## Anti-Ziele (wäre ein Fehlschlag, selbst wenn es technisch läuft)

- Ein bestehender See oder ein Meer läuft beim Laden oder durch eine kleine Grabung leer bzw. flutet die halbe Welt.
- Das Spiel ruckelt am iPad, weil irgendwo viel Wasser fließt.
- Alte Spielstände laden nicht mehr oder sehen anders aus.
- Kinder werden von Strömung in Lava geschoben oder kommen aus einem Wasserloch nicht mehr heraus.

## Verhalten

### Quellen und fließende Blöcke

- **Quelle** = voller, ruhender Block. Alle bisherigen `WASSER`/`LAVA`-Blöcke sind Quellen (Seen und Meere der Landschaft, Kreativ-Wasser, alte Spielstände). Die IDs 8 und 29 bleiben die Quellen.
- **Fließend** = neue Block-IDs mit Stufe: Wasser 7 Stufen seitlich (1 = fast leer … 7 = fast voll) plus „fallend“ (voller Strahl nach unten); Lava 3 Stufen plus „fallend“. Die Stufe steckt in der ID wie bei Türen (`TUER_X_OFFEN` usw.); Chunks sind `Uint8Array`, IDs bis 255 (bisher bis 72 belegt).
- **Ausbreitung:** Unter einem Flüssigkeitsblock ist Luft → dort entsteht „fallend“. Sonst breitet er sich zur Seite in Luft aus, jeweils eine Stufe flacher. Wasser kommt so von einer Quelle aus 7 Blöcke weit, Lava 3. Wie in Minecraft bevorzugt fließendes Wasser die Richtung zum nächsten Abhang (Suche ein paar Blöcke weit), damit es einen Hang hinunterläuft statt sich flach auszubreiten – Umfang der Suche ist Sache des Builders.
- **Nachlaufen:** Ein fließender Block, der von keiner höheren Stufe/Quelle/fallendem Block mehr versorgt wird, wird flacher und verschwindet. Baut man eine Quelle zu oder ab, läuft der Strom also aus.
- **Neue Quellen:** Wie in Minecraft entsteht aus fließendem Wasser eine neue Quelle, wenn es zwischen zwei Quellen auf festem Boden (oder auf Quelle) liegt. Damit läuft ein See nicht leer, wenn man daneben gräbt. Für Lava nicht.
- **Lava trifft Wasser:** Wo sich Lava und Wasser berühren, entsteht Basalt (ID 32): Lava-Quelle → Basalt, fließende Lava → Basalt. Wasser bleibt.
- **Tempo:** Wasser etwa 4 Schritte pro Sekunde, Lava etwa 1 Schritt pro Sekunde (Werte als Konstanten, nach Spieltest anpassbar).

### Strömung schiebt

- Fließende Wasser- und Lavablöcke haben eine Strömungsrichtung (von höherer zu niedrigerer Stufe bzw. abwärts). Wer drin ist – Spieler, Tiere, Gegner, aber nicht Fahrzeuge (Builders Wahl, falls es einfach geht) – wird sanft mitgeschoben, ungefähr Gehgeschwindigkeit der Kinder durch halb so schnell; dagegen anschwimmen muss möglich sein.
- Quellen schieben nicht (ruhige Seen bleiben ruhig).
- Fallendes Wasser drückt nicht nach unten stärker als normales Sinken.

### Wie es aussieht

- Fließende Blöcke werden mit niedrigerer Oberfläche gezeichnet (Höhe nach Stufe), wie in Minecraft. Eine schräge Oberfläche zwischen Nachbarn ist schön, aber Builder-Wahl; Mindestmaß: stufig nach Stufe.
- Optional: Wassertextur wandert in Strömungsrichtung (nur wenn billig).

### Überall sonst

Alle Stellen, die heute `=== SC.B.WASSER` oder `=== SC.B.LAVA` prüfen (Schwimmen und Lavaschaden in `spieler.js`, KI, Fahrzeuge, Betten, Licht, Zielen, Kampf, Audio, Render, Auftauchen in `spiel.js`), müssen künftig „ist Wasser“ bzw. „ist Lava“ fragen, damit fließende Blöcke genauso wirken. Lava schadet in jeder Stufe wie heute.

### Bauen und Abbauen (Entscheidung des Agenten)

- Fließende Blöcke verhalten sich wie Wasser heute: Man kann sie nicht anvisieren oder abbauen, und sie geben keine Beute (also keine Möglichkeit, Blöcke zu verdoppeln). Ein Block, den man hineinsetzt, ersetzt das fließende Wasser bzw. die Lava. So kann man **Dämme bauen**, und der Strom dahinter läuft aus.
- Für Quellen bleibt alles wie heute.

### Strömungsstärke (Entscheidung des Agenten)

- Die Strömung schiebt mit etwa **halber Gehgeschwindigkeit**. Schwimmen und Auftauchen sind stärker, sodass man jederzeit gegen die Strömung und aus jedem Loch herauskommt. Ein Test sichert das ab.
- Lava schiebt genauso, damit niemand weiter hineingezogen wird als heute.

## Technik

- **Nur nahe den Spielern:** Fließen wird nur in geladenen Chunks gerechnet. Eine Warteschlange „aktive Flüssigkeitsblöcke“ wird gefüllt, wenn neben Flüssigkeit ein Block geändert wird (Ereignis `block` der Welt) und wenn eine Flüssigkeit neu entsteht. Ruhende Seen kosten nichts. Pro Schritt ist die Zahl bearbeiteter Blöcke begrenzt (Wert vom Builder, am iPad messen), der Rest wartet.
- **Entladen:** Verlässt ein Chunk den geladenen Bereich, ruht seine Flüssigkeit im aktuellen Zustand (wird so gespeichert) und läuft beim nächsten Laden weiter, sobald ein Nachbar sich ändert. Ein halbfertiger Strom am Rand darf also stehen bleiben – das ist akzeptiert. (Builder darf die aktiven Blöcke eines Chunks mitspeichern, wenn das einfach ist.)
- **Mehrspieler:** Der Gastgeber rechnet das Fließen und verteilt die Blockänderungen auf dem bestehenden Weg (`"netz"`-Blockänderungen in `js/raum.js`), gebündelt pro Schritt. Gäste rechnen kein Fließen. Einen Wechsel des Gastgebers gibt es im Spiel nicht: Geht der Gastgeber, endet die Sitzung, und es braucht keinen eigenen Wiederanlauf. Neue Block-IDs → Netzprotokoll 8 → 9 (alle Geräte neu laden).
- **Speichern:** Änderungen durch Fließen gehen über `setzeBlock` (Quelle z. B. `"fluss"`) und landen damit in `geaenderte`. Generierte Seen bleiben unverändert, solange niemand daneben eingreift; alte Spielstände laden ohne Umwandlung.
- **Generator:** unverändert; er setzt weiter nur Quellen. Startplanet-Prüfsumme muss gleich bleiben.
- **Entwicklerwerkzeug:** „Fließen an/aus“ (zum Testen und falls es irgendwo Ärger macht).
- **Tests:** Ausbreitung, Reichweite, Nachlaufen, neue Quelle zwischen zwei Quellen, Lava+Wasser → Basalt, Tempo-Verhältnis, Grenze pro Schritt, Strömungsrichtung, alte Spielstände laden, „ist Wasser“-Prüfungen.

## Offen / dem Builder überlassen

- Datenstruktur der Warteschlange, Taktung (fester Schritt im Spieltakt), genaue Grenzen.
- Wie die Abhang-Suche umgesetzt ist.
- Ob die Oberfläche schräg oder stufig gezeichnet wird.
- Textur für fließende Lava/Wasser (dieselbe Kachel genügt).
- Ob Fahrzeuge von der Strömung geschoben werden.
- Kreativ-Reiter: fließende Stufen tauchen in der Blockauswahl nicht auf; nur Quellen.

## Danach

Projekt 2 „Wetter“ (eigene Spec): Wetter je Planet (Heimat Regen/Gewitter, Glutfrost Schnee/Schneesturm, Rankenmoor Nebel/Tropenregen), Regen bringt Regenwasser in Mulden, bei Sturm sinkt Boden ab, eine Weile nach dem Regen trocknet es aus und der Boden füllt sich wieder auf (abgestimmt), Blitze treffen keine Spieler/Tiere, Geräusche im Code, Gastgeber bestimmt das Wetter, Einstellung „Wetter-Effekte“.
