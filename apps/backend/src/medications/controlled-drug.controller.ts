import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ControlledDrugService } from './controlled-drug.service';
import {
  CreateControlledDrugEntrySchema,
  CreateControlledDrugEntryDTO,
  CreateMedicationStockTransactionSchema,
  CreateMedicationStockTransactionDTO,
} from '@repo/schema';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { getTenantId } from '../common/utils/scope.util';
import { AuditService } from '../audit/audit.service';

@Controller('medications/controlled-drugs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ControlledDrugController {
  constructor(
    private readonly cdService: ControlledDrugService,
    private readonly auditService: AuditService,
  ) {}

  @Post('entries')
  @Roles('Admin', 'Manager', 'Nurse')
  async createEntry(
    @Body(new ZodValidationPipe(CreateControlledDrugEntrySchema))
    dto: CreateControlledDrugEntryDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = getTenantId(req);
    return this.cdService.createEntry(
      dto,
      req.user.userId,
      req.user.fullName ?? req.user.email,
      tenantId,
    );
  }

  @Get('resident/:residentId')
  @Roles('Admin', 'Manager', 'Nurse')
  async listEntries(
    @Param('residentId') residentId: string,
    @Query('drugName') drugName: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = getTenantId(req);
    const list = await this.cdService.listEntries(
      residentId,
      tenantId,
      drugName,
    );
    this.auditService
      .emitDataAccess({
        tenantId,
        userId: req.user.userId,
        userEmail: req.user.email,
        userFullName: req.user.fullName,
        userRoleName: req.user.roleName,
        actionType: 'VIEW_CONTROLLED_DRUG_REGISTER',
        entityType: 'Resident',
        entityId: residentId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      })
      .catch(() => {});
    return list;
  }

  @Post('stock')
  @Roles('Admin', 'Manager', 'Nurse')
  async recordStockTransaction(
    @Body(new ZodValidationPipe(CreateMedicationStockTransactionSchema))
    dto: CreateMedicationStockTransactionDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = getTenantId(req);
    return this.cdService.recordStockTransaction(
      dto,
      req.user.userId,
      tenantId,
    );
  }

  @Get('stock/resident/:residentId')
  @Roles('Admin', 'Manager', 'Nurse')
  async listStockLedger(
    @Param('residentId') residentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = getTenantId(req);
    return this.cdService.listStockLedger(residentId, tenantId);
  }
}
