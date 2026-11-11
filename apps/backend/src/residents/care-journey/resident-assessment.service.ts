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
  type ResidentAssessment,
} from '@repo/db';
import {
  normaliseToolResult,
  type AssessmentRecordDTO,
  type PreAdmissionPartDDTO,
  type SaveAssessmentDTO,
} from '@repo/schema';
import { AuditService } from '../../audit/audit.service';
import type { ClinicalDocAction } from '../../audit/audit.types';
import type { AuthenticatedUser } from '../../common/interfaces/request.interface';
import { ResidentAccessService } from '../services/resident-access.service';
import { prefillAssessment, toAssessmentDTO } from './care-journey.mapper';
import { NeedCarePlanService } from './need-care-plan.service';

const json = (v: unknown): Prisma.InputJsonValue | undefined =>
  v === null || v === undefined ? undefined : (v as Prisma.InputJsonValue);

const hasDuplicates = (values: string[]): boolean =>
  new Set(values).size !== values.length;

@Injectable()
export class ResidentAssessmentService {
  constructor(
    private readonly access: ResidentAccessService,
    private readonly auditService: AuditService,
    private readonly plans: NeedCarePlanService,
  ) {}

  private tenant(user: AuthenticatedUser): string {
    if (!user.tenantId)
      throw new BadRequestException('Tenant context required');
    return user.tenantId;
  }

  private audit(
    user: AuthenticatedUser,
    actionType: ClinicalDocAction,
    row: Pick<ResidentAssessment, 'id' | 'residentId' | 'versionNumber'>,
  ): void {
    // Identifiers only; assessment content is never written to the audit log.
    void this.auditService.emitClinicalDoc({
      actionType,
      entityType: 'ResidentAssessment',
      entityId: row.id,
      residentId: row.residentId,
      tenantId: user.tenantId,
      userId: user.userId,
      metadata: { versionNumber: row.versionNumber },
    });
  }

  private async currentOrThrow(
    tx: PrismaTransactionClient,
    residentId: string,
    tenantId: string,
  ): Promise<ResidentAssessment> {
    const row = await tx.residentAssessment.findFirst({
      where: { residentId, tenantId, isCurrent: true },
    });
    if (!row) throw new NotFoundException('Assessment not found');
    return row as ResidentAssessment;
  }

  async getCurrent(
    residentId: string,
    user: AuthenticatedUser,
  ): Promise<AssessmentRecordDTO> {
    await this.access.assertCanAccessResident(user, residentId);
    const row = await this.currentOrThrow(
      prisma,
      residentId,
      this.tenant(user),
    );
    this.audit(user, 'ASSESSMENT_VIEWED', row);
    return toAssessmentDTO(row);
  }

  /** Starts the assessment from the pre-admission Part D. Safe to call twice. */
  async create(
    residentId: string,
    user: AuthenticatedUser,
  ): Promise<AssessmentRecordDTO> {
    const tenantId = this.tenant(user);
    const resident = await this.access.assertCanAccessResident(
      user,
      residentId,
    );
    const existing = await prisma.residentAssessment.findFirst({
      where: { residentId, tenantId, isCurrent: true },
    });
    if (existing) return toAssessmentDTO(existing as ResidentAssessment);
    if (!resident.branchId) {
      throw new BadRequestException('Resident has no branch');
    }

    const preAdmission = await prisma.residentPreAdmission.findFirst({
      where: { residentId, tenantId, isCurrent: true },
      select: { id: true, partD: true },
    });
    const prefill = prefillAssessment(
      (preAdmission?.partD ?? null) as PreAdmissionPartDDTO | null,
    );

    try {
      const row = await prisma.residentAssessment.create({
        data: {
          tenantId,
          branchId: resident.branchId,
          residentId,
          preAdmissionId: preAdmission?.id ?? null,
          versionNumber: 1,
          status: 'Draft',
          tools: json(prefill.tools),
          needs: json(prefill.needs),
          assessedAt: new Date(),
          assessedById: user.userId,
          assessedByName: user.fullName ?? null,
          createdById: user.userId,
          updatedById: user.userId,
        },
      });
      this.audit(user, 'ASSESSMENT_CREATED', row as ResidentAssessment);
      return toAssessmentDTO(row as ResidentAssessment);
    } catch (e) {
      // A concurrent create hit the one-current-per-resident index.
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        const row = await this.currentOrThrow(prisma, residentId, tenantId);
        return toAssessmentDTO(row);
      }
      throw e;
    }
  }

  /** Returns the editable draft, cloning the current version if it is completed. */
  private async editableDraft(
    tx: PrismaTransactionClient,
    residentId: string,
    user: AuthenticatedUser,
  ): Promise<ResidentAssessment> {
    const current = await this.currentOrThrow(
      tx,
      residentId,
      this.tenant(user),
    );
    if (current.status === 'Draft') return current;

    await tx.residentAssessment.update({
      where: { id: current.id },
      data: { isCurrent: false },
    });
    return (await tx.residentAssessment.create({
      data: {
        tenantId: current.tenantId,
        branchId: current.branchId,
        residentId,
        preAdmissionId: current.preAdmissionId,
        versionNumber: current.versionNumber + 1,
        isCurrent: true,
        status: 'Draft',
        schemaVersion: current.schemaVersion,
        tools: json(current.tools),
        needs: json(current.needs),
        dols: json(current.dols),
        assessedAt: current.assessedAt,
        assessedById: user.userId,
        assessedByName: user.fullName ?? current.assessedByName,
        createdById: user.userId,
        updatedById: user.userId,
      },
    })) as ResidentAssessment;
  }

  async save(
    residentId: string,
    dto: SaveAssessmentDTO,
    user: AuthenticatedUser,
  ): Promise<AssessmentRecordDTO> {
    await this.access.assertCanAccessResident(user, residentId);
    if (hasDuplicates(dto.tools.map((t) => t.toolKey))) {
      throw new BadRequestException('Each assessment tool can appear once');
    }
    if (hasDuplicates(dto.needs.map((n) => n.areaKey))) {
      throw new BadRequestException('Each area of need can appear once');
    }

    const row = await prisma.$transaction(
      async (tx: PrismaTransactionClient) => {
        const draft = await this.editableDraft(tx, residentId, user);
        return tx.residentAssessment.update({
          where: { id: draft.id },
          data: {
            tools: json(dto.tools.map(normaliseToolResult)),
            needs: json(dto.needs),
            dols: dto.dols === undefined ? undefined : json(dto.dols),
            assessedAt: dto.assessedAt
              ? new Date(dto.assessedAt)
              : draft.assessedAt,
            updatedById: user.userId,
          },
        });
      },
    );
    this.audit(user, 'ASSESSMENT_UPDATED', row as ResidentAssessment);
    return toAssessmentDTO(row as ResidentAssessment);
  }

  /** Completes the draft and creates one care plan for each need that asks for one. */
  async complete(
    residentId: string,
    user: AuthenticatedUser,
  ): Promise<AssessmentRecordDTO> {
    const tenantId = this.tenant(user);
    await this.access.assertCanAccessResident(user, residentId);

    const row = await prisma.$transaction(
      async (tx: PrismaTransactionClient) => {
        const current = await this.currentOrThrow(tx, residentId, tenantId);
        if (current.status !== 'Draft') {
          throw new ConflictException('This assessment is already completed');
        }
        const needs = (current.needs ?? []) as { becomesCarePlan?: boolean }[];
        if (!needs.some((n) => n.becomesCarePlan)) {
          throw new BadRequestException(
            'Choose at least one area of need that becomes a care plan',
          );
        }
        const completed = await tx.residentAssessment.update({
          where: { id: current.id },
          data: {
            status: 'Completed',
            completedAt: new Date(),
            completedById: user.userId,
            updatedById: user.userId,
          },
        });
        await this.plans.generateFromAssessment(
          tx,
          completed as ResidentAssessment,
          user,
        );
        return completed;
      },
    );
    this.audit(user, 'ASSESSMENT_COMPLETED', row as ResidentAssessment);
    return toAssessmentDTO(row as ResidentAssessment);
  }
}
