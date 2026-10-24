# Stufe 3: Gemeinsam spielen – Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bis zu vier Spieler in einer Welt (Gastgeber + 3 Gäste) im selben WLAN, Beitritt per Raumcode „Wort Zahl“, gemeinsames Bauen und Kämpfen, Beute für jeden, Figur der Gäste wird auf ihrem eigenen Gerät gespeichert – als Version 0.6.0.

**Architecture:** Eine austauschbare Netzschicht (`SC.Netz`, Adapter PeerJS und Speicher-Adapter für Tests) trägt Nachrichten. `SC.Gastgeber` und `SC.Gast` (js/raum.js) sind reine Protokoll-Logik ohne DOM und three.js, mit Rückrufen ins Spiel. Der Gastgeber rechnet Welt, Gegner, Geschosse, Beute; jeder Gast rechnet eigene Bewegung, eigenen Rucksack, eigene Lebenspunkte und **eigene Beutekugeln** (Kugeln werden nie übertragen, nur „Beute X an Ort Y“). Gäste erzeugen das Gelände selbst aus dem Seed und bekommen nur geänderte Chunks.

**Tech Stack:** wie bisher (klassische Skripte, three.js r158, Web Audio) plus PeerJS 1.5.4 (UMD-Datei `js/lib/peerjs.min.js`, unverändert eingecheckt).

**Spec:** `docs/superpowers/specs/2026-10-24-stufe-3-gemeinsam-spielen-design.md`

## Global Constraints

- Alles aus AGENTS.md: keine Module, `file://` läuft, ältere Safari (iOS), Texte nur in `js/texte.js`, Ladereihenfolge in `index.html` und `tests/index.html` identisch, Version nur in `index.html`.
- Version am Ende: `var V="0.6.0"`.
- `SC.FORMAT` bleibt 2; neue Felder zieht `SC.Spielstand.migriere` mit Standardwert nach. Alte Stände dürfen nie brechen; Einzelspiel ohne Raum verhält sich unverändert.
- Protokollnummer `SC.NETZ_PROTOKOLL = 1` (steigt nur bei inkompatiblen Änderungen; verglichen wird sie, nicht `V`).
- Peer-ID: `"spacecraft-" + wort + "-" + zahl` (klein, z. B. `spacecraft-mond-47`); Anzeige `"MOND 47"`. Zahl 10–99. Wortliste (24, ohne Umlaute): `MOND STERN KOMET PLANET RAKETE SONNE NEBEL ORBIT LASER ROBOTER ALIEN KRATER METEOR GALAXIE STATION KAPSEL ASTRO NOVA PULSAR QUASAR RADAR SATURN VENUS MARS`.
- Höchstens 4 Spieler (Gastgeber + 3); ein vierter Gast bekommt `ablehnen` mit Grund `"voll"`.
- „In der Nähe“ = waagerechter Ringabstand ≤ 40 Blöcke zum besiegten Gegner bzw. zur Kiste. Erfahrung in voller Höhe an alle in der Nähe; Beute einmal gewürfelt, identisch an alle in der Nähe.
- Gegnerstärke unabhängig von der Spielerzahl.
- PvP Standard aus, gilt pro Raum (wird nicht gespeichert). Im PvP besiegt: kein Bildschirm, kurzer Hinweis, sofort am Startpunkt der Welt des Gastgebers, nichts geht verloren.
- Takte: Spielerzustand und Gegner-/Geschoss-Abgleich 15 Hz; Tageszeit 1 Hz; Gast speichert Figur alle 5 s und sofort bei Fund/Ausrüstungswechsel/Stufenaufstieg.
- Neuverbinden: Gast versucht 15 s lang alle 2 s; Gastgeber nimmt eine in diesem Raum schon bestätigte Figur-ID ohne neue Rückfrage wieder auf.
- Spielerfarben (Gastgeber zuerst, dann Beitrittsreihenfolge): `#3a6fd8 #e0533a #2fae5a #c9a227`.
- Kindgerecht: „besiegt“, nie „getötet“; PvP heißt in Texten „Spaßkampf“.
- Prüfen: `bash scripts/tests.sh` → `Fertig: N ok, 0 fehlgeschlagen` (ohne Sandbox ausführen). Echte Verbindung per Chrome DevTools MCP mit zwei isolierten Tabs (`new_page` mit `isolatedContext`) auf `localhost`.
- Commits mit `Fixes #N`: Task N entspricht Issue #(42+N) im Meilenstein „Stufe 3: Gemeinsam spielen“.

## Review Focus

1. **Gast spielt mit Figur aus einer Kreativ-Welt oder einer Welt mit Format 0/1:** Figur wird migriert, Rucksack leer mit Startschwert, nach dem Spiel ist die eigene Welt sonst byte-gleich (Chunks, Kisten, Position) → Test `figurUebernehmen schreibt nur Figurfelder` (Task 1).
2. **Gast hat beim Treffer einer Beute einen vollen Rucksack und verlässt dann den Raum:** liegende Kugeln verfallen, nichts wird verdoppelt beim Neuverbinden → Test `Neuverbinden schickt keine Beute doppelt` (Task 5).
3. **Gastgeber verlässt die Welt, während ein Gast gerade abbaut oder eine Kiste öffnet:** Gast bekommt `ende`, Figur wird gespeichert, keine hängende Kisten-Anfrage → Test `ende speichert Figur und meldet` (Task 8).
4. **Zwei Spieler setzen fast gleichzeitig an dieselbe Stelle:** der Gastgeber entscheidet, alle Geräte haben danach denselben Block; der unterlegene Gast bekommt seinen Block zurück in den Rucksack → Test `Blockkonflikt: Gastgeber gewinnt, Rucksack bekommt Block zurück` (Task 4).
5. **Gegner verfolgt einen Gast, der das Menü öffnet oder Zuschauer ist:** Gegner sucht sich ein anderes Ziel bzw. vergisst; Gegner werden nicht entfernt, solange irgendein Spieler in der Nähe ist → Tests `Menü offen ist kein Ziel` und `Gegner bleibt bei fernem Gastgeber, wenn Gast nah ist` (Task 5).

---

## Dateistruktur (neu bzw. geändert)

```
js/lib/peerjs.min.js     PeerJS 1.5.4 UMD (unverändert)
js/netz.js               SC.Netz: Raumcode, Wortliste, Adapter-Schnittstelle, Speicher-Adapter, PeerJS-Adapter
js/raum.js               SC.Gastgeber, SC.Gast: Protokoll (Beitritt, Abgleich, Kampf-Nachrichten, Neuverbinden)
js/render-mitspieler.js  SC.RenderMitspieler: Figuren der Mitspieler mit Farbe, Rüstung, Waffe, Namensschild
js/ui-raum.js            Freunde einladen, Bestätigung, Beitreten (Wort/Ziffern/Figur), Figurname, Meldungen
geändert: spielstand.js, kampf.js, wesen.js, ki.js (nur Aufrufer), auftauchen.js, survival.js, spiel.js,
          render.js, ui.js, texte.js, css/style.css, index.html, tests/index.html
```
Ladereihenfolge: `js/lib/peerjs.min.js` direkt nach `three.min.js`; `netz.js, raum.js` nach `auftauchen.js`; `render-mitspieler.js` nach `render-wesen.js`; `ui-raum.js` nach `ui-rucksack.js`. Neue Testdateien `test-netz.js, test-raum.js, test-mehrspieler.js, test-render-mitspieler.js, test-ui-raum.js` ans Ende von `TESTS`.

## Nachrichten (Gast ⇄ Gastgeber)

Alle Nachrichten sind Objekte mit Feld `t`. Chunks als `Uint8Array` (PeerJS-Serialisierung `"binary"` stückelt große Nachrichten selbst).

| `t` | Richtung | Inhalt |
|---|---|---|
| `hallo` | G→H | `protokoll, figurId, name, wiederkehr` |
| `warte` | H→G | (Gastgeber fragt nach) |
| `ablehnen` | H→G | `grund`: `"nein" \| "voll" \| "version" \| "hinausgeworfen"` |
| `willkommen` | H→G | `farbe, welt: { seed, name, modus, schwierigkeit, startpunkt, tageszeit, planet: {id, seed, groesse, palette, generatorVersion} }, pos, blick, pvp, spieler: [{id,name,farbe}], chunkAnzahl` |
| `chunk` | H→G | `k, daten` (einer pro geändertem Chunk, nach `willkommen`) |
| `bereit` | H→G | Ende der Chunks |
| `zustand` | G→H, H→G (alle Spieler) | `id, pos, blick, modus, stufe, ausr` (nur bei Änderung: `{ruestung, waffe}`), `menue, lebt` |
| `wesen` | H→G | `liste`: Gegner/Geschosse `{id, art, typ?, gegnerArt?, stufe?, pos, blick?, lp?, lpMax?, boss?, bemerkt?, blockt?, getroffen?, farbe?, team?}`; fehlende IDs = entfernt |
| `zeit` | H→G | `tageszeit` |
| `block` | beide | `x, y, z, id` (G→H: Wunsch; H→alle anderen: Tatsache; H→Urheber nur bei Konflikt mit `zurueck: true`) |
| `kiste` | G→H | `x, y, z` |
| `angriff` | G→H | `ziel` (Wesen-ID), `schaden, von` (Hieb) |
| `schuss` | G→H | `pos, richtung, tempo, schaden, farbe, abprall, lebensdauer` |
| `treffer` | H→G | `schaden, von, geschoss` (`geschoss`: `{id, typ, pos, richtung}` oder null), `pvpVon` |
| `abprall` | G→H | `geschossId` (Gast hat Laser geblockt) |
| `besiegt` | H→G | `pos, erfahrung, beute` (Liste Gegenstände), `boss` |
| `pvp` | G→H | `ziel` (Spieler-ID), `schaden, von` |
| `pvpAn` | H→G | `an` (bool) |
| `spieler` | H→G | `liste` [{id,name,farbe}] (bei Beitritt/Abgang) |
| `ende` | H→G | Gastgeber beendet |

---

### Task 1: Spielstand – Figurname, Figur-ID, Mitspieler, Figur zurückschreiben

**Files:**
- Modify: `js/spielstand.js`, `js/ui.js` (Neue Welt), `js/texte.js`
- Test: `tests/test-spielstand.js`, `tests/test-ui.js`

**Interfaces:**
- Produces:
  - Neue Felder: `daten.spieler.name` (String, Standard `""`), `daten.spieler.figurId` (String, Standard neu erzeugt mit `neueId()`), `daten.mitspieler` (Objekt `figurId → {name, pos, blick}`, Standard `{}`).
  - `SC.Spielstand.neu(o)` nimmt zusätzlich `o.figurName`.
  - `SC.Spielstand.FIGUR_FELDER = ["name","figurId","stufe","erfahrung","lebenspunkte","schild","rucksack","ausruestung","schnellleiste","schnellleisteKreativ"]`
  - `SC.Spielstand.figur(daten) → Object` Kopie genau dieser Felder.
  - `SC.Spielstand.figurUebernehmen(eigeneDaten, figur) → eigeneDaten` überschreibt nur diese Felder in `eigeneDaten.spieler` (tiefe Kopie), nichts sonst.
  - `SC.Spielstand.gastDaten(willkommen, figur) → daten` baut ein Weltobjekt für den Gast (Format 2, `id: "gast"`, ein Planet mit leeren Chunks, `spieler` = Figur + `pos/blick` aus `willkommen`), das `SC.Spiel#starte` versteht.
  - Texte: `figurName: "Name deiner Figur"`, `figurNameLeer: "z. B. Ben"`.

- [ ] **Step 1: Tests schreiben**

```js
test("migriere zieht Figurname, Figur-ID und Mitspieler nach", function(){ var d=SC.Spielstand.neu({name:"A"}); delete d.spieler.name; delete d.spieler.figurId; delete d.mitspieler; d=SC.Spielstand.migriere(d).daten; gleich(d.spieler.name,""); wahr(/^[a-z0-9]+$/.test(d.spieler.figurId)); gleich(JSON.stringify(d.mitspieler),"{}"); });
test("neu übernimmt Figurname", function(){ gleich(SC.Spielstand.neu({figurName:"Ben"}).spieler.name,"Ben"); });
test("figurUebernehmen schreibt nur Figurfelder", function(){ var eigen=SC.Spielstand.neu({name:"E",modus:"kreativ"}); eigen.spieler.pos=[1,2,3]; eigen.planeten.start.chunks={"0,0":"QUJD"}; eigen.planeten.start.kisten={"1,2,3":true}; var vor=JSON.stringify(eigen); var f=SC.Spielstand.figur(eigen); f.stufe=7; f.rucksack[1]={gegenstand:{id:"x"}}; SC.Spielstand.figurUebernehmen(eigen,f); gleich(eigen.spieler.stufe,7); gleich(eigen.spieler.rucksack[1].gegenstand.id,"x"); var a=JSON.parse(vor),b=JSON.parse(JSON.stringify(eigen)); a.spieler.stufe=7; a.spieler.rucksack[1]={gegenstand:{id:"x"}}; gleich(JSON.stringify(b),JSON.stringify(a)); });
test("figur ist eine Kopie", function(){ var d=SC.Spielstand.neu({}), f=SC.Spielstand.figur(d); f.rucksack[0]=null; wahr(d.spieler.rucksack[0]!==null); });
test("gastDaten startet im Spiel verwendbar", function(){ var w={farbe:"#e0533a",welt:{seed:"5",name:"H",modus:"survival",schwierigkeit:"normal",startpunkt:[1,60,1],tageszeit:0.5,planet:{id:"start",seed:123,groesse:2048,palette:"start",generatorVersion:2}},pos:[3,61,3],blick:[0.1,0]}, f=SC.Spielstand.figur(SC.Spielstand.neu({figurName:"Ben"})), d=SC.Spielstand.gastDaten(w,f); gleich(d.modus,"survival"); gleich(d.spieler.name,"Ben"); gleich(d.spieler.pos[0],3); gleich(d.planeten.start.seed,123); gleich(JSON.stringify(d.planeten.start.chunks),"{}"); gleich(SC.Spielstand.migriere(d).daten.format,SC.FORMAT); });
```
In `tests/test-ui.js`: `Neue Welt hat Feld Figurname und übergibt es` – Feld `#nw-figur` existiert; nach „Welt erschaffen“ mit Wert „Ben“ ist `spieler.name === "Ben"` im gespeicherten Stand.

- [ ] **Step 2: Tests laufen lassen, sie schlagen fehl** — `bash scripts/tests.sh`, erwartet ❌ bei den neuen Tests.
- [ ] **Step 3: Umsetzen** in `js/spielstand.js` (Felder in `neu`, `migriere`, die drei Funktionen) und `js/ui.js` (`zeigeNeueWelt`: Feld `#nw-figur` mit `maxlength="16"` und Platzhalter `SC.T.figurNameLeer`, Wert an `SC.Spielstand.neu({figurName})`).
- [ ] **Step 4: Tests grün** — `bash scripts/tests.sh` → `0 fehlgeschlagen`.
- [ ] **Step 5: Commit** — `Spielstand: Figurname, Figur-ID, Mitspieler, Figur zurückschreiben (Fixes #43)`

---

### Task 2: Netzschicht mit Raumcode, Speicher-Adapter und PeerJS-Adapter

**Files:**
- Create: `js/lib/peerjs.min.js` (von `https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js`, unverändert), `js/netz.js`, `tests/test-netz.js`
- Modify: `index.html`, `tests/index.html` (Ladelisten)

**Interfaces:**
- Produces:
  - `SC.NETZ_PROTOKOLL = 1`, `SC.Netz.WOERTER` (24 Wörter siehe Global Constraints)
  - `SC.Netz.neuerCode(zf) → {wort, zahl, text, peerId}`; `SC.Netz.code(wort, zahl)` dasselbe aus Teilen.
  - Adapter-Schnittstelle (beide Adapter gleich):
    - `adapter.oeffne(peerId) → Promise<Raum>`; abgelehnt mit `SC.Netz.Fehler` (`.art`: `"vergeben" | "vermittlung" | "unbekannt"`).
    - `Raum.an("verbindung", fn(verb))`, `Raum.schliesse()`.
    - `adapter.verbinde(peerId) → Promise<Verbindung>`; abgelehnt mit `.art`: `"kein-raum" | "vermittlung" | "keine-direkte" | "unbekannt"`. `"keine-direkte"` nach 10 s ohne `open`.
    - `Verbindung.sende(nachricht)`, `Verbindung.an("daten", fn(n))`, `Verbindung.an("zu", fn())`, `Verbindung.schliesse()`, `Verbindung.id` (Peer-ID der Gegenseite).
  - `SC.Netz.speicher() → adapter` (Tests): alle aus demselben Aufruf erzeugten Adapter teilen eine Registry: `var netz = SC.Netz.speicherNetz(); var a = netz.adapter(), b = netz.adapter();`. Zustellung **nur** bei `netz.pumpe()` (synchron, deterministisch, Kopie per `JSON`-Rundreise außer `Uint8Array`). `netz.trenne(verb)` simuliert Abbruch (beide Seiten bekommen `"zu"`), `netz.ausfall(peerId)` lässt `verbinde` dorthin mit `"kein-raum"` scheitern.
  - `SC.Netz.peerjs() → adapter` mit `new Peer(peerId, { debug: 0 })` (Standard-STUN von PeerJS), Serialisierung `"binary"`. PeerJS-Fehlertypen abbilden: `unavailable-id → vergeben`, `peer-unavailable → kein-raum`, `network|server-error|socket-error → vermittlung`.

- [ ] **Step 1: Tests schreiben** (`tests/test-netz.js`)

```js
test("Raumcode hat Wort und Zahl 10–99", function(){ var zf=SC.zufall(1); for(var i=0;i<200;i++){ var c=SC.Netz.neuerCode(zf); wahr(SC.Netz.WOERTER.indexOf(c.wort)>=0); wahr(c.zahl>=10&&c.zahl<=99); gleich(c.text,c.wort+" "+c.zahl); gleich(c.peerId,"spacecraft-"+c.wort.toLowerCase()+"-"+c.zahl); } gleich(SC.Netz.WOERTER.length,24); wahr(SC.Netz.WOERTER.every(function(w){ return /^[A-Z]+$/.test(w); })); });
test("Speicher-Netz: verbinden, senden, empfangen", function(){ var n=SC.Netz.speicherNetz(),h=n.adapter(),g=n.adapter(),erhalten=[],hv=null; return h.oeffne("spacecraft-mond-47").then(function(r){ r.an("verbindung",function(v){ hv=v; v.an("daten",function(d){ erhalten.push(d); }); }); var p=g.verbinde("spacecraft-mond-47"); n.pumpe(); return p; }).then(function(v){ v.sende({t:"hallo"}); gleich(erhalten.length,0,"erst beim Pumpen"); n.pumpe(); gleich(erhalten[0].t,"hallo"); wahr(hv!==null); }); });
test("Speicher-Netz: vergebene ID und fehlender Raum", function(){ var n=SC.Netz.speicherNetz(),a=n.adapter(),b=n.adapter(); return a.oeffne("x").then(function(){ return b.oeffne("x").then(function(){ throw new Error("doppelt"); },function(f){ gleich(f.art,"vergeben"); }); }).then(function(){ var p=b.verbinde("y"); n.pumpe(); return p.then(function(){ throw new Error("verbunden"); },function(f){ gleich(f.art,"kein-raum"); }); }); });
test("Speicher-Netz: Abbruch meldet beiden Seiten zu", function(){ var n=SC.Netz.speicherNetz(),h=n.adapter(),g=n.adapter(),zu=0; return h.oeffne("r").then(function(r){ r.an("verbindung",function(v){ v.an("zu",function(){ zu++; }); }); var p=g.verbinde("r"); n.pumpe(); return p; }).then(function(v){ v.an("zu",function(){ zu++; }); n.trenne(v); n.pumpe(); gleich(zu,2); }); });
test("Speicher-Netz überträgt Uint8Array", function(){ var n=SC.Netz.speicherNetz(),h=n.adapter(),g=n.adapter(),erh=null; return h.oeffne("r").then(function(r){ r.an("verbindung",function(v){ v.an("daten",function(d){ erh=d; }); }); var p=g.verbinde("r"); n.pumpe(); return p; }).then(function(v){ v.sende({t:"chunk",daten:new Uint8Array([1,2,3])}); n.pumpe(); wahr(erh.daten instanceof Uint8Array); gleich(erh.daten[2],3); }); });
test("PeerJS ist geladen", function(){ wahr(typeof Peer==="function"); wahr(typeof SC.Netz.peerjs==="function"); });
```

- [ ] **Step 2: Tests schlagen fehl** — `bash scripts/tests.sh`.
- [ ] **Step 3: PeerJS-Datei holen und Ladelisten ergänzen** — `curl -fsSL https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js -o js/lib/peerjs.min.js`; prüfen, dass `Peer` global definiert wird. Eintrag in beiden `DATEIEN`-Listen.
- [ ] **Step 4: `js/netz.js` umsetzen** (Schnittstelle oben).
- [ ] **Step 5: Tests grün** — `bash scripts/tests.sh` → `0 fehlgeschlagen`.
- [ ] **Step 6: Commit** — `Netzschicht: Raumcode, Speicher-Adapter, PeerJS-Adapter (Fixes #44)`

---

### Task 3: Raum-Protokoll – Beitritt, Bestätigung, Weltübertragung, Abgang

**Files:**
- Create: `js/raum.js`, `tests/test-raum.js`
- Modify: Ladelisten, `js/texte.js`

**Interfaces:**
- Consumes: Adapter aus Task 2; `SC.Spielstand.gastDaten`, `figur` aus Task 1.
- Produces:
  - `new SC.Gastgeber({ adapter, daten, welt, beiAnfrage(info, antwort), beiSpieler(liste), beiNachricht(spielerId, n), zf })`
    - `.oeffne() → Promise<code>` (bei `"vergeben"` bis zu 5 neue Codes würfeln)
    - `beiAnfrage({id, name}, antwort)`; `antwort(true|false)`. Bereits bestätigte `figurId` in diesem Raum → ohne Rückfrage angenommen.
    - `.spieler` → Array `{id, name, farbe, pos, blick, modus, ausr, menue, lebt, verbunden}` (ohne den Gastgeber selbst); `.farbe` (Gastgeber `#3a6fd8`).
    - `.sende(spielerId, n)`, `.sendeAlle(n, ausserId)`, `.hinauswerfen(id)`, `.schliesse()` (sendet `ende`, schließt Raum).
    - Beim Annehmen: `willkommen` (Position aus `daten.mitspieler[figurId]`, sonst `daten.startpunkt`), dann je geändertem Chunk eine `chunk`-Nachricht (`welt.geaenderte`), dann `bereit`. `daten.mitspieler[figurId] = {name, pos, blick}` wird bei jedem `zustand` aktualisiert.
    - Protokoll ungleich → `ablehnen` `"version"`; 4 Gäste verbunden → `"voll"`.
  - `new SC.Gast({ adapter, figur, beiWillkommen(w), beiChunk(k, u8), beiBereit(), beiNachricht(n), beiStatus(status, info) })`
    - `.verbinde(code) → Promise` erfüllt nach `bereit`; abgelehnt mit `SC.Netz.Fehler` (`art` aus Task 2 oder `"nein" | "voll" | "version"`).
    - `status`: `"warte"` (Gastgeber fragt), `"neuverbinden"`, `"verbunden"`, `"getrennt"` (info.grund: `"ende" | "hinausgeworfen" | "abbruch"`).
    - Neuverbinden: bei `zu` ohne vorheriges `ende` alle 2 s `verbinde` mit `hallo.wiederkehr = true`, höchstens 15 s; danach `beiStatus("getrennt", {grund:"abbruch"})`. Bei Wiederkehr kommen `willkommen`/Chunks erneut; das Spiel ersetzt seine Welt **nicht**, sondern übernimmt nur die Chunks.
    - `.sende(n)`, `.trenne()`.
  - Texte: `raumWarte: "Warte, bis der Gastgeber dich hereinlässt …"`, `raumNein: "Der Gastgeber hat Nein gesagt."`, `raumVoll: "Der Raum ist schon voll (höchstens 4 Spieler)."`, `raumVersion: "Die Spiele passen nicht zusammen. Bitte auf beiden Geräten die Seite neu laden (aktualisieren)."`, `raumKeinRaum: "Diesen Raum gibt es nicht. Ist der Code richtig?"`, `raumVermittlung: "Keine Verbindung zum Vermittlungsdienst. Ist das Gerät mit dem Internet verbunden?"`, `raumKeineDirekte: "Keine direkte Verbindung möglich – seid ihr im selben WLAN? Gäste-WLANs blockieren das manchmal."`, `raumNeuverbinden: "Verbindung wackelt – verbinde neu …"`, `raumVerloren: "Verbindung zum Gastgeber verloren – deine Figur ist gespeichert."`, `raumHinausgeworfen: "Der Gastgeber hat dich aus dem Raum geschickt – deine Figur ist gespeichert."`, `raumEnde: "Der Gastgeber hat das Spiel beendet – deine Figur ist gespeichert."`.

- [ ] **Step 1: Tests schreiben** (`tests/test-raum.js`; Hilfsfunktion `aufbau()` legt Speicher-Netz, Host-Welt mit einem geänderten Chunk und `SC.Gastgeber` an)
  - `Beitritt mit Bestätigung` – Gast ruft `verbinde`, Status `"warte"`, `beiAnfrage` bekommt `{name:"Ben"}`, `antwort(true)`, nach Pumpen: `beiWillkommen` mit `farbe "#e0533a"`, ein `beiChunk` mit `Uint8Array` Länge `16*16*128`, Promise erfüllt; `gastgeber.spieler.length === 1`.
  - `Nein lehnt ab` – `antwort(false)` → Promise abgelehnt mit `art "nein"`.
  - `Falsches Protokoll wird abgelehnt` – Gast mit manipuliertem `SC.NETZ_PROTOKOLL+1` im `hallo` → `art "version"`.
  - `Fünfter Spieler: voll` – drei Gäste angenommen, vierter → `art "voll"`.
  - `Bestätigte Figur kommt ohne Rückfrage zurück` – nach `netz.trenne` und Neuverbinden wird `beiAnfrage` nicht erneut aufgerufen; Status-Folge `neuverbinden → verbunden`.
  - `Neuverbinden gibt nach 15 s auf` – `netz.ausfall(peerId)` nach Trennung, Uhr per injizierter Zeitfunktion (`o.jetzt`, `o.warte`) vorspulen → `beiStatus("getrennt",{grund:"abbruch"})`.
  - `Position wird gemerkt` – `zustand` mit `pos [5,70,5]` → `daten.mitspieler[figurId].pos[0] === 5`; erneuter Beitritt bekommt diese `pos` im `willkommen`.
  - `Hinauswerfen` – `hinauswerfen(id)` → Gast-Status `"getrennt"`, `grund "hinausgeworfen"`, kein Neuverbinden; danach ist die Figur-ID nicht mehr „bestätigt“.
  - `Ende` – `schliesse()` → Gast-Status `"getrennt"`, `grund "ende"`, kein Neuverbinden.
- [ ] **Step 2: Tests schlagen fehl.**
- [ ] **Step 3: `js/raum.js` umsetzen.** Zeit für Neuverbinden über `o.jetzt` (Standard `Date.now`) und `o.warte(ms, fn)` (Standard `setTimeout`), damit Tests sie ersetzen können.
- [ ] **Step 4: Tests grün.**
- [ ] **Step 5: Commit** — `Raum-Protokoll: Beitritt mit Bestätigung, Weltübertragung, Neuverbinden (Fixes #45)`

---

### Task 4: Laufender Abgleich – Spieler, Blöcke, Tageszeit, Gegner spiegeln

**Files:**
- Modify: `js/raum.js`, `js/survival.js` (Setzen/Abbauen beim Gast)
- Test: `tests/test-mehrspieler.js` (neu)

**Interfaces:**
- Consumes: `SC.Gastgeber`, `SC.Gast` (Task 3).
- Produces:
  - `SC.Gastgeber#takt(dt, ich)` – `ich`: `{pos, blick, modus, ausr, menue, lebt}` des Gastgebers; sendet 15 Hz `zustand` aller Spieler (inkl. Gastgeber, `id: "gastgeber"`) und `wesen`, 1 Hz `zeit`. Hängt sich in `welt.ereignisse` `"block"` ein und sendet `block` an alle außer dem Urheber (Quelle `"netz:<id>"`).
  - `SC.Gast#takt(dt, ich)` – sendet 15 Hz eigenen `zustand`.
  - `SC.Raum.spiegleWesen(welt, liste, dt)` – Gast: setzt/aktualisiert Gegner und Geschosse in `welt.wesen` unter den IDs des Gastgebers, entfernt fehlende, lässt eigene Kugeln (IDs ≥ `1e9`) in Ruhe; Position wird zum Ziel hin geglättet (`pos += (ziel - pos) * min(1, dt * 12)`, Sprung bei > 8 Blöcken).
  - Gast-Welt startet Kugel-IDs bei `welt.naechsteId = 1e9`.
  - Gast-Blockänderung: lokal sofort `welt.setzeBlock(..., "spieler")`, danach `block`-Wunsch. Gastgeber setzt mit Quelle `"netz:<id>"`; schlägt es fehl (Block inzwischen anders), antwortet er dem Urheber mit `block` (`zurueck: true`, tatsächlicher Block). Der Gast setzt dann den tatsächlichen Block und legt im Survival einen von ihm gesetzten Block zurück in den Rucksack bzw. nimmt einen abgebauten wieder heraus.
  - `SC.Raum.mitspielerZiele(gastgeber, ich)` → Array `{id, pos, blick, modus, menue, lebt}` aller Spieler (für Task 5).

- [ ] **Step 1: Tests schreiben**
  - `Block vom Gast landet beim Gastgeber und beim zweiten Gast` (zwei Gäste, Speicher-Netz).
  - `Block vom Gastgeber landet beim Gast`.
  - `Blockkonflikt: Gastgeber gewinnt, Rucksack bekommt Block zurück` – Gastgeber setzt `STEIN` an (5,62,5); Gast setzt (vor dem Pumpen) `BRETTER` aus dem Rucksack an dieselbe Stelle → nach Pumpen hat die Gast-Welt `STEIN`, der Gast-Rucksack wieder 1 `BRETTER` mehr.
  - `Zustand wird verteilt` – Gast-Position erscheint in `gastgeber.spieler[0].pos` und beim zweiten Gast unter `id` des ersten.
  - `spiegleWesen setzt, glättet und entfernt` – Liste mit Gegner `id 3` → in `welt.wesen`; zweite Liste ohne `id 3` → entfernt; Kugel mit `id 1e9` bleibt.
  - `Tageszeit folgt dem Gastgeber` – nach `zeit`-Nachricht ruft `beiNachricht` mit `t:"zeit"`.
- [ ] **Step 2: Tests schlagen fehl.**
- [ ] **Step 3: Umsetzen.**
- [ ] **Step 4: Tests grün.**
- [ ] **Step 5: Commit** — `Abgleich: Spieler, Blöcke, Tageszeit, Gegner spiegeln (Fixes #46)`

---

### Task 5: Gemeinsam kämpfen – mehrere Ziele, Treffer, Erfahrung und Beute für alle

**Files:**
- Modify: `js/kampf.js`, `js/wesen.js`, `js/auftauchen.js`, `js/survival.js`, `js/raum.js`
- Test: `tests/test-mehrspieler.js`, bestehende `test-kampf.js`, `test-wesen.js`, `test-auftauchen.js` bleiben grün

**Interfaces:**
- Consumes: `SC.Raum.mitspielerZiele` (Task 4).
- Produces:
  - `SC.Kampf.beuteFuer(g, daten, zf) → {erfahrung, beute}` (reines Würfeln, bisheriger Inhalt von `besiegtGegner`); `K.gibErfahrung(xp) → aufstiege` (Rest). `K.besiegtGegner(g)` bleibt und ruft beide (Einzelspiel unverändert).
  - `SC.Kampf.aktionTrifft(welt, g, akt, pos, aufBoden) → {schaden, von} | null` (Geometrie aus `gegnerAktion` herausgelöst); `K.gegnerAktion` nutzt sie.
  - `SC.Geschoss.schritt(welt, g, dt, spieler)` akzeptiert für `spieler` auch ein Array; Treffer meldet dann `{treffer:"spieler", id}`.
  - `SC.Auftauchen#schritt(spieler, tageslicht, spielzeit)` akzeptiert auch ein Array: Entfernen nur, wenn **alle** Spieler weiter als `WEG` weg sind; Bauwerke wachen bei jedem Spieler auf; Nachtgegner um zufällig gewählte Survival-Spieler, gemeinsame Obergrenze; Stufe der Nachtgegner aus der Stufe des jeweiligen Spielers (Feld `stufe` im `zustand`).
  - `SC.Raum.zielFuer(welt, g, ziele) → ziel | null` – nächster Spieler mit `modus === "survival" && lebt && !menue`; Rückgabe `{pos, sichtbar: true, id}`.
  - Gastgeber-Ablauf in `survival.js` (nur wenn `this.raum` ein `SC.Gastgeber` ist): Ziel je Gegner über `zielFuer`; Treffer gegen einen Gast → `treffer` an ihn; Gast-Nachrichten `angriff`, `schuss` (Geschoss `team:"spieler"`, `von: id`), `kiste`, `abprall`. Besiegt: einmal `beuteFuer`, dann je Spieler in 40 Blöcken (inkl. Gastgeber) `besiegt`; Gastgeber verbucht sich selbst über `gibErfahrung` + `beuteAuswerfen`. Kiste genauso mit `SC.Kampf.oeffneKiste`.
  - Gast-Ablauf (wenn `this.raum` ein `SC.Gast` ist): Gegner-KI, Auftauchen und Gegner-Geschosse laufen **nicht** lokal; eigene Hiebe → `hiebZiele` auf gespiegelten Gegnern → `angriff` je Ziel (lokal nur Funken/Zahl); Schuss → `schuss` (lokal ein rein optisches Geschoss mit Kugel-ID ≥ 1e9, das nichts trifft); `treffer` → `k.trifftSpieler` (bei `abgeprallt` → `abprall` senden); `besiegt` → `gibErfahrung` + `beuteAuswerfen` lokal; Kiste → nur `kiste` senden.
  - Menü offen im Raum: Welt läuft weiter; eigener Zustand `menue: true`.

- [ ] **Step 1: Tests schreiben**
  - `beuteFuer würfelt wie besiegtGegner` (gleicher Seed → gleiche Beute/Erfahrung).
  - `Gegner wählt den nächsten Spieler` / `Menü offen ist kein Ziel` / `Zuschauer ist kein Ziel`.
  - `Gegnerschuss trifft Gast` – Geschoss mit Array aus zwei Spielern trifft den mit `id "g1"`.
  - `Gegner bleibt bei fernem Gastgeber, wenn Gast nah ist` (Auftauchen mit Array).
  - `Besiegt: alle in 40 Blöcken bekommen gleiche Beute und volle Erfahrung` – Gast A in 10, Gast B in 60 Blöcken Entfernung; A bekommt `besiegt` mit identischer `beute`-Liste wie die lokale Beute des Gastgebers, B nichts.
  - `Kiste vom Gast: alle in der Nähe, danach offen` – Kiste ist danach `KISTE_OFFEN` in beiden Welten; zweites `kiste` erzeugt keine Beute.
  - `Treffer am Gast verrechnet seine Ausrüstung` – Gast mit Schutz-Rüstung bekommt `treffer` 20 → weniger als 20 LP Verlust.
  - `Neuverbinden schickt keine Beute doppelt` – `besiegt` vor der Trennung zugestellt, nach dem Neuverbinden keine weitere `besiegt`-Nachricht.
- [ ] **Step 2: Tests schlagen fehl.**
- [ ] **Step 3: Umsetzen.** Einzelspiel-Pfad (kein `this.raum`) muss Zeile für Zeile gleich bleiben; alle bisherigen Tests bleiben grün.
- [ ] **Step 4: Tests grün.**
- [ ] **Step 5: Commit** — `Gemeinsam kämpfen: Ziele, Treffer, Erfahrung und Beute für alle in der Nähe (Fixes #47)`

---

### Task 6: Spaßkampf (PvP)

**Files:**
- Modify: `js/raum.js`, `js/survival.js`, `js/kampf.js`, `js/texte.js`
- Test: `tests/test-mehrspieler.js`

**Interfaces:**
- Consumes: Task 5.
- Produces:
  - `SC.Gastgeber#pvp` (bool, Standard `false`), `#setzePvp(an)` sendet `pvpAn`.
  - Hiebe treffen bei `pvp` auch Mitspieler im Bogen (`K.hiebZiele` bekommt optional eine Liste von Spieler-Zielen); Spieler-Geschosse treffen bei `pvp` Mitspieler außer dem Schützen (`von`).
  - Gast → `pvp`-Nachricht; Gastgeber leitet als `treffer` mit `pvpVon` weiter (oder verbucht bei sich).
  - Fällt LP durch einen Treffer mit `pvpVon` auf 0: kein Besiegt-Bildschirm, `k.wiederbeleben(startpunkt)`, Hinweis `SC.T.pvpBesiegt` mit Name (`"{name} hat dich im Spaßkampf erwischt!"`); Rucksack, Ausrüstung, Erfahrung unverändert.
  - Texte: `pvp: "Spaßkampf (Spieler können sich treffen)"`, `pvpBesiegt`, `an: "an"`, `aus: "aus"`.

- [ ] **Step 1: Tests schreiben** — `PvP aus: Hieb trifft Mitspieler nicht`; `PvP an: Hieb trifft Mitspieler`; `PvP-besiegt verliert nichts und steht am Startpunkt` (Rucksack-JSON vorher = nachher, `pos` = Startpunkt, kein `zeigeBesiegt`); `eigener Schuss trifft den Schützen nicht`.
- [ ] **Step 2: Tests schlagen fehl.**
- [ ] **Step 3: Umsetzen.**
- [ ] **Step 4: Tests grün.**
- [ ] **Step 5: Commit** — `Spaßkampf (PvP) als Schalter des Gastgebers (Fixes #48)`

---

### Task 7: Mitspieler darstellen – Figur, Farbe, Ausrüstung, Namensschild

**Files:**
- Create: `js/render-mitspieler.js`, `tests/test-render-mitspieler.js`
- Modify: `js/render.js` (Figurbau als wiederverwendbare Fabrik), Ladelisten

**Interfaces:**
- Produces:
  - `SC.Figur.baue(farbe) → {gruppe, kopf, armL, armR, beinL, beinR, ruestung, waffe}` – aus `SC.Render#_baueFigur`/`_baueAusruestung` herausgelöst (Körperfarbe = `farbe`, Arme/Beine abgedunkelt); `SC.Figur.ausruestung(figur, ruestung, waffe)` = bisherige Logik von `SC.Render#ausruestung`. Die eigene Figur nutzt das auch (Farbe Standard `#3a6fd8`, Aussehen unverändert).
  - `new SC.RenderMitspieler(szene)`; `.aktualisiere(liste, ichPos, dt)` – `liste` Array `{id, name, farbe, pos, blick, modus, ausr, lebt}`; legt fehlende Figuren an, entfernt verschwundene, glättet Position (wie Task 4), Zuschauer unsichtbar; Namensschild als Sprite mit Canvas-Textur (weiße Schrift, halbtransparenter dunkler Grund, Rand in Spielerfarbe), 0,5 Blöcke über dem Kopf, bleibt bis 64 Blöcke lesbar groß; Ring-Abstand über die Planetenkante wie bei den Wesen.
  - `SC.Render#bild` ruft `this.mitspieler.aktualisiere(this._mitspieler || [], …)`; `SC.Render#setzeMitspieler(liste)` setzt die Liste.

- [ ] **Step 1: Tests schreiben** — `Figur.baue nutzt Farbe`; `aktualisiere legt an und entfernt`; `Namensschild trägt den Namen` (Canvas-Text über `figur.schild.userData.name`); `Zuschauer ist unsichtbar`; `eigene Figur sieht aus wie vorher` (Körperfarbe `0x3a6fd8`, bestehender `test-render.js` grün).
- [ ] **Step 2: Tests schlagen fehl.**
- [ ] **Step 3: Umsetzen.**
- [ ] **Step 4: Tests grün.**
- [ ] **Step 5: Commit** — `Mitspieler mit Farbe, Ausrüstung und Namensschild darstellen (Fixes #49)`

---

### Task 8: Spiel verdrahten – Rollen, Speichern, Abbrüche

**Files:**
- Modify: `js/spiel.js`, `js/survival.js`
- Test: `tests/test-spiel.js`, `tests/test-mehrspieler.js`

**Interfaces:**
- Consumes: Tasks 1–7.
- Produces:
  - `SC.Spiel#rolle` → `"allein" | "gastgeber" | "gast"`; `this.raum` (`SC.Gastgeber`/`SC.Gast`/null).
  - `SC.Spiel#raumOeffnen() → Promise<code>` – erzeugt `SC.Gastgeber` mit `SC.Spiel.adapter()` (Standard `SC.Netz.peerjs()`, in Tests ersetzbar), Rolle `"gastgeber"`.
  - `SC.Spiel#beitreten(code, eigeneWeltId) → Promise` – lädt eigene Welt (`slots.lade`), `SC.Gast` mit `SC.Spielstand.figur`, nach `willkommen` `starte(SC.Spielstand.gastDaten(...))` mit Chunks aus `beiChunk` (`welt.geaenderte`), Rolle `"gast"`. `eigeneWeltId === null` → neue Survival-Welt `SC.Spielstand.neu({name: figurName + "s Welt", figurName, modus: "survival"})` speichern und nutzen.
  - `SC.Spiel#speichere(grund)`:
    - `"gast"`: nie die Gastwelt speichern; stattdessen eigene Welt laden (zwischengespeichert), `figurUebernehmen(eigen, figur aus kampf/spieler)`, `slots.speichere(eigen)`. Takt 5 s plus sofort bei Aufsammeln, Ausrüstungswechsel und Stufenaufstieg.
    - `"gastgeber"`: wie bisher; zusätzlich bei Beitritt und Abgang eines Gastes.
  - Menüs: im Raum friert `_survival` die Welt nicht ein (siehe Task 5); `ui.zeigePause` bleibt nutzbar.
  - Status `"getrennt"` beim Gast → Figur speichern, Meldung (`raumVerloren`/`raumEnde`/`raumHinausgeworfen`), Spiel beenden wie `verlasse`, Weltliste. Status `"neuverbinden"` → Hinweis `raumNeuverbinden`, Spiel läuft weiter (Gegner eingefroren).
  - `verlasse()` als Gastgeber: `raum.schliesse()` (sendet `ende`) nach dem Speichern.
  - Bestehende Lebenszyklus-Speicherung (`visibilitychange`, `pagehide`) gilt in allen Rollen.

- [ ] **Step 1: Tests schreiben** (mit Speicher-Netz und `SC.Speicher.backend("test-mehrspieler","localstorage")` bzw. flüchtigem Backend, zwei `SC.Spiel`-Instanzen ohne Leinwand wie in `test-spiel.js`)
  - `Gast speichert nur seine Figur` – nach Fund (Rucksack ändert sich) und `speichere("auto")` hat die eigene Welt des Gastes den Fund, ihre Chunks/Position sind unverändert, und es gibt keinen Slot mit `id "gast"`.
  - `Neue Figur legt Survival-Welt an` – `beitreten(code, null)` mit Figurname „Ben“ → Weltliste enthält „Bens Welt“ (Modus survival).
  - `ende speichert Figur und meldet` – Gastgeber `verlasse()` → Gast speichert, `ui.hinweis` mit `SC.T.raumEnde`, Gast zeigt Weltliste.
  - `Gastgeber speichert bei Beitritt` – `slots.speichere` wird beim Annehmen aufgerufen.
  - `Einzelspiel unverändert` – `rolle === "allein"`, Menü offen friert die Gegner weiter ein.
- [ ] **Step 2: Tests schlagen fehl.**
- [ ] **Step 3: Umsetzen.**
- [ ] **Step 4: Tests grün.**
- [ ] **Step 5: Commit** — `Spiel: Rollen Gastgeber/Gast, Figur speichern, Abbrüche (Fixes #50)`

---

### Task 9: Oberfläche – Freunde einladen, Beitreten, Bestätigen, Figurname

**Files:**
- Create: `js/ui-raum.js`, `tests/test-ui-raum.js`
- Modify: `js/ui.js` (Knöpfe in Weltliste und Pause), `js/spiel.js` (Rückrufe), `js/texte.js`, `css/style.css`, Ladelisten

**Interfaces:**
- Consumes: `SC.Spiel#raumOeffnen`, `#beitreten`, `SC.Gastgeber#hinauswerfen`, `#setzePvp` (Tasks 6, 8).
- Produces (alle auf `SC.UI.prototype`, Navigation per Gamepad/Touch über die bestehende `_zeige`/`data-aktion`-Mechanik):
  - Weltliste: neuer Knopf `data-aktion="mitspielen"` (`SC.T.mitspielen: "Bei Freunden mitspielen"`) neben „Neue Welt“ → `zeigeBeitreten()`.
  - `zeigeBeitreten()` – Schritt 1: 24 Wortknöpfe (`data-aktion="wort"`), Schritt 2: Ziffernblock 0–9 + Löschen (zwei Ziffern), Anzeige des Codes groß („MOND 47“); Schritt 3: Figurwahl – Liste der eigenen nicht gesperrten Welten als „{Figurname oder Weltname} – Stufe {n} (aus „{Weltname}“)“ plus „Neue Figur“; Knopf „Beitreten“ → `o.beiBeitreten(code, weltId|null)`; Status/Fehler über Texte aus Task 3.
  - `zeigeFigurname(fertig)` – Abfrage „Wie heißt deine Figur?“ (Pflicht, 1–16 Zeichen), wenn Gast oder Gastgeber ohne `spieler.name` beitritt bzw. einlädt; Wert wird in der jeweiligen eigenen Welt gespeichert.
  - Pause: Knopf `data-aktion="einladen"` (`SC.T.einladen: "Freunde einladen"`) → `zeigeEinladen(info)`: Raumcode groß, PvP-Schalter (`SC.T.pvp`), Mitspielerliste mit Farbe und Knopf „Hinauswerfen“ je Gast, „Zurück“. Beim Gast statt „Freunde einladen“ der Hinweis „Du spielst bei {Name}“ und kein Modus-/Schwierigkeitswechsel (Gastgeber legt fest).
  - `zeigeAnfrage(name, antwort)` – „{Name} möchte mitspielen“ mit „Ja“/„Nein“; mehrere Anfragen nacheinander.
  - Pausemenü beim Gastgeber: Modus- und Schwierigkeitswechsel gelten für alle (Gastgeber sendet sie im nächsten `willkommen` und als `welt`-Felder im `zeit`-Takt: `modus, schwierigkeit`).
  - Texte (zusätzlich): `mitspielen, einladen, raumcode: "Raumcode", mitspieler: "Mitspieler", hinauswerfen: "Hinauswerfen", moechteMitspielen: "{name} möchte mitspielen", ja: "Ja", nein: "Nein", codeWort: "Wähle das Wort", codeZahl: "Tippe die Zahl", figurWaehlen: "Mit welcher Figur?", neueFigur: "Neue Figur", beitreten: "Beitreten", spieltBei: "Du spielst bei {name}", wieHeisstFigur: "Wie heißt deine Figur?"`.

- [ ] **Step 1: Tests schreiben** — `Weltliste hat Mitspielen-Knopf`; `Beitreten: Wort + zwei Ziffern ergeben Code`; `Figurwahl listet Welten und Neue Figur`, `Beitreten ruft beiBeitreten mit Code und Welt-ID`; `Einladen zeigt Code, PvP-Schalter und Mitspieler`; `Anfrage Ja/Nein ruft antwort`; `Figurname ist Pflicht`; `Gast sieht keinen Moduswechsel`.
- [ ] **Step 2: Tests schlagen fehl.**
- [ ] **Step 3: Umsetzen.** Gestaltung im Stil der bestehenden Menüs (`css/style.css`), Wortknöpfe und Ziffern groß genug für Touch (mind. 44 px).
- [ ] **Step 4: Tests grün.**
- [ ] **Step 5: Commit** — `Oberfläche: Freunde einladen, Beitreten, Bestätigen, Figurname (Fixes #51)`

---

### Task 10: Gesamtprüfung mit echter Verbindung, Version 0.6.0, Roadmap

**Files:**
- Modify: `index.html` (`var V="0.6.0"`), `docs/ROADMAP.md`
- Create: `docs/itch-devlog-0.6.0.md` (+ `.html`)

- [ ] **Step 1: Alle Tests** — `bash scripts/tests.sh` → `0 fehlgeschlagen`.
- [ ] **Step 2: Echte Verbindung prüfen** – lokalen Server starten (`python3 -m http.server` im Repo, ohne Sandbox), per Chrome DevTools MCP zwei Tabs in getrennten `isolatedContext`s auf `http://localhost:<port>/`. Tab A: Survival-Welt anlegen (Figur „Papa“), Freunde einladen. Tab B: Figur „Ben“, Bei Freunden mitspielen, Code eingeben. Prüfen und Screenshot: Anfrage erscheint bei A; nach „Ja“ sieht jeder den anderen mit Namensschild; Block in B erscheint in A; Gegner per Entwicklerwerkzeug bei A erzeugen, von B besiegen → beide bekommen dieselbe Beute; PvP an/aus; B lädt die Seite neu (Abbruch) → Hinweis, Figur in Bs eigener Welt gespeichert; A beendet → B sieht `raumEnde`. Konsole ohne Fehler.
- [ ] **Step 3: Tablet- und Handygröße** – `emulate` mit `viewport: "390x844x3,mobile,touch"` und `"1024x768x2,mobile,touch"`: Beitreten-Bildschirm vollständig bedienbar.
- [ ] **Step 4: Version und Doku** – `var V="0.6.0"`; Roadmap: Stufe 3 Stand, Spec- und Plan-Links, nächster Schritt (Test auf echten Geräten im WLAN über die Test-Vorschau; Hinweis: gemeinsamer Speicher mit Live, nichts löschen); Devlog-Entwurf.
- [ ] **Step 5: Commit** — `Version 0.6.0: Gemeinsam spielen (Fixes #52)`. Nicht pushen; dem Nutzer anbieten: `git push test <branch>:main` für den Gerätetest.

---

## Issues

| Task | Issue | Label |
|---|---|---|
| 1 Spielstand Figur | #43 | multiplayer |
| 2 Netzschicht | #44 | multiplayer, technik |
| 3 Raum-Protokoll | #45 | multiplayer |
| 4 Abgleich | #46 | multiplayer, welt |
| 5 Gemeinsam kämpfen | #47 | multiplayer, kampf |
| 6 Spaßkampf | #48 | multiplayer, kampf |
| 7 Mitspieler darstellen | #49 | multiplayer |
| 8 Spiel verdrahten | #50 | multiplayer, technik |
| 9 Oberfläche | #51 | multiplayer, ui |
| 10 Gesamtprüfung 0.6.0 | #52 | multiplayer |
| – Spielen übers Internet (TURN) | #53 | multiplayer (Meilenstein „Später“) |
