import { EndpointDetails } from "../types";

export const CREATE_ASSESSMENT = "CREATE_ASSESSMENT";
export const GET_ASSESSMENT = "GET_ASSESSMENT";
export const SAVE_ASSESSMENT = "SAVE_ASSESSMENT";
export const COMPLETE_ASSESSMENT = "COMPLETE_ASSESSMENT";
export const LIST_NEED_CARE_PLANS = "LIST_NEED_CARE_PLANS";
export const CREATE_NEED_CARE_PLAN = "CREATE_NEED_CARE_PLAN";
export const SAVE_NEED_CARE_PLAN = "SAVE_NEED_CARE_PLAN";
export const AGREE_NEED_CARE_PLAN = "AGREE_NEED_CARE_PLAN";
export const LIST_CARE_TASK_DEFINITIONS = "LIST_CARE_TASK_DEFINITIONS";
export const CREATE_CARE_TASK = "CREATE_CARE_TASK";
export const UPDATE_CARE_TASK = "UPDATE_CARE_TASK";
export const GET_CARE_TASK_DAY = "GET_CARE_TASK_DAY";
export const RECORD_CARE_TASK = "RECORD_CARE_TASK";
export const UNDO_CARE_TASK = "UNDO_CARE_TASK";
export const CREATE_SHIFT_NOTE = "CREATE_SHIFT_NOTE";

const careJourneyEndpoints: EndpointDetails = {
  [CREATE_ASSESSMENT]: {
    endpoint: "/residents/[id]/assessment",
    requestType: "POST",
  },
  [GET_ASSESSMENT]: {
    endpoint: "/residents/[id]/assessment",
    requestType: "GET",
  },
  [SAVE_ASSESSMENT]: {
    endpoint: "/residents/[id]/assessment",
    requestType: "PATCH",
  },
  [COMPLETE_ASSESSMENT]: {
    endpoint: "/residents/[id]/assessment/complete",
    requestType: "POST",
  },
  [LIST_NEED_CARE_PLANS]: {
    endpoint: "/residents/[id]/need-care-plans",
    requestType: "GET",
  },
  [CREATE_NEED_CARE_PLAN]: {
    endpoint: "/residents/[id]/need-care-plans",
    requestType: "POST",
  },
  [SAVE_NEED_CARE_PLAN]: {
    endpoint: "/residents/[id]/need-care-plans/[planId]",
    requestType: "PATCH",
  },
  [AGREE_NEED_CARE_PLAN]: {
    endpoint: "/residents/[id]/need-care-plans/[planId]/agree",
    requestType: "POST",
  },
  [LIST_CARE_TASK_DEFINITIONS]: {
    endpoint: "/residents/[id]/care-tasks",
    requestType: "GET",
  },
  [CREATE_CARE_TASK]: {
    endpoint: "/residents/[id]/need-care-plans/[planId]/tasks",
    requestType: "POST",
  },
  [UPDATE_CARE_TASK]: {
    endpoint: "/residents/[id]/care-tasks/[taskId]",
    requestType: "PATCH",
  },
  [GET_CARE_TASK_DAY]: {
    endpoint: "/residents/[id]/care-tasks/day",
    requestType: "GET",
  },
  [RECORD_CARE_TASK]: {
    endpoint: "/residents/[id]/care-tasks/[taskId]/record",
    requestType: "POST",
  },
  [UNDO_CARE_TASK]: {
    endpoint: "/residents/[id]/care-tasks/[taskId]/undo",
    requestType: "POST",
  },
  [CREATE_SHIFT_NOTE]: {
    endpoint: "/residents/[id]/shift-notes",
    requestType: "POST",
  },
};

export default careJourneyEndpoints;
