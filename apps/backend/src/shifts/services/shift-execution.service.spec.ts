import { prisma } from '@repo/db';
import { AuditService } from '../../audit/audit.service';
import { ShiftExecutionService } from './shift-execution.service';

jest.mock('@repo/db', () => ({
  prisma: {
    shift: {
      findFirst: jest.fn(),
    },
    staffShiftLog: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((callback: (tx: typeof prisma) => unknown) =>
      Promise.resolve(callback(prisma)),
    ),
  },
}));

describe('ShiftExecutionService', () => {
  const mockAuditService = {
    emit: jest.fn().mockResolvedValue(undefined),
  } as unknown as AuditService;
  const service = new ShiftExecutionService(mockAuditService);
  const now = new Date('2026-10-29T15:00:00.000Z');

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now.getTime());
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('closes a preceding continuous shift log when clocking into the follow-up shift', async () => {
    const shift2 = {
      id: 'shift-2',
      tenantId: 'tenant-1',
      branchId: 'branch-1',
      status: 'Published',
      startTime: new Date('2026-10-29T15:00:00.000Z'),
      endTime: new Date('2026-10-29T23:00:00.000Z'),
      type: { name: 'Late' },
    };
    const priorContinuousLog = {
      id: 'log-1',
      shiftId: 'shift-1',
      handoverNotes: null,
      shift: {
        id: 'shift-1',
        startTime: new Date('2026-10-29T07:00:00.000Z'),
        endTime: new Date('2026-10-29T15:00:00.000Z'),
        status: 'Published',
        deletedAt: null,
      },
    };
    const nonContinuousPriorLog = {
      id: 'log-old',
      shiftId: 'shift-old',
      handoverNotes: null,
      shift: {
        id: 'shift-old',
        startTime: new Date('2026-10-28T07:00:00.000Z'),
        endTime: new Date('2026-10-28T15:00:00.000Z'),
        status: 'Published',
        deletedAt: null,
      },
    };

    (prisma.shift.findFirst as jest.Mock).mockResolvedValue(shift2);
    (prisma.staffShiftLog.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.staffShiftLog.findMany as jest.Mock).mockResolvedValue([
      priorContinuousLog,
      nonContinuousPriorLog,
    ]);
    (prisma.staffShiftLog.create as jest.Mock).mockResolvedValue({
      id: 'log-2',
      shiftId: 'shift-2',
      status: 'Started',
    });

    await service.startShiftLog('shift-2', 'tenant-1', 'user-1');

    expect(prisma.staffShiftLog.update).toHaveBeenCalledTimes(1);
    expect(prisma.staffShiftLog.update).toHaveBeenCalledWith({
      where: { id: 'log-1' },
      data: expect.objectContaining({
        status: 'Completed',
        actualEndTime: priorContinuousLog.shift.endTime,
      }),
    });
    expect(prisma.staffShiftLog.create).toHaveBeenCalled();
  });
});
