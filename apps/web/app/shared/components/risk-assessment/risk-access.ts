const STAFF_ROLES_ALLOWED_TO_WRITE = new Set([
  "carer",
  "nurse",
  "manager",
  "admin",
  "superadmin",
]);

export function canCreateRiskAssessment(
  roleName: string | null | undefined,
  hasWritePermission: boolean | undefined,
  isDischarged: boolean = false,
): boolean {
  if (isDischarged) return false;
  return (
    hasWritePermission === true ||
    STAFF_ROLES_ALLOWED_TO_WRITE.has(roleName?.toLowerCase() ?? "")
  );
}
