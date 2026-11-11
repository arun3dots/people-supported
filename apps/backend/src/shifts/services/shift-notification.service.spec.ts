import { Test, TestingModule } from '@nestjs/testing';
import { ShiftNotificationService } from './shift-notification.service';
import { MailService } from '../../common/mail/mail.service';
import { prisma } from '@repo/db';

jest.mock('@repo/db', () => ({
  prisma: {
    notification: {
      create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    },
  },
}));

describe('ShiftNotificationService', () => {
  let service: ShiftNotificationService;
  let mockMailService: { sendNotification: jest.Mock };

  beforeEach(async () => {
    mockMailService = {
      sendNotification: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftNotificationService,
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<ShiftNotificationService>(ShiftNotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendAssignmentNotification', () => {
    it('sends an email and creates in-app notification when shift is assigned', async () => {
      const target = {
        user: {
          id: 'user-1',
          email: 'carer@test.com',
          fullName: 'Jane Carer',
        },
        shift: {
          id: 'shift-1',
          startTime: new Date('2026-11-10T08:00:00Z'),
          endTime: new Date('2026-11-10T20:00:00Z'),
          type: { name: 'Day Shift' },
          wing: { name: 'Oak Wing' },
          tenantId: 'tenant-1',
          branchId: 'branch-1',
        },
        tenantName: 'Sunflower Care Home',
      };

      await service.sendAssignmentNotification(target);

      expect(mockMailService.sendNotification).toHaveBeenCalledTimes(1);
      expect(mockMailService.sendNotification).toHaveBeenCalledWith(
        'carer@test.com',
        expect.stringContaining('New Shift Assigned: Day Shift'),
        expect.stringContaining('Oak Wing'),
        expect.stringContaining('/carer/rota'),
      );

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recipientId: 'user-1',
          tenantId: 'tenant-1',
          category: 'ROTA',
          title: 'New Shift Assigned',
        }),
      });
    });

    it('gracefully handles user with no email', async () => {
      await service.sendAssignmentNotification({
        user: { id: 'user-2', email: '', fullName: 'No Email User' },
        shift: {
          id: 'shift-2',
          startTime: new Date(),
          endTime: new Date(),
        },
      });

      expect(mockMailService.sendNotification).not.toHaveBeenCalled();
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('sendShiftUpdatedNotification', () => {
    it('sends an email and creates in-app notification when shift is extended', async () => {
      const target = {
        user: {
          id: 'user-1',
          email: 'carer@test.com',
          fullName: 'Jane Carer',
        },
        shift: {
          id: 'shift-1',
          startTime: new Date('2026-11-10T08:00:00Z'),
          endTime: new Date('2026-11-10T22:00:00Z'),
          type: { name: 'Day Shift' },
          wing: { name: 'Oak Wing' },
          tenantId: 'tenant-1',
          branchId: 'branch-1',
        },
        previousEndTime: new Date('2026-11-10T20:00:00Z'),
        isExtended: true,
        tenantName: 'Sunflower Care Home',
      };

      await service.sendShiftUpdatedNotification(target);

      expect(mockMailService.sendNotification).toHaveBeenCalledTimes(1);
      expect(mockMailService.sendNotification).toHaveBeenCalledWith(
        'carer@test.com',
        expect.stringContaining('Shift Extended: Day Shift'),
        expect.stringContaining('extended from'),
        expect.stringContaining('/carer/rota'),
      );

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recipientId: 'user-1',
          tenantId: 'tenant-1',
          category: 'ROTA',
          title: 'Shift Extended',
        }),
      });
    });

    it('gracefully handles user with no email on shift update', async () => {
      await service.sendShiftUpdatedNotification({
        user: { id: 'user-2', email: '', fullName: 'No Email User' },
        shift: {
          id: 'shift-2',
          startTime: new Date(),
          endTime: new Date(),
        },
      });

      expect(mockMailService.sendNotification).not.toHaveBeenCalled();
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('sendUpcomingReminderNotification', () => {
    it('sends 30-minute reminder email and creates deduplication notification', async () => {
      const target = {
        user: {
          id: 'user-1',
          email: 'carer@test.com',
          fullName: 'Jane Carer',
        },
        shift: {
          id: 'shift-1',
          startTime: new Date('2026-11-10T08:00:00Z'),
          endTime: new Date('2026-11-10T20:00:00Z'),
          type: { name: 'Day Shift' },
          wing: { name: 'Oak Wing' },
          tenantId: 'tenant-1',
        },
        tenantName: 'Sunflower Care Home',
      };

      await service.sendUpcomingReminderNotification(target);

      expect(mockMailService.sendNotification).toHaveBeenCalledTimes(1);
      expect(mockMailService.sendNotification).toHaveBeenCalledWith(
        'carer@test.com',
        expect.stringContaining('Starts in 30 Minutes'),
        expect.stringContaining('Oak Wing'),
        expect.stringContaining('/carer/tasks'),
      );

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recipientId: 'user-1',
          title: 'Upcoming Shift in 30 Minutes',
          actionUrl: '/carer/rota?shiftId=shift-1&reminder=30min',
        }),
      });
    });
  });

  describe('sendShiftRequestDecisionNotification', () => {
    it('sends rejection email when a leave request is rejected', async () => {
      const target = {
        user: {
          id: 'user-1',
          email: 'carer@test.com',
          fullName: 'Jane Carer',
        },
        request: {
          id: 'req-1',
          type: 'Leave',
          status: 'Rejected',
          startTime: new Date('2026-11-15T08:00:00Z'),
          endTime: new Date('2026-11-16T20:00:00Z'),
          adminNotes: 'Insufficient staff coverage on that weekend',
        },
        tenantName: 'Sunflower Care Home',
      };

      await service.sendShiftRequestDecisionNotification(target);

      expect(mockMailService.sendNotification).toHaveBeenCalledTimes(1);
      expect(mockMailService.sendNotification).toHaveBeenCalledWith(
        'carer@test.com',
        expect.stringContaining('Leave Request Rejected'),
        expect.stringContaining('Insufficient staff coverage'),
        expect.stringContaining('/carer/rota'),
      );
    });

    it('gracefully handles user with no email on shift request decision', async () => {
      await service.sendShiftRequestDecisionNotification({
        user: { id: 'user-2', email: '', fullName: 'No Email User' },
        request: {
          id: 'req-2',
          type: 'Leave',
          status: 'Rejected',
          startTime: new Date(),
          endTime: new Date(),
        },
      });

      expect(mockMailService.sendNotification).not.toHaveBeenCalled();
    });
  });
});
