import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  CreateFoodFluidLogDTO,
  CreateFoodFluidLogSchema,
  UpdateFoodFluidLogDTO,
  UpdateFoodFluidLogSchema,
  FoodFluidLogQueryDTO,
  FoodFluidLogQuerySchema,
} from '@repo/schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { ResidentFoodFluidService } from './services/resident-food-fluid.service';

@Controller('residents/:id/food-fluid')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResidentFoodFluidController {
  constructor(private readonly foodFluidService: ResidentFoodFluidService) {}

  @Post()
  @Roles('Admin', 'Manager', 'Nurse', 'Carer')
  async recordFoodFluid(
    @Param('id') residentId: string,
    @Body(new ZodValidationPipe(CreateFoodFluidLogSchema))
    dto: CreateFoodFluidLogDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.foodFluidService.recordFoodFluid(
      residentId,
      req.user.tenantId!,
      req.user.userId,
      dto,
    );
  }

  @Get()
  @Roles('Admin', 'Manager', 'Nurse', 'Carer', 'Resident')
  async getLogs(
    @Param('id') residentId: string,
    @Query(new ZodValidationPipe(FoodFluidLogQuerySchema))
    query: FoodFluidLogQueryDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.foodFluidService.getLogs(residentId, req.user.tenantId!, query);
  }

  @Get('summary')
  @Roles('Admin', 'Manager', 'Nurse', 'Carer', 'Resident')
  async getSummary(
    @Param('id') residentId: string,
    @Query('date') date: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.foodFluidService.getSummary(
      residentId,
      req.user.tenantId!,
      date,
    );
  }

  @Patch(':logId')
  @Roles('Admin', 'Manager', 'Nurse', 'Carer')
  async updateLog(
    @Param('id') residentId: string,
    @Param('logId') logId: string,
    @Body(new ZodValidationPipe(UpdateFoodFluidLogSchema))
    dto: UpdateFoodFluidLogDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.foodFluidService.updateLog(
      residentId,
      logId,
      req.user.tenantId!,
      req.user.userId,
      dto,
    );
  }

  @Delete(':logId')
  @Roles('Admin', 'Manager', 'Nurse', 'Carer')
  async deleteLog(
    @Param('id') residentId: string,
    @Param('logId') logId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.foodFluidService.deleteLog(
      residentId,
      logId,
      req.user.tenantId!,
      req.user.userId,
    );
  }
}
