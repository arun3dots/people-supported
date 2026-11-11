"use client";

import * as React from "react";
import { cn } from "@repo/ui/lib/utils";

export interface RequiredIndicatorProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string;
}

/**
 * Standardized Required Asterisk Indicator.
 * Renders a bold, red '*' symbol with consistent spacing and accessible attributes
 * across the entire application.
 */
export function RequiredIndicator({
  className,
  children = "*",
  ...props
}: RequiredIndicatorProps) {
  return (
    <span
      data-slot="required-indicator"
      className={cn("text-red-500 font-semibold ml-0.5 select-none", className)}
      aria-hidden="true"
      {...props}
    >
      {children}
    </span>
  );
}

// Convenient alias for developers
export const RequiredStar = RequiredIndicator;
