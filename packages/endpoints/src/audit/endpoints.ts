import { EndpointDetails } from "../types";

const auditEndpoints: EndpointDetails = {
  getAuditLogs: {
    endpoint: "/audit-logs",
    requestType: "GET",
  },
  logPageView: {
    endpoint: "/audit-logs/page-view",
    requestType: "POST",
  },
};

export default auditEndpoints;
