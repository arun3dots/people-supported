"use client";

import React from "react";
import { format } from "date-fns";
import type { LucideIcon } from "lucide-react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  Badge,
  Text,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import { TextTone, BadgeState } from "./tableColumns";

/* ------------------------------------------------------------------ */
/* Central formatters (replaces per-domain formatDateLabel/formatCurr) */
/* ------------------------------------------------------------------ */

export function formatDateLabel(dateStr?: string | Date | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "—" : format(d, "dd MMM yyyy");
  } catch {
    return "—";
  }
}

export function formatCurrency(
  amount?: number | null,
  currencyCode: "GBP" | "USD" = "GBP",
): string {
  if (amount == null || isNaN(amount)) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(amount);
}

/* ------------------------------------------------------------------ */
/* Central kind cell renderers                                        */
/* ------------------------------------------------------------------ */

export function IndexCell({ rowIndex }: { rowIndex: number }) {
  return (
    <Text size="md" weight="regular" className="text-slate-500">
      {rowIndex}
    </Text>
  );
}

export function TextCell({
  value,
  tone = "default",
  fallback = "—",
  truncate = false,
  className,
}: {
  value: unknown;
  tone?: TextTone;
  fallback?: string;
  truncate?: boolean;
  className?: string;
}) {
  const text = value == null || value === "" ? fallback : String(value);
  switch (tone) {
    case "secondary":
      return (
        <Text size="md" weight="regular" className={cn("text-slate-800", className)}>
          {text}
        </Text>
      );
    case "muted":
      return (
        <Text size="md" weight="regular" className={cn("text-slate-500", className)}>
          {text}
        </Text>
      );
    case "clamped":
      return (
        <Text
          size="md"
          weight="regular"
          className={cn("text-slate-600 line-clamp-1", className)}
        >
          {text}
        </Text>
      );
    case "strong":
      return (
        <Text size="md" weight="bold" className={cn("text-slate-900", className)}>
          {text}
        </Text>
      );
    case "default":
    default:
      return (
        <Text
          size="md"
          weight="regular"
          className={cn(truncate ? "truncate" : "", className)}
        >
          {text}
        </Text>
      );
  }
}

export function DateCell({
  value,
  fallback = "—",
  format: formatStr = "dd MMM yyyy",
  emphasized = false,
}: {
  value: unknown;
  fallback?: string;
  format?: string;
  /** Render larger primary text (sm/slate-700) instead of muted xs. */
  emphasized?: boolean;
}) {
  let text = fallback;
  if (value != null && value !== "") {
    try {
      const d = value instanceof Date ? value : new Date(String(value));
      if (!isNaN(d.getTime())) text = format(d, formatStr);
    } catch {
      text = fallback;
    }
  }
  if (emphasized) {
    return (
      <Text size="md" weight="regular">
        {text}
      </Text>
    );
  }
  return (
    <Text size="md" weight="regular">
      {text}
    </Text>
  );
}

export function CurrencyCell({
  value,
  currencyCode = "GBP",
  fallback = "—",
  accent = false,
}: {
  value: unknown;
  currencyCode?: "GBP" | "USD";
  fallback?: string;
  /** Render in emerald-800 (income) instead of slate-900. */
  accent?: boolean;
}) {
  const text =
    value == null || value === "" ? fallback : formatCurrency(Number(value), currencyCode);
  return (
    <Text
      size="md"
      weight="bold"
      className={accent ? "text-emerald-800" : "text-slate-900"}
    >
      {text}
    </Text>
  );
}

export function CountCell({
  value,
  icon: Icon,
  fallback = "0",
}: {
  value: unknown;
  icon?: LucideIcon;
  fallback?: string;
}) {
  const text = value == null || value === "" ? fallback : String(value);
  return (
    <div className="flex items-center gap-1.5">
      {Icon && <Icon className="size-3.5 text-emerald-800 shrink-0" />}
      <Text size="md" weight="regular">
        {text}
      </Text>
    </div>
  );
}

export function ReferenceCell({ value, fallback = "—" }: { value: unknown; fallback?: string }) {
  const text = value == null || value === "" ? fallback : String(value);
  return (
    <Badge
      variant="secondary"
      state="inactive"
      className="font-mono px-2.5 py-0.5 shadow-none"
    >
      {text}
    </Badge>
  );
}

export function BadgeCell({
  label,
  state,
}: {
  label: string;
  state: BadgeState;
}) {
  return (
    <Badge variant="secondary" state={state} className="px-2.5 py-0.5 shadow-none">
      {label}
    </Badge>
  );
}

export function PersonCell({
  title,
  subtitle,
  initials,
  avatar = true,
  dotColor,
  imageUrl,
  avatarClassName,
  fallbackClassName,
  maxWidthClassName,
}: {
  title: string;
  subtitle?: string | null;
  initials?: string;
  avatar?: boolean;
  /** Optional status dot colour class rendered before the title. */
  dotColor?: string;
  imageUrl?: string | null;
  avatarClassName?: string;
  fallbackClassName?: string;
  maxWidthClassName?: string;
}) {
  const shown = title || "—";
  const letter = initials ?? (shown.trim().charAt(0).toUpperCase() || "?");
  return (
    <div className={maxWidthClassName ?? "max-w-56"}>
      <div className="flex items-center gap-3 min-w-0">
        {dotColor && (
          <span className={cn("size-2.5 rounded-full shrink-0", dotColor)} />
        )}
        {avatar && (
          <Avatar
            className={
              avatarClassName ??
              "size-11 border border-slate-200 shrink-0 bg-surface-primary-light"
            }
          >
            {imageUrl && (
              <AvatarImage
                src={imageUrl}
                alt={shown}
                className="object-cover"
              />
            )}
            <AvatarFallback
              className={
                fallbackClassName ??
                "bg-surface-primary-light text-icon-primary font-bold text-base"
              }
            >
              {letter}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="flex flex-col min-w-0 gap-0.5">
          <Text size="md" className="truncate ">
            {shown}
          </Text>
          {subtitle && (
            <Text size="md" weight="regular" className=" truncate">
              {subtitle}
            </Text>
          )}
        </div>
      </div>
    </div>
  );
}
