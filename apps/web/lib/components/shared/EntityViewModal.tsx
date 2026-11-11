"use client";

import React, { type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Badge,
  Button,
  InfoField,
  Text,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";

export interface EntityViewField {
  label: ReactNode;
  value?: ReactNode;
  subValue?: ReactNode;
  icon?: LucideIcon | ReactNode;
  multiline?: boolean;
  className?: string;
}

export interface EntityViewSection {
  id?: string;
  title?: string;
  description?: string;
  columns?: 1 | 2 | 3 | 4;
  fields: EntityViewField[];
}

export interface EntityViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  badge?: {
    label: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
    className?: string;
  };
  secondaryBadge?: {
    label: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
    className?: string;
  };
  sections?: EntityViewSection[];
  children?: ReactNode;
  footerActions?: ReactNode;
  size?: "sm" | "default" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  className?: string;
}

/**
 * Standardized Read-Only Entity View Modal.
 * Provides unified geometry, typography, and section styling across all LCM modules.
 */
export function EntityViewModal({
  open,
  onOpenChange,
  title,
  description,
  badge,
  secondaryBadge,
  sections,
  children,
  footerActions,
  size = "2xl",
  className,
}: EntityViewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size={size}
        className={cn(
          "max-h-[90vh] overflow-y-auto overflow-x-hidden p-6 sm:p-8 bg-white border border-slate-100 shadow-xl rounded-2xl gap-0 min-w-0",
          className
        )}
      >
        {/* ================= HEADER ================= */}
        <DialogHeader className="pb-4 border-b border-slate-100/90 text-left min-w-0 w-full">
          {(badge || secondaryBadge) && (
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {badge && (
                <span
                  className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-md text-md font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200",
                    badge.className
                  )}
                >
                  {badge.label}
                </span>
              )}
              {secondaryBadge && (
                <Badge
                  variant={secondaryBadge.variant ?? "outline"}
                  className={cn(
                    "text-md font-mono text-slate-600 border-slate-200",
                    secondaryBadge.className
                  )}
                >
                  {secondaryBadge.label}
                </Badge>
              )}
            </div>
          )}

          <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight leading-snug break-words break-all [overflow-wrap:anywhere]">
            {title}
          </DialogTitle>

          {description && (
            <DialogDescription className="text-md text-slate-500 mt-1 break-words break-all [overflow-wrap:anywhere]">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* ================= BODY ================= */}
        <div className="py-2.5 space-y-3 min-w-0 w-full">
          {sections &&
            sections.map((section, sIdx) => {
              const colClass =
                section.columns === 1
                  ? "grid-cols-1"
                  : section.columns === 3
                    ? "grid-cols-1 sm:grid-cols-3"
                    : section.columns === 4
                      ? "grid-cols-2 sm:grid-cols-4"
                      : "grid-cols-1 sm:grid-cols-2";

              return (
                <div
                  key={section.id ?? sIdx}
                  className="bg-slate-50/80 border border-slate-100/90 rounded-xl p-3.5 sm:p-4 min-w-0 overflow-hidden"
                >
                  {section.title && (
                    <Text
                      size="md"
                      weight="bold"
                      className="text-slate-900 mb-1"
                    >
                      {section.title}
                    </Text>
                  )}
                  {section.description && (
                    <Text
                      size="md"
                      weight="regular"
                      className="text-slate-500 mb-3 block"
                    >
                      {section.description}
                    </Text>
                  )}

                  <div className={cn("grid gap-3 min-w-0", colClass)}>
                    {section.fields.map((field, fIdx) => (
                      <InfoField
                        key={fIdx}
                        label={field.label}
                        value={field.value}
                        subValue={field.subValue}
                        icon={field.icon}
                        multiline={field.multiline}
                        className={cn("min-w-0 overflow-hidden", field.className)}
                        labelClassName="text-md font-medium text-slate-500"
                        valueClassName="text-md font-semibold text-slate-900 break-words break-all [overflow-wrap:anywhere]"
                        subValueClassName="text-md font-normal text-slate-500 break-words break-all [overflow-wrap:anywhere]"
                      />
                    ))}
                  </div>
                </div>
              );
            })}

          {children}
        </div>

        {/* ================= FOOTER ================= */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100/90 mt-2">
          {footerActions}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl px-5 h-9 text-md font-medium cursor-pointer"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
