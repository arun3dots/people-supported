import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  Res,
  ForbiddenException,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditDbService } from './audit-db.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Response } from 'express';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { reverseGeocode } from '../common/utils/geocode';
import {
  auditListQuerySchema,
  pageViewAuditSchema,
  type AuditListQueryDTO,
  type PageViewAuditDTO,
} from '@repo/schema';
import { prisma } from '@repo/db';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import {
  buildPaginatedResponse,
  resolvePagination,
} from '../common/utils/pagination.util';
import { populateAuditUserSummaries } from './audit-user-lookup.util';
import {
  writeAuditExcelExport,
  writeAuditPdfExport,
} from './audit-export.util';

/**
 * AuditController — CQC/NHS DSP Toolkit Compliant Audit API
 * Enforces both JwtAuthGuard and RolesGuard on all endpoints (D-06).
 */
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly auditDbService: AuditDbService,
  ) {}

  /** Paginated audit logs. Restricted to Admin and Manager roles (D-06). */
  @Get()
  @Roles('Admin', 'Manager')
  async getLogs(
    @Req() req: AuthenticatedRequest,
    @Query(new ZodValidationPipe(auditListQuerySchema))
    query?: AuditListQueryDTO,
  ) {
    const tenantId = req.user.tenantId;
    const safeQuery = query ?? ({} as AuditListQueryDTO);
    const slice = resolvePagination(safeQuery);
    const result = await this.auditService.findAll(tenantId, {
      userId: safeQuery.userId,
      entityId: safeQuery.entityId,
      categoryType: safeQuery.categoryType,
      actionType: safeQuery.actionType,
      area: safeQuery.area,
      startDate: safeQuery.startDate,
      endDate: safeQuery.endDate,
      limit: slice.take,
      offset: slice.skip,
      all: slice.isAll,
      search: safeQuery.search,
    });

    const userMap = await populateAuditUserSummaries(result.logs);

    const formattedLogs = result.logs.map((log) => {
      const dbUser = log.userId ? userMap.get(log.userId) : undefined;
      const fullName =
        log.userFullName ??
        dbUser?.fullName ??
        log.userEmail ??
        dbUser?.email ??
        'Unknown User';
      const email = log.userEmail ?? dbUser?.email ?? '';
      const userRoleName = log.userRoleName ?? dbUser?.roleName ?? null;

      return {
        ...log,
        userFullName: fullName,
        userEmail: email || null,
        userRoleName,
        user: {
          id: log.userId ?? '',
          fullName,
          email,
          roleName: userRoleName ?? 'Staff',
        },
        ...(log.userAgent
          ? this.auditService.parseUserAgent(log.userAgent)
          : {
              browser: 'Unknown',
              os: 'Unknown',
              device: 'Desktop',
            }),
      };
    });

    return buildPaginatedResponse(formattedLogs, result.total, slice);
  }

  @Post('page-view')
  async logPageView(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(pageViewAuditSchema))
    body: PageViewAuditDTO,
  ) {
    const user = req.user;

    // A-08 & C-09 Data Minimisation: Page-view geolocation is disabled by default
    // and only recorded when explicitly enabled by the tenant.
    let gpsAllowed = false;
    if (
      user.tenantId &&
      body.latitude !== undefined &&
      body.longitude !== undefined
    ) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: user.tenantId },
        select: { enablePageViewGeolocation: true },
      });
      gpsAllowed = tenant?.enablePageViewGeolocation === true;
    }

    const latitude =
      gpsAllowed &&
      typeof body.latitude === 'number' &&
      Number.isFinite(body.latitude) &&
      Math.abs(body.latitude) <= 90
        ? body.latitude
        : undefined;
    const longitude =
      gpsAllowed &&
      typeof body.longitude === 'number' &&
      Number.isFinite(body.longitude) &&
      Math.abs(body.longitude) <= 180
        ? body.longitude
        : undefined;

    const locationName =
      latitude !== undefined && longitude !== undefined
        ? await reverseGeocode(latitude, longitude)
        : undefined;

    await this.auditService.emitPageView({
      userId: user.userId,
      tenantId: user.tenantId,
      userEmail: user.email,
      userFullName: user.fullName || 'Unknown',
      userRoleName: user.roleName,
      path: body.path,
      pageName: body.pageName,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      latitude,
      longitude,
      locationName,
    });
    return { success: true };
  }

  @Get('integrity/verify')
  @Roles('Admin')
  async verifyIntegrity(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user.tenantId;
    return this.auditService.verifyIntegrity(tenantId);
  }

  @Get('reports/medication-errors')
  @Roles('Admin', 'Manager')
  async getMedicationErrorReport(
    @Req() req: AuthenticatedRequest,
    @Query('months') months?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const tenantId = req.user.tenantId;
    const monthsBack = parseInt(months || '6', 10);
    const calcStart =
      startDate ||
      new Date(
        Date.now() - monthsBack * 30 * 24 * 60 * 60 * 1000,
      ).toISOString();

    const result = await this.auditDbService.findAll({
      tenantId,
      categoryType: 'MEDICATION',
      startDate: calcStart,
      endDate,
      limit: 10000,
    });

    const errors = result.logs.filter((log) =>
      ['DOSE_MISSED', 'DOSE_REFUSED', 'DOSE_WITHHELD'].includes(log.actionType),
    );

    return {
      reportType: 'MEDICATION_ERRORS',
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.email,
      period: {
        startDate: calcStart,
        endDate: endDate ?? new Date().toISOString(),
      },
      totalErrors: errors.length,
      breakdown: {
        missed: errors.filter((l) => l.actionType === 'DOSE_MISSED').length,
        refused: errors.filter((l) => l.actionType === 'DOSE_REFUSED').length,
        withheld: errors.filter((l) => l.actionType === 'DOSE_WITHHELD').length,
      },
      records: errors,
    };
  }

  @Get('reports/care-plan-changes')
  @Roles('Admin', 'Manager')
  async getCarePlanChangesReport(
    @Req() req: AuthenticatedRequest,
    @Query('staffUserId') staffUserId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const tenantId = req.user.tenantId;
    const result = await this.auditDbService.findAll({
      tenantId,
      categoryType: 'CARE_PLAN',
      userId: staffUserId,
      startDate,
      endDate,
      limit: 10000,
    });

    return {
      reportType: 'CARE_PLAN_CHANGES',
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.email,
      totalChanges: result.total,
      records: result.logs,
    };
  }

  @Get('reports/resident-access')
  @Roles('Admin', 'Manager')
  async getResidentAccessReport(
    @Req() req: AuthenticatedRequest,
    @Query('residentId') residentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!residentId) {
      throw new ForbiddenException('residentId query parameter is required');
    }
    const tenantId = req.user.tenantId;
    const result = await this.auditDbService.findAll({
      tenantId,
      categoryType: 'DATA_ACCESS',
      entityId: residentId,
      startDate,
      endDate,
      limit: 10000,
    });

    return {
      reportType: 'RESIDENT_ACCESS',
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.email,
      residentId,
      totalAccesses: result.total,
      records: result.logs,
    };
  }

  @Get('reports/safeguarding')
  @Roles('Admin', 'Manager')
  async getSafeguardingReport(
    @Req() req: AuthenticatedRequest,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const tenantId = req.user.tenantId;
    const result = await this.auditDbService.findAll({
      tenantId,
      categoryType: 'SAFEGUARDING',
      startDate,
      endDate,
      limit: 10000,
    });

    return {
      reportType: 'SAFEGUARDING_INCIDENTS',
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.email,
      totalIncidents: result.total,
      records: result.logs,
    };
  }

  @Get('reports/security-events')
  @Roles('Admin')
  async getSecurityEventsReport(
    @Req() req: AuthenticatedRequest,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const tenantId = req.user.tenantId;
    const result = await this.auditDbService.findAll({
      tenantId,
      categoryType: 'AUTH',
      startDate,
      endDate,
      limit: 10000,
    });

    const securityEvents = result.logs.filter((l) =>
      [
        'FAILED_LOGIN',
        'ROLE_CHANGED',
        'ACCOUNT_LOCKED',
        'DATA_EXPORTED',
        'PASSWORD_RESET',
      ].includes(l.actionType),
    );

    return {
      reportType: 'SECURITY_EVENTS',
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.email,
      totalEvents: securityEvents.length,
      records: securityEvents,
    };
  }

  @Get('export/excel')
  @Roles('Admin', 'Manager')
  async exportExcel(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Query('categoryType') categoryType?: string,
    @Query('userId') userId?: string,
    @Query('actionType') actionType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const tenantId = req.user.tenantId;
    const result = await this.auditDbService.findAll({
      tenantId,
      categoryType,
      userId,
      actionType,
      startDate,
      endDate,
      limit: 50000,
    });
    await writeAuditExcelExport(res, result.logs, result.total, categoryType);
  }

  @Get('export/pdf')
  @Roles('Admin', 'Manager')
  async exportPdf(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Query('categoryType') categoryType?: string,
    @Query('userId') userId?: string,
    @Query('actionType') actionType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const tenantId = req.user.tenantId;
    const result = await this.auditDbService.findAll({
      tenantId,
      categoryType,
      userId,
      actionType,
      startDate,
      endDate,
      limit: 10000,
    });
    writeAuditPdfExport(res, result.logs, result.total, categoryType);
  }
}
