import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  GET_ACTIVE_SHIFT,
  GET_MY_SHIFTS,
  GET_SHIFT_DETAILS,
  GET_RESIDENTS,
  GET_NOTIFICATIONS,
} from '@repo/endpoints';
import { makeMobileApiCall } from '../../data/api/client';
import { loadShiftDashboard } from './shiftDashboard.query';

jest.mock('../../data/api/client', () => ({ makeMobileApiCall: jest.fn() }));
jest.mock('../../data/security/safeLogger', () => ({ safeLogger: { warn: jest.fn() } }));

describe('mobile staff assignment scope', () => {
  let failDirectory = false;

  beforeEach(() => {
    jest.clearAllMocks();
    failDirectory = false;
    const api = makeMobileApiCall as jest.MockedFunction<(key: string) => Promise<unknown>>;
    api.mockImplementation(async (key) => {
      if (key === GET_ACTIVE_SHIFT)
        return {
          active: {
            id: 'shift-1',
            name: 'Day',
            startTime: '2100-11-13T08:00:00Z',
            endTime: '2100-11-13T20:00:00Z',
            isStarted: true,
          },
          next: null,
        };
      if (key === GET_MY_SHIFTS || key === GET_NOTIFICATIONS) return [];
      if (key === GET_SHIFT_DETAILS)
        return {
          assignedResidents: [
            { id: 'person-1', fullName: 'Assigned person' },
            { id: 'person-2', fullName: 'Assigned to another staff member' },
          ],
        };
      if (key === GET_RESIDENTS) {
        if (failDirectory) throw new Error('Directory unavailable');
        return { data: [{ id: 'person-1', fullName: 'Assigned person' }] };
      }
      throw new Error('Unexpected endpoint');
    });
  });

  it('limits the dashboard and activity source to the logged-in staff assignments', async () => {
    const result = await loadShiftDashboard();
    expect(result.assignedResidents.map((person) => person.id)).toEqual(['person-1']);
    expect(makeMobileApiCall).toHaveBeenCalledWith(GET_RESIDENTS, undefined, {
      all: true,
      assignedOnly: true,
      shiftId: 'shift-1',
    });
  });

  it('does not fall back to everyone on the shift if staff assignment lookup fails', async () => {
    failDirectory = true;
    await expect(loadShiftDashboard()).rejects.toThrow('Directory unavailable');
  });

  it('keeps an unended Started shift active past scheduled endTime when no continuous shift follows', async () => {
    const api = makeMobileApiCall as jest.MockedFunction<(key: string) => Promise<unknown>>;
    api.mockImplementation(async (key) => {
      if (key === GET_ACTIVE_SHIFT) {
        return {
          active: {
            id: 'shift-overrun',
            name: 'Day',
            startTime: '2026-10-29T07:00:00Z',
            endTime: '2026-10-29T15:00:00Z',
            isStarted: true,
            isContinuing: true,
            hasContinuousNextShift: false,
            timeRemainingStr: 'Continuing (+25m)',
          },
          next: null,
        };
      }
      if (key === GET_MY_SHIFTS || key === GET_NOTIFICATIONS) return [];
      if (key === GET_SHIFT_DETAILS) {
        return {
          assignedResidents: [{ id: 'person-1', fullName: 'Assigned person' }],
          timeRemainingStr: 'Continuing (+25m)',
          isContinuing: true,
        };
      }
      if (key === GET_RESIDENTS) {
        return { data: [{ id: 'person-1', fullName: 'Assigned person' }] };
      }
      throw new Error('Unexpected endpoint');
    });

    const result = await loadShiftDashboard();
    expect(result.shift).toEqual(
      expect.objectContaining({
        id: 'shift-overrun',
        isStarted: true,
        isContinuing: true,
        status: 'Continuing',
      }),
    );
    expect(result.shift?.timeRemainingStr).toMatch(/^Continuing \(/);
    expect(result.assignedResidents.map((r) => r.id)).toEqual(['person-1']);
  });

  it('transitions past endTime to the continuous follow-up shift when one starts within 30 minutes', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-29T15:05:00Z').getTime());
    try {
      const api = makeMobileApiCall as jest.MockedFunction<(key: string) => Promise<unknown>>;
      api.mockImplementation(async (key) => {
        if (key === GET_ACTIVE_SHIFT) {
          return {
            active: {
              id: 'shift-1',
              name: 'Early',
              startTime: '2026-10-29T07:00:00Z',
              endTime: '2026-10-29T15:00:00Z',
              isStarted: true,
            },
            next: {
              id: 'shift-2',
              name: 'Late',
              startTime: '2026-10-29T15:15:00Z',
              endTime: '2026-10-29T23:00:00Z',
              isStarted: false,
            },
          };
        }
        if (key === GET_MY_SHIFTS) {
          return [
            {
              id: 'shift-1',
              name: 'Early',
              startTime: '2026-10-29T07:00:00Z',
              endTime: '2026-10-29T15:00:00Z',
              isStarted: true,
            },
            {
              id: 'shift-2',
              name: 'Late',
              startTime: '2026-10-29T15:15:00Z',
              endTime: '2026-10-29T23:00:00Z',
              isStarted: false,
            },
          ];
        }
        if (key === GET_NOTIFICATIONS) return [];
        if (key === GET_SHIFT_DETAILS) {
          return {
            assignedResidents: [{ id: 'person-1', fullName: 'Assigned person' }],
          };
        }
        if (key === GET_RESIDENTS) {
          return { data: [{ id: 'person-1', fullName: 'Assigned person' }] };
        }
        throw new Error('Unexpected endpoint');
      });

      const result = await loadShiftDashboard();
      expect(result.shift).toEqual(
        expect.objectContaining({
          id: 'shift-2',
          isStarted: false,
          status: 'Scheduled',
        }),
      );
    } finally {
      jest.useRealTimers();
    }
  });
});
