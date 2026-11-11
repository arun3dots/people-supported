import { Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';

export interface PasswordGeneratorOptions {
  length?: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
}

@Injectable()
export class PasswordGeneratorService {
  // Avoid visually ambiguous characters like O, 0, I, 1, l
  private static readonly UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  private static readonly LOWERCASE = 'abcdefghijkmnopqrstuvwxyz';
  private static readonly NUMBERS = '23456789';
  private static readonly SYMBOLS = '!@#$%^&*()_+-=[]{}';

  /**
   * Generates a cryptographically strong, unpredictable random password.
   * Guarantees at least one character from each requested character class.
   */
  generate(options: PasswordGeneratorOptions = {}): string {
    const {
      length = 12,
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true,
    } = options;

    if (length < 8) {
      throw new Error('Password length must be at least 8 characters');
    }

    const pools: string[] = [];
    const requiredChars: string[] = [];

    if (includeUppercase) {
      pools.push(PasswordGeneratorService.UPPERCASE);
      requiredChars.push(
        this.getRandomChar(PasswordGeneratorService.UPPERCASE),
      );
    }
    if (includeLowercase) {
      pools.push(PasswordGeneratorService.LOWERCASE);
      requiredChars.push(
        this.getRandomChar(PasswordGeneratorService.LOWERCASE),
      );
    }
    if (includeNumbers) {
      pools.push(PasswordGeneratorService.NUMBERS);
      requiredChars.push(this.getRandomChar(PasswordGeneratorService.NUMBERS));
    }
    if (includeSymbols) {
      pools.push(PasswordGeneratorService.SYMBOLS);
      requiredChars.push(this.getRandomChar(PasswordGeneratorService.SYMBOLS));
    }

    if (pools.length === 0) {
      throw new Error('At least one character class must be enabled');
    }

    const allChars = pools.join('');
    const remainingCount = length - requiredChars.length;
    const resultChars = [...requiredChars];

    for (let i = 0; i < remainingCount; i++) {
      resultChars.push(this.getRandomChar(allChars));
    }

    // Cryptographically secure Fisher-Yates shuffle
    for (let i = resultChars.length - 1; i > 0; i--) {
      const j = randomInt(0, i + 1);
      const temp = resultChars[i];
      resultChars[i] = resultChars[j]!;
      resultChars[j] = temp;
    }

    return resultChars.join('');
  }

  private getRandomChar(charset: string): string {
    const index = randomInt(0, charset.length);
    return charset[index];
  }
}
