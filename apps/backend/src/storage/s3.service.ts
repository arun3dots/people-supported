import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { Readable, PassThrough } from 'stream';
import {
  getAwsClientConfig,
  getS3BucketName,
} from '../common/utils/aws-config.util';

@Injectable()
export class S3StorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.bucketName = getS3BucketName();

    if (!this.bucketName) {
      this.logger.warn(
        'S3_BUCKET_NAME is not set. S3 file upload/download operations will fail until configured.',
      );
    }

    this.s3Client = new S3Client(getAwsClientConfig());
  }

  /**
   * Normalizes an S3 key by stripping leading slashes, full URLs, and URI prefixes.
   */
  private cleanKey(key: string): string {
    if (!key) return '';
    let cleaned = key.trim();
    if (cleaned.startsWith('s3://')) {
      cleaned = cleaned.replace(/^s3:\/\/[^/]+\//, '');
    } else if (
      cleaned.startsWith('http://') ||
      cleaned.startsWith('https://')
    ) {
      try {
        const urlObj = new URL(cleaned);
        const parts = urlObj.pathname.split('/').filter(Boolean);
        if (parts.length > 0 && parts[0] === this.bucketName) {
          cleaned = parts.slice(1).join('/');
        } else {
          cleaned = parts.join('/');
        }
      } catch {
        // Keep cleaned as is
      }
    }
    return cleaned.replace(/^\/+/, '');
  }

  /**
   * Uploads an object directly to S3 under the given key.
   */
  async uploadObject(file: Buffer, fileName: string, contentType: string) {
    const key = this.cleanKey(fileName);
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file,
          ContentType: contentType,
        }),
      );
      return {
        fileUrl: key,
        fileName,
        s3FileName: key,
        gcsFileName: key,
      };
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string };
      const detail = err?.message || 'Unknown error';
      this.logger.error(
        `Failed to upload object to S3 (${key}): ${detail}`,
        err?.stack,
      );
      throw new InternalServerErrorException(
        `Failed to upload file to S3: ${detail}`,
      );
    }
  }

  /**
   * Uploads a file with a UUID-prefixed key under the given path prefix in S3.
   */
  async uploadFile(
    file: Buffer,
    fileName: string,
    contentType: string,
    pathPrefix: string,
  ) {
    const prefix = this.cleanKey(pathPrefix);
    const s3FileName = prefix
      ? `${prefix}/${randomUUID()}-${fileName}`
      : `${randomUUID()}-${fileName}`;
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: s3FileName,
          Body: file,
          ContentType: contentType,
        }),
      );

      return {
        fileUrl: s3FileName,
        fileName,
        s3FileName,
        gcsFileName: s3FileName,
      };
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string };
      const detail = err?.message || 'Unknown error';
      this.logger.error(
        `Failed to upload file to S3 (${s3FileName}): ${detail}`,
        err?.stack,
      );
      throw new InternalServerErrorException(
        `Failed to upload file to S3: ${detail}`,
      );
    }
  }

  /**
   * Streams a file directly from the private S3 bucket.
   */
  getFileStream(s3FileName: string): Readable {
    const cleanKey = this.cleanKey(s3FileName);
    const passThrough = new PassThrough();

    void (async () => {
      try {
        const response = await this.s3Client.send(
          new GetObjectCommand({
            Bucket: this.bucketName,
            Key: cleanKey,
          }),
        );

        if (response.Body instanceof Readable) {
          response.Body.pipe(passThrough);
        } else if (response.Body) {
          const bodyBytes = await response.Body.transformToByteArray();
          Readable.from(Buffer.from(bodyBytes)).pipe(passThrough);
        } else {
          passThrough.destroy(
            new Error(`Empty body returned for S3 object: ${cleanKey}`),
          );
        }
      } catch (err: unknown) {
        passThrough.destroy(err as Error);
      }
    })();

    return passThrough;
  }

  /**
   * Checks existence and metadata of an object in S3.
   */
  async getObjectMetadata(
    s3FileName: string,
  ): Promise<{ exists: boolean; contentType?: string }> {
    const cleanKey = this.cleanKey(s3FileName);
    try {
      const response = await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: cleanKey,
        }),
      );
      return { exists: true, contentType: response.ContentType };
    } catch (error: unknown) {
      const err = error as { name?: string };
      if (err?.name === 'NotFound' || err?.name === 'NoSuchKey') {
        return { exists: false };
      }
      this.logger.warn(`S3 getObjectMetadata error for ${cleanKey}:`, error);
      return { exists: false };
    }
  }

  /**
   * Deletes a file from the S3 bucket.
   */
  async deleteFile(s3FileName: string) {
    const cleanKey = this.cleanKey(s3FileName);
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: cleanKey,
        }),
      );
    } catch (error) {
      this.logger.error(`Failed to delete S3 file: ${cleanKey}`, error);
    }
  }

  /**
   * Generates a signed write URL for direct client upload if needed.
   */
  async getUploadSignedUrl(
    fileName: string,
    contentType: string,
    pathPrefix: string,
  ) {
    const prefix = this.cleanKey(pathPrefix);
    const s3FileName = prefix
      ? `${prefix}/${randomUUID()}-${fileName}`
      : `${randomUUID()}-${fileName}`;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3FileName,
      ContentType: contentType,
    });
    const url = await getSignedUrl(this.s3Client, command, { expiresIn: 900 });

    return {
      url,
      fileUrl: s3FileName,
      s3FileName,
      gcsFileName: s3FileName,
    };
  }

  /**
   * Generates a signed read URL for temporary direct client access.
   */
  async getDownloadSignedUrl(s3FileName: string) {
    const cleanKey = this.cleanKey(s3FileName);

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: cleanKey,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }
}
