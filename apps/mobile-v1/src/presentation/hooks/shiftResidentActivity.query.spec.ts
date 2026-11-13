import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GET_RESIDENT_TIMELINE } from '@repo/endpoints';
import type { Resident } from '../../domain/entities/Resident';
import { makeMobileApiCall } from '../../data/api/client';
import {
  activityDisplayText,
  loadAssignedSupportActivity,
  residentSupportActivities,
} from './shiftResidentActivity.query';

jest.mock('../../data/api/client', () => ({ makeMobileApiCall: jest.fn() }));

describe('recent support activity', () => {
  const residentId = '11111111-1111-4111-8111-111111111111';
  const staffId = '22222222-2222-4222-8222-222222222222';
  const unknownId = '33333333-3333-4333-8333-333333333333';
  const resident: Resident = {
    id: residentId,
    fullName: 'Alex Tenant',
    roomNumber: '12',
    dateOfBirth: '',
    age: 40,
    gender: 'Not specified',
    status: 'Active',
    allergies: [],
    dnacpr: false,
    mustScore: 0,
    fluidTargetMl: 2000,
    riskRatings: { fallRisk: 'Low', pressureUlcerRisk: 'Low', chokingRisk: 'Low' },
  };
  const event = (eventType: string, extra: Record<string, unknown> = {}) => ({
    id: eventType,
    residentId,
    eventType,
    summary: 'An update',
    timestamp: '2026-11-13T10:00:00Z',
    carer: { id: staffId, fullName: 'Sam Carer' },
    ...extra,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows only medication and recorded task events for assigned residents', async () => {
    jest
      .mocked(makeMobileApiCall)
      .mockResolvedValue([
        event('RESIDENT_ADMITTED'),
        event('RISK_ASSESSMENT_UPDATED'),
        event('RESIDENT_RECORD_VIEWED'),
        event('OBSERVATION_RECORDED'),
        event('CARE_TASK_CREATED'),
        event('TASK_CARE', { status: 'Pending' }),
        event('MedicationNote'),
        event('MEDICATION_ADMINISTERED'),
        event('CARE_TASK_COMPLETED', { title: 'Daily support' }),
        event('TASK_CARE', { status: 'Skipped' }),
        event('MEDICATION_ADMINISTERED', { residentId: unknownId }),
      ]);

    const activities = await loadAssignedSupportActivity([resident], staffId, 'Sam Carer');

    expect(activities).toHaveLength(4);
    expect(activities.map((item) => item.activityKind)).toEqual([
      'medication',
      'medication',
      'task',
      'task',
    ]);
    expect(activities.every((item) => item.residentId === residentId)).toBe(true);
    expect(activities[0].title).toBe('Medication note');
    expect(makeMobileApiCall).toHaveBeenCalledTimes(1);
    expect(makeMobileApiCall).toHaveBeenCalledWith(GET_RESIDENT_TIMELINE, undefined, undefined, {
      id: residentId,
    });
  });

  it('replaces resident and staff UUIDs with names and hides unknown UUIDs', async () => {
    jest.mocked(makeMobileApiCall).mockResolvedValue([
      event('MedicationNote', {
        summary: `[Resident: ${residentId}] supported by ${staffId}. Reference ${unknownId}`,
      }),
    ]);
    const [activity] = await loadAssignedSupportActivity([resident], staffId, 'Sam Carer');
    expect(activity.summary).toContain('[Person Supported: Alex Tenant]');
    expect(activity.summary).toContain('Sam Carer');
    const visible = [
      activity.title,
      activity.summary,
      activity.residentName,
      activity.carer?.fullName,
    ].join(' ');
    expect(visible).not.toMatch(/[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}/i);
    expect(activityDisplayText(unknownId, new Map())).toBe('');
  });

  it('does not fetch a property directory when no residents are assigned', async () => {
    expect(await loadAssignedSupportActivity([], staffId)).toEqual([]);
    expect(makeMobileApiCall).not.toHaveBeenCalled();
  });

  it('reports a timeline failure instead of showing an empty successful feed', async () => {
    jest.mocked(makeMobileApiCall).mockRejectedValue(new Error('Connection failed'));
    await expect(loadAssignedSupportActivity([resident], staffId)).rejects.toThrow(
      'Connection failed',
    );
  });

  it('hides detail activity for residents outside the current assignment', () => {
    const timeline = [event('MedicationNote')];
    expect(residentSupportActivities(resident, timeline, [])).toEqual([]);
    expect(
      residentSupportActivities(resident, timeline, [{ id: unknownId, fullName: 'Other person' }]),
    ).toEqual([]);
  });

  it('shows only past medication and recorded task activity on resident details', () => {
    const activities = residentSupportActivities(
      resident,
      [
        event('RESIDENT_ADMITTED'),
        event('RISK_ASSESSMENT_CREATED'),
        event('OBSERVATION_RECORDED'),
        event('MedicationNote', { summary: `Update for ${residentId}` }),
        event('CARE_TASK_COMPLETED', { title: 'Daily support', timestamp: '2026-11-13T09:00:00Z' }),
        event('TASK_CARE', { status: 'Pending' }),
        event('MEDICATION_ADMINISTERED', { timestamp: '2026-11-13T11:00:00Z' }),
      ],
      [resident],
      new Date('2026-11-13T10:30:00Z').getTime(),
    );

    expect(activities.map((activity) => activity.eventType)).toEqual([
      'MedicationNote',
      'CARE_TASK_COMPLETED',
    ]);
    expect(activities[0].summary).toBe('Update for Alex Tenant');
  });
});
