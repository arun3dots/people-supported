export function normalizeRoleName(name: string | null | undefined): string {
  return (name ?? "")
    .trim()
    .replace(/[\s_-]+/g, "")
    .toLowerCase();
}

export function isSelectableStaffRole(
  name: string | null | undefined,
): boolean {
  const normalizedName = normalizeRoleName(name);
  return (
    normalizedName !== "resident" &&
    normalizedName !== "residentrole" &&
    normalizedName !== "superadmin" &&
    normalizedName !== "superadminrole"
  );
}
