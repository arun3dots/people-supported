import { Module } from '@nestjs/common';
import { McaDolsService } from './mca-dols.service';
import { McaDolsController } from './mca-dols.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [McaDolsController],
  providers: [McaDolsService],
  exports: [McaDolsService],
})
export class McaDolsModule {}
