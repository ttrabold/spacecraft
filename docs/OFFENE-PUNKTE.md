# Offene Punkte

Die offenen Punkte stehen als GitHub Issues: https://github.com/ttrabold/spacecraft/issues

- Übersicht: `gh issue list`
- Neuen Punkt anlegen: `gh issue create --title "…" --label enhancement`
- Erledigt: Issue schließen (im Commit mit `Fixes #N`)

## Hinweise zum Arbeiten

- Größere Änderungen erst ins Test-Repo: `git push test <branch>:main`, Vorschau unter https://ttrabold.github.io/spacecraft-test/.
- Nach Änderungen die Version erhöhen (Semantic Versioning, `var V="X.Y.Z"` in `index.html`, siehe AGENTS.md).
