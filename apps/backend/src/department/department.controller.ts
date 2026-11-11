import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { DepartmentService } from './department.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { resolveBranchId } from '../common/utils/scope.util';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  departmentListQuerySchema,
  CreateDepartmentDTO,
  UpdateDepartmentDTO,
  DepartmentListQueryDTO,
} from '@repo/schema';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Departments')
@ApiBearerAuth()
@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  private getTenantId(req: AuthenticatedRequest): string {
    const tenantId = req.user.tenantId;
    if (!tenantId) {
      throw new Error('Tenant ID not found in token');
    }
    return tenantId;
  }

  @Get()
  @Roles('SuperAdmin', 'Admin', 'Manager', 'Nurse', 'Carer')
  @ApiOperation({ summary: 'Get all departments for the current tenant' })
  @ApiResponse({ status: 200, description: 'List of departments' })
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query(new ZodValidationPipe(departmentListQuerySchema))
    query?: DepartmentListQueryDTO,
  ) {
    // The JWT's active branch always wins over a client-supplied branchId.
    const branchId = resolveBranchId(req, query?.branchId);
    return this.departmentService.getDepartments(
      this.getTenantId(req),
      branchId,
    );
  }

  @Post()
  @Roles('SuperAdmin', 'Admin', 'Manager')
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponse({
    status: 201,
    description: 'The department has been successfully created',
  })
  async create(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createDepartmentSchema))
    data: CreateDepartmentDTO,
  ) {
    return this.departmentService.createDepartment(
      this.getTenantId(req),
      req.user.userId,
      data,
    );
  }

  @Patch(':id')
  @Roles('SuperAdmin', 'Admin', 'Manager')
  @ApiOperation({ summary: 'Update a department' })
  @ApiResponse({
    status: 200,
    description: 'The department has been successfully updated',
  })
  @ApiResponse({ status: 404, description: 'Department not found' })
  async update(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(updateDepartmentSchema))
    data: UpdateDepartmentDTO,
  ) {
    return this.departmentService.updateDepartment(
      id,
      this.getTenantId(req),
      req.user.userId,
      data,
    );
  }

  @Delete(':id')
  @Roles('SuperAdmin', 'Admin')
  @ApiOperation({ summary: 'Delete a department' })
  @ApiResponse({
    status: 200,
    description: 'The department has been successfully deleted',
  })
  @ApiResponse({ status: 404, description: 'Department not found' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.departmentService.deleteDepartment(
      id,
      this.getTenantId(req),
      req.user.userId,
    );
  }
}
