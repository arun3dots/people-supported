"use client";

import React from "react";
import { Skeleton } from "@repo/ui/components/ui";

export function ResidentListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Skeleton
          key={i}
          className="h-72 rounded-2xl border border-slate-100"
        />
      ))}
    </div>
  );
}
