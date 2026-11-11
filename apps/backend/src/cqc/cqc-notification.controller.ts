import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import {
  CreateCqcNotificationDTO,
  createCqcNotificationSchema,
  SubmitCqcNotificationDTO,
  submitCqcNotificationSchema,
} from '@repo/schema';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { CqcNotificationService } from './cqc-notification.service';

@ApiTags('CQC Statutory Notifications (CQC Reg 16/18)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cqc/notifications')
export class CqcNotificationController {
  constructor(private readonly service: CqcNotificationService) {}

  @Post()
  @Roles('Nurse', 'Admin', 'Manager')
  @ApiOperation({
    summary: 'G-14: Record an incident requiring statutory notification to CQC',
  })
  @ApiResponse({ status: 201, description: 'Notification logged' })
  async recordNotice(
    @Body(new ZodValidationPipe(createCqcNotificationSchema))
    dto: CreateCqcNotificationDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.recordNotice(dto, req.user.userId, req.user.tenantId!);
  }

  @Patch(':id/submit')
  @Roles('Admin', 'Manager')
  @ApiOperation({
    summary:
      'G-14: Mark CQC statutory notice as formally submitted with reference',
  })
  async markSubmitted(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(submitCqcNotificationSchema))
    dto: SubmitCqcNotificationDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.markSubmitted(
      id,
      dto,
      req.user.userId,
      req.user.tenantId!,
    );
  }

  @Get()
  @Roles('Nurse', 'Admin', 'Manager')
  @ApiOperation({ summary: 'G-14: List statutory CQC notifications' })
  @ApiQuery({ name: 'status', required: false })
  async findAll(
    @Query('status') status: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.findAll(req.user.tenantId!, status);
  }

  @Get('pending')
  @Roles('Nurse', 'Admin', 'Manager')
  @ApiOperation({ summary: 'G-14: List pending unsubmitted CQC notifications' })
  async findPending(@Req() req: AuthenticatedRequest) {
    return this.service.findPending(req.user.tenantId!);
  }
}
