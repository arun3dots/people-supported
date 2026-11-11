/**
 * Single source of AWS configuration shared by S3, SES and SNS clients.
 *
 * Env vars:
 *   AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY  (shared)
 *   S3_BUCKET_NAME                                         (S3)
 *   SES_FROM_EMAIL, SES_CONFIGURATION_SET                  (SES)
 *   AWS_SNS_TOPIC_ARN, AWS_SNS_SENDER_ID                   (SNS)
 */
export interface AwsClientConfig {
  region: string;
  credentials?: { accessKeyId: string; secretAccessKey: string };
}

const env = (key: string): string =>
  (process.env[key] || '').trim().replace(/^['"]|['"]$/g, '');

export function getAwsClientConfig(): AwsClientConfig {
  const accessKeyId = env('AWS_ACCESS_KEY_ID');
  const secretAccessKey = env('AWS_SECRET_ACCESS_KEY');

  return {
    region: env('AWS_REGION') || 'eu-north-1',
    credentials:
      accessKeyId && secretAccessKey
        ? { accessKeyId, secretAccessKey }
        : undefined,
  };
}

export function hasAwsCredentials(): boolean {
  return Boolean(env('AWS_ACCESS_KEY_ID') && env('AWS_SECRET_ACCESS_KEY'));
}

export const getS3BucketName = (): string => env('S3_BUCKET_NAME');

export const getSesFromEmail = (): string => env('SES_FROM_EMAIL');

export const getSesConfigurationSet = (): string | undefined =>
  env('SES_CONFIGURATION_SET') || undefined;

export const getSnsTopicArn = (): string | undefined =>
  env('AWS_SNS_TOPIC_ARN') || undefined;

export const getSnsSenderId = (): string =>
  env('AWS_SNS_SENDER_ID') || 'CantraCare';
