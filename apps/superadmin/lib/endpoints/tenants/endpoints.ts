import { EndpointDetails } from "../types";

export const GET_TENANTS = "GET_TENANTS";
export const GET_TENANT = "GET_TENANT";
export const CREATE_TENANT = "CREATE_TENANT";
export const UPDATE_TENANT = "UPDATE_TENANT";
export const SET_TENANT_STATUS = "SET_TENANT_STATUS";
export const GET_MANAGED_TENANT_USERS = "GET_MANAGED_TENANT_USERS";
export const CREATE_MANAGED_TENANT_USER = "CREATE_MANAGED_TENANT_USER";
export const MANAGED_TENANT_USER_ACTION = "MANAGED_TENANT_USER_ACTION";

const tenantEndpoints: EndpointDetails = {
  [GET_MANAGED_TENANT_USERS]: {
    endpoint: "/api/super-admin/tenants/[id]/managed-users",
    requestType: "GET",
  },
  [CREATE_MANAGED_TENANT_USER]: {
    endpoint: "/api/super-admin/tenants/[id]/managed-users",
    requestType: "POST",
  },
  [MANAGED_TENANT_USER_ACTION]: {
    endpoint: "/api/super-admin/tenants/[id]/managed-users/[userId]/actions",
    requestType: "POST",
  },
  [GET_TENANTS]: {
    requestType: "GET",
    endpoint: "/api/super-admin/tenants",
  },
  [GET_TENANT]: {
    requestType: "GET",
    endpoint: "/api/super-admin/tenants/[id]",
  },
  [CREATE_TENANT]: {
    requestType: "POST",
    endpoint: "/api/super-admin/tenants",
  },
  [UPDATE_TENANT]: {
    requestType: "PATCH",
    endpoint: "/api/super-admin/tenants/[id]",
  },
  [SET_TENANT_STATUS]: {
    requestType: "PATCH",
    endpoint: "/api/super-admin/tenants/[id]/status",
  },
};

export default tenantEndpoints;
