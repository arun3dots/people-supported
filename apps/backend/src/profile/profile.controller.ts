import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  ForbiddenException,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UpdateProfileDTO, updateProfileSchema } from '@repo/schema';
import { ProfileService, MyProfile } from './profile.service';
import { ComplianceService } from '../staff/compliance.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../common/interfaces/request.interface';
import { ActorContext } from '../common/interfaces/actor.interface';

/**
 * Self-service profile for the logged-in user. Resolves everything from the JWT
 * (`req.user.userId` / `tenantId`) so a user can only ever see and edit their
 * own record — guarded by `JwtAuthGuard` alone (any authenticated role), with no
 * RolesGuard. Compliance is exposed read-only here; writes stay on `/staff/*`
 * behind the Admin role.
 */
@ApiTags('Profile')
@ApiBearerAuth()
@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly complianceService: ComplianceService,
  ) {}

  private getTenantId(req: AuthenticatedRequest): string {
    if (!req.user.tenantId) {
      throw new ForbiddenException('Tenant context required.');
    }
    return req.user.tenantId;
  }

  private actor(req: AuthenticatedRequest): ActorContext {
    const u: AuthenticatedUser = req.user;
    return {
      tenantId: this.getTenantId(req),
      userId: u.userId,
      userEmail: u.email,
      userFullName: u.fullName ?? '',
      roleName: u.roleName,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    };
  }

  @Get()
  @ApiOperation({ summary: "Get the current user's own profile" })
  @ApiResponse({ status: 200, description: 'Profile details' })
  async getMyProfile(@Req() req: AuthenticatedRequest): Promise<MyProfile> {
    return this.profileService.getMyProfile(
      req.user.userId,
      this.getTenantId(req),
    );
  }

  @Patch()
  @ApiOperation({ summary: "Update the current user's own contact details" })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateMyProfile(
    @Body(new ZodValidationPipe(updateProfileSchema)) dto: UpdateProfileDTO,
    @Req() req: AuthenticatedRequest,
  ): Promise<MyProfile> {
    return this.profileService.updateMyContact(
      req.user.userId,
      this.getTenantId(req),
      dto,
      this.actor(req),
    );
  }

  @Post('photo')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Upload own profile photo to S3 and update DB' })
  @ApiResponse({ status: 201, description: 'Photo uploaded successfully' })
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ photoUrl: string }> {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed types: JPG, PNG, WEBP',
      );
    }
    return this.profileService.uploadPhoto(
      req.user.userId,
      this.getTenantId(req),
      file.buffer,
      file.originalname,
      file.mimetype,
    );
  }

  @Get('photo')
  @ApiOperation({ summary: 'Get own profile photo stream' })
  async getPhoto(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    const { stream, contentType } = await this.profileService.getPhoto(
      req.user.userId,
      this.getTenantId(req),
    );
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    stream.pipe(res);
  }

  @Get('compliance')
  @ApiOperation({
    summary: "Get the current user's own compliance records (read-only)",
  })
  @ApiResponse({ status: 200, description: 'Full compliance data' })
  async getMyCompliance(@Req() req: AuthenticatedRequest) {
    // tenant scope is enforced on the profile read; compliance is keyed by the
    // same userId from the JWT, so a user only ever sees their own records.
    this.getTenantId(req);
    return this.complianceService.getFullCompliance(req.user.userId);
  }
}
