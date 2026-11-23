import { devNull } from 'node:os';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Resend } from 'resend';
import { MailService } from './mail.service';

const mockSesSend = jest.fn();
const mockResendSend = jest.fn();

jest.mock('@aws-sdk/client-ses', () => ({
  ...jest.requireActual('@aws-sdk/client-ses'),
  SESClient: jest.fn().mockImplementation(() => ({ send: mockSesSend })),
}));
jest.mock('resend', () => ({
  Resend: jest
    .fn()
    .mockImplementation(() => ({ emails: { send: mockResendSend } })),
}));

describe('MailService provider selection', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      AWS_REGION: 'eu-north-1',
      SES_FROM_EMAIL: 'security@cantra.care',
      SES_CONFIGURATION_SET: 'fixture-config',
      FRONTEND_URL: 'https://fixture.example.invalid',
      RESEND_API_KEY: 'fixture-resend-key',
    };
    mockSesSend.mockResolvedValue({});
    mockResendSend.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('sends password reset through SES with the role configuration and a Resend key present', async () => {
    process.env.MAIL_PROVIDER = 'ses';
    process.env.AWS_CREDENTIALS_MODE = 'instance-role';
    process.env.AWS_CONFIG_FILE = devNull;
    process.env.AWS_SHARED_CREDENTIALS_FILE = devNull;

    await new MailService().sendPasswordResetEmail(
      'person@example.invalid',
      'fixture-reset-token',
      'Test Staff',
    );

    expect(SESClient).toHaveBeenCalledWith({ region: 'eu-north-1' });
    expect(Resend).not.toHaveBeenCalled();
    const [command] = mockSesSend.mock.calls[0] as [SendEmailCommand];
    expect(command).toBeInstanceOf(SendEmailCommand);
    expect(command.input).toMatchObject({
      Source: 'Cantra Care Security <security@cantra.care>',
      Destination: { ToAddresses: ['person@example.invalid'] },
      ConfigurationSetName: 'fixture-config',
      Message: { Subject: { Data: 'Reset Your Password - Cantra Care' } },
    });
    expect(command.input.Message?.Body?.Html?.Data).toContain(
      'https://fixture.example.invalid/reset-password?token=fixture-reset-token',
    );
  });

  it('defaults to SES and preserves the existing static credential path', async () => {
    process.env.AWS_ACCESS_KEY_ID = 'fixture-access-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'fixture-secret-key';

    await new MailService().sendOtpEmail('person@example.invalid', '012345');

    expect(SESClient).toHaveBeenCalledWith({
      region: 'eu-north-1',
      credentials: {
        accessKeyId: 'fixture-access-key',
        secretAccessKey: 'fixture-secret-key',
      },
    });
    expect(mockSesSend).toHaveBeenCalledTimes(1);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it('selects Resend explicitly even when static AWS credentials exist', async () => {
    process.env.MAIL_PROVIDER = 'resend';
    process.env.RESEND_FROM_EMAIL = 'security@example.invalid';
    process.env.AWS_ACCESS_KEY_ID = 'fixture-access-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'fixture-secret-key';

    await new MailService().sendOtpEmail('person@example.invalid', '012345');

    expect(SESClient).not.toHaveBeenCalled();
    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Cantra Care Security <security@example.invalid>',
        to: ['person@example.invalid'],
      }),
    );
  });

  it('reports SES delivery failure through the selected provider', async () => {
    process.env.MAIL_PROVIDER = 'ses';
    mockSesSend.mockRejectedValueOnce(new Error('SES access denied'));

    await expect(
      new MailService().sendOtpEmail('person@example.invalid', '012345'),
    ).rejects.toThrow(/SES access denied/);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it('rejects an unknown provider or missing Resend key', () => {
    process.env.MAIL_PROVIDER = 'unknown';
    expect(() => new MailService()).toThrow(/MAIL_PROVIDER must be/);
    process.env.MAIL_PROVIDER = 'resend';
    delete process.env.RESEND_API_KEY;
    expect(() => new MailService()).toThrow(/RESEND_API_KEY/);
  });
});
