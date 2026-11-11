import {
  isValidNhsNumber,
  formatNhsNumber,
  optionalNhsNumberSchema,
  requiredNhsNumberSchema,
} from '@repo/schema';

describe('UK NHS Number Modulus 11 Checksum Validation (F-07)', () => {
  describe('isValidNhsNumber', () => {
    it('should accept valid 10-digit NHS numbers with spaces', () => {
      // Standard UK test numbers
      expect(isValidNhsNumber('943 476 5919')).toBe(true);
      expect(isValidNhsNumber('485 777 3457')).toBe(true);
    });

    it('should accept valid 10-digit NHS numbers without spaces or with hyphens', () => {
      expect(isValidNhsNumber('9434765919')).toBe(true);
      expect(isValidNhsNumber('943-476-5919')).toBe(true);
      expect(isValidNhsNumber('4857773457')).toBe(true);
    });

    it('should reject NHS numbers with incorrect check digits', () => {
      expect(isValidNhsNumber('943 476 5918')).toBe(false);
      expect(isValidNhsNumber('943 476 5910')).toBe(false);
      expect(isValidNhsNumber('123 456 7890')).toBe(false);
      expect(isValidNhsNumber('999 123 4567')).toBe(false);
    });

    it('should reject invalid lengths and formats', () => {
      expect(isValidNhsNumber('')).toBe(false);
      expect(isValidNhsNumber('123')).toBe(false);
      expect(isValidNhsNumber('94347659190')).toBe(false); // 11 digits
      expect(isValidNhsNumber('943476591')).toBe(false); // 9 digits
      expect(isValidNhsNumber('943 476 ABCD')).toBe(false);
      expect(isValidNhsNumber(null)).toBe(false);
      expect(isValidNhsNumber(undefined)).toBe(false);
    });

    it('should reject all-identical digits', () => {
      expect(isValidNhsNumber('0000000000')).toBe(false);
      expect(isValidNhsNumber('9999999999')).toBe(false);
    });
  });

  describe('formatNhsNumber', () => {
    it('should format valid unformatted NHS numbers into 3-3-4 pattern', () => {
      expect(formatNhsNumber('9434765919')).toBe('943 476 5919');
      expect(formatNhsNumber('943-476-5919')).toBe('943 476 5919');
    });

    it('should return unchanged if length is not 10 digits', () => {
      expect(formatNhsNumber('123')).toBe('123');
      expect(formatNhsNumber('')).toBe('');
      expect(formatNhsNumber(null)).toBe('');
    });
  });

  describe('Zod Schemas', () => {
    it('optionalNhsNumberSchema should accept valid numbers, empty strings, and undefined', () => {
      expect(optionalNhsNumberSchema.safeParse('943 476 5919').success).toBe(
        true,
      );
      expect(optionalNhsNumberSchema.safeParse('').success).toBe(true);
      expect(optionalNhsNumberSchema.safeParse(undefined).success).toBe(true);
      expect(optionalNhsNumberSchema.safeParse('1234567890').success).toBe(
        false,
      );
    });

    it('requiredNhsNumberSchema should require non-empty valid numbers', () => {
      expect(requiredNhsNumberSchema.safeParse('943 476 5919').success).toBe(
        true,
      );
      expect(requiredNhsNumberSchema.safeParse('').success).toBe(false);
      expect(requiredNhsNumberSchema.safeParse(undefined).success).toBe(false);
      expect(requiredNhsNumberSchema.safeParse('1234567890').success).toBe(
        false,
      );
    });
  });
});
