import { prisma } from '@repo/db';
import { AuditService } from '../../audit/audit.service';
import { ResidentMedicationRoundsService } from './resident-medication-rounds.service';
import { ResidentMedicationPrescriptionsService } from './resident-medication-prescriptions.service';
import { getActiveMedicationPrescription } from './medication-prescription-read.util';

jest.mock('@repo/db', () => ({
  prisma: {
    resident: { findFirst: jest.fn() },
    medicationRound: { findMany: jest.fn() },
    medicationPrescription: { findMany: jest.fn(), findFirst: jest.fn() },
    residentPreAdmission: { findFirst: jest.fn() },
  },
}));
jest.mock('../../audit/audit.service', () => ({ AuditService: class {} }));

describe('resident medication reads', () => {
  const audit = {} as AuditService;
  const rounds = new ResidentMedicationRoundsService(audit);
  const prescriptions = new ResidentMedicationPrescriptionsService(audit);
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.resident.findFirst as jest.Mock).mockResolvedValue({
      id: 'person',
    });
    (prisma.medicationRound.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.medicationPrescription.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.residentPreAdmission.findFirst as jest.Mock).mockResolvedValue(
      null,
    );
  });

  it('scopes rounds to the tenant and returns only current administration records', async () => {
    expect(await rounds.getMedicationRounds('person', 'tenant')).toEqual([]);
    expect(prisma.medicationRound.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          residentId: 'person',
          deletedAt: null,
          resident: { tenantId: 'tenant' },
        },
        include: {
          administrations: expect.objectContaining({
            where: { deletedAt: null, isSuperseded: false },
          }),
        },
      }),
    );
  });

  it('excludes deleted prescriptions and corrected/deleted administration outcomes', async () => {
    expect(await prescriptions.listPrescriptions('person', 'tenant')).toEqual(
      [],
    );
    expect(prisma.medicationPrescription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          residentId: 'person',
          deletedAt: null,
          resident: { tenantId: 'tenant' },
        },
        include: expect.objectContaining({
          rounds: expect.objectContaining({
            where: { deletedAt: null },
            include: {
              administrations: expect.objectContaining({
                where: { deletedAt: null, isSuperseded: false },
              }),
            },
          }),
        }),
      }),
    );
  });

  it('does not query medication records for a person outside the tenant', async () => {
    (prisma.resident.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(
      rounds.getMedicationRounds('other-person', 'tenant'),
    ).rejects.toThrow('Resident not found');
    await expect(
      prescriptions.listPrescriptions('other-person', 'tenant'),
    ).rejects.toThrow('Resident not found');
    expect(prisma.medicationRound.findMany).not.toHaveBeenCalled();
    expect(prisma.medicationPrescription.findMany).not.toHaveBeenCalled();
  });

  it('scopes prescription actions to a live resident and prescription in the tenant', async () => {
    (prisma.medicationPrescription.findFirst as jest.Mock).mockResolvedValue({
      id: 'rx',
      status: 'Active',
    });
    expect(await getActiveMedicationPrescription('rx', 'tenant')).toEqual({
      id: 'rx',
      status: 'Active',
    });
    expect(prisma.medicationPrescription.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'rx',
        deletedAt: null,
        resident: { tenantId: 'tenant', deletedAt: null },
      },
    });
  });

  it('rejects deleted, missing and already stopped prescriptions', async () => {
    (prisma.medicationPrescription.findFirst as jest.Mock).mockResolvedValue(
      null,
    );
    await expect(
      getActiveMedicationPrescription('rx', 'tenant'),
    ).rejects.toThrow('Medication prescription not found');
    (prisma.medicationPrescription.findFirst as jest.Mock).mockResolvedValue({
      id: 'rx',
      status: 'Stopped',
    });
    await expect(
      getActiveMedicationPrescription('rx', 'tenant'),
    ).rejects.toThrow('Prescription is already stopped');
  });

  it('returns medicines saved in the current onboarding record even without MAR rows', async () => {
    (prisma.residentPreAdmission.findFirst as jest.Mock).mockResolvedValue({
      partC: {
        medicines: [
          {
            name: 'Saved onboarding medicine',
            dose: '5 mg',
            form: 'Tablet',
            route: 'Oral',
            times: ['09:00'],
            prescriber: 'Recorded clinician',
          },
        ],
      },
    });
    const result = await rounds.getOnboardingMedicines('person', 'tenant');
    expect(result).toEqual([
      expect.objectContaining({
        name: 'Saved onboarding medicine',
        dose: '5 mg',
        times: ['09:00'],
        prescriber: 'Recorded clinician',
      }),
    ]);
    expect(prisma.residentPreAdmission.findFirst).toHaveBeenCalledWith({
      where: { residentId: 'person', tenantId: 'tenant', isCurrent: true },
      select: { partC: true },
    });
    expect(prisma.medicationRound.findMany).not.toHaveBeenCalled();
  });

  it('returns an empty list only when no onboarding medicines have been saved', async () => {
    expect(await rounds.getOnboardingMedicines('person', 'tenant')).toEqual([]);
  });

  it('reads valid medicines independently of other saved health fields', async () => {
    (prisma.residentPreAdmission.findFirst as jest.Mock).mockResolvedValue({
      partC: {
        allergies: 'older unrelated representation',
        medicines: [{ name: 'Recorded medicine', dose: '5 mg' }],
      },
    });
    expect(await rounds.getOnboardingMedicines('person', 'tenant')).toEqual([
      expect.objectContaining({ name: 'Recorded medicine', dose: '5 mg' }),
    ]);
  });

  it('reports invalid stored onboarding data instead of hiding it as an empty list', async () => {
    (prisma.residentPreAdmission.findFirst as jest.Mock).mockResolvedValue({
      partC: { medicines: [{ dose: '5 mg' }] },
    });
    await expect(
      rounds.getOnboardingMedicines('person', 'tenant'),
    ).rejects.toThrow('Saved onboarding medicines could not be read');
  });
});
