import { EndpointDetails } from "../types";

export const UPDATE_PROFILE = "UPDATE_PROFILE";
export const UPLOAD_PROFILE_IMAGE = "UPLOAD_PROFILE_IMAGE";

const userEndpoints: EndpointDetails = {
  [UPDATE_PROFILE]: {
    endpoint: "/api/user/profile",
    requestType: "PUT",
  },
  [UPLOAD_PROFILE_IMAGE]: {
    endpoint: "/api/user/profile/image",
    requestType: "POST",
  },
};

export default userEndpoints;
