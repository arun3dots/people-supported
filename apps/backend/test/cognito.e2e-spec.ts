import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { prisma } from '@repo/db';
import cookieParser from 'cookie-parser';
import { generateKeyPairSync } from 'node:crypto';
import request from 'supertest';
import { AuditDbService } from '../src/audit/audit-db.service';
import { AuditService } from '../src/audit/audit.service';
import { AuthModule } from '../src/auth/auth.module';
import {
  CognitoConfig,
  loadCognitoConfig,
} from '../src/auth/cognito/cognito-config';
import { CognitoSessions } from '../src/auth/cognito/cognito-sessions.service';
import { MailService } from '../src/common/mail/mail.service';
import {
  clientId,
  clientSecret,
  email,
  startProvider,
  subject,
  type TokenCase,
} from './cognito-provider.fixture';

import {
  userId,
  tenantId,
  primaryBranchId,
  otherBranchId,
  newRoleId,
  password,
  seedCognitoFixture,
} from './cognito-db.fixture';

const webOrigin = 'http://127.0.0.1:3000';
const apiOrigin = 'http://127.0.0.1:4400';
const callbackUrl = `${apiOrigin}/api/auth/cognito/callback`;

function cookie(result: request.Response, name: string) {
  const headers: unknown = result.headers['set-cookie'];
  if (!Array.isArray(headers)) throw new Error('Missing fixture cookies.');
  const header = headers.find(
    (value: unknown): value is string =>
      typeof value === 'string' && value.startsWith(`${name}=`),
  );
  if (!header) throw new Error(`Missing ${name} cookie.`);
  return header.split(';')[0];
}

const describeFixture = process.env.COGNITO_DISPOSABLE_DB
  ? describe
  : describe.skip;
describeFixture(
  'Supported Living Cognito authentication (disposable PostgreSQL)',
  () => {
    let provider: Awaited<ReturnType<typeof startProvider>>;
    let app: INestApplication;
    const API = '/api/auth';

    beforeAll(async () => {
      const database = new URL(process.env.DATABASE_URL ?? 'http://invalid');
      if (
        !process.env.COGNITO_DISPOSABLE_DB ||
        database.host !== process.env.COGNITO_DISPOSABLE_DB ||
        database.protocol !== 'postgresql:' ||
        database.hostname !== '127.0.0.1' ||
        database.username !== 'cognito_fixture' ||
        database.pathname !== '/postgres' ||
        database.search
      )
        throw new Error(
          'Run with verify:cognito:backend on its disposable PostgreSQL cluster.',
        );

      provider = await startProvider();
      const key = generateKeyPairSync('rsa', {
        modulusLength: 2048,
      }).privateKey;
      Object.assign(process.env, {
        COGNITO_AUTH_ENABLED: 'true',
        COGNITO_MFA_POLICY: 'required',
        COGNITO_USER_POOL_ID: 'eu-north-1_Fixture',
        COGNITO_MANAGED_LOGIN_URL: provider.origin,
        COGNITO_TEST_ISSUER: provider.origin,
        COGNITO_CLIENT_ID: clientId,
        COGNITO_CLIENT_SECRET: clientSecret,
        COGNITO_PILOT_USER_IDS: userId,
        COGNITO_CALLBACK_URL: callbackUrl,
        COGNITO_SIGN_OUT_URL: `${webOrigin}/login`,
        COGNITO_APP_PRIVATE_KEY_B64: Buffer.from(
          key.export({ format: 'pem', type: 'pkcs8' }),
        ).toString('base64'),
      });
      const fixture = await Test.createTestingModule({ imports: [AuthModule] })
        .overrideProvider(AuditDbService)
        .useValue({})
        .overrideProvider(AuditService)
        .useValue({ emitAuth: jest.fn().mockResolvedValue(undefined) })
        .overrideProvider(MailService)
        .useValue({})
        .compile();
      app = fixture.createNestApplication({ logger: false });
      app.setGlobalPrefix('api');
      app.use(cookieParser());
      await app.init();

      await seedCognitoFixture();
    }, 30_000);

    afterAll(async () => {
      await app?.close();
      await provider?.close();
      await prisma.$disconnect();
    });

    const api = () => request(app.getHttpServer());
    const me = (access: string) =>
      api().post(`${API}/me`).set('Cookie', access);
    const refresh = (value: string) =>
      api()
        .post(`${API}/refresh`)
        .set('Cookie', value)
        .set('Origin', webOrigin)
        .send({});

    async function begin(variant: TokenCase = 'valid') {
      provider.setVariant(variant);
      const response = await api().get(`${API}/cognito/start`).expect(303);
      const binding = cookie(response, 'sl_cognito_binding');
      const redirect = await fetch(String(response.headers.location), {
        redirect: 'manual',
      });
      expect(redirect.status).toBe(302);
      const callback = new URL(redirect.headers.get('location') ?? '');
      return { binding, callback };
    }

    async function complete({
      binding,
      callback,
    }: Awaited<ReturnType<typeof begin>>) {
      return api()
        .get(`${callback.pathname}${callback.search}`)
        .set('Cookie', binding)
        .expect(303);
    }

    async function login() {
      const response = await complete(await begin());
      expect(response.headers.location).toBe(
        `${webOrigin}/login?cognito=complete`,
      );
      return {
        access: cookie(response, 'access_token'),
        refresh: cookie(response, 'refresh_token'),
      };
    }

    it('defaults off, rejects partial configuration and leaves legacy password login working', async () => {
      expect(loadCognitoConfig({})).toBeNull();
      expect(() => loadCognitoConfig({ COGNITO_AUTH_ENABLED: 'true' })).toThrow(
        'Invalid COGNITO_MFA_POLICY',
      );
      const result = await api()
        .post(`${API}/login`)
        .send({ email, password })
        .expect(201);
      expect(result.body).toMatchObject({
        success: true,
        user: { id: userId },
      });
      await me(cookie(result, 'access_token')).expect(201);
    });

    it('completes PKCE, encrypts the refresh credentials and rejects callback replay', async () => {
      const attempt = await begin();
      const first = await complete(attempt);
      expect(first.headers.location).toBe(
        `${webOrigin}/login?cognito=complete`,
      );
      const access = cookie(first, 'access_token');
      const refreshValue = cookie(first, 'refresh_token').split('=')[1];
      const session = await prisma.cognitoSession.findFirstOrThrow({
        where: { userId, subject },
      });
      expect(session.sealedCredentials).toMatch(/^[0-9a-f]{32}:/);
      expect(session.sealedCredentials).not.toContain(refreshValue);
      expect(session.refreshHash).not.toBe(refreshValue);
      const result = await me(access).expect(201);
      expect(result.body).toMatchObject({
        userId,
        tenantId,
        roleName: 'Carer',
        activeBranchId: primaryBranchId,
        mfaVerified: true,
      });
      await api().post(`${API}/mfa/generate`).set('Cookie', access).expect(403);
      expect((await complete(attempt)).headers.location).toBe(
        `${webOrigin}/login?cognito=failed`,
      );
    });

    it('rejects mismatched state and browser binding', async () => {
      const first = await begin();
      const second = await begin();
      expect(
        (await complete({ ...first, binding: second.binding })).headers
          .location,
      ).toBe(`${webOrigin}/login?cognito=failed`);
      first.callback.searchParams.set('state', 'x'.repeat(43));
      expect((await complete(first)).headers.location).toBe(
        `${webOrigin}/login?cognito=failed`,
      );
    });

    it.each<TokenCase>([
      'nonce',
      'audience',
      'client',
      'expired',
      'forged',
      'issuer',
      'token-use',
      'unlinked',
    ])('rejects %s provider identity', async (variant) => {
      const rejected = await complete(await begin(variant));
      expect(rejected.headers.location).toBe(
        `${webOrigin}/login?cognito=failed`,
      );
      expect(JSON.stringify(rejected.headers['set-cookie'])).not.toContain(
        'access_token=',
      );
    });

    it('checks account, tenant, permissions and active branch on each request', async () => {
      const { access } = await login();
      await prisma.user.update({
        where: { id: userId, tenantId },
        data: { isActive: false },
      });
      await me(access).expect(401);
      expect((await complete(await begin())).headers.location).toContain(
        'cognito=failed',
      );
      await prisma.user.update({
        where: { id: userId, tenantId },
        data: { isActive: true, roleId: newRoleId },
      });
      expect((await me(access).expect(201)).body).toMatchObject({
        roleName: 'Nurse',
        permissions: { dashboard: { read: true } },
      });
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { status: 'Suspended' },
      });
      await me(access).expect(401);
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { status: 'Active' },
      });
      await api()
        .post(`${API}/switch-branch`)
        .set('Cookie', access)
        .set('Origin', webOrigin)
        .send({ branchId: otherBranchId })
        .expect(201);
      expect((await me(access).expect(201)).body).toMatchObject({
        activeBranchId: otherBranchId,
      });
      await prisma.branch.update({
        where: { id: otherBranchId, tenantId },
        data: { status: 'Inactive' },
      });
      await me(access).expect(401);
      await prisma.branch.update({
        where: { id: otherBranchId, tenantId },
        data: { status: 'Active' },
      });
    });

    it('denies a linked account outside the explicit pilot allowlist', async () => {
      const { pilotIds } = app.get(CognitoConfig).require();
      pilotIds.delete(userId);
      try {
        expect((await complete(await begin())).headers.location).toBe(
          `${webOrigin}/login?cognito=failed`,
        );
      } finally {
        pilotIds.add(userId);
      }
    });

    it('serializes competing refreshes and revokes local and provider credentials on logout', async () => {
      const issued = await login();
      const before = provider.refreshCount();
      const [first, second] = await Promise.all([
        refresh(issued.refresh).expect(201),
        refresh(issued.refresh).expect(201),
      ]);
      expect(provider.refreshCount() - before).toBe(1);
      const rotated = cookie(first, 'refresh_token');
      expect(rotated).toBe(cookie(second, 'refresh_token'));
      expect(rotated).not.toBe(issued.refresh);
      expect(first.body).toEqual({ success: true });
      const revokedBefore = provider.revoked();
      const logout = await api()
        .post(`${API}/logout`)
        .set('Cookie', rotated)
        .set('Origin', webOrigin)
        .expect(201);
      const signOut = new URL(String(logout.body.signOutUrl));
      expect(signOut.pathname).toBe('/logout');
      expect(signOut.searchParams.get('logout_uri')).toBe(`${webOrigin}/login`);
      expect(provider.revoked() - revokedBefore).toBe(1);
      await me(issued.access).expect(401);
      await refresh(rotated).expect(401);
    });

    it('applies the shared revocation contract monotonically and denies revoked sessions', async () => {
      const issued = await login();
      const sessions = app.get(CognitoSessions);
      const now = new Date();
      await sessions.applyGlobalRevocation({
        version: 1,
        issuer: provider.origin,
        subject,
        revokedBefore: now.toISOString(),
      });
      await sessions.applyGlobalRevocation({
        version: 1,
        issuer: provider.origin,
        subject,
        revokedBefore: new Date(now.getTime() - 300_000).toISOString(),
      });
      const mark = await prisma.cognitoRevocation.findUniqueOrThrow({
        where: { issuer_subject: { issuer: provider.origin, subject } },
      });
      expect(mark.revokedBefore).toEqual(now);
      await me(issued.access).expect(401);
      await refresh(issued.refresh).expect(401);
    });
  },
);
