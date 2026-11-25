import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditModule } from '../../audit/audit.module';
import { CognitoConfigModule } from './cognito-config';
import { CognitoAuthorization } from './cognito-authorization.service';
import { CognitoJwtStrategy } from './cognito-jwt.strategy';
import { CognitoProvider } from './cognito-provider.service';
import { CognitoSessions } from './cognito-sessions.service';
import { CognitoController } from './cognito.controller';

@Module({
  imports: [CognitoConfigModule, JwtModule.register({}), AuditModule],
  controllers: [CognitoController],
  providers: [
    CognitoJwtStrategy,
    CognitoAuthorization,
    CognitoProvider,
    CognitoSessions,
  ],
  exports: [CognitoConfigModule, CognitoSessions],
})
export class CognitoModule {}
