import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import {
  CreateShiftDto,
  CreateShiftTypeDto,
  UpdateShiftDto,
  CreateShiftAssignmentDto,
} from './dto/shifts.dto';
import { ShiftCrudService } from './services/shift-crud.service';
import { ShiftExecutionService } from './services/shift-execution.service';
import { ShiftQueryService } from './services/shift-query.service';
import { ShiftNotificationService } from './services/shift-notification.service';
import { Optional } from '@nestjs/common';

@Injectable()
export class ShiftsService {
  private readonly crud: ShiftCrudService;
  private readonly execution: ShiftExecutionService;
  private readonly query: ShiftQueryService;

  constructor(
    private readonly auditService: AuditService,
    @Optional() private readonly notificationService?: ShiftNotificationService,
  ) {
    this.crud = new ShiftCrudService(auditService, notificationService);
    this.execution = new ShiftExecutionService(auditService);
    this.query = new ShiftQueryService();
  }

  // --- Shift Types ---

  async createType(
    data: CreateShiftTypeDto,
    tenantId: string,
    branchId: string,
    userId: string,
  ): Promise<unknown> {
    return this.crud.createType(data, tenantId, branchId, userId);
  }

  async findAllTypes(tenantId: string): Promise<unknown[]> {
    return this.crud.findAllTypes(tenantId);
  }

  async updateType(
    id: string,
    data: CreateShiftTypeDto,
    tenantId: string,
    userId: string,
  ): Promise<unknown> {
    return this.crud.updateType(id, data, tenantId, userId);
  }

  async deleteType(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    return this.crud.deleteType(id, tenantId, userId);
  }

  // --- Shifts ---

  async create(
    data: CreateShiftDto,
    tenantId: string,
    branchId: string,
    userId: string,
  ): Promise<unknown> {
    return this.crud.create(data, tenantId, branchId, userId);
  }

  async findAll(
    tenantId: string,
    from?: Date,
    to?: Date,
    wingId?: string,
  ): Promise<unknown[]> {
    return this.crud.findAll(tenantId, from, to, wingId);
  }

  async update(
    id: string,
    data: UpdateShiftDto,
    tenantId: string,
    userId: string,
  ): Promise<unknown> {
    return this.crud.update(id, data, tenantId, userId);
  }

  async delete(id: string, tenantId: string, userId: string): Promise<void> {
    return this.crud.delete(id, tenantId, userId);
  }

  // --- Assignments ---

  async assignStaff(
    data: CreateShiftAssignmentDto,
    tenantId: string,
    userId: string,
  ): Promise<unknown> {
    return this.crud.assignStaff(data, tenantId, userId);
  }

  async unassignStaff(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    return this.crud.unassignStaff(id, tenantId, userId);
  }

  // --- Personal Rota & Attendance ---

  async findMyShifts(
    tenantId: string,
    userId: string,
    from?: Date,
    to?: Date,
  ): Promise<unknown[]> {
    return this.query.findMyShifts(tenantId, userId, from, to);
  }

  async findActiveOrNextShift(
    tenantId: string,
    userId: string,
  ): Promise<{
    active: unknown;
    next: unknown;
  }> {
    return this.query.findActiveOrNextShift(tenantId, userId);
  }

  async startShiftLog(
    shiftId: string,
    tenantId: string,
    userId: string,
    notes?: string,
  ): Promise<unknown> {
    return this.execution.startShiftLog(shiftId, tenantId, userId, notes);
  }

  async endShiftLog(
    shiftId: string,
    tenantId: string,
    userId: string,
    handoverNotes?: string,
    tasksCompleted?: number,
    tasksTotal?: number,
  ): Promise<unknown> {
    return this.execution.endShiftLog(
      shiftId,
      tenantId,
      userId,
      handoverNotes,
      tasksCompleted,
      tasksTotal,
    );
  }

  async updateHandoverNotes(
    shiftId: string,
    tenantId: string,
    userId: string,
    handoverNotes: string,
  ): Promise<unknown> {
    return this.execution.updateHandoverNotes(
      shiftId,
      tenantId,
      userId,
      handoverNotes,
    );
  }

  async getShiftLogs(shiftId: string, tenantId: string): Promise<unknown[]> {
    return this.execution.getShiftLogs(shiftId, tenantId);
  }

  async getShiftDetails(
    shiftId: string,
    tenantId: string,
    userId: string,
  ): Promise<unknown> {
    return this.query.getShiftDetails(shiftId, tenantId, userId);
  }
}
