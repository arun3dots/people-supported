const { createHash, createSign, generateKeyPairSync, randomUUID } = require("node:crypto");
const { createServer } = require("node:http");

const clientId = "supported-living-web-fixture";
const clientSecret = "local-only-web-fixture-secret";
const superAdminClientId = "supported-living-superadmin-fixture";
const superAdminClientSecret = "local-only-superadmin-fixture-secret";
const clients = new Map([
  [clientId, clientSecret],
  [superAdminClientId, superAdminClientSecret],
]);
const kid = "web-fixture-signing-key";

function sha256Base64Url(value) {
  return createHash("sha256").update(value).digest("base64url");
}

function signRs256(privateKey, payload) {
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT", kid }),
  ).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signingInput = `${header}.${body}`;
  const sig = createSign("RSA-SHA256").update(signingInput).sign(privateKey);
  return `${signingInput}.${sig.toString("base64url")}`;
}

async function startMockOidcProvider() {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  const jwk = {
    ...publicKey.export({ format: "jwk" }),
    kid,
    alg: "RS256",
    use: "sig",
  };
  const codes = new Map();
  const refreshTokens = new Map();
  let origin = "";
  let subject = "";
  let email = "pilot-admin@cantracare.test";
  let mode = "valid";
  let authorizeCount = 0;
  let refreshCount = 0;
  let revokedCount = 0;
  let logoutHits = 0;

  function issueTokens(account, authTime, targetClientId, nonce) {
    const refreshToken = randomUUID();
    refreshTokens.set(refreshToken, {
      account,
      authTime,
      clientId: targetClientId,
    });
    const now = Math.floor(Date.now() / 1000);
    const accessToken = signRs256(privateKey, {
      iss: origin,
      sub: account,
      token_use: "access",
      client_id: targetClientId,
      auth_time: authTime,
      amr: ["pwd", "otp", "mfa"],
      acr: "urn:cognito:loa:3",
      iat: now,
      exp: now + 300,
    });
    const atHash = createHash("sha256")
      .update(accessToken)
      .digest()
      .subarray(0, 16)
      .toString("base64url");
    const idToken = signRs256(privateKey, {
      iss: origin,
      aud: targetClientId,
      sub: account,
      token_use: "id",
      nonce,
      auth_time: authTime,
      email,
      email_verified: true,
      amr: ["pwd", "otp", "mfa"],
      acr: "urn:cognito:loa:3",
      at_hash: atHash,
      iat: now,
      exp: now + 300,
    });
    return {
      token_type: "Bearer",
      access_token: accessToken,
      id_token: idToken,
      refresh_token: refreshToken,
    };
  }

  function json(res, status, data) {
    res
      .writeHead(status, { "Content-Type": "application/json" })
      .end(JSON.stringify(data));
  }

  async function serve(req, res) {
    const url = new URL(req.url || "/", origin);
    if (url.pathname === "/.well-known/openid-configuration") {
      return json(res, 200, {
        issuer: origin,
        authorization_endpoint: `${origin}/oauth2/authorize`,
        token_endpoint: `${origin}/oauth2/token`,
        jwks_uri: `${origin}/.well-known/jwks.json`,
      });
    }
    if (url.pathname === "/.well-known/jwks.json") {
      return json(res, 200, { keys: [jwk] });
    }
    if (url.pathname === "/oauth2/authorize") {
      authorizeCount++;
      const q = url.searchParams;
      const redirect = q.get("redirect_uri");
      const nonce = q.get("nonce");
      const challenge = q.get("code_challenge");
      const state = q.get("state");
      const reqClient = q.get("client_id") || "";
      if (
        !redirect ||
        !nonce ||
        !challenge ||
        !state ||
        q.get("response_type") !== "code" ||
        q.get("code_challenge_method") !== "S256" ||
        q.get("scope") !== "openid" ||
        !clients.has(reqClient)
      ) {
        return json(res, 400, { error: "invalid_request" });
      }
      const callback = new URL(redirect);
      if (mode === "mfa_failed") {
        callback.search = new URLSearchParams({
          error: "access_denied",
          error_description: "MFA verification failed",
          state,
        }).toString();
        return res.writeHead(302, { Location: callback.href }).end();
      }
      const returnedState =
        mode === "tampered_state" ? `${state.slice(0, -4)}AAAA` : state;
      const code = randomUUID();
      const account = mode === "unlinked" ? randomUUID() : subject;
      codes.set(code, {
        clientId: reqClient,
        nonce,
        challenge,
        redirect,
        account,
      });
      callback.search = new URLSearchParams({
        code,
        state: returnedState,
      }).toString();
      return res.writeHead(302, { Location: callback.href }).end();
    }
    if (url.pathname === "/logout") {
      const logoutUri = url.searchParams.get("logout_uri");
      if (!clients.has(url.searchParams.get("client_id") || "") || !logoutUri) {
        return json(res, 400, { error: "invalid_request" });
      }
      logoutHits++;
      return res.writeHead(302, { Location: logoutUri }).end();
    }
    if (req.method !== "POST") {
      return json(res, 401, { error: "invalid_client" });
    }
    req.setEncoding("utf8");
    let body = "";
    for await (const chunk of req) body += String(chunk);
    const form = new URLSearchParams(body);
    const reqClient = form.get("client_id") || "";
    const reqSecret = clients.get(reqClient);
    const expectedBasic = reqSecret
      ? `Basic ${Buffer.from(`${reqClient}:${reqSecret}`).toString("base64")}`
      : "";
    if (!reqSecret || req.headers.authorization !== expectedBasic) {
      return json(res, 401, { error: "invalid_client" });
    }
    if (url.pathname === "/oauth2/revoke") {
      const rec = refreshTokens.get(form.get("token") || "");
      if (rec && rec.clientId === reqClient) {
        refreshTokens.delete(form.get("token") || "");
        revokedCount++;
      }
      return json(res, 200, {});
    }
    if (
      url.pathname === "/oauth2/token" &&
      form.get("grant_type") === "refresh_token"
    ) {
      refreshCount++;
      const token = form.get("refresh_token") || "";
      const existing = refreshTokens.get(token);
      if (!existing || existing.clientId !== reqClient) {
        return json(res, 400, { error: "invalid_grant" });
      }
      refreshTokens.delete(token);
      return json(
        res,
        200,
        issueTokens(existing.account, existing.authTime, reqClient),
      );
    }
    const grant = codes.get(form.get("code") || "");
    if (
      url.pathname !== "/oauth2/token" ||
      form.get("grant_type") !== "authorization_code" ||
      !grant ||
      grant.clientId !== reqClient ||
      grant.redirect !== form.get("redirect_uri") ||
      grant.challenge !== sha256Base64Url(form.get("code_verifier") || "")
    ) {
      return json(res, 400, { error: "invalid_grant" });
    }
    codes.delete(form.get("code"));
    return json(
      res,
      200,
      issueTokens(
        grant.account,
        Math.floor(Date.now() / 1000),
        reqClient,
        grant.nonce,
      ),
    );
  }

  const server = createServer((req, res) => {
    void serve(req, res).catch(() => json(res, 500, {}));
  });
  await new Promise((resolve, reject) =>
    server.once("error", reject).listen(0, "127.0.0.1", resolve),
  );
  origin = `http://127.0.0.1:${server.address().port}`;
  return {
    origin,
    clientId,
    clientSecret,
    superAdminClientId,
    superAdminClientSecret,
    setIdentity(nextSubject, nextEmail = email) {
      subject = nextSubject;
      email = nextEmail;
      mode = "valid";
    },
    setMode(nextMode) {
      mode = nextMode;
    },
    clearRefreshTokens() {
      refreshTokens.clear();
    },
    stats: () => ({ authorizeCount, refreshCount, revokedCount, logoutHits }),
    close: () =>
      new Promise((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      ),
  };
}

module.exports = { startMockOidcProvider };
