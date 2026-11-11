import { z } from "zod";

/**
 * Self-service profile editing. Allows users to update their personal details
 * (name parts / full name, department, start date, preferred language, email,
 * and contact / address info).
 */
export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50).optional(),
  middleName: z.string().max(50).optional().nullable(),
  lastName: z.string().min(1, "Last name is required").max(50).optional(),
  fullName: z.string().min(1, "Full name cannot be empty").max(150).optional(),
  email: z.string().email("Invalid email address").optional(),
  department: z.string().max(100, "Department name is too long").optional().nullable(),
  startDate: z.string().optional().nullable(),
  preferredLanguage: z.string().max(50, "Language is too long").optional().nullable(),
  phoneNumber: z
    .string()
    .max(25, "Phone number must not exceed 25 characters")
    .optional()
    .nullable()
    .refine((v) => {
      if (!v || !v.trim()) return true;
      const trimmed = v.trim();
      const validCharsRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
      if (!validCharsRegex.test(trimmed)) return false;
      const digits = trimmed.replace(/\D/g, "");
      return digits.length >= 7 && digits.length <= 15;
    }, "Please enter a valid phone number (7–15 digits, numbers and + - ( ) only)"),
  addressLine1: z.string().max(200, "Address is too long").optional().nullable(),
  addressLine2: z.string().max(200, "Address is too long").optional().nullable(),
  city: z.string().max(100, "City is too long").optional().nullable(),
  postcode: z
    .string()
    .optional()
    .nullable()
    .refine((value) => {
      if (!value || !value.trim()) return true;
      const postcode = value.trim();
      const hasDigit = /\d/.test(postcode);
      const hasLetter = /[A-Za-z]/.test(postcode);
      return hasDigit || hasLetter === false;
    }, "Postcode cannot contain text only; enter numbers or a number and text combination"),
});

export type UpdateProfileDTO = z.infer<typeof updateProfileSchema>;
