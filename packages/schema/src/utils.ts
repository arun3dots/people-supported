/**
 * Calculates whole-years age from a date of birth string or Date object.
 * Returns null if missing, empty, or invalid.
 */
export function calculateAge(dob?: string | Date | null): number | null {
  if (!dob) return null;
  const birth = typeof dob === "string" ? new Date(dob) : dob;
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

/**
 * Validates whether a given string is a valid UUID v4 (or general UUID).
 */
export function isUuid(val?: string | null): boolean {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    val,
  );
}

/**
 * Extracts uppercase initials from a full name (e.g. "Sarah Higgins" -> "SH").
 */
export function getInitials(name?: string | null, fallback = "DL"): string {
  if (!name || typeof name !== "string") return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return (parts[0]?.[0] || fallback).toUpperCase();
  return `${parts[0]?.[0] || ""}${parts[parts.length - 1]?.[0] || ""}`.toUpperCase();
}

