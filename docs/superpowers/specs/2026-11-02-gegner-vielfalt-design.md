# Gegner-Vielfalt – Design

Stand: 2026-11-02. Auftrag des Nutzers: „größere Gegnervielfalt, mindestens fünf neue Gegner pro Planet“, alle Einzelheiten dem Bauenden überlassen (keine Rückfragen). Die Entscheidungen unten sind deshalb **meine Vorschläge**.

## Ziel

Jeder der drei Planeten (Heimatplanet, Glutfrost, Rankenmoor) bekommt fünf neue gewöhnliche Gegner, also 15 neue Arten. Sie sollen sich **anders spielen**, nicht nur anders aussehen: Die Kinder müssen auf neue Dinge reagieren (kleine Sprengwesen wegschießen, Flieger treffen, Schilde umgehen, Heiler zuerst ausschalten). Kindgerecht bleibt Pflicht: lustig-bedrohlich, getroffene Gegner verpuffen, kein Blut.

## Nicht-Ziele

- Keine neuen Bosse und keine neuen Planeten.
- Keine volle Wegsuche, keine neue Netzwerkbotschaft: Gegner rechnet weiter nur der Gastgeber.

## Neue Verhaltensbausteine (js/ki.js)

| Baustein | Wirkung |
|---|---|
| `kamikaze` | rennt auf das Ziel zu, bleibt in `zuend.reichweite` stehen, zündet nach `zuend.zeit` Sekunden Zündschnur und explodiert (Flächenschaden `radius`), danach weg ohne Beute |
| `schweber` | fliegt (keine Schwerkraft), hält `schwebehoehe` über dem Ziel und Abstand wie ein Fernkämpfer, schießt |
| Fähigkeit `heilt` | alle `rate` Sekunden heilen verletzte Gegner in `radius` um `anteil` ihrer Höchst-LP (nicht sich selbst), nur im Kampf |
| Fähigkeit `sturm` (in `nahkampf`) | aus `min`–`max` Blöcken kurzes Anlaufen, dann Ansturm mit dreifachem Tempo; Hieb bei Berührung |
| Fähigkeit `stampf` (in `nahkampf`) | Bodenstampfer wie beim Koloss, aber kleiner |
| Schild | `vorneFaktor`/`rueckenFaktor` (gibt es schon beim Panzerkoloss): von vorn kaum Schaden, von hinten mehr |
| Fernkämpfer-Parameter | große `abstand`-Werte und hohe `sicht` ergeben Scharfschützen |

## Die 15 neuen Gegner

Werte sind Ausgangsvorschläge (Tabellen in `js/gegner.js`, Stufenskalierung wie bei den vorhandenen Arten).

| Planet | Name | Baustein | Orte (Planetentabelle) | Eigenheit |
|---|---|---|---|---|
| Heimat | Funkenling | kamikaze | Nacht, Dungeon | klein, schnell, leuchtet |
| Heimat | Flatterdroide | schweber | Station, Lager | fliegt, schwache Laser |
| Heimat | Schildwächter | nahkampf, Schild (vorn 0,2×, hinten 1,6×) | Station, Herrenhaus | von hinten treffen |
| Heimat | Späher | fernkampf, Abstand 14–22, Sicht 34 | Lager, Herrenhaus | langsame, harte Schüsse |
| Heimat | Reparaturdroide | fernkampf + heilt | Station, Lager | zuerst ausschalten |
| Glutfrost | Eisrutscher | nahkampf + sturm | Nacht, Dungeon, Lager | schlittert heran |
| Glutfrost | Glutfunke | kamikaze (Radius 4) | Nacht, Dungeon | explodiert heiß |
| Glutfrost | Schneewerfer | fernkampf (Bogenwurf, Schneeball) | Station, Lager | Bogenschuss |
| Glutfrost | Frostgolem | nahkampf + stampf | Herrenhaus, Dungeon | langsam, viel Leben |
| Glutfrost | Glutflatterer | schweber, orange Laser | Station, Nacht | fliegt |
| Rankenmoor | Moorirrlicht | schweber, grünliche Laser | Nacht, Dungeon | leuchtet |
| Rankenmoor | Pilzling | kamikaze (Sporen) | Nacht, Lager | explodiert |
| Rankenmoor | Lianenwürger | nahkampf, steht fest, Reichweite 3,6 | Dungeon, Herrenhaus | nicht nahekommen |
| Rankenmoor | Moosmutter | fernkampf + heilt | Station, Herrenhaus | Heiler |
| Rankenmoor | Dornenbock | nahkampf + sturm (hart) | Lager, Nacht | Rammbock |

Jede Art hat ein eigenes Blockmodell (5–8 Teile, Farben passend zur Planetenpalette), Rohstoff-Teile (`teile`, siehe Crafting), Name in `SC.T.gegner`, Erfahrung und Beute wie die vorhandenen Arten.

## Prüfung

Reine Logik wird automatisch geprüft (Tabelle vollständig, je Planet ≥ 5 neue Arten in den Orts-Listen, jedes Verhalten per KI-Test, Heilen, Explosion, Ansturm, Schweben, Schild). Wie die Gegner wirken, muss der Nutzer im Spiel beurteilen; Werte werden danach nachgestellt.
