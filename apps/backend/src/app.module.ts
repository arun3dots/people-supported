import { Module } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { MailModule } from './common/mail/mail.module';
import { StaffModule } from './staff/staff.module';
import { ProfileModule } from './profile/profile.module';
import { FacilityModule } from './facility/facility.module';
import { BranchesModule } from './branches/branches.module';
import { RolesModule } from './roles/roles.module';
import { ResidentsModule } from './residents/residents.module';
import { ObservationsModule } from './observations/observations.module';
import { CarePlanModule } from './care-plan/care-plan.module';
import { StorageModule } from './storage/storage.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuditModule } from './audit/audit.module';
import { ShiftsModule } from './shifts/shifts.module';
import { RiskModule } from './risk/risk.module';
import { NotificationsModule } from './notifications/notifications.module';
import { JobsModule } from './jobs/jobs.module';
import { PaymentsModule } from './payments/payments.module';
import { FinanceModule } from './finance/finance.module';
import { DepartmentModule } from './department/department.module';
import { EnquiriesModule } from './enquiries/enquiries.module';
import { IncidentsModule } from './incidents/incidents.module';
import { BodyMapModule } from './body-map/body-map.module';
import { McaDolsModule } from './mca-dols/mca-dols.module';
import { EscalationsModule } from './escalations/escalations.module';
import { DataRightsModule } from './data-rights/data-rights.module';
import { SafeguardingModule } from './safeguarding/safeguarding.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { CqcModule } from './cqc/cqc.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    // E-05, D-01, D-05: Global rate limiting (60 req / 60s per IP default)
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),
    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    TenantsModule,
    MailModule,
    StaffModule,
    ProfileModule,
    FacilityModule,
    BranchesModule,
    RolesModule,
    ResidentsModule,
    ObservationsModule,
    CarePlanModule,
    StorageModule,
    DashboardModule,
    AuditModule,
    ShiftsModule,
    RiskModule,
    NotificationsModule,
    JobsModule,
    PaymentsModule,
    FinanceModule,
    DepartmentModule,
    EnquiriesModule,
    IncidentsModule,
    BodyMapModule,
    McaDolsModule,
    EscalationsModule,
    DataRightsModule,
    SafeguardingModule,
    ComplaintsModule,
    CqcModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    Reflector,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
