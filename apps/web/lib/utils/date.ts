import { differenceInYears, differenceInMonths } from "date-fns";

/**
 * Calculates a human-readable age string (e.g., "1 year and 2 months")
 * based on the provided date of birth. Returns null if invalid or future date.
 */
export function calculateAgeDisplay(dobValue?: string | Date | null): string | null {
  if (!dobValue) return null;
  const dobDate = new Date(dobValue);
  const now = new Date();
  if (isNaN(dobDate.getTime())) return null;

  const years = differenceInYears(now, dobDate);
  const totalMonths = differenceInMonths(now, dobDate);
  const months = totalMonths % 12;

  if (years < 0 || totalMonths < 0) return null;

  if (years > 0) {
    return `${years} year${years !== 1 ? 's' : ''}${months > 0 ? ` and ${months} month${months !== 1 ? 's' : ''}` : ''
      }`;
  }
  return `${months} month${months !== 1 ? 's' : ''}`;
}

/**
 * Returns yesterday's date in YYYY-MM-DD format.
 * Useful for max date constraints on birth date inputs.
 */
export function getMaxDobDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split("T")[0];
}
