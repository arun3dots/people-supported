import { Module } from '@nestjs/common';
import { DataRightsController } from './data-rights.controller';
import { DataRightsService } from './data-rights.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [DataRightsController],
  providers: [DataRightsService],
  exports: [DataRightsService],
})
export class DataRightsModule {}
