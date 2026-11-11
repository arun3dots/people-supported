import { EndpointDetails } from "../types";

export const GET_ADMIN_STATS = "GET_ADMIN_STATS";
export const GET_MY_TASKS = "GET_MY_TASKS";

const dashboardEndpoints: EndpointDetails = {
  [GET_ADMIN_STATS]: {
    endpoint: "/api/dashboard/admin-stats",
    requestType: "GET",
  },
  [GET_MY_TASKS]: {
    endpoint: "/api/dashboard/my-tasks",
    requestType: "GET",
  },
};

export default dashboardEndpoints;
