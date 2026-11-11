import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@repo/db';
import { S3StorageService } from '../storage/s3.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class OrganizationDocumentsService {
  constructor(
    private readonly s3Service: S3StorageService,
    private readonly auditService: AuditService,
  ) {}

  private getBaseUrl(): string {
    return (
      process.env.API_URL ||
      `http://localhost:${process.env.BE_PORT || 4400}/api`
    );
  }

  async getDocuments(tenantId: string) {
    const docs = await prisma.tenantDocument.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const baseUrl = this.getBaseUrl();
    return docs.map((doc) => ({
      ...doc,
      documentUrl: `${baseUrl}/documents/stream?path=${encodeURIComponent(doc.fileUrl)}`,
    }));
  }

  async uploadDocument(
    tenantId: string,
    userId: string,
    file: Express.Multer.File,
    category?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const path = `tenant-${tenantId}/organization/documents`;
    const uploadResult = await this.s3Service.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      path,
    );

    const doc = await prisma.tenantDocument.create({
      data: {
        tenantId,
        name: file.originalname,
        fileUrl: uploadResult.fileUrl,
        fileType: file.mimetype,
        fileSize: file.size,
        category: category || 'Statutory',
        createdById: userId,
      },
    });

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'DOCUMENT_UPLOADED',
      entityType: 'TenantDocument',
      entityId: doc.id,
      tenantId,
      userId,
      newValue: {
        id: doc.id,
        name: doc.name,
        category: doc.category,
        fileUrl: doc.fileUrl,
      },
    });

    const baseUrl = this.getBaseUrl();
    return {
      ...doc,
      documentUrl: `${baseUrl}/documents/stream?path=${encodeURIComponent(doc.fileUrl)}`,
    };
  }

  async deleteDocument(tenantId: string, documentId: string, userId: string) {
    const doc = await prisma.tenantDocument.findFirst({
      where: {
        id: documentId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    await prisma.tenantDocument.update({
      where: { id: documentId },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
    });

    // Clean up file in S3
    void this.s3Service.deleteFile(doc.fileUrl);

    void this.auditService.emit({
      categoryType: 'SYSTEM',
      actionType: 'DELETE',
      entityType: 'TenantDocument',
      entityId: documentId,
      tenantId,
      userId,
      oldValue: {
        id: doc.id,
        name: doc.name,
        fileUrl: doc.fileUrl,
      },
    });

    return { success: true };
  }
}
