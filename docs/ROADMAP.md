# Roadmap

Einstiegspunkt für jede Session. Ablauf siehe AGENTS.md, Abschnitt „Projektmanagement“.

## Vision

Minecraft-artiges Browser-Spiel: Blöcke abbauen und bauen, Erkundung, Kampf, Spannung, Spaß und ein wenig Chaos. Später Fahr- und Flugzeuge selbst bauen und mit Raumschiffen nahtlos vom Planeten starten und neue Planeten erkunden (wie No Man's Sky). Futuristische Waffen (Laserschwert, Laserwaffen).

- **Spieler:** Vater, sein neunjähriger Sohn und dessen gleichaltriger Freund. **Kindgerecht** bleibt immer Pflicht.
- **Zusammen spielen:** gleichzeitig in derselben Welt, jeder am eigenen Gerät. Geräte gemischt (Laptop/PC und Tablet) → Tastatur/Maus und Touch.
- **Modi:** Kreativ, Survival (ohne Hunger/Essen), Zuschauer.
- **Kindgerecht im Survival (abgestimmt):** Besiegt werden ohne Blut/Grusel, Wiedereinstieg am Startpunkt/Raumschiff, Ausrüstung bleibt erhalten (höchstens Rohstoffe gehen verloren). Gegner lustig-bedrohlich statt düster, getroffene Gegner verpuffen. Blockbau ist Mittel zum Zweck (Unterschlupf, Fahrzeuge, Raumschiffe).
- **Musik (abgestimmt):** abenteuerlich-orchestral im Stil von Star Wars, aber selbst komponiert (generativ im Code, keine Audiodateien, keine fremden Melodien). Tag heldenhaft/Dur, Nacht geheimnisvoll/Moll, unter Tage tief und spannend; Pausen zwischen Stücken.
- **Look (abgestimmt, Mischung aus Entwurf A und C):** Pixel-Texturen wie Minecraft, dazu gezieltes Leuchten (Kristalle, Technikblöcke, Laserwaffen, Gegneraugen). Jeder Planet hat eine eigene Farbpalette (Startplanet vertraut grün/braun, fremde Planeten z. B. lila Moos, türkiser Stein). Tag-Nacht-Wechsel; nachts dunkler und spannender, mit Leuchtpflanzen.
- **Planeten (abgestimmt):** wie No Man's Sky. Am Boden flach wie Minecraft, geradeaus laufen führt einmal herum, aus dem All als Kugel sichtbar, überall landbar. Begrenzte Größe (Vorschlag: zu Fuß in etwa 10 Minuten umrundet), dafür dicht mit interessanten Orten. Planeten müssen interessant sein: Dungeons, Herrenhäuser/Stützpunkte mit passenden Gegnern.
- **Survival = Gegner + Beute:** feindliche Kreaturen, humanoid und nicht-humanoid, an Star Wars *angelehnt* (eigene Wesen und Namen, keine geschützten Begriffe). Sammeln heißt vor allem Ausrüstung, RPG-lastig wie Diablo/WoW. Reiz ist eine Mischung aus seltenen Funden, spürbar stärker werden und sichtbar anderem Aussehen der Figur.

## Technische Grundentscheidungen

- Browser-Spiel ohne Build-Schritt, GitHub Pages, läuft per `file://` (siehe AGENTS.md).
- 3D über three.js als einzelne Datei im Repo (Vorschlag, im Design von Stufe 1 festzuhalten).
- Multiplayer: ein Gerät ist Gastgeber und hält/speichert die Welt, andere treten per Raumcode bei. WebRTC über PeerJS (Bibliothek als Datei im Repo, Vermittlung über die kostenlose PeerJS-Cloud). Verbindungsschicht gekapselt, später gegen Trystero oder Firebase tauschbar. Spiel über das Internet braucht evtl. später einen TURN-Dienst.
- Planeten statt endloser Fläche: der Weltaufbau in Stufe 1 muss Stufe 5 schon berücksichtigen.

## Stufen

| # | Stufe | Stand | Spec | Plan |
|---|-------|-------|------|------|
| 1 | Blockwelt: Abbauen/Bauen, Kreativ- und Zuschauermodus, Speichern, Tastatur/Maus + Touch (Welt schon mehrspielertauglich aufbauen) | live als 0.4.0 (inkl. Entwicklerwerkzeuge, Gamepad, Musik und Geräusche); offen nur noch #18 (Test auf echtem iPad) | [Design](superpowers/specs/2026-10-23-stufe-1-blockwelt-design.md) | [Plan](superpowers/plans/2026-10-23-stufe-1-blockwelt.md) |
| 2 | Survival: Gegner, Laserschwert/Laserwaffen, Beute mit Seltenheitsstufen | live als 0.5.1; offen: kleinere Punkte #38–#42 und Balance nach Feedback | [Design](superpowers/specs/2026-10-23-stufe-2-survival-design.md) | [Plan](superpowers/plans/2026-10-23-stufe-2-survival.md) |
| 3 | Gemeinsam spielen per Raumcode | fertig, live als 0.6.1 | [Design](superpowers/specs/2026-10-24-stufe-3-gemeinsam-spielen-design.md) | [Plan](superpowers/plans/2026-10-24-stufe-3-gemeinsam-spielen.md) |
| 4 | Fahrzeuge finden und fahren (Gleiter, Buggy, Flieger; Bauen kommt mit Crafting nach Stufe 5) | Plan steht, Umsetzung offen (#60–#67) | [Design](superpowers/specs/2026-10-29-stufe-4-fahrzeuge-design.md) | [Plan](superpowers/plans/2026-10-29-stufe-4-fahrzeuge.md) |
| 5 | Raumschiffe, nahtloser Flug zu anderen Planeten | offen | – | – |
| später | Crafting: aus Rohstoffen Dinge herstellen (gewünscht, Zeitpunkt offen) | offen | – | – |

## Aktueller Stand

- 2026-10-29: Stufe 3 abgeschlossen (Gerätetest durch den Nutzer ok, Meilenstein zu, Restpunkte #59 unter „Später“). Stufe 4 neu zugeschnitten: Fahrzeuge werden gefunden statt gebaut (Bauen kommt mit Crafting nach Stufe 5). Design und Plan geschrieben, Issues #60–#67 angelegt. Kein itch.io-Release und kein Devlog für 0.6.x (Wunsch des Nutzers).
- 2026-10-29: Version 0.6.1 (live auf Test und `main`, 337 Tests grün): Beitritt hängt nicht mehr auf „Verbinde …“, wenn beim Eintritt intern ein Fehler auftritt (Gast und Gastgeber fangen Fehler ab, halb gestartetes Spiel wird abgebaut); Gastgeber meldet sich nach Verlust der PeerJS-Vermittlung neu an; #55: Leuchten ist jetzt ein Punktlicht im Block-Shader statt eines Scheins vor der Kamera (im Browser geprüft). Übrige Review-Kleinpunkte als #59.
- 2026-10-24: Stufe 3 umgesetzt (Branch `stufe-3`, Version 0.6.0, 332 Tests grün): Raumcode „WORT ZAHL“, Gastgeber bestätigt Gäste, gemeinsames Bauen/Kämpfen, Beute für alle in 40 Blöcken, Spaßkampf (PvP), Figur der Gäste wird in ihrer eigenen Welt gespeichert, Neuverbinden mit Quittung der Bauwünsche, Namensschilder. Dazu #54 (Schwung-Animation Laserschwert) und #56 (Weltliste beim Speichern). Echte Verbindung mit zwei Browserfenstern geprüft (PeerJS-Cloud). Das abschließende Gesamt-Review wurde auf Wunsch abgebrochen und steht noch aus. Auf Wunsch des Nutzers nach `test` und `main` (live) gepusht.
- 2026-10-23: Vision und Reihenfolge der Stufen mit dem Nutzer abgestimmt. Repo enthält nur das Gerüst (Workflows, AGENTS.md), noch keinen Spielcode. Auf GitHub noch keine Commits, Issues, Meilensteine oder Board. `gh` hat jetzt den Scope `project`.
- 2026-10-23: Brainstorming zu Stufe 1 abgeschlossen (Look, Planeten, Seed, Slots, Export), Design geschrieben. Wünsche dazu: Spielstände gut exportierbar, mehrere Slots, Welt prozedural aus Seed.
- 2026-10-24: Live als 0.5.1: Funde der Gesamtprüfung behoben (Startwaffe, feststeckende Bosse, Wegwerfen, Wiedereinstieg, Hinweis bei vollem Rucksack); kleinere Punkte als #38–#42.
- 2026-10-23: Stufe 2 umgesetzt (Branch `stufe-2`, 202 Tests grün, Spieltest per DevTools). Balance nach Spieltest angepasst; Werte stehen in js/gegner.js und js/gegenstaende.js.
- 2026-10-23: Live als 0.4.0: Stufe 1 plus Entwicklerwerkzeuge (F3), Gamepad-Steuerung, Orchestermusik und Geräusche (alles im Code erzeugt).
- 2026-10-23: Stufe 1 umgesetzt auf Branch `stufe-1` (85 Tests grün, Spieltest per DevTools auf Laptop- und Tablet-Größe). Entscheidungen während der Umsetzung stehen in den Commit-Nachrichten und im Abschlussbericht der Session.
- 2026-10-23: Design freigegeben, Plan geschrieben. Auf GitHub angelegt: Meilensteine Stufe 1–5 und „Später“, Bereichs-Labels, Board „Spacecraft“, Issues #1–#14 (Stufe 1) und #15 (Crafting, später).

## Nächster Schritt

- **Stufe 4 umsetzen** nach dem Plan (Task 1 = #60 zuerst), auf einem Branch `stufe-4`. Ergebnis: Version 0.7.0.
- Weiterhin: Feedback der Kinder zu Kampf und Balance (Werte in js/gegner.js, js/gegenstaende.js).
- Offen, aber nicht in Stufe 4: #57 (Survival im Entwicklerpanel), #58 (Lebensanzeige für Mitspieler).

## Offene Punkte Stufe 3

Abschluss-Review erledigt; Restpunkte in #59.

- Bekannte offene Punkte stehen als Issues (siehe Board): https://github.com/users/ttrabold/projects/1
