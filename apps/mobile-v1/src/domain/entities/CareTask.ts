export type TaskCategory =
  | 'Repositioning'
  | 'Personal Care'
  | 'Hydration'
  | 'Nutrition'
  | 'Oral Care'
  | 'Vitals'
  | 'Safety Check';

export type TaskStatus = 'Pending' | 'Completed' | 'Skipped';

export interface CareTask {
  id: string;
  residentId: string;
  residentName: string;
  roomNumber: string;
  title: string;
  category: TaskCategory;
  description?: string;
  scheduledTime: string; // e.g. "14:00"
  status: TaskStatus;
  isOverdue: boolean;
  completedAt?: string | null;
  completedByStaffName?: string | null;
  skipReason?: string | null;
}
