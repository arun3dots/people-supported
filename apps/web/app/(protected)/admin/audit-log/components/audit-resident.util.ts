import type { AuditLog as AuditLogItem } from "../../../../../lib/queries/audit/useGetAuditLogsQuery";

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
