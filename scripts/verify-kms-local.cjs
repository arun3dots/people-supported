const { spawnSync } = require("node:child_process");
const { resolve } = require("node:path");

const root = resolve(__dirname, "..");
const env = Object.fromEntries(
  Object.entries(process.env).filter(
    ([name]) =>
      !/^(AWS_|REDIS_|KMS_|ENCRYPTION_KEY|AUDIT_SIGNING_KEY|MAIL_PROVIDER)/.test(
        name,
      ),
  ),
);
Object.assign(env, {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://fixture@127.0.0.1:1/fixture",
  AUDIT_DATABASE_URL: "postgresql://fixture@127.0.0.1:1/fixture",
  AWS_EC2_METADATA_DISABLED: "true",
  KMS_FIELD_WRITES_ENABLED: "false",
  JWT_SECRET: "local-kms-verification-fixture-jwt",
  STRICT_SECRET_CHECK: "false",
});

function run(directory, ...args) {
  const windows = process.platform === "win32";
  // The Windows invocation contains only the fixed arguments below.
  const command = windows ? "cmd.exe" : "npm";
  const commandArgs = windows
    ? ["/d", "/s", "/c", `npm.cmd ${args.join(" ")}`]
    : args;
  const result = spawnSync(command, commandArgs, {
    cwd: resolve(root, directory),
    env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("packages/db", "run", "build");
run("packages/audit-db", "run", "db:generate");
run("packages/audit-db", "run", "build");
run("packages/schema", "run", "build");
run(
  "apps/backend",
  "run",
  "test",
  "--",
  "--runInBand",
  "--no-cache",
  "--runTestsByPath",
  "src/common/kms/kms-keyring.spec.ts",
  "src/common/kms/kms-verification.spec.ts",
  "src/common/utils/kms-compatibility-release.util.spec.ts",
  "src/residents/services/pre-admission-crypto.spec.ts",
  "src/audit/audit-dead-letter.util.spec.ts",
  "src/audit/audit-db.service.spec.ts",
  "src/storage/s3.service.spec.ts",
);
