import { EndpointDetails } from "../types";

export const CREATE_CAPACITY_ASSESSMENT = "CREATE_CAPACITY_ASSESSMENT";
export const GET_RESIDENT_CAPACITY_ASSESSMENTS = "GET_RESIDENT_CAPACITY_ASSESSMENTS";
export const GET_CAPACITY_ASSESSMENT = "GET_CAPACITY_ASSESSMENT";
export const UPDATE_CAPACITY_ASSESSMENT = "UPDATE_CAPACITY_ASSESSMENT";

export const CREATE_DOLS_AUTHORIZATION = "CREATE_DOLS_AUTHORIZATION";
export const GET_RESIDENT_DOLS_AUTHORIZATIONS = "GET_RESIDENT_DOLS_AUTHORIZATIONS";
export const GET_EXPIRING_DOLS = "GET_EXPIRING_DOLS";
export const GET_DOLS_AUTHORIZATION = "GET_DOLS_AUTHORIZATION";
export const UPDATE_DOLS_AUTHORIZATION = "UPDATE_DOLS_AUTHORIZATION";

const mcaDolsEndpoints: EndpointDetails = {
  [CREATE_CAPACITY_ASSESSMENT]: {
    requestType: "POST",
    endpoint: "/mca-dols/assessments",
  },
  [GET_RESIDENT_CAPACITY_ASSESSMENTS]: {
    requestType: "GET",
    endpoint: "/mca-dols/assessments/resident/[residentId]",
  },
  [GET_CAPACITY_ASSESSMENT]: {
    requestType: "GET",
    endpoint: "/mca-dols/assessments/[id]",
  },
  [UPDATE_CAPACITY_ASSESSMENT]: {
    requestType: "PATCH",
    endpoint: "/mca-dols/assessments/[id]",
  },
  [CREATE_DOLS_AUTHORIZATION]: {
    requestType: "POST",
    endpoint: "/mca-dols/dols",
  },
  [GET_RESIDENT_DOLS_AUTHORIZATIONS]: {
    requestType: "GET",
    endpoint: "/mca-dols/dols/resident/[residentId]",
  },
  [GET_EXPIRING_DOLS]: {
    requestType: "GET",
    endpoint: "/mca-dols/dols/expiring",
  },
  [GET_DOLS_AUTHORIZATION]: {
    requestType: "GET",
    endpoint: "/mca-dols/dols/[id]",
  },
  [UPDATE_DOLS_AUTHORIZATION]: {
    requestType: "PATCH",
    endpoint: "/mca-dols/dols/[id]",
  },
};

export default mcaDolsEndpoints;
