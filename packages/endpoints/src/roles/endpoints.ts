import { EndpointDetails } from "../types";

export const GET_ROLES_LIST = "GET_ROLES_LIST";
export const CREATE_ROLE = "CREATE_ROLE";
export const UPDATE_ROLE = "UPDATE_ROLE";
export const DELETE_ROLE = "DELETE_ROLE";
export const GET_ACCESS_CONSOLE = "GET_ACCESS_CONSOLE";
export const CREATE_ACCESS_ROLE = "CREATE_ACCESS_ROLE";
export const UPDATE_ACCESS_ROLE = "UPDATE_ACCESS_ROLE";
export const UPDATE_ACCESS_MEMBERSHIP = "UPDATE_ACCESS_MEMBERSHIP";

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
  [GET_ACCESS_CONSOLE]: {
    endpoint: "/api/access-admin",
    requestType: "GET",
  },
  [CREATE_ACCESS_ROLE]: {
    endpoint: "/api/access-admin/roles",
    requestType: "POST",
  },
  [UPDATE_ACCESS_ROLE]: {
    endpoint: "/api/access-admin/roles/[key]",
    requestType: "PATCH",
  },
  [UPDATE_ACCESS_MEMBERSHIP]: {
    endpoint: "/api/access-admin/members/[id]",
    requestType: "PATCH",
  },
};

export default rolesEndpoints;
