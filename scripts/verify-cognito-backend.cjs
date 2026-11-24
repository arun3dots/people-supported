const { spawn, spawnSync } = require("node:child_process");
const { randomBytes } = require("node:crypto");
const { mkdtempSync, realpathSync, rmSync, writeFileSync } = require("node:fs");
const { createServer } = require("node:net");
const { tmpdir } = require("node:os");
const { join, resolve } = require("node:path");
const { setTimeout: delay } = require("node:timers/promises");

const root = resolve(__dirname, "..");
const env = Object.fromEntries(
  Object.entries(process.env).filter(
    ([name]) =>
      !/^(PG|POSTGRES|COGNITO_|AWS_|REDIS_|(?:AUDIT_|DIRECT_|SHADOW_)?DATABASE_URL|JWT_SECRET|ENCRYPTION_KEY|AUDIT_SIGNING_KEY|COOKIE_DOMAIN|ENFORCE_MFA)/i.test(
        name,
      ),
  ),
);
Object.assign(env, {
  NODE_ENV: "test",
  AWS_EC2_METADATA_DISABLED: "true",
  KMS_FIELD_WRITES_ENABLED: "false",
  JWT_SECRET: randomBytes(40).toString("hex"),
  ENCRYPTION_KEY: randomBytes(32).toString("hex"),
  AUDIT_SIGNING_KEY: randomBytes(32).toString("hex"),
});

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    env,
    stdio: "inherit",
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`${command} exited with status ${result.status}.`);
  return result.stdout?.toString().trim();
}

function npm(directory, ...args) {
  const cwd = resolve(root, directory);
  // The Windows invocation contains only fixed arguments from this file.
  if (process.platform === "win32")
    run("cmd.exe", ["/d", "/s", "/c", `npm.cmd ${args.join(" ")}`], { cwd });
  else run("npm", args, { cwd });
}

async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) =>
    server.once("error", reject).listen(0, "127.0.0.1", resolve),
  );
  const { port } = server.address();
  await new Promise((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve())),
  );
  return port;
}

async function main() {
  const temp = mkdtempSync(join(tmpdir(), "cantra-cognito-"));
  const data = join(temp, "postgres");
  const passwordFile = join(temp, "fixture-pw");
  let postmaster;
  let startError;
  try {
    const password = randomBytes(30).toString("hex");
    writeFileSync(passwordFile, `${password}\n`, { mode: 0o600 });
    run("initdb", [
      "-D",
      data,
      "--username=cognito_fixture",
      "--auth=scram-sha-256",
      `--pwfile=${passwordFile}`,
      "--no-locale",
      "--encoding=UTF8",
    ]);
    rmSync(passwordFile);
    const port = await freePort();
    const destination = ["-h", "127.0.0.1", "-p", String(port)];
    postmaster = spawn("postgres", ["-D", data, ...destination], {
      cwd: root,
      env,
      stdio: "ignore",
    });
    postmaster.once("error", (error) => {
      startError = error;
    });
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (startError) throw startError;
      if (postmaster.exitCode !== null) break;
      if (
        spawnSync("pg_isready", [...destination, "-q"], {
          env,
          stdio: "ignore",
        }).status === 0
      ) {
        ready = true;
        break;
      }
      await delay(100);
    }
    if (!ready) throw new Error("Disposable PostgreSQL startup failed.");
    const actualData = run(
      "psql",
      [
        "-X",
        "-At",
        ...destination,
        "-U",
        "cognito_fixture",
        "-d",
        "postgres",
        "-c",
        "SHOW data_directory",
      ],
      {
        env: { ...env, PGPASSWORD: password },
        stdio: ["ignore", "pipe", "ignore"],
      },
    );
    if (realpathSync(actualData) !== realpathSync(data))
      throw new Error("Disposable PostgreSQL identity check failed.");
    env.DATABASE_URL = `postgresql://cognito_fixture:${password}@127.0.0.1:${port}/postgres`;
    env.AUDIT_DATABASE_URL = "postgresql://fixture@127.0.0.1:1/unused";
    env.COGNITO_DISPOSABLE_DB = `127.0.0.1:${port}`;

    npm("packages/db", "run", "build");
    npm("packages/audit-db", "run", "db:generate");
    npm("packages/audit-db", "run", "build");
    npm("packages/schema", "run", "build");
    run(process.execPath, [
      "node_modules/prisma/build/index.js",
      "migrate",
      "deploy",
      "--schema=packages/db/prisma/schema.prisma",
    ]);
    npm(
      "apps/backend",
      "run",
      "test:e2e",
      "--",
      "--runInBand",
      "--runTestsByPath",
      "test/cognito.e2e-spec.ts",
      "test/cognito-compat.e2e-spec.ts",
      "test/cognito-security.e2e-spec.ts",
      "test/cognito-mfa.e2e-spec.ts",
    );
  } finally {
    if (
      postmaster?.pid &&
      postmaster.exitCode === null &&
      postmaster.signalCode === null
    ) {
      const stopped = spawnSync(
        "pg_ctl",
        ["stop", "-D", data, "-m", "fast", "-w", "-t", "10"],
        { env, stdio: "ignore" },
      );
      if (stopped.status !== 0) postmaster.kill();
      if (postmaster.exitCode === null && postmaster.signalCode === null) {
        await new Promise((resolve) => postmaster.once("exit", resolve));
      }
    }
    rmSync(temp, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 200,
    });
  }
}

void main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
