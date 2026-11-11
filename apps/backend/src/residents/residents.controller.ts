import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  Patch,
  Delete,
  Param,
  Get,
  Query,
  UseInterceptors,
  UploadedFile,
  ForbiddenException,
  BadRequestException,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ResidentsService } from './residents.service';
import {
  DischargeResidentSchema,
  DischargeResidentDTO,
  AdmitStep1Schema,
  AdmitStep1DTO,
  AdmitStep3Schema,
  UpdateResidentFundingSchema,
  UpdateResidentFundingDTO,
  AdmitStep3DTO,
  AdmitConfirmSchema,
  AdmitConfirmDTO,
  ResidentMetricsDTO,
  ResidentInsightsDTO,
  residentListQuerySchema,
  ResidentListQueryDTO,
  PaginatedResponse,
  CreateCareNoteSchema,
  CreateCareNoteDTO,
  UpdateCareNoteSchema,
  UpdateCareNoteDTO,
  AssignCarerSchema,
  AssignCarerDTO,
  AssignBedSchema,
  AssignBedDTO,
  UpdateSupportedLivingDetailsSchema,
  UpdateSupportedLivingDetailsDTO,
} from '@repo/schema';
import {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../common/interfaces/request.interface';
import type { ActorContext } from '../common/interfaces/actor.interface';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Resident } from '@repo/db';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { AuditService } from '../audit/audit.service';
import { resolveBranchId } from '../common/utils/scope.util';

@Controller('residents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResidentsController {
  constructor(
    private readonly residentsService: ResidentsService,
    private readonly auditService: AuditService,
  ) {}

  private getTenantId(req: AuthenticatedRequest): string {
    if (!req.user.tenantId) {
      throw new ForbiddenException(
        'Tenant isolation failure - Tenant ID missing',
      );
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
      userAgent: req.headers?.['user-agent'],
    };
  }

  // Resident profile updates remain separate from the pre-admission wizard.
  @Patch(':id/personal-info')
  @Roles('Admin', 'Manager')
  async updatePersonalInfo(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(AdmitStep1Schema.partial()))
    body: AdmitStep1DTO,
  ): Promise<Resident> {
    return this.residentsService.updateResidentPersonalInfo(
      id,
      body,
      req.user.userId,
      this.getTenantId(req),
    );
  }

  @Patch(':id/funding')
  @Roles('Admin', 'Manager')
  async updateFunding(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(UpdateResidentFundingSchema))
    body: UpdateResidentFundingDTO,
  ): Promise<Resident> {
    return this.residentsService.updateFunding(
      id,
      body,
      req.user.userId,
      this.getTenantId(req),
    );
  }

  @Patch(':id/care-profile')
  @Roles('Admin', 'Manager')
  async updateCareProfile(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(AdmitStep3Schema)) body: AdmitStep3DTO,
  ): Promise<Resident> {
    return this.residentsService.updateResidentCareProfile(
      id,
      body,
      req.user.userId,
      this.getTenantId(req),
    );
  }

  @Patch(':id/supported-living')
  @Roles('Admin', 'Manager', 'Nurse', 'Carer')
  async updateSupportedLiving(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(UpdateSupportedLivingDetailsSchema))
    body: UpdateSupportedLivingDetailsDTO,
  ): Promise<Resident> {
    return this.residentsService.updateSupportedLivingDetails(
      id,
      body,
      req.user.userId,
      this.getTenantId(req),
    );
  }

  @Post('admit/:id/confirm')
  @Roles('Admin', 'Manager')
  async confirmAdmission(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(AdmitConfirmSchema)) body: AdmitConfirmDTO,
  ): Promise<Resident> {
    return this.residentsService.confirmAdmission(
      id,
      body,
      req.user.userId,
      this.getTenantId(req),
    );
  }

  @Patch(':id/discharge')
  @Roles('Admin', 'Manager')
  async dischargeResident(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(DischargeResidentSchema))
    body: DischargeResidentDTO,
  ): Promise<Resident> {
    return this.residentsService.dischargeResident(
      id,
      body,
      req.user.userId,
      this.getTenantId(req),
    );
  }

  @Get()
  @Roles('Admin', 'Manager', 'Carer', 'Nurse')
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query(new ZodValidationPipe(residentListQuerySchema))
    query?: ResidentListQueryDTO,
  ): Promise<PaginatedResponse<Resident>> {
    // The JWT's active branch always wins over a client-supplied branchId.
    const branchId = resolveBranchId(req, query?.branchId);
    return this.residentsService.findAll(
      this.getTenantId(req),
      req.user.userId,
      { ...query, branchId },
      this.actor(req),
    );
  }

  @Get('metrics')
  @Roles('Admin', 'Manager', 'Carer', 'Nurse')
  async getMetrics(
    @Req() req: AuthenticatedRequest,
  ): Promise<ResidentMetricsDTO> {
    return this.residentsService.getMetrics(this.getTenantId(req));
  }

  @Get('insights')
  @Roles('Admin', 'Manager', 'Carer', 'Nurse')
  async getInsights(
    @Req() req: AuthenticatedRequest,
  ): Promise<ResidentInsightsDTO> {
    return this.residentsService.getInsights(this.getTenantId(req));
  }

  @Get(':id')
  @Roles('Admin', 'Manager', 'Carer', 'Nurse')
  async findOne(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<Resident> {
    return this.residentsService.findOne(
      id,
      this.getTenantId(req),
      req.user.userId,
      this.actor(req),
    );
  }

  @Get(':id/timeline')
  @Roles('Admin', 'Manager', 'Carer', 'Nurse')
  async getTimeline(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.residentsService.getTimeline(id, this.getTenantId(req));
  }

  @Post(':id/notes')
  @Roles('Admin', 'Manager', 'Carer', 'Nurse')
  async addCareNote(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(CreateCareNoteSchema)) body: CreateCareNoteDTO,
  ) {
    return this.residentsService.addCareNote(
      id,
      body,
      req.user.userId,
      this.getTenantId(req),
    );
  }

  @Patch(':id/notes/:noteId')
  @Roles('Admin', 'Manager', 'Carer', 'Nurse')
  async updateCareNote(
    @Param('id') residentId: string,
    @Param('noteId') noteId: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(UpdateCareNoteSchema)) body: UpdateCareNoteDTO,
  ) {
    return this.residentsService.updateCareNote(
      residentId,
      noteId,
      body,
      req.user.userId,
      this.getTenantId(req),
    );
  }

  @Delete(':id/notes/:noteId')
  @Roles('Admin', 'Manager')
  async deleteCareNote(
    @Param('id') residentId: string,
    @Param('noteId') noteId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.residentsService.deleteCareNote(
      residentId,
      noteId,
      req.user.userId,
      this.getTenantId(req),
    );
  }

  @Get(':id/suggest-carers')
  @Roles('Admin', 'Manager')
  async suggestCarers(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.residentsService.suggestSuitableCarers(
      id,
      this.getTenantId(req),
    );
  }

  @Post(':id/assign-carer')
  @Roles('Admin', 'Manager')
  async assignCarer(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(AssignCarerSchema)) body: AssignCarerDTO,
  ) {
    return this.residentsService.assignCarerToResident(
      id,
      body.carerId,
      this.getTenantId(req),
      req.user.userId,
    );
  }

  @Post(':id/assign-bed')
  @Roles('Admin', 'Manager')
  async assignBed(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(AssignBedSchema)) body: AssignBedDTO,
  ) {
    return this.residentsService.assignResidentToBed(
      id,
      body.bedId,
      this.getTenantId(req),
      req.user.userId,
    );
  }

  @Get(':id/photo')
  // Same roles as resident detail — photos appear on carer/nurse dashboards.
  // Tenant isolation is enforced by the resident lookup in the service.
  @Roles('Admin', 'Manager', 'Carer', 'Nurse')
  async getPhoto(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { stream, contentType } =
      await this.residentsService.getResidentPhoto(id, this.getTenantId(req));

    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=300',
    });

    return new StreamableFile(stream);
  }

  @Post('admit/photo-upload')
  @Roles('Admin', 'Manager', 'Nurse')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAdmissionPhoto(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const tenantId = this.getTenantId(req);
    const path = `tenant-${tenantId}/admissions/photos`;
    const uploadResult = await this.residentsService.uploadDocumentFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      path,
    );
    const baseUrl =
      process.env.API_URL ||
      `http://localhost:${process.env.BE_PORT || 4400}/api`;
    const photoUrl = `${baseUrl}/documents/stream?path=${encodeURIComponent(uploadResult.fileUrl)}&v=${Date.now()}`;

    return {
      success: true,
      photoUrl,
      fileUrl: uploadResult.fileUrl,
    };
  }

  @Post('admit/document-upload')
  @Roles('Admin', 'Manager', 'Nurse')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAdmissionDocument(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const tenantId = this.getTenantId(req);
    const path = `tenant-${tenantId}/admissions/documents`;
    const uploadResult = await this.residentsService.uploadDocumentFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      path,
    );
    const baseUrl =
      process.env.API_URL ||
      `http://localhost:${process.env.BE_PORT || 4400}/api`;
    const documentUrl = `${baseUrl}/documents/stream?path=${encodeURIComponent(uploadResult.fileUrl)}&v=${Date.now()}`;

    return {
      success: true,
      documentUrl,
      fileUrl: uploadResult.fileUrl,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
    };
  }

  @Post(':id/photo')
  @Roles('Admin', 'Manager', 'Nurse')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.residentsService.uploadResidentPhoto(
      id,
      file.buffer,
      file.originalname,
      file.mimetype,
      this.getTenantId(req),
      req.user.userId,
    );
  }
}
