import { Test, TestingModule } from '@nestjs/testing';
import { prisma, type RiskAssessment } from '@repo/db';
import {
  RiskAssessmentSyncService,
  resolveToolAndArea,
  mapLevelToRating,
} from './risk-assessment-sync.service';

jest.mock('@repo/db', () => ({
  prisma: {
    residentAssessment: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    resident: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    residentPreAdmission: {
      findFirst: jest.fn(),
    },
    riskAssessment: {
      findFirst: jest.fn(),
    },
  },
}));

describe('RiskAssessmentSyncService', () => {
  let service: RiskAssessmentSyncService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RiskAssessmentSyncService],
    }).compile();

    service = module.get<RiskAssessmentSyncService>(RiskAssessmentSyncService);
    jest.clearAllMocks();
  });

  describe('resolveToolAndArea', () => {
    it('maps Pressure Ulcer / Waterlow to waterlow / skin', () => {
      const match = resolveToolAndArea({
        title: 'Pressure Ulcer Risk',
        tool: 'Waterlow',
        category: 'Clinical',
      });
      expect(match).toEqual({ toolKey: 'waterlow', areaKey: 'skin' });
    });

    it('maps Fall Risk / Morse Fall Scale to falls / mobility', () => {
      const match = resolveToolAndArea({
        title: 'Fall Risk',
        tool: 'Morse Fall Scale',
        category: 'Safety',
      });
      expect(match).toEqual({ toolKey: 'falls', areaKey: 'mobility' });
    });

    it('maps MUST / Nutrition to must / nutrition', () => {
      const match = resolveToolAndArea({
        title: 'Nutrition / Hydration Risk',
        tool: 'MUST',
      });
      expect(match).toEqual({ toolKey: 'must', areaKey: 'nutrition' });
    });

    it('maps Medication / Pain to abbey / medicines', () => {
      const match = resolveToolAndArea({
        title: 'Medication Risk',
        tool: 'MAR Audit',
      });
      expect(match).toEqual({ toolKey: 'abbey', areaKey: 'medicines' });
    });

    it('maps Behaviour / Cognitive to abc / cognition', () => {
      const match = resolveToolAndArea({
        title: 'Behaviour / Cognitive Risk',
        tool: 'CMAI',
      });
      expect(match).toEqual({ toolKey: 'abc', areaKey: 'cognition' });
    });

    it('maps Mental Capacity & DoLS to dols / capacity', () => {
      const match = resolveToolAndArea({
        title: 'Mental Capacity & DoLS',
        tool: 'DoLS',
      });
      expect(match).toEqual({ toolKey: 'dols', areaKey: 'capacity' });
    });
  });

  describe('mapLevelToRating', () => {
    it('maps levels correctly', () => {
      expect(mapLevelToRating('High')).toBe('high');
      expect(mapLevelToRating('Extreme')).toBe('high');
      expect(mapLevelToRating('Medium')).toBe('med');
      expect(mapLevelToRating('Low')).toBe('low');
      expect(mapLevelToRating(null)).toBe('none');
    });
  });

  describe('syncRiskAssessment', () => {
    const mockRisk = {
      id: 'risk-1',
      tenantId: 'tenant-1',
      branchId: 'branch-1',
      residentId: 'resident-1',
      title: 'Fall Risk',
      tool: 'Morse Fall Scale',
      category: 'Safety',
      likelihood: 3,
      severity: 4,
      inherentScore: 12,
      inherentLevel: 'High',
      residualScore: 6,
      residualLevel: 'Medium',
      hazardDescription: 'History of frequent slips',
      status: 'Active',
      updatedAt: new Date(),
    } as unknown as RiskAssessment;

    it('updates existing ResidentAssessment with tools and needs JSONB', async () => {
      const existingAssessment = {
        id: 'ra-1',
        residentId: 'resident-1',
        tenantId: 'tenant-1',
        isCurrent: true,
        tools: [
          {
            toolKey: 'falls',
            score: null,
            label: null,
            rating: 'none',
            answers: {},
          },
        ],
        needs: [
          {
            areaKey: 'mobility',
            toolKey: null,
            found: null,
            source: 'Part D',
            becomesCarePlan: true,
          },
        ],
      };

      (prisma.residentAssessment.findFirst as jest.Mock).mockResolvedValue(
        existingAssessment,
      );
      (prisma.residentAssessment.update as jest.Mock).mockResolvedValue({
        id: 'ra-1',
      });
      (prisma.resident.update as jest.Mock).mockResolvedValue({
        id: 'resident-1',
      });

      await service.syncRiskAssessment(mockRisk);

      expect(prisma.residentAssessment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ra-1' },
          data: expect.objectContaining({
            tools: expect.arrayContaining([
              expect.objectContaining({
                toolKey: 'falls',
                score: 6,
                label: 'Medium',
                rating: 'med',
              }),
            ]),
            needs: expect.arrayContaining([
              expect.objectContaining({
                areaKey: 'mobility',
                toolKey: 'falls',
                found: expect.stringContaining('Fall Risk: Medium'),
                becomesCarePlan: true,
              }),
            ]),
          }),
        }),
      );

      expect(prisma.resident.update).toHaveBeenCalledWith({
        where: { id: 'resident-1' },
        data: { fallsRiskLevel: 'Medium' },
      });
    });

    it('creates ResidentAssessment if none exists and syncs risk tool', async () => {
      (prisma.residentAssessment.findFirst as jest.Mock).mockResolvedValue(
        null,
      );
      (prisma.residentPreAdmission.findFirst as jest.Mock).mockResolvedValue(
        null,
      );
      (prisma.residentAssessment.create as jest.Mock).mockResolvedValue({
        id: 'new-ra-1',
        residentId: 'resident-1',
        tools: [],
        needs: [],
      });
      (prisma.residentAssessment.update as jest.Mock).mockResolvedValue({
        id: 'new-ra-1',
      });
      (prisma.resident.update as jest.Mock).mockResolvedValue({
        id: 'resident-1',
      });

      await service.syncRiskAssessment(mockRisk);

      expect(prisma.residentAssessment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 'tenant-1',
            branchId: 'branch-1',
            residentId: 'resident-1',
            status: 'Draft',
          }),
        }),
      );
    });
  });
});
