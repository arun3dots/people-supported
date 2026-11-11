import { EndpointDetails } from "../types";

export const GET_SHIFT_TYPES = "GET_SHIFT_TYPES";
export const CREATE_SHIFT_TYPE = "CREATE_SHIFT_TYPE";
export const UPDATE_SHIFT_TYPE = "UPDATE_SHIFT_TYPE";
export const DELETE_SHIFT_TYPE = "DELETE_SHIFT_TYPE";
export const GET_SHIFTS = "GET_SHIFTS";
export const CREATE_SHIFT = "CREATE_SHIFT";
export const UPDATE_SHIFT = "UPDATE_SHIFT";
export const DELETE_SHIFT = "DELETE_SHIFT";
export const ASSIGN_STAFF = "ASSIGN_STAFF";
export const UNASSIGN_STAFF = "UNASSIGN_STAFF";
export const GET_MY_SHIFTS = "GET_MY_SHIFTS";
export const GET_ACTIVE_SHIFT = "GET_ACTIVE_SHIFT";
export const GET_SHIFT_REQUESTS = "GET_SHIFT_REQUESTS";
export const CREATE_SHIFT_REQUEST = "CREATE_SHIFT_REQUEST";
export const UPDATE_SHIFT_REQUEST_STATUS = "UPDATE_SHIFT_REQUEST_STATUS";
export const START_SHIFT = "START_SHIFT";
export const END_SHIFT = "END_SHIFT";
export const GET_SHIFT_LOGS = "GET_SHIFT_LOGS";
export const GET_SHIFT_DETAILS = "GET_SHIFT_DETAILS";
export const UPDATE_HANDOVER_NOTES = "UPDATE_HANDOVER_NOTES";
export const GET_LEAVE_REQUESTS = "GET_LEAVE_REQUESTS";
export const CREATE_LEAVE_REQUEST = "CREATE_LEAVE_REQUEST";
export const UPDATE_LEAVE_REQUEST_STATUS = "UPDATE_LEAVE_REQUEST_STATUS";

const shiftEndpoints: EndpointDetails = {
  [GET_SHIFT_TYPES]: {
    requestType: "GET",
    endpoint: "/shifts/types",
  },
  [CREATE_SHIFT_TYPE]: {
    requestType: "POST",
    endpoint: "/shifts/types",
  },
  [UPDATE_SHIFT_TYPE]: {
    requestType: "PATCH",
    endpoint: "/shifts/types/[id]",
  },
  [DELETE_SHIFT_TYPE]: {
    requestType: "DELETE",
    endpoint: "/shifts/types/[id]",
  },
  [GET_SHIFTS]: {
    requestType: "GET",
    endpoint: "/shifts",
  },
  [CREATE_SHIFT]: {
    requestType: "POST",
    endpoint: "/shifts",
  },
  [UPDATE_SHIFT]: {
    requestType: "PATCH",
    endpoint: "/shifts/[id]",
  },
  [DELETE_SHIFT]: {
    requestType: "DELETE",
    endpoint: "/shifts/[id]",
  },
  [ASSIGN_STAFF]: {
    requestType: "POST",
    endpoint: "/shifts/assignments",
  },
  [UNASSIGN_STAFF]: {
    requestType: "DELETE",
    endpoint: "/shifts/assignments/[id]",
  },
  [GET_MY_SHIFTS]: {
    requestType: "GET",
    endpoint: "/shifts/my",
  },
  [GET_ACTIVE_SHIFT]: {
    requestType: "GET",
    endpoint: "/shifts/active",
  },
  [GET_SHIFT_REQUESTS]: {
    requestType: "GET",
    endpoint: "/shift-requests",
  },
  [CREATE_SHIFT_REQUEST]: {
    requestType: "POST",
    endpoint: "/shift-requests",
  },
  [UPDATE_SHIFT_REQUEST_STATUS]: {
    requestType: "PATCH",
    endpoint: "/shift-requests/[id]/status",
  },
  [START_SHIFT]: {
    requestType: "POST",
    endpoint: "/shifts/[id]/start",
  },
  [END_SHIFT]: {
    requestType: "POST",
    endpoint: "/shifts/[id]/end",
  },
  [GET_SHIFT_LOGS]: {
    requestType: "GET",
    endpoint: "/shifts/[id]/logs",
  },
  [GET_SHIFT_DETAILS]: {
    requestType: "GET",
    endpoint: "/shifts/[id]/details",
  },
  [UPDATE_HANDOVER_NOTES]: {
    requestType: "PATCH",
    endpoint: "/shifts/[id]/handover-notes",
  },
  [GET_LEAVE_REQUESTS]: {
    requestType: "GET",
    endpoint: "/leave-requests",
  },
  [CREATE_LEAVE_REQUEST]: {
    requestType: "POST",
    endpoint: "/leave-requests",
  },
  [UPDATE_LEAVE_REQUEST_STATUS]: {
    requestType: "PATCH",
    endpoint: "/leave-requests/[id]/status",
  },
};

export default shiftEndpoints;
