import {
  GET_CARER_ASSIGNED_RESIDENT_TASKS,
  GET_CARER_SHIFT_TASKS,
} from '@repo/endpoints';
import type { CareTaskDayDTO } from '@repo/schema';
import { makeMobileApiCall } from '../../data/api/client';
import { safeLogger } from '../../data/security/safeLogger';
import type { Resident } from '../../domain/entities/Resident';
import { mapRawTaskToMobile, type MobileTaskItem, type RawDailyTask } from './dailyTasks.utils';
import { loadAgreedCareTasks } from './agreedCareTasks.utils';

export async function loadDailyTasks(
  date: string,
  assignedResidents: Resident[],
  assignedResidentIds: string[],
  shift: CareTaskDayDTO['shift'],
  roleName?: string,
): Promise<MobileTaskItem[]> {
  const [shiftTasksRes, assignedTasksRes] = await Promise.allSettled([
    makeMobileApiCall<RawDailyTask[]>(
      GET_CARER_SHIFT_TASKS,
      undefined,
      { date },
    ),
    makeMobileApiCall<RawDailyTask[]>(
      GET_CARER_ASSIGNED_RESIDENT_TASKS,
      undefined,
      { date },
    ),
  ]);
  const rawTasks: RawDailyTask[] = [];
  const seenIds = new Set<string>();

  const appendTasks = (items: unknown) => {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      if (item && item.id && !seenIds.has(item.id)) {
        seenIds.add(item.id);
        rawTasks.push(item as RawDailyTask);
      }
    }
  };

  if (shiftTasksRes.status === 'fulfilled') appendTasks(shiftTasksRes.value);
  if (assignedTasksRes.status === 'fulfilled') appendTasks(assignedTasksRes.value);

  const { tasks: careTasks, failedRequests } =
    await loadAgreedCareTasks(
      assignedResidents,
      assignedResidentIds,
      date,
      shift,
      roleName,
    );

  if (
    shiftTasksRes.status === 'rejected' ||
    assignedTasksRes.status === 'rejected' ||
    failedRequests > 0
  ) {
    safeLogger.warn(`Unable to load the complete assigned task list for ${date}`);
    throw new Error('Unable to load all assigned tasks. Please refresh to try again.');
  }

  return [...rawTasks.map(mapRawTaskToMobile), ...careTasks];
}
