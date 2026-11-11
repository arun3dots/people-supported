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
import { McaDolsService } from './mca-dols.service';
import {
  CreateMentalCapacityAssessmentDTO,
  CreateMentalCapacityAssessmentSchema,
  UpdateMentalCapacityAssessmentDTO,
  UpdateMentalCapacityAssessmentSchema,
  CreateDolsAuthorizationDTO,
  CreateDolsAuthorizationSchema,
  UpdateDolsAuthorizationDTO,
  UpdateDolsAuthorizationSchema,
} from '@repo/schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';

@Controller('mca-dols')
@UseGuards(JwtAuthGuard)
export class McaDolsController {
  constructor(private readonly mcaDolsService: McaDolsService) {}

  // --- Mental Capacity Assessments ---

  @Post('assessments')
  async createAssessment(
    @Body(new ZodValidationPipe(CreateMentalCapacityAssessmentSchema))
    dto: CreateMentalCapacityAssessmentDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.mcaDolsService.createAssessment(
      req.user.tenantId!,
      req.user.userId,
      dto,
    );
  }

  @Get('assessments/resident/:residentId')
  async getAssessmentsByResident(
    @Param('residentId') residentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.mcaDolsService.getAssessmentsByResident(
      residentId,
      req.user.tenantId!,
    );
  }

  @Get('assessments/:id')
  async getAssessmentById(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.mcaDolsService.getAssessmentById(id, req.user.tenantId!);
  }

  @Patch('assessments/:id')
  async updateAssessment(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateMentalCapacityAssessmentSchema))
    dto: UpdateMentalCapacityAssessmentDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.mcaDolsService.updateAssessment(
      id,
      req.user.tenantId!,
      req.user.userId,
      dto,
    );
  }

  // --- DoLS Authorizations ---

  @Post('dols')
  async createDols(
    @Body(new ZodValidationPipe(CreateDolsAuthorizationSchema))
    dto: CreateDolsAuthorizationDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.mcaDolsService.createDols(
      req.user.tenantId!,
      req.user.userId,
      dto,
    );
  }

  @Get('dols/expiring')
  async getExpiringDols(
    @Query('daysAhead') daysAhead: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    const parsedDays = daysAhead ? parseInt(daysAhead, 10) : 30;
    return this.mcaDolsService.getExpiringDols(
      req.user.tenantId!,
      isNaN(parsedDays) ? 30 : parsedDays,
    );
  }

  @Get('dols/resident/:residentId')
  async getDolsByResident(
    @Param('residentId') residentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.mcaDolsService.getDolsByResident(
      residentId,
      req.user.tenantId!,
    );
  }

  @Get('dols/:id')
  async getDolsById(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.mcaDolsService.getDolsById(id, req.user.tenantId!);
  }

  @Patch('dols/:id')
  async updateDols(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateDolsAuthorizationSchema))
    dto: UpdateDolsAuthorizationDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.mcaDolsService.updateDols(
      id,
      req.user.tenantId!,
      req.user.userId,
      dto,
    );
  }
}
