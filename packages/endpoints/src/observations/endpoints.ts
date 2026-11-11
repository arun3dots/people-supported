import { EndpointDetails } from "../types";

export const CREATE_OBSERVATION = "CREATE_OBSERVATION";
export const GET_RESIDENT_OBSERVATIONS = "GET_RESIDENT_OBSERVATIONS";
export const GET_OBSERVATION = "GET_OBSERVATION";

const observationEndpoints: EndpointDetails = {
  [CREATE_OBSERVATION]: {
    requestType: "POST",
    endpoint: "/api/observations",
  },
  [GET_RESIDENT_OBSERVATIONS]: {
    requestType: "GET",
    endpoint: "/api/observations/resident/[residentId]",
  },
  [GET_OBSERVATION]: {
    requestType: "GET",
    endpoint: "/api/observations/[id]",
  },
};

export default observationEndpoints;
