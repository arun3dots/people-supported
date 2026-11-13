import { GET_ACTIVE_SHIFT, GET_MY_SHIFTS, GET_SHIFT_DETAILS, GET_RESIDENTS } from '@repo/endpoints';
import { makeMobileApiCall } from '../../data/api/client';
import type { Resident } from '../../domain/entities/Resident';
import { safeLogger } from '../../data/security/safeLogger';
import { getUkDateString } from '../../lib/date';
import { loadDashboardAlerts, type DashboardAlert } from './dashboardAlerts.query';
import {
  type ShiftInfo,
  type ShiftDetailsApiResponse,
  isContinuousNextShift,
  isShiftPast,
  mapApiShift,
  mapAssignedResidents,
  resolveAssignedResidents,
  normalizeShiftTimeRemaining,
} from './shiftDashboard.utils';

export interface ShiftDashboardData {
  shift: ShiftInfo | null;
  upcomingShift: ShiftInfo | null;
  shiftList: ShiftInfo[];
  assignedResidents: Resident[];
  urgentAlerts: DashboardAlert[];
}

export async function loadShiftDashboard(): Promise<ShiftDashboardData> {
  // 1.1 Fetch active & next shift
  const activeRes = await makeMobileApiCall<{
    active: Record<string, unknown> | null;
    next: Record<string, unknown> | null;
    lastCompleted?: Record<string, unknown> | null;
  }>(GET_ACTIVE_SHIFT);

  // 1.2 Fetch shift list for staff member
  const listRes = await makeMobileApiCall<Record<string, unknown>[]>(GET_MY_SHIFTS);

  const mappedList: ShiftInfo[] = Array.isArray(listRes)
    ? (listRes.map(mapApiShift).filter(Boolean) as ShiftInfo[])
    : [];

  let currentShift: ShiftInfo | null = null;
  let nextShift: ShiftInfo | null = null;

  if (activeRes?.next) {
    const mappedNext = mapApiShift(activeRes.next);
    if (mappedNext && !isShiftPast(mappedNext)) {
      nextShift = mappedNext;
    }
  }

  const hasContinuousFollowUp = (target: ShiftInfo): boolean =>
    Boolean(
      target.hasContinuousNextShift ||
        (nextShift && isContinuousNextShift(target, nextShift)) ||
        mappedList.some((candidate) => isContinuousNextShift(target, candidate)),
    );

  if (activeRes?.active) {
    const mappedActive = mapApiShift(activeRes.active);
    if (mappedActive) {
      const isPast = isShiftPast(mappedActive);
      const hasContinuousNext = hasContinuousFollowUp(mappedActive);
      if (!isPast) {
        currentShift = {
          ...mappedActive,
          hasContinuousNextShift: hasContinuousNext,
        };
      } else if (
        mappedActive.isStarted &&
        !mappedActive.isCompleted &&
        !hasContinuousNext
      ) {
        currentShift = {
          ...mappedActive,
          hasContinuousNextShift: false,
          isContinuing: true,
          status: 'Continuing',
        };
      }
    }
  }

  if (!currentShift) {
    const continuingInList = mappedList.find(
      (s) => s.isStarted && !s.isCompleted && !hasContinuousFollowUp(s),
    );
    if (continuingInList) {
      currentShift = {
        ...continuingInList,
        hasContinuousNextShift: false,
        isContinuing: isShiftPast(continuingInList),
      };
    }
  }

  if (!currentShift) {
    const todayStr = getUkDateString(new Date());
    const lastCompletedShift = activeRes?.lastCompleted
      ? mapApiShift(activeRes.lastCompleted)
      : null;
    const isLastCompletedToday = lastCompletedShift?.rawStartTime
      ? getUkDateString(lastCompletedShift.rawStartTime) === todayStr
      : false;

    if (isLastCompletedToday && lastCompletedShift) {
      currentShift = lastCompletedShift;
    } else {
      const completedToday = mappedList.find((s) => {
        if (!s.isCompleted && s.status !== 'Completed') return false;
        return s.rawStartTime ? getUkDateString(s.rawStartTime) === todayStr : false;
      });

      if (completedToday) {
        currentShift = completedToday;
      } else if (nextShift && !isShiftPast(nextShift)) {
        currentShift = nextShift;
      } else {
        const upcomingInList = mappedList.find((s) => {
          if (s.isCompleted || s.status === 'Completed') return false;
          return !isShiftPast(s);
        });
        currentShift = upcomingInList || null;
      }
    }
  }

  let assignedResidents: Resident[] = [];

  // 1.3 Fetch comprehensive details for current shift from API
  if (currentShift?.id) {
    try {
      const details = await makeMobileApiCall<ShiftDetailsApiResponse>(
        GET_SHIFT_DETAILS,
        undefined,
        undefined,
        { id: currentShift.id },
      );

      if (details) {
        assignedResidents = mapAssignedResidents(details.assignedResidents);
        const mergedHasContinuous = Boolean(
          currentShift.hasContinuousNextShift || details.hasContinuousNextShift,
        );
        const isContinuing = Boolean(
          currentShift.isStarted &&
            !currentShift.isCompleted &&
            (currentShift.isContinuing ||
              details.isContinuing ||
              (isShiftPast(currentShift) && !mergedHasContinuous)),
        );
        currentShift = {
          ...currentShift,
          wardName: details.wardName || currentShift.wardName,
          tasksCompleted: currentShift.isCompleted
            ? currentShift.tasksCompleted
            : (details.tasksCompleted ?? currentShift.tasksCompleted),
          tasksTotal: currentShift.isCompleted
            ? currentShift.tasksTotal
            : (details.tasksTotal ?? currentShift.tasksTotal),
          incidentCount: details.incidentCount ?? currentShift.incidentCount,
          shiftNotes: details.shiftNotes ?? details.notes ?? currentShift.shiftNotes ?? null,
          isContinuing,
          hasContinuousNextShift: mergedHasContinuous,
          timeRemainingStr: normalizeShiftTimeRemaining(
            details.timeRemainingStr ?? currentShift.timeRemainingStr,
            Boolean(currentShift.isStarted),
            Boolean(currentShift.isCompleted),
            { isContinuing, shift: currentShift },
          ),
          handoverNotes: details.handoverNotes ?? null,
          previousShiftHandovers: details.previousShiftHandovers ?? [],
          previousShiftHandover:
            details.previousShiftHandover ?? currentShift.previousShiftHandover,
          nextShiftName: details.nextShift?.name ?? currentShift.nextShiftName,
          nextShiftStartTime: details.nextShift?.startTime ?? currentShift.nextShiftStartTime,
          nextShiftHandoverPerson:
            details.nextShift?.handoverPerson ?? currentShift.nextShiftHandoverPerson,
        };

        // Resolve the logged-in staff member's assignment for every mobile role.
        if (assignedResidents.length > 0) {
          const residentParams = { all: true, assignedOnly: true, shiftId: currentShift.id };
          const resList = await makeMobileApiCall<
            { data?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>
          >(GET_RESIDENTS, undefined, residentParams);
          assignedResidents = resolveAssignedResidents(assignedResidents, resList, true);
        }
      }
    } catch (err) {
      safeLogger.warn(`Failed to fetch shift details for ${currentShift.id}`, err);
      throw err;
    }
  }

  const urgentAlerts = await loadDashboardAlerts();

  return {
    shift: currentShift,
    upcomingShift:
      nextShift && !isShiftPast(nextShift)
        ? nextShift
        : currentShift &&
            !currentShift.isStarted &&
            !currentShift.isCompleted &&
            !isShiftPast(currentShift)
          ? currentShift
          : null,
    shiftList: mappedList,
    assignedResidents,
    urgentAlerts,
  };
}
