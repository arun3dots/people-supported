"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { Text } from "./Text";
import { RequiredIndicator } from "./RequiredIndicator";

export interface InfoFieldProps {
  label: React.ReactNode;
  value?: React.ReactNode;
  subValue?: React.ReactNode;
  icon?: LucideIcon | React.ReactNode;
  iconClassName?: string;
  multiline?: boolean;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  subValueClassName?: string;
  children?: React.ReactNode;
  required?: boolean;
}

function renderIcon(
  icon?: LucideIcon | React.ReactNode,
  iconClassName?: string
): React.ReactNode {
  if (!icon) return null;
  if (React.isValidElement(icon)) {
    return icon;
  }
  if (typeof icon === "function" || (typeof icon === "object" && icon !== null)) {
    const IconComponent = icon as LucideIcon;
    return <IconComponent className={cn("w-4 h-4 text-slate-500", iconClassName)} />;
  }
  return icon;
}

export function InfoField({
  label,
  value,
  subValue,
  icon,
  iconClassName,
  multiline = false,
  className,
  labelClassName,
  valueClassName,
  subValueClassName,
  children,
  required = false,
}: InfoFieldProps) {
  const iconNode = renderIcon(icon, iconClassName);

  let displayLabel = label;
  let isRequired = required;
  if (typeof label === "string") {
    const match = label.match(/^(.*?)[\s\u00A0]*\*+[\s\u00A0]*$/);
    if (match) {
      displayLabel = match[1] ?? "";
      isRequired = true;
    }
  }

  const contentNode = (
    <div
      className={cn(
        "flex flex-col gap-[8px] min-w-0",
        icon ? "flex-1" : "w-full",
        !icon && className
      )}
    >
      <Text
        variant="subdued"
        weight="regular"
        size="md"
        className={cn("flex items-center gap-0.5 text-slate-500 font-normal", labelClassName)}
      >
        {displayLabel}
        {isRequired && <RequiredIndicator />}
      </Text>
      {children ? (
        children
      ) : (
        <>
          <Text
            variant="base"
            className={cn(multiline ? "break-words" : "truncate", valueClassName)}
            title={typeof value === "string" ? value : undefined}
            size="md"
            weight="regular"
            subdued={false}
          >
            {value ?? "-"}
          </Text>
          {subValue && (
            <Text
              className={cn(multiline ? "break-words" : "truncate", subValueClassName)}
              title={typeof subValue === "string" ? subValue : undefined}
              size="md"
              weight="regular"
              subdued={false}
            >
              {subValue}
            </Text>
          )}
        </>
      )}

    </div>
  );

  if (icon) {
    return (
      <div className={cn("flex items-start gap-[8px] w-full min-w-0", className)}>
        <div className="w-[16px] h-[16px] shrink-0 mt-[1px]">{iconNode}</div>
        {contentNode}
      </div>
    );
  }


  return contentNode;
}