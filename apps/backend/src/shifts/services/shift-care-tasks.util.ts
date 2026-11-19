import { prisma } from '@repo/db';
import { getUkDayBoundaries } from '../../common/utils/time.util';

interface ShiftTimingsInput {
  rawStartTime: Date;
  rawEndTime: Date;
  startTime: string;
  endTime: string;
}

export interface MappedShiftCareTask {
  id: string;
  residentId: string;
  residentName: string;
  residentPhotoUrl: string | null;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  time: string;
  scheduledTimeStr: string;
  timingStatus: string;
}

const runsOnDate = (rec: unknown, dateStr: string): boolean => {
  if (!rec || typeof rec !== 'object') return true;
  const r = rec as { type?: string; days?: number[] };
  if (!r.type || r.type === 'daily') return true;
  if (Array.isArray(r.days)) {
    const dayOfWeek = new Date(`${dateStr}T12:00:00Z`).getUTCDay();
    return r.days.includes(dayOfWeek);
  }
  return true;
};

const isTaskInShiftWindow = (
  taskTime: string,
  taskShift: string,
  startTimeStr: string,
  endTimeStr: string,
  shiftTypeName?: string,
): boolean => {
  const startParts = startTimeStr.split(':').map(Number);
  const endParts = endTimeStr.split(':').map(Number);
  const startMin = startParts[0] * 60 + startParts[1];
  const endMin = endParts[0] * 60 + endParts[1];
  const isOvernight = startMin > endMin;
  const isNight =
    isOvernight || shiftTypeName?.toLowerCase().includes('night');

  const timeMatch = taskTime.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (timeMatch) {
    const taskMin =
      parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10);
    if (!isOvernight) {
      return taskMin >= startMin && taskMin <= endMin;
    }
    return taskMin >= startMin || taskMin <= endMin;
  }

  // If flexible/unspecified timing, match by shift period
  if (isNight) {
    return taskShift.toLowerCase() === 'night';
  }
  return taskShift.toLowerCase() !== 'night';
};

export async function loadShiftCareTasks(
  tenantId: string,
  residentIdsList: string[],
  timings: ShiftTimingsInput,
  userRole?: string,
  shiftTypeName?: string,
): Promise<MappedShiftCareTask[]> {
  if (residentIdsList.length === 0) return [];

  const { start: taskDayStart, end: taskDayEnd, ukDateStr } =
    getUkDayBoundaries(timings.rawStartTime);

  const careTasks = await prisma.residentCareTask.findMany({
    where: {
      tenantId,
      residentId: { in: residentIdsList },
      isActive: true,
      // Tasks go live once the plan has been agreed at least once (CQC safety requirement).
      carePlan: { isCurrent: true, agreedAt: { not: null } },
      AND: [
        { OR: [{ startsOn: null }, { startsOn: { lte: taskDayEnd } }] },
        { OR: [{ endsOn: null }, { endsOn: { gte: taskDayStart } }] },
      ],
    },
    include: {
      carePlan: { select: { id: true, area: true } },
      resident: { select: { id: true, fullName: true, photoUrl: true } },
    },
  });

  const normalizedRole = userRole?.toLowerCase();
  const eligibleCareTasks = careTasks.filter((t) => {
    // 1. Recurrence check for this day of week
    if (!runsOnDate(t.recurrence, ukDateStr)) return false;

    // 2. Role-based check (Carers see Carer tasks, Nurses see Nurse tasks, Admins/Managers see all)
    if (normalizedRole === 'carer' && t.role !== 'Carer') return false;
    if (normalizedRole === 'nurse' && t.role !== 'Nurse') return false;

    // 3. Shift timing window check
    return isTaskInShiftWindow(
      t.time || '',
      t.shift || 'Day',
      timings.startTime,
      timings.endTime,
      shiftTypeName,
    );
  });

  if (eligibleCareTasks.length === 0) return [];

  const dayDate = new Date(`${ukDateStr}T00:00:00.000Z`);
  const records = await prisma.residentCareTaskRecord.findMany({
    where: {
      tenantId,
      taskId: { in: eligibleCareTasks.map((t) => t.id) },
      date: dayDate,
      undoneAt: null,
    },
  });
  const recordByTaskId = new Map(records.map((r) => [r.taskId, r]));

  return eligibleCareTasks.map((t) => {
    const rec = recordByTaskId.get(t.id);
    const isCompleted = rec?.outcome === 'Done';
    const isDeclined = rec?.outcome === 'Declined';
    const status = isCompleted ? 'Completed' : isDeclined ? 'Declined' : 'Pending';

    return {
      id: t.id,
      residentId: t.residentId,
      residentName: t.resident?.fullName || 'Resident',
      residentPhotoUrl: t.resident?.photoUrl || null,
      title: t.title,
      description: t.description || null,
      category: t.carePlan?.area || 'Care Plan',
      priority: 'Medium',
      status,
      time: t.time || (t.shift ? `${t.shift} Routine` : 'Scheduled'),
      scheduledTimeStr: t.time || (t.shift ? `${t.shift} Routine` : 'Scheduled'),
      timingStatus: isCompleted ? 'Completed' : 'Due Today',
    };
  });
}

