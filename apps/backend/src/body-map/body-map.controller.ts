import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ForbiddenException,
  BadRequestException,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { BodyMapService } from './body-map.service';
import { BodyMapActionService } from './body-map-action.service';
import {
  CreateBodyMapAssessmentSchema,
  CreateBodyMapAssessmentDTO,
  ResolveBodyMapFindingSchema,
  ResolveBodyMapFindingDTO,
  CreateBodyMapFindingActionSchema,
  CreateBodyMapFindingActionDTO,
  UpdateBodyMapFindingActionSchema,
  UpdateBodyMapFindingActionDTO,
} from '@repo/schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class BodyMapController {
  constructor(
    private readonly bodyMapService: BodyMapService,
    private readonly actionService: BodyMapActionService,
  ) {}

  private getTenantId(req: AuthenticatedRequest): string {
    if (!req.user.tenantId) {
      throw new ForbiddenException(
        'Tenant isolation failure - Tenant ID missing',
      );
    }
    return req.user.tenantId;
  }

  // ─── Assessment CRUD ──────────────────────────────────────

  @Post('residents/:residentId/body-map/assessments')
  @Roles('Admin', 'Manager', 'Nurse', 'Carer')
  async createAssessment(
    @Param('residentId') residentId: string,
    @Body(new ZodValidationPipe(CreateBodyMapAssessmentSchema))
    dto: CreateBodyMapAssessmentDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bodyMapService.createAssessment(
      dto,
      residentId,
      this.getTenantId(req),
      req.user,
    );
  }

  @Get('residents/:residentId/body-map/assessments')
  @Roles('Admin', 'Manager', 'Nurse', 'Carer')
  async listAssessments(
    @Param('residentId') residentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bodyMapService.listAssessments(
      residentId,
      this.getTenantId(req),
    );
  }

  @Get('residents/:residentId/body-map/assessments/:id')
  @Roles('Admin', 'Manager', 'Nurse', 'Carer')
  async getAssessment(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bodyMapService.getAssessment(id, this.getTenantId(req));
  }

  // ─── Finding Actions ──────────────────────────────────────

  @Post('body-map-findings/:id/resolve')
  @Roles('Admin', 'Manager', 'Nurse')
  async resolveFinding(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ResolveBodyMapFindingSchema))
    dto: ResolveBodyMapFindingDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bodyMapService.resolveFinding(
      id,
      dto,
      this.getTenantId(req),
      req.user,
    );
  }

  // ─── Action Taken Tracking ────────────────────────────────

  @Post('body-map-findings/:id/actions')
  @Roles('Admin', 'Manager', 'Nurse', 'Carer')
  async createAction(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreateBodyMapFindingActionSchema))
    dto: CreateBodyMapFindingActionDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.actionService.createAction(
      id,
      dto,
      this.getTenantId(req),
      req.user,
    );
  }

  @Patch('body-map-findings/:id/actions/:actionId')
  @Roles('Admin', 'Manager', 'Nurse', 'Carer')
  async updateAction(
    @Param('id') id: string,
    @Param('actionId') actionId: string,
    @Body(new ZodValidationPipe(UpdateBodyMapFindingActionSchema))
    dto: UpdateBodyMapFindingActionDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.actionService.updateAction(
      id,
      actionId,
      dto,
      this.getTenantId(req),
    );
  }

  @Delete('body-map-findings/:id/actions/:actionId')
  @Roles('Admin', 'Manager', 'Nurse', 'Carer')
  async deleteAction(
    @Param('id') id: string,
    @Param('actionId') actionId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.actionService.deleteAction(id, actionId, this.getTenantId(req));
  }

  // ─── Photo Upload & Stream ────────────────────────────────

  @Post('body-map-findings/:id/photos')
  @Roles('Admin', 'Manager', 'Nurse', 'Carer')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile(
      new FileValidationPipe({ maxSizeMb: 5, allowedTypes: ['image'] }),
    )
    file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.bodyMapService.uploadPhoto(
      id,
      file,
      this.getTenantId(req),
      req.user.userId,
    );
  }

  @Get('body-map-photos/:id/stream')
  @Roles('Admin', 'Manager', 'Nurse', 'Carer')
  async streamPhoto(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { stream, contentType } = await this.bodyMapService.streamPhoto(
      id,
      this.getTenantId(req),
    );

    res.set({
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, max-age=300',
    });

    return new StreamableFile(stream);
  }
}
