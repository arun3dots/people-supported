import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { OrganizationDocumentsService } from './organization-documents.service';
import {
  updateTenantSchema,
  acceptDpaSchema,
  updateTenantRetentionPolicySchema,
  type UpdateTenantDTO,
  type AcceptDpaDTO,
  type UpdateTenantRetentionPolicyDTO,
} from '@repo/schema';
import { prisma } from '@repo/db';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuditService } from '../audit/audit.service';

@ApiTags('Organization')
@Controller('organization')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly orgDocsService: OrganizationDocumentsService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @Roles('Admin')
  @ApiOperation({ summary: 'Get organization profile' })
  async getProfile(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user.tenantId;
    if (!tenantId) throw new ForbiddenException('Tenant context missing');
    return this.tenantsService.findOne(tenantId);
  }

  @Patch()
  @Roles('Admin')
  @ApiOperation({ summary: 'Update organization profile' })
  async updateProfile(
    @Body(new ZodValidationPipe(updateTenantSchema)) updateDto: UpdateTenantDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    if (!tenantId) throw new ForbiddenException('Tenant context missing');

    return this.tenantsService.updateOwnProfile(tenantId, updateDto, userId);
  }

  /**
   * A-02 & A-04: Retrieve tenant DPA and Privacy Notice acceptance status
   * plus tenant-level security/privacy controls.
   */
  @Get('dpa-status')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Get Article 28 DPA & Privacy acceptance status' })
  async getDpaStatus(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user.tenantId;
    if (!tenantId) throw new ForbiddenException('Tenant context missing');

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        dpaVersion: true,
        dpaAcceptedAt: true,
        dpaAcceptedByEmail: true,
        privacyNoticeVersion: true,
        termsAcceptedAt: true,
        enforceMfaForAllStaff: true,
        enablePageViewGeolocation: true,
      },
    });

    return {
      ...tenant,
      currentRequiredDpaVersion: 'v1.0-2026-10',
      isDpaAccepted: Boolean(tenant?.dpaAcceptedAt && tenant?.dpaVersion),
    };
  }

  /**
   * A-02 & A-04: Record formal Article 28 Data Processing Agreement (DPA)
   * and Privacy Notice acceptance by the tenant Controller.
   */
  @Post('accept-dpa')
  @Roles('Admin')
  @ApiOperation({ summary: 'Accept Article 28 DPA and Privacy Notice' })
  async acceptDpa(
    @Body(new ZodValidationPipe(acceptDpaSchema)) dto: AcceptDpaDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user.tenantId;
    if (!tenantId) throw new ForbiddenException('Tenant context missing');

    const now = new Date();
    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        dpaVersion: dto.dpaVersion,
        dpaAcceptedAt: now,
        dpaAcceptedByEmail: req.user.email,
        privacyNoticeVersion: dto.privacyNoticeVersion,
        termsAcceptedAt: now,
        ...(dto.enforceMfaForAllStaff !== undefined && {
          enforceMfaForAllStaff: dto.enforceMfaForAllStaff,
        }),
        ...(dto.enablePageViewGeolocation !== undefined && {
          enablePageViewGeolocation: dto.enablePageViewGeolocation,
        }),
      },
    });

    void this.auditService.emitConsent({
      tenantId,
      userId: req.user.userId,
      userEmail: req.user.email,
      userFullName: req.user.fullName,
      userRoleName: req.user.roleName,
      actionType: 'DPA_ACCEPTED',
      entityType: 'Tenant',
      entityId: tenantId,
      newValue: {
        dpaVersion: dto.dpaVersion,
        privacyNoticeVersion: dto.privacyNoticeVersion,
        acceptedAt: now.toISOString(),
        acceptedByEmail: req.user.email,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return {
      success: true,
      dpaVersion: updated.dpaVersion,
      dpaAcceptedAt: updated.dpaAcceptedAt,
      dpaAcceptedByEmail: updated.dpaAcceptedByEmail,
    };
  }

  @Get('documents')
  @Roles('Admin')
  @ApiOperation({
    summary: 'Get organization statutory and registration documents',
  })
  async getDocuments(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user.tenantId;
    if (!tenantId) throw new ForbiddenException('Tenant context missing');
    return this.orgDocsService.getDocuments(tenantId);
  }

  @Post('documents/upload')
  @Roles('Admin')
  @ApiOperation({ summary: 'Upload an organization document' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
    @Body('category') category?: string,
  ) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    if (!tenantId) throw new ForbiddenException('Tenant context missing');

    return this.orgDocsService.uploadDocument(tenantId, userId, file, category);
  }

  @Delete('documents/:id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Delete an organization document' })
  async deleteDocument(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    if (!tenantId) throw new ForbiddenException('Tenant context missing');

    return this.orgDocsService.deleteDocument(tenantId, id, userId);
  }

  /**
   * B-10: Tenant Retention Policy (UK GDPR Art 5(1)(e) & NHS Records Management Code 2021).
   */
  @Get('retention-policy')
  @Roles('Admin')
  @ApiOperation({ summary: 'Get tenant data retention policy' })
  async getRetentionPolicy(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user.tenantId;
    if (!tenantId) throw new ForbiddenException('Tenant context missing');

    const policy = await prisma.tenantRetentionPolicy.findUnique({
      where: { tenantId },
    });

    return (
      policy ?? {
        tenantId,
        adultCareRecordsYears: 8,
        staffHrRecordsYears: 6,
        financialRecordsYears: 7,
        incidentSafeguardingYrs: 10,
        dsarComplaintsYears: 6,
        autoPurgeExpiredTokens: true,
        lastRetentionRunAt: null,
      }
    );
  }

  @Patch('retention-policy')
  @Roles('Admin')
  @ApiOperation({ summary: 'Update tenant data retention policy' })
  async updateRetentionPolicy(
    @Body(new ZodValidationPipe(updateTenantRetentionPolicySchema))
    dto: UpdateTenantRetentionPolicyDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    if (!tenantId) throw new ForbiddenException('Tenant context missing');

    return prisma.tenantRetentionPolicy.upsert({
      where: { tenantId },
      create: {
        tenantId,
        ...dto,
        updatedById: userId,
      },
      update: {
        ...dto,
        updatedById: userId,
      },
    });
  }
}
