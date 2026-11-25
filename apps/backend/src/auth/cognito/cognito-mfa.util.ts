import { UnauthorizedException } from '@nestjs/common';

const STRONG_SECOND_FACTORS = new Set([
  'otp',
  'totp',
  'swk',
  'hwk',
  'fido',
  'webauthn',
]);
const PRIMARY_FACTORS = new Set(['pwd', 'user', 'pin', 'pop']);
const SINGLE_FACTOR_ACR = new Set(['urn:cognito:loa:1', '1', '0', 'aal1']);
const STRONG_DEFAULT_ACR = new Set(['urn:cognito:loa:3', 'urn:cognito:loa:4']);
const ACR_TOKEN_PATTERN = /^\S{1,256}$/;

export class CognitoMfaAssuranceException extends UnauthorizedException {
  constructor() {
    super('Cognito MFA assurance is required.');
  }
}

export function parseRequiredAcrValues(raw?: string): string[] {
  if (raw === undefined || raw.trim() === '') return [];
  const values = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (
    values.length === 0 ||
    values.some((entry) => !ACR_TOKEN_PATTERN.test(entry))
  ) {
    throw new Error('Invalid COGNITO_REQUIRED_ACR_VALUES.');
  }
  return values;
}

function normalizeAmr(values?: readonly string[]): string[] {
  if (!values) return [];
  return [
    ...new Set(values.map((v) => v.trim().toLowerCase()).filter(Boolean)),
  ];
}

export function hasStrongMfaAmr(methods: readonly string[]): boolean {
  if (methods.length < 2) return false;
  const hasSecondFactor = methods.some((m) => STRONG_SECOND_FACTORS.has(m));
  if (!hasSecondFactor) return false;
  return methods.includes('mfa') || methods.some((m) => PRIMARY_FACTORS.has(m));
}

export function verifyCognitoMfaAssurance(
  id: { amr?: string[]; acr?: string },
  access: { amr?: string[]; acr?: string },
  options: {
    requireExplicitEvidence: boolean;
    requiredAcrValues: readonly string[];
  },
): { mfaVerified: true; amr: string[]; acr?: string } {
  if (id.acr && access.acr && id.acr !== access.acr) {
    throw new CognitoMfaAssuranceException();
  }
  const acr = (id.acr ?? access.acr)?.trim();
  if (acr && SINGLE_FACTOR_ACR.has(acr.toLowerCase())) {
    throw new CognitoMfaAssuranceException();
  }
  if (
    options.requiredAcrValues.length > 0 &&
    (!acr || !options.requiredAcrValues.includes(acr))
  ) {
    throw new CognitoMfaAssuranceException();
  }

  const hasIdAmr = Array.isArray(id.amr);
  const hasAccessAmr = Array.isArray(access.amr);
  const idMethods = normalizeAmr(id.amr);
  const accessMethods = normalizeAmr(access.amr);
  if (hasIdAmr && !hasStrongMfaAmr(idMethods)) {
    throw new CognitoMfaAssuranceException();
  }
  if (hasAccessAmr && !hasStrongMfaAmr(accessMethods)) {
    throw new CognitoMfaAssuranceException();
  }

  const methods = hasIdAmr ? idMethods : accessMethods;
  const hasAmrEvidence = (hasIdAmr || hasAccessAmr) && hasStrongMfaAmr(methods);
  const hasQualifyingAcr = Boolean(
    acr &&
    (options.requiredAcrValues.includes(acr) || STRONG_DEFAULT_ACR.has(acr)),
  );
  if (options.requireExplicitEvidence && !hasAmrEvidence && !hasQualifyingAcr) {
    throw new CognitoMfaAssuranceException();
  }

  return { mfaVerified: true, amr: methods, acr };
}
