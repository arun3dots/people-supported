import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getActiveCookieDomain } from '../auth-cookie.util';

export const COGNITO_CALLBACK_PATH = '/api/auth/cognito/callback';

export type CognitoAppKey = 'web' | 'superadmin';

export interface CognitoAppTarget {
  app: CognitoAppKey;
  redirectUri: string;
  signOutUri: string;
  origin: string;
  callbackHost: string;
  callbackHostname: string;
  webHost: string;
  webHostname: string;
  secure: boolean;
  clientId: string;
  clientSecret: string;
}

export interface CognitoTargetMap {
  apps: {
    web: CognitoAppTarget;
    superadmin?: CognitoAppTarget;
  };
}

export function readCognitoSetting(
  env: NodeJS.ProcessEnv,
  name: string,
  pattern: RegExp,
): string {
  const value = env[name];
  if (!value || !pattern.test(value)) throw new Error(`Invalid ${name}.`);
  return value;
}

export function parseCognitoEndpoint(
  env: NodeJS.ProcessEnv,
  name: string,
  path: string,
): URL {
  const value = readCognitoSetting(env, name, /^\S{1,1024}$/);
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid ${name}.`);
  }
  const host = url.hostname.toLowerCase();
  const local =
    url.protocol === 'http:' &&
    env.NODE_ENV !== 'production' &&
    (['localhost', '127.0.0.1', '[::1]'].includes(host) ||
      host.endsWith('.cantracare.test') ||
      host.endsWith('.localhost'));
  if (
    (url.protocol !== 'https:' && !local) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== path
  ) {
    throw new Error(`Invalid ${name}.`);
  }
  return url;
}

export function buildCognitoAppTarget(
  env: NodeJS.ProcessEnv,
  app: CognitoAppKey,
  callbackEnv: string,
  signOutEnv: string,
  client: { clientId: string; clientSecret: string },
): CognitoAppTarget {
  const redirect = parseCognitoEndpoint(
    env,
    callbackEnv,
    COGNITO_CALLBACK_PATH,
  );
  const web = parseCognitoEndpoint(env, signOutEnv, '/login');
  const activeDomain = getActiveCookieDomain(env);
  if (
    redirect.protocol !== web.protocol ||
    (redirect.hostname !== web.hostname && !activeDomain)
  ) {
    throw new Error(
      'Cognito callback and web must share the application cookie scope.',
    );
  }
  if (activeDomain) {
    const domain = activeDomain.replace(/^\./, '').toLowerCase();
    if (
      !domain.includes('.') ||
      ![redirect, web].every(
        ({ hostname }) =>
          hostname === domain || hostname.endsWith(`.${domain}`),
      )
    ) {
      throw new Error('Invalid COOKIE_DOMAIN for Cognito callback and web.');
    }
  }
  return {
    app,
    redirectUri: redirect.href,
    signOutUri: web.href,
    origin: web.origin,
    callbackHost: redirect.host.toLowerCase(),
    callbackHostname: redirect.hostname.toLowerCase(),
    webHost: web.host.toLowerCase(),
    webHostname: web.hostname.toLowerCase(),
    secure: redirect.protocol === 'https:',
    clientId: client.clientId,
    clientSecret: client.clientSecret,
  };
}

export function isLoopbackHost(rawHost: string): boolean {
  const hostname = rawHost.replace(/:\d+$/, '');
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.localhost')
  );
}

function resolveIncomingHost(req: {
  get(name: string): string | undefined;
}): string | undefined {
  const host = req.get('host')?.split(',')[0]?.trim().toLowerCase();
  if (host && !isLoopbackHost(host)) return host;
  const forwarded = req
    .get('x-forwarded-host')
    ?.split(',')[0]
    ?.trim()
    .toLowerCase();
  return forwarded || host;
}

function matchesTargetHost(rawHost: string, target: CognitoAppTarget): boolean {
  const hostname = rawHost.replace(/:\d+$/, '');
  return (
    rawHost === target.callbackHost ||
    rawHost === target.webHost ||
    hostname === target.callbackHostname ||
    hostname === target.webHostname
  );
}

export function resolveAppForRequest(
  settings: CognitoTargetMap,
  req: {
    get(name: string): string | undefined;
    query?: Record<string, unknown>;
  },
): CognitoAppTarget {
  const queryApp = req.query?.app;
  if (
    queryApp !== undefined &&
    queryApp !== 'web' &&
    queryApp !== 'superadmin'
  ) {
    throw new BadRequestException('Invalid Cognito application target.');
  }
  if (queryApp === 'superadmin' && !settings.apps.superadmin) {
    throw new NotFoundException();
  }

  const incomingHost = resolveIncomingHost(req);
  const superAdmin = settings.apps.superadmin;
  if (incomingHost) {
    const matchesWeb = matchesTargetHost(incomingHost, settings.apps.web);
    const matchesSuperAdmin = superAdmin
      ? matchesTargetHost(incomingHost, superAdmin)
      : false;
    if (!matchesWeb && !matchesSuperAdmin) {
      throw new ForbiddenException(
        'Cognito request host is not an allowed application origin.',
      );
    }
    if (queryApp === 'web' && !matchesWeb) {
      throw new ForbiddenException(
        'Cognito application target does not match request host.',
      );
    }
    if (queryApp === 'superadmin' && !matchesSuperAdmin) {
      throw new ForbiddenException(
        'Cognito application target does not match request host.',
      );
    }
    if (!queryApp && superAdmin) {
      if (matchesSuperAdmin && !matchesWeb) return superAdmin;
      if (
        matchesWeb &&
        matchesSuperAdmin &&
        (incomingHost === superAdmin.callbackHost ||
          incomingHost === superAdmin.webHost)
      ) {
        return superAdmin;
      }
    }
  }

  if (queryApp === 'superadmin' && superAdmin) return superAdmin;
  return settings.apps.web;
}

export function resolveAppForOrigin(
  settings: CognitoTargetMap,
  origin: string | undefined,
): CognitoAppTarget | null {
  if (!origin) return null;
  const targets: Array<CognitoAppTarget | undefined> = [
    settings.apps.web,
    settings.apps.superadmin,
  ];
  return targets.find((t) => t && t.origin === origin) ?? null;
}
