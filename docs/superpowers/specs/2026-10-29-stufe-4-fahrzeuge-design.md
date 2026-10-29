# Stufe 4: Fahrzeuge – Design

Stand 2026-10-29, mit dem Nutzer abgestimmt. Entscheidungen, die ich (Claude) selbst getroffen habe, sind mit *(eigene Entscheidung)* markiert.

## Absicht

Die Kinder sollen gleich zusammen herumfahren und -fliegen können: einsteigen, losdüsen, die Welt schneller erkunden und gemeinsam im selben Fahrzeug Gegner bekämpfen. Fahrzeuge werden in Stufe 4 **gefunden, nicht gebaut**. Selberbauen (Crafting von Fahrzeugen und Raumschiffen) kommt erst nach Stufe 5. Der Name der Stufe in der Roadmap („Fahr- und Flugzeuge bauen“) wird entsprechend angepasst.

Vorbild sind Fahrzeuge und Raumschiffe aus Star Wars, aber mit eigenen Formen und Namen und ohne geschützte Begriffe. Kindgerecht bleibt Pflicht.

## Ziele

**Drei Fahrzeugarten, jede mit vier Plätzen** (1 Fahrer, 3 Mitfahrer), damit alle Spieler eines Raums (höchstens 4) im selben Fahrzeug sitzen können:

| Art | Vorbild | Eigenschaften |
|---|---|---|
| **Gleiter** | offener Landgleiter | schnellstes Bodenfahrzeug, schwebt knapp über dem Boden, auch über Wasser; **kein** Bordgeschütz |
| **Buggy** | schwerer Geländewagen mit großen Rädern und Geschützturm | langsamer, robust (mehr Panzerung), schafft Stufen von 1 Block Höhe und steile Hänge; Bordlaser |
| **Flieger** | kleiner Gleitjäger mit Cockpit und Flügeln | fliegt, kann in der Luft stehen bleiben; Bordlaser |

Aussehen: blockig wie die Spielfiguren (aus Quadern zusammengesetzt, wie die Gegner in render-wesen.js), mit Leuchtstreifen in Laserfarben. Namen auf Deutsch, eigene Erfindung (Anzeigenamen in texte.js).

**Finden**
- Ein erster **Gleiter** steht nahe am Startpunkt, vom Start aus sichtbar, damit man nach wenigen Minuten fahren kann. Das gilt auch für bestehende Welten (wird beim Laden nachgezogen, wenn es den Eintrag noch nicht gibt).
- Weitere Fahrzeuge stehen an **Fundorten bei Bauwerken**. *(eigene Entscheidung)* Statt neuer Hangar-Bauwerke werden die vorhandenen Bauwerke genutzt, weil neue Bauwerke den Weltgenerator ändern würden und alte Welten sie nicht hätten: **Lager → Buggy**, **Station → Flieger**, **Herrenhaus → Gleiter**. Das Fahrzeug steht neben dem Bauwerk auf dem Boden (Flieger: auf dem Dach der Station, falls dort Platz ist, sonst daneben). Die Lage ist deterministisch aus Bauwerk und Seed abgeleitet.
- Im Survival sind diese Orte durch die vorhandenen Gegner der Bauwerke bewacht; das Fahrzeug ist dort die Belohnung neben den Kisten.
- **Kreativ:** Jedes Fahrzeug lässt sich frei hinstellen (z. B. über die Blockauswahl, eigener Bereich „Fahrzeuge“). Hingestellte Fahrzeuge kann man im Kreativmodus auch wieder entfernen.
- **Entwicklerwerkzeuge (F3):** Fahrzeuge erzeugen (Art wählen, erscheint vor dem Spieler) und alle Fahrzeuge der Umgebung entfernen. Das funktioniert in jedem Modus, wie das Erzeugen von Gegnern.

**Fahrzeuge bleiben in der Welt**
- Sie kommen nicht in den Rucksack. Man steigt ein, fährt, steigt aus, und das Fahrzeug bleibt dort stehen.
- Sie werden mit der Welt gespeichert (Position, Richtung, Panzerung) und sind nach dem Laden wieder da.
- Ein Fundort liefert sein Fahrzeug nur einmal. Wird es weggefahren, bleibt der Fundort leer. So vermehren sich Fahrzeuge nicht.
- Im gemeinsamen Spiel kann jeder jedes Fahrzeug benutzen.

**Ein- und Aussteigen**
- Vor das Fahrzeug stellen und „Benutzen“ (Taste und eigener Touch-Knopf, Gamepad-Taste). Wer zuerst einsteigt, fährt; weitere werden Mitfahrer. Ist der Fahrersitz frei geworden, rückt niemand automatisch nach *(eigene Entscheidung)*; wer fahren will, steigt aus und wieder ein.
- Im Zuschauermodus kann man nicht einsteigen; wechselt ein Insasse in den Zuschauermodus, steigt er aus *(eigene Entscheidung)*.
- Speichern und Verlassen der Welt im Fahrzeug: Beim nächsten Laden steht man neben dem Fahrzeug, nicht darin *(eigene Entscheidung)*. Verlässt ein Gast den Raum oder reißt seine Verbindung ab, wird sein Sitz frei; fuhr er, bleibt das Fahrzeug stehen.
- Aussteigen mit derselben Taste. Man landet sicher neben dem Fahrzeug auf freiem Boden. Aus dem fliegenden Flieger aussteigen ist möglich; man fällt dann normal (Fallschaden wie sonst im Survival).

**Steuerung (gleiches Gefühl auf allen Geräten)**
- **Fahren (Gleiter, Buggy):** Bewegungstasten bzw. linker Stick wie zu Fuß. Vorwärts gibt Gas, rückwärts bremst bzw. setzt zurück, links/rechts lenkt. Maus bzw. rechter Stick bzw. Wischen dreht die Blickrichtung und zielt mit dem Bordgeschütz. Angriffstaste schießt mit dem Bordgeschütz.
- **Fliegen (Flieger):** bewusst einfach, eher wie eine Drohne als wie ein Flugzeug. Wie Fahren, dazu Springen = steigen, Ducken = sinken. Er bleibt in der Luft stehen, wenn man nichts drückt, und landet weich. Er kann nicht abstürzen, nur abgeschossen werden. Flughöhe begrenzt bis knapp über die höchsten Berge; ins All geht es erst in Stufe 5.
- **Kamera:** im Fahrzeug standardmäßig Verfolgeransicht von hinten; die vorhandene Ansichtstaste schaltet auf Ich-Ansicht um.
- **Blöcke:** Fahrzeuge zerstören keine Blöcke. Sie stoßen dagegen oder fahren darüber (Buggy bis 1 Block Stufe). Abbauen und Bauen ist aus dem Fahrzeug heraus nicht möglich *(eigene Entscheidung)*.
- **Mitfahrer** schauen frei umher und kämpfen mit ihren eigenen Waffen: Laserwaffen schießen normal, das Laserschwert erreicht Gegner neben dem Fahrzeug. Blöcke bauen können sie nicht.

**Kampf (Survival)**
- **Rammen:** Gegner, in die man hineinfährt, werden weggeschleudert und bekommen leichten Schaden (abhängig vom Tempo). Bosse bleiben stehen und schubsen das Fahrzeug zurück.
- Im Kreativmodus nehmen Fahrzeuge keinen Schaden und es gibt keine Panzerungsanzeige *(eigene Entscheidung)*.
- **Panzerung:** Jedes Fahrzeug hat eigene Lebenspunkte mit eigener Anzeige im HUD, solange man drin sitzt. Treffer von Gegnern auf Insassen gehen auf die Panzerung, nicht auf die Insassen.
- **Panzerung leer:** Das Fahrzeug verpufft wie ein besiegter Gegner (kein Explosionsgrusel), alle Insassen stehen sicher am Boden. Nach einer Weile (Vorschlag: 2 Minuten Spielzeit) steht es wieder an seinem Fundort, mit voller Panzerung. Gefundene Fahrzeuge gehen so nie endgültig verloren. Frei hingestellte Fahrzeuge (Kreativ, Entwicklerwerkzeuge) haben keinen Fundort und verschwinden dann *(eigene Entscheidung)*.
- Panzerung erholt sich langsam, wenn das Fahrzeug eine Weile nicht getroffen wurde *(eigene Entscheidung, damit man nicht reparieren muss; Reparieren kommt mit Crafting)*.
- Gegner greifen Fahrzeuge an wie Spieler: Insassen sind Ziele, der Schaden geht aufs Fahrzeug.
- Spaßkampf (PvP): Bordgeschütze treffen Mitspieler nur, wenn Spaßkampf an ist; Rammen von Mitspielern macht nie Schaden *(eigene Entscheidung)*.

**Gemeinsam spielen**
- Alle sehen dieselben Fahrzeuge an denselben Stellen und alle Insassen im Fahrzeug sitzen.
- Bis zu vier Spieler im selben Fahrzeug; jeder kann fahren, wenn der Fahrersitz frei ist.
- Fahren soll sich für den Fahrer flüssig anfühlen, auch wenn er Gast ist.

## Nicht-Ziele in Stufe 4

- Fahrzeuge selbst bauen oder aus Blöcken zusammensetzen, Crafting, Reparieren mit Rohstoffen.
- Weltraum, Verlassen des Planeten, Raumschiffe (Stufe 5).
- Neue Bauwerke (Hangar) oder Änderungen am Weltgenerator.
- Fahrzeuge verbessern, lackieren, Seltenheitsstufen für Fahrzeuge.
- Fahrzeuge der Gegner.
- Fahrzeuge, die Blöcke abbauen oder zerstören.

## Anti-Ziele (wäre ein Fehlschlag, auch wenn es technisch läuft)

- Das erste Fahrzeug ist schwer zu finden oder schwer zu bedienen; ein Neunjähriger fährt nicht nach kurzer Zeit los.
- Der Flieger ist so schwer zu steuern, dass man ständig irgendwo hängt oder die Orientierung verliert.
- Fahrzeuge gehen dauerhaft verloren (vergessen, zerstört, beim Speichern weg) und die Kinder sind traurig.
- Fahrzeuge vermehren sich (Fundort liefert immer wieder neu) oder verschwinden im gemeinsamen Spiel bei einem Spieler.
- Im gemeinsamen Spiel ruckelt das Fahrzeug, in dem man sitzt, oder Mitfahrer hängen hinterher.
- Verpuffen oder Rammen wirkt brutal.
- Bestehende Spielstände brechen.

## Rahmenbedingungen

- Alles aus AGENTS.md: kein Build, keine Module, `file://`, ältere iOS-Safari, Deutsch, Ladereihenfolge in `index.html` und `tests/index.html` gleich.
- **Spielstand-Kompatibilität:** Fahrzeuge kommen als neues Feld je Planet in den Spielstand (Vorschlag: `planeten[id].fahrzeuge`), beim Laden mit Standardwert nachgezogen. `SC.FORMAT` nur erhöhen, wenn nötig; alte Welten bekommen beim ersten Laden den Start-Gleiter.
- **Generator unverändert:** `SC.GENERATOR_VERSION` bleibt; Fundorte werden aus den vorhandenen Bauwerken abgeleitet.
- Läuft auf Tablet flüssig (Fahrzeugmodelle aus wenigen Quadern).
- Steuerung für Tastatur/Maus, Touch und Gamepad.
- Planet umschlagend (Ring der Größe `planet.groesse`); Fahrzeugpositionen und Abstände wie bei Wesen über `SC.mod` behandeln.
- Mehrspieler-Protokoll (`SC.NETZ_PROTOKOLL`) wird erhöht, wenn neue Nachrichten nötig sind; Gast und Gastgeber verschiedener Versionen lehnen sich wie bisher sauber ab.
- Version 0.7.0.

## Technische Entscheidungen (getroffen)

- Fahrzeuge sind Objekte der Welt, gespeichert je Planet, nicht im Rucksack.
- Fundorte: Lager → Buggy, Station → Flieger, Herrenhaus → Gleiter, plus ein Gleiter beim Startpunkt.
- Gastgeber hält und speichert die Fahrzeuge, wie die Welt. Ein Gast speichert nie Fahrzeuge der Gastwelt.

## Was dem Planer überlassen ist

- Zahlenwerte: Tempo, Beschleunigung, Lenkung, Flughöhe, Panzerung, Rammschaden, Bordlaser-Schaden, Erholung, Wiederkehrzeit. Ausgangspunkt: Gleiter etwa 3× Laufgeschwindigkeit, Buggy 2×, Flieger 2,5×.
- Tastenbelegung für „Benutzen“ (frei ist z. B. `F`; vorhandene Tasten nicht umbelegen) und Lage des Touch-Knopfs.
- Abgleich im Mehrspieler: Vorschlag ist, dass der Fahrer (auch als Gast) das Fahrzeug selbst rechnet und seine Position wie den eigenen Zustand sendet, der Gastgeber Sitze vergibt, Panzerung und Treffer rechnet und an alle verteilt. Andere Lösungen sind in Ordnung, wenn die Anti-Ziele eingehalten werden.
- Wie genau Bordgeschütz und Mitfahrer-Waffen in den vorhandenen Kampf (js/kampf.js, Geschosse in js/wesen.js) eingehängt werden.
- Modelle, Farben und Namen der Fahrzeuge im Rahmen von „Star-Wars-angelehnt, blockig, Leuchtstreifen“.
- Geräusche (Motor, Schweben, Bordlaser) im vorhandenen Stil (im Code erzeugt, js/audio.js).
- Aufteilung in Aufgaben und Reihenfolge.

## Prüfen

- Testseite grün, neue Tests für Fahrzeuglogik (Ein-/Aussteigen, Sitze, Fahren und Kollision, Fliegen und Höhengrenze, Panzerung, Verpuffen und Wiederkehr am Fundort, Speichern und Laden, Nachziehen in alten Spielständen, Fundorte deterministisch, keine Vermehrung, Mehrspieler über das Speicher-Netz).
- Spieltest im Browser per DevTools: Start-Gleiter finden und fahren, Buggy und Flieger an Bauwerken, Kampf aus dem Fahrzeug, Laptop- und Tablet-Größe.
- Mehrspieler mit zwei Browserfenstern: vier Plätze, Fahrerwechsel, Gast als Fahrer.
- Gerätetest durch den Nutzer in der Test-Vorschau.
