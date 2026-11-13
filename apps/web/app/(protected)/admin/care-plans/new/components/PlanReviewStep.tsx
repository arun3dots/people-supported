"use client";


import { Text } from "@repo/ui/components/ui";

interface PlanReviewStepProps {
  residentName: string;
  validFrom: string;
  validTo: string;
  goalsCount: number;
  tasksCount: number;
  primaryDoctorName: string;
}

export function PlanReviewStep({
  residentName,
  validFrom,
  validTo,
  goalsCount,
  tasksCount,
  primaryDoctorName,
}: PlanReviewStepProps) {
  const reviewItems = [
    { label: "Tenant", value: residentName },
    { label: "Validity Period", value: `${validFrom} to ${validTo}` },
    { label: "Clinical Goals Defined", value: `${goalsCount} Goal${goalsCount === 1 ? "" : "s"}` },
    { label: "Linked Routine Tasks", value: `${tasksCount} Scheduled Task${tasksCount === 1 ? "" : "s"}` },
    { label: "Lead Clinician", value: primaryDoctorName },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div>
        <Text as="h2" size="lg" weight="semibold" className="text-slate-900 tracking-tight">
          Review &amp; Submit Care Plan
        </Text>
        <Text size="md" weight="regular" >
          Verify the clinical details before creating and submitting the plan for sign-off.
        </Text>
      </div>

      <div className="bg-white rounded-xl p-5 border border-slate-200/80 divide-y divide-slate-100">
        {reviewItems.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col sm:flex-row sm:items-center justify-between py-3 first:pt-0 last:pb-0 gap-1 text-md"
          >
            <Text size="md">{item.label}</Text>
            <Text size="md" >{item.value}</Text>
          </div>
        ))}
      </div>
    </div>
  );
}
