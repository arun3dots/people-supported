import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  CreatePreAdmissionSchema,
  PreAdmissionManagerDecisionSchema,
  PreAdmissionPartKeyEnum,
  UpdatePreAdmissionMetaSchema,
  type CreatePreAdmissionDTO,
  type PreAdmissionManagerDecisionDTO,
  type PreAdmissionPartKey,
  type PreAdmissionRecordDTO,
  type UpdatePreAdmissionMetaDTO,
} from '@repo/schema';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod.pipe';
import type { AuthenticatedRequest } from '../../common/interfaces/request.interface';
import { requireBranchId } from '../../common/utils/scope.util';
import { ResidentPreAdmissionService } from './resident-pre-admission.service';

@Controller('residents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResidentPreAdmissionController {
  constructor(private readonly service: ResidentPreAdmissionService) {}

  @Post('pre-admission')
  @Roles('Admin', 'Manager')
  create(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(CreatePreAdmissionSchema))
    body: CreatePreAdmissionDTO,
  ): Promise<PreAdmissionRecordDTO> {
    return this.service.create(
      body,
      req.user,
      requireBranchId(req, body.branchId),
    );
  }

  @Get(':id/pre-admission')
  @Roles('Admin', 'Manager', 'Nurse')
  getCurrent(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<PreAdmissionRecordDTO> {
    return this.service.getCurrent(id, req.user);
  }

  @Get(':id/pre-admission/versions')
  @Roles('Admin', 'Manager', 'Nurse')
  listVersions(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.listVersions(id, req.user);
  }

  @Patch(':id/pre-admission/meta')
  @Roles('Admin', 'Manager')
  updateMeta(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(UpdatePreAdmissionMetaSchema))
    body: UpdatePreAdmissionMetaDTO,
  ): Promise<PreAdmissionRecordDTO> {
    return this.service.updateMeta(id, body, req.user);
  }

  // The body is validated against the schema of the requested part in the service.
  @Patch(':id/pre-admission/parts/:part')
  @Roles('Admin', 'Manager')
  savePart(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('part') part: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: unknown,
  ): Promise<PreAdmissionRecordDTO> {
    const parsedPart = PreAdmissionPartKeyEnum.safeParse(part);
    if (!parsedPart.success) {
      throw new BadRequestException(`Unknown pre-admission part: ${part}`);
    }
    return this.service.savePart(id, parsedPart.data, body, req.user);
  }

  @Post(':id/pre-admission/submit')
  @Roles('Admin', 'Manager')
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<PreAdmissionRecordDTO> {
    return this.service.submit(id, req.user);
  }

  @Post(':id/pre-admission/decision')
  @Roles('Admin', 'Manager')
  decide(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(PreAdmissionManagerDecisionSchema))
    body: PreAdmissionManagerDecisionDTO,
  ): Promise<PreAdmissionRecordDTO> {
    return this.service.decide(id, body, req.user);
  }
}
