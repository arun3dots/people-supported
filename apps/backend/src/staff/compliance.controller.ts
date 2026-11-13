import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  NotFoundException,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  ForbiddenException,
  BadRequestException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Response } from 'express';

import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';
import {
  CreateRtwDto,
  CreateDbsCheckDto,
  CreateCertificationDto,
  UpdateCertificationDto,
  CreateHealthClearanceDto,
  CreateImmunisationDto,
  UpdateImmunisationDto,
} from './dto/compliance.dto';
import {
  createRtwSchema,
  createDbsCheckSchema,
  createCertificationSchema,
  updateCertificationSchema,
  createHealthClearanceSchema,
  createImmunisationSchema,
  updateImmunisationSchema,
} from '@repo/schema';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../common/interfaces/request.interface';
import { ActorContext } from '../common/interfaces/actor.interface';

@ApiTags('Staff Compliance')
@ApiBearerAuth()
@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  private getTenantId(req: AuthenticatedRequest): string {
    if (!req.user.tenantId) {
      throw new ForbiddenException('Tenant ID missing');
    }
    return req.user.tenantId;
  }

  private actor(req: AuthenticatedRequest): ActorContext {
    const u: AuthenticatedUser = req.user;
    if (!u.tenantId) {
      throw new ForbiddenException('Tenant context required.');
    }
    return {
      tenantId: u.tenantId,
      userId: u.userId,
      userEmail: u.email,
      userFullName: u.fullName ?? '',
      roleName: u.roleName,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    };
  }

  // ──────────────── RTW ────────────────

  @Put(':id/compliance/rtw')
  @Roles('Admin')
  @ApiOperation({ summary: 'Create or update RTW verification' })
  @ApiResponse({ status: 200, description: 'RTW record upserted' })
  async upsertRtw(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createRtwSchema)) dto: CreateRtwDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.complianceService.upsertRtw(id, dto, this.actor(req));
  }

  @Get(':id/compliance/rtw')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Get RTW details for a staff member' })
  async getRtw(@Param('id') id: string) {
    return this.complianceService.getRtw(id);
  }

  // ──────────────── DBS ────────────────

  @Put(':id/compliance/dbs')
  @Roles('Admin')
  @ApiOperation({ summary: 'Create or update DBS check' })
  @ApiResponse({ status: 200, description: 'DBS record upserted' })
  async upsertDbs(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createDbsCheckSchema)) dto: CreateDbsCheckDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.complianceService.upsertDbs(id, dto, this.actor(req));
  }

  @Get(':id/compliance/dbs')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Get DBS check details for a staff member' })
  async getDbs(@Param('id') id: string) {
    return this.complianceService.getDbs(id);
  }

  // ──────────────── Certifications ────────────────

  @Post(':id/compliance/certifications')
  @Roles('Admin')
  @ApiOperation({ summary: 'Add a certification' })
  @ApiResponse({ status: 201, description: 'Certification created' })
  async createCertification(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createCertificationSchema))
    dto: CreateCertificationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.complianceService.createCertification(id, dto, this.actor(req));
  }

  @Put(':id/compliance/certifications/:certId')
  @Roles('Admin')
  @ApiOperation({ summary: 'Update a certification' })
  async updateCertification(
    @Param('certId') certId: string,
    @Body(new ZodValidationPipe(updateCertificationSchema))
    dto: UpdateCertificationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.complianceService.updateCertification(
      certId,
      dto,
      this.actor(req),
    );
  }

  @Get(':id/compliance/certifications')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Get all certifications for a staff member' })
  async getCertifications(@Param('id') id: string) {
    return this.complianceService.getCertifications(id);
  }

  @Delete(':id/compliance/certifications/:certId')
  @Roles('Admin')
  @ApiOperation({ summary: 'Delete a certification' })
  async deleteCertification(
    @Param('certId') certId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.complianceService.deleteCertification(certId, this.actor(req));
  }

  // ──────────────── Health Clearance ────────────────

  @Put(':id/compliance/health')
  @Roles('Admin')
  @ApiOperation({ summary: 'Create or update health clearance' })
  @ApiResponse({ status: 200, description: 'Health clearance upserted' })
  async upsertHealthClearance(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createHealthClearanceSchema))
    dto: CreateHealthClearanceDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.complianceService.upsertHealthClearance(
      id,
      dto,
      this.actor(req),
    );
  }

  @Get(':id/compliance/health')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Get health clearance for a staff member' })
  async getHealthClearance(@Param('id') id: string) {
    return this.complianceService.getHealthClearance(id);
  }

  // ──────────────── Immunisations ────────────────

  @Post(':id/compliance/immunisations')
  @Roles('Admin')
  @ApiOperation({ summary: 'Add an immunisation record' })
  @ApiResponse({ status: 201, description: 'Immunisation created' })
  async createImmunisation(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createImmunisationSchema))
    dto: CreateImmunisationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.complianceService.createImmunisation(id, dto, this.actor(req));
  }

  @Put(':id/compliance/immunisations/:immId')
  @Roles('Admin')
  @ApiOperation({ summary: 'Update an immunisation record' })
  async updateImmunisation(
    @Param('immId') immId: string,
    @Body(new ZodValidationPipe(updateImmunisationSchema))
    dto: UpdateImmunisationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.complianceService.updateImmunisation(
      immId,
      dto,
      this.actor(req),
    );
  }

  @Get(':id/compliance/immunisations')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Get immunisation records for a staff member' })
  async getImmunisations(@Param('id') id: string) {
    return this.complianceService.getImmunisations(id);
  }

  @Delete(':id/compliance/immunisations/:immId')
  @Roles('Admin')
  @ApiOperation({ summary: 'Delete an immunisation record' })
  async deleteImmunisation(
    @Param('immId') immId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.complianceService.deleteImmunisation(immId, this.actor(req));
  }

  // ──────────────── Aggregated ────────────────

  @Get(':id/compliance')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Get full compliance data for a staff member' })
  async getFullCompliance(@Param('id') id: string) {
    return this.complianceService.getFullCompliance(id);
  }

  // ──────────────── Reports ────────────────

  @Get('compliance-report')
  @Roles('Admin')
  @ApiOperation({
    summary: 'Get compliance report for all staff in the tenant',
  })
  async getComplianceReport(@Req() req: AuthenticatedRequest) {
    return this.complianceService.getComplianceReport(this.getTenantId(req));
  }

  // ──────────────── Document Upload ────────────────

  @Post(':id/compliance/upload')
  @Roles('Admin')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a compliance document' })
  @ApiResponse({ status: 201, description: 'Document uploaded' })
  async uploadDocument(
    @Param('id') id: string,
    @Query('domain') domain: string,
    @Query('certId') certId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const validDomains = ['rtw', 'dbs', 'certification', 'health'];
    if (!validDomains.includes(domain)) {
      throw new BadRequestException(
        `Invalid domain. Must be one of: ${validDomains.join(', ')}`,
      );
    }

    return this.complianceService.uploadComplianceDocument(
      id,
      domain as 'rtw' | 'dbs' | 'certification' | 'health',
      file.buffer,
      file.originalname,
      file.mimetype,
      this.actor(req),
      certId || undefined,
    );
  }

  @Get(':id/compliance/signed-url')
  @Roles('Admin', 'Manager', 'Nurse', 'Carer')
  @ApiOperation({ summary: 'Get signed view URL for compliance document' })
  async getSignedUrl(@Param('id') id: string, @Query('path') filePath: string) {
    const url = await this.complianceService.getSignedDocumentUrl(filePath, id);
    return { url };
  }

  @Get(':id/compliance/document-stream')
  @Roles('Admin', 'Manager', 'Nurse', 'Carer')
  @ApiOperation({ summary: 'Stream private compliance document directly' })
  async streamDocument(@Query('path') filePath: string, @Res() res: Response) {
    if (!filePath) {
      throw new BadRequestException('Document path is required');
    }

    const { exists, contentType } =
      await this.complianceService.getObjectMetadata(filePath);
    if (!exists) {
      throw new NotFoundException('Document file not found in storage');
    }

    res.setHeader('Content-Type', contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=3600');

    const stream = this.complianceService.getFileStream(filePath);
    stream.on('error', (err) => {
      console.error('Error streaming document:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error streaming file' });
      }
    });
    stream.pipe(res);
  }
}
