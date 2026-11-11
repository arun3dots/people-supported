import { EndpointDetails } from "../types";

export const GET_ENQUIRIES = "GET_ENQUIRIES";
export const GET_ENQUIRY = "GET_ENQUIRY";
export const GET_ENQUIRY_METRICS = "GET_ENQUIRY_METRICS";
export const CREATE_ENQUIRY = "CREATE_ENQUIRY";
export const UPDATE_ENQUIRY = "UPDATE_ENQUIRY";
export const DELETE_ENQUIRY = "DELETE_ENQUIRY";

export const GET_ASSESSMENT_TEMPLATES = "GET_ASSESSMENT_TEMPLATES";
export const CREATE_ASSESSMENT_TEMPLATE = "CREATE_ASSESSMENT_TEMPLATE";
export const UPDATE_ASSESSMENT_TEMPLATE = "UPDATE_ASSESSMENT_TEMPLATE";
export const DELETE_ASSESSMENT_TEMPLATE = "DELETE_ASSESSMENT_TEMPLATE";

const enquiryEndpoints: EndpointDetails = {
  [GET_ENQUIRIES]: {
    endpoint: "/api/enquiries",
    requestType: "GET",
  },
  [GET_ENQUIRY_METRICS]: {
    endpoint: "/api/enquiries/metrics",
    requestType: "GET",
  },
  [GET_ENQUIRY]: {
    endpoint: "/api/enquiries/[id]",
    requestType: "GET",
  },
  [CREATE_ENQUIRY]: {
    endpoint: "/api/enquiries",
    requestType: "POST",
  },
  [UPDATE_ENQUIRY]: {
    endpoint: "/api/enquiries/[id]",
    requestType: "PATCH",
  },
  [DELETE_ENQUIRY]: {
    endpoint: "/api/enquiries/[id]",
    requestType: "DELETE",
  },
  [GET_ASSESSMENT_TEMPLATES]: {
    endpoint: "/api/enquiries/templates",
    requestType: "GET",
  },
  [CREATE_ASSESSMENT_TEMPLATE]: {
    endpoint: "/api/enquiries/templates",
    requestType: "POST",
  },
  [UPDATE_ASSESSMENT_TEMPLATE]: {
    endpoint: "/api/enquiries/templates/[templateId]",
    requestType: "PUT",
  },
  [DELETE_ASSESSMENT_TEMPLATE]: {
    endpoint: "/api/enquiries/templates/[templateId]",
    requestType: "DELETE",
  },
};

export default enquiryEndpoints;
