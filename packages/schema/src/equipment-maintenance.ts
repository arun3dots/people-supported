import { z } from "zod";

export const EQUIPMENT_CATEGORIES = [
  "Hoist",
  "Bed",
  "Wheelchair",
  "FireSafety",
  "MedicalDevice",
] as const;

export const createEquipmentLogSchema = z.object({
  equipmentName: z.string().trim().min(2, "Equipment name is required").max(100),
  serialNumber: z.string().trim().optional().or(z.literal("")),
  location: z.string().trim().min(2, "Location is required").max(100),
  category: z.enum(EQUIPMENT_CATEGORIES, {
    errorMap: () => ({ message: "Valid equipment category is required" }),
  }),
  lastCheckedDate: z.string().min(1, "Last checked date is required"),
  nextServiceDue: z.string().min(1, "Next service due date is required"),
  status: z.enum(["Pass", "Fail", "OutOfService"]).default("Pass"),
  servicedBy: z.string().trim().min(2, "Servicing engineer or staff name is required"),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type CreateEquipmentLogDTO = z.infer<typeof createEquipmentLogSchema>;

export const updateEquipmentStatusSchema = z.object({
  status: z.enum(["Pass", "Fail", "OutOfService"]),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type UpdateEquipmentStatusDTO = z.infer<typeof updateEquipmentStatusSchema>;

