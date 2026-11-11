import { prisma } from '@repo/db';
import type { MustKnowItemDTO } from '@repo/schema';

const FALLS_TONE: Record<string, MustKnowItemDTO['tone']> = {
  High: 'danger',
  Medium: 'warning',
};

const DNACPR_LABELS: Record<string, string> = {
  NotDiscussed: 'Not discussed yet',
  InPlace: 'In place',
  NotInPlace: 'Discussed, not in place',
  Declined: 'Declined',
};

interface PreAdmissionParts {
  partC?: {
    allergies?: Array<{ substance?: string | null; reaction?: string | null }>;
    noKnownAllergies?: boolean;
  } | null;
  partF?: { dnacpr?: { status?: string } | null } | null;
}

/** The facts a carer must read before starting a shift for this resident. */
export async function buildMustKnow(
  residentId: string,
  tenantId: string,
): Promise<MustKnowItemDTO[]> {
  const [resident, preAdmission, plans] = await Promise.all([
    prisma.resident.findFirst({
      where: { id: residentId, tenantId },
      select: {
        allergySummary: true,
        dnacprStatus: true,
        fallsRiskLevel: true,
        iddsiLevel: true,
      },
    }),
    prisma.residentPreAdmission.findFirst({
      where: { residentId, tenantId, isCurrent: true },
      select: { partC: true, partF: true },
    }),
    prisma.residentNeedCarePlan.findMany({
      where: { residentId, tenantId, isCurrent: true },
      select: { area: true, content: true },
    }),
  ]);

  const parts = (preAdmission ?? {}) as PreAdmissionParts;
  const items: MustKnowItemDTO[] = [];

  // Pre-admission wins: it is what the onboarding process actually recorded.
  const recordedAllergies = (parts.partC?.allergies ?? [])
    .map((a) => [a.substance, a.reaction].filter(Boolean).join(' — '))
    .filter(Boolean)
    .join('; ');
  const allergy =
    recordedAllergies ||
    (parts.partC?.noKnownAllergies
      ? ''
      : (resident?.allergySummary?.trim() ?? ''));
  items.push({
    label: 'Allergies',
    value:
      allergy ||
      (parts.partC?.noKnownAllergies ? 'None known' : 'None recorded'),
    tone: allergy && !/^(none|nil|nka)/i.test(allergy) ? 'danger' : 'neutral',
  });

  const dnacprStatus = parts.partF?.dnacpr?.status ?? resident?.dnacprStatus;
  if (dnacprStatus) {
    items.push({
      label: 'DNACPR',
      value: DNACPR_LABELS[dnacprStatus] ?? dnacprStatus,
      tone: dnacprStatus === 'InPlace' ? 'warning' : 'neutral',
    });
  }
  if (resident?.fallsRiskLevel) {
    items.push({
      label: 'Falls risk',
      value: resident.fallsRiskLevel,
      tone: FALLS_TONE[resident.fallsRiskLevel] ?? 'neutral',
    });
  }
  if (resident?.iddsiLevel) {
    items.push({
      label: 'Diet (IDDSI)',
      value: resident.iddsiLevel,
      tone: 'neutral',
    });
  }
  for (const p of plans) {
    const text = (
      (p.content ?? {}) as { restrictions?: string | null }
    ).restrictions?.trim();
    if (text && !/^none/i.test(text)) {
      items.push({
        label: `Restriction · ${p.area}`,
        value: text,
        tone: 'warning',
      });
    }
  }
  return items;
}
