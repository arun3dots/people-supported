import { ConflictException, ServiceUnavailableException } from '@nestjs/common';
import {
  AdminCreateUserCommand,
  AdminGetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import type { CognitoConfig } from '../cognito-config';
import { ManagedCognitoDirectory } from './managed-cognito-directory';

const mockSend = jest.fn();
jest.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  ...jest.requireActual('@aws-sdk/client-cognito-identity-provider'),
  CognitoIdentityProviderClient: jest
    .fn()
    .mockImplementation(() => ({ send: mockSend })),
}));

describe('Managed Cognito directory', () => {
  const originalEnv = process.env;
  const fixture = {
    id: 'local-reservation',
    email: 'person@example.invalid',
    subject: null,
    providerUsername: null,
  };
  const subject = 'ae501e71-60c8-455b-8a79-a61f2064f13f';
  const attributes = [
    { Name: 'sub', Value: subject },
    { Name: 'email', Value: fixture.email },
    { Name: 'email_verified', Value: 'true' },
    { Name: 'custom:cantra_provision_id', Value: fixture.id },
  ];
  const config = {
    require: () => ({
      poolId: 'eu-north-1_Fixture',
      region: 'eu-north-1',
      managedUsersEnabled: true,
    }),
  } as unknown as CognitoConfig;
  const awsError = (name: string) =>
    Object.assign(new Error('fixture-only private error details'), { name });

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      COGNITO_PROVISIONING_ENABLED: 'true',
      COGNITO_PROVISIONING_USERNAME_MODE: 'alias',
    };
    mockSend.mockReset();
  });
  afterEach(() => {
    process.env = originalEnv;
  });

  it('creates a suppressed account with an immutable marker and without alias takeover', async () => {
    mockSend
      .mockRejectedValueOnce(awsError('UserNotFoundException'))
      .mockResolvedValueOnce({
        User: { Username: 'aws-name', Attributes: attributes },
      });
    const directory = new ManagedCognitoDirectory(config);
    await expect(
      directory.ensureIdentity(fixture, 'Fixture Name'),
    ).resolves.toEqual({ subject, username: 'aws-name' });
    const [command] = mockSend.mock.calls[1] as [AdminCreateUserCommand];
    expect(command).toBeInstanceOf(AdminCreateUserCommand);
    expect(command.input).toMatchObject({
      UserPoolId: 'eu-north-1_Fixture',
      Username: `cantra-sl-${fixture.id}`,
      MessageAction: 'SUPPRESS',
      ForceAliasCreation: false,
      TemporaryPassword: expect.any(String),
      UserAttributes: expect.arrayContaining([
        { Name: 'custom:cantra_provision_id', Value: fixture.id },
      ]),
    });
  });

  it('refuses to adopt an existing account with only an email match', async () => {
    mockSend.mockResolvedValueOnce({
      Username: 'aws-name',
      UserAttributes: attributes.slice(0, 3),
    });
    await expect(
      new ManagedCognitoDirectory(config).ensureIdentity(
        fixture,
        'Fixture Name',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend.mock.calls[0][0]).toBeInstanceOf(AdminGetUserCommand);
  });

  it('recovers the same marked account after an ambiguous duplicate create', async () => {
    mockSend
      .mockRejectedValueOnce(awsError('UserNotFoundException'))
      .mockRejectedValueOnce(awsError('UsernameExistsException'))
      .mockResolvedValueOnce({
        Username: 'aws-name',
        UserAttributes: attributes,
      });
    await expect(
      new ManagedCognitoDirectory(config).ensureIdentity(
        fixture,
        'Fixture Name',
      ),
    ).resolves.toEqual({ subject, username: 'aws-name' });
    expect(mockSend).toHaveBeenCalledTimes(3);
  });

  it('fails closed without returning provider IAM error details', async () => {
    mockSend.mockRejectedValueOnce(awsError('AccessDeniedException'));
    const result = new ManagedCognitoDirectory(config).ensureIdentity(
      fixture,
      'Fixture Name',
    );
    await expect(result).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(result).rejects.toThrow('Cognito identity lookup failed.');
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('refuses account operations when the linked subject has changed', async () => {
    mockSend.mockResolvedValueOnce({
      Username: 'aws-name',
      UserAttributes: attributes,
    });
    await expect(
      new ManagedCognitoDirectory(config).operate(
        {
          ...fixture,
          providerUsername: 'aws-name',
          subject: 'cd196d50-e8ea-4654-9217-e7b9cf7c60dc',
        },
        'reset-password',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });
});
