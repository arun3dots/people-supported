import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TenantOffboardingService } from './tenant-offboarding.service';
import {
  confirmTenantOffboardingPurgeSchema,
  ConfirmTenantOffboardingPurgeDTO,
} from '@repo/schema';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';

@Controller('super-admin/tenants/:id/offboarding')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SuperAdmin')
export class TenantOffboardingController {
  constructor(private readonly offboardingService: TenantOffboardingService) {}

  @Get('archive')
  async exportArchive(@Param('id') tenantId: string) {
    return this.offboardingService.generateHandoverArchive(tenantId);
  }

  @Post('purge')
  async confirmPurge(
    @Param('id') tenantId: string,
    @Body(new ZodValidationPipe(confirmTenantOffboardingPurgeSchema))
    dto: ConfirmTenantOffboardingPurgeDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.offboardingService.executePurgeAndIssueCertificate(
      tenantId,
      dto,
      req.user.userId,
    );
  }
}
