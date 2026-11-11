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
