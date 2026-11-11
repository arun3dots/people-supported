import { Module, Global } from '@nestjs/common';
import { GcsService } from './gcs.service';
import { S3StorageService } from './s3.service';

@Global()
@Module({
  providers: [
    GcsService,
    S3StorageService,
    {
      provide: 'StorageService',
      useExisting: S3StorageService,
    },
  ],
  exports: [GcsService, S3StorageService, 'StorageService'],
})
export class StorageModule {}
