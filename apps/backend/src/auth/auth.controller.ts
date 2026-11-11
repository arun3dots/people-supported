import {
  Controller,
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
  switchBranchSchema,
  SwitchBranchDTO,
  refreshTokenSchema,
  RefreshTokenDTO,
  mfaVerifySchema,
  MfaVerifyDTO,
  disableMfaSchema,
  DisableMfaDTO,
  mfaResetVerifySchema,
  MfaResetVerifyDTO,
} from '@repo/schema';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
  formatAuthUser,
} from './auth-cookie.util';

const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
  ) {}

  private get isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

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

    res.cookie(
      'access_token',
      result.access_token,
      ACCESS_COOKIE_OPTIONS(this.isProduction),
    );
    if (result.refresh_token) {
      res.cookie(
        'refresh_token',
        result.refresh_token,
        REFRESH_COOKIE_OPTIONS(this.isProduction),
      );
    } else {
      res.clearCookie('refresh_token', {
        path: '/api/auth',
        domain: COOKIE_DOMAIN,
      });
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

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token using refresh token cookie or body',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body(new ZodValidationPipe(refreshTokenSchema)) body?: RefreshTokenDTO,
  ) {
    const oldRefreshToken: string =
      (req.cookies?.refresh_token as string) || body?.refreshToken || '';
    if (!oldRefreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const accessToken: string | undefined = req.cookies?.access_token;
    const result = await this.authService.refreshAccessToken(
      oldRefreshToken,
      accessToken,
    );
    res.cookie(
      'access_token',
      result.access_token,
      ACCESS_COOKIE_OPTIONS(this.isProduction),
    );
    res.cookie(
      'refresh_token',
      result.refresh_token,
      REFRESH_COOKIE_OPTIONS(this.isProduction),
    );

    return {
      success: true,
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiOperation({ summary: 'Logout and revoke all refresh tokens' })
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (req.user.tenantId) {
      await this.auditService
        .emitAuth({
          userId: req.user.userId,
          tenantId: req.user.tenantId,
          userEmail: req.user.email,
          userFullName: req.user.fullName,
          userRoleName: req.user.roleName,
          actionType: 'LOGOUT',
          entityType: 'User',
          entityId: req.user.userId,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] as string,
        })
        .catch(() => {});
    }

    await this.authService.logout(req.user.userId);
    res.clearCookie('access_token', { path: '/', domain: COOKIE_DOMAIN });
    res.clearCookie('refresh_token', {
      path: '/api/auth',
      domain: COOKIE_DOMAIN,
    });

    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('me')
  @ApiOperation({
    summary:
      'Get live profile, role, tenant, and permissions for current session',
  })
  async getMe(@Req() req: AuthenticatedRequest) {
    return this.authService.getMe(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('security-state')
  async getSecurityState(@Req() req: AuthenticatedRequest) {
    return this.authService.getSecurityState(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/generate')
  async generateMfa(@Req() req: AuthenticatedRequest) {
    return this.authService.generateMfaSecret(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('mfa/verify')
  async verifyMfa(
    @Body(new ZodValidationPipe(mfaVerifySchema)) dto: MfaVerifyDTO,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyMfaAndIssueTokens(
      req.user.userId,
      dto.token,
    );
    res.cookie(
      'access_token',
      result.access_token,
      ACCESS_COOKIE_OPTIONS(this.isProduction),
    );
    res.cookie(
      'refresh_token',
      result.refresh_token,
      REFRESH_COOKIE_OPTIONS(this.isProduction),
    );
    return {
      success: true,
      user: formatAuthUser(result.user, true),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/disable')
  async disableMfa(
    @Body(new ZodValidationPipe(disableMfaSchema)) dto: DisableMfaDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.authService.disableMfa(req.user.userId, dto.password);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('mfa/reset-request')
  async requestMfaReset(@Req() req: AuthenticatedRequest) {
    return this.authService.requestMfaReset(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('mfa/reset-verify')
  async verifyMfaReset(
    @Body(new ZodValidationPipe(mfaResetVerifySchema)) dto: MfaResetVerifyDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.authService.verifyMfaReset(req.user.userId, dto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Post('switch-branch')
  async switchBranch(
    @Body(new ZodValidationPipe(switchBranchSchema)) dto: SwitchBranchDTO,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken: string = req.cookies?.refresh_token as string;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }
    const result = await this.authService.switchBranch(
      req.user.userId,
      refreshToken,
      dto.branchId,
    );
    res.cookie(
      'access_token',
      result.access_token,
      ACCESS_COOKIE_OPTIONS(this.isProduction),
    );
    return { success: true, activeBranchId: result.activeBranchId };
  }

  @UseGuards(JwtAuthGuard)
  @Post('resend-verification')
  async resendVerification(@Req() req: AuthenticatedRequest) {
    return this.authService.resendVerification(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Body(new ZodValidationPipe(changePasswordSchema)) dto: ChangePasswordDTO,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
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
