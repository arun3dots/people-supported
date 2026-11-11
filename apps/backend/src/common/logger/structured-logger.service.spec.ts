import {
  redactPii,
  StructuredLoggerService,
} from './structured-logger.service';

describe('redactPii', () => {
  it('redacts sensitive object keys', () => {
    const input = {
      email: 'nurse@example.com',
      password: 'PlainPassword123!',
      passwordHash: '$2b$10$abcdefghijk',
      token: 'secret-token',
      mfaSecret: 'JBSWY3DPEHPK3PXP',
      nested: {
        apiKey: 'sk-1234567890',
        residentName: 'Jane Doe',
      },
    };

    const redacted = redactPii(input) as Record<string, unknown>;

    expect(redacted.email).toBe('nurse@example.com');
    expect(redacted.password).toBe('[REDACTED]');
    expect(redacted.passwordHash).toBe('[REDACTED]');
    expect(redacted.token).toBe('[REDACTED]');
    expect(redacted.mfaSecret).toBe('[REDACTED]');
    expect((redacted.nested as Record<string, unknown>).apiKey).toBe(
      '[REDACTED]',
    );
    expect((redacted.nested as Record<string, unknown>).residentName).toBe(
      'Jane Doe',
    );
  });

  it('redacts NHS and National Insurance numbers in strings', () => {
    const textWithNhs = 'Resident with NHS 987 654 3210 admitted today';
    const textWithNi = 'Staff national insurance number is QQ 12 34 56 A';

    expect(redactPii(textWithNhs)).toBe(
      'Resident with NHS [REDACTED_NHS] admitted today',
    );
    expect(redactPii(textWithNi)).toBe(
      'Staff national insurance number is [REDACTED_NI]',
    );
  });

  it('redacts JWT tokens in strings', () => {
    const jwt =
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozG4B_dummy_signature_value';
    expect(redactPii(jwt)).toBe('Bearer [REDACTED_JWT]');
  });
});

describe('StructuredLoggerService', () => {
  let logger: StructuredLoggerService;
  let stdoutSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new StructuredLoggerService();
    stdoutSpy = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
  });

  it('outputs structured JSON with PII redacted', () => {
    logger.log('User login failed', 'AuthService', {
      password: 'password123',
      nhsNumber: '1234567890',
    });

    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    const logged = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
    expect(logged.level).toBe('INFO');
    expect(logged.context).toBe('AuthService');
    expect(logged.meta.password).toBe('[REDACTED]');
    expect(logged.meta.nhsNumber).toBe('[REDACTED]');
  });
});
