export type TaskHistoryStatus = 'Completed' | 'Over Due' | 'Pending' | 'Skipped' | 'Not recorded';

export interface ResidentTaskHistoryItem {
  id: string;
  title: string;
  subtitle: string;
  taskType: 'task' | 'medication' | 'observation' | 'fluid' | 'reposition' | 'nutrition';
  dateStr: string;
  assignedStaffName: string;
  assignedStaffAvatar?: string;
  status: TaskHistoryStatus;
}


