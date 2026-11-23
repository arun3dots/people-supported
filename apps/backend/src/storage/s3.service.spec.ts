const mockSend = jest.fn();
const mockGetSignedUrl = jest.fn();

jest.mock('@aws-sdk/client-s3', () => {
  const actual = jest.requireActual('@aws-sdk/client-s3');
  return {
    ...actual,
    S3Client: jest.fn().mockImplementation(() => ({
      send: mockSend,
    })),
  };
});

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: (...args: unknown[]) => mockGetSignedUrl(...args),
}));

import {
  GetBucketEncryptionCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { S3StorageService } from './s3.service';

describe('S3StorageService (SSE-KMS)', () => {
  const originalEnv = process.env;
  const keyArn = 'arn:aws:kms:eu-west-2:123456789012:key/test-key';

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      S3_BUCKET_NAME: 'cantra-test-bucket',
      AWS_REGION: 'eu-west-2',
    };
    mockSend.mockResolvedValue({});
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/put');
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('throws FATAL [E-02] in production when AWS_KMS_S3_KEY_ID is missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.AWS_KMS_S3_KEY_ID;

    expect(() => new S3StorageService()).toThrow(/FATAL \[E-02\]/);
  });

  it('requires the configured key as the S3 bucket default', async () => {
    process.env.AWS_KMS_S3_KEY_ID = keyArn;
    const service = new S3StorageService();
    await expect(service.onModuleInit()).rejects.toThrow(/bucket defaults/);
    expect(mockSend).toHaveBeenCalledWith(
      expect.any(GetBucketEncryptionCommand),
    );

    mockSend.mockResolvedValue({
      ServerSideEncryptionConfiguration: {
        Rules: [
          {
            ApplyServerSideEncryptionByDefault: {
              SSEAlgorithm: 'aws:kms',
              KMSMasterKeyID: keyArn.replace('test-key', 'other-key'),
            },
          },
        ],
      },
    });
    await expect(service.onModuleInit()).rejects.toThrow(/bucket defaults/);

    mockSend.mockResolvedValue({
      ServerSideEncryptionConfiguration: {
        Rules: [
          {
            ApplyServerSideEncryptionByDefault: {
              SSEAlgorithm: 'aws:kms',
              KMSMasterKeyID: keyArn,
            },
          },
        ],
      },
    });
    await expect(service.onModuleInit()).resolves.toBeUndefined();
  });

  it('rejects a configured key without a bucket before sending an AWS request', async () => {
    process.env.AWS_KMS_S3_KEY_ID = keyArn;
    delete process.env.S3_BUCKET_NAME;
    await expect(new S3StorageService().onModuleInit()).rejects.toThrow(
      /S3_BUCKET_NAME/,
    );
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('encrypts server uploads and signs the upload URL without requiring SSE headers', async () => {
    process.env.AWS_KMS_S3_KEY_ID = keyArn;
    const service = new S3StorageService();
    const { S3Client } =
      jest.requireActual<typeof import('@aws-sdk/client-s3')>(
        '@aws-sdk/client-s3',
      );
    const { getSignedUrl } = jest.requireActual<
      typeof import('@aws-sdk/s3-request-presigner')
    >('@aws-sdk/s3-request-presigner');
    const signingClient = new S3Client({
      region: 'eu-west-2',
      credentials: { accessKeyId: 'TEST', secretAccessKey: 'TEST' },
    });
    mockGetSignedUrl.mockImplementationOnce((_, command: PutObjectCommand) =>
      getSignedUrl(signingClient, command, { expiresIn: 900 }),
    );

    await service.uploadObject(
      Buffer.from('hello'),
      'residents/photo.png',
      'image/png',
    );
    await service.uploadFile(
      Buffer.from('pdf'),
      'doc.pdf',
      'application/pdf',
      'records',
    );
    const { url } = await service.getUploadSignedUrl(
      'notes.txt',
      'text/plain',
      'handovers',
    );

    expect(mockSend).toHaveBeenCalledTimes(2);
    for (const call of mockSend.mock.calls) {
      const cmd = call[0] as PutObjectCommand;
      expect(cmd.input.ServerSideEncryption).toBe('aws:kms');
      expect(cmd.input.SSEKMSKeyId).toBe(keyArn);
    }

    const query = new URL(url).searchParams;
    expect(query.get('X-Amz-SignedHeaders')).not.toContain(
      'x-amz-server-side-encryption',
    );
  });
});
