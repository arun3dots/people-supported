import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { decrypt, encrypt, isEncrypted, prisma } from '@repo/db';
import { randomBytes } from 'node:crypto';
import { CognitoConfig, type CognitoAppKey } from './cognito-config';
import { CognitoProvider, digest } from './cognito-provider.service';

export const LOGIN_ATTEMPT_TTL_MS = 10 * 60 * 1000;
const oneTimeValue = /^[a-zA-Z0-9_-]{43}$/;
export const newSecret = () => randomBytes(32).toString('base64url');

export function seal(value: string): string {
  const encrypted = encrypt(value);
  if (!encrypted || !isEncrypted(encrypted))
    throw new Error('Credential encryption failed.');
  return encrypted;
}

export function unseal(ciphertext: string | null): string {
  if (!ciphertext || !isEncrypted(ciphertext))
    throw new UnauthorizedException('Session credentials unavailable.');
  try {
    const value = decrypt(ciphertext);
    if (!value) throw new Error();
    return value;
  } catch {
    throw new UnauthorizedException('Session credentials unavailable.');
  }
}

function decodeSealedVerifier(raw: string): {
  verifier: string;
  app: CognitoAppKey;
} {
  try {
    const parsed = JSON.parse(raw) as { v?: unknown; a?: unknown };
    if (
      typeof parsed?.v === 'string' &&
      (parsed.a === 'web' || parsed.a === 'superadmin')
    ) {
      return { verifier: parsed.v, app: parsed.a };
    }
  } catch {
    // Legacy raw verifier format defaults to web target.
  }
  return { verifier: raw, app: 'web' };
}

@Injectable()
export class CognitoAuthorization {
  constructor(
    private readonly config: CognitoConfig,
    private readonly provider: CognitoProvider,
  ) {}

  async start(app: CognitoAppKey = 'web') {
    const target = this.config.require().apps[app];
    if (!target) throw new NotFoundException();
    const state = newSecret();
    const nonce = newSecret();
    const verifier = newSecret();
    const binding = newSecret();
    const now = new Date();
    const url = this.provider.authorize(state, digest(verifier), nonce, target);
    await prisma.$transaction([
      prisma.cognitoLoginAttempt.deleteMany({
        where: { expiresAt: { lte: now } },
      }),
      prisma.cognitoSession.deleteMany({ where: { expiresAt: { lte: now } } }),
      prisma.cognitoLoginAttempt.create({
        data: {
          stateHash: digest(state),
          bindingHash: digest(binding),
          nonceHash: digest(nonce),
          sealedVerifier: seal(JSON.stringify({ v: verifier, a: app })),
          expiresAt: new Date(now.getTime() + LOGIN_ATTEMPT_TTL_MS),
        },
      }),
    ]);
    return { url, binding };
  }

  async exchange(
    state: unknown,
    code: unknown,
    binding: unknown,
    expectedApp: CognitoAppKey = 'web',
  ) {
    if (
      typeof state !== 'string' ||
      !oneTimeValue.test(state) ||
      typeof binding !== 'string' ||
      !oneTimeValue.test(binding)
    ) {
      throw new UnauthorizedException('Invalid Cognito callback.');
    }
    if (typeof code !== 'string' || !code || code.length > 2048) {
      throw new UnauthorizedException('Invalid Cognito callback.');
    }
    const target = this.config.require().apps[expectedApp];
    if (!target) throw new NotFoundException();
    const where = {
      stateHash: digest(state),
      bindingHash: digest(binding),
      expiresAt: { gt: new Date() },
    };
    const attempt = await prisma.cognitoLoginAttempt.findFirst({ where });
    if (
      !attempt ||
      (
        await prisma.cognitoLoginAttempt.deleteMany({
          where: { ...where, expiresAt: { gt: new Date() } },
        })
      ).count !== 1
    ) {
      throw new UnauthorizedException('Invalid Cognito callback.');
    }
    const { verifier, app } = decodeSealedVerifier(
      unseal(attempt.sealedVerifier),
    );
    if (app !== expectedApp) {
      throw new UnauthorizedException('Cognito callback target mismatch.');
    }
    return this.provider.exchange(code, verifier, attempt.nonceHash, target);
  }
}
