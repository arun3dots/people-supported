import type { ResidentTaskHistoryItem, TaskHistoryStatus } from './residentTaskHistory.types';
import { formatUkDate } from '../../lib/date';

export function isCareNoteEvent(eventType?: string): boolean {
  return [
    'general',
    'medical',
    'nutrition',
    'behavioral',
    'behavioural',
    'medicationnote',
  ].includes((eventType ?? '').toLowerCase());
}

export function mapTaskHistory(records: Array<Record<string, unknown>>): ResidentTaskHistoryItem[] {
  return records.flatMap((record) => {
    const event = String(record.eventType ?? '').toUpperCase();
    if (!event.startsWith('TASK_') && !event.startsWith('CARE_TASK_')) return [];
    if (typeof record.id !== 'string') return [];
    const carer = record.carer as { fullName?: string } | null;
    const status: TaskHistoryStatus =
      record.status === 'Completed'
        ? 'Completed'
        : record.status === 'Skipped'
          ? 'Skipped'
          : record.status === 'Pending'
            ? 'Pending'
            : record.status === 'Overdue'
              ? 'Over Due'
              : 'Not recorded';
    return [
      {
        id: record.id,
        title: typeof record.title === 'string' ? record.title : 'Task activity',
        subtitle: typeof record.summary === 'string' ? record.summary : '',
        taskType: 'task' as const,
        dateStr:
          typeof record.timestamp === 'string' &&
          Number.isFinite(new Date(record.timestamp).getTime())
            ? formatUkDate(record.timestamp)
            : 'Date not recorded',
        assignedStaffName: carer?.fullName ?? 'Staff name not recorded',
        status,
      },
    ];
  });
}
