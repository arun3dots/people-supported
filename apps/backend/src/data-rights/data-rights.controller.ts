import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { DataRightsService } from './data-rights.service';
import { streamSarDossierPdf } from './data-rights-pdf.util';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { getTenantId } from '../common/utils/scope.util';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import {
  sarExportQuerySchema,
  createDataRightsRequestSchema,
  type SarExportQueryDTO,
  type CreateDataRightsRequestDTO,
} from '@repo/schema';

@ApiTags('Data Rights (UK GDPR Art 15-21)')
@Controller('data-rights')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DataRightsController {
  constructor(private readonly dataRightsService: DataRightsService) {}

  @Get('requests')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'List Data Subject Rights (SAR/Erasure) requests' })
  async listRequests(@Req() req: AuthenticatedRequest) {
    const tenantId = getTenantId(req);
    return this.dataRightsService.listRequests(tenantId);
  }

  @Post('requests')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Log a new Data Subject Rights request' })
  async createRequest(
    @Body(new ZodValidationPipe(createDataRightsRequestSchema))
    dto: CreateDataRightsRequestDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = getTenantId(req);
    return this.dataRightsService.createRequest(tenantId, req.user.userId, dto);
  }

  @Get('residents/:id/sar-export')
  @Roles('Admin', 'Manager')
  @ApiOperation({
    summary:
      'Export complete Resident Subject Access Request (Art 15) & Portability (Art 20) dossier (JSON or PDF)',
  })
  async exportResidentSar(
    @Param('id') residentId: string,
    @Query(new ZodValidationPipe(sarExportQuerySchema))
    query: SarExportQueryDTO,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    const tenantId = getTenantId(req);
    const safeQuery = query ?? {
      format: 'json' as const,
      redactionConfirmed: false,
    };
    const bundle = await this.dataRightsService.buildResidentSarBundle(
      residentId,
      tenantId,
      {
        userId: req.user.userId,
        email: req.user.email,
        fullName: req.user.fullName,
        roleName: req.user.roleName,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
      safeQuery,
    );

    const dateStr = new Date().toISOString().split('T')[0];
    if (safeQuery.format === 'pdf') {
      streamSarDossierPdf(
        res,
        `Resident Subject Access Dossier — ${bundle.identityAndDemographics.fullName}`,
        `resident-sar-${residentId.slice(0, 8)}-${dateStr}.pdf`,
        bundle,
      );
      return;
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="resident-sar-${residentId.slice(0, 8)}-${dateStr}.json"`,
    );
    res.send(JSON.stringify(bundle, null, 2));
  }

  @Get('staff/:id/sar-export')
  @Roles('Admin', 'Manager')
  @ApiOperation({
    summary:
      'Export complete Staff Subject Access Request (Art 15) dossier (JSON or PDF)',
  })
  async exportStaffSar(
    @Param('id') staffId: string,
    @Query(new ZodValidationPipe(sarExportQuerySchema))
    query: SarExportQueryDTO,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    const tenantId = getTenantId(req);
    const safeQuery = query ?? {
      format: 'json' as const,
      redactionConfirmed: false,
    };
    const bundle = await this.dataRightsService.buildStaffSarBundle(
      staffId,
      tenantId,
      {
        userId: req.user.userId,
        email: req.user.email,
        fullName: req.user.fullName,
        roleName: req.user.roleName,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
      safeQuery,
    );

    const dateStr = new Date().toISOString().split('T')[0];
    if (safeQuery.format === 'pdf') {
      streamSarDossierPdf(
        res,
        `Staff Subject Access Dossier — ${bundle.identityAndEmployment.fullName}`,
        `staff-sar-${staffId.slice(0, 8)}-${dateStr}.pdf`,
        bundle,
      );
      return;
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="staff-sar-${staffId.slice(0, 8)}-${dateStr}.json"`,
    );
    res.send(JSON.stringify(bundle, null, 2));
  }
}
