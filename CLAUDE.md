@AGENTS.md

# Zusätzlich für Claude Code

- Zu Beginn jeder Session `docs/ROADMAP.md` lesen und dem Ablauf „Projektmanagement“ in AGENTS.md folgen.
- `gh` scheitert in der Sandbox mit einem TLS-Fehler (`x509: OSStatus -26276`); `gh`-Befehle daher ohne Sandbox ausführen.
- Größere Features laufen über die Superpowers-Skills: erst Spec in `docs/superpowers/specs/`, dann Plan in `docs/superpowers/plans/`, Dateinamen mit Datum (`JJJJ-MM-TT-name.md`).
- Der Code ist extrem dicht (Einzeiler). Beim Bearbeiten mit `Read` und `offset`/`limit` arbeiten und mit `Edit` kleine, eindeutige Stellen ersetzen statt Dateien neu zu schreiben.
- `.claude/` ist nicht eingecheckt. Nicht committen.
