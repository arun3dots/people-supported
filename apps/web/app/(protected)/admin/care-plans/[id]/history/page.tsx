"use client";

import { JSX, use } from "react";
import { useRouter } from "next/navigation";
import { Button, Text } from "@repo/ui/components/ui";
import { ArrowLeft, Loader2 } from "lucide-react";
import { CarePlanHistoryView } from "../../../../../shared/components/care-plan/CarePlanHistoryView";
import {
  useGetCarePlanDetailQuery,
  useGetResidentCarePlanVersionsQuery,
} from "../../../../../../lib/queries/care-plan";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CarePlanHistoryPage({ params }: PageProps): JSX.Element {
  const resolvedParams = use(params);
  const planId = resolvedParams.id;
  const router = useRouter();

  const { data: plan, isLoading: isPlanLoading } = useGetCarePlanDetailQuery(planId);
  const residentId = (plan as { residentId?: string; resident?: { fullName?: string } })?.residentId || "";
  const residentName = (plan as { resident?: { fullName?: string } })?.resident?.fullName || "Resident";

  const { data: rawVersions = [], isLoading: isVersionsLoading } =
    useGetResidentCarePlanVersionsQuery(residentId);

  const versions = Array.isArray(rawVersions)
    ? (rawVersions as Array<{
      id: string;
      versionNumber: number;
      status: string;
      createdAt?: string;
      validFrom?: string;
      validTo?: string | null;
      renewalReason?: string | null;
    }>)
    : [];

  if (isPlanLoading || isVersionsLoading) {
    return (
      <div className="p-16 text-center bg-white rounded-2xl border border-slate-200/90 font-sans">
        <Loader2 className="size-8 animate-spin text-primary mx-auto mb-3" />
        <Text size="md" weight="medium" variant="muted">
          Loading care plan history...
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-sans">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1.5 text-md font-semibold text-slate-700 hover:text-slate-900 rounded-xl"
        >
          <ArrowLeft className="size-4" /> Back to Care Plan
        </Button>

        <Text size="md" variant="muted">
          Resident: <span className="font-semibold text-slate-800">{residentName}</span>
        </Text>
      </div>

      <CarePlanHistoryView
        versions={versions}
        currentPlanId={planId}
        residentName={residentName}
        onSelectVersion={(selectedId) => router.push(`/admin/care-plans/${selectedId}`)}
        onViewPlanDetail={(selectedId) => router.push(`/admin/care-plans/${selectedId}`)}
      />
    </div>
  );
}
