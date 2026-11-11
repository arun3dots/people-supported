import { EndpointDetails } from "../types";

export const GET_DEPARTMENTS = "GET_DEPARTMENTS";
export const CREATE_DEPARTMENT = "CREATE_DEPARTMENT";
export const UPDATE_DEPARTMENT = "UPDATE_DEPARTMENT";
export const DELETE_DEPARTMENT = "DELETE_DEPARTMENT";

const departmentEndpoints: EndpointDetails = {
  [GET_DEPARTMENTS]: {
    endpoint: "/api/departments",
    requestType: "GET",
  },
  [CREATE_DEPARTMENT]: {
    endpoint: "/api/departments",
    requestType: "POST",
  },
  [UPDATE_DEPARTMENT]: {
    endpoint: "/api/departments/[id]",
    requestType: "PATCH",
  },
  [DELETE_DEPARTMENT]: {
    endpoint: "/api/departments/[id]",
    requestType: "DELETE",
  },
};

export default departmentEndpoints;
