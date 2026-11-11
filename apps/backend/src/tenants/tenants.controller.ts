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
import { AuthenticatedRequest } from '../common/interfaces/request.interface';

import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import {
  superAdminCreateTenantSchema,
  updateTenantSchema,
  tenantStatusSchema,
  markPaidSchema,
  type SuperAdminCreateTenantDTO,
  type UpdateTenantDTO,
  type MarkPaidDTO,
  type TenantStatus,
} from '@repo/schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { PaymentService } from '../payments/payment.service';
import { Tenant } from '@repo/db';

@ApiTags('Tenants')
@Controller('super-admin/tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SuperAdmin')
export class TenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly paymentService: PaymentService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tenant (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  async create(
    @Body(new ZodValidationPipe(superAdminCreateTenantSchema))
    createTenantDto: SuperAdminCreateTenantDTO,
    @Req() req: AuthenticatedRequest,
  ): Promise<Tenant & { paymentUrl?: string }> {
    return this.tenantsService.create(createTenantDto, req.user.userId);
  }

  @Post('mark-paid')
  @ApiOperation({ summary: 'Mark a payment as paid (Super Admin override)' })
  async markPaid(
    @Body(new ZodValidationPipe(markPaidSchema)) dto: MarkPaidDTO,
  ): Promise<{ success: boolean }> {
    return this.paymentService.markPaid(dto.paymentId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tenants (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all tenants' })
  async findAll(): Promise<Tenant[]> {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Tenant> {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTenantSchema))
    updateTenantDto: UpdateTenantDTO,
    @Req() req: AuthenticatedRequest,
  ): Promise<Tenant> {
    return this.tenantsService.update(id, updateTenantDto, req.user.userId);
  }

  @Patch(':id/status')
  async setStatus(
    @Param('id') id: string,
    @Body('status', new ZodValidationPipe(tenantStatusSchema))
    status: TenantStatus,
    @Req() req: AuthenticatedRequest,
  ): Promise<Tenant> {
    return this.tenantsService.setStatus(id, status, req.user.userId);
  }
}
