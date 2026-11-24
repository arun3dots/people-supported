const { spawn } = require("node:child_process");
const { existsSync, mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { setTimeout: delay } = require("node:timers/promises");

function findBrowserExecutable() {
  const candidates = [
    process.env.CHROME_BIN,
    process.platform === "win32"
      ? join(
          process.env.PROGRAMFILES || "C:\\Program Files",
          "Google\\Chrome\\Application\\chrome.exe",
        )
      : null,
    process.platform === "win32"
      ? join(
          process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)",
          "Google\\Chrome\\Application\\chrome.exe",
        )
      : null,
    process.platform === "win32" && process.env.LOCALAPPDATA
      ? join(process.env.LOCALAPPDATA, "Google\\Chrome\\Application\\chrome.exe")
      : null,
    process.platform === "win32"
      ? join(
          process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)",
          "Microsoft\\Edge\\Application\\msedge.exe",
        )
      : null,
    process.platform === "win32"
      ? join(
          process.env.PROGRAMFILES || "C:\\Program Files",
          "Microsoft\\Edge\\Application\\msedge.exe",
        )
      : null,
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(
    "Headless browser not found. Install Chrome/Edge or set CHROME_BIN.",
  );
}

async function openCdpBrowser() {
  const executable = findBrowserExecutable();
  const profileDir = mkdtempSync(join(tmpdir(), "cantra-cognito-chrome-"));
  const proc = spawn(
    executable,
    [
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-background-networking",
      "--remote-debugging-port=0",
      `--user-data-dir=${profileDir}`,
      "--host-resolver-rules=MAP web.cantracare.test 127.0.0.1, MAP admin.cantracare.test 127.0.0.1",
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );

  let stderr = "";
  const wsBase = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out starting headless browser:\n${stderr}`));
    }, 20000);
    proc.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Browser exited early (${code}):\n${stderr}`));
    });
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      const match = stderr.match(
        /DevTools listening on (ws:\/\/127\.0\.0\.1:\d+\/[^\s]+)/,
      );
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });
  });

  const debugOrigin = new URL(wsBase.replace(/^ws:/, "http:")).origin;
  let pageWsUrl = null;
  for (let i = 0; i < 40; i++) {
    const targets = await fetch(`${debugOrigin}/json/list`).then((r) =>
      r.json(),
    );
    const page = targets.find((t) => t.type === "page");
    if (page?.webSocketDebuggerUrl) {
      pageWsUrl = page.webSocketDebuggerUrl;
      break;
    }
    await delay(100);
  }
  if (!pageWsUrl) throw new Error("CDP page target unavailable.");

  const ws = new WebSocket(pageWsUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  let nextId = 1;
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(String(event.data));
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message || "CDP error"));
      else resolve(msg.result);
    }
  });

  function send(method, params = {}) {
    const id = nextId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");

  async function evaluate(expression) {
    const res = await send("Runtime.evaluate", {
      expression: `(async () => (${expression}))()`,
      awaitPromise: true,
      returnByValue: true,
    });
    if (res.exceptionDetails) {
      throw new Error(
        res.exceptionDetails.exception?.description ||
          res.exceptionDetails.text ||
          "Browser evaluation failed",
      );
    }
    return res.result?.value;
  }

  async function waitFor(fnDesc, checkFn, timeoutMs = 20000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try {
        const val = await checkFn();
        if (val) return val;
      } catch {
        // Navigation resets execution context; keep polling.
      }
      await delay(100);
    }
    let url = "unknown";
    let text = "";
    try {
      url = await evaluate("window.location.href");
      text = await evaluate(
        "(document.body ? document.body.innerText : '').slice(0, 400)",
      );
    } catch {
      // Ignore secondary diagnostic error.
    }
    throw new Error(`Timed out waiting for ${fnDesc} at ${url}\nBody: ${text}`);
  }

  return {
    send,
    evaluate,
    async goto(url) {
      await send("Page.navigate", { url });
      await waitFor(
        `page ready ${url}`,
        () => evaluate("document.readyState === 'complete'"),
        20000,
      );
    },
    currentUrl: () => evaluate("window.location.href"),
    bodyText: () => evaluate("document.body ? document.body.innerText : ''"),
    waitForUrl: (predicate, ms = 20000) =>
      waitFor("URL condition", async () => {
        const href = await evaluate("window.location.href");
        return predicate(href) ? href : false;
      }, ms),
    waitForText: (pattern, ms = 20000) =>
      waitFor(`text ${pattern}`, async () => {
        const text = await evaluate("document.body ? document.body.innerText : ''");
        const matched =
          pattern instanceof RegExp ? pattern.test(text) : text.includes(pattern);
        return matched ? text : false;
      }, ms),
    async clickSelector(selector) {
      await waitFor(
        `clickable ${selector}`,
        () =>
          evaluate(`(() => {
            const el = document.querySelector(${JSON.stringify(selector)});
            if (!el) return false;
            el.scrollIntoView({ block: 'center' });
            el.click();
            return true;
          })()`),
        10000,
      );
    },
    async realClickSelector(selector) {
      const box = await waitFor(
        `visible ${selector}`,
        () =>
          evaluate(`(() => {
            const el = document.querySelector(${JSON.stringify(selector)});
            if (!el) return null;
            el.scrollIntoView({ block: 'center' });
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) return null;
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          })()`),
        10000,
      );
      await send("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        x: box.x,
        y: box.y,
      });
      await send("Input.dispatchMouseEvent", {
        type: "mousePressed",
        x: box.x,
        y: box.y,
        button: "left",
        clickCount: 1,
      });
      await send("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        x: box.x,
        y: box.y,
        button: "left",
        clickCount: 1,
      });
    },
    async realClickText(selector, textMatch) {
      const box = await waitFor(
        `visible text ${textMatch}`,
        () =>
          evaluate(`(() => {
            const els = Array.from(document.querySelectorAll(${JSON.stringify(selector)}));
            const target = els.find((el) => (el.textContent || '').includes(${JSON.stringify(textMatch)}));
            if (!target) return null;
            target.scrollIntoView({ block: 'center' });
            const r = target.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) return null;
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          })()`),
        10000,
      );
      await send("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        x: box.x,
        y: box.y,
      });
      await send("Input.dispatchMouseEvent", {
        type: "mousePressed",
        x: box.x,
        y: box.y,
        button: "left",
        clickCount: 1,
      });
      await send("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        x: box.x,
        y: box.y,
        button: "left",
        clickCount: 1,
      });
    },
    async fillInput(selector, value) {
      await waitFor(
        `input ${selector}`,
        () =>
          evaluate(`(() => {
            const el = document.querySelector(${JSON.stringify(selector)});
            if (!el) return false;
            el.scrollIntoView({ block: 'center' });
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
          })()`),
        10000,
      );
      await evaluate(`(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        el.focus();
        el.select?.();
      })()`);
      await send("Input.insertText", { text: value });
      await evaluate(`(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
      })()`);
    },
    async getAllCookies() {
      const { cookies } = await send("Network.getAllCookies");
      return cookies;
    },
    setCookie: (cookie) => send("Network.setCookie", cookie),
    clearAllCookies: () => send("Network.clearBrowserCookies"),
    async close() {
      try {
        ws.close();
      } catch {
        // Ignore close error.
      }
      if (proc.exitCode === null && proc.signalCode === null) {
        proc.kill();
        await new Promise((resolve) => proc.once("exit", resolve));
      }
      rmSync(profileDir, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 200,
      });
    },
  };
}

module.exports = { openCdpBrowser };
