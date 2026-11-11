export const GET_RESIDENTS = "GET_RESIDENTS";
export const GET_RESIDENT = "GET_RESIDENT";
export const DISCHARGE_RESIDENT = "DISCHARGE_RESIDENT";
export const GET_RESIDENT_TIMELINE = "GET_RESIDENT_TIMELINE";
export const CREATE_CARE_NOTE = "CREATE_CARE_NOTE";
export const UPDATE_CARE_NOTE = "UPDATE_CARE_NOTE";
export const DELETE_CARE_NOTE = "DELETE_CARE_NOTE";
export const GET_RESIDENT_MEDICATION_ROUNDS = "GET_RESIDENT_MEDICATION_ROUNDS";
export const ADMINISTER_MEDICATION = "ADMINISTER_MEDICATION";
export const ADMINISTER_MEDICATION_ADHOC = "ADMINISTER_MEDICATION_ADHOC";
export const CREATE_MEDICATION_ROUND = "CREATE_MEDICATION_ROUND";
export const UPDATE_MEDICATION_ROUND = "UPDATE_MEDICATION_ROUND";
export const DELETE_MEDICATION_ROUND = "DELETE_MEDICATION_ROUND";
export const CREATE_MEDICATION_ROUND_BULK = "CREATE_MEDICATION_ROUND_BULK";
export const GET_MEDICATION_PRESCRIPTIONS = "GET_MEDICATION_PRESCRIPTIONS";
export const STOP_MEDICATION_PRESCRIPTION = "STOP_MEDICATION_PRESCRIPTION";
export const CHANGE_MEDICATION_PRESCRIPTION = "CHANGE_MEDICATION_PRESCRIPTION";
export const PAUSE_MEDICATION_PRESCRIPTION = "PAUSE_MEDICATION_PRESCRIPTION";
export const GET_RESIDENT_DOCUMENTS = "GET_RESIDENT_DOCUMENTS";
export const GET_DOCUMENT_UPLOAD_URL = "GET_DOCUMENT_UPLOAD_URL";
export const UPLOAD_RESIDENT_DOCUMENT = "UPLOAD_RESIDENT_DOCUMENT";
export const SAVE_RESIDENT_DOCUMENT = "SAVE_RESIDENT_DOCUMENT";
export const DELETE_RESIDENT_DOCUMENT = "DELETE_RESIDENT_DOCUMENT";
export const VERIFY_RESIDENT_DOCUMENT = "VERIFY_RESIDENT_DOCUMENT";
export const ARCHIVE_RESIDENT_DOCUMENT = "ARCHIVE_RESIDENT_DOCUMENT";
export const VIEW_RESIDENT_DOCUMENT = "VIEW_RESIDENT_DOCUMENT";
export const UPLOAD_RESIDENT_PHOTO = "UPLOAD_RESIDENT_PHOTO";
export const UPLOAD_ADMISSION_PHOTO = "UPLOAD_ADMISSION_PHOTO";
export const UPLOAD_ADMISSION_DOCUMENT = "UPLOAD_ADMISSION_DOCUMENT";
export const UPLOAD_MEDICATION_IMAGE = "UPLOAD_MEDICATION_IMAGE";
export const SUGGEST_CARERS = "SUGGEST_CARERS";
export const ASSIGN_CARER = "ASSIGN_CARER";
export const ASSIGN_BED = "ASSIGN_BED";

// Resident profile maintenance and current pre-admission confirmation.
export const UPDATE_RESIDENT_PERSONAL_INFO = "UPDATE_RESIDENT_PERSONAL_INFO";
export const UPDATE_RESIDENT_FUNDING = "UPDATE_RESIDENT_FUNDING";
export const UPDATE_RESIDENT_CARE_PROFILE = "UPDATE_RESIDENT_CARE_PROFILE";
export const UPDATE_RESIDENT_SUPPORTED_LIVING = "UPDATE_RESIDENT_SUPPORTED_LIVING";
export const ADMIT_CONFIRM = "ADMIT_CONFIRM";

export const GET_RESIDENT_METRICS = "GET_RESIDENT_METRICS";
export const GET_RESIDENT_INSIGHTS = "GET_RESIDENT_INSIGHTS";
export const GET_EMERGENCY_DIRECTORY = "GET_EMERGENCY_DIRECTORY";
export const GET_EMERGENCY_RESIDENT_SUMMARY = "GET_EMERGENCY_RESIDENT_SUMMARY";
export const CREATE_FOOD_FLUID_LOG = "CREATE_FOOD_FLUID_LOG";
export const GET_FOOD_FLUID_LOGS = "GET_FOOD_FLUID_LOGS";
export const GET_FOOD_FLUID_SUMMARY = "GET_FOOD_FLUID_SUMMARY";
export const UPDATE_FOOD_FLUID_LOG = "UPDATE_FOOD_FLUID_LOG";
export const DELETE_FOOD_FLUID_LOG = "DELETE_FOOD_FLUID_LOG";
export const EXPORT_RESIDENT_SAR = "EXPORT_RESIDENT_SAR";

import { EndpointDetails } from "../types";

const residentEndpoints: EndpointDetails = {
  [GET_RESIDENTS]: {
    endpoint: "/residents",
    requestType: "GET",
  },
  [GET_RESIDENT]: {
    endpoint: "/residents/[id]",
    requestType: "GET",
  },
  [DISCHARGE_RESIDENT]: {
    endpoint: "/residents/[id]/discharge",
    requestType: "PATCH",
  },
  [GET_RESIDENT_TIMELINE]: {
    endpoint: "/residents/[id]/timeline",
    requestType: "GET",
  },
  [CREATE_CARE_NOTE]: {
    endpoint: "/residents/[id]/notes",
    requestType: "POST",
  },
  [UPDATE_CARE_NOTE]: {
    endpoint: "/residents/[id]/notes/[noteId]",
    requestType: "PATCH",
  },
  [DELETE_CARE_NOTE]: {
    endpoint: "/residents/[id]/notes/[noteId]",
    requestType: "DELETE",
  },
  [GET_RESIDENT_MEDICATION_ROUNDS]: {
    endpoint: "/medications/residents/[id]",
    requestType: "GET",
  },
  [ADMINISTER_MEDICATION]: {
    endpoint: "/medications/administer",
    requestType: "POST",
  },
  [ADMINISTER_MEDICATION_ADHOC]: {
    endpoint: "/medications/residents/[id]/adhoc",
    requestType: "POST",
  },
  [CREATE_MEDICATION_ROUND]: {
    endpoint: "/medications/residents/[id]",
    requestType: "POST",
  },
  [CREATE_MEDICATION_ROUND_BULK]: {
    endpoint: "/medications/residents/[id]/bulk",
    requestType: "POST",
  },
  [GET_MEDICATION_PRESCRIPTIONS]: {
    endpoint: "/medications/residents/[id]/prescriptions",
    requestType: "GET",
  },
  [STOP_MEDICATION_PRESCRIPTION]: {
    endpoint: "/medications/prescriptions/[id]/stop",
    requestType: "POST",
  },
  [CHANGE_MEDICATION_PRESCRIPTION]: {
    endpoint: "/medications/prescriptions/[id]/change",
    requestType: "POST",
  },
  [PAUSE_MEDICATION_PRESCRIPTION]: {
    endpoint: "/medications/prescriptions/[id]/pause",
    requestType: "POST",
  },
  [UPDATE_MEDICATION_ROUND]: {
    endpoint: "/medications/[id]",
    requestType: "PATCH",
  },
  [DELETE_MEDICATION_ROUND]: {
    endpoint: "/medications/[id]",
    requestType: "DELETE",
  },
  [UPLOAD_MEDICATION_IMAGE]: {
    endpoint: "/medications/residents/[id]/upload-image",
    requestType: "POST",
  },
  [GET_RESIDENT_DOCUMENTS]: {
    endpoint: "/documents/residents/[id]",
    requestType: "GET",
  },
  [GET_DOCUMENT_UPLOAD_URL]: {
    endpoint: "/documents/residents/[id]/upload-url",
    requestType: "GET",
  },
  [UPLOAD_RESIDENT_DOCUMENT]: {
    endpoint: "/documents/residents/[id]/upload",
    requestType: "POST",
  },
  [SAVE_RESIDENT_DOCUMENT]: {
    endpoint: "/documents/residents/[id]",
    requestType: "POST",
  },
  [DELETE_RESIDENT_DOCUMENT]: {
    endpoint: "/documents/[id]",
    requestType: "DELETE",
  },
  [VERIFY_RESIDENT_DOCUMENT]: {
    endpoint: "/documents/[id]/verify",
    requestType: "PATCH",
  },
  [ARCHIVE_RESIDENT_DOCUMENT]: {
    endpoint: "/documents/[id]/archive",
    requestType: "PATCH",
  },
  [VIEW_RESIDENT_DOCUMENT]: {
    endpoint: "/documents/[id]/view",
    requestType: "GET",
  },
  [UPLOAD_RESIDENT_PHOTO]: {
    endpoint: "/residents/[id]/photo",
    requestType: "POST",
  },
  [UPLOAD_ADMISSION_PHOTO]: {
    endpoint: "/residents/admit/photo-upload",
    requestType: "POST",
  },
  [UPLOAD_ADMISSION_DOCUMENT]: {
    endpoint: "/residents/admit/document-upload",
    requestType: "POST",
  },
  [SUGGEST_CARERS]: {
    endpoint: "/residents/[id]/suggest-carers",
    requestType: "GET",
  },
  [ASSIGN_CARER]: {
    endpoint: "/residents/[id]/assign-carer",
    requestType: "POST",
  },
  [ASSIGN_BED]: {
    endpoint: "/residents/[id]/assign-bed",
    requestType: "POST",
  },
  [UPDATE_RESIDENT_PERSONAL_INFO]: {
    endpoint: "/residents/[id]/personal-info",
    requestType: "PATCH",
  },
  [UPDATE_RESIDENT_FUNDING]: {
    endpoint: "/residents/[id]/funding",
    requestType: "PATCH",
  },
  [UPDATE_RESIDENT_CARE_PROFILE]: {
    endpoint: "/residents/[id]/care-profile",
    requestType: "PATCH",
  },
  [UPDATE_RESIDENT_SUPPORTED_LIVING]: {
    endpoint: "/residents/[id]/supported-living",
    requestType: "PATCH",
  },
  [ADMIT_CONFIRM]: {
    endpoint: "/residents/admit/[id]/confirm",
    requestType: "POST",
  },
  [GET_RESIDENT_METRICS]: {
    endpoint: "/residents/metrics",
    requestType: "GET",
  },
  [GET_RESIDENT_INSIGHTS]: {
    endpoint: "/residents/insights",
    requestType: "GET",
  },
  [GET_EMERGENCY_DIRECTORY]: {
    endpoint: "/emergency-directory",
    requestType: "GET",
  },
  [GET_EMERGENCY_RESIDENT_SUMMARY]: {
    endpoint: "/emergency-directory/[id]",
    requestType: "GET",
  },
  [CREATE_FOOD_FLUID_LOG]: {
    endpoint: "/residents/[id]/food-fluid",
    requestType: "POST",
  },
  [GET_FOOD_FLUID_LOGS]: {
    endpoint: "/residents/[id]/food-fluid",
    requestType: "GET",
  },
  [EXPORT_RESIDENT_SAR]: {
    endpoint: "/data-rights/residents/[id]/sar-export",
    requestType: "GET",
  },
  [GET_FOOD_FLUID_SUMMARY]: {
    endpoint: "/residents/[id]/food-fluid/summary",
    requestType: "GET",
  },
  [UPDATE_FOOD_FLUID_LOG]: {
    endpoint: "/residents/[id]/food-fluid/[logId]",
    requestType: "PATCH",
  },
  [DELETE_FOOD_FLUID_LOG]: {
    endpoint: "/residents/[id]/food-fluid/[logId]",
    requestType: "DELETE",
  },
};

export default residentEndpoints;
