import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CarePlanService } from './care-plan.service';
import { CarePlanApprovalService } from './care-plan-approval.service';
import { CarePlanRenewalService } from './care-plan-renewal.service';
import { CarePlanTaskService } from './care-plan-task.service';
import { CarePlanDailyTaskService } from './care-plan-daily-task.service';
import { CarePlanTaskGeneratorService } from './care-plan-task-generator.service';
import { CarePlanGoalService } from './care-plan-goal.service';
import {
  CreateCarePlanWizardDTO,
  CreateCarePlanWizardSchema,
  UpdateCarePlanDraftDTO,
  UpdateCarePlanDraftSchema,
  UpdateCarePlanMasterDTO,
  UpdateCarePlanMasterSchema,
  RenewCarePlanDTO,
  RenewCarePlanSchema,
  DecideCarePlanApprovalDTO,
  DecideCarePlanApprovalSchema,
  CreateCarePlanGoalDTO,
  CreateCarePlanGoalSchema,
  UpdateCarePlanGoalDTO,
  UpdateCarePlanGoalSchema,
  CreateCarePlanTaskDTO,
  CreateCarePlanTaskSchema,
  UpdateCarePlanTaskDTO,
  UpdateCarePlanTaskSchema,
  UpdateDailyTaskStatusDTO,
  UpdateDailyTaskStatusSchema,
  carePlanListQuerySchema,
  type CarePlanListQueryDTO,
} from '@repo/schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { resolveBranchId } from '../common/utils/scope.util';

@Controller('care-plan')
@UseGuards(JwtAuthGuard)
export class CarePlanController {
  constructor(
    private readonly carePlanService: CarePlanService,
    private readonly goalService: CarePlanGoalService,
    private readonly approvalService: CarePlanApprovalService,
    private readonly renewalService: CarePlanRenewalService,
    private readonly taskService: CarePlanTaskService,
    private readonly dailyTaskService: CarePlanDailyTaskService,
    private readonly taskGeneratorService: CarePlanTaskGeneratorService,
  ) {}

  @Get('metrics')
  async getMetrics(@Req() req: AuthenticatedRequest) {
    return this.carePlanService.getMetrics(req.user.tenantId!);
  }

  /** Paginated list of care plans. Pass all=true to bypass pagination. */
  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query(new ZodValidationPipe(carePlanListQuerySchema))
    query?: CarePlanListQueryDTO,
  ) {
    // The JWT's active branch always wins over a client-supplied branchId.
    const branchId = resolveBranchId(req, query?.branchId);
    return this.carePlanService.findAll(req.user.tenantId!, {
      ...query,
      branchId,
    });
  }

  @Get('daily-tasks')
  async getDailyTasks(
    @Query('date') date: string,
    @Query('residentId') residentId: string,
    @Query('carerId') carerId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.dailyTaskService.getDailyTasks(
      req.user.tenantId!,
      date ? new Date(date) : new Date(),
      residentId,
      carerId,
    );
  }

  @Get('carer/shift-tasks')
  async getCarerShiftTasks(
    @Query('date') date: string,
    @Query('shiftSlot') shiftSlot: string,
    @Query('residentId') residentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.dailyTaskService.getCarerShiftTasks(
      req.user.tenantId!,
      req.user.userId,
      shiftSlot,
      date ? new Date(date) : new Date(),
      residentId,
    );
  }

  @Get('carer/assigned-resident-tasks')
  async getCarerAssignedResidentTasks(
    @Query('date') date: string,
    @Query('shiftSlot') shiftSlot: string,
    @Query('residentId') residentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.dailyTaskService.getCarerAssignedResidentTasks(
      req.user.tenantId!,
      req.user.userId,
      shiftSlot,
      date ? new Date(date) : new Date(),
      residentId,
    );
  }

  @Patch('daily-tasks/:taskId/status')
  async updateDailyTaskStatus(
    @Param('taskId') taskId: string,
    @Body(new ZodValidationPipe(UpdateDailyTaskStatusSchema))
    dto: UpdateDailyTaskStatusDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.dailyTaskService.updateDailyTaskStatus(
      taskId,
      dto,
      req.user.userId,
      req.user.tenantId!,
    );
  }

  @Post('generate-daily')
  async generateDailyTasks(
    @Query('date') date: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.taskGeneratorService.generateAllDailyTasks(
      req.user.tenantId!,
      date ? new Date(date) : new Date(),
    );
    return { message: 'Daily tasks generated successfully' };
  }

  @Get('residents/:residentId/versions')
  async getResidentVersions(
    @Param('residentId') residentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.carePlanService.getResidentVersions(
      residentId,
      req.user.tenantId!,
    );
  }

  @Get('residents/:residentId')
  async findByResident(
    @Param('residentId') residentId: string,
    @Query('asOfDate') asOfDate: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.carePlanService.findByResident(
      residentId,
      req.user.tenantId!,
      asOfDate ? new Date(asOfDate) : undefined,
    );
  }

  @Patch('residents/:residentId')
  async updateMasterCarePlan(
    @Param('residentId') residentId: string,
    @Body(new ZodValidationPipe(UpdateCarePlanMasterSchema))
    dto: UpdateCarePlanMasterDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.carePlanService.updateMasterByResident(
      residentId,
      req.user.tenantId!,
      req.user.userId,
      dto,
    );
  }

  @Get(':id')
  async findById(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.carePlanService.findById(id, req.user.tenantId!);
  }

  @Post()
  async createDraft(
    @Body(new ZodValidationPipe(CreateCarePlanWizardSchema))
    dto: CreateCarePlanWizardDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.carePlanService.createDraft(
      req.user.tenantId!,
      req.user.userId,
      dto,
    );
  }

  @Patch(':id')
  async updateDraft(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateCarePlanDraftSchema))
    dto: UpdateCarePlanDraftDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.carePlanService.updateDraft(
      id,
      req.user.tenantId!,
      req.user.userId,
      dto,
    );
  }

  @Post(':id/renew')
  async renewCarePlan(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(RenewCarePlanSchema))
    dto: RenewCarePlanDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.renewalService.renewCarePlan(
      id,
      req.user.tenantId!,
      req.user.userId,
      dto,
    );
  }

  @Post(':id/submit')
  async submitForApproval(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.approvalService.submitForApproval(
      id,
      req.user.tenantId!,
      req.user.userId,
    );
  }

  @Post(':id/approvals/:approvalId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Manager', 'Nurse')
  async decideApproval(
    @Param('id') id: string,
    @Param('approvalId') approvalId: string,
    @Body(new ZodValidationPipe(DecideCarePlanApprovalSchema))
    dto: DecideCarePlanApprovalDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.approvalService.recordApprovalDecision(
      id,
      approvalId,
      req.user.tenantId!,
      req.user.userId,
      dto,
    );
  }

  @Get(':id/diff')
  async getDiff(
    @Param('id') id: string,
    @Query('against') againstId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.renewalService.computePlanDiff(
      id,
      againstId,
      req.user.tenantId!,
    );
  }

  // --- Goal Endpoints ---

  @Post(':id/goals')
  async createGoal(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreateCarePlanGoalSchema))
    dto: CreateCarePlanGoalDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.goalService.createGoal(id, dto, req.user.tenantId!);
  }

  @Patch('goals/:goalId')
  async updateGoal(
    @Param('goalId') goalId: string,
    @Body(new ZodValidationPipe(UpdateCarePlanGoalSchema))
    dto: UpdateCarePlanGoalDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.goalService.updateGoal(goalId, dto, req.user.tenantId!);
  }

  @Delete('goals/:goalId')
  async deleteGoal(
    @Param('goalId') goalId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.goalService.deleteGoal(goalId, req.user.tenantId!);
  }

  // --- Task Endpoints ---

  @Get('residents/:residentId/tasks')
  async getResidentTasks(
    @Param('residentId') residentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.taskService.getResidentCarePlanTasks(
      residentId,
      req.user.tenantId!,
    );
  }

  @Post('residents/:residentId/tasks')
  async createResidentTask(
    @Param('residentId') residentId: string,
    @Body(new ZodValidationPipe(CreateCarePlanTaskSchema))
    dto: CreateCarePlanTaskDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.taskService.createCarePlanTaskForResident(
      residentId,
      dto,
      req.user.tenantId!,
      req.user.userId,
    );
  }

  @Post(':id/tasks')
  async createCarePlanTask(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreateCarePlanTaskSchema))
    dto: CreateCarePlanTaskDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.taskService.createCarePlanTask(id, dto, req.user.tenantId!);
  }

  @Patch('tasks/:taskId')
  async updateCarePlanTask(
    @Param('taskId') taskId: string,
    @Body(new ZodValidationPipe(UpdateCarePlanTaskSchema))
    dto: UpdateCarePlanTaskDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.taskService.updateCarePlanTask(taskId, dto, req.user.tenantId!);
  }

  @Delete('tasks/:taskId')
  async deleteCarePlanTask(
    @Param('taskId') taskId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.taskService.deleteCarePlanTask(taskId, req.user.tenantId!);
  }
}
