"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { Text } from "./Text";
import { Button } from "./Button";

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: React.ReactNode;
  variant?: "primary" | "outline" | "secondary" | "ghost";
  className?: string;
}

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: EmptyStateAction | React.ReactNode;
  iconContainerClassName?: string;
}

export function DefaultEmptyClipboardIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-10", className)}
    >
      {/* Clipboard Board */}
      <rect
        x="11"
        y="10"
        width="26"
        height="32"
        rx="4"
        fill="#FFFFFF"
        stroke="#2D5B54"
        strokeWidth="2.5"
      />
      {/* Clip at the top */}
      <path
        d="M19 10V8C19 6.89543 19.8954 6 21 6H27C28.1046 6 29 6.89543 29 8V10"
        stroke="#2D5B54"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Checklist Item 1: green check dot + line */}
      <circle cx="18" cy="20" r="1.5" fill="#10B981" />
      <path
        d="M23 20H31"
        stroke="#CBD5E1"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Checklist Item 2: green check dot + line */}
      <circle cx="18" cy="26" r="1.5" fill="#10B981" />
      <path
        d="M23 26H31"
        stroke="#CBD5E1"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Checklist Item 3: grey dot + line */}
      <circle cx="18" cy="32" r="1.5" fill="#CBD5E1" />
      <path
        d="M23 32H28"
        stroke="#E2E8F0"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EmptyState({
  icon,
  title = "No recent care activity",
  description = "Care activity will appear here as they are recorded.",
  action,
  iconContainerClassName,
  className,
  children,
  ...props
}: EmptyStateProps) {
  const isActionObject =
    action && typeof action === "object" && "label" in action && !React.isValidElement(action);

  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center text-center p-6 sm:p-8 w-full max-w-lg mx-auto select-none",
        className
      )}
      {...props}
    >
      {/* Circular Badge Icon Container */}
      <div
        className={cn(
          "size-20 rounded-full bg-[#E8F3F1] flex items-center justify-center mb-4 shrink-0 transition-transform",
          iconContainerClassName
        )}
      >
        {icon ?? <DefaultEmptyClipboardIcon />}
      </div>

      {/* Title */}
      {title && (
        <Text
          as="h3"
          size="lg"
          weight="regular"
          className="text-slate-800 tracking-tight leading-snug mb-1.5"
        >
          {title}
        </Text>
      )}

      {/* Description */}
      {description && (
        <Text
          size="sm"
          weight="regular"
          className="text-slate-500 max-w-sm leading-relaxed mb-5"
        >
          {description}
        </Text>
      )}

      {/* Optional Action Button or Custom Action */}
      {isActionObject ? (
        (() => {
          const act = action as EmptyStateAction;
          const buttonContent = (
            <>
              {act.icon ?? <Plus className="size-4 text-emerald-800" />}
              <span>{act.label}</span>
            </>
          );

          if (act.href) {
            return (
              <Button
                asChild
                variant={act.variant ?? "outline"}
                size="sm"
                className={cn(
                  "rounded-xl border-emerald-300 text-emerald-800 hover:bg-emerald-50/70 font-semibold px-4 py-2 gap-2 cursor-pointer shadow-none",
                  act.className
                )}
              >
                <a href={act.href}>{buttonContent}</a>
              </Button>
            );
          }

          return (
            <Button
              type="button"
              onClick={act.onClick}
              variant={act.variant ?? "outline"}
              size="sm"
              className={cn(
                "rounded-xl border-emerald-300 text-emerald-800 hover:bg-emerald-50/70 font-semibold px-4 py-2 gap-2 cursor-pointer shadow-none",
                act.className
              )}
            >
              {buttonContent}
            </Button>
          );
        })()
      ) : React.isValidElement(action) ? (
        action
      ) : null}

      {children}
    </div>
  );
}
