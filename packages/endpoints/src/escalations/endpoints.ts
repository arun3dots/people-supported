export const GET_ESCALATIONS = "GET_ESCALATIONS";
export const GET_ESCALATION = "GET_ESCALATION";
export const CREATE_ESCALATION = "CREATE_ESCALATION";
export const TRIAGE_ESCALATION = "TRIAGE_ESCALATION";
export const SIGN_OFF_ESCALATION = "SIGN_OFF_ESCALATION";
export const GET_ESCALATION_SHIFT_SUMMARY = "GET_ESCALATION_SHIFT_SUMMARY";

import { EndpointDetails } from "../types";

const escalationEndpoints: EndpointDetails = {
  [GET_ESCALATIONS]: {
    endpoint: "/escalations",
    requestType: "GET",
  },
  [GET_ESCALATION]: {
    endpoint: "/escalations/[id]",
    requestType: "GET",
  },
  [CREATE_ESCALATION]: {
    endpoint: "/escalations",
    requestType: "POST",
  },
  [TRIAGE_ESCALATION]: {
    endpoint: "/escalations/[id]/triage",
    requestType: "PATCH",
  },
  [SIGN_OFF_ESCALATION]: {
    endpoint: "/escalations/[id]/sign-off",
    requestType: "POST",
  },
  [GET_ESCALATION_SHIFT_SUMMARY]: {
    endpoint: "/escalations/summary/shift",
    requestType: "GET",
  },
};

export default escalationEndpoints;
