import { inventoryKmsFields } from "./kms-backfill";
import { initKmsKeyRing } from "./kms-keyring";
import { createDatabaseClient } from "./prisma-client";

const region = "eu-north-1";
const bucket = "cantra-files";
const keyArn = /^arn:aws:kms:eu-north-1:(\d{12}):key\/[0-9a-z-]+$/;
const allowedDatabaseOptions = new Set([
  "schema",
  "sslmode",
  "sslcert",
  "sslrootcert",
  "sslidentity",
  "sslpassword",
  "sslaccept",
  "connect_timeout",
  "connection_limit",
  "pool_timeout",
  "pgbouncer",
  "application_name",
  "statement_cache_size",
  "socket_timeout",
]);
const requiredMigrations = [
  "20261120100000_add_envelope_encryption_keys",
  "20261120101000_add_nullable_cognito_identity",
];

export class KmsVerificationError extends Error {}

export function validateKmsVerificationTarget(
  env: NodeJS.ProcessEnv,
  requireS3: boolean,
) {
  if (env.AWS_REGION !== region) {
    throw new KmsVerificationError("Set AWS_REGION explicitly to eu-north-1.");
  }
  const dataKey = env.AWS_KMS_DATA_KEY_ID ?? "";
  const dataAccount = dataKey.match(keyArn)?.[1];
  if (!dataAccount) {
    throw new KmsVerificationError(
      "AWS_KMS_DATA_KEY_ID must be an immutable eu-north-1 key ARN.",
    );
  }
  const s3Key = env.AWS_KMS_S3_KEY_ID ?? "";
  if (
    requireS3 &&
    (env.S3_BUCKET_NAME !== bucket ||
      s3Key.match(keyArn)?.[1] !== dataAccount ||
      s3Key === dataKey)
  ) {
    throw new KmsVerificationError(
      "Verify S3_BUCKET_NAME and the separate eu-north-1 AWS_KMS_S3_KEY_ID.",
    );
  }

  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl || !env.KMS_VERIFY_EXPECTED_DATABASE) {
    throw new KmsVerificationError(
      "Export DATABASE_URL and KMS_VERIFY_EXPECTED_DATABASE.",
    );
  }
  let url: URL;
  let database: string;
  try {
    url = new URL(databaseUrl);
    database = decodeURIComponent(url.pathname.slice(1));
  } catch {
    throw new KmsVerificationError(
      "DATABASE_URL is not a valid PostgreSQL target.",
    );
  }
  const schema = url.searchParams.get("schema") ?? "public";
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.hostname ||
    !/^[a-zA-Z0-9_.-]+$/.test(database) ||
    !/^[a-zA-Z0-9_]+$/.test(schema) ||
    url.hash ||
    [...url.searchParams.keys()].some(
      (key) =>
        !allowedDatabaseOptions.has(key) ||
        url.searchParams.getAll(key).length !== 1,
    )
  ) {
    throw new KmsVerificationError(
      "DATABASE_URL contains an unsupported target or connection override.",
    );
  }
  if (
    env.KMS_VERIFY_EXPECTED_DATABASE !==
    `${url.hostname}:${url.port || "5432"}/${database}?schema=${schema}`
  ) {
    throw new KmsVerificationError(
      "DATABASE_URL does not match the independently supplied verification target.",
    );
  }
  return {
    databaseUrl,
    database,
    schema,
    region,
    bucket,
    dataKey,
    s3Key,
    account: dataAccount,
  };
}

export async function verifyKmsDatabase(
  target: ReturnType<typeof validateKmsVerificationTarget>,
  { inventory, batchSize }: { inventory: boolean; batchSize: number },
) {
  const client = createDatabaseClient({
    datasourceUrl: target.databaseUrl,
    log: [],
  });
  try {
    return await client.$transaction(
      async (tx) => {
        await tx.$executeRaw`SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY`;
        const [identity] = await tx.$queryRaw<
          Array<{ database: string; schema: string; readOnly: boolean }>
        >`
        SELECT current_database()::text AS "database", current_schema()::text AS "schema",
               current_setting('transaction_read_only') = 'on' AS "readOnly"
      `;
        if (
          !identity?.readOnly ||
          identity.database !== target.database ||
          identity.schema !== target.schema
        ) {
          throw new KmsVerificationError(
            "Connected PostgreSQL database, schema, or transaction mode failed verification.",
          );
        }
        const migrations = await tx.$queryRaw<
          Array<{ migration_name: string }>
        >`
        SELECT migration_name FROM "_prisma_migrations"
        WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
      `;
        if (
          !requiredMigrations.every((name) =>
            migrations.some((row) => row.migration_name === name),
          )
        ) {
          throw new KmsVerificationError(
            "The two KMS compatibility migrations must be recorded as applied.",
          );
        }
        const managedAccountsMigrationApplied = migrations.some(
          ({ migration_name }) =>
            migration_name ===
            "20261125100000_add_managed_cognito_provisioning",
        );
        const columns = await tx.$queryRaw<
          Array<{ column_name: string; is_nullable: string }>
        >`
        SELECT column_name::text, is_nullable::text FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'User'
          AND column_name IN ('passwordHash', 'cognitoSub')
      `;
        const indexes = await tx.$queryRaw<
          Array<{ indexname: string; indexdef: string }>
        >`
        SELECT indexname::text, indexdef FROM pg_indexes WHERE schemaname = current_schema()
          AND indexname IN ('EncryptionKey_purpose_version_key', 'EncryptionKey_one_active_per_purpose', 'User_cognitoSub_key')
      `;
        const constraints = await tx.$queryRaw<Array<{ name: string }>>`
        SELECT conname::text AS "name" FROM pg_constraint
        WHERE conrelid IN ('"EncryptionKey"'::regclass, '"User"'::regclass)
          AND contype = 'c' AND convalidated
      `;
        if (
          !columns.some(
            (column) =>
              column.column_name === "passwordHash" &&
              column.is_nullable ===
                (managedAccountsMigrationApplied ? "YES" : "NO"),
          ) ||
          (managedAccountsMigrationApplied &&
            !constraints.some(
              ({ name }) => name === "User_auth_mode_password_check",
            )) ||
          !columns.some(
            (column) =>
              column.column_name === "cognitoSub" &&
              column.is_nullable === "YES",
          ) ||
          indexes.length !== 3 ||
          !indexes.every((index) =>
            index.indexdef.startsWith("CREATE UNIQUE INDEX"),
          ) ||
          !indexes.some(
            (index) =>
              index.indexname === "EncryptionKey_one_active_per_purpose" &&
              index.indexdef.includes("'Active'"),
          ) ||
          !["version", "purpose", "status"].every((field) =>
            constraints.some(
              ({ name }) => name === `EncryptionKey_${field}_check`,
            ),
          )
        ) {
          throw new KmsVerificationError(
            "PostgreSQL encryption constraints or User column nullability differ from the migration.",
          );
        }
        const keys = await tx.encryptionKey.findMany({
          select: {
            purpose: true,
            version: true,
            status: true,
            kmsKeyId: true,
          },
          orderBy: [{ purpose: "asc" }, { version: "asc" }],
        });
        if (
          keys.some(
            ({ purpose, status }) =>
              !["DB_FIELD", "AUDIT_HMAC"].includes(purpose) ||
              !["Active", "DecryptOnly", "Retired"].includes(status),
          )
        ) {
          throw new KmsVerificationError(
            "The encryption key registry contains invalid metadata.",
          );
        }
        await initKmsKeyRing(
          {
            encryptionKey: {
              findMany: (args) => tx.encryptionKey.findMany(args),
              createMany: () =>
                Promise.reject(
                  new KmsVerificationError("Verification cannot create keys."),
                ),
            },
          },
          {
            kmsKeyId: target.dataKey,
            region: target.region,
            bootstrapMissingKeys: false,
            writeFieldsWithKms: false,
          },
        );
        return {
          keys: keys.map(({ kmsKeyId, ...key }) => ({
            ...key,
            immutableArn: keyArn.test(kmsKeyId),
          })),
          inventory: inventory
            ? await inventoryKmsFields(tx, batchSize)
            : undefined,
        };
      },
      { timeout: 120_000 },
    );
  } finally {
    await client.$disconnect();
  }
}
