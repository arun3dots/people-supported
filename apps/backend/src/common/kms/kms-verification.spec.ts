import {
  decrypt,
  decryptWholePart,
  encrypt,
  encryptPrismaWrite,
  inspectCiphertext,
  inventoryKmsFields,
  isEncrypted,
  prisma,
  setDecryptionFailureReporter,
  validateKmsVerificationTarget,
} from '@repo/db';

describe('KMS verification and encrypted Prisma writes', () => {
  const key = 'arn:aws:kms:eu-north-1:123456789012:key/test-key';
  const env = {
    AWS_REGION: 'eu-north-1',
    AWS_KMS_DATA_KEY_ID: key,
    AWS_KMS_S3_KEY_ID: key.replace('test-key', 's3-test-key'),
    S3_BUCKET_NAME: 'cantra-files',
    DATABASE_URL:
      'postgresql://fixture:fixture@localhost/kms_stage?schema=public',
    KMS_VERIFY_EXPECTED_DATABASE: 'localhost:5432/kms_stage?schema=public',
  };

  afterEach(() => setDecryptionFailureReporter());

  it('rejects database mismatches, connection overrides and a different AWS region', () => {
    expect(validateKmsVerificationTarget(env, true)).toMatchObject({
      database: 'kms_stage',
      schema: 'public',
      region: 'eu-north-1',
    });
    expect(() =>
      validateKmsVerificationTarget({ ...env, AWS_REGION: 'eu-west-2' }, true),
    ).toThrow(/AWS_REGION/);
    expect(() =>
      validateKmsVerificationTarget(
        {
          ...env,
          KMS_VERIFY_EXPECTED_DATABASE: 'other:5432/kms_stage?schema=public',
        },
        true,
      ),
    ).toThrow(/verification target/);
    expect(() =>
      validateKmsVerificationTarget(
        { ...env, DATABASE_URL: env.DATABASE_URL + '&host=other' },
        true,
      ),
    ).toThrow(/override/);
  });

  it('monitors authentication and malformed-envelope failures without including field content', () => {
    const reporter = jest.fn();
    setDecryptionFailureReporter(reporter);
    const sealed = encrypt('fixture-identifier') ?? '';
    const tampered = sealed.replace(/.$/, (digit) =>
      digit === '0' ? '1' : '0',
    );
    expect(() => encrypt(tampered)).toThrow(
      '[E-02] Legacy field authentication failed.',
    );
    expect(() => decryptWholePart('kms:v7:fixture-identifier')).toThrow(
      '[E-02] Invalid encrypted field envelope.',
    );
    expect(() => decryptWholePart(sealed)).toThrow(
      '[E-02] Encrypted field does not contain valid JSON.',
    );
    expect(reporter.mock.calls).toEqual([
      ['authentication'],
      ['invalid_envelope'],
      ['invalid_json'],
    ]);
  });

  it('routes nested profile and DBS writes through the actual Prisma extension', async () => {
    const stop = new Error('Fixture stopped before reaching PostgreSQL');
    const inspect = jest.fn();
    const checkingClient = prisma.$extends({
      query: {
        user: {
          update({ args }) {
            inspect(args);
            throw stop;
          },
        },
      },
    });
    await expect(
      checkingClient.user.update({
        where: { id: 'fixture-user', tenantId: 'fixture-tenant' },
        data: {
          profile: { update: { phoneNumber: { set: 'fixture-phone' } } },
          dbsCheck: {
            upsert: {
              create: { type: 'Enhanced', certificateNumber: 'fixture-dbs' },
              update: { certificateNumber: { set: 'fixture-dbs' } },
            },
          },
        },
      }),
    ).rejects.toThrow(stop.message);
    expect(inspect).toHaveBeenCalledTimes(1);
    const [args] = inspect.mock.calls[0] as [Record<string, unknown>];
    const wire = JSON.stringify(args);
    expect(wire).not.toContain('fixture-phone');
    expect(wire).not.toContain('fixture-dbs');
    expect(args.where).toEqual({
      id: 'fixture-user',
      tenantId: 'fixture-tenant',
    });
  });

  it('encrypts bulk scalar assignments and pre-admission JSON without modifying filters', () => {
    const update = {
      where: { tenantId: 'fixture-tenant' },
      data: { dob: { set: '2000-01-01' } },
    };
    encryptPrismaWrite('Resident', 'updateManyAndReturn', update);
    expect(decrypt(update.data.dob.set)).toBe('2000-01-01');
    expect(isEncrypted(update.data.dob.set)).toBe(true);
    expect(update.where).toEqual({ tenantId: 'fixture-tenant' });

    const create = {
      data: [{ partF: 'fixture-scalar', partC: { untouched: true } }],
    };
    encryptPrismaWrite('ResidentPreAdmission', 'createManyAndReturn', create);
    const row = create.data[0];
    expect(isEncrypted(row.partF)).toBe(true);
    expect(decryptWholePart(row.partF)).toBe('fixture-scalar');
    expect(row.partC).toEqual({ untouched: true });
    expect(inspectCiphertext(row.partF, true).candidate).toBe(true);
  });

  it('reports counts and unreadable rows using only the read API', async () => {
    const $queryRaw = jest
      .fn()
      .mockResolvedValueOnce([
        { id: 'legacy-fixture', dob: encrypt('2000-01-01'), nhsNumber: null },
        { id: 'plaintext-fixture', dob: '2000-01-01', nhsNumber: null },
        {
          id: 'bad-fixture',
          dob: 'kms:v7:fixture-identifier',
          nhsNumber: null,
        },
      ])
      .mockResolvedValue([]);
    const inventory = await inventoryKmsFields({ $queryRaw });
    expect(inventory[0]).toMatchObject({
      table: 'Resident',
      scanned: 3,
      candidates: 2,
      conflicts: 0,
      unreadable: 1,
      legacy: 1,
      plaintext: 1,
      kms: 0,
    });
    expect(JSON.stringify(inventory)).not.toContain('fixture-identifier');
  });
});
