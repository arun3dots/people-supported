import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import {
  BreakGlassDTO,
  breakGlassSchema,
  ReviewBreakGlassDTO,
  reviewBreakGlassSchema,
} from '@repo/schema';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { ResidentAccessService } from './services/resident-access.service';

@ApiTags('Resident Break-Glass Access')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('residents/break-glass')
export class ResidentBreakGlassController {
  constructor(private readonly accessService: ResidentAccessService) {}

  @Post(':residentId')
  @Roles('Carer', 'Nurse', 'Admin', 'Manager')
  @ApiOperation({
    summary:
      'D-10: Caldicott Principle 4/7 Emergency Break-Glass Access Override',
  })
  @ApiResponse({
    status: 201,
    description: 'Break-glass access granted for 4 hours',
  })
  async requestBreakGlass(
    @Param('residentId') residentId: string,
    @Body(new ZodValidationPipe(breakGlassSchema)) dto: BreakGlassDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.accessService.requestBreakGlassAccess(
      req.user,
      residentId,
      dto.reason,
    );
  }

  @Get('queue')
  @Roles('Admin', 'Manager')
  @ApiOperation({
    summary: 'D-10: Review queue for emergency break-glass access events',
  })
  @ApiResponse({
    status: 200,
    description: 'List of break-glass access events',
  })
  async getQueue(@Req() req: AuthenticatedRequest) {
    return this.accessService.getBreakGlassReviewQueue(req.user.tenantId!);
  }

  @Patch(':id/review')
  @Roles('Admin', 'Manager')
  @ApiOperation({
    summary: 'D-10: Review and sign off an emergency break-glass event',
  })
  @ApiResponse({ status: 200, description: 'Break-glass event reviewed' })
  async review(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(reviewBreakGlassSchema))
    dto: ReviewBreakGlassDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.accessService.reviewBreakGlassAccess(
      id,
      dto.reviewNotes,
      req.user.userId,
      req.user.tenantId!,
    );
  }
}
