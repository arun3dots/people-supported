import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Put,
  Delete,
  UseGuards,
  Query,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { EnquiriesService } from './enquiries.service';
import {
  CreateEnquiryStage1DTO,
  CreateEnquiryStage1Schema,
  CreateEnquiryDraftDTO,
  CreateEnquiryDraftSchema,
  UpdateEnquiryAssessmentDTO,
  UpdateEnquiryAssessmentSchema,
  CreateAssessmentTemplateDTO,
  CreateAssessmentTemplateSchema,
  UpdateAssessmentTemplateDTO,
  UpdateAssessmentTemplateSchema,
  enquiryListQuerySchema,
  type EnquiryListQueryDTO,
  OptOutEnquiryDTO,
  optOutEnquirySchema,
} from '@repo/schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { requireBranchId, resolveBranchId } from '../common/utils/scope.util';

@Controller('enquiries')
@UseGuards(JwtAuthGuard)
export class EnquiriesController {
  constructor(private readonly enquiriesService: EnquiriesService) {}

  private getTenantId(req: AuthenticatedRequest): string {
    if (!req.user.tenantId) {
      throw new ForbiddenException(
        'Tenant context is required to access enquiries',
      );
    }
    return req.user.tenantId;
  }

  // --- Templates Endpoints (Placed before :id routes) ---

  @Get('templates')
  async getTemplates(@Req() req: AuthenticatedRequest) {
    return this.enquiriesService.getTemplates(this.getTenantId(req));
  }

  @Get('templates/:templateId')
  async getTemplateById(
    @Param('templateId') templateId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.enquiriesService.getTemplateById(
      templateId,
      this.getTenantId(req),
    );
  }

  @Post('templates')
  async createTemplate(
    @Body(new ZodValidationPipe(CreateAssessmentTemplateSchema))
    dto: CreateAssessmentTemplateDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.enquiriesService.createTemplate(dto, this.getTenantId(req));
  }

  @Put('templates/:templateId')
  async updateTemplate(
    @Param('templateId') templateId: string,
    @Body(new ZodValidationPipe(UpdateAssessmentTemplateSchema))
    dto: UpdateAssessmentTemplateDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.enquiriesService.updateTemplate(
      templateId,
      dto,
      this.getTenantId(req),
    );
  }

  @Delete('templates/:templateId')
  async deleteTemplate(
    @Param('templateId') templateId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.enquiriesService.deleteTemplate(
      templateId,
      this.getTenantId(req),
    );
  }

  // --- Enquiry CRUD Endpoints ---

  @Post()
  async create(
    @Body(
      new ZodValidationPipe(
        CreateEnquiryStage1Schema.or(CreateEnquiryDraftSchema),
      ),
    )
    dto: CreateEnquiryStage1DTO | CreateEnquiryDraftDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.enquiriesService.create(
      dto,
      this.getTenantId(req),
      requireBranchId(req, dto.branchId),
    );
  }

  /** Paginated list. Pass `all=true` to bypass pagination. */
  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query(new ZodValidationPipe(enquiryListQuerySchema))
    query?: EnquiryListQueryDTO,
  ) {
    // The JWT's active branch always wins over a client-supplied branchId.
    const branchId = resolveBranchId(req, query?.branchId);
    return this.enquiriesService.findAll(this.getTenantId(req), {
      ...query,
      branchId,
    });
  }

  @Get('metrics')
  async getMetrics(@Req() req: AuthenticatedRequest) {
    return this.enquiriesService.getMetrics(this.getTenantId(req));
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.enquiriesService.findOne(id, this.getTenantId(req));
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateEnquiryAssessmentSchema))
    dto: UpdateEnquiryAssessmentDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.enquiriesService.update(id, dto, this.getTenantId(req));
  }

  @Post(':id/opt-out')
  async optOut(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(optOutEnquirySchema)) dto: OptOutEnquiryDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.enquiriesService.recordOptOut(
      id,
      dto.reason,
      this.getTenantId(req),
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.enquiriesService.remove(id, this.getTenantId(req));
  }
}
