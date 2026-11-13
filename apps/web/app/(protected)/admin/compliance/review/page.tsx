import React, { Suspense } from "react";
import { ReviewDirectory } from "./ReviewDirectory";

export default function ComplianceReviewPage(): React.JSX.Element {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Loading reviews...</div>}>
      <ReviewDirectory />
    </Suspense>
  );
}

