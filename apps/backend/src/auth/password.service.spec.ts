import { BadRequestException } from '@nestjs/common';
import { assertPasswordNotCommon } from './password.service';

describe('Password Policy & NCSC Common Password Check (D-01 Compliance)', () => {
  it('rejects passwords on the NCSC common breached password deny-list', () => {
    expect(() => assertPasswordNotCommon('Password123!')).toThrow(
      BadRequestException,
    );
    expect(() => assertPasswordNotCommon('password123!')).toThrow(
      BadRequestException,
    );
    expect(() => assertPasswordNotCommon('Admin123456!')).toThrow(
      BadRequestException,
    );
    expect(() => assertPasswordNotCommon('CareHome2026!')).toThrow(
      BadRequestException,
    );
  });

  it('accepts unique, strong passphrases', () => {
    expect(() =>
      assertPasswordNotCommon('Sapphire-Sunset-492!Caring'),
    ).not.toThrow();
    expect(() =>
      assertPasswordNotCommon('Clinical#Safety#2026#UK'),
    ).not.toThrow();
  });
});
