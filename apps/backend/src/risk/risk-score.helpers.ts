import { calculateRiskScore, riskLevelFromScore } from '@repo/schema';

/**
 * Resolves the residual score + level from update-DTO inputs.
 *
 * - Both values present → recompute.
 * - Either value null     → clear residual.
 * - Otherwise             → keep existing.
 */
export function resolveResidual(
  dto: {
    residualLikelihood?: number | null;
    residualSeverity?: number | null;
  },
  existing: { residualScore: number | null; residualLevel: string | null },
): { residualScore: number | null; residualLevel: string | null } {
  if (dto.residualLikelihood && dto.residualSeverity) {
    const score = calculateRiskScore(
      dto.residualLikelihood,
      dto.residualSeverity,
    );
    return { residualScore: score, residualLevel: riskLevelFromScore(score) };
  }
  if (dto.residualLikelihood === null || dto.residualSeverity === null) {
    return { residualScore: null, residualLevel: null };
  }
  return existing;
}
