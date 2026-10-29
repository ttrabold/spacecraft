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
| 4 | Fahrzeuge finden und fahren (Gleiter, Buggy, Flieger; Bauen kommt mit Crafting nach Stufe 5) | fertig, live als 0.7.8 | [Design](superpowers/specs/2026-10-29-stufe-4-fahrzeuge-design.md) | [Plan](superpowers/plans/2026-10-29-stufe-4-fahrzeuge.md) |
| 5 | Neue Planeten (5a: Glutfrost, Rankenmoor) und Raumflug (5b: Raumschiff, All, Sprungantrieb) | 5a live als 0.8.0, 5b umgesetzt als 0.9.0, dazu #84–#88 als 0.10.0 (Branch `stufe-5b`, auf `test`) | [Design](superpowers/specs/2026-10-29-stufe-5-planeten-raumflug-design.md) | [Plan 5a](superpowers/plans/2026-10-29-stufe-5a-neue-planeten.md), [Plan 5b](superpowers/plans/2026-10-29-stufe-5b-raumflug.md) |
| später | Crafting: aus Rohstoffen Dinge herstellen (gewünscht, Zeitpunkt offen) | offen | – | – |

## Aktueller Stand

- 2026-10-29: Version 0.10.0 (Branch `stufe-5b`, 465 Tests grün), Issues #84–#88: Schnellleiste auf iPad/iPhone wieder antippbar (Touch-Blickfläche lag seit 0.7.6 darüber; #84), Ton auf iOS trotz Stummschalter und nach App-Wechsel (audioSession „playback“, stilles Audio-Element, „interrupted“ fortsetzen; #87, nur auf echten Geräten prüfbar), Platz im Fahrzeug wechseln mit G / Steuerkreuz unten / 💺 (#86), „Zum Gastgeber“ in den Entwicklerwerkzeugen für Gäste (#85), Spielanleitung im Menü und in der Weltliste, dazu `docs/ANLEITUNG.md` aus `SC.T.anleitung` erzeugt (#88).
- 2026-10-29: Stufe 5b umgesetzt (Branch `stufe-5b`, Version 0.9.0, 456 Tests grün): Raumschiff „Sternenläufer“ am Startplaneten (verpufft nie), Aufstieg mit dunkelndem Himmel, Austritt ab Höhe 160 (nur mit allen an Bord), All mit Planetenkugeln aus der echten Landschaft, Ziel wählen (T/🎯/Steuerkreuz rechts), Sprung (J/⚡/Steuerkreuz links), Eintritt über der Anflugstelle, Asteroiden, Piraten mit Beute, Notsprung, Speichern im All am Landepunkt. Gemeinsam fliegen (Protokoll 4, Pilot rechnet, Mitfahrer schauen zu), mit zwei Tabs geprüft. Raumszene rund 20 Zeichenaufrufe.
- 2026-10-29: Stufe 5a umgesetzt (Branch `stufe-5a`, Version 0.8.0, 430 Tests grün): Planeten Glutfrost (Schnee, Eis, Vulkane, Lavaseen; Lavagolem, Frostkrabbler, Boss Magmakönig) und Rankenmoor (Dschungel, Sumpf; Rankenschleicher, Sumpfspucker, Boss Sumpfkoloss), neue Blöcke Lava/Eis/Schlamm/Basalt, Stufenaufschlag +8/+15, Planetenwechsel über F3 (Landepunkt je Planet mit Gleiter, Ankunftsanzeige), im Raum kommen alle Gäste mit (Protokoll 3). Startplanet per Prüfsummen-Test unverändert.
- 2026-10-29: 0.7.8 live, vom Nutzer zu zweit geprüft: Mitfahrer sitzen fest auf ihrem Sitz, Fahrzeuge fahren zwischen Meldungen weiter und werden um die gemessene Laufzeit (ping/pong) vorausgerechnet, eigener Sitz folgt im selben Bild (0.7.5, 0.7.7, 0.7.8); Touch-Steuerung verdeckt keine Menüs mehr (0.7.6).
- 2026-10-29: 0.7.4 live: Fahrzeuge nur in Sichtweite gezeichnet (0.7.3), Einstellung „Auflösung“ (Normal/Hoch, am Computer Normal). Hohe Last in Chrome/Firefox kam vor allem von doppelter Auflösung auf Retina; laut Nutzer jetzt sehr viel besser. Weitere Hebel falls nötig: Sichtweite, durchsichtige Blätter.
- 2026-10-29: 0.7.2 live: Einstellung „Höchste Bildrate“ (30/60/unbegrenzt, Standard 60) gegen hohe CPU-/GPU-Last in Chrome (#68).
- 2026-10-29: 0.7.1 live (Test und Live), Meilenstein Stufe 4 geschlossen. Gerätetest durch den Nutzer ok. Kein itch.io-Release und kein Devlog angefragt.
- 2026-10-29: Stufe 4 umgesetzt (Branch `stufe-4`, Version 0.7.0, 390 Tests grün): Schwebeflitzer (Gleiter), Kraterkäfer (Buggy), Kometenjäger (Flieger) als Viersitzer; Start-Gleiter beim Startpunkt, weitere an Lager/Station/Herrenhaus; Einsteigen mit F, Steuerkreuz hoch oder 🚗; Panzerung, Rammen, Bordgeschütz, Verpuffen mit Wiederkehr; Kreativ-Reiter Fahrzeuge und F3; gemeinsames Fahren (Protokoll 2, mit zwei Tabs über PeerJS geprüft). Fahrzeuge fahren durch Laub. Testlauf filterbar: `bash scripts/tests.sh <Text>`.
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

- **0.10.0 prüfen:** `stufe-5b` nach `test` pushen, Gerätetest durch den Nutzer: ganzer Flug allein und gemeinsam, Tablet mit 🎯/⚡, auf iPhone/iPad Ton (auch mit Stummschalter) und Schnellleiste Platz 3–9, Platzwechsel, Spielanleitung. Danach live, Stufe 5 abschließen. Nächste Ideen: Raumstationen (#69), Crafting (#15).
- Danach: Feedback der Kinder zu Fahrzeugen (Werte in js/fahrzeuge.js: Tempo, Panzerung, Geschütz).
- Offen, aber nicht in Stufe 4: #57 (Survival im Entwicklerpanel), #58 (Lebensanzeige für Mitspieler), #59 (Restpunkte Stufe 3).
- Nächste Stufe: 5 (Raumschiffe, nahtloser Flug zu anderen Planeten).

## Offene Punkte Stufe 3

Abschluss-Review erledigt; Restpunkte in #59.

- Bekannte offene Punkte stehen als Issues (siehe Board): https://github.com/users/ttrabold/projects/1
