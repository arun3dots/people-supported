export type TaskHistoryStatus = 'Completed' | 'Over Due' | 'Pending';

export interface ResidentTaskHistoryItem {
  id: string;
  title: string;
  subtitle: string;
  taskType: 'medication' | 'observation' | 'fluid' | 'reposition' | 'nutrition';
  dateStr: string;
  assignedStaffName: string;
  assignedStaffAvatar?: string;
  status: TaskHistoryStatus;
}


