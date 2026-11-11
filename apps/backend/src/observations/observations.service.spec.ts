import { NotFoundException } from '@nestjs/common';
import { ObservationsService } from './observations.service';
import { prisma } from '@repo/db';
import { calculateNEWS2Score } from '@repo/schema';
import type { NotificationsService } from '../notifications/notifications.service';

jest.mock('@repo/db', () => {
  const mockPrisma: Record<string, unknown> = {
    resident: {
      findFirst: jest.fn(),
    },
    observation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    careTimeline: {
      create: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  };
  mockPrisma.$transaction = jest.fn(
    (cb: (tx: Record<string, unknown>) => Promise<unknown>) => cb(mockPrisma),
  );
  return { prisma: mockPrisma };
});

describe('ObservationsService (D-07 Tenant Isolation, C-06 RCP NEWS2 & C-09 Pseudonymisation)', () => {
  let service: ObservationsService;
  let mockNotificationsService: { triggerAlert: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNotificationsService = {
      triggerAlert: jest.fn().mockResolvedValue(undefined),
    };
    service = new ObservationsService(
      mockNotificationsService as unknown as NotificationsService,
    );
  });

  describe('D-07: Tenant Isolation', () => {
    it('rejects findAllByResident when resident belongs to another tenant', async () => {
      (prisma.resident.findFirst as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        service.findAllByResident('res-other-tenant', 'tenant-a'),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.resident.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'res-other-tenant',
          tenantId: 'tenant-a',
          deletedAt: null,
        },
        select: { id: true },
      });
    });

    it('rejects findOne when observation resident belongs to another tenant', async () => {
      (prisma.observation.findFirst as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.findOne('obs-1', 'tenant-a')).rejects.toThrow(
        NotFoundException,
      );

      expect(prisma.observation.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'obs-1',
          resident: { tenantId: 'tenant-a' },
          deletedAt: null,
        },
      });
    });
  });

  describe('C-06: Royal College of Physicians (RCP) NEWS2 Scoring', () => {
    it('scores normal physiological baseline as 0', () => {
      const { score } = calculateNEWS2Score({
        residentId: 'res-1',
        respiration: 16,
        spo2: 97,
        spo2Scale: 1,
        airOrOxygen: 'Air',
        bpSystolic: 125,
        bpDiastolic: 80,
        pulse: 72,
        consciousness: 'Alert',
        temp: 36.8,
      });

      expect(score).toBe(0);
    });

    it('scores SpO2 Scale 2 hypercapnic respiratory failure on supplemental oxygen accurately', () => {
      // SpO2 97% on supplemental O2 under Scale 2 scores 3 points + 2 points for supplemental O2 = 5
      const { score, details } = calculateNEWS2Score({
        residentId: 'res-1',
        spo2: 97,
        spo2Scale: 2,
        airOrOxygen: 'Oxygen',
        consciousness: 'Alert',
      });

      expect(details.spo2).toBe(3);
      expect(details.airOrOxygen).toBe(2);
      expect(score).toBe(5);
    });

    it('triggers pseudonymised clinical push alert when NEWS2 >= 5 or single parameter == 3 (C-06 & C-09)', async () => {
      (prisma.resident.findFirst as jest.Mock).mockResolvedValueOnce({
        id: 'res-abcd1234',
        fullName: 'Margaret Thatcher',
        tenantId: 'tenant-a',
      });
      (prisma.observation.create as jest.Mock).mockResolvedValueOnce({
        id: 'obs-99',
        news2Score: 8,
      });
      (prisma.careTimeline.create as jest.Mock).mockResolvedValueOnce({});
      (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce({
        id: 'carer-1',
        fullName: 'Jane Carer',
      });
      (prisma.user.findMany as jest.Mock).mockResolvedValueOnce([
        { id: 'nurse-1' },
      ]);

      await service.create(
        {
          residentId: 'res-abcd1234',
          respiration: 26, // 3
          spo2: 90, // 3
          spo2Scale: 1,
          airOrOxygen: 'Oxygen', // 2
          bpSystolic: 120, // 0
          pulse: 80, // 0
          consciousness: 'Alert',
          temp: 36.8,
          isAbnormal: true,
          notifyGP: false,
          increaseMonitoring: true,
        },
        'carer-1',
        'tenant-a',
      );

      // Wait a microtask for async triggerRiskAlert
      await new Promise((resolve) => setImmediate(resolve));

      expect(mockNotificationsService.triggerAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-a',
          recipientId: 'nurse-1',
          priority: 'Urgent',
          message: expect.stringContaining('M.T. (#res-ab)'),
        }),
      );

      const alertCall = mockNotificationsService.triggerAlert.mock
        .calls[0][0] as {
        message: string;
      };
      // Verify full resident name is NOT leaked in push notification text (C-09)
      expect(alertCall.message).not.toContain('Margaret Thatcher');
    });
  });
});
