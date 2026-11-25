import { Injectable, Module, NotFoundException } from '@nestjs/common';
import { createPrivateKey, createPublicKey } from 'node:crypto';
import { parseRequiredAcrValues } from './cognito-mfa.util';
import {
  COGNITO_CALLBACK_PATH,
  buildCognitoAppTarget,
  isLoopbackHost,
  parseCognitoEndpoint,
  readCognitoSetting,
  resolveAppForOrigin,
  resolveAppForRequest,
  type CognitoAppKey,
  type CognitoAppTarget,
} from './cognito-targets.util';

export { COGNITO_APP_ISSUER, COGNITO_APP_AUDIENCE } from '@repo/schema';
export {
  COGNITO_CALLBACK_PATH,
  isLoopbackHost,
  resolveAppForOrigin,
  resolveAppForRequest,
  type CognitoAppKey,
  type CognitoAppTarget,
};

export function loadCognitoConfig(env: NodeJS.ProcessEnv) {
  if (
    env.COGNITO_AUTH_ENABLED === undefined ||
    env.COGNITO_AUTH_ENABLED === 'false'
  ) {
    return null;
  }
  readCognitoSetting(env, 'COGNITO_AUTH_ENABLED', /^true$/);
  readCognitoSetting(env, 'COGNITO_MFA_POLICY', /^required$/);
  if (
    env.COGNITO_REQUIRE_AMR_MFA !== undefined &&
    env.COGNITO_REQUIRE_AMR_MFA !== 'true' &&
    env.COGNITO_REQUIRE_AMR_MFA !== 'false'
  ) {
    throw new Error('Invalid COGNITO_REQUIRE_AMR_MFA.');
  }

  const pool = readCognitoSetting(
    env,
    'COGNITO_USER_POOL_ID',
    /^[a-z]{2}(?:-[a-z0-9]+)+-\d_[a-zA-Z0-9]+$/,
  );
  const region = pool.split('_')[0];
  if (env.COGNITO_REGION && env.COGNITO_REGION !== region) {
    throw new Error('Invalid COGNITO_REGION.');
  }
  const managed = parseCognitoEndpoint(env, 'COGNITO_MANAGED_LOGIN_URL', '/');
  let issuer = `https://cognito-idp.${region}.amazonaws.com/${pool}`;
  if (env.COGNITO_TEST_ISSUER !== undefined) {
    if (env.NODE_ENV !== 'test' || managed.protocol !== 'http:') {
      throw new Error('Invalid COGNITO_TEST_ISSUER.');
    }
    const fixtureIssuer = parseCognitoEndpoint(env, 'COGNITO_TEST_ISSUER', '/');
    if (fixtureIssuer.origin !== managed.origin) {
      throw new Error('Invalid COGNITO_TEST_ISSUER.');
    }
    issuer = fixtureIssuer.origin;
  } else if (managed.protocol !== 'https:') {
    throw new Error('Invalid COGNITO_MANAGED_LOGIN_URL.');
  }

  const clientId = readCognitoSetting(
    env,
    'COGNITO_CLIENT_ID',
    /^[a-zA-Z0-9_-]{1,128}$/,
  );
  const clientSecret = readCognitoSetting(
    env,
    'COGNITO_CLIENT_SECRET',
    /^[a-zA-Z0-9_+./=~-]{16,256}$/,
  );
  const hasSuperAdmin = Boolean(
    env.COGNITO_SUPERADMIN_AUTH_ENABLED === 'true' ||
    env.COGNITO_SUPERADMIN_CALLBACK_URL ||
    env.COGNITO_SUPERADMIN_SIGN_OUT_URL ||
    env.COGNITO_SUPERADMIN_CLIENT_ID ||
    env.COGNITO_SUPERADMIN_CLIENT_SECRET,
  );
  const webTarget = buildCognitoAppTarget(
    env,
    'web',
    'COGNITO_CALLBACK_URL',
    'COGNITO_SIGN_OUT_URL',
    { clientId, clientSecret },
  );
  let superAdminTarget: CognitoAppTarget | undefined;
  if (hasSuperAdmin) {
    if (
      !env.COGNITO_SUPERADMIN_CLIENT_ID ||
      !env.COGNITO_SUPERADMIN_CLIENT_SECRET ||
      !env.COGNITO_SUPERADMIN_CALLBACK_URL ||
      !env.COGNITO_SUPERADMIN_SIGN_OUT_URL
    ) {
      throw new Error(
        'SuperAdmin Cognito requires dedicated COGNITO_SUPERADMIN_CLIENT_ID, COGNITO_SUPERADMIN_CLIENT_SECRET, COGNITO_SUPERADMIN_CALLBACK_URL, and COGNITO_SUPERADMIN_SIGN_OUT_URL.',
      );
    }
    const superAdminClientId = readCognitoSetting(
      env,
      'COGNITO_SUPERADMIN_CLIENT_ID',
      /^[a-zA-Z0-9_-]{1,128}$/,
    );
    const superAdminClientSecret = readCognitoSetting(
      env,
      'COGNITO_SUPERADMIN_CLIENT_SECRET',
      /^[a-zA-Z0-9_+./=~-]{16,256}$/,
    );
    if (superAdminClientId === clientId) {
      throw new Error(
        'COGNITO_SUPERADMIN_CLIENT_ID must differ from COGNITO_CLIENT_ID.',
      );
    }
    if (superAdminClientSecret === clientSecret) {
      throw new Error(
        'COGNITO_SUPERADMIN_CLIENT_SECRET must differ from COGNITO_CLIENT_SECRET.',
      );
    }
    superAdminTarget = buildCognitoAppTarget(
      env,
      'superadmin',
      'COGNITO_SUPERADMIN_CALLBACK_URL',
      'COGNITO_SUPERADMIN_SIGN_OUT_URL',
      {
        clientId: superAdminClientId,
        clientSecret: superAdminClientSecret,
      },
    );
    if (superAdminTarget.origin === webTarget.origin) {
      throw new Error('SuperAdmin and Web Cognito origins must be distinct.');
    }
  }

  const pilotIds = readCognitoSetting(
    env,
    'COGNITO_PILOT_USER_IDS',
    /^[a-fA-F\d, -]{1,4096}$/,
  )
    .split(',')
    .map((id) => id.trim());
  if (
    pilotIds.some(
      (id) => !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id),
    )
  ) {
    throw new Error('Invalid COGNITO_PILOT_USER_IDS.');
  }

  const rawKey = readCognitoSetting(
    env,
    'COGNITO_APP_PRIVATE_KEY_B64',
    /^[a-zA-Z0-9+/=]{1,12000}$/,
  );
  try {
    const key = createPrivateKey(Buffer.from(rawKey, 'base64'));
    if (
      key.asymmetricKeyType !== 'rsa' ||
      (key.asymmetricKeyDetails?.modulusLength ?? 0) < 2048
    ) {
      throw new Error();
    }
    return {
      region,
      issuer,
      managedOrigin: managed.origin,
      redirectUri: webTarget.redirectUri,
      signOutUri: webTarget.signOutUri,
      webOrigin: webTarget.origin,
      secure: webTarget.secure,
      requireAmrMfa: env.COGNITO_REQUIRE_AMR_MFA !== 'false',
      requiredAcrValues: parseRequiredAcrValues(
        env.COGNITO_REQUIRED_ACR_VALUES,
      ),
      apps: {
        web: webTarget,
        superadmin: superAdminTarget,
      },
      clientId,
      clientSecret,
      pilotIds: new Set(pilotIds),
      privateKey: key.export({ type: 'pkcs8', format: 'pem' }).toString(),
      publicKey: createPublicKey(key)
        .export({ type: 'spki', format: 'pem' })
        .toString(),
    };
  } catch {
    throw new Error('Invalid COGNITO_APP_PRIVATE_KEY_B64.');
  }
}

export type CognitoSettings = NonNullable<ReturnType<typeof loadCognitoConfig>>;

@Injectable()
export class CognitoConfig {
  readonly settings = loadCognitoConfig(process.env);

  require() {
    if (!this.settings) throw new NotFoundException();
    return this.settings;
  }

  resolveApp(req: {
    get(name: string): string | undefined;
    query?: Record<string, unknown>;
  }): CognitoAppTarget {
    return resolveAppForRequest(this.require(), req);
  }

  resolveOrigin(origin: string | undefined): CognitoAppTarget | null {
    return resolveAppForOrigin(this.require(), origin);
  }
}

@Module({ providers: [CognitoConfig], exports: [CognitoConfig] })
export class CognitoConfigModule {}
