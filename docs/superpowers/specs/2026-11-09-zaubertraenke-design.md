# Zaubertränke – Design

Stand: Entwurf, 2026-11-09. Issue #146. Gilt für Version 0.30.0 als Ausgangspunkt (Netzprotokoll 10, Generator-Version 3).

**Kennzeichnung:** *(Nutzer)* = im Gespräch mit dem Nutzer entschieden. *(Vorschlag)* = mein Vorschlag, noch nicht bestätigt; der Nutzer prüft ihn beim Lesen. *(Bauer)* = Entscheidung für die Umsetzung, ohne dass sich das Ergebnis für den Nutzer ändert.

## Worum es geht

Die Kinder (Vater, neunjähriger Sohn und dessen Freund) sollen Zaubertränke brauen, trinken und sich dabei **sichtbar verwandeln**. Dazu bekommen sie für kurze Zeit einen Vorteil (Buff). Der Reiz ist Entdecken und Sammeln, dazu etwas Chaos und Spaß, ohne Strafe.

- **Ziel:** ein lustiges, sichtbares Erlebnis („Ich habe Hasenohren und leuchte rot!“), das beim Spielen zu zweit auffällt und zum Weitersammeln anregt.
- **Kein Ziel (Nicht-Ziele):** negative oder schädliche Tränke, Größenänderung der Figur, Rezept-Freischaltung durch Fortschritt, Handel, Brauzeit, mehrere gleichzeitige Tränke.
- **Das wäre ein Fehlschlag (Anti-Ziele):** gruseliges oder düsteres Aussehen, Strafen oder Verlust durch einen Trank, ein Rezeptbuch, das die Kinder überfordert, Bruch bestehender Spielstände oder Welten.

## Spielablauf

1. **Kessel bauen** *(Nutzer: Kessel/Braustelle)*: Ein neuer Bauteil-Block „Kessel“ wird an der Werkbank hergestellt (Kosten *(Bauer)*, im Stil der anderen Bauteile in `js/crafting.js`).
2. **Zutaten sammeln** *(Nutzer)*: **Flasche**, **Kristall**, **Pflanze**.
   - Flasche: wird an der Werkbank aus Glas hergestellt (aus 1 Glas mehrere Flaschen, Menge *(Bauer)*).
   - Kristall: die sechs vorhandenen Kristallfarben (Blau, Grün, Rot, Gelb, Violett, Weiß).
   - Pflanze: neue Zutat, siehe „Pflanzen“.
3. **Brauen am Kessel** *(Nutzer)*: Am Kessel wählt man Kristall und Pflanze; eine Vorschau zeigt Wirkung und Aussehen; „Brauen“ verbraucht 1 Flasche, 1 Kristall, 1 Pflanze und legt den Trank in den Rucksack. Es gibt keine Brauzeit.
4. **Rezeptbuch** *(Nutzer)*: Es zeigt **von Anfang an alles** (nichts muss freigeschaltet werden). Es hat zwei Listen: je Kristallfarbe die Wirkung, je Pflanze das Aussehen und wo man sie findet *(Vorschlag für den Aufbau)*. Erreichbar über Knopf im Rucksack und am Kessel.
5. **Trinken** *(Vorschlag)*: Der Trank steht im Rucksack bzw. in der Schnellleiste und wird mit der Benutzen-Taste getrunken (wie der Eimer oder die Tür). Ab dann läuft die Wirkung.
6. **Dauer** *(Vorschlag)*: etwa 3 Minuten Spielzeit. Trinkt man einen neuen Trank, **ersetzt** er den laufenden (kein Stapeln).

## Wirkung und Aussehen

Jeder Trank hat zwei Bestandteile: die **Wirkung** kommt vom Kristall, das **Aussehen** von Kristall (Leuchten) und Pflanze (Tier-Teile).

**Verwandlung** *(Nutzer: Tier-Teile und Leuchten, keine Größenänderung; nach dem Probespiel verstärkt zu „Kostüm + Bewegung“)*:
- **Kostüm (von der Pflanze):** Die ganze Figur wird das Tier: Körper, Kopf, Arme und Beine in Tierfarben, dazu Bauchfleck, Pfoten und Füße, Schnauze, Ohren, Schwanz, Flügel oder Muster je Tier (Hase, Katze, Fuchs, Eisbär, Pinguin, Salamander, Papagei, Frosch, Affe). Die Spielerfarbe ist während des Tranks überdeckt; Mitspieler erkennt man am Namensschild. Beim Ende des Tranks kommen die Farben zurück.
- **Bewegung:** Ohren wackeln, Schwänze wedeln, Flügel schlagen, Flammen und die Kehle des Frosches flackern.
- **Leuchten (vom Kristall):** Die Figur hat einen Schein in der Farbe des Kristalls und wenige kreisende Funken. Daran erkennt man auch bei Mitspielern den laufenden Buff.

**Wirkung je Kristallfarbe** *(Vorschlag; Zahlen stehen in einer Tabelle, damit sie sich leicht einstellen lassen)*:

| Kristall | Wirkung | Vorschlag Stärke |
|---|---|---|
| Gelb | Tempo | Laufen ×1,3 (über `tempoFaktor`) |
| Grün | Sprung | Sprungkraft ×1,4 |
| Rot | Schaden | +25 % Schaden |
| Blau | Schild | zusätzlicher Schutz, Größe *(Bauer)* |
| Violett | Schweben | fällt langsam, Fallschaden entfällt |
| Weiß | Nachtsicht | die Figur trägt ein Licht, in der Nacht und unter Tage heller *(Bauer: mit der vorhandenen Punktlicht-Technik)* |

**Kreativmodus** *(Nutzer: Tränke gibt es auch im Kreativmodus)*: Die Blockauswahl bekommt einen Reiter „Tränke“ (wie der Reiter „Tiere“) mit allen Kombinationen aus Kristall und Pflanze, unbegrenzt und ohne Zutaten. Kessel, Flasche und die Pflanzen stehen in der Blockauswahl. Getrunken wird wie im Survival, Dauer und Ersetzen sind gleich *(Vorschlag)*. Aussehen, Leuchten, Tempo, Sprung und Nachtsicht wirken; Schaden und Schild haben ohne Kampf keine Folge, Schweben nur, wenn die Figur nicht ohnehin fliegt *(Bauer)*.

Im Fahrzeug und im All gelten Tempo, Sprung und Schweben nicht, das Aussehen bleibt *(Bauer, Vorschlag)*. Wer besiegt wird, verliert den Trank *(Vorschlag)*.

## Pflanzen

Neun neue Zutaten, drei je Planet *(Vorschlag; Namen und Zuordnung sind Platzhalter)*:

| Planet | Pflanze | Tier-Teil |
|---|---|---|
| Heimat | Hasenklee | Hasenohren und Puschelschwanz |
| Heimat | Katzenminze | Katzenöhrchen und Schwanz |
| Heimat | Fuchsgras | Fuchsohren und buschiger Schwanz |
| Glutfrost | Eisblume | Eisbärohren |
| Glutfrost | Frostbeere | kleine Pinguinflügel |
| Glutfrost | Glutmohn | Salamanderschwanz mit Glut |
| Rankenmoor | Federfarn | Papageienfedern |
| Rankenmoor | Quakblume | Froschaugen |
| Rankenmoor | Dschungelranke | Affenschwanz |

Es gibt **zwei Quellen** *(Nutzer: Beute und Wachsen)*:
- **Beute von Gegnern:** Besiegte Gegner lassen Pflanzen ihres Planeten fallen, mit niedriger Chance. Das gilt **in allen Welten, auch in alten**. Wildtiere lassen nichts fallen, weil sie gefangen und nicht besiegt werden *(Vorschlag)*.
- **Wachsen in der Welt:** Die Pflanzen stehen als neue pflückbare Blöcke in der Landschaft. Das gibt es **nur in neuen Welten** (Generator-Version 4), wie bei den Erzen; Welten mit Version 3 und älter bleiben unverändert. **Gepflückte Pflanzen wachsen nach** *(Nutzer)*: nach einer Wartezeit steht an derselben Stelle wieder eine Pflanze der gleichen Art. Die Wartezeit ist ein Vorschlag von etwa 10 Minuten Spielzeit *(Vorschlag)*. Nachgewachsen wird nur dort, wo Chunks geladen sind, wie beim Fließen und Wetter. Wie die Wartezeit gespeichert wird, ohne alte Spielstände zu brechen, entscheidet der Bauer.

Wachstumsdichte, Wachstumszeit und Beutechance sollen so gewählt sein, dass ein Trank nach einigen Minuten Spielzeit möglich ist, ohne dass Pflanzen im Überfluss herumstehen *(Bauer)*.

## Mehrspieler und Speichern

- **Aussehen im Netz** *(Nutzer: Mitspieler sehen es)*: Die Meldung der Figur bekommt ein Feld mit Kristallfarbe und Pflanze des laufenden Tranks (oder leer). Das ändert das Netzprotokoll (10 → 11), alle Geräte müssen neu laden. Die Wirkung (Tempo, Sprung, Schaden, Schild) rechnet jedes Gerät für die eigene Figur selbst.
- **Speichern** *(Vorschlag)*: Der laufende Trank wird mit Restzeit in der Figur gespeichert (neues Feld in `SC.Spielstand.FIGUR_FELDER`). Fehlt das Feld, z. B. in alten Spielständen, gilt „kein Trank“. Die Zeit läuft nur während des Spielens (Spielzeit). Das gilt auch für Gäste, deren Figur in ihrer eigenen Welt gespeichert wird.
- **Tränke im Rucksack:** Ein Trank ist durch Kristallfarbe und Pflanze bestimmt (54 Kombinationen), gleiche Tränke stapeln sich. Wie der Platz im Rucksack das abbildet, ohne 54 Block-IDs zu vergeben, entscheidet der Bauer. Bestehende Rucksäcke dürfen nicht brechen.

## Randbedingungen

- Läuft ohne Build-Schritt, ohne neue Bibliotheken, auch per `file://` und auf älteren iPads. Die Verwandlung nutzt wenige zusätzliche Meshes an der Figur und leuchtende Materialien statt eines Echtzeitlichts je Figur (Ausnahme: Nachtsicht der eigenen Figur).
- Texte, Kommentare und Doku sind Deutsch.
- Geräusche für Brauen und Trinken werden im Code erzeugt wie die übrigen (`SC.Klang`), keine Audiodateien *(Bauer)*.
- Der Kessel und die Tränke erscheinen in der Spielanleitung (`SC.T.anleitung`, `docs/ANLEITUNG.md`).
- Tests nach den Konventionen des Projekts (`tests/`), die Testseite muss ohne ❌ durchlaufen. Tests für: Rezeptwerte, Brauen verbraucht richtig, Trank wirkt und läuft ab, Speichern und Laden mit und ohne Feld, Ersetzen eines laufenden Tranks, Netzfeld.

## Was dem Bauer überlassen bleibt

Kosten von Kessel und Flasche, genaue Zahlen der Wirkungen, Speicherung der Wachstumszeit, wie der Trank im Rucksack abgebildet wird, Aussehen der Tier-Teile im Einzelnen, Wachstumsdichte und Beutechance, Nachwachsen, Gestaltung von Kessel- und Rezeptbuch-Fenster (Maus, Touch und Controller müssen alle funktionieren, nach dem Muster von Werkbank und Rucksack), Geräusche.

## Offene Fragen an den Nutzer

Keine, die den Bau blockieren. Zu prüfen beim Lesen: die Zuordnung Kristall → Wirkung, die Pflanzennamen, die Dauer von 3 Minuten, die Wachstumszeit von 10 Minuten.
