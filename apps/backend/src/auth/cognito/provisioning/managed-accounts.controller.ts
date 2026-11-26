import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  createManagedAccountSchema,
  managedAccountActionSchema,
  managedAccountVerificationSchema,
  type CreateManagedAccountDTO,
  type ManagedAccountActionDTO,
  type ManagedAccountVerificationDTO,
} from '@repo/schema';
import type { Request } from 'express';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import type { AuthenticatedRequest } from '../../../common/interfaces/request.interface';
import { ZodValidationPipe } from '../../../common/pipes/zod.pipe';
import { getTenantId } from '../../../common/utils/scope.util';
import { ManagedAccountsService } from './managed-accounts.service';
import { ManagedCognitoDirectory } from './managed-cognito-directory';

function assertOrigin(
  req: Request,
  directory: ManagedCognitoDirectory,
  app: 'web' | 'superadmin',
) {
  const origin = directory.requireSettings().apps[app]?.origin;
  if (!origin || req.get('origin') !== origin)
    throw new ForbiddenException('Unexpected request origin.');
}

@Controller('managed-staff/accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin', 'Manager')
export class ManagedStaffAccountsController {
  constructor(
    private readonly accounts: ManagedAccountsService,
    private readonly directory: ManagedCognitoDirectory,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  list(@Req() req: AuthenticatedRequest) {
    return this.accounts.list(req.user, getTenantId(req));
  }

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  create(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createManagedAccountSchema))
    input: CreateManagedAccountDTO,
  ) {
    assertOrigin(req, this.directory, 'web');
    return this.accounts.create(req.user, getTenantId(req), input);
  }

  @Post(':userId/actions')
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  act(
    @Req() req: AuthenticatedRequest,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body(new ZodValidationPipe(managedAccountActionSchema))
    input: ManagedAccountActionDTO,
  ) {
    assertOrigin(req, this.directory, 'web');
    return this.accounts.act(req.user, getTenantId(req), userId, input.action);
  }
}

@Controller('super-admin/tenants/:tenantId/managed-users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SuperAdmin')
export class ManagedTenantUsersController {
  constructor(
    private readonly accounts: ManagedAccountsService,
    private readonly directory: ManagedCognitoDirectory,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  list(@Req() req: AuthenticatedRequest, @Param('tenantId') tenantId: string) {
    return this.accounts.list(req.user, tenantId);
  }

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  create(
    @Req() req: AuthenticatedRequest,
    @Param('tenantId') tenantId: string,
    @Body(new ZodValidationPipe(createManagedAccountSchema))
    input: CreateManagedAccountDTO,
  ) {
    assertOrigin(req, this.directory, 'superadmin');
    return this.accounts.create(req.user, tenantId, input);
  }

  @Post(':userId/actions')
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  act(
    @Req() req: AuthenticatedRequest,
    @Param('tenantId') tenantId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body(new ZodValidationPipe(managedAccountActionSchema))
    input: ManagedAccountActionDTO,
  ) {
    assertOrigin(req, this.directory, 'superadmin');
    return this.accounts.act(req.user, tenantId, userId, input.action);
  }
}

@Controller('auth/cognito/invitations')
export class ManagedInvitationController {
  constructor(
    private readonly accounts: ManagedAccountsService,
    private readonly directory: ManagedCognitoDirectory,
  ) {}

  @Post('verify')
  @Header('Cache-Control', 'no-store')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  verify(
    @Req() req: Request,
    @Body(new ZodValidationPipe(managedAccountVerificationSchema))
    input: ManagedAccountVerificationDTO,
  ) {
    assertOrigin(req, this.directory, 'web');
    return this.accounts.verify(input.token);
  }
}
