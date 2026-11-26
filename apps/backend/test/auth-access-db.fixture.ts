import { prisma } from '@repo/db';
import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  EMPTY_ROLE_PERMISSIONS,
  supportedLivingAccessCatalog,
} from '@repo/schema';
import { execFile, spawn } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { mkdtemp, rm, rmdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { promisify } from 'node:util';
import type request from 'supertest';
import {
  newRoleId,
  seedCognitoFixture,
  tenantId,
  userId,
} from './cognito-db.fixture';
import { Permissions } from '../src/common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../src/common/guards/permissions.guard';

@Controller('permission-fixture')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionFixtureController {
  @Get()
  @Permissions('riskAssessments.read')
  read() {
    return { allowed: true };
  }
}

export const productKey = 'supported-living';
export const secondProduct = 'care-home';
export const secondToken = randomBytes(32).toString('base64url');
export const subject = randomUUID();
export const email = 'access-admin@example.invalid';
export const memberId = randomUUID();
export const memberSubject = randomUUID();
export const newStaffRoleId = randomUUID();
const run = promisify(execFile);
const authApp = resolve(__dirname, '../../auth-access');

export function findCookie(response: request.Response, name: string) {
  const cookies: unknown = response.headers['set-cookie'];
  if (!Array.isArray(cookies)) throw new Error('Missing fixture cookies.');
  const cookie = cookies.find(
    (item: unknown): item is string =>
      typeof item === 'string' && item.startsWith(`${name}=`),
  );
  if (!cookie) throw new Error(`Missing ${name} cookie.`);
  return cookie.split(';')[0];
}

export async function seedAccessFixture(issuer: string) {
  await seedCognitoFixture({ subject, email, subdomain: 'access-fixture' });
  const adminRoleId = randomUUID();
  await prisma.role.createMany({
    data: [
      {
        id: adminRoleId,
        name: 'Admin',
        isSystem: true,
        permissions: EMPTY_ROLE_PERMISSIONS,
      },
      {
        id: newStaffRoleId,
        name: 'Carer',
        isSystem: true,
        permissions: EMPTY_ROLE_PERMISSIONS,
      },
    ],
  });
  await prisma.user.update({
    where: { id: userId, tenantId },
    data: { roleId: adminRoleId },
  });
  await prisma.user.create({
    data: {
      id: memberId,
      tenantId,
      cognitoSub: memberSubject,
      roleId: newRoleId,
      email: 'member@example.invalid',
      fullName: 'Test member',
      passwordHash: 'fixture',
      emailVerified: true,
    },
  });
  const temp = await mkdtemp(join(tmpdir(), 'cantra-access-enrollment-'));
  const path = join(temp, 'enrollment.json');
  async function enroll(config: unknown) {
    await writeFile(path, JSON.stringify(config), { mode: 0o600 });
    await run(process.execPath, ['dist/bootstrap.js', path], {
      cwd: authApp,
      timeout: 10_000,
    });
  }
  try {
    await enroll({
      product: productKey,
      tenantId,
      issuer,
      permissions: [...supportedLivingAccessCatalog],
      roles: [
        {
          key: 'operator',
          name: 'Operator',
          permissions: ['riskAssessments.read', 'riskAssessments.write'],
        },
        {
          key: 'member',
          name: 'Member',
          permissions: ['riskAssessments.read'],
        },
        { key: 'carer', name: 'Carer', permissions: ['riskAssessments.read'] },
        {
          key: 'approver',
          name: 'Approver',
          permissions: ['riskAssessments.approve'],
        },
      ],
      users: [
        { subject, name: 'Operator', roleKey: 'operator', canManage: true },
        { subject: memberSubject, name: 'Member', roleKey: 'member' },
      ],
    });
    await enroll({
      product: secondProduct,
      tenantId,
      issuer,
      permissions: ['medication.read'],
      roles: [
        { key: 'nurse', name: 'Nurse', permissions: ['medication.read'] },
      ],
      users: [
        { subject, roleKey: 'nurse', canManage: true },
        { subject: memberSubject, roleKey: 'nurse' },
      ],
    });
  } finally {
    await rm(path, { force: true });
    await rmdir(temp);
  }
}

export function assertDisposableAccessDatabases() {
  for (const [value, database] of [
    [process.env.DATABASE_URL, '/postgres'],
    [process.env.AUTH_ACCESS_DATABASE_URL, '/access_fixture'],
  ] as const) {
    const url = new URL(value ?? '');
    if (
      url.protocol !== 'postgresql:' ||
      url.hostname !== '127.0.0.1' ||
      url.host !== process.env.COGNITO_DISPOSABLE_DB ||
      url.username !== 'cognito_fixture' ||
      url.pathname !== database ||
      url.search ||
      url.hash
    ) {
      throw new Error('Use the isolated verify:auth-access runner.');
    }
  }
}

export function queryAccessFixture(sql: string) {
  const url = new URL(process.env.AUTH_ACCESS_DATABASE_URL ?? '');
  if (
    url.protocol !== 'postgresql:' ||
    url.hostname !== '127.0.0.1' ||
    url.host !== process.env.COGNITO_DISPOSABLE_DB ||
    url.username !== 'cognito_fixture' ||
    url.pathname !== '/access_fixture' ||
    url.search ||
    url.hash
  ) {
    throw new Error('Use the isolated verify:auth-access runner.');
  }
  return run('psql', ['-XAt', '-v', 'ON_ERROR_STOP=1', '-c', sql], {
    env: {
      ...process.env,
      PGHOST: url.hostname,
      PGPORT: url.port,
      PGUSER: url.username,
      PGPASSWORD: decodeURIComponent(url.password),
      PGDATABASE: 'access_fixture',
    },
    timeout: 5_000,
  });
}

async function localPort() {
  const socket = createServer();
  const listening = once(socket, 'listening');
  socket.listen(0, '127.0.0.1');
  await listening;
  const address = socket.address();
  await new Promise<void>((resolve, reject) => {
    socket.close((error) => (error ? reject(error) : resolve()));
  });
  if (!address || typeof address === 'string')
    throw new Error('Missing fixture port.');
  return address.port;
}

export async function startAccessFixture(tokens: Record<string, string>) {
  const port = await localPort();
  const origin = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ['dist/main.js'], {
    cwd: authApp,
    env: {
      ...process.env,
      AUTH_ACCESS_PORT: String(port),
      AUTH_ACCESS_SERVICE_TOKENS_JSON: JSON.stringify(tokens),
    },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  let failed = false;
  child.on('error', () => {
    failed = true;
  });
  async function stop() {
    if (!child.pid || child.exitCode !== null || child.signalCode !== null)
      return;
    const exited = once(child, 'exit');
    child.kill();
    await exited;
  }
  try {
    for (
      let attempt = 0;
      attempt < 100 && !failed && child.exitCode === null;
      attempt++
    ) {
      const response = await fetch(
        `${origin}/internal/access/${productKey}/check`,
        {
          method: 'POST',
          signal: AbortSignal.timeout(1_000),
        },
      ).catch(() => undefined);
      await response?.body?.cancel();
      if (response?.status === 401) return { origin, stop };
      await delay(50);
    }
    throw new Error('The standalone Auth & Access fixture did not start.');
  } catch (error) {
    await stop();
    throw error;
  }
}
