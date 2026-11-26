import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditModule } from '../../audit/audit.module';
import { MailModule } from '../../common/mail/mail.module';
import { CognitoConfigModule } from './cognito-config';
import { CognitoAuthorization } from './cognito-authorization.service';
import { CognitoJwtStrategy } from './cognito-jwt.strategy';
import { CognitoProvider } from './cognito-provider.service';
import { CognitoSessions } from './cognito-sessions.service';
import { CognitoController } from './cognito.controller';
import {
  ManagedInvitationController,
  ManagedStaffAccountsController,
  ManagedTenantUsersController,
} from './provisioning/managed-accounts.controller';
import { ManagedAccountsService } from './provisioning/managed-accounts.service';
import { ManagedCognitoDirectory } from './provisioning/managed-cognito-directory';
import { AccessIntegrationModule } from '../../auth-access/integration/access-integration.module';

@Module({
  imports: [
    AccessIntegrationModule,
    CognitoConfigModule,
    JwtModule.register({}),
    AuditModule,
    MailModule,
  ],
  controllers: [
    CognitoController,
    ManagedInvitationController,
    ManagedStaffAccountsController,
    ManagedTenantUsersController,
  ],
  providers: [
    CognitoJwtStrategy,
    CognitoAuthorization,
    CognitoProvider,
    CognitoSessions,
    ManagedAccountsService,
    ManagedCognitoDirectory,
  ],
  exports: [CognitoConfigModule, CognitoSessions],
})
export class CognitoModule {}
