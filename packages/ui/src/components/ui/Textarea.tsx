import * as React from "react";
import { cn } from "@repo/ui/lib/utils";

function Textarea({
  className,
  errorMessage,
  ...props
}: React.ComponentProps<"textarea"> & { errorMessage?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <textarea
        data-slot="textarea"
        className={cn(
          "flex min-h-[83px] w-full rounded-md border border-border-secondary bg-surface-neutral p-3 text-md text-text-body placeholder:text-text-description/50 outline-none focus-visible:outline-none focus-visible:border-border-primary focus-visible:ring-1 focus-visible:ring-surface-primary/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none",
          Boolean(errorMessage) && "border-border-error focus-visible:border-border-error focus-visible:ring-border-error/20",
          className,
        )}
        {...props}
      />
      <p
        data-slot="textarea-error"
        className={cn(
          "text-md text-text-error font-normal min-h-[18px] leading-tight transition-opacity duration-200 mt-1",
          errorMessage
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none select-none"
        )}
      >
        {errorMessage || "\u00A0"}
      </p>
    </div>
  );
}

export { Textarea };
