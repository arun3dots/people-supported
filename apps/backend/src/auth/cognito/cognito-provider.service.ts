import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, createPublicKey } from 'node:crypto';
import { z } from '@repo/schema';
import { CognitoConfig, type CognitoAppTarget } from './cognito-config';
import {
  CognitoMfaAssuranceException,
  verifyCognitoMfaAssurance,
} from './cognito-mfa.util';

const headerSchema = z.object({
  alg: z.literal('RS256'),
  kid: z.string().min(1).max(128),
});
const jwksSchema = z.object({
  keys: z
    .array(
      z.object({
        kty: z.literal('RSA'),
        alg: z.literal('RS256'),
        use: z.literal('sig'),
        kid: z.string().min(1).max(128),
        n: z.string().max(2048),
        e: z.string().max(16),
      }),
    )
    .max(32),
});
const token = z.string().min(1).max(16384);
const responseSchema = z.object({
  token_type: z.literal('Bearer'),
  id_token: token,
  access_token: token,
  refresh_token: token,
});
const standardClaims = z.object({
  sub: z.string().uuid(),
  exp: z.number().int(),
  iat: z.number().int(),
});
const idClaims = standardClaims.extend({
  aud: z.string(),
  token_use: z.literal('id'),
  nonce: z.string().optional(),
  auth_time: z.number().int().positive(),
  at_hash: z.string().optional(),
  amr: z.array(z.string()).optional(),
  acr: z.string().optional(),
});
const accessClaims = standardClaims.extend({
  client_id: z.string(),
  token_use: z.literal('access'),
  amr: z.array(z.string()).optional(),
  acr: z.string().optional(),
});

export function digest(value: string): string {
  return createHash('sha256').update(value).digest('base64url');
}

@Injectable()
export class CognitoProvider {
  private keys = new Map<string, string>();
  private fetchedAt = 0;
  private loading?: Promise<void>;

  constructor(
    private readonly config: CognitoConfig,
    private readonly jwt: JwtService,
  ) {}

  authorize(
    state: string,
    challenge: string,
    nonce: string,
    target: CognitoAppTarget = this.config.require().apps.web,
  ) {
    const settings = this.config.require();
    const url = new URL('/oauth2/authorize', settings.managedOrigin);
    const params = new URLSearchParams({
      client_id: target.clientId,
      redirect_uri: target.redirectUri,
      response_type: 'code',
      scope: 'openid',
      state,
      nonce,
      code_challenge_method: 'S256',
      code_challenge: challenge,
    });
    if (settings.requiredAcrValues.length > 0) {
      params.set('acr_values', settings.requiredAcrValues.join(' '));
    }
    url.search = params.toString();
    return url.href;
  }

  logoutUrl(target: CognitoAppTarget = this.config.require().apps.web) {
    const settings = this.config.require();
    const url = new URL('/logout', settings.managedOrigin);
    url.search = new URLSearchParams({
      client_id: target.clientId,
      logout_uri: target.signOutUri,
    }).toString();
    return url.href;
  }

  async exchange(
    code: string,
    verifier: string,
    nonceHash: string,
    target: CognitoAppTarget = this.config.require().apps.web,
  ) {
    return this.tokens(
      {
        grant_type: 'authorization_code',
        code,
        redirect_uri: target.redirectUri,
        code_verifier: verifier,
      },
      target,
      nonceHash,
    );
  }

  async refresh(
    refreshToken: string,
    subject: string,
    target: CognitoAppTarget = this.config.require().apps.web,
  ) {
    const next = await this.tokens(
      {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      },
      target,
    );
    if (next.subject !== subject || next.refreshToken === refreshToken) {
      throw new UnauthorizedException('Cognito refresh rotation failed.');
    }
    return next;
  }

  async revoke(
    refreshToken: string,
    target: CognitoAppTarget = this.config.require().apps.web,
  ) {
    await this.providerRequest(
      '/oauth2/revoke',
      { token: refreshToken },
      target,
    );
  }

  private async providerRequest(
    path: string,
    form: Record<string, string>,
    target: CognitoAppTarget,
  ) {
    const settings = this.config.require();
    const basic = Buffer.from(
      `${target.clientId}:${target.clientSecret}`,
    ).toString('base64');
    let response: Response;
    try {
      response = await fetch(new URL(path, settings.managedOrigin), {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(5000),
        headers: {
          Authorization: `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ ...form, client_id: target.clientId }),
      });
    } catch {
      throw new ServiceUnavailableException(
        'Cognito is temporarily unavailable.',
      );
    }
    if (response.status === 429 || response.status >= 500) {
      throw new ServiceUnavailableException(
        'Cognito is temporarily unavailable.',
      );
    }
    if (!response.ok)
      throw new UnauthorizedException('Cognito rejected the request.');
    return response;
  }

  private async tokens(
    form: Record<string, string>,
    target: CognitoAppTarget,
    nonceHash?: string,
  ) {
    const response = await this.providerRequest('/oauth2/token', form, target);
    const settings = this.config.require();
    try {
      const tokens = responseSchema.parse(await response.json());
      const [id, access] = await Promise.all([
        this.verify(tokens.id_token).then((value) => idClaims.parse(value)),
        this.verify(tokens.access_token).then((value) =>
          accessClaims.parse(value),
        ),
      ]);
      const now = Math.floor(Date.now() / 1000);
      if (
        id.aud !== target.clientId ||
        access.client_id !== target.clientId ||
        id.sub !== access.sub ||
        id.auth_time > id.iat ||
        id.iat > now + 30 ||
        access.iat > now + 30 ||
        (nonceHash !== undefined &&
          (!id.nonce || digest(id.nonce) !== nonceHash)) ||
        (id.at_hash !== undefined &&
          id.at_hash !==
            createHash('sha256')
              .update(tokens.access_token)
              .digest()
              .subarray(0, 16)
              .toString('base64url'))
      ) {
        throw new UnauthorizedException('Invalid Cognito response.');
      }
      const assurance = verifyCognitoMfaAssurance(id, access, {
        requireExplicitEvidence:
          settings.requireAmrMfa || target.app === 'superadmin',
        requiredAcrValues: settings.requiredAcrValues,
      });
      return {
        subject: id.sub,
        authenticatedAt: new Date(id.auth_time * 1000),
        refreshToken: tokens.refresh_token,
        mfaVerified: assurance.mfaVerified,
      };
    } catch (error) {
      if (
        error instanceof ServiceUnavailableException ||
        error instanceof CognitoMfaAssuranceException
      ) {
        throw error;
      }
      throw new UnauthorizedException('Invalid Cognito response.');
    }
  }

  private async verify(jwt: string) {
    const encoded = jwt.split('.')[0];
    if (!encoded || encoded.length > 1024) throw new UnauthorizedException();
    const { kid } = headerSchema.parse(
      JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as unknown,
    );
    const age = Date.now() - this.fetchedAt;
    if (age >= 60 * 60_000 || (!this.keys.has(kid) && age >= 30_000)) {
      this.loading ??= this.loadKeys().finally(() => {
        this.loading = undefined;
      });
      await this.loading;
    }
    const publicKey = this.keys.get(kid);
    if (!publicKey) throw new UnauthorizedException();
    return this.jwt.verifyAsync<Record<string, unknown>>(jwt, {
      publicKey,
      algorithms: ['RS256'],
      issuer: this.config.require().issuer,
    });
  }

  private async loadKeys() {
    try {
      const response = await fetch(
        `${this.config.require().issuer}/.well-known/jwks.json`,
        {
          redirect: 'error',
          signal: AbortSignal.timeout(5000),
        },
      );
      if (!response.ok) throw new Error();
      const { keys } = jwksSchema.parse(await response.json());
      const next = new Map<string, string>();
      for (const { kid, kty, n, e } of keys) {
        const key = createPublicKey({ format: 'jwk', key: { kty, n, e } });
        if (
          next.has(kid) ||
          (key.asymmetricKeyDetails?.modulusLength ?? 0) < 2048
        )
          throw new Error();
        next.set(kid, key.export({ type: 'spki', format: 'pem' }).toString());
      }
      this.keys = next;
      this.fetchedAt = Date.now();
    } catch {
      throw new ServiceUnavailableException(
        'Cognito signing keys are unavailable.',
      );
    }
  }
}
