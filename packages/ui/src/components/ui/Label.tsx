"use client";

import * as React from "react";
import { Label as LabelPrimitive } from "radix-ui";
import { cn } from "@repo/ui/lib/utils";

import { RequiredIndicator } from "./RequiredIndicator";

export interface LabelProps
  extends React.ComponentProps<typeof LabelPrimitive.Root> {
  required?: boolean;
}

/**
 * Checks if a child element is already a required indicator or contains a dedicated asterisk.
 */
function hasTrailingAsteriskElement(child: React.ReactNode): boolean {
  if (React.isValidElement(child)) {
    const props = child.props as Record<string, unknown> | undefined;
    if (props?.["data-slot"] === "required-indicator") return true;
    if (typeof props?.children === "string" && props.children.trim() === "*") {
      return true;
    }
  }
  return false;
}

/**
 * Strips raw trailing asterisks from string labels so they can be rendered
 * with the standardized red RequiredIndicator component across the application.
 */
function processLabelChildren(
  children: React.ReactNode,
  explicitRequired?: boolean
): { nodes: React.ReactNode; isRequired: boolean } {
  let isRequired = Boolean(explicitRequired);

  const stripAsterisk = (str: string): { text: string; found: boolean } => {
    const match = str.match(/^(.*?)[\s\u00A0]*\*+[\s\u00A0]*$/);
    if (match) {
      return { text: match[1] ?? "", found: true };
    }
    return { text: str, found: false };
  };

  if (typeof children === "string") {
    const { text, found } = stripAsterisk(children);
    if (found) isRequired = true;
    return { nodes: text, isRequired };
  }

  if (Array.isArray(children)) {
    const newChildren = [...children];
    for (let i = newChildren.length - 1; i >= 0; i--) {
      const child = newChildren[i];
      if (typeof child === "string") {
        const { text, found } = stripAsterisk(child);
        if (found) {
          isRequired = true;
          if (text.trim() === "") {
            newChildren.splice(i, 1);
          } else {
            newChildren[i] = text;
          }
          break;
        }
      } else if (hasTrailingAsteriskElement(child)) {
        return { nodes: children, isRequired: false };
      }
    }
    return { nodes: newChildren, isRequired };
  }

  return { nodes: children, isRequired };
}

function Label({
  className,
  children,
  required = false,
  ...props
}: LabelProps) {
  const { nodes, isRequired } = processLabelChildren(children, required);

  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-0.5 text-slate-500 font-normal text-md select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 py-1",
        className,
      )}
      {...props}
    >
      {nodes}
      {isRequired && <RequiredIndicator />}
    </LabelPrimitive.Root>
  );
}

export { Label };

