import { assertJwtSecretConfigured } from './jwt-secret.util';
import { assertEncryptionKeyConfigured } from '@repo/db';

describe('Cryptographic Secret Startup Assertions (D-04 & E-02)', () => {
  describe('D-04: assertJwtSecretConfigured', () => {
    it('throws when JWT_SECRET is missing, "secretKey", or shorter than 32 chars in production', () => {
      expect(() => assertJwtSecretConfigured('', 'production')).toThrow(
        /FATAL \[D-04\]/,
      );
      expect(() =>
        assertJwtSecretConfigured('secretKey', 'production'),
      ).toThrow(/FATAL \[D-04\]/);
      expect(() =>
        assertJwtSecretConfigured('short-secret-12345', 'production'),
      ).toThrow(/FATAL \[D-04\]/);
    });

    it('returns the secret when it is >= 32 characters and not a default placeholder', () => {
      const strong = 'super-strong-jwt-secret-with-at-least-32-chars!';
      expect(assertJwtSecretConfigured(strong, 'production')).toBe(strong);
    });
  });

  describe('E-02: assertEncryptionKeyConfigured', () => {
    it('throws when ENCRYPTION_KEY is missing or not 64 hex chars', () => {
      expect(() =>
        assertEncryptionKeyConfigured('invalid-short-key', 'production'),
      ).toThrow(/FATAL \[E-02\]/);
    });

    it('succeeds when ENCRYPTION_KEY is a valid 64-character hex string', () => {
      const validKey =
        '9c4e1b7a2d8f6e3c5a0b9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a';
      expect(() =>
        assertEncryptionKeyConfigured(validKey, 'production'),
      ).not.toThrow();
    });
  });
});
