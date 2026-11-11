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

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

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

    // If client requested raw CSV stream
    if (req.headers['accept']?.includes('text/csv')) {
      res.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${result.filename}"`,
      });
      return new StreamableFile(Buffer.from(result.content, 'utf-8'));
    }

    return result;
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

    // If client requested raw CSV stream
    if (req.headers['accept']?.includes('text/csv')) {
      res.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${result.filename}"`,
      });
      return new StreamableFile(Buffer.from(result.content, 'utf-8'));
    }

    return result;
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

    if (req.headers['accept']?.includes('text/csv')) {
      res.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${result.filename}"`,
      });
      return new StreamableFile(Buffer.from(result.content, 'utf-8'));
    }

    return result;
  }
}
