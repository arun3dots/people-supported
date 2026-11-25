import { type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { prisma } from '@repo/db';
import { EMPTY_ROLE_PERMISSIONS } from '@repo/schema';
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import request from 'supertest';
import { digest } from '../src/auth/cognito/cognito-provider.service';

export type MfaTestMode =
  | 'valid'
  | 'missing'
  | 'pwd_only'
  | 'sms_only'
  | 'single_otp'
  | 'refresh_drop_mfa'
  | 'silent_sso_valid'
  | 'silent_sso_missing';

function buildMfaClaims(mode: MfaTestMode, isRefresh: boolean) {
  if (mode === 'valid' || mode === 'silent_sso_valid') {
    return { amr: ['pwd', 'otp', 'mfa'], acr: 'urn:cognito:loa:3' };
  }
  if (mode === 'refresh_drop_mfa') {
    return isRefresh
      ? { amr: ['pwd'], acr: 'urn:cognito:loa:1' }
      : { amr: ['pwd', 'otp', 'mfa'], acr: 'urn:cognito:loa:3' };
  }
  if (mode === 'pwd_only') return { amr: ['pwd'], acr: 'urn:cognito:loa:1' };
  if (mode === 'sms_only')
    return { amr: ['pwd', 'sms'], acr: 'urn:cognito:loa:2' };
  if (mode === 'single_otp') return { amr: ['otp'] };
  return {};
}

export function activeCookies(res: request.Response): string[] {
  const headers: unknown = res.headers['set-cookie'];
  return Array.isArray(headers)
    ? headers.filter((v): v is string => typeof v === 'string')
    : [];
}

export function pickCookie(res: request.Response, name: string): string {
  const found = activeCookies(res).find(
    (c) => c.startsWith(`${name}=`) && !c.startsWith(`${name}=;`),
  );
  if (!found) throw new Error(`Missing ${name} cookie`);
  return found.split(';')[0];
}

export async function signInViaMockProvider(
  app: INestApplication,
  host: string,
  startPath = '/api/auth/cognito/start',
) {
  const start = await request(app.getHttpServer())
    .get(startPath)
    .set('Host', host)
    .expect(303);
  const auth = await fetch(start.headers.location, { redirect: 'manual' });
  const cb = new URL(auth.headers.get('location')!);
  return request(app.getHttpServer())
    .get(`${cb.pathname}${cb.search}`)
    .set('Host', host)
    .set('Cookie', pickCookie(start, 'sl_cognito_binding'))
    .expect(303);
}

export async function seedSecurityFixtureUsers(ids: {
  tenantId: string;
  roleId: string;
  adminUserId: string;
  adminSub: string;
  superAdminRoleId: string;
  superAdminId: string;
  superAdminSub: string;
}) {
  await prisma.tenant.create({
    data: {
      id: ids.tenantId,
      name: 'Security Org',
      subdomain: `sec-${ids.tenantId.slice(0, 8)}`,
      status: 'Active',
      subscriptionStatus: 'active',
    },
  });
  await prisma.role.create({
    data: {
      id: ids.roleId,
      tenantId: ids.tenantId,
      name: 'Admin',
      permissions: EMPTY_ROLE_PERMISSIONS,
    },
  });
  await prisma.user.create({
    data: {
      id: ids.adminUserId,
      tenantId: ids.tenantId,
      roleId: ids.roleId,
      email: 'sec-admin@example.invalid',
      passwordHash: 'x',
      fullName: 'Sec Admin',
      cognitoSub: ids.adminSub,
      emailVerified: true,
      mfaEnabled: false,
      isActive: true,
    },
  });
  await prisma.role.create({
    data: {
      id: ids.superAdminRoleId,
      tenantId: null,
      name: 'SuperAdmin',
      permissions: EMPTY_ROLE_PERMISSIONS,
    },
  });
  await prisma.user.create({
    data: {
      id: ids.superAdminId,
      tenantId: null,
      roleId: ids.superAdminRoleId,
      email: 'sec-sa@example.invalid',
      passwordHash: 'x',
      fullName: 'Sec SA',
      cognitoSub: ids.superAdminSub,
      emailVerified: true,
      mfaEnabled: false,
      isActive: true,
    },
  });
}

export async function startDualClientProvider(
  webSub: string,
  superAdminSub: string,
) {
  const jwt = new JwtService();
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
  const jwk = {
    ...publicKey.export({ format: 'jwk' }),
    kid: 'dual-kid',
    alg: 'RS256',
    use: 'sig',
  };
  const clients = new Map([
    ['web-client', 'web-secret-value-123456'],
    ['admin-client', 'admin-secret-value-123456'],
  ]);
  const grants = new Map<
    string,
    {
      clientId: string;
      redirect: string;
      challenge: string;
      nonce: string;
      mfaMode: MfaTestMode;
    }
  >();
  const refreshes = new Map<
    string,
    { clientId: string; sub: string; authTime: number; mfaMode: MfaTestMode }
  >();
  const usedClients: string[] = [];
  let mfaMode: MfaTestMode = 'valid';
  let authTimeOffsetSeconds = 0;
  let origin = '';

  const issue = (
    clientId: string,
    sub: string,
    authTime: number,
    mode: MfaTestMode,
    isRefresh: boolean,
    nonce?: string,
  ) => {
    const rt = randomUUID();
    refreshes.set(rt, { clientId, sub, authTime, mfaMode: mode });
    const claims = buildMfaClaims(mode, isRefresh);
    const opts = {
      privateKey,
      algorithm: 'RS256' as const,
      keyid: 'dual-kid',
      expiresIn: 300,
      issuer: origin,
      subject: sub,
    };
    return {
      token_type: 'Bearer',
      refresh_token: rt,
      id_token: jwt.sign(
        {
          token_use: 'id',
          nonce,
          auth_time: authTime,
          aud: clientId,
          ...claims,
        },
        opts,
      ),
      access_token: jwt.sign(
        { token_use: 'access', client_id: clientId, ...claims },
        opts,
      ),
    };
  };

  const json = (res: ServerResponse, status: number, data: unknown) =>
    res
      .writeHead(status, { 'Content-Type': 'application/json' })
      .end(JSON.stringify(data));

  async function serve(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url ?? '/', origin);
    if (url.pathname === '/.well-known/jwks.json') {
      return json(res, 200, { keys: [jwk] });
    }
    if (url.pathname === '/oauth2/authorize') {
      const clientId = url.searchParams.get('client_id') ?? '';
      const sub = clientId === 'admin-client' ? superAdminSub : webSub;
      const code = randomUUID();
      grants.set(code, {
        clientId,
        redirect: url.searchParams.get('redirect_uri') ?? '',
        challenge: url.searchParams.get('code_challenge') ?? '',
        nonce: url.searchParams.get('nonce') ?? '',
        mfaMode,
      });
      usedClients.push(`authorize:${clientId}:${sub}`);
      const cb = new URL(url.searchParams.get('redirect_uri') ?? '');
      cb.search = new URLSearchParams({
        code,
        state: url.searchParams.get('state') ?? '',
      }).toString();
      return void res.writeHead(302, { Location: cb.href }).end();
    }
    let raw = '';
    for await (const c of req) raw += String(c);
    const form = new URLSearchParams(raw);
    const clientId = form.get('client_id') ?? '';
    const secret = clients.get(clientId);
    const expectedAuth = `Basic ${Buffer.from(`${clientId}:${secret ?? ''}`).toString('base64')}`;
    if (!secret || req.headers.authorization !== expectedAuth) {
      return json(res, 401, { error: 'invalid_client' });
    }
    if (url.pathname === '/oauth2/revoke') {
      refreshes.delete(form.get('token') ?? '');
      usedClients.push(`revoke:${clientId}`);
      return json(res, 200, {});
    }
    if (form.get('grant_type') === 'refresh_token') {
      const rt = form.get('refresh_token') ?? '';
      const rec = refreshes.get(rt);
      if (!rec || rec.clientId !== clientId) {
        return json(res, 400, { error: 'invalid_grant' });
      }
      refreshes.delete(rt);
      usedClients.push(`refresh:${clientId}`);
      return json(
        res,
        200,
        issue(clientId, rec.sub, rec.authTime, mfaMode, true),
      );
    }
    const grant = grants.get(form.get('code') ?? '');
    if (
      !grant ||
      grant.clientId !== clientId ||
      grant.challenge !== digest(form.get('code_verifier') ?? '')
    ) {
      return json(res, 400, { error: 'invalid_grant' });
    }
    grants.delete(form.get('code') ?? '');
    usedClients.push(`token:${clientId}`);
    const authTime = Math.floor(Date.now() / 1000) - authTimeOffsetSeconds;
    return json(
      res,
      200,
      issue(
        clientId,
        clientId === 'admin-client' ? superAdminSub : webSub,
        authTime,
        grant.mfaMode,
        false,
        grant.nonce,
      ),
    );
  }

  const server = createServer((req, res) => {
    void serve(req, res).catch(() => json(res, 500, {}));
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const addr = server.address() as { port: number };
  origin = `http://127.0.0.1:${addr.port}`;
  return {
    origin,
    usedClients,
    setMfaMode: (next: MfaTestMode) => {
      mfaMode = next;
    },
    setAuthTimeOffsetSeconds: (offset: number) => {
      authTimeOffsetSeconds = offset;
    },
    close: () => new Promise<void>((r) => server.close(() => r())),
  };
}
