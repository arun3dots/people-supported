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
import { ComplaintsService } from './complaints.service';
import {
  CreateComplaintSchema,
  CreateComplaintDTO,
  UpdateComplaintSchema,
  UpdateComplaintDTO,
} from '@repo/schema';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { getTenantId } from '../common/utils/scope.util';
import { AuditService } from '../audit/audit.service';

@Controller('complaints')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComplaintsController {
  constructor(
    private readonly complaintsService: ComplaintsService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @Roles('Admin', 'Manager')
  async createComplaint(
    @Body(new ZodValidationPipe(CreateComplaintSchema))
    dto: CreateComplaintDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = getTenantId(req);
    return this.complaintsService.createComplaint(
      dto,
      req.user.userId,
      tenantId,
    );
  }

  @Get()
  @Roles('Admin', 'Manager')
  async listComplaints(
    @Query('type') type: string | undefined,
    @Query('status') status: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = getTenantId(req);
    const list = await this.complaintsService.listComplaints(
      tenantId,
      type,
      status,
    );
    this.auditService
      .emitDataAccess({
        tenantId,
        userId: req.user.userId,
        userEmail: req.user.email,
        userFullName: req.user.fullName,
        userRoleName: req.user.roleName,
        actionType: 'VIEW_INCIDENT',
        entityType: 'Complaint',
        entityId: 'ALL',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      })
      .catch(() => {});
    return list;
  }

  @Get(':id')
  @Roles('Admin', 'Manager')
  async getComplaint(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = getTenantId(req);
    const complaint = await this.complaintsService.getComplaint(id, tenantId);
    this.auditService
      .emitDataAccess({
        tenantId,
        userId: req.user.userId,
        userEmail: req.user.email,
        userFullName: req.user.fullName,
        userRoleName: req.user.roleName,
        actionType: 'VIEW_INCIDENT',
        entityType: 'Complaint',
        entityId: id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      })
      .catch(() => {});
    return complaint;
  }

  @Patch(':id')
  @Roles('Admin', 'Manager')
  async updateComplaint(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateComplaintSchema))
    dto: UpdateComplaintDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = getTenantId(req);
    return this.complaintsService.updateComplaint(
      id,
      dto,
      req.user.userId,
      tenantId,
    );
  }
}
