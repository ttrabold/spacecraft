// Startet Chrome ohne Fenster, öffnet tests/index.html und wartet echt, bis die Abschlusszeile da ist.
// Nur Node-Bordmittel (eingebautes WebSocket ab Node 22), kein npm.
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path"), os = require("os");
const chrome = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const profil = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), "sc-tests-"));
const seite = "file://" + path.resolve(__dirname, "../tests/index.html");
const p = spawn(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--user-data-dir=" + profil, "--allow-file-access-from-files", "--remote-debugging-port=0", "about:blank"], { stdio: "ignore" });
const ende = (code) => { try { p.kill(); } catch (e) {} setTimeout(() => { try { fs.rmSync(profil, { recursive: true, force: true }); } catch (e) {} process.exit(code); }, 300); };
const warte = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  let port;
  for (let i = 0; i < 100 && !port; i++) { await warte(100); try { port = fs.readFileSync(path.join(profil, "DevToolsActivePort"), "utf8").split("\n")[0]; } catch (e) {} }
  if (!port) { console.log("Chrome startet nicht"); return ende(1); }
  const ziele = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const ws = new WebSocket(ziele.find((z) => z.type === "page").webSocketDebuggerUrl);
  let n = 0; const offen = {};
  const sende = (method, params) => new Promise((r) => { const id = ++n; offen[id] = r; ws.send(JSON.stringify({ id, method, params })); });
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (offen[m.id]) { offen[m.id](m.result); delete offen[m.id]; } };
  await new Promise((r) => (ws.onopen = r));
  await sende("Page.navigate", { url: seite });
  const frist = Date.now() + Number(process.env.WARTEN || 120000);
  while (Date.now() < frist) {
    await warte(500);
    const r = await sende("Runtime.evaluate", { expression: "Array.from(document.querySelectorAll('#ausgabe div')).map(d=>d.textContent).join('\\n')", returnByValue: true });
    const text = (r && r.result && r.result.value) || "";
    if (/^Fertig:/m.test(text)) {
      const zeilen = text.split("\n");
      zeilen.filter((z) => z.startsWith("❌")).forEach((z) => console.log(z));
      const f = zeilen.find((z) => z.startsWith("Fertig:"));
      console.log(f);
      return ende(/, 0 fehlgeschlagen/.test(f) && !zeilen.some((z) => z.startsWith("❌")) ? 0 : 1);
    }
  }
  console.log("Zeitüberschreitung – Tests nicht durchgelaufen");
  ende(1);
})();
