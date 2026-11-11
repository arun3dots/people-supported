// Risk module endpoints. Mounted under /api/risk.
//
// Naming follows the SCREAMING_SNAKE convention used by most domains in this
// codebase. Audit module is the lone camelCase exception — kept that way for
// backwards compatibility.

export const GET_RISK_ASSESSMENTS = "GET_RISK_ASSESSMENTS";
export const GET_RISK_ASSESSMENT = "GET_RISK_ASSESSMENT";
export const CREATE_RISK_ASSESSMENT = "CREATE_RISK_ASSESSMENT";
export const UPDATE_RISK_ASSESSMENT = "UPDATE_RISK_ASSESSMENT";
export const TRANSITION_RISK_ASSESSMENT = "TRANSITION_RISK_ASSESSMENT";
export const DELETE_RISK_ASSESSMENT = "DELETE_RISK_ASSESSMENT";

export const CREATE_RISK_CONTROL = "CREATE_RISK_CONTROL";
export const UPDATE_RISK_CONTROL = "UPDATE_RISK_CONTROL";
export const COMPLETE_RISK_CONTROL = "COMPLETE_RISK_CONTROL";
export const DELETE_RISK_CONTROL = "DELETE_RISK_CONTROL";

export const GET_RISK_TEMPLATES = "GET_RISK_TEMPLATES";
export const CREATE_RISK_TEMPLATE = "CREATE_RISK_TEMPLATE";
export const UPDATE_RISK_TEMPLATE = "UPDATE_RISK_TEMPLATE";
export const DELETE_RISK_TEMPLATE = "DELETE_RISK_TEMPLATE";

export const GET_RISK_ALERTS_UNREAD = "GET_RISK_ALERTS_UNREAD";
export const MARK_RISK_ALERT_READ = "MARK_RISK_ALERT_READ";

export const GET_RISK_OVERVIEW = "GET_RISK_OVERVIEW";

import { EndpointDetails } from "../types";

const riskEndpoints: EndpointDetails = {
  [GET_RISK_ASSESSMENTS]: {
    endpoint: "/risk/assessments",
    requestType: "GET",
  },
  [GET_RISK_ASSESSMENT]: {
    endpoint: "/risk/assessments/[id]",
    requestType: "GET",
  },
  [CREATE_RISK_ASSESSMENT]: {
    endpoint: "/risk/assessments",
    requestType: "POST",
  },
  [UPDATE_RISK_ASSESSMENT]: {
    endpoint: "/risk/assessments/[id]",
    requestType: "PATCH",
  },
  [TRANSITION_RISK_ASSESSMENT]: {
    endpoint: "/risk/assessments/[id]/transition",
    requestType: "POST",
  },
  [DELETE_RISK_ASSESSMENT]: {
    endpoint: "/risk/assessments/[id]",
    requestType: "DELETE",
  },

  [CREATE_RISK_CONTROL]: {
    endpoint: "/risk/assessments/[id]/controls",
    requestType: "POST",
  },
  [UPDATE_RISK_CONTROL]: {
    endpoint: "/risk/controls/[id]",
    requestType: "PATCH",
  },
  [COMPLETE_RISK_CONTROL]: {
    endpoint: "/risk/controls/[id]/complete",
    requestType: "POST",
  },
  [DELETE_RISK_CONTROL]: {
    endpoint: "/risk/controls/[id]",
    requestType: "DELETE",
  },

  [GET_RISK_TEMPLATES]: {
    endpoint: "/risk/templates",
    requestType: "GET",
  },
  [CREATE_RISK_TEMPLATE]: {
    endpoint: "/risk/templates",
    requestType: "POST",
  },
  [UPDATE_RISK_TEMPLATE]: {
    endpoint: "/risk/templates/[id]",
    requestType: "PATCH",
  },
  [DELETE_RISK_TEMPLATE]: {
    endpoint: "/risk/templates/[id]",
    requestType: "DELETE",
  },

  [GET_RISK_ALERTS_UNREAD]: {
    endpoint: "/risk/alerts/unread",
    requestType: "GET",
  },
  [MARK_RISK_ALERT_READ]: {
    endpoint: "/risk/alerts/[id]/read",
    requestType: "POST",
  },

  [GET_RISK_OVERVIEW]: {
    endpoint: "/risk/reports/overview",
    requestType: "GET",
  },
};

export default riskEndpoints;
