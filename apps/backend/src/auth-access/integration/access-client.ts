import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  accessConsoleSchema,
  accessDecisionSchema,
  accessServiceTokenSchema,
  accessSlugSchema,
  accessStaffResultSchema,
  EMPTY_ROLE_PERMISSIONS,
  z,
  type AccessActor,
  type AccessDecision,
  type AccessMemberUpdate,
  type AccessRoleCreate,
  type AccessRoleUpdate,
  type CompleteAccessStaff,
} from '@repo/schema';
import type { AuthenticatedUser } from '../../common/interfaces/request.interface';

const tenantSchema = z.array(z.string().uuid()).nonempty();

export function loadAccessClientConfig(env: NodeJS.ProcessEnv) {
  if (!env.AUTH_ACCESS_TENANT_IDS?.trim()) return undefined;
  if (env.COGNITO_AUTH_ENABLED !== 'true') {
    throw new Error(
      'Auth & Access enrollment requires Cognito authentication.',
    );
  }
  const input = z
    .object({
      url: z.string().url(),
      token: accessServiceTokenSchema,
      product: accessSlugSchema,
      tenants: tenantSchema,
    })
    .safeParse({
      url: env.AUTH_ACCESS_URL,
      token: env.AUTH_ACCESS_SERVICE_TOKEN,
      product: env.AUTH_ACCESS_PRODUCT ?? 'supported-living',
      tenants: env.AUTH_ACCESS_TENANT_IDS.split(',').map((id) =>
        id.trim().toLowerCase(),
      ),
    });
  if (!input.success)
    throw new Error('Invalid Auth & Access client configuration.');
  const url = new URL(input.data.url);
  const local =
    env.NODE_ENV !== 'production' &&
    ['127.0.0.1', '[::1]'].includes(url.hostname);
  if (
    (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  ) {
    throw new Error('Auth & Access requires a dedicated HTTPS origin.');
  }
  return {
    origin: url.origin,
    token: input.data.token,
    product: input.data.product,
    tenants: new Set<string>(input.data.tenants),
  };
}

@Injectable()
export class AccessClient {
  private readonly config = loadAccessClientConfig(process.env);
  private readonly requests = new WeakMap<
    AuthenticatedUser,
    { actor: AccessActor; decision: AccessDecision }
  >();

  enrolled(tenantId?: string): tenantId is string {
    return Boolean(tenantId && this.config?.tenants.has(tenantId));
  }

  async check(
    user: AuthenticatedUser,
    identity: { issuer: string; subject: string; authenticatedAt: Date },
  ) {
    if (!this.enrolled(user.tenantId)) return;
    const actor: AccessActor = {
      issuer: identity.issuer,
      subject: identity.subject,
      tenantId: user.tenantId,
      authenticatedAt: identity.authenticatedAt.toISOString(),
    };
    const decision = await this.request('check', actor, accessDecisionSchema);
    this.requests.set(user, { actor, decision });
    if (this.config?.product === 'supported-living') {
      const has = (action: string) =>
        decision.permissions.includes(`riskAssessments.${action}`);
      user.permissions = {
        ...(user.permissions ?? EMPTY_ROLE_PERMISSIONS),
        riskAssessments: {
          read: has('read'),
          write: has('write'),
          delete: has('delete'),
          approve: has('approve'),
          manageTemplates: has('manageTemplates'),
        },
      };
    }
  }

  async recheck(
    user: AuthenticatedUser,
    identity: { issuer: string; subject: string; authenticatedAt: Date },
  ) {
    try {
      await this.check(user, identity);
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) return false;
      throw error;
    }
  }

  allows(user: AuthenticatedUser, required: string[]) {
    const context = this.requests.get(user);
    return Boolean(
      context &&
      required.every((p) => context.decision.permissions.includes(p)),
    );
  }

  console(user: AuthenticatedUser) {
    return this.request('console', this.actor(user), accessConsoleSchema);
  }

  assertStaffAdmin(user: AuthenticatedUser, tenantId: string) {
    const actor = this.actor(user);
    if (actor.tenantId !== tenantId)
      throw new ForbiddenException('Staff enrollment tenant mismatch.');
    return actor;
  }

  reserveStaff(
    user: AuthenticatedUser,
    tenantId: string,
    productUserId: string,
    roleKey: string,
  ) {
    return this.request(
      'staff/reserve',
      { actor: this.assertStaffAdmin(user, tenantId), productUserId, roleKey },
      accessStaffResultSchema,
    );
  }

  completeStaff(input: CompleteAccessStaff) {
    return this.request('staff/complete', input, accessStaffResultSchema);
  }

  createRole(user: AuthenticatedUser, role: AccessRoleCreate) {
    return this.request(
      'roles',
      { actor: this.actor(user), role },
      accessConsoleSchema,
    );
  }

  updateRole(user: AuthenticatedUser, key: string, role: AccessRoleUpdate) {
    return this.request(
      `roles/${encodeURIComponent(key)}`,
      { actor: this.actor(user), role },
      accessConsoleSchema,
    );
  }

  updateMembership(
    user: AuthenticatedUser,
    id: string,
    membership: AccessMemberUpdate,
  ) {
    return this.request(
      `members/${encodeURIComponent(id)}`,
      { actor: this.actor(user), membership },
      accessConsoleSchema,
    );
  }

  private actor(user: AuthenticatedUser) {
    const context = this.requests.get(user);
    if (!context?.decision.canManage || !user.mfaVerified) {
      throw new ForbiddenException(
        'Access administration permission required.',
      );
    }
    return context.actor;
  }

  private async request<T>(
    path: string,
    payload: object,
    schema: z.ZodType<T>,
  ): Promise<T> {
    const config = this.config;
    if (!config) throw new UnauthorizedException();
    try {
      const response = await fetch(
        `${config.origin}/internal/access/${config.product}/${path}`,
        {
          method: 'POST',
          redirect: 'error',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.token}`,
          },
          signal: AbortSignal.timeout(2_000),
          body: JSON.stringify(payload),
        },
      );
      if (response.status === 403) {
        throw new ForbiddenException('Central access denied.');
      }
      if (response.status === 404) {
        throw new NotFoundException('Access record unavailable.');
      }
      if (response.status === 409) {
        throw new AccessConflictException();
      }
      if (!response.ok) throw new Error('Unexpected access response.');
      return schema.parse(await response.json());
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException ||
        error instanceof AccessConflictException
      )
        throw error;
      throw new ServiceUnavailableException(
        'Access policy is temporarily unavailable.',
      );
    }
  }
}

class AccessConflictException extends ConflictException {
  constructor() {
    super('Access policy changed. Reload the console and retry.');
  }
}
