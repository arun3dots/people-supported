import { ForbiddenException, type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { prisma } from '@repo/db';
import { COGNITO_APP_AUDIENCE, COGNITO_APP_ISSUER } from '@repo/schema';
import cookieParser from 'cookie-parser';
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import request from 'supertest';
import { AuditDbService } from '../src/audit/audit-db.service';
import { AuditService } from '../src/audit/audit.service';
import { AuthModule } from '../src/auth/auth.module';
import {
  loadCognitoConfig,
  resolveAppForRequest,
} from '../src/auth/cognito/cognito-config';
import { MailService } from '../src/common/mail/mail.service';
import {
  pickCookie,
  seedSecurityFixtureUsers,
  signInViaMockProvider,
  startDualClientProvider,
} from './cognito-dual-provider.fixture';

const webOrigin = 'http://web.cantracare.test';
const adminOrigin = 'http://admin.cantracare.test';
const tenantId = randomUUID();
const roleId = randomUUID();
const adminUserId = randomUUID();
const adminSub = '9ab45c10-91df-4208-88aa-2c910fe41b02';
const superAdminRoleId = randomUUID();
const superAdminId = randomUUID();
const superAdminSub = '6ab45c10-91df-4208-88aa-2c910fe41b01';

const describeFixture = process.env.COGNITO_DISPOSABLE_DB
  ? describe
  : describe.skip;

describeFixture(
  'Cognito staging routing & security hardening (disposable PostgreSQL)',
  () => {
    let provider: Awaited<ReturnType<typeof startDualClientProvider>>;
    let app: INestApplication;
    let appKeys: ReturnType<typeof generateKeyPairSync>;

    beforeAll(async () => {
      provider = await startDualClientProvider(adminSub, superAdminSub);
      appKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });
      Object.assign(process.env, {
        COGNITO_AUTH_ENABLED: 'true',
        COGNITO_MFA_POLICY: 'required',
        COGNITO_USER_POOL_ID: 'eu-north-1_Fixture01',
        COGNITO_REGION: 'eu-north-1',
        COGNITO_MANAGED_LOGIN_URL: provider.origin,
        COGNITO_TEST_ISSUER: provider.origin,
        COGNITO_CLIENT_ID: 'web-client',
        COGNITO_CLIENT_SECRET: 'web-secret-value-123456',
        COGNITO_SUPERADMIN_CLIENT_ID: 'admin-client',
        COGNITO_SUPERADMIN_CLIENT_SECRET: 'admin-secret-value-123456',
        COGNITO_PILOT_USER_IDS: `${adminUserId},${superAdminId}`,
        COGNITO_CALLBACK_URL: `${webOrigin}/api/auth/cognito/callback`,
        COGNITO_SIGN_OUT_URL: `${webOrigin}/login`,
        COGNITO_SUPERADMIN_CALLBACK_URL: `${adminOrigin}/api/auth/cognito/callback`,
        COGNITO_SUPERADMIN_SIGN_OUT_URL: `${adminOrigin}/login`,
        COOKIE_HOST_ONLY: 'true',
        ENFORCE_MFA: 'true',
        LEGACY_AUTH_ENABLED: 'true',
        COGNITO_APP_PRIVATE_KEY_B64: Buffer.from(
          appKeys.privateKey.export({ format: 'pem', type: 'pkcs8' }),
        ).toString('base64'),
      });
      const mod = await Test.createTestingModule({ imports: [AuthModule] })
        .overrideProvider(AuditDbService)
        .useValue({})
        .overrideProvider(AuditService)
        .useValue({ emitAuth: jest.fn().mockResolvedValue(undefined) })
        .overrideProvider(MailService)
        .useValue({})
        .compile();
      app = mod.createNestApplication({ logger: false });
      app.setGlobalPrefix('api');
      app.use(cookieParser());
      await app.init();

      await seedSecurityFixtureUsers({
        tenantId,
        roleId,
        adminUserId,
        adminSub,
        superAdminRoleId,
        superAdminId,
        superAdminSub,
      });
    });

    afterAll(async () => {
      process.env.LEGACY_AUTH_ENABLED = 'true';
      await prisma.cognitoSession.deleteMany({
        where: { userId: { in: [adminUserId, superAdminId] } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [adminUserId, superAdminId] } },
      });
      await prisma.role.deleteMany({
        where: { id: { in: [roleId, superAdminRoleId] } },
      });
      await prisma.tenant.deleteMany({ where: { id: tenantId } });
      await app?.close();
      await provider?.close();
    });

    it('enforces region configurability, distinct SuperAdmin clients, and same-origin callbacks', () => {
      const euWest = loadCognitoConfig({
        ...process.env,
        COGNITO_USER_POOL_ID: 'eu-west-2_Custom01',
        COGNITO_REGION: 'eu-west-2',
      });
      expect(euWest?.region).toBe('eu-west-2');
      expect(() =>
        loadCognitoConfig({ ...process.env, COGNITO_REGION: 'eu-west-2' }),
      ).toThrow('Invalid COGNITO_REGION.');
      expect(() =>
        loadCognitoConfig({
          ...process.env,
          COGNITO_SUPERADMIN_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
        }),
      ).toThrow(/COGNITO_SUPERADMIN_CLIENT_ID/);
      expect(() =>
        loadCognitoConfig({
          ...process.env,
          COGNITO_SUPERADMIN_CLIENT_SECRET: process.env.COGNITO_CLIENT_SECRET,
        }),
      ).toThrow(/COGNITO_SUPERADMIN_CLIENT_SECRET/);
      expect(() =>
        loadCognitoConfig({
          ...process.env,
          COGNITO_SUPERADMIN_CLIENT_ID: undefined,
        }),
      ).toThrow(/SuperAdmin Cognito requires dedicated/);
      expect(() =>
        loadCognitoConfig({
          ...process.env,
          NODE_ENV: 'production',
          COOKIE_HOST_ONLY: 'true',
          COOKIE_DOMAIN: '.cantracare.com',
          COGNITO_TEST_ISSUER: undefined,
          COGNITO_MANAGED_LOGIN_URL: 'https://auth-demo.cantracare.com',
          COGNITO_CALLBACK_URL:
            'https://api-demo.cantracare.com/api/auth/cognito/callback',
          COGNITO_SIGN_OUT_URL: 'https://demo.cantracare.com/login',
        }),
      ).toThrow(/share the application cookie scope/);
    });

    it('rejects api-demo host and cross-app queries in resolveAppForRequest and HTTP start', async () => {
      const prodLike = loadCognitoConfig({
        ...process.env,
        NODE_ENV: 'production',
        COGNITO_TEST_ISSUER: undefined,
        COGNITO_MANAGED_LOGIN_URL: 'https://auth-demo.cantracare.com',
        COGNITO_CALLBACK_URL:
          'https://demo.cantracare.com/api/auth/cognito/callback',
        COGNITO_SIGN_OUT_URL: 'https://demo.cantracare.com/login',
        COGNITO_SUPERADMIN_CALLBACK_URL:
          'https://admin-demo.cantracare.com/api/auth/cognito/callback',
        COGNITO_SUPERADMIN_SIGN_OUT_URL:
          'https://admin-demo.cantracare.com/login',
      })!;
      expect(() =>
        resolveAppForRequest(prodLike, {
          get: (h) =>
            h.toLowerCase() === 'host'
              ? 'api-demo.cantracare.com'
              : h.toLowerCase() === 'x-forwarded-host'
                ? 'demo.cantracare.com'
                : undefined,
          query: {},
        }),
      ).toThrow(ForbiddenException);

      await request(app.getHttpServer())
        .get('/api/auth/cognito/start')
        .set('Host', 'api-demo.cantracare.com')
        .expect(403);
      await request(app.getHttpServer())
        .get('/api/auth/cognito/start?app=superadmin')
        .set('Host', 'web.cantracare.test')
        .expect(403);
      await request(app.getHttpServer())
        .get('/api/auth/cognito/start?app=web')
        .set('Host', 'admin.cantracare.test')
        .expect(403);
    });

    it('isolates Web and SuperAdmin confidential clients and rejects cross-app session use', async () => {
      const saDone = await signInViaMockProvider(
        app,
        'admin.cantracare.test',
        '/api/auth/cognito/start?app=superadmin',
      );
      expect(saDone.headers.location).toBe(
        `${adminOrigin}/login?cognito=complete`,
      );
      const saRefresh = pickCookie(saDone, 'refresh_token');

      await request(app.getHttpServer())
        .post('/api/auth/me')
        .set('Host', 'web.cantracare.test')
        .set('Cookie', pickCookie(saDone, 'access_token'))
        .expect(403);
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Host', 'web.cantracare.test')
        .set('Origin', webOrigin)
        .set('Cookie', saRefresh)
        .expect(403);
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Host', 'web.cantracare.test')
        .set('Origin', webOrigin)
        .set('Cookie', saRefresh)
        .expect(403);

      const saRefreshed = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Host', 'admin.cantracare.test')
        .set('Origin', adminOrigin)
        .set('Cookie', saRefresh)
        .expect(201);
      expect(provider.usedClients).toContain('token:admin-client');
      expect(provider.usedClients).toContain('refresh:admin-client');

      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Host', 'admin.cantracare.test')
        .set('Origin', adminOrigin)
        .set('Cookie', pickCookie(saRefreshed, 'refresh_token'))
        .expect(201);
    });

    it('prevents RS256->HS256 downgrade, skips forged duplicates, enforces CSRF and live MFA', async () => {
      const jwt = new JwtService();
      const webDone = await signInViaMockProvider(app, 'web.cantracare.test');
      const validRs256 = pickCookie(webDone, 'access_token');
      const forgedKey = generateKeyPairSync('rsa', {
        modulusLength: 2048,
      }).privateKey;
      const forgedRs256 = `access_token=${jwt.sign(
        { sub: adminUserId, sid: randomUUID() },
        {
          privateKey: forgedKey,
          algorithm: 'RS256',
          issuer: COGNITO_APP_ISSUER,
          audience: COGNITO_APP_AUDIENCE,
          expiresIn: 300,
        },
      )}`;
      const expiredRs256 = `access_token=${jwt.sign(
        { sub: adminUserId, sid: randomUUID() },
        {
          privateKey: appKeys.privateKey,
          algorithm: 'RS256',
          issuer: COGNITO_APP_ISSUER,
          audience: COGNITO_APP_AUDIENCE,
          expiresIn: -60,
        },
      )}`;
      const validLegacyHs256 = `access_token=${jwt.sign(
        {
          sub: adminUserId,
          tenantId,
          roleName: 'Admin',
          email: 'sec-admin@example.invalid',
          mfaVerified: true,
        },
        { secret: process.env.JWT_SECRET, algorithm: 'HS256', expiresIn: 300 },
      )}`;

      await request(app.getHttpServer())
        .post('/api/auth/me')
        .set('Cookie', [validLegacyHs256, expiredRs256])
        .expect(401);
      await request(app.getHttpServer())
        .post('/api/auth/me')
        .set('Cookie', [validRs256, forgedRs256])
        .expect(201);

      const me = await request(app.getHttpServer())
        .post('/api/auth/me')
        .set('Cookie', [validLegacyHs256])
        .expect(201);
      expect(me.body.mfaVerified).toBe(false);
      expect(me.body.mfaSetupRequired).toBe(true);

      await request(app.getHttpServer())
        .post('/api/auth/mfa/generate')
        .set('Origin', 'https://evil.example')
        .set('Cookie', [validLegacyHs256])
        .expect(403);
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Sec-Fetch-Site', 'cross-site')
        .set('Cookie', ['refresh_token=legacy.rt.1'])
        .expect(403);

      process.env.LEGACY_AUTH_ENABLED = 'false';
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Origin', webOrigin)
        .set('Cookie', ['refresh_token=legacy.rt.1'])
        .expect(401);
    });
  },
);
