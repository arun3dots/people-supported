import { Injectable, Logger } from '@nestjs/common';
import { prisma, Prisma, type RiskAssessment } from '@repo/db';
import {
  ASSESSMENT_TOOLS,
  CARE_AREAS,
  type AssessmentNeedDTO,
  type AssessmentRating,
  type AssessmentToolKey,
  type AssessmentToolResultDTO,
  type CareAreaKey,
  type PreAdmissionPartDDTO,
} from '@repo/schema';
import { toJsonValue } from '../common/utils/json.util';
import { prefillAssessment } from '../residents/care-journey/care-journey.mapper';
import type { ActorContext } from './risk.types';

export interface ToolAndAreaMatch {
  toolKey: AssessmentToolKey;
  areaKey?: CareAreaKey;
}

export function resolveToolAndArea(input: {
  tool?: string | null;
  title?: string | null;
  category?: string | null;
}): ToolAndAreaMatch | null {
  const combined =
    `${input.tool ?? ''} ${input.title ?? ''} ${input.category ?? ''}`.toLowerCase();

  if (
    combined.includes('waterlow') ||
    combined.includes('pressure ulcer') ||
    combined.includes('skin integrity') ||
    combined.includes('wound')
  ) {
    return { toolKey: 'waterlow', areaKey: 'skin' };
  }
  if (
    combined.includes('fall') ||
    combined.includes('morse') ||
    combined.includes('bed rail') ||
    combined.includes('moving & handling')
  ) {
    return { toolKey: 'falls', areaKey: 'mobility' };
  }
  if (
    combined.includes('must') ||
    combined.includes('nutrition') ||
    combined.includes('hydration') ||
    combined.includes('choking') ||
    combined.includes('dysphagia')
  ) {
    return { toolKey: 'must', areaKey: 'nutrition' };
  }
  if (
    combined.includes('abbey') ||
    combined.includes('pain') ||
    combined.includes('medication') ||
    combined.includes('mar audit')
  ) {
    return { toolKey: 'abbey', areaKey: 'medicines' };
  }
  if (
    combined.includes('continence') ||
    combined.includes('catheter') ||
    combined.includes('bowel') ||
    combined.includes('bladder')
  ) {
    return { toolKey: 'continence', areaKey: 'continence' };
  }
  if (
    combined.includes('abc') ||
    combined.includes('cmai') ||
    combined.includes('distress') ||
    combined.includes('behaviour') ||
    combined.includes('behavior') ||
    combined.includes('cognitive') ||
    combined.includes('dementia')
  ) {
    return { toolKey: 'abc', areaKey: 'cognition' };
  }
  if (
    combined.includes('dols') ||
    combined.includes('capacity') ||
    combined.includes('deprivation') ||
    combined.includes('mental capacity')
  ) {
    return { toolKey: 'dols', areaKey: 'capacity' };
  }
  return null;
}

export function mapLevelToRating(level?: string | null): AssessmentRating {
  const norm = (level ?? '').toLowerCase();
  if (norm === 'high' || norm === 'extreme' || norm === 'very high')
    return 'high';
  if (norm === 'medium' || norm === 'med' || norm === 'moderate') return 'med';
  if (norm === 'low') return 'low';
  return 'none';
}

@Injectable()
export class RiskAssessmentSyncService {
  private readonly logger = new Logger(RiskAssessmentSyncService.name);

  async syncRiskAssessment(
    risk: RiskAssessment,
    actor?: ActorContext,
  ): Promise<void> {
    try {
      const match = resolveToolAndArea(risk);
      const effectiveLevel = risk.residualLevel || risk.inherentLevel || 'Low';
      const effectiveScore = risk.residualScore ?? risk.inherentScore ?? null;
      const rating = mapLevelToRating(effectiveLevel);

      let residentAssessment = await prisma.residentAssessment.findFirst({
        where: {
          residentId: risk.residentId,
          tenantId: risk.tenantId,
          isCurrent: true,
        },
      });

      if (!residentAssessment) {
        let branchId = risk.branchId;
        if (!branchId) {
          const res = await prisma.resident.findUnique({
            where: { id: risk.residentId },
            select: { branchId: true },
          });
          branchId = res?.branchId ?? '';
        }
        if (!branchId) {
          this.logger.warn(
            `Cannot sync risk assessment: resident ${risk.residentId} has no branchId`,
          );
          return;
        }

        const preAdmission = await prisma.residentPreAdmission.findFirst({
          where: {
            residentId: risk.residentId,
            tenantId: risk.tenantId,
            isCurrent: true,
          },
          select: { id: true, partD: true },
        });
        const prefill = prefillAssessment(
          (preAdmission?.partD ?? null) as PreAdmissionPartDDTO | null,
        );

        try {
          residentAssessment = await prisma.residentAssessment.create({
            data: {
              tenantId: risk.tenantId,
              branchId,
              residentId: risk.residentId,
              preAdmissionId: preAdmission?.id ?? null,
              versionNumber: 1,
              status: 'Draft',
              tools: toJsonValue(prefill.tools),
              needs: toJsonValue(prefill.needs),
              assessedAt: new Date(),
              assessedById: actor?.userId ?? null,
              assessedByName: actor?.userFullName ?? null,
              createdById: actor?.userId ?? null,
              updatedById: actor?.userId ?? null,
            },
          });
        } catch {
          residentAssessment = await prisma.residentAssessment.findFirst({
            where: {
              residentId: risk.residentId,
              tenantId: risk.tenantId,
              isCurrent: true,
            },
          });
        }
      }

      if (!residentAssessment) return;

      const tools: AssessmentToolResultDTO[] = Array.isArray(
        residentAssessment.tools,
      )
        ? [...(residentAssessment.tools as AssessmentToolResultDTO[])]
        : ASSESSMENT_TOOLS.map((t) => ({
            toolKey: t.key,
            score: null,
            label: null,
            rating: 'none',
            answers: {},
          }));

      const needs: AssessmentNeedDTO[] = Array.isArray(residentAssessment.needs)
        ? [...(residentAssessment.needs as AssessmentNeedDTO[])]
        : CARE_AREAS.map((a) => ({
            areaKey: a.key,
            toolKey: null,
            found: null,
            source: a.source,
            becomesCarePlan: true,
          }));

      if (match?.toolKey) {
        const tIdx = tools.findIndex((t) => t.toolKey === match.toolKey);
        const updatedTool: AssessmentToolResultDTO = {
          toolKey: match.toolKey,
          score: effectiveScore,
          label: effectiveLevel,
          rating,
          notes: risk.hazardDescription || `${risk.title} (${risk.status})`,
          answers: {
            title: risk.title,
            tool: risk.tool,
            category: risk.category,
            status: risk.status,
            likelihood: risk.likelihood,
            severity: risk.severity,
            residualLikelihood: risk.residualLikelihood,
            residualSeverity: risk.residualSeverity,
            factors: risk.factors,
            updatedAt: risk.updatedAt
              ? new Date(risk.updatedAt).toISOString()
              : null,
          },
        };

        if (tIdx >= 0) {
          tools[tIdx] = updatedTool;
        } else {
          tools.push(updatedTool);
        }
      }

      if (match?.areaKey) {
        const nIdx = needs.findIndex((n) => n.areaKey === match.areaKey);
        const isElevated =
          rating === 'high' || rating === 'med' || risk.status === 'Active';
        const supportLevel =
          rating === 'high' ? 'F' : rating === 'med' ? 'P' : 'I';

        const updatedNeed: AssessmentNeedDTO = {
          areaKey: match.areaKey,
          toolKey: match.toolKey,
          found: `${risk.title}: ${effectiveLevel} (Score: ${effectiveScore ?? 'N/A'})`,
          source: 'Risk Assessment',
          supportLevel:
            nIdx >= 0 && needs[nIdx]?.supportLevel
              ? needs[nIdx].supportLevel
              : supportLevel,
          becomesCarePlan:
            isElevated ||
            (nIdx >= 0 ? Boolean(needs[nIdx]?.becomesCarePlan) : true),
        };

        if (nIdx >= 0) {
          needs[nIdx] = updatedNeed;
        } else {
          needs.push(updatedNeed);
        }
      }

      await prisma.residentAssessment.update({
        where: { id: residentAssessment.id },
        data: {
          tools: toJsonValue(tools),
          needs: toJsonValue(needs),
          updatedById: actor?.userId ?? undefined,
        },
      });

      if (match?.toolKey === 'falls') {
        await prisma.resident
          .update({
            where: { id: risk.residentId },
            data: { fallsRiskLevel: effectiveLevel },
          })
          .catch(() => undefined);
      }
    } catch (err) {
      this.logger.error(
        `Failed to sync risk assessment ${risk.id} to ResidentAssessment: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async handleDelete(
    risk: RiskAssessment,
    actor?: ActorContext,
  ): Promise<void> {
    try {
      const match = resolveToolAndArea(risk);
      if (!match?.toolKey) return;

      const remaining = await prisma.riskAssessment.findFirst({
        where: {
          residentId: risk.residentId,
          tenantId: risk.tenantId,
          deletedAt: null,
          id: { not: risk.id },
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (remaining) {
        await this.syncRiskAssessment(remaining, actor);
      } else {
        const current = await prisma.residentAssessment.findFirst({
          where: {
            residentId: risk.residentId,
            tenantId: risk.tenantId,
            isCurrent: true,
          },
        });
        if (!current || !Array.isArray(current.tools)) return;

        const tools = (current.tools as AssessmentToolResultDTO[]).map((t) =>
          t.toolKey === match.toolKey
            ? {
                ...t,
                score: null,
                label: null,
                rating: 'none' as const,
                notes: null,
                answers: {},
              }
            : t,
        );

        await prisma.residentAssessment.update({
          where: { id: current.id },
          data: {
            tools: toJsonValue(tools),
            updatedById: actor?.userId ?? undefined,
          },
        });
      }
    } catch (err) {
      this.logger.error(
        `Failed to handle risk assessment delete sync for ${risk.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
