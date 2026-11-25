import { type INestApplication } from '@nestjs/common';
import { type Express } from 'express';
import { Test } from '@nestjs/testing';
import { prisma } from '@repo/db';
import { EMPTY_ROLE_PERMISSIONS } from '@repo/schema';
import * as bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import request from 'supertest';
import { AuditDbService } from '../src/audit/audit-db.service';
import { AuditService } from '../src/audit/audit.service';
import { AuthModule } from '../src/auth/auth.module';
import { MailService } from '../src/common/mail/mail.service';
import {
  clientId,
  clientSecret,
  superAdminClientId,
  superAdminClientSecret,
  startProvider,
} from './cognito-provider.fixture';

const webOrigin = 'http://web.cantracare.test';
const adminOrigin = 'http://admin.cantracare.test';
const tenantId = randomUUID();
const branchId = randomUUID();
const roleId = randomUUID();
const adminUserId = randomUUID();
const adminSub = '8ab45c10-91df-4208-88aa-2c910fe41b02';
const superAdminRoleId = randomUUID();
const superAdminId = randomUUID();
const superAdminSub = '7ab45c10-91df-4208-88aa-2c910fe41b01';
const fixturePassword = 'CompatFixturePassword123!';

function setCookies(res: request.Response): string[] {
  const headers: unknown = res.headers['set-cookie'];
  return Array.isArray(headers)
    ? headers.filter((v): v is string => typeof v === 'string')
    : [];
}

function cookiePair(res: request.Response, name: string): string {
  const match = setCookies(res).find(
    (c) => c.startsWith(`${name}=`) && !c.startsWith(`${name}=;`),
  );
  if (!match) throw new Error(`Missing active ${name} cookie.`);
  return match.split(';')[0];
}

const describeFixture = process.env.COGNITO_DISPOSABLE_DB
  ? describe
  : describe.skip;

describeFixture(
  'Cognito multi-app & host-only cookie compatibility (disposable PostgreSQL)',
  () => {
    let provider: Awaited<ReturnType<typeof startProvider>>;
    let app: INestApplication;
    const API = '/api/auth';

    beforeAll(async () => {
      provider = await startProvider();
      const key = generateKeyPairSync('rsa', {
        modulusLength: 2048,
      }).privateKey;
      Object.assign(process.env, {
        COGNITO_AUTH_ENABLED: 'true',
        COGNITO_MFA_POLICY: 'required',
        COGNITO_USER_POOL_ID: 'eu-north-1_Fixture',
        COGNITO_REGION: 'eu-north-1',
        COGNITO_MANAGED_LOGIN_URL: provider.origin,
        COGNITO_TEST_ISSUER: provider.origin,
        COGNITO_CLIENT_ID: clientId,
        COGNITO_CLIENT_SECRET: clientSecret,
        COGNITO_SUPERADMIN_CLIENT_ID: superAdminClientId,
        COGNITO_SUPERADMIN_CLIENT_SECRET: superAdminClientSecret,
        COGNITO_PILOT_USER_IDS: `${adminUserId},${superAdminId}`,
        COGNITO_CALLBACK_URL: `${webOrigin}/api/auth/cognito/callback`,
        COGNITO_SIGN_OUT_URL: `${webOrigin}/login`,
        COGNITO_SUPERADMIN_CALLBACK_URL: `${adminOrigin}/api/auth/cognito/callback`,
        COGNITO_SUPERADMIN_SIGN_OUT_URL: `${adminOrigin}/login`,
        LEGACY_COOKIE_DOMAIN: '.cantracare.test',
        COOKIE_HOST_ONLY: 'true',
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
      (app.getHttpAdapter().getInstance() as Express).set(
        'trust proxy',
        'loopback',
      );
      app.setGlobalPrefix('api');
      app.use(cookieParser());
      await app.init();

      await prisma.tenant.create({
        data: {
          id: tenantId,
          name: 'Compat fixture tenant',
          subdomain: 'cognito-compat-fixture',
          status: 'Active',
        },
      });
      await prisma.branch.create({
        data: { id: branchId, tenantId, name: 'Compat primary branch' },
      });
      await prisma.role.create({
        data: {
          id: roleId,
          name: 'Admin',
          tenantId,
          permissions: {
            ...EMPTY_ROLE_PERMISSIONS,
            dashboard: { read: true, write: true, delete: false },
          },
        },
      });
      await prisma.role.create({
        data: {
          id: superAdminRoleId,
          name: 'SuperAdmin',
          tenantId: null,
          permissions: EMPTY_ROLE_PERMISSIONS,
        },
      });
      const passwordHash = await bcrypt.hash(fixturePassword, 4);
      await prisma.user.create({
        data: {
          id: adminUserId,
          cognitoSub: adminSub,
          tenantId,
          email: 'compat-admin@example.invalid',
          fullName: 'Compat Admin',
          roleId,
          passwordHash,
          emailVerified: true,
          branches: { create: [{ branchId, isPrimary: true }] },
        },
      });
      await prisma.user.create({
        data: {
          id: superAdminId,
          cognitoSub: superAdminSub,
          tenantId: null,
          email: 'compat-superadmin@example.invalid',
          fullName: 'Compat SuperAdmin',
          roleId: superAdminRoleId,
          passwordHash,
          emailVerified: true,
        },
      });
    }, 30_000);

    afterAll(async () => {
      await app?.close();
      await provider?.close();
      await prisma.$disconnect();
    });

    const api = () => request(app.getHttpServer());

    async function runFlow(
      host: string,
      subjectId: string,
      extraHeaders: Record<string, string> = {},
    ) {
      provider.setSubject(subjectId);
      provider.setVariant('valid');
      const start = await api()
        .get(`${API}/cognito/start`)
        .set('Host', host)
        .set(extraHeaders)
        .expect(303);
      const binding = cookiePair(start, 'sl_cognito_binding');
      const redirect = await fetch(String(start.headers.location), {
        redirect: 'manual',
      });
      const cbUrl = new URL(redirect.headers.get('location') ?? '');
      return api()
        .get(`${cbUrl.pathname}${cbUrl.search}`)
        .set('Host', host)
        .set(extraHeaders)
        .set('Cookie', binding)
        .expect(303);
    }

    it('emits host-only Secure/HttpOnly/SameSite=Strict cookies and clears stale domain cookies', async () => {
      const cb = await runFlow('web.cantracare.test', adminSub, {
        'X-Forwarded-Proto': 'https',
      });
      expect(cb.headers.location).toBe(`${webOrigin}/login?cognito=complete`);
      const headers = setCookies(cb);
      const accessSet = headers.find(
        (h) => h.startsWith('access_token=') && !h.startsWith('access_token=;'),
      );
      const refreshSet = headers.find(
        (h) =>
          h.startsWith('refresh_token=') && !h.startsWith('refresh_token=;'),
      );
      expect(accessSet).toBeDefined();
      expect(accessSet).not.toContain('Domain=');
      expect(accessSet).toContain('HttpOnly');
      expect(accessSet).toContain('SameSite=Strict');
      expect(accessSet).toContain('Secure');
      expect(refreshSet).toBeDefined();
      expect(refreshSet).not.toContain('Domain=');
      expect(refreshSet).toContain('Path=/api/auth');
      expect(refreshSet).toContain('Secure');
      expect(
        headers.some(
          (h) =>
            h.startsWith('access_token=;') &&
            h.includes('Domain=.cantracare.test'),
        ),
      ).toBe(true);
      expect(
        headers.some(
          (h) =>
            h.startsWith('refresh_token=;') &&
            h.includes('Domain=.cantracare.test'),
        ),
      ).toBe(true);
    });

    it('resolves duplicate access_token and refresh_token cookies without shadowing', async () => {
      const cb = await runFlow('web.cantracare.test', adminSub);
      const rsAccess = cookiePair(cb, 'access_token');
      const slcRefresh = cookiePair(cb, 'refresh_token');

      // Simulate stale domain-wide HS256 cookie appearing before host-only RS256 cookie.
      const me = await api()
        .post(`${API}/me`)
        .set(
          'Cookie',
          `access_token=eyJhbGciOiJIUzI1NiJ9.stale.sig; ${rsAccess}`,
        )
        .expect(201);
      expect(me.body).toMatchObject({ userId: adminUserId, roleName: 'Admin' });

      const refreshed = await api()
        .post(`${API}/refresh`)
        .set('Origin', webOrigin)
        .set('Cookie', `refresh_token=legacy-stale-token; ${slcRefresh}`)
        .send({})
        .expect(201);
      expect(refreshed.body).toEqual({ success: true });
    });

    it('enforces SuperAdmin boundary on Cognito callbacks and routes logout to SuperAdmin', async () => {
      // Tenant Admin attempting Cognito sign-in on SuperAdmin portal must fail with unauthorized.
      const denied = await runFlow('admin.cantracare.test', adminSub);
      expect(denied.headers.location).toBe(
        `${adminOrigin}/login?cognito=failed&reason=unauthorized`,
      );
      expect(
        setCookies(denied).some((h) => !h.startsWith('sl_cognito_binding=;')),
      ).toBe(false);

      // Local linked SuperAdmin succeeds on admin.cantracare.test and logs out to adminOrigin/login.
      const ok = await runFlow('admin.cantracare.test', superAdminSub);
      expect(ok.headers.location).toBe(`${adminOrigin}/login?cognito=complete`);
      const access = cookiePair(ok, 'access_token');
      const refresh = cookiePair(ok, 'refresh_token');
      const me = await api()
        .post(`${API}/me`)
        .set('Cookie', access)
        .expect(201);
      expect(me.body).toMatchObject({
        userId: superAdminId,
        roleName: 'SuperAdmin',
      });
      const out = await api()
        .post(`${API}/logout`)
        .set('Origin', adminOrigin)
        .set('Cookie', `${access}; ${refresh}`)
        .expect(201);
      const signOut = new URL(String(out.body.signOutUrl));
      expect(signOut.searchParams.get('logout_uri')).toBe(
        `${adminOrigin}/login`,
      );
    });

    it('supports feature-flagged legacy password login toggle', async () => {
      const prevLegacy = process.env.LEGACY_AUTH_ENABLED;
      process.env.LEGACY_AUTH_ENABLED = 'false';
      try {
        await api()
          .post(`${API}/login`)
          .send({
            email: 'compat-admin@example.invalid',
            password: fixturePassword,
          })
          .expect(403);
      } finally {
        if (prevLegacy === undefined) delete process.env.LEGACY_AUTH_ENABLED;
        else process.env.LEGACY_AUTH_ENABLED = prevLegacy;
      }
      await api()
        .post(`${API}/login`)
        .send({
          email: 'compat-admin@example.invalid',
          password: fixturePassword,
        })
        .expect(201);
    });
  },
);
