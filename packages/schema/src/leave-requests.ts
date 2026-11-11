import { z } from "zod";

export const LeaveRequestSchema = z.object({
  id: z.string().uuid().optional(),
  staffId: z.string().uuid(),
  type: z.enum(["Annual Leave", "Sick Leave", "Compassionate", "Training", "TOIL", "Unpaid"]),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  reason: z.string().optional().nullable(),
  status: z.enum(["Pending", "Approved", "Declined", "Cancelled"]).default("Pending"),
});

export type LeaveRequestDTO = z.infer<typeof LeaveRequestSchema>;
export const CreateLeaveRequestSchema = LeaveRequestSchema.omit({ id: true, status: true });
export type CreateLeaveRequestDTO = z.infer<typeof CreateLeaveRequestSchema>;

export const UpdateLeaveRequestStatusSchema = z.object({
  status: z.enum(["Approved", "Declined", "Cancelled"]),
  adminNotes: z.string().optional().nullable(),
});
export type UpdateLeaveRequestStatusDTO = z.infer<typeof UpdateLeaveRequestStatusSchema>;
