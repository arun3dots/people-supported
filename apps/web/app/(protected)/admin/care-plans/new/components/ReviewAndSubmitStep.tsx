"use client";


import {
  Card,
  Badge,
  Text,
} from "@repo/ui/components/ui";
import { GoalFormData } from "../../../../../shared/components/care-plan/CarePlanGoalDialog";
import { TaskFormData } from "../../../../../shared/components/care-plan/CarePlanTaskDialog";

interface ReviewAndSubmitStepProps {
  residentName: string;
  validFrom: string;
  validTo: string;
  primaryDoctorName: string;
  secondaryDoctorName?: string;
  goals: GoalFormData[];
  tasks: TaskFormData[];
}

export function ReviewAndSubmitStep({
  residentName,
  validFrom,
  validTo,
  primaryDoctorName,
  secondaryDoctorName,
  goals,
  tasks,
}: ReviewAndSubmitStepProps) {
  return (
    <Card className="p-6 space-y-6 font-['Outfit',sans-serif]">
      <div className="space-y-1">
        <Text as="h3" size="md" weight="medium" className="text-slate-900">
          4. Review Care Plan &amp; Submit
        </Text>
        <Text size="md" weight="regular" className="text-slate-500 mt-0.5">
          Confirm details before submitting. Once submitted, the primary doctor will be notified to review and approve.
        </Text>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-md">
          <div>
            <Text size="md" weight="regular" className="text-slate-500 block">Tenant</Text>
            <Text size="md" weight="bold" className="text-slate-900 block">{residentName}</Text>
          </div>
          <div>
            <Text size="md" weight="regular" className="text-slate-500 block">Term</Text>
            <Text size="md" weight="semibold" className="text-slate-900 block">{validFrom} to {validTo}</Text>
          </div>
          <div>
            <Text size="md" weight="regular" className="text-slate-500 block">Primary Approver</Text>
            <Text size="md" weight="semibold" className="text-slate-900 block">{primaryDoctorName || "Unassigned"}</Text>
          </div>
          <div>
            <Text size="md" weight="regular" className="text-slate-500 block">Secondary Approver</Text>
            <Text size="md" weight="semibold" className="text-slate-900 block">{secondaryDoctorName || "None"}</Text>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Text as="h4" size="md" weight="bold" className="tracking-wider text-slate-700">
            Goals Summary ({goals.length})
          </Text>
          <div className="space-y-2">
            {goals.map((g, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-white flex justify-between items-center">
                <Text size="md" weight="medium" className="text-slate-900">{g.title}</Text>
                <Badge variant="outline" className="shadow-none">{g.category}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Text as="h4" size="md" weight="bold" className="tracking-wider text-slate-700">
            Daily Tasks Summary ({tasks.length})
          </Text>
          <div className="space-y-2">
            {tasks.map((t, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-white flex justify-between items-center">
                <Text size="md" weight="medium" className="text-slate-900">{t.title}</Text>
                <div className="flex gap-2">
                  <Badge variant="outline" className="shadow-none">{t.priority}</Badge>
                  <Badge variant="outline" className="shadow-none">{t.timeOfDay?.join(", ") || "AllDay"}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
