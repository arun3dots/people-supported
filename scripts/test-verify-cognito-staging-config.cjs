const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { generateKeyPairSync, randomBytes } = require("node:crypto");
const { mkdtempSync, rmSync, writeFileSync } = require("node:fs");
const { createServer } = require("node:net");
const { tmpdir } = require("node:os");
const { join, resolve } = require("node:path");

const root = resolve(__dirname, "..");
const script = resolve(root, "scripts/verify-cognito-staging-config.cjs");

function serializeEnv(obj) {
  return Object.entries(obj)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

function runCheck(args, extraEnv = {}) {
  const cleanEnv = Object.fromEntries(
    Object.entries(process.env).filter(
      ([k]) => !/^(COGNITO_|COOKIE_|LEGACY_|JWT_SECRET|CORS_ORIGINS|AWS_REGION)/i.test(k),
    ),
  );
  return spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    env: { ...cleanEnv, ...extraEnv },
    encoding: "utf8",
  });
}

async function closedPort() {
  const srv = createServer();
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  const { port } = srv.address();
  await new Promise((r) => srv.close(r));
  return port;
}

async function main() {
  const dir = mkdtempSync(join(tmpdir(), "cantra-stage-cfg-test-"));
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const otherKeys = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const privB64 = Buffer.from(privateKey.export({ format: "pem", type: "pkcs8" })).toString("base64");
  const pubB64 = Buffer.from(publicKey.export({ format: "pem", type: "spki" })).toString("base64");
  const badPubB64 = Buffer.from(otherKeys.publicKey.export({ format: "pem", type: "spki" })).toString("base64");
  const jwtSecret = randomBytes(32).toString("hex");
  const webSecret = "fixture-web-client-secret-123456";
  const adminSecret = "fixture-admin-client-secret-7890";

  const baseBackend = {
    NODE_ENV: "production",
    CORS_ORIGINS: "https://demo.cantracare.com,https://admin-demo.cantracare.com",
    COOKIE_HOST_ONLY: "true",
    COGNITO_AUTH_ENABLED: "true",
    LEGACY_AUTH_ENABLED: "true",
    COGNITO_MFA_POLICY: "required",
    COGNITO_REQUIRE_AMR_MFA: "true",
    AWS_REGION: "eu-north-1",
    COGNITO_REGION: "eu-north-1",
    COGNITO_USER_POOL_ID: "eu-north-1_StagePool1",
    COGNITO_MANAGED_LOGIN_URL: "https://auth-demo.cantracare.com",
    COGNITO_CLIENT_ID: "web-client-id-123",
    COGNITO_CLIENT_SECRET: webSecret,
    COGNITO_CALLBACK_URL: "https://demo.cantracare.com/api/auth/cognito/callback",
    COGNITO_SIGN_OUT_URL: "https://demo.cantracare.com/login",
    COGNITO_SUPERADMIN_AUTH_ENABLED: "true",
    COGNITO_SUPERADMIN_CLIENT_ID: "admin-client-id-456",
    COGNITO_SUPERADMIN_CLIENT_SECRET: adminSecret,
    COGNITO_SUPERADMIN_CALLBACK_URL: "https://admin-demo.cantracare.com/api/auth/cognito/callback",
    COGNITO_SUPERADMIN_SIGN_OUT_URL: "https://admin-demo.cantracare.com/login",
    COGNITO_ALLOWED_SIGN_OUT_URLS: "https://demo.cantracare.com/login,https://admin-demo.cantracare.com/login",
    COGNITO_PILOT_USER_IDS: "11111111-1111-4111-8111-111111111111",
    COGNITO_APP_PRIVATE_KEY_B64: privB64,
    JWT_SECRET: jwtSecret,
  };
  const baseWeb = {
    NEXT_PUBLIC_API_URL: "/api",
    INTERNAL_API_URL: "http://127.0.0.1:4400/api",
    COGNITO_AUTH_ENABLED: "true",
    LEGACY_AUTH_ENABLED: "true",
    COGNITO_APP_PUBLIC_KEY_B64: pubB64,
    JWT_SECRET: jwtSecret,
  };
  const baseAdmin = {
    ...baseWeb,
    COGNITO_SUPERADMIN_AUTH_ENABLED: "true",
    COGNITO_SUPERADMIN_CALLBACK_URL: baseBackend.COGNITO_SUPERADMIN_CALLBACK_URL,
  };

  try {
    const writeFixture = (name, backend = baseBackend, web = baseWeb, admin = baseAdmin) => {
      const bPath = join(dir, `${name}-backend.env`);
      const wPath = join(dir, `${name}-web.env`);
      const aPath = join(dir, `${name}-admin.env`);
      writeFileSync(bPath, serializeEnv(backend));
      writeFileSync(wPath, serializeEnv(web));
      writeFileSync(aPath, serializeEnv(admin));
      return [`--env-file=${bPath}`, `--web-env-file=${wPath}`, `--superadmin-env-file=${aPath}`];
    };

    const ok = runCheck(["--strict", ...writeFixture("valid")]);
    assert.equal(ok.status, 0, ok.stderr);
    assert.match(ok.stdout, /region=eu-north-1/);
    assert.match(ok.stdout, /live_aws=NOT VERIFIED/);
    for (const secret of [webSecret, adminSecret, privB64, jwtSecret]) {
      assert.equal(`${ok.stdout}${ok.stderr}`.includes(secret), false);
    }

    const euWest = runCheck([
      "--strict",
      ...writeFixture("configurable-region", {
        ...baseBackend,
        AWS_REGION: "eu-west-2",
        COGNITO_REGION: "eu-west-2",
        COGNITO_USER_POOL_ID: "eu-west-2_Custom1",
      }),
    ]);
    assert.equal(euWest.status, 0, euWest.stderr);
    assert.match(euWest.stdout, /region=eu-west-2/);

    const cases = [
      ["region mismatch", { COGNITO_REGION: "eu-west-2" }, {}],
      ["shared superadmin client", { COGNITO_SUPERADMIN_CLIENT_ID: baseBackend.COGNITO_CLIENT_ID }, {}],
      ["missing superadmin secret", { COGNITO_SUPERADMIN_CLIENT_SECRET: undefined }, {}],
      ["api-demo callback", { COGNITO_CALLBACK_URL: "https://api-demo.cantracare.com/api/auth/cognito/callback" }, {}],
      ["host-only off", { COOKIE_HOST_ONLY: "false" }, {}],
      ["amr mfa disabled", { COGNITO_REQUIRE_AMR_MFA: "false" }, {}],
      ["mismatched pubkey", {}, { COGNITO_APP_PUBLIC_KEY_B64: badPubB64 }],
      ["cross-origin next api", {}, { NEXT_PUBLIC_API_URL: "https://api-demo.cantracare.com/api" }],
    ];
    for (const [idx, [label, bOver, wOver]] of cases.entries()) {
      const bad = runCheck([
        "--strict",
        ...writeFixture(`bad-${idx}`, { ...baseBackend, ...bOver }, { ...baseWeb, ...wOver }),
      ]);
      assert.notEqual(bad.status, 0, `Expected failure for ${label}`);
    }

    const unreachable = await closedPort();
    const offlineCheck = runCheck([
      "--strict",
      "--check-oidc",
      ...writeFixture("offline", {
        ...baseBackend,
        NODE_ENV: "test",
        COGNITO_MANAGED_LOGIN_URL: `http://127.0.0.1:${unreachable}`,
        COGNITO_TEST_ISSUER: `http://127.0.0.1:${unreachable}`,
        COGNITO_CALLBACK_URL: "http://web.cantracare.test/api/auth/cognito/callback",
        COGNITO_SIGN_OUT_URL: "http://web.cantracare.test/login",
        COGNITO_SUPERADMIN_CALLBACK_URL: "http://admin.cantracare.test/api/auth/cognito/callback",
        COGNITO_SUPERADMIN_SIGN_OUT_URL: "http://admin.cantracare.test/login",
        CORS_ORIGINS: "http://web.cantracare.test,http://admin.cantracare.test",
      }),
    ]);
    assert.notEqual(offlineCheck.status, 0);
    assert.match(`${offlineCheck.stdout}${offlineCheck.stderr}`, /NOT VERIFIED/);

    console.log("ALL STAGING CONFIG STRICT SELF-TESTS PASSED.");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

void main().catch((err) => {
  console.error(err.stack || err.message);
  process.exitCode = 1;
});
