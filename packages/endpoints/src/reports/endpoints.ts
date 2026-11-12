export const EXPORT_INCIDENTS_REPORT = "EXPORT_INCIDENTS_REPORT";
export const EXPORT_RESIDENTS_REPORT = "EXPORT_RESIDENTS_REPORT";
export const EXPORT_ESCALATIONS_REPORT = "EXPORT_ESCALATIONS_REPORT";
export const EXPORT_OCCUPANCY_REPORT = "EXPORT_OCCUPANCY_REPORT";
export const EXPORT_MEDICATIONS_REPORT = "EXPORT_MEDICATIONS_REPORT";
export const EXPORT_CARE_PLANS_REPORT = "EXPORT_CARE_PLANS_REPORT";
export const EXPORT_SHIFTS_REPORT = "EXPORT_SHIFTS_REPORT";
export const EXPORT_CQC_COMPLIANCE_REPORT = "EXPORT_CQC_COMPLIANCE_REPORT";
export const EXPORT_INVOICES_REPORT = "EXPORT_INVOICES_REPORT";

import { EndpointDetails } from "../types";

const reportsEndpoints: EndpointDetails = {
  [EXPORT_INCIDENTS_REPORT]: {
    endpoint: "/reports/incidents/csv",
    requestType: "GET",
  },
  [EXPORT_RESIDENTS_REPORT]: {
    endpoint: "/reports/residents/csv",
    requestType: "GET",
  },
  [EXPORT_ESCALATIONS_REPORT]: {
    endpoint: "/reports/escalations/csv",
    requestType: "GET",
  },
  [EXPORT_OCCUPANCY_REPORT]: {
    endpoint: "/reports/occupancy/csv",
    requestType: "GET",
  },
  [EXPORT_MEDICATIONS_REPORT]: {
    endpoint: "/reports/medications/csv",
    requestType: "GET",
  },
  [EXPORT_CARE_PLANS_REPORT]: {
    endpoint: "/reports/care-plans/csv",
    requestType: "GET",
  },
  [EXPORT_SHIFTS_REPORT]: {
    endpoint: "/reports/shifts/csv",
    requestType: "GET",
  },
  [EXPORT_CQC_COMPLIANCE_REPORT]: {
    endpoint: "/reports/cqc-compliance/csv",
    requestType: "GET",
  },
  [EXPORT_INVOICES_REPORT]: {
    endpoint: "/reports/invoices/csv",
    requestType: "GET",
  },
};

export default reportsEndpoints;
