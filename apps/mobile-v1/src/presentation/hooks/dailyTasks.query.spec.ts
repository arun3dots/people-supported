import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  GET_CARE_TASK_DAY,
  GET_CARER_SHIFT_TASKS,
  GET_CARER_ASSIGNED_RESIDENT_TASKS,
} from '@repo/endpoints';
import type { Resident } from '../../domain/entities/Resident';
import { makeMobileApiCall } from '../../data/api/client';
import { loadDailyTasks } from './dailyTasks.query';

jest.mock('../../data/api/client', () => ({ makeMobileApiCall: jest.fn() }));
jest.mock('../../data/security/safeLogger', () => ({ safeLogger: { warn: jest.fn() } }));

describe('assigned shift tasks used for dashboard progress', () => {
  const resident: Resident = {
    id: 'resident-1',
    fullName: 'Alex Tenant',
    roomNumber: '12',
    dateOfBirth: '',
    age: 40,
    gender: 'Not specified',
    status: 'Active',
    allergies: [],
    dnacpr: false,
    riskRatings: { fallRisk: 'Low', pressureUlcerRisk: 'Low', chokingRisk: 'Low' },
    mustScore: 0,
    fluidTargetMl: 2000,
  };
  let completed = false;
  let failCareTasks = false;

  beforeEach(() => {
    completed = false;
    failCareTasks = false;
    const mockApi = makeMobileApiCall as jest.MockedFunction<(endpoint: string) => Promise<unknown>>;
    mockApi.mockImplementation(async (endpoint) => {
      if (endpoint === GET_CARE_TASK_DAY) {
        if (failCareTasks) throw new Error('Connection failed');
        return {
          residentId: resident.id,
          date: '2026-11-13',
          shift: 'Day',
          items: [
            {
              taskId: 'care-1',
              title: 'Daily support',
              description: '',
              time: '',
              role: 'Carer',
              carePlan: { id: 'plan-1', area: 'Daily living' },
              status: completed ? 'Done' : 'Pending',
            },
            {
              taskId: 'care-2',
              title: 'Declined support',
              description: '',
              time: '',
              role: 'Carer',
              carePlan: { id: 'plan-1', area: 'Daily living' },
              status: 'Declined',
            },
            {
              taskId: 'nurse-1',
              title: 'Nursing task',
              description: '',
              time: '',
              role: 'Nurse',
              carePlan: { id: 'plan-1', area: 'Daily living' },
              status: 'Pending',
            },
          ],
        };
      }
      if (endpoint === GET_CARER_SHIFT_TASKS || endpoint === GET_CARER_ASSIGNED_RESIDENT_TASKS) {
        return [
          {
            id: 'legacy-1',
            residentId: resident.id,
            title: 'Existing task',
            status: 'Completed',
            scheduledDate: '2026-11-13',
          },
        ];
      }
      throw new Error('Unexpected endpoint');
    });
  });

  it('includes care-plan tasks, deduplicates old tasks and excludes tasks for other roles', async () => {
    const tasks = await loadDailyTasks('2026-11-13', [resident], [resident.id], 'Day', 'Carer');
    expect(tasks).toHaveLength(3);
    expect(tasks.filter((task) => task.status === 'Completed')).toHaveLength(1);
    expect(tasks.find((task) => task.id === 'care-2')?.status).toBe('Skipped');
  });

  it('updates completed counts after care tasks are recorded and reloaded', async () => {
    const load = () => loadDailyTasks('2026-11-13', [resident], [resident.id], 'Day', 'Carer');
    expect((await load()).filter((task) => task.status === 'Completed')).toHaveLength(1);
    completed = true;
    expect((await load()).filter((task) => task.status === 'Completed')).toHaveLength(2);
  });

  it('reports a failure instead of presenting an incomplete count as accurate', async () => {
    failCareTasks = true;
    await expect(
      loadDailyTasks('2026-11-13', [resident], [resident.id], 'Day', 'Carer'),
    ).rejects.toThrow('Unable to load all assigned tasks');
  });
});
