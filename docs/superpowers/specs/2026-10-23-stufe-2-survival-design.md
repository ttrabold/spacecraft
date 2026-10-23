# Stufe 2: Survival – Design

Stand: 2026-10-23. Gesamtbild: `docs/ROADMAP.md`. Vorgänger: `docs/superpowers/specs/2026-10-23-stufe-1-blockwelt-design.md` (live als 0.4.0). Regeln fürs Repo: `AGENTS.md`.

Kennzeichnung wie in Stufe 1: ohne Zusatz = vom Nutzer festgelegt; **[Claude]** = von mir entschieden, jederzeit änderbar; letzter Abschnitt = dem Umsetzenden überlassen.

## 1. Worum es geht

Der Survival-Modus macht aus der Blockwelt ein Abenteuer: In Lagern, Stationen, Herrenhäusern und Dungeons warten Gegner, man kämpft actionreich mit Laserschwert und Blastern, findet Beute in Seltenheitsstufen, steigt Stufen auf und sieht seiner Figur an, wie stark sie geworden ist. Kein Hunger, kein Essen. Kindgerecht.

Eine gute Runde (Nutzer): Ort entdecken → Kämpfe → coole Beute passend zur Stufe, zum Gegner und zur Umgebung.

### Erfolg
Der Sohn stellt eine Welt auf Survival, findet nachts ein Lager, besiegt Banditen, öffnet eine Kiste, zieht einen grünen Helm an, steigt eine Stufe auf, traut sich danach in eine Station und später in einen Dungeon mit Boss. Auf dem iPad mit Touch oder Controller genauso wie am Laptop.

## 2. Ziele, Nicht-Ziele, Anti-Ziele

**Ziele**
- Gegner (humanoid und nicht-humanoid) mit eigenem Verhalten und Waffen passend zum Charakter; Bosse.
- Actionreicher Kampf: sichtbare Laserblitze, Ausweichen, Laserschwert mit Zurückwerfen von Schüssen.
- Stufenaufstieg durch Erfahrung **und** Ausrüstung.
- Beute in fünf Seltenheitsstufen mit Werten, Sonderkräften ab Lila und sichtbarem Aussehen.
- Rucksack und Ausrüstungsfenster; Abbauen mit Zeit, Bauen mit Gesammeltem.
- Einstellbare Schwierigkeit.
- Erweiterbarkeit: neue Gegnerarten und Gegenstände sollen leicht dazukommen (Nutzer: Gegnervielfalt soll in Zukunft steigen).

**Nicht-Ziele in Stufe 2:** Mehrspieler (Stufe 3), Crafting (später, Issue #15), Fahrzeuge, andere Planeten, Handel/Händler, Quests.

**Anti-Ziele**
- Blut, Grusel, düstere Gewalt, Wörter wie „töten“ (es heißt „besiegt“). Gegner zerfallen in Funken.
- Geschützte Namen/Figuren (kein „Jedi“, „Sith“, „Sturmtruppler“ …). Alles selbst erfunden.
- Frust: Ausrüstung oder Rucksack verlieren; unfaire Treffer aus dem Nichts; Gegner direkt neben dem Spieler erscheinen lassen.
- Ruckeln auf dem iPad durch zu viele Gegner oder Geschosse.
- Kaputte Spielstände nach dem Update.

## 3. Rahmenbedingungen

- Alles aus AGENTS.md und dem Stufe-1-Design gilt weiter (keine Module, `file://`, iPadOS 16.7, deutsche Texte in `js/texte.js`, Version nur in `index.html`).
- **Version:** 0.5.0 **[Claude]**.
- **Spielstand-Format 2** (Abschnitt 9) mit Migration von Format 1; alte Welten laden weiter.
- Bestehende Schnittstellen nutzen: `SC.Welt#setzeBlock` (Quelle "spieler"), `Bauwerk.plaetze` (typ "gegner"/"kiste"), `SC.Eingabe#zustand`, `SC.Gamepad`, `SC.Touch`, `SC.Audio`, `SC.Musik`, `SC.Entwickler.Panel`.
- **Mehrspieler-Vorbereitung:** Gegner, Geschosse und Beutekugeln sind Objekte mit ID in einer zentralen Liste der Welt (`SC.Wesen`), die Spiellogik läuft getrennt von der Darstellung, Zufall läuft über einen übergebenen Zufallsgenerator. In Stufe 3 rechnet der Gastgeber, die anderen zeigen nur an.
- **Leistung [Claude]:** höchstens 12 aktive Gegner, 60 Geschosse, 40 Beutekugeln gleichzeitig; KI-Entscheidungen 10-mal pro Sekunde, Bewegung jedes Bild. Ziel weiterhin ≥ 30 FPS auf iPad 9. Gen.

## 4. Spielfigur: Stufe, Lebenspunkte, Schild

- **Stufe** 1 bis 30 **[Claude: Obergrenze in Stufe 2]**. Erfahrung für besiegte Gegner: `10 × Gegnerstufe`, Boss × 5 **[Claude]**. Nötige Erfahrung für die nächste Stufe: `round(100 × stufe^1,5)` **[Claude]**.
- **Lebenspunkte:** `100 + 12 × (stufe − 1)` plus Boni der Ausrüstung **[Claude]**.
- **Schild** (nur mit Schildgenerator): fängt Schaden vor den Lebenspunkten ab, lädt sich 3 s nach dem letzten Treffer mit 20 %/s wieder auf **[Claude]**.
- **Erholung:** 5 s ohne Treffer → Lebenspunkte steigen mit 4 %/s **[Claude]**. Kein Essen.
- **Stufenaufstieg:** kurze Fanfare, Lichtsäule um die Figur, Lebenspunkte voll.
- **Besiegt:** Bildschirm „Besiegt!“ (freundlich, kein Grusel) mit Knopf „Weiter“. Wiedereinstieg am Startpunkt der Welt, volle Lebenspunkte, **Ausrüstung und Rucksack bleiben erhalten** (Nutzer). Gegner in der Nähe vergessen den Spieler.

## 5. Kampf

- **Actionreich** (Nutzer). Blaster feuern sichtbare, leuchtende Laserblitze mit endlicher Geschwindigkeit, denen man ausweichen kann. Treffer: Gegner blinken weiß auf und werden leicht zurückgestoßen; Schadenszahlen steigen über dem Ziel auf.
- **Laserschwert:** Hieb im Bogen vor dem Spieler (Reichweite ~3 Blöcke), kurze Abklingzeit, Kombo aus drei Hieben **[Claude]**. **Blocken** (gehalten): Schüsse, die von vorn kommen, prallen zurück in Richtung des Schützen; Nahkampfschaden halbiert; beim Blocken langsamer gehen.
- **Blasterpistole:** schnell, wenig Schaden. **Blastergewehr:** langsamer, mehr Schaden, größere Reichweite. Unbegrenzte Munition, aber Überhitzung bei Dauerfeuer (kurze Zwangspause) **[Claude]** – sorgt für Rhythmus statt Dauerklicken.
- **Ausweichen:** kurzer Sprint-Sprung in Laufrichtung, 0,3 s unverwundbar, 1,5 s Abklingzeit **[Claude]**.
- **Zielhilfe** auf Touch und Gamepad: Das Fadenkreuz rastet leicht auf Gegner nahe der Bildmitte ein **[Claude]**; mit Maus keine Zielhilfe.
- **Freundliches Feuer:** Gegner treffen sich nicht gegenseitig **[Claude]**; Spieler-Schüsse zerstören keine Blöcke.

## 6. Gegner

Alle Gegner sind selbst erfundene, blockige Figuren in den Planetenfarben, angelehnt an Star Wars, mit eigenem Namen. Jede Gegnerart ist ein Eintrag in einer Tabelle `SC.GEGNER` (Name, Modell, Werte je Stufe, Verhalten, Waffe, Beutetabelle, Orte, Tageszeit), damit neue Arten ohne Umbau dazukommen.

| Art | Typ | Wo | Verhalten |
|---|---|---|---|
| **Patrouillendroide** | humanoid, Blastergewehr | Stationen | in Dreiergruppen, ungenau, hält Abstand 8–14, sucht Deckung (seitlich ausweichen hinter Blöcke) |
| **Weltraumbandit** | humanoid, Blasterpistole | Lager | schnell, springt und weicht seitlich aus, umkreist den Spieler |
| **Krabbler** | Insekt, Nahkampf | Höhlen, Dungeons, nachts an der Oberfläche | rennt heran, springt an, oft 3–5 zusammen, wenig Lebenspunkte |
| **Spucker** | Echse, Giftspucke | Dungeons, nachts an der Oberfläche, Kristallfelder | hält Abstand, spuckt Bogengeschoss (grün, sichtbar, ausweichbar) |
| **Schattenritter** (Boss) | humanoid, rotes Laserschwert | Herrenhäuser (oberstes Geschoss), tiefe Dungeons (Schatzraum) | springt auf den Spieler zu, Hiebkombo, blockt Blasterschüsse von vorn (wirft sie zurück), verwundbar nach seinem Angriff |
| **Panzerkoloss** (Boss) | Biest | Dungeons (Schatzraum, falls kein Ritter) | stampft (Druckwelle am Boden, Sprung weicht aus), stürmt geradeaus; von vorn ×0,3 Schaden, von hinten ×3 |

- **Bosse:** Die Bauwerksvorlagen bekommen einen neuen Platztyp `boss`: im Herrenhaus ein Platz im Obergeschoss, im Dungeon der Schatzraum (Schattenritter oder Panzerkoloss, per Zufall des Bauwerks). Stationen und Lager haben keinen Boss **[Claude]**.
- **Gegnerstufe = Ortsstufe** (± 1), Bosse +2. **Ortsstufen [Claude]:** Lager 1–5, Station 5–12, Herrenhaus 10–20, Dungeon 15–25 (tiefer im Dungeon höher). Nachts an der Oberfläche: Spielerstufe −1 bis +1, mindestens 1, höchstens 12.
- **Auftauchen:** An den `gegner`-Plätzen eines Bauwerks, sobald der Spieler näher als 40 Blöcke kommt und der Platz nicht „geräumt“ ist. Besiegte Plätze sind geräumt; nach 15 Minuten Spielzeit füllt sich ein Bauwerk wieder **[Claude]**. Nachts an der Oberfläche erscheinen Krabbler/Spucker 24–48 Blöcke entfernt an dunklen Stellen außer Sicht, höchstens 6 gleichzeitig (leicht 3, schwer 9) **[Claude]**. Morgens verschwinden Oberflächengegner in Funken.
- **Verschwinden:** Gegner weiter als 80 Blöcke werden entfernt (Bauwerksgegner zählen dann nicht als geräumt).
- **Wahrnehmung und Bewegung [Claude]:** Sicht 24 Blöcke mit Sichtlinie (Strahl durch Blöcke), Hörweite 8; Bewegung zielgerichtet auf dem Blockgitter mit Springen über 1-Block-Stufen, keine Stürze über 3 Blöcke; keine vollständige Wegsuche in Stufe 2. Bauwerksgegner bleiben in der Nähe ihres Bauwerks (Leine 30 Blöcke).
- **Kreativmodus:** Gegner ignorieren den Spieler. **Zuschauermodus:** Gegner ignorieren den Spieler, keine Nachtgegner.

## 7. Schwierigkeit

Pro Welt einstellbar (Neue Welt und Pausemenü, jederzeit änderbar) (Nutzer: einstellbar):

| Stufe | Gegner | Schaden durch Gegner | Treffgenauigkeit | Beute |
|---|---|---|---|---|
| Friedlich | keine | – | – | Kisten wie Normal |
| Leicht | weniger (Nacht max. 3) | × 0,5 | gering | normal |
| Normal | wie beschrieben | × 1 | mittel | normal |
| Schwer | mehr (Nacht max. 9, Gruppen +1) | × 1,5 | hoch | Seltenheit eine Stufe wahrscheinlicher |

Standard für neue Welten: Leicht **[Claude]**.

## 8. Beute und Ausrüstung

- **Plätze:** Waffe (in der Schnellleiste), Helm, Brustpanzer, Handschuhe, Stiefel, Schildgenerator.
- **Waffenarten:** Laserschwert, Blasterpistole, Blastergewehr. Erweiterbar über eine Tabelle `SC.GEGENSTAENDE`.
- **Seltenheit:** grau (gewöhnlich), grün (ungewöhnlich), blau (selten), lila (episch), orange (legendär). **Wahrscheinlichkeit [Claude]:** 55 / 28 / 12 / 4 / 1 %; Schwer verschiebt eine Stufe nach oben; Bosse garantieren mindestens Blau; Kisten mindestens Grün.
- **Gegenstandsstufe** = Stufe des Gegners bzw. des Ortes. **Werte** wachsen mit Stufe und Seltenheit; je Art feste Hauptwerte (Waffe: Schaden, Schussrate; Rüstung: Schutz; Schildgenerator: Schildstärke) plus 0–3 Zusatzwerte (Lebenspunkte, Tempo, Schaden %, Erholung) nach Seltenheit **[Claude]**. Schutz verringert Schaden: `schaden × 100 / (100 + schutz)` **[Claude]**.
- **Sonderkräfte ab Lila [Claude]**, je Gegenstand höchstens eine: Doppelsprung (Stiefel), Abprall (Schüsse durchschlagen nicht, sondern prallen von Wänden ab, Blaster), Leuchten (Rüstung leuchtet nachts wie ein Leuchtblock), Funkenhieb (Laserschwert-Kombo schleudert eine Welle), Schnellladen (Schild). Legendäre haben einen eigenen Namen aus einer Liste selbst erfundener Namen.
- **Aussehen:** Rüstungsteile erscheinen an der Figur in der Seltenheitsfarbe (Ansicht von außen); Laserschwertklinge in der Seltenheitsfarbe (grau = weiß-blau); gehaltene Waffe in der Ich-Ansicht sichtbar.
- **Namen:** zusammengesetzt aus Seltenheit und Art („Blaues Blastergewehr“), legendär mit Eigennamen.
- **Herkunft:** Gegner lassen Gegenstände fallen (Chance je Art, Bosse immer); **Schatzkisten** an den `kiste`-Plätzen der Bauwerke. Neue Blöcke `KISTE` (27) und `KISTE_OFFEN` (28); der Generator setzt `KISTE` an jeden `kiste`-Platz (Generator-Version 2; unberührte Gegenden dürfen sich dadurch ändern, wie in Stufe 1 abgestimmt). Öffnen (rechte Taste/LT/■ auf die Kiste): 2–4 Gegenstände springen als Beutekugeln heraus, der Block wird `KISTE_OFFEN`, die Kiste wird in `kisten` vermerkt. Jede Kiste nur einmal **[Claude]**.
- **Aufsammeln:** Fallengelassene Gegenstände schweben als leuchtende Kugel in Seltenheitsfarbe, werden beim Darüberlaufen eingesammelt (Rucksack voll → bleiben liegen, Hinweis), verschwinden nach 5 Minuten **[Claude]**.
- **Vergleichen:** Beim Ansehen eines Gegenstands werden die Werte mit dem angelegten verglichen (grüne/rote Pfeile) **[Claude]** – für Kinder wichtig, um „besser“ zu erkennen.

## 9. Rucksack, Abbauen, Bauen im Survival

- **Rucksack [Claude]:** 36 Plätze, davon die ersten 9 die Schnellleiste (wie Minecraft). Blöcke stapeln bis 64, Gegenstände einzeln.
- **Fenster** (E im Survival, Knopf auf Touch, X am Gamepad): Rucksack-Raster, Ausrüstungsplätze mit Figur, Werte-Übersicht (Stufe, Lebenspunkte, Schutz, Schaden). Bedienung durch Antippen: Gegenstand antippen → Werte und Vergleich → „Anlegen“ / „In die Schnellleiste“ / „Wegwerfen“. Kein Ziehen nötig, damit es mit Touch und Gamepad gleich gut geht.
- **Abbauen** dauert je nach Härte **[Claude]:** Erde/Sand/Blätter 0,4 s, Holz 0,9 s, Stein/Ziegel 1,4 s, Metall/Beton 2 s, Glas 0,3 s; Laserschwert in der Hand halbiert die Zeit. Sichtbarer Fortschritt (Risse am Block). Im Kreativmodus bleibt Abbauen sofort. Unzerstörbar sind Grundgestein und Kisten (Kisten werden geöffnet, nicht abgebaut) **[Claude]**.
- **Was man bekommt:** den Block selbst; Gras → Erde, Glas → nichts (zerbricht), Blätter → Blätter **[Claude]**.
- **Bauen** nur mit Blöcken aus dem Rucksack.

## 10. Steuerung

Die gewählte Sache in der Schnellleiste bestimmt die Aktion:

| Aktion | Tastatur/Maus | Touch | Gamepad |
|---|---|---|---|
| Angreifen / Schießen (Waffe) bzw. Abbauen (Block, gehalten) | linke Maustaste | Knopf ⛏ wird ⚔ | RT |
| Setzen (Block) bzw. Blocken (Laserschwert, gehalten) / Kiste öffnen | rechte Maustaste | Knopf ■ wird 🛡 | LT |
| Ausweichen | Q | neuer Knopf ⇆ | B (wenn nicht fliegend) |
| Rucksack/Ausrüstung | E | ▦ | X |

Alles andere bleibt wie in Stufe 1 (inkl. Gamepad-Belegung).

## 11. Anzeige, Klang, Musik

- **HUD:** Lebensbalken (rot) und Schildbalken (blau) über der Schnellleiste, links Stufe mit Erfahrungsbalken, bei Überhitzung ein Hitzebalken an der Waffe. Über Gegnern Name, Stufe und Lebensbalken, sobald sie den Spieler bemerkt haben. Treffer an dir: kurzer roter Rand und Richtungspfeil, aus welcher Richtung der Schuss kam.
- **Geräusche** (synthetisiert wie in 0.4.0): Blasterschuss je Waffe, Laserschwert Summen/Hieb/Blocken/Abprall, Treffer, Gegner zerfällt, Aufsammeln (Tonhöhe nach Seltenheit), Kiste öffnen, Stufenaufstieg-Fanfare, Besiegt (sanft), Geräusche je Gegnerart (Droiden piepen, Krabbler klackern, Spucker zischen).
- **Musik:** `SC.Musik.stimmung` bekommt zusätzlich `kampf`/`boss` als Eingabe; neue Stimmung **„kampf“**, sobald ein Gegner den Spieler bemerkt hat: schneller, treibende Pauken und Blech; nach 8 s ohne Kampf zurück zur vorigen Stimmung **[Claude]**. Bosskampf: eigene, dramatischere Variante **[Claude]**.

## 12. Spielstand-Format 2

Neue Felder (alle mit Standardwerten bei der Migration von Format 1):
- `schwierigkeit`: "friedlich"|"leicht"|"normal"|"schwer" (Standard bei Migration: "leicht").
- `spieler.stufe` (1), `spieler.erfahrung` (0), `spieler.lebenspunkte` (null = voll), `spieler.schild` (null = voll), `spieler.rucksack` (36 Plätze: `null` | `{block: id, anzahl}` | `{gegenstand}`), `spieler.ausruestung` (`{helm, brust, handschuhe, stiefel, schild}` je `null` oder Gegenstand), `spieler.schnellleisteKreativ` (die bisherige Schnellleiste, damit der Kreativmodus seine Auswahl behält).
- `startpunkt`: `[x, y, z]` (bei Migration = bisheriger Startpunkt bzw. beim ersten Laden berechnet).
- `planeten.<id>.kisten`: `{ "x,y,z": true }` geöffnete Kisten; `planeten.<id>.geraeumt`: `{ "<typ>@<x>,<z>": spielzeitBeimRaeumen }` (Bauwerk geräumt, wenn alle seine Gegner besiegt sind); `spielzeit` in Sekunden.
- `Gegenstand = { id, art, stufe, seltenheit (0–4), werte: {…}, sonder: null|"doppelsprung"|…, name }`.
- Gegner, Geschosse und Beutekugeln werden **nicht** gespeichert (Ausnahme: fallengelassene Gegenstände gehen beim Speichern verloren – akzeptiert **[Claude]**).
- Moduswechsel Kreativ ↔ Survival: getrennte Leisten; Survival-Rucksack wird nie durch Kreativ-Blöcke gefüllt **[Claude]**.
- Bestehende Welten auf Survival umstellen: Stufe 1, leerer Rucksack, Gebautes bleibt (abgestimmt).

## 13. Kreativmodus und Entwicklerwerkzeuge

- Blockauswahl bekommt einen zweiten Reiter „Ausrüstung“: alle Gegenstandsarten in wählbarer Seltenheit und Stufe zum Mitnehmen (nur Kreativ).
- Entwicklerwerkzeuge: Gegner erscheinen lassen (Art, Stufe, vor dem Spieler), Spielerstufe setzen, Gegenstand erzeugen (Art, Seltenheit, Stufe), Unverwundbar, alle Gegner entfernen, Bauwerke zurücksetzen (geräumt/Kisten), Anzeige: Zahl der Gegner/Geschosse.

## 14. Prüfen

- **Tests auf `tests/index.html` [Claude: mindestens]:** Erfahrungskurve und Lebenspunkte je Stufe; Schadensrechnung (Schutz, Schild, Schwierigkeit, Rückseite des Kolosses); Beuteerzeugung (Verteilung der Seltenheit über viele Würfe mit festem Seed, Bosse ≥ Blau, Werte steigen mit Stufe); Rucksack (Stapeln bis 64, voll, Leisten-Plätze); Abbauzeit je Block und mit Laserschwert; Gegner-Auftauchen nur an Plätzen, nicht geräumt, Abstand, Obergrenzen, Friedlich = keine; Sichtlinie durch Blöcke; Geschoss trifft Block/Gegner/Spieler; Blocken wirft Schüsse zurück; Spielstand Format 1 → 2 und Rundlauf mit Ausrüstung; Besiegt behält Rucksack und Ausrüstung.
- **Spieltest per DevTools:** Lager, Station, Herrenhaus mit Boss, Dungeon mit Boss jeweils durchspielen (mit Teleport); Touch- und Gamepad-Kampf; FPS mit 12 Gegnern und vielen Schüssen bei CPU × 4 ≥ 30.
- Danach Test-Vorschau, Abnahme durch den Nutzer, live.

## 15. Dem Umsetzenden überlassen

- Dateiaufteilung (Vorschlag: `wesen.js`, `gegner.js`, `ki.js`, `kampf.js`, `beute.js`, `rucksack.js`, `ui-rucksack.js`) und Ladereihenfolge
- Genaue Zahlenwerte für Schaden, Lebenspunkte, Tempo je Gegnerart und Stufe, solange Lager für Stufe 1 machbar und Dungeons ab ~15 fordernd sind
- Modelle der Gegner (Blockfiguren) und ihre Animationen, Partikel
- KI-Feinheiten (Deckung, Umkreisen), solange ohne volle Wegsuche
- Aussehen von HUD und Rucksackfenster im Stil der bestehenden Menüs
- Liste der legendären Eigennamen (selbst erfunden, kindgerecht)
