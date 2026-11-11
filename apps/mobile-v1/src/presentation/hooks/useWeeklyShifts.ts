import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GET_MY_SHIFTS } from '@repo/endpoints';
import { makeMobileApiCall } from '../../data/api/client';
import { safeLogger } from '../../data/security/safeLogger';
import { ShiftInfo, mapApiShift } from './shiftDashboard.utils';
import { formatUkDate, getUkDateString } from '../../lib/date';

export interface WeeklyShiftDay {
  date: Date;
  dateIso: string;
  dayName: string;
  dayNumber: number;
  monthName: string;
  isToday: boolean;
  shifts: ShiftInfo[];
  totalHours: number;
}

export function getMondayOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function getSundayOfWeek(monday: Date): Date {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

export function calculateShiftDurationHours(shift: ShiftInfo): number {
  if (!shift.rawStartTime || !shift.rawEndTime) return 0;
  const start = new Date(shift.rawStartTime).getTime();
  let end = new Date(shift.rawEndTime).getTime();
  if (isNaN(start) || isNaN(end)) return 0;
  if (end <= start) {
    end += 24 * 60 * 60 * 1000;
  }
  return Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10;
}

export function useWeeklyShifts(initialDate: Date = new Date()) {
  const [currentWeekMonday, setCurrentWeekMonday] = useState<Date>(() => getMondayOfWeek(initialDate));

  const sunday = useMemo(() => getSundayOfWeek(currentWeekMonday), [currentWeekMonday]);
  const mondayIso = useMemo(() => getUkDateString(currentWeekMonday, false), [currentWeekMonday]);
  const sundayIso = useMemo(() => getUkDateString(sunday, false), [sunday]);

  const queryKey = useMemo(
    () => ['my-weekly-shifts', mondayIso],
    [mondayIso]
  );

  const { data: shifts = [], isLoading, isFetching, error, refetch } = useQuery<ShiftInfo[]>({
    queryKey,
    queryFn: async () => {
      const listRes = await makeMobileApiCall<unknown[]>(
        GET_MY_SHIFTS,
        undefined,
        {
          from: `${mondayIso}T00:00:00.000Z`,
          to: `${sundayIso}T23:59:59.999Z`,
        }
      ).catch((err: unknown) => {
        safeLogger.error('[useWeeklyShifts] Failed to fetch shifts for week', err);
        return [];
      });

      if (!Array.isArray(listRes)) return [];

      return listRes
        .map((item) =>
          typeof item === 'object' && item !== null
            ? mapApiShift(item as Record<string, unknown>)
            : null
        )
        .filter(Boolean) as ShiftInfo[];
    },
  });

  const isCurrentWeek = useMemo(() => {
    const todayMonday = getMondayOfWeek(new Date());
    return getUkDateString(currentWeekMonday, false) === getUkDateString(todayMonday, false);
  }, [currentWeekMonday]);

  const weekRangeLabel = useMemo(() => {
    const startStr = formatUkDate(currentWeekMonday, { day: 'numeric', month: 'short' }, false);
    const endStr = formatUkDate(sunday, { day: 'numeric', month: 'short', year: 'numeric' }, false);
    return `${startStr} – ${endStr}`;
  }, [currentWeekMonday, sunday]);

  const days: WeeklyShiftDay[] = useMemo(() => {
    const todayIso = getUkDateString(new Date(), false);
    return [0, 1, 2, 3, 4, 5, 6].map((offset) => {
      const d = new Date(currentWeekMonday);
      d.setDate(currentWeekMonday.getDate() + offset);
      const dateIso = getUkDateString(d, false);
      const isToday = dateIso === todayIso;
      const dayName = new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(d);
      const dayNumber = d.getDate();
      const monthName = new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(d);

      const dayShifts = shifts.filter((s) => {
        if (!s.rawStartTime) return false;
        return getUkDateString(new Date(s.rawStartTime), true) === dateIso;
      });

      const dayTotalHours = dayShifts.reduce((acc, s) => acc + calculateShiftDurationHours(s), 0);

      return {
        date: d,
        dateIso,
        dayName,
        dayNumber,
        monthName,
        isToday,
        shifts: dayShifts,
        totalHours: Math.round(dayTotalHours * 10) / 10,
      };
    });
  }, [currentWeekMonday, shifts]);

  const totalWeeklyHours = useMemo(() => {
    const total = days.reduce((acc, day) => acc + day.totalHours, 0);
    return Math.round(total * 10) / 10;
  }, [days]);

  const totalWeeklyShifts = useMemo(() => {
    return days.reduce((acc, day) => acc + day.shifts.length, 0);
  }, [days]);

  const totalDaysOff = useMemo(() => {
    return days.filter((day) => day.shifts.length === 0).length;
  }, [days]);

  const goToPrevWeek = useCallback(() => {
    setCurrentWeekMonday((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentWeekMonday((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }, []);

  const goToThisWeek = useCallback(() => {
    setCurrentWeekMonday(getMondayOfWeek(new Date()));
  }, []);

  return {
    currentWeekMonday,
    sunday,
    weekRangeLabel,
    isCurrentWeek,
    days,
    shifts,
    totalWeeklyHours,
    totalWeeklyShifts,
    totalDaysOff,
    isLoading,
    isFetching,
    error,
    refetch,
    goToPrevWeek,
    goToNextWeek,
    goToThisWeek,
  };
}

