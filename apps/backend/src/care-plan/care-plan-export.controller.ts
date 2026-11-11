import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import {
  UpdateCarePlanSectionSchema,
  type UpdateCarePlanSectionDTO,
} from '@repo/schema';
import { CarePlanPdfService } from './care-plan-pdf.service';
import { CarePlanSectionService } from './care-plan-section.service';
import { CarePlanAutoDraftService } from './care-plan-auto-draft.service';

@Controller('care-plan')
@UseGuards(JwtAuthGuard)
export class CarePlanExportController {
  constructor(
    private readonly pdfService: CarePlanPdfService,
    private readonly sectionService: CarePlanSectionService,
    private readonly autoDraftService: CarePlanAutoDraftService,
  ) {}

  /**
   * Generates and downloads the Person-Centred Care Plan PDF matching CQC reference structure
   */
  @Get(':id/pdf')
  async downloadCarePlanPdf(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.pdfService.generateCarePlanPdf(
      id,
      req.user.tenantId!,
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length.toString());
    res.end(buffer);
  }

  /**
   * Retrieves full export payload as JSON
   */
  @Get(':id/export-data')
  async getExportData(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.pdfService.getHydratedExportData(id, req.user.tenantId!);
  }

  /**
   * Retrieves all person-centred domain sections for a care plan
   */
  @Get(':id/sections')
  async getSections(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.sectionService.getSections(id, req.user.tenantId!);
  }

  /**
   * Updates an individual person-centred domain section
   */
  @Put(':id/sections/:sectionName')
  async updateSection(
    @Param('id') id: string,
    @Param('sectionName') sectionName: string,
    @Body(new ZodValidationPipe(UpdateCarePlanSectionSchema))
    dto: UpdateCarePlanSectionDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.sectionService.updateSection(
      id,
      sectionName,
      dto,
      req.user.tenantId!,
      req.user.userId,
    );
  }

  /**
   * Manually or automatically initiates a Draft v1 Care Plan from an Enquiry's Needs Assessment
   */
  @Post('auto-draft/:residentId')
  async autoDraftFromAdmission(
    @Param('residentId') residentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.autoDraftService.generateDraftFromAdmission(
      residentId,
      req.user.tenantId!,
      req.user.userId,
    );
  }
}
