"use client";

import { Suspense } from "react";
import { PreAdmissionWizard } from "./pre-admission/PreAdmissionWizard";

export default function ResidentAdmissionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full size-8 border-b-2 border-emerald-800" />
        </div>
      }
    >
      <PreAdmissionWizard />
    </Suspense>
  );
}
