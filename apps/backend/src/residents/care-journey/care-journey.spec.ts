import {
  CreateCareTaskSchema,
  CreateNeedCarePlanSchema,
  normaliseToolResult,
  scoreAbbey,
  scoreMust,
  scoreWaterlow,
  shiftForTime,
} from '@repo/schema';
import {
  prisma,
  type PrismaTransactionClient,
  type ResidentAssessment,
  type ResidentCareTask,
  type ResidentNeedCarePlan,
} from '@repo/db';
import type { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../common/interfaces/request.interface';
import type { ResidentAccessService } from '../services/resident-access.service';
import { CareTaskService } from './care-task.service';
import { NeedCarePlanService } from './need-care-plan.service';
import {
  asDate,
  assertCarePlanDraft,
  runsOn,
  syncDraftAssessmentNeed,
} from './care-task.util';

describe('assessment scoring', () => {
  it('scores MUST from its three components, capped at 6', () => {
    expect(scoreMust({}).rating).toBe('low');
    expect(
      scoreMust({ bmiScore: 1, weightLossScore: 0, acuteScore: 0 }),
    ).toMatchObject({ score: 1, rating: 'med' });
    expect(
      scoreMust({ bmiScore: 2, weightLossScore: 2, acuteScore: 2 }),
    ).toMatchObject({ score: 6, rating: 'high' });
  });

  it('bands Waterlow and Abbey scores', () => {
    expect(scoreWaterlow(9).rating).toBe('low');
    expect(scoreWaterlow(10).rating).toBe('med');
    expect(scoreWaterlow(20).label).toBe('Very high');
    expect(scoreAbbey(2).label).toBe('No pain');
    expect(scoreAbbey(8).rating).toBe('med');
    expect(scoreAbbey(14).rating).toBe('high');
  });

  it('derives rating server-side regardless of what the client sent', () => {
    const result = normaliseToolResult({
      toolKey: 'waterlow',
      score: 22,
      label: 'Not at risk',
      rating: 'low',
      answers: {},
    } as Parameters<typeof normaliseToolResult>[0]);
    expect(result.rating).toBe('high');
    expect(result.label).toBe('Very high');
  });

  it('maps falls risk level to a rating', () => {
    const result = normaliseToolResult({
      toolKey: 'falls',
      label: 'High',
      answers: {},
    } as Parameters<typeof normaliseToolResult>[0]);
    expect(result.rating).toBe('high');
  });
});

describe('care task helpers', () => {
  it('only allows editing care plans that are still drafts', () => {
    expect(() =>
      assertCarePlanDraft({ status: 'Draft', agreedAt: null }),
    ).not.toThrow();
    expect(() =>
      assertCarePlanDraft({ status: 'Agreed', agreedAt: new Date() }),
    ).toThrow('Agreed care plans are read-only');
  });

  describe('care task definitions', () => {
    it('keeps inactive tasks available in the care plan editor', async () => {
      const task = {
        id: 'task-1',
        carePlanId: 'plan-1',
        stepIndex: null,
        title: 'Check mobility',
        description: null,
        shift: 'Day',
        time: '08:00',
        role: 'Carer',
        recurrence: { type: 'daily', days: [] },
        isActive: false,
        startsOn: null,
        endsOn: null,
        carePlan: {
          areaKey: 'mobility',
          area: 'Mobility and falls',
        },
      } as unknown as ResidentCareTask & {
        carePlan: Pick<ResidentNeedCarePlan, 'areaKey' | 'area'>;
      };
      const findMany = jest
        .spyOn(prisma.residentCareTask, 'findMany')
        .mockResolvedValue([task] as unknown as Awaited<
          ReturnType<typeof prisma.residentCareTask.findMany>
        >);
      const service = new CareTaskService(
        {
          assertCanAccessResident: jest.fn().mockResolvedValue(undefined),
        } as unknown as ResidentAccessService,
        {} as AuditService,
      );

      try {
        const definitions = await service.listDefinitions('resident-1', {
          tenantId: 'tenant-1',
          userId: 'user-1',
        } as AuthenticatedUser);

        expect(definitions).toMatchObject([{ id: 'task-1', isActive: false }]);
        expect(findMany).toHaveBeenCalledWith({
          where: {
            residentId: 'resident-1',
            tenantId: 'tenant-1',
            carePlan: { isCurrent: true },
          },
          include: { carePlan: true },
          orderBy: { time: 'asc' },
        });
      } finally {
        findMany.mockRestore();
      }
    });
  });

  it('splits shifts at 06:00 and 21:00', () => {
    expect(shiftForTime('06:00')).toBe('Day');
    expect(shiftForTime('20:59')).toBe('Day');
    expect(shiftForTime('21:00')).toBe('Night');
    expect(shiftForTime('02:30')).toBe('Night');
  });

  it('runs daily tasks every day and weekly tasks on listed weekdays', () => {
    // 2026-11-02 is a Monday (1)
    expect(runsOn(null, '2026-11-02')).toBe(true);
    expect(runsOn({ type: 'daily', days: [] }, '2026-11-02')).toBe(true);
    expect(runsOn({ type: 'weekly', days: [1, 4] }, '2026-11-02')).toBe(true);
    expect(runsOn({ type: 'weekly', days: [1, 4] }, '2026-11-03')).toBe(false);
  });

  it('parses ISO dates as UTC midnight', () => {
    expect(asDate('2026-11-02').toISOString()).toBe('2026-11-02T00:00:00.000Z');
  });

  it('allows shift-only care tasks with optional dates and rejects missing shift and time', () => {
    expect(
      CreateCareTaskSchema.parse({
        title: 'Morning assistance',
        shift: 'Day',
        startsOn: '2026-11-05',
        endsOn: '2026-11-20',
      }),
    ).toMatchObject({
      title: 'Morning assistance',
      shift: 'Day',
      startsOn: '2026-11-05',
      endsOn: '2026-11-20',
    });

    expect(() =>
      CreateCareTaskSchema.parse({
        title: 'Unscheduled task',
      }),
    ).toThrow('Select a shift or choose a task time');

    expect(() =>
      CreateCareTaskSchema.parse({
        title: 'Invalid dates',
        shift: 'Day',
        startsOn: '2026-11-20',
        endsOn: '2026-11-05',
      }),
    ).toThrow('End date cannot be before start date');
  });

  it('links a custom care plan to its saved assessment area', async () => {
    const customNeed = {
      areaKey: 'custom:123e4567-e89b-12d3-a456-426614174000',
      customAreaLabel: 'Oral health',
      supportLevel: null,
      found: 'Needs denture care',
      source: null,
      toolKey: null,
      becomesCarePlan: false,
    };
    const assessmentUpdate = jest.fn().mockResolvedValue({});
    const tx = {
      residentAssessment: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'assessment-1',
          status: 'Draft',
          needs: [customNeed],
        }),
        update: assessmentUpdate,
      },
    } as unknown as PrismaTransactionClient;
    const dto = CreateNeedCarePlanSchema.parse({
      areaKey: customNeed.areaKey,
      area: customNeed.customAreaLabel,
      content: { steps: [] },
    });

    await expect(
      syncDraftAssessmentNeed(tx, 'resident-1', 'tenant-1', dto, 'user-1'),
    ).resolves.toBe('assessment-1');
    expect(assessmentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          needs: [
            expect.objectContaining({
              ...customNeed,
              becomesCarePlan: true,
            }),
          ],
          updatedById: 'user-1',
        },
      }),
    );
  });

  it('rejects custom care plans without a matching assessment area', async () => {
    const tx = {
      residentAssessment: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'assessment-1',
          status: 'Draft',
          needs: [],
        }),
      },
    } as unknown as PrismaTransactionClient;
    const dto = CreateNeedCarePlanSchema.parse({
      areaKey: 'custom:123e4567-e89b-12d3-a456-426614174000',
      area: 'Oral health',
      content: { steps: [] },
    });

    await expect(
      syncDraftAssessmentNeed(tx, 'resident-1', 'tenant-1', dto, 'user-1'),
    ).rejects.toThrow('Custom care plan area was not found');
  });

  it('generates a care plan with the custom area label on assessment completion', async () => {
    const areaKey = 'custom:123e4567-e89b-12d3-a456-426614174000';
    const createPlan = jest.fn().mockResolvedValue({});
    const tx = {
      residentNeedCarePlan: {
        findMany: jest.fn().mockResolvedValue([]),
        create: createPlan,
      },
    } as unknown as PrismaTransactionClient;
    const service = new NeedCarePlanService(
      {} as ResidentAccessService,
      {} as AuditService,
    );

    await service.generateFromAssessment(
      tx,
      {
        id: 'assessment-1',
        residentId: 'resident-1',
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        needs: [
          {
            areaKey,
            customAreaLabel: 'Oral health',
            supportLevel: null,
            found: null,
            source: null,
            toolKey: null,
            becomesCarePlan: true,
          },
        ],
        tools: [],
      } as unknown as ResidentAssessment,
      { userId: 'user-1' } as AuthenticatedUser,
    );

    expect(createPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          areaKey,
          area: 'Oral health',
          assessmentId: 'assessment-1',
        }),
      }),
    );
  });
});
