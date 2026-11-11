export const GET_INCIDENTS = "GET_INCIDENTS";
export const GET_INCIDENT = "GET_INCIDENT";
export const CREATE_INCIDENT = "CREATE_INCIDENT";
export const UPDATE_INCIDENT = "UPDATE_INCIDENT";
export const DELETE_INCIDENT = "DELETE_INCIDENT";
export const GET_INCIDENT_METRICS = "GET_INCIDENT_METRICS";
export const NOTIFY_INCIDENT_NOK = "NOTIFY_INCIDENT_NOK";
export const UPLOAD_INCIDENT_ATTACHMENT = "UPLOAD_INCIDENT_ATTACHMENT";

import { EndpointDetails } from "../types";

const incidentEndpoints: EndpointDetails = {
  [GET_INCIDENTS]: {
    endpoint: "/incidents",
    requestType: "GET",
  },
  [GET_INCIDENT]: {
    endpoint: "/incidents/[id]",
    requestType: "GET",
  },
  [CREATE_INCIDENT]: {
    endpoint: "/incidents",
    requestType: "POST",
  },
  [UPDATE_INCIDENT]: {
    endpoint: "/incidents/[id]",
    requestType: "PATCH",
  },
  [DELETE_INCIDENT]: {
    endpoint: "/incidents/[id]",
    requestType: "DELETE",
  },
  [GET_INCIDENT_METRICS]: {
    endpoint: "/incidents/metrics",
    requestType: "GET",
  },
  [NOTIFY_INCIDENT_NOK]: {
    endpoint: "/incidents/[id]/notify-nok",
    requestType: "POST",
  },
  [UPLOAD_INCIDENT_ATTACHMENT]: {
    endpoint: "/incidents/[id]/attachments",
    requestType: "POST",
  },
};

export default incidentEndpoints;
