"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Bell, Check, Clock } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from "@repo/ui/components/ui";
import { EntityListView } from "../../../lib/components/shared";
import { useListQueryState } from "../../../lib/hooks";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationHistory,
  type NotificationRow,
} from "../../../lib/queries/notifications";
import type { TableColumn } from "../../../lib/components/shared/tableColumns";

const NOTIFICATION_FILTERS = { status: "all" } as const;

function formatNotificationDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : format(date, "dd MMM yyyy, HH:mm");
}

export default function NotificationsPage() {
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationRow | null>(null);
  const {
    page,
    limit,
    search,
    searchInput,
    setSearchInput,
    filters,
    setFilter,
    handlePageChange,
    handleLimitChange,
    resetFilters,
  } = useListQueryState({
    filters: NOTIFICATION_FILTERS,
    storageKey: "notifications_page_size",
  });

  const isRead =
    filters.status === "read"
      ? true
      : filters.status === "unread"
        ? false
        : undefined;
  const { data, isLoading, isError } = useNotificationHistory({
    page,
    limit,
    search,
    isRead,
  });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const notifications = data?.data ?? [];
  const unreadOnPage = notifications.filter((notification) => !notification.isRead).length;

  const columns = useMemo<TableColumn<NotificationRow>[]>(
    () => [
      {
        id: "notification",
        header: "Notification",
        accessorKey: "title",
        cell: ({ row }) => (
          <div className="min-w-52 max-w-xl space-y-0.5 py-1">
            <Text size="md" weight="semibold" className="text-slate-900">
              {row.original.title}
            </Text>
            <Text size="md" className="line-clamp-2 whitespace-pre-wrap break-words text-slate-600">
              {row.original.message}
            </Text>
          </div>
        ),
      },
      {
        id: "category",
        header: "Category",
        accessorKey: "category",
      },
      {
        id: "priority",
        header: "Priority",
        accessorKey: "priority",
        cell: ({ row }) => <Badge variant="outline">{row.original.priority}</Badge>,
      },
      {
        id: "received",
        header: "Received",
        accessorKey: "createdAt",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-md text-slate-600">
            {formatNotificationDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "isRead",
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            state={row.original.isRead ? "inactive" : "info"}
          >
            {row.original.isRead ? "Read" : "Unread"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) =>
          row.original.isRead ? null : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                markRead.mutate(row.original.id);
              }}
              disabled={markRead.isPending}
            >
              <Check className="size-4" /> Mark read
            </Button>
          ),
      },
    ],
    [markRead],
  );

  const stats = (
    <div className="grid grid-cols-2 gap-3">
      <Card className="space-y-1 p-3 shadow-none">
        <Text size="md" variant="muted">Matching notifications</Text>
        <Text size="md" weight="bold" className="text-slate-900">
          {data?.total ?? 0}
        </Text>
      </Card>
      <Card className="space-y-1 p-3 shadow-none">
        <Text size="md" variant="muted">Unread on this page</Text>
        <Text size="md" weight="bold" className="text-emerald-800">
          {unreadOnPage}
        </Text>
      </Card>
    </div>
  );

  return (
    <>
      <EntityListView<NotificationRow>
        title="Notifications"
        description="Review updates and alerts sent to your account."
        overviewTitle={`Notification History${data ? ` (${data.total})` : ""}`}
        showViewToggle={false}
        viewMode="table"
        headerActions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={notifications.length === 0 || markAllRead.isPending}
          >
            <Check className="size-4" />
            {markAllRead.isPending ? "Marking..." : "Mark all as read"}
          </Button>
        }
        stats={stats}
        filters={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1 min-w-0 [&_[data-slot=input-error]]:hidden">
              <Input
                aria-label="Search notifications"
                placeholder="Search title or message..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-48 shrink-0">
              <Select
                value={filters.status ?? "all"}
                onValueChange={(value) => setFilter("status", value)}
              >
                <SelectTrigger aria-label="Filter notification status" className="w-full">
                  <SelectValue placeholder="All notifications" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All notifications</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="w-full sm:w-auto shrink-0"
            >
              Reset
            </Button>
          </div>
        }
        columns={columns}
        data={notifications}
        paginatedData={notifications}
        onRowClick={setSelectedNotification}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Error loading notifications. Please try again."
        emptyTitle="No notifications found"
        emptyDescription="Try changing your search or status filter."
        pagination={{
          currentPage: page,
          pageSize: limit,
          totalRecords: data?.total ?? 0,
          onPageChange: handlePageChange,
          onLimitChange: handleLimitChange,
          entityName: "notifications",
        }}
        className="space-y-4 pb-4"
      />

      <Dialog
        open={selectedNotification !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedNotification(null);
        }}
      >
        {selectedNotification && (
          <DialogContent size="md">
            <DialogHeader>
              <DialogTitle>{selectedNotification.title}</DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{selectedNotification.category}</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {formatNotificationDate(selectedNotification.createdAt)}
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{selectedNotification.priority}</Badge>
              <Badge
                variant="secondary"
                state={selectedNotification.isRead ? "inactive" : "info"}
              >
                {selectedNotification.isRead ? "Read" : "Unread"}
              </Badge>
            </div>
            <Text size="md" className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap break-words leading-relaxed text-slate-700">
              {selectedNotification.message}
            </Text>
            <DialogFooter>
              {!selectedNotification.isRead && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    markRead.mutate(selectedNotification.id);
                    setSelectedNotification({ ...selectedNotification, isRead: true });
                  }}
                  disabled={markRead.isPending}
                >
                  <Check className="size-4" /> Mark as read
                </Button>
              )}
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setSelectedNotification(null)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
