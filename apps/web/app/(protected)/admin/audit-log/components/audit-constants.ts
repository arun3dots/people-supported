export const AUDIT_AREAS = [
  { id: "all", label: "All" },
  { id: "care_log", label: "Care log" },
  { id: "care_plan", label: "Care plan" },
  { id: "assessment", label: "Assessment" },
  { id: "medication", label: "Medication" },
  { id: "incident", label: "Incident" },
  { id: "tasks", label: "Tasks" },
  { id: "handover", label: "Handover" },
  { id: "access", label: "Access" },
  { id: "rota", label: "Rota" },
  { id: "staff", label: "Staff" },
  { id: "observation", label: "Observation" },
  { id: "risk", label: "Risk" },
  { id: "finance", label: "Finance" },
] as const;

export type AuditAreaId = (typeof AUDIT_AREAS)[number]["id"];
