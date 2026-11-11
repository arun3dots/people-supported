import { EndpointDetails } from "../types";

export const CREATE_PRE_ADMISSION = "CREATE_PRE_ADMISSION";
export const GET_PRE_ADMISSION = "GET_PRE_ADMISSION";
export const GET_PRE_ADMISSION_VERSIONS = "GET_PRE_ADMISSION_VERSIONS";
export const UPDATE_PRE_ADMISSION_META = "UPDATE_PRE_ADMISSION_META";
export const SAVE_PRE_ADMISSION_PART = "SAVE_PRE_ADMISSION_PART";
export const SUBMIT_PRE_ADMISSION = "SUBMIT_PRE_ADMISSION";
export const DECIDE_PRE_ADMISSION = "DECIDE_PRE_ADMISSION";

const preAdmissionEndpoints: EndpointDetails = {
  [CREATE_PRE_ADMISSION]: {
    endpoint: "/residents/pre-admission",
    requestType: "POST",
  },
  [GET_PRE_ADMISSION]: {
    endpoint: "/residents/[id]/pre-admission",
    requestType: "GET",
  },
  [GET_PRE_ADMISSION_VERSIONS]: {
    endpoint: "/residents/[id]/pre-admission/versions",
    requestType: "GET",
  },
  [UPDATE_PRE_ADMISSION_META]: {
    endpoint: "/residents/[id]/pre-admission/meta",
    requestType: "PATCH",
  },
  [SAVE_PRE_ADMISSION_PART]: {
    endpoint: "/residents/[id]/pre-admission/parts/[part]",
    requestType: "PATCH",
  },
  [SUBMIT_PRE_ADMISSION]: {
    endpoint: "/residents/[id]/pre-admission/submit",
    requestType: "POST",
  },
  [DECIDE_PRE_ADMISSION]: {
    endpoint: "/residents/[id]/pre-admission/decision",
    requestType: "POST",
  },
};

export default preAdmissionEndpoints;
