/**
 * Shared browser geolocation cache (A-08 / C-09 Data Minimisation).
 *
 * By default, continuous client geolocation is DISABLED to comply with UK GDPR
 * Art 5(1)(c) (Data Minimisation) and ICO Workplace Monitoring Guidance.
 * Position is only requested or attached to headers when a tenant explicitly
 * opts in to location-verified clinical access (`enableClientGeolocation(true)`).
 */

let geolocationEnabled = false;
let position: { latitude: number; longitude: number } | null | undefined;
let positionPromise: Promise<{ latitude: number; longitude: number } | null> | null = null;

/** Explicitly enables or disables client geolocation capture for the session. */
export function setClientGeolocationEnabled(enabled: boolean): void {
  geolocationEnabled = enabled;
  if (!enabled) {
    position = null;
    positionPromise = null;
  }
}

/** Kicks off (once) and caches the browser geolocation request when enabled. */
export function requestPosition(): Promise<{ latitude: number; longitude: number } | null> {
  if (!geolocationEnabled) {
    return Promise.resolve(null);
  }
  if (!positionPromise) {
    positionPromise = new Promise((resolve) => {
      if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
        position = null;
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          position = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          resolve(position);
        },
        () => {
          position = null;
          resolve(null);
        },
        { timeout: 3000, maximumAge: 5 * 60 * 1000 },
      );
    });
  }
  return positionPromise;
}

/** Headers to attach to API calls once a position is known and opt-in is active. */
export function getPositionHeaders(): Record<string, string> {
  if (geolocationEnabled && position) {
    return {
      "x-latitude": String(position.latitude),
      "x-longitude": String(position.longitude),
    };
  }
  return {};
}
