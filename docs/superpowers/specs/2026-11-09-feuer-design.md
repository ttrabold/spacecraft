# Lagerfeuer und Kamin – Design

Stand: 2026-11-09. Issue #171. Ausgangspunkt: Version 0.31.1 (Netzprotokoll 11, Generator 4). Die Entscheidungen stammen aus den Vorschlägen im Gespräch; der Nutzer hat sie ohne Änderung freigegeben *(Nutzer)*.

## Worum es geht

Die Kinder wollen ein Feuer anzünden, im Kamin und in der freien Natur. Das Feuer soll gemütlich sein (Licht, Knistern, Funken) und einen kleinen Nutzen haben: nachts ein sicherer Ort. Kindgerecht heißt: **kein Schaden durch Feuer**.

- **Nicht-Ziele:** Feuer, das sich ausbreitet oder Holz abbrennt (Issue #167, bleibt getrennt), Feuer als Waffe, Holz nachlegen, Kochen.

## Ablauf und Regeln

- **Feuerzeug** *(Nutzer)*: Bauteil an der Werkbank, 2 Eisenerz + 1 roter Kristall. Wird nie verbraucht. Mit der Setzen-Taste auf eine Feuerstelle zündet man sie an.
- **Lagerfeuer** *(Nutzer)*: Bauteil aus 3 Stämmen, steht draußen, durchgehbar, niedriger Holzstoß.
- **Kamin** *(Nutzer)*: Bauteil aus 6 Stein + 2 Stämmen, fester Block mit Feueröffnung auf allen vier Seiten.
- **Brennen** *(Nutzer)*: Eine Feuerstelle ist „aus“ oder „an“ (eigene Blöcke). Brennend leuchtet sie warm und hell (Lagerfeuer Licht 15, Kamin 13), Funken steigen auf, es knistert (lauter in der Nähe). Sie brennt, bis sie gelöscht wird.
- **Löschen** *(Nutzer)*: Mit einem Wassereimer (Setzen auf das Feuer; der Eimer wird leer) und bei Regen: Ein Lagerfeuer mit freiem Himmel darüber geht bei Regen nach einigen Sekunden aus. Der Kamin geht bei Regen nicht aus, Schnee löscht nichts. Mit dem Feuerzeug zündet man wieder an.
- **Wärme** *(Nutzer)*: Im Umkreis von 6 Blöcken um ein brennendes Feuer füllt sich das Leben doppelt so schnell auf. Beim Betreten ein Hinweis „Am Feuer ist es warm“ (höchstens alle 60 s).
- **Sicherer Ort** *(Nutzer)*: Normale Gegner betreten den Umkreis von 5 Blöcken nicht und verfolgen dort nicht weiter; Bosse nicht. Gegner verpuffen nicht, nichts nimmt Schaden.
- **Abbauen**: Eine abgebaute Feuerstelle ergibt immer die „aus“-Form.
- **Kreativ**: Beide Feuerstellen stehen jeweils „aus“ und „an“ in der Blockauswahl, das Feuerzeug unter „Materialien“.
- **Mehrspieler** *(Nutzer)*: „an“ und „aus“ sind eigene Block-IDs, deshalb sehen es alle, und es wird mit der Welt gespeichert; Netzprotokoll 12. Gegner und Regen-Löschen rechnet der Gastgeber, Wärme und Funken jedes Gerät für sich.

## Der Bauer entscheidet

Aussehen der Kacheln, genaue Funkenzahl, Geräusche (im Code erzeugt), Kosten- und Zahlenfeinheiten in einer Tabelle `SC.FEUER`.
