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
  CreateEquipmentLogDTO,
  createEquipmentLogSchema,
  UpdateEquipmentStatusDTO,
  updateEquipmentStatusSchema,
} from '@repo/schema';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { EquipmentMaintenanceService } from './equipment-maintenance.service';

@ApiTags('Equipment Maintenance (CQC Reg 15)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cqc/equipment')
export class EquipmentMaintenanceController {
  constructor(private readonly service: EquipmentMaintenanceService) {}

  @Post()
  @Roles('Admin', 'Manager')
  @ApiOperation({
    summary: 'G-03: Log new equipment maintenance inspection or service',
  })
  @ApiResponse({ status: 201, description: 'Equipment logged' })
  async create(
    @Body(new ZodValidationPipe(createEquipmentLogSchema))
    dto: CreateEquipmentLogDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.create(dto, req.user.userId, req.user.tenantId!);
  }

  @Get()
  @Roles('Carer', 'Nurse', 'Admin', 'Manager')
  @ApiOperation({ summary: 'G-03: List equipment maintenance records' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'status', required: false })
  async findAll(
    @Query('category') category: string | undefined,
    @Query('status') status: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.findAll(req.user.tenantId!, category, status);
  }

  @Get('due-soon')
  @Roles('Nurse', 'Admin', 'Manager')
  @ApiOperation({
    summary: 'G-03: List equipment due for service within specified days',
  })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async findDueSoon(
    @Query('days') days: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    const parsedDays = days ? parseInt(days, 10) : 30;
    return this.service.findDueSoon(
      req.user.tenantId!,
      isNaN(parsedDays) ? 30 : parsedDays,
    );
  }

  @Patch(':id/status')
  @Roles('Nurse', 'Admin', 'Manager')
  @ApiOperation({
    summary:
      'G-03: Update equipment maintenance status (Pass/Fail/OutOfService)',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateEquipmentStatusSchema))
    dto: UpdateEquipmentStatusDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.updateStatus(
      id,
      dto,
      req.user.userId,
      req.user.tenantId!,
    );
  }
}
