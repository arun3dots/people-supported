import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ShiftRequestsService } from './shift-requests.service';
import {
  CreateShiftRequestDto,
  UpdateShiftRequestStatusDto,
} from './dto/shift-requests.dto';
import {
  CreateShiftRequestSchema,
  UpdateShiftRequestStatusSchema,
} from '@repo/schema';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { requireBranchId } from '../common/utils/scope.util';

@ApiTags('Shift Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shift-requests')
export class ShiftRequestsController {
  constructor(private readonly shiftRequestsService: ShiftRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new shift request (leave, change, etc.)' })
  create(
    @Body(new ZodValidationPipe(CreateShiftRequestSchema))
    createDto: CreateShiftRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.shiftRequestsService.create(
      createDto,
      req.user.tenantId!,
      req.user.userId,
      requireBranchId(req),
    );
  }

  @Get()
  @ApiOperation({
    summary:
      'Get all shift requests (Staff see their own, Admins see all for tenant)',
  })
  findAll(@Req() req: AuthenticatedRequest) {
    const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(
      req.user.roleName.toUpperCase(),
    );
    return this.shiftRequestsService.findAll(
      req.user.tenantId!,
      isAdmin ? undefined : req.user.userId,
    );
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update shift request status (Admin only)' })
  updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateShiftRequestStatusSchema))
    updateDto: UpdateShiftRequestStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.shiftRequestsService.updateStatus(
      id,
      updateDto,
      req.user.tenantId!,
      req.user.userId,
    );
  }
}
