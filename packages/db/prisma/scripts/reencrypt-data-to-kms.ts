import { createRequire } from "node:module";
import { parseArgs } from "node:util";
import { backfillKmsFields } from "../../src/kms-backfill";
import { assertEncryptionKeyConfigured } from "../../src/crypto";
import { initKmsKeyRing } from "../../src/kms-keyring";

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      apply: { type: "boolean", default: false },
      "batch-size": { type: "string", default: "100" },
      help: { type: "boolean", short: "h" },
    },
  });
  if (values.help) {
    console.log(
      "pnpm --filter @repo/db db:backfill:kms [--batch-size 100] [--apply]\n" +
        "Dry run by default. Apply mode requires prior KMS field write rollout.\n" +
        "Export the verified DATABASE_URL and AWS/KMS configuration before running.",
    );
    return;
  }

  const batchSize = Number(values["batch-size"]);
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 1000) {
    throw new Error("Batch size must be an integer from 1 to 1000.");
  }
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("Export DATABASE_URL for the verified backfill target.");
  }
  if (values.apply && process.env.KMS_FIELD_WRITES_ENABLED !== "true") {
    throw new Error("Apply mode requires KMS_FIELD_WRITES_ENABLED=true.");
  }
  assertEncryptionKeyConfigured();

  // Load Prisma after checking the explicitly exported database target.
  const { prisma } = createRequire(__filename)(
    "../../src",
  ) as typeof import("../../src");
  try {
    await initKmsKeyRing(prisma, {
      bootstrapMissingKeys: false,
      writeFieldsWithKms: true,
    });
    console.log(
      values.apply
        ? "Applying KMS field backfill."
        : "KMS field backfill dry run.",
    );
    const results = await backfillKmsFields(prisma, {
      apply: values.apply,
      batchSize,
    });
    console.table(results);
    if (results.some(({ conflicts, unreadable }) => conflicts || unreadable)) {
      console.error(
        "Resolve unreadable rows and rerun to pick up concurrent changes.",
      );
      process.exitCode = 1;
    }
  } catch {
    // Database and KMS errors can contain deployment details. Row reports use counts only.
    console.error(
      "KMS backfill stopped. Check database access and existing KMS keys.",
    );
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "KMS backfill stopped.",
  );
  process.exitCode = 1;
});
