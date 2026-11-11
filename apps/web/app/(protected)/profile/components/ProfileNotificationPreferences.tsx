"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@repo/ui/components/ui/Card";
import { Text } from "@repo/ui/components/ui/Text";
import { cn } from "@repo/ui/lib/utils";
import {
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} from "../../../../lib/queries/notifications";

interface Channel {
  label: string;
  field: "emailEnabled" | "smsEnabled" | "pushEnabled" | "webEnabled";
}

const DELIVERY_CHANNELS: Channel[] = [
  { label: "Email", field: "emailEnabled" },
  { label: "In-App", field: "webEnabled" },
  { label: "SMS", field: "smsEnabled" },
  { label: "Mobile Push", field: "pushEnabled" },
];

/** Round radio-style indicator. Clicking is handled by the parent row. */
function RoundIndicator({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-4 shrink-0 place-content-center rounded-full border-2 transition-colors",
        checked ? "border-[#4A706A]" : "border-slate-400",
      )}
    >
      <span
        className={cn(
          "block size-2.5 rounded-full transition-colors",
          checked ? "bg-[#4A706A]" : "bg-transparent",
        )}
      />
    </span>
  );
}

export function ProfileNotificationPreferences() {
  const { data: prefs } = useGetNotificationPreferencesQuery();
  const prefsMutation = useUpdateNotificationPreferencesMutation();

  const handleToggle = (
    field: Channel["field"],
    checked: boolean,
  ) => {
    prefsMutation.mutate({ [field]: checked });
  };

  return (
    <Card variant="default" className="w-full">
      {/* ==================== HEADER ==================== */}
      <CardHeader className="pb-5 border-b">
        <CardTitle>Notification Delivery Channels</CardTitle>
        <CardDescription>
          Choose how you want to be notified.
        </CardDescription>
      </CardHeader>

      {/* ==================== CONTENT BODY ==================== */}
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-5">
          {DELIVERY_CHANNELS.map((channel) => (
            <button
              key={channel.field}
              type="button"
              role="checkbox"
              aria-checked={!!prefs?.[channel.field]}
              onClick={() =>
                handleToggle(channel.field, !prefs?.[channel.field])
              }
              className="flex items-center gap-2.5 cursor-pointer select-none"
            >
              <RoundIndicator checked={!!prefs?.[channel.field]} />
              <Text size="md" className="whitespace-nowrap">
                {channel.label}
              </Text>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
