import { format } from "date-fns";
import type { AuditLog as AuditLogItem } from "../../../../../lib/queries/audit/useGetAuditLogsQuery";
import {
  formatActivityLabel,
  getActivityBadgeState,
  getActivityBadgeLabel,
  type BadgeState,
} from "./audit-badge.util";
import { AUDIT_AREAS, type AuditAreaId } from "./audit-constants";
import { getLogArea } from "./audit-area.util";
import {
  isUuid,
  sanitizePagePathOrName,
  isTechnicalKey,
  formatFieldKey,
  formatBodyMapFindings,
} from "./audit-formatters.util";

export {
  formatActivityLabel,
  getActivityBadgeState,
  getActivityBadgeLabel,
  type BadgeState,
  AUDIT_AREAS,
  type AuditAreaId,
  getLogArea,
};

function formatRoleAuditValue(val: unknown): string[] {
  if (!val || typeof val !== "object") return ["—"];
  const role = val as Record<string, unknown>;
  const lines: string[] = [];

  if (typeof role.name === "string" && role.name.trim()) {
    lines.push(`Role: ${role.name.trim()}`);
  }

  if (role.permissions && typeof role.permissions === "object") {
    const permissions = role.permissions as Record<string, unknown>;
    const summaries = Object.entries(permissions).flatMap(([module, actions]) => {
      if (!actions || typeof actions !== "object" || Array.isArray(actions)) return [];
      const enabled = Object.entries(actions as Record<string, unknown>)
        .filter(([, enabled]) => enabled === true || enabled === 1)
        .map(([action]) => action);
      return enabled.length > 0 ? [`${module}: ${enabled.join(", ")}`] : [];
    });
    if (summaries.length > 0) lines.push(...summaries);
  }

  return lines.length > 0 ? lines : ["—"];
}

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

export function formatValueCellLines(
  val: unknown,
  fallback = "—",
  residentName?: string,
): string[] {
  if (val === null || val === undefined || val === "") return [fallback];
  if (typeof val === "string") {
    const s = val.trim();
    if (!s || s === "{}" || s === "[]") return [fallback];
    return [sanitizePagePathOrName(s, residentName)];
  }
  if (typeof val === "number" || typeof val === "boolean") return [String(val)];

  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;

    // Special clean rendering for Body Map findings
    if (Array.isArray(obj.findings) || obj.findingCount !== undefined) {
      return formatBodyMapFindings(obj.findings, obj.findingCount);
    }

    const keys = Object.keys(obj).filter((k) => !isTechnicalKey(k));
    if (keys.length === 0) return [fallback];

    if (obj.status && typeof obj.status === "string") {
      const statusMap: Record<string, string> = {
        PendingPrimaryApproval: "Pending approval",
        PendingSecondaryApproval: "Pending approval",
        ChangesRequested: "Changes requested",
        Draft: "Draft",
        Active: "Active",
        Approved: "Approved",
        Rejected: "Draft",
      };
      const mapped = statusMap[obj.status] || obj.status;
      return [obj.version ? `${mapped} (v${obj.version})` : mapped];
    }
    if (obj.balance !== undefined) return [`Balance ${obj.balance}`];
    if (obj.stock !== undefined) return [`Balance ${obj.stock}`];
    if (obj.message && typeof obj.message === "string") {
      return [sanitizePagePathOrName(obj.message, residentName)];
    }
    if (obj.label && typeof obj.label === "string") {
      return [sanitizePagePathOrName(obj.label, residentName)];
    }

    if (keys.length === 1 && keys[0]) {
      const k = keys[0];
      const v = obj[k];
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        const valStr = sanitizePagePathOrName(String(v), residentName);
        return [`${formatFieldKey(k)}: ${valStr}`];
      }
    }

    if (keys.length <= 5) {
      return keys
        .map((k) => {
          const v = obj[k];
          if (v === null || v === undefined || v === "") return null;
          if (typeof v === "string" && isUuid(v)) return null;
          const valStr = typeof v === "object" ? JSON.stringify(v) : String(v);
          const sanitized = sanitizePagePathOrName(valStr, residentName);
          return `${formatFieldKey(k)}: ${sanitized}`;
        })
        .filter((line): line is string => Boolean(line));
    }

    return [`${keys.length} fields modified`];
  }
  return [fallback];
}

export function getLogBeforeLines(log: AuditLogItem): string[] {
  const meta = (log.metadata || {}) as Record<string, unknown>;
  const resName = getLogResident(log);
  const residentName = resName !== "—" ? resName : undefined;

  if (log.entityType === "Role") {
    return formatRoleAuditValue(log.oldValue);
  }

  if (meta.previousStock !== undefined) {
    return [`Balance ${meta.previousStock}`];
  }
  if (meta.beforeStatus) {
    return [String(meta.beforeStatus)];
  }
  const area = getLogArea(log);
  if (area === "Care plan" && !log.oldValue) {
    const act = (log.actionType || "").toUpperCase();
    if (act === "SUBMITTED") return ["Draft"];
    if (act === "CHANGES_REQUESTED" || act === "REJECTED") return ["Pending approval"];
  }
  return formatValueCellLines(log.oldValue, "—", residentName);
}

export function getLogAfterLines(log: AuditLogItem): string[] {
  const meta = (log.metadata || {}) as Record<string, unknown>;
  const resName = getLogResident(log);
  const residentName = resName !== "—" ? resName : undefined;

  if (log.entityType === "Role") {
    return formatRoleAuditValue(log.newValue);
  }

  if (meta.newStock !== undefined) {
    const witness = meta.witnessName ? ` · witness ${meta.witnessName}` : "";
    return [`Balance ${meta.newStock}${witness}`];
  }
  if (meta.afterStatus) {
    const trigger = meta.triggerReview ? " · care plan review triggered" : "";
    return [`${meta.afterStatus}${trigger}`];
  }
  const area = getLogArea(log);
  if (area === "Incident" && (meta.status === "Open" || !log.newValue)) {
    return ["Open · care plan review triggered"];
  }
  if (area === "Care plan" && !log.newValue) {
    const act = (log.actionType || "").toUpperCase();
    if (act === "SUBMITTED") return ["Pending approval"];
    if (act === "CHANGES_REQUESTED" || act === "REJECTED") return ["Draft"];
  }
  return formatValueCellLines(log.newValue, "—", residentName);
}

export function getLogBefore(log: AuditLogItem): string {
  return getLogBeforeLines(log).join(", ");
}

export function getLogAfter(log: AuditLogItem): string {
  return getLogAfterLines(log).join(", ");
}

export function getLogResident(log: AuditLogItem): string {
  const meta = (log.metadata || {}) as Record<string, unknown>;
  if (typeof meta.residentName === "string" && meta.residentName) {
    return meta.residentName;
  }
  if (log.entityType === "Resident" && log.entityLabel) {
    return log.entityLabel;
  }
  if (log.entityLabel) {
    if (log.entityLabel.startsWith("Body Map Assessment for ")) {
      return log.entityLabel.replace("Body Map Assessment for ", "").trim();
    }
    if (
      log.entityType === "CarePlan" ||
      log.entityType === "MedicationRound" ||
      log.entityType === "Incident" ||
      log.entityType === "Observation" ||
      log.entityType === "BodyMapAssessment" ||
      log.entityType === "BodyMapFinding"
    ) {
      if (
        !log.entityLabel.startsWith("Plan ") &&
        !log.entityLabel.startsWith("INC-") &&
        !log.entityLabel.startsWith("Resolved:")
      ) {
        return log.entityLabel;
      }
    }
  }
  return "—";
}

export function getLogResidentId(log: AuditLogItem): string | null {
  const meta = (log.metadata || {}) as Record<string, unknown>;
  if (typeof meta.residentId === "string" && meta.residentId) {
    return meta.residentId;
  }
  if (log.entityType === "Resident" && log.entityId) {
    return log.entityId;
  }
  const nv = (log.newValue || {}) as Record<string, unknown>;
  if (typeof nv.residentId === "string" && nv.residentId) {
    return nv.residentId;
  }
  const ov = (log.oldValue || {}) as Record<string, unknown>;
  if (typeof ov.residentId === "string" && ov.residentId) {
    return ov.residentId;
  }
  return null;
}

export function formatLogWhen(timestamp: string): { date: string; time: string } {
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return { date: "—", time: "" };
    return {
      date: format(d, "dd MMM yyyy"),
      time: format(d, "HH:mm"),
    };
  } catch {
    return { date: "—", time: "" };
  }
}
