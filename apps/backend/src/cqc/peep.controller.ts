import {
  Controller,
  Post,
  Get,
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
import { PeepRecordDTO, peepRecordSchema } from '@repo/schema';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { PeepService } from './peep.service';

@ApiTags('PEEP - Personal Emergency Evacuation Plan (CQC Reg 12/15)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cqc/peep')
export class PeepController {
  constructor(private readonly peepService: PeepService) {}

  @Post()
  @Roles('Nurse', 'Admin', 'Manager')
  @ApiOperation({
    summary:
      'G-08: Create or update a resident Personal Emergency Evacuation Plan',
  })
  @ApiResponse({ status: 200, description: 'PEEP record saved' })
  async upsert(
    @Body(new ZodValidationPipe(peepRecordSchema)) dto: PeepRecordDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.peepService.upsertPeep(
      dto,
      req.user.userId,
      req.user.tenantId!,
    );
  }

  @Get('resident/:residentId')
  @Roles('Carer', 'Nurse', 'Admin', 'Manager')
  @ApiOperation({ summary: 'G-08: Get PEEP record for a resident' })
  async getByResident(
    @Param('residentId') residentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.peepService.getByResident(residentId, req.user.tenantId!);
  }

  @Get()
  @Roles('Carer', 'Nurse', 'Admin', 'Manager')
  @ApiOperation({
    summary: 'G-08: List all resident PEEP records for emergency readiness',
  })
  async getAllTenantPeeps(@Req() req: AuthenticatedRequest) {
    return this.peepService.getAllTenantPeeps(req.user.tenantId!);
  }
}
