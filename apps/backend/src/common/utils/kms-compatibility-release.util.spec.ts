import { applyKmsCompatibilityReleaseSettings } from './kms-compatibility-release.util';

describe('KMS compatibility release settings', () => {
  it('enforces the production settings even with values inherited from an older restart', () => {
    const env = {
      NODE_ENV: 'production',
      KMS_FIELD_WRITES_ENABLED: 'true',
      AWS_CREDENTIALS_MODE: 'instance-role',
      MAIL_PROVIDER: 'resend',
    };

    applyKmsCompatibilityReleaseSettings(env);

    expect(env).toEqual({
      NODE_ENV: 'production',
      KMS_FIELD_WRITES_ENABLED: 'false',
      AWS_CREDENTIALS_MODE: 'default',
      MAIL_PROVIDER: 'ses',
    });
  });

  it('leaves local credential and encryption test settings available', () => {
    const env = {
      NODE_ENV: 'test',
      KMS_FIELD_WRITES_ENABLED: 'true',
      AWS_CREDENTIALS_MODE: 'instance-role',
      MAIL_PROVIDER: 'resend',
    };
    const original = { ...env };

    applyKmsCompatibilityReleaseSettings(env);

    expect(env).toEqual(original);
  });
});
