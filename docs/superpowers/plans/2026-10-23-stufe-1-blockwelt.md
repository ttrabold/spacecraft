# Stufe 1: Blockwelt – Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Spielbare Blockwelt im Browser: Startplanet aus Seed mit Landschaft und leeren Bauwerken, Abbauen/Setzen, Kreativ- und Zuschauermodus, Tag/Nacht, Tastatur/Maus und Touch, mehrere Spielstände mit Export/Import.

**Architecture:** Klassische Skripte unter einem globalen Namensraum `SC`, geladen in fester Reihenfolge durch den Lader in `index.html`. Reine Logik (Rauschen, Generator, Bauwerke, Welt, Spielstand, Speicher, Physik, Zielen, Mesher) ist von Darstellung (three.js) und Eingabe getrennt und wird auf `tests/index.html` getestet. Jede Blockänderung läuft über `SC.Welt#setzeBlock`, damit Stufe 3 (Mehrspieler) sich dort einhängen kann.

**Tech Stack:** HTML/CSS/JavaScript (ES2020, keine Module), three.js r158 (`build/three.min.js`, UMD) im Repo, IndexedDB mit `localStorage`-Rückfall, `CompressionStream`.

**Spec:** `docs/superpowers/specs/2026-10-23-stufe-1-blockwelt-design.md` (vor jeder Aufgabe den passenden Abschnitt lesen)

## Global Constraints

- Keine ES-Module, kein Bundler, kein npm; läuft per `file://` und auf GitHub Pages. Kein `fetch`/XHR auf lokale Dateien.
- Mindestversion iPadOS/iOS 16.7 (Safari 16.6); WebGL2, `CompressionStream`, IndexedDB, ES2020 dürfen vorausgesetzt werden.
- Version nur in `index.html` als `var V="0.1.0"`; Lader hängt `?v=V` an alle Dateien; `sw.js` bildet den Cache-Namen daraus. Skriptliste im Lader als String-Literale `"js/….js"` (wird von `scripts/itch-zip.sh` ausgelesen), Stylesheet `css/style.css`.
- Ladereihenfolge in `index.html` und `tests/index.html` identisch.
- Code-Kommentare, Commit-Nachrichten, Oberfläche: Deutsch. Texte der Oberfläche zentral in `js/texte.js`.
- Kindgerecht; keine geschützten Namen.
- Planet: Kantenlänge 2048 (Parameter `groesse`), Höhe 0–127, Chunks 16 × 128 × 16, Umschlagen in x und z.
- Generierung nur aus Seed und Koordinaten, nie `Math.random`.
- Spielstände: Formatversion in jedem Stand und jeder Datei; ältere Formate immer lesbar; neuere nie anfassen; Kopie vor Migration; Speicher-Namensraum aus dem Pfad.
- Zielwert: ≥ 30 FPS auf iPad 9. Gen., 60 FPS auf Laptop.
- Prüfen: `tests/index.html` im Browser öffnen, erwartet: keine ❌-Zeilen und Abschlusszeile `Fertig: N ok, 0 fehlgeschlagen`. Für Browsersteuerung: Chrome DevTools MCP, `file:///Users/d066068_1/git/_private/spacecraft/tests/index.html`.
- Commits mit `Fixes #N`: Task N entspricht Issue #N (Meilenstein „Stufe 1: Blockwelt“, Board https://github.com/users/ttrabold/projects/1).

## Review Focus

1. **Bauen über den Umschlagrand:** Block bei x = 2047 setzen, während der Spieler bei x = 1 steht, landet bei 2047 und ist sofort sichtbar → Test `zielen trifft über den Rand` (Task 8) und `setzeBlock am Rand markiert beide Nachbar-Chunks` (Task 5).
2. **Speichern scheitert** (Speicher voll, IndexedDB weg, privates Fenster): alter Stand bleibt unversehrt, Spieler sieht einen Hinweis → Test `fehlgeschlagenes Speichern lässt alten Stand stehen` (Task 7).
3. **Kaputte oder fremde Datei importieren:** verständliche Meldung, kein neuer Slot → Test `import einer fremden Datei wirft ImportFehler` (Task 6).
4. **iPad: App wird in den Hintergrund geschickt oder geschlossen:** zuletzt Gebautes ist gespeichert → `pagehide`/`visibilitychange` speichern sofort; Test `verbergen löst Speichern aus` (Task 13).
5. **Lange Erkundung:** entladene Chunks mit Änderungen gehen nicht verloren, Speicher läuft nicht voll → Test `entladen behält geänderte Chunks` (Task 5).

---

## Dateistruktur

```
index.html                 Version, Lader, Grundgerüst (Canvas, UI-Container)
sw.js                      Service-Worker (Cache aus Version)
manifest.webmanifest       PWA-Manifest; icons/icon-192.png, icons/icon-512.png
css/style.css              Menüs, HUD, Touch-Knöpfe
js/lib/three.min.js        three.js r158 (unverändert)
js/kern.js                 SC-Namensraum, mod, Hash, Zufall, Ereignisse
js/texte.js                alle Oberflächentexte (Deutsch)
js/rauschen.js             periodisches Rauschen
js/bloecke.js              Blocktabelle
js/planet.js               Planet-Objekt, Paletten, Koordinaten-Umschlag
js/bauwerke.js             Bauwerksplatzierung und -vorlagen
js/generator.js            Chunk-Erzeugung (Gelände, Biome, Höhlen, Bäume, Bauwerke)
js/welt.js                 Chunk-Speicher, holeBlock/setzeBlock, Ereignisse
js/spielstand.js           Weltformat, Migration, Export/Import
js/speicher.js             IndexedDB/localStorage, Namensraum, Slots
js/licht.js                Himmels- und Blocklicht pro Chunk
js/mesher.js               Chunk-Geometrie mit Licht und Umgebungsverdeckung
js/texturen.js             Pixel-Texturatlas aus Palette (Canvas)
js/spieler.js              Spieler, Physik, Modi
js/zielen.js               Voxel-Strahl (anvisierter Block)
js/render.js               three.js-Szene, Chunk-Verwaltung, Himmel, Tag/Nacht
js/eingabe.js              Tastatur/Maus
js/touch.js                Touch-Steuerung
js/ui.js                   Menüs, HUD, Blockauswahl, Hinweise
js/spiel.js                Hauptschleife, Verdrahtung, Autospeichern
tests/index.html           Testseite (gleiche Ladereihenfolge, ohne spiel.js-Start)
tests/helfer.js            Mini-Testrahmen
tests/test-*.js            Tests je Modul
```

---

### Task 1: Gerüst, Kern und Testrahmen

**Files:**
- Create: `index.html`, `sw.js`, `manifest.webmanifest`, `icons/icon-192.png`, `icons/icon-512.png`, `css/style.css`, `js/kern.js`, `js/texte.js`, `tests/index.html`, `tests/helfer.js`, `tests/test-kern.js`

**Interfaces:**
- Produces:
  - `SC.mod(a: number, n: number) -> number` (immer `0 ≤ r < n`)
  - `SC.hashText(text: string) -> number` (uint32, z. B. cyrb53 auf 32 Bit gekürzt)
  - `SC.hash3(seed: number, a: number, b: number, c?: number) -> number` (uint32, für Koordinaten)
  - `SC.zufall(seed: number) -> () => number` (deterministisch, Werte in `[0,1)`, z. B. mulberry32)
  - `SC.Ereignisse` Klasse: `an(name, fn)`, `aus(name, fn)`, `sende(name, daten)`
  - `SC.T` Objekt mit allen Texten, z. B. `SC.T.neueWelt = "Neue Welt"`
  - Testrahmen global: `test(name, fn)` (fn darf Promise liefern), `gleich(ist, soll, text?)`, `wahr(bedingung, text?)`, `wirft(fn, Fehlertyp?)`; Ausgabe je Test `✅ name` oder `❌ name: Meldung`, am Ende `Fertig: N ok, M fehlgeschlagen`.

- [ ] **Step 1: Testseite und Testrahmen anlegen**

`tests/index.html` lädt `helfer.js`, dann dieselbe Skriptliste wie `index.html` (mit `../`-Präfix, ohne `js/spiel.js`), dann alle `test-*.js`, dann `testsStarten()`. Lader in beiden Dateien als Array von Pfaden, die nacheinander per `<script>`-Element mit `?v=` geladen werden (`async=false`).

- [ ] **Step 2: Fehlschlagende Tests schreiben (`tests/test-kern.js`)**

```js
test("mod liefert nie negative Werte", function(){ gleich(SC.mod(-1,2048),2047); gleich(SC.mod(2048,2048),0); gleich(SC.mod(-4097,2048),2047); });
test("hashText ist stabil", function(){ gleich(SC.hashText("Spacecraft"), SC.hashText("Spacecraft")); wahr(SC.hashText("a")!==SC.hashText("b")); });
test("zufall ist deterministisch", function(){ var a=SC.zufall(42),b=SC.zufall(42); for(var i=0;i<5;i++){ var x=a(); gleich(x,b()); wahr(x>=0&&x<1); } });
test("hash3 unterscheidet Koordinaten", function(){ wahr(SC.hash3(1,2,3)!==SC.hash3(1,3,2)); });
test("Ereignisse kommen an", function(){ var e=new SC.Ereignisse(),n=0; e.an("x",function(d){n+=d;}); e.sende("x",2); gleich(n,2); });
```

- [ ] **Step 3: Testseite öffnen, Fehlschlag sehen**

Öffnen: `file:///Users/d066068_1/git/_private/spacecraft/tests/index.html`. Erwartet: ❌-Zeilen (`SC` nicht definiert).

- [ ] **Step 4: `js/kern.js`, `js/texte.js` und Gerüst umsetzen**

`index.html`: `<title>Spacecraft</title>`, Viewport mit `viewport-fit=cover`, `apple-mobile-web-app-capable`, Manifest-Link, `<canvas id="leinwand">`, `<div id="ui">`; im Kopf `var V="0.1.0"` und der Lader mit der Skriptliste. Bis Task 13 zeigt `index.html` nur einen Startbildschirm-Platzhalter. `sw.js`: Cache `spacecraft-<V>` (V per `?v=` beim Registrieren übergeben), Network-first für `index.html`, Cache-first sonst; Registrierung nur bei `http(s):`. Icons: einfaches Pixel-Raumschiff/Block-Motiv, PNG.

- [ ] **Step 5: Testseite öffnen, alles grün**

Erwartet: `Fertig: 5 ok, 0 fehlgeschlagen`. Zusätzlich `index.html` per `file://` öffnen: keine Konsolenfehler.

- [ ] **Step 6: Commit**

```bash
git add index.html sw.js manifest.webmanifest icons css js tests
git commit -m "Gerüst: Lader, Kern, Testrahmen (Fixes #N)"
```

---

### Task 2: Periodisches Rauschen

**Files:**
- Create: `js/rauschen.js`, `tests/test-rauschen.js`
- Modify: Skriptliste in `index.html` und `tests/index.html`

**Interfaces:**
- Consumes: `SC.zufall`, `SC.mod`
- Produces:
  - `SC.Rauschen` Klasse: `new SC.Rauschen(seed: number)`
  - `.flach(x: number, z: number, periode: number, skala: number) -> number` in `[-1,1]`, periodisch: `flach(x+periode, z) === flach(x, z)` (gleiches für z). `periode` muss ganzzahliges Vielfaches von `skala` sein.
  - `.raum(x, y, z, periode, skala) -> number` in `[-1,1]`, periodisch in x und z (für Höhlen)
  - `.oktaven(x, z, periode, skala, anzahl) -> number` in `[-1,1]`

Umsetzung: Gitter-Gradientenrauschen, bei dem die Gitterkoordinaten mit `SC.mod(i, periode/skala)` gefaltet werden, bevor der Gradient per Hash gewählt wird. Oktaven verdoppeln die Frequenz, die Periode bleibt (deshalb `skala` je Oktave halbieren und Teilbarkeit prüfen).

- [ ] **Step 1: Fehlschlagende Tests**

```js
test("flach ist nahtlos über die Periode", function(){ var r=new SC.Rauschen(7); for(var i=0;i<20;i++){ var x=i*37.3,z=i*11.1; gleich(r.flach(x,z,2048,64), r.flach(x+2048,z,2048,64)); gleich(r.flach(x,z,2048,64), r.flach(x,z-2048,2048,64)); } });
test("flach bleibt im Bereich", function(){ var r=new SC.Rauschen(1); for(var i=0;i<1000;i++){ var v=r.flach(i*3.7,i*1.3,2048,32); wahr(v>=-1&&v<=1); } });
test("gleicher Seed gleiches Rauschen", function(){ gleich(new SC.Rauschen(5).oktaven(100,200,2048,256,4), new SC.Rauschen(5).oktaven(100,200,2048,256,4)); });
test("raum ist nahtlos in x und z", function(){ var r=new SC.Rauschen(3); gleich(r.raum(10,40,20,2048,16), r.raum(2058,40,2068,2048,16)); });
test("Rand ohne Sprung", function(){ var r=new SC.Rauschen(9); wahr(Math.abs(r.oktaven(2047.5,500,2048,256,4)-r.oktaven(-0.5,500,2048,256,4))<1e-9); });
```

- [ ] **Step 2: Testseite öffnen, Fehlschlag sehen** — Erwartet: ❌ bei den neuen Tests.
- [ ] **Step 3: `SC.Rauschen` umsetzen**
- [ ] **Step 4: Testseite öffnen** — Erwartet: `0 fehlgeschlagen`.
- [ ] **Step 5: Commit** — `git commit -m "Periodisches Rauschen (Fixes #N)"`

---

### Task 3: Blöcke und Planet

**Files:**
- Create: `js/bloecke.js`, `js/planet.js`, `tests/test-planet.js`
- Modify: Skriptlisten

**Interfaces:**
- Produces:
  - `SC.B` Konstanten: `LUFT=0, GRUNDGESTEIN, STEIN, ERDE, GRAS, SAND, KIES, SCHNEE, WASSER, STAMM, BLAETTER, KRISTALL, LEUCHTPILZ, BRETTER, STEINZIEGEL, GLAS, WOLLE_ROT, WOLLE_BLAU, WOLLE_GELB, WOLLE_WEISS, METALL, METALLGITTER, TECHNIK, LEUCHT_CYAN, LEUCHT_PINK, LEUCHT_GRUEN, BETON` (IDs fest vergeben und nie umnummerieren, Spielstände hängen daran)
  - `SC.BLOECKE[id] = { id, name (aus SC.T), seiten: {oben, seite, unten} (Texturnamen), fest: bool, durchsichtig: bool, leuchten: 0–15, lichtFarbe: [r,g,b] | null, zerstoerbar: bool, inAuswahl: bool }`
  - `SC.PALETTEN.start`, `SC.PALETTEN.fremd` (Farben je Texturname, Himmel Tag/Dämmerung/Nacht, Nebel); Werte aus `docs/design/look-entwurf.html` ableiten
  - `SC.Planet` Klasse: `new SC.Planet({ id, seed, groesse=2048, hoehe=128, palette="start", generatorVersion=1 })`; Methoden `wickel(x) -> number` (`SC.mod(Math.floor(x), groesse)`), `chunkSchluessel(cx, cz) -> "cx,cz"` (cx, cz gefaltet), `chunksProSeite -> groesse/16`
  - `SC.CHUNK = { B: 16, H: 128 }`

- [ ] **Step 1: Fehlschlagende Tests**

```js
test("Blocktabelle ist vollständig", function(){ Object.keys(SC.B).forEach(function(k){ var b=SC.BLOECKE[SC.B[k]]; wahr(b&&b.id===SC.B[k], k); }); gleich(SC.B.LUFT,0); wahr(SC.BLOECKE[SC.B.KRISTALL].leuchten>0); wahr(!SC.BLOECKE[SC.B.GRUNDGESTEIN].zerstoerbar); });
test("Planet wickelt Koordinaten", function(){ var p=new SC.Planet({id:"start",seed:1}); gleich(p.wickel(-1),2047); gleich(p.wickel(2048.7),0); gleich(p.chunkSchluessel(-1,128),"127,0"); gleich(p.chunksProSeite,128); });
test("jede Textur hat eine Palettenfarbe", function(){ Object.keys(SC.BLOECKE).forEach(function(id){ var s=SC.BLOECKE[id].seiten; if(!s) return; ["oben","seite","unten"].forEach(function(k){ wahr(SC.PALETTEN.start.texturen[s[k]], s[k]); }); }); });
```

- [ ] **Step 2: Testseite öffnen, Fehlschlag sehen**
- [ ] **Step 3: Umsetzen**
- [ ] **Step 4: Testseite öffnen** — Erwartet: `0 fehlgeschlagen`.
- [ ] **Step 5: Commit** — `git commit -m "Blocktabelle und Planet (Fixes #N)"`

---

### Task 4: Generator und Bauwerke

**Files:**
- Create: `js/bauwerke.js`, `js/generator.js`, `tests/test-generator.js`
- Modify: Skriptlisten

**Interfaces:**
- Consumes: `SC.Rauschen`, `SC.Planet`, `SC.B`, `SC.hash3`, `SC.zufall`
- Produces:
  - `SC.Generator` Klasse: `new SC.Generator(planet)`; `.chunk(cx: number, cz: number) -> Uint8Array` (Länge 16·128·16, Index `SC.idx(x, y, z) = (y*16 + z)*16 + x` mit lokalen Koordinaten), `.hoehe(x, z) -> number` (Oberfläche), `.biom(x, z) -> "wiese"|"wald"|"berge"|"wueste"|"strand"|"see"|"kristallfeld"`
  - `SC.idx(x, y, z) -> number` (in `generator.js` oder `kern.js`, einmal definiert)
  - `SC.Bauwerke.inRegion(planet, rx: number, rz: number) -> Bauwerk[]`; Region = 128 × 128 Blöcke (16 × 16 Regionen bei 2048)
  - `SC.Bauwerke.imChunk(planet, cx, cz) -> Bauwerk[]` (alle Bauwerke aus den Nachbarregionen, deren Rahmen den Chunk schneidet, auch über den Umschlagrand)
  - `Bauwerk = { typ: "dungeon"|"herrenhaus"|"station"|"lager", x, y, z (Ursprung, gefaltet), breite, hoehe, tiefe, block(lx, ly, lz) -> id | -1 (-1 = nicht Teil des Bauwerks), plaetze: [{ typ: "gegner"|"kiste", x, y, z }] }`
  - Generatorversion: `SC.GENERATOR_VERSION = 1`

Vorgaben: Grundgestein auf y = 0; Meeresspiegel y = 48; Wasser stehend; Höhlen über `raum`-Rauschen unter der Oberfläche; Bäume pro Spalte über `hash3` entschieden und so platziert, dass sie nicht von der Chunk-Reihenfolge abhängen (Baum-Ursprung per Hash, Chunk sammelt alle Bäume aus dem 1-Block-Rand der Nachbarn). Dungeons unter der Erde, die anderen auf der Oberfläche (an `hoehe` ausgerichtet). Pro Region im Mittel mindestens ein Bauwerk, jedes mit mindestens einem `kiste`-Platz.

- [ ] **Step 1: Fehlschlagende Tests**

```js
function planet(s){ return new SC.Planet({id:"start",seed:s||1234}); }
test("gleicher Seed gleicher Chunk", function(){ var a=new SC.Generator(planet()).chunk(5,7), b=new SC.Generator(planet()).chunk(5,7); for(var i=0;i<a.length;i++) if(a[i]!==b[i]) { wahr(false,"Index "+i); return; } wahr(true); });
test("anderer Seed andere Welt", function(){ wahr(new SC.Generator(planet(1)).hoehe(300,300)!==new SC.Generator(planet(2)).hoehe(300,300) || new SC.Generator(planet(1)).hoehe(900,40)!==new SC.Generator(planet(2)).hoehe(900,40)); });
test("Grundgestein unten", function(){ var c=new SC.Generator(planet()).chunk(0,0); gleich(c[SC.idx(3,0,9)], SC.B.GRUNDGESTEIN); });
test("Gelände ist am Umschlagrand stetig", function(){ var g=new SC.Generator(planet()); for(var z=0;z<2048;z+=97) wahr(Math.abs(g.hoehe(2047,z)-g.hoehe(0,z))<=2, "z="+z); });
test("Chunk 127 und Chunk 0 passen zusammen", function(){ var g=new SC.Generator(planet()); gleich(g.chunk(-1,3)[SC.idx(15,60,4)], g.chunk(127,3)[SC.idx(15,60,4)]); });
test("Bauwerke hängen nicht von der Reihenfolge ab", function(){ var p=planet(); var a=JSON.stringify(SC.Bauwerke.imChunk(p,40,40).map(function(b){return [b.typ,b.x,b.y,b.z];})); SC.Bauwerke.imChunk(p,90,10); gleich(JSON.stringify(SC.Bauwerke.imChunk(p,40,40).map(function(b){return [b.typ,b.x,b.y,b.z];})), a); });
test("genug Bauwerke und jedes mit Kiste", function(){ var p=planet(),n=0,typen={}; for(var rx=0;rx<16;rx++) for(var rz=0;rz<16;rz++) SC.Bauwerke.inRegion(p,rx,rz).forEach(function(b){ n++; typen[b.typ]=1; wahr(b.plaetze.some(function(q){return q.typ==="kiste";}), b.typ); }); wahr(n>=256,"nur "+n); gleich(Object.keys(typen).length,4); });
test("jeder Chunk unter einem Bauwerk kennt es, auch über den Rand", function(){ var p=planet(); [0,15].forEach(function(rx){ for(var rz=0;rz<16;rz++) SC.Bauwerke.inRegion(p,rx,rz).forEach(function(b){ for(var x=b.x;x<b.x+b.breite;x+=16) for(var z=b.z;z<b.z+b.tiefe;z+=16){ var cx=SC.mod(Math.floor(x/16),128),cz=SC.mod(Math.floor(z/16),128); wahr(SC.Bauwerke.imChunk(p,cx,cz).some(function(c){return c.typ===b.typ&&c.x===b.x&&c.z===b.z;}), b.typ+" fehlt in "+cx+","+cz); } }); }); });
test("Chunk erzeugen ist schnell genug", function(){ var g=new SC.Generator(planet()),t=performance.now(); for(var i=0;i<10;i++) g.chunk(i,20); wahr((performance.now()-t)/10<30,"ms pro Chunk zu hoch"); });
```

- [ ] **Step 2: Testseite öffnen, Fehlschlag sehen**
- [ ] **Step 3: `js/bauwerke.js` umsetzen** (Vorlagen als Funktionen, die ein lokales Voxelfeld füllen; Raumaufteilung, Gänge, Fenster; nichts Gruseliges)
- [ ] **Step 4: `js/generator.js` umsetzen** (Biome über Temperatur/Feuchte-Rauschen, Höhen je Biom, Höhlen, Erz-artige Kristalladern, Bäume, Leuchtpilze in Höhlen und Wald, Bauwerke zuletzt eingeprägt)
- [ ] **Step 5: Testseite öffnen** — Erwartet: `0 fehlgeschlagen`.
- [ ] **Step 6: Commit** — `git commit -m "Generator mit Biomen, Höhlen und Bauwerken (Fixes #N)"`

---

### Task 5: Welt

**Files:**
- Create: `js/welt.js`, `tests/test-welt.js`
- Modify: Skriptlisten

**Interfaces:**
- Consumes: `SC.Generator`, `SC.Planet`, `SC.Ereignisse`, `SC.idx`
- Produces:
  - `SC.Welt` Klasse: `new SC.Welt(planet, gespeicherteChunks?: {[schluessel]: Uint8Array})`
  - `.holeBlock(x, y, z) -> id` (wickelt x/z; y außerhalb 0–127 → `LUFT`; lädt/erzeugt Chunk bei Bedarf)
  - `.setzeBlock(x, y, z, id, quelle: "spieler"|"netz"|"system") -> bool` (false bei Grundgestein, y außerhalb, gleicher Block); markiert Chunk als geändert und als „neu zu zeichnen“, bei Randblöcken auch den Nachbarn; sendet `ereignisse.sende("block", {x,y,z,id,alt,quelle})`
  - `.chunk(cx, cz) -> Uint8Array`, `.istGeladen(cx, cz) -> bool`, `.entlade(cx, cz)` (geänderte Chunks bleiben in `geaenderte` erhalten)
  - `.geaenderte -> Map<schluessel, Uint8Array>`, `.neuZuZeichnen -> Set<schluessel>`, `.ereignisse -> SC.Ereignisse`

- [ ] **Step 1: Fehlschlagende Tests**

```js
function welt(){ return new SC.Welt(new SC.Planet({id:"start",seed:99})); }
test("setzeBlock und holeBlock", function(){ var w=welt(); wahr(w.setzeBlock(10,70,10,SC.B.GLAS,"spieler")); gleich(w.holeBlock(10,70,10),SC.B.GLAS); gleich(w.holeBlock(10+2048,70,10-2048),SC.B.GLAS); });
test("Grundgestein bleibt", function(){ var w=welt(); wahr(!w.setzeBlock(5,0,5,SC.B.LUFT,"spieler")); });
test("Ereignis bei Blockänderung", function(){ var w=welt(),e=null; w.ereignisse.an("block",function(d){e=d;}); w.setzeBlock(1,70,1,SC.B.METALL,"spieler"); gleich(e.id,SC.B.METALL); gleich(e.quelle,"spieler"); });
test("setzeBlock am Rand markiert beide Nachbar-Chunks", function(){ var w=welt(); w.neuZuZeichnen.clear(); w.setzeBlock(2047,70,5,SC.B.STEIN,"spieler"); wahr(w.neuZuZeichnen.has("127,0")); wahr(w.neuZuZeichnen.has("0,0")); });
test("entladen behält geänderte Chunks", function(){ var w=welt(); w.setzeBlock(20,70,20,SC.B.TECHNIK,"spieler"); w.entlade(1,1); wahr(!w.istGeladen(1,1)); gleich(w.holeBlock(20,70,20),SC.B.TECHNIK); });
test("gespeicherte Chunks haben Vorrang vor dem Generator", function(){ var c=new Uint8Array(16*128*16); c[SC.idx(0,100,0)]=SC.B.KRISTALL; var w=new SC.Welt(new SC.Planet({id:"start",seed:99}),{"2,2":c}); gleich(w.holeBlock(32,100,32),SC.B.KRISTALL); });
```

- [ ] **Step 2: Testseite öffnen, Fehlschlag sehen**
- [ ] **Step 3: `SC.Welt` umsetzen**
- [ ] **Step 4: Testseite öffnen** — Erwartet: `0 fehlgeschlagen`.
- [ ] **Step 5: Commit** — `git commit -m "Welt mit zentraler Blockänderung (Fixes #N)"`

---

### Task 6: Spielstand-Format, Migration, Export und Import

**Files:**
- Create: `js/spielstand.js`, `tests/test-spielstand.js`
- Modify: Skriptlisten

**Interfaces:**
- Consumes: `SC.Welt`, `SC.Planet`
- Produces:
  - `SC.FORMAT = 1`
  - Weltdaten (Format 1):
    ```js
    { format: 1, spielVersion: "0.1.0", id, name, seed, erstellt, zuletzt, zuletztExport: null,
      modus: "kreativ"|"zuschauer"|"survival", tageszeit: 0..1, aktuellerPlanet: "start",
      planeten: { start: { id, seed, groesse, palette, generatorVersion, chunks: { "cx,cz": "<base64>" } } },
      spieler: { pos: [x,y,z], blick: [gier, neigung], schnellleiste: [9 ids], ansicht: "ich"|"aussen",
                 lebenspunkte: null, inventar: [] } }
    ```
  - `SC.Spielstand.neu({ name, seedText, modus }) -> Weltdaten` (Planet-Seed = `SC.hashText(seedText + ":start")`; leerer `seedText` → zufälliger aus `crypto.getRandomValues`, als Text gespeichert)
  - `SC.Spielstand.ausWelt(daten, welt, spieler | null) -> Weltdaten` (übernimmt `welt.geaenderte`; bei `spieler` null bleibt `daten.spieler` unverändert)
  - `SC.Spielstand.chunksLaden(planetDaten) -> {[schluessel]: Uint8Array}`
  - `SC.Spielstand.migriere(daten) -> { daten, migriert: bool }`; wirft `SC.ZuNeuFehler`, wenn `daten.format > SC.FORMAT`; ergänzt fehlende Felder mit Standardwerten
  - `SC.Spielstand.exportiere(daten) -> Promise<Blob>` (Inhalt `{ typ: "spacecraft-welt", format, daten }` als JSON, mit `CompressionStream("gzip")` komprimiert, falls vorhanden)
  - `SC.Spielstand.importiere(datei: Blob) -> Promise<Weltdaten>` (erkennt gzip an den Bytes `1f 8b`, sonst JSON; neue `id`, Name unverändert; wirft `SC.ImportFehler` mit Text aus `SC.T` bei falschem Inhalt)
  - `SC.Spielstand.dateiname(daten) -> "<name-klein-mit-bindestrichen>.spacecraft"`

- [ ] **Step 1: Fehlschlagende Tests**

```js
test("neue Welt mit Seed", function(){ var d=SC.Spielstand.neu({name:"Test",seedText:"Mond",modus:"kreativ"}); gleich(d.format,1); gleich(d.seed,"Mond"); gleich(d.planeten.start.seed,SC.hashText("Mond:start")); gleich(d.spieler.schnellleiste.length,9); });
test("leerer Seed wird zufällig", function(){ wahr(SC.Spielstand.neu({name:"a",seedText:"",modus:"kreativ"}).seed.length>0); });
test("Export und Import im Rundlauf", function(){ var d=SC.Spielstand.neu({name:"Rund",seedText:"x",modus:"kreativ"}); var w=new SC.Welt(new SC.Planet(d.planeten.start)); w.setzeBlock(3,90,3,SC.B.GLAS,"spieler"); d=SC.Spielstand.ausWelt(d,w,null); return SC.Spielstand.exportiere(d).then(SC.Spielstand.importiere).then(function(e){ wahr(e.id!==d.id); gleich(e.name,"Rund"); var c=SC.Spielstand.chunksLaden(e.planeten.start)["0,0"]; gleich(c[SC.idx(3,90,3)],SC.B.GLAS); }); });
test("import einer fremden Datei wirft ImportFehler", function(){ return SC.Spielstand.importiere(new Blob(["hallo"])).then(function(){ wahr(false,"kein Fehler"); }, function(f){ wahr(f instanceof SC.ImportFehler); }); });
test("neueres Format wird nicht angefasst", function(){ wirft(function(){ SC.Spielstand.migriere({format:99}); }, SC.ZuNeuFehler); });
test("fehlende Felder werden ergänzt", function(){ var d=SC.Spielstand.neu({name:"a",seedText:"b",modus:"kreativ"}); delete d.spieler.ansicht; delete d.zuletztExport; var m=SC.Spielstand.migriere(d).daten; gleich(m.spieler.ansicht,"ich"); gleich(m.zuletztExport,null); });
test("Dateiname", function(){ gleich(SC.Spielstand.dateiname({name:"Meine Welt!"}),"meine-welt.spacecraft"); });
```

- [ ] **Step 2: Testseite öffnen, Fehlschlag sehen**
- [ ] **Step 3: Umsetzen**
- [ ] **Step 4: Testseite öffnen** — Erwartet: `0 fehlgeschlagen`.
- [ ] **Step 5: Commit** — `git commit -m "Spielstand-Format mit Migration, Export und Import (Fixes #N)"`

---

### Task 7: Speicher und Slots

**Files:**
- Create: `js/speicher.js`, `tests/test-speicher.js`
- Modify: Skriptlisten

**Interfaces:**
- Consumes: `SC.Spielstand`
- Produces:
  - `SC.namensraum(ort: {protocol, hostname, pathname}) -> string`: `"/spacecraft-test/…"` → `"spacecraft-test"`, `"/spacecraft/…"` → `"spacecraft"`, `file:` → `"lokal-datei"`, `localhost`/`127.0.0.1` → `"lokal"`, sonst `"spacecraft"`
  - Backend-Schnittstelle: `{ hole(schluessel) -> Promise<any>, lege(schluessel, wert) -> Promise, loesche(schluessel) -> Promise, art: "indexeddb"|"localstorage"|"speicher" }`
  - `SC.Speicher.backend(namensraum) -> Promise<Backend>` (IndexedDB `sc-<namensraum>`, sonst `localStorage` mit Präfix `sc-<namensraum>:`, sonst flüchtig im Speicher mit `art: "speicher"`)
  - `SC.Slots` Klasse: `new SC.Slots(backend)`; `.liste() -> Promise<Meta[]>` (`Meta = {id, name, seed, modus, zuletzt, zuletztExport, format, zuNeu: bool}`), `.lade(id) -> Promise<Weltdaten>` (migriert; legt vorher Kopie `welt:<id>:sicherung-f<alt>` an, wenn migriert wird; wirft `SC.ZuNeuFehler`), `.speichere(daten) -> Promise`, `.kopiere(id) -> Promise<id>`, `.benenneUm(id, name)`, `.loesche(id)`
  - Schlüssel: `welten` (Liste der Meta), `welt:<id>` (Daten)
  - `SC.Speicher.dauerhaftAnfragen() -> Promise<bool>` (`navigator.storage.persist`, wenn vorhanden)

- [ ] **Step 1: Fehlschlagende Tests**

```js
function testBackend(){ var m={}; return { art:"speicher", hole:function(k){return Promise.resolve(m[k]);}, lege:function(k,v){m[k]=JSON.parse(JSON.stringify(v));return Promise.resolve();}, loesche:function(k){delete m[k];return Promise.resolve();}, _m:m }; }
test("Namensraum aus dem Pfad", function(){ gleich(SC.namensraum({protocol:"https:",hostname:"ttrabold.github.io",pathname:"/spacecraft-test/"}),"spacecraft-test"); gleich(SC.namensraum({protocol:"https:",hostname:"ttrabold.github.io",pathname:"/spacecraft/index.html"}),"spacecraft"); gleich(SC.namensraum({protocol:"file:",hostname:"",pathname:"/x/index.html"}),"lokal-datei"); });
test("Slots anlegen, kopieren, löschen", function(){ var s=new SC.Slots(testBackend()),d=SC.Spielstand.neu({name:"Eins",seedText:"a",modus:"kreativ"}); return s.speichere(d).then(function(){return s.kopiere(d.id);}).then(function(neu){ return s.liste().then(function(l){ gleich(l.length,2); return s.loesche(neu); }); }).then(function(){return s.liste();}).then(function(l){ gleich(l.length,1); gleich(l[0].name,"Eins"); }); });
test("neuerer Stand wird nicht geöffnet und nicht verändert", function(){ var b=testBackend(),s=new SC.Slots(b); b._m["welten"]=[{id:"z",name:"Zukunft",format:99}]; b._m["welt:z"]={format:99,id:"z"}; return s.liste().then(function(l){ wahr(l[0].zuNeu); return s.lade("z"); }).then(function(){wahr(false);},function(f){ wahr(f instanceof SC.ZuNeuFehler); gleich(b._m["welt:z"].format,99); }); });
test("fehlgeschlagenes Speichern lässt alten Stand stehen", function(){ var b=testBackend(),s=new SC.Slots(b),d=SC.Spielstand.neu({name:"Alt",seedText:"a",modus:"kreativ"}); return s.speichere(d).then(function(){ b.lege=function(){return Promise.reject(new Error("voll"));}; d.name="Neu"; return s.speichere(d); }).then(function(){wahr(false);},function(){ gleich(b._m["welt:"+d.id].name,"Alt"); }); });
test("Migration legt Sicherung an", function(){ var b=testBackend(),s=new SC.Slots(b),d=SC.Spielstand.neu({name:"M",seedText:"a",modus:"kreativ"}); delete d.spieler.ansicht; d.format=1; return s.speichere(d).then(function(){ b._m["welt:"+d.id].format=0; return s.lade(d.id); }).then(function(){ wahr(b._m["welt:"+d.id+":sicherung-f0"]); }); });
```

(Für den letzten Test braucht `migriere` einen Pfad von Format 0 auf 1; Format 0 = Format 1 ohne die Felder, die Stufe 1 nachgezogen hat. Das hält den Migrationsweg von Anfang an getestet.)

- [ ] **Step 2: Testseite öffnen, Fehlschlag sehen**
- [ ] **Step 3: Umsetzen** (Speichern: erst Daten schreiben, dann Meta-Liste; schlägt das Schreiben fehl, bleibt alles beim Alten und der Fehler geht an den Aufrufer)
- [ ] **Step 4: Testseite öffnen** — Erwartet: `0 fehlgeschlagen`.
- [ ] **Step 5: Commit** — `git commit -m "Speicher mit Namensraum und Slots (Fixes #N)"`

---

### Task 8: Spieler, Physik, Modi und Zielen

**Files:**
- Create: `js/spieler.js`, `js/zielen.js`, `tests/test-spieler.js`
- Modify: Skriptlisten

**Interfaces:**
- Consumes: `SC.Welt`, `SC.BLOECKE`
- Produces:
  - `SC.Spieler` Klasse: `new SC.Spieler({ id, pos:[x,y,z], blick:[gier,neigung], modus })`; Felder `pos`, `geschw`, `blick`, `modus`, `fliegt`, `aufBoden`, `imWasser`, `schnellleiste`, `auswahl` (0–8), `ansicht`
  - `.schritt(welt, eingabe, dt)`; `eingabe = { vor, zurueck, links, rechts, springen, sinken, sprint, springenNeu }` (Booleans, `springenNeu` nur im ersten Bild des Drückens); Werte: Laufen 4,3 Blöcke/s, Sprint 5,6, Fliegen 11, Sprunghöhe ~1,25 Blöcke, Schwerkraft 32 Blöcke/s², Körper 0,6 × 1,8, Augenhöhe 1,62
  - Kreativ: zweimal `springenNeu` innerhalb 0,3 s schaltet `fliegt`; Zuschauer: `fliegt` immer, keine Kollision; nach jedem Schritt `pos[0]`, `pos[2]` in `[0, groesse)` gefaltet
  - `.augen() -> [x,y,z]`, `.richtung() -> [dx,dy,dz]`
  - `SC.zielen(welt, start:[x,y,z], richtung:[dx,dy,dz], reichweite=6) -> null | { x, y, z, nx, ny, nz }` (Voxel-DDA nach Amanatides/Woo; Koordinaten gefaltet; ignoriert `LUFT` und `WASSER`; `n*` = Normale der getroffenen Fläche, Setzen bei `x+nx` …)
  - `SC.kannSetzen(welt, spieler, x, y, z) -> bool` (nicht in den eigenen Körper, nicht im Zuschauermodus)

- [ ] **Step 1: Fehlschlagende Tests**

```js
function flacheWelt(){ var w=new SC.Welt(new SC.Planet({id:"start",seed:5})); for(var x=0;x<8;x++)for(var z=0;z<8;z++){ for(var y=1;y<128;y++) w.setzeBlock(x,y,z,y<=60?SC.B.STEIN:SC.B.LUFT,"system"); } return w; }
var ruhe={vor:false,zurueck:false,links:false,rechts:false,springen:false,sinken:false,sprint:false,springenNeu:false};
test("Spieler landet auf dem Boden", function(){ var w=flacheWelt(),s=new SC.Spieler({id:"a",pos:[4.5,70,4.5],blick:[0,0],modus:"kreativ"}); for(var i=0;i<120;i++) s.schritt(w,ruhe,1/60); wahr(s.aufBoden); wahr(Math.abs(s.pos[1]-61)<0.01); });
test("Zuschauer fliegt durch Wände", function(){ var w=flacheWelt(),s=new SC.Spieler({id:"a",pos:[4.5,50,4.5],blick:[0,0],modus:"zuschauer"}); var e=Object.assign({},ruhe,{sinken:true}); for(var i=0;i<30;i++) s.schritt(w,e,1/60); wahr(s.pos[1]<50); });
test("zielen trifft Block von oben", function(){ var w=flacheWelt(),t=SC.zielen(w,[4.5,62.6,4.5],[0,-1,0],6); gleich([t.x,t.y,t.z,t.ny].join(),"4,60,4,1"); });
test("zielen trifft über den Rand", function(){ var w=new SC.Welt(new SC.Planet({id:"start",seed:5})); for(var y=60;y<70;y++) w.setzeBlock(2047,y,10,SC.B.METALL,"system"); w.setzeBlock(0,65,10,SC.B.LUFT,"system"); w.setzeBlock(1,65,10,SC.B.LUFT,"system"); var t=SC.zielen(w,[1.5,65.5,10.5],[-1,0,0],6); gleich(t.x,2047); gleich(t.nx,1); });
test("nicht in den eigenen Körper setzen", function(){ var w=flacheWelt(),s=new SC.Spieler({id:"a",pos:[4.5,61,4.5],blick:[0,0],modus:"kreativ"}); wahr(!SC.kannSetzen(w,s,4,61,4)); wahr(SC.kannSetzen(w,s,6,61,4)); });
test("Position bleibt gefaltet", function(){ var w=flacheWelt(),s=new SC.Spieler({id:"a",pos:[0.1,90,4.5],blick:[Math.PI/2,0],modus:"zuschauer"}); s.blick=[ -Math.PI/2,0 ]; var e=Object.assign({},ruhe,{vor:true}); for(var i=0;i<30;i++) s.schritt(w,e,1/60); wahr(s.pos[0]>=0&&s.pos[0]<2048); });
```

- [ ] **Step 2: Testseite öffnen, Fehlschlag sehen**
- [ ] **Step 3: Umsetzen** (Kollision achsenweise gegen feste Blöcke, Schritte bei großem `dt` unterteilen, Schwimmen: Auftrieb beim Springen im Wasser)
- [ ] **Step 4: Testseite öffnen** — Erwartet: `0 fehlgeschlagen`.
- [ ] **Step 5: Commit** — `git commit -m "Spieler, Physik, Modi und Zielen (Fixes #N)"`

---

### Task 9: Licht und Mesher

**Files:**
- Create: `js/licht.js`, `js/mesher.js`, `tests/test-mesher.js`
- Modify: Skriptlisten

**Interfaces:**
- Consumes: `SC.Welt`, `SC.BLOECKE`
- Produces:
  - `SC.Licht.chunk(welt, cx, cz) -> { himmel: Uint8Array, block: Uint8Array }` (je 0–15 pro Block, Index `SC.idx`; Himmelslicht 15 über der höchsten lichtundurchlässigen Stelle und per Flutfüllung seitlich/abwärts; Blocklicht per Flutfüllung ab `leuchten`, über Chunkgrenzen hinweg aus geladenen Nachbarn (1-Chunk-Rand))
  - `SC.Mesher.chunk(welt, cx, cz, licht) -> { fest: Geometrie, durchsichtig: Geometrie }`; `Geometrie = { positionen: Float32Array, uv: Float32Array, licht: Float32Array (2 Werte pro Ecke: himmel, block 0–1), farbe: Float32Array (Lichtfarbe rgb pro Ecke), indizes: Uint32Array }`, Positionen lokal zum Chunk-Ursprung
  - Flächen zwischen zwei festen undurchsichtigen Blöcken entfallen; Wasser/Glas/Blätter im `durchsichtig`-Teil; Umgebungsverdeckung pro Ecke in `licht` eingerechnet
  - `SC.Mesher.uvFuer(texturname) -> [u0,v0,u1,v1]` (aus dem Atlas-Layout, Atlas 16 × 16 Kacheln à 16 px; Layout als Tabelle hier, Pixel in Task 10)

- [ ] **Step 1: Fehlschlagende Tests**

```js
function leereWelt(){ var w=new SC.Welt(new SC.Planet({id:"start",seed:5})); for(var x=0;x<16;x++)for(var z=0;z<16;z++)for(var y=1;y<128;y++) w.setzeBlock(x,y,z,SC.B.LUFT,"system"); return w; }
function flaechen(g){ return g.indizes.length/6; }
test("einzelner Block hat 6 Flächen", function(){ var w=leereWelt(); w.setzeBlock(5,64,5,SC.B.STEIN,"system"); gleich(flaechen(SC.Mesher.chunk(w,0,0,SC.Licht.chunk(w,0,0)).fest),6+256); });
test("verdeckte Flächen entfallen", function(){ var w=leereWelt(); w.setzeBlock(5,64,5,SC.B.STEIN,"system"); w.setzeBlock(6,64,5,SC.B.STEIN,"system"); gleich(flaechen(SC.Mesher.chunk(w,0,0,SC.Licht.chunk(w,0,0)).fest),10+256); });
test("Leuchtblock erhellt Höhle", function(){ var w=leereWelt(); for(var x=0;x<16;x++)for(var z=0;z<16;z++) w.setzeBlock(x,100,z,SC.B.STEIN,"system"); w.setzeBlock(8,50,8,SC.B.LEUCHT_CYAN,"system"); var l=SC.Licht.chunk(w,0,0); wahr(l.himmel[SC.idx(8,60,8)]<=15-8,"Himmelslicht unter der Decke"); gleich(l.block[SC.idx(9,50,8)],SC.BLOECKE[SC.B.LEUCHT_CYAN].leuchten-1); });
test("Himmelslicht oben", function(){ var w=leereWelt(); gleich(SC.Licht.chunk(w,0,0).himmel[SC.idx(3,90,3)],15); });
test("Glas kommt in den durchsichtigen Teil", function(){ var w=leereWelt(); w.setzeBlock(5,64,5,SC.B.GLAS,"system"); gleich(flaechen(SC.Mesher.chunk(w,0,0,SC.Licht.chunk(w,0,0)).durchsichtig),6); });
test("Chunk-Mesh schnell genug", function(){ var w=new SC.Welt(new SC.Planet({id:"start",seed:77})),t=performance.now(); var l=SC.Licht.chunk(w,3,3); SC.Mesher.chunk(w,3,3,l); wahr(performance.now()-t<40,"zu langsam"); });
```

(Die 256 Flächen stammen von der Grundgestein-Schicht bei y = 0: ihre Oberseiten sind sichtbar, die Unterseiten bei y < 0 werden nie erzeugt. Passt der Umsetzende das an, die Zahl im Test mitziehen.)

- [ ] **Step 2: Testseite öffnen, Fehlschlag sehen**
- [ ] **Step 3: Umsetzen**
- [ ] **Step 4: Testseite öffnen** — Erwartet: `0 fehlgeschlagen`.
- [ ] **Step 5: Commit** — `git commit -m "Licht und Chunk-Mesher (Fixes #N)"`

---

### Task 10: Texturen, Darstellung, Tag und Nacht

**Files:**
- Create: `js/lib/three.min.js`, `js/texturen.js`, `js/render.js`, `tests/test-render.js`
- Modify: Skriptlisten (three.js als erstes Skript)

**Interfaces:**
- Consumes: `SC.Mesher`, `SC.Licht`, `SC.Welt`, `SC.PALETTEN`, `SC.Spieler`
- Produces:
  - `SC.Texturen.atlas(palette) -> HTMLCanvasElement` (256 × 256, je Kachel 16 × 16 Pixel-Textur, Muster deterministisch aus Texturname; Leuchtkacheln hell)
  - `SC.chunkVersatz(cx: number, spielerX: number, groesse: number) -> number` (Weltposition des Chunks in x so verschoben, dass sie dem Spieler am nächsten ist: `cx*16 + groesse*Math.round((spielerX - cx*16 - 8)/groesse)`; gleiches für z)
  - `SC.Render` Klasse: `new SC.Render(leinwand, planet)`; `.welt(welt)`, `.bild(spieler, tageszeit, dt)`, `.sichtweite` (Chunks, Standard 6 auf Touch-Geräten, 10 sonst), `.markiere(ziel|null)` (Rahmen um den anvisierten Block), `.fps -> number`
  - Material: `THREE.ShaderMaterial` (oder `onBeforeCompile`) mit Attributen `licht` und `farbe`, Uniform `tageslicht` (0,25 nachts bis 1 tags; Helligkeit = max(himmel·tageslicht, block·farbe)), Nebel in Himmelsfarbe
  - Tageszeit 0–1 (0 = Mitternacht, 0,5 = Mittag), ein Tag 20 Minuten; Himmelsfarben aus der Palette (Tag/Dämmerung/Nacht), Sonne, Mond, Sterne nachts
  - Chunk-Aufbau zeitlich gestaffelt: höchstens ~6 ms pro Bild für Erzeugen und Meshen, nächste Chunks zuerst; Chunks außerhalb `sichtweite + 2` entladen (`welt.entlade`)
  - Dritte-Person-Ansicht: Kamera 4 Blöcke hinter dem Spieler, Spielfigur als einfache Blockfigur (Kopf, Körper, Arme, Beine) in Planetenfarben

- [ ] **Step 1: three.js r158 einchecken**

```bash
curl -fsSL https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js -o js/lib/three.min.js
head -c 200 js/lib/three.min.js
```
Expected: Lizenzkopf von three.js, Datei ≈ 650 KB.

- [ ] **Step 2: Fehlschlagende Tests**

```js
test("Chunk-Versatz nimmt die nächste Kopie", function(){ gleich(SC.chunkVersatz(127,3,2048),-16); gleich(SC.chunkVersatz(0,2040,2048),2048); gleich(SC.chunkVersatz(10,170,2048),160); });
test("Atlas hat die richtige Größe", function(){ var a=SC.Texturen.atlas(SC.PALETTEN.start); gleich(a.width,256); gleich(a.height,256); });
test("Atlas ist deterministisch", function(){ gleich(SC.Texturen.atlas(SC.PALETTEN.start).toDataURL(), SC.Texturen.atlas(SC.PALETTEN.start).toDataURL()); });
```

- [ ] **Step 3: Testseite öffnen, Fehlschlag sehen**
- [ ] **Step 4: `js/texturen.js` und `js/render.js` umsetzen**
- [ ] **Step 5: Testseite öffnen** — Erwartet: `0 fehlgeschlagen`.
- [ ] **Step 6: Sichtprüfung** — vorläufig in `index.html` eine Welt mit Seed `"Test"` erzeugen und die Kamera über das Gelände kreisen lassen (Schalter `?vorschau`). Per Chrome DevTools MCP Screenshot bei Tageszeit 0,5 und 0,0 aufnehmen und mit `docs/design/look-entwurf.html` vergleichen. Erwartet: Pixel-Texturen, Leuchtblöcke nachts mit Lichthof, keine Naht am Rand (Kamera bei x ≈ 2047 platzieren).
- [ ] **Step 7: Commit** — `git commit -m "Texturen, Darstellung, Tag und Nacht (Fixes #N)"`

---

### Task 11: Eingabe mit Tastatur, Maus und Touch

**Files:**
- Create: `js/eingabe.js`, `js/touch.js`, `tests/test-eingabe.js`
- Modify: `css/style.css`, Skriptlisten

**Interfaces:**
- Produces:
  - `SC.Eingabe` Klasse: `new SC.Eingabe(leinwand, uiWurzel)`; `.zustand()` liefert das `eingabe`-Objekt aus Task 8 plus `{ blickDx, blickDy (seit letztem Aufruf, Bogenmaß), abbauen, setzen, auswahl: null|0–8, auswahlRad: -1|0|1, menue, blockauswahl, ansicht }` (Einmal-Aktionen nur im ersten Bild); `.touchAktiv -> bool`; `.empfindlichkeit` (Einstellung)
  - Tastatur/Maus: WASD, Leertaste, Umschalt, Strg = Sprint, linke/rechte Maustaste, Mausrad, 1–9, E, Esc, F5 (und `V` als Ersatz, da F5 im Browser neu lädt; F5 per `preventDefault` abfangen), Pointer Lock beim Klick auf die Leinwand
  - `SC.Touch` (von `SC.Eingabe` erzeugt, sobald ein `touchstart` kommt): Joystick links unten, Wischfläche rechte Hälfte, Knöpfe Springen/Steigen, Sinken, Abbauen, Setzen, Blockauswahl, Menü; Knopfgröße mindestens 64 CSS-Pixel, Größe über Einstellung skalierbar; mehrere Finger gleichzeitig
  - `SC.tastenZuEingabe(gedrueckt: Set<string>) -> Bewegungsteil` (reine Funktion für Tests; Codes nach `KeyboardEvent.code`)

- [ ] **Step 1: Fehlschlagende Tests**

```js
test("Tasten werden zu Bewegung", function(){ var e=SC.tastenZuEingabe(new Set(["KeyW","Space","ShiftLeft"])); wahr(e.vor); wahr(e.springen); wahr(e.sinken); wahr(!e.links); });
test("Joystick-Ausschlag wird zu Richtung", function(){ var e=SC.Touch.joystickZuEingabe(0,-1); wahr(e.vor); wahr(!e.zurueck); var t=SC.Touch.joystickZuEingabe(0.1,0.1); wahr(!t.vor&&!t.rechts,"Totzone"); });
```

- [ ] **Step 2: Testseite öffnen, Fehlschlag sehen**
- [ ] **Step 3: Umsetzen**
- [ ] **Step 4: Testseite öffnen** — Erwartet: `0 fehlgeschlagen`.
- [ ] **Step 5: Commit** — `git commit -m "Eingabe für Tastatur, Maus und Touch (Fixes #N)"`

---

### Task 12: Menüs, HUD und Hinweise

**Files:**
- Create: `js/ui.js`, `tests/test-ui.js`
- Modify: `css/style.css`, `js/texte.js`, Skriptlisten

**Interfaces:**
- Consumes: `SC.Slots`, `SC.Spielstand`, `SC.BLOECKE`, `SC.T`
- Produces:
  - `SC.UI` Klasse: `new SC.UI(wurzel, { slots, beiStart(daten), beiImport(datei), beiExport(id) })`
  - `.zeigeWeltliste()`: Liste (Name, Seed, Modus, „zuletzt gespielt“, „zuletzt exportiert“), Knöpfe Spielen, Umbenennen, Kopieren, Exportieren, Löschen (Bestätigung im Spiel: zweiter Klick auf „Wirklich löschen?“), „Neue Welt“, „Importieren“ (`<input type="file">`). Welten mit `zuNeu` grau mit Text `SC.T.brauchtNeuereVersion`.
  - `.zeigeNeueWelt()`: Name, Seed (leer = zufällig), Modus (Kreativ, Zuschauer; Survival sichtbar, deaktiviert, „kommt bald“)
  - `.zeigePause(daten)`: Weiterspielen, Modus wechseln, Einstellungen (Sichtweite, Mausempfindlichkeit, Touch-Größe, FPS anzeigen), Welt exportieren, Zurück zur Weltliste
  - `.zeigeBlockauswahl(beiWahl(id))`: Raster aller Blöcke mit `inAuswahl`, Kacheln aus dem Atlas
  - `.hud(spieler)`: Fadenkreuz, Schnellleiste (9 Plätze, antippbar), Modus-Anzeige, FPS (optional)
  - `.hinweis(text, dauerMs?)`: kurze Einblendung
  - `SC.UI.exportErinnerung(meta, jetzt) -> bool` (true, wenn `zuletztExport` null und Welt älter als 3 Tage oder `zuletztExport` älter als 7 Tage)
  - `SC.UI.istIOS() -> bool`, `SC.UI.istEigenstaendig() -> bool` (`display-mode: standalone` oder `navigator.standalone`)
  - Hinweise beim Start: iOS ohne eigenständigen Modus → einmalig „Zum Home-Bildschirm hinzufügen“ (gemerkt in `localStorage`); Backend `art === "speicher"` → Warnung „Hier wird nicht dauerhaft gespeichert – Welt exportieren!“
  - Einstellungen in `localStorage` (`sc-<namensraum>:einstellungen`), nicht im Spielstand

- [ ] **Step 1: Fehlschlagende Tests**

```js
test("Export-Erinnerung", function(){ var tag=864e5,jetzt=100*tag; wahr(!SC.UI.exportErinnerung({erstellt:jetzt-tag,zuletztExport:null},jetzt)); wahr(SC.UI.exportErinnerung({erstellt:jetzt-4*tag,zuletztExport:null},jetzt)); wahr(SC.UI.exportErinnerung({erstellt:0,zuletztExport:jetzt-8*tag},jetzt)); });
test("Weltliste zeigt Welten", function(){ var w=document.createElement("div"),b={art:"speicher",m:{},hole:function(k){return Promise.resolve(this.m[k]);},lege:function(k,v){this.m[k]=v;return Promise.resolve();},loesche:function(){return Promise.resolve();}},s=new SC.Slots(b); return s.speichere(SC.Spielstand.neu({name:"Sternenhafen",seedText:"a",modus:"kreativ"})).then(function(){ var ui=new SC.UI(w,{slots:s,beiStart:function(){},beiImport:function(){},beiExport:function(){}}); return ui.zeigeWeltliste(); }).then(function(){ wahr(w.textContent.indexOf("Sternenhafen")>=0); }); });
test("Survival ist sichtbar, aber gesperrt", function(){ var w=document.createElement("div"),ui=new SC.UI(w,{slots:null,beiStart:function(){},beiImport:function(){},beiExport:function(){}}); ui.zeigeNeueWelt(); var s=w.querySelector('[data-modus="survival"]'); wahr(s&&s.disabled); });
```

(`zeigeWeltliste` liefert ein Promise.)

- [ ] **Step 2: Testseite öffnen, Fehlschlag sehen**
- [ ] **Step 3: Umsetzen** (Look der Menüs: dunkler Grund, Pixel-Rahmen, Akzentfarbe Cyan wie die Leuchtblöcke; große Schaltflächen)
- [ ] **Step 4: Testseite öffnen** — Erwartet: `0 fehlgeschlagen`.
- [ ] **Step 5: Commit** — `git commit -m "Menüs, HUD und Hinweise (Fixes #N)"`

---

### Task 13: Spielschleife und Autospeichern

**Files:**
- Create: `js/spiel.js`, `tests/test-spiel.js`
- Modify: `index.html` (Vorschau-Schalter aus Task 10 entfernen), Skriptliste in `index.html` (`js/spiel.js` zuletzt; nicht in `tests/index.html` automatisch starten)

**Interfaces:**
- Consumes: alles Vorige
- Produces:
  - `SC.Spiel` Klasse: `new SC.Spiel({ leinwand, uiWurzel, slots })`; `.starte(daten)`, `.speichere(grund: "auto"|"pause"|"verbergen"|"verlassen") -> Promise`, `.beende()`
  - `SC.Spiel.autoSpeicherIntervall = 30000`
  - Ablauf je Bild: `eingabe.zustand()` → Blick drehen → `spieler.schritt` → `SC.zielen` → Abbauen (Kreativ: sofort, `setzeBlock(..., LUFT, "spieler")`) / Setzen (`SC.kannSetzen`, Block aus Schnellleiste) → Tageszeit fortschreiben → `render.bild` → `ui.hud`
  - Speichern bei: Intervall, Pause-Menü, `visibilitychange` (verborgen), `pagehide`, Verlassen zur Weltliste; Fehlschlag → `ui.hinweis(SC.T.speichernFehlgeschlagen)`, Spiel läuft weiter
  - Export aus Pause-Menü und Weltliste: `SC.Spielstand.exportiere` → Download über `<a download>` mit Objekt-URL; danach `zuletztExport` setzen und speichern
  - Modus wechseln setzt `spieler.modus` und `daten.modus`; Zuschauer blendet Schnellleiste aus
  - Beim ersten Start `SC.Speicher.dauerhaftAnfragen()`; Startpunkt neuer Welten: Spalte in Planetenmitte über Land, `pos[1] = hoehe + 1`

- [ ] **Step 1: Fehlschlagender Test**

```js
test("verbergen löst Speichern aus", function(){ var gespeichert=[],s=Object.create(SC.Spiel.prototype); s.speichere=function(g){gespeichert.push(g);return Promise.resolve();}; SC.Spiel.prototype.lebenszyklusAnmelden.call(s, document); document.dispatchEvent(new Event("visibilitychange")); window.dispatchEvent(new Event("pagehide")); wahr(gespeichert.indexOf("verbergen")>=0); SC.Spiel.prototype.lebenszyklusAbmelden.call(s, document); });
```
(`lebenszyklusAnmelden(doc)` meldet `visibilitychange` an `doc` und `pagehide` an `window` an; bei `visibilitychange` nur speichern, wenn `doc.visibilityState === "hidden"` – im Test ist die Seite sichtbar, deshalb muss `pagehide` hier `"verbergen"` auslösen.)

- [ ] **Step 2: Testseite öffnen, Fehlschlag sehen**
- [ ] **Step 3: Umsetzen**
- [ ] **Step 4: Testseite öffnen** — Erwartet: `0 fehlgeschlagen`.
- [ ] **Step 5: Spieltest per `file://` und `localhost`** (Chrome DevTools MCP; lokaler Server z. B. `python3 -m http.server 8000` im Repo)
  Prüfliste, jede Zeile mit Screenshot oder Konsolenausgabe belegen:
  - Neue Welt mit Seed „Mond“ anlegen, zweite mit leerem Seed; beide in der Liste
  - Laufen, Springen, Fliegen (zweimal Leertaste), Blöcke abbauen und setzen, Blockauswahl mit E, Schnellleiste 1–9
  - Zuschauermodus: durch Gelände fliegen, kein Bauen
  - Tag und Nacht: Tageszeit per Konsole auf 0 setzen, Leuchtblöcke erhellen die Umgebung, Orientierung bleibt möglich
  - Einmal über den Umschlagrand laufen (Spieler per Konsole auf x = 2045 setzen): keine Naht, kein Ruckler
  - Ein Bauwerk jeder Art finden (Konsole: `SC.Bauwerke.inRegion` liefert Koordinaten)
  - Welt verlassen, neu laden, weiterspielen: Gebautes und Position sind da
  - Export, Import der Datei: neue Welt mit gleichem Inhalt
  - Touch-Emulation (`emulate` mit `touch`, 1024 × 768): Joystick, Umsehen, Knöpfe funktionieren
  - FPS-Anzeige: Laptop ≥ 60, mit `cpuThrottlingRate: 4` noch ≥ 30
  - Konsole ohne Fehler
- [ ] **Step 6: Commit** — `git commit -m "Spielschleife, Autospeichern, Export (Fixes #N)"`

---

### Task 14: Veröffentlichen und Doku

**Files:**
- Modify: `docs/ROADMAP.md`, ggf. `index.html` (Version), `AGENTS.md` (Aufbau-Abschnitt an die tatsächlichen Dateien anpassen)
- Create: `docs/itch-devlog-0.1.0.md`, `docs/itch-devlog-0.1.0.html` (Entwurf, siehe AGENTS.md)

- [ ] **Step 1: itch-ZIP lokal bauen** — Run: `bash scripts/itch-zip.sh` — Expected: `Erstellt: dist/spacecraft.zip (… Dateien)`, Liste enthält `index.html`, `css/style.css`, alle `js/…`, `js/lib/three.min.js`, Manifest und Icons, kein `sw.js`.
- [ ] **Step 2: Testseite ein letztes Mal öffnen** — Erwartet: `0 fehlgeschlagen`.
- [ ] **Step 3: Ins Test-Repo pushen (nur mit Zustimmung des Nutzers)** — `git push test main:main`, dann https://ttrabold.github.io/spacecraft-test/ auf Laptop und iPad prüfen lassen.
- [ ] **Step 4: Roadmap aktualisieren** (Stufe 1 fertig, Erkenntnisse, nächster Schritt: Design Stufe 2), Devlog-Entwurf schreiben.
- [ ] **Step 5: Commit** — `git commit -m "Stufe 1 abgeschlossen: Doku, Devlog-Entwurf (Fixes #N)"`; Meilenstein „Stufe 1: Blockwelt“ schließen, nachdem der Nutzer die Test-Vorschau abgenommen hat und live gepusht wurde.
