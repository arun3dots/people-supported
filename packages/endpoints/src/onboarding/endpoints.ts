import { EndpointDetails } from "../types";

export const GET_PUBLIC_PACKAGES = "GET_PUBLIC_PACKAGES";
export const ONBOARD_TENANT = "ONBOARD_TENANT";
export const VERIFY_TENANT = "VERIFY_TENANT";

const onboardingEndpoints: EndpointDetails = {
  [GET_PUBLIC_PACKAGES]: {
    endpoint: "/packages",
    requestType: "GET",
  },
  [ONBOARD_TENANT]: {
    endpoint: "/tenants/onboard",
    requestType: "POST",
  },
  [VERIFY_TENANT]: {
    endpoint: "/tenants/verify",
    requestType: "GET",
  },
};

export default onboardingEndpoints;
