import { BadRequestException } from '@nestjs/common';
import { prisma } from '@repo/db';
import { ResidentPreAdmissionService } from './resident-pre-admission.service';
import type { AuthenticatedUser } from '../../common/interfaces/request.interface';

jest.mock('@repo/db', () => {
  class PrismaClientKnownRequestError extends Error {
    code = 'P2002';
  }
  const db = {
    residentPreAdmission: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    resident: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
    residentProfile: { upsert: jest.fn() },
    residentCareProfile: { upsert: jest.fn() },
    $transaction: jest.fn(),
  };
  db.$transaction.mockImplementation((cb: (tx: typeof db) => unknown) =>
    cb(db),
  );
  return { Prisma: { PrismaClientKnownRequestError }, prisma: db };
});

const db = prisma as unknown as {
  residentPreAdmission: Record<string, jest.Mock>;
  resident: Record<string, jest.Mock>;
  residentProfile: Record<string, jest.Mock>;
  residentCareProfile: Record<string, jest.Mock>;
};

const user: AuthenticatedUser = {
  userId: 'u1',
  email: 'm@test.com',
  fullName: 'Manager One',
  roleName: 'Manager',
  tenantId: 't1',
};

const row = (over: Record<string, unknown> = {}) => ({
  id: 'p1',
  tenantId: 't1',
  branchId: 'b1',
  residentId: 'r1',
  versionNumber: 1,
  status: 'Draft',
  isCurrent: true,
  schemaVersion: 1,
  assessedAt: null,
  assessedLocation: null,
  assessedById: null,
  assessedByName: null,
  partA: { firstName: 'Margaret' },
  partB: null,
  partC: null,
  partD: null,
  partE: null,
  partF: null,
  partG: null,
  roomAllocation: null,
  managerDecision: null,
  submittedAt: null,
  createdAt: new Date('2026-11-02T00:00:00Z'),
  updatedAt: new Date('2026-11-02T00:00:00Z'),
  ...over,
});

const completeParts = {
  partA: {
    firstName: 'Margaret',
    lastName: 'Ellison',
    dob: '1942-03-14',
    gender: 'Female',
    maritalStatus: 'Widowed',
    nhsNumber: '9434765919',
    previousAddress: '1 High Street',
    language: 'English',
    stayType: 'Permanent',
    typeOfCare: 'Dementia Care',
    careLevel: 'High',
    admittedFrom: 'Hospital',
    admissionReason: 'Fall at home',
  },
  partB: { nextOfKin: [{ name: 'Susan' }] },
  partC: {
    diagnoses: ['Alzheimer’s'],
    allergies: [{ substance: 'Penicillin', reaction: 'rash' }],
  },
  partD: { areas: { mobility: { summary: 'Zimmer', supportLevel: '1' } } },
  partE: {
    moveDecision: {
      hasCapacity: false,
      assessedAt: '2026-11-02',
      assessedByName: 'Dr Patel',
      summary: 'Lacks capacity for the decision to move.',
      bestInterests: {
        decidedAt: '2026-11-02',
        decisionMaker: 'Susan Ellison',
        rationale: 'Best-interests meeting held with the family.',
      },
    },
  },
  partF: { dnacpr: { status: 'NotDiscussed' } },
};

describe('ResidentPreAdmissionService', () => {
  const access = { assertCanAccessResident: jest.fn() };
  const audit = { emitClinicalDoc: jest.fn() };
  let service: ResidentPreAdmissionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ResidentPreAdmissionService(access as never, audit as never);
    db.residentPreAdmission.update.mockImplementation(
      ({ where, data }: { where: { id: string }; data: object }) =>
        Promise.resolve(row({ id: where.id, ...data })),
    );
  });

  it('edits a draft in place without creating a version', async () => {
    db.residentPreAdmission.findFirst.mockResolvedValue(row());
    await service.savePart('r1', 'partG', { loves: 'Gardening' }, user);
    expect(db.residentPreAdmission.create).not.toHaveBeenCalled();
    expect(db.residentPreAdmission.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'p1' },
        data: expect.objectContaining({
          partG: expect.objectContaining({ loves: 'Gardening' }),
        }),
      }),
    );
  });

  it('clones a frozen version into a new current draft before editing', async () => {
    db.residentPreAdmission.findFirst.mockResolvedValue(
      row({ status: 'Accepted', versionNumber: 2, partB: { nextOfKin: [] } }),
    );
    db.residentPreAdmission.create.mockResolvedValue(
      row({ id: 'p2', versionNumber: 3, parentVersionId: 'p1' }),
    );
    await service.savePart('r1', 'partG', { loves: 'Radio 4' }, user);

    expect(db.residentPreAdmission.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'p1' },
      data: { isCurrent: false },
    });
    expect(db.residentPreAdmission.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        versionNumber: 3,
        parentVersionId: 'p1',
        status: 'Draft',
        isCurrent: true,
        partB: { nextOfKin: [] },
      }),
    });
    expect(db.residentPreAdmission.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: { id: 'p2' } }),
    );
  });

  it('rejects a part that fails its schema', async () => {
    await expect(
      service.savePart('r1', 'partD', { fallsRiskLevel: 'Extreme' }, user),
    ).rejects.toThrow(BadRequestException);
    expect(db.residentPreAdmission.update).not.toHaveBeenCalled();
  });

  it('rejects saving a step if mandatory fields are missing', async () => {
    await expect(
      service.savePart(
        'r1',
        'partA',
        { firstName: 'Peggy', dob: '1942-03-14' },
        user,
      ),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.savePart('r1', 'partB', { nextOfKin: [] }, user),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.savePart(
        'r1',
        'partC',
        { diagnoses: [], noKnownAllergies: true },
        user,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a capacity record without the required assessment fields', async () => {
    await expect(
      service.savePart(
        'r1',
        'partE',
        { moveDecision: { hasCapacity: true } },
        user,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(db.residentPreAdmission.update).not.toHaveBeenCalled();
  });

  it('rejects a capacity record that lacks capacity but has no best-interests decision', async () => {
    await expect(
      service.savePart(
        'r1',
        'partE',
        {
          moveDecision: {
            hasCapacity: false,
            assessedAt: '2026-11-02',
            assessedByName: 'Dr Patel',
            summary: 'Lacks capacity for the decision to move.',
          },
        },
        user,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(db.residentPreAdmission.update).not.toHaveBeenCalled();
  });

  it('requires all new personal and care fields in part A', async () => {
    const completePartA: Record<string, unknown> = {
      firstName: 'Margaret',
      lastName: 'Ellison',
      dob: '1942-03-14',
      gender: 'Female',
      maritalStatus: 'Widowed',
      nhsNumber: '9434765919',
      previousAddress: '1 High Street',
      language: 'English',
      stayType: 'Permanent',
      typeOfCare: 'Dementia Care',
      careLevel: 'High',
      admittedFrom: 'Hospital',
      admissionReason: 'Fall at home',
    };

    for (const field of [
      'maritalStatus',
      'nhsNumber',
      'previousAddress',
      'language',
      'typeOfCare',
      'careLevel',
    ]) {
      const partA = { ...completePartA };
      delete partA[field];
      await expect(
        service.savePart('r1', 'partA', partA, user),
      ).rejects.toThrow(BadRequestException);
    }

    const invalidCareLevel = { ...completePartA, careLevel: 'Residential' };
    await expect(
      service.savePart('r1', 'partA', invalidCareLevel, user),
    ).rejects.toThrow(BadRequestException);
  });

  it('keeps the resident identity in sync while the resident is still a draft', async () => {
    db.residentPreAdmission.findFirst.mockResolvedValue(row());
    db.resident.findUnique.mockResolvedValue({ isDraft: true });
    await service.savePart(
      'r1',
      'partA',
      {
        firstName: 'Peggy',
        lastName: 'Ellison',
        dob: '1942-03-14',
        gender: 'Female',
        maritalStatus: 'Widowed',
        nhsNumber: '9434765919',
        previousAddress: '1 High Street',
        language: 'English',
        stayType: 'Permanent',
        typeOfCare: 'Residential Care',
        careLevel: 'Medium',
        admittedFrom: 'Home',
        admissionReason: 'Care support needed',
      },
      user,
    );
    expect(db.resident.update).toHaveBeenCalledWith({
      where: { id: 'r1' },
      data: expect.objectContaining({
        fullName: 'Peggy Ellison',
        dob: '1942-03-14',
      }),
    });
  });

  it('refuses to submit an incomplete draft and reports what is missing', async () => {
    db.residentPreAdmission.findFirst.mockResolvedValue(row());
    await expect(service.submit('r1', user)).rejects.toMatchObject({
      response: {
        issues: expect.arrayContaining([
          expect.objectContaining({ part: 'partB' }),
        ]),
      },
    });
    expect(db.residentPreAdmission.update).not.toHaveBeenCalled();
  });

  it('reports the new personal and care fields as submit blockers', async () => {
    const partA: Record<string, unknown> = { ...completeParts.partA };
    delete partA.maritalStatus;
    delete partA.nhsNumber;
    delete partA.previousAddress;
    delete partA.language;
    delete partA.typeOfCare;
    delete partA.careLevel;
    db.residentPreAdmission.findFirst.mockResolvedValue(
      row({ ...completeParts, partA }),
    );

    await expect(service.submit('r1', user)).rejects.toMatchObject({
      response: {
        issues: expect.arrayContaining([
          expect.objectContaining({ field: 'maritalStatus' }),
          expect.objectContaining({ field: 'nhsNumber' }),
          expect.objectContaining({ field: 'previousAddress' }),
          expect.objectContaining({ field: 'language' }),
          expect.objectContaining({ field: 'typeOfCare' }),
          expect.objectContaining({ field: 'careLevel' }),
        ]),
      },
    });
  });

  it('submits a complete draft', async () => {
    db.residentPreAdmission.findFirst.mockResolvedValue(row(completeParts));
    const out = await service.submit('r1', user);
    expect(out.status).toBe('Submitted');
    expect(audit.emitClinicalDoc).toHaveBeenCalledWith(
      expect.objectContaining({ actionType: 'PRE_ADMISSION_SUBMITTED' }),
    );
  });

  it('only decides on submitted versions', async () => {
    db.residentPreAdmission.findFirst.mockResolvedValue(row());
    await expect(
      service.decide(
        'r1',
        {
          decision: 'Accepted',
          rationale: 'ok',
          signedByName: 'A',
          signedRole: 'Manager',
        },
        user,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('accepting supersedes older accepted versions and refreshes the banner', async () => {
    db.residentPreAdmission.findFirst.mockResolvedValue(
      row({ ...completeParts, status: 'Submitted', versionNumber: 2 }),
    );
    await service.decide(
      'r1',
      {
        decision: 'Accepted',
        rationale: 'Can meet needs',
        signedByName: 'A. Mensah',
        signedRole: 'Registered Manager',
      },
      user,
    );
    expect(db.residentPreAdmission.updateMany).toHaveBeenCalledWith({
      where: { residentId: 'r1', status: 'Accepted', id: { not: 'p1' } },
      data: { status: 'Superseded' },
    });
    expect(db.resident.update).toHaveBeenCalledWith({
      where: { id: 'r1' },
      data: expect.objectContaining({
        allergySummary: 'Penicillin (rash)',
        dnacprStatus: 'NotDiscussed',
        nhsNumber: '9434765919',
      }),
    });
    expect(db.residentProfile.upsert).not.toHaveBeenCalled();
    expect(db.residentCareProfile.upsert).not.toHaveBeenCalled();
  });

  it('NeedsMoreInformation reopens the version as a draft', async () => {
    db.residentPreAdmission.findFirst.mockResolvedValue(
      row({ ...completeParts, status: 'Submitted' }),
    );
    const out = await service.decide(
      'r1',
      {
        decision: 'NeedsMoreInformation',
        rationale: 'Need LPA copy',
        signedByName: 'A',
        signedRole: 'Manager',
      },
      user,
    );
    expect(out.status).toBe('Draft');
    expect(db.residentPreAdmission.updateMany).not.toHaveBeenCalled();
  });

  it('scopes every lookup to the caller tenant', async () => {
    db.residentPreAdmission.findFirst.mockResolvedValue(row());
    await service.getCurrent('r1', user);
    expect(db.residentPreAdmission.findFirst).toHaveBeenCalledWith({
      where: { residentId: 'r1', tenantId: 't1', isCurrent: true },
    });
  });
});
