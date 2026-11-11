"use client";

import { TasksStep } from "../../../../../resident/care-journey/tasks/TasksStep";

interface ResidentRecordTasksProps {
  residentId: string;
}

/** The care task list for a shift, shown inside the resident record. */
export function ResidentRecordTasks({ residentId }: ResidentRecordTasksProps) {
  return (
    <TasksStep residentId={residentId} onBack={() => undefined} showNav={false} />
  );
}
