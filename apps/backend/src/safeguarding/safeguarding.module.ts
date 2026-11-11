import { Module } from '@nestjs/common';
import { SafeguardingController } from './safeguarding.controller';
import { SafeguardingService } from './safeguarding.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [SafeguardingController],
  providers: [SafeguardingService],
  exports: [SafeguardingService],
})
export class SafeguardingModule {}
