import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { EscalationsService } from './escalations.service';
import {
  CreateClinicalEscalationDTO,
  CreateClinicalEscalationSchema,
  TriageClinicalEscalationDTO,
  TriageClinicalEscalationSchema,
  ManagerSignOffEscalationDTO,
  ManagerSignOffEscalationSchema,
  EscalationQueryDTO,
  EscalationQuerySchema,
} from '@repo/schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import {
  getTenantId,
  resolveBranchId,
  requireBranchId,
} from '../common/utils/scope.util';

@Controller('escalations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EscalationsController {
  constructor(private readonly escalationsService: EscalationsService) {}

  @Post()
  @Roles('Carer', 'Nurse', 'Manager', 'Admin', 'SuperAdmin')
  async create(
    @Body(new ZodValidationPipe(CreateClinicalEscalationSchema))
    dto: CreateClinicalEscalationDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = getTenantId(req);
    const resolvedBranchId = requireBranchId(req, dto.branchId);
    return this.escalationsService.create(
      dto,
      tenantId,
      req.user.userId,
      resolvedBranchId,
    );
  }

  @Get()
  @Roles('Carer', 'Nurse', 'Manager', 'Admin', 'SuperAdmin')
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query(new ZodValidationPipe(EscalationQuerySchema))
    query?: EscalationQueryDTO,
  ) {
    const tenantId = getTenantId(req);
    const branchScope = resolveBranchId(req, query?.branchId);
    return this.escalationsService.findAll(tenantId, branchScope, query);
  }

  @Get('summary/shift')
  @Roles('Carer', 'Nurse', 'Manager', 'Admin', 'SuperAdmin')
  async getShiftSummary(
    @Req() req: AuthenticatedRequest,
    @Query('branchId') explicitBranchId?: string,
  ) {
    const tenantId = getTenantId(req);
    const branchId = requireBranchId(req, explicitBranchId);
    return this.escalationsService.getShiftSummary(tenantId, branchId);
  }

  @Get(':id')
  @Roles('Carer', 'Nurse', 'Manager', 'Admin', 'SuperAdmin')
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const tenantId = getTenantId(req);
    const branchScope = resolveBranchId(req);
    return this.escalationsService.findOne(id, tenantId, branchScope);
  }

  @Patch(':id/triage')
  @Roles('Nurse', 'Manager', 'Admin', 'SuperAdmin')
  async triage(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(TriageClinicalEscalationSchema))
    dto: TriageClinicalEscalationDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = getTenantId(req);
    const branchScope = resolveBranchId(req);
    return this.escalationsService.triage(
      id,
      dto,
      tenantId,
      req.user.userId,
      branchScope,
    );
  }

  @Post(':id/sign-off')
  @Roles('Manager', 'Admin', 'SuperAdmin')
  async managerSignOff(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ManagerSignOffEscalationSchema))
    dto: ManagerSignOffEscalationDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = getTenantId(req);
    return this.escalationsService.managerSignOff(
      id,
      dto,
      tenantId,
      req.user.userId,
    );
  }
}
