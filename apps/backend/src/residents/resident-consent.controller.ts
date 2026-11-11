import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ResidentsService } from './residents.service';
import {
  CreateResidentConsentItemSchema,
  CreateResidentConsentItemDTO,
  WithdrawResidentConsentItemSchema,
  WithdrawResidentConsentItemDTO,
  UpdateResidentRecordStateSchema,
  UpdateResidentRecordStateDTO,
} from '@repo/schema';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { getTenantId } from '../common/utils/scope.util';
import { AuditService } from '../audit/audit.service';

@Controller('residents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResidentConsentController {
  constructor(
    private readonly residentsService: ResidentsService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * B-07: Erasure Requests, Processing Restriction & Legal Hold (UK GDPR Art 17/18 & CQC Reg 17).
   */
  @Patch(':id/record-state')
  @Roles('Admin', 'Manager')
  async updateRecordState(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateResidentRecordStateSchema))
    dto: UpdateResidentRecordStateDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = getTenantId(req);
    return this.residentsService.updateRecordState(
      id,
      dto,
      req.user.userId,
      tenantId,
    );
  }

  /**
   * B-03: Granular Per-Purpose Consent Tracking (UK GDPR Art 6/7/9, MCA 2005 & CQC Reg 11).
   */
  @Post(':id/consent-items')
  @Roles('Admin', 'Manager', 'Nurse')
  async createConsentItem(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreateResidentConsentItemSchema))
    dto: CreateResidentConsentItemDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = getTenantId(req);
    return this.residentsService.createConsentItem(
      { ...dto, residentId: id },
      req.user.userId,
      tenantId,
    );
  }

  @Get(':id/consent-items')
  @Roles('Admin', 'Manager', 'Nurse', 'Carer')
  async listConsentItems(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = getTenantId(req);
    const list = await this.residentsService.listConsentItems(id, tenantId);
    this.auditService
      .emitDataAccess({
        tenantId,
        userId: req.user.userId,
        userEmail: req.user.email,
        userFullName: req.user.fullName,
        userRoleName: req.user.roleName,
        actionType: 'VIEW_CARE_NOTE',
        entityType: 'Resident',
        entityId: id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      })
      .catch(() => {});
    return list;
  }

  @Patch(':id/consent-items/:consentItemId/withdraw')
  @Roles('Admin', 'Manager', 'Nurse')
  async withdrawConsentItem(
    @Param('id') _id: string,
    @Param('consentItemId') consentItemId: string,
    @Body(new ZodValidationPipe(WithdrawResidentConsentItemSchema))
    dto: WithdrawResidentConsentItemDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = getTenantId(req);
    return this.residentsService.withdrawConsentItem(
      consentItemId,
      dto,
      req.user.userId,
      tenantId,
    );
  }
}
