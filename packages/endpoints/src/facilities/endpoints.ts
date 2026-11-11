import { EndpointDetails } from "../types";

export const GET_WINGS = "GET_WINGS";
export const CREATE_WING = "CREATE_WING";
export const UPDATE_WING = "UPDATE_WING";
export const DELETE_WING = "DELETE_WING";

export const GET_ROOMS = "GET_ROOMS";
export const CREATE_ROOM = "CREATE_ROOM";
export const UPDATE_ROOM = "UPDATE_ROOM";
export const DELETE_ROOM = "DELETE_ROOM";

export const GET_BEDS = "GET_BEDS";
export const CREATE_BED = "CREATE_BED";
export const UPDATE_BED = "UPDATE_BED";
export const DELETE_BED = "DELETE_BED";

export const GET_SCHEMES = "GET_SCHEMES";
export const CREATE_SCHEME = "CREATE_SCHEME";
export const UPDATE_SCHEME = "UPDATE_SCHEME";
export const DELETE_SCHEME = "DELETE_SCHEME";

export const GET_PROPERTIES = "GET_PROPERTIES";
export const CREATE_PROPERTY_WITH_ROOMS = "CREATE_PROPERTY_WITH_ROOMS";
export const UPDATE_PROPERTY = "UPDATE_PROPERTY";

const facilityEndpoints: EndpointDetails = {
  [GET_SCHEMES]: {
    requestType: "GET",
    endpoint: "/api/facility/schemes",
  },
  [CREATE_SCHEME]: {
    requestType: "POST",
    endpoint: "/api/facility/schemes",
  },
  [UPDATE_SCHEME]: {
    requestType: "PATCH",
    endpoint: "/api/facility/schemes/[id]",
  },
  [DELETE_SCHEME]: {
    requestType: "DELETE",
    endpoint: "/api/facility/schemes/[id]",
  },
  [GET_PROPERTIES]: {
    requestType: "GET",
    endpoint: "/api/facility/properties",
  },
  [CREATE_PROPERTY_WITH_ROOMS]: {
    requestType: "POST",
    endpoint: "/api/facility/properties",
  },
  [UPDATE_PROPERTY]: {
    requestType: "PATCH",
    endpoint: "/api/facility/properties/[id]",
  },
  [GET_WINGS]: {
    requestType: "GET",
    endpoint: "/api/facility/wings",
  },
  [CREATE_WING]: {
    requestType: "POST",
    endpoint: "/api/facility/wings",
  },
  [UPDATE_WING]: {
    requestType: "PATCH",
    endpoint: "/api/facility/wings/[id]",
  },
  [DELETE_WING]: {
    requestType: "DELETE",
    endpoint: "/api/facility/wings/[id]",
  },
  [GET_ROOMS]: {
    requestType: "GET",
    endpoint: "/api/facility/rooms",
  },
  [CREATE_ROOM]: {
    requestType: "POST",
    endpoint: "/api/facility/rooms",
  },
  [UPDATE_ROOM]: {
    requestType: "PATCH",
    endpoint: "/api/facility/rooms/[id]",
  },
  [DELETE_ROOM]: {
    requestType: "DELETE",
    endpoint: "/api/facility/rooms/[id]",
  },
  [GET_BEDS]: {
    requestType: "GET",
    endpoint: "/api/facility/beds",
  },
  [CREATE_BED]: {
    requestType: "POST",
    endpoint: "/api/facility/beds",
  },
  [UPDATE_BED]: {
    requestType: "PATCH",
    endpoint: "/api/facility/beds/[id]",
  },
  [DELETE_BED]: {
    requestType: "DELETE",
    endpoint: "/api/facility/beds/[id]",
  },
};

export default facilityEndpoints;
