import { z } from "zod";

export const ShiftTypeSchema = z.object({
  id: z.string().uuid().optional(),
  // Optional: branch-assigned callers get branchId from their JWT
  // (req.user.activeBranchId); only tenant-wide callers with no active
  // branch need to supply it explicitly here.
  branchId: z.string().optional(),
  name: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  color: z.string().optional().nullable(),
});

export type ShiftTypeDTO = z.infer<typeof ShiftTypeSchema>;

export const CreateShiftTypeSchema = ShiftTypeSchema.omit({ id: true });
export type CreateShiftTypeDTO = z.infer<typeof CreateShiftTypeSchema>;

export const ShiftCareTypeEnum = z.enum([
  "Shared Care (Core Support)",
  "1:1 Dedicated Support",
  "2:1 Dedicated Support",
  "Sleep-in (Overnight)",
  "Waking Night",
  "Off / Rest Day",
]);
export type ShiftCareType = z.infer<typeof ShiftCareTypeEnum>;

export const ShiftSchema = z.object({
  id: z.string().uuid().optional(),
  // Optional: branch-assigned callers get branchId from their JWT
  // (req.user.activeBranchId); only tenant-wide callers with no active
  // branch need to supply it explicitly here.
  branchId: z.string().optional(),
  typeId: z.string().optional().nullable(),
  wingId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  roomId: z.string().optional().nullable(),
  careType: z.string().optional().nullable(),
  shiftWindow: z.string().optional().nullable(),
  durationHours: z.number().optional().nullable(),
  breakDurationMinutes: z.number().int().optional().nullable(),
  requiredHeadcount: z.number().int().optional().nullable(),
  assignmentType: z.enum(["Property", "Person", "Scheme"]).optional().nullable(),
  startTime: z.union([z.string(), z.date()]),
  endTime: z.union([z.string(), z.date()]),
  status: z.enum(["Draft", "Published", "Cancelled"]).default("Draft"),
  cancellationReason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  userIds: z.array(z.string()).optional(),
  residentIds: z.array(z.string()).optional(),
  residentAssignmentConfirmed: z.boolean().optional(),
  repeatUntil: z.union([z.string(), z.date()]).optional(),
  repeatDays: z.array(z.number()).optional(),
});

export type ShiftDTO = z.infer<typeof ShiftSchema>;

export const CreateShiftSchema = ShiftSchema.omit({ id: true });
export type CreateShiftDTO = z.infer<typeof CreateShiftSchema>;

export const UpdateShiftSchema = ShiftSchema.omit({ id: true }).partial();
export type UpdateShiftDTO = z.infer<typeof UpdateShiftSchema>;

export const CreateShiftScheduleSchema = CreateShiftSchema.extend({
  status: z.enum(["Draft", "Published", "Cancelled"]),
  userIds: z.array(z.string()).min(1, "At least one staff member is required"),
});
export type CreateShiftScheduleDTO = z.infer<typeof CreateShiftScheduleSchema>;

export const ReassignStaffWorkSchema = z.object({
  staffId: z.string().min(1, "Staff ID is required"),
  schemeId: z.string().min(1, "Scheme is required"),
  propertyId: z.string().min(1, "Property is required"),
  assignmentType: z.enum(["Primary", "Secondary"]).default("Primary"),
  effectiveFrom: z.string().min(1, "Effective date is required"),
  endDate: z.string().optional().nullable(),
  reason: z.string().min(1, "Reason for reassignment is required"),
  notes: z.string().optional().nullable(),
});
export type ReassignStaffWorkDTO = z.infer<typeof ReassignStaffWorkSchema>;

export const ShiftAssignmentSchema = z.object({
  id: z.string().uuid().optional(),
  shiftId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.string().min(1),
});

export type ShiftAssignmentDTO = z.infer<typeof ShiftAssignmentSchema>;

export const CreateShiftAssignmentSchema = ShiftAssignmentSchema.omit({ id: true });
export type CreateShiftAssignmentDTO = z.infer<typeof CreateShiftAssignmentSchema>;

export const ShiftRequestSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(["Leave", "Change", "Cover"]),
  status: z.enum(["Pending", "Approved", "Rejected"]).default("Pending"),
  startTime: z
    .union([z.string(), z.date()])
    .refine(
      (val) => {
        if (!val || val === "") return false;
        const d = new Date(val);
        return !isNaN(d.getTime());
      },
      { message: "A valid start date and time is required" },
    ),
  endTime: z
    .union([z.string(), z.date()])
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val || val === "") return true;
        const d = new Date(val);
        return !isNaN(d.getTime());
      },
      { message: "Invalid end date and time" },
    ),
  reason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  shiftId: z.string().uuid().optional().nullable(),
});

export type ShiftRequestDTO = z.infer<typeof ShiftRequestSchema>;

export const CreateShiftRequestSchema = ShiftRequestSchema.omit({ id: true, status: true });
export type CreateShiftRequestDTO = z.infer<typeof CreateShiftRequestSchema>;

export const UpdateShiftRequestStatusSchema = z.object({
  status: z.enum(["Pending", "Approved", "Rejected"]),
  adminNotes: z.string().optional().nullable(),
});
export type UpdateShiftRequestStatusDTO = z.infer<typeof UpdateShiftRequestStatusSchema>;

export const StartShiftLogSchema = z.object({
  shiftId: z.string().uuid(),
  notes: z.string().optional().nullable(),
});
export type StartShiftLogDTO = z.infer<typeof StartShiftLogSchema>;

export const EndShiftLogSchema = z.object({
  handoverNotes: z.string().optional().nullable(),
  tasksCompleted: z.number().int().optional(),
  tasksTotal: z.number().int().optional(),
});
export type EndShiftLogDTO = z.infer<typeof EndShiftLogSchema>;

export const ShiftDetailsResidentSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  roomNumber: z.string().optional().nullable(),
  bedNumber: z.string().optional().nullable(),
  careLevel: z.string().optional().nullable(),
  riskLevel: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  age: z.number().optional().nullable(),
  gender: z.string().optional().nullable(),
  flags: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
});
export type ShiftDetailsResidentDTO = z.infer<typeof ShiftDetailsResidentSchema>;

export const ShiftDetailsTaskSchema = z.object({
  id: z.string(),
  residentId: z.string(),
  residentName: z.string(),
  residentPhotoUrl: z.string().optional().nullable(),
  bedNumber: z.string().optional().nullable(),
  title: z.string(),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  priority: z.string().optional().nullable(),
  status: z.string(),
  scheduledTimeStr: z.string().optional().nullable(),
  time: z.string().optional().nullable(),
  timingStatus: z.string().optional().nullable(),
});
export type ShiftDetailsTaskDTO = z.infer<typeof ShiftDetailsTaskSchema>;

export const PreviousShiftHandoverSchema = z.object({
  id: z.string().optional(),
  staffId: z.string().optional(),
  shiftName: z.string().optional().nullable(),
  staffName: z.string().optional().nullable(),
  staffRole: z.string().optional().nullable(),
  staffAvatarUrl: z.string().optional().nullable(),
  startTime: z.union([z.string(), z.date()]).optional().nullable(),
  endTime: z.union([z.string(), z.date()]).optional().nullable(),
  handoverNotes: z.string(),
});
export type PreviousShiftHandoverDTO = z.infer<typeof PreviousShiftHandoverSchema>;

export const NextShiftHandoverPersonSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  role: z.string(),
  shiftHours: z.string(),
  avatarUrl: z.string().optional().nullable(),
});
export type NextShiftHandoverPersonDTO = z.infer<typeof NextShiftHandoverPersonSchema>;

export const NextShiftDetailsSchema = z.object({
  id: z.string(),
  name: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  timingFormatted: z.string().optional(),
  handoverPerson: NextShiftHandoverPersonSchema.optional().nullable(),
});
export type NextShiftDetailsDTO = z.infer<typeof NextShiftDetailsSchema>;

export const ShiftDetailsResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  wardName: z.string().optional().nullable(),
  startTime: z.union([z.string(), z.date()]),
  endTime: z.union([z.string(), z.date()]),
  formattedStartTime: z.string().optional().nullable(),
  formattedEndTime: z.string().optional().nullable(),
  rawStartTime: z.union([z.string(), z.date()]).optional().nullable(),
  rawEndTime: z.union([z.string(), z.date()]).optional().nullable(),
  timingFormatted: z.string(),
  durationFormatted: z.string().optional(),
  timeRemainingStr: z.string().optional().nullable(),
  status: z.string().optional(),
  isStarted: z.boolean().optional(),
  isContinuing: z.boolean().optional(),
  hasContinuousNextShift: z.boolean().optional(),
  actualStartTime: z.union([z.string(), z.date()]).optional().nullable(),
  actualEndTime: z.union([z.string(), z.date()]).optional().nullable(),
  tasksCompleted: z.number(),
  tasksTotal: z.number(),
  tasksPending: z.number().optional(),
  incidentCount: z.number().optional(),
  shiftNotes: z.string().optional().nullable(),
  handoverNotes: z.string().optional().nullable(),
  previousShiftHandover: PreviousShiftHandoverSchema.optional().nullable(),
  previousShiftHandovers: z.array(PreviousShiftHandoverSchema).optional(),
  nextShift: NextShiftDetailsSchema.optional().nullable(),
  assignedResidents: z.array(ShiftDetailsResidentSchema).optional(),
  tasks: z.array(ShiftDetailsTaskSchema).optional(),
});
export type ShiftDetailsResponseDTO = z.infer<typeof ShiftDetailsResponseSchema>;

export const ActiveShiftItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  wardName: z.string().optional().nullable(),
  startTime: z.union([z.string(), z.date()]),
  endTime: z.union([z.string(), z.date()]),
  formattedStartTime: z.string().optional().nullable(),
  formattedEndTime: z.string().optional().nullable(),
  timingFormatted: z.string().optional().nullable(),
  rawStartTime: z.union([z.string(), z.date()]).optional().nullable(),
  rawEndTime: z.union([z.string(), z.date()]).optional().nullable(),
  actualStartedTime: z.string().optional().nullable(),
  timeRemainingStr: z.string().optional().nullable(),
  isStarted: z.boolean().optional(),
  isCompleted: z.boolean().optional(),
  isContinuing: z.boolean().optional(),
  hasContinuousNextShift: z.boolean().optional(),
  status: z.string().optional(),
  shiftStatus: z.string().optional(),
  tasksCompleted: z.number().optional(),
  tasksTotal: z.number().optional(),
  incidentCount: z.number().optional(),
});
export type ActiveShiftItemDTO = z.infer<typeof ActiveShiftItemSchema>;

export const ActiveShiftResponseSchema = z.object({
  active: ActiveShiftItemSchema.nullable(),
  next: ActiveShiftItemSchema.nullable(),
});
export type ActiveShiftResponseDTO = z.infer<typeof ActiveShiftResponseSchema>;

export const UpdateShiftScheduleSchema = CreateShiftScheduleSchema.partial();
export type UpdateShiftScheduleDTO = z.infer<typeof UpdateShiftScheduleSchema>;

export const StartShiftSchema = z.object({
  notes: z.string().optional(),
});
export type StartShiftDTO = z.infer<typeof StartShiftSchema>;

export const EndShiftSchema = z.object({
  handoverNotes: z.string().optional(),
  tasksCompleted: z.number().int().nonnegative().optional(),
  tasksTotal: z.number().int().nonnegative().optional(),
});
export type EndShiftDTO = z.infer<typeof EndShiftSchema>;

export const UpdateHandoverNotesSchema = z.object({
  handoverNotes: z.string().min(1, "Handover notes are required"),
});
export type UpdateHandoverNotesDTO = z.infer<typeof UpdateHandoverNotesSchema>;



