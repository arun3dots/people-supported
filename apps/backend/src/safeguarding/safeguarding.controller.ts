import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SafeguardingService } from './safeguarding.service';
import {
  CreateSafeguardingReferralSchema,
  CreateSafeguardingReferralDTO,
  UpdateSafeguardingReferralSchema,
  UpdateSafeguardingReferralDTO,
} from '@repo/schema';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { getTenantId } from '../common/utils/scope.util';
import { AuditService } from '../audit/audit.service';

@Controller('safeguarding')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SafeguardingController {
  constructor(
    private readonly safeguardingService: SafeguardingService,
    private readonly auditService: AuditService,
  ) {}

  @Post('referrals')
  @Roles('Admin', 'Manager', 'Nurse')
  async createReferral(
    @Body(new ZodValidationPipe(CreateSafeguardingReferralSchema))
    dto: CreateSafeguardingReferralDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = getTenantId(req);
    return this.safeguardingService.createReferral(
      dto,
      req.user.userId,
      tenantId,
    );
  }

  @Get('referrals')
  @Roles('Admin', 'Manager', 'Nurse')
  async listReferrals(
    @Query('status') status: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = getTenantId(req);
    const list = await this.safeguardingService.listReferrals(tenantId, status);
    this.auditService
      .emitDataAccess({
        tenantId,
        userId: req.user.userId,
        userEmail: req.user.email,
        userFullName: req.user.fullName,
        userRoleName: req.user.roleName,
        actionType: 'VIEW_INCIDENT',
        entityType: 'SafeguardingReferral',
        entityId: 'ALL',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      })
      .catch(() => {});
    return list;
  }

  @Get('referrals/:id')
  @Roles('Admin', 'Manager', 'Nurse')
  async getReferral(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const tenantId = getTenantId(req);
    const referral = await this.safeguardingService.getReferral(id, tenantId);
    this.auditService
      .emitDataAccess({
        tenantId,
        userId: req.user.userId,
        userEmail: req.user.email,
        userFullName: req.user.fullName,
        userRoleName: req.user.roleName,
        actionType: 'VIEW_INCIDENT',
        entityType: 'SafeguardingReferral',
        entityId: id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      })
      .catch(() => {});
    return referral;
  }

  @Patch('referrals/:id')
  @Roles('Admin', 'Manager')
  async updateReferral(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateSafeguardingReferralSchema))
    dto: UpdateSafeguardingReferralDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = getTenantId(req);
    return this.safeguardingService.updateReferral(
      id,
      dto,
      req.user.userId,
      tenantId,
    );
  }
}
