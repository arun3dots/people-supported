import { NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/db';
import { ResidentEmergencyService } from './resident-emergency.service';
import {
  buildCareProviders,
  parseEmergencyContacts,
  parseGp,
} from './resident-emergency.mapper';

jest.mock('@repo/db', () => ({
  prisma: {
    shiftAssignment: { findMany: jest.fn() },
    resident: { findMany: jest.fn(), findFirst: jest.fn() },
  },
  decrypt: jest.fn((value: string) => value),
}));

const mockedPrisma = prisma as unknown as {
  shiftAssignment: { findMany: jest.Mock };
  resident: { findMany: jest.Mock; findFirst: jest.Mock };
};

const actor = {
  tenantId: 'tenant-1',
  userId: 'carer-1',
  userEmail: 'carer@example.com',
  userFullName: 'Carol Carer',
  roleName: 'Carer',
  ipAddress: '10.0.0.1',
  userAgent: 'jest',
};

function directoryResident(
  id: string,
  fullName: string,
  roomId: string,
  roomNumber: string,
) {
  return {
    id,
    fullName,
    dob: '1940-05-01',
    dnarStatus: false,
    status: 'Active',
    photoUrl: null,
    profile: { preferredName: null, gender: 'Female' },
    careProfile: {
      allergies: [],
      medicationAllergies: ['Penicillin'],
      foodAllergies: [],
      environmentalAllergies: [],
    },
    bed: {
      bedLabel: 'A',
      number: '1',
      roomId,
      room: { roomNumber, wing: { name: 'East' } },
    },
  };
}

describe('ResidentEmergencyService', () => {
  const auditService = {
    emitDataAccess: jest.fn().mockResolvedValue(undefined),
  };
  const service = new ResidentEmergencyService(auditService as never);

  beforeEach(() => {
    jest.clearAllMocks();
    mockedPrisma.shiftAssignment.findMany.mockResolvedValue([
      { assignedResidentIds: ['res-direct'], assignedRoomIds: ['room-7'] },
    ]);
  });

  describe('listDirectory', () => {
    it('returns every active resident, assigned (direct or by room) first', async () => {
      mockedPrisma.resident.findMany.mockResolvedValue([
        directoryResident('res-a', 'Alice Adams', 'room-1', '1'),
        directoryResident('res-direct', 'Zed Direct', 'room-9', '9'),
        directoryResident('res-room', 'Bob Roomie', 'room-7', '7'),
        directoryResident('res-b', 'Cara Brown', 'room-2', '2'),
      ]);

      const result = await service.listDirectory(
        'tenant-1',
        'carer-1',
        'branch-1',
      );

      expect(result.total).toBe(4);
      expect(result.assigned.map((r) => r.id)).toEqual([
        'res-room',
        'res-direct',
      ]);
      expect(result.others.map((r) => r.id)).toEqual(['res-a', 'res-b']);
      expect(result.assigned.every((r) => r.isAssigned)).toBe(true);
      expect(result.others.some((r) => r.isAssigned)).toBe(false);
      expect(result.others[0].hasAllergies).toBe(true);
    });

    it('scopes the query to the tenant, branch and active residents', async () => {
      mockedPrisma.resident.findMany.mockResolvedValue([]);

      await service.listDirectory('tenant-1', 'carer-1', 'branch-1');

      expect(mockedPrisma.resident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId: 'tenant-1',
            deletedAt: null,
            status: 'Active',
            branchId: 'branch-1',
          },
        }),
      );
    });
  });

  describe('getSummary', () => {
    const summaryResident = {
      id: 'res-a',
      fullName: 'Alice Adams',
      dob: '1940-05-01',
      nhsNumber: '943 476 5919',
      dnarStatus: true,
      status: 'Active',
      photoUrl: null,
      gpDetails: {
        gpName: 'Dr Who',
        practice: 'Tardis Surgery',
        phone: '0123',
      },
      nextOfKin: [{ name: 'Sam Adams', relation: 'Son', phone: '0777' }],
      profile: {
        preferredName: 'Ali',
        gender: 'Female',
        preferredLanguage: 'English',
        interpreterRequired: false,
      },
      careProfile: {
        primaryDiagnosis: 'Dementia',
        secondaryDiagnoses: [],
        chronicConditions: ['COPD'],
        allergies: [],
        medicationAllergies: ['Penicillin'],
        foodAllergies: ['Nuts'],
        environmentalAllergies: [],
        hospitalConsultant: 'Dr Heart',
        hospitalName: 'City Hospital',
      },
      bed: {
        bedLabel: 'A',
        number: '1',
        roomId: 'room-1',
        room: { roomNumber: '1', wing: { name: 'East' } },
      },
      observations: [],
      medicationPrescriptions: [
        {
          drugName: 'Aspirin',
          dose: '75mg',
          form: 'Tablet',
          times: ['20:00', '08:00'],
          instructions: null,
        },
      ],
      medicationRounds: [
        {
          drugName: 'Ramipril',
          dose: '5mg',
          form: 'Tablet',
          instructions: null,
          scheduledTime: new Date('2026-10-31T08:00:00Z'),
        },
        {
          drugName: 'Ramipril',
          dose: '5mg',
          form: 'Tablet',
          instructions: null,
          scheduledTime: new Date('2026-11-01T08:00:00Z'),
        },
      ],
    };

    it('writes a RESIDENT_EMERGENCY_VIEWED audit event for the viewer and resident', async () => {
      mockedPrisma.resident.findFirst.mockResolvedValue(summaryResident);

      await service.getSummary('res-a', 'tenant-1', 'branch-1', actor);

      expect(auditService.emitDataAccess).toHaveBeenCalledTimes(1);
      expect(auditService.emitDataAccess).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'carer-1',
          tenantId: 'tenant-1',
          userRoleName: 'Carer',
          actionType: 'RESIDENT_EMERGENCY_VIEWED',
          entityType: 'Resident',
          entityId: 'res-a',
          residentId: 'res-a',
          entityLabel: 'Alice Adams',
          ipAddress: '10.0.0.1',
          metadata: {
            accessMode: 'EMERGENCY_DIRECTORY',
            isAssignedResident: false,
          },
        }),
      );
    });

    it('does not audit or return anything when the resident is outside the tenant/branch', async () => {
      mockedPrisma.resident.findFirst.mockResolvedValue(null);

      await expect(
        service.getSummary('other', 'tenant-1', 'branch-1', actor),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(auditService.emitDataAccess).not.toHaveBeenCalled();
      expect(mockedPrisma.resident.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'other',
            tenantId: 'tenant-1',
            deletedAt: null,
            branchId: 'branch-1',
          },
        }),
      );
    });

    it('builds a read-only summary and collapses legacy rounds into one medication line', async () => {
      mockedPrisma.resident.findFirst.mockResolvedValue(summaryResident);

      const summary = await service.getSummary(
        'res-a',
        'tenant-1',
        undefined,
        actor,
      );

      expect(summary.dnacpr).toBe(true);
      expect(summary.nhsNumber).toBe('943 476 5919');
      expect(summary.allergies).toEqual({
        medication: ['Penicillin'],
        food: ['Nuts'],
        other: [],
      });
      expect(summary.emergencyContacts).toEqual([
        {
          name: 'Sam Adams',
          relationship: 'Son',
          phone: '0777',
          isPrimary: true,
        },
      ]);
      expect(summary.gp).toEqual({
        name: 'Dr Who',
        practice: 'Tardis Surgery',
        phone: '0123',
      });
      expect(summary.medications.map((m) => m.drugName)).toEqual([
        'Aspirin',
        'Ramipril',
      ]);
      expect(summary.medications[0].times).toEqual(['08:00', '20:00']);
      expect(summary.latestObservation).toBeNull();
    });
  });
});

describe('resident-emergency mapper', () => {
  it('ignores malformed contacts and accepts both contact shapes', () => {
    expect(parseEmergencyContacts('nope')).toEqual([]);
    expect(
      parseEmergencyContacts([
        { name: 'A', relationship: 'Wife', phone: '1' },
        { phone: 'no name' },
        { name: 'B', relation: 'Son' },
      ]),
    ).toEqual([
      { name: 'A', relationship: 'Wife', phone: '1', isPrimary: true },
      { name: 'B', relationship: 'Son', phone: null, isPrimary: false },
    ]);
  });

  it('returns null when there is no GP information', () => {
    expect(parseGp({ name: '  ' })).toBeNull();
    expect(parseGp(null)).toBeNull();
  });

  it('only lists care providers that have details', () => {
    expect(buildCareProviders({ communityNursePhone: '0300' })).toEqual([
      { role: 'Community nurse', name: null, phone: '0300' },
    ]);
    expect(buildCareProviders(null)).toEqual([]);
  });
});
