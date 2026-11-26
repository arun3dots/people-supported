import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { prisma } from '@repo/db';
import { accessConsoleSchema } from '@repo/schema';
import cookieParser from 'cookie-parser';
import { generateKeyPairSync, randomBytes, randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import request from 'supertest';
import { AuditDbService } from '../src/audit/audit-db.service';
import { AuditService } from '../src/audit/audit.service';
import { AuthModule } from '../src/auth/auth.module';
import { MailService } from '../src/common/mail/mail.service';
import { password, tenantId, userId } from './cognito-db.fixture';
import {
  PermissionFixtureController,
  productKey,
  subject,
  email,
  memberId,
  memberSubject,
  secondProduct,
  secondToken,
  seedAccessFixture,
  queryAccessFixture,
  startAccessFixture,
  assertDisposableAccessDatabases,
  findCookie,
} from './auth-access-db.fixture';
import { verifyStaffEnrollment } from './auth-access-staff.fixture';
import {
  clientId,
  clientSecret,
  startProvider,
} from './cognito-provider.fixture';

const webOrigin = 'http://127.0.0.1:3000';
const token = randomBytes(32).toString('base64url');
const privateRoute = `/internal/access/${productKey}`;
const consoleRoute = '/api/access-admin';
const mockSend = jest.fn();
const verificationMail = jest.fn().mockResolvedValue(undefined);
jest.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  ...jest.requireActual('@aws-sdk/client-cognito-identity-provider'),
  CognitoIdentityProviderClient: jest
    .fn()
    .mockImplementation(() => ({ send: mockSend })),
}));

const describeFixture =
  process.env.AUTH_ACCESS_DATABASE_URL && process.env.COGNITO_DISPOSABLE_DB
    ? describe
    : describe.skip;
describeFixture(
  'Auth & Access with real Cognito sessions and separate disposable databases',
  () => {
    let provider: Awaited<ReturnType<typeof startProvider>>;
    let product: INestApplication;
    let access: Awaited<ReturnType<typeof startAccessFixture>>;
    let centralMemberId: string;
    let adminCookie: string;
    let memberCookie: string;
    let memberRefresh: string;

    const productApi = () => request(product.getHttpServer());
    const accessApi = () => request(access.origin);
    const consoleGet = (auth: string) =>
      productApi().get(consoleRoute).set('Cookie', auth);
    const consolePatch = (path: string) =>
      productApi()
        .patch(`${consoleRoute}/${path}`)
        .set('Cookie', adminCookie)
        .set('Origin', webOrigin);
    const permissionGet = (auth: string) =>
      productApi().get('/api/permission-fixture').set('Cookie', auth);
    const actor = () => ({
      issuer: provider.origin,
      subject,
      tenantId,
      authenticatedAt: new Date().toISOString(),
    });

    async function login(account: string, reauthenticate = false) {
      provider.setSubject(account);
      const started = await productApi()
        .get(
          reauthenticate
            ? '/api/auth/cognito/start?reauthenticate=1'
            : '/api/auth/cognito/start',
        )
        .expect(303);
      const authorize = new URL(String(started.headers.location));
      expect(authorize.searchParams.get('prompt')).toBe(
        reauthenticate ? 'login' : null,
      );
      const redirect = await fetch(authorize, {
        redirect: 'manual',
      });
      const callback = new URL(redirect.headers.get('location') ?? '');
      const result = await productApi()
        .get(`${callback.pathname}${callback.search}`)
        .set('Cookie', findCookie(started, 'sl_cognito_binding'))
        .expect(303);
      expect(result.headers.location).toBe(
        `${webOrigin}/login?cognito=complete`,
      );
      return {
        access: findCookie(result, 'access_token'),
        refresh: findCookie(result, 'refresh_token'),
      };
    }

    beforeAll(async () => {
      assertDisposableAccessDatabases();
      provider = await startProvider();
      const key = generateKeyPairSync('rsa', {
        modulusLength: 2048,
      }).privateKey;
      Object.assign(process.env, {
        COGNITO_AUTH_ENABLED: 'true',
        COGNITO_MANAGED_USERS_ENABLED: 'true',
        COGNITO_PROVISIONING_ENABLED: 'true',
        COGNITO_PROVISIONING_USERNAME_MODE: 'alias',
        COGNITO_MFA_POLICY: 'required',
        COGNITO_USER_POOL_ID: 'eu-north-1_Fixture',
        COGNITO_MANAGED_LOGIN_URL: provider.origin,
        COGNITO_TEST_ISSUER: provider.origin,
        COGNITO_CLIENT_ID: clientId,
        COGNITO_CLIENT_SECRET: clientSecret,
        COGNITO_PILOT_USER_IDS: `${userId},${memberId}`,
        COGNITO_CALLBACK_URL: 'http://127.0.0.1:4400/api/auth/cognito/callback',
        COGNITO_SIGN_OUT_URL: `${webOrigin}/login`,
        COGNITO_APP_PRIVATE_KEY_B64: Buffer.from(
          key.export({ format: 'pem', type: 'pkcs8' }),
        ).toString('base64'),
      });
      access = await startAccessFixture({
        [productKey]: token,
        [secondProduct]: secondToken,
      });
      Object.assign(process.env, {
        AUTH_ACCESS_URL: access.origin,
        AUTH_ACCESS_SERVICE_TOKEN: token,
        AUTH_ACCESS_TENANT_IDS: tenantId,
        AUTH_ACCESS_PRODUCT: productKey,
      });
      const module = await Test.createTestingModule({
        imports: [AuthModule],
        controllers: [PermissionFixtureController],
      })
        .overrideProvider(AuditDbService)
        .useValue({})
        .overrideProvider(AuditService)
        .useValue({
          emitAuth: jest.fn().mockResolvedValue(undefined),
          emit: jest.fn().mockResolvedValue(undefined),
        })
        .overrideProvider(MailService)
        .useValue({ sendManagedAccountVerification: verificationMail })
        .compile();
      product = module.createNestApplication({ logger: false });
      product.use(cookieParser());
      product.setGlobalPrefix('api');
      await product.init();
      await seedAccessFixture(provider.origin);
      adminCookie = (await login(subject)).access;
      const console = await consoleGet(adminCookie).expect(200);
      const member = accessConsoleSchema
        .parse(console.body)
        .members.find((row) => row.name === 'Member');
      if (!member) throw new Error('Missing enrolled member.');
      centralMemberId = member.userId;
      const session = await login(memberSubject);
      memberCookie = session.access;
      memberRefresh = session.refresh;
    }, 30_000);

    afterAll(async () => {
      await product?.close();
      await access?.stop();
      await provider?.close();
      await prisma.$disconnect();
    });

    it('binds private credentials to products and rejects foreign tenants and issuers', async () => {
      await accessApi().post(`${privateRoute}/check`).send(actor()).expect(401);
      await accessApi()
        .post('/internal/access/care-home/check')
        .auth(token, { type: 'bearer' })
        .send(actor())
        .expect(401);
      for (const overrides of [
        { tenantId: randomUUID() },
        { issuer: 'https://other-pool.example' },
      ]) {
        await accessApi()
          .post(`${privateRoute}/check`)
          .auth(token, { type: 'bearer' })
          .send({ ...actor(), ...overrides })
          .expect(403);
      }
      await consoleGet(memberCookie).expect(403);
    });

    it('enforces delegation, CSRF boundaries, conflict handling and append-only history', async () => {
      const response = await consoleGet(adminCookie).expect(200);
      const policy = accessConsoleSchema.parse(response.body);
      expect(policy.roles.map((role) => [role.key, role.editable])).toEqual([
        ['approver', false],
        ['carer', true],
        ['member', true],
        ['operator', false],
      ]);
      const role = {
        name: 'Member',
        permissions: ['riskAssessments.read'],
        version: 1,
      };
      await consolePatch('roles/member')
        .set('Origin', 'http://other.localhost')
        .send(role)
        .expect(403);
      await consolePatch('roles/operator').send(role).expect(403);
      await consolePatch('roles/member')
        .send({ ...role, permissions: ['riskAssessments.approve'] })
        .expect(403);
      await consolePatch(`members/${centralMemberId}`)
        .send({ roleKey: 'approver', enabled: true, version: 1 })
        .expect(403);
      await productApi()
        .post(`${consoleRoute}/roles`)
        .set('Cookie', adminCookie)
        .set('Origin', webOrigin)
        .send({ ...role, key: 'reader', version: undefined })
        .expect(201);
      const concurrent = await Promise.all([
        consolePatch('roles/reader').send({ ...role, name: 'Reader one' }),
        consolePatch('roles/reader').send({ ...role, name: 'Reader two' }),
      ]);
      expect(concurrent.map((entry) => entry.status).sort()).toEqual([
        200, 409,
      ]);
      const count = await queryAccessFixture(
        `SELECT count(*) FROM "AccessAudit" WHERE "target" = 'reader'`,
      );
      expect(count.stdout.trim()).toBe('2');
      await expect(
        queryAccessFixture('DELETE FROM "AccessAudit" WHERE false'),
      ).rejects.toThrow(/append-only/);
    });

    it('checks edited permissions on an existing token and blocks legacy role fallback', async () => {
      await permissionGet(memberCookie).expect(200);
      await consolePatch('roles/member')
        .send({ name: 'Member', permissions: [], version: 1 })
        .expect(200);
      await permissionGet(memberCookie).expect(403);
      const profile = await productApi()
        .post('/api/auth/me')
        .set('Cookie', memberCookie)
        .expect(201);
      expect(profile.body).toMatchObject({
        permissions: { riskAssessments: { read: false } },
      });
      const legacy = await productApi()
        .post('/api/auth/login')
        .send({ email, password })
        .expect(201);
      await permissionGet(findCookie(legacy, 'access_token')).expect(403);
      await productApi()
        .post('/api/auth/me')
        .set('Cookie', findCookie(legacy, 'access_token'))
        .expect(403);
    });

    it('serializes concurrent refreshes and returns the current permissions', async () => {
      const count = provider.refreshCount();
      const refresh = () =>
        productApi()
          .post('/api/auth/refresh')
          .set('Cookie', memberRefresh)
          .set('Origin', webOrigin)
          .send({})
          .expect(201);
      const [one, two] = await Promise.all([refresh(), refresh()]);
      expect(provider.refreshCount()).toBe(count + 1);
      memberRefresh = findCookie(one, 'refresh_token');
      expect(memberRefresh).toBe(findCookie(two, 'refresh_token'));
      memberCookie = findCookie(one, 'access_token');
      await permissionGet(memberCookie).expect(403);
    });

    it('revokes product sessions and prevents reactivation from reviving existing cookies', async () => {
      const check = (enabled: boolean, version: number) =>
        consolePatch(`members/${centralMemberId}`)
          .send({ roleKey: 'member', enabled, version })
          .expect(200);
      await check(false, 1);
      await accessApi()
        .post(`/internal/access/${secondProduct}/check`)
        .auth(secondToken, { type: 'bearer' })
        .send({ ...actor(), subject: memberSubject })
        .expect(200, { permissions: ['medication.read'], canManage: false });
      await productApi()
        .post('/api/auth/me')
        .set('Cookie', memberCookie)
        .expect(403);
      const refreshCount = provider.refreshCount();
      await productApi()
        .post('/api/auth/refresh')
        .set('Cookie', memberRefresh)
        .set('Origin', webOrigin)
        .send({})
        .expect(401);
      expect(provider.refreshCount()).toBe(refreshCount);
      await check(true, 2);
      await productApi()
        .post('/api/auth/me')
        .set('Cookie', memberCookie)
        .expect(401);
      await delay(1_000);
      memberCookie = (await login(memberSubject, true)).access;
      await productApi()
        .post('/api/auth/me')
        .set('Cookie', memberCookie)
        .expect(201);
    });

    it('enrolls staff through the web API and recovers a confirmed Cognito user after a sync failure', async () => {
      const staffSubject = await verifyStaffEnrollment(
        productApi(),
        adminCookie,
        memberCookie,
        webOrigin,
        mockSend,
        verificationMail,
      );
      await permissionGet((await login(staffSubject)).access).expect(200);
    });

    it('fails closed when Auth & Access is unavailable', async () => {
      await access.stop();
      await permissionGet(adminCookie).expect(503);
    });
  },
);
