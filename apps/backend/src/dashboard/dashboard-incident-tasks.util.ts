import { prisma } from '@repo/db';

export interface AssignedIncidentTask {
  id: string;
  incidentId: string;
  incidentNumber: string;
  title: string;
  description?: string;
  priority: string;
  dueDate?: string;
  dueTime?: string;
  status: string;
  resident?: { id: string; fullName: string; photoUrl: string | null } | null;
  attachments?: unknown[];
}

export async function findAssignedIncidentTasks(
  carerId: string,
  tenantId: string,
): Promise<AssignedIncidentTask[]> {
  const user = await prisma.user.findUnique({
    where: { id: carerId },
    select: { fullName: true },
  });
  const carerFullName = user?.fullName;

  const incidents = await prisma.incident.findMany({
    where: {
      tenantId,
      deletedAt: null,
      status: { in: ['Open', 'Under Review'] },
    },
    select: {
      id: true,
      incidentNumber: true,
      title: true,
      resident: { select: { id: true, fullName: true, photoUrl: true } },
      tasks: true,
    },
  });

  const results: AssignedIncidentTask[] = [];

  for (const inc of incidents) {
    if (!Array.isArray(inc.tasks)) continue;
    for (const t of inc.tasks as Array<{
      id?: string;
      title?: string;
      description?: string;
      assignedToId?: string;
      assignedToName?: string;
      priority?: string;
      date?: string;
      time?: string;
      status?: string;
      attachments?: unknown[];
    }>) {
      if (!t || typeof t !== 'object') continue;
      const matchesCarer =
        (t.assignedToId && t.assignedToId === carerId) ||
        (carerFullName &&
          t.assignedToName &&
          t.assignedToName.toLowerCase() === carerFullName.toLowerCase());

      if (matchesCarer && t.id && t.title) {
        results.push({
          id: t.id,
          incidentId: inc.id,
          incidentNumber: inc.incidentNumber,
          title: t.title,
          description: t.description,
          priority: t.priority || 'Medium',
          dueDate: t.date,
          dueTime: t.time,
          status: t.status || 'Pending',
          resident: inc.resident,
          attachments: t.attachments || [],
        });
      }
    }
  }

  return results;
}
