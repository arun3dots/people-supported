import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsPublicController } from './tenants-public.controller';
import { OrganizationController } from './organization.controller';
import { TenantsService } from './tenants.service';
import { OrganizationDocumentsService } from './organization-documents.service';
import { TenantOffboardingService } from './tenant-offboarding.service';
import { TenantOffboardingController } from './tenant-offboarding.controller';
import { AuditModule } from '../audit/audit.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [AuditModule, PaymentsModule],
  controllers: [
    TenantsController,
    TenantsPublicController,
    OrganizationController,
    TenantOffboardingController,
  ],
  providers: [
    TenantsService,
    OrganizationDocumentsService,
    TenantOffboardingService,
  ],
  exports: [
    TenantsService,
    OrganizationDocumentsService,
    TenantOffboardingService,
  ],
})
export class TenantsModule {}
