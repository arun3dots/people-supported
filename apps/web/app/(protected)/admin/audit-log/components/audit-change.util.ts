import type { AuditLog as AuditLogItem } from "../../../../../lib/queries/audit/useGetAuditLogsQuery";
import { formatActivityLabel } from "./audit-badge.util";
import { getLogArea } from "./audit-area.util";
import { sanitizePagePathOrName } from "./audit-formatters.util";
import { getLogResident } from "./audit-resident.util";

export function getLogChange(log: AuditLogItem): string {
  const meta = (log.metadata || {}) as Record<string, unknown>;
  const residentName = getLogResident(log);
  const fallbackLabel = residentName !== "—" ? residentName : undefined;

  if (typeof meta.description === "string" && meta.description) {
    return sanitizePagePathOrName(meta.description, fallbackLabel);
  }
  const descCandidate = (log as unknown as { description?: string }).description;
  if (typeof descCandidate === "string" && descCandidate) {
    return sanitizePagePathOrName(descCandidate, fallbackLabel);
  }

  const act = (log.actionType || "").toUpperCase();
  const area = getLogArea(log);

  if (area === "Medication") {
    const drug =
      (meta.drugName as string) || (log.entityLabel as string) || "Medication";
    const dose = (meta.dose as string) || "";
    const isCd = meta.isControlledDrug || meta.witnessName;
    const prefix = isCd ? "CD administered" : "Medication administered";
    if (act === "DOSE_GIVEN" || act === "MEDICATION_ADMINISTERED") {
      return `${prefix}: ${drug}${dose ? ` ${dose}` : ""}`;
    }
    if (act === "DOSE_MISSED") return `Dose missed: ${drug}${dose ? ` ${dose}` : ""}`;
    if (act === "DOSE_REFUSED") return `Dose refused: ${drug}${dose ? ` ${dose}` : ""}`;
    if (act === "DOSE_WITHHELD") return `Dose withheld: ${drug}${dose ? ` ${dose}` : ""}`;
  }

  if (area === "Incident") {
    const code = (log.entityLabel as string) || (meta.incidentNumber as string) || "";
    const cat = (meta.category as string) || "";
    const harm = (meta.harmLevel as string) || "";
    const details = [cat, harm].filter(Boolean).join(", ");
    return `Incident reported ${code}${details ? ` (${details})` : ""}`;
  }

  if (area === "Care plan") {
    const version =
      meta.version ||
      (log.newValue as Record<string, unknown>)?.version ||
      (log.oldValue as Record<string, unknown>)?.version ||
      "";
    const vStr = version ? `v${version} ` : "";
    if (act === "SUBMITTED") return `Care plan ${vStr}submitted for approval`;
    if (act === "APPROVED") return `Care plan ${vStr}approved`;
    if (act === "REJECTED" || act === "CHANGES_REQUESTED") {
      return `Care plan ${vStr}returned for changes`;
    }
    if (act === "CARE_PLAN_CREATED" || act === "CREATED") {
      return `Care plan ${vStr}created`;
    }
    if (act === "CARE_PLAN_UPDATED") return `Care plan ${vStr}updated`;
  }

  if (area === "Assessment") {
    return `Assessment completed: ${log.entityLabel || log.entityType || "Health Assessment"}`;
  }
  if (area === "Body map") {
    if (log.entityLabel?.startsWith("Body Map Assessment for ")) {
      return "Body Map Assessment recorded";
    }
    return `Body map updated: ${log.entityLabel || "Clinical zone record"}`;
  }
  if (area === "Observation") {
    return `Observation recorded: ${log.entityLabel || "Vitals / News2"}`;
  }
  if (area === "Tasks") {
    if (act === "TASK_COMPLETED") return `Task completed: ${log.entityLabel || "Daily Care Task"}`;
    if (act === "TASK_SKIPPED") return `Task skipped: ${log.entityLabel || "Daily Care Task"}`;
    return `Task updated: ${log.entityLabel || "Daily Care Task"}`;
  }
  if (area === "Handover") {
    return `Handover notes updated: ${log.entityLabel || "Shift Handover"}`;
  }
  if (area === "Rota") {
    if (act.includes("ASSIGN")) return `Staff assigned to shift: ${log.entityLabel || meta.shiftWindow || "Shift"}`;
    if (
      act.includes("LEAVE") ||
      log.entityType === "LeaveRequest" ||
      (log.entityType === "ShiftRequest" && (log.entityLabel as string)?.includes("Leave"))
    ) {
      const status = (meta.status as string) || (log.newValue as Record<string, unknown>)?.status;
      return `Leave request ${status ? String(status).toLowerCase() : "updated"}: ${log.entityLabel || meta.staffName || "Staff"}`;
    }
    if (log.entityType === "ShiftRequest") {
      const status = (meta.status as string) || (log.newValue as Record<string, unknown>)?.status;
      return `Shift request ${status ? String(status).toLowerCase() : "updated"}: ${log.entityLabel || meta.staffName || "Staff"}`;
    }
    if (act.includes("CREATE")) return `Shift created: ${log.entityLabel || meta.careType || "Shift"}`;
    if (act.includes("UPDATE") || act.includes("MODIFIED")) return `Shift modified: ${log.entityLabel || meta.careType || "Shift"}`;
    if (act.includes("DELETE")) return `Shift cancelled/deleted: ${log.entityLabel || "Shift"}`;
    return `Rota updated: ${log.entityLabel || "Shift"}`;
  }

  if (act === "LOGIN") return "User logged in";
  if (act === "LOGOUT") return "User logged out";
  if (act === "FAILED_LOGIN") return "Failed login attempt";
  if (act === "PAGE_VIEW" || act === "PAGE_VIEWED") {
    const rawTarget = log.entityLabel || (meta.pageName as string) || "";
    const friendlyTarget = sanitizePagePathOrName(rawTarget, fallbackLabel);
    return `Viewed page ${friendlyTarget}`;
  }
  if (act === "RESIDENT_RECORD_VIEWED") {
    return `Viewed resident record ${log.entityLabel || fallbackLabel || ""}`;
  }
  if (act === "RESIDENT_EMERGENCY_VIEWED") {
    return `Emergency directory (read-only) view of ${log.entityLabel || fallbackLabel || "resident"}`;
  }
  if (act === "DOCUMENT_VIEWED") return `Viewed document ${log.entityLabel || ""}`;
  if (act === "DOCUMENT_DOWNLOADED") return `Downloaded document ${log.entityLabel || ""}`;

  return log.entityLabel
    ? `${formatActivityLabel(log.actionType)}: ${log.entityLabel}`
    : formatActivityLabel(log.actionType);
}
