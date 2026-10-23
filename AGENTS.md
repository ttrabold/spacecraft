# Spacecraft – Hinweise für Agenten

Browser-Spiel. Reines HTML, CSS und JavaScript ohne Build-Schritt und ohne Abhängigkeiten. Läuft als PWA auf GitHub Pages und lokal per `file://`.

- Live: https://ttrabold.github.io/spacecraft/ (Remote `origin`, Branch `main`)
- Test-Vorschau: https://ttrabold.github.io/spacecraft-test/ (Remote `test`)

## Sprache

Code-Kommentare, Commit-Nachrichten und Docs sind Deutsch.

## Aufbau

```
index.html          Version `var V="X.Y.Z"` (einzige Stelle) und Lader, der alle Skripte in fester Reihenfolge mit ?v=V lädt
sw.js               Service-Worker, Cache-Name aus der Version
css/, js/           Spiel (klassische Skripte unter dem Namensraum SC, keine ES-Module)
js/lib/three.min.js three.js r158 (UMD-Build, unverändert eingecheckt)
tests/index.html    Testseite (Browser), lädt dieselbe Skriptliste; SC_TEST verhindert den Spielstart
scripts/tests.sh    führt die Testseite in Chrome ohne Fenster aus (Node ≥ 22, kein npm)
scripts/itch-zip.sh baut das itch.io-ZIP aus den in index.html referenzierten Dateien
docs/ROADMAP.md     Vision, Stufen, aktueller Stand – Einstieg jeder Session
Survival (Stufe 2)  js/werte, gegenstaende, rucksack, wesen, gegner, ki, kampf, auftauchen, render-wesen, ui-rucksack, survival
docs/OFFENE-PUNKTE.md   Verweis auf die GitHub Issues
docs/superpowers/   Specs und Pläne zu größeren Features
```

## Konventionen

- **Keine ES-Module, kein Bundler, kein npm**, damit `file://` funktioniert. Ladereihenfolge in `index.html` und `tests/index.html` identisch halten.
- **Browser-Kompatibilität:** auch ältere Safari-Versionen (iOS) sollen laufen.
- **Spielstand-Kompatibilität:** neue Felder beim Laden mit Standardwert nachziehen; bestehende Speicherstände dürfen nie brechen.

## Prüfen

Die Tests laufen im Browser: `tests/index.html` öffnen, erwartet: keine ❌-Zeilen und `Fertig: N ok, 0 fehlgeschlagen`. Kurzform auf der Kommandozeile: `bash scripts/tests.sh` (braucht Chrome; in der Claude-Sandbox ohne Sandbox ausführen). Behaupte nie, etwas funktioniere, ohne die Testseite wirklich geladen zu haben. Wenn du keinen Browser steuern kannst, sag das offen.

## Veröffentlichen

- **Version erhöhen** bei jeder Änderung an ausgelieferten Dateien, nach Semantic Versioning: `var V="X.Y.Z"` im Kopf von `index.html` ist die **einzige Stelle** (hängt als `?v=` an allen Dateien und am Service-Worker). Prototyp: MAJOR bleibt 0; neue Funktionen/Balance → MINOR, Fehlerbehebungen → PATCH.
- **Release für itch.io:** GitHub → Actions → „Release (itch.io-Artefakt)“. Pro Version genau ein Release; existiert der Tag schon, bricht der Workflow ab.
- **Devlog bei großen Änderungen:** Entwurf `docs/itch-devlog-X.Y.Z.md` (+ `.html` zum Kopieren) anlegen und einchecken; veröffentlicht wird von Hand. Am Ende der Arbeit anbieten, falls er fehlt.
- **GitHub Pages** veröffentlicht über `.github/workflows/pages.yml` (Pages-Quelle: „GitHub Actions“, in beiden Repos). Nur Laufzeitdateien; Änderungen nur an `docs/`, `tests/`, `scripts/`, AGENTS.md oder CLAUDE.md lösen keine Veröffentlichung aus.
- Größere Änderungen zuerst ins Test-Repo: `git push test <branch>:main`, dann in der Vorschau prüfen. Erst nach Bestätigung per Fast-Forward nach `main` und `git push origin main`.
- Test-Vorschau und Live-Seite teilen sich denselben Origin und damit denselben `localStorage`. Dort nie Speicherstände löschen oder überschreiben. Zerstörende Tests nur per `file://` oder `localhost`.
- Nicht pushen, ohne dass der Nutzer es verlangt.

## Projektmanagement

Das Projekt läuft über viele Sessions. Jede Session muss ohne Vorwissen weitermachen können.

**Zu Beginn jeder Session:**

1. `docs/ROADMAP.md` lesen: Vision, Stufen, aktueller Stand, nächster Schritt.
2. Offene Issues der aktuellen Stufe ansehen: `gh issue list --milestone "<Meilenstein>"`.
3. Zur aktuellen Stufe gehörende Spec und Plan lesen (verlinkt in der Roadmap).

**Struktur auf GitHub (Repo `ttrabold/spacecraft`):**

- **Meilensteine** = Stufen der Roadmap, z. B. „Stufe 1: Blockwelt“. Jedes Issue gehört zu genau einem Meilenstein.
- **Issues** = einzelne Aufgaben, typischerweise eine pro Aufgabe im Plan. Titel auf Deutsch, kurz und konkret.
- **Labels nach Bereich:** `welt`, `multiplayer`, `kampf`, `fahrzeuge`, `weltraum`, `steuerung`, `ui`, `technik`, dazu die Standard-Labels `bug`, `enhancement`, `documentation`.
- **Projektboard** „Spacecraft“ (https://github.com/users/ttrabold/projects/1, Nummer `1`, Owner `ttrabold`) mit Status Todo / In Progress / Done. Neue Issues dort eintragen (`gh project item-add`), Status beim Arbeiten mitziehen.

**Ablauf pro Stufe:**

1. Design mit dem Nutzer klären → Spec in `docs/superpowers/specs/JJJJ-MM-TT-<thema>-design.md`.
2. Plan schreiben → `docs/superpowers/plans/JJJJ-MM-TT-<thema>.md`.
3. Aus den Planaufgaben Issues anlegen (Meilenstein, Label, Board).
4. Umsetzen; Commits verweisen auf Issues (`Fixes #N`).
5. Stufe fertig: Meilenstein schließen, Roadmap aktualisieren.

**Am Ende jeder Session (oder bevor der Kontext knapp wird):**

- `docs/ROADMAP.md` aktualisieren: Stand, was zuletzt passiert ist, nächster konkreter Schritt, offene Fragen an den Nutzer.
- Erledigte Issues schließen, angefangene mit kurzem Kommentar zum Stand versehen, Board-Status anpassen.
- Aufgeschobene Punkte oder neue Ideen als Issue anlegen statt sie nur im Chat zu erwähnen.
- Änderungen an Docs committen (nicht pushen, ohne dass der Nutzer es verlangt).
