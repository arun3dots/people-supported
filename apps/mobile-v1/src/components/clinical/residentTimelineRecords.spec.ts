import { describe, expect, it } from '@jest/globals';
import { isCareNoteEvent, mapTaskHistory } from './residentTimelineRecords';
import { calculateFluidBalance } from '../../domain/clinical/fluid-balance';
import { isNetworkError, MobileNetworkError } from '../../data/api/errors';

describe('clinical records retain their meaning', () => {
  it('does not show admissions, risks, or task events as care notes', () => {
    expect(['General', 'Medical', 'MedicationNote'].every(isCareNoteEvent)).toBe(true);
    expect(
      ['RESIDENT_ADMITTED', 'RISK_ASSESSMENT_CREATED', 'TASK_COMPLETED'].some(isCareNoteEvent),
    ).toBe(false);
  });

  it('includes new support-task records and keeps declined tasks separate from overdue', () => {
    const result = mapTaskHistory([
      {
        id: 'new-record',
        eventType: 'CARE_TASK_DECLINED',
        title: 'Daily support',
        status: 'Skipped',
        timestamp: '2026-11-13T09:00:00Z',
      },
      { id: 'admission', eventType: 'RESIDENT_ADMITTED' },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'new-record', status: 'Skipped' });
  });

  it('does not infer hydration risk or target achievement without a recorded target', () => {
    expect(calculateFluidBalance([])).toMatchObject({
      dailyTargetMl: null,
      percentageCompleted: null,
      remainingMl: null,
      isDehydratedRisk: false,
      statusLabel: 'Clinical target not recorded',
    });
  });

  it('allows only transport failures into offline queue handling', () => {
    expect(isNetworkError(new MobileNetworkError())).toBe(true);
    expect(isNetworkError(new Error('Forbidden'))).toBe(false);
    expect(isNetworkError(new Error('Validation failed'))).toBe(false);
  });
});
