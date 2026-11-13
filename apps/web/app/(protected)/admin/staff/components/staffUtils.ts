import type { BadgeState } from "../../../../../lib/components/shared/tableColumns";
import type {
  PropertyItem,
  SchemeItem,
} from "../../../../../lib/types/facility";
import type { StaffMember } from "../../../../../lib/types/staff";

export interface ResolvedStaffLocation {
  schemeId: string | null;
  schemeName: string | null;
  propertyId: string | null;
  propertyName: string | null;
}

/**
 * Resolves initials from a staff member's full name.
 */
export function getStaffInitials(fullName?: string | null): string {
  if (!fullName?.trim()) return "ST";
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Maps a staff role name to a semantic @repo/ui Badge state.
 */
export function getStaffRoleBadgeState(roleName?: string | null): BadgeState {
  const lower = roleName?.toLowerCase() ?? "";
  if (lower.includes("nurse")) return "danger";
  if (lower.includes("night")) return "warning";
  if (
    lower.includes("admin") ||
    lower.includes("manager") ||
    lower.includes("senior") ||
    lower.includes("leader")
  ) {
    return "info";
  }
  return "success";
}

/**
 * Resolves scheme and property names for a staff member strictly from database records.
 */
export function resolveStaffLocation(
  staff: StaffMember,
  schemes: SchemeItem[] = [],
  properties: PropertyItem[] = [],
): ResolvedStaffLocation {
  const rawPropertyId = staff.propertyId ?? staff.assignedWings?.[0]?.id ?? null;
  const matchedProperty = rawPropertyId
    ? properties.find((p) => p.id === rawPropertyId)
    : undefined;

  const propertyId = matchedProperty?.id ?? rawPropertyId;
  const propertyName =
    matchedProperty?.name ??
    staff.property?.name ??
    staff.assignedWings?.[0]?.name ??
    null;

  const rawSchemeId =
    staff.schemeId ??
    staff.scheme?.id ??
    matchedProperty?.schemeId ??
    matchedProperty?.scheme?.id ??
    null;
  const matchedScheme = rawSchemeId
    ? schemes.find((s) => s.id === rawSchemeId)
    : undefined;

  const schemeId = matchedScheme?.id ?? rawSchemeId;
  const schemeName =
    matchedScheme?.name ??
    staff.scheme?.name ??
    matchedProperty?.scheme?.name ??
    null;

  return { schemeId, schemeName, propertyId, propertyName };
}
