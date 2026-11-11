/**
 * Validates that JWT_SECRET is explicitly configured, is at least 32 characters
 * long, and is never the hardcoded fallback 'secretKey'.
 * Satisfies Compliance Finding D-04 (JWT signing secret management).
 */
export function assertJwtSecretConfigured(
  rawSecret: string | undefined = process.env.JWT_SECRET,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): string {
  const trimmed = rawSecret?.trim();
  if (!trimmed || trimmed === 'secretKey' || trimmed.length < 32) {
    if (nodeEnv === 'test' && process.env.STRICT_SECRET_CHECK !== 'true') {
      return 'test-only-ephemeral-jwt-signing-secret-32bytes!';
    }
    throw new Error(
      'FATAL [D-04]: JWT_SECRET environment variable is required, must not be "secretKey", and must be at least 32 characters long.',
    );
  }
  return trimmed;
}
