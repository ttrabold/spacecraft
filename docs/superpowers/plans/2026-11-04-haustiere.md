# Haustiere – Umsetzungsplan

> **Für Agenten:** Pflicht-Skill: superpowers:subagent-driven-development (empfohlen) oder superpowers:executing-plans, Aufgabe für Aufgabe. Schritte mit Checkbox (`- [ ]`).

**Ziel:** Wildtiere je Planet, Fang mit Netz und Zielring, Käfig mit 18 Plätzen, bis zu 3 Begleiter, die folgen und mitkämpfen, Streicheln/Füttern, Namen und Stufen – auch im Mehrspieler.

**Architektur:** Tiere sind eine neue Wesenart `"tier"` in `welt.wesen` (neben `gegner`, `geschoss`, `kugel`). Der dauerhafte Zustand jedes gefangenen Tieres liegt im Käfig der Figur (`kampf.kaefig`, gespeichert in `daten.spieler.kaefig`); ein draußen laufendes Tier ist nur ein Wesen mit Verweis `tierId`, das der Gastgeber (bzw. Einzelspieler) rechnet. Ein eigener Spielschritt `S._tiere` läuft in jedem Modus außer Zuschauer und nicht im All.

**Technik:** Klassische Skripte unter `SC`, three.js r158, Tests in `tests/` (Browser, `bash scripts/tests.sh <Text>`).

**Spec:** `docs/superpowers/specs/2026-11-04-haustiere-design.md` (Issue #154)

## Globale Vorgaben

- Keine ES-Module, kein npm; jede neue Datei in **beide** Ladelisten (`index.html` und `tests/index.html`) an derselben Stelle; neue Testdateien in die Testliste von `tests/index.html`.
- Ältere Safari-Versionen: kein `?.`, kein `??`, keine Klassenfelder.
- Spielstand: `daten.spieler.kaefig` beim Laden mit `[]` nachziehen; alte Stände laden unverändert.
- Kindgerecht: kein Tod, freundliches Verpuffen (Funken wie bei Gegnern), kein Blut.
- Texte deutsch in `SC.T`; Kommentare und Commits deutsch; Commits mit `Refs #154` (letzter mit `Fixes #154`).
- Feste Werte aus der Spec: max. **3** Tiere draußen je Spieler; Käfig **18** Plätze; Streicheln **120 s**, Füttern **300 s**, K.o.-Erholung **60 s**, alle in Spielzeit (Restdauer wird gespeichert); Treffer im Zielring: gewöhnlich **1**, selten **2**, sehr selten **3**.
- Netzprotokoll `SC.NETZ_PROTOKOLL` 7 → **8**.
- Version am Ende: `var V="0.24.0"` in `index.html`.

## Review-Schwerpunkte

1. Spielstand ohne `kaefig` (alle bisherigen) lädt; Tiere, die beim Speichern draußen waren, kommen nach dem Laden wieder heraus (Aufgabe 2, 7).
2. Verbindungsabbruch, während Tiere eines Gastes draußen sind: kein Tier und keine Erfahrung geht verloren (Aufgabe 10).
3. Fangversuch, wenn der Käfig voll ist, oder ein zweiter Spieler dasselbe Tier fangen will (Aufgabe 6, 10).
4. Tier läuft in Lava/Wasser oder steckt fest → erscheint neben dem Besitzer, nimmt keinen Lava-Schaden (Aufgabe 7).
5. Angriffe des Spielers (Hieb, Schuss, Funkenhieb) treffen weder Wildtiere noch Haustiere (Aufgabe 4).

---

### Aufgabe 1: Tiertabelle und Tierwerte

**Dateien:**
- Neu: `js/tiere.js` (nach `js/gegner.js` laden)
- Test: `tests/test-tiere.js`

**Schnittstellen:**
- Erzeugt: `SC.TIERE[art] = { planet, seltenheit (0|1|2), stil ("nah"|"fern"|"ablenker"|"robust"|"flieger"), lp(stufe), schaden(stufe), tempo, breite, hoehe, namen: [..], modell: [Teile wie SC.GEGNER] }` für die 15 Arten der Spec: `hase, frosch, katze, hund, fuchs, eule, igel` (planet `start`), `pinguin, schneefuchs, glutsalamander, eisbaer` (`glutfrost`), `chamaeleon, schildkroete, leuchtkaefer, affe` (`rankenmoor`). Seltenheit: hase, frosch, pinguin, chamaeleon 0; eule, glutsalamander, leuchtkaefer 2; Rest 0 oder 1 nach Wahl.
- `SC.Tier.neu(art, zf) → { id: string, art, name, stufe: 1, erfahrung: 0, lp, draussen: false, koRest: 0, staerke: null }` (`id` zufällig wie `neueId` in `js/spielstand.js`, Name aus `namen`).
- `SC.Tier.werte(tier) → { lpMax, schaden }` inkl. Stärkung (`staerke = { art: "streicheln"|"fuettern", rest: Sekunden }`; Faktoren dem Umsetzer, Füttern > Streicheln).
- `SC.Tier.staerken(tier, art)` setzt `staerke` auf 120 bzw. 300 s (ersetzt, stapelt nicht); `fuettern` heilt zusätzlich auf `lpMax`.
- `SC.Tier.zeit(tier, dt)` zählt `staerke.rest` und `koRest` herunter (bei 0: `staerke = null`, nach K.o. `lp = lpMax`).
- `SC.Tier.gibErfahrung(tier, xp, besitzerStufe) → Zahl der Aufstiege`; Stufe nie über `besitzerStufe`, Erfahrung wird weiter gesammelt (Kurve `SC.Werte.erfahrungFuer`).
- `SC.Tier.arten(planetId) → [art]`.

- [ ] **Schritt 1: Tests schreiben** (`tests/test-tiere.js`):
  - „Tiertabelle: jede Art hat Planet, Stil, Modell und Namen“ – für alle 15 Arten `wahr(def.modell.length && def.namen.length && ["start","glutfrost","rankenmoor"].indexOf(def.planet)>=0)`; `gleich(SC.Tier.arten("glutfrost").sort().join(), "eisbaer,glutsalamander,pinguin,schneefuchs")`.
  - „Stärkung: Streicheln 120 s, Füttern 300 s, ersetzt statt zu stapeln“ – `staerken(t,"streicheln")` → `rest 120`; `werte(t).schaden > werte(ohne).schaden`; `staerken(t,"fuettern")` → `rest 300`, `art "fuettern"`; `zeit(t,300)` → `staerke === null`.
  - „Füttern heilt“ – `t.lp = 1; staerken(t,"fuettern")` → `t.lp === werte(t).lpMax`.
  - „K.o.-Erholung nach 60 s“ – `t.koRest = 60; t.lp = 0; zeit(t,59)` → `koRest > 0`; `zeit(t,1)` → `koRest 0`, `lp === lpMax`.
  - „Tierstufe nie über der Besitzerstufe“ – `gibErfahrung(t, 1e6, 3)` → `t.stufe === 3`; danach `gibErfahrung(t, 0, 5)` → `t.stufe > 3`.
- [ ] **Schritt 2:** `bash scripts/tests.sh Tier` → schlägt fehl (`SC.TIERE` fehlt).
- [ ] **Schritt 3:** `js/tiere.js` umsetzen, in beide Ladelisten.
- [ ] **Schritt 4:** `bash scripts/tests.sh Tier` → alle ok.
- [ ] **Schritt 5:** Commit „Haustiere: Tiertabelle und Tierwerte; Refs #154“.

### Aufgabe 2: Käfig und Spielstand

**Dateien:**
- Ändern: `js/tiere.js` (Käfig), `js/kampf.js` (Konstruktor: `this.kaefig`), `js/spielstand.js` (`FIGUR_FELDER`, Laden, Speichern bei Zeile ~55)
- Test: `tests/test-tiere.js`

**Schnittstellen:**
- `SC.Kaefig = function(plaetze)`; `SC.Kaefig.GROESSE = 18`, `SC.Kaefig.DRAUSSEN = 3`.
- `lege(tier) → bool` (false, wenn voll), `tier(id) → tier|null`, `draussen() → [tier]`, `rauslassen(id) → "ok"|"voll"|"ko"` (max 3; K.o. nicht), `zurueck(id)`, `freilassen(id)`, `umbenennen(id, name)` (getrimmt, 1–16 Zeichen, sonst unverändert), `alsDaten() → [tier|null] (Länge 18)`.
- `kampf.kaefig` (aus `daten.spieler.kaefig`); `SC.Spielstand.FIGUR_FELDER` enthält `"kaefig"`; Laden zieht `kaefig` als leeres Array nach; Speichern schreibt `kampf.kaefig.alsDaten()`.

- [ ] **Schritt 1: Tests**
  - „Käfig: 18 Plätze, voll lehnt ab“ – 18× `lege` true, 19. false.
  - „Käfig: höchstens 3 draußen, K.o. nicht“ – 4 Tiere, `rauslassen` 3× `"ok"`, 4. `"voll"`; Tier mit `koRest>0` → `"ko"`.
  - „Umbenennen: leer oder zu lang bleibt“ – `umbenennen(id,"  ")` → Name unverändert; `"Flocke"` → gesetzt.
  - „Alter Spielstand ohne Käfig lädt“ – Spielstand ohne `kaefig` laden (wie bestehende Ladetests in `tests/test-spielstand.js`) → `daten.spieler.kaefig` ist Array; `new SC.Kampf(...)` hat `kaefig.alsDaten().length === 18`.
  - „Käfig reist mit der Figur“ – Tier in `kaefig`, speichern, Figur exportieren/übernehmen (wie bestehender Figur-Test) → Tier mit gleichem Namen und `draussen`.
- [ ] **Schritt 2:** `bash scripts/tests.sh Käfig` → Fehlschlag.
- [ ] **Schritt 3:** Umsetzen.
- [ ] **Schritt 4:** `bash scripts/tests.sh Käfig` und `bash scripts/tests.sh Spielstand` → ok.
- [ ] **Schritt 5:** Commit.

### Aufgabe 3: Netz und Tierfutter

**Dateien:**
- Ändern: `js/gegenstaende.js` (Netz), `js/bloecke.js` (Block `TIERFUTTER` als Material wie `CHITIN`, nicht setzbar wie dieser), `js/texturen.js` (Kachel), `js/crafting.js` (zwei Rezepte, Tierfutter in `SC.CRAFTING_MATERIALIEN` nicht nötig), `js/kampf.js`, `js/survival.js`, `js/ui-rucksack.js` (Bild des Netzes), `js/texte.js`
- Test: `tests/test-tiere.js`, `tests/test-spiel.js`

**Schnittstellen:**
- `SC.GEGENSTAENDE.netz = { platz: "werkzeug", haupt: {} }`; Rezept `gegenstand`-artig oder eigener Typ (Netz ohne Metall/Kristall; Kosten z. B. 2 Wolle + 2 Bretter, dem Umsetzer überlassen); Rezept `tierfutter` (`bauteil`, z. B. 2 Blätter + 1 Leuchtpilz → 4).
- `K.netz() → gegenstand|null` (gehaltener Schnellleistenplatz ist ein Netz).
- Abbauen: `S.abbauFortschritt` und `S.abbauAnteil` behandeln `k.netz()` wie `k.waffe()` (kein Abbau, kein Riss).
- Angriffstaste mit Netz löst nur `S._fangVersuch()` aus (Aufgabe 6); vorher kein Hieb.
- Automatisches Anlegen und Menü „Anlegen“ im Rucksack bieten das Netz nicht an (Menü wie bei Waffe: „In die Schnellleiste …“ ab Platz 9).

- [ ] **Schritt 1: Tests**
  - „Netz und Tierfutter an der Werkbank“ – Rezepte `netz`, `tierfutter` existieren; Herstellen mit passenden Rohstoffen legt Netz bzw. 4× `SC.B.TIERFUTTER` in den Rucksack (wie bestehende Crafting-Tests).
  - „Mit dem Netz in der Hand wird nicht abgebaut“ – wie Test „Mit Waffe kämpft die Angriffstaste nur …“ in `tests/test-spiel.js`, Netz statt Waffe: `abbauFortschritt` → false, `abbauAnteil` → 0.
  - „Netz ist keine Waffe“ – `k.waffe() === null`, `k.netz()` ist das Netz; Rucksack-Menü am Netz ab Platz 9 = `"leiste,verschieben,wegwerfen,abbrechen"`.
- [ ] **Schritt 2–4:** Fehlschlag sehen, umsetzen, `bash scripts/tests.sh Netz` ok, ganze Seite ok.
- [ ] **Schritt 5:** Commit.

### Aufgabe 4: Wildtiere: Auftauchen, Umherstreifen, Spielschritt

**Dateien:**
- Neu: `js/haustiere.js` (nach `js/raumflug.js` laden: Spiel-Teil der Tiere, `S._tiere`)
- Ändern: `js/wesen.js` (`GRENZE.tier`), `js/ki.js` (`SC.KI.tier`), `js/auftauchen.js` (`A.tiere`), `js/spiel.js` (Aufruf von `_tiere` im Planetenzweig bei Zeile ~207, nach `_survival`, in jedem Modus)
- Test: `tests/test-tiere.js`

**Schnittstellen:**
- Wildtier-Wesen: `SC.Wesen.neu(welt, "tier", { tierArt, wild: true, pos, heim, breite, hoehe })`; `SC.Wesen.GRENZE.tier` (z. B. 12).
- `A.tiere(spieler, tageslicht)` (einmal je Sekunde wie `A.schritt`): Tiere des Planeten (`SC.Tier.arten`) 20–40 Blöcke um Spieler auf festem Boden über dem Meer, nicht in Lava/Wasser; tagsüber mehr (Obergrenze halbiert bei Nacht); entfernt wilde Tiere über 80 Blöcke von allen Spielern; seltene Arten seltener (Gewicht nach Seltenheit).
- `SC.KI.tier(welt, e, ctx, dt, zf) → [aktion]`: für `wild`: umherstreifen, stehen bleiben, Abstand < 3 zum Spieler → kurz weghoppeln; nie in Lava/Wasser (Schritt verwerfen); `e.haeltStill` (Fang) → keine Bewegung.
- `S._tiere(dt, offen)` in `js/haustiere.js`: Gast rechnet nichts (gespiegelt); sonst einmal je Sekunde `auftauchen.tiere`, jedes Bild `SC.KI.tier` für alle `art === "tier"`. Zuschauer: kein Auftauchen. Im Modus „Friedlich“ trotzdem Tiere.
- Spielerangriffe treffen keine Tiere: `SC.Geschoss.schritt` und `K.hiebZiele` filtern schon auf `art === "gegner"` – Test sichert das ab.

- [ ] **Schritt 1: Tests**
  - „Wildtiere tauchen auf dem eigenen Planeten auf“ – Welt `start`, `A.tiere(spieler, 1)` mehrmals → mindestens ein `art "tier"`, alle `tierArt` aus `SC.Tier.arten("start")`; keines über `GRENZE.tier`.
  - „Wildtiere verschwinden in der Ferne“ – Tier 100 Blöcke weg, `A.tiere` → entfernt.
  - „Wildtier läuft nicht in Lava“ – Tier neben Lava-Block, 200 Schritte `SC.KI.tier` → nie in einer Lava-Zelle.
  - „Hieb und Schuss gehen durch Tiere“ – Tier direkt vor dem Spieler: `k.hiebZiele({reichweite:3})` leer; Spielergeschoss durch das Tier → kein `treffer "wesen"`.
- [ ] **Schritt 2–4:** Fehlschlag, umsetzen, `bash scripts/tests.sh Wildtier` und `bash scripts/tests.sh Hieb` ok.
- [ ] **Schritt 5:** Commit.

### Aufgabe 5: Tiere zeichnen

**Dateien:**
- Ändern: `js/render-wesen.js` (`_modell` für `tier`, Namensschild, Halsband in Besitzerfarbe, Herzchen/Sterne-Funken), `js/survival.js` bzw. `js/haustiere.js` (Aufrufe)
- Test: `tests/test-tiere.js`

**Schnittstellen:**
- `RW._tierModell(e)` aus `SC.TIERE[e.tierArt].modell`; leuchtende Teile (Glutsalamander, Leuchtkäfer) wie `leuchtet` bei Gegnern; Chamäleon wechselt langsam die Farbe.
- Schild über Haustieren: Name und Stufe (wie Gegnerschild, ohne LP-Balken bei vollen Leben); Wildtiere ohne Schild.
- `e.halsband` (Farbe des Besitzers; Farbe aus der Mitspielerfarbe in `js/render-mitspieler.js`, sonst Gelb).
- `render.wesen.herzen(pos)` (Streicheln/Füttern) und Sterne beim Fang über die vorhandenen `funken`.

- [ ] **Schritt 1: Test** „Tiermodell wird gebaut und entfernt“ – `RW.bild` mit einem Tier-Wesen erzeugt ein Objekt (`objekte.has(id)`), nach Entfernen weg (wie vorhandener Wesen-Rendertest; ohne WebGL wie dort).
- [ ] **Schritt 2–4:** Fehlschlag, umsetzen, ok. Im Browser (`file://`, Entwicklerpanel F3) jede Art einmal ansehen; Screenshot an den Nutzer.
- [ ] **Schritt 5:** Commit.

### Aufgabe 6: Fangen mit dem Zielring

**Dateien:**
- Neu: `js/fang.js` (reine Logik, nach `js/tiere.js` laden); Ring-Overlay `SC.UI.prototype.fangRing` in `js/ui-rucksack.js` (HUD-Teil wie `kampfHud`)
- Ändern: `js/haustiere.js` (`S._fangVersuch`, `S._fangBild`), `js/survival.js` (Angriffstaste mit Netz; nur Survival – Kreativ bekommt Tiere aus der Blockauswahl, Aufgabe 9)
- Test: `tests/test-tiere.js`

**Schnittstellen:**
- `SC.Fang = function(seltenheit)`: `treffer` (1/2/3 nach Seltenheit), `schritt(dt) → "laeuft"|"daneben"` (Ring läuft von 1 auf 0; unter der grünen Zone ohne Druck = daneben), `druecken() → "treffer"|"daneben"|"gefangen"`, `ring` (0–1), `zone` ([von, bis]); jede weitere Runde schneller (Zeiten dem Umsetzer).
- `S._fangVersuch()`: Netz in der Hand, Wildtier in ≤ 4 Blöcken im Blick (Strahl gegen Tierquader mit `SC.Wesen.strecke`), nicht gesperrt (`e.fangVon`) → `this._fang = { fang, id }`, `e.haeltStill = true`, `e.fangVon = figurId`. Käfig voll → Hinweis `SC.T.kaefigVoll`, kein Start.
- Während `this._fang`: Bewegung und Blick gesperrt; **jede** der Eingaben `e.abbauen`, `e.springenNeu`, Touch-Tipp (über `e.abbauen` aus `js/touch.js`), Controller A (springen) zählt als `druecken()`.
- Ergebnis: `"daneben"` → Wildtier hoppelt 3–5 Blöcke weg, `fangVon` frei, Netz bleibt; `"gefangen"` → Wesen entfernt, `SC.Tier.neu` in den Käfig, Sterne-Funken, Klang `"aufsammeln"`, Hinweis `SC.T.neuGefangen.replace("{name}", artName)`.
- Overlay `ui.fangRing(zustand|null)` mit Ring, grüner Zone, Trefferzahl („1/2“).

- [ ] **Schritt 1: Tests**
  - „Zielring: Druck in der grünen Zone trifft, sonst daneben“ – `new SC.Fang(0)`, `schritt` bis `ring` in `zone` → `druecken() === "gefangen"`; frisch, sofort `druecken()` → `"daneben"`.
  - „Selten braucht zwei, sehr selten drei Treffer“ – `new SC.Fang(2)`: zwei Treffer → `"treffer"`, `"treffer"`, dritter `"gefangen"`.
  - „Ring verpasst = daneben“ – nur `schritt` bis Ende → `"daneben"`.
  - „Fang legt das Tier in den Käfig, Netz bleibt“ – Spiel-Attrappe wie `survSpiel()` in `tests/test-spiel.js`, Wildtier vor dem Spieler, Netz in der Hand: `_fangVersuch()`, dann bis „gefangen“ → Käfig hat 1 Tier, Wesen weg, Netz noch im Rucksack.
  - „Käfig voll: kein Fang, Hinweis“ – 18 Tiere im Käfig → `_fangVersuch()` startet nichts, Hinweis `SC.T.kaefigVoll`.
  - „Gesperrtes Tier kann kein zweiter fangen“ – `e.fangVon = "andere"` → `_fangVersuch()` startet nichts.
- [ ] **Schritt 2–4:** Fehlschlag, umsetzen, `bash scripts/tests.sh Fang` ok; im Browser mit Maus, Touch-Emulation und simuliertem Controller je einmal fangen.
- [ ] **Schritt 5:** Commit.

### Aufgabe 7: Begleiter: Rauslassen, Folgen, Zustände

**Dateien:**
- Ändern: `js/haustiere.js`, `js/ki.js` (`SC.KI.tier` für Begleiter), `js/spiel.js`/`js/fahren.js`/`js/raumflug.js`/`js/kampf.js` nur an den Übergängen (Einsteigen, Aussteigen, Planetenwechsel, Wiederbeleben, Moduswechsel)
- Test: `tests/test-tiere.js`

**Schnittstellen:**
- `S._tierRaus(tierId)` / `S._tierRein(tierId)`: Käfig-Zustand (`draussen`) und Wesen (`SC.Wesen.neu(welt, "tier", { tierArt, tierId, besitzer: figurId, halsband, name, stufe, lp, lpMax })`) in einem Schritt. Wesen eines Begleiters gehört nicht zu `GRENZE.tier` (eigene Zählung über `besitzer`).
- `S._tiereAbgleichen()`: Für jedes Käfigtier mit `draussen` ohne Wesen → Wesen neben dem Besitzer; Wesen ohne passendes Käfigtier → entfernen. Aufrufen beim Spielstart (nach dem Laden), nach Aussteigen, nach der Landung auf einem Planeten, nach Wiederbeleben, nach Moduswechsel weg von Zuschauer.
- Vorübergehend im Käfig (Wesen weg, `draussen` bleibt true): im Fahrzeug, im All, im Zuschauermodus. `_tiereAbgleichen` erzeugt in diesen Lagen keine Wesen.
- Folgen (`SC.KI.tier`, Begleiter ohne Ziel): 2–4 Blöcke hinter dem Besitzer; Abstand > 24, feststeckend > 3 s, in Lava/Wasser oder Höhe < 1 → neben den Besitzer setzen. Kein Lava-Schaden. Schlafen: Begleiter zählen nicht als Gegner in der Nähe (`js/betten.js` prüft nur `gegner`).
- Speichern: Stand der Wesen (lp) vor dem Speichern in den Käfig zurückschreiben (`S._tiereSichern()`), damit `alsDaten` aktuell ist.
- Zeit: `SC.Tier.zeit` für alle Käfigtiere je Bild mit `dt` (Spielzeit; Pause/Menü ohne Raum = stillstehende Welt → nicht zählen).

- [ ] **Schritt 1: Tests**
  - „Rauslassen erzeugt ein folgendes Wesen, Zurückholen entfernt es“ – `_tierRaus` → ein `art "tier"` mit `tierId`; Besitzer 10 Blöcke weg, 5 s Schritte → Abstand < 5; `_tierRein` → Wesen weg, `draussen false`.
  - „Draußen gewesene Tiere kommen nach dem Laden wieder heraus“ – Käfigtier mit `draussen: true`, `_tiereAbgleichen()` → Wesen da.
  - „Im Fahrzeug warten die Tiere im Käfig“ – einsteigen → keine Tier-Wesen, `draussen` bleibt true; aussteigen → Wesen wieder da.
  - „Zu weit weg oder in Lava: neben den Besitzer“ – Wesen 40 Blöcke weg bzw. in Lava → nach `SC.KI.tier` nahe Besitzer, `lp` unverändert.
  - „Besiegt: Tiere kommen zum Wiedereinstieg mit“ – Spieler wiederbelebt an anderer Stelle → Tier-Wesen nahe neuer Position.
- [ ] **Schritt 2–4:** Fehlschlag, umsetzen, ok.
- [ ] **Schritt 5:** Commit.

### Aufgabe 8: Begleiter kämpfen, Gegner greifen sie an, K.o., Erfahrung

**Dateien:**
- Ändern: `js/ki.js` (Kampfstile im `SC.KI.tier`), `js/haustiere.js`, `js/survival.js` (Gegner-Ziele, Geschosse), `js/raum.js` (`SC.Raum.zielFuer` bleibt; Ziele erweitern), `js/kampf.js`
- Test: `tests/test-tiere.js`

**Schnittstellen:**
- Ziel eines Begleiters: nächster Gegner in ≤ 16 Blöcken um den **Besitzer**, der `bemerkt` ist oder den Besitzer zuletzt getroffen hat oder den der Besitzer getroffen hat; nie Spieler, auch nicht im Spaßkampf.
- `SC.KI.tier` liefert Aktionen wie Gegner: `{ art: "hieb", ziel: id, schaden }` (nah/robust/ablenker), `{ art: "schuss", ... team: "tier" }` (fern; Geschoss trifft nur Gegner, Farbe je Art), Flieger wie fern aus der Luft. Ablenker: läuft schnell um das Ziel; Gegner in 6 Blöcken nehmen den Ablenker bevorzugt als Ziel.
- Schaden an Gegnern über `k.trifftGegner` bzw. im Raum über den Gastgeber; besiegt → `S.besiege(g)`; Erfahrung: Tiere des Besitzers in 24 Blöcken bekommen dieselbe Erfahrung wie der Spieler (`SC.Tier.gibErfahrung(t, xp, besitzerStufe)`). Damit Tiere nicht alles allein erledigen: Tierschaden insgesamt deutlich unter dem Spielerschaden derselben Stufe (Werte dem Umsetzer; Richtwert ≤ 40 % je Tier).
- Gegner als Ziel: Ziele-Liste der Gegner-KI enthält Begleiter (`{ id: "tier:" + wesenId, pos, sichtbar: true }`) – auch im Einzelspieler (dann `SC.Raum.zielFuer` mit Spieler + Begleitern statt `zielSp`). Hieb/Stampfen gegen ein Tierziel → `S._tierTreffer(e, schaden)`; Gegner-Geschosse prüfen Begleiter-Quader zusätzlich.
- K.o.: `lp ≤ 0` → Funken „zerfall“, Wesen weg, Käfigtier `lp 0`, `koRest 60`, `draussen false`, Hinweis `SC.T.tierKo` („{name} ruht sich im Käfig aus“).

- [ ] **Schritt 1: Tests**
  - „Begleiter greift den Gegner an, der den Besitzer angreift“ – Gegner bemerkt den Spieler 4 Blöcke entfernt, Hund draußen, 3 s Schritte → Gegner-`lp` gesunken.
  - „Begleiter greift Mitspieler nie an“ – im Raum mit PvP an, Mitspieler 2 Blöcke vor dem Hund, keine Gegner → kein Treffer auf den Mitspieler.
  - „Gegner trifft das Tier; K.o. zurück in den Käfig“ – Gegner-Hieb gegen Tierziel bis 0 → kein Wesen, `koRest 60`, `rauslassen` → `"ko"`.
  - „Tiere bekommen Erfahrung beim Besiegen“ – Gegner besiegt mit Hund in der Nähe → `tier.erfahrung > 0`.
- [ ] **Schritt 2–4:** Fehlschlag, umsetzen, ok; im Browser einen Kampf mit 3 Tieren ansehen (Leistung: FPS-Anzeige im Statusfeld).
- [ ] **Schritt 5:** Commit.

### Aufgabe 9: Streicheln, Füttern, Käfig-Panel, Kreativ

**Dateien:**
- Neu: `js/ui-kaefig.js` (nach `js/ui-werkbank.js` laden)
- Ändern: `js/haustiere.js` (Streicheln/Füttern), `js/survival.js` (Benutzen-Taste auf ein Tier vor `benutzeBlock`), `js/ui-rucksack.js` (Knopf „Käfig“ neben „Handwerk“), `js/eingabe.js` (`KeyK: "kaefig"`), `js/spiel.js` (Taste öffnet Panel), `js/ui.js` (Blockauswahl: Reiter „Tiere“ im Kreativmodus, wie Reiter „Ausrüstung“), `js/texte.js`
- Test: `tests/test-tiere.js`, `tests/test-ui-kaefig.js`

**Schnittstellen:**
- `S._tierBenutzen(e)`: eigenes Begleiter-Wesen im Blick (≤ 4 Blöcke) + `e.setzen` → mit `SC.B.TIERFUTTER` in der Hand: 1 entnehmen, `staerken(t,"fuettern")`; sonst `staerken(t,"streicheln")`. Herzchen + Klang. Fremde Tiere und Wildtiere: nichts.
- `ui.zeigeKaefig(kaefig, o)` mit `o.beiRaus(id)`, `o.beiRein(id)`, `o.beiUmbenennen(id, name)`, `o.beiFreilassen(id)`, `o.beiFertig()`: Seitenpanel (`fenster panel seite`), 18 Plätze (Zone `raster`, Bild = kleines Modellbild oder Tier-Emoji je Art), Info-Zeile mit Name, Art, Stufe, Leben, Stärkung (Restzeit), K.o.-Rest; Aktionsmenü am Platz wie Rucksack (`.rs-menue exklusiv`): „Rauslassen“/„Zurückholen“, „Umbenennen“ (Texteingabe in der Menüzeile, Bestätigen/Abbrechen), „Freilassen“ (Rückfrage „Wirklich freilassen?“ Ja/Nein; nie erste Aktion), „Abbrechen“. B/Esc schließen erst das Menü. Hinweis bei `"voll"`/`"ko"`.
- Kreativ: Reiter „Tiere“ in der Blockauswahl listet alle Arten; Antippen legt `SC.Tier.neu` in den Käfig (Hinweis bei voll).
- Hilfe: `SC.T.steuerHilfe`/Touch-Beschriftung: mit Netz „Fangen“ auf der Angriffstaste; vor eigenem Tier „Streicheln“/„Füttern“ auf Benutzen.

- [ ] **Schritt 1: Tests**
  - „Streicheln stärkt 120 s, Füttern verbraucht Futter und stärkt 300 s“ – eigenes Begleiter-Wesen vor dem Spieler: `_tierBenutzen` leere Hand → `staerke.rest 120`; mit 2 Futter in der Hand → `rest 300`, 1 Futter übrig.
  - „Fremdes Tier oder Wildtier: Benutzen tut nichts“.
  - „Käfig-Panel: Menü je Zustand“ – drinnen `"raus,umbenennen,freilassen,abbrechen"`, draußen `"rein,umbenennen,freilassen,abbrechen"`; `freilassen` nie zuerst.
  - „Freilassen fragt nach“ – Freilassen → Rückfrage; Nein → Tier bleibt; Ja → Platz leer.
  - „Umbenennen im Panel“ – Eingabe „Flocke“ bestätigen → `o.beiUmbenennen(id,"Flocke")`.
  - „Rucksack hat einen Knopf zum Käfig“ – `[data-aktion="kaefig"]` öffnet `zeigeKaefig`; „Zurück“ führt in den Rucksack.
  - „Kreativ: Tier aus der Blockauswahl in den Käfig“.
- [ ] **Schritt 2–4:** Fehlschlag, umsetzen, `bash scripts/tests.sh Käfig` ok; im Browser bei 1180×820 mit Touch-Emulation und Controller (Zonen, Menü, B) prüfen.
- [ ] **Schritt 5:** Commit.

### Aufgabe 10: Mehrspieler

**Dateien:**
- Ändern: `js/netz.js` (Protokoll 8), `js/raum.js` (wesenListe/spiegleWesen-Felder, neue Nachrichten, Gast-Tiere im Zustand), `js/haustiere.js`, `js/survival.js`
- Test: `tests/test-mehrspieler.js`

**Schnittstellen:**
- Gast → Gastgeber im `zustand`: `tiere: [{ id, art, name, stufe, lp, lpMax, staerke }]` (nur draußen und nicht vorübergehend im Käfig). Gastgeber hält dazu Wesen mit `besitzer = Gast-figurId`; verschwindet ein Gast (getrennt, verlassen), entfernt er dessen Tier-Wesen.
- `SC.Raum.wesenListe` nimmt `art "tier"` mit `tierArt, tierId, besitzer, name, stufe, lp, lpMax, wild, halsband` auf; `FELDER` in `spiegleWesen` entsprechend; Breite/Höhe aus `SC.TIERE`.
- Gast → Gastgeber: `fangStart {id}` (Antwort `fangOk {id, ok}`; Gastgeber setzt `fangVon`), `fangEnde {id, gefangen}` (Gastgeber entfernt das Wesen bzw. gibt es frei; das Tier legt der Gast selbst in seinen Käfig), `tierBenutzen {tierId, art}` nur zur Anzeige (Herzchen) – die Stärkung rechnet der Besitzer im eigenen Käfig und schickt sie mit dem nächsten `zustand`.
- Gastgeber → Gast: `tierStand {tierId, lp, xp, ko}` (Treffer, Erfahrung, K.o.) – der Gast übernimmt in seinen Käfig (`gibErfahrung`, `lp`, bei `ko` wie Aufgabe 8).
- Endet die Verbindung (Gast oder Gastgeber), gilt Aufgabe 7: Wesen weg, Käfig unverändert, beim nächsten Spiel `_tiereAbgleichen`.
- Wildtiere rechnet nur der Gastgeber (Gast: `S._tiere` ohne Auftauchen/KI für gespiegelte Wesen).

- [ ] **Schritt 1: Tests** (mit den vorhandenen Raum-Attrappen in `tests/test-mehrspieler.js`)
  - „Gast-Tiere erscheinen beim Gastgeber und werden gespiegelt“ – Zustand mit `tiere` → Gastgeber-Welt hat Wesen mit `besitzer`; `wesenListe` → beim Gast `spiegleWesen` hat `art "tier"`, `name`.
  - „Gast getrennt: seine Tiere verschwinden beim Gastgeber, Käfig des Gastes unverändert“.
  - „Zwei Fänger: nur der erste bekommt fangOk“.
  - „tierStand übernimmt Erfahrung und K.o. in den Käfig des Gastes“.
  - `SC.NETZ_PROTOKOLL === 8`.
- [ ] **Schritt 2–4:** Fehlschlag, umsetzen, `bash scripts/tests.sh Mehrspieler` ok; zwei Browserfenster (PeerJS) wie in früheren Stufen: Fangen als Gast, Tiere beider Spieler sichtbar, Trennen.
- [ ] **Schritt 5:** Commit.

### Aufgabe 11: Abschluss: Anleitung, Entwickler, Version, Roadmap

**Dateien:**
- Ändern: `js/texte.js` (`SC.T.anleitung`: Fangen, Käfig, Streicheln/Füttern, Taste K), `docs/ANLEITUNG.md` (wie bisher aus `SC.T.anleitung` erzeugt), `js/entwickler.js` (Knopf „Tiere geben“: eins je Art des Planeten in den Käfig; „Netz und Futter geben“), `index.html` (`var V="0.24.0"`), `docs/ROADMAP.md`
- Test: ganze Testseite

- [ ] **Schritt 1:** Anleitung und Entwicklerknöpfe ergänzen; Test „Entwickler: Tiere geben füllt den Käfig“.
- [ ] **Schritt 2:** `bash scripts/tests.sh` → `Fertig: N ok, 0 fehlgeschlagen`.
- [ ] **Schritt 3:** Gesamtprüfung im Browser (`file://`): neue Welt Survival, Netz und Futter bauen, je Planet ein Tier fangen (F3 Planetenwechsel), 3 Tiere draußen, Kampf, K.o., Käfig, Fahrzeug, Speichern/Laden; Leistung (FPS) mit 12 Wildtieren und 3 Begleitern.
- [ ] **Schritt 4:** Version 0.24.0, ROADMAP-Stand, Devlog-Entwurf anbieten.
- [ ] **Schritt 5:** Commit „Haustiere; Version 0.24.0; Fixes #154“.
