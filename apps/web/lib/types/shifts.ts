import { ShiftDTO, ShiftTypeDTO, ShiftAssignmentDTO } from "@repo/schema";

export interface ShiftType extends ShiftTypeDTO {
  id: string;
}

export interface Shift extends Omit<ShiftDTO, 'startTime' | 'endTime' | 'status'> {
  id: string;
  name?: string;
  wardName?: string;
  status?: string;
  isStarted?: boolean;
  isCompleted?: boolean;
  entityId?: string;
  entityType?: string;
  startTime: string | Date;
  endTime: string | Date;
  formattedStartTime?: string;
  formattedEndTime?: string;
  timingFormatted?: string;
  rawStartTime?: string | Date | null;
  rawEndTime?: string | Date | null;
  type?: ShiftType;
  wing?: {
    id: string;
    name: string;
  };
  unit?: {
    id: string;
    name: string;
  };
  assignments?: ShiftAssignment[];
  userIds?: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
  _quickUnassign?: boolean;
  location?: string | null;
  careType?: string | null;
  shiftWindow?: string | null;
  durationHours?: number | null;
  actualHoursWorked?: number | null;
  staffLogs?: Array<{
    id: string;
    userId: string;
    actualStartTime: string | Date;
    actualEndTime?: string | Date | null;
    status: string;
    tasksCompleted?: number;
    tasksTotal?: number;
    handoverNotes?: string | null;
  }>;
  currentLog?: {
    id?: string;
    actualStartTime?: string | Date | null;
    actualEndTime?: string | Date | null;
    status?: string;
  } | null;
}

export interface ShiftAssignment extends ShiftAssignmentDTO {
  id: string;
  assignedResidentIds?: string[];
  assignedRoomIds?: string[];
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface ShiftRequest {
  id: string;
  type: "Leave" | "Change" | "Cover";
  status: "Pending" | "Approved" | "Rejected";
  startTime: string;
  endTime: string;
  reason?: string | null;
  notes?: string | null;
  shiftId?: string | null;
  shift?: Shift | null;
  user?: {
    id: string;
    fullName: string;
    email: string;
    role?: {
      id: string;
      name: string;
    };
  };
  createdAt: string;
}
