import { z } from "zod";

/**
 * Validates a UK NHS Number using the official Modulus 11 algorithm.
 * An NHS number is 10 digits long (spaces and hyphens are stripped).
 * Weightings 10, 9, 8, 7, 6, 5, 4, 3, 2 are applied to the first 9 digits.
 * The check digit must match (11 - (sum % 11)), where 11 becomes 0, and 10 is invalid.
 */
export function isValidNhsNumber(value: string | null | undefined): boolean {
  if (!value) return false;
  const cleaned = value.replace(/[\s-]/g, "");
  if (!/^\d{10}$/.test(cleaned)) return false;

  // Disallow all identical digits (e.g. 0000000000 or 9999999999)
  if (/^(\d)\1{9}$/.test(cleaned)) return false;

  const digits = cleaned.split("").map(Number);
  const weights = [10, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += (digits[i] ?? 0) * (weights[i] ?? 0);
  }

  const remainder = sum % 11;
  const checkDigit = 11 - remainder;

  if (checkDigit === 11) {
    return digits[9] === 0;
  }
  if (checkDigit === 10) {
    return false; // NHS numbers yielding check digit 10 are invalid and not issued
  }

  return digits[9] === checkDigit;
}

/**
 * Formats a 10-digit NHS number into standard UK 3-3-4 display format (e.g., "943 476 5919").
 */
export function formatNhsNumber(value: string | null | undefined): string {
  if (!value) return "";
  const cleaned = value.replace(/[\s-]/g, "");
  if (cleaned.length !== 10) return value;
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
}

/**
 * Optional or empty NHS number schema that validates Modulus 11 if provided.
 */
export const optionalNhsNumberSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine(
    (val) => !val || isValidNhsNumber(val),
    {
      message:
        "Invalid NHS number. Must be a 10-digit UK NHS number passing the Modulus 11 check.",
    },
  );

/**
 * Required NHS number schema validating 10-digit Modulus 11 format.
 */
export const requiredNhsNumberSchema = z
  .string({ required_error: "NHS number is required" })
  .trim()
  .min(1, "NHS number is required")
  .refine(
    (val) => isValidNhsNumber(val),
    {
      message:
        "Invalid NHS number. Must be a 10-digit UK NHS number passing the Modulus 11 check.",
    },
  );

