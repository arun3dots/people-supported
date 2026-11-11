import { Module } from '@nestjs/common';
import { FacilityController } from './facility.controller';
import { WingService } from './services/wing.service';
import { RoomService } from './services/room.service';
import { BedService } from './services/bed.service';
import { SchemeService } from './services/scheme.service';
import { PropertyService } from './services/property.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [FacilityController],
  providers: [
    WingService,
    RoomService,
    BedService,
    SchemeService,
    PropertyService,
  ],
  exports: [
    WingService,
    RoomService,
    BedService,
    SchemeService,
    PropertyService,
  ],
})
export class FacilityModule {}
