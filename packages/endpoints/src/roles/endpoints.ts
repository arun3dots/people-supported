import { EndpointDetails } from "../types";

export const GET_ROLES_LIST = "GET_ROLES_LIST";
export const CREATE_ROLE = "CREATE_ROLE";
export const UPDATE_ROLE = "UPDATE_ROLE";
export const DELETE_ROLE = "DELETE_ROLE";

const rolesEndpoints: EndpointDetails = {
  [GET_ROLES_LIST]: {
    endpoint: "/api/roles",
    requestType: "GET",
  },
  [CREATE_ROLE]: {
    endpoint: "/api/roles",
    requestType: "POST",
  },
  [UPDATE_ROLE]: {
    endpoint: "/api/roles/[id]",
    requestType: "PATCH",
  },
  [DELETE_ROLE]: {
    endpoint: "/api/roles/[id]",
    requestType: "DELETE",
  },
};

export default rolesEndpoints;
