import { EndpointDetails } from "../types";

export const GET_MY_PROFILE = "GET_MY_PROFILE";
export const UPDATE_MY_PROFILE = "UPDATE_MY_PROFILE";
export const GET_MY_COMPLIANCE = "GET_MY_COMPLIANCE";
export const UPLOAD_MY_PROFILE_PHOTO = "UPLOAD_MY_PROFILE_PHOTO";

const profileEndpoints: EndpointDetails = {
  [GET_MY_PROFILE]: {
    endpoint: "/api/profile",
    requestType: "GET",
  },
  [UPDATE_MY_PROFILE]: {
    endpoint: "/api/profile",
    requestType: "PATCH",
  },
  [GET_MY_COMPLIANCE]: {
    endpoint: "/api/profile/compliance",
    requestType: "GET",
  },
  [UPLOAD_MY_PROFILE_PHOTO]: {
    endpoint: "/api/profile/photo",
    requestType: "POST",
  },
};

export default profileEndpoints;
