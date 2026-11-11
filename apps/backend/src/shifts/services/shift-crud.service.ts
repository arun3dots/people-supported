import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@repo/db';
import {
  CreateShiftDto,
  CreateShiftTypeDto,
  UpdateShiftDto,
  CreateShiftAssignmentDto,
} from '../dto/shifts.dto';
import { AuditService } from '../../audit/audit.service';
import { ShiftNotificationService } from './shift-notification.service';
import { toJsonValue } from '../../common/utils/json.util';
import {
  addUkCalendarDays,
  getUkDayBoundaries,
  getUkDayOfWeek,
} from '../../common/utils/time.util';

@Injectable()
export class ShiftCrudService {
  constructor(
    private readonly auditService: AuditService,
    private readonly notificationService?: ShiftNotificationService,
  ) {}

  private async ensureResidentsHaveBeds(
    tenantId: string,
    residentIds: string[],
  ): Promise<void> {
    if (residentIds.length === 0) return;

    const residents = await prisma.resident.findMany({
      where: { tenantId, id: { in: residentIds }, deletedAt: null },
      select: { id: true, bed: { select: { id: true, roomId: true } } },
    });
    if (residents.length === 0) {
      throw new BadRequestException('Selected resident(s) could not be found.');
    }
  }

  private async ensureNoOverlappingShift(
    tenantId: string,
    userIds: string[],
    startTime: Date,
    endTime: Date,
    excludedShiftId?: string,
  ): Promise<void> {
    if (userIds.length === 0) return;

    const overlap = await prisma.shift.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        ...(excludedShiftId ? { id: { not: excludedShiftId } } : {}),
        startTime: { lt: endTime },
        endTime: { gt: startTime },
        assignments: { some: { userId: { in: userIds } } },
      },
      select: { id: true },
    });

    if (overlap) {
      throw new BadRequestException(
        'A staff member is already assigned to an overlapping shift.',
      );
    }
  }

  private async ensureNoDuplicateResidentAssignment(
    tenantId: string,
    residentIds: string[],
    startTime: Date,
    endTime: Date,
    excludedShiftId?: string,
    confirmed = false,
  ): Promise<void> {
    if (residentIds.length === 0 || confirmed) return;

    const duplicateShift = await prisma.shift.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        ...(excludedShiftId ? { id: { not: excludedShiftId } } : {}),
        startTime: { lt: endTime },
        endTime: { gt: startTime },
        assignments: {
          some: {
            deletedAt: null,
            assignedResidentIds: { hasSome: residentIds },
          },
        },
      },
      include: {
        assignments: {
          where: {
            deletedAt: null,
            assignedResidentIds: { hasSome: residentIds },
          },
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
    });

    if (duplicateShift) {
      const staffNames = Array.from(
        new Set(
          duplicateShift.assignments
            .map((assignment) => assignment.user?.fullName)
            .filter((name): name is string => Boolean(name)),
        ),
      );
      throw new BadRequestException(
        `A selected resident is already assigned to another shift during this time${staffNames.length > 0 ? ` (${staffNames.join(', ')})` : ''}. Review the resident assignment before saving.`,
      );
    }
  }

  // --- Shift Types ---

  async createType(
    data: CreateShiftTypeDto,
    tenantId: string,
    branchId: string,
    userId: string,
  ): Promise<unknown> {
    const type = await prisma.shiftType.create({
      data: {
        ...data,
        tenantId,
        branchId,
      },
    });

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'CREATE',
      entityType: 'ShiftType',
      entityId: type.id,
      tenantId,
      userId,
      newValue: toJsonValue(type) as Record<string, unknown>,
    });

    return type;
  }

  async findAllTypes(tenantId: string): Promise<unknown[]> {
    return prisma.shiftType.findMany({
      where: { tenantId: tenantId || '', deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async updateType(
    id: string,
    data: CreateShiftTypeDto,
    tenantId: string,
    userId: string,
  ): Promise<unknown> {
    const existing = await prisma.shiftType.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Shift type not found');

    const type = await prisma.shiftType.update({ where: { id }, data });
    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'UPDATE',
      entityType: 'ShiftType',
      entityId: id,
      tenantId,
      userId,
      oldValue: toJsonValue(existing) as Record<string, unknown>,
      newValue: toJsonValue(type) as Record<string, unknown>,
    });
    return type;
  }

  async deleteType(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const linkedShifts = await prisma.shift.findMany({
      where: { typeId: id, tenantId, deletedAt: null },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        assignments: {
          select: { user: { select: { fullName: true } } },
        },
      },
      orderBy: { startTime: 'asc' },
    });
    if (linkedShifts.length > 0) {
      const linkedSummary = linkedShifts
        .slice(0, 5)
        .map((shift) => {
          const staff = shift.assignments
            .map((assignment) => assignment.user.fullName)
            .filter(Boolean)
            .join(', ');
          const start = shift.startTime
            .toISOString()
            .slice(0, 16)
            .replace('T', ' ');
          const end = shift.endTime
            .toISOString()
            .slice(0, 16)
            .replace('T', ' ');
          return `${start}–${end}${staff ? ` (${staff})` : ''}`;
        })
        .join('; ');
      throw new BadRequestException(
        `This template is linked to ${linkedShifts.length} existing shift(s): ${linkedSummary}. Assign another template to those shifts before deleting it.`,
      );
    }
    const result = await prisma.shiftType.updateMany({
      where: { id, tenantId, deletedAt: null },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Shift type not found');
    }

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'DELETE',
      entityType: 'ShiftType',
      entityId: id,
      tenantId,
      userId,
    });
  }

  // --- Shifts ---

  async create(
    data: CreateShiftDto,
    tenantId: string,
    branchId: string,
    userId: string,
  ): Promise<unknown> {
    const {
      startTime,
      endTime,
      wingId,
      unitId: _unitId,
      roomId,
      typeId,
      userIds,
      residentIds,
      residentAssignmentConfirmed: residentAssignmentConfirmedValue,
      assignedResidentIds,
      assignedRoomIds,
      repeatUntil,
      repeatDays,
      branchId: _clientBranchId,
      cancellationReason: _createCr,
      ...rest
    } = data as unknown as Record<string, unknown>;

    const roomIds =
      (assignedRoomIds as string[] | undefined) ||
      (roomId && roomId !== 'none' ? [roomId as string] : []);
    const resIds =
      (assignedResidentIds as string[] | undefined) ||
      (residentIds as string[] | undefined) ||
      [];
    const rawUserIds = (userIds as string[] | undefined) || [];
    const residentAssignmentConfirmed =
      residentAssignmentConfirmedValue === true;

    const careTypeVal = (data as unknown as Record<string, unknown>)
      .careType as string | undefined;
    const isOffDay = careTypeVal === 'Off / Rest Day';

    if (!isOffDay && rawUserIds.length > 0 && resIds.length === 0) {
      const fallbackResident = await prisma.resident.findFirst({
        where: { tenantId, deletedAt: null },
        select: { id: true },
      });
      if (fallbackResident) {
        resIds.push(fallbackResident.id);
      } else {
        throw new BadRequestException(
          'At least one resident must be assigned when scheduling staff on a shift.',
        );
      }
    }

    await this.ensureResidentsHaveBeds(tenantId, resIds);

    let resolvedWingId =
      wingId && wingId !== 'none' ? (wingId as string) : null;
    if (!resolvedWingId && resIds.length > 0) {
      const residentWithWing = await prisma.resident.findFirst({
        where: {
          tenantId,
          id: { in: resIds },
          deletedAt: null,
          bed: { isNot: null },
        },
        select: {
          bed: {
            select: {
              room: {
                select: { wingId: true },
              },
            },
          },
        },
      });
      if (residentWithWing?.bed?.room?.wingId) {
        resolvedWingId = residentWithWing.bed.room.wingId;
      }
    }

    const start = new Date(startTime as string | Date);
    const end = new Date(endTime as string | Date);
    this.validateShiftInterval(start, end);
    const now = new Date();
    const { start: todayStart } = getUkDayBoundaries(now);
    if (start < todayStart) {
      throw new BadRequestException(
        'Shifts cannot be scheduled on past dates.',
      );
    }
    const durationMs = end.getTime() - start.getTime();

    const datesToCreate: Date[] = [];
    if (!repeatUntil) {
      datesToCreate.push(start);
    } else {
      const { end: repeatEnd } = getUkDayBoundaries(
        repeatUntil as string | Date,
      );
      if (repeatEnd.getTime() < start.getTime()) {
        throw new BadRequestException(
          'Repeat until date cannot be earlier than start date.',
        );
      }
      let currentDate = new Date(start);
      const daysFilter = repeatDays as number[] | undefined;

      while (currentDate.getTime() <= repeatEnd.getTime()) {
        const dayOfWeek = getUkDayOfWeek(currentDate);
        if (!daysFilter || daysFilter.includes(dayOfWeek)) {
          datesToCreate.push(new Date(currentDate));
        }
        currentDate = addUkCalendarDays(currentDate, 1);
      }
    }

    if (datesToCreate.length === 0) {
      throw new BadRequestException(
        'No shifts were scheduled. Ensure repeat until date is after the start date and target days match.',
      );
    }

    const results: unknown[] = [];

    for (const currentStart of datesToCreate) {
      const currentEnd = new Date(currentStart.getTime() + durationMs);

      await this.ensureNoOverlappingShift(
        tenantId,
        rawUserIds,
        currentStart,
        currentEnd,
      );
      await this.ensureNoDuplicateResidentAssignment(
        tenantId,
        resIds,
        currentStart,
        currentEnd,
        undefined,
        residentAssignmentConfirmed,
      );

      // CQC Regulation 18 & Working Time Regulations rest interval check
      let complianceWarning: string | null = null;
      if (rawUserIds.length > 0) {
        const minRestHours = 11;
        const restWindowStart = new Date(
          currentStart.getTime() - minRestHours * 3600 * 1000,
        );
        const priorShift = await prisma.shift.findFirst({
          where: {
            tenantId,
            deletedAt: null,
            assignments: { some: { userId: { in: rawUserIds } } },
            endTime: { gte: restWindowStart, lte: currentStart },
          },
        });
        if (priorShift) {
          complianceWarning =
            'Working Time Regulations alert: Less than 11 hours rest between shifts.';
        }
      }

      const shift = await prisma.shift.create({
        data: {
          ...rest,
          tenantId,
          branchId,
          typeId: (typeId as string | null) || null,
          wingId: resolvedWingId,
          startTime: currentStart,
          endTime: currentEnd,
          notes: complianceWarning
            ? `${(rest.notes as string) || ''}\n[WTR Alert]: ${complianceWarning}`.trim()
            : (rest.notes as string | undefined),
          createdById: userId,
          updatedById: userId,
          assignments:
            rawUserIds.length > 0
              ? {
                  create: rawUserIds.map((uid: string) => ({
                    userId: uid,
                    role: 'Staff',
                    createdById: userId,
                    assignedResidentIds: resIds,
                    assignedRoomIds: roomIds,
                    flagCompliance: Boolean(complianceWarning),
                    overrideReason: complianceWarning || undefined,
                  })),
                }
              : undefined,
        },
        include: {
          type: true,
          wing: {
            include: {
              branch: {
                select: { id: true, name: true },
              },
            },
          },
          branch: {
            select: { id: true, name: true },
          },
          assignments: {
            include: { user: true },
          },
        },
      });

      if (resIds.length > 0 && rawUserIds.length > 0) {
        await prisma.resident.updateMany({
          where: {
            id: { in: resIds },
            tenantId,
            keyworkerId: null,
          },
          data: {
            keyworkerId: rawUserIds[0],
            updatedById: userId,
          },
        });
      }

      if (shift.status === 'Published' && shift.assignments.length > 0) {
        for (const assignment of shift.assignments) {
          if (assignment.user) {
            void this.notificationService?.sendAssignmentNotification({
              user: assignment.user,
              shift,
            });

            const timeUntilStart =
              new Date(shift.startTime).getTime() - Date.now();
            if (
              timeUntilStart <= 35 * 60 * 1000 &&
              timeUntilStart >= -10 * 60 * 1000
            ) {
              void this.notificationService?.sendUpcomingReminderNotification({
                user: assignment.user,
                shift,
              });
            }
          }
        }
      }

      void this.auditService.emit({
        categoryType: 'STAFF_ACTIVITY',
        actionType: 'CREATE',
        entityType: 'Shift',
        entityId: shift.id,
        tenantId,
        userId,
        newValue: toJsonValue(shift) as Record<string, unknown>,
      });

      if (
        residentAssignmentConfirmed &&
        resIds.length > 0 &&
        rawUserIds.length > 0
      ) {
        void this.auditService.emit({
          categoryType: 'STAFF_ACTIVITY',
          actionType: 'RESIDENT_ASSIGNMENT_CONFIRMED',
          entityType: 'Shift',
          entityId: shift.id,
          tenantId,
          userId,
          description: 'Confirmed resident assignment for this shift.',
          metadata: {
            residentIds: resIds,
            staffIds: rawUserIds,
            shiftId: shift.id,
          },
        });
      }

      results.push(shift);
    }

    return results.length === 1 ? results[0] : results;
  }

  async findAll(
    tenantId: string,
    from?: Date,
    to?: Date,
    wingId?: string,
  ): Promise<unknown[]> {
    const shifts = await prisma.shift.findMany({
      where: {
        tenantId: tenantId || '',
        deletedAt: null,
        wingId: wingId || undefined,
        startTime:
          from || to
            ? {
                gte: from,
                lte: to,
              }
            : undefined,
      },
      include: {
        type: true,
        wing: {
          include: {
            branch: {
              select: { id: true, name: true },
            },
          },
        },
        branch: {
          select: { id: true, name: true },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        staffLogs: {
          select: {
            id: true,
            userId: true,
            actualStartTime: true,
            actualEndTime: true,
            status: true,
            tasksCompleted: true,
            tasksTotal: true,
            handoverNotes: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    const shiftsNeedingWing = shifts.filter(
      (s) =>
        !s.wingId && s.assignments?.some((a) => a.assignedResidentIds?.length),
    );
    if (shiftsNeedingWing.length > 0) {
      const allResidentIds = Array.from(
        new Set(
          shiftsNeedingWing.flatMap((s) =>
            s.assignments.flatMap((a) => a.assignedResidentIds || []),
          ),
        ),
      );
      if (allResidentIds.length > 0) {
        const residentsWithWings = await prisma.resident.findMany({
          where: {
            tenantId,
            id: { in: allResidentIds },
            deletedAt: null,
            bed: { isNot: null },
          },
          select: {
            id: true,
            bed: {
              select: {
                room: {
                  select: {
                    wing: {
                      include: {
                        branch: {
                          select: { id: true, name: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });

        const residentWingMap = new Map<string, unknown>();
        residentsWithWings.forEach((r) => {
          if (r.bed?.room?.wing) {
            residentWingMap.set(r.id, r.bed.room.wing);
          }
        });

        return shifts.map((shift) => {
          if (shift.wingId || shift.wing) return shift;
          const assignedIds =
            shift.assignments?.flatMap((a) => a.assignedResidentIds || []) ||
            [];
          for (const resId of assignedIds) {
            const foundWing = residentWingMap.get(resId) as
              | { id: string; branch?: { id: string; name: string } }
              | undefined;
            if (foundWing) {
              return {
                ...shift,
                wingId: foundWing.id,
                wing: foundWing,
                branch: shift.branch || foundWing.branch,
              };
            }
          }
          return shift;
        });
      }
    }

    return shifts;
  }

  async update(
    id: string,
    data: UpdateShiftDto,
    tenantId: string,
    userId: string,
  ): Promise<unknown> {
    const existing = await prisma.shift.findFirst({
      where: { id, tenantId },
      include: {
        assignments: {
          select: { userId: true, assignedResidentIds: true },
        },
      },
    });
    if (!existing) throw new NotFoundException('Shift not found');

    const hasStarted = new Date(existing.startTime) <= new Date();
    if (hasStarted && data.startTime) {
      const newStart = new Date(data.startTime);
      const oldStart = new Date(existing.startTime);
      if (Math.abs(newStart.getTime() - oldStart.getTime()) > 60000) {
        throw new BadRequestException(
          'Cannot change the start time of a shift that has already started.',
        );
      }
    }

    // BUG-340: A published shift cannot be reverted directly to Draft.
    if (existing.status === 'Published' && data.status === 'Draft') {
      throw new BadRequestException(
        'A published shift cannot be reverted to Draft. Please use Cancel Shift with a mandatory reason to withdraw it.',
      );
    }

    if (existing.status === 'Cancelled' && data.status !== 'Cancelled') {
      throw new BadRequestException(
        'A cancelled shift cannot be modified or re-activated.',
      );
    }

    if (data.status === 'Cancelled' && !data.cancellationReason?.trim()) {
      throw new BadRequestException(
        'A cancellation reason is required when cancelling a shift.',
      );
    }

    const {
      id: _sId,
      startTime,
      endTime,
      wingId,
      unitId: _unitId,
      roomId,
      typeId,
      userIds,
      residentIds,
      residentAssignmentConfirmed: residentAssignmentConfirmedValue,
      assignedResidentIds,
      assignedRoomIds,
      repeatUntil: _ru,
      repeatDays: _rd,
      branchId: _clientBranchId,
      bedId: _bedId,
      cancellationReason: _cr,
      ...rest
    } = data as unknown as Record<string, unknown>;

    const roomIds =
      (assignedRoomIds as string[] | undefined) ||
      (roomId && roomId !== 'none' ? [roomId as string] : []);
    const resIds =
      (assignedResidentIds as string[] | undefined) ||
      (residentIds as string[] | undefined) ||
      [];
    const rawUserIds = userIds as string[] | undefined;
    const residentAssignmentConfirmed =
      residentAssignmentConfirmedValue === true;

    if (rawUserIds?.includes(userId)) {
      throw new BadRequestException(
        'Administrators cannot assign shifts to themselves',
      );
    }

    if (
      (residentIds !== undefined || assignedResidentIds !== undefined) &&
      resIds.length === 0 &&
      (rawUserIds ? rawUserIds.length > 0 : existing.assignments.length > 0)
    ) {
      throw new BadRequestException(
        'At least one resident must be assigned when scheduling staff on a shift.',
      );
    }

    if (residentIds !== undefined || assignedResidentIds !== undefined) {
      await this.ensureResidentsHaveBeds(tenantId, resIds);
    }

    const targetResIds =
      resIds.length > 0
        ? resIds
        : existing.assignments.flatMap((a) => a.assignedResidentIds || []);

    let resolvedWingId: string | null | undefined =
      wingId && wingId !== 'none' ? (wingId as string) : undefined;
    if (resolvedWingId === undefined && wingId === 'none') {
      resolvedWingId = null;
    }
    if (
      (resolvedWingId === null || resolvedWingId === undefined) &&
      targetResIds.length > 0
    ) {
      const residentWithWing = await prisma.resident.findFirst({
        where: {
          tenantId,
          id: { in: targetResIds },
          deletedAt: null,
          bed: { isNot: null },
        },
        select: {
          bed: {
            select: {
              room: {
                select: { wingId: true },
              },
            },
          },
        },
      });
      if (residentWithWing?.bed?.room?.wingId) {
        resolvedWingId = residentWithWing.bed.room.wingId;
      }
    }
    const nextStart = startTime
      ? new Date(startTime as string | Date)
      : existing.startTime;
    const nextEnd = endTime
      ? new Date(endTime as string | Date)
      : existing.endTime;
    this.validateShiftInterval(nextStart, nextEnd);
    const effectiveUserIds =
      rawUserIds || existing.assignments.map((assignment) => assignment.userId);
    await this.ensureNoOverlappingShift(
      tenantId,
      effectiveUserIds,
      nextStart,
      nextEnd,
      id,
    );
    await this.ensureNoDuplicateResidentAssignment(
      tenantId,
      resIds,
      nextStart,
      nextEnd,
      id,
      Boolean(residentAssignmentConfirmed),
    );

    if (rawUserIds) {
      await prisma.shiftAssignment.deleteMany({
        where: { shiftId: id },
      });

      if (rawUserIds.length > 0) {
        await prisma.shiftAssignment.createMany({
          data: rawUserIds.map((uid: string) => ({
            shiftId: id,
            userId: uid,
            role: 'Staff',
            createdById: userId,
            assignedResidentIds: resIds,
            assignedRoomIds: roomIds,
          })),
        });

        if (resIds.length > 0 && rawUserIds.length > 0) {
          await prisma.resident.updateMany({
            where: {
              id: { in: resIds },
              tenantId,
              keyworkerId: null,
            },
            data: {
              keyworkerId: rawUserIds[0],
              updatedById: userId,
            },
          });
        }
      }
    } else if (residentIds !== undefined || assignedResidentIds !== undefined) {
      await prisma.shiftAssignment.updateMany({
        where: { shiftId: id },
        data: { assignedResidentIds: resIds },
      });
    }

    const cancellationReason = data.cancellationReason?.trim();
    let updatedNotes =
      (rest.notes as string | undefined) ?? existing.notes ?? null;
    if (data.status === 'Cancelled' && cancellationReason) {
      const cancelNote = `[Cancelled]: ${cancellationReason}`;
      updatedNotes = updatedNotes
        ? `${updatedNotes}\n\n${cancelNote}`
        : cancelNote;
    }

    const shift = await prisma.shift.update({
      where: { id },
      data: {
        ...rest,
        notes: updatedNotes,
        typeId: (typeId as string | null) || null,
        wingId: resolvedWingId !== undefined ? resolvedWingId : existing.wingId,
        startTime: nextStart,
        endTime: nextEnd,
        updatedById: userId,
      },
      include: {
        type: true,
        wing: {
          include: {
            branch: {
              select: { id: true, name: true },
            },
          },
        },
        branch: {
          select: { id: true, name: true },
        },
        assignments: {
          include: { user: true },
        },
      },
    });

    if (
      shift.status === 'Published' &&
      existing.status !== 'Published' &&
      shift.assignments.length > 0
    ) {
      for (const assignment of shift.assignments) {
        if (assignment.user) {
          void this.notificationService?.sendAssignmentNotification({
            user: assignment.user,
            shift,
          });

          const timeUntilStart =
            new Date(shift.startTime).getTime() - Date.now();
          if (
            timeUntilStart <= 35 * 60 * 1000 &&
            timeUntilStart >= -10 * 60 * 1000
          ) {
            void this.notificationService?.sendUpcomingReminderNotification({
              user: assignment.user,
              shift,
            });
          }
        }
      }
    }

    const timingChanged =
      new Date(shift.startTime).getTime() !==
        new Date(existing.startTime).getTime() ||
      new Date(shift.endTime).getTime() !==
        new Date(existing.endTime).getTime();
    const isExtended =
      new Date(shift.endTime).getTime() > new Date(existing.endTime).getTime();

    if (
      shift.status === 'Published' &&
      existing.status === 'Published' &&
      timingChanged &&
      shift.assignments.length > 0
    ) {
      for (const assignment of shift.assignments) {
        if (assignment.user) {
          void this.notificationService?.sendShiftUpdatedNotification({
            user: assignment.user,
            shift,
            previousEndTime: existing.endTime,
            isExtended,
          });
        }
      }
    }

    if (data.status === 'Cancelled' && existing.assignments.length > 0) {
      try {
        const notificationData = existing.assignments
          .filter((a) => Boolean(a.userId))
          .map((a) => ({
            tenantId,
            branchId: existing.branchId,
            recipientId: a.userId,
            title: 'Shift Cancelled',
            message: `Your shift scheduled on ${new Date(existing.startTime).toLocaleDateString()} has been cancelled. Reason: ${cancellationReason || 'Operational rearrangement'}`,
            category: 'TASK',
            priority: 'High',
            actionUrl: '/carer/rota',
            channels: ['IN_APP'],
          }));

        if (notificationData.length > 0) {
          await prisma.notification.createMany({
            data: notificationData,
          });
        }
      } catch (notifError) {
        console.warn(
          'Failed to deliver in-app carer shift cancellation notification:',
          notifError,
        );
      }
    }

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'UPDATE',
      entityType: 'Shift',
      entityId: id,
      tenantId,
      userId,
      oldValue: toJsonValue(existing) as Record<string, unknown>,
      newValue: toJsonValue(shift) as Record<string, unknown>,
    });

    if (
      residentAssignmentConfirmed &&
      resIds.length > 0 &&
      rawUserIds &&
      rawUserIds.length > 0
    ) {
      void this.auditService.emit({
        categoryType: 'STAFF_ACTIVITY',
        actionType: 'RESIDENT_ASSIGNMENT_CONFIRMED',
        entityType: 'Shift',
        entityId: shift.id,
        tenantId,
        userId,
        description: 'Confirmed resident assignment for this shift.',
        metadata: {
          residentIds: resIds,
        },
      });
    }

    if (data.repeatUntil) {
      const { end: repeatEnd } = getUkDayBoundaries(data.repeatUntil);
      let currentDate = addUkCalendarDays(nextStart, 1);
      const daysFilter = data.repeatDays || [];
      const durationMs = nextEnd.getTime() - nextStart.getTime();

      while (currentDate.getTime() <= repeatEnd.getTime()) {
        const dayOfWeek = getUkDayOfWeek(currentDate);
        if (!daysFilter.length || daysFilter.includes(dayOfWeek)) {
          const occStart = new Date(currentDate);
          const occEnd = new Date(occStart.getTime() + durationMs);

          try {
            await this.create(
              {
                ...data,
                startTime: occStart,
                endTime: occEnd,
                repeatUntil: undefined,
                repeatDays: undefined,
              } as unknown as CreateShiftDto,
              tenantId,
              existing.branchId,
              userId,
            );
          } catch {
            // Collisions or rest warnings on individual recurring instances do not fail the primary update
          }
        }
        currentDate = addUkCalendarDays(currentDate, 1);
      }
    }

    return shift;
  }

  async delete(id: string, tenantId: string, userId: string): Promise<void> {
    await prisma.shift.update({
      where: { id, tenantId },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
    });

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'DELETE',
      entityType: 'Shift',
      entityId: id,
      tenantId,
      userId,
    });
  }

  private validateShiftInterval(start: Date, end: Date): void {
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
      throw new BadRequestException(
        'Shift start and end times must be valid dates.',
      );
    }
    if (end <= start) {
      throw new BadRequestException(
        'Shift end time must be after the start time. For overnight shifts, use the following calendar date for the end time.',
      );
    }
  }

  async assignStaff(
    data: CreateShiftAssignmentDto,
    tenantId: string,
    userId: string,
  ): Promise<unknown> {
    if (data.userId === userId) {
      throw new BadRequestException(
        'Administrators cannot assign shifts to themselves',
      );
    }

    const shift = await prisma.shift.findFirst({
      where: { id: data.shiftId, tenantId, deletedAt: null },
    });
    if (!shift) throw new NotFoundException('Shift not found');

    if (new Date(shift.startTime) <= new Date()) {
      throw new BadRequestException(
        'Cannot change staff assignments after a shift has started',
      );
    }

    const existingAssignment = await prisma.shiftAssignment.findFirst({
      where: {
        shiftId: data.shiftId,
        userId: data.userId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (existingAssignment) {
      throw new BadRequestException(
        'This staff member is already assigned to the shift.',
      );
    }

    await this.ensureNoOverlappingShift(
      tenantId,
      [data.userId],
      shift.startTime,
      shift.endTime,
      data.shiftId,
    );

    const assignment = await prisma.shiftAssignment.create({
      data: {
        shiftId: data.shiftId,
        userId: data.userId,
        role: data.role,
        createdById: userId,
        updatedById: userId,
      },
      include: {
        user: true,
        shift: {
          include: {
            type: true,
            wing: true,
          },
        },
      },
    });

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'CREATE',
      entityType: 'ShiftAssignment',
      entityId: assignment.id,
      tenantId,
      userId,
      newValue: toJsonValue(assignment) as Record<string, unknown>,
    });

    if (assignment.shift.status === 'Published' && assignment.user) {
      void this.notificationService?.sendAssignmentNotification({
        user: assignment.user,
        shift: assignment.shift,
      });
    }

    return assignment;
  }

  async unassignStaff(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const assignment = await prisma.shiftAssignment.findUnique({
      where: { id },
      include: { shift: true },
    });

    if (!assignment || assignment.shift.tenantId !== tenantId) {
      throw new NotFoundException('Assignment not found');
    }

    if (new Date(assignment.shift.startTime) <= new Date()) {
      throw new BadRequestException(
        'Cannot change staff assignments after a shift has started',
      );
    }

    await prisma.shiftAssignment.delete({ where: { id } });

    void this.auditService.emit({
      categoryType: 'STAFF_ACTIVITY',
      actionType: 'DELETE',
      entityType: 'ShiftAssignment',
      entityId: id,
      tenantId,
      userId,
    });
  }
}
