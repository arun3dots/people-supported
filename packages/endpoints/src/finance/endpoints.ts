import { EndpointDetails } from "../types";

export const GET_FINANCE_STATS = "GET_FINANCE_STATS";
export const GET_INVOICES = "GET_INVOICES";
export const GET_INVOICE_BY_ID = "GET_INVOICE_BY_ID";
export const CREATE_INVOICE = "CREATE_INVOICE";
export const UPDATE_INVOICE = "UPDATE_INVOICE";
export const DELETE_INVOICE = "DELETE_INVOICE";
export const GET_PAYMENTS = "GET_PAYMENTS";
export const RECORD_PAYMENT = "RECORD_PAYMENT";
export const GET_EXPENSES = "GET_EXPENSES";
export const CREATE_EXPENSE = "CREATE_EXPENSE";
export const UPDATE_EXPENSE = "UPDATE_EXPENSE";

const financeEndpoints: EndpointDetails = {
  [GET_FINANCE_STATS]: {
    endpoint: "/finance/stats",
    requestType: "GET",
  },
  [GET_INVOICES]: {
    endpoint: "/finance/invoices",
    requestType: "GET",
  },
  [GET_INVOICE_BY_ID]: {
    endpoint: "/finance/invoices/[id]",
    requestType: "GET",
  },
  [CREATE_INVOICE]: {
    endpoint: "/finance/invoices",
    requestType: "POST",
  },
  [UPDATE_INVOICE]: {
    endpoint: "/finance/invoices/[id]",
    requestType: "PATCH",
  },
  [DELETE_INVOICE]: {
    endpoint: "/finance/invoices/[id]",
    requestType: "DELETE",
  },
  [GET_PAYMENTS]: {
    endpoint: "/finance/payments",
    requestType: "GET",
  },
  [RECORD_PAYMENT]: {
    endpoint: "/finance/payments",
    requestType: "POST",
  },
  [GET_EXPENSES]: {
    endpoint: "/finance/expenses",
    requestType: "GET",
  },
  [CREATE_EXPENSE]: {
    endpoint: "/finance/expenses",
    requestType: "POST",
  },
  [UPDATE_EXPENSE]: {
    endpoint: "/finance/expenses/[id]",
    requestType: "PATCH",
  },
};

export default financeEndpoints;
