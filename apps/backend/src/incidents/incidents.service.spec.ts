import { Test, TestingModule } from '@nestjs/testing';
import { prisma } from '@repo/db';
import { IncidentsService } from './incidents.service';
import { DutyOfCandourService } from './services/duty-of-candour.service';
import { IncidentNotificationService } from './services/incident-notification.service';
import { IncidentMetricsService } from './services/incident-metrics.service';
import { S3StorageService } from '../storage/s3.service';
import { GcsService } from '../storage/gcs.service';

jest.mock('@repo/db', () => ({
  prisma: {
    incident: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    resident: {
      findFirst: jest.fn(),
    },
  },
  Prisma: {
    JsonNull: null,
  },
}));

describe('IncidentsService', () => {
  let service: IncidentsService;
  const evaluateComplianceFlags = jest.fn();
  const triggerIncidentAlert = jest.fn();

  beforeEach(async () => {
    evaluateComplianceFlags.mockReturnValue({
      dutyOfCandourApplicable: false,
      dutyOfCandourStatus: 'Not Required',
      writtenNoticeDueAt: null,
      cqcNotificationRequired: false,
    });
    triggerIncidentAlert.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentsService,
        {
          provide: DutyOfCandourService,
          useValue: { evaluateComplianceFlags },
        },
        {
          provide: IncidentNotificationService,
          useValue: { triggerIncidentAlert },
        },
        { provide: IncidentMetricsService, useValue: {} },
        { provide: S3StorageService, useValue: {} },
        { provide: GcsService, useValue: {} },
      ],
    }).compile();
    service = module.get<IncidentsService>(IncidentsService);
    (prisma.incident.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.incident.count as jest.Mock).mockResolvedValue(0);
    (prisma.incident.findFirst as jest.Mock).mockResolvedValue(null);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('scopes to a branch when branchId is set', async () => {
      await service.findAll('tenant-1', { branchId: 'branch-1' });

      const where = (prisma.incident.findMany as jest.Mock).mock.calls[0][0]
        .where;
      expect(where).toEqual(
        expect.objectContaining({
          tenantId: 'tenant-1',
          deletedAt: null,
          branchId: 'branch-1',
        }),
      );
    });

    it('does not branch-filter when branchId is absent', async () => {
      await service.findAll('tenant-1', {});

      const where = (prisma.incident.findMany as jest.Mock).mock.calls[0][0]
        .where;
      expect(where.branchId).toBeUndefined();
    });
  });

  describe('create', () => {
    const baseDto = {
      title: 'Slip in Lounge',
      category: 'Fall',
      incidentDate: '2026-01-10',
      incidentTime: '10:30',
      residentId: 'res-1',
      roomNumber: '104',
      harmLevel: 'Low Harm',
      severity: 'Low' as const,
      priority: 'Low' as const,
      location: 'Communal Lounge',
      immediateActions: ['First Aid Applied'],
      notes: 'Tenant assisted to chair.',
    };

    it('creates incident using resident branchId even when caller branchId is undefined', async () => {
      (prisma.resident.findFirst as jest.Mock).mockResolvedValue({
        branchId: 'branch-from-resident',
      });
      (prisma.incident.create as jest.Mock).mockResolvedValue({
        id: 'inc-1',
        incidentNumber: `INC-${new Date().getFullYear()}-0001`,
        branchId: 'branch-from-resident',
        residentId: 'res-1',
      });

      const created = await service.create(
        baseDto,
        'tenant-1',
        'user-1',
        undefined,
      );

      expect(created.id).toBe('inc-1');
      expect(prisma.resident.findFirst).toHaveBeenCalledWith({
        where: { id: 'res-1', tenantId: 'tenant-1' },
        select: { branchId: true },
      });
      expect(prisma.incident.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 'tenant-1',
            branchId: 'branch-from-resident',
            residentId: 'res-1',
            roomNumber: '104',
            bedNumber: null,
            title: 'Slip in Lounge',
            reportedById: 'user-1',
          }),
        }),
      );
    });

    it('throws ForbiddenException when neither residentId nor branchId is provided', async () => {
      await expect(
        service.create(
          { ...baseDto, residentId: undefined },
          'tenant-1',
          'user-1',
          undefined,
        ),
      ).rejects.toThrow('Branch scope missing');
    });
  });

  it('rejects updates to closed incidents', async () => {
    (prisma.incident.findFirst as jest.Mock).mockResolvedValue({
      id: 'incident-1',
      tenantId: 'tenant-1',
      status: 'Closed',
    });

    await expect(
      service.update(
        'incident-1',
        { managerNotes: 'Attempted edit', status: 'Under Review' },
        'tenant-1',
      ),
    ).rejects.toThrow('Closed incidents are read-only');
  });
});
