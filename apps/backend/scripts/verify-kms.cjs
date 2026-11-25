const { randomUUID } = require('node:crypto');
const { parseArgs } = require('node:util');
const {
  S3Client,
  GetBucketEncryptionCommand,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

async function checkS3(client, target, smoke) {
  const bucket = { Bucket: target.bucket, ExpectedBucketOwner: target.account };
  const configuration = await client.send(
    new GetBucketEncryptionCommand(bucket),
  );
  const encryption =
    configuration.ServerSideEncryptionConfiguration?.Rules?.[0]
      ?.ApplyServerSideEncryptionByDefault;
  if (
    encryption?.SSEAlgorithm !== 'aws:kms' ||
    encryption.KMSMasterKeyID !== target.s3Key
  ) {
    throw new Error('Bucket default does not match the expected KMS key.');
  }
  if (!smoke) return;

  const object = { ...bucket, Key: `kms-verification/${randomUUID()}.txt` };
  const url = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: object.Bucket,
      Key: object.Key,
    }),
    { expiresIn: 60 },
  );
  let versionId;
  try {
    const response = await fetch(url, {
      method: 'PUT',
      body: 'CantraCare KMS verification fixture\n',
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error('Headerless presigned upload failed.');
    versionId = response.headers.get('x-amz-version-id') ?? undefined;
    const metadata = await client.send(
      new HeadObjectCommand({ ...object, VersionId: versionId }),
    );
    versionId ??= metadata.VersionId;
    if (
      metadata.ServerSideEncryption !== 'aws:kms' ||
      metadata.SSEKMSKeyId !== target.s3Key
    ) {
      throw new Error(
        'Smoke object encryption does not match bucket defaults.',
      );
    }
  } finally {
    try {
      const metadata =
        versionId === undefined
          ? await client.send(new HeadObjectCommand(object)).catch((error) => {
              if (error?.$metadata?.httpStatusCode === 404) return undefined;
              throw error;
            })
          : { VersionId: versionId };
      if (metadata) {
        await client.send(
          new DeleteObjectCommand({ ...object, VersionId: metadata.VersionId }),
        );
      }
    } catch {
      console.error(`Cleanup required for synthetic object ${object.Key}.`);
      throw new Error('Temporary smoke object cleanup failed.');
    }
  }
}

async function main() {
  const [mode, ...args] = process.argv.slice(2);
  const { values } = parseArgs({
    args,
    options: {
      help: { type: 'boolean' },
      'batch-size': { type: 'string', default: '100' },
      's3-smoke': { type: 'boolean', default: false },
      'approve-temporary-s3-object': { type: 'boolean', default: false },
    },
  });
  if (values.help) {
    console.log(
      'Export DATABASE_URL, KMS_VERIFY_EXPECTED_DATABASE (host:port/name?schema=public), AWS_REGION and the KMS settings.',
    );
    console.log(
      'Run verify:kms:staging for database and bucket checks, or verify:kms:backfill for counts.',
    );
    console.log(
      'Optional staging flags --s3-smoke --approve-temporary-s3-object.',
    );
    return;
  }
  const staging = mode === 'staging';
  if (!staging && mode !== 'backfill')
    throw new Error('Invalid verification mode.');
  if (
    values['s3-smoke'] !== values['approve-temporary-s3-object'] ||
    (!staging && values['s3-smoke'])
  ) {
    console.error(
      'Temporary S3 smoke requires both approval flags in staging mode.',
    );
    process.exitCode = 1;
    return;
  }
  const batchSize = Number(values['batch-size']);
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 1000) {
    console.error('Batch size must be an integer from 1 to 1000.');
    process.exitCode = 1;
    return;
  }
  const exportedEnv = { ...process.env };
  const {
    getAwsClientConfig,
    KmsVerificationError,
    validateKmsVerificationTarget,
    verifyKmsDatabase,
  } = require('@repo/db');
  let phase = 'target validation';
  try {
    const target = validateKmsVerificationTarget(exportedEnv, staging);
    phase = 'read-only PostgreSQL and KMS checks';
    const report = await verifyKmsDatabase(target, {
      inventory: !staging,
      batchSize,
    });
    console.table(report.keys);
    if (report.keys.some((key) => !key.immutableArn)) {
      console.error(
        'Key registry contains a legacy ARN reference. Review before rotating keys.',
      );
      process.exitCode = 1;
    }
    if (report.inventory) {
      const totals = {
        scanned: 0,
        candidates: 0,
        conflicts: 0,
        unreadable: 0,
        kms: 0,
        legacy: 0,
        plaintext: 0,
      };
      for (const row of report.inventory) {
        for (const key of Object.keys(totals)) totals[key] += row[key];
        console.log(JSON.stringify(row));
      }
      console.log(JSON.stringify(totals));
      console.log(
        'Conflicts are not exercised by this read-only inventory. Counts show current coverage, not backfill history.',
      );
      if (totals.unreadable > 0) process.exitCode = 1;
    }
    if (staging) {
      phase = 'S3 bucket encryption or optional smoke check';
      const client = new S3Client({
        ...getAwsClientConfig(),
        region: target.region,
        requestChecksumCalculation: 'WHEN_REQUIRED',
      });
      try {
        await checkS3(client, target, values['s3-smoke']);
      } finally {
        client.destroy();
      }
      console.log(
        values['s3-smoke']
          ? 'S3 temporary smoke passed and cleaned up.'
          : 'S3 bucket default encryption verified.',
      );
    }
  } catch (error) {
    console.error(
      error instanceof KmsVerificationError
        ? error.message
        : `KMS verification failed during ${phase}.`,
    );
    process.exitCode = 1;
  }
}

void main().catch(() => {
  console.error(
    'KMS verification stopped. Check arguments and build the workspace packages.',
  );
  process.exitCode = 1;
});
