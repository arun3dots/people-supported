export type BadgeState =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "inactive";

export function formatActivityLabel(actionType: string): string {
  if (!actionType) return "—";
  return actionType
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function getActivityBadgeState(actionType: string): BadgeState {
  switch (actionType?.toUpperCase()) {
    case "LOGIN":
    case "MFA_LOGIN":
    case "STAFF_LIST_VIEWED":
    case "STAFF_RECORD_VIEWED":
    case "RESIDENT_LIST_VIEWED":
    case "RESIDENT_RECORD_VIEWED":
    case "DOCUMENT_VIEWED":
    case "DOCUMENT_DOWNLOADED":
    case "PAGE_VIEW":
      return "info";
    case "CREATE":
    case "SELF_PROFILE_UPDATED":
      return "success";
    case "UPDATE":
    case "PASSWORD_CHANGED":
    case "PASSWORD_RESET":
    case "RESIDENT_EMERGENCY_VIEWED":
      return "warning";
    case "DELETE":
    case "FAILED_LOGIN":
      return "danger";
    default:
      return "inactive";
  }
}

export function getActivityBadgeLabel(actionType: string): string {
  switch (actionType?.toUpperCase()) {
    case "LOGIN":
    case "MFA_LOGIN":
      return "Auth";
    case "CREATE":
      return "Create";
    case "UPDATE":
      return "Update";
    case "DELETE":
      return "Delete";
    case "PAGE_VIEW":
      return "Page View";
    case "RESIDENT_EMERGENCY_VIEWED":
      return "Emergency Access";
    default:
      return formatActivityLabel(actionType);
  }
}
