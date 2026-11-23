import { getAwsClientConfig } from './aws-config.util';

describe('AWS client configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { AWS_REGION: 'eu-north-1' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('leaves credentials to the SDK provider chain for an EC2 role or local profile', () => {
    expect(getAwsClientConfig()).toEqual({
      region: 'eu-north-1',
      credentials: undefined,
    });
  });

  it('preserves the session token for an explicitly supplied temporary identity', () => {
    process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
    process.env.AWS_SESSION_TOKEN = 'test-session';
    expect(getAwsClientConfig().credentials).toEqual({
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret',
      sessionToken: 'test-session',
    });
  });
});
