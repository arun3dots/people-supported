import { strict as assert } from "node:assert";
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import { test } from "node:test";
import { GenerateDataKeyCommand } from "@aws-sdk/client-kms";
import { decrypt, encrypt } from "../../src/crypto";
import { backfillKmsFields } from "../../src/kms-backfill";
import { rotateKmsDataKey } from "../../src/kms-key-rotation";
import {
  getAllAuditHmacKeys,
  initKmsKeyRing,
  type KmsClientLike,
} from "../../src/kms-keyring";

const url = new URL(
  process.env.KMS_TEST_DATABASE_URL ?? "postgresql://127.0.0.1/invalid",
);
if (
  url.protocol !== "postgresql:" ||
  url.hostname !== "127.0.0.1" ||
  !/^\/kms_fixture_[a-z0-9]+$/.test(url.pathname)
) {
  throw new Error(
    "Set KMS_TEST_DATABASE_URL to a disposable loopback database named kms_fixture_<suffix>.",
  );
}
process.env.DATABASE_URL = url.href;
process.env.ENCRYPTION_KEY = randomBytes(32).toString("hex");
process.env.KMS_FIELD_WRITES_ENABLED = "false";

const { prisma, rawPrisma } = createRequire(__filename)(
  "../../src",
) as typeof import("../../src");
const keyArn = "arn:aws:kms:eu-north-1:123456789012:key/test-key";
const wrapped = new Map<string, Buffer>();
const kmsClient: KmsClientLike = {
  async send(command) {
    if (command instanceof GenerateDataKeyCommand) {
      const blob = randomBytes(16);
      const key = randomBytes(32);
      wrapped.set(blob.toString("hex"), Buffer.from(key));
      return { KeyId: keyArn, CiphertextBlob: blob, Plaintext: key };
    }
    assert.equal(command.input.KeyId, keyArn);
    const key = wrapped.get(
      Buffer.from(command.input.CiphertextBlob ?? []).toString("hex"),
    );
    assert.ok(key);
    return { Plaintext: Buffer.from(key) };
  },
};
const kmsOptions = { kmsKeyId: keyArn, kmsClient };

test("migrates existing encrypted data safely and retains decryptability after rotation", async (t) => {
  t.after(() => prisma.$disconnect());
  const tenant = await prisma.tenant.create({
    data: { name: "Fixture tenant", subdomain: "kms-fixture" },
  });
  const branch = await prisma.branch.create({
    data: { tenantId: tenant.id, name: "Fixture branch" },
  });
  const role = await prisma.role.create({
    data: { name: "Carer", permissions: {} },
  });
  const user = await prisma.$transaction((tx) =>
    tx.user.create({
      data: {
        tenantId: tenant.id,
        roleId: role.id,
        email: "fixture@example.invalid",
        passwordHash: "fixture",
        fullName: "Fixture staff",
        niNumber: "fixture-ni",
        mfaSecret: "fixture-mfa",
        profile: {
          create: {
            addressLine1: "Fixture address",
            phoneNumber: "01234567890",
          },
        },
      },
      include: { profile: true },
    }),
  );
  assert.equal(user.profile?.phoneNumber, "01234567890");
  const oldUser = await rawPrisma.user.findUniqueOrThrow({
    where: { id: user.id },
  });
  const oldProfile = await rawPrisma.userProfile.findUniqueOrThrow({
    where: { userId: user.id },
  });
  assert.match(oldProfile.phoneNumber ?? "", /^[a-f0-9]{32}:/);
  assert.match(oldUser.mfaSecret ?? "", /^[a-f0-9]{32}:/);
  const dbs = await prisma.dbsCheck.create({
    data: {
      userId: user.id,
      type: "Enhanced",
      certificateNumber: "fixture-certificate",
    },
  });

  const residentData = {
    tenantId: tenant.id,
    branchId: branch.id,
    fullName: "Fixture resident",
    dob: "1990-01-01",
  };
  const resident = await prisma.resident.create({
    data: { ...residentData, nhsNumber: "fixture-nhs" },
  });
  const corrupt = "kms:v1:99:" + "0".repeat(32) + ":" + "0".repeat(32) + ":11";
  const damaged = await rawPrisma.resident.create({
    data: { ...residentData, nhsNumber: corrupt },
  });
  const admission = await rawPrisma.residentPreAdmission.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      residentId: resident.id,
      partA: {
        nhsNumber: encrypt("fixture-admission-id"),
        previousAddress: "Older plaintext",
        other: "preserve",
      },
      partB: encrypt(JSON.stringify({ medication: ["fixture"] })) ?? undefined,
      partC: { untouched: true },
      partE: { equipment: ["fixture"] },
      partF: "older JSON string",
    },
  });

  await Promise.all([
    initKmsKeyRing(prisma, kmsOptions),
    initKmsKeyRing(prisma, kmsOptions),
  ]);
  assert.equal(await prisma.encryptionKey.count(), 2);
  const priorAuditKey = Buffer.from(getAllAuditHmacKeys()[0] ?? []);
  await initKmsKeyRing(prisma, {
    ...kmsOptions,
    bootstrapMissingKeys: false,
    writeFieldsWithKms: true,
  });

  const dryRun = await backfillKmsFields(prisma, {
    apply: false,
    batchSize: 1,
  });
  assert.equal(
    dryRun.reduce((sum, row) => sum + row.candidates, 0),
    5,
  );
  assert.equal(
    dryRun.reduce((sum, row) => sum + row.updated, 0),
    0,
  );
  assert.equal(
    dryRun.reduce((sum, row) => sum + row.unreadable, 0),
    1,
  );
  assert.equal(
    (await rawPrisma.user.findUniqueOrThrow({ where: { id: user.id } }))
      .mfaSecret,
    oldUser.mfaSecret,
  );

  let edited = false;
  const applied = await backfillKmsFields(
    {
      $queryRaw: prisma.$queryRaw.bind(prisma),
      $executeRaw: async (query, ...values) => {
        if (!edited && values[2] === resident.id) {
          edited = true;
          await prisma.resident.update({
            where: { id: resident.id, tenantId: tenant.id },
            data: { nhsNumber: "concurrent value" },
          });
        }
        return prisma.$executeRaw(query, ...values);
      },
    },
    { apply: true, batchSize: 1 },
  );
  assert.equal(applied.find((row) => row.table === "Resident")?.conflicts, 1);
  assert.equal(
    applied.reduce((sum, row) => sum + row.updated, 0),
    4,
  );
  assert.equal(
    (await prisma.resident.findUniqueOrThrow({ where: { id: resident.id } }))
      .nhsNumber,
    "concurrent value",
  );
  assert.equal(
    (await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).mfaSecret,
    "fixture-mfa",
  );
  assert.match(
    (await rawPrisma.user.findUniqueOrThrow({ where: { id: user.id } }))
      .mfaSecret ?? "",
    /^kms:v1:1:/,
  );
  assert.match(
    (await rawPrisma.dbsCheck.findUniqueOrThrow({ where: { id: dbs.id } }))
      .certificateNumber ?? "",
    /^kms:v1:1:/,
  );
  assert.equal(
    (await rawPrisma.resident.findUniqueOrThrow({ where: { id: damaged.id } }))
      .nhsNumber,
    corrupt,
  );

  const opened = await prisma.residentPreAdmission.findUniqueOrThrow({
    where: { id: admission.id },
  });
  assert.deepEqual(opened.partA, {
    nhsNumber: "fixture-admission-id",
    previousAddress: "Older plaintext",
    other: "preserve",
  });
  assert.deepEqual(opened.partB, { medication: ["fixture"] });
  assert.deepEqual(opened.partC, { untouched: true });
  assert.deepEqual(opened.partE, { equipment: ["fixture"] });
  assert.equal(opened.partF, "older JSON string");
  const resumed = await backfillKmsFields(prisma, {
    apply: true,
    batchSize: 2,
  });
  assert.equal(
    resumed.reduce((sum, row) => sum + row.updated, 0),
    1,
  );
  const repeated = await backfillKmsFields(prisma, {
    apply: true,
    batchSize: 2,
  });
  assert.equal(
    repeated.reduce((sum, row) => sum + row.updated, 0),
    0,
  );

  const previousCiphertext = encrypt("before rotation");
  const rotations = await Promise.allSettled([
    rotateKmsDataKey(rawPrisma, "DB_FIELD", 1, kmsOptions),
    rotateKmsDataKey(rawPrisma, "DB_FIELD", 1, kmsOptions),
  ]);
  assert.equal(
    rotations.filter((result) => result.status === "fulfilled").length,
    1,
  );
  const fieldVersions = await prisma.encryptionKey.findMany({
    where: { purpose: "DB_FIELD" },
    orderBy: { version: "asc" },
  });
  assert.deepEqual(
    fieldVersions.map(({ version, status }) => [version, status]),
    [
      [1, "DecryptOnly"],
      [2, "Active"],
    ],
  );
  assert.equal(
    await rotateKmsDataKey(rawPrisma, "AUDIT_HMAC", 1, kmsOptions),
    2,
  );

  await initKmsKeyRing(prisma, {
    ...kmsOptions,
    bootstrapMissingKeys: false,
    writeFieldsWithKms: true,
  });
  assert.equal(decrypt(previousCiphertext), "before rotation");
  assert.match(encrypt("after rotation") ?? "", /^kms:v1:2:/);
  assert.ok(getAllAuditHmacKeys().some((key) => key.equals(priorAuditKey)));
  const updated = await prisma.user.update({
    where: { id: user.id, tenantId: tenant.id },
    data: {
      profile: {
        update: { addressLine1: { set: "Updated address" } },
      },
    },
    include: { profile: true },
  });
  assert.equal(updated.profile?.addressLine1, "Updated address");
  assert.match(
    (
      await rawPrisma.userProfile.findUniqueOrThrow({
        where: { userId: user.id },
      })
    ).addressLine1 ?? "",
    /^kms:v1:2:/,
  );

  const oldestFieldKey = fieldVersions[0];
  assert.ok(oldestFieldKey);
  await prisma.encryptionKey.create({
    data: {
      purpose: "DB_FIELD",
      status: "Retired",
      version: 2_147_483_647,
      kmsKeyId: oldestFieldKey.kmsKeyId,
      encryptedDek: oldestFieldKey.encryptedDek,
    },
  });
  await assert.rejects(
    rotateKmsDataKey(rawPrisma, "DB_FIELD", 2, kmsOptions),
    /KMS key version limit reached/,
  );
  assert.equal(
    (
      await prisma.encryptionKey.findFirstOrThrow({
        where: { purpose: "DB_FIELD", status: "Active" },
      })
    ).version,
    2,
  );
});
