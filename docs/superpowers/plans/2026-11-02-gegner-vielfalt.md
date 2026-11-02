# Gegner-Vielfalt – Plan

Spec: `docs/superpowers/specs/2026-11-02-gegner-vielfalt-design.md`. Arbeitsweise wie bei den früheren Stufen: Test zuerst, dann Umsetzung, `bash scripts/tests-wsl.sh` (bzw. `tests.sh`), ein Commit je Aufgabe, Version nach ausgelieferten Änderungen erhöhen.

1. **KI: Kamikaze und Schweber** (`js/ki.js`): Verhalten `kamikaze` (Zündschnur, Explosion als `stampf`-Aktion, Gegner danach `entfernen`) und `schweber` (fliegt, Schwebehöhe). Tests in `tests/test-ki.js`.
2. **KI: Heilen, Ansturm, Stampfen** (`js/ki.js`): Fähigkeiten `heilt`, `sturm`, `stampf` für fernkampf/nahkampf. Tests.
3. **Heimatplanet: fünf Gegner** (`js/gegner.js`, `js/texte.js`, `js/planeten.js`): Funkenling, Flatterdroide, Schildwächter, Späher, Reparaturdroide.
4. **Glutfrost: fünf Gegner**: Eisrutscher, Glutfunke, Schneewerfer, Frostgolem, Glutflatterer.
5. **Rankenmoor: fünf Gegner**: Moorirrlicht, Pilzling, Lianenwürger, Moosmutter, Dornenbock.
6. **Abschluss**: Tabellen-Tests (je Planet ≥ 5 neue Arten, Modelle, Texte, Orte), Anleitung, Roadmap, Version.
