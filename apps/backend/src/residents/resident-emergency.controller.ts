import { Controller, Get, Param, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import type {
  EmergencyDirectoryResponseDTO,
  EmergencyResidentSummaryDTO,
} from '@repo/schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../common/interfaces/request.interface';
import type { ActorContext } from '../common/interfaces/actor.interface';
import { getTenantId, resolveBranchId } from '../common/utils/scope.util';
import { ResidentEmergencyService } from './services/resident-emergency.service';
import { EmergencyHandoverPackService } from './services/emergency-handover-pack.service';

/**
 * Read-only emergency access to residents outside the caller's assignment.
 * Intentionally GET-only; every summary view is audit-logged by the service.
 */
@Controller('emergency-directory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Carer', 'Nurse', 'Manager')
export class ResidentEmergencyController {
  constructor(
    private readonly emergencyService: ResidentEmergencyService,
    private readonly handoverPackService: EmergencyHandoverPackService,
  ) {}

  @Get()
  async list(
    @Req() req: AuthenticatedRequest,
  ): Promise<EmergencyDirectoryResponseDTO> {
    return this.emergencyService.listDirectory(
      getTenantId(req),
      req.user.userId,
      resolveBranchId(req),
    );
  }

  @Get(':id')
  async getSummary(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<EmergencyResidentSummaryDTO> {
    const tenantId = getTenantId(req);
    const actor: ActorContext = {
      tenantId,
      userId: req.user.userId,
      userEmail: req.user.email,
      userFullName: req.user.fullName ?? '',
      roleName: req.user.roleName,
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'],
    };
    return this.emergencyService.getSummary(
      id,
      tenantId,
      resolveBranchId(req),
      actor,
    );
  }

  /**
   * I-06: One-Click Print Emergency MAR & Handover Pack (CQC Reg 12 & NICE SC1).
   * Streams device-agnostic, high-contrast printable HTML for offline outage continuity.
   */
  @Get(':id/print-pack')
  async getPrintableHandoverPack(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const tenantId = getTenantId(req);
    const actor: ActorContext = {
      tenantId,
      userId: req.user.userId,
      userEmail: req.user.email,
      userFullName: req.user.fullName ?? '',
      roleName: req.user.roleName,
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'],
    };
    const summary = await this.emergencyService.getSummary(
      id,
      tenantId,
      resolveBranchId(req),
      actor,
    );
    const html = this.handoverPackService.generatePrintableHtml(summary);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.send(html);
  }
}
