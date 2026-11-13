import { EndpointDetails } from "../types";

export const GET_COMPLIANCE_REVIEWS = "GET_COMPLIANCE_REVIEWS";

const complianceEndpoints: EndpointDetails = {
  [GET_COMPLIANCE_REVIEWS]: {
    endpoint: "/compliance/reviews",
    requestType: "GET",
  },
};

export default complianceEndpoints;

