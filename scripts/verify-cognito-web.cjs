const { spawn, spawnSync } = require("node:child_process");
const { generateKeyPairSync, randomBytes } = require("node:crypto");
const { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } = require("node:fs");
const { createServer } = require("node:net");
const { tmpdir } = require("node:os");
const { join, resolve } = require("node:path");
const { setTimeout: delay } = require("node:timers/promises");
const { openCdpBrowser } = require("./cognito-web/cdp-browser.cjs");
const { startMockOidcProvider } = require("./cognito-web/mock-oidc.cjs");
const { startNginxLikeProxy } = require("./cognito-web/reverse-proxy.cjs");
const { runBrowserIntegrationScenarios } = require("./cognito-web/scenarios.cjs");
const { seedWebIntegrationFixture } = require("./cognito-web/seed-fixture.cjs");

const root = resolve(__dirname, "..");

function buildCleanBaseEnv() {
  const cleaned = Object.fromEntries(
    Object.entries(process.env).filter(
      ([name]) =>
        !/^(PG|POSTGRES|COGNITO_|AWS_|REDIS_|(?:AUDIT_|DIRECT_|SHADOW_)?DATABASE_URL|JWT_SECRET|ENCRYPTION_KEY|AUDIT_SIGNING_KEY|COOKIE_|LEGACY_|ENFORCE_MFA|INTERNAL_API_URL|NEXT_PUBLIC_API_URL|NEXT_DIST_DIR|SKIP_DOTENV)/i.test(
          name,
        ),
    ),
  );
  return {
    ...cleaned,
    SKIP_DOTENV: "true",
    AWS_EC2_METADATA_DISABLED: "true",
    KMS_FIELD_WRITES_ENABLED: "false",
    JWT_SECRET: randomBytes(40).toString("hex"),
    ENCRYPTION_KEY: randomBytes(32).toString("hex"),
    AUDIT_SIGNING_KEY: randomBytes(32).toString("hex"),
  };
}

function runSync(cmd, args, env, cwd = root) {
  const res = spawnSync(cmd, args, { cwd, env, stdio: "inherit" });
  if (res.error) throw res.error;
  if (res.status !== 0) throw new Error(`${cmd} exited with ${res.status}`);
}

function runCaptureAsync(cmd, args, env) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(cmd, args, { cwd: root, env, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (d) => { stdout += d.toString(); });
    child.stderr?.on("data", (d) => { stderr += d.toString(); });
    child.once("error", rejectRun);
    child.once("close", (status) => resolveRun({ status, stdout, stderr }));
  });
}

function npmSync(directory, env, ...args) {
  const cwd = resolve(root, directory);
  if (process.platform === "win32") {
    runSync("cmd.exe", ["/d", "/s", "/c", `npm.cmd ${args.join(" ")}`], env, cwd);
  } else {
    runSync("npm", args, env, cwd);
  }
}

async function freePort() {
  const srv = createServer();
  await new Promise((res, rej) => srv.once("error", rej).listen(0, "127.0.0.1", res));
  const { port } = srv.address();
  await new Promise((res, rej) => srv.close((err) => (err ? rej(err) : res())));
  return port;
}

async function waitForHttp(label, url, proc, getLogs) {
  for (let i = 0; i < 240; i++) {
    if (proc.exitCode !== null) {
      throw new Error(
        `Process ${label} for ${url} exited early (${proc.exitCode}). Logs:\n${getLogs()}`,
      );
    }
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status < 500) return;
    } catch {
      // Still booting.
    }
    await delay(250);
  }
  throw new Error(`Timed out waiting for ${label} at ${url}. Logs:\n${getLogs()}`);
}

function attachLogs(proc) {
  const chunks = [];
  const push = (chunk) => {
    chunks.push(chunk.toString());
    if (chunks.length > 200) chunks.shift();
  };
  proc.stdout?.on("data", push);
  proc.stderr?.on("data", push);
  return () => chunks.join("");
}

async function stopProcess(proc) {
  if (!proc || proc.exitCode !== null || proc.signalCode !== null) return;
  proc.kill();
  await new Promise((resolveStop) => {
    const timer = setTimeout(() => {
      try {
        proc.kill("SIGKILL");
      } catch {
        // Ignore already dead.
      }
      resolveStop();
    }, 5000);
    proc.once("exit", () => {
      clearTimeout(timer);
      resolveStop();
    });
  });
}

async function main() {
  const baseEnv = buildCleanBaseEnv();
  const temp = mkdtempSync(join(tmpdir(), "cantra-cognito-web-"));
  const pgData = join(temp, "postgres");
  const pwFile = join(temp, "pw");
  const nextDist = ".next-cognito-verify";
  const children = [];
  let postmaster;
  let oidc;
  let proxy;
  let browser;
  let prismaClient;
  let pgPass = "";
  const nextEnvFiles = [
    resolve(root, "apps/web/next-env.d.ts"),
    resolve(root, "apps/superadmin/next-env.d.ts"),
  ];
  const savedNextEnv = nextEnvFiles.map((filePath) => {
    try {
      return { filePath, content: readFileSync(filePath, "utf8") };
    } catch {
      return null;
    }
  });

  try {
    console.log("==> 1/6 Running web Vitest authentication tests...");
    npmSync("apps/web", baseEnv, "exec", "--", "vitest", "run", "lib/auth/middlewareAuth.test.ts", "app/login/LoginCognito.test.tsx");

    console.log("==> 2/6 Starting disposable PostgreSQL...");
    pgPass = randomBytes(30).toString("hex");
    writeFileSync(pwFile, `${pgPass}\n`, { mode: 0o600 });
    runSync("initdb", ["-D", pgData, "--username=cognito_fixture", "--auth=scram-sha-256", `--pwfile=${pwFile}`, "--no-locale", "--encoding=UTF8"], baseEnv);
    rmSync(pwFile);
    const pgPort = await freePort();
    const pgDest = ["-h", "127.0.0.1", "-p", String(pgPort)];
    postmaster = spawn("postgres", ["-D", pgData, ...pgDest], { cwd: root, env: baseEnv, stdio: "ignore" });
    let pgReady = false;
    for (let i = 0; i < 100; i++) {
      if (postmaster.exitCode !== null) break;
      if (spawnSync("pg_isready", [...pgDest, "-q"], { env: baseEnv, stdio: "ignore" }).status === 0) {
        pgReady = true;
        break;
      }
      await delay(100);
    }
    if (!pgReady) throw new Error("Disposable PostgreSQL startup failed.");
    const actualData = spawnSync("psql", ["-X", "-At", ...pgDest, "-U", "cognito_fixture", "-d", "postgres", "-c", "SHOW data_directory"], {
      env: { ...baseEnv, PGPASSWORD: pgPass },
      encoding: "utf8",
    }).stdout.trim();
    if (realpathSync(actualData) !== realpathSync(pgData)) {
      throw new Error("Disposable PostgreSQL identity check failed.");
    }
    runSync("psql", ["-X", ...pgDest, "-U", "cognito_fixture", "-d", "postgres", "-c", "CREATE DATABASE audit_fixture;"], {
      ...baseEnv,
      PGPASSWORD: pgPass,
    });

    const dbEnv = {
      ...baseEnv,
      DATABASE_URL: `postgresql://cognito_fixture:${pgPass}@127.0.0.1:${pgPort}/postgres`,
      AUDIT_DATABASE_URL: `postgresql://cognito_fixture:${pgPass}@127.0.0.1:${pgPort}/audit_fixture`,
      COGNITO_DISPOSABLE_DB: `127.0.0.1:${pgPort}`,
    };

    console.log("==> 3/6 Building workspace packages & applying migrations...");
    npmSync("packages/schema", dbEnv, "run", "build");
    npmSync("packages/endpoints", dbEnv, "run", "build");
    npmSync("packages/db", dbEnv, "run", "build");
    npmSync("packages/audit-db", dbEnv, "run", "db:generate");
    npmSync("packages/audit-db", dbEnv, "run", "build");
    runSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy", "--schema=packages/db/prisma/schema.prisma"], dbEnv);
    runSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy", "--schema=packages/audit-db/prisma/schema.prisma"], dbEnv);
    npmSync("apps/backend", dbEnv, "run", "build");

    console.log("==> 4/6 Seeding fixture users & starting Mock OIDC...");
    Object.assign(process.env, {
      DATABASE_URL: dbEnv.DATABASE_URL,
      ENCRYPTION_KEY: dbEnv.ENCRYPTION_KEY,
      KMS_FIELD_WRITES_ENABLED: "false",
    });
    const { ids, prisma } = await seedWebIntegrationFixture(root);
    prismaClient = prisma;
    oidc = await startMockOidcProvider();

    const backendPort = await freePort();
    const webPort = await freePort();
    const adminPort = await freePort();
    proxy = await startNginxLikeProxy({ backendPort, webPort, adminPort });

    const appKeys = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const appPrivateKeyPem = appKeys.privateKey.export({ type: "pkcs8", format: "pem" }).toString();
    const appPrivateKeyB64 = Buffer.from(appPrivateKeyPem).toString("base64");
    const appPublicKeyB64 = Buffer.from(appKeys.publicKey.export({ type: "spki", format: "pem" }).toString()).toString("base64");

    const buildFrontendEnv = {
      ...dbEnv,
      NODE_ENV: "production",
      NEXT_DIST_DIR: nextDist,
      NEXT_PUBLIC_API_URL: "/api",
      INTERNAL_API_URL: `http://127.0.0.1:${backendPort}/api`,
      COGNITO_AUTH_ENABLED: "true",
      COGNITO_APP_PUBLIC_KEY_B64: appPublicKeyB64,
      COGNITO_SUPERADMIN_AUTH_ENABLED: "true",
      COGNITO_SUPERADMIN_CALLBACK_URL: `${proxy.adminOrigin}/api/auth/cognito/callback`,
      LEGACY_AUTH_ENABLED: "true",
    };

    console.log("==> 5/6 Building Web & SuperAdmin Next.js apps for local proxy...");
    const webNextBin = require.resolve("next/dist/bin/next", { paths: [resolve(root, "apps/web")] });
    const adminNextBin = require.resolve("next/dist/bin/next", { paths: [resolve(root, "apps/superadmin")] });
    runSync(process.execPath, [webNextBin, "build"], buildFrontendEnv, resolve(root, "apps/web"));
    runSync(process.execPath, [adminNextBin, "build"], buildFrontendEnv, resolve(root, "apps/superadmin"));

    const backendEnv = {
      ...dbEnv,
      NODE_ENV: "test",
      PORT: String(backendPort),
      API_URL: `${proxy.webOrigin}/api`,
      CORS_ORIGINS: `${proxy.webOrigin},${proxy.adminOrigin}`,
      ENFORCE_MFA: "false",
      COGNITO_AUTH_ENABLED: "true",
      COGNITO_MFA_POLICY: "required",
      COGNITO_REQUIRE_AMR_MFA: "true",
      COGNITO_REGION: "eu-north-1",
      COGNITO_USER_POOL_ID: "eu-north-1_Fixture",
      COGNITO_MANAGED_LOGIN_URL: oidc.origin,
      COGNITO_TEST_ISSUER: oidc.origin,
      COGNITO_CLIENT_ID: oidc.clientId,
      COGNITO_CLIENT_SECRET: oidc.clientSecret,
      COGNITO_SUPERADMIN_CLIENT_ID: oidc.superAdminClientId,
      COGNITO_SUPERADMIN_CLIENT_SECRET: oidc.superAdminClientSecret,
      COGNITO_PILOT_USER_IDS: [ids.adminUserId, ids.carerUserId, ids.disabledUserId, ids.superAdminId].join(","),
      COGNITO_CALLBACK_URL: `${proxy.webOrigin}/api/auth/cognito/callback`,
      COGNITO_SIGN_OUT_URL: `${proxy.webOrigin}/login`,
      COGNITO_SUPERADMIN_CALLBACK_URL: `${proxy.adminOrigin}/api/auth/cognito/callback`,
      COGNITO_SUPERADMIN_SIGN_OUT_URL: `${proxy.adminOrigin}/login`,
      LEGACY_COOKIE_DOMAIN: ".cantracare.test",
      COOKIE_HOST_ONLY: "true",
      LEGACY_AUTH_ENABLED: "true",
      COGNITO_APP_PRIVATE_KEY_B64: appPrivateKeyB64,
    };

    const backendProc = spawn(process.execPath, ["apps/backend/dist/main.js"], { cwd: root, env: backendEnv, stdio: ["ignore", "pipe", "pipe"] });
    const webProc = spawn(process.execPath, [webNextBin, "start", "-p", String(webPort), "-H", "127.0.0.1"], { cwd: resolve(root, "apps/web"), env: buildFrontendEnv, stdio: ["ignore", "pipe", "pipe"] });
    const adminProc = spawn(process.execPath, [adminNextBin, "start", "-p", String(adminPort), "-H", "127.0.0.1"], { cwd: resolve(root, "apps/superadmin"), env: buildFrontendEnv, stdio: ["ignore", "pipe", "pipe"] });
    children.push(backendProc, webProc, adminProc);
    const backendLogs = attachLogs(backendProc);
    const webLogs = attachLogs(webProc);
    const adminLogs = attachLogs(adminProc);

    await Promise.all([
      waitForHttp("backend", `http://127.0.0.1:${backendPort}/api`, backendProc, backendLogs),
      waitForHttp("web", `http://127.0.0.1:${webPort}/login`, webProc, webLogs),
      waitForHttp("superadmin", `http://127.0.0.1:${adminPort}/login`, adminProc, adminLogs),
    ]);

    console.log("==> 6/6 Running real-browser Cognito & SuperAdmin integration suite...");
    browser = await openCdpBrowser();
    const { COGNITO_APP_AUDIENCE, COGNITO_APP_ISSUER } = require(resolve(root, "packages/schema/dist"));
    await runBrowserIntegrationScenarios({
      browser,
      proxy,
      oidc,
      prisma: prismaClient,
      ids,
      jwtSecret: baseEnv.JWT_SECRET,
      appPrivateKeyPem,
      apiIssuer: COGNITO_APP_ISSUER,
      apiAudience: COGNITO_APP_AUDIENCE,
    });

    const stageCfgOk = await runCaptureAsync(
      process.execPath,
      ["scripts/verify-cognito-staging-config.cjs", "--strict", "--check-oidc"],
      {
        ...backendEnv,
        COGNITO_APP_PUBLIC_KEY_B64: appPublicKeyB64,
      },
    );
    if (
      stageCfgOk.status !== 0 ||
      !stageCfgOk.stdout.includes("live_aws=NOT VERIFIED") ||
      stageCfgOk.stdout.includes(oidc.clientSecret) ||
      stageCfgOk.stdout.includes(oidc.superAdminClientSecret)
    ) {
      throw new Error(`Staging config check failed: ${stageCfgOk.stderr || stageCfgOk.stdout}`);
    }
    const stageCfgBad = await runCaptureAsync(
      process.execPath,
      ["scripts/verify-cognito-staging-config.cjs"],
      {
        ...backendEnv,
        NODE_ENV: "production",
        COGNITO_TEST_ISSUER: "",
        COGNITO_MANAGED_LOGIN_URL: "https://auth-demo.cantracare.com",
        COGNITO_CALLBACK_URL: "https://api-demo.cantracare.com/api/auth/cognito/callback",
        COGNITO_SIGN_OUT_URL: "https://demo.cantracare.com/login",
      },
    );
    if (stageCfgBad.status === 0) {
      throw new Error("Expected verify-cognito-staging-config.cjs to reject api-demo callback host.");
    }
    console.log("\nALL COGNITO WEB + SUPERADMIN INTEGRATION CHECKS PASSED.");
  } finally {
    await browser?.close().catch(() => {});
    await Promise.all(children.map(stopProcess));
    await proxy?.close().catch(() => {});
    await oidc?.close().catch(() => {});
    await prismaClient?.$disconnect().catch(() => {});
    if (postmaster?.pid && postmaster.exitCode === null && postmaster.signalCode === null) {
      const stopped = spawnSync("pg_ctl", ["stop", "-D", pgData, "-m", "fast", "-w", "-t", "10"], { env: baseEnv, stdio: "ignore" });
      if (stopped.status !== 0) postmaster.kill();
      if (postmaster.exitCode === null && postmaster.signalCode === null) {
        await new Promise((res) => postmaster.once("exit", res));
      }
    }
    rmSync(resolve(root, "apps/web", nextDist), { recursive: true, force: true });
    rmSync(resolve(root, "apps/superadmin", nextDist), { recursive: true, force: true });
    for (const entry of savedNextEnv) {
      if (entry) writeFileSync(entry.filePath, entry.content, "utf8");
    }
    rmSync(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}

void main().catch((err) => {
  console.error(err.stack || err.message);
  process.exitCode = 1;
});
