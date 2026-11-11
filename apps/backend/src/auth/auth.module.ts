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

@Module({
  imports: [
    UsersModule,
    AuditModule,
    MailModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: assertJwtSecretConfigured(),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    MfaService,
    PasswordService,
    RefreshTokenService,
    JwtStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
