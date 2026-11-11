import { GET_CARE_TASK_DAY } from '@repo/endpoints';
import type { CareTaskDayDTO } from '@repo/schema';
import type { Resident } from '../../domain/entities/Resident';
import { makeMobileApiCall } from '../../data/api/client';
import { safeLogger } from '../../data/security/safeLogger';
import { mapCareTaskToMobile, type MobileTaskItem } from './dailyTasks.utils';

export async function loadAgreedCareTasks(
  residents: Resident[],
  residentIds: string[],
  date: string,
  shift: CareTaskDayDTO['shift'],
  roleName?: string,
): Promise<{ tasks: MobileTaskItem[]; failedRequests: number; requestCount: number }> {
  const residentsById = new Map(residents.map((resident) => [resident.id, resident]));
  const results = await Promise.allSettled(
    residentIds.map((residentId) =>
      makeMobileApiCall<CareTaskDayDTO>(
        GET_CARE_TASK_DAY,
        undefined,
        { date, shift },
        { id: residentId },
      ),
    ),
  );
  const tasks: MobileTaskItem[] = [];
  let failedRequests = 0;

  for (const result of results) {
    if (result.status === 'rejected') {
      failedRequests += 1;
      safeLogger.warn('Failed to fetch agreed care-plan tasks', result.reason);
      continue;
    }

    const resident = residentsById.get(result.value.residentId);
    if (!resident) continue;

    tasks.push(
      ...result.value.items
        .filter(
          (item) =>
            roleName?.toLowerCase() !== 'carer' || item.role === 'Carer',
        )
        .map((item) =>
          mapCareTaskToMobile(item, resident, result.value.date, result.value.shift),
        ),
    );
  }

  if (failedRequests > 0 && failedRequests < results.length) {
    safeLogger.warn(`Some agreed care-plan task requests failed for ${date}`);
  }

  return { tasks, failedRequests, requestCount: results.length };
}
