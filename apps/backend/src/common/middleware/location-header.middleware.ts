import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { runWithLocation } from './location.context';

function parseCoord(
  value: unknown,
  min: number,
  max: number,
): number | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
}

/**
 * Captures client-supplied coordinates (x-latitude / x-longitude headers)
 * into a request-scoped context so AuditService can attach them to AUTH and
 * DATA_ACCESS audit events. A no-op for every other request.
 */
@Injectable()
export class LocationHeaderMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const latitude = parseCoord(req.headers['x-latitude'], -90, 90);
    const longitude = parseCoord(req.headers['x-longitude'], -180, 180);

    if (latitude === undefined || longitude === undefined) {
      next();
      return;
    }

    runWithLocation({ latitude, longitude }, () => next());
  }
}
