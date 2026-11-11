"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";

import { cn } from "@repo/ui/lib/utils";

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default";
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer p-0.5",
        "data-[size=default]:h-6 data-[size=default]:w-11 data-[size=sm]:h-4 data-[size=sm]:w-8",
        "data-[state=checked]:bg-surface-primary data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-slate-700",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-white shadow-md ring-0 transition-transform",
          "group-data-[size=default]/switch:size-5 group-data-[size=sm]/switch:size-3",
          "data-[state=checked]:group-data-[size=default]/switch:translate-x-5 data-[state=checked]:group-data-[size=sm]/switch:translate-x-4 data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
