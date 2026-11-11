"use client";

import { AssessmentStep } from "../../../../../resident/care-journey/assessment/AssessmentStep";

interface ResidentRecordAssessmentProps {
  residentId: string;
}

/** The risk tools and areas of need, shown inside the resident record. */
export function ResidentRecordAssessment({ residentId }: ResidentRecordAssessmentProps) {
  return (
    <AssessmentStep
      residentId={residentId}
      onNext={() => undefined}
      embedded
    />
  );
}
