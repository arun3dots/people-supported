export interface CarePlanTaskItem {
  id: string;
  title: string;
  category?: string;
  priority?: string;
  instructions?: string;
  shiftSlot?: string;
  status?: string;
}

export interface CarePlanGoalRecord {
  id: string;
  title: string;
  category?: string;
  target?: string;
  status?: string;
  progressPercentage?: number;
  tasks?: Array<unknown>;
}

export interface CarePlanDetailResponse {
  id?: string;
  title?: string;
  description?: string;
  status?: string;
  reviewSchedule?: string;
  department?: string;
  goals?: CarePlanGoalRecord[];
  tasks?: CarePlanTaskItem[];
}

