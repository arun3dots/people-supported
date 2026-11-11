import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters long."),
  email: z.string().email("Invalid email address."),
  mobileNumber: z
    .string()
    .min(10, "Mobile number must be at least 10 characters long.")
    .optional()
    .or(z.literal("")),
  address: z.string().optional(),
  profilePhoto: z.string().optional(),
});

export type UpdateProfileDTO = z.infer<typeof updateProfileSchema>;
