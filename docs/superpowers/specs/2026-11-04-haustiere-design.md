# Haustiere – Design

Issue #154. Mit dem Nutzer im Gespräch am 2026-11-04 abgestimmt. Was der Nutzer entschieden hat, steht ohne Zusatz; eigene Entscheidungen sind als **(meine Wahl)** markiert und dürfen vom Umsetzer begründet geändert werden.

## Absicht

Die Kinder wünschen sich Haustiere. Man findet Tiere frei in der Welt, fängt sie mit einem Netz in einem kurzen Geschicklichkeitsmoment, sammelt sie in einem Käfig und nimmt bis zu drei mit. Draußen folgen sie ihrem Besitzer und kämpfen von selbst mit. Streicheln und Füttern machen sie für eine Weile stärker. Sie haben Namen und werden mit der Zeit stärker, damit sie den Kindern ans Herz wachsen.

Leitlinien: kindgerecht wie das ganze Spiel (kein Tier stirbt, kein Frust beim Fangen), Sammeln als Anreiz, alle Planeten zu besuchen.

## Ziele

- Wildtiere laufen friedlich in den Welten herum, je Planet eigene Arten.
- Netz (Werkbank) und Fang-Minispiel „Zielring“.
- Käfig = Haustier-Inventar; bis zu 3 Tiere je Spieler gleichzeitig draußen.
- Haustiere folgen dem Besitzer und kämpfen selbstständig gegen Gegner.
- Streicheln (2 min stärker) und Füttern (5 min stärker, kostet Tierfutter).
- Namen und Stufen.
- Funktioniert im Mehrspieler (jeder hat eigene Tiere).

## Nicht-Ziele (jetzt)

- Keine Befehle an Tiere (bleib, greif an …): sie handeln von selbst.
- Keine Ausrüstung für Tiere.
- Kein Hunger, kein Altern, kein Züchten.
- Nur ein einfaches Tierfutter; Leckerbissen je Tierart später.
- Robo-Hund im All / in Raumstationen: später (#69).
- Reiten auf Tieren: nicht vorgesehen.

## Anti-Ziele (wäre ein Fehlschlag, auch wenn es technisch läuft)

- Ein Tier geht dauerhaft verloren oder „stirbt“ sichtbar.
- Ein misslungener Fangversuch kostet etwas (Netz, Fortschritt) oder bestraft hart.
- Tiere erledigen die Kämpfe allein; der Spieler wird zum Zuschauer.
- Tiere greifen Mitspieler an oder stören beim Bauen (stehen im Weg, laufen in Lava).
- Bestehende Spielstände brechen.

## Tierarten

Je Planet eigene Arten (meine Wahl: nur dort zu finden). Hase, Frosch, Katze, Hund sind vom Nutzer gesetzt, der Rest sind Vorschläge, die der Nutzer gesehen und nicht abgelehnt hat.

| Planet | Arten |
|---|---|
| Heimat (`start`) | Hase, Frosch, Katze, Hund, Fuchs, Eule, Igel |
| Glutfrost | Pinguin, Schneefuchs, Glutsalamander (leuchtet), Eisbärjunges |
| Rankenmoor | Chamäleon (Farbe wechselt), Moorschildkröte, Leuchtkäfer-Schwarm, kleiner Affe |

Jede Art hat eine Seltenheit (gewöhnlich, selten, sehr selten; **meine Wahl**: Hase, Frosch, Pinguin, Chamäleon gewöhnlich; Eule, Glutsalamander, Leuchtkäfer selten oder sehr selten), die Fangschwierigkeit und Häufigkeit bestimmt.

Kampfstil je Art, damit sie sich unterscheiden (**meine Wahl**, Werte dem Umsetzer überlassen): Nahkampf (Hund beißt, Katze springt an, Fuchs, Eisbärjunges), Fernkampf (Frosch spuckt, Glutsalamander Funken, Pinguin Schneeball, Leuchtkäfer Lichtpunkte), Ablenker (Hase, Affe: schnell, ziehen Gegner auf sich), Robust (Schildkröte, Igel: viel Leben, wenig Schaden), Flieger (Eule).

**Aussehen:** Blockfiguren wie die Gegner (Tabelle mit `modell`-Teilen), freundlich und rund, ohne leuchtende Gegneraugen (meine Wahl). Klein (meist unter 1 Block hoch).

## Wildtiere

- Laufen friedlich herum (umherstreifen, kurz stehen bleiben, vor dem Spieler ein wenig weghoppeln), greifen nie an und werden von Gegnern ignoriert.
- Tauchen wie Gegner immer wieder auf und verschwinden in der Ferne; ein Planet kann nicht leergefangen werden (meine Wahl). Mehr am Tag als nachts (meine Wahl). Obergrenze eigener Art in `SC.Wesen.GRENZE` (Zahl dem Umsetzer überlassen, Leistung auf dem iPad beachten).
- In allen Modi außer Zuschauer sichtbar. Im Modus „Friedlich“ gibt es Tiere trotzdem (sie sind keine Gegner).
- Wildtiere kann man nicht verletzen (Angriffe gehen durch sie hindurch), damit niemand aus Versehen einem Tier wehtut (meine Wahl).

## Netz und Fangen

- **Netz**: neuer Gegenstand, an der Werkbank herstellbar (Rezept dem Umsetzer überlassen, billig, z. B. aus Wolle/Fäden und Brettern). Liegt in der Schnellleiste wie eine Waffe. Wird beim Fangen nicht verbraucht (meine Wahl: auch nicht beim Gelingen – einfach halten).
- **Netz und die Regeln aus 0.21.0** (meine Wahl): Das Netz ist keine Waffe (eigener Platz, z. B. `platz: "werkzeug"`), wird aber für „Kämpfen nur mit Waffe, Abbauen nur mit leerer Hand“ wie eine Waffe behandelt: Mit dem Netz in der Hand wird nicht abgebaut. Die Angriffstaste fängt ein Wildtier in Reichweite; ohne Tier in Reichweite tut sie nichts (kein Hieb gegen Gegner). Anleitung und Knopfbeschriftung nennen „Fangen“.
- Mit dem Netz in der Hand löst die Angriffstaste (Klick, ⚔-Knopf, RT) in Reichweite (etwa 4 Blöcke) auf ein Wildtier den Fang aus.
- **Minispiel „Zielring“** (vom Nutzer gewählt): Um das Tier zieht sich ein leuchtender Ring zusammen; erreicht er die grüne Zone, drückt man: Maus/Tastatur Klick oder Leertaste, Touch Antippen (irgendwo), Controller A. Das Tier hält still, solange der Ring läuft; die Welt läuft weiter (meine Wahl; kein Pausieren, damit es im Mehrspieler gleich ist).
- Schwierigkeit je Seltenheit: gewöhnlich 1 Treffer, selten 2, sehr selten 3 Treffer nacheinander, mit schneller werdendem Ring.
- **Daneben**: Das Tier hoppelt ein Stück weg; sofort neuer Versuch möglich. Nichts geht verloren.
- **Gefangen**: Netz schnappt zu, Sternchen, Klang, Hinweis „Neu gefangen: Fuchs!“, das Tier kommt in den Käfig. Ist der Käfig voll: Hinweis, das Tier bleibt frei (kein Fang).
- Während ein Spieler ein Tier fängt, ist es für andere gesperrt.
- Im Kreativmodus kommen Tiere direkt aus der Blockauswahl in den Käfig (meine Wahl, wie die Kreativ-Ausrüstung).

## Käfig (Haustier-Inventar)

- Eigenes Panel, als Seitenpanel wie Rucksack und Werkbank, erreichbar über einen Knopf im Rucksack und eine eigene Taste (Taste und Controller-Belegung dem Umsetzer überlassen; Controller-Navigation wie in den übrigen Panels mit Zonen und Aktionsmenü am Platz).
- Gehört zur Figur und wird mit ihr gespeichert (wie Rucksack/Ausrüstung), also auch für Gäste in deren eigener Welt.
- Größe: 18 Plätze (meine Wahl, wie eine Truhe). Mehrere Tiere derselben Art erlaubt.
- Je Tier: Art, Name, Stufe, Erfahrung, Leben, Zustand (draußen, im Käfig, erholt sich bis …), aktive Stärkung (bis wann, wie stark).
- Aktionen am Tier: Rauslassen / Zurückholen, Umbenennen, Freilassen (mit Rückfrage; meine Wahl, damit der Käfig nie verstopft).
- Höchstens 3 Tiere je Spieler gleichzeitig draußen (0–3).
- **Wo der Zustand liegt** (meine Wahl): Alles über ein Tier (Name, Stufe, Erfahrung, Leben, Stärkung, „ist draußen“) steht im Käfig der Figur und wird mit ihr gespeichert. Draußen ist nur ein Spiegel als Wesen in der Welt. Der Gastgeber rechnet die Wesen und schickt Änderungen (Leben, Erfahrung, K.o.) an den Besitzer, der sie in seinen Käfig übernimmt. Endet die Verbindung, verlässt ein Gast die Sitzung oder wird das Spiel geschlossen, verschwinden die Wesen; die Tiere sind im Käfig und kommen beim nächsten Spielbeginn bzw. Beitritt wieder heraus, wenn sie vorher draußen waren. So geht nie ein Tier oder Erfahrung verloren.

## Begleiter draußen

- Folgen ihrem Besitzer (Abstand ein paar Blöcke); zu weit weg oder feststeckend → erscheinen wieder neben dem Besitzer.
- Kämpfen selbstständig gegen Gegner in der Nähe des Besitzers (nur Gegner, die den Besitzer bemerkt haben oder ihn angreifen, oder die der Besitzer angreift – Feinheit dem Umsetzer überlassen). Nie gegen Mitspieler, auch nicht im Spaßkampf (PvP).
- Gegner können Haustiere angreifen.
- **K.o.**: Bei 0 Leben verpufft das Tier freundlich (wie Gegner, ohne Grusel) und ist zurück im Käfig; nach 1 Minute ist es wieder fit (meine Wahl). Erfahrung bleibt.
- Fahrzeuge: Steigt der Besitzer ein, gehen seine Tiere vorübergehend in den Käfig und kommen beim Aussteigen wieder heraus (meine Wahl; einfacher als Mitfahren).
- Planetenwechsel und All: Tiere reisen im Käfig mit; nach der Landung kommen die zuvor draußen gewesenen wieder heraus (meine Wahl).
- Bauen: Tiere dürfen nicht stören (nicht in Lava/Wasser laufen, nicht auf Bauplätzen festhängen; Feinheit dem Umsetzer).
- Besiegt werden: Die Tiere kommen mit zum Wiedereinstieg (erscheinen neben dem Besitzer) (meine Wahl).
- Modi (meine Wahl): Im Kreativmodus folgen Tiere ebenfalls und kämpfen, falls Gegner da sind; im Zuschauermodus gehen sie in den Käfig und kommen beim Wechsel zurück heraus.
- Schlafen im Bett: Tiere legen sich dazu oder warten; dürfen das Schlafen nicht verhindern (Gegner-Prüfung zählt sie nicht).

## Streicheln und Füttern

- **Streicheln**: Tier ansehen und Benutzen-Taste (wie Bett/Truhe antippen). Kostenlos. Stärker für **2 Minuten**. Herzchen und zufriedenes Geräusch.
- **Füttern**: wie Streicheln, aber mit **Tierfutter** in der Hand. Verbraucht 1 Tierfutter. Stärker für **5 Minuten** (stärker als Streicheln) und heilt das Tier (meine Wahl).
- **Tierfutter**: ein einfacher neuer Gegenstand/Block an der Werkbank (Rezept dem Umsetzer überlassen, billig, z. B. aus Blättern und Pilzen). Leckerbissen je Art später.
- Stärkung: mehr Schaden und Leben (Werte dem Umsetzer).
- **Zeitbasis** (meine Wahl): Stärkung (2 und 5 min) und K.o.-Pause (1 min) laufen in Spielzeit (die gespeicherte `spielzeit` der Welt bzw. die Uhr des Gastgebers), nicht in Echtzeit; geschlossenes oder pausiertes Spiel hält sie an. Gespeichert wird die Restdauer. Erneutes Streicheln/Füttern verlängert bzw. ersetzt die Stärkung, sie stapelt nicht (meine Wahl).

## Namen und Stufen

- Beim Fangen ein lustiger Vorschlagsname je Art aus einer kleinen Liste (z. B. „Hoppel“, „Flocke“); im Käfig umbenennbar (Texteingabe; am Tablet die Bildschirmtastatur). Name als Schild über dem Tier wie bei Mitspielern.
- Tiere sammeln Erfahrung, wenn sie mitkämpfen und Gegner besiegt werden. Stufe erhöht Leben und Schaden.
- Die Stufe eines Tieres liegt nie über der Stufe des Besitzers (meine Wahl: Erfahrung über der Grenze wird gesammelt, die Stufe folgt, sobald der Besitzer aufsteigt).

## Mehrspieler

- Der Gastgeber rechnet alle Wesen, also auch Wildtiere und die Haustiere aller Spieler (wie Gegner heute); Gäste spiegeln sie.
- Fangversuch, Rauslassen, Zurückholen, Streicheln, Füttern eines Gastes gehen als Wunsch an den Gastgeber (wie Truhen und Bauwünsche); der Käfig selbst gehört zur Figur des Gastes.
- Netzprotokoll wird erhöht (alle Geräte müssen neu laden).
- Namensschild zeigt Tiername; der Besitzer ist am Tier erkennbar (z. B. Farbe des Halsbands, meine Wahl).

## Einschränkungen

- Keine ES-Module, kein Bundler; neue Dateien in die Ladereihenfolge von `index.html` und `tests/index.html`.
- Ältere Safari-Versionen (iOS) müssen laufen; Leistung auf dem iPad beachten (Zahl der Wesen, Zeichenaufrufe).
- Spielstand-Kompatibilität: neues Feld (Käfig) beim Laden mit leerem Standard nachziehen.
- Kindgerecht: kein Blut, kein Tod, freundliches Verpuffen.
- Texte deutsch in `SC.T`; Anleitung (`SC.T.anleitung`, `docs/ANLEITUNG.md`) ergänzen.

## Dem Umsetzer überlassen

- Alle Zahlen (Leben, Schaden, Tempo, Reichweiten, Häufigkeiten, Ringtempo, Obergrenzen), Rezepte von Netz und Tierfutter.
- Modelle und Farben der Tiere, Geräusche.
- Aufteilung in Dateien (Vorschlag: Tierdefinitionen wie `js/gegner.js`, Verhalten bei `js/ki.js`, Käfig-UI eigene Datei).
- Aufteilung in Stufen/Teilaufgaben für den Plan.
