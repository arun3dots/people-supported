import { Module } from '@nestjs/common';
import { BodyMapController } from './body-map.controller';
import { BodyMapService } from './body-map.service';
import { BodyMapActionService } from './body-map-action.service';
import { BodyMapPhotoService } from './body-map-photo.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [BodyMapController],
  providers: [BodyMapService, BodyMapActionService, BodyMapPhotoService],
  exports: [BodyMapService, BodyMapActionService, BodyMapPhotoService],
})
export class BodyMapModule {}
