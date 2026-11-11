import { AsyncLocalStorage } from 'async_hooks';

/**
 * Request-scoped geolocation context.
 *
 * LocationHeaderMiddleware reads client-supplied coordinates from request
 * headers and stores them here for the duration of the request.
 * AuditService.emit() attaches them to AUTH and DATA_ACCESS events emitted
 * during that request, so location is recorded without touching every
 * controller/service call site.
 */
export interface LocationContext {
  latitude: number;
  longitude: number;
}

const storage = new AsyncLocalStorage<LocationContext>();

export function runWithLocation<T>(ctx: LocationContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

export function getLocationContext(): LocationContext | undefined {
  return storage.getStore();
}
