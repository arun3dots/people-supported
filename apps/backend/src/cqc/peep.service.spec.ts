import { NotFoundException } from '@nestjs/common';
import { PeepService } from './peep.service';
import { prisma } from '@repo/db';

jest.mock('@repo/db', () => ({
  prisma: {
    resident: {
      findFirst: jest.fn(),
    },
    peepRecord: {
      upsert: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const mockAuditService = {
  emit: jest.fn().mockResolvedValue(undefined),
};

describe('PeepService (G-08 PEEP Evacuation Readiness)', () => {
  let service: PeepService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PeepService(mockAuditService as any);
  });

  it('should upsert PEEP record for existing resident', async () => {
    (prisma.resident.findFirst as jest.Mock).mockResolvedValue({
      id: 'res-1',
      fullName: 'Alice Smith',
    });
    (prisma.peepRecord.upsert as jest.Mock).mockResolvedValue({
      id: 'peep-1',
      residentId: 'res-1',
      evacuationMobility: 'AssistedWheelchair',
      staffAssistanceCount: 2,
    });

    const res = await service.upsertPeep(
      {
        residentId: 'res-1',
        evacuationMobility: 'AssistedWheelchair',
        daytimeLocation: 'Lounge',
        nighttimeLocation: 'Room 12',
        staffAssistanceCount: 2,
        equipmentNeeded: 'Evacuation sledge',
        hearingImpairment: false,
        visualImpairment: false,
        cognitiveImpairment: true,
        specificInstructions: 'Keep calm and explain each action clearly',
        nextReviewDue: new Date(Date.now() + 86400000 * 90).toISOString(),
      },
      'nurse-1',
      'ten-1',
    );

    expect(res.id).toBe('peep-1');
    expect(mockAuditService.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryType: 'CLINICAL_DOC',
        actionType: 'PEEP_UPDATED',
      }),
    );
  });

  it('should throw NotFoundException if resident not found', async () => {
    (prisma.resident.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.upsertPeep(
        {
          residentId: 'non-existent',
          evacuationMobility: 'Independent',
          staffAssistanceCount: 0,
          hearingImpairment: false,
          visualImpairment: false,
          cognitiveImpairment: false,
          nextReviewDue: new Date().toISOString(),
        },
        'nurse-1',
        'ten-1',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should retrieve PEEP by resident id', async () => {
    (prisma.peepRecord.findFirst as jest.Mock).mockResolvedValue({
      id: 'peep-1',
      residentId: 'res-1',
    });

    const res = await service.getByResident('res-1', 'ten-1');
    expect(res.id).toBe('peep-1');
  });
});
