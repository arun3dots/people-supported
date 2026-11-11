import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../common/interfaces/request.interface';
import type { ActorContext } from '../common/interfaces/actor.interface';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StaffService, StaffDetail } from './staff.service';
import {
  CreateStaffDto,
  UpdateStaffDto,
  UpdateStaffAssignmentsDto,
  PaginatedStaffResponseDto,
} from './dto/staff.dto';
import {
  createStaffSchema,
  updateStaffSchema,
  updateStaffAssignmentsSchema,
  ReassignStaffWorkSchema,
  type ReassignStaffWorkDTO,
  staffListQuerySchema,
  type StaffListQueryDTO,
  type PaginatedResponse,
} from '@repo/schema';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { requireBranchId, resolveBranchId } from '../common/utils/scope.util';
import { User } from '@repo/db';

@ApiTags('Staff')
@ApiBearerAuth()
@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  private getTenantId(req: AuthenticatedRequest): string {
    if (!req.user.tenantId) {
      throw new ForbiddenException(
        'Tenant isolation failure - Tenant ID missing',
      );
    }
    return req.user.tenantId;
  }

  private actor(req: AuthenticatedRequest): ActorContext {
    const u: AuthenticatedUser = req.user;
    if (!u.tenantId) {
      throw new ForbiddenException('Tenant context required.');
    }
    return {
      tenantId: u.tenantId,
      userId: u.userId,
      userEmail: u.email,
      userFullName: u.fullName ?? '',
      roleName: u.roleName,
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'],
    };
  }

  @Post()
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Add a new staff member' })
  @ApiResponse({
    status: 201,
    description: 'Staff member created successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires Admin or Manager role',
  })
  async create(
    @Body(new ZodValidationPipe(createStaffSchema))
    createStaffDto: CreateStaffDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<User> {
    const branchId = resolveBranchId(
      req,
      (createStaffDto as { branchId?: string }).branchId,
    );
    return this.staffService.create(
      createStaffDto,
      req.user.userId,
      this.getTenantId(req),
      branchId,
    );
  }

  @Get()
  @Roles('Admin', 'Manager', 'Carer', 'Nurse')
  @ApiOperation({
    summary:
      'Get all staff members for the tenant with pagination and filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of staff members',
    type: PaginatedStaffResponseDto,
  })
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query(new ZodValidationPipe(staffListQuerySchema))
    query?: StaffListQueryDTO,
  ): Promise<PaginatedResponse<StaffDetail>> {
    // Branch scope comes from the JWT for branch-assigned users; a tenant-wide
    // caller may target a branch via ?branchId=.
    const branchId = requireBranchId(req, query?.branchId);
    return this.staffService.findAll(
      branchId,
      query ?? {},
      req.user.userId,
      this.actor(req),
    );
  }

  @Post(':id/photo')
  @Roles('Admin', 'Manager')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Upload staff profile photo to S3 and update DB' })
  @ApiResponse({ status: 201, description: 'Photo uploaded successfully' })
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ photoUrl: string }> {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed types: JPG, PNG, WEBP',
      );
    }
    return this.staffService.uploadStaffPhoto(
      id,
      file.buffer,
      file.originalname,
      file.mimetype,
      this.getTenantId(req),
      req.user.userId,
    );
  }

  @Get(':id/photo')
  @Roles('Admin', 'Manager', 'Carer', 'Nurse')
  @ApiOperation({ summary: 'Get staff profile photo stream' })
  async getPhoto(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const { stream, contentType } = await this.staffService.getStaffPhoto(
      id,
      this.getTenantId(req),
    );
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=86400');
    stream.pipe(res);
  }

  @Patch(':id/assignments')
  @Roles('Admin')
  @ApiOperation({ summary: 'Update staff assignments' })
  @ApiResponse({
    status: 200,
    description: 'Staff assignments updated successfully',
  })
  async updateAssignments(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateStaffAssignmentsSchema))
    updateAssignmentsDto: UpdateStaffAssignmentsDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<User> {
    return this.staffService.updateAssignments(
      id,
      this.getTenantId(req),
      updateAssignmentsDto,
      req.user.userId,
    );
  }

  @Patch(':id/reassign')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Reassign staff scheme or property work' })
  @ApiResponse({
    status: 200,
    description: 'Staff member reassigned successfully',
  })
  async reassignStaff(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ReassignStaffWorkSchema))
    data: ReassignStaffWorkDTO,
    @Req() req: AuthenticatedRequest,
  ): Promise<StaffDetail> {
    return this.staffService.reassignStaff(
      id,
      data,
      this.getTenantId(req),
      req.user.userId,
    );
  }

  @Patch(':id')
  @Roles('Admin', 'Manager')
  @ApiOperation({ summary: 'Update a staff member profile' })
  @ApiResponse({
    status: 200,
    description: 'Staff member updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateStaffSchema))
    updateStaffDto: UpdateStaffDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<User> {
    return this.staffService.update(
      id,
      updateStaffDto,
      req.user.userId,
      this.getTenantId(req),
    );
  }

  @Get(':id')
  @Roles('Admin', 'Manager', 'Carer', 'Nurse')
  @ApiOperation({ summary: 'Get a single staff member' })
  @ApiResponse({ status: 200, description: 'Staff member details' })
  async findOne(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<StaffDetail> {
    return this.staffService.getStaffDetail(
      id,
      this.getTenantId(req),
      req.user.userId,
      this.actor(req),
    );
  }

  @Delete(':id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Soft delete a staff member' })
  @ApiResponse({
    status: 200,
    description: 'Staff member removed successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires Admin role' })
  async remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; message: string }> {
    await this.staffService.delete(id, req.user.userId, this.getTenantId(req));
    return { success: true, message: 'Staff member removed successfully' };
  }
}
