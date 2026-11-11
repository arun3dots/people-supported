import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import {
  CreateSupervisionDTO,
  createSupervisionSchema,
  CreateAppraisalDTO,
  createAppraisalSchema,
} from '@repo/schema';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { StaffSupervisionService } from './staff-supervision.service';

@ApiTags('Staff Supervision & Appraisals (CQC Reg 18)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cqc/staff')
export class StaffSupervisionController {
  constructor(private readonly service: StaffSupervisionService) {}

  @Post('supervisions')
  @Roles('Nurse', 'Admin', 'Manager')
  @ApiOperation({
    summary: 'G-05: Record a staff supervision session (CQC Reg 18)',
  })
  @ApiResponse({ status: 201, description: 'Supervision logged' })
  async createSupervision(
    @Body(new ZodValidationPipe(createSupervisionSchema))
    dto: CreateSupervisionDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.createSupervision(
      dto,
      req.user.userId,
      req.user.tenantId!,
    );
  }

  @Get('supervisions')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'G-05: List all tenant staff supervisions' })
  async getAllSupervisions(@Req() req: AuthenticatedRequest) {
    return this.service.getAllTenantSupervisions(req.user.tenantId!);
  }

  @Get('supervisions/:staffId')
  @Roles('Nurse', 'Admin', 'Manager')
  @ApiOperation({ summary: 'G-05: Get supervision records for a staff member' })
  async getStaffSupervisions(
    @Param('staffId') staffId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getStaffSupervisions(staffId, req.user.tenantId!);
  }

  @Post('appraisals')
  @Roles('Admin', 'Manager')
  @ApiOperation({
    summary: 'G-11: Record an annual staff performance appraisal',
  })
  @ApiResponse({ status: 201, description: 'Appraisal logged' })
  async createAppraisal(
    @Body(new ZodValidationPipe(createAppraisalSchema)) dto: CreateAppraisalDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.createAppraisal(
      dto,
      req.user.userId,
      req.user.tenantId!,
    );
  }

  @Get('appraisals/:staffId')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'G-11: Get appraisal history for a staff member' })
  async getStaffAppraisals(
    @Param('staffId') staffId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getStaffAppraisals(staffId, req.user.tenantId!);
  }
}
