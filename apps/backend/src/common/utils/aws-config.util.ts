/**
 * Single source of AWS configuration shared by S3, SES, SNS, KMS, and Cognito clients.
 *
 * Env vars:
 *   AWS_REGION; optional AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN
 *   S3_BUCKET_NAME                                         (S3)
 *   SES_FROM_EMAIL, SES_CONFIGURATION_SET                  (SES)
 *   AWS_SNS_TOPIC_ARN, AWS_SNS_SENDER_ID                   (SNS)
 *   AWS_KMS_DATA_KEY_ID, AWS_KMS_S3_KEY_ID,
 *   AWS_KMS_SESSION_SIGN_KEY_ID                            (KMS)
 *   SERVICE_ID, COGNITO_REGION, COGNITO_USER_POOL_ID,
 *   COGNITO_CLIENT_ID, COGNITO_CLIENT_SECRET               (Cognito)
 */
export type PlatformServiceId = 'supported-living' | 'care-home';

export interface AwsClientConfig {
  region: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
}

const env = (key: string): string =>
  (process.env[key] || '').trim().replace(/^['"]|['"]$/g, '');

export function getAwsClientConfig(): AwsClientConfig {
  const accessKeyId = env('AWS_ACCESS_KEY_ID');
  const secretAccessKey = env('AWS_SECRET_ACCESS_KEY');
  const sessionToken = env('AWS_SESSION_TOKEN');

  return {
    region: env('AWS_REGION') || 'eu-north-1',
    credentials:
      accessKeyId && secretAccessKey
        ? {
            accessKeyId,
            secretAccessKey,
            ...(sessionToken ? { sessionToken } : {}),
          }
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

export const getKmsDataKeyId = (): string => env('AWS_KMS_DATA_KEY_ID');

export const getKmsS3KeyId = (): string => env('AWS_KMS_S3_KEY_ID');

export const getKmsSessionSignKeyId = (): string =>
  env('AWS_KMS_SESSION_SIGN_KEY_ID');

export const getServiceId = (): PlatformServiceId =>
  env('SERVICE_ID') === 'care-home' ? 'care-home' : 'supported-living';

export const getRequiredCognitoGroup = (): string =>
  `service:${getServiceId()}`;

export const getCognitoRegion = (): string =>
  env('COGNITO_REGION') || env('AWS_REGION') || 'eu-north-1';

export const getCognitoUserPoolId = (): string => env('COGNITO_USER_POOL_ID');

export const getCognitoClientId = (): string => env('COGNITO_CLIENT_ID');

export const getCognitoClientSecret = (): string =>
  env('COGNITO_CLIENT_SECRET');
