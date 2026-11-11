import {
  Controller,
  Get,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin-stats')
  @Roles('Admin', 'Manager')
  async getAdminStats(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user.tenantId;
    if (!tenantId) {
      throw new UnauthorizedException('Tenant context is missing');
    }
    return this.dashboardService.getAdminStats(tenantId);
  }

  @Get('my-tasks')
  @Roles('Admin', 'Manager', 'Carer', 'Nurse')
  async getMyTasks(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user.tenantId;
    if (!tenantId) {
      throw new UnauthorizedException('Tenant context is missing');
    }
    return this.dashboardService.getMyTasks(req.user.userId, tenantId);
  }
}
