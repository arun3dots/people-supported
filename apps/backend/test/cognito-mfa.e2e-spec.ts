import { type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { prisma } from '@repo/db';
import {
  COGNITO_APP_AUDIENCE,
  COGNITO_APP_ISSUER,
  EMPTY_ROLE_PERMISSIONS,
} from '@repo/schema';
import cookieParser from 'cookie-parser';
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import request from 'supertest';
import { AuditDbService } from '../src/audit/audit-db.service';
import { AuditService } from '../src/audit/audit.service';
import { AuthModule } from '../src/auth/auth.module';
import { CognitoConfig } from '../src/auth/cognito/cognito-config';
import { sealCredentials } from '../src/auth/cognito/cognito-credentials.util';
import { MailService } from '../src/common/mail/mail.service';
import {
  type MfaTestMode,
  pickCookie,
  signInViaMockProvider,
  startDualClientProvider,
} from './cognito-dual-provider.fixture';

const webOrigin = 'http://web.cantracare.test';
const adminOrigin = 'http://admin.cantracare.test';
const tenantId = randomUUID();
const roleId = randomUUID();
const adminUserId = randomUUID();
const adminSub = '5ab45c10-91df-4208-88aa-2c910fe41b02';
const superAdminRoleId = randomUUID();
const superAdminId = randomUUID();
const superAdminSub = '4ab45c10-91df-4208-88aa-2c910fe41b01';

const describeFixture = process.env.COGNITO_DISPOSABLE_DB
  ? describe
  : describe.skip;

describeFixture(
  'Cognito MFA assurance enforcement (disposable PostgreSQL)',
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
        COGNITO_REQUIRE_AMR_MFA: 'true',
        COGNITO_USER_POOL_ID: 'eu-north-1_MfaFixture',
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

      await prisma.tenant.create({
        data: {
          id: tenantId,
          name: 'MFA Assurance Org',
          subdomain: `mfa-${tenantId.slice(0, 8)}`,
          status: 'Active',
          subscriptionStatus: 'active',
          enforceMfaForAllStaff: true,
        },
      });
      await prisma.role.create({
        data: {
          id: roleId,
          tenantId,
          name: 'Admin',
          permissions: EMPTY_ROLE_PERMISSIONS,
        },
      });
      await prisma.user.create({
        data: {
          id: adminUserId,
          tenantId,
          roleId,
          email: 'mfa-admin@example.invalid',
          passwordHash: 'x',
          fullName: 'MFA Admin',
          cognitoSub: adminSub,
          emailVerified: true,
          mfaEnabled: true,
          isActive: true,
        },
      });
      await prisma.role.create({
        data: {
          id: superAdminRoleId,
          tenantId: null,
          name: 'SuperAdmin',
          permissions: EMPTY_ROLE_PERMISSIONS,
        },
      });
      await prisma.user.create({
        data: {
          id: superAdminId,
          tenantId: null,
          roleId: superAdminRoleId,
          email: 'mfa-sa@example.invalid',
          passwordHash: 'x',
          fullName: 'MFA SuperAdmin',
          cognitoSub: superAdminSub,
          emailVerified: true,
          mfaEnabled: true,
          isActive: true,
        },
      });
    });

    beforeEach(() => {
      provider.setMfaMode('valid');
      provider.setAuthTimeOffsetSeconds(0);
      const settings = app.get(CognitoConfig).require();
      settings.requireAmrMfa = true;
    });

    afterAll(async () => {
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

    it.each<MfaTestMode>(['missing', 'pwd_only', 'sms_only', 'single_otp'])(
      'rejects %s MFA evidence on Web even when local user.mfaEnabled is true',
      async (mode) => {
        provider.setMfaMode(mode);
        const res = await signInViaMockProvider(app, 'web.cantracare.test');
        expect(res.headers.location).toBe(
          `${webOrigin}/login?cognito=failed&reason=mfa_failed`,
        );
        expect(JSON.stringify(res.headers['set-cookie'])).not.toContain(
          'access_token=',
        );
      },
    );

    it('rejects insufficient or missing MFA evidence for SuperAdmin even when COGNITO_REQUIRE_AMR_MFA=false', async () => {
      const settings = app.get(CognitoConfig).require();
      settings.requireAmrMfa = false;

      provider.setMfaMode('missing');
      const missingRes = await signInViaMockProvider(
        app,
        'admin.cantracare.test',
        '/api/auth/cognito/start?app=superadmin',
      );
      expect(missingRes.headers.location).toBe(
        `${adminOrigin}/login?cognito=failed&reason=mfa_failed`,
      );

      provider.setMfaMode('sms_only');
      const smsRes = await signInViaMockProvider(
        app,
        'admin.cantracare.test',
        '/api/auth/cognito/start?app=superadmin',
      );
      expect(smsRes.headers.location).toBe(
        `${adminOrigin}/login?cognito=failed&reason=mfa_failed`,
      );
    });

    it('rejects RS256 sessions with false DB mfaVerified or missing mfaVerified claim', async () => {
      const loginRes = await signInViaMockProvider(app, 'web.cantracare.test');
      const access = pickCookie(loginRes, 'access_token');
      const jwt = new JwtService();
      const session = await prisma.cognitoSession.findFirstOrThrow({
        where: { userId: adminUserId, revokedAt: null },
        orderBy: { authenticatedAt: 'desc' },
      });

      const missingClaimJwt = `access_token=${jwt.sign(
        { sid: session.id, app: 'web' },
        {
          privateKey: appKeys.privateKey,
          algorithm: 'RS256',
          issuer: COGNITO_APP_ISSUER,
          audience: COGNITO_APP_AUDIENCE,
          subject: adminUserId,
          expiresIn: 300,
        },
      )}`;
      await request(app.getHttpServer())
        .post('/api/auth/me')
        .set('Cookie', [missingClaimJwt])
        .expect(401);

      await prisma.cognitoSession.update({
        where: { id: session.id },
        data: {
          sealedCredentials: sealCredentials({
            browserRefresh: 'slc1.' + session.id + '.a'.repeat(43),
            providerRefresh: 'rt-1',
            app: 'web',
            mfaVerified: false,
          }),
        },
      });
      await request(app.getHttpServer())
        .post('/api/auth/me')
        .set('Cookie', [access])
        .expect(401);
    });

    it('completes Web and SuperAdmin login with valid TOTP MFA and enforces MFA across refresh and silent SSO', async () => {
      const saDone = await signInViaMockProvider(
        app,
        'admin.cantracare.test',
        '/api/auth/cognito/start?app=superadmin',
      );
      expect(saDone.headers.location).toBe(
        `${adminOrigin}/login?cognito=complete`,
      );
      const saMe = await request(app.getHttpServer())
        .post('/api/auth/me')
        .set('Cookie', [pickCookie(saDone, 'access_token')])
        .expect(201);
      expect(saMe.body).toMatchObject({
        userId: superAdminId,
        roleName: 'SuperAdmin',
        mfaVerified: true,
      });

      const webDone = await signInViaMockProvider(app, 'web.cantracare.test');
      const webRefresh = pickCookie(webDone, 'refresh_token');
      const refreshed = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Host', 'web.cantracare.test')
        .set('Origin', webOrigin)
        .set('Cookie', [webRefresh])
        .expect(201);
      expect(refreshed.body).toEqual({ success: true });

      provider.setMfaMode('refresh_drop_mfa');
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Host', 'web.cantracare.test')
        .set('Origin', webOrigin)
        .set('Cookie', [pickCookie(refreshed, 'refresh_token')])
        .expect(401);

      provider.setMfaMode('silent_sso_valid');
      provider.setAuthTimeOffsetSeconds(300);
      const silentOk = await signInViaMockProvider(app, 'web.cantracare.test');
      expect(silentOk.headers.location).toBe(
        `${webOrigin}/login?cognito=complete`,
      );

      provider.setMfaMode('silent_sso_missing');
      const silentFail = await signInViaMockProvider(
        app,
        'web.cantracare.test',
      );
      expect(silentFail.headers.location).toBe(
        `${webOrigin}/login?cognito=failed&reason=mfa_failed`,
      );
    });
  },
);
