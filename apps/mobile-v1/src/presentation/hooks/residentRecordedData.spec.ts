import { describe, expect, it } from '@jest/globals';
import type { PreAdmissionRecordDTO } from '@repo/schema';
import { mapAssignedResidents } from './shiftDashboard.utils';
import { enrichResidentFromRecord, residentDetailFromRecord } from './residentRecordedData';
import type { ResidentDetailData } from './useResidentDetail';

const resident = mapAssignedResidents([{ id: 'person-1', fullName: 'Assigned person' }])[0]!;
const record: ResidentDetailData = {
  id: resident.id,
  fullName: resident.fullName,
  status: 'Active',
};

describe('recorded resident information', () => {
  it('does not turn missing clinical data into normal findings or a prescribed fluid target', () => {
    expect(resident).toMatchObject({ riskRatings: {} });
    expect(resident.allergies).toBeUndefined();
    expect(resident.age).toBeUndefined();
    expect(resident.mustScore).toBeUndefined();
    expect(resident.fluidTargetMl).toBeUndefined();
    expect(resident.dnacpr).toBeUndefined();
    expect(enrichResidentFromRecord(resident, record).noKnownAllergies).toBe(false);
  });

  it('reads the current onboarding version and preserves unknown allergy severity and DNACPR', () => {
    const current = {
      isCurrent: true,
      partA: { gender: 'Female' },
      partC: { allergies: [{ substance: 'Penicillin' }], noKnownAllergies: false },
      partD: { fallsRiskLevel: 'High' },
      partF: { dnacpr: { status: 'NotDiscussed' } },
    } as Partial<PreAdmissionRecordDTO>;
    const result = enrichResidentFromRecord(resident, {
      ...record,
      preAdmissions: [
        {
          ...current,
          isCurrent: false,
          partA: {
            gender: 'Other',
            languagesSpoken: [],
            interpreterRequired: false,
            documents: [],
          },
        },
        current,
      ],
    });
    expect(result.gender).toBe('Female');
    expect(result.riskRatings.fallRisk).toBe('High');
    expect(result.allergies).toEqual([{ allergen: 'Penicillin', severity: undefined }]);
    expect(result.dnacpr).toBeUndefined();
    expect(result.noKnownAllergies).toBe(false);
  });

  it('shows no known allergies only when explicitly documented without conflicting allergens', () => {
    const admission = {
      isCurrent: true,
      partC: { noKnownAllergies: true, allergies: [] },
    } as unknown as Partial<PreAdmissionRecordDTO>;
    expect(
      enrichResidentFromRecord(resident, { ...record, preAdmissions: [admission] })
        .noKnownAllergies,
    ).toBe(true);
    admission.partC!.allergies = [{ substance: 'Latex' }];
    expect(
      enrichResidentFromRecord(resident, { ...record, preAdmissions: [admission] })
        .noKnownAllergies,
    ).toBe(false);
  });

  it('keeps every recorded emergency contact and does not substitute old profile findings', () => {
    const result = residentDetailFromRecord({
      ...record,
      careProfile: { primaryDiagnosis: 'Old entry' },
      preAdmissions: [
        {
          isCurrent: true,
          partB: {
            nextOfKin: [{ name: 'First contact' }, { name: 'Second contact' }],
            lpa: [],
            otherLegalAuthority: [],
            otherProviders: [],
          },
        },
      ],
    });
    expect(result.nextOfKin).toHaveLength(2);
    expect(result.careProfile?.primaryDiagnosis).toBeUndefined();
  });

  it('never manufactures person IDs for malformed assignment entries', () => {
    expect(mapAssignedResidents([{ id: '', fullName: 'Missing identifier' }])).toEqual([]);
  });
});
