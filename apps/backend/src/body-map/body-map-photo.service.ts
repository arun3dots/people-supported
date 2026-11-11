import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { prisma } from '@repo/db';
import { S3StorageService } from '../storage/s3.service';

@Injectable()
export class BodyMapPhotoService {
  constructor(private readonly s3Service: S3StorageService) {}

  /**
   * Uploads a photo for a finding to S3 and creates a BodyMapPhoto record.
   */
  async uploadPhoto(
    findingId: string,
    file: Express.Multer.File,
    tenantId: string,
    userId: string,
  ) {
    const finding = await prisma.bodyMapFinding.findFirst({
      where: { id: findingId },
      include: {
        assessment: {
          select: { tenantId: true, residentId: true },
        },
      },
    });

    if (!finding) {
      throw new NotFoundException('Finding not found');
    }
    if (finding.assessment.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    const storagePath = `tenant-${tenantId}/resident-${finding.assessment.residentId}/body-map/${findingId}`;

    const uploadResult = await this.s3Service.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      storagePath,
    );

    const photo = await prisma.bodyMapPhoto.create({
      data: {
        findingId,
        gcsPath: uploadResult.fileUrl,
        fileType: file.mimetype,
        fileSize: file.size,
        createdById: userId,
      },
    });

    return photo;
  }

  /**
   * Streams a photo directly from S3, with strict tenant isolation check.
   */
  async streamPhoto(photoId: string, tenantId: string) {
    const photo = await prisma.bodyMapPhoto.findFirst({
      where: { id: photoId },
      include: {
        finding: {
          include: {
            assessment: {
              select: { tenantId: true },
            },
          },
        },
      },
    });

    if (!photo) throw new NotFoundException('Photo not found');
    if (photo.finding.assessment.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    const meta = await this.s3Service.getObjectMetadata(photo.gcsPath);
    if (!meta.exists)
      throw new NotFoundException('Photo file not found in storage');

    return {
      stream: this.s3Service.getFileStream(photo.gcsPath),
      contentType: meta.contentType || photo.fileType,
    };
  }
}
