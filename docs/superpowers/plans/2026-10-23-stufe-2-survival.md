# Stufe 2: Survival – Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Survival-Modus mit Gegnern, actionreichem Kampf (Laserschwert, Blaster), Stufen, Beute in fünf Seltenheiten, Rucksack/Ausrüstung, Schwierigkeit, Kisten und Bossen – als Version 0.5.0.

**Architecture:** Reine Spiellogik (Werte, Beute, Rucksack, Wesen, KI, Kampf, Auftauchen) in eigenen Dateien unter `SC`, getestet auf `tests/index.html`; Darstellung (`render-wesen.js`) und Oberfläche (`ui-rucksack.js`) getrennt. Gegner, Geschosse und Beutekugeln leben in `welt.wesen` (Map nach ID) – Grundlage für den Gastgeber in Stufe 3. Zufall wird immer als Funktion übergeben (`zf`), nie `Math.random` in der Logik.

**Tech Stack:** wie Stufe 1 (klassische Skripte, three.js r158, Web Audio).

**Spec:** `docs/superpowers/specs/2026-10-23-stufe-2-survival-design.md`

## Global Constraints

- Alles aus AGENTS.md: keine Module, läuft per `file://`, iPadOS 16.7, Texte in `js/texte.js`, Ladereihenfolge in `index.html` und `tests/index.html` identisch, Version nur in `index.html`.
- Version am Ende: `var V="0.5.0"`.
- Spielstand-Format 2, `SC.FORMAT = 2`; Format 0 und 1 bleiben lesbar.
- `SC.GENERATOR_VERSION = 2` (Kisten im Generator).
- Kindgerecht: „besiegt“, nie „getötet“; Gegner zerfallen in Funken; keine geschützten Namen.
- Obergrenzen: 12 Gegner, 60 Geschosse, 40 Beutekugeln; KI-Entscheidungen 10 Hz.
- Spieler-Stufe 1–30; `erfahrungFuer(s) = round(100 × s^1,5)`; `lebenspunkte(s) = 100 + 12 × (s − 1)`; Erfahrung je Gegner `10 × stufe` (Boss × 5); Schutzformel `schaden × 100 / (100 + schutz)`.
- Seltenheit 0–4 (grau, grün, blau, lila, orange), Grundwahrscheinlichkeit 55/28/12/4/1 %, Schwer +1 Stufe wahrscheinlicher, Boss ≥ 2, Kiste ≥ 1.
- Schwierigkeit "friedlich"|"leicht"|"normal"|"schwer", Standard "leicht"; Schadensfaktor 0/0,5/1/1,5; Nacht-Obergrenze 0/3/6/9.
- Ortsstufen: lager 1–5, station 5–12, herrenhaus 10–20, dungeon 15–25; Boss +2.
- Prüfen: `bash scripts/tests.sh` → `Fertig: N ok, 0 fehlgeschlagen` (ohne Sandbox ausführen); Sichtprüfung per Chrome DevTools MCP.
- Commits mit `Fixes #N`: Task N entspricht Issue #(21+N) im Meilenstein „Stufe 2: Survival“.

## Review Focus

1. **Spielstand aus 0.4.0 im Survival laden:** alte Welt umstellen → Stufe 1, leerer Rucksack, Kreativ-Leiste bleibt im Kreativ erhalten → Test `Format 1 → 2 behält Kreativ-Leiste und startet Survival leer` (Task 5).
2. **Rucksack voll beim Aufsammeln/Abbauen:** Block bzw. Kugel bleibt liegen, nichts verschwindet → Test `voller Rucksack lässt Beute liegen` (Task 8) und `Abbauen mit vollem Rucksack` (Task 14).
3. **Besiegt mitten im Bosskampf:** Ausrüstung und Rucksack unverändert, Boss vergisst Spieler, volle Lebenspunkte am Startpunkt → Test `besiegt behält alles und setzt zurück` (Task 8).
4. **Gegner bleibt in Wand/fällt aus der Welt:** Gegner, die feststecken oder unter y = 1 fallen, werden entfernt statt zu hängen → Test `feststeckender Gegner wird entfernt` (Task 7).
5. **Schwierigkeit mitten im Spiel auf Friedlich:** alle Gegner verschwinden sofort, keine neuen → Test `Friedlich entfernt Gegner` (Task 9).

---

## Dateistruktur (neu bzw. geändert)

```
js/werte.js          Stufen, Lebenspunkte, Schaden, Schwierigkeit (rein)
js/gegenstaende.js   Gegenstandsarten, Seltenheit, Beute erzeugen, Namen, Vergleich (rein)
js/rucksack.js       Rucksack 36 Plätze, Abbauzeiten, was ein Block fallen lässt (rein)
js/wesen.js          Körperphysik (gemeinsam mit Spieler), Wesen-Liste, Geschoss, Beutekugel
js/gegner.js         Gegnertabelle SC.GEGNER (Werte, Modell, Verhalten, Beute, Orte)
js/ki.js             Sichtlinie, Verhalten je Art
js/kampf.js          Spieler-Kampfzustand, Waffen, Treffer, Schild, Erholung, Erfahrung, Besiegt
js/auftauchen.js     Gegner an Bauwerksplätzen und nachts, Verschwinden, Obergrenzen
js/render-wesen.js   Modelle, Geschosse, Kugeln, Partikel, Schadenszahlen, Rüstung/Waffe, Abbau-Risse
js/ui-rucksack.js    HUD-Balken, Rucksack/Ausrüstung, Besiegt, Kreativ-Reiter Ausrüstung
geändert: bloecke.js, bauwerke.js, generator.js, spielstand.js, spieler.js, eingabe.js, touch.js,
          gamepad.js, musik.js, audio.js, ui.js, entwickler.js, spiel.js, render.js, texte.js, css/style.css
```
Ladereihenfolge: `werte, gegenstaende, rucksack` nach `planet.js`; `wesen, gegner, ki, kampf, auftauchen` nach `zielen.js`; `render-wesen` nach `render.js`; `ui-rucksack` nach `ui.js`.

---

### Task 1: Werte und Schwierigkeit

**Files:** Create `js/werte.js`, `tests/test-werte.js`; Modify Ladelisten.

**Interfaces – Produces:**
- `SC.Werte.erfahrungFuer(stufe) -> number`, `SC.Werte.lebenspunkte(stufe) -> number`, `SC.Werte.erfahrungFuerGegner(stufe, boss) -> number`
- `SC.Werte.nachSchutz(schaden, schutz) -> number`
- `SC.Werte.gibErfahrung(spielerWerte, menge) -> anzahlAufstiege` (`spielerWerte = {stufe, erfahrung}`, Überlauf trägt in die nächste Stufe, Obergrenze 30)
- `SC.SCHWIERIGKEIT[name] = { schaden, nachtMax, gruppenBonus, genauigkeit (0–1), seltenheitBonus }`
- `SC.ORTSSTUFE[typ] = [min, max]`

- [ ] **Step 1: Tests**
```js
test("Erfahrungskurve", function(){ gleich(SC.Werte.erfahrungFuer(1),100); gleich(SC.Werte.erfahrungFuer(4),800); gleich(SC.Werte.lebenspunkte(1),100); gleich(SC.Werte.lebenspunkte(11),220); });
test("Erfahrung trägt über und endet bei 30", function(){ var w={stufe:1,erfahrung:0}; gleich(SC.Werte.gibErfahrung(w,383),2); gleich(w.stufe,3); gleich(w.erfahrung,383-100-283); var m={stufe:30,erfahrung:0}; gleich(SC.Werte.gibErfahrung(m,1e6),0); gleich(m.stufe,30); });
test("Schutz verringert Schaden", function(){ gleich(SC.Werte.nachSchutz(100,0),100); gleich(SC.Werte.nachSchutz(100,100),50); });
test("Boss gibt fünffache Erfahrung", function(){ gleich(SC.Werte.erfahrungFuerGegner(4,false),40); gleich(SC.Werte.erfahrungFuerGegner(4,true),200); });
test("Schwierigkeiten", function(){ gleich(SC.SCHWIERIGKEIT.friedlich.nachtMax,0); gleich(SC.SCHWIERIGKEIT.leicht.schaden,0.5); gleich(SC.SCHWIERIGKEIT.schwer.nachtMax,9); gleich(SC.ORTSSTUFE.dungeon.join(),"15,25"); });
```
- [ ] **Step 2:** `bash scripts/tests.sh` → neue ❌
- [ ] **Step 3:** umsetzen
- [ ] **Step 4:** `bash scripts/tests.sh` → `0 fehlgeschlagen`
- [ ] **Step 5:** `git commit -m "Werte und Schwierigkeit (Fixes #22)"`

---

### Task 2: Gegenstände und Beute

**Files:** Create `js/gegenstaende.js`, `tests/test-beute.js`; Modify `js/texte.js` (Namen), Ladelisten.

**Interfaces – Produces:**
- `SC.SELTENHEIT = [{name, farbe:"#hex"}, …]` (5 Einträge, Farben grau `#b9c2cc`, grün `#5fdc5f`, blau `#4aa3ff`, lila `#b06bff`, orange `#ffad47`)
- `SC.GEGENSTAENDE[art] = { platz: "waffe"|"helm"|"brust"|"handschuhe"|"stiefel"|"schild", haupt: {wert: basis}, waffe?: {typ:"schwert"|"blaster", rate, tempo, reichweite, hitze} }` für `laserschwert`, `blasterpistole`, `blastergewehr`, `helm`, `brust`, `handschuhe`, `stiefel`, `schildgenerator`
- `SC.Beute.seltenheit(zf, {mindest, bonus}) -> 0..4`
- `SC.Beute.erzeuge(zf, {stufe, art?, ort?, mindest?, bonus?}) -> Gegenstand` (`{id, art, stufe, seltenheit, werte, sonder, name}`; ohne `art` nach Ort gewichtet: station → Blaster/Technik häufiger, herrenhaus → Laserschwert/Rüstung, lager → Pistole/Stiefel, dungeon → alles)
- `SC.Beute.vergleiche(neu, alt|null) -> {[wert]: differenz}`
- `SC.Beute.SONDER` (`doppelsprung`, `abprall`, `leuchten`, `funkenhieb`, `schnellladen`) mit zulässigen Plätzen

- [ ] **Step 1: Tests**
```js
test("Seltenheit folgt den Anteilen", function(){ var zf=SC.zufall(1),n=[0,0,0,0,0]; for(var i=0;i<20000;i++) n[SC.Beute.seltenheit(zf,{})]++; wahr(Math.abs(n[0]/20000-0.55)<0.02); wahr(Math.abs(n[2]/20000-0.12)<0.015); wahr(n[4]>100&&n[4]<320); });
test("Mindest-Seltenheit und Bonus", function(){ var zf=SC.zufall(2); for(var i=0;i<500;i++) wahr(SC.Beute.seltenheit(zf,{mindest:2})>=2); var a=0,b=0; for(var j=0;j<5000;j++){ a+=SC.Beute.seltenheit(zf,{}); b+=SC.Beute.seltenheit(zf,{bonus:1}); } wahr(b>a); });
test("Werte steigen mit Stufe und Seltenheit", function(){ var g1=SC.Beute.erzeuge(SC.zufall(3),{stufe:1,art:"blastergewehr",mindest:0}),g2=SC.Beute.erzeuge(SC.zufall(3),{stufe:20,art:"blastergewehr",mindest:0}); wahr(g2.werte.schaden>g1.werte.schaden); });
test("Sonderkraft erst ab Lila und passend zum Platz", function(){ var zf=SC.zufall(4); for(var i=0;i<300;i++){ var g=SC.Beute.erzeuge(zf,{stufe:10}); if(g.seltenheit<3) gleich(g.sonder,null); else if(g.sonder) wahr(SC.Beute.SONDER[g.sonder].plaetze.indexOf(SC.GEGENSTAENDE[g.art].platz)>=0); } });
test("Namen sind deutsch und kindgerecht", function(){ var g=SC.Beute.erzeuge(SC.zufall(5),{stufe:3,art:"helm",mindest:1}); wahr(/Helm/.test(g.name)); wahr(!/töt|blut/i.test(g.name)); });
test("Vergleich", function(){ var a={werte:{schutz:10,lp:5}},b={werte:{schutz:7}}; var v=SC.Beute.vergleiche(a,b); gleich(v.schutz,3); gleich(v.lp,5); gleich(SC.Beute.vergleiche(a,null).schutz,10); });
```
- [ ] Steps 2–5 wie Task 1; Commit `"Gegenstände und Beute (Fixes #23)"`.

---

### Task 3: Rucksack und Abbauen

**Files:** Create `js/rucksack.js`, `tests/test-rucksack.js`.

**Interfaces – Produces:**
- `SC.Rucksack` Klasse: `new SC.Rucksack(plaetze?: Array(36))`; `.plaetze` (Array 36, `null|{block,anzahl}|{gegenstand}`); `.lege(sache) -> rest` (`sache = {block,anzahl}` → übrig gebliebene Anzahl, Stapel ≤ 64, erst bestehende Stapel, dann freie Plätze, Schnellleiste 0–8 zuerst; `{gegenstand}` → 0 oder 1); `.nimm(platz, anzahl) -> sache|null`; `.hat(blockId) -> anzahl`; `.verbrauche(platz) -> bool` (ein Block weniger); `.tausche(a, b)`; `.alsDaten()`
- `SC.Abbau.zeit(blockId, waffenArt|null) -> sekunden` (Werte aus Spec Abschnitt 9; `laserschwert` halbiert; Grundgestein, Kiste, Kiste offen → `Infinity`)
- `SC.Abbau.ergibt(blockId) -> blockId|null` (Gras → Erde, Glas → null, sonst der Block)

- [ ] **Step 1: Tests**
```js
test("Stapeln bis 64, Schnellleiste zuerst", function(){ var r=new SC.Rucksack(); gleich(r.lege({block:SC.B.STEIN,anzahl:70}),0); gleich(r.plaetze[0].anzahl,64); gleich(r.plaetze[1].anzahl,6); gleich(r.hat(SC.B.STEIN),70); });
test("voller Rucksack gibt Rest zurück", function(){ var r=new SC.Rucksack(); for(var i=0;i<36;i++) r.lege({gegenstand:{id:"g"+i}}); gleich(r.lege({block:SC.B.ERDE,anzahl:5}),5); gleich(r.lege({gegenstand:{id:"x"}}),1); });
test("verbrauchen leert den Platz", function(){ var r=new SC.Rucksack(); r.lege({block:SC.B.GLAS,anzahl:1}); wahr(r.verbrauche(0)); gleich(r.plaetze[0],null); wahr(!r.verbrauche(0)); });
test("Abbauzeiten", function(){ gleich(SC.Abbau.zeit(SC.B.ERDE,null),0.4); gleich(SC.Abbau.zeit(SC.B.STEIN,"laserschwert"),0.7); gleich(SC.Abbau.zeit(SC.B.GRUNDGESTEIN,null),Infinity); });
test("Was ein Block ergibt", function(){ gleich(SC.Abbau.ergibt(SC.B.GRAS),SC.B.ERDE); gleich(SC.Abbau.ergibt(SC.B.GLAS),null); gleich(SC.Abbau.ergibt(SC.B.STAMM),SC.B.STAMM); });
```
(Kisten-IDs kommen in Task 4; der Abbau-Test für Kisten gehört dorthin.)
- [ ] Steps 2–5; Commit `"Rucksack und Abbauzeiten (Fixes #24)"`.

---

### Task 4: Kisten, Boss-Plätze, Generator 2

**Files:** Modify `js/bloecke.js` (`KISTE: 27`, `KISTE_OFFEN: 28`, Texturen `kiste_oben/kiste_seite/kiste_offen` mit Mustern in `texturen.js`, Farben in beiden Paletten), `js/bauwerke.js` (Platztyp `boss`: Herrenhaus Obergeschoss, Dungeon Schatzraum; `bossArt` je Dungeon per `zf`: "schattenritter"|"panzerkoloss", Herrenhaus immer "schattenritter"), `js/generator.js` (`SC.GENERATOR_VERSION = 2`; setzt `KISTE` an jeden `kiste`-Platz beim Einprägen), `js/rucksack.js` (Kisten unzerstörbar); Test `tests/test-generator.js`.

**Interfaces – Produces:** `Bauwerk.plaetze[i].typ ∈ {"gegner","kiste","boss"}`, `Bauwerk.bossArt`, `Bauwerk.schluessel = "<typ>@<x>,<z>"`, `Bauwerk.stufe` (aus `SC.ORTSSTUFE` per Bauwerks-Zufall; Dungeon: obere Hälfte der Spanne, wenn `y < 16`).

- [ ] **Step 1: Tests**
```js
test("Kiste steht am Kistenplatz", function(){ var p=new SC.Planet({id:"start",seed:1234}),w=new SC.Welt(p),b=SC.Bauwerke.inRegion(p,3,3)[0],k=b.plaetze.filter(function(q){return q.typ==="kiste";})[0]; gleich(w.holeBlock(k.x,k.y,k.z),SC.B.KISTE); });
test("Herrenhaus und Dungeon haben einen Boss, Lager und Station nicht", function(){ var p=new SC.Planet({id:"start",seed:1234}),gesehen={}; for(var rx=0;rx<16;rx++)for(var rz=0;rz<16;rz++) SC.Bauwerke.inRegion(p,rx,rz).forEach(function(b){ var n=b.plaetze.filter(function(q){return q.typ==="boss";}).length; gesehen[b.typ]=n; if(b.typ==="herrenhaus"||b.typ==="dungeon") gleich(n,1,b.typ); else gleich(n,0,b.typ); }); });
test("Bauwerksstufe liegt in der Ortsspanne", function(){ var p=new SC.Planet({id:"start",seed:77}); for(var rx=0;rx<16;rx++) SC.Bauwerke.inRegion(p,rx,5).forEach(function(b){ var s=SC.ORTSSTUFE[b.typ]; wahr(b.stufe>=s[0]&&b.stufe<=s[1],b.typ+" "+b.stufe); }); });
test("Kisten sind nicht abbaubar", function(){ gleich(SC.Abbau.zeit(SC.B.KISTE,null),Infinity); wahr(!SC.BLOECKE[SC.B.KISTE].zerstoerbar); });
```
- [ ] Steps 2–5; Commit `"Kisten, Boss-Plätze, Generator-Version 2 (Fixes #25)"`.

---

### Task 5: Spielstand-Format 2

**Files:** Modify `js/spielstand.js`, `tests/test-spielstand.js`, `tests/test-speicher.js` (Migrationstest anpassen).

**Interfaces – Produces:** `SC.FORMAT = 2`; `SC.Spielstand.neu({..., schwierigkeit?})` liefert die Felder aus Spec Abschnitt 12 (`schwierigkeit:"leicht"`, `startpunkt:null`, `spielzeit:0`, `spieler.stufe:1`, `erfahrung:0`, `lebenspunkte:null`, `schild:null`, `rucksack: Array(36).fill(null)`, `ausruestung:{helm:null,brust:null,handschuhe:null,stiefel:null,schild:null}`, `schnellleisteKreativ` = bisherige Leiste, `planeten.start.kisten:{}`, `geraeumt:{}`); `SC.Spielstand.migriere` füllt alle neuen Felder (Format 0/1 → 2), behält `spieler.schnellleiste` als `schnellleisteKreativ`; `SC.Spielstand.ausWelt(daten, welt, spieler, kampf?)` übernimmt Kampfwerte, Rucksack, Ausrüstung, Kisten, geräumt.

- [ ] **Step 1: Tests**
```js
test("Format 1 → 2 behält Kreativ-Leiste und startet Survival leer", function(){ var alt={format:1,name:"A",seed:"s",modus:"kreativ",planeten:{start:{id:"start",seed:1,chunks:{}}},spieler:{pos:[1,2,3],blick:[0,0],schnellleiste:[4,3,2,13,14,15,20,23,9],ansicht:"ich"}}; var d=SC.Spielstand.migriere(alt).daten; gleich(d.format,2); gleich(d.spieler.schnellleisteKreativ.join(),"4,3,2,13,14,15,20,23,9"); gleich(d.spieler.stufe,1); gleich(d.spieler.rucksack.length,36); gleich(d.schwierigkeit,"leicht"); wahr(d.planeten.start.kisten&&d.planeten.start.geraeumt); });
test("Rundlauf mit Ausrüstung", function(){ var d=SC.Spielstand.neu({name:"R",seedText:"r",modus:"survival"}); d.spieler.ausruestung.helm={id:"h",art:"helm",stufe:3,seltenheit:2,werte:{schutz:9},sonder:null,name:"Blauer Helm"}; d.spieler.rucksack[0]={block:SC.B.STEIN,anzahl:12}; return SC.Spielstand.exportiere(d).then(SC.Spielstand.importiere).then(function(e){ gleich(e.spieler.ausruestung.helm.name,"Blauer Helm"); gleich(e.spieler.rucksack[0].anzahl,12); }); });
```
- [ ] Steps 2–5; Commit `"Spielstand-Format 2 (Fixes #26)"`.

---

### Task 6: Körperphysik, Wesen, Geschosse, Beutekugeln

**Files:** Create `js/wesen.js`, `tests/test-wesen.js`; Modify `js/spieler.js` (nutzt `SC.bewegeKoerper`), `js/welt.js` (`this.wesen = new Map()`, `this.naechsteId`).

**Interfaces – Produces:**
- `SC.bewegeKoerper(welt, pos, achse, d, breite, hoehe) -> bool` (aus `spieler.js` herausgelöst; Spieler-Tests bleiben grün)
- `SC.Wesen.neu(welt, art, daten) -> wesen` (`{id, art: "gegner"|"geschoss"|"kugel", pos, geschw, …}`, in `welt.wesen` eingetragen, respektiert Obergrenzen: liefert `null`, wenn voll)
- `SC.Wesen.entferne(welt, id)`
- `SC.Geschoss.schritt(welt, g, dt) -> null | {treffer:"block"} | {treffer:"wesen", id} | {treffer:"spieler"}` (Strahl von alter zu neuer Position gegen Blöcke und Körper; `g = {pos, richtung, tempo, schaden, team:"spieler"|"gegner", farbe, art:"laser"|"spucke", lebensdauer}`; Spucke fällt mit Schwerkraft 12)
- `SC.Kugel.schritt(welt, k, spieler, rucksack, dt) -> "aufgesammelt"|"liegt"|"verschwunden"` (Abstand ≤ 1,5 → in Rucksack, wenn Platz; nach 300 s verschwunden)

- [ ] **Step 1: Tests**
```js
function leer(){ var w=new SC.Welt(new SC.Planet({id:"start",seed:5})); for(var x=0;x<16;x++)for(var z=0;z<16;z++)for(var y=1;y<128;y++) w.setzeBlock(x,y,z,y<=60?SC.B.STEIN:SC.B.LUFT,"system"); return w; }
test("Spieler nutzt gemeinsame Körperphysik", function(){ wahr(typeof SC.bewegeKoerper==="function"); });
test("Geschoss trifft Wand", function(){ var w=leer(); w.setzeBlock(8,62,4,SC.B.STEIN,"system"); var g={pos:[8.5,62.5,10.5],richtung:[0,0,-1],tempo:30,schaden:5,team:"gegner",art:"laser",lebensdauer:3}, r=null; for(var i=0;i<30&&!r;i++) r=SC.Geschoss.schritt(w,g,1/60); gleich(r&&r.treffer,"block"); });
test("Geschoss trifft Gegner, nicht das eigene Team", function(){ var w=leer(),e=SC.Wesen.neu(w,"gegner",{pos:[8.5,61,4.5],breite:0.8,hoehe:1.8}); var g={pos:[8.5,62,10.5],richtung:[0,0,-1],tempo:30,schaden:5,team:"spieler",art:"laser",lebensdauer:3},r=null; for(var i=0;i<30&&!r;i++) r=SC.Geschoss.schritt(w,g,1/60); gleich(r.treffer,"wesen"); gleich(r.id,e.id); var g2={pos:[8.5,62,10.5],richtung:[0,0,-1],tempo:30,schaden:5,team:"gegner",art:"laser",lebensdauer:0.2},r2=null; for(var j=0;j<30&&!r2;j++) r2=SC.Geschoss.schritt(w,g2,1/60); wahr(!r2||r2.treffer!=="wesen"); });
test("Obergrenze für Gegner", function(){ var w=leer(),n=0; for(var i=0;i<20;i++) if(SC.Wesen.neu(w,"gegner",{pos:[4,61,4]})) n++; gleich(n,12); });
test("Kugel wird aufgesammelt", function(){ var w=leer(),r=new SC.Rucksack(),s=new SC.Spieler({id:"a",pos:[4.5,61,4.5],modus:"survival"}),k=SC.Wesen.neu(w,"kugel",{pos:[4.5,61.5,5],sache:{gegenstand:{id:"g"}}}); gleich(SC.Kugel.schritt(w,k,s,r,1/60),"aufgesammelt"); gleich(r.plaetze[0].gegenstand.id,"g"); });
```
- [ ] Steps 2–5; Commit `"Wesen, Geschosse, Beutekugeln (Fixes #27)"`.

---

### Task 7: Gegnertabelle und KI

**Files:** Create `js/gegner.js`, `js/ki.js`, `tests/test-ki.js`.

**Interfaces – Produces:**
- `SC.GEGNER[art] = { name, verhalten, lp(stufe), schaden(stufe), tempo, breite, hoehe, sicht, waffe:{typ, rate, tempo, streuung}, beute:{chance, orte}, modell:[{teil, w,h,d, x,y,z, farbe}], boss?:true, rueckenFaktor? }` für `patrouillendroide`, `weltraumbandit`, `krabbler`, `spucker`, `schattenritter`, `panzerkoloss`
- `SC.KI.sieht(welt, vonPos, zuPos, reichweite) -> bool` (Strahl durch feste, undurchsichtige Blöcke)
- `SC.KI.schritt(welt, gegner, ziel:{pos, sichtbar:bool} | null, dt, zf, schwierigkeit) -> aktion[]` (`aktion = {art:"schuss", richtung, tempo, schaden, geschossArt} | {art:"hieb", reichweite, schaden} | {art:"stampf", radius, schaden} | {art:"blocken"}`); bewegt den Gegner selbst (Körperphysik, Sprung über 1 Block, Leine 30 um `gegner.heim`), Zustände `ruhe | alarm | angriff`, `gegner.bemerkt` für HUD/Musik
- Feststecken (> 3 s keine Bewegung bei Bewegungswunsch) oder `y < 1` → `gegner.entfernen = true`

- [ ] **Step 1: Tests**
```js
function boden(){ var w=new SC.Welt(new SC.Planet({id:"start",seed:5})); for(var x=0;x<32;x++)for(var z=0;z<32;z++)for(var y=1;y<128;y++) w.setzeBlock(x,y,z,y<=60?SC.B.STEIN:SC.B.LUFT,"system"); return w; }
function gegner(w,art,pos){ return SC.Wesen.neu(w,"gegner",{gegnerArt:art,stufe:3,pos:pos,heim:pos.slice(),lp:SC.GEGNER[art].lp(3),breite:SC.GEGNER[art].breite,hoehe:SC.GEGNER[art].hoehe}); }
test("Tabelle hat sechs Arten mit Modell", function(){ ["patrouillendroide","weltraumbandit","krabbler","spucker","schattenritter","panzerkoloss"].forEach(function(a){ wahr(SC.GEGNER[a]&&SC.GEGNER[a].modell.length>0,a); }); });
test("Sichtlinie durch Wand blockiert", function(){ var w=boden(); wahr(SC.KI.sieht(w,[4,62,4],[4,62,14],24)); for(var x=0;x<8;x++) for(var y=61;y<65;y++) w.setzeBlock(x,y,9,SC.B.STEIN,"system"); wahr(!SC.KI.sieht(w,[4,62,4],[4,62,14],24)); });
test("Droide schießt, wenn er den Spieler sieht", function(){ var w=boden(),g=gegner(w,"patrouillendroide",[16.5,61,6.5]),zf=SC.zufall(1),schuss=false; for(var i=0;i<60;i++) SC.KI.schritt(w,g,{pos:[16.5,61,18.5],sichtbar:true},1/10,zf,"normal").forEach(function(a){ if(a.art==="schuss") schuss=true; }); wahr(schuss); wahr(g.bemerkt); });
test("Krabbler läuft zum Spieler", function(){ var w=boden(),g=gegner(w,"krabbler",[4.5,61,4.5]),zf=SC.zufall(2),d0=Math.hypot(20-4.5,20-4.5); for(var i=0;i<30;i++) SC.KI.schritt(w,g,{pos:[20,61,20],sichtbar:true},1/10,zf,"normal"); wahr(Math.hypot(20-g.pos[0],20-g.pos[2])<d0-5); });
test("Gegner bleibt an der Leine", function(){ var w=boden(),g=gegner(w,"weltraumbandit",[4.5,61,4.5]),zf=SC.zufall(3); g.heim=[4.5,61,4.5]; for(var i=0;i<400;i++) SC.KI.schritt(w,g,{pos:[60,61,60],sichtbar:true},1/10,zf,"normal"); wahr(Math.hypot(g.pos[0]-4.5,g.pos[2]-4.5)<=31); });
test("feststeckender Gegner wird entfernt", function(){ var w=boden(),g=gegner(w,"krabbler",[4.5,61,4.5]),zf=SC.zufall(4); for(var x=3;x<7;x++)for(var z=3;z<7;z++) for(var y=61;y<64;y++) if(x===3||x===6||z===3||z===6) w.setzeBlock(x,y,z,SC.B.STEIN,"system"); w.setzeBlock(4,63,4,SC.B.STEIN,"system"); w.setzeBlock(5,63,4,SC.B.STEIN,"system"); w.setzeBlock(4,63,5,SC.B.STEIN,"system"); w.setzeBlock(5,63,5,SC.B.STEIN,"system"); for(var i=0;i<50;i++) SC.KI.schritt(w,g,{pos:[20,61,20],sichtbar:true},1/10,zf,"normal"); wahr(g.entfernen); });
```
- [ ] Steps 2–5; Commit `"Gegnertabelle und KI (Fixes #28)"`.

---

### Task 8: Kampf

**Files:** Create `js/kampf.js`, `tests/test-kampf.js`.

**Interfaces – Produces:**
- `SC.Kampf` Klasse: `new SC.Kampf(welt, spieler, daten, zf)` hält `werte = {stufe, erfahrung, lp, lpMax, schild, schildMax, schutz, schadenBonus, tempoBonus, sonder:Set}`, `rucksack: SC.Rucksack`, `ausruestung`, `hitze`, `ausweichenBis`, `zuletztGetroffen`, `blockt`
- `.ruestungAnwenden()` (Werte aus Ausrüstung + Stufe neu berechnen, Doppelsprung/Leuchten setzen)
- `.waffe() -> Gegenstand|null` (aus Schnellleiste `spieler.auswahl`)
- `.angriff(jetzt, richtung) -> aktion|null` (Schwert-Hieb mit Kombo, Blaster-Schuss mit Hitze/Überhitzung 1,5 s)
- `.blocken(an:bool)`, `.ausweichen(jetzt, richtung) -> bool`
- `.trifftSpieler(schaden, vonRichtung, geschoss?) -> {abgeprallt:bool, schaden}` (Ausweichen → 0; Blocken mit Schwert von vorn: Laser abprallen = neues Geschoss team "spieler" zurück, Nahkampf ½; Schwierigkeitsfaktor; Schild zuerst; Schutz)
- `.trifftGegner(gegner, schaden, vonRichtung) -> {besiegt, schaden}` (Koloss-Rücken ×3/vorn ×0,3; Ritter blockt Laser von vorn)
- `.besiegtGegner(gegner) -> {erfahrung, aufstiege, beute: Gegenstand[]}` (Beute per `SC.Beute.erzeuge` mit Gegnerstufe, Ort, Boss mindest 2, Schwierigkeit-Bonus)
- `.schritt(jetzt, dt)` (Erholung nach 5 s mit 4 %/s, Schild nach 3 s mit 20 %/s, Hitze kühlt ab)
- `.besiegt() -> bool` und `.wiederbeleben(startpunkt)` (volle LP/Schild, Position, alle Gegner `bemerkt=false`)
- `SC.Kampf.oeffneKiste(welt, kampf, x, y, z, bauwerk, zf) -> Gegenstand[]` (2–4 Gegenstände, mindest 1; Block → `KISTE_OFFEN`; `daten.planeten[id].kisten["x,y,z"]=true`)

- [ ] **Step 1: Tests**
```js
function kampf(schw){ var w=new SC.Welt(new SC.Planet({id:"start",seed:5})),d=SC.Spielstand.neu({name:"K",seedText:"k",modus:"survival",schwierigkeit:schw||"normal"}),s=new SC.Spieler({id:"a",pos:[4.5,61,4.5],modus:"survival"}); return new SC.Kampf(w,s,d,SC.zufall(9)); }
test("Schild fängt zuerst ab, dann Schutz", function(){ var k=kampf(); k.werte.schild=20; k.werte.schildMax=20; k.werte.schutz=100; var r=k.trifftSpieler(60,[0,0,1]); gleich(k.werte.schild,0); gleich(Math.round(k.werte.lpMax-k.werte.lp),20); });
test("Leicht halbiert den Schaden", function(){ var k=kampf("leicht"),lp=k.werte.lp; k.trifftSpieler(20,[0,0,1]); gleich(lp-k.werte.lp,10); });
test("Ausweichen macht kurz unverwundbar", function(){ var k=kampf(),lp=k.werte.lp; wahr(k.ausweichen(1000,[0,0,-1])); k.trifftSpieler(50,[0,0,1]); gleich(k.werte.lp,lp); wahr(!k.ausweichen(1100,[0,0,-1]),"Abklingzeit"); });
test("Laserschwert wirft Schüsse von vorn zurück", function(){ var k=kampf(); k.rucksack.plaetze[0]={gegenstand:SC.Beute.erzeuge(SC.zufall(1),{stufe:1,art:"laserschwert"})}; k.spieler.auswahl=0; k.spieler.blick=[0,0]; k.blocken(true); var r=k.trifftSpieler(30,[0,0,1],{art:"laser",pos:[4.5,62,0],richtung:[0,0,1]}); wahr(r.abgeprallt); gleich(k.werte.lp,k.werte.lpMax); });
test("Blaster überhitzt", function(){ var k=kampf(); k.rucksack.plaetze[0]={gegenstand:SC.Beute.erzeuge(SC.zufall(1),{stufe:1,art:"blasterpistole"})}; k.spieler.auswahl=0; var n=0,t=0; for(var i=0;i<200;i++){ t+=50; if(k.angriff(t,[0,0,-1])) n++; k.schritt(t,0.05); } wahr(n>0&&n<200); });
test("Koloss nur von hinten verwundbar", function(){ var k=kampf(),w=k.welt,g=SC.Wesen.neu(w,"gegner",{gegnerArt:"panzerkoloss",stufe:5,pos:[4,61,10],lp:1000,blick:0}); var vorn=k.trifftGegner(g,100,[0,0,1]).schaden, hinten=k.trifftGegner(g,100,[0,0,-1]).schaden; wahr(hinten>vorn*5); });
test("Erfahrung und Beute beim Besiegen", function(){ var k=kampf(),g=SC.Wesen.neu(k.welt,"gegner",{gegnerArt:"schattenritter",stufe:12,pos:[4,61,10],lp:1,boss:true,ort:"herrenhaus"}); var r=k.besiegtGegner(g); gleich(r.erfahrung,600); wahr(r.beute.length>=1&&r.beute.every(function(b){return b.seltenheit>=2;})); wahr(k.werte.stufe>1); });
test("voller Rucksack lässt Beute liegen", function(){ var k=kampf(); for(var i=0;i<36;i++) k.rucksack.plaetze[i]={gegenstand:{id:"v"+i}}; var kg=SC.Wesen.neu(k.welt,"kugel",{pos:[4.5,61.5,4.5],sache:{gegenstand:{id:"neu"}}}); gleich(SC.Kugel.schritt(k.welt,kg,k.spieler,k.rucksack,1/60),"liegt"); wahr(k.welt.wesen.has(kg.id)); });
test("besiegt behält alles und setzt zurück", function(){ var k=kampf(); k.ausruestung.helm={id:"h",art:"helm",werte:{schutz:5}}; k.rucksack.lege({block:SC.B.STEIN,anzahl:9}); k.trifftSpieler(1e6,[0,0,1]); wahr(k.besiegt()); k.wiederbeleben([100.5,70,100.5]); gleich(k.werte.lp,k.werte.lpMax); gleich(k.ausruestung.helm.id,"h"); gleich(k.rucksack.hat(SC.B.STEIN),9); gleich(k.spieler.pos[0],100.5); });
test("Erholung nach fünf Sekunden", function(){ var k=kampf(); k.trifftSpieler(50,[0,0,1]); var lp=k.werte.lp; k.schritt(3000,1); gleich(k.werte.lp,lp); k.schritt(9000,1); wahr(k.werte.lp>lp); });
test("Kiste öffnen gibt Beute und wird offen", function(){ var k=kampf(); k.welt.setzeBlock(8,61,8,SC.B.KISTE,"system"); var b=SC.Kampf.oeffneKiste(k.welt,k,8,61,8,{typ:"lager",stufe:2},SC.zufall(1)); wahr(b.length>=2&&b.length<=4); gleich(k.welt.holeBlock(8,61,8),SC.B.KISTE_OFFEN); wahr(k.daten.planeten.start.kisten["8,61,8"]); });
```
- [ ] Steps 2–5; Commit `"Kampf: Waffen, Treffer, Schild, Erfahrung, Besiegt (Fixes #29)"`.

---

### Task 9: Auftauchen und Verschwinden

**Files:** Create `js/auftauchen.js`, `tests/test-auftauchen.js`.

**Interfaces – Produces:**
- `SC.Auftauchen` Klasse: `new SC.Auftauchen(welt, daten, zf)`; `.schritt(spieler, tageslicht, spielzeit) ` (1-mal pro Sekunde aufrufen): Bauwerke im Umkreis 40 → Gegner an `gegner`-/`boss`-Plätzen (nicht geräumt, `spielzeit - geraeumt < 900` zählt als geräumt), Gruppenbonus der Schwierigkeit; nachts (Tageslicht < 0,55, Modus survival) Krabbler/Spucker 24–48 entfernt auf Oberfläche mit Himmelslicht-Dunkel, nicht in Sicht, bis `nachtMax`; morgens Oberflächengegner entfernen; > 80 entfernt → entfernen; Friedlich → alle Gegner sofort entfernen; Kreativ/Zuschauer → keine Nachtgegner
- `.gegnerBesiegt(gegner, spielzeit)` (markiert Platz; alle Plätze eines Bauwerks besiegt → `daten.planeten[id].geraeumt[schluessel] = spielzeit`)

- [ ] **Step 1: Tests**
```js
function umgebung(schw){ var p=new SC.Planet({id:"start",seed:1234}),w=new SC.Welt(p),d=SC.Spielstand.neu({name:"A",seedText:"a",modus:"survival",schwierigkeit:schw||"normal"}); d.planeten.start.seed=p.seed; return {w:w,d:d,a:new SC.Auftauchen(w,d,SC.zufall(1)),b:SC.Bauwerke.inRegion(p,3,3)[0]}; }
function spielerBei(b,abstand){ return new SC.Spieler({id:"s",pos:[b.x+b.breite/2+abstand,b.y+b.hoehe+2,b.z+b.tiefe/2],modus:"survival"}); }
function gegnerZahl(w){ var n=0; w.wesen.forEach(function(e){ if(e.art==="gegner") n++; }); return n; }
test("Gegner erscheinen an den Plätzen, wenn man nah ist", function(){ var u=umgebung(); u.a.schritt(spielerBei(u.b,200),1,0); gleich(gegnerZahl(u.w),0); u.a.schritt(spielerBei(u.b,20),1,1); wahr(gegnerZahl(u.w)>0); u.w.wesen.forEach(function(e){ if(e.art==="gegner"){ wahr(e.stufe>=u.b.stufe-1&&e.stufe<=u.b.stufe+3); } }); });
test("geräumtes Bauwerk bleibt 15 Minuten leer", function(){ var u=umgebung(); u.d.planeten.start.geraeumt[u.b.schluessel]=100; u.a.schritt(spielerBei(u.b,10),1,500); gleich(gegnerZahl(u.w),0); u.a.schritt(spielerBei(u.b,10),1,1100); wahr(gegnerZahl(u.w)>0); });
test("Friedlich entfernt Gegner", function(){ var u=umgebung(); u.a.schritt(spielerBei(u.b,10),1,1); wahr(gegnerZahl(u.w)>0); u.d.schwierigkeit="friedlich"; u.a.schritt(spielerBei(u.b,10),1,2); gleich(gegnerZahl(u.w),0); });
test("Nachtgegner bis zur Obergrenze, nie zu nah", function(){ var u=umgebung("leicht"),s=new SC.Spieler({id:"s",pos:[1024.5,90,1024.5],modus:"survival"}); for(var i=0;i<30;i++) u.a.schritt(s,0.28,i); var n=0; u.w.wesen.forEach(function(e){ if(e.art==="gegner"&&e.nacht){ n++; wahr(Math.hypot(e.pos[0]-1024.5,e.pos[2]-1024.5)>=24); } }); wahr(n<=3); });
test("weit entfernte Gegner verschwinden", function(){ var u=umgebung(); u.a.schritt(spielerBei(u.b,10),1,1); u.a.schritt(spielerBei(u.b,300),1,2); gleich(gegnerZahl(u.w),0); });
```
- [ ] Steps 2–5; Commit `"Gegner auftauchen und verschwinden (Fixes #30)"`.

---

### Task 10: Darstellung der Wesen

**Files:** Create `js/render-wesen.js`, `tests/test-render-wesen.js`; Modify `js/render.js` (ruft `this.wesen.bild(...)` auf, Figur bekommt Rüstungsteile und Waffe), Ladelisten.

**Interfaces – Produces:**
- `SC.RenderWesen` Klasse: `new SC.RenderWesen(szene, planet)`; `.bild(welt, spielerPos, dt)` (Gegner als Blockmodelle aus `SC.GEGNER[art].modell`, Blinken bei `getroffenBis`, Lebensbalken/Name/Stufe als Sprite über bemerkten Gegnern; Geschosse als leuchtende gestreckte Quader in `farbe`; Kugeln schwebend und drehend in Seltenheitsfarbe; Positionen mit `SC.chunkVersatz`-Logik nahe am Spieler)
- `.funken(pos, farbe, anzahl)` (Partikel, beim Besiegen), `.zahl(pos, text, farbe)` (Schadenszahl, steigt auf, 1 s)
- `.risse(ziel|null, anteil 0–1)` (Abbau-Fortschritt am anvisierten Block)
- `SC.Render.prototype.ausruestung(ausruestung, waffe)` (Figur: Teile in Seltenheitsfarbe; Hand: Laserschwert mit leuchtender Klinge / Blaster statt Block)
- `SC.RenderWesen.modellMasse(art) -> {breite, hoehe}` (reine Funktion für Tests: Hüllquader des Modells)

- [ ] **Step 1: Tests**
```js
test("Modellmaße passen zur Körpergröße der Gegner", function(){ Object.keys(SC.GEGNER).forEach(function(a){ var m=SC.RenderWesen.modellMasse(a),g=SC.GEGNER[a]; wahr(Math.abs(m.hoehe-g.hoehe)<0.35,a+" Höhe"); wahr(Math.abs(m.breite-g.breite)<0.5,a+" Breite"); }); });
test("Seltenheitsfarbe der Klinge", function(){ gleich(SC.RenderWesen.klingenFarbe(4),SC.SELTENHEIT[4].farbe); });
```
- [ ] Steps 2–4
- [ ] **Step 5: Sichtprüfung:** Entwicklerwerkzeuge (Task 14 noch nicht da) → per Konsole `SC.Wesen.neu` je Art vor dem Spieler, Screenshot; Erwartet: alle sechs Modelle erkennbar, kein Grusel.
- [ ] **Step 6:** Commit `"Darstellung von Gegnern, Geschossen, Beute (Fixes #31)"`.

---

### Task 11: Eingabe für den Kampf

**Files:** Modify `js/eingabe.js` (Q → `ausweichen` einmal; `abbauenGehalten`, `setzenGehalten` als Dauerzustand), `js/touch.js` (Knopf ⇆ `ausweichen`; `.beschrifte({angriff:bool, blocken:bool, kiste:bool})` tauscht ⛏/⚔ und ■/🛡), `js/gamepad.js` (B = `ausweichen`, wenn nicht fliegend, über Rückgabe `einmal.ausweichen`; RT/LT gehalten), `tests/test-eingabe.js`, `tests/test-gamepad.js`.

**Interfaces – Produces:** `zustand()` zusätzlich `{ ausweichen: bool, abbauenGehalten: bool, setzenGehalten: bool }`; `SC.zielhilfe(spieler, gegnerListe, richtung, staerke) -> richtung` (dreht bis 4° auf den nächsten Gegner innerhalb 12° um die Mitte, nur für Touch/Gamepad).

- [ ] **Step 1: Tests**
```js
test("Q weicht aus", function(){ var e=new SC.Eingabe(document.createElement("canvas"),document.createElement("div")); e._druecke("KeyQ"); wahr(e.zustand().ausweichen); e._los("KeyQ"); e.entferne(); });
test("Gehaltene Maustaste bleibt gedrückt", function(){ var e=new SC.Eingabe(document.createElement("canvas"),document.createElement("div")); e._maus.abbauen=true; wahr(e.zustand().abbauenGehalten); e.entferne(); });
test("Gamepad B weicht aus", function(){ var z=SC.Gamepad.neuerZustand(); wahr(SC.Gamepad.zuEingabe(pad([0,0,0,0],[1]),z,1/60).einmal.ausweichen); });
test("Zielhilfe rastet nur nahe der Mitte ein", function(){ var s=new SC.Spieler({id:"a",pos:[0,60,0],blick:[0,0]}),nah=[{pos:[0.8,60,-10],hoehe:1.8}],weit=[{pos:[8,60,-10],hoehe:1.8}]; var r=SC.zielhilfe(s,nah,s.richtung(),1); wahr(r[0]>0); var q=SC.zielhilfe(s,weit,s.richtung(),1); gleich(q[0],s.richtung()[0]); });
```
- [ ] Steps 2–5; Commit `"Eingabe für Kampf: Ausweichen, Halten, Zielhilfe (Fixes #32)"`.

---

### Task 12: Oberfläche: HUD, Rucksack, Besiegt, Schwierigkeit

**Files:** Create `js/ui-rucksack.js`, `tests/test-ui-rucksack.js`; Modify `js/ui.js` (Neue Welt: Survival auswählbar, Schwierigkeit; Pause: Schwierigkeit, Survival-Modus wählbar; Blockauswahl: Reiter „Ausrüstung“ im Kreativ), `css/style.css`, `js/texte.js`.

**Interfaces – Produces:**
- `SC.UI.prototype.kampfHud(kampf, gegnerBemerkt:[{name, stufe, lp, lpMax}])` (Lebens-/Schild-/Erfahrungs-/Hitzebalken, roter Rand + Richtungspfeil bei Treffer über `kampf.letzterTreffer`)
- `SC.UI.prototype.zeigeRucksack(kampf, {beiAnlegen, beiWegwerfen, beiLeiste})` (Raster 36, Ausrüstungsplätze, Werte; Antippen → Detail mit `SC.Beute.vergleiche`, Knöpfe „Anlegen“, „In die Schnellleiste“, „Wegwerfen“; Gamepad-Navigation über die vorhandene `navigiere`/`bestaetige`)
- `SC.UI.prototype.zeigeBesiegt(beiWeiter)`
- `SC.UI.prototype.zeigeNeueWelt` mit `[data-schwierigkeit]`-Knöpfen; `beiStart` erhält `schwierigkeit`
- `SC.UI.prototype.zeigeBlockauswahl(beiWahl, {ausruestung:true, beiGegenstand})` (Reiter „Ausrüstung“: Art × Seltenheit, Stufe = Spielerstufe)

- [ ] **Step 1: Tests**
```js
function k2(){ var w=new SC.Welt(new SC.Planet({id:"start",seed:5})),d=SC.Spielstand.neu({name:"K",seedText:"k",modus:"survival"}),s=new SC.Spieler({id:"a",pos:[4.5,61,4.5],modus:"survival"}); return new SC.Kampf(w,s,d,SC.zufall(9)); }
test("Survival und Schwierigkeit in Neue Welt", function(){ var w=document.createElement("div"),ui=new SC.UI(w,{slots:null,beiStart:function(){},beiImport:function(){},beiExport:function(){}}); ui.zeigeNeueWelt(); wahr(!w.querySelector('[data-modus="survival"]').disabled); gleich(w.querySelectorAll("[data-schwierigkeit]").length,4); wahr(w.querySelector('[data-schwierigkeit="leicht"]').classList.contains("an")); });
test("Rucksack zeigt 36 Plätze und Ausrüstung", function(){ var w=document.createElement("div"),ui=new SC.UI(w,{slots:null,beiStart:function(){},beiImport:function(){},beiExport:function(){}}),k=k2(); ui.zeigeRucksack(k,{}); gleich(w.querySelectorAll(".rs-platz").length,36); gleich(w.querySelectorAll(".rs-ausruestung [data-platz]").length,6); });
test("Anlegen tauscht mit dem Ausrüstungsplatz", function(){ var w=document.createElement("div"),ui=new SC.UI(w,{slots:null,beiStart:function(){},beiImport:function(){},beiExport:function(){}}),k=k2(),h=SC.Beute.erzeuge(SC.zufall(1),{stufe:2,art:"helm",mindest:1}); k.rucksack.plaetze[10]={gegenstand:h}; ui.zeigeRucksack(k,{}); w.querySelector('.rs-platz[data-i="10"]').click(); w.querySelector('[data-aktion="anlegen"]').click(); gleich(k.ausruestung.helm.id,h.id); gleich(k.rucksack.plaetze[10],null); });
test("Besiegt-Bildschirm ist freundlich", function(){ var w=document.createElement("div"),ui=new SC.UI(w,{slots:null,beiStart:function(){},beiImport:function(){},beiExport:function(){}}),weiter=false; ui.zeigeBesiegt(function(){weiter=true;}); wahr(w.textContent.indexOf(SC.T.besiegt)>=0); wahr(!/tot|gestorben/i.test(w.textContent)); w.querySelector('[data-aktion="weiter"]').click(); wahr(weiter); });
test("Kampf-HUD zeigt Balken", function(){ var w=document.createElement("div"),ui=new SC.UI(w,{slots:null,beiStart:function(){},beiImport:function(){},beiExport:function(){}}),k=k2(); ui.kampfHud(k,[]); wahr(w.querySelector(".balken-lp")&&w.querySelector(".balken-xp")); });
```
- [ ] Steps 2–5; Commit `"Oberfläche für Survival: HUD, Rucksack, Besiegt, Schwierigkeit (Fixes #33)"`.

---

### Task 13: Klang und Musik für den Kampf

**Files:** Modify `js/audio.js` (Geräusche `blaster`, `schwert`, `blocken`, `abprall`, `treffer`, `getroffen`, `zerfall`, `aufsammeln` mit `{seltenheit}`, `kiste`, `aufstieg`, `besiegt`, `droide`, `krabbler`, `spucker`, `ueberhitzt`), `js/musik.js` (Stimmungen `kampf`, `boss`; `SC.Musik.stimmung({..., kampf, boss})`), `tests/test-audio.js`.

**Interfaces – Produces:** `SC.Musik.stimmung({tageslicht, unterTage, kampf, boss}) -> "boss"|"kampf"|"tief"|"nacht"|"tag"` (Vorrang in dieser Reihenfolge); `SC.Musik.komponiere(seed, "kampf"|"boss")` (Tempo ≥ 120 bzw. ≥ 128, Moll, Pauken auf jedem Schlag); `SC.Audio.prototype.musikTakt` wechselt bei Kampf ohne 4-s-Pause (schnelles Überblenden 1 s), zurück nach 8 s ohne Kampf.

- [ ] **Step 1: Tests**
```js
test("Kampf und Boss haben Vorrang", function(){ gleich(SC.Musik.stimmung({tageslicht:1,unterTage:true,kampf:true}),"kampf"); gleich(SC.Musik.stimmung({tageslicht:1,kampf:true,boss:true}),"boss"); });
test("Kampfmusik ist schnell und treibend", function(){ var k=SC.Musik.komponiere(1,"kampf"),b=SC.Musik.komponiere(1,"boss"); wahr(k.tempo>=120); wahr(b.tempo>=128); wahr(k.moll); var pauken=k.events.filter(function(e){return e.instrument==="pauke"&&e.t<4;}).length; wahr(pauken>=4); });
test("Kampfgeräusche erzeugen Klang", function(){ var ctx=new OfflineAudioContext(1,22050,44100),z=ctx.createGain(); z.connect(ctx.destination); ["blaster","schwert","abprall","zerfall","aufstieg"].forEach(function(n,i){ SC.Klang.erzeuge(ctx,z,n,{seltenheit:3},0.8); }); return ctx.startRendering().then(function(b){ var d=b.getChannelData(0),s=0; for(var i=0;i<d.length;i++) s+=d[i]*d[i]; wahr(Math.sqrt(s/d.length)>0.005); }); });
```
- [ ] Steps 2–5; Commit `"Klang und Musik für den Kampf (Fixes #34)"`.

---

### Task 14: Survival im Spiel verdrahten, Entwicklerwerkzeuge

**Files:** Modify `js/spiel.js`, `js/entwickler.js`, `js/spieler.js` (Doppelsprung-Sonderkraft: zweiter Sprung in der Luft, wenn `spieler.doppelsprung`), `tests/test-spiel.js`, `tests/test-entwickler.js`.

**Ablauf (Survival) je Bild:** Eingabe → Blick → Ausweichen → Kampf/Abbauen/Setzen nach gewählter Sache → `spieler.schritt` → KI aller Gegner (10 Hz) → Aktionen umsetzen (Geschosse erzeugen, Hiebe/Stampfen prüfen) → Geschosse und Kugeln → Treffer → `kampf.schritt` → `auftauchen.schritt` (1 Hz) → Besiegt? → Darstellung, HUD, Musik (`kampf` wenn ein Gegner `bemerkt`, `boss` wenn ein Boss bemerkt).

**Interfaces – Produces:**
- `SC.Spiel.prototype.abbauFortschritt(ziel, dt) -> bool` (Fortschritt je Ziel; Zielwechsel setzt zurück; fertig → Block → `SC.Abbau.ergibt` → Rucksack; voll → Hinweis, Block bleibt **nicht** abgebaut)
- `SC.Spiel.prototype.setzeAusRucksack(x, y, z) -> bool`
- Kreativ/Zuschauer: KI bekommt `ziel = null` (Gegner ignorieren den Spieler), keine Nachtgegner; Lebenspunkte/HUD-Balken nur im Survival
- Moduswechsel: Kreativ ↔ Survival tauscht `spieler.schnellleiste` gegen `daten.spieler.schnellleisteKreativ` bzw. Rucksack-Leiste
- Kiste: Setzen-Taste auf `KISTE` → `SC.Kampf.oeffneKiste`, Gegenstände als Kugeln herausspringen lassen
- Entwicklerwerkzeuge: Abschnitt „Survival“ mit Gegner erscheinen (Art, Stufe), Spielerstufe setzen, Gegenstand erzeugen (Art, Seltenheit), Unverwundbar, Gegner entfernen, Bauwerke zurücksetzen; Anzeige Gegner/Geschosse

- [ ] **Step 1: Tests**
```js
test("Abbauen mit vollem Rucksack", function(){ var s=Object.create(SC.Spiel.prototype),w=new SC.Welt(new SC.Planet({id:"start",seed:5})),d=SC.Spielstand.neu({name:"A",seedText:"a",modus:"survival"}),sp=new SC.Spieler({id:"a",pos:[4.5,90,4.5],modus:"survival"}); s.welt=w; s.spieler=sp; s.daten=d; s.kampf=new SC.Kampf(w,sp,d,SC.zufall(1)); s.ui={hinweis:function(t){s._h=t;}}; for(var i=0;i<36;i++) s.kampf.rucksack.plaetze[i]={gegenstand:{id:"x"+i}}; w.setzeBlock(4,89,4,SC.B.ERDE,"system"); var z={x:4,y:89,z:4}; for(var j=0;j<40;j++) s.abbauFortschritt(z,0.05); gleich(w.holeBlock(4,89,4),SC.B.ERDE); wahr(s._h); });
test("Abbauen dauert und füllt den Rucksack", function(){ var s=Object.create(SC.Spiel.prototype),w=new SC.Welt(new SC.Planet({id:"start",seed:5})),d=SC.Spielstand.neu({name:"A",seedText:"a",modus:"survival"}),sp=new SC.Spieler({id:"a",pos:[4.5,90,4.5],modus:"survival"}); s.welt=w; s.spieler=sp; s.daten=d; s.kampf=new SC.Kampf(w,sp,d,SC.zufall(1)); s.ui={hinweis:function(){}}; w.setzeBlock(4,89,4,SC.B.STEIN,"system"); var z={x:4,y:89,z:4}; wahr(!s.abbauFortschritt(z,1.0)); wahr(s.abbauFortschritt(z,0.5)); gleich(s.kampf.rucksack.hat(SC.B.STEIN),1); });
test("Setzen verbraucht aus dem Rucksack", function(){ var s=Object.create(SC.Spiel.prototype),w=new SC.Welt(new SC.Planet({id:"start",seed:5})),d=SC.Spielstand.neu({name:"A",seedText:"a",modus:"survival"}),sp=new SC.Spieler({id:"a",pos:[4.5,90,4.5],modus:"survival"}); s.welt=w; s.spieler=sp; s.daten=d; s.kampf=new SC.Kampf(w,sp,d,SC.zufall(1)); s.kampf.rucksack.lege({block:SC.B.BRETTER,anzahl:1}); sp.auswahl=0; wahr(s.setzeAusRucksack(10,95,10)); gleich(w.holeBlock(10,95,10),SC.B.BRETTER); wahr(!s.setzeAusRucksack(11,95,10)); });
test("Entwickler: Gegner erscheinen lassen", function(){ var w=document.createElement("div"),welt=new SC.Welt(new SC.Planet({id:"start",seed:3})),sp=new SC.Spieler({id:"a",pos:[1,70,1],modus:"survival"}),spiel={tageszeit:0.25,zeitTempo:1,spieler:sp,welt:welt,render:{fps:60,chunks:new Map(),chunkGrenzen:false,sichtweite:6},daten:{seed:"x"}},pn=new SC.Entwickler.Panel(w,spiel); pn.zeige(); w.querySelector('[data-ew="gegner"]').click(); var n=0; welt.wesen.forEach(function(e){ if(e.art==="gegner") n++; }); gleich(n,1); });
```
- [ ] Steps 2–4
- [ ] **Step 5: Spieltest per DevTools** (Prüfliste, jeweils mit Screenshot oder Werten belegt): Welt aus 0.4.0 auf Survival umstellen (Stufe 1, leerer Rucksack); Lager per Teleport: Banditen bemerken, Kampf mit Pistole, Besiegen → Funken, Erfahrung, Beute aufsammeln; Kiste öffnen; Helm anlegen, an der Figur sichtbar; Station mit Droiden und Deckung; Herrenhaus-Boss: Schwert blockt, Abprall; Dungeon-Boss Koloss von hinten; nachts Krabbler/Spucker, Spucke ausweichen; Besiegt → Wiedereinstieg mit allem; Schwierigkeit Friedlich → Gegner weg; Touch (⚔/🛡/⇆) und Gamepad (RT/LT/B) im Kampf; 12 Gegner + Dauerfeuer bei CPU × 4 ≥ 30 FPS; Kampfmusik setzt ein und endet; Konsole ohne Fehler.
- [ ] **Step 6:** Commit `"Survival im Spiel verdrahtet, Entwicklerwerkzeuge erweitert (Fixes #35)"`.

---

### Task 15: Version 0.5.0, Doku, Test-Vorschau

**Files:** Modify `index.html` (`var V="0.5.0"`), `docs/ROADMAP.md`, `AGENTS.md` (Aufbau: neue Dateien), Create `docs/itch-devlog-0.5.0.md`/`.html`.

- [ ] **Step 1:** `bash scripts/tests.sh` → `0 fehlgeschlagen`; `bash scripts/itch-zip.sh` → ZIP enthält alle neuen `js/`-Dateien.
- [ ] **Step 2:** Roadmap (Stufe 2 umgesetzt, nächster Schritt: Abnahme, dann Stufe 3), Devlog-Entwurf.
- [ ] **Step 3:** Commit `"Version 0.5.0: Survival (Fixes #36)"`; mit Zustimmung `git push test <branch>:main`, Vorschau prüfen lassen; nach Abnahme Fast-Forward nach `main`, live.
