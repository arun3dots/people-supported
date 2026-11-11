/**
 * Phone Number Validation Utilities
 * Validates UK and international telephone formats
 */

/**
 * Checks if a phone number string is valid.
 * Allows digits, spaces, hyphens, parentheses, and leading plus sign (+).
 * Expects between 7 and 15 digits (standard E.164 / local range).
 */
export function isValidPhoneNumber(phone?: string | null): boolean {
  if (!phone || typeof phone !== "string") return false;
  const trimmed = phone.trim();
  if (!trimmed) return false;

  // Allowed characters: +, (, ), -, ., spaces, and digits
  const validCharsRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
  if (!validCharsRegex.test(trimmed)) {
    return false;
  }

  // Count raw digits
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

/**
 * Validates an optional phone number (valid if empty, but must be valid format if provided).
 */
export function isOptionalPhoneValid(phone?: string | null): boolean {
  if (!phone || !phone.trim()) return true;
  return isValidPhoneNumber(phone);
}

/**
 * Returns a human-friendly error message if phone is invalid.
 */
export function getPhoneValidationError(
  phone?: string | null,
  isRequired = false,
  fieldName = "Phone number"
): string | null {
  const trimmed = (phone || "").trim();

  if (!trimmed) {
    if (isRequired) {
      return `${fieldName} is required`;
    }
    return null;
  }

  if (!isValidPhoneNumber(trimmed)) {
    return `${fieldName} is invalid. Please enter 7–15 digits (e.g. +44 7700 900077 or 0161 999 1234)`;
  }

  return null;
}
