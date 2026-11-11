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
      update: jest.fn(),
    },
  },
}));

describe('IncidentsService.findAll', () => {
  let service: IncidentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentsService,
        { provide: DutyOfCandourService, useValue: {} },
        { provide: IncidentNotificationService, useValue: {} },
        { provide: IncidentMetricsService, useValue: {} },
        { provide: S3StorageService, useValue: {} },
        { provide: GcsService, useValue: {} },
      ],
    }).compile();
    service = module.get<IncidentsService>(IncidentsService);
    (prisma.incident.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.incident.count as jest.Mock).mockResolvedValue(0);
  });

  afterEach(() => jest.clearAllMocks());

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
