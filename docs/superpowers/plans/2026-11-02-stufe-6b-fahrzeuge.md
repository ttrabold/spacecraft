# Stufe 6b: Crafting – Fahrzeuge – Plan

Spec: `docs/superpowers/specs/2026-11-02-crafting-design.md` (Abschnitt „Stufe B – Fahrzeuge“). Entscheidungen beim Schreiben (Vorschläge, keine Rückfragen gewünscht):

- Gebaut werden Schwebeflitzer, Kraterkäfer und Kometenjäger (das Raumschiff folgt in 6c). Gewählt werden **Motor** (Tempo), **Panzerung**, **Bordwaffe** (keine oder mit Metall und Kristallfarbe) und **Farbe** (zwölf Farben, ohne Kosten).
- Stufe der Teile = Seltenheit des Metalls (Stein bis Sternenmetall). Stufe 0 entspricht einem gefundenen Fahrzeug; Motor ×(1 + 0,12·Stufe), Panzerung ×(1 + 0,4·Stufe), Bordwaffe Schaden ×(1 + 0,25·Stufe), Strahlfarbe aus dem Kristall.
- Kosten: Rumpf je Art (Schwebeflitzer 10 Bretter + 3 Schaltkreis; Kraterkäfer 14 Bretter + 10 Stein + 5 Schaltkreis; Kometenjäger 12 Bretter + 8 Schaltkreis + 1 Blauer Kristall), Motor 6 Metall, Panzerung 8 Metall, Bordwaffe 5 Metall + 1 Kristall.
- Gebaute Fahrzeuge verpuffen nie wirklich: Sie sind wie Fundort-Fahrzeuge „zuhause“ am Bauplatz und kehren nach dem Verpuffen mit voller Panzerung zurück.
- Gefundene Fahrzeuge an Lagern, Stationen und Herrenhäusern gibt es nur noch an etwa jedem vierten Ort (`SC.CRAFTING_FUND.fahrzeugChance`); der Start-Schwebeflitzer bleibt.

Aufgaben (Test zuerst, `bash scripts/tests-wsl.sh`, ein Commit je Aufgabe):

1. **Werte und Aussehen** (`js/fahrzeuge.js`, `js/render-fahrzeuge.js`): `SC.Fahrzeug.def(f)` liefert die Werte nach `f.bau`; Lackfarbe und Bordwaffenrohr im Modell; `bau` wird gespeichert, an Gäste gemeldet und gespiegelt.
2. **Rezepte** (`js/crafting.js`): Rezepte `gleiter`, `buggy`, `flieger` mit Wahl, Kosten und Herstellen (Platz prüfen, dann bezahlen).
3. **Menü** (`js/ui-werkbank.js`): Auswahl von Motor, Panzerung, Bordwaffe, Farbe; Vorschau der Werte.
4. **Aufstellen und Mehrspieler** (`js/fahren.js`, `js/raum.js`, `js/spiel.js`): Fahrzeug neben den Spieler stellen, Gast über den Gastgeber; Heimkehr nach dem Verpuffen.
5. **Seltenere Funde und Abschluss**: Fundort-Fahrzeuge nur an jedem vierten Ort, Anleitung, Roadmap, Version.
