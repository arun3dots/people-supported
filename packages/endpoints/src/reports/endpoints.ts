export const EXPORT_INCIDENTS_REPORT = "EXPORT_INCIDENTS_REPORT";
export const EXPORT_RESIDENTS_REPORT = "EXPORT_RESIDENTS_REPORT";
export const EXPORT_ESCALATIONS_REPORT = "EXPORT_ESCALATIONS_REPORT";

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
};

export default reportsEndpoints;
