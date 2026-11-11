import { EndpointDetails } from "../types";

export const GET_ORGANIZATION_PROFILE = "GET_ORGANIZATION_PROFILE";
export const UPDATE_ORGANIZATION_PROFILE = "UPDATE_ORGANIZATION_PROFILE";
export const GET_ORGANIZATION_DOCUMENTS = "GET_ORGANIZATION_DOCUMENTS";
export const UPLOAD_ORGANIZATION_DOCUMENT = "UPLOAD_ORGANIZATION_DOCUMENT";
export const DELETE_ORGANIZATION_DOCUMENT = "DELETE_ORGANIZATION_DOCUMENT";
export const GET_DPA_STATUS = "GET_DPA_STATUS";
export const ACCEPT_DPA = "ACCEPT_DPA";
export const GET_DATA_RIGHTS_REQUESTS = "GET_DATA_RIGHTS_REQUESTS";

const organizationEndpoints: EndpointDetails = {
  [GET_ORGANIZATION_PROFILE]: {
    endpoint: "/api/organization",
    requestType: "GET",
  },
  [UPDATE_ORGANIZATION_PROFILE]: {
    endpoint: "/api/organization",
    requestType: "PATCH",
  },
  [GET_ORGANIZATION_DOCUMENTS]: {
    endpoint: "/api/organization/documents",
    requestType: "GET",
  },
  [UPLOAD_ORGANIZATION_DOCUMENT]: {
    endpoint: "/api/organization/documents/upload",
    requestType: "POST",
  },
  [DELETE_ORGANIZATION_DOCUMENT]: {
    endpoint: "/api/organization/documents/[id]",
    requestType: "DELETE",
  },
  [GET_DPA_STATUS]: {
    endpoint: "/api/organization/dpa-status",
    requestType: "GET",
  },
  [ACCEPT_DPA]: {
    endpoint: "/api/organization/accept-dpa",
    requestType: "POST",
  },
  [GET_DATA_RIGHTS_REQUESTS]: {
    endpoint: "/api/data-rights/requests",
    requestType: "GET",
  },
};

export default organizationEndpoints;
