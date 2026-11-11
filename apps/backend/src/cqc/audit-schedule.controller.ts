import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import {
  CreateAuditScheduleDTO,
  createAuditScheduleSchema,
  CompleteAuditScheduleDTO,
  completeAuditScheduleSchema,
} from '@repo/schema';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { AuditScheduleService } from './audit-schedule.service';

@ApiTags('Audit Schedule (CQC Reg 17 Good Governance)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cqc/audits')
export class AuditScheduleController {
  constructor(private readonly service: AuditScheduleService) {}

  @Post('schedule')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'G-10: Schedule a clinical or governance audit' })
  @ApiResponse({ status: 201, description: 'Audit scheduled' })
  async createSchedule(
    @Body(new ZodValidationPipe(createAuditScheduleSchema))
    dto: CreateAuditScheduleDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.createSchedule(
      dto,
      req.user.userId,
      req.user.tenantId!,
    );
  }

  @Patch(':id/complete')
  @Roles('Nurse', 'Admin', 'Manager')
  @ApiOperation({
    summary: 'G-10: Record completion of an audit with score and findings',
  })
  async completeAudit(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(completeAuditScheduleSchema))
    dto: CompleteAuditScheduleDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.completeAudit(
      id,
      dto,
      req.user.userId,
      req.user.tenantId!,
    );
  }

  @Get()
  @Roles('Nurse', 'Admin', 'Manager')
  @ApiOperation({ summary: 'G-10: List audit schedule calendar' })
  @ApiQuery({ name: 'status', required: false })
  async getCalendar(
    @Query('status') status: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getCalendar(req.user.tenantId!, status);
  }

  @Get('overdue')
  @Roles('Nurse', 'Admin', 'Manager')
  @ApiOperation({ summary: 'G-10: List overdue audits requiring attention' })
  async getOverdue(@Req() req: AuthenticatedRequest) {
    return this.service.getDueOrOverdue(req.user.tenantId!);
  }
}
