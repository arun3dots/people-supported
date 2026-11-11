import { Module } from '@nestjs/common';
import { ResidentsService } from './residents.service';
import { ResidentsController } from './residents.controller';
import { MedicationsController } from '../medications/medications.controller';
import { ControlledDrugController } from '../medications/controlled-drug.controller';
import { ControlledDrugService } from '../medications/controlled-drug.service';
import { DocumentsController } from '../documents/documents.controller';
import { AuditModule } from '../audit/audit.module';
import { CarePlanModule } from '../care-plan/care-plan.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { ResidentAdmissionService } from './services/resident-admission.service';
import { ResidentProfileUpdateService } from './services/resident-profile-update.service';
import { ResidentQueryService } from './services/resident-query.service';
import { ResidentAnalyticsService } from './services/resident-analytics.service';
import { ResidentCareService } from './services/resident-care.service';
import { ResidentMedicationRoundsService } from './services/resident-medication-rounds.service';
import { ResidentMedicationPrescriptionsService } from './services/resident-medication-prescriptions.service';
import { ResidentMedicationAdminService } from './services/resident-medication-admin.service';
import { ResidentMedicationAmendService } from './services/resident-medication-amend.service';
import { ResidentDocumentService } from './services/resident-document.service';
import { ResidentLifecycleService } from './services/resident-lifecycle.service';
import { ResidentFoodFluidService } from './services/resident-food-fluid.service';
import { ResidentConsentService } from './services/resident-consent.service';
import { ResidentAccessService } from './services/resident-access.service';
import { ResidentTimelineService } from './services/resident-timeline.service';
import { ResidentFoodFluidController } from './resident-food-fluid.controller';
import { ResidentEmergencyController } from './resident-emergency.controller';
import { ResidentConsentController } from './resident-consent.controller';
import { ResidentBreakGlassController } from './resident-break-glass.controller';
import { ResidentEmergencyService } from './services/resident-emergency.service';
import { EmergencyHandoverPackService } from './services/emergency-handover-pack.service';
import { ResidentPreAdmissionController } from './pre-admission/resident-pre-admission.controller';
import { ResidentPreAdmissionService } from './pre-admission/resident-pre-admission.service';
import { CareJourneyController } from './care-journey/care-journey.controller';
import { ResidentAssessmentService } from './care-journey/resident-assessment.service';
import { NeedCarePlanService } from './care-journey/need-care-plan.service';
import { CareTaskDayService } from './care-journey/care-task-day.service';
import { CareTaskService } from './care-journey/care-task.service';

const RESIDENT_SERVICES = [
  ResidentAdmissionService,
  ResidentProfileUpdateService,
  ResidentQueryService,
  ResidentAnalyticsService,
  ResidentCareService,
  ResidentTimelineService,
  ResidentMedicationRoundsService,
  ResidentMedicationPrescriptionsService,
  ResidentMedicationAdminService,
  ResidentMedicationAmendService,
  ResidentDocumentService,
  ResidentLifecycleService,
  ResidentFoodFluidService,
  ResidentConsentService,
  ControlledDrugService,
  ResidentAccessService,
  ResidentEmergencyService,
  EmergencyHandoverPackService,
  ResidentPreAdmissionService,
  ResidentAssessmentService,
  NeedCarePlanService,
  CareTaskService,
  CareTaskDayService,
  ResidentsService,
];

@Module({
  imports: [AuditModule, CarePlanModule, NotificationsModule],
  controllers: [
    ResidentPreAdmissionController,
    CareJourneyController,
    ResidentsController,
    ResidentFoodFluidController,
    ResidentConsentController,
    ResidentBreakGlassController,
    ResidentEmergencyController,
    MedicationsController,
    ControlledDrugController,
    DocumentsController,
  ],
  providers: RESIDENT_SERVICES,
  exports: RESIDENT_SERVICES,
})
export class ResidentsModule {}
