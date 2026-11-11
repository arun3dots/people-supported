import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  CareTaskDayQuerySchema,
  CreateCareTaskSchema,
  CreateNeedCarePlanSchema,
  CreateShiftNoteSchema,
  NeedCarePlanAgreementSchema,
  RecordCareTaskSchema,
  SaveAssessmentSchema,
  SaveNeedCarePlanSchema,
  UndoCareTaskSchema,
  UpdateCareTaskSchema,
  type AssessmentRecordDTO,
  type CareTaskDayDTO,
  type CareTaskDayQueryDTO,
  type CareTaskDefinitionDTO,
  type CreateCareTaskDTO,
  type CreateNeedCarePlanDTO,
  type CreateShiftNoteDTO,
  type NeedCarePlanAgreementDTO,
  type NeedCarePlanRecordDTO,
  type RecordCareTaskDTO,
  type SaveAssessmentDTO,
  type SaveNeedCarePlanDTO,
  type ShiftNoteDTO,
  type UndoCareTaskDTO,
  type UpdateCareTaskDTO,
} from '@repo/schema';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod.pipe';
import type { AuthenticatedRequest } from '../../common/interfaces/request.interface';
import { CareTaskDayService } from './care-task-day.service';
import { CareTaskService } from './care-task.service';
import { NeedCarePlanService } from './need-care-plan.service';
import { ResidentAssessmentService } from './resident-assessment.service';

const CLINICAL = ['Admin', 'Manager', 'Nurse'] as const;
const ALL_CARE = ['Admin', 'Manager', 'Nurse', 'Carer'] as const;

@Controller('residents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CareJourneyController {
  constructor(
    private readonly assessments: ResidentAssessmentService,
    private readonly plans: NeedCarePlanService,
    private readonly tasks: CareTaskService,
    private readonly taskDay: CareTaskDayService,
  ) {}

  // --- Step 2: assessment ---

  @Post(':id/assessment')
  @Roles(...CLINICAL)
  createAssessment(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<AssessmentRecordDTO> {
    return this.assessments.create(id, req.user);
  }

  @Get(':id/assessment')
  @Roles(...CLINICAL)
  getAssessment(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<AssessmentRecordDTO> {
    return this.assessments.getCurrent(id, req.user);
  }

  @Patch(':id/assessment')
  @Roles(...CLINICAL)
  saveAssessment(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(SaveAssessmentSchema)) body: SaveAssessmentDTO,
  ): Promise<AssessmentRecordDTO> {
    return this.assessments.save(id, body, req.user);
  }

  @Post(':id/assessment/complete')
  @Roles(...CLINICAL)
  completeAssessment(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<AssessmentRecordDTO> {
    return this.assessments.complete(id, req.user);
  }

  // --- Step 3: care plans, one per area of need ---

  @Get(':id/need-care-plans')
  @Roles(...ALL_CARE)
  listPlans(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<NeedCarePlanRecordDTO[]> {
    return this.plans.list(id, req.user);
  }

  @Post(':id/need-care-plans')
  @Roles(...CLINICAL)
  createPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(CreateNeedCarePlanSchema))
    body: CreateNeedCarePlanDTO,
  ): Promise<NeedCarePlanRecordDTO> {
    return this.plans.create(id, body, req.user);
  }

  @Patch(':id/need-care-plans/:planId')
  @Roles(...CLINICAL)
  savePlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(SaveNeedCarePlanSchema))
    body: SaveNeedCarePlanDTO,
  ): Promise<NeedCarePlanRecordDTO> {
    return this.plans.save(id, planId, body, req.user);
  }

  @Post(':id/need-care-plans/:planId/agree')
  @Roles(...CLINICAL)
  agreePlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(NeedCarePlanAgreementSchema))
    body: NeedCarePlanAgreementDTO,
  ): Promise<NeedCarePlanRecordDTO> {
    return this.plans.agree(id, planId, body, req.user);
  }

  // --- Step 4: carer tasks ---

  @Get(':id/care-tasks')
  @Roles(...ALL_CARE)
  listTaskDefinitions(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<CareTaskDefinitionDTO[]> {
    return this.tasks.listDefinitions(id, req.user);
  }

  @Post(':id/need-care-plans/:planId/tasks')
  @Roles(...CLINICAL)
  createTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(CreateCareTaskSchema)) body: CreateCareTaskDTO,
  ): Promise<CareTaskDefinitionDTO> {
    return this.tasks.create(id, planId, body, req.user);
  }

  @Get(':id/care-tasks/day')
  @Roles(...ALL_CARE)
  getDay(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Query(new ZodValidationPipe(CareTaskDayQuerySchema))
    query: CareTaskDayQueryDTO,
  ): Promise<CareTaskDayDTO> {
    return this.taskDay.getDay(id, query, req.user);
  }

  @Patch(':id/care-tasks/:taskId')
  @Roles(...CLINICAL)
  updateTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(UpdateCareTaskSchema)) body: UpdateCareTaskDTO,
  ) {
    return this.tasks.update(id, taskId, body, req.user);
  }

  @Post(':id/care-tasks/:taskId/record')
  @Roles(...ALL_CARE)
  recordTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(RecordCareTaskSchema)) body: RecordCareTaskDTO,
  ) {
    return this.taskDay.record(id, taskId, body, req.user);
  }

  @Post(':id/care-tasks/:taskId/undo')
  @Roles(...ALL_CARE)
  undoTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(UndoCareTaskSchema)) body: UndoCareTaskDTO,
  ) {
    return this.taskDay.undo(id, taskId, body.date, req.user);
  }

  @Post(':id/shift-notes')
  @Roles(...ALL_CARE)
  addShiftNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(CreateShiftNoteSchema))
    body: CreateShiftNoteDTO,
  ): Promise<ShiftNoteDTO> {
    return this.taskDay.addNote(id, body, req.user);
  }
}
