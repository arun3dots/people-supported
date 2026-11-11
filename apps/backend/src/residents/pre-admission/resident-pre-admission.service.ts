import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  prisma,
  Prisma,
  type PrismaTransactionClient,
  type ResidentPreAdmission,
} from '@repo/db';
import {
  MANDATORY_PART_SCHEMAS,
  PRE_ADMISSION_PART_SCHEMAS,
  getPreAdmissionSubmitIssues,
  type CreatePreAdmissionDTO,
  type PreAdmissionManagerDecisionDTO,
  type PreAdmissionPartKey,
  type PreAdmissionRecordDTO,
  type PreAdmissionStatus,
  type UpdatePreAdmissionMetaDTO,
} from '@repo/schema';
import { AuditService } from '../../audit/audit.service';
import type { ClinicalDocAction } from '../../audit/audit.types';
import type { AuthenticatedUser } from '../../common/interfaces/request.interface';
import { ResidentAccessService } from '../services/resident-access.service';
import {
  applyAcceptedPreAdmissionData,
  clonePreAdmissionDraft,
  hasRecordedAssessmentNeeds,
  jsonInput,
  partsOf,
  residentIdentity,
  toPreAdmissionDTO,
} from './pre-admission-dto.util';

@Injectable()
export class ResidentPreAdmissionService {
  constructor(
    private readonly access: ResidentAccessService,
    private readonly auditService: AuditService,
  ) {}

  private tenant(user: AuthenticatedUser): string {
    if (!user.tenantId)
      throw new BadRequestException('Tenant context required');
    return user.tenantId;
  }

  private audit(
    user: AuthenticatedUser,
    actionType: ClinicalDocAction,
    row: Pick<ResidentPreAdmission, 'id' | 'residentId' | 'versionNumber'>,
    metadata: Record<string, unknown> = {},
  ): void {
    // Only identifiers and part names are logged, never clinical content.
    void this.auditService.emitClinicalDoc({
      actionType,
      entityType: 'ResidentPreAdmission',
      entityId: row.id,
      residentId: row.residentId,
      tenantId: user.tenantId,
      userId: user.userId,
      metadata: { versionNumber: row.versionNumber, ...metadata },
    });
  }

  private async currentOrThrow(
    tx: PrismaTransactionClient,
    residentId: string,
    tenantId: string,
  ): Promise<ResidentPreAdmission> {
    const row = await tx.residentPreAdmission.findFirst({
      where: { residentId, tenantId, isCurrent: true },
    });
    if (!row) throw new NotFoundException('Pre-admission not found');
    return row as ResidentPreAdmission;
  }

  async create(
    dto: CreatePreAdmissionDTO,
    user: AuthenticatedUser,
    branchId: string,
  ): Promise<PreAdmissionRecordDTO> {
    const tenantId = this.tenant(user);
    const a = dto.partA;
    if (!a.firstName || !a.lastName || !a.dob) {
      throw new BadRequestException(
        'First name, last name and date of birth are required to start a pre-admission',
      );
    }
    const dob = new Date(a.dob);
    if (Number.isNaN(dob.getTime()) || dob >= new Date()) {
      throw new BadRequestException('Date of birth must be a past date');
    }
    const expected = a.expectedAdmissionDate
      ? new Date(a.expectedAdmissionDate)
      : null;

    const row = await prisma.$transaction(
      async (tx: PrismaTransactionClient) => {
        const identity = residentIdentity(a);
        const resident = await tx.resident.create({
          data: {
            tenantId,
            branchId,
            fullName: identity.fullName ?? 'Resident',
            dob: a.dob,
            nhsNumber: identity.nhsNumber ?? null,
            photoUrl: identity.photoUrl ?? null,
            admissionDate:
              expected && !Number.isNaN(expected.getTime())
                ? expected
                : new Date(),
            admissionStep: 1,
            isDraft: true,
            status: 'Draft',
            createdById: user.userId,
            updatedById: user.userId,
          },
        });
        return tx.residentPreAdmission.create({
          data: {
            tenantId,
            branchId,
            residentId: resident.id,
            versionNumber: 1,
            isCurrent: true,
            status: 'Draft',
            assessedAt: dto.assessedAt ? new Date(dto.assessedAt) : null,
            assessedLocation: dto.assessedLocation ?? null,
            assessedById: user.userId,
            assessedByName: user.fullName ?? null,
            partA: jsonInput(a),
            createdById: user.userId,
            updatedById: user.userId,
          },
        });
      },
    );
    this.audit(user, 'PRE_ADMISSION_CREATED', row as ResidentPreAdmission);
    return toPreAdmissionDTO(row as ResidentPreAdmission);
  }

  async getCurrent(
    residentId: string,
    user: AuthenticatedUser,
  ): Promise<PreAdmissionRecordDTO> {
    await this.access.assertCanAccessResident(user, residentId);
    const row = await this.currentOrThrow(
      prisma,
      residentId,
      this.tenant(user),
    );
    this.audit(user, 'PRE_ADMISSION_VIEWED', row);
    return toPreAdmissionDTO(row);
  }

  async listVersions(residentId: string, user: AuthenticatedUser) {
    await this.access.assertCanAccessResident(user, residentId);
    const rows = await prisma.residentPreAdmission.findMany({
      where: { residentId, tenantId: this.tenant(user) },
      orderBy: { versionNumber: 'desc' },
      select: {
        id: true,
        versionNumber: true,
        status: true,
        isCurrent: true,
        submittedAt: true,
        createdAt: true,
        assessedByName: true,
      },
    });
    return rows.map((r) => ({
      ...r,
      status: r.status as PreAdmissionStatus,
      submittedAt: r.submittedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /** Returns the editable draft, cloning the current version if it is already frozen. */
  private async editableDraft(
    tx: PrismaTransactionClient,
    residentId: string,
    user: AuthenticatedUser,
  ): Promise<ResidentPreAdmission> {
    const current = await this.currentOrThrow(
      tx,
      residentId,
      this.tenant(user),
    );
    if (current.status === 'Draft') return current;
    return clonePreAdmissionDraft(tx, current, user.userId);
  }

  async savePart(
    residentId: string,
    part: PreAdmissionPartKey,
    body: unknown,
    user: AuthenticatedUser,
  ): Promise<PreAdmissionRecordDTO> {
    await this.access.assertCanAccessResident(user, residentId);
    const schema =
      MANDATORY_PART_SCHEMAS[part] ?? PRE_ADMISSION_PART_SCHEMAS[part];
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      throw new BadRequestException({
        message: firstIssue?.message || 'Validation failed for this step',
        issues: parsed.error.issues,
      });
    }
    try {
      const row = await prisma.$transaction(
        async (tx: PrismaTransactionClient) => {
          const draft = await this.editableDraft(tx, residentId, user);
          const updated = await tx.residentPreAdmission.update({
            where: { id: draft.id },
            data: { [part]: jsonInput(parsed.data), updatedById: user.userId },
          });
          const STEP_PART_NUMBERS: Record<PreAdmissionPartKey, number> = {
            partA: 1,
            partG: 2,
            partB: 3,
            partC: 4,
            partD: 7,
            partE: 8,
            partF: 9,
            roomAllocation: 10,
          };
          const stepNum = STEP_PART_NUMBERS[part];
          const resident = await tx.resident.findUnique({
            where: { id: residentId },
            select: { isDraft: true, admissionStep: true },
          });
          if (resident?.isDraft) {
            const nextStep = Math.max(
              resident.admissionStep ?? 1,
              stepNum ?? 1,
            );
            await tx.resident.update({
              where: { id: residentId },
              data: {
                admissionStep: nextStep,
                ...(part === 'partA' ? residentIdentity(parsed.data) : {}),
                updatedById: user.userId,
              },
            });
          }
          return updated;
        },
      );
      this.audit(user, 'PRE_ADMISSION_UPDATED', row as ResidentPreAdmission, {
        part,
      });
      return toPreAdmissionDTO(row as ResidentPreAdmission);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          'Another edit is in progress, please retry',
        );
      }
      throw err;
    }
  }

  async updateMeta(
    residentId: string,
    dto: UpdatePreAdmissionMetaDTO,
    user: AuthenticatedUser,
  ): Promise<PreAdmissionRecordDTO> {
    await this.access.assertCanAccessResident(user, residentId);
    const row = await prisma.$transaction(
      async (tx: PrismaTransactionClient) => {
        const draft = await this.editableDraft(tx, residentId, user);
        return tx.residentPreAdmission.update({
          where: { id: draft.id },
          data: {
            ...(dto.assessedAt !== undefined && {
              assessedAt: dto.assessedAt ? new Date(dto.assessedAt) : null,
            }),
            ...(dto.assessedLocation !== undefined && {
              assessedLocation: dto.assessedLocation,
            }),
            ...(dto.assessedByName !== undefined && {
              assessedByName: dto.assessedByName,
            }),
            updatedById: user.userId,
          },
        });
      },
    );
    this.audit(user, 'PRE_ADMISSION_UPDATED', row as ResidentPreAdmission, {
      part: 'meta',
    });
    return toPreAdmissionDTO(row as ResidentPreAdmission);
  }

  async submit(
    residentId: string,
    user: AuthenticatedUser,
  ): Promise<PreAdmissionRecordDTO> {
    await this.access.assertCanAccessResident(user, residentId);
    const tenantId = this.tenant(user);
    const row = await prisma.$transaction(
      async (tx: PrismaTransactionClient) => {
        const current = await this.currentOrThrow(tx, residentId, tenantId);
        if (current.status !== 'Draft') {
          throw new BadRequestException('Only a draft can be submitted');
        }
        const hasAssessmentNeeds = await hasRecordedAssessmentNeeds(
          tx,
          residentId,
          tenantId,
        );
        const issues = getPreAdmissionSubmitIssues(
          partsOf(current) as Parameters<typeof getPreAdmissionSubmitIssues>[0],
          { hasAssessmentNeeds },
        );
        if (issues.length > 0) {
          throw new BadRequestException({
            message: 'Pre-admission is incomplete',
            issues,
          });
        }
        const res = await tx.resident.findUnique({
          where: { id: residentId },
          select: { isDraft: true },
        });
        if (res?.isDraft) {
          await tx.resident.update({
            where: { id: residentId },
            data: { admissionStep: 11, updatedById: user.userId },
          });
        }
        return tx.residentPreAdmission.update({
          where: { id: current.id },
          data: {
            status: 'Submitted',
            submittedAt: new Date(),
            submittedById: user.userId,
            updatedById: user.userId,
          },
        });
      },
    );
    this.audit(user, 'PRE_ADMISSION_SUBMITTED', row as ResidentPreAdmission);
    return toPreAdmissionDTO(row as ResidentPreAdmission);
  }

  async decide(
    residentId: string,
    dto: PreAdmissionManagerDecisionDTO,
    user: AuthenticatedUser,
  ): Promise<PreAdmissionRecordDTO> {
    await this.access.assertCanAccessResident(user, residentId);
    const row = await prisma.$transaction(
      async (tx: PrismaTransactionClient) => {
        const current = await this.currentOrThrow(
          tx,
          residentId,
          this.tenant(user),
        );
        if (current.status !== 'Submitted') {
          throw new BadRequestException(
            'Only a submitted pre-admission can be decided',
          );
        }
        const decision = {
          ...dto,
          signedAt: dto.signedAt ?? new Date().toISOString(),
        };
        const status =
          dto.decision === 'Accepted'
            ? 'Accepted'
            : dto.decision === 'Declined'
              ? 'Declined'
              : 'Draft';
        const updated = await tx.residentPreAdmission.update({
          where: { id: current.id },
          data: { status, managerDecision: decision, updatedById: user.userId },
        });
        if (dto.decision === 'Accepted') {
          await tx.residentPreAdmission.updateMany({
            where: { residentId, status: 'Accepted', id: { not: current.id } },
            data: { status: 'Superseded' },
          });
          await applyAcceptedPreAdmissionData(tx, current, user.userId);
        }
        return updated;
      },
    );
    this.audit(user, 'PRE_ADMISSION_DECIDED', row as ResidentPreAdmission, {
      decision: dto.decision,
    });
    return toPreAdmissionDTO(row as ResidentPreAdmission);
  }
}
