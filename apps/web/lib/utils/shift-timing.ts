import { getUkDateString, formatUkTime } from "./uk-date-time";

export interface ShiftClockInEligibility {
  canClockIn: boolean;
  isToday: boolean;
  isTimeReached: boolean;
  isStarted: boolean;
  isEnded: boolean;
  isDraft: boolean;
  reason?: string;
  formattedStartTime?: string;
  formattedEndTime?: string;
}

export function getShiftClockInEligibility(shift?: {
  startTime?: string | Date | null;
  endTime?: string | Date | null;
  isStarted?: boolean;
  status?: string | null;
} | null): ShiftClockInEligibility {
  if (!shift || !shift.startTime) {
    return {
      canClockIn: false,
      isToday: false,
      isTimeReached: false,
      isStarted: false,
      isEnded: false,
      isDraft: false,
      reason: "No shift scheduled for today.",
    };
  }

  const now = new Date();
  const startTime = new Date(shift.startTime);
  const endTime = shift.endTime ? new Date(shift.endTime) : null;

  if (isNaN(startTime.getTime())) {
    return {
      canClockIn: false,
      isToday: false,
      isTimeReached: false,
      isStarted: false,
      isEnded: false,
      isDraft: false,
      reason: "Invalid shift time.",
    };
  }

  const todayUkStr = getUkDateString(now);
  const shiftDateUkStr = getUkDateString(startTime);
  const isToday = shiftDateUkStr === todayUkStr;

  const isTimeReached = now.getTime() >= startTime.getTime();
  const isEnded = endTime && !isNaN(endTime.getTime()) ? now.getTime() > endTime.getTime() : false;
  const isStarted = Boolean(shift.isStarted);
  const isDraft = shift.status === "Draft";
  const formattedStartTime = formatUkTime(startTime);
  const formattedEndTime = endTime && !isNaN(endTime.getTime()) ? formatUkTime(endTime) : undefined;

  if (isDraft) {
    return {
      canClockIn: false,
      isToday,
      isTimeReached,
      isStarted,
      isEnded,
      isDraft,
      reason: "Shift is in draft status and has not been published yet.",
      formattedStartTime,
      formattedEndTime,
    };
  }

  if (!isToday) {
    return {
      canClockIn: false,
      isToday,
      isTimeReached,
      isStarted,
      isEnded,
      isDraft,
      reason: "Shift is not scheduled for today.",
      formattedStartTime,
      formattedEndTime,
    };
  }

  if (isStarted) {
    return {
      canClockIn: false,
      isToday,
      isTimeReached,
      isStarted,
      isEnded,
      isDraft,
      reason: "Shift has already started.",
      formattedStartTime,
      formattedEndTime,
    };
  }

  if (isEnded) {
    return {
      canClockIn: false,
      isToday,
      isTimeReached,
      isStarted,
      isEnded,
      isDraft,
      reason: "Shift has already ended.",
      formattedStartTime,
      formattedEndTime,
    };
  }

  if (!isTimeReached) {
    return {
      canClockIn: false,
      isToday,
      isTimeReached,
      isStarted,
      isEnded,
      isDraft,
      reason: `Clock in available at ${formattedStartTime}`,
      formattedStartTime,
      formattedEndTime,
    };
  }

  return {
    canClockIn: true,
    isToday,
    isTimeReached,
    isStarted,
    isEnded,
    isDraft,
    formattedStartTime,
    formattedEndTime,
  };
}

