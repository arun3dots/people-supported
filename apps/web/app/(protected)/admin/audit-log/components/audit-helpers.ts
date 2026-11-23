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
import { getLogChange } from "./audit-change.util";
import { getLogResident, getLogResidentId } from "./audit-resident.util";
import { formatFinanceAuditValue } from "./audit-finance.util";
import {
  isUuid,
  sanitizePagePathOrName,
  isTechnicalKey,
  formatFieldKey,
  formatBodyMapFindings,
  formatRoleAuditValue,
} from "./audit-formatters.util";

export {
  formatActivityLabel,
  getActivityBadgeState,
  getActivityBadgeLabel,
  type BadgeState,
  AUDIT_AREAS,
  type AuditAreaId,
  getLogArea,
  getLogChange,
  getLogResident,
  getLogResidentId,
};

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

    // Special clean rendering for Finance transactions (Expense, Invoice, Payment)
    const finLines = formatFinanceAuditValue(obj);
    if (finLines.length > 0) {
      return finLines;
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

  if (
    log.entityType === "Expense" ||
    log.entityType === "Invoice" ||
    log.entityType === "PaymentHistory"
  ) {
    if (log.oldValue) {
      const fl = formatFinanceAuditValue(log.oldValue);
      if (fl.length > 0) return fl;
    }
    return ["—"];
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

  if (
    log.entityType === "Expense" ||
    log.entityType === "Invoice" ||
    log.entityType === "PaymentHistory"
  ) {
    if (log.newValue) {
      const fl = formatFinanceAuditValue(log.newValue);
      if (fl.length > 0) return fl;
    }
    return ["—"];
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
  return getLogBeforeLines(log).join("\n");
}

export function getLogAfter(log: AuditLogItem): string {
  return getLogAfterLines(log).join("\n");
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
