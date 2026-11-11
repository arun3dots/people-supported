import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma, Resident } from '@repo/db';
import { SaveDocumentDTO } from '@repo/schema';
import { S3StorageService } from '../../storage/s3.service';

@Injectable()
export class ResidentDocumentService {
  constructor(private readonly s3Service: S3StorageService) {}

  async getResidentDocuments(residentId: string, tenantId: string) {
    const documents = await prisma.document.findMany({
      where: {
        residentId,
        tenantId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const baseUrl =
      process.env.API_URL ||
      `http://localhost:${process.env.BE_PORT || 4400}/api`;

    return documents.map((doc) => ({
      ...doc,
      downloadUrl: `${baseUrl}/documents/${doc.id}/download`,
    }));
  }

  async getDocumentById(id: string, tenantId: string) {
    return prisma.document.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  getDocumentStream(s3FileName: string) {
    return this.s3Service.getFileStream(s3FileName);
  }

  async getDocumentUploadUrl(
    residentId: string,
    fileName: string,
    contentType: string,
    tenantId: string,
  ) {
    const path = `tenant-${tenantId}/resident-${residentId}`;
    return this.s3Service.getUploadSignedUrl(fileName, contentType, path);
  }

  async uploadDocumentFile(
    file: Buffer,
    fileName: string,
    contentType: string,
    path: string,
  ) {
    return this.s3Service.uploadFile(file, fileName, contentType, path);
  }

  async saveDocumentRecord(
    residentId: string,
    data: SaveDocumentDTO,
    creatorId: string,
    tenantId: string,
  ) {
    return prisma.document.create({
      data: {
        name: data.name,
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        fileSize: data.fileSize,
        category: data.category || 'General',
        residentId,
        tenantId,
        createdById: creatorId,
        updatedById: creatorId,
      },
    });
  }

  async getObjectMetadata(s3FileName: string) {
    return this.s3Service.getObjectMetadata(s3FileName);
  }

  async archiveDocument(
    documentId: string,
    archiverId: string,
    tenantId: string,
  ) {
    const document = await prisma.document.findFirst({
      where: { id: documentId, tenantId, deletedAt: null },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'Archived',
        updatedById: archiverId,
      },
    });
  }

  async restoreDocument(
    documentId: string,
    restorerId: string,
    tenantId: string,
  ) {
    const document = await prisma.document.findFirst({
      where: { id: documentId, tenantId, deletedAt: null },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'Uploaded',
        updatedById: restorerId,
      },
    });
  }

  async deleteDocument(
    documentId: string,
    deleterId: string,
    tenantId: string,
  ) {
    return this.archiveDocument(documentId, deleterId, tenantId);
  }

  async verifyDocument(
    documentId: string,
    verifierId: string,
    tenantId: string,
    status: string = 'Verified',
  ) {
    const document = await prisma.document.findFirst({
      where: { id: documentId, tenantId, deletedAt: null },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return prisma.document.update({
      where: { id: documentId },
      data: {
        status,
        updatedById: verifierId,
      },
    });
  }

  private getResidentPhotoKey(tenantId: string, residentId: string): string {
    return `tenant-${tenantId}/resident-${residentId}/profile/photo`;
  }

  async uploadResidentPhoto(
    residentId: string,
    file: Buffer,
    fileName: string,
    contentType: string,
    tenantId: string,
    updaterId: string,
  ): Promise<Resident> {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    const photoKey = this.getResidentPhotoKey(tenantId, residentId);
    await this.s3Service.uploadObject(file, photoKey, contentType);

    const baseUrl =
      process.env.API_URL ||
      `http://localhost:${process.env.BE_PORT || 4400}/api`;
    const photoUrl = `${baseUrl}/residents/${residentId}/photo?v=${Date.now()}`;

    const updatedResident = await prisma.resident.update({
      where: { id: residentId },
      data: {
        photoUrl,
        updatedById: updaterId,
      },
    });

    await prisma.careTimeline.create({
      data: {
        residentId,
        eventType: 'PROFILE_PHOTO_UPDATED',
        summary: 'Resident profile photo has been updated',
        carerId: updaterId,
        createdById: updaterId,
        updatedById: updaterId,
      },
    });

    return updatedResident as Resident;
  }

  async getResidentPhoto(residentId: string, tenantId: string) {
    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId },
      select: { photoUrl: true },
    });

    if (!resident?.photoUrl) {
      throw new NotFoundException('Resident photo not found');
    }

    const photoKey = this.getResidentPhotoKey(tenantId, residentId);
    const meta = await this.s3Service.getObjectMetadata(photoKey);
    if (!meta.exists) {
      throw new NotFoundException('Resident photo not found');
    }

    return {
      stream: this.s3Service.getFileStream(photoKey),
      contentType: meta.contentType || 'application/octet-stream',
    };
  }
}
