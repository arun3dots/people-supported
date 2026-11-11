import { Injectable, Logger } from '@nestjs/common';
import * as UAParser from 'ua-parser-js';
import {
  AuditEvent,
  AuthAuditEvent,
  MedicationAuditEvent,
  CarePlanAuditEvent,
  SafeguardingAuditEvent,
  DataAccessAuditEvent,
  ClinicalDocAuditEvent,
  ConsentAuditEvent,
  SystemAuditEvent,
} from './audit.types';
import { AuditDbService } from './audit-db.service';
import { getLocationContext } from '../common/middleware/location.context';
import { reverseGeocode } from '../common/utils/geocode';

/**
 * AuditService — the public API for the audit system.
 *
 * All other services and controllers use this service to record audit events.
 * It puts events onto the BullMQ queue (non-blocking, fire-and-forget).
 *
 * If the queue is unavailable, it falls back to a direct write attempt.
 * If that also fails, the AuditDbService writes a local dead-letter file.
 *
 * NHS/CQC Compliance Design:
 *   - Audit failures NEVER crash the calling operation
 *   - Failed logins are recorded at platform level (no tenantId required)
 *   - Every event is typed — prevents missing required fields at compile time
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly auditDbService: AuditDbService) {}

  async emit(event: AuditEvent): Promise<void> {
    // BullMQ queue is disabled — write directly to the audit DB.
    // This call is intentionally fire-and-forget: errors are caught and logged
    // so the caller's operation is never interrupted (CQC compliance invariant).
    try {
      // AUTH and DATA_ACCESS events inherit the client's reported location
      // (captured by LocationHeaderMiddleware) when the event itself doesn't
      // already carry coordinates. Location name is reverse-geocoded lazily
      // and cached per ~1 km cell.
      if (
        (event.categoryType === 'AUTH' ||
          event.categoryType === 'DATA_ACCESS') &&
        event.latitude === undefined &&
        event.longitude === undefined
      ) {
        const loc = getLocationContext();
        if (loc) {
          event.latitude = loc.latitude;
          event.longitude = loc.longitude;
          event.locationName =
            event.locationName ??
            (await reverseGeocode(loc.latitude, loc.longitude));
        }
      }

      await this.auditDbService.writeEvent(event);
    } catch (error: unknown) {
      this.logger.error(
        'Audit write failed — event may be in dead-letter file',
        (error as Error).message,
      );
    }
  }

  async emitAuth(event: Omit<AuthAuditEvent, 'categoryType'>): Promise<void> {
    return this.emit({ ...event, categoryType: 'AUTH' });
  }

  async emitMedication(
    event: Omit<MedicationAuditEvent, 'categoryType'>,
  ): Promise<void> {
    return this.emit({ ...event, categoryType: 'MEDICATION' });
  }

  async emitCarePlan(
    event: Omit<CarePlanAuditEvent, 'categoryType'>,
  ): Promise<void> {
    return this.emit({
      entityType: 'CarePlan',
      ...event,
      categoryType: 'CARE_PLAN',
    });
  }

  async emitSafeguarding(
    event: Omit<SafeguardingAuditEvent, 'categoryType'>,
  ): Promise<void> {
    return this.emit({ ...event, categoryType: 'SAFEGUARDING' });
  }

  async emitDataAccess(
    event: Omit<DataAccessAuditEvent, 'categoryType'>,
  ): Promise<void> {
    return this.emit({ ...event, categoryType: 'DATA_ACCESS' });
  }

  async emitClinicalDoc(
    event: Omit<ClinicalDocAuditEvent, 'categoryType'>,
  ): Promise<void> {
    return this.emit({ ...event, categoryType: 'CLINICAL_DOC' });
  }

  async emitConsent(
    event: Omit<ConsentAuditEvent, 'categoryType'>,
  ): Promise<void> {
    return this.emit({ ...event, categoryType: 'CONSENT' });
  }

  async emitSystem(
    event: Omit<SystemAuditEvent, 'categoryType'>,
  ): Promise<void> {
    return this.emit({ ...event, categoryType: 'SYSTEM' });
  }

  async emitPageView(params: {
    userId?: string;
    tenantId?: string;
    userEmail?: string;
    userFullName?: string;
    userRoleName?: string;
    path: string;
    pageName: string;
    ipAddress?: string;
    userAgent?: string;
    latitude?: number;
    longitude?: number;
    locationName?: string;
  }): Promise<void> {
    return this.emit({
      categoryType: 'PAGE_VIEW',
      actionType: 'PAGE_VIEWED',
      tenantId: params.tenantId,
      userId: params.userId,
      userEmail: params.userEmail,
      userFullName: params.userFullName,
      userRoleName: params.userRoleName,
      entityType: 'PAGE',
      entityId: params.path,
      entityLabel: params.pageName,
      newValue: { path: params.path, pageName: params.pageName },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      latitude: params.latitude,
      longitude: params.longitude,
      locationName: params.locationName,
    });
  }

  // Legacy compatibility shim for callsites not yet fully migrated.

  async createLog(data: {
    userId: string;
    tenantId: string;
    actionType: string;
    entityType: string;
    entityId?: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    if (!data.userId || !data.tenantId) {
      this.logger.warn('AuditLog: Skipping log — missing userId or tenantId', {
        userId: !!data.userId,
        tenantId: !!data.tenantId,
      });
      return;
    }
    return this.emit({
      categoryType: 'LEGACY',
      actionType: data.actionType,
      tenantId: data.tenantId,
      userId: data.userId,
      entityType: data.entityType,
      entityId: data.entityId,
      oldValue: data.oldValue,
      newValue: data.newValue,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
  }

  async findAll(
    tenantId?: string,
    filters: {
      userId?: string;
      entityId?: string;
      categoryType?: string;
      actionType?: string;
      area?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
      all?: boolean;
      search?: string;
    } = {},
  ) {
    return this.auditDbService.findAll({ tenantId, ...filters });
  }

  async verifyIntegrity(tenantId?: string) {
    return this.auditDbService.verifyIntegrity(tenantId);
  }

  parseUserAgent(uaString: string) {
    const parser = new UAParser.UAParser(uaString);
    const result = parser.getResult();
    return {
      browser:
        `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim(),
      os: `${result.os.name || 'Unknown'} ${result.os.version || ''}`.trim(),
      device: result.device.type || 'Desktop',
    };
  }
}
