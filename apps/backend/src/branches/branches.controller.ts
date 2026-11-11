import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { getTenantId } from '../common/utils/scope.util';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { createBranchSchema, updateBranchSchema } from '@repo/schema';
import { BranchesService } from './branches.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Branch } from '@repo/db';

@ApiTags('Branches')
@ApiBearerAuth()
@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @Roles('Admin')
  @ApiOperation({ summary: 'Create a new branch' })
  async createBranch(
    @Body(new ZodValidationPipe(createBranchSchema)) dto: CreateBranchDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Branch> {
    return this.branchesService.createBranch(
      dto,
      getTenantId(req),
      req.user.userId,
    );
  }

  @Get()
  @Roles('Admin', 'Manager', 'Carer', 'Nurse')
  @ApiOperation({ summary: 'Get all branches for the tenant' })
  async findAllBranches(@Req() req: AuthenticatedRequest): Promise<Branch[]> {
    return this.branchesService.findAllBranches(getTenantId(req));
  }

  @Get(':id')
  @Roles('Admin', 'Manager', 'Carer', 'Nurse')
  @ApiOperation({ summary: 'Get a single branch by id' })
  async findBranch(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<Branch> {
    return this.branchesService.findBranchById(id, getTenantId(req));
  }

  @Patch(':id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Update a branch' })
  async updateBranch(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBranchSchema)) dto: UpdateBranchDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Branch> {
    return this.branchesService.updateBranch(
      id,
      dto,
      getTenantId(req),
      req.user.userId,
    );
  }

  @Delete(':id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Delete a branch' })
  async deleteBranch(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.branchesService.deleteBranch(
      id,
      getTenantId(req),
      req.user.userId,
    );
  }
}
