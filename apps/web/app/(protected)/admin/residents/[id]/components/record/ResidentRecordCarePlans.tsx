"use client";

import { useRouter } from "next/navigation";
import { CarePlansStep } from "../../../../../resident/care-journey/care-plans/CarePlansStep";

interface ResidentRecordCarePlansProps {
  residentId: string;
}

/** The need-based care plans, shown inside the resident record. */
export function ResidentRecordCarePlans({ residentId }: ResidentRecordCarePlansProps) {
  const router = useRouter();

  return (
    <CarePlansStep
      residentId={residentId}
      onBack={() =>
        router.push(`/admin/residents/admit?id=${residentId}&step=6`)
      }
      onNext={() => undefined}
      showNav={false}
    />
  );
}
