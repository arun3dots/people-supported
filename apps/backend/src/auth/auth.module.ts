import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MfaService } from './mfa.service';
import { PasswordService } from './password.service';
import { RefreshTokenService } from './refresh-token.service';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuditModule } from '../audit/audit.module';
import { MailModule } from '../common/mail/mail.module';
import { assertJwtSecretConfigured } from './jwt-secret.util';
import { ACCESS_TOKEN_TTL } from './auth.constants';
import {
  AuthSessionController,
  SessionLogoutGuard,
} from './auth-session.controller';
import { CognitoModule } from './cognito/cognito.module';

@Module({
  imports: [
    UsersModule,
    AuditModule,
    MailModule,
    PassportModule,
    CognitoModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: assertJwtSecretConfigured(),
        signOptions: { expiresIn: ACCESS_TOKEN_TTL },
      }),
    }),
  ],
  controllers: [AuthController, AuthSessionController],
  providers: [
    AuthService,
    MfaService,
    PasswordService,
    RefreshTokenService,
    JwtStrategy,
    SessionLogoutGuard,
  ],
  exports: [AuthService],
})
export class AuthModule {}
