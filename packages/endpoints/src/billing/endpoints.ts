import { EndpointDetails } from "../types";

export const GET_BILLING_STATUS = "GET_BILLING_STATUS";
export const GET_PAYMENT_LINK = "GET_PAYMENT_LINK";
export const MANUAL_CONFIRM_PAYMENT = "MANUAL_CONFIRM_PAYMENT";
export const GET_BILLING_PAYMENTS = "GET_BILLING_PAYMENTS";
export const SELECT_PACKAGE = "SELECT_PACKAGE";
/** In-app checkout: create/fetch a Razorpay Order for authenticated users. */
export const CREATE_ORDER = "CREATE_ORDER";
/** In-app checkout: fetch a Razorpay Order by token (unauthenticated). */
export const OPEN_ORDER = "OPEN_ORDER";
/** In-app checkout: verify HMAC + activate subscription. */
export const VERIFY_PAYMENT = "VERIFY_PAYMENT";

const billingEndpoints: EndpointDetails = {
  [GET_BILLING_STATUS]: {
    endpoint: "/billing/status",
    requestType: "GET",
  },
  [SELECT_PACKAGE]: {
    endpoint: "/billing/select-package",
    requestType: "POST",
  },
  [GET_BILLING_PAYMENTS]: {
    endpoint: "/billing/payments",
    requestType: "GET",
  },
  [GET_PAYMENT_LINK]: {
    endpoint: "/billing/payment-link",
    requestType: "POST",
  },
  [MANUAL_CONFIRM_PAYMENT]: {
    endpoint: "/payments/manual-confirm",
    requestType: "POST",
  },
  [CREATE_ORDER]: {
    endpoint: "/billing/create-order",
    requestType: "POST",
  },
  [OPEN_ORDER]: {
    endpoint: "/payments/open-order",
    requestType: "POST",
  },
  [VERIFY_PAYMENT]: {
    endpoint: "/payments/verify-payment",
    requestType: "POST",
  },
};

export default billingEndpoints;

