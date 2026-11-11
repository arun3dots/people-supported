import { DailyTaskItem, TaskFilterType, TimeBucket } from "./types";

export function filterTasks(
  tasks: DailyTaskItem[],
  selectedResidentId: string,
  activeFilter: TaskFilterType,
): DailyTaskItem[] {
  return tasks.filter((t) => {
    if (selectedResidentId !== "all" && t.residentId !== selectedResidentId) {
      return false;
    }

    const s = (t.status || "Pending").toLowerCase();
    if (activeFilter === "open") {
      if (s !== "pending" && s !== "due" && s !== "inprogress") return false;
    } else if (activeFilter === "upcoming") {
      if (s !== "pending" && s !== "scheduled") return false;
    } else if (activeFilter === "done") {
      if (s !== "completed" && s !== "done") return false;
    } else if (activeFilter === "missed") {
      if (s !== "skipped" && s !== "missed") return false;
    } else if (activeFilter === "refused") {
      if (s !== "refused") return false;
    }

    return true;
  });
}

export function groupTasksByBucket(
  tasks: DailyTaskItem[],
  activeFilter: TaskFilterType,
): Array<{ bucket: TimeBucket; tasks: DailyTaskItem[] }> {
  const dueNowList: DailyTaskItem[] = [];
  const morningList: DailyTaskItem[] = [];
  const afternoonList: DailyTaskItem[] = [];
  const eveningList: DailyTaskItem[] = [];
  const nightList: DailyTaskItem[] = [];

  tasks.forEach((t) => {
    const s = (t.status || "").toLowerCase();
    const isDue = s === "pending" || s === "due" || s === "inprogress";

    if (isDue && activeFilter === "all") {
      dueNowList.push(t);
      return;
    }

    const slot = (t.timeSlot || "").toLowerCase();
    if (slot.includes("night")) {
      nightList.push(t);
    } else if (slot.includes("evening")) {
      eveningList.push(t);
    } else if (slot.includes("afternoon")) {
      afternoonList.push(t);
    } else {
      morningList.push(t);
    }
  });

  const groups: Array<{ bucket: TimeBucket; tasks: DailyTaskItem[] }> = [];
  if (dueNowList.length > 0) groups.push({ bucket: "Due now", tasks: dueNowList });
  if (morningList.length > 0) groups.push({ bucket: "Morning", tasks: morningList });
  if (afternoonList.length > 0) groups.push({ bucket: "Afternoon", tasks: afternoonList });
  if (eveningList.length > 0) groups.push({ bucket: "Evening", tasks: eveningList });
  if (nightList.length > 0) groups.push({ bucket: "Night", tasks: nightList });

  return groups;
}

