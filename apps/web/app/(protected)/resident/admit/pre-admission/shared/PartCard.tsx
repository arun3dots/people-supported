"use client";

import type { ReactNode } from "react";
import { Text } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";

interface PartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/** Grey surface card used by every pre-admission part, matching the admission wizard cards. */
export function PartCard({
  title,
  description,
  children,
  className,
}: PartCardProps) {
  return (
    <div
      className={cn(
        "bg-surface-card-grey rounded-2xl p-6 space-y-4 shadow-none border-none font-sans",
        className,
      )}
    >
      <div className="pb-3 border-b border-slate-200/80">
        <Text as="h3" size="sm" weight="bold" className="text-slate-900 tracking-wider">
          {title}
        </Text>
        {description && (
          <Text size="sm" className="text-slate-600 mt-1">
            {description}
          </Text>
        )}
      </div>
      {children}
    </div>
  );
}

export function FieldGrid({
  children,
  cols = 2,
}: {
  children: ReactNode;
  cols?: 1 | 2 | 3;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-x-4 gap-y-1.5",
        cols === 2 && "sm:grid-cols-2",
        cols === 3 && "sm:grid-cols-3",
      )}
    >
      {children}
    </div>
  );
}
