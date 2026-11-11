import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { resolveBranchId } from '../common/utils/scope.util';
import {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../common/interfaces/request.interface';
import {
  createRiskAssessmentSchema,
  updateRiskAssessmentSchema,
  transitionRiskStatusSchema,
  createRiskControlSchema,
  updateRiskControlSchema,
  completeRiskControlSchema,
  createRiskTemplateSchema,
  updateRiskTemplateSchema,
  riskListFiltersSchema,
  type CreateRiskAssessmentDTO,
  type UpdateRiskAssessmentDTO,
  type TransitionRiskStatusDTO,
  type CreateRiskControlDTO,
  type UpdateRiskControlDTO,
  type CompleteRiskControlDTO,
  type CreateRiskTemplateDTO,
  type UpdateRiskTemplateDTO,
  type RiskListFilters,
} from '@repo/schema';
import { RiskService } from './risk.service';
import { RiskTemplatesService } from './risk-templates.service';
import { RiskControlsService } from './risk-controls.service';
import { RiskAlertsService } from './risk-alerts.service';
import { RiskReportsService } from './risk-reports.service';
import type {
  RiskAssessmentWithRelations,
  RiskOverviewStats,
} from './risk.types';
import type { RiskAlert, RiskControl, RiskTemplate } from '@repo/db';

@ApiTags('Risk')
@ApiBearerAuth()
@Controller('risk')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RiskController {
  constructor(
    private readonly riskService: RiskService,
    private readonly templatesService: RiskTemplatesService,
    private readonly controlsService: RiskControlsService,
    private readonly alertsService: RiskAlertsService,
    private readonly reportsService: RiskReportsService,
  ) {}

  // ---- helpers ----
  private actor(req: AuthenticatedRequest) {
    const u: AuthenticatedUser = req.user;
    if (!u.tenantId) {
      throw new ForbiddenException('Tenant context required.');
    }
    return {
      tenantId: u.tenantId,
      userId: u.userId,
      userEmail: u.email,
      userFullName: u.fullName ?? '',
      roleName: u.roleName,
      canApprove: !!u.permissions?.riskAssessments?.approve,
    };
  }

  // ============ Assessments ============
  @Get('assessments')
  @Permissions('riskAssessments.read')
  async listAssessments(
    @Req() req: AuthenticatedRequest,
    @Query(new ZodValidationPipe(riskListFiltersSchema))
    filters: RiskListFilters,
  ): Promise<RiskAssessmentWithRelations[]> {
    const a = this.actor(req);
    const branchId = resolveBranchId(req, filters.branchId);
    return this.riskService.findAll(
      a.tenantId,
      branchId ? { ...filters, branchId } : filters,
    );
  }

  @Get('assessments/:id')
  @Permissions('riskAssessments.read')
  async getAssessment(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<RiskAssessmentWithRelations> {
    const a = this.actor(req);
    return this.riskService.findOne(id, a.tenantId, a);
  }

  @Post('assessments')
  @Permissions('riskAssessments.write')
  async createAssessment(
    @Body(new ZodValidationPipe(createRiskAssessmentSchema))
    dto: CreateRiskAssessmentDTO,
    @Req() req: AuthenticatedRequest,
  ): Promise<RiskAssessmentWithRelations> {
    return this.riskService.create(dto, this.actor(req));
  }

  @Patch('assessments/:id')
  @Permissions('riskAssessments.write')
  async updateAssessment(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateRiskAssessmentSchema))
    dto: UpdateRiskAssessmentDTO,
    @Req() req: AuthenticatedRequest,
  ): Promise<RiskAssessmentWithRelations> {
    return this.riskService.update(id, dto, this.actor(req));
  }

  @Post('assessments/:id/transition')
  @Permissions('riskAssessments.write')
  async transitionAssessment(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(transitionRiskStatusSchema))
    dto: TransitionRiskStatusDTO,
    @Req() req: AuthenticatedRequest,
  ): Promise<RiskAssessmentWithRelations> {
    return this.riskService.transitionStatus(id, dto, this.actor(req));
  }

  @Delete('assessments/:id')
  @Permissions('riskAssessments.delete')
  async deleteAssessment(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: true }> {
    return this.riskService.delete(id, this.actor(req));
  }

  // ============ Controls ============
  @Post('assessments/:id/controls')
  @Permissions('riskAssessments.write')
  async createControl(
    @Param('id') assessmentId: string,
    @Body(new ZodValidationPipe(createRiskControlSchema))
    dto: CreateRiskControlDTO,
    @Req() req: AuthenticatedRequest,
  ): Promise<RiskControl> {
    return this.controlsService.create(assessmentId, dto, this.actor(req));
  }

  @Patch('controls/:id')
  @Permissions('riskAssessments.write')
  async updateControl(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateRiskControlSchema))
    dto: UpdateRiskControlDTO,
    @Req() req: AuthenticatedRequest,
  ): Promise<RiskControl> {
    return this.controlsService.update(id, dto, this.actor(req));
  }

  @Post('controls/:id/complete')
  @Permissions('riskAssessments.write')
  async completeControl(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(completeRiskControlSchema))
    dto: CompleteRiskControlDTO,
    @Req() req: AuthenticatedRequest,
  ): Promise<RiskControl> {
    return this.controlsService.complete(id, dto, this.actor(req));
  }

  @Delete('controls/:id')
  @Permissions('riskAssessments.write')
  async deleteControl(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: true }> {
    return this.controlsService.delete(id, this.actor(req));
  }

  // ============ Templates ============
  @Get('templates')
  @Permissions('riskAssessments.read')
  async listTemplates(
    @Req() req: AuthenticatedRequest,
  ): Promise<RiskTemplate[]> {
    const a = this.actor(req);
    return this.templatesService.findAll(a.tenantId);
  }

  @Post('templates')
  @Permissions('riskAssessments.manageTemplates')
  async createTemplate(
    @Body(new ZodValidationPipe(createRiskTemplateSchema))
    dto: CreateRiskTemplateDTO,
    @Req() req: AuthenticatedRequest,
  ): Promise<RiskTemplate> {
    const a = this.actor(req);
    return this.templatesService.create(
      dto,
      a.tenantId,
      a.userId,
      a.userEmail,
      a.userFullName,
      a.roleName,
    );
  }

  @Patch('templates/:id')
  @Permissions('riskAssessments.manageTemplates')
  async updateTemplate(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateRiskTemplateSchema))
    dto: UpdateRiskTemplateDTO,
    @Req() req: AuthenticatedRequest,
  ): Promise<RiskTemplate> {
    const a = this.actor(req);
    return this.templatesService.update(
      id,
      dto,
      a.tenantId,
      a.userId,
      a.userEmail,
      a.userFullName,
      a.roleName,
    );
  }

  @Delete('templates/:id')
  @Permissions('riskAssessments.manageTemplates')
  async deleteTemplate(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: true }> {
    const a = this.actor(req);
    return this.templatesService.delete(
      id,
      a.tenantId,
      a.userId,
      a.userEmail,
      a.userFullName,
      a.roleName,
    );
  }

  // ============ Alerts ============
  @Get('alerts/unread')
  @Permissions('riskAssessments.read')
  async listUnreadAlerts(
    @Req() req: AuthenticatedRequest,
  ): Promise<RiskAlert[]> {
    const a = this.actor(req);
    return this.alertsService.listUnread(a.tenantId, a.userId);
  }

  @Post('alerts/:id/read')
  @Permissions('riskAssessments.read')
  async markAlertRead(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<RiskAlert> {
    const a = this.actor(req);
    return this.alertsService.markRead(id, a.tenantId, a.userId);
  }

  // ============ Reports ============
  @Get('reports/overview')
  @Permissions('riskAssessments.read')
  async getOverview(
    @Req() req: AuthenticatedRequest,
    @Query('branchId') branchId?: string,
  ): Promise<RiskOverviewStats> {
    const a = this.actor(req);
    // Branch-assigned users are pinned to their JWT branch; tenant-wide
    // callers may narrow with ?branchId=. undefined => whole tenant.
    return this.reportsService.getOverview(
      a.tenantId,
      resolveBranchId(req, branchId),
    );
  }
}
