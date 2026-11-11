import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { prisma } from '@repo/db';
import { NotificationsService } from '../notifications/notifications.service';
import { formatPseudonymizedResident } from '../common/utils/pseudonymize.util';

interface TaskGroupItem {
  id: string;
  title: string;
  residentId: string;
  residentLabel: string;
  tenantId: string;
}

@Injectable()
export class TaskAlertWorker {
  private readonly logger = new Logger(TaskAlertWorker.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  private async getStaffForTask(tenantId: string, residentId: string) {
    const directStaff = await prisma.user.findMany({
      where: {
        tenantId,
        assignedResidents: { some: { id: residentId } },
        isActive: true,
      },
      select: { id: true },
    });

    const now = new Date();
    const activeShifts = await prisma.shiftAssignment.findMany({
      where: {
        shift: {
          tenantId,
          startTime: { lte: now },
          endTime: { gte: now },
        },
        assignedResidentIds: { has: residentId },
      },
      select: { userId: true },
    });

    const staffIds = new Set([
      ...directStaff.map((s) => s.id),
      ...activeShifts.map((s) => s.userId),
    ]);

    return Array.from(staffIds);
  }

  private async groupTasksByStaff(
    tasks: Array<{
      id: string;
      title: string;
      residentId: string;
      resident: { fullName: string; tenantId: string };
    }>,
  ) {
    const staffMap = new Map<
      string,
      { tenantId: string; tasks: TaskGroupItem[] }
    >();

    for (const task of tasks) {
      const staffIds = await this.getStaffForTask(
        task.resident.tenantId,
        task.residentId,
      );
      const resLabel = formatPseudonymizedResident(
        task.resident.fullName,
        task.residentId,
      );
      const item: TaskGroupItem = {
        id: task.id,
        title: task.title,
        residentId: task.residentId,
        residentLabel: resLabel,
        tenantId: task.resident.tenantId,
      };

      for (const staffId of staffIds) {
        const existing = staffMap.get(staffId);
        if (existing) {
          existing.tasks.push(item);
        } else {
          staffMap.set(staffId, {
            tenantId: task.resident.tenantId,
            tasks: [item],
          });
        }
      }
    }
    return staffMap;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkFiveMinutePreAlerts() {
    this.logger.debug('Running 5-minute pre-alert check...');
    const now = new Date();
    const targetTime = new Date(now.getTime() + 5 * 60 * 1000);
    targetTime.setSeconds(0, 0);
    const targetEnd = new Date(targetTime.getTime() + 59999);
    const timeKey = `${targetTime.getFullYear()}-${targetTime.getMonth() + 1}-${targetTime.getDate()}_${targetTime.getHours()}:${targetTime.getMinutes()}`;

    const pendingTasks = await prisma.dailyTask.findMany({
      where: {
        status: 'Pending',
        dueAt: { gte: targetTime, lte: targetEnd },
      },
      include: { resident: true },
    });

    if (pendingTasks.length === 0) return;
    const staffMap = await this.groupTasksByStaff(pendingTasks);

    for (const [staffId, group] of staffMap.entries()) {
      if (group.tasks.length === 1) {
        const single = group.tasks[0];
        await this.notificationsService.triggerAlert({
          tenantId: group.tenantId,
          recipientId: staffId,
          title: 'Upcoming Task (5 mins)',
          message: `${single.title} for ${single.residentLabel} starts in 5 minutes.`,
          category: 'TASK',
          priority: 'Medium',
          actionUrl: `/residents/${single.residentId}/tasks`,
          dedupeKey: `task-pre-${single.id}-${staffId}`,
          dedupeWindowHours: 1,
          metadata: { tag: 'care-tasks-pre', taskId: single.id },
        });
      } else {
        const count = group.tasks.length;
        const taskSummary = group.tasks
          .slice(0, 2)
          .map((t) => `${t.title} (${t.residentLabel})`)
          .join(', ');
        const extra = count > 2 ? ` and ${count - 2} more.` : '.';

        await this.notificationsService.triggerAlert({
          tenantId: group.tenantId,
          recipientId: staffId,
          title: `${count} Tasks Starting Soon (5 mins)`,
          message: `You have ${count} upcoming tasks in 5 minutes: ${taskSummary}${extra}`,
          category: 'TASK',
          priority: 'Medium',
          actionUrl: '/dashboard',
          dedupeKey: `tasks-pre-${timeKey}-${staffId}`,
          dedupeWindowHours: 1,
          metadata: {
            tag: 'care-tasks-pre',
            taskCount: count,
            taskIds: group.tasks.map((t) => t.id),
          },
        });
      }
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkExactTimeAlerts() {
    this.logger.debug('Running exact time alert check...');
    const now = new Date();
    now.setSeconds(0, 0);
    const targetEnd = new Date(now.getTime() + 59999);
    const timeKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}_${now.getHours()}:${now.getMinutes()}`;

    const pendingTasks = await prisma.dailyTask.findMany({
      where: {
        status: 'Pending',
        dueAt: { gte: now, lte: targetEnd },
      },
      include: { resident: true },
    });

    if (pendingTasks.length === 0) return;
    const staffMap = await this.groupTasksByStaff(pendingTasks);

    for (const [staffId, group] of staffMap.entries()) {
      if (group.tasks.length === 1) {
        const single = group.tasks[0];
        await this.notificationsService.triggerAlert({
          tenantId: group.tenantId,
          recipientId: staffId,
          title: 'Task Due Now',
          message: `${single.title} for ${single.residentLabel} is due right now.`,
          category: 'TASK',
          priority: 'High',
          actionUrl: `/residents/${single.residentId}/tasks`,
          preferPushOverEmail: true,
          dedupeKey: `task-due-${single.id}-${staffId}`,
          dedupeWindowHours: 1,
          metadata: { tag: 'care-tasks-due', taskId: single.id },
        });
      } else {
        const count = group.tasks.length;
        const taskSummary = group.tasks
          .slice(0, 2)
          .map((t) => `${t.title} (${t.residentLabel})`)
          .join(', ');
        const extra = count > 2 ? ` and ${count - 2} more.` : '.';

        await this.notificationsService.triggerAlert({
          tenantId: group.tenantId,
          recipientId: staffId,
          title: `${count} Tasks Due Now`,
          message: `You have ${count} tasks due now: ${taskSummary}${extra}`,
          category: 'TASK',
          priority: 'High',
          actionUrl: '/dashboard',
          preferPushOverEmail: true,
          dedupeKey: `tasks-due-${timeKey}-${staffId}`,
          dedupeWindowHours: 1,
          metadata: {
            tag: 'care-tasks-due',
            taskCount: count,
            taskIds: group.tasks.map((t) => t.id),
          },
        });
      }
    }
  }

  /**
   * Matrix MH-009: Observation check overdue
   * Trigger: Scheduled check-in time elapsed
   * Channel(s): Push, escalating on 2nd miss
   * Recipient(s): Assigned observer (1st miss @ 15m), then RM (2nd miss @ 30m/60m)
   * Priority: High (1st miss) -> Critical (2nd miss)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkMissedAndEscalationAlerts() {
    this.logger.debug(
      'Running observation/task missed & escalation check (MH-009)...',
    );
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const pendingTasks = await prisma.dailyTask.findMany({
      where: {
        status: 'Pending',
        dueAt: { lt: now, gte: oneHourAgo },
      },
      include: { resident: true, carePlanTask: true },
    });

    for (const task of pendingTasks) {
      const dueTime = task.dueAt || task.scheduledDate;
      const elapsedMins = Math.floor(
        (now.getTime() - dueTime.getTime()) / 60000,
      );

      const isFirstMiss = elapsedMins === 15;
      const isSecondMissEscalation = elapsedMins === 30 || elapsedMins === 60;

      if (!isFirstMiss && !isSecondMissEscalation) continue;

      const resLabel = formatPseudonymizedResident(
        task.resident.fullName,
        task.residentId,
      );
      const staffIds = await this.getStaffForTask(
        task.resident.tenantId,
        task.residentId,
      );

      if (isFirstMiss) {
        // 1st miss: notify assigned observer only (High priority Push)
        await this.notificationsService.triggerMatrixAlert('MH-009', {
          tenantId: task.resident.tenantId,
          branchId: task.resident.branchId,
          residentId: task.residentId,
          explicitRecipientIds: staffIds,
          onlyExplicitRecipients: true,
          priorityOverride: 'High',
          title: 'Observation / Check-In Overdue (1st Miss)',
          message: `${task.title} for ${resLabel} is ${elapsedMins} mins overdue. Please complete check-in immediately.`,
          actionUrl: `/residents/${task.residentId}/tasks`,
          dedupeKey: `task-miss1-${task.id}`,
          dedupeWindowHours: 1,
          metadata: {
            tag: 'care-tasks-overdue',
            taskId: task.id,
            elapsedMins,
            missCount: 1,
          },
        });
      } else if (isSecondMissEscalation) {
        // 2nd miss: Critical escalation to Assigned observer + Registered Manager (RM)
        await this.notificationsService.triggerMatrixAlert('MH-009', {
          tenantId: task.resident.tenantId,
          branchId: task.resident.branchId,
          residentId: task.residentId,
          explicitRecipientIds: staffIds,
          priorityOverride: 'Critical',
          title: 'CRITICAL ESCALATION: Observation Check Overdue (2nd Miss)',
          message: `${task.title} for ${resLabel} is ${elapsedMins} mins overdue (2nd miss). Escalated to Registered Manager.`,
          actionUrl: `/residents/${task.residentId}/tasks`,
          dedupeKey: `task-miss2-${task.id}-${elapsedMins}`,
          dedupeWindowHours: 1,
          metadata: {
            tag: 'care-tasks-overdue',
            taskId: task.id,
            elapsedMins,
            missCount: 2,
          },
        });
      }
    }
  }
}
