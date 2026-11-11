import { EndpointDetails } from "../types";

export const GET_ALL_CARE_PLANS = "GET_ALL_CARE_PLANS";
export const GET_CARE_PLAN_DETAIL = "GET_CARE_PLAN_DETAIL";
export const CREATE_CARE_PLAN_WIZARD = "CREATE_CARE_PLAN_WIZARD";
export const RENEW_CARE_PLAN = "RENEW_CARE_PLAN";
export const UPDATE_CARE_PLAN_DRAFT = "UPDATE_CARE_PLAN_DRAFT";
export const SUBMIT_CARE_PLAN = "SUBMIT_CARE_PLAN";
export const DECIDE_CARE_PLAN_APPROVAL = "DECIDE_CARE_PLAN_APPROVAL";
export const GET_CARE_PLAN_DIFF = "GET_CARE_PLAN_DIFF";
export const GET_CARE_PLAN_GOALS = "GET_CARE_PLAN_GOALS";
export const CREATE_CARE_PLAN_GOAL = "CREATE_CARE_PLAN_GOAL";
export const UPDATE_CARE_PLAN_GOAL = "UPDATE_CARE_PLAN_GOAL";
export const DELETE_CARE_PLAN_GOAL = "DELETE_CARE_PLAN_GOAL";
export const GET_RESIDENT_CARE_PLAN = "GET_RESIDENT_CARE_PLAN";
export const GET_RESIDENT_CARE_PLAN_VERSIONS = "GET_RESIDENT_CARE_PLAN_VERSIONS";
export const GET_CARE_PLAN_AUDIT_LOG = "GET_CARE_PLAN_AUDIT_LOG";
export const EXPORT_CARE_PLAN_AUDIT_LOG = "EXPORT_CARE_PLAN_AUDIT_LOG";

export const CREATE_CARE_PLAN_TASK = "CREATE_CARE_PLAN_TASK";
export const GET_RESIDENT_CARE_PLAN_TASKS = "GET_RESIDENT_CARE_PLAN_TASKS";
export const UPDATE_CARE_PLAN_TASK = "UPDATE_CARE_PLAN_TASK";
export const DELETE_CARE_PLAN_TASK = "DELETE_CARE_PLAN_TASK";
export const GET_DAILY_TASKS = "GET_DAILY_TASKS";
export const UPDATE_DAILY_TASK_STATUS = "UPDATE_DAILY_TASK_STATUS";
export const UPDATE_TASK_STATUS = "UPDATE_DAILY_TASK_STATUS";
export const GENERATE_DAILY_TASKS = "GENERATE_DAILY_TASKS";
export const UPDATE_CARE_PLAN_MASTER = "UPDATE_CARE_PLAN_MASTER";
export const GET_CARER_SHIFT_TASKS = "GET_CARER_SHIFT_TASKS";
export const GET_CARER_ASSIGNED_RESIDENT_TASKS = "GET_CARER_ASSIGNED_RESIDENT_TASKS";
export const GET_CARE_PLAN_METRICS = "GET_CARE_PLAN_METRICS";

export const CREATE_CARE_PLAN_REVIEW = "CREATE_CARE_PLAN_REVIEW";
export const GET_CARE_PLAN_REVIEWS = "GET_CARE_PLAN_REVIEWS";
export const GET_RESIDENT_CARE_PLAN_REVIEWS = "GET_RESIDENT_CARE_PLAN_REVIEWS";
export const GET_HOSPITAL_TRANSFER_PACK = "GET_HOSPITAL_TRANSFER_PACK";

export const GET_CARE_PLAN_PDF = "GET_CARE_PLAN_PDF";
export const GET_CARE_PLAN_EXPORT_DATA = "GET_CARE_PLAN_EXPORT_DATA";
export const GET_CARE_PLAN_SECTIONS = "GET_CARE_PLAN_SECTIONS";
export const UPDATE_CARE_PLAN_SECTION = "UPDATE_CARE_PLAN_SECTION";
export const AUTO_DRAFT_CARE_PLAN = "AUTO_DRAFT_CARE_PLAN";

const carePlanEndpoints: EndpointDetails = {
  [GET_CARE_PLAN_PDF]: {
    requestType: "GET",
    endpoint: "/care-plan/[id]/pdf",
  },
  [GET_CARE_PLAN_EXPORT_DATA]: {
    requestType: "GET",
    endpoint: "/care-plan/[id]/export-data",
  },
  [GET_CARE_PLAN_SECTIONS]: {
    requestType: "GET",
    endpoint: "/care-plan/[id]/sections",
  },
  [UPDATE_CARE_PLAN_SECTION]: {
    requestType: "PUT",
    endpoint: "/care-plan/[id]/sections/[sectionName]",
  },
  [AUTO_DRAFT_CARE_PLAN]: {
    requestType: "POST",
    endpoint: "/care-plan/auto-draft/[residentId]",
  },
  [GET_HOSPITAL_TRANSFER_PACK]: {
    requestType: "GET",
    endpoint: "/care-plan/transfer-pack/[residentId]",
  },
  [CREATE_CARE_PLAN_REVIEW]: {
    requestType: "POST",
    endpoint: "/care-plan/[id]/reviews",
  },
  [GET_CARE_PLAN_REVIEWS]: {
    requestType: "GET",
    endpoint: "/care-plan/[id]/reviews",
  },
  [GET_RESIDENT_CARE_PLAN_REVIEWS]: {
    requestType: "GET",
    endpoint: "/care-plan/residents/[residentId]/reviews",
  },
  [GET_CARER_SHIFT_TASKS]: {
    requestType: "GET",
    endpoint: "/care-plan/carer/shift-tasks",
  },
  [GET_CARER_ASSIGNED_RESIDENT_TASKS]: {
    requestType: "GET",
    endpoint: "/care-plan/carer/assigned-resident-tasks",
  },
  [GET_ALL_CARE_PLANS]: {
    requestType: "GET",
    endpoint: "/care-plan",
  },
  [GET_CARE_PLAN_METRICS]: {
    requestType: "GET",
    endpoint: "/care-plan/metrics",
  },
  [GET_CARE_PLAN_DETAIL]: {
    requestType: "GET",
    endpoint: "/care-plan/[id]",
  },
  [CREATE_CARE_PLAN_WIZARD]: {
    requestType: "POST",
    endpoint: "/care-plan",
  },
  [RENEW_CARE_PLAN]: {
    requestType: "POST",
    endpoint: "/care-plan/[id]/renew",
  },
  [UPDATE_CARE_PLAN_DRAFT]: {
    requestType: "PATCH",
    endpoint: "/care-plan/[id]",
  },
  [SUBMIT_CARE_PLAN]: {
    requestType: "POST",
    endpoint: "/care-plan/[id]/submit",
  },
  [DECIDE_CARE_PLAN_APPROVAL]: {
    requestType: "POST",
    endpoint: "/care-plan/[id]/approvals/[approvalId]",
  },
  [GET_CARE_PLAN_DIFF]: {
    requestType: "GET",
    endpoint: "/care-plan/[id]/diff",
  },
  [GET_CARE_PLAN_GOALS]: {
    requestType: "GET",
    endpoint: "/care-plan/[id]/goals",
  },
  [CREATE_CARE_PLAN_GOAL]: {
    requestType: "POST",
    endpoint: "/care-plan/[id]/goals",
  },
  [UPDATE_CARE_PLAN_GOAL]: {
    requestType: "PATCH",
    endpoint: "/care-plan/goals/[goalId]",
  },
  [DELETE_CARE_PLAN_GOAL]: {
    requestType: "DELETE",
    endpoint: "/care-plan/goals/[goalId]",
  },
  [GET_RESIDENT_CARE_PLAN]: {
    requestType: "GET",
    endpoint: "/care-plan/residents/[residentId]",
  },
  [GET_RESIDENT_CARE_PLAN_VERSIONS]: {
    requestType: "GET",
    endpoint: "/care-plan/residents/[residentId]/versions",
  },
  [GET_CARE_PLAN_AUDIT_LOG]: {
    requestType: "GET",
    endpoint: "/care-plan/residents/[residentId]/audit-log",
  },
  [EXPORT_CARE_PLAN_AUDIT_LOG]: {
    requestType: "GET",
    endpoint: "/care-plan/residents/[residentId]/audit-log/export",
  },
  [UPDATE_CARE_PLAN_MASTER]: {
    requestType: "PATCH",
    endpoint: "/care-plan/residents/[residentId]",
  },
  [CREATE_CARE_PLAN_TASK]: {
    requestType: "POST",
    endpoint: "/care-plan/[id]/tasks",
  },
  [UPDATE_CARE_PLAN_TASK]: {
    requestType: "PATCH",
    endpoint: "/care-plan/tasks/[taskId]",
  },
  [DELETE_CARE_PLAN_TASK]: {
    requestType: "DELETE",
    endpoint: "/care-plan/tasks/[taskId]",
  },
  [GET_RESIDENT_CARE_PLAN_TASKS]: {
    requestType: "GET",
    endpoint: "/care-plan/residents/[residentId]/tasks",
  },
  [GET_DAILY_TASKS]: {
    requestType: "GET",
    endpoint: "/care-plan/daily-tasks",
  },
  [UPDATE_DAILY_TASK_STATUS]: {
    requestType: "PATCH",
    endpoint: "/care-plan/daily-tasks/[taskId]/status",
  },
  [GENERATE_DAILY_TASKS]: {
    requestType: "POST",
    endpoint: "/care-plan/generate-daily",
  },
};

export default carePlanEndpoints;
