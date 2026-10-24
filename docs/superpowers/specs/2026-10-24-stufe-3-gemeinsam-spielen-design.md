# Stufe 3: Gemeinsam spielen per Raumcode – Design

Stand: 2026-10-24. Abgestimmt mit dem Nutzer im Brainstorming. Punkte mit **[Claude]** hat Claude entschieden, ohne dass der Nutzer sie ausdrücklich bestätigt hat. Sie dürfen beim Planen angepasst werden, solange Absicht und Ziele erhalten bleiben.

## Absicht

Vater, Sohn und dessen Freund wollen **zu dritt in derselben Welt** spielen, jeder am eigenen Gerät: einer am iPad, einer am Handy, einer am Laptop. Sie bauen zusammen und kämpfen zusammen gegen die Gegner aus Stufe 2. Die Kinder sind neun, deshalb muss alles ohne Erklärung funktionieren. Sie sollen nichts verlieren und sich nicht über Beute streiten.

Zuerst spielen alle **im selben WLAN**. Spielen über das Internet zwischen verschiedenen Netzwerken (mit TURN-Dienst) kommt später als eigener Ausbau.

## Ziele

1. **Raum öffnen:** Der Gastgeber öffnet im Pausemenü seiner Welt „Freunde einladen“ und sieht einen Raumcode aus **Wort + Zahl**, z. B. `MOND 47`. Dort kann er PvP ein- und ausschalten und sieht die Liste der Mitspieler.
2. **Beitreten:** Auf dem Startbildschirm gibt es „Bei Freunden mitspielen“. Der Gast gibt den Raumcode ein (Wort aus einer Liste antippen, Zahl tippen), wählt seine Figur und tritt bei.
2a. **Gastgeber bestätigt jeden Gast:** Tritt jemand bei, erscheint beim Gastgeber „Ben möchte mitspielen – Ja / Nein“. Erst nach „Ja“ ist der Gast in der Welt. Im Menü „Freunde einladen“ kann der Gastgeber einen Mitspieler auch wieder hinauswerfen, die Figur des Gastes wird dabei normal gespeichert. Grund: Die Raumcodes sind kurz und lassen sich erraten, und die Vermittlung ist öffentlich. So kommt kein Fremder in die Welt der Kinder. Ein Gast, der nach einem kurzen Abbruch automatisch neu verbindet, muss nicht noch einmal bestätigt werden.
3. **Figur des Gastes:** Der Gast wählt beim Beitreten eine seiner eigenen Welten. Die Figur dieser Welt (Stufe, Erfahrung, Rucksack, Ausrüstung, Schnellleisten) kommt mit. Alles, was er beim Gastgeber findet oder verliert, wird **laufend auf seinem eigenen Gerät** in genau diese Welt zurückgespeichert: alle paar Sekunden und sofort bei jedem Fund oder Ausrüstungswechsel. Wer noch keine eigene Welt hat, wählt „Neue Figur“. Dann wird automatisch eine neue Survival-Welt mit Startfigur angelegt.
4. **Die Welt gehört dem Gastgeber:** Blöcke, Kisten, geräumte Bauwerke und die Tageszeit liegen bei ihm und werden nur auf seinem Gerät gespeichert, wie bisher automatisch. Änderungen der Gäste landen in seiner Welt.
5. **Figurname:** Beim Anlegen einer Welt gibt es das Feld „Name deiner Figur“. Im gemeinsamen Spiel steht der Name **über der Figur**. Bestehende Welten haben noch keinen Namen. Wer mit so einer Figur beitritt oder einlädt, wird einmal danach gefragt, und der Name wird in der Welt gespeichert.
6. **Mitspieler sehen:** Andere Figuren zeigen ihre Rüstung und Waffe in Seltenheitsfarbe, wie die eigene Figur in der Ansicht von außen. Dazu kommen der Name und eine eigene Grundfarbe pro Spieler, damit man sich auch aus der Ferne unterscheidet. **[Claude]**
7. **Zusammen bauen:** Abbauen und Setzen der Gäste wirken in der Welt des Gastgebers und sind sofort bei allen zu sehen. Im Survival-Modus geht abgebauter Stoff in den eigenen Rucksack, und Setzen verbraucht aus dem eigenen Rucksack.
8. **Zusammen kämpfen:** Gegner, Geschosse und das Auftauchen von Gegnern rechnet nur der Gastgeber. Alle können dieselben Gegner treffen und von ihnen getroffen werden.
9. **Beute ohne Streit:** Wird ein Gegner besiegt oder eine Kiste geöffnet, bekommt **jeder Spieler in der Nähe dieselben Gegenstände** als eigene Beutekugeln. Jeder sieht nur seine eigenen Kugeln und kann nur diese aufheben. „In der Nähe“ heißt **[Claude]**: im Umkreis von 40 Blöcken, auch ohne eigenen Treffer. Erfahrungspunkte bekommen alle in der Nähe in voller Höhe. **[Claude]** Eine geöffnete Kiste ist danach für alle leer.
10. **Modus:** Der Gastgeber legt den Modus fest (Kreativ, Survival, Zuschauer), er gilt für alle. Im Kreativmodus des Gastgebers bleiben Rucksack und Ausrüstung des Gastes unberührt.
11. **PvP als Schalter:** Der Gastgeber schaltet PvP beim Einladen ein oder aus, Standard ist **aus**. Ist PvP aus, können sich Spieler nicht gegenseitig verletzen. Wer im PvP von einem Mitspieler besiegt wird, verliert **nichts**, auch keine Rohstoffe, und steigt sofort wieder ein. Gegen Gegner besiegt werden funktioniert für jeden einzeln wie in Stufe 2, mit Wiedereinstieg am Startpunkt der Welt des Gastgebers.
12. **Gegner bleiben gleich stark**, egal wie viele mitspielen. **[Claude]**
13. **Verbindungsabbrüche verzeihen:**
    - Reißt die Verbindung ab, versucht der Gast etwa 15 Sekunden lang selbst neu zu verbinden **[Claude]**, ohne Menü und ohne erneute Eingabe des Codes. Währenddessen erscheint ein kleiner Hinweis.
    - Der Gastgeber merkt sich die Figur. Wer zurückkommt, steht wieder dort, wo er war. Die letzte Position jeder Gastfigur wird in der Welt des Gastgebers gespeichert, damit das auch beim nächsten gemeinsamen Spiel gilt. **[Claude]**
    - Klappt das Neuverbinden nicht oder beendet der Gastgeber das Spiel, sieht der Gast „Verbindung zum Gastgeber verloren – deine Figur ist gespeichert“ und landet im Menü. Mit demselben Raumcode kann er später wieder beitreten.
14. **Eigene Steuerung ohne Verzögerung:** Jedes Gerät bewegt seine eigene Figur sofort selbst. Mitspieler werden geglättet dargestellt. Der Gastgeber entscheidet über Welt, Gegner und Beute.

## Nicht-Ziele in Stufe 3

- Spielen über das Internet zwischen verschiedenen Netzwerken (TURN-Dienst). Das wird ein eigener Ausbau mit eigenem Issue.
- Chat, Sprachchat, Emotes.
- Handel oder Weitergeben von Gegenständen zwischen Spielern.
- Unterschiedliche Modi pro Spieler.
- Eine weltübergreifende Figur pro Gerät statt einer Figur pro Welt. Sie kann später kommen, wenn sie gewünscht ist.
- Mehr als 4 Spieler gleichzeitig (Gastgeber + 3). **[Claude]**
- Schutz gegen Schummeln unter den Mitspielern: Sie vertrauen einander. Gegen Fremde schützt die Bestätigung durch den Gastgeber (Ziel 2a).

## Anti-Ziele (wäre ein Fehlschlag, auch wenn es technisch läuft)

- Ein Spielstand geht verloren oder wird beschädigt. Das gilt besonders für die eigene Welt des Gastes: Dort darf nur der Figurteil (`spieler`) überschrieben werden, nie seine Chunks, Kisten oder Bauwerke.
- Gegenstände verschwinden oder verdoppeln sich beim Abbruch, beim Neuverbinden oder beim Wechsel zwischen Welten.
- Streit um Beute, weil einer sie dem anderen wegschnappt.
- Die eigene Steuerung fühlt sich im gemeinsamen Spiel träge an.
- Häufige Verbindungsabbrüche oder ein Abbruch, der den Gast ratlos zurücklässt.
- Erklärungsbedarf beim Beitreten: Ein Neunjähriger soll den Code vom iPad ablesen und am Handy eingeben können.

## Rahmenbedingungen

- Alle Regeln aus AGENTS.md: keine ES-Module, kein Bundler, kein npm, `file://` muss weiter laufen, ältere Safari-Versionen (iOS) sollen laufen, die Ladereihenfolge in `index.html` und `tests/index.html` bleibt identisch.
- **Spielstand-Kompatibilität:** Neue Felder (Figurname, Figur-ID, Positionen der Gastfiguren) werden beim Laden mit Standardwert nachgezogen. Alte Speicherstände dürfen nie brechen. Das Einzelspiel ohne Raum funktioniert unverändert.
- **Kindgerecht** wie bisher, auch im PvP: keine Strafe, kein Blut.
- Test-Vorschau und Live teilen sich `localStorage`. Zerstörende Tests nur per `file://` oder `localhost`.

## Technische Entscheidungen

- **Verbindung:** WebRTC-Datenkanäle über **PeerJS**. Die Bibliothek wird als einzelne unveränderte Datei in `js/lib/` eingecheckt (UMD-Build, wie three.js). Die Vermittlung läuft über die kostenlose PeerJS-Cloud (aus der Roadmap). Für die Vermittlung brauchen alle Geräte Internet, danach laufen die Daten im WLAN direkt zwischen den Geräten.
- **Austauschbare Verbindungsschicht:** Die Spiellogik spricht nur mit einer eigenen Schnittstelle (z. B. `SC.Netz`: Raum öffnen, beitreten, senden, empfangen, Ereignisse für Verbinden und Trennen). PeerJS steckt dahinter als ein Adapter. Für die Tests gibt es einen Adapter im Speicher, der auch Verzögerung und Abbrüche simuliert. Ein späterer Tausch gegen Trystero, Firebase oder einen TURN-Weg betrifft nur den Adapter.
- **Raumcode → Peer-ID:** Aus Wort und Zahl wird eine feste Peer-ID mit Spielpräfix (z. B. `spacecraft-mond-47`). Ist die ID schon vergeben, würfelt der Gastgeber einen neuen Code. Die Wortliste umfasst etwa 20–30 kurze, gut vorlesbare deutsche Weltraumwörter ohne Umlaute, die Zahl reicht von 10 bis 99. **[Claude]**
- **Wer rechnet was:**
  - **Gastgeber:** Blockänderungen, Tageszeit, Gegner (KI, Auftauchen, Geschosse), Treffer auf Gegner, Beute würfeln, Kisten, Erfahrung vergeben.
  - **Jeder Gast:** eigene Bewegung, eigener Rucksack, eigene Ausrüstung, eigene Lebenspunkte und Schild. Treffer von Gegnern meldet der Gastgeber, der Gast verrechnet sie mit seiner Ausrüstung.
  - **Angriffe der Gäste** gehen als „Treffer auf Gegner X“ an den Gastgeber. Abbauen und Setzen gehen als Wunsch an den Gastgeber, der sie an alle verteilt.
  - **Beute:** Der Gastgeber würfelt einmal und schickt dieselben Gegenstände an jeden Spieler in der Nähe. Die Beutekugeln sind pro Spieler.
- **Welt beim Gast:** Der Gast erzeugt das Gelände selbst aus dem Seed (der Generator ist deterministisch). Vom Gastgeber bekommt er nur die geänderten Chunks, den Zustand von Kisten und Bauwerken sowie die laufenden Änderungen. So bleibt der Datenverkehr klein.
- **Gleiche Spielversion:** Beim Beitreten werden die Versionen verglichen. Passen sie nicht, erscheint eine freundliche Meldung (z. B. „Bitte beide Geräte aktualisieren“) statt eines kaputten Spiels.
- **Menüs im gemeinsamen Spiel:** Die Welt steht nicht mehr still, wenn ein Spieler ein Menü oder den Rucksack öffnet, weil die anderen weiterspielen. Wer ein Menü offen hat, wird von Gegnern nicht angegriffen. **[Claude]**
- **Was in die eigene Welt des Gastes zurückgeschrieben wird:** nur die Figurwerte (Stufe, Erfahrung, Lebenspunkte, Schild, Rucksack, Ausrüstung, beide Schnellleisten, Name, Figur-ID). Position und Blick in seiner eigenen Welt bleiben unverändert, denn Koordinaten aus der Welt des Gastgebers wären dort sinnlos. Die Position in der Welt des Gastgebers speichert der Gastgeber pro Figur-ID. **[Claude]**
- **Speichern beim Gastgeber:** Wie bisher alle 30 Sekunden sowie beim Verbergen oder Schließen der Seite (`visibilitychange`, `pagehide`). Zusätzlich wird gespeichert, sobald ein Gast beitritt oder den Raum verlässt. Gehen beim Sperren des iPads ein paar Sekunden verloren, ist das hinnehmbar. **[Claude]**
- **Direkte Verbindung im WLAN:** PeerJS bringt standardmäßig öffentliche STUN-Server mit. Die bleiben eingeschaltet, eigene ICE-Server gibt es nicht. Kommt trotz Vermittlung keine direkte Verbindung zustande (Gäste-WLAN, abgeschottete Geräte), erscheint ein klarer Hinweis: „Keine direkte Verbindung möglich – seid ihr im selben WLAN? Gäste-WLANs blockieren das manchmal.“ Ein TURN-Dienst kommt erst mit dem Internet-Ausbau. **[Claude]**
- **Versionsvergleich:** Verglichen wird eine eigene Protokollnummer der Netzschicht, die nur bei inkompatiblen Änderungen am Protokoll oder am Spielstand steigt, nicht die volle Spielversion `V`. So blockiert nicht jede Fehlerbehebung das gemeinsame Spiel. Passt die Nummer nicht, erscheint die Meldung, dass das ältere Gerät aktualisiert werden muss (PWA neu laden). **[Claude]**
- **Beutekugeln pro Spieler:** Sie verhalten sich wie in Stufe 2 und verschwinden nach 5 Minuten, wenn niemand sie aufhebt. Bei vollem Rucksack bleiben sie liegen. Verlässt ein Spieler den Raum, verfallen seine liegenden Kugeln. Das ist dasselbe Verhalten wie bisher, wenn man weggeht, und kein neuer Verlust. **[Claude]**
- **Gegner wählen ihr Ziel** unter allen Spielern, z. B. den nächsten sichtbaren. Spieler im Zuschauermodus werden ignoriert, wie bisher. **[Claude]**
- **Vorbereitung im Code:** `SC.Spieler` hat bereits keine Einzelspieler-Annahme (eigene ID). Gegner, Geschosse und Beutekugeln liegen schon in `welt.wesen`, Blockänderungen laufen über `setzeBlock`. Darauf baut die Stufe auf.

## Was dem Planer überlassen ist

- Nachrichtenformat und Takt (z. B. Positionen 10–20 Mal pro Sekunde), Glättung der Mitspieler.
- Wie geänderte Chunks und Wesen beim Beitreten übertragen werden (Stückelung, Kompression).
- Genaue Gestaltung der Menüs im Stil der bestehenden Oberfläche, Touch- und Gamepad-Bedienung der Codeeingabe.
- Palette der Spielerfarben, Aussehen des Namensschilds.
- Aufteilung in Aufgaben und Issues.

## Prüfen

- Automatische Tests mit dem simulierten Netz-Adapter: Beitreten, Blockänderung bei allen, Treffer und Beute pro Spieler, Figur wird beim Gast zurückgespeichert, ohne seine Welt anzufassen, Neuverbinden, Abbruch des Gastgebers, Versionskonflikt, alte Spielstände ohne Figurnamen.
- Echte Verbindung: zwei Browserfenster (oder Chrome und ein zweites Profil) über die PeerJS-Cloud, gesteuert per DevTools.
- Abschluss durch den Nutzer auf iPad, Handy und Laptop im selben WLAN über die Test-Vorschau. Achtung: Die Vorschau teilt sich den Speicher mit der Live-Seite, also nur mit echten Welten spielen und nichts löschen.
