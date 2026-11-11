import { Test, TestingModule } from '@nestjs/testing';
import { prisma } from '@repo/db';
import { EnquiriesService } from './enquiries.service';

jest.mock('@repo/db', () => ({
  prisma: {
    enquiry: { findMany: jest.fn(), count: jest.fn() },
  },
}));

describe('EnquiriesService.findAll', () => {
  let service: EnquiriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EnquiriesService],
    }).compile();
    service = module.get<EnquiriesService>(EnquiriesService);
    (prisma.enquiry.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.enquiry.count as jest.Mock).mockResolvedValue(0);
  });

  afterEach(() => jest.clearAllMocks());

  it('scopes to a branch when branchId is set', async () => {
    await service.findAll('tenant-1', { branchId: 'branch-1' });

    const where = (prisma.enquiry.findMany as jest.Mock).mock.calls[0][0].where;
    expect(where).toEqual(
      expect.objectContaining({ tenantId: 'tenant-1', branchId: 'branch-1' }),
    );
  });

  it('does not branch-filter when branchId is absent', async () => {
    await service.findAll('tenant-1', {});

    const where = (prisma.enquiry.findMany as jest.Mock).mock.calls[0][0].where;
    expect(where.branchId).toBeUndefined();
  });
});
