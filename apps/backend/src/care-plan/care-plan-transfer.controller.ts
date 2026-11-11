import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { CarePlanTransferService } from './care-plan-transfer.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';

@Controller('care-plan')
@UseGuards(JwtAuthGuard)
export class CarePlanTransferController {
  constructor(private readonly transferService: CarePlanTransferService) {}

  @Get('transfer-pack/:residentId')
  async getHospitalTransferPack(
    @Param('residentId') residentId: string,
    @Query('reason') reason: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.transferService.generateTransferPack(
      residentId,
      req.user.tenantId!,
      req.user.userId,
      reason,
    );
  }
}
