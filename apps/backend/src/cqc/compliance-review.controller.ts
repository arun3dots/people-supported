import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import {
  ComplianceReviewQueryDTO,
  complianceReviewQuerySchema,
  ComplianceReviewResponseDTO,
} from '@repo/schema';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { ComplianceReviewService } from './compliance-review.service';

@ApiTags('Compliance Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('compliance/reviews')
export class ComplianceReviewController {
  constructor(private readonly service: ComplianceReviewService) {}

  @Get()
  @Roles('Admin', 'Manager', 'Nurse')
  @ApiOperation({
    summary: 'Get unified list of expiring support plans, staff certifications, and medications',
  })
  @ApiResponse({ status: 200, description: 'Compliance review feed retrieved' })
  async getComplianceReviews(
    @Query(new ZodValidationPipe(complianceReviewQuerySchema))
    query: ComplianceReviewQueryDTO,
    @Req() req: AuthenticatedRequest,
  ): Promise<ComplianceReviewResponseDTO> {
    return this.service.getComplianceReviews(req.user.tenantId!, query);
  }
}

