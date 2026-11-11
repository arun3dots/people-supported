import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Require one or more permission strings on `module.action` form
 * (e.g. 'riskAssessments.write'). The user's role must have ALL listed
 * permissions resolved to `true` in their JWT payload.
 *
 * Use alongside JwtAuthGuard + PermissionsGuard:
 *   @UseGuards(JwtAuthGuard, PermissionsGuard)
 *   @Permissions('riskAssessments.write')
 */
export const Permissions = (
  ...permissions: string[]
): MethodDecorator & ClassDecorator =>
  SetMetadata(PERMISSIONS_KEY, permissions);
