import type { AuditLog as AuditLogItem } from "../../../../../lib/queries/audit/useGetAuditLogsQuery";

export function getLogArea(log: AuditLogItem): string {
  const cat = (log.categoryType || "").toUpperCase();
  const act = (log.actionType || "").toUpperCase();

  if (
    act.includes("MEDICATION") ||
    cat === "MEDICATION" ||
    act.startsWith("DOSE_") ||
    act.includes("MAR_")
  ) {
    return "Medication";
  }
  if (act.includes("INCIDENT") || cat === "SAFEGUARDING" || act.includes("REFERRAL")) {
    return "Incident";
  }
  if (
    act.includes("CARE_PLAN") ||
    cat === "CARE_PLAN" ||
    [
      "SUBMITTED",
      "APPROVED",
      "REJECTED",
      "CHANGES_REQUESTED",
      "ACTIVATED",
      "EXPIRED",
      "SUPERSEDED",
    ].includes(act)
  ) {
    return "Care plan";
  }
  if (act.includes("RISK") || act.includes("HAZARD")) return "Risk";
  if (act.includes("OBSERVATION")) return "Observation";
  if (act.includes("BODY_MAP")) return "Body map";
  if (act.includes("HANDOVER")) return "Handover";
  if (act.includes("TASK")) return "Tasks";
  if (act.includes("CARE_NOTE") || act.includes("CARE_LOG")) return "Care log";
  if (
    act.includes("ASSESSMENT") ||
    act.includes("WATERLOW") ||
    act.includes("MUST") ||
    act.includes("MCA")
  ) {
    return "Assessment";
  }
  if (act.includes("SHIFT") || act.includes("ROTA")) return "Rota";
  if (
    cat === "STAFF_ACTIVITY" ||
    act.includes("STAFF") ||
    [
      "RTW_UPDATED",
      "DBS_UPDATED",
      "HEALTH_CLEARANCE_UPDATED",
      "COMPLIANCE_DOC_UPLOADED",
      "CERTIFICATION_CREATED",
      "IMMUNISATION_CREATED",
    ].includes(act)
  ) {
    return "Staff";
  }
  if (
    cat === "AUTH" ||
    cat === "DATA_ACCESS" ||
    cat === "PAGE_VIEW" ||
    [
      "LOGIN",
      "LOGOUT",
      "FAILED_LOGIN",
      "MFA_LOGIN",
      "PASSWORD_RESET",
      "PASSWORD_CHANGED",
      "PAGE_VIEW",
      "PAGE_VIEWED",
    ].includes(act)
  ) {
    return "Access";
  }

  if (cat && cat !== "LEGACY" && cat !== "SYSTEM") {
    return cat.charAt(0) + cat.slice(1).toLowerCase().replace(/_/g, " ");
  }
  return "System";
}
