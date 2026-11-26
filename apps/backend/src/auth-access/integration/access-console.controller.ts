import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  accessMemberUpdateSchema,
  accessRoleCreateSchema,
  accessRoleUpdateSchema,
  accessSlugSchema,
  z,
  type AccessMemberUpdate,
  type AccessRoleCreate,
  type AccessRoleUpdate,
} from '@repo/schema';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CognitoConfig } from '../../auth/cognito/cognito-config';
import type { AuthenticatedRequest } from '../../common/interfaces/request.interface';
import { ZodValidationPipe } from '../../common/pipes/zod.pipe';
import { AccessClient } from './access-client';

@Controller('access-admin')
@UseGuards(JwtAuthGuard)
export class AccessConsoleController {
  constructor(
    private readonly access: AccessClient,
    private readonly cognito: CognitoConfig,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  console(@Req() request: AuthenticatedRequest) {
    return this.access.console(request.user);
  }

  @Post('roles')
  @Header('Cache-Control', 'no-store')
  createRole(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(accessRoleCreateSchema)) role: AccessRoleCreate,
  ) {
    this.requireConsoleOrigin(request);
    return this.access.createRole(request.user, role);
  }

  @Patch('roles/:key')
  @Header('Cache-Control', 'no-store')
  updateRole(
    @Req() request: AuthenticatedRequest,
    @Param('key', new ZodValidationPipe(accessSlugSchema)) key: string,
    @Body(new ZodValidationPipe(accessRoleUpdateSchema)) role: AccessRoleUpdate,
  ) {
    this.requireConsoleOrigin(request);
    return this.access.updateRole(request.user, key, role);
  }

  @Patch('members/:id')
  @Header('Cache-Control', 'no-store')
  updateMember(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ZodValidationPipe(z.string().uuid())) id: string,
    @Body(new ZodValidationPipe(accessMemberUpdateSchema))
    member: AccessMemberUpdate,
  ) {
    this.requireConsoleOrigin(request);
    return this.access.updateMembership(request.user, id, member);
  }

  private requireConsoleOrigin(request: AuthenticatedRequest) {
    const origin = this.cognito.settings?.apps.web.origin;
    if (
      !origin ||
      request.get('origin') !== origin ||
      !request.is('application/json')
    ) {
      throw new ForbiddenException('Invalid access console request origin.');
    }
  }
}
