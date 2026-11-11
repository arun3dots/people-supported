export const CREATE_BODY_MAP_ASSESSMENT = "CREATE_BODY_MAP_ASSESSMENT";
export const GET_BODY_MAP_ASSESSMENTS = "GET_BODY_MAP_ASSESSMENTS";
export const GET_BODY_MAP_ASSESSMENT = "GET_BODY_MAP_ASSESSMENT";
export const RESOLVE_BODY_MAP_FINDING = "RESOLVE_BODY_MAP_FINDING";
export const UPLOAD_BODY_MAP_PHOTO = "UPLOAD_BODY_MAP_PHOTO";
export const STREAM_BODY_MAP_PHOTO = "STREAM_BODY_MAP_PHOTO";
export const CREATE_BODY_MAP_FINDING_ACTION = "CREATE_BODY_MAP_FINDING_ACTION";
export const UPDATE_BODY_MAP_FINDING_ACTION = "UPDATE_BODY_MAP_FINDING_ACTION";
export const DELETE_BODY_MAP_FINDING_ACTION = "DELETE_BODY_MAP_FINDING_ACTION";

import { EndpointDetails } from "../types";

const bodyMapEndpoints: EndpointDetails = {
  [CREATE_BODY_MAP_ASSESSMENT]: {
    endpoint: "/residents/[residentId]/body-map/assessments",
    requestType: "POST",
  },
  [GET_BODY_MAP_ASSESSMENTS]: {
    endpoint: "/residents/[residentId]/body-map/assessments",
    requestType: "GET",
  },
  [GET_BODY_MAP_ASSESSMENT]: {
    endpoint: "/residents/[residentId]/body-map/assessments/[id]",
    requestType: "GET",
  },
  [RESOLVE_BODY_MAP_FINDING]: {
    endpoint: "/body-map-findings/[id]/resolve",
    requestType: "POST",
  },
  [UPLOAD_BODY_MAP_PHOTO]: {
    endpoint: "/body-map-findings/[id]/photos",
    requestType: "POST",
  },
  [STREAM_BODY_MAP_PHOTO]: {
    endpoint: "/body-map-photos/[id]/stream",
    requestType: "GET",
  },
  [CREATE_BODY_MAP_FINDING_ACTION]: {
    endpoint: "/body-map-findings/[id]/actions",
    requestType: "POST",
  },
  [UPDATE_BODY_MAP_FINDING_ACTION]: {
    endpoint: "/body-map-findings/[id]/actions/[actionId]",
    requestType: "PATCH",
  },
  [DELETE_BODY_MAP_FINDING_ACTION]: {
    endpoint: "/body-map-findings/[id]/actions/[actionId]",
    requestType: "DELETE",
  },
};

export default bodyMapEndpoints;
