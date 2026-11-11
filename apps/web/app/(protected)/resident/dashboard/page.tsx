"use client";

import { Users } from "lucide-react";
import React from "react";

export default function ResidentDashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <Users className="size-16 text-primary" />
      <h2 className="text-2xl font-bold">Resident Portal</h2>
      <p className="text-muted-foreground">
        Access your personal care plan, schedule, and facility news.
      </p>
    </div>
  );
}
