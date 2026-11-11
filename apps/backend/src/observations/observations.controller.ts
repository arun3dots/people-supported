import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ObservationsService } from './observations.service';
import {
  ObservationSchema,
  ObservationDTO,
  CorrectObservationSchema,
  CorrectObservationDTO,
} from '@repo/schema';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { getTenantId } from '../common/utils/scope.util';
import { AuditService } from '../audit/audit.service';

@Controller('observations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ObservationsController {
  constructor(
    private readonly observationsService: ObservationsService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @Roles('Admin', 'Manager', 'Nurse', 'Carer')
  async create(
    @Body(new ZodValidationPipe(ObservationSchema)) dto: ObservationDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = getTenantId(req);
    return this.observationsService.create(dto, req.user.userId, tenantId);
  }

  /**
   * B-06: Clinical Rectification Strike-Through Workflow (UK GDPR Art 16 & CQC Reg 17).
   */
  @Post(':id/correct')
  @Roles('Admin', 'Manager', 'Nurse', 'Carer')
  async correct(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CorrectObservationSchema))
    dto: CorrectObservationDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = getTenantId(req);
    const result = await this.observationsService.correct(
      id,
      dto,
      req.user.userId,
      tenantId,
    );
    this.auditService
      .emitClinicalDoc({
        tenantId,
        userId: req.user.userId,
        userEmail: req.user.email,
        userFullName: req.user.fullName,
        userRoleName: req.user.roleName,
        actionType: 'CARE_NOTE_AMENDED',
        entityType: 'Observation',
        entityId: result.replacement.id,
        residentId: result.replacement.residentId,
        oldValue: { supersededObservationId: result.originalId },
        newValue: {
          correctionReason: dto.correctionReason,
          news2Score: result.replacement.news2Score,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      })
      .catch(() => {});
    return result;
  }

  @Get('resident/:residentId')
  @Roles('Admin', 'Manager', 'Nurse', 'Carer')
  async findAllByResident(
    @Param('residentId') residentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = getTenantId(req);
    const observations = await this.observationsService.findAllByResident(
      residentId,
      tenantId,
    );
    this.auditService
      .emitDataAccess({
        tenantId,
        userId: req.user.userId,
        userEmail: req.user.email,
        userFullName: req.user.fullName,
        userRoleName: req.user.roleName,
        actionType: 'VIEW_OBSERVATIONS',
        entityType: 'Resident',
        entityId: residentId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      })
      .catch(() => {});
    return observations;
  }

  @Get(':id')
  @Roles('Admin', 'Manager', 'Nurse', 'Carer')
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const tenantId = getTenantId(req);
    const observation = await this.observationsService.findOne(id, tenantId);
    this.auditService
      .emitDataAccess({
        tenantId,
        userId: req.user.userId,
        userEmail: req.user.email,
        userFullName: req.user.fullName,
        userRoleName: req.user.roleName,
        actionType: 'VIEW_OBSERVATION',
        entityType: 'Observation',
        entityId: id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      })
      .catch(() => {});
    return observation;
  }
}
