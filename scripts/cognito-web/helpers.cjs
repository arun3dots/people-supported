const { createHmac, createSign } = require("node:crypto");
const { request: httpRequest } = require("node:http");

function signHs256(secret, payload) {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const input = `${header}.${body}`;
  const sig = createHmac("sha256", secret).update(input).digest("base64url");
  return `${input}.${sig}`;
}

function signRs256(privateKeyPem, payload) {
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  ).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const input = `${header}.${body}`;
  const sig = createSign("RSA-SHA256")
    .update(input)
    .sign(privateKeyPem, "base64url");
  return `${input}.${sig}`;
}

function rawHttpGet(port, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = httpRequest(
      { hostname: "127.0.0.1", port, path, method: "GET", headers },
      (res) => {
        res.resume();
        res.on("end", () =>
          resolve({ status: res.statusCode, headers: res.headers }),
        );
      },
    );
    req.on("error", reject);
    req.end();
  });
}

async function loginViaCognito(
  browser,
  origin,
  startSelector = 'a[href*="/auth/cognito/start"]',
) {
  await browser.goto(`${origin}/login`);
  await browser.clickSelector(startSelector);
  await browser.waitForUrl((u) => /\/(admin\/|carer\/)?dashboard/.test(u), 25000);
}

async function apiFetchInPage(browser, path, method = "GET") {
  return browser.evaluate(`(async () => {
    const res = await fetch(${JSON.stringify(path)}, {
      method: ${JSON.stringify(method)},
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { status: res.status, ok: res.ok, body: json, text };
  })()`);
}

async function seedLegacyDomainCookies(browser, webOrigin, jwt) {
  await browser.setCookie({
    name: "access_token",
    value: jwt,
    url: webOrigin,
    domain: ".cantracare.test",
    path: "/",
    httpOnly: true,
    sameSite: "Strict",
  });
  await browser.setCookie({
    name: "refresh_token",
    value: "stale-domain-refresh-token",
    url: webOrigin,
    domain: ".cantracare.test",
    path: "/api/auth",
    httpOnly: true,
    sameSite: "Strict",
  });
}

module.exports = {
  signHs256,
  signRs256,
  rawHttpGet,
  loginViaCognito,
  apiFetchInPage,
  seedLegacyDomainCookies,
};
