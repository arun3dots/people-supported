import { EndpointDetails } from "../types";

export const GET_STAFF = "GET_STAFF";
export const GET_STAFF_MEMBER = "GET_STAFF_MEMBER";
export const CREATE_STAFF = "CREATE_STAFF";
export const UPDATE_STAFF_ROLE = "UPDATE_STAFF_ROLE";
export const UPDATE_STAFF_STATUS = "UPDATE_STAFF_STATUS";
export const DELETE_STAFF = "DELETE_STAFF";
export const UPDATE_STAFF = "UPDATE_STAFF";
export const UPDATE_STAFF_ASSIGNMENTS = "UPDATE_STAFF_ASSIGNMENTS";
export const REASSIGN_STAFF = "REASSIGN_STAFF";
export const UPLOAD_STAFF_PHOTO = "UPLOAD_STAFF_PHOTO";

// Compliance endpoints
export const GET_STAFF_COMPLIANCE = "GET_STAFF_COMPLIANCE";
export const UPSERT_STAFF_RTW = "UPSERT_STAFF_RTW";
export const GET_STAFF_RTW = "GET_STAFF_RTW";
export const UPSERT_STAFF_DBS = "UPSERT_STAFF_DBS";
export const GET_STAFF_DBS = "GET_STAFF_DBS";
export const CREATE_STAFF_CERTIFICATION = "CREATE_STAFF_CERTIFICATION";
export const UPDATE_STAFF_CERTIFICATION = "UPDATE_STAFF_CERTIFICATION";
export const GET_STAFF_CERTIFICATIONS = "GET_STAFF_CERTIFICATIONS";
export const DELETE_STAFF_CERTIFICATION = "DELETE_STAFF_CERTIFICATION";
export const UPSERT_STAFF_HEALTH = "UPSERT_STAFF_HEALTH";
export const GET_STAFF_HEALTH = "GET_STAFF_HEALTH";
export const CREATE_STAFF_IMMUNISATION = "CREATE_STAFF_IMMUNISATION";
export const UPDATE_STAFF_IMMUNISATION = "UPDATE_STAFF_IMMUNISATION";
export const GET_STAFF_IMMUNISATIONS = "GET_STAFF_IMMUNISATIONS";
export const DELETE_STAFF_IMMUNISATION = "DELETE_STAFF_IMMUNISATION";
export const GET_COMPLIANCE_REPORT = "GET_COMPLIANCE_REPORT";
export const UPLOAD_COMPLIANCE_DOCUMENT = "UPLOAD_COMPLIANCE_DOCUMENT";
export const GET_COMPLIANCE_SIGNED_URL = "GET_COMPLIANCE_SIGNED_URL";
export const EXPORT_STAFF_SAR = "EXPORT_STAFF_SAR";

const staffEndpoints: EndpointDetails = {
  [GET_STAFF]: {
    endpoint: "/api/staff",
    requestType: "GET",
  },
  [GET_STAFF_MEMBER]: {
    endpoint: "/api/staff/[id]",
    requestType: "GET",
  },
  [CREATE_STAFF]: {
    endpoint: "/api/staff",
    requestType: "POST",
  },
  [UPDATE_STAFF_ROLE]: {
    endpoint: "/api/staff/[id]/role",
    requestType: "PATCH",
  },
  [UPDATE_STAFF_STATUS]: {
    endpoint: "/api/staff/[id]/status",
    requestType: "PATCH",
  },
  [DELETE_STAFF]: {
    endpoint: "/api/staff/[id]",
    requestType: "DELETE",
  },
  [UPDATE_STAFF]: {
    endpoint: "/api/staff/[id]",
    requestType: "PATCH",
  },
  [UPDATE_STAFF_ASSIGNMENTS]: {
    endpoint: "/api/staff/[id]/assignments",
    requestType: "PATCH",
  },
  [REASSIGN_STAFF]: {
    endpoint: "/api/staff/[id]/reassign",
    requestType: "PATCH",
  },
  [UPLOAD_STAFF_PHOTO]: {
    endpoint: "/api/staff/[id]/photo",
    requestType: "POST",
  },
  // Compliance
  [GET_STAFF_COMPLIANCE]: {
    endpoint: "/api/staff/[id]/compliance",
    requestType: "GET",
  },
  [UPSERT_STAFF_RTW]: {
    endpoint: "/api/staff/[id]/compliance/rtw",
    requestType: "PUT",
  },
  [GET_STAFF_RTW]: {
    endpoint: "/api/staff/[id]/compliance/rtw",
    requestType: "GET",
  },
  [UPSERT_STAFF_DBS]: {
    endpoint: "/api/staff/[id]/compliance/dbs",
    requestType: "PUT",
  },
  [GET_STAFF_DBS]: {
    endpoint: "/api/staff/[id]/compliance/dbs",
    requestType: "GET",
  },
  [CREATE_STAFF_CERTIFICATION]: {
    endpoint: "/api/staff/[id]/compliance/certifications",
    requestType: "POST",
  },
  [UPDATE_STAFF_CERTIFICATION]: {
    endpoint: "/api/staff/[id]/compliance/certifications/[certId]",
    requestType: "PUT",
  },
  [GET_STAFF_CERTIFICATIONS]: {
    endpoint: "/api/staff/[id]/compliance/certifications",
    requestType: "GET",
  },
  [DELETE_STAFF_CERTIFICATION]: {
    endpoint: "/api/staff/[id]/compliance/certifications/[certId]",
    requestType: "DELETE",
  },
  [UPSERT_STAFF_HEALTH]: {
    endpoint: "/api/staff/[id]/compliance/health",
    requestType: "PUT",
  },
  [GET_STAFF_HEALTH]: {
    endpoint: "/api/staff/[id]/compliance/health",
    requestType: "GET",
  },
  [CREATE_STAFF_IMMUNISATION]: {
    endpoint: "/api/staff/[id]/compliance/immunisations",
    requestType: "POST",
  },
  [UPDATE_STAFF_IMMUNISATION]: {
    endpoint: "/api/staff/[id]/compliance/immunisations/[immId]",
    requestType: "PUT",
  },
  [GET_STAFF_IMMUNISATIONS]: {
    endpoint: "/api/staff/[id]/compliance/immunisations",
    requestType: "GET",
  },
  [DELETE_STAFF_IMMUNISATION]: {
    endpoint: "/api/staff/[id]/compliance/immunisations/[immId]",
    requestType: "DELETE",
  },
  [GET_COMPLIANCE_REPORT]: {
    endpoint: "/api/staff/compliance-report",
    requestType: "GET",
  },
  [UPLOAD_COMPLIANCE_DOCUMENT]: {
    endpoint: "/api/staff/[id]/compliance/upload",
    requestType: "POST",
  },
  [EXPORT_STAFF_SAR]: {
    endpoint: "/api/data-rights/staff/[id]/sar-export",
    requestType: "GET",
  },
  [GET_COMPLIANCE_SIGNED_URL]: {
    endpoint: "/api/staff/[id]/compliance/signed-url",
    requestType: "GET",
  },
};


export default staffEndpoints;

