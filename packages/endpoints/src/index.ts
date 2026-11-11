export * from "./facilities/endpoints";
export * from "./staff/endpoints";
export * from "./profile/endpoints";
export * from "./roles/endpoints";
export * from "./organization/endpoints";
export * from "./auth/endpoints";
export * from "./residents/endpoints";
export * from "./pre-admission/endpoints";
export * from "./care-journey/endpoints";
export * from "./observations/endpoints";
export * from "./care-plan/endpoints";
export * from "./dashboard/endpoints";
export * from "./audit/endpoints";
export * from "./shifts/endpoints";
export * from "./user/endpoints";
export * from "./risk/endpoints";
export * from "./notifications/endpoints";
export * from "./onboarding/endpoints";
export * from "./billing/endpoints";
export * from "./department/endpoints";
export * from "./finance/endpoints";
export * from "./enquiries/endpoints";
export * from "./incidents/endpoints";
export * from "./body-map/endpoints";
export * from "./mca-dols/endpoints";
export * from "./branches/endpoints";
export * from "./escalations/endpoints";
export * from "./reports/endpoints";
import facilityEndpoints from "./facilities/endpoints";
import staffEndpoints from "./staff/endpoints";
import profileEndpoints from "./profile/endpoints";
import rolesEndpoints from "./roles/endpoints";
import organizationEndpoints from "./organization/endpoints";
import authEndpoints from "./auth/endpoints";
import residentEndpoints from "./residents/endpoints";
import preAdmissionEndpoints from "./pre-admission/endpoints";
import careJourneyEndpoints from "./care-journey/endpoints";
import observationEndpoints from "./observations/endpoints";
import carePlanEndpoints from "./care-plan/endpoints";
import dashboardEndpoints from "./dashboard/endpoints";
import auditEndpoints from "./audit/endpoints";
import shiftEndpoints from "./shifts/endpoints";
import userEndpoints from "./user/endpoints";
import riskEndpoints from "./risk/endpoints";
import notificationEndpoints from "./notifications/endpoints";
import onboardingEndpoints from "./onboarding/endpoints";
import billingEndpoints from "./billing/endpoints";
import departmentEndpoints from "./department/endpoints";
import financeEndpoints from "./finance/endpoints";
import enquiryEndpoints from "./enquiries/endpoints";
import incidentEndpoints from "./incidents/endpoints";
import bodyMapEndpoints from "./body-map/endpoints";
import mcaDolsEndpoints from "./mca-dols/endpoints";
import branchEndpoints from "./branches/endpoints";
import escalationEndpoints from "./escalations/endpoints";
import reportEndpoints from "./reports/endpoints";
import { EndpointDetails } from "./types";

export const endpoints: EndpointDetails = {
  ...facilityEndpoints,
  ...staffEndpoints,
  ...profileEndpoints,
  ...rolesEndpoints,
  ...organizationEndpoints,
  ...authEndpoints,
  ...residentEndpoints,
  ...preAdmissionEndpoints,
  ...careJourneyEndpoints,
  ...observationEndpoints,
  ...carePlanEndpoints,
  ...dashboardEndpoints,
  ...auditEndpoints,
  ...shiftEndpoints,
  ...userEndpoints,
  ...riskEndpoints,
  ...notificationEndpoints,
  ...onboardingEndpoints,
  ...billingEndpoints,
  ...departmentEndpoints,
  ...financeEndpoints,
  ...enquiryEndpoints,
  ...incidentEndpoints,
  ...bodyMapEndpoints,
  ...mcaDolsEndpoints,
  ...branchEndpoints,
  ...escalationEndpoints,
  ...reportEndpoints,
};

export const endpointInfo = endpoints;
export type ApiName = keyof typeof endpoints;

export default endpoints;
