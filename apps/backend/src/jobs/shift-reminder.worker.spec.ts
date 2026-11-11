import { Test, TestingModule } from '@nestjs/testing';
import { ShiftReminderWorker } from './shift-reminder.worker';
import { ShiftNotificationService } from '../shifts/services/shift-notification.service';
import { prisma } from '@repo/db';

jest.mock('@repo/db', () => ({
  prisma: {
    shift: {
      findMany: jest.fn(),
    },
    notification: {
      findFirst: jest.fn(),
    },
  },
}));

describe('ShiftReminderWorker', () => {
  let worker: ShiftReminderWorker;
  let mockNotificationService: {
    sendUpcomingReminderNotification: jest.Mock;
  };

  beforeEach(async () => {
    mockNotificationService = {
      sendUpcomingReminderNotification: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftReminderWorker,
        {
          provide: ShiftNotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    worker = module.get<ShiftReminderWorker>(ShiftReminderWorker);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('delivers 30-minute reminder for upcoming shifts when not already notified', async () => {
    const mockShift = {
      id: 'shift-10',
      startTime: new Date(Date.now() + 28 * 60 * 1000), // starts in 28 mins
      endTime: new Date(Date.now() + 10 * 60 * 60 * 1000),
      tenant: { name: 'Willow Home' },
      assignments: [
        {
          user: {
            id: 'carer-1',
            email: 'carer1@willow.com',
            fullName: 'Sarah Connor',
          },
        },
      ],
    };

    (prisma.shift.findMany as jest.Mock).mockResolvedValue([mockShift]);
    (prisma.notification.findFirst as jest.Mock).mockResolvedValue(null);

    await worker.runUpcomingShiftReminders();

    expect(
      mockNotificationService.sendUpcomingReminderNotification,
    ).toHaveBeenCalledTimes(1);
    expect(
      mockNotificationService.sendUpcomingReminderNotification,
    ).toHaveBeenCalledWith({
      user: mockShift.assignments[0].user,
      shift: mockShift,
      tenantName: 'Willow Home',
    });
  });

  it('skips sending reminder if notification was already delivered', async () => {
    const mockShift = {
      id: 'shift-10',
      startTime: new Date(Date.now() + 28 * 60 * 1000),
      assignments: [
        {
          user: {
            id: 'carer-1',
            email: 'carer1@willow.com',
            fullName: 'Sarah Connor',
          },
        },
      ],
    };

    (prisma.shift.findMany as jest.Mock).mockResolvedValue([mockShift]);
    // Already notified
    (prisma.notification.findFirst as jest.Mock).mockResolvedValue({
      id: 'existing-notif',
    });

    await worker.runUpcomingShiftReminders();

    expect(
      mockNotificationService.sendUpcomingReminderNotification,
    ).not.toHaveBeenCalled();
  });
});
