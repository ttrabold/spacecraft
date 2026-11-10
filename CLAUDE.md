@AGENTS.md

# Zusätzlich für Claude Code

- Zu Beginn jeder Session `docs/ROADMAP.md` lesen und dem Ablauf „Projektmanagement“ in AGENTS.md folgen.
- `gh` scheitert in der Sandbox mit einem TLS-Fehler (`x509: OSStatus -26276`); `gh`-Befehle daher ohne Sandbox ausführen.
- Größere Features laufen über die Superpowers-Skills: erst Spec in `docs/superpowers/specs/`, dann Plan in `docs/superpowers/plans/`, Dateinamen mit Datum (`JJJJ-MM-TT-name.md`).
- Der Code ist extrem dicht (Einzeiler). Beim Bearbeiten mit `Read` und `offset`/`limit` arbeiten und mit `Edit` kleine, eindeutige Stellen ersetzen statt Dateien neu zu schreiben.
- `.claude/` ist nicht eingecheckt. Nicht committen.
- **Niemals das Modell Fable verwenden** (`fable`, `claude-fable-*`) – weder für Subagenten (`model`-Parameter im Agent-Tool), noch in Workflows, Skripten oder Konfiguration. Stattdessen Opus oder Sonnet.
- Modellwahl bei Subagenten (`subagent-driven-development`): mechanische Planaufgaben mit genauer Vorgabe (Daten, Texte, Tests nach Muster) mit `model: "haiku"`. Alles mit Logik, Spielstand, UI-Fokus oder Fehlersuche mit dem Hauptmodell. Reviews immer mit `model: "opus"`. Nach jeder Aufgabe `bash scripts/tests.sh` ausführen. Vorerst als Versuch; bei häufiger Nacharbeit lockern oder anpassen.
