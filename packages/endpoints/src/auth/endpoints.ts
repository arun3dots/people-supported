import { EndpointDetails } from "../types";

export const LOGIN = "LOGIN";
export const AUTH_LOGIN = "LOGIN";
export const LOGOUT = "LOGOUT";
export const AUTH_LOGOUT = "LOGOUT";
export const MFA_VERIFY = "MFA_VERIFY";
export const AUTH_MFA_VERIFY = "MFA_VERIFY";
export const VERIFY_MFA = "MFA_VERIFY";
export const GET_SECURITY_STATE = "GET_SECURITY_STATE";
export const GENERATE_MFA = "GENERATE_MFA";
export const DISABLE_MFA = "DISABLE_MFA";
export const REQUEST_MFA_RESET = "REQUEST_MFA_RESET";
export const VERIFY_MFA_RESET = "VERIFY_MFA_RESET";
export const REFRESH = "REFRESH";
export const AUTH_REFRESH = "REFRESH";
export const CHANGE_PASSWORD = "CHANGE_PASSWORD";
export const RESEND_VERIFICATION = "RESEND_VERIFICATION";
export const FORGOT_PASSWORD = "FORGOT_PASSWORD";
export const VERIFY_OTP = "VERIFY_OTP";
export const RESET_PASSWORD_OTP = "RESET_PASSWORD_OTP";
export const AUTH_ME = "AUTH_ME";
export const ME = "AUTH_ME";
export const SWITCH_BRANCH = "SWITCH_BRANCH";
export const AUTH_SWITCH_BRANCH = "SWITCH_BRANCH";

const authEndpoints: EndpointDetails = {
  [LOGIN]: {
    endpoint: "/auth/login",
    requestType: "POST",
  },
  [LOGOUT]: {
    endpoint: "/auth/logout",
    requestType: "POST",
  },
  [GET_SECURITY_STATE]: {
    endpoint: "/auth/security-state",
    requestType: "GET",
  },
  [GENERATE_MFA]: {
    endpoint: "/auth/mfa/generate",
    requestType: "POST",
  },
  [MFA_VERIFY]: {
    endpoint: "/auth/mfa/verify",
    requestType: "POST",
  },
  [DISABLE_MFA]: {
    endpoint: "/auth/mfa/disable",
    requestType: "POST",
  },
  [REQUEST_MFA_RESET]: {
    endpoint: "/auth/mfa/reset-request",
    requestType: "POST",
  },
  [VERIFY_MFA_RESET]: {
    endpoint: "/auth/mfa/reset-verify",
    requestType: "POST",
  },
  [REFRESH]: {
    endpoint: "/auth/refresh",
    requestType: "POST",
  },
  [CHANGE_PASSWORD]: {
    endpoint: "/api/auth/change-password",
    requestType: "POST",
  },
  [RESEND_VERIFICATION]: {
    endpoint: "/api/auth/resend-verification",
    requestType: "POST",
  },
  [FORGOT_PASSWORD]: {
    endpoint: "/api/auth/forgot-password",
    requestType: "POST",
  },
  [VERIFY_OTP]: {
    endpoint: "/api/auth/verify-otp",
    requestType: "POST",
  },
  [RESET_PASSWORD_OTP]: {
    endpoint: "/api/auth/reset-password-otp",
    requestType: "POST",
  },
  [AUTH_ME]: {
    endpoint: "/auth/me",
    requestType: "POST",
  },
  [SWITCH_BRANCH]: {
    endpoint: "/auth/switch-branch",
    requestType: "POST",
  },
};

export default authEndpoints;
