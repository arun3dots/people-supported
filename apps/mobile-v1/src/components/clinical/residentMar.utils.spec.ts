import { describe, expect, it } from '@jest/globals';
import { mapRawRoundsToMarLists, filterScheduledByDate } from './residentMar.utils';

describe('MAR uses recorded medication data', () => {
  it('does not invent a dose, route, time, frequency or prescriber', () => {
    const result = mapRawRoundsToMarLists([{ id: 'round-1', drugName: 'Recorded medicine' }]);
    expect(result.scheduledList[0]).toMatchObject({
      dose: 'Not recorded',
      route: 'Not recorded',
      scheduledTime: 'Not recorded',
      frequency: 'Not recorded',
      prescribedBy: 'Not recorded',
      startDate: 'Not recorded',
      status: 'Not recorded',
      rawScheduledDate: null,
    });
    expect(filterScheduledByDate(result.scheduledList, 'today')).toEqual([]);
    expect(result.recentList).toEqual([]);
  });

  it('keeps refused and omitted outcomes distinct from medication given', () => {
    const result = mapRawRoundsToMarLists([
      {
        id: 'round-1',
        status: 'Administered',
        administrations: [
          { id: 'refused', status: 'Refused', administeredAt: '2026-11-13T10:00:00Z' },
          { id: 'omitted', status: 'Omitted', administeredAt: '2026-11-13T09:00:00Z' },
        ],
      },
    ]);
    expect(result.scheduledList[0]?.status).toBe('Refused');
    expect(result.recentList.map((record) => record.status)).toEqual(['Refused', 'Omitted']);
    expect(result.recentList.filter((record) => record.status === 'Given')).toHaveLength(0);
  });

  it('ignores superseded/deleted administrations and never invents a timestamp or author', () => {
    const result = mapRawRoundsToMarLists([
      {
        id: 'round-1',
        status: 'Pending',
        administrations: [
          {
            id: 'old',
            status: 'Given',
            administeredAt: '2026-11-13T09:00:00Z',
            isSuperseded: true,
          },
          {
            id: 'deleted',
            status: 'Given',
            administeredAt: '2026-11-13T09:00:00Z',
            deletedAt: '2026-11-13T10:00:00Z',
          },
          { id: 'undated', status: 'Given' },
          { id: 'actual', status: 'Omitted', administeredAt: '2026-11-13T11:00:00Z' },
        ],
      },
    ]);
    expect(result.recentList.map((record) => record.id)).toEqual(['actual']);
    expect(result.recentList[0]?.administeredBy).toBe('Not recorded');
  });
});
