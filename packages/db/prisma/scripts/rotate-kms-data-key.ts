import { createRequire } from "node:module";
import { parseArgs } from "node:util";
import { rotateKmsDataKey } from "../../src/kms-key-rotation";
import { initKmsKeyRing } from "../../src/kms-keyring";

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      offline: { type: "boolean" },
      "expected-version": { type: "string" },
      purpose: { type: "string", default: "DB_FIELD" },
      help: { type: "boolean", short: "h" },
    },
  });
  if (values.help) {
    console.log(
      "pnpm --filter @repo/db db:rotate:kms --offline --expected-version <N> [--purpose DB_FIELD|AUDIT_HMAC]\n" +
        "Stop all processes that use the keyring before rotation and restart them afterward.",
    );
    return;
  }
  if (!values.offline)
    throw new Error("Stop all keyring users before passing --offline.");
  const purpose = values.purpose;
  if (purpose !== "DB_FIELD" && purpose !== "AUDIT_HMAC") {
    throw new Error("Purpose must be DB_FIELD or AUDIT_HMAC.");
  }
  if (!/^\d+$/.test(values["expected-version"] ?? "")) {
    throw new Error(
      "Supply the current active key version with --expected-version.",
    );
  }
  if (
    !process.env.DATABASE_URL?.trim() ||
    !process.env.AWS_KMS_DATA_KEY_ID?.trim()
  ) {
    throw new Error(
      "Export DATABASE_URL and AWS_KMS_DATA_KEY_ID for the verified target.",
    );
  }

  const { rawPrisma } = createRequire(__filename)(
    "../../src",
  ) as typeof import("../../src");
  try {
    await initKmsKeyRing(rawPrisma, {
      bootstrapMissingKeys: false,
      writeFieldsWithKms: false,
    });
    const version = await rotateKmsDataKey(
      rawPrisma,
      purpose,
      Number(values["expected-version"]),
      {},
    );
    console.log(
      `${purpose} v${version} is active. Restart the stopped keyring users.`,
    );
  } finally {
    await rawPrisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "KMS rotation failed.",
  );
  process.exitCode = 1;
});
