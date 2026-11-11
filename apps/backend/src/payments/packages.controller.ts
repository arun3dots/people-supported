import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  createPackageSchema,
  updatePackageSchema,
  type CreatePackageDTO,
  type UpdatePackageDTO,
} from '@repo/schema';
import { PackagesService } from './packages.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';

@Controller('super-admin/packages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SuperAdmin')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  findAll() {
    return this.packagesService.findAll();
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createPackageSchema)) dto: CreatePackageDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.packagesService.create(dto, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updatePackageSchema)) dto: UpdatePackageDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.packagesService.update(id, dto, req.user.userId);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.packagesService.deactivate(id, req.user.userId);
  }
}
