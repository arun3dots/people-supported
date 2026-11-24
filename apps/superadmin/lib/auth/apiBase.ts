export function getBrowserApiBaseUrl(): string {
  const raw = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4400/api"
  ).replace(/\/+$/, "");
  return raw.endsWith("/api") ? raw : `${raw}/api`;
}

export function getServerApiBaseUrl(): string {
  const internal = process.env.INTERNAL_API_URL?.trim().replace(/\/+$/, "");
  if (internal) {
    return internal.endsWith("/api") ? internal : `${internal}/api`;
  }
  const pub = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (pub && /^https?:\/\//i.test(pub)) {
    return pub.endsWith("/api") ? pub : `${pub}/api`;
  }
  return "http://127.0.0.1:4400/api";
}

export function resolveApiUrl(
  endpointPath: string,
  baseUrl = getBrowserApiBaseUrl(),
): URL {
  const cleanEndpoint = endpointPath.startsWith("/api")
    ? endpointPath.substring(4)
    : endpointPath;
  const suffix = cleanEndpoint.startsWith("/")
    ? cleanEndpoint
    : `/${cleanEndpoint}`;
  const combined = `${baseUrl}${suffix}`;
  if (/^https?:\/\//i.test(combined)) {
    return new URL(combined);
  }
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "http://localhost:3001";
  return new URL(combined, origin);
}

function isLoopbackHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return (
    ["localhost", "127.0.0.1", "[::1]"].includes(lower) ||
    lower.endsWith(".localhost") ||
    lower.endsWith(".cantracare.test")
  );
}

export function resolveSafeSignOutDestination(
  signOutUrl?: string | null,
  currentLocation?: { protocol: string; hostname: string } | null,
): string {
  if (!signOutUrl) return "/login";
  try {
    const parsed = new URL(signOutUrl);
    if (
      parsed.username ||
      parsed.password ||
      parsed.hash ||
      parsed.pathname !== "/logout"
    ) {
      return "/login";
    }
    if (parsed.protocol === "https:") return parsed.href;
    const loc =
      currentLocation ??
      (typeof window !== "undefined" ? window.location : undefined);
    const localHttpAllowed =
      loc &&
      loc.protocol === "http:" &&
      isLoopbackHost(loc.hostname) &&
      parsed.protocol === "http:" &&
      isLoopbackHost(parsed.hostname);
    if (localHttpAllowed) return parsed.href;
  } catch {
    // Reject malformed URLs and fall back locally.
  }
  return "/login";
}

function hasControlCharacter(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

export function resolveSafeNextPath(next?: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  if (next.includes("\\") || hasControlCharacter(next)) return null;
  if (next.startsWith("/api") || next === "/login") return null;
  return next;
}
