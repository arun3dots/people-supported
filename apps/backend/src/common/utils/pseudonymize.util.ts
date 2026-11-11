/**
 * C-09 Data Minimisation (UK GDPR Art 5(1)(c) & Caldicott Principle 3):
 * Pseudonymises resident identity for transit across external, unencrypted,
 * or 3rd-party push notification networks (FCM, Apple APNs, SMS gateways).
 * e.g., "Margaret Thatcher", "clx12345" => "M.T. (#clx123)"
 */
export function formatPseudonymizedResident(
  fullName?: string | null,
  id?: string | null,
): string {
  const shortId = id ? `#${id.slice(0, 6)}` : 'N/A';
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return `Resident (${shortId})`;
  const initials = parts.map((p) => p[0].toUpperCase()).join('.');
  return `${initials}. (${shortId})`;
}
