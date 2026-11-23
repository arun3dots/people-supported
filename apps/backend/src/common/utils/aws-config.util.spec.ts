import { execFile } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { devNull } from 'node:os';
import { promisify } from 'node:util';
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

  describe('instance-role mode', () => {
    beforeEach(() => {
      process.env.AWS_CREDENTIALS_MODE = 'instance-role';
      process.env.AWS_CONFIG_FILE = devNull;
      process.env.AWS_SHARED_CREDENTIALS_FILE = devNull;
    });

    it('leaves credential lookup to the SDK after rejecting alternate sources', () => {
      expect(getAwsClientConfig()).toEqual({ region: 'eu-north-1' });
    });

    it.each([
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_SESSION_TOKEN',
      'AWS_PROFILE',
      'AWS_WEB_IDENTITY_TOKEN_FILE',
      'AWS_CONTAINER_CREDENTIALS_FULL_URI',
    ])('rejects %s in instance-role mode', (variable) => {
      process.env[variable] = 'fixture-value';
      expect(() => getAwsClientConfig()).toThrow(variable);
    });

    it('requires the SDK shared credential and config files to be disabled', () => {
      delete process.env.AWS_SHARED_CREDENTIALS_FILE;
      expect(() => getAwsClientConfig()).toThrow(/AWS_SHARED_CREDENTIALS_FILE/);
    });

    it('requires access to the instance metadata service', () => {
      process.env.AWS_EC2_METADATA_DISABLED = 'true';
      expect(() => getAwsClientConfig()).toThrow(/metadata access/);
    });

    it('rejects a custom IMDS endpoint in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.AWS_EC2_METADATA_SERVICE_ENDPOINT = 'http://127.0.0.1:1234';
      expect(() => getAwsClientConfig()).toThrow(
        /default EC2 metadata endpoint/,
      );
    });

    it('resolves IMDSv2 credentials through the real SDK for S3, SES, SNS and KMS', async () => {
      const rolePath = '/latest/meta-data/iam/security-credentials/';
      let authenticatedReads = 0;
      const server = createServer((request, response) => {
        if (request.method === 'PUT' && request.url === '/latest/api/token') {
          response.end('fixture-imds-token');
          return;
        }
        if (
          request.headers['x-aws-ec2-metadata-token'] !== 'fixture-imds-token'
        ) {
          response.writeHead(401).end();
          return;
        }
        if (request.url === rolePath) {
          response.end('fixture-instance-role');
        } else if (request.url === `${rolePath}fixture-instance-role`) {
          authenticatedReads++;
          response.end(
            JSON.stringify({
              Code: 'Success',
              AccessKeyId: 'fixture-role-access-key',
              SecretAccessKey: 'fixture-role-secret',
              Token: 'fixture-role-token',
              Expiration: new Date(Date.now() + 3_600_000).toISOString(),
            }),
          );
        } else {
          response.writeHead(404).end();
        }
      });
      server.listen(0, '127.0.0.1');
      await once(server, 'listening');
      try {
        const address = server.address();
        if (!address || typeof address === 'string')
          throw new Error('Expected loopback TCP server.');
        await promisify(execFile)(
          process.execPath,
          [
            '-e',
            `
          const assert = require('node:assert/strict');
          const { S3Client } = require('@aws-sdk/client-s3');
          const { SESClient } = require('@aws-sdk/client-ses');
          const { SNSClient } = require('@aws-sdk/client-sns');
          const { getAwsClientConfig, getKmsClient } = require('@repo/db');
          const config = getAwsClientConfig();
          Promise.all([
            new S3Client(config), new SESClient(config), new SNSClient(config), getKmsClient({}),
          ].map(async (client) => {
            const identity = await client.config.credentials();
            assert.equal(identity.accessKeyId, 'fixture-role-access-key');
            assert.equal(identity.sessionToken, 'fixture-role-token');
            client.destroy();
          })).catch((error) => {
            console.error(error.message);
            process.exitCode = 1;
          });
        `,
          ],
          {
            env: {
              ...process.env,
              NODE_ENV: 'test',
              DATABASE_URL: 'postgresql://fixture@127.0.0.1:1/fixture',
              AWS_EC2_METADATA_SERVICE_ENDPOINT: `http://127.0.0.1:${address.port}`,
              AWS_EC2_METADATA_V1_DISABLED: 'true',
            },
            timeout: 10_000,
          },
        );
        expect(authenticatedReads).toBeGreaterThan(0);
      } finally {
        await new Promise<void>((resolve) => {
          server.close(() => resolve());
        });
      }
    }, 15_000);
  });
});
