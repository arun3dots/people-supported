export interface DailyTaskItem {
  id: string;
  title: string;
  status: string;
  timeSlot?: string;
  priority?: string;
  scheduledDate?: string;
  notes?: string | null;
  skipReason?: string | null;
  completedAt?: string | null;
  assignedStaffId?: string | null;
  residentId: string;
  resident?: {
    id: string;
    fullName: string;
    photoUrl?: string | null;
    status?: string;
    bed?: {
      number?: string;
      bedLabel?: string;
      room?: {
        roomNumber?: string;
        name?: string;
        wingId?: string;
      };
    };
  };
  carePlanTask?: {
    category?: string;
    priority?: string;
    instructions?: string;
    precautions?: string;
    targetTime?: string;
    requirePhotoOrNote?: boolean;
    escalateIfSkipped?: boolean;
    goal?: {
      id: string;
      title: string;
    };
  };
  assignedStaff?: {
    id: string;
    fullName: string;
  } | null;
  completedBy?: {
    id: string;
    fullName: string;
  } | null;
}

export type ShiftFilter = "Day" | "Night";
export type TimeBucket = "Due now" | "Morning" | "Afternoon" | "Evening" | "Night";
export type TaskFilterType = "all" | "open" | "upcoming" | "done" | "missed" | "refused";
export type TaskStatusFilter = TaskFilterType;
