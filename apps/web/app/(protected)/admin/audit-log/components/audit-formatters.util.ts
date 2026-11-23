const UUID_REGEX =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

const UUID_SPACED_REGEX =
  /[0-9a-f]{8}\s+[0-9a-f]{4}\s+[0-9a-f]{4}\s+[0-9a-f]{4}\s+[0-9a-f]{12}/gi;

/** Check if string is a raw UUID */
export function isUuid(str: string): boolean {
  if (typeof str !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    str.trim(),
  );
}

/**
 * Replace UUIDs in a path or pageName with a friendly resident/record label.
 */
export function sanitizePagePathOrName(
  text: string,
  fallbackName?: string | null,
): string {
  if (!text) return "";
  const name = fallbackName?.trim() || "Resident";
  let cleaned = text.replace(UUID_REGEX, name);
  cleaned = cleaned.replace(UUID_SPACED_REGEX, name);
  return cleaned;
}

const TECHNICAL_KEYS = new Set([
  "id",
  "tenantid",
  "createdat",
  "updatedat",
  "passwordhash",
  "parentversionid",
  "approverid",
  "createdbyid",
  "updatedbyid",
  "userid",
  "residentid",
  "authorid",
  "witnessid",
  "entityid",
]);

export function isTechnicalKey(key: string): boolean {
  return TECHNICAL_KEYS.has(key.toLowerCase());
}

export function formatFieldKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .toLowerCase()
    .trim();
}

export interface BodyMapFindingSummary {
  trackingId?: string;
  findingType?: string;
  locationLabel?: string;
  severity?: string;
}

/**
 * Formats body map findings into concise human-readable lines instead of raw JSON.
 */
export function formatBodyMapFindings(
  findings: unknown,
  findingCount?: unknown,
): string[] {
  if (!Array.isArray(findings) || findings.length === 0) {
    if (typeof findingCount === "number") {
      return [`${findingCount} finding(s) recorded`];
    }
    return ["Finding recorded"];
  }

  const lines: string[] = [];
  const maxToShow = 3;
  const items = findings.slice(0, maxToShow) as BodyMapFindingSummary[];

  for (const f of items) {
    const type = f.findingType || "Finding";
    const loc = f.locationLabel ? ` on ${f.locationLabel}` : "";
    const sev = f.severity ? ` (${f.severity})` : "";
    const code = f.trackingId ? `${f.trackingId}: ` : "";
    lines.push(`${code}${type}${loc}${sev}`);
  }

  if (findings.length > maxToShow) {
    lines.push(`+${findings.length - maxToShow} more finding(s)`);
  }

  return lines;
}

export function formatRoleAuditValue(val: unknown): string[] {
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
