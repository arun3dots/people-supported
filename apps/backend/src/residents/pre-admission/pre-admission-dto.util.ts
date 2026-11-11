import {
  Prisma,
  type PrismaTransactionClient,
  type ResidentPreAdmission,
} from '@repo/db';
import {
  PRE_ADMISSION_PARTS,
  derivePreAdmissionBanner,
  normalizePreAdmissionPartA,
  type PreAdmissionPartKey,
  type PreAdmissionRecordDTO,
  type PreAdmissionStatus,
} from '@repo/schema';

export type PartsMap = Partial<Record<PreAdmissionPartKey, unknown>>;

export const jsonInput = (v: unknown): Prisma.InputJsonValue | undefined =>
  v === null || v === undefined ? undefined : (v as Prisma.InputJsonValue);

export const partsOf = (row: ResidentPreAdmission): PartsMap =>
  Object.fromEntries(PRE_ADMISSION_PARTS.map((k) => [k, row[k]]));

export function toPreAdmissionDTO(
  row: ResidentPreAdmission,
): PreAdmissionRecordDTO {
  const iso = (d: Date | null) => (d ? d.toISOString() : null);
  return {
    id: row.id,
    residentId: row.residentId,
    versionNumber: row.versionNumber,
    status: row.status as PreAdmissionStatus,
    isCurrent: row.isCurrent,
    assessedAt: iso(row.assessedAt),
    assessedLocation: row.assessedLocation,
    assessedByName: row.assessedByName,
    partA: row.partA as PreAdmissionRecordDTO['partA'],
    partB: row.partB as PreAdmissionRecordDTO['partB'],
    partC: row.partC as PreAdmissionRecordDTO['partC'],
    partD: row.partD as PreAdmissionRecordDTO['partD'],
    partE: row.partE as PreAdmissionRecordDTO['partE'],
    partF: row.partF as PreAdmissionRecordDTO['partF'],
    partG: row.partG as PreAdmissionRecordDTO['partG'],
    roomAllocation:
      row.roomAllocation as PreAdmissionRecordDTO['roomAllocation'],
    managerDecision:
      row.managerDecision as PreAdmissionRecordDTO['managerDecision'],
    submittedAt: iso(row.submittedAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function residentIdentity(partA: PartsMap['partA']) {
  const a = (partA ?? {}) as Record<string, string | null | undefined>;
  const fullName = [a.firstName, a.middleName, a.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  return {
    ...(fullName ? { fullName } : {}),
    ...(a.dob ? { dob: a.dob } : {}),
    ...(a.nhsNumber ? { nhsNumber: a.nhsNumber } : {}),
    ...(a.photoUrl ? { photoUrl: a.photoUrl } : {}),
  };
}

export async function clonePreAdmissionDraft(
  tx: PrismaTransactionClient,
  current: ResidentPreAdmission,
  userId: string,
): Promise<ResidentPreAdmission> {
  await tx.residentPreAdmission.update({
    where: { id: current.id },
    data: { isCurrent: false },
  });
  return (await tx.residentPreAdmission.create({
    data: {
      tenantId: current.tenantId,
      branchId: current.branchId,
      residentId: current.residentId,
      versionNumber: current.versionNumber + 1,
      parentVersionId: current.id,
      isCurrent: true,
      status: 'Draft',
      schemaVersion: current.schemaVersion,
      assessedAt: current.assessedAt,
      assessedLocation: current.assessedLocation,
      assessedById: current.assessedById,
      assessedByName: current.assessedByName,
      partA: jsonInput(current.partA),
      partB: jsonInput(current.partB),
      partC: jsonInput(current.partC),
      partD: jsonInput(current.partD),
      partE: jsonInput(current.partE),
      partF: jsonInput(current.partF),
      partG: jsonInput(current.partG),
      roomAllocation: jsonInput(current.roomAllocation),
      createdById: userId,
      updatedById: userId,
    },
  })) as ResidentPreAdmission;
}

export async function hasRecordedAssessmentNeeds(
  tx: PrismaTransactionClient,
  residentId: string,
  tenantId: string,
): Promise<boolean> {
  if (tx.residentAssessment) {
    const assessment = await tx.residentAssessment.findFirst({
      where: { residentId, tenantId, isCurrent: true },
      select: { needs: true },
    });
    const needs = Array.isArray(assessment?.needs)
      ? (assessment.needs as {
          found?: string | null;
          supportLevel?: string | null;
        }[])
      : [];
    if (needs.some((n) => Boolean(n.found?.trim() || n.supportLevel))) {
      return true;
    }
  }
  if (tx.residentNeedCarePlan) {
    const count = await tx.residentNeedCarePlan.count({
      where: { residentId, tenantId, isCurrent: true },
    });
    return count > 0;
  }
  return false;
}

export async function applyAcceptedPreAdmissionData(
  tx: PrismaTransactionClient,
  current: ResidentPreAdmission,
  userId: string,
): Promise<void> {
  const parts = partsOf(current);
  const banner = derivePreAdmissionBanner(
    parts as Parameters<typeof derivePreAdmissionBanner>[0],
  );
  const partA = normalizePreAdmissionPartA(parts.partA);
  await tx.resident.update({
    where: { id: current.residentId },
    data: {
      ...(partA.nhsNumber?.trim() && { nhsNumber: partA.nhsNumber.trim() }),
      ...(banner.allergySummary !== null && {
        allergySummary: banner.allergySummary,
      }),
      ...(banner.fallsRiskLevel !== null && {
        fallsRiskLevel: banner.fallsRiskLevel,
      }),
      ...(banner.iddsiLevel !== null && { iddsiLevel: banner.iddsiLevel }),
      ...(banner.dnacprStatus !== null && {
        dnacprStatus: banner.dnacprStatus,
      }),
      updatedById: userId,
    },
  });
}
