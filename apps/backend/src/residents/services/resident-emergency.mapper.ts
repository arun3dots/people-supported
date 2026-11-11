import type {
  EmergencyContactPersonDTO,
  EmergencyContactSummaryDTO,
  EmergencyObservationSummaryDTO,
} from '@repo/schema';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function textOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function uniqueStrings(
  ...lists: Array<string[] | null | undefined>
): string[] {
  const seen = new Set<string>();
  for (const list of lists) {
    for (const item of list ?? []) {
      const clean = item.trim();
      if (clean) seen.add(clean);
    }
  }
  return Array.from(seen);
}

// nextOfKin is stored as JSON; admission step 2 uses `relationship`/`emailAddress`,
// older records use `relation`/`email`.
export function parseEmergencyContacts(
  raw: unknown,
): EmergencyContactSummaryDTO[] {
  if (!Array.isArray(raw)) return [];
  const contacts: EmergencyContactSummaryDTO[] = [];
  raw.forEach((entry, index) => {
    if (!isRecord(entry)) return;
    const name = textOrNull(entry.name);
    if (!name) return;
    contacts.push({
      name,
      relationship:
        textOrNull(entry.relationship) ?? textOrNull(entry.relation),
      phone: textOrNull(entry.phone),
      isPrimary: entry.isPrimary === true || index === 0,
    });
  });
  return contacts;
}

export function parseGp(raw: unknown): {
  name: string | null;
  practice: string | null;
  phone: string | null;
} | null {
  if (!isRecord(raw)) return null;
  const gp = {
    name: textOrNull(raw.name) ?? textOrNull(raw.gpName),
    practice: textOrNull(raw.practice),
    phone: textOrNull(raw.phone),
  };
  return gp.name || gp.practice || gp.phone ? gp : null;
}

export interface CareProviderSource {
  hospitalConsultant?: string | null;
  hospitalName?: string | null;
  communityNursePhone?: string | null;
  mentalHealthTeam?: string | null;
}

export function buildCareProviders(
  source: CareProviderSource | null | undefined,
): EmergencyContactPersonDTO[] {
  if (!source) return [];
  const providers: EmergencyContactPersonDTO[] = [];
  const hospital = [
    textOrNull(source.hospitalConsultant),
    textOrNull(source.hospitalName),
  ]
    .filter((part): part is string => part !== null)
    .join(' - ');
  if (hospital)
    providers.push({
      role: 'Hospital consultant',
      name: hospital,
      phone: null,
    });
  const nursePhone = textOrNull(source.communityNursePhone);
  if (nursePhone)
    providers.push({ role: 'Community nurse', name: null, phone: nursePhone });
  const mentalHealth = textOrNull(source.mentalHealthTeam);
  if (mentalHealth)
    providers.push({
      role: 'Mental health team',
      name: mentalHealth,
      phone: null,
    });
  return providers;
}

export interface ObservationSource {
  timestamp: Date;
  news2Score: number | null;
  temp: number | null;
  pulse: number | null;
  bpSystolic: number | null;
  bpDiastolic: number | null;
  respiration: number | null;
  spo2: number | null;
  consciousness: string | null;
}

export function mapObservation(
  observation: ObservationSource | null | undefined,
): EmergencyObservationSummaryDTO | null {
  if (!observation) return null;
  return {
    timestamp: observation.timestamp.toISOString(),
    news2Score: observation.news2Score,
    temp: observation.temp,
    pulse: observation.pulse,
    bpSystolic: observation.bpSystolic,
    bpDiastolic: observation.bpDiastolic,
    respiration: observation.respiration,
    spo2: observation.spo2,
    consciousness: observation.consciousness,
  };
}
