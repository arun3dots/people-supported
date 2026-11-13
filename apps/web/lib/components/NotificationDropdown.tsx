"use client";

import {
  Bell,
  Clock,
  Info,
  Pill,
  ClipboardList,
  HeartPulse,
  ShieldAlert,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  Badge,
  Text,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui";
import {
  useNotifications,
  useMarkNotificationRead,
} from "../queries/notifications";
import type { NotificationRow } from "../queries/notifications";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@repo/ui/lib/utils";

export function NotificationDropdown() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: notifications = [], isLoading } = useNotifications();
  const { mutate: markAsRead } = useMarkNotificationRead();

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const role =
    user?.roleName?.toLowerCase() === "carer"
      ? "carer"
      : user?.roleName?.toLowerCase() === "nurse"
        ? "nurse"
        : "admin";

  const getIcon = (category: string, priority: string) => {
    switch (category?.toUpperCase()) {
      case "MEDICATION":
        return <Pill className="size-4 text-emerald-800" />;
      case "TASK":
        return <ClipboardList className="size-4 text-sky-600" />;
      case "CLINICAL":
        return (
          <HeartPulse
            className={cn(
              "size-4",
              priority === "Urgent" ? "text-red-600" : "text-amber-600"
            )}
          />
        );
      case "INCIDENT":
        return <ShieldAlert className="size-4 text-rose-600" />;
      case "ROTA":
      case "SHIFT":
        return <Calendar className="size-4 text-purple-600" />;
      default:
        return <Info className="size-4 text-slate-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return "bg-red-100 text-red-700 border-red-200";
      case "High":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const resolveTargetUrl = (notification: NotificationRow): string => {
    const meta = notification.metadata ?? {};
    const residentId = typeof meta.residentId === "string" ? meta.residentId : undefined;
    const carePlanId = typeof meta.carePlanId === "string" ? meta.carePlanId : undefined;
    const tab = typeof meta.tab === "string" ? meta.tab : undefined;
    const escalationId = typeof meta.escalationId === "string" ? meta.escalationId : undefined;
    const category = notification.category?.toUpperCase();
    const actionUrl = notification.actionUrl || "";

    // 1. Direct explicit actionUrl parsing
    if (actionUrl) {
      if (actionUrl.includes("escalation") || actionUrl.includes("/admin/escalations")) {
        return "/admin/escalations";
      }

      if (actionUrl.includes("riskassessment") || actionUrl.includes("tab=riskassessment")) {
        const match = actionUrl.match(/\/residents\/([a-zA-Z0-9-]+)/);
        const resId = match ? match[1] : residentId;
        if (resId) return `/admin/residents/${resId}?tab=riskassessment`;
      }

      // Normalize /residents/:id/medication -> /admin/residents/:id?tab=mar
      if (actionUrl.includes("/medication")) {
        const match = actionUrl.match(/\/residents\/([a-zA-Z0-9-]+)/);
        const resId = match ? match[1] : residentId;
        if (resId) return `/${role}/residents/${resId}?tab=mar`;
      }

      // Normalize /residents/:id/tasks -> /admin/residents/:id?tab=careplan
      if (actionUrl.includes("/tasks")) {
        const match = actionUrl.match(/\/residents\/([a-zA-Z0-9-]+)/);
        const resId = match ? match[1] : residentId;
        if (resId) {
          return role === "admin"
            ? `/admin/residents/${resId}?tab=careplan`
            : `/${role}/residents/${resId}`;
        }
      }

      // Normalize /residents/:id/observations
      if (actionUrl.includes("/observations")) {
        const match = actionUrl.match(/\/residents\/([a-zA-Z0-9-]+)/);
        const resId = match ? match[1] : residentId;
        if (resId) return `/${role}/residents/${resId}?tab=observations`;
      }

      // If already an absolute route starting with /admin or /carer
      if (actionUrl.startsWith("/admin") || actionUrl.startsWith("/carer") || actionUrl.startsWith("/nurse")) {
        return actionUrl;
      }

      // Standardize relative prefix
      if (actionUrl.startsWith("/residents/")) {
        const resId = actionUrl.replace("/residents/", "").split("/")[0];
        return `/${role}/residents/${resId}`;
      }

      return actionUrl.startsWith("/") ? `/${role}${actionUrl}` : `/${role}/${actionUrl}`;
    }

    // 2. Category & Metadata intelligent resolution
    if (tab === "riskassessment" && residentId) {
      return `/admin/residents/${residentId}?tab=riskassessment`;
    }

    if (tab === "escalations" || escalationId) {
      return `/admin/escalations`;
    }

    switch (category) {
      case "MEDICATION":
        if (residentId) {
          return `/${role}/residents/${residentId}?tab=mar`;
        }
        return `/${role}/residents`;

      case "TASK":
        if (carePlanId && role === "admin") {
          return `/admin/care-plans/${carePlanId}`;
        }
        if (residentId) {
          return role === "admin"
            ? `/admin/residents/${residentId}?tab=careplan`
            : `/${role}/residents/${residentId}`;
        }
        return role === "admin" ? `/admin/care-plans/daily-tasks` : `/${role}/dashboard`;

      case "CLINICAL":
        if (residentId) {
          return `/${role}/residents/${residentId}?tab=observations`;
        }
        return `/${role}/residents`;

      case "INCIDENT":
        return role === "admin" ? `/admin/incidents` : `/${role}/dashboard`;

      case "ROTA":
      case "SHIFT":
        return `/${role}/rota`;

      default:
        if (residentId) {
          return `/${role}/residents/${residentId}`;
        }
        return `/${role}/dashboard`;
    }
  };

  const handleNotificationClick = (notification: NotificationRow) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    const targetUrl = resolveTargetUrl(notification);
    if (targetUrl) {
      router.push(targetUrl);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-md font-bold text-white ring-2 ring-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-white shadow-xl rounded-2xl border-slate-200" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h4 className="text-md font-semibold text-slate-900">Notifications</h4>
          {unreadCount > 0 && (
            <Badge variant="outline" className="text-md font-medium bg-emerald-50 text-emerald-800 border-emerald-200">
              {unreadCount} New
            </Badge>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-8 text-center text-md text-muted-foreground">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="size-8 mx-auto text-muted-foreground/20 mb-2" />
              <p className="text-md text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "flex gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 w-full cursor-pointer",
                    !notification.isRead && "bg-emerald-50/20 font-medium"
                  )}
                >
                  <div className="mt-1 shrink-0">
                    <div className="flex size-8 items-center justify-center rounded-full bg-slate-50 border border-slate-200 shadow-xs">
                      {getIcon(notification.category, notification.priority)}
                    </div>
                  </div>
                  <div className="flex-1 space-y-1 overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Text size="md" weight="semibold" className="truncate">
                            {notification.title}
                          </Text>
                        </TooltipTrigger>
                        <TooltipContent
                          side="left"
                          className="z-[100] max-w-xs break-words bg-slate-900 text-white border border-slate-800 shadow-lg px-3 py-2 text-xs leading-relaxed rounded-lg"
                        >
                          {notification.title}
                        </TooltipContent>
                      </Tooltip>
                      <span className="text-md  text-muted-foreground flex items-center gap-1 shrink-0">
                        <Clock className="size-3" />
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-md text-slate-600 line-clamp-2 leading-relaxed">
                          {notification.message}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent
                        side="left"
                        className="z-[100] max-w-xs break-words bg-slate-900 text-white border border-slate-800 shadow-lg px-3 py-2 text-xs leading-relaxed rounded-lg"
                      >
                        {notification.message}
                      </TooltipContent>
                    </Tooltip>
                    <div className="flex items-center gap-2 pt-1">
                      <Badge variant="outline" className={cn("text-md  px-1.5 py-0 font-normal", getPriorityColor(notification.priority))}>
                        {notification.priority}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-slate-200 p-2">
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-between text-md font-semibold text-emerald-800 hover:bg-emerald-50"
            onClick={() => router.push("/notifications")}
          >
            View All Notifications
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
