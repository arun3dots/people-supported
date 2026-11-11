import { EndpointDetails } from "../types";

export const GET_BRANCHES = "GET_BRANCHES";
export const GET_BRANCH = "GET_BRANCH";
export const CREATE_BRANCH = "CREATE_BRANCH";
export const UPDATE_BRANCH = "UPDATE_BRANCH";
export const DELETE_BRANCH = "DELETE_BRANCH";

const branchEndpoints: EndpointDetails = {
  [GET_BRANCHES]: {
    endpoint: "/branches",
    requestType: "GET",
  },
  [GET_BRANCH]: {
    endpoint: "/branches/[id]",
    requestType: "GET",
  },
  [CREATE_BRANCH]: {
    endpoint: "/branches",
    requestType: "POST",
  },
  [UPDATE_BRANCH]: {
    endpoint: "/branches/[id]",
    requestType: "PATCH",
  },
  [DELETE_BRANCH]: {
    endpoint: "/branches/[id]",
    requestType: "DELETE",
  },
};

export default branchEndpoints;
