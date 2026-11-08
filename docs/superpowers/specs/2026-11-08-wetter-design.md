# Wetter – Design

Stand: 2026-11-08, mit dem Nutzer abgestimmt (Issue #170 „Wetter“, Teil 2 von 2). Baut auf „Wasser und Lava fließen“ auf (Spec `2026-11-08-fliessen-design.md`, Branch `fliessen`, Version 0.26.0).

## Warum

Die Kinder wünschen sich Wetter (#170): „Wenn es regnet oder stürmt, senkt sich der Boden ab und da drin sammelt sich Wasser.“ Wetter soll Stimmung bringen **und das Spiel verändern** (abgestimmt): Es soll sich lohnen, einen Unterschlupf zu bauen, und mutiges Rausgehen soll belohnt werden. Weil Wasser seit Teil 1 fließt, muss der Regen nur Wasser in Mulden bringen.

## Ziele

- Wetter je Planet: **Heimat** Regen und Gewitter, **Glutfrost** Schneefall und Schneesturm, **Rankenmoor** Nebel, Tropenregen und Wolkenbruch.
- Man sieht, hört und spürt es: Tropfen bzw. Flocken, grauer Himmel, kürzere Sicht, Blitze, Regen-, Wind- und Donnergeräusche.
- **Pfützen** in Mulden bei Regen, bei Unwetter sinkt dort der Boden ein; **eine Weile nach dem Regen trocknet alles aus** und der Boden füllt sich wieder auf, die Stelle sieht aus wie vorher (abgestimmt).
- **Schneedecke** auf Glutfrost, die eine Weile nach dem Schneefall wieder **taut** (abgestimmt).
- Wetter **verändert das Spiel** (abgestimmt, siehe „Auswirkungen“).

## Nicht-Ziele

- Keine neuen Gegnerarten, keine stärkeren Gegner.
- Kein Feuer durch Blitze (kommt mit #167 Feuer).
- Keine Jahreszeiten, keine Temperatur, keine Kälte-Schäden.
- Kein Wetter im All.

## Anti-Ziele

- Es regnet ständig oder die Welt säuft ab – Wetter nervt statt Spaß zu machen.
- Blitze, Wind oder Wasser schaden Kindern, Tieren oder zerstören Gebautes dauerhaft.
- Pfützen oder Schnee bleiben dauerhaft und verändern die Landschaft.
- Das alte iPad ruckelt bei Regen.
- Alte Spielstände laden nicht mehr.

## Ablauf (abgestimmt)

- Ein Spieltag dauert 20 Minuten. **Höchstens eine Wetterphase pro Spieltag**, 3–5 Minuten lang, danach mindestens ein halber Spieltag klar.
- **Jede dritte Phase ungefähr** wird zum Unwetter (Gewitter, Schneesturm, Wolkenbruch). Es beginnt als normales Wetter und steigert sich.
- **Häufigkeit je Planet:** Rankenmoor am häufigsten, Glutfrost oft, Heimat am seltensten.
- **Ankündigung:** ein paar Sekunden vorher ziehen Wolken auf, der Wind wird lauter, Hinweis wie „Ein Gewitter zieht auf!“.
- Alle Zahlen (Häufigkeit, Dauer, Stärke, Auswirkungen) stehen in **einer Tabelle**, leicht änderbar nach dem Spieltest.
- Das Wetter ist im Spielstand des Planeten gespeichert (laufende Phase, Restdauer, Zeit bis zur nächsten), neue Felder mit Standardwert „klar“.

## Was man sieht und hört

- Niederschlag als Teilchen nur in der Nähe der Kamera (Tropfen bzw. Flocken), **nicht unter einem Dach** (Spalte über der Stelle nicht frei).
- Himmel und Nebel werden grauer bzw. weißer, Sichtweite kürzer (Nebel, Schneesturm stark).
- Blitz: kurzer heller Schein über die ganze Welt, ein Strahl zur Einschlagstelle, Donner verzögert nach Entfernung.
- Geräusche im Code erzeugt wie Musik und Klänge (Rauschen für Regen, Heulen für Wind, Grollen für Donner). Unter einem Dach leiser.
- Einstellung **„Wetter-Effekte: an / weniger“** (weniger = weniger Teilchen, keine Blitz-Helligkeit) für ältere iPads.

## Pfützen und einsinkender Boden

- Während Regen sucht das Spiel in der Nähe der Spieler nach **Mulden**: Gras-, Erde- oder Sandboden unter freiem Himmel, dessen waagerechte Nachbarn auf gleicher Höhe überwiegend fest sind (Annahme: mindestens 3 von 4). Dort setzt es **Regenwasser** (eine Wasserquelle), das Fließen verteilt es.
- **Nur natürlicher Boden (Entscheidung des Agenten):** Eine Mulde zählt nur, wenn ihr Boden noch genau auf der Höhe liegt, die der Generator dort erzeugt (`generator.hoehe`), und der Block der dort erzeugte Oberflächenblock ist. Von Spielern gegrabene Löcher oder gebaute Becken liegen tiefer bzw. bestehen aus anderen Blöcken und bleiben unberührt. Grund: `geaenderte` merkt sich ganze Chunks, nicht einzelne Blöcke.
- **Bei Unwetter** sinkt der Boden unter einer Pfütze um einen Block ein (höchstens zwei), die Pfütze wird tiefer.
- **Geschützt:** Gebautes und Gegrabenes (siehe „Nur natürlicher Boden“), Blöcke, die nicht Gras/Erde/Sand sind, Stein, Erze, und ein Umkreis von einigen Blöcken um Betten, Werkbänke, Truhen, den Start- und Landepunkt.
- **Austrocknen:** eine Weile nach dem Regen (Vorschlag: 1–2 Spielminuten Verzögerung, dann Stelle für Stelle) verschwinden die Regenwasser-Quellen, das Wasser läuft ab, abgesunkener Boden wird wieder Erde mit Gras/Sand obenauf wie vorher.
- Das Spiel merkt sich jede Änderung des Wetters (Ort, alter Block) in einer Liste im Planeten-Spielstand, damit das Zurücksetzen auch nach Speichern und Laden genau stimmt. Setzt ein Spieler an so einer Stelle selbst etwas, gehört die Stelle ihm: sie wird nicht mehr zurückgesetzt.
- **Quellen, die das Fließen aus Regenwasser neu bildet** (zwischen zwei Quellen), trocknen mit aus (Entscheidung des Agenten, folgt aus „sieht danach aus wie vorher“): Das Wetter merkt sie sich wie sein eigenes Regenwasser.
- Wasser aus Eimern ist kein Regenwasser und trocknet nie.

## Schneedecke (Glutfrost)

- Neuer flacher Block **Schneeschicht** (etwa 1/8 hoch), durchgehbar, bremst nicht, mit einem Schlag weg, ergibt nichts. Setzt man einen Block darauf, ersetzt er sie.
- Bei Schneefall bekommen Stellen unter freiem Himmel auf festen Blöcken (Boden, Dächer, Baumkronen) nach und nach eine Schicht, im Schneesturm schneller. **Höchstens eine Schicht.**
- **Tauen:** eine Weile nach dem Schneefall Stelle für Stelle; neben Lava sofort. Gleiche Liste wie bei den Pfützen.

## Auswirkungen auf das Spiel (abgestimmt)

- **Gewitter (Heimat):** dunkel wie Dämmerung; **auch tagsüber Nachtgegner, etwa halb so viele wie nachts**; nachts im Gewitter etwas mehr als sonst. Blitze schlagen in **hohe Stellen** ein (Bäume, Türme), **nie in Spieler oder Tiere** und nicht in ihre Nähe; ein Einschlag lässt **manchmal einen weißen Kristall** als Beutekugel liegen (der vorhandene Block `KRISTALL_WEISS`, ID 43 – ein Crafting-Material für weiße Klingen und Strahlen, Entscheidung des Agenten). Blitze zerstören nichts.
- **Schneesturm (Glutfrost):** Sicht sehr kurz; **Wind** bremst gegen die Windrichtung und schiebt mit ihr (leicht, man kommt immer voran); **Frostgegner** (Frostkrabbler, Frostgolem, Schneewerfer, Eisrutscher) tauchen häufiger auf.
- **Nebel (Rankenmoor):** Sicht kurz; **Moorirrlichter** häufiger, sie leuchten im Nebel. **Wolkenbruch:** viele Pfützen.
- **Regen überall:** Wildtiere seltener, **Frösche** (Frosch, Laubfrosch) häufiger.
- **Unter einem Dach** gilt nichts davon: kein Wind, keine kürzere Sicht durch Niederschlag. Unterschlupf bauen lohnt sich.
- Gegner bleiben dieselben Arten mit denselben Werten; gilt nur in Survival mit Gegnern (nicht „friedlich“, nicht Kreativ).

## Mehrspieler

- Der **Gastgeber** bestimmt das Wetter und schickt es mit (wie die Tageszeit), Gäste zeigen es. Pfützen, einsinkender Boden, Schnee und Austrocknen rechnet der Gastgeber; die Blöcke gehen gebündelt wie beim Fließen. Blitze (Ort, Zeitpunkt) gehen als Ereignis an alle. Neue Nachrichten → Netzprotokoll 10.

## Entwicklerwerkzeuge

- Wetter sofort setzen (klar, normal, Unwetter je Planet), Wetter-Zeit vorspulen (Austrocknen/Tauen sofort).

## Dem Builder überlassen

- Teilchen-Technik (z. B. eine Punktwolke oder Instanzen um die Kamera), Blitz-Darstellung, Klangsynthese.
- Genaue Mulden-Erkennung und Suchradius, Takt und Grenze pro Takt (wie beim Fließen), Datenformat der Änderungsliste.
- Werte der Tabelle als erste Vorschläge.
- Wie „hohe Stelle“ für Blitze bestimmt wird.
