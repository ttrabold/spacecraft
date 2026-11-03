# Design: Mit dem Laserschwert nie abbauen (Survival)

**Intent:** Im Survival-Modus stört es den Nutzer, dass der Hieb mit dem Laserschwert
zugleich Blöcke abbaut (Risse am Block, unfreiwillige Löcher im Kampf, voller Rucksack).
Regel künftig: **Wer eine Waffe ausgerüstet hat, kämpft – die Angriffstaste baut nie ab.**
Das war bisher Absicht (`SC.Abbau.zeit` halbierte die Zeit für das Laserschwert,
`_survival` rief zusätzlich `abbauFortschritt`), wird jetzt bewusst umgekehrt.

**Wer, warum:** Vater und die beiden Neunjährigen. Schnell verständlich: „Mit Waffe wird
gehauen; zum Abbauen legt man die Waffe im Rucksack ab (leere Hand).“

## Ziele

- Angriffstaste mit Waffe: nur Hieb (Schwert) bzw. Schuss (Blaster), nie Graben.
- Kein Riss-Overlay und kein Abbau-Sound, wenn eine Waffe ausgerüstet ist.
- Abbauen mit leerer Hand bleibt unverändert möglich.

## Nicht-Ziele

- Kreativmodus bleibt wie bisher (sofortes Abbauen, auch mit Waffe).
- Keine neue Taste, kein neues Werkzeug, keine Werkbank-Tools.

## Folgen (bewusst akzeptiert)

- Zum Abbauen muss die Waffe im Rucksack abgelegt werden (Platz tauschen) – mehr Hin-und-Her,
  aber einfache Regel.
- Abbauen mit leerer Hand ist langsamer als bisher mit Schwert (bisher halbe Zeit):
  das ist die eigentliche Balance-Änderung.

## Ansätze (im Chat entschieden)

1. *Angriff hat Vorrang:* Hieb trifft nur Gegner, graben nur wenn nichts im Bogen liegt.
   → nicht gewählt: Abbauen mit Waffe wäre weiter möglich.
2. **Schwert gräbt nie** (gewählt): Waffe ausgerüstet ⇒ nie graben; Abbauen nur mit leerer
   Hand. Wie Minecraft-Schwerter, klarste Regel für die Kinder.
3. Getrennte Tasten: widerspricht dem Blocken (Rechtsklick-Halten), unübersichtlich für Kinder. → nicht gewählt.

## Decisions

- **Regel an einer Stelle:** Guard in `SC.Spiel#abbauFortschritt` (`js/survival.js`): mit
  `kampf.waffe()` sofort `false`. Der Schwert-Zweig in `_survival` ruft `abbauFortschritt`
  nicht mehr (nur noch Hieb/Schuss). Guard macht die Regel direkt testbar.
- `SC.Abbau.zeit` (js/rucksack.js): Schwert-Bonus `t / 2` entfällt, Parameter `waffenArt`
  wird nicht mehr benötigt; Kommentar „Laserschwert halbiert“ streichen.
- Riss-Overlay und Abbau-Sound: nichts zu ändern (`abbauAnteil` geht ohne laufenden Abbau
  automatisch auf 0; Sound läuft über das Block-Ereignis).
- **Anleitung (js/texte.js)** an drei Stellen anpassen, z. B. Maus:
  „Linke Maustaste – angreifen (mit Waffe) oder Block abbauen (ohne Waffe); im Fahrzeug schießen“;
  sinngleich für Touch (⛏/⚔) und Controller (RT).
- **Tests:** neu in `tests/test-spiel.js`: mit ausgerüsteter Waffe baut
  `abbauFortschritt` nicht ab (Block bleibt, Riss-Anteil 0); ohne Waffe weiter grün
  (`survSpiel` hat bereits Waffe = null). `tests/test-rucksack.js`: `Abbauzeiten`-Zeile
  ohne Schwert-Bonus anpassen (`STEIN` → 1.4).
- **Version:** 0.21.0 (Balance-Änderung → MINOR; 0.20.1 von Issue #17 ist noch ungepusht).
- **Issue** auf GitHub: Titel „Laserschwert baut nie ab (nur mit leerer Hand)“, Label `kampf`,
  Meilenstein „Später“, ins Projektboard; Commit verweist mit `Fixes #N`.

## Offen beim Nutzer

- Ob das Ablegen im Rucksack für die Kinder als zu viel Hin-und-Her empfunden wird
  (Akzeptanz der Folge oben) – sonst wäre Ansatz 1 die mildere Variante.
