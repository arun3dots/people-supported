import type { PrismaClient } from "./generated/client";
import {
  generateWrappedDataKey,
  getKmsClient,
  unwrapDataKey,
  type EncryptionKeyPurpose,
  type KmsConnectionOptions,
} from "./kms-keyring";

type RotationDb = Pick<PrismaClient, "encryptionKey" | "$transaction">;
const MAX_PRISMA_INT = 2_147_483_647;

export async function rotateKmsDataKey(
  db: RotationDb,
  purpose: EncryptionKeyPurpose,
  expectedVersion: number,
  options: KmsConnectionOptions,
): Promise<number> {
  if (
    !Number.isInteger(expectedVersion) ||
    expectedVersion < 1 ||
    expectedVersion >= MAX_PRISMA_INT
  ) {
    throw new Error(
      "Expected an active KMS key version between 1 and 2147483646.",
    );
  }
  const kmsKeyId = (
    options.kmsKeyId ??
    process.env.AWS_KMS_DATA_KEY_ID ??
    ""
  ).trim();
  if (!kmsKeyId)
    throw new Error("AWS_KMS_DATA_KEY_ID is required for rotation.");

  const where = { purpose, status: "Active", version: expectedVersion };
  if (!(await db.encryptionKey.findFirst({ where, select: { id: true } }))) {
    throw new Error(
      `Expected active ${purpose} v${expectedVersion}. Review the current version before retrying.`,
    );
  }

  const kmsClient = getKmsClient(options);
  const wrapped = await generateWrappedDataKey(kmsClient, kmsKeyId);
  const checkedKey = await unwrapDataKey(
    kmsClient,
    wrapped,
    `${purpose} successor`,
  );
  checkedKey.fill(0);

  return db.$transaction(async (tx) => {
    const demoted = await tx.encryptionKey.updateMany({
      where,
      data: { status: "DecryptOnly", rotatedAt: new Date() },
    });
    if (demoted.count !== 1) {
      throw new Error(
        `Active ${purpose} changed during rotation. Review the current version before retrying.`,
      );
    }
    const latest = await tx.encryptionKey.findFirst({
      where: { purpose },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    const nextVersion = (latest?.version ?? expectedVersion) + 1;
    if (nextVersion > MAX_PRISMA_INT)
      throw new Error("KMS key version limit reached.");
    await tx.encryptionKey.create({
      data: { purpose, version: nextVersion, ...wrapped },
    });
    return nextVersion;
  });
}
