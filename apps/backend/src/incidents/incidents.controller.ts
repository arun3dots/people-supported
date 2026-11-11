import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IncidentsService } from './incidents.service';
import { DutyOfCandourService } from './services/duty-of-candour.service';
import {
  CreateIncidentDTO,
  CreateIncidentSchema,
  UpdateIncidentDTO,
  UpdateIncidentSchema,
  RecordDutyOfCandourDTO,
  RecordDutyOfCandourSchema,
  RecordCqcNotificationDTO,
  RecordCqcNotificationSchema,
  NotifyNextOfKinDTO,
  NotifyNextOfKinSchema,
  incidentListQuerySchema,
  type IncidentListQueryDTO,
} from '@repo/schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { requireBranchId, resolveBranchId } from '../common/utils/scope.util';

@Controller('incidents')
@UseGuards(JwtAuthGuard)
export class IncidentsController {
  constructor(
    private readonly incidentsService: IncidentsService,
    private readonly dutyOfCandourService: DutyOfCandourService,
  ) {}

  @Post()
  async create(
    @Body(new ZodValidationPipe(CreateIncidentSchema))
    dto: CreateIncidentDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.incidentsService.create(
      dto,
      req.user.tenantId!,
      req.user.userId,
      requireBranchId(req, dto.branchId),
    );
  }

  /** Paginated list of incidents. Pass all=true to bypass pagination. */
  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query(new ZodValidationPipe(incidentListQuerySchema))
    query?: IncidentListQueryDTO,
  ) {
    // The JWT's active branch always wins over a client-supplied branchId.
    const branchId = resolveBranchId(req, query?.branchId);
    return this.incidentsService.findAll(req.user.tenantId!, {
      ...query,
      branchId,
    });
  }

  @Get('metrics')
  async getMetrics(@Req() req: AuthenticatedRequest) {
    return this.incidentsService.getMetrics(req.user.tenantId);
  }

  @Get('duty-of-candour/pending')
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Manager')
  async getPendingDutyOfCandour(@Req() req: AuthenticatedRequest) {
    return this.dutyOfCandourService.findPendingDutyOfCandourIncidents(
      req.user.tenantId!,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.incidentsService.findOne(id, req.user.tenantId!);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateIncidentSchema))
    dto: UpdateIncidentDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.incidentsService.update(id, dto, req.user.tenantId!);
  }

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.incidentsService.uploadAttachment(
      id,
      file,
      req.user.tenantId!,
      req.user.userId,
    );
  }

  @Post(':id/notify-nok')
  async notifyNextOfKin(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(NotifyNextOfKinSchema)) dto: NotifyNextOfKinDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.incidentsService.notifyNextOfKin(
      id,
      dto,
      req.user.tenantId!,
      req.user.userId,
    );
  }

  @Patch(':id/duty-of-candour')
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Manager')
  async recordDutyOfCandour(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(RecordDutyOfCandourSchema))
    dto: RecordDutyOfCandourDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.dutyOfCandourService.recordDutyOfCandour(
      id,
      req.user.tenantId!,
      req.user.userId,
      dto,
    );
  }

  @Patch(':id/cqc-notification')
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Manager')
  async recordCqcNotification(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(RecordCqcNotificationSchema))
    dto: RecordCqcNotificationDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.dutyOfCandourService.recordCqcNotification(
      id,
      req.user.tenantId!,
      req.user.userId,
      dto,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.incidentsService.remove(id, req.user.tenantId!);
  }
}
