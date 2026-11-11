"use client";

import { Suspense } from "react";
import { Spinner } from "@repo/ui/components/ui";
import { CareJourney } from "./CareJourney";

export default function CareJourneyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner />
        </div>
      }
    >
      <CareJourney />
    </Suspense>
  );
}
