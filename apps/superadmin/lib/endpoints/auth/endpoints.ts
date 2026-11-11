import { EndpointDetails } from "../types";

export const LOGIN = "LOGIN";
export const LOGOUT = "LOGOUT";
export const ME = "ME";
export const REFRESH = "REFRESH";

const authEndpoints: EndpointDetails = {
  [LOGIN]: {
    requestType: "POST",
    endpoint: "/api/auth/login",
  },
  [LOGOUT]: {
    requestType: "POST",
    endpoint: "/api/auth/logout",
  },
  [ME]: {
    requestType: "POST",
    endpoint: "/api/auth/me",
  },
  [REFRESH]: {
    requestType: "POST",
    endpoint: "/api/auth/refresh",
  },
};

export default authEndpoints;
