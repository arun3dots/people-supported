import { EndpointDetails } from "../types";

export const REGISTER_DEVICE_TOKEN = "REGISTER_DEVICE_TOKEN";
export const registerDeviceToken = "registerDeviceToken";
export const GET_NOTIFICATIONS = "GET_NOTIFICATIONS";
export const getNotifications = "getNotifications";
export const MARK_NOTIFICATION_AS_READ = "MARK_NOTIFICATION_AS_READ";
export const markNotificationAsRead = "markNotificationAsRead";
export const MARK_ALL_NOTIFICATIONS_READ = "MARK_ALL_NOTIFICATIONS_READ";
export const markAllNotificationsRead = "markAllNotificationsRead";

const notificationEndpoints: EndpointDetails = {
  [REGISTER_DEVICE_TOKEN]: {
    endpoint: "/notifications/device-token",
    requestType: "POST",
  },
  registerDeviceToken: {
    endpoint: "/notifications/device-token",
    requestType: "POST",
  },
  [GET_NOTIFICATIONS]: {
    endpoint: "/notifications",
    requestType: "GET",
  },
  getNotifications: {
    endpoint: "/notifications",
    requestType: "GET",
  },
  [MARK_NOTIFICATION_AS_READ]: {
    endpoint: "/notifications/[id]/read",
    requestType: "PATCH",
  },
  markNotificationAsRead: {
    endpoint: "/notifications/[id]/read",
    requestType: "PATCH",
  },
  [MARK_ALL_NOTIFICATIONS_READ]: {
    endpoint: "/notifications/read-all",
    requestType: "PATCH",
  },
  markAllNotificationsRead: {
    endpoint: "/notifications/read-all",
    requestType: "PATCH",
  },
  subscribeToPush: {
    endpoint: "/notifications/subscribe",
    requestType: "POST",
  },
  getNotificationPreferences: {
    endpoint: "/notifications/preferences",
    requestType: "GET",
  },
  updateNotificationPreferences: {
    endpoint: "/notifications/preferences",
    requestType: "PATCH",
  },
};

export default notificationEndpoints;
