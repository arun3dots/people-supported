import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { publicOnboardingSchema, type PublicOnboardingDTO } from '@repo/schema';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';

@Controller('tenants')
export class TenantsPublicController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('verify')
  async verify(@Query('token') token: string) {
    return this.tenantsService.verifyTenant(token);
  }

  @Post('onboard')
  async onboard(
    @Body(new ZodValidationPipe(publicOnboardingSchema))
    dto: PublicOnboardingDTO,
  ) {
    return this.tenantsService.publicOnboard(dto);
  }
}
