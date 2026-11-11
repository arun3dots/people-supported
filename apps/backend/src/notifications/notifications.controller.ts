import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NOTIFICATION_MATRIX } from './notification-matrix';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import {
  notificationListQuerySchema,
  type NotificationListQueryDTO,
  RegisterDeviceTokenSchema,
  type RegisterDeviceTokenDTO,
  PushSubscriptionSchema,
  type PushSubscriptionDTO,
  UpdateNotificationPreferencesSchema,
  type UpdateNotificationPreferencesDTO,
} from '@repo/schema';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** Returns the canonical 20-row Notification Matrix specification. */
  @Get('matrix')
  getNotificationMatrix() {
    return Object.values(NOTIFICATION_MATRIX);
  }

  @Post('device-token')
  async registerDeviceToken(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(RegisterDeviceTokenSchema))
    dto: RegisterDeviceTokenDTO,
  ) {
    return this.notificationsService.registerDeviceToken(
      req.user.userId,
      req.user.tenantId!,
      dto,
    );
  }

  /** Paginated feed of the caller's own notifications. Pass all=true to bypass. */
  @Get()
  async getNotifications(
    @Req() req: AuthenticatedRequest,
    @Query(new ZodValidationPipe(notificationListQuerySchema))
    query?: NotificationListQueryDTO,
  ) {
    return this.notificationsService.getNotifications(
      req.user.userId,
      req.user.activeBranchId,
      query,
    );
  }

  @Patch('read-all')
  async markAllAsRead(@Req() req: AuthenticatedRequest) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.notificationsService.markAsRead(id, req.user.userId);
  }

  @Post('subscribe')
  async subscribe(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(PushSubscriptionSchema))
    subscription: PushSubscriptionDTO,
  ) {
    const userAgent = req.headers['user-agent'];
    return this.notificationsService.upsertSubscription(
      req.user.userId,
      subscription,
      userAgent,
    );
  }

  @Get('preferences')
  async getPreferences(@Req() req: AuthenticatedRequest) {
    return this.notificationsService.getPreferences(req.user.userId);
  }

  @Patch('preferences')
  async updatePreferences(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(UpdateNotificationPreferencesSchema))
    data: UpdateNotificationPreferencesDTO,
  ) {
    return this.notificationsService.updatePreferences(req.user.userId, data);
  }
}
