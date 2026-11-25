import { JwtService } from '@nestjs/jwt';
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { digest } from '../src/auth/cognito/cognito-provider.service';

export const clientId = 'supported-living-fixture';
export const clientSecret = 'local-only-fixture-secret';
export const superAdminClientId = 'supported-living-superadmin-fixture';
export const superAdminClientSecret = 'local-only-superadmin-fixture-secret';
export const subject = '2fd34b09-cc8e-4ab3-9611-a4e180e1c693';
export const email = 'local-pilot@example.invalid';
const kid = 'fixture-signing-key';
const clients = new Map([
  [clientId, clientSecret],
  [superAdminClientId, superAdminClientSecret],
]);

export type TokenCase =
  | 'valid'
  | 'nonce'
  | 'audience'
  | 'client'
  | 'expired'
  | 'forged'
  | 'issuer'
  | 'token-use'
  | 'unlinked';
interface Grant {
  clientId: string;
  nonce: string;
  challenge: string;
  redirect: string;
  variant: TokenCase;
  account: string;
}

export async function startProvider() {
  const jwt = new JwtService();
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
  const forged = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
  const codes = new Map<string, Grant>();
  const refreshTokens = new Map<
    string,
    { account: string; authTime: number; clientId: string }
  >();
  const jwk = {
    ...publicKey.export({ format: 'jwk' }),
    kid,
    alg: 'RS256',
    use: 'sig',
  };
  let origin = '';
  let variant: TokenCase = 'valid';
  let activeSubject = subject;
  let refreshCount = 0;
  let revoked = 0;

  function tokens(
    variant: TokenCase,
    authTime: number,
    account: string,
    targetClientId: string,
    nonce?: string,
  ) {
    const refreshToken = randomUUID();
    refreshTokens.set(refreshToken, {
      account,
      authTime,
      clientId: targetClientId,
    });
    const options = {
      privateKey: variant === 'forged' ? forged : privateKey,
      algorithm: 'RS256' as const,
      keyid: kid,
      expiresIn: variant === 'expired' ? -10 : 300,
      issuer: variant === 'issuer' ? `${origin}/different-pool` : origin,
      subject: account,
    };
    return {
      token_type: 'Bearer',
      refresh_token: refreshToken,
      id_token: jwt.sign(
        {
          token_use: variant === 'token-use' ? 'access' : 'id',
          nonce: variant === 'nonce' ? 'unexpected' : nonce,
          auth_time: authTime,
          email,
          email_verified: true,
          amr: ['pwd', 'otp', 'mfa'],
          acr: 'urn:cognito:loa:3',
          aud: variant === 'audience' ? 'care-home-fixture' : targetClientId,
        },
        options,
      ),
      access_token: jwt.sign(
        {
          token_use: 'access',
          amr: ['pwd', 'otp', 'mfa'],
          acr: 'urn:cognito:loa:3',
          client_id:
            variant === 'client' ? 'care-home-fixture' : targetClientId,
        },
        options,
      ),
    };
  }

  function json(res: ServerResponse, status: number, data: unknown) {
    res
      .writeHead(status, { 'Content-Type': 'application/json' })
      .end(JSON.stringify(data));
  }

  async function serve(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url ?? '/', origin);
    if (url.pathname === '/.well-known/jwks.json')
      return json(res, 200, { keys: [jwk] });
    if (url.pathname === '/oauth2/authorize') {
      const query = url.searchParams;
      const redirect = query.get('redirect_uri');
      const nonce = query.get('nonce');
      const challenge = query.get('code_challenge');
      const state = query.get('state');
      const reqClient = query.get('client_id') ?? '';
      if (
        !redirect ||
        !nonce ||
        !challenge ||
        !state ||
        query.get('response_type') !== 'code' ||
        query.get('code_challenge_method') !== 'S256' ||
        query.get('scope') !== 'openid' ||
        !clients.has(reqClient)
      ) {
        return json(res, 400, { error: 'invalid_request' });
      }
      const code = randomUUID();
      codes.set(code, {
        clientId: reqClient,
        nonce,
        challenge,
        redirect,
        variant,
        account: activeSubject,
      });
      const callback = new URL(redirect);
      callback.search = new URLSearchParams({ code, state }).toString();
      return void res.writeHead(302, { Location: callback.href }).end();
    }
    if (req.method !== 'POST')
      return json(res, 401, { error: 'invalid_client' });
    req.setEncoding('utf8');
    let body = '';
    for await (const chunk of req) body += String(chunk);
    const form = new URLSearchParams(body);
    const reqClient = form.get('client_id') ?? '';
    const secret = clients.get(reqClient);
    const expectedBasic = secret
      ? `Basic ${Buffer.from(`${reqClient}:${secret}`).toString('base64')}`
      : '';
    if (!secret || req.headers.authorization !== expectedBasic) {
      return json(res, 401, { error: 'invalid_client' });
    }
    const refreshToken = form.get('refresh_token') ?? '';
    if (url.pathname === '/oauth2/revoke') {
      const rec = refreshTokens.get(form.get('token') ?? '');
      if (rec && rec.clientId === reqClient) {
        refreshTokens.delete(form.get('token') ?? '');
        revoked++;
      }
      return json(res, 200, {});
    }
    if (
      url.pathname === '/oauth2/token' &&
      form.get('grant_type') === 'refresh_token'
    ) {
      refreshCount++;
      const session = refreshTokens.get(refreshToken);
      if (!session || session.clientId !== reqClient)
        return json(res, 400, { error: 'invalid_grant' });
      refreshTokens.delete(refreshToken);
      await new Promise((resolve) => setTimeout(resolve, 70));
      return json(
        res,
        200,
        tokens('valid', session.authTime, session.account, reqClient),
      );
    }
    const code = form.get('code') ?? '';
    const grant = codes.get(code);
    if (
      url.pathname !== '/oauth2/token' ||
      form.get('grant_type') !== 'authorization_code' ||
      !grant ||
      grant.clientId !== reqClient ||
      grant.redirect !== form.get('redirect_uri') ||
      grant.challenge !== digest(form.get('code_verifier') ?? '')
    ) {
      return json(res, 400, { error: 'invalid_grant' });
    }
    codes.delete(code);
    const account = grant.variant === 'unlinked' ? randomUUID() : grant.account;
    return json(
      res,
      200,
      tokens(
        grant.variant,
        Math.floor(Date.now() / 1000),
        account,
        reqClient,
        grant.nonce,
      ),
    );
  }

  const server = createServer((req, res) => {
    void serve(req, res).catch(() => json(res, 500, {}));
  });
  await new Promise<void>((resolve, reject) =>
    server.once('error', reject).listen(0, '127.0.0.1', resolve),
  );
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('OIDC fixture startup failed.');
  origin = `http://127.0.0.1:${address.port}`;
  return {
    origin,
    setVariant(value: TokenCase) {
      variant = value;
    },
    setSubject(value: string) {
      activeSubject = value;
    },
    refreshCount: () => refreshCount,
    revoked: () => revoked,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  };
}
