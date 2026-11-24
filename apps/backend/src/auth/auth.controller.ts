import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService, SafeUser } from './auth.service';
import { AuditService } from '../audit/audit.service';
import type { Request, Response } from 'express';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import {
  loginSchema,
  LoginDTO,
  ChangePasswordDTO,
  changePasswordSchema,
  forgotPasswordSchema,
  ForgotPasswordDTO,
  verifyOtpSchema,
  VerifyOtpDTO,
  resetPasswordWithTokenSchema,
  ResetPasswordWithTokenDTO,
  mfaVerifySchema,
  MfaVerifyDTO,
  disableMfaSchema,
  DisableMfaDTO,
  mfaResetVerifySchema,
  MfaResetVerifyDTO,
} from '@repo/schema';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import {
  JwtAuthGuard,
  LegacyJwtAuthGuard,
} from '../common/guards/jwt-auth.guard';
import {
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
  clearRefreshCookie,
  clearStaleDomainCookies,
  formatAuthUser,
  isSecureCookieRequest,
} from './auth-cookie.util';
import { assertSafeBrowserOrigin } from './auth-origin.util';
import { cognitoRequestSession } from './cognito/cognito-jwt.strategy';
import {
  ACCESS_TOKEN_MAX_AGE_MS,
  MFA_PENDING_ACCESS_TOKEN_MAX_AGE_MS,
} from './auth.constants';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
  ) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Login user and issue JWT + refresh token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body(new ZodValidationPipe(loginSchema)) loginDto: LoginDTO,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (
      process.env.COGNITO_AUTH_ENABLED === 'true' &&
      process.env.LEGACY_AUTH_ENABLED === 'false'
    ) {
      throw new ForbiddenException(
        'Password sign-in is disabled. Use Cognito Managed Login.',
      );
    }
    let user: SafeUser;
    try {
      user = await this.authService.validateUser(
        loginDto.email,
        loginDto.password,
      );
    } catch (err: unknown) {
      await this.auditService
        .emitAuth({
          actionType: 'FAILED_LOGIN',
          userEmail: loginDto.email,
          entityType: 'User',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] as string,
          metadata: {
            failureReason: (err as Error).message || 'Invalid credentials',
          },
        })
        .catch(() => {});
      throw err;
    }

    if (!user) {
      throw new UnauthorizedException();
    }
    const result = await this.authService.login(user);
    const secure = isSecureCookieRequest(req);
    clearStaleDomainCookies(res, req, secure);

    res.cookie(
      'access_token',
      result.access_token,
      ACCESS_COOKIE_OPTIONS(
        secure,
        result.mfaVerified
          ? ACCESS_TOKEN_MAX_AGE_MS
          : MFA_PENDING_ACCESS_TOKEN_MAX_AGE_MS,
      ),
    );
    if (result.refresh_token) {
      res.cookie(
        'refresh_token',
        result.refresh_token,
        REFRESH_COOKIE_OPTIONS(secure),
      );
    } else {
      clearRefreshCookie(res, req, secure);
    }

    if (user.tenantId) {
      await this.auditService
        .emitAuth({
          userId: user.id,
          tenantId: user.tenantId,
          userEmail: user.email,
          userFullName: user.fullName,
          userRoleName: user.role?.name,
          actionType: 'LOGIN',
          entityType: 'User',
          entityId: user.id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] as string,
        })
        .catch(() => {});
    }

    return {
      success: true,
      requiresMfa: result.requiresMfa,
      mfaSetupRequired: result.mfaSetupRequired,
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      user: formatAuthUser(user, result.mfaVerified),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('me')
  @ApiOperation({
    summary:
      'Get live profile, role, tenant, and permissions for current session',
  })
  async getMe(@Req() req: AuthenticatedRequest) {
    return this.authService.getMe(
      req.user,
      Boolean(cognitoRequestSession(req)),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('security-state')
  async getSecurityState(@Req() req: AuthenticatedRequest) {
    return this.authService.getSecurityState(req.user.userId);
  }

  @UseGuards(LegacyJwtAuthGuard)
  @Post('mfa/generate')
  async generateMfa(@Req() req: AuthenticatedRequest) {
    assertSafeBrowserOrigin(req);
    return this.authService.generateMfaSecret(req.user.userId);
  }

  @UseGuards(LegacyJwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('mfa/verify')
  async verifyMfa(
    @Body(new ZodValidationPipe(mfaVerifySchema)) dto: MfaVerifyDTO,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    assertSafeBrowserOrigin(req);
    const result = await this.authService.verifyMfaAndIssueTokens(
      req.user.userId,
      dto.token,
    );
    const secure = isSecureCookieRequest(req);
    clearStaleDomainCookies(res, req, secure);
    res.cookie(
      'access_token',
      result.access_token,
      ACCESS_COOKIE_OPTIONS(secure),
    );
    res.cookie(
      'refresh_token',
      result.refresh_token,
      REFRESH_COOKIE_OPTIONS(secure),
    );
    return {
      success: true,
      user: formatAuthUser(result.user, true),
    };
  }

  @UseGuards(LegacyJwtAuthGuard)
  @Post('mfa/disable')
  async disableMfa(
    @Body(new ZodValidationPipe(disableMfaSchema)) dto: DisableMfaDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    assertSafeBrowserOrigin(req);
    await this.authService.disableMfa(req.user.userId, dto.password);
    return { success: true };
  }

  @UseGuards(LegacyJwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('mfa/reset-request')
  async requestMfaReset(@Req() req: AuthenticatedRequest) {
    assertSafeBrowserOrigin(req);
    return this.authService.requestMfaReset(req.user.userId);
  }

  @UseGuards(LegacyJwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('mfa/reset-verify')
  async verifyMfaReset(
    @Body(new ZodValidationPipe(mfaResetVerifySchema)) dto: MfaResetVerifyDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    assertSafeBrowserOrigin(req);
    return this.authService.verifyMfaReset(req.user.userId, dto.code);
  }

  @UseGuards(LegacyJwtAuthGuard)
  @Post('resend-verification')
  async resendVerification(@Req() req: AuthenticatedRequest) {
    assertSafeBrowserOrigin(req);
    return this.authService.resendVerification(req.user.userId);
  }

  @UseGuards(LegacyJwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Body(new ZodValidationPipe(changePasswordSchema)) dto: ChangePasswordDTO,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    assertSafeBrowserOrigin(req);
    await this.authService.changePassword(
      req.user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
    return { success: true };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('forgot-password')
  async forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordSchema)) dto: ForgotPasswordDTO,
  ) {
    return this.authService.forgotPassword(dto.email);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('verify-otp')
  async verifyOtp(
    @Body(new ZodValidationPipe(verifyOtpSchema)) dto: VerifyOtpDTO,
  ) {
    return this.authService.verifyOtp(dto.email, dto.otp);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password-otp')
  async resetPasswordWithToken(
    @Body(new ZodValidationPipe(resetPasswordWithTokenSchema))
    dto: ResetPasswordWithTokenDTO,
  ) {
    return this.authService.resetPasswordWithToken(
      dto.resetToken,
      dto.newPassword,
      dto.email,
    );
  }
}
