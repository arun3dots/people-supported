import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { resolveBranchId } from '../common/utils/scope.util';
import {
  reportExportQuerySchema,
  ReportExportQueryDTO,
  ReportCsvResponseDTO,
} from '@repo/schema';
import { ReportsService } from './reports.service';
import { AuditService } from '../audit/audit.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * RM-02: Incident and Accident Log Export.
   * Accessible by Admin, Manager, and Nurse.
   */
  @Get('incidents/csv')
  @Roles('Admin', 'Manager', 'Nurse')
  async exportIncidents(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
    @Query(new ZodValidationPipe(reportExportQuerySchema))
    query?: ReportExportQueryDTO,
  ): Promise<ReportCsvResponseDTO | StreamableFile> {
    const branchId = resolveBranchId(req, query?.branchId);
    const result = await this.reportsService.exportIncidentsCsv(
      req.user.tenantId!,
      branchId,
      query?.startDate,
      query?.endDate,
    );
    return this.sendCsvOrJson(req, res, result, 'Incidents & Accidents Report');
  }

  /**
   * NU-11: Resident Clinical Risk Summary Export.
   * Accessible by Admin, Manager, and Nurse.
   */
  @Get('residents/csv')
  @Roles('Admin', 'Manager', 'Nurse')
  async exportResidents(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
    @Query(new ZodValidationPipe(reportExportQuerySchema))
    query?: ReportExportQueryDTO,
  ): Promise<ReportCsvResponseDTO | StreamableFile> {
    const branchId = resolveBranchId(req, query?.branchId);
    const result = await this.reportsService.exportResidentsCsv(
      req.user.tenantId!,
      branchId,
    );
    return this.sendCsvOrJson(req, res, result, 'Resident Clinical Risk Summary');
  }

  /**
   * NU-07: Clinical Escalations & Falls Log Export.
   * Accessible by Admin, Manager, and Nurse.
   */
  @Get('escalations/csv')
  @Roles('Admin', 'Manager', 'Nurse')
  async exportEscalations(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
    @Query(new ZodValidationPipe(reportExportQuerySchema))
    query?: ReportExportQueryDTO,
  ): Promise<ReportCsvResponseDTO | StreamableFile> {
    const branchId = resolveBranchId(req, query?.branchId);
    const result = await this.reportsService.exportEscalationsCsv(
      req.user.tenantId!,
      branchId,
    );
    return this.sendCsvOrJson(req, res, result, 'Clinical Escalations & Falls Log');
  }

  private sendCsvOrJson(
    req: AuthenticatedRequest,
    res: Response,
    result: ReportCsvResponseDTO,
    reportName?: string,
  ): ReportCsvResponseDTO | StreamableFile {
    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'DATA_EXPORTED',
      tenantId: req.user.tenantId,
      userId: req.user.userId,
      userEmail: req.user.email,
      userFullName: req.user.fullName,
      userRoleName: req.user.roleName,
      entityType: 'Report',
      entityLabel: reportName || result.filename,
      newValue: {
        filename: result.filename,
        rowCount: result.rowCount,
        reportName: reportName || result.filename,
      },
      metadata: {
        filename: result.filename,
        rowCount: result.rowCount,
        format: 'CSV',
        device: (req.headers['sec-ch-ua-platform'] as string) || 'Desktop',
        macAddress: (req.headers['x-device-mac'] as string) || (req.headers['x-mac-address'] as string) || '00:1A:2B:3C:4D:5E',
      },
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'] as string,
    });

    if (req.headers['accept']?.includes('text/csv')) {
      res.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${result.filename}"`,
      });
      return new StreamableFile(Buffer.from(result.content, 'utf-8'));
    }
    return result;
  }

  @Get('occupancy/csv')
  @Roles('Admin', 'Manager', 'Nurse')
  async exportOccupancy(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
    @Query(new ZodValidationPipe(reportExportQuerySchema))
    query?: ReportExportQueryDTO,
  ): Promise<ReportCsvResponseDTO | StreamableFile> {
    const result = await this.reportsService.exportOccupancyCsv(
      req.user.tenantId!,
      resolveBranchId(req, query?.branchId),
    );
    return this.sendCsvOrJson(req, res, result, 'Occupancy & Admissions Ledger');
  }

  @Get('medications/csv')
  @Roles('Admin', 'Manager', 'Nurse')
  async exportMedications(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
    @Query(new ZodValidationPipe(reportExportQuerySchema))
    query?: ReportExportQueryDTO,
  ): Promise<ReportCsvResponseDTO | StreamableFile> {
    const result = await this.reportsService.exportMedicationsCsv(
      req.user.tenantId!,
      resolveBranchId(req, query?.branchId),
    );
    return this.sendCsvOrJson(req, res, result, 'eMAR Medication Administration Audit');
  }

  @Get('care-plans/csv')
  @Roles('Admin', 'Manager', 'Nurse')
  async exportCarePlans(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
    @Query(new ZodValidationPipe(reportExportQuerySchema))
    query?: ReportExportQueryDTO,
  ): Promise<ReportCsvResponseDTO | StreamableFile> {
    const result = await this.reportsService.exportCarePlansCsv(
      req.user.tenantId!,
      resolveBranchId(req, query?.branchId),
    );
    return this.sendCsvOrJson(req, res, result, 'Care Plan & Risk Review Matrix');
  }

  @Get('shifts/csv')
  @Roles('Admin', 'Manager', 'Nurse')
  async exportShifts(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
    @Query(new ZodValidationPipe(reportExportQuerySchema))
    query?: ReportExportQueryDTO,
  ): Promise<ReportCsvResponseDTO | StreamableFile> {
    const result = await this.reportsService.exportShiftsCsv(
      req.user.tenantId!,
      resolveBranchId(req, query?.branchId),
    );
    return this.sendCsvOrJson(req, res, result, 'Staff Rota & Shift Allocation Log');
  }

  @Get('cqc-compliance/csv')
  @Roles('Admin', 'Manager', 'Nurse')
  async exportCqcCompliance(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
    @Query(new ZodValidationPipe(reportExportQuerySchema))
    query?: ReportExportQueryDTO,
  ): Promise<ReportCsvResponseDTO | StreamableFile> {
    const result = await this.reportsService.exportCqcComplianceCsv(
      req.user.tenantId!,
      resolveBranchId(req, query?.branchId),
    );
    return this.sendCsvOrJson(req, res, result, 'CQC Fundamental Standards Audit Pack');
  }

  @Get('invoices/csv')
  @Roles('Admin', 'Manager', 'Nurse')
  async exportInvoices(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
    @Query(new ZodValidationPipe(reportExportQuerySchema))
    query?: ReportExportQueryDTO,
  ): Promise<ReportCsvResponseDTO | StreamableFile> {
    const result = await this.reportsService.exportInvoicesCsv(
      req.user.tenantId!,
      resolveBranchId(req, query?.branchId),
    );
    return this.sendCsvOrJson(req, res, result, 'Invoicing & Revenue Settlement Export');
  }
}
