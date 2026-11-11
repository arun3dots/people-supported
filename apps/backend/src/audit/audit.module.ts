import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditDbService } from './audit-db.service';
import { LocationHeaderMiddleware } from '../common/middleware/location-header.middleware';

@Module({
  imports: [],
  providers: [AuditService, AuditDbService],
  controllers: [AuditController],
  exports: [AuditService],
})
export class AuditModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Capture x-latitude / x-longitude headers for AUTH + DATA_ACCESS audit events.
    consumer.apply(LocationHeaderMiddleware).forRoutes('*');
  }
}
