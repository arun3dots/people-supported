import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CarePlanReviewService } from './care-plan-review.service';
import {
  CreateCarePlanReviewDTO,
  CreateCarePlanReviewSchema,
} from '@repo/schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';

@Controller('care-plan')
@UseGuards(JwtAuthGuard)
export class CarePlanReviewController {
  constructor(private readonly reviewService: CarePlanReviewService) {}

  @Post(':id/reviews')
  async createReview(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreateCarePlanReviewSchema))
    dto: CreateCarePlanReviewDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reviewService.createReview(
      id,
      req.user.tenantId!,
      req.user.userId,
      dto,
    );
  }

  @Get(':id/reviews')
  async getReviews(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.reviewService.getReviews(id, req.user.tenantId!);
  }

  @Get('residents/:residentId/reviews')
  async getResidentReviews(
    @Param('residentId') residentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reviewService.getResidentReviewHistory(
      residentId,
      req.user.tenantId!,
    );
  }
}
