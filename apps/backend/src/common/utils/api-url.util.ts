/**
 * Resolves and validates the base API URL for asset streaming and external links.
 * In production, enforces that API_URL is explicitly configured to prevent silent
 * fallbacks to localhost:4400, which break client-side image and document rendering.
 */
export function assertApiUrlConfigured(
  rawUrl: string | undefined = process.env.API_URL,
  nodeEnv: string | undefined = process.env.NODE_ENV,
  bePort: string | number = process.env.BE_PORT || 4400,
): string {
  const trimmed = rawUrl?.trim().replace(/\/+$/, '');
  if (!trimmed) {
    if (nodeEnv === 'production') {
      throw new Error(
        'FATAL: API_URL environment variable is required in production (e.g. https://api.cantracare.co.uk/api) to prevent localhost asset URL generation.',
      );
    }
    return `http://localhost:${bePort}/api`;
  }
  return trimmed;
}

export function getApiBaseUrl(): string {
  return assertApiUrlConfigured();
}
