import {
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  AdminCreateUserCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminGetUserCommand,
  AdminResetUserPasswordCommand,
  CognitoIdentityProviderClient,
  type AttributeType,
} from '@aws-sdk/client-cognito-identity-provider';
import { devNull } from 'node:os';
import { randomBytes } from 'node:crypto';
import { CognitoConfig } from '../cognito-config';

const marker = 'custom:cantra_provision_id';
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const temporaryPassword = () => `${randomBytes(72).toString('base64url')}Aa1!`;
const errorName = (error: unknown) =>
  error instanceof Error ? error.name : undefined;

export interface ManagedDirectoryIdentity {
  id: string;
  email: string;
  subject: string | null;
  providerUsername: string | null;
}

@Injectable()
export class ManagedCognitoDirectory {
  private readonly enabled: boolean;
  private readonly mode: string | undefined;
  private readonly client?: CognitoIdentityProviderClient;

  constructor(private readonly config: CognitoConfig) {
    const flag = process.env.COGNITO_PROVISIONING_ENABLED;
    if (flag !== undefined && flag !== 'true' && flag !== 'false') {
      throw new Error('Invalid COGNITO_PROVISIONING_ENABLED.');
    }
    this.enabled = flag === 'true';
    if (!this.enabled) return;
    const settings = config.require();
    this.mode = process.env.COGNITO_PROVISIONING_USERNAME_MODE;
    if (
      !settings.managedUsersEnabled ||
      settings.region !== 'eu-north-1' ||
      !['email', 'alias'].includes(this.mode ?? '')
    ) {
      throw new Error(
        'Managed provisioning requires enabled managed sign-in, eu-north-1 and an explicit username mode.',
      );
    }
    if (process.env.NODE_ENV === 'production') this.assertRoleCredentials();
    this.client = new CognitoIdentityProviderClient({
      region: settings.region,
      maxAttempts: 1,
    });
  }

  requireSettings() {
    if (!this.enabled) throw new NotFoundException();
    return this.config.require();
  }

  async ensureIdentity(identity: ManagedDirectoryIdentity, fullName: string) {
    const username =
      this.mode === 'email' ? identity.email : `cantra-sl-${identity.id}`;
    const existing = await this.get(username);
    if (existing)
      return this.owned(identity, existing.Username, existing.UserAttributes);
    const poolId = this.requireSettings().poolId;
    try {
      const result = await this.client!.send(
        new AdminCreateUserCommand({
          UserPoolId: poolId,
          Username: username,
          MessageAction: 'SUPPRESS',
          ForceAliasCreation: false,
          DesiredDeliveryMediums: ['EMAIL'],
          TemporaryPassword: temporaryPassword(),
          UserAttributes: [
            { Name: 'email', Value: identity.email },
            { Name: 'email_verified', Value: 'true' },
            { Name: 'name', Value: fullName },
            { Name: marker, Value: identity.id },
          ],
        }),
        { abortSignal: AbortSignal.timeout(4500) },
      );
      return this.owned(
        identity,
        result.User?.Username,
        result.User?.Attributes,
      );
    } catch (error) {
      if (
        error instanceof ConflictException ||
        errorName(error) === 'AliasExistsException'
      ) {
        throw new ConflictException(
          'Cognito identity conflicts with this reservation.',
        );
      }
      if (errorName(error) === 'UsernameExistsException') {
        const recovered = await this.get(username);
        if (recovered)
          return this.owned(
            identity,
            recovered.Username,
            recovered.UserAttributes,
          );
      }
      throw new ServiceUnavailableException(
        'Cognito identity creation could not be confirmed.',
      );
    }
  }

  async operate(
    identity: ManagedDirectoryIdentity,
    operation: 'invite' | 'disable' | 'enable' | 'reset-password',
  ) {
    if (!identity.providerUsername || !identity.subject)
      throw new ConflictException('Cognito identity is not linked.');
    const remote = await this.get(identity.providerUsername);
    if (!remote)
      throw new ConflictException('Cognito identity is unavailable.');
    this.owned(identity, remote.Username, remote.UserAttributes);
    if (
      operation === 'invite' &&
      remote.UserStatus !== 'FORCE_CHANGE_PASSWORD'
    ) {
      throw new ConflictException(
        'Use password recovery for an account that has already completed its invitation.',
      );
    }
    const input = {
      UserPoolId: this.requireSettings().poolId,
      Username: identity.providerUsername,
    };
    const request = { abortSignal: AbortSignal.timeout(4500) };
    const client = this.client!;
    try {
      switch (operation) {
        case 'invite':
          await client.send(
            new AdminCreateUserCommand({
              ...input,
              MessageAction: 'RESEND',
              TemporaryPassword: temporaryPassword(),
              DesiredDeliveryMediums: ['EMAIL'],
              ForceAliasCreation: false,
            }),
            request,
          );
          break;
        case 'disable':
          await client.send(new AdminDisableUserCommand(input), request);
          break;
        case 'enable':
          await client.send(new AdminEnableUserCommand(input), request);
          break;
        case 'reset-password':
          await client.send(new AdminResetUserPasswordCommand(input), request);
          break;
      }
    } catch {
      throw new ServiceUnavailableException(
        'Cognito account operation could not be confirmed.',
      );
    }
  }

  private async get(username: string) {
    const poolId = this.requireSettings().poolId;
    try {
      return await this.client!.send(
        new AdminGetUserCommand({ UserPoolId: poolId, Username: username }),
        { abortSignal: AbortSignal.timeout(4500) },
      );
    } catch (error) {
      if (errorName(error) === 'UserNotFoundException') return null;
      throw new ServiceUnavailableException('Cognito identity lookup failed.');
    }
  }

  private owned(
    identity: ManagedDirectoryIdentity,
    username?: string,
    attributes?: AttributeType[],
  ) {
    const values = new Map(attributes?.map(({ Name, Value }) => [Name, Value]));
    const subject = values.get('sub');
    if (
      !username ||
      !subject ||
      !uuid.test(subject) ||
      values.get(marker) !== identity.id ||
      values.get('email') !== identity.email ||
      values.get('email_verified') !== 'true' ||
      (identity.subject && subject !== identity.subject) ||
      (identity.providerUsername && username !== identity.providerUsername)
    ) {
      throw new ConflictException(
        'Cognito identity conflicts with this reservation.',
      );
    }
    return { username, subject };
  }

  private assertRoleCredentials() {
    const conflicting = [
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_SESSION_TOKEN',
      'AWS_PROFILE',
      'AWS_DEFAULT_PROFILE',
      'AWS_ROLE_ARN',
      'AWS_WEB_IDENTITY_TOKEN_FILE',
      'AWS_CONTAINER_CREDENTIALS_RELATIVE_URI',
      'AWS_CONTAINER_CREDENTIALS_FULL_URI',
      'AWS_EC2_METADATA_SERVICE_ENDPOINT',
    ];
    if (
      conflicting.some((key) => Boolean(process.env[key])) ||
      process.env.AWS_CONFIG_FILE !== devNull ||
      process.env.AWS_SHARED_CREDENTIALS_FILE !== devNull ||
      process.env.AWS_EC2_METADATA_DISABLED === 'true'
    ) {
      throw new Error(
        'Cognito provisioning requires EC2 role credentials with shared AWS config files disabled.',
      );
    }
  }
}
