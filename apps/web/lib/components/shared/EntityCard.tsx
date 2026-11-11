"use client";

import React from "react";
import { Card, Badge, Text } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";

export interface EntityCardMetaItem {
  icon?: React.ReactNode;
  label?: string;
  value: React.ReactNode;
}

export interface EntityCardProps {
  // 1. Header
  avatar?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  headerBadge?: React.ReactNode;
  headerAction?: React.ReactNode;

  // 2. Meta rows (icon + label + text list)
  meta?: EntityCardMetaItem[];
  children?: React.ReactNode;

  // 3. Footer
  statusBadge?: React.ReactNode;
  statusText?: string;
  statusState?: "success" | "warning" | "danger" | "info" | "inactive";
  onStatusClick?: (e: React.MouseEvent) => void;
  actions?: React.ReactNode;

  // 4. Divider & Container behavior
  showRightDivider?: boolean;
  onClick?: () => void;
  className?: string;
}

export function EntityCard({
  avatar,
  title,
  subtitle,
  headerBadge,
  headerAction,
  meta,
  children,
  statusBadge,
  statusText,
  statusState = "success",
  onStatusClick,
  actions,
  showRightDivider = false,
  onClick,
  className,
}: EntityCardProps) {
  return (
    <div className="relative h-full flex flex-col">
      <Card
        variant="surface"
        onClick={onClick}
        className={cn(
          "p-5 flex flex-col justify-between h-full min-h-[200px] bg-white border border-slate-200/80 rounded-2xl shadow-xs transition-all font-sans relative",
          onClick && "cursor-pointer hover:border-slate-300 hover:shadow-sm",
          className
        )}
      >
        {/* 1. Header */}
        <div className="flex items-center gap-3">
          {avatar && <div className="shrink-0">{avatar}</div>}

          <div className="flex flex-col min-w-0 gap-0.5 flex-1">
            {typeof title === "string" ? (
              <Text size="md" weight="bold" className="text-slate-900 truncate">
                {title}
              </Text>
            ) : (
              title
            )}
            {subtitle && (
              typeof subtitle === "string" ? (
                <Text size="xs" weight="regular" subdued className="truncate text-slate-500">
                  {subtitle}
                </Text>
              ) : (
                subtitle
              )
            )}
          </div>

          {headerBadge && <div className="shrink-0">{headerBadge}</div>}
          {headerAction && (
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              {headerAction}
            </div>
          )}
        </div>

        {/* 2. Middle Meta Rows */}
        {(meta && meta.length > 0) || children ? (
          <div className="flex flex-col gap-2 pt-3 my-2 border-t border-slate-100 text-sm">
            {meta?.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-slate-600 min-w-0">
                {item.icon && <span className="text-emerald-800 shrink-0">{item.icon}</span>}
                {item.label && (
                  <Text size="xs" weight="medium" className="text-slate-500 shrink-0">
                    {item.label}:
                  </Text>
                )}
                <Text size="xs" className="text-slate-700 truncate">
                  {item.value}
                </Text>
              </div>
            ))}
            {children}
          </div>
        ) : null}

        {/* 3. Footer */}
        {(statusBadge || statusText || actions) && (
          <div className="flex items-center justify-between gap-1.5 pt-3 mt-auto border-t border-slate-100 min-w-0">
            <div>
              {statusBadge ? (
                statusBadge
              ) : statusText ? (
                onStatusClick ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusClick(e);
                    }}
                    className="cursor-pointer"
                  >
                    <Badge variant="secondary" state={statusState} className="shadow-none">
                      {statusText}
                    </Badge>
                  </button>
                ) : (
                  <Badge variant="secondary" state={statusState} className="shadow-none">
                    {statusText}
                  </Badge>
                )
              ) : null}
            </div>

            {actions && (
              <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                {actions}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Right Vertical Divider (rendered between cards when mapping) */}
      {showRightDivider && (
        <div
          aria-hidden="true"
          className="hidden lg:block absolute -right-2.5 top-4 bottom-4 w-[1px] bg-slate-200/90 pointer-events-none z-10"
        />
      )}
    </div>
  );
}
