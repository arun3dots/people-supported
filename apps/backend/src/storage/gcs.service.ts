import { Injectable } from '@nestjs/common';
import { S3StorageService } from './s3.service';

/**
 * GcsService alias wrapping S3StorageService for 100% backward compatibility
 * with all existing services and controllers without breaking any imports.
 */
@Injectable()
export class GcsService extends S3StorageService {}
