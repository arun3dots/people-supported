import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';

import { AuthenticatedRequest } from '../common/interfaces/request.interface';

import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import {
  createRoleSchema,
  updateRoleSchema,
  type CreateRoleDTO,
  type UpdateRoleDTO,
} from '@repo/schema';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@repo/db';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  private getTenantId(req: AuthenticatedRequest): string {
    if (!req.user.tenantId) {
      throw new ForbiddenException(
        'Tenant isolation failure - Tenant ID missing',
      );
    }
    return req.user.tenantId;
  }

  @Post()
  @Roles('Admin')
  @ApiOperation({ summary: 'Create a new role' })
  async create(
    @Body(new ZodValidationPipe(createRoleSchema)) createRoleDto: CreateRoleDTO,
    @Req() req: AuthenticatedRequest,
  ): Promise<Role> {
    return this.rolesService.create(
      createRoleDto,
      req.user.userId,
      this.getTenantId(req),
    );
  }

  @Get()
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Get all roles for the tenant' })
  async findAll(@Req() req: AuthenticatedRequest): Promise<Role[]> {
    return this.rolesService.findAll(this.getTenantId(req));
  }

  @Get(':id')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Get a single role' })
  async findOne(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<Role> {
    return this.rolesService.findOne(id, this.getTenantId(req));
  }

  @Patch(':id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Update a role' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateRoleSchema)) updateRoleDto: UpdateRoleDTO,
    @Req() req: AuthenticatedRequest,
  ): Promise<Role> {
    return this.rolesService.update(
      id,
      updateRoleDto,
      req.user.userId,
      this.getTenantId(req),
    );
  }

  @Delete(':id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Delete a role' })
  async remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.rolesService.delete(id, req.user.userId, this.getTenantId(req));
  }
}
