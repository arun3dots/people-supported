import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import {
  CreateShiftDto,
  CreateShiftTypeDto,
  UpdateShiftDto,
  CreateShiftAssignmentDto,
} from './dto/shifts.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { requireBranchId } from '../common/utils/scope.util';
import {
  CreateShiftTypeSchema,
  CreateShiftAssignmentSchema,
  CreateShiftScheduleSchema,
  UpdateShiftScheduleSchema,
  StartShiftSchema,
  type StartShiftDTO,
  EndShiftSchema,
  type EndShiftDTO,
  UpdateHandoverNotesSchema,
  type UpdateHandoverNotesDTO,
} from '@repo/schema';

@ApiTags('Shifts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) { }

  // --- Shift Types ---

  @Post('types')
  @ApiOperation({ summary: 'Create a new shift type template' })
  createType(
    @Body(new ZodValidationPipe(CreateShiftTypeSchema))
    createShiftTypeDto: CreateShiftTypeDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.shiftsService.createType(
      createShiftTypeDto,
      req.user.tenantId!,
      requireBranchId(req, createShiftTypeDto.branchId),
      req.user.userId,
    );
  }

  @Patch('types/:id')
  @ApiOperation({ summary: 'Update a shift type template' })
  async updateType(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreateShiftTypeSchema))
    dto: CreateShiftTypeDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.shiftsService.updateType(
      id,
      dto,
      req.user.tenantId!,
      req.user.userId,
    );
  }

  @Get('types')
  @ApiOperation({ summary: 'Get all shift templates' })
  async findAllTypes(@Req() req: AuthenticatedRequest) {
    return this.shiftsService.findAllTypes(req.user.tenantId!);
  }

  @Delete('types/:id')
  @ApiOperation({ summary: 'Delete a shift type template' })
  async deleteType(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.shiftsService.deleteType(
      id,
      req.user.tenantId!,
      req.user.userId,
    );
  }

  // --- Shifts ---

  @Post()
  @ApiOperation({ summary: 'Create a new shift' })
  create(
    @Body(new ZodValidationPipe(CreateShiftScheduleSchema))
    createShiftDto: CreateShiftDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.shiftsService.create(
      createShiftDto,
      req.user.tenantId!,
      requireBranchId(req, createShiftDto.branchId),
      req.user.userId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Find shifts by filters' })
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('wingId') wingId?: string,
  ) {
    return this.shiftsService.findAll(
      req.user.tenantId!,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
      wingId,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a shift' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateShiftScheduleSchema))
    updateShiftDto: UpdateShiftDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.shiftsService.update(
      id,
      updateShiftDto,
      req.user.tenantId!,
      req.user.userId,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a shift' })
  async delete(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.shiftsService.delete(id, req.user.tenantId!, req.user.userId);
  }

  // --- Assignments ---

  @Post('assignments')
  @ApiOperation({ summary: 'Assign staff to a shift' })
  async assignStaff(
    @Body(new ZodValidationPipe(CreateShiftAssignmentSchema))
    createShiftAssignmentDto: CreateShiftAssignmentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.shiftsService.assignStaff(
      createShiftAssignmentDto,
      req.user.tenantId!,
      req.user.userId,
    );
  }

  @Delete('assignments/:id')
  @ApiOperation({ summary: 'Unassign staff from a shift' })
  async unassignStaff(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.shiftsService.unassignStaff(
      id,
      req.user.tenantId!,
      req.user.userId,
    );
  }

  @Get('my')
  @ApiOperation({ summary: 'Get assigned shifts for the logged-in staff' })
  async findMyShifts(
    @Req() req: AuthenticatedRequest,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const tenantId = req.user?.tenantId || '';
    const userId = req.user?.userId || (req.user as any)?.sub || '';
    return this.shiftsService.findMyShifts(
      tenantId,
      userId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get current or next upcoming shift for the logged-in staff',
  })
  async findActiveShift(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user?.tenantId || '';
    const userId = req.user?.userId || (req.user as any)?.sub || '';
    return this.shiftsService.findActiveOrNextShift(tenantId, userId);
  }

  @Post(':id/start')
  @ApiOperation({
    summary: 'Start shift recording actual start time and log entry',
  })
  async startShift(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(StartShiftSchema)) body: StartShiftDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user?.tenantId || '';
    const userId = req.user?.userId || (req.user as any)?.sub || '';
    return this.shiftsService.startShiftLog(id, tenantId, userId, body?.notes);
  }

  @Post(':id/end')
  @ApiOperation({
    summary: 'End shift recording actual end time and handover notes',
  })
  async endShift(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(EndShiftSchema)) body: EndShiftDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user?.tenantId || '';
    const userId = req.user?.userId || (req.user as any)?.sub || '';
    return this.shiftsService.endShiftLog(
      id,
      tenantId,
      userId,
      body?.handoverNotes,
      body?.tasksCompleted,
      body?.tasksTotal,
    );
  }

  @Patch(':id/handover-notes')
  @ApiOperation({
    summary: 'Update running handover notes during active shift',
  })
  async updateHandoverNotes(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateHandoverNotesSchema))
    body: UpdateHandoverNotesDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user?.tenantId || '';
    const userId = req.user?.userId || '';
    return this.shiftsService.updateHandoverNotes(
      id,
      tenantId,
      userId,
      body.handoverNotes,
    );
  }

  @Get('staff-allocation')
  @ApiOperation({
    summary: 'Get staff allocation overview, scheduled workload, and property coverage',
  })
  async getStaffAllocation(
    @Req() req: AuthenticatedRequest,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('wingId') wingId?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.shiftsService.getStaffAllocation(
      req.user.tenantId!,
      requireBranchId(req, branchId),
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
      wingId,
    );
  }

  @Get(':id/details')
  @ApiOperation({
    summary: 'Get comprehensive shift details for mobile drawer',
  })
  async getShiftDetails(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user?.tenantId || '';
    const userId = req.user?.userId || (req.user as any)?.sub || '';
    return this.shiftsService.getShiftDetails(id, tenantId, userId);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get shift activity logs for a specific shift' })
  async getShiftLogs(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = req.user?.tenantId || '';
    return this.shiftsService.getShiftLogs(id, tenantId);
  }
}
