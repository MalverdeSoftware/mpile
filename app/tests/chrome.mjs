// Shared headless Chrome driver for the browser checks, over the Chrome DevTools Protocol (no dependencies).
// Checks run only against a local dev server with synthetic data.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

export const origin = process.env.TEST_ORIGIN || "http://localhost:5173";
if (!["localhost", "127.0.0.1"].includes(new URL(origin).hostname))
  throw Error("Browser checks run only against a local dev server.");
export const creationKey = process.env.RELAY_DEV_CREATION_KEY || "dev-creation-key-synthetic-data-only";
const chrome = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const shots = process.env.SCREENSHOT_DIR || tmpdir();

// A DevTools connection where a call that never answers fails the check by name instead of hanging it.
async function connect(url, onEvent) {
  const ws = new WebSocket(url);
  await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));
  let next = 0;
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    } else onEvent?.(msg);
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++next;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`${method}: no answer from Chrome within 20 seconds`));
      }, 20_000);
      pending.set(id, (msg) => {
        clearTimeout(timer);
        if (msg.error) reject(new Error(`${method}: ${msg.error.message}`));
        else resolve(msg.result);
      });
      ws.send(JSON.stringify({ id, method, params }));
    });
  return { ws, send };
}

// Runs `check(page)` in a fresh headless Chrome profile. `downloads`: a folder that receives downloaded files.
export async function withChrome({ width, height, mobile, downloads }, check) {
  const profile = mkdtempSync(join(tmpdir(), "mpile-chrome-"));
  const browser = spawn(chrome, [
    "--headless=new",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ]);
  const errors = [];
  const sockets = [];
  const started = new Map();
  const finished = [];
  try {
    let port;
    for (let i = 0; i < 100 && !port; i++) {
      try {
        port = readFileSync(join(profile, "DevToolsActivePort"), "utf8").split("\n")[0];
      } catch {
        await sleep(100);
      }
    }
    if (downloads) {
      const { webSocketDebuggerUrl } = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
      // Each download is saved under its GUID; events report the name the page gave it.
      const root = await connect(webSocketDebuggerUrl, (msg) => {
        if (msg.method === "Browser.downloadWillBegin") started.set(msg.params.guid, msg.params.suggestedFilename);
        if (msg.method === "Browser.downloadProgress" && msg.params.state === "completed")
          finished.push({ name: started.get(msg.params.guid), path: join(downloads, msg.params.guid) });
      });
      sockets.push(root.ws);
      await root.send("Browser.setDownloadBehavior", { behavior: "allowAndName", downloadPath: downloads, eventsEnabled: true });
    }
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
    const { ws, send } = await connect(target.webSocketDebuggerUrl, (msg) => {
      if (msg.method === "Runtime.exceptionThrown") errors.push(msg.params.exceptionDetails.exception?.description ?? "exception");
      else if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error")
        errors.push(msg.params.args.map((a) => a.value ?? a.description).join(" "));
      // Browser-reported errors, such as content security policy violations. HTTP error statuses ("network") are
      // left out: the checks cause some on purpose (a wrong passcode, a deleted session) and assert the page's handling.
      else if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error" && msg.params.entry.source !== "network")
        errors.push(`${msg.params.entry.source}: ${msg.params.entry.text}`);
    });
    sockets.push(ws);

    const evaluate = async (expression) =>
      (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result.value;
    const screenshot = async (name, fullPage = false) =>
      writeFileSync(
        join(shots, `${name}.png`),
        Buffer.from((await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: fullPage })).data, "base64"),
      );
    const waitFor = async (expression, label, timeout = 15_000) => {
      for (const end = Date.now() + timeout; Date.now() < end; await sleep(150)) if (await evaluate(expression)) return;
      await screenshot("failure");
      const text = await evaluate("document.body.innerText.slice(0, 600)");
      throw new Error(`Timed out waiting for ${label}. Page shows:\n${text}`);
    };
    const hasText = (text) => `document.body.innerText.includes(${JSON.stringify(text)})`;
    // Marks the current page so a later check waits until a navigation or reload has replaced it, rather than
    // passing on the old page's text (and racing the reload with the next DevTools call).
    const markPage = () => evaluate("window.__previousPage = true");
    const newPage = (expression) => `!window.__previousPage && ${expression}`;
    // Taps the element an expression returns, the way a pointer would: once nothing else (such as a dialog's overlay
    // while it animates open) is on top of it.
    const tapElement = async (expression, description) => {
      let box = null;
      for (const end = Date.now() + 5_000; Date.now() < end && !box?.onTop; await sleep(100))
        box = await evaluate(`(() => {
          const el = ${expression};
          if (!el) return null; el.scrollIntoView({ block: "center" }); const r = el.getBoundingClientRect();
          const x = r.x + r.width / 2, y = r.y + r.height / 2, hit = document.elementFromPoint(x, y);
          return { x, y, onTop: !!hit && (hit === el || el.contains(hit)) };
        })()`);
      assert.ok(box, `nothing to tap: ${description}`);
      assert.ok(box.onTop, `something covers ${description}`);
      for (const type of ["mouseMoved", "mousePressed", "mouseReleased"])
        await send("Input.dispatchMouseEvent", { type, x: box.x, y: box.y, button: "left", clickCount: 1, pointerType: "mouse" });
    };
    const tap = (selector, label) =>
      tapElement(
        `[...document.querySelectorAll(${JSON.stringify(selector)})].find((e) => ${label ? `e.innerText.includes(${JSON.stringify(label)}) || e.getAttribute("aria-label") === ${JSON.stringify(label)}` : "true"})`,
        `${selector} ${label ?? ""}`,
      );
    const type = async (selector, text) => {
      await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);
      await send("Input.insertText", { text });
    };
    // Waits for the next finished download the page named `name`, and returns where it was saved.
    const download = async (name) => {
      for (let i = 0; i < 100; i++, await sleep(100)) {
        const index = finished.findIndex((d) => d.name === name);
        if (index >= 0) return finished.splice(index, 1)[0].path;
      }
      throw new Error(`${name} was not downloaded`);
    };
    // Picks a local file in an <input type="file">, as the file dialog would.
    const pickFile = async (selector, path) => {
      const { root } = await send("DOM.getDocument");
      const { nodeId } = await send("DOM.querySelector", { nodeId: root.nodeId, selector });
      await send("DOM.setFileInputFiles", { nodeId, files: [path] });
    };

    await send("Runtime.enable");
    await send("Log.enable");
    await send("Page.enable");
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 2, mobile });
    await check({ send, evaluate, screenshot, waitFor, hasText, markPage, newPage, tap, tapElement, type, pickFile, download, errors, shots });
  } finally {
    for (const ws of sockets) ws.close();
    browser.kill();
    await sleep(300);
    rmSync(profile, { recursive: true, force: true });
  }
}
