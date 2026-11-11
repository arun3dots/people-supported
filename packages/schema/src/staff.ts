import { z } from "zod";
import { paginationQuerySchema } from "./common/pagination";

const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;

export function isValidStaffPhone(phone?: string | null): boolean {
  if (!phone || typeof phone !== "string") return false;
  const trimmed = phone.trim();
  if (!trimmed) return false;
  if (!phoneRegex.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function isOptionalStaffPhoneValid(phone?: string | null): boolean {
  if (!phone || !phone.trim()) return true;
  return isValidStaffPhone(phone);
}

export function getStaffPhoneValidationError(
  phone?: string | null,
  isRequired = false,
  fieldName = "Phone number",
): string | null {
  const trimmed = (phone || "").trim();
  if (!trimmed) {
    if (isRequired) return `${fieldName} is required`;
    return null;
  }
  if (!isValidStaffPhone(trimmed)) {
    return "Please enter a valid phone number";
  }
  return null;
}

export const staffPhoneSchema = z
  .string()
  .max(25, "Phone number must not exceed 25 characters")
  .optional()
  .nullable()
  .refine(
    (v) => isOptionalStaffPhoneValid(v),
    "Please enter a valid phone number",
  );

export const emergencyContactSchema = z.object({
  name: z.string().optional().nullable(),
  relation: z.string().optional().nullable(),
  phone: staffPhoneSchema,
  email: z.union([z.string().email("Invalid email address"), z.literal("")]).optional().nullable(),
});

export type EmergencyContactDTO = z.infer<typeof emergencyContactSchema>;

export const createStaffSchema = z.object({
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: staffPhoneSchema,
  roleId: z.string().min(1, "Role is required"),
  dob: z.string().or(z.date()), // Date of Birth
  niNumber: z
    .union([
      z
        .string()
        .regex(
          /^[A-CEGHJ-PR-TW-Z]{1}[A-CEGHJ-NPR-TW-Z]{1}[0-9]{6}[A-D]{1}$/,
          "Invalid NI Number format",
        ),
      z.literal(""),
    ])
    .optional()
    .nullable(),
  dbsNumber: z
    .union([z.string().min(1, "DBS Number is required"), z.literal("")])
    .optional()
    .nullable(),
  dbsExpiryDate: z.string().or(z.date()).optional().nullable(),
  startDate: z.string().min(1, "Start date is required").or(z.date()),
  address: z.string().optional().nullable(), // Home address (maps to profile.addressLine1)
  unitIds: z.array(z.string()), // Unit/Wing assignments
  branchId: z.string().optional(),
  department: z.string().optional().nullable(),
  contractType: z.string().optional().nullable(),
  contractedHoursPerWeek: z.coerce.number().optional().nullable(),
  schemeId: z.string().optional().nullable(),
  propertyId: z.string().optional().nullable(),
  emergencyContacts: z.array(emergencyContactSchema).optional().nullable(),
});

export const createStaffSupportedLivingSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  roleId: z.string().min(1, "Role is required"),
  contractType: z.string().default("Full-time"),
  schemeId: z.string().min(1, "Scheme is required"),
  propertyId: z.string().min(1, "Property is required"),
  phone: z.string().min(7, "Valid mobile number is required"),
  email: z.string().email("Invalid email address"),
  contractedHoursPerWeek: z.coerce.number().min(0).default(37.5),
});
export type CreateStaffSupportedLivingDTO = z.infer<
  typeof createStaffSupportedLivingSchema
>;

export const updateStaffSchema = z.object({
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  fullName: z.string().optional(),
  email: z.union([z.string().email("Invalid email address"), z.literal("")]).optional(),
  phone: staffPhoneSchema,
  roleId: z.string().optional(),
  dob: z
    .union([z.string(), z.date(), z.literal("")])
    .optional()
    .nullable()
    .refine((v) => {
      if (!v || v === "") return true;
      const parsed = new Date(v);
      if (isNaN(parsed.getTime())) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return parsed < today;
    }, "Date of birth cannot be today or a future date"),
  niNumber: z.string().optional().nullable(),
  dbsNumber: z.string().optional().nullable(),
  contractType: z.string().optional().nullable(),
  contractedHoursPerWeek: z.coerce.number().optional().nullable(),
  schemeId: z.string().optional().nullable(),
  propertyId: z.string().optional().nullable(),
  dbsExpiryDate: z.union([z.string(), z.date(), z.literal("")]).optional().nullable(),
  startDate: z.union([z.string(), z.date(), z.literal("")]).optional().nullable(),
  address: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  unitIds: z.array(z.string()).optional(),
  emergencyContacts: z.array(emergencyContactSchema).optional().nullable(),
});

export const updateStaffRoleSchema = z.object({
  roleId: z.string().min(1, "Role is required"),
});

export const staffStatusSchema = z.enum(["Active", "Inactive"]);

export const updateStaffStatusSchema = z.object({
  status: staffStatusSchema,
});

export type CreateStaffDTO = z.infer<typeof createStaffSchema>;
export type UpdateStaffDTO = z.infer<typeof updateStaffSchema>;
export type UpdateStaffRoleDTO = z.infer<typeof updateStaffRoleSchema>;
export type UpdateStaffStatusDTO = z.infer<typeof updateStaffStatusSchema>;
export type StaffStatus = z.infer<typeof staffStatusSchema>;

export const updateStaffAssignmentsSchema = z.object({
  wingIds: z.array(z.string()).optional(),
  roomIds: z.array(z.string()).optional(),
  bedIds: z.array(z.string()).optional(),
  residentIds: z.array(z.string()).optional(),
});

export type UpdateStaffAssignmentsDTO = z.infer<
  typeof updateStaffAssignmentsSchema
>;

export const addUserSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "First name is required")
      .refine((v) => !/^[0-9]/.test(v), "First name cannot start with a number"),
    middleName: z
      .string()
      .optional()
      .refine((v) => !v || !/^[0-9]/.test(v), "Middle name cannot start with a number"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .refine((v) => !/^[0-9]/.test(v), "Last name cannot start with a number"),
    fullName: z.string().optional(),
    email: z.string().email("Invalid email address"),
    phone: staffPhoneSchema,
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .refine((v) => !/\s/.test(v), "Username cannot contain spaces"),
    dob: z
      .string()
      .min(1, "Date of birth is required")
      .refine(
        (v) => !v || !isNaN(Date.parse(v)),
        "Please enter a valid date of birth (YYYY-MM-DD)",
      )
      .refine((v) => {
        if (!v) return true;
        const parsed = new Date(v);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return parsed < today;
      }, "Date of birth cannot be today or a future date"),
    department: z.string().min(1, "Department is required"),
    roleId: z.string().min(1, "Role is required"),
    jobTitle: z.string().optional(),
    employeeId: z.string().optional(),
    location: z.string().optional(),
    timeZone: z.string().optional(),
    managerId: z.string().optional(),
    notes: z.string().max(250, "Notes cannot exceed 250 characters").optional(),
  })

export type AddUserDTO = z.infer<typeof addUserSchema>;

export const staffListQuerySchema = paginationQuerySchema.extend({
  roleId: z.string().optional(),
  status: staffStatusSchema.optional(),
  wingId: z.string().optional(),
  unitId: z.string().optional(),
  /**
   * Restrict to staff assigned to this branch (via UserBranch). Honoured only
   * for tenant-wide callers; a branch-assigned user is always pinned to their
   * JWT `activeBranchId` by the controller.
   */
  branchId: z.string().optional(),
  sortBy: z.enum(["fullName", "createdAt", "startDate"]).default("createdAt"),
});

/** Parsed shape the service receives (page/limit/sort defaults applied). */
export type StaffListQueryDTO = z.infer<typeof staffListQuerySchema>;
/** Partial shape the web hooks send. */
export type StaffListQueryInput = z.input<typeof staffListQuerySchema>;

