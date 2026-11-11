"use client";

import { ReactNode } from "react";
import { useSidebar } from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";

export function MainContentShell({ children }: { children: ReactNode }) {
  const { state } = useSidebar();

  return (
    <main
      className={cn(
        "flex-1 overflow-auto py-4 px-4 sm:px-8 lg:px-12 custom-scrollbar",
        state === "collapsed" && "sm:px-6 lg:px-6"
      )}
    >
      {children}
    </main>
  );
}
