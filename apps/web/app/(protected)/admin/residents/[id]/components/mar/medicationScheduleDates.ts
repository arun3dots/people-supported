import {
  createUkDateTime,
  getUkDayStart,
} from "../../../../../../../lib/utils/uk-date-time";

export function medicationDateToIso(date: string): string {
  return getUkDayStart(date).toISOString();
}

export function medicationDateTimeToIso(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    throw new Error("Please select a valid medication date and time.");
  }
  return createUkDateTime(value.slice(0, 10), value.slice(11)).toISOString();
}
