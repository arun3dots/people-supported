import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { prisma } from '@repo/db';
import type {
  CreateManagedAccountDTO,
  ManagedAccountActionDTO,
  ManagedAccountDirectoryDTO,
} from '@repo/schema';
import { AuditService } from '../../../audit/audit.service';
import { MailService } from '../../../common/mail/mail.service';
import type { AuthenticatedUser } from '../../../common/interfaces/request.interface';
import {
  assertManagedAccountAuthority,
  readManagedAccountAuthority,
} from './managed-account-policy';
import {
  managedAccountSelection,
  reserveManagedAccount,
  toManagedAccountStatus,
} from './managed-account-reservation';
import {
  sendManagedAccountVerification,
  verifyManagedAccountMailbox,
} from './managed-account-verification';
import { ManagedCognitoDirectory } from './managed-cognito-directory';
import { AccessClient } from '../../../auth-access/integration/access-client';
import {
  linkManagedIdentity,
  sendManagedInvitation,
  updateManagedAccess,
} from './managed-account-lifecycle';

@Injectable()
export class ManagedAccountsService {
  constructor(
    private readonly directory: ManagedCognitoDirectory,
    private readonly mail: MailService,
    private readonly audit: AuditService,
    @Optional() private readonly access?: AccessClient,
  ) {}

  async list(
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<ManagedAccountDirectoryDTO> {
    const { poolId } = this.directory.requireSettings();
    const { branchIds, roleNames } = await readManagedAccountAuthority(
      prisma,
      actor,
      tenantId,
    );
    const [roles, branches] = await Promise.all([
      prisma.role.findMany({
        where: {
          isSystem: true,
          tenantId: null,
          deletedAt: null,
          name: { in: roleNames },
        },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.branch.findMany({
        where: {
          tenantId,
          status: 'Active',
          deletedAt: null,
          tenant: { status: 'Active', deletedAt: null },
          ...(branchIds ? { id: { in: branchIds } } : {}),
        },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);
    const available = branches.map(({ id }) => id);
    const records = await prisma.cognitoProvisioning.findMany({
      where: {
        poolId,
        user: {
          tenantId,
          authMode: 'Cognito',
          deletedAt: null,
          roleId: { in: roles.map(({ id }) => id) },
          branches: {
            some: { branchId: { in: available } },
            every: { branchId: { in: available } },
          },
        },
      },
      select: managedAccountSelection,
      orderBy: { user: { fullName: 'asc' } },
      take: 250,
    });
    return { accounts: records.map(toManagedAccountStatus), branches, roles };
  }

  async create(
    actor: AuthenticatedUser,
    tenantId: string,
    input: CreateManagedAccountDTO,
  ) {
    const { poolId, webOrigin } = this.directory.requireSettings();
    if (this.access?.enrolled(tenantId))
      this.access.assertStaffAdmin(actor, tenantId);
    const account = await reserveManagedAccount(actor, tenantId, input, poolId);
    await this.reserveAccess(actor, tenantId, account.userId, poolId);
    if (
      account.phase === 'VerifyEmail' &&
      account.verificationDelivery === 'NotSent'
    ) {
      try {
        await sendManagedAccountVerification(
          this.mail,
          account.userId,
          poolId,
          webOrigin,
        );
        this.note(actor, tenantId, account.userId, 'MANAGED_ACCOUNT_RESERVED');
      } catch (error) {
        if (!(error instanceof ConflictException)) throw error;
      }
    }
    return toManagedAccountStatus(
      await this.target(actor, tenantId, account.userId, poolId),
    );
  }

  async verify(token: string) {
    const { poolId } = this.directory.requireSettings();
    const userId = await verifyManagedAccountMailbox(token, poolId);
    if (await linkManagedIdentity(this.directory, userId, this.access)) {
      await sendManagedInvitation(this.directory, userId, false);
    }
    return { success: true };
  }

  async act(
    actor: AuthenticatedUser,
    tenantId: string,
    userId: string,
    action: ManagedAccountActionDTO['action'],
  ) {
    const { poolId, webOrigin } = this.directory.requireSettings();
    const entry = await this.target(actor, tenantId, userId, poolId);
    if (userId === actor.userId)
      throw new ForbiddenException('You cannot manage your own credentials.');
    switch (action) {
      case 'resend':
        if (entry.phase === 'VerifyEmail') {
          await this.reserveAccess(actor, tenantId, userId, poolId);
          await sendManagedAccountVerification(
            this.mail,
            userId,
            poolId,
            webOrigin,
          );
        } else await sendManagedInvitation(this.directory, userId, true);
        break;
      case 'retry':
        if (entry.phase !== 'ProvisionIdentity' && entry.phase !== 'Invite')
          throw new ConflictException(
            'No identity provisioning operation is pending.',
          );
        if (await linkManagedIdentity(this.directory, userId, this.access))
          await sendManagedInvitation(this.directory, userId, true);
        break;
      default:
        await updateManagedAccess(this.directory, userId, action);
    }
    this.note(
      actor,
      tenantId,
      userId,
      `MANAGED_ACCOUNT_${action.toUpperCase().replace('-', '_')}`,
    );
    return toManagedAccountStatus(
      await this.target(actor, tenantId, userId, poolId),
    );
  }

  private async target(
    actor: AuthenticatedUser,
    tenantId: string,
    userId: string,
    poolId: string,
  ) {
    const entry = await prisma.cognitoProvisioning.findFirst({
      where: {
        userId,
        poolId,
        user: { tenantId, authMode: 'Cognito', deletedAt: null },
      },
      select: managedAccountSelection,
    });
    if (!entry || entry.user.branches.length === 0)
      throw new NotFoundException('Managed account is unavailable.');
    for (const { branchId } of entry.user.branches)
      await assertManagedAccountAuthority(
        prisma,
        actor,
        tenantId,
        entry.user.roleId,
        branchId,
      );
    return entry;
  }

  private async reserveAccess(
    actor: AuthenticatedUser,
    tenantId: string,
    userId: string,
    poolId: string,
  ) {
    if (!this.access?.enrolled(tenantId)) return;
    const entry = await this.target(actor, tenantId, userId, poolId);
    try {
      await this.access.reserveStaff(
        actor,
        tenantId,
        userId,
        entry.user.role.name.toLowerCase(),
      );
    } catch (error) {
      await prisma.cognitoProvisioning.updateMany({
        where: { userId, poolId, phase: 'VerifyEmail' },
        data: { lastError: 'ACCESS_ENROLLMENT_FAILED' },
      });
      throw error;
    }
  }

  private note(
    actor: AuthenticatedUser,
    tenantId: string,
    userId: string,
    actionType: string,
  ) {
    void this.audit
      .emit({
        categoryType: 'STAFF_ACTIVITY',
        actionType,
        tenantId,
        userId: actor.userId,
        entityType: 'User',
        entityId: userId,
      })
      .catch(() => {});
  }
}
