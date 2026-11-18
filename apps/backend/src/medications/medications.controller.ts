import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Patch,
  Param,
  Get,
  Delete,
  ForbiddenException,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResidentsService } from '../residents/residents.service';
import {
  CreateMedicationRoundSchema,
  CreateMedicationRoundDTO,
  CreateMedicationRoundBulkSchema,
  CreateMedicationRoundBulkDTO,
  StopMedicationPrescriptionSchema,
  StopMedicationPrescriptionDTO,
  ChangeMedicationPrescriptionSchema,
  ChangeMedicationPrescriptionDTO,
  PauseMedicationPrescriptionSchema,
  PauseMedicationPrescriptionDTO,
  AdministerMedicationSchema,
  AdministerMedicationDTO,
  AdministerAdHocMedicationSchema,
  AdministerAdHocMedicationDTO,
  AmendMedAdministrationSchema,
  AmendMedAdministrationDTO,
  DeleteMedicationRoundSchema,
  DeleteMedicationRoundDTO,
} from '@repo/schema';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import type { PreAdmissionPartCDTO } from '@repo/schema';
import { ResidentMedicationRoundsService } from '../residents/services/resident-medication-rounds.service';

@Controller('medications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MedicationsController {
  constructor(
    private readonly residentsService: ResidentsService,
    private readonly medicationRounds: ResidentMedicationRoundsService,
  ) {}

  private getTenantId(req: AuthenticatedRequest): string {
    if (!req.user.tenantId) {
      throw new ForbiddenException(
        'Tenant isolation failure - Tenant ID missing',
      );
    }
    return req.user.tenantId;
  }

  @Get('residents/:residentId')
  @Roles('Admin', 'Manager', 'Carer', 'Nurse')
  async getMedicationRounds(
    @Param('residentId') residentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.residentsService.getMedicationRounds(
      residentId,
      this.getTenantId(req),
    );
  }

  @Get('residents/:residentId/onboarding-medicines')
  @Roles('Admin', 'Manager', 'Carer', 'Nurse')
  getOnboardingMedicines(
    @Param('residentId') residentId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<PreAdmissionPartCDTO['medicines']> {
    return this.medicationRounds.getOnboardingMedicines(
      residentId,
      this.getTenantId(req),
    );
  }

  @Post('residents/:residentId')
  @Roles('Admin', 'Manager', 'Nurse')
  async createMedicationRound(
    @Param('residentId') residentId: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(CreateMedicationRoundSchema))
    body: CreateMedicationRoundDTO,
  ) {
    return this.residentsService.createMedicationRound(
      residentId,
      body,
      req.user.userId,
      this.getTenantId(req),
    );
  }

  @Post('residents/:residentId/bulk')
  @Roles('Admin', 'Manager', 'Nurse')
  async createMedicationRoundsBulk(
    @Param('residentId') residentId: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(CreateMedicationRoundBulkSchema))
    body: CreateMedicationRoundBulkDTO,
  ) {
    return this.residentsService.createMedicationPrescription(
      residentId,
      body,
      req.user.userId,
      this.getTenantId(req),
    );
  }

  @Get('residents/:residentId/prescriptions')
  @Roles('Admin', 'Manager', 'Carer', 'Nurse')
  async listMedicationPrescriptions(
    @Param('residentId') residentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.residentsService.listMedicationPrescriptions(
      residentId,
      this.getTenantId(req),
    );
  }

  @Post('prescriptions/:id/stop')
  @Roles('Admin', 'Manager', 'Nurse')
  async stopMedicationPrescription(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(StopMedicationPrescriptionSchema))
    body: StopMedicationPrescriptionDTO,
  ) {
    return this.residentsService.stopMedicationPrescription(
      id,
      body,
      req.user.userId,
      this.getTenantId(req),
    );
  }

  @Post('prescriptions/:id/change')
  @Roles('Admin', 'Manager', 'Nurse')
  async changeMedicationPrescription(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(ChangeMedicationPrescriptionSchema))
    body: ChangeMedicationPrescriptionDTO,
  ) {
    return this.residentsService.changeMedicationPrescription(
      id,
      body,
      req.user.userId,
      this.getTenantId(req),
    );
  }

  @Post('prescriptions/:id/pause')
  @Roles('Admin', 'Manager', 'Nurse')
  async pauseMedicationPrescription(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(PauseMedicationPrescriptionSchema))
    body: PauseMedicationPrescriptionDTO,
  ) {
    return this.residentsService.pauseMedicationPrescription(
      id,
      body,
      req.user.userId,
      this.getTenantId(req),
    );
  }

  @Patch(':id')
  @Roles('Admin', 'Manager', 'Nurse')
  async updateMedicationRound(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(CreateMedicationRoundSchema.partial()))
    body: Partial<CreateMedicationRoundDTO>,
  ) {
    return this.residentsService.updateMedicationRound(
      id,
      body,
      req.user.userId,
      this.getTenantId(req),
    );
  }

  @Delete(':id')
  @Roles('Admin', 'Manager', 'Nurse')
  async deleteMedicationRound(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(DeleteMedicationRoundSchema))
    body: DeleteMedicationRoundDTO,
  ) {
    return this.residentsService.deleteMedicationRound(
      id,
      req.user.userId,
      this.getTenantId(req),
      body.reason,
    );
  }

  @Post('administer')
  @Roles('Admin', 'Manager', 'Carer', 'Nurse')
  async administerMedication(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(AdministerMedicationSchema))
    body: AdministerMedicationDTO,
  ) {
    return this.residentsService.administerMedication(
      body,
      req.user.userId,
      this.getTenantId(req),
    );
  }

  /**
   * B-06: Clinical Rectification Strike-Through Workflow for eMAR administration.
   * Preserves the original administration and marks it superseded.
   */
  @Post('administrations/:id/amend')
  @Roles('Admin', 'Manager', 'Nurse')
  async amendMedicationAdministration(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(AmendMedAdministrationSchema))
    body: AmendMedAdministrationDTO,
  ) {
    return this.residentsService.amendMedicationAdministration(
      id,
      body,
      req.user.userId,
      this.getTenantId(req),
    );
  }
  @Post('residents/:residentId/adhoc')
  @Roles('Admin', 'Manager', 'Carer', 'Nurse')
  async administerAdHocMedication(
    @Param('residentId') residentId: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(AdministerAdHocMedicationSchema))
    body: AdministerAdHocMedicationDTO,
  ) {
    return this.residentsService.administerAdHocMedication(
      residentId,
      body,
      req.user.userId,
      this.getTenantId(req),
    );
  }

  @Post('residents/:residentId/upload-image')
  @Roles('Admin', 'Manager', 'Nurse', 'Carer')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadMedicationImage(
    @Param('residentId') residentId: string,
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException(
        'Image file too large. Photos must be 5MB or smaller.',
      );
    }
    const tenantId = this.getTenantId(req);
    const path = `tenant-${tenantId}/residents/${residentId}/medications`;
    const uploadResult = await this.residentsService.uploadDocumentFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      path,
    );
    const baseUrl =
      process.env.API_URL ||
      `http://localhost:${process.env.BE_PORT || 4400}/api`;
    const imageUrl = `${baseUrl}/documents/stream?path=${encodeURIComponent(uploadResult.fileUrl)}&v=${Date.now()}`;

    return {
      success: true,
      imageUrl,
      fileUrl: uploadResult.fileUrl,
    };
  }
}
