import {
  Controller,
  Post,
  Patch,
  Body,
  Req,
  UseGuards,
  Param,
  Get,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  ForbiddenException,
  BadRequestException,
  Res,
  StreamableFile,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResidentsService } from '../residents/residents.service';
import {
  SaveDocumentSchema,
  SaveDocumentDTO,
  VerifyDocumentSchema,
  VerifyDocumentDTO,
} from '@repo/schema';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';
import { AuditService } from '../audit/audit.service';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(
    private readonly residentsService: ResidentsService,
    private readonly auditService: AuditService,
  ) {}

  private getTenantId(req: AuthenticatedRequest): string {
    if (!req.user.tenantId) {
      throw new ForbiddenException(
        'Tenant isolation failure - Tenant ID missing',
      );
    }
    return req.user.tenantId;
  }

  @Get('residents/:residentId')
  @Roles('Admin', 'Manager', 'Carer', 'Nurse')
  async getDocuments(
    @Param('residentId') residentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.residentsService.getResidentDocuments(
      residentId,
      this.getTenantId(req),
    );
  }

  @Get('residents/:residentId/upload-url')
  @Roles('Admin', 'Manager', 'Nurse')
  async getUploadUrl(
    @Param('residentId') residentId: string,
    @Req() req: AuthenticatedRequest,
    @Query('fileName') fileName: string,
    @Query('contentType') contentType: string,
  ) {
    return this.residentsService.getDocumentUploadUrl(
      residentId,
      fileName,
      contentType,
      this.getTenantId(req),
    );
  }

  @Post('residents/:residentId')
  @Roles('Admin', 'Manager', 'Nurse')
  async saveDocument(
    @Param('residentId') residentId: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(SaveDocumentSchema)) body: SaveDocumentDTO,
  ) {
    return this.residentsService.saveDocumentRecord(
      residentId,
      body,
      req.user.userId,
      this.getTenantId(req),
    );
  }

  @Post('residents/:residentId/upload')
  @Roles('Admin', 'Manager', 'Nurse')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('residentId') residentId: string,
    @Req() req: AuthenticatedRequest,
    @UploadedFile(
      new FileValidationPipe({ maxSizeMb: 10, allowedTypes: ['pdf', 'image'] }),
    )
    file: Express.Multer.File,
    @Body('category') category: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const tenantId = this.getTenantId(req);
    const path = `tenant-${tenantId}/resident-${residentId}`;

    const uploadResult = await this.residentsService.uploadDocumentFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      path,
    );

    return this.residentsService.saveDocumentRecord(
      residentId,
      {
        name: file.originalname,
        fileUrl: uploadResult.fileUrl,
        fileType: file.mimetype,
        fileSize: file.size,
        category: category || 'General',
      },
      req.user.userId,
      tenantId,
    );
  }

  @Delete(':id')
  @Roles('Admin', 'Manager', 'Nurse')
  async deleteDocument(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.residentsService.deleteDocument(
      id,
      req.user.userId,
      this.getTenantId(req),
    );
  }

  @Patch(':id/archive')
  @Roles('Admin', 'Manager')
  async archiveDocument(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId = this.getTenantId(req);
    const result = await this.residentsService.archiveDocument(
      id,
      req.user.userId,
      tenantId,
    );

    void this.auditService
      .emitClinicalDoc({
        userId: req.user.userId,
        tenantId,
        actionType: 'DOCUMENT_ARCHIVED',
        residentId: result.residentId,
        entityId: result.id,
        entityLabel: result.name,
        metadata: { category: result.category },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string,
      })
      .catch(() => {});

    return result;
  }

  @Patch(':id/verify')
  @Roles('Admin', 'Manager')
  async verifyDocument(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(VerifyDocumentSchema)) body: VerifyDocumentDTO,
  ) {
    const tenantId = this.getTenantId(req);
    const result = await this.residentsService.verifyDocument(
      id,
      req.user.userId,
      tenantId,
      body.status,
    );

    void this.auditService
      .emitClinicalDoc({
        userId: req.user.userId,
        tenantId,
        actionType: 'DOCUMENT_VERIFIED',
        residentId: result.residentId,
        entityId: result.id,
        entityLabel: result.name,
        metadata: { category: result.category },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string,
      })
      .catch(() => {});

    return result;
  }

  @Get(':id/view')
  @Roles('Admin', 'Manager', 'Nurse', 'Carer')
  async viewDocument(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tenantId = this.getTenantId(req);
    const document = await this.residentsService.getDocumentById(id, tenantId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const stream = this.residentsService.getDocumentStream(document.fileUrl);

    res.set({
      'Content-Type': document.fileType || 'application/pdf',
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
    });

    void this.auditService
      .emitDataAccess({
        userId: req.user.userId,
        tenantId,
        actionType: 'DOCUMENT_VIEWED',
        entityType: 'Document',
        entityId: id,
        entityLabel: document.name,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string,
      })
      .catch(() => {});

    return new StreamableFile(stream);
  }

  @Get(':id/download')
  @Roles('Admin', 'Manager', 'Nurse', 'Carer')
  async downloadDocument(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Query('preview') preview: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tenantId = this.getTenantId(req);
    const document = await this.residentsService.getDocumentById(id, tenantId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const stream = this.residentsService.getDocumentStream(document.fileUrl);

    res.set({
      'Content-Type': document.fileType,
      'Content-Disposition': `attachment; filename="${document.name}"`,
      'X-Content-Type-Options': 'nosniff',
    });

    void this.auditService
      .emitDataAccess({
        userId: req.user.userId,
        tenantId,
        actionType: 'DOCUMENT_DOWNLOADED',
        entityType: 'Document',
        entityId: id,
        entityLabel: document.name,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string,
      })
      .catch(() => {});

    return new StreamableFile(stream);
  }

  @Get('stream')
  @Roles('Admin', 'Manager', 'Nurse', 'Carer')
  async streamDocumentByPath(
    @Query('path') rawPath: string,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    if (!rawPath) {
      throw new BadRequestException('Path query parameter is required');
    }
    const tenantId = this.getTenantId(req);
    const cleanPath = decodeURIComponent(rawPath).replace(/^\/+/, '');

    // Strict tenant isolation: verify path starts with tenant identifier
    if (
      !cleanPath.startsWith(`tenant-${tenantId}/`) &&
      !cleanPath.startsWith(`tenants/${tenantId}/`)
    ) {
      throw new ForbiddenException('Access to this resource is forbidden');
    }

    const meta = await this.residentsService.getObjectMetadata(cleanPath);
    if (!meta.exists) {
      throw new NotFoundException('Document not found');
    }

    res.set({
      'Content-Type': meta.contentType || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, max-age=300',
    });

    void this.auditService
      .emitDataAccess({
        userId: req.user.userId,
        tenantId,
        actionType: 'DOCUMENT_VIEWED',
        entityType: 'Document',
        entityId: cleanPath,
        entityLabel: cleanPath,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string,
      })
      .catch(() => {});

    const stream = this.residentsService.getDocumentStream(cleanPath);
    return new StreamableFile(stream);
  }
}
