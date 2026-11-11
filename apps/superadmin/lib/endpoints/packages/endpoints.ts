import { EndpointDetails } from "../types";

export const GET_PACKAGES = "GET_PACKAGES";
export const CREATE_PACKAGE = "CREATE_PACKAGE";
export const UPDATE_PACKAGE = "UPDATE_PACKAGE";
export const DEACTIVATE_PACKAGE = "DEACTIVATE_PACKAGE";

const packageEndpoints: EndpointDetails = {
  [GET_PACKAGES]: {
    requestType: "GET",
    endpoint: "/api/super-admin/packages",
  },
  [CREATE_PACKAGE]: {
    requestType: "POST",
    endpoint: "/api/super-admin/packages",
  },
  [UPDATE_PACKAGE]: {
    requestType: "PATCH",
    endpoint: "/api/super-admin/packages/[id]",
  },
  [DEACTIVATE_PACKAGE]: {
    requestType: "PATCH",
    endpoint: "/api/super-admin/packages/[id]/deactivate",
  },
};

export default packageEndpoints;
