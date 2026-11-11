// Reverse-geocode cache keyed by ~1 km grid cell (2 decimal places).
const GEOCODE_CACHE = new Map<string, string>();

/**
 * Best-effort reverse geocoding via OpenStreetMap Nominatim (no API key).
 * Returns undefined on any failure (timeout, HTTP error, no result) — audit
 * writes are never blocked. Swappable for a keyed provider (e.g. Google
 * Geocoding) by replacing this function; the audit pipeline only depends on
 * locationName being optional.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string | undefined> {
  const key = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
  const cached = GEOCODE_CACHE.get(key);
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          'User-Agent': 'care-home-audit/1.0 (compliance audit logging)',
        },
        signal: controller.signal,
      },
    );
    clearTimeout(timer);
    if (!res.ok) return undefined;
    const data = (await res.json()) as { display_name?: string };
    if (!data.display_name) return undefined;
    GEOCODE_CACHE.set(key, data.display_name);
    return data.display_name;
  } catch {
    return undefined;
  }
}
