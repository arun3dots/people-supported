import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/db';

/**
 * ResidentTimelineService aggregates resident care events and scheduled tasks.
 * It reuses CareTimeline as the single source of truth for all domain activity streams
 * (Medications, Observations, Body Map, Care Plan, Admissions, Notes, Food & Fluid),
 * combined with scheduled DailyTasks.
 */
@Injectable()
export class ResidentTimelineService {
  async getTimeline(residentId: string, tenantId: string) {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId },
      select: { id: true },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    const [careTimelines, dailyTasks] = await Promise.all([
      prisma.careTimeline.findMany({
        where: { residentId: resident.id, deletedAt: null },
        orderBy: { timestamp: 'desc' },
        include: {
          carer: {
            select: {
              fullName: true,
              role: { select: { name: true } },
            },
          },
        },
      }),
      prisma.dailyTask.findMany({
        where: { residentId: resident.id },
        orderBy: { scheduledDate: 'desc' },
        include: {
          completedBy: {
            select: {
              fullName: true,
              role: { select: { name: true } },
            },
          },
          carePlanTask: {
            select: {
              category: true,
              instructions: true,
              precautions: true,
            },
          },
        },
      }),
    ]);

    const mappedTasks = dailyTasks.map((t) => ({
      id: `task-${t.id}`,
      residentId: t.residentId,
      eventType: `TASK_${(t.category || 'CARE').toUpperCase().replace(/\s+/g, '_')}`,
      title: t.title,
      summary: t.description || t.title,
      notes: t.notes || t.description || '',
      category: t.category || 'Personal Care',
      status: t.status,
      timestamp: t.completedAt || t.dueAt || t.scheduledDate,
      instructions: t.instructions || t.carePlanTask?.instructions || null,
      precautions: t.precautions || t.carePlanTask?.precautions || null,
      skipReason: t.skipReason || null,
      carer: t.completedBy
        ? {
            fullName: t.completedBy.fullName,
            role: t.completedBy.role ? { name: t.completedBy.role.name } : null,
          }
        : null,
      isDailyTask: true,
    }));

    return [...careTimelines, ...mappedTasks].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }
}
