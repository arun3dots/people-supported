export function applyKmsCompatibilityReleaseSettings(
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (env.NODE_ENV !== 'production') return;

  // The first deploy can start from a runner script in the previous checkout.
  env.KMS_FIELD_WRITES_ENABLED = 'false';
  env.AWS_CREDENTIALS_MODE = 'default';
  env.MAIL_PROVIDER = 'ses';
}
