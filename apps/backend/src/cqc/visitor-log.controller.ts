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
  CreateVisitorLogDTO,
  createVisitorLogSchema,
  SignOutVisitorDTO,
  signOutVisitorSchema,
} from '@repo/schema';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { VisitorLogService } from './visitor-log.service';

@ApiTags('Visitor Log (CQC Reg 9A/10)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('visitors')
export class VisitorLogController {
  constructor(private readonly visitorService: VisitorLogService) {}

  @Post()
  @Roles('Carer', 'Nurse', 'Admin', 'Manager')
  @ApiOperation({
    summary: 'G-02: Sign in a visitor for a resident (CQC Reg 9A/10)',
  })
  @ApiResponse({ status: 201, description: 'Visitor signed in' })
  async create(
    @Body(new ZodValidationPipe(createVisitorLogSchema))
    dto: CreateVisitorLogDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.visitorService.create(dto, req.user.userId, req.user.tenantId!);
  }

  @Patch(':id/sign-out')
  @Roles('Carer', 'Nurse', 'Admin', 'Manager')
  @ApiOperation({ summary: 'G-02: Sign out a visitor' })
  @ApiResponse({ status: 200, description: 'Visitor signed out' })
  async signOut(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(signOutVisitorSchema)) dto: SignOutVisitorDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.visitorService.signOut(
      id,
      dto,
      req.user.userId,
      req.user.tenantId!,
    );
  }

  @Get('active')
  @Roles('Carer', 'Nurse', 'Admin', 'Manager')
  @ApiOperation({ summary: 'G-02: List all currently active on-site visitors' })
  async findActive(@Req() req: AuthenticatedRequest) {
    return this.visitorService.findActiveVisitors(req.user.tenantId!);
  }

  @Get('resident/:residentId')
  @Roles('Carer', 'Nurse', 'Admin', 'Manager')
  @ApiOperation({ summary: 'G-02: List visitor history for a resident' })
  async findByResident(
    @Param('residentId') residentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.visitorService.findAllByResident(
      residentId,
      req.user.tenantId!,
    );
  }
}
