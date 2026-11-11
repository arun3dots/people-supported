"use client";

import {
  Card,
  Text,
} from "@repo/ui/components/ui";

interface ClonedGoal {
  id?: string;
  title: string;
  category: string;
  diffTag?: string;
}

interface ClonedTask {
  id?: string;
  title: string;
  priority?: string;
  timeOfDay?: string[];
  diffTag?: string;
}

interface RenewDiffReviewStepProps {
  residentName: string;
  renewalReason: string;
  validFrom: string;
  validTo: string;
  primaryDoctorName: string;
  secondaryDoctorName?: string;
  goals: ClonedGoal[];
  tasks: ClonedTask[];
}

export function RenewDiffReviewStep({
  residentName,
  renewalReason,
  validFrom,
  validTo,
  primaryDoctorName,
  goals,
  tasks,
}: RenewDiffReviewStepProps) {
  const goalStats = {
    carried: goals.filter((g) => g.diffTag === "CarriedOver" || !g.diffTag).length,
    changed: goals.filter((g) => g.diffTag === "Changed").length,
    new: goals.filter((g) => g.diffTag === "New").length,
    retired: goals.filter((g) => g.diffTag === "Retired").length,
  };

  const taskStats = {
    carried: tasks.filter((t) => t.diffTag === "CarriedOver" || !t.diffTag).length,
    changed: tasks.filter((t) => t.diffTag === "Changed").length,
    new: tasks.filter((t) => t.diffTag === "New").length,
    removed: tasks.filter((t) => t.diffTag === "Removed").length,
  };

  return (
    <Card className="p-6 space-y-6 font-['Outfit',sans-serif]">
      <div className="space-y-1">
        <Text as="h3" size="sm" weight="medium" className="text-slate-900">
          4. Review Renewal Plan Diff &amp; Submit
        </Text>
        <Text size="sm" weight="regular" className="text-slate-500 mt-0.5">
          Confirm changes made across goals and tasks. Submitting will create a new draft version for clinical sign-off.
        </Text>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-md">
        <div>
          <Text size="sm" weight="regular" className="text-slate-500 block">Resident</Text>
          <Text size="sm" weight="bold" className="text-slate-900 block">{residentName}</Text>
        </div>
        <div>
          <Text size="sm" weight="regular" className="text-slate-500 block">Reason</Text>
          <Text size="sm" weight="semibold" className="text-slate-900 block">{renewalReason}</Text>
        </div>
        <div>
          <Text size="sm" weight="regular" className="text-slate-500 block">Term</Text>
          <Text size="sm" weight="semibold" className="text-slate-900 block">{validFrom} to {validTo}</Text>
        </div>
        <div>
          <Text size="sm" weight="regular" className="text-slate-500 block">Approver</Text>
          <Text size="sm" weight="semibold" className="text-slate-900 block">{primaryDoctorName}</Text>
        </div>
      </div>

      {/* Diff Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl border bg-emerald-50/50 border-emerald-200 text-center">
          <Text size="2xl" weight="bold" className="text-emerald-800">{goalStats.carried + taskStats.carried}</Text>
          <Text size="sm" weight="medium" className="text-emerald-700 mt-1 block">Carried Over</Text>
        </div>
        <div className="p-3 rounded-xl border bg-amber-50/50 border-amber-200 text-center">
          <Text size="2xl" weight="bold" className="text-amber-800">{goalStats.changed + taskStats.changed}</Text>
          <Text size="sm" weight="medium" className="text-amber-700 mt-1 block">Modified / Changed</Text>
        </div>
        <div className="p-3 rounded-xl border bg-blue-50/50 border-blue-200 text-center">
          <Text size="2xl" weight="bold" className="text-blue-800">{goalStats.new + taskStats.new}</Text>
          <Text size="sm" weight="medium" className="text-blue-700 mt-1 block">New Items</Text>
        </div>
        <div className="p-3 rounded-xl border bg-slate-100 border-slate-200 text-center">
          <Text size="2xl" weight="bold" className="text-slate-700">{goalStats.retired + taskStats.removed}</Text>
          <Text size="sm" weight="medium" className="text-slate-600 mt-1 block">Retired / Removed</Text>
        </div>
      </div>
    </Card>
  );
}
