# Spiegel – Design

Issue #188. Mit dem Nutzer am 2026-11-10 abgestimmt (Vorschlag von Claude, vom Nutzer mit „passt“ bestätigt; iPad und Einstellung vom Nutzer nachträglich festgelegt).

## Absicht

Die Kinder wollen einen Spiegel bauen und sich darin „wie im echten Leben“ sehen. Der Reiz: die eigene Figur mit Rüstung, Waffe, Begleit-Tieren und Mitspielern sehen, die sich mitbewegt. In der Ich-Ansicht sieht man sich sonst nie. Der Spiegel schmückt zugleich Häuser (passt zu #186 „Bilder zum Aufhängen“).

## Ziele

- Neues Bauteil **Spiegel**, an der Werkbank herzustellen.
- Hängt flach an einer Wand (wie die Leiter, Richtung nach der Wand), **1 Block breit, 2 Blöcke hoch** (Ganzkörperspiegel, zwei Hälften wie die Tür).
- **Echtes, bewegtes Spiegelbild:** Die Welt wird aus einer gespiegelten Kamera noch einmal gezeichnet. Zu sehen sind die eigene Figur (auch in der Ich-Ansicht), Mitspieler, Wesen (Tiere, Gegner), Fahrzeuge und die Umgebung. Links und rechts sind vertauscht wie bei einem echten Spiegel.
- Funktioniert in Kreativ und Survival, allein und im Mehrspieler.

## Nicht-Ziele

- Spiegel, die sich gegenseitig spiegeln (endloser Tunnel): im Spiegelbild erscheinen andere Spiegel nur mit ihrem Glanz.
- Mehrere gleichzeitig echte Spiegel. Nur einer spiegelt wirklich.
- Spiegel auf dem Boden oder an der Decke, Spiegel in Fahrzeugen, gebogene Spiegel.
- Spiegelbild im All (dort gibt es keine Blockwelt).

## Anti-Ziele (wäre ein Fehlschlag, auch wenn es technisch geht)

- Das Spiel ruckelt am iPad, sobald ein Spiegel in der Nähe hängt.
- Das Spiegelbild ist nicht gespiegelt (Bild wie von einer Kamera hinter der Wand) oder zeigt die Ich-Ansichts-Hand bzw. Handwaffe frei schwebend.
- Alte Spielstände brechen oder ändern sich.

## Festlegungen

### Block und Aufstellen

- Neue Block-IDs ab 89 (nie umnummerieren): je Wandrichtung N/S/O/W eine untere und eine obere Hälfte, also 8 IDs (`SPIEGEL_N` … `SPIEGEL_W`, `SPIEGEL_N_OBEN` … `SPIEGEL_W_OBEN`). Die Zustände stecken wie bei Tür und Leiter in den IDs. Speichern und Mehrspieler brauchen deshalb nichts Neues; das Netzprotokoll muss nicht erhöht werden, sofern unbekannte Block-IDs bei Gästen ohnehin nicht vorkommen (alle laden dieselbe Version; der Builder prüft, ob die Protokollnummer trotzdem steigen soll, wie bei früheren neuen Blöcken).
- Form: Platte an der Wandseite der Zelle (`form: { typ: "platte", achse, versatz }` wie die Leiter), nicht fest (man läuft nicht dagegen, wie bei der Leiter), nicht kletterbar.
- Aufstellen wie die Leiter: nur an die Seitenfläche eines festen, deckenden Blocks; die Richtung kommt aus der Normalen. Die obere Zelle muss frei sein, sonst wird nicht gesetzt (wie bei der Tür, `SC.Bauteile.setze`).
- Abbauen einer Hälfte entfernt beide; man bekommt **einen** Spiegel zurück (wie Tür bzw. Bett). In der Kreativ-Auswahl steht nur `SPIEGEL_N`; alle Varianten werden im Rucksack auf `SPIEGEL_N` zurückgeführt (Tabelle `GRUND` in `js/rucksack.js`).
- In der Hand und im Rucksack: als flacher Gegenstand mit Rahmen und silberner Fläche.

### Rezept

- An der Werkbank: **2 Glas + 1 Eisenerz + 2 Bretter → 1 Spiegel** (Claudes Vorschlag; Glas für die Fläche, Eisenerz für den Belag, Bretter für den Rahmen). Name „Spiegel“ in `SC.T` (Rezeptname und Blockname).

### Aussehen ohne Spiegelbild

- Textur „spiegel“ im Pixel-Look: Holzrahmen außen, innen silbrig-blaue Fläche mit ein, zwei hellen Glanzstreifen. Das ist der Anblick aller Spiegel, die gerade nicht spiegeln (zu weit weg, nicht der nächste, nicht im Blick, im Spiegelbild selbst).
- Untere und obere Hälfte haben je eine eigene Kachel, damit der Rahmen über beide Blöcke durchläuft (oben ohne untere Kante, unten ohne obere Kante).

### Echtes Spiegelbild

- **Aktiv ist höchstens ein Spiegel:** der nächste im Umkreis von **8 Blöcken**, dessen Spiegelseite zum Spieler zeigt (Spieler vor der Wandfläche, nicht dahinter) und der grob im Blickfeld liegt. Hysterese, damit es beim Hin- und Herlaufen zwischen zwei Spiegeln nicht flackert, ist dem Builder überlassen.
- Vor die Spiegelfläche des aktiven Spiegels (beide Hälften zusammen, 1 × 2) wird eine Fläche gelegt, die das Spiegelbild aus einer Render-Textur zeigt, den Holzrahmen frei lässt und minimal vor der Platte liegt (kein Flackern mit der Blockfläche).
- Spiegelkamera nach dem Verfahren von three.js `Reflector` (examples, nicht im eingecheckten UMD-Build enthalten, deshalb eigene kleine Umsetzung): Kamera an der Spiegelebene gespiegelt, **schräge Near-Ebene** (Oblique-Projektion) statt Clipping-Ebenen, weil die Blockwelt eigene `ShaderMaterial`s ohne Clipping-Unterstützung nutzt. Ergebnis über Texturkoordinaten aus der Projektion auf die Fläche.
- Im Spiegel-Durchgang:
  - die eigene Figur sichtbar (auch in der Ich-Ansicht; im Zuschauermodus nicht), mit aktueller Haltung, Rüstung und Waffe;
  - Hand, gehaltener Block und Handwaffe der Ich-Ansicht (hängen an der Kamera, `this.kamera` ist Kind der Szene) unsichtbar;
  - die Spiegelfläche selbst unsichtbar;
  - danach alles wie vorher.
- Wetter: Regen-/Schnee-Teilchen und Blitzschein erscheinen im Spiegel einfach so, wie sie in der Szene liegen; keine Sonderbehandlung im Spiegel-Durchgang (Claudes Entscheidung).
- Nebel und Licht laufen über die vorhandenen Uniforms; die Sichtweite im Spiegel ist kürzer als die normale (Builder wählt, Richtwert 32 Blöcke Far-Ebene), damit die gespiegelte Welt nicht durch unnötig viele Chunks läuft.
- Ohne aktiven Spiegel kostet das Feature nichts außer der Suche nach dem nächsten Spiegel; diese darf nicht jedes Bild alle Blöcke im Umkreis abfragen (z. B. Spiegel-Positionen beim Chunk-Bau sammeln oder nur alle paar Zehntelsekunden suchen – Builders Wahl).

### Leistung

- Auflösung der Render-Textur fest und klein: am Computer etwa 256 × 512, mit Touch (iPad) etwa 128 × 256 (Richtwerte, Builder darf anpassen, Seitenverhältnis 1 : 2).
- Mit Touch oder wenn das Spiel bereits „weniger“ zeichnet (`this._weniger` beim Wetter), wird das Spiegelbild nur jedes zweite Bild erneuert.
- **Am iPad spiegelt der Spiegel von Anfang an** (Entscheidung des Nutzers), mit den kleineren Werten oben. Eine Messung am Gerät gibt es vorher nicht.
- **Einstellung für Spieler:** in den Einstellungen ein Eintrag „Spiegel“ mit „An“ / „Aus“ (Entscheidung des Nutzers), Standard „An“ auf allen Geräten. Gespeichert in `SC.Einstellungen` wie „Wetter-Effekte“; gespeicherte Einstellungen ohne das Feld gelten als „An“. Bei „Aus“ zeigen alle Spiegel nur ihren Glanz, es wird kein zweites Bild gezeichnet und keine Render-Textur angelegt. Die Einstellung gilt nur für das eigene Gerät und wirkt sofort, ohne Neuladen.
- Kein zusätzlicher Schalter im Entwicklerpanel; die Einstellung reicht auch zum Messen (Claudes Entscheidung).
- Messung mit `?leistung` am Mac vor und nach dem Aufhängen eines Spiegels; Ziel: kein messbarer Unterschied ohne Spiegel, mit aktivem Spiegel am Mac weiter über 60 fps.

### Spielstand und Mehrspieler

- Nur neue Block-IDs; alte Spielstände bleiben unverändert gültig.
- Jedes Gerät zeichnet sein Spiegelbild selbst; Mitspieler erscheinen darin, weil ihre Figuren ohnehin in der Szene liegen. Nichts wird übertragen außer den Blöcken.

### Texte

- Anleitung (`SC.T.anleitung`) um einen Satz zum Spiegel ergänzen, dazu der Hinweis für langsame Tablets, den Spiegel in den Einstellungen auszuschalten (wie der vorhandene Satz zu den Wetter-Effekten). `docs/ANLEITUNG.md` neu erzeugen wie bisher.
- Bezeichnungen der Einstellung („Spiegel“, „An“, „Aus“) in `SC.T`.

## Dem Builder überlassen

- Name und Datei der Spiegel-Klasse (Vorschlag `js/render-spiegel.js`, in `index.html` und `tests/index.html` in gleicher Reihenfolge laden).
- Wie der aktive Spiegel gefunden wird und die Hysterese.
- Genaue Auflösung, Far-Ebene, Texturmuster und Glanzstreifen.
- Ob die Netzprotokollnummer steigt.
- Version: neue Funktion → MINOR (0.28.0).

## Tests (Testseite)

- Rezept vorhanden, Kosten wie oben, ergibt `SPIEGEL_N`.
- `aufstellId`: Richtung aus der Normalen an allen vier Seiten; Boden, Decke, nicht feste oder durchsichtige Blöcke → 0.
- Setzen belegt zwei Zellen (unten + passende obere ID); obere Zelle belegt → nichts gesetzt.
- Abbauen einer Hälfte entfernt beide, ergibt einen Spiegel; Rucksack führt alle Varianten auf `SPIEGEL_N` zurück.
- Auswahl des aktiven Spiegels: nächster vor der Spiegelseite, keiner hinter der Wand, keiner über 8 Blöcke.
- Spiegelmathematik: gespiegelte Kameraposition und -richtung an einer Ebene (reine Funktion, ohne WebGL testbar).
- Einstellung: Standard „An“; gespeicherte Einstellungen ohne das Feld → „An“; bei „Aus“ gibt es keinen aktiven Spiegel.
- Alter Spielstand ohne Spiegel lädt unverändert.

Im echten Spiel (Chrome, `file://`) prüfen: Spiegel bauen und aufhängen, sich in Ich- und Außenansicht sehen, Seiten vertauscht, keine schwebende Hand, Rüstung sichtbar, zwei Spiegel nebeneinander (nur einer spiegelt, kein Flackern), Einstellung „Spiegel: Aus“ schaltet das Spiegelbild sofort ab und „An“ wieder ein, FPS mit `?leistung`. Nicht prüfbar ohne Gerät: iPad-Leistung; das steht so in der Roadmap, bis der Nutzer es am Gerät ausprobiert hat.
