# Roadmap

Einstiegspunkt für jede Session. Ablauf siehe AGENTS.md, Abschnitt „Projektmanagement“.

## Vision

Minecraft-artiges Browser-Spiel: Blöcke abbauen und bauen, Erkundung, Kampf, Spannung, Spaß und ein wenig Chaos. Später Fahr- und Flugzeuge selbst bauen und mit Raumschiffen nahtlos vom Planeten starten und neue Planeten erkunden (wie No Man's Sky). Futuristische Waffen (Laserschwert, Laserwaffen).

- **Spieler:** Vater, sein neunjähriger Sohn und dessen gleichaltriger Freund. **Kindgerecht** bleibt immer Pflicht.
- **Zusammen spielen:** gleichzeitig in derselben Welt, jeder am eigenen Gerät. Geräte gemischt (Laptop/PC und Tablet) → Tastatur/Maus und Touch.
- **Modi:** Kreativ, Survival (ohne Hunger/Essen), Zuschauer.
- **Kindgerecht im Survival (abgestimmt):** Besiegt werden ohne Blut/Grusel, Wiedereinstieg am Startpunkt/Raumschiff, Ausrüstung bleibt erhalten (höchstens Rohstoffe gehen verloren). Gegner lustig-bedrohlich statt düster, getroffene Gegner verpuffen. Blockbau ist Mittel zum Zweck (Unterschlupf, Fahrzeuge, Raumschiffe).
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
| 1 | Blockwelt: Abbauen/Bauen, Kreativ- und Zuschauermodus, Speichern, Tastatur/Maus + Touch (Welt schon mehrspielertauglich aufbauen) | Plan fertig, Umsetzung steht an (Issues #1–#14) | [Design](superpowers/specs/2026-10-23-stufe-1-blockwelt-design.md) | [Plan](superpowers/plans/2026-10-23-stufe-1-blockwelt.md) |
| 2 | Survival: Gegner, Laserschwert/Laserwaffen, Beute mit Seltenheitsstufen | offen | – | – |
| 3 | Gemeinsam spielen per Raumcode | offen | – | – |
| 4 | Fahr- und Flugzeuge bauen | offen | – | – |
| 5 | Raumschiffe, nahtloser Flug zu anderen Planeten | offen | – | – |
| später | Crafting: aus Rohstoffen Dinge herstellen (gewünscht, Zeitpunkt offen) | offen | – | – |

## Aktueller Stand

- 2026-10-23: Vision und Reihenfolge der Stufen mit dem Nutzer abgestimmt. Repo enthält nur das Gerüst (Workflows, AGENTS.md), noch keinen Spielcode. Auf GitHub noch keine Commits, Issues, Meilensteine oder Board. `gh` hat jetzt den Scope `project`.
- 2026-10-23: Brainstorming zu Stufe 1 abgeschlossen (Look, Planeten, Seed, Slots, Export), Design geschrieben. Wünsche dazu: Spielstände gut exportierbar, mehrere Slots, Welt prozedural aus Seed.
- 2026-10-23: Design freigegeben, Plan geschrieben. Auf GitHub angelegt: Meilensteine Stufe 1–5 und „Später“, Bereichs-Labels, Board „Spacecraft“, Issues #1–#14 (Stufe 1) und #15 (Crafting, später).

## Nächster Schritt

- Umsetzung von Stufe 1 nach Plan, beginnend mit Task 1 (Issue #1). Task N = Issue #N. Ausführungsart (Subagenten oder direkt) wählt der Nutzer.
- Board: https://github.com/users/ttrabold/projects/1
