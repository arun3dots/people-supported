"use client";


import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { FileText, Target, Calendar, RefreshCw, Eye } from "lucide-react";
import {
  Button,
  Badge,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@repo/ui/components/ui";
import { EntityCard } from "../../../../../lib/components/shared";
import type { PlanItem } from "./types";
import { getCarePlanStatusBadgeState } from "./useCarePlanColumns";

function formatDateLabel(d: unknown): string {
  if (!d) return "Not Set";
  const date = new Date(d as string);
  return isNaN(date.getTime()) ? "Not Set" : format(date, "MMM d, yyyy");
}

export interface CarePlanCardProps {
  plan: PlanItem;
  showRightDivider?: boolean;
}

export function CarePlanCard({ plan, showRightDivider = false }: CarePlanCardProps) {
  const router = useRouter();
  const vPill = `v${String(plan.versionNumber).padStart(4, "0")}`;
  const goalsCount = plan.goals?.length || 0;
  const room = plan.resident?.bed?.room?.roomNumber;
  const initial = plan.resident?.fullName?.charAt(0)?.toUpperCase() || "R";

  return (
    <EntityCard
      onClick={() => router.push(`/admin/care-plans/${plan.id}`)}
      showRightDivider={showRightDivider}
      avatar={
        <Avatar size="sm" className="size-11 border border-slate-200 shrink-0 bg-surface-primary-light">
          {plan.resident?.photoUrl && (
            <AvatarImage
              src={plan.resident.photoUrl}
              alt={plan.resident?.fullName || "Resident"}
              className="object-cover"
            />
          )}
          <AvatarFallback className="bg-surface-primary-light text-icon-primary font-bold text-base">
            {initial}
          </AvatarFallback>
        </Avatar>
      }
      title={
        <Link
          href={`/admin/care-plans/${plan.id}`}
          onClick={(e) => e.stopPropagation()}
          className="hover:text-emerald-800 transition-colors"
        >
          {plan.resident?.fullName || "Unassigned Resident"}
        </Link>
      }
      subtitle={room ? `Room ${room}` : "No Bed Assigned"}
      headerBadge={
        <Badge variant="secondary" state="inactive" className="font-mono px-2.5 py-0.5 shadow-none">
          {vPill}
        </Badge>
      }
      meta={[
        {
          icon: <Target className="size-4 text-emerald-800" />,
          label: "Goals",
          value: `${goalsCount} Goals`,
        },
        {
          icon: <Calendar className="size-4 text-emerald-800" />,
          label: "Valid To",
          value: formatDateLabel(plan.validTo),
        },
        {
          icon: <FileText className="size-4 text-emerald-800" />,
          label: "Details",
          value: plan.description || "Master Clinical Care Plan",
        },
      ]}
      statusBadge={
        <Badge
          variant="secondary"
          state={getCarePlanStatusBadgeState(plan.status || "Draft")}
          className="px-2.5 py-0.5 shadow-none"
        >
          {plan.status || "Draft"}
        </Badge>
      }
      actions={
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Link href={`/admin/care-plans/${plan.id}`}>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 rounded-xl h-8 text-md hover:bg-slate-50 cursor-pointer"
            >
              <Eye className="size-3.5 text-emerald-800" />
              View
            </Button>
          </Link>
          <Link href={`/admin/care-plans/${plan.id}/renew`}>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 rounded-xl h-8 text-md hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className="size-3.5 text-emerald-800" />
              Renew
            </Button>
          </Link>
        </div>
      }
    />
  );
}

export interface CarePlanCardGridProps {
  plans?: PlanItem[];
  paginatedPlans: PlanItem[];
  isLoading: boolean;
}

export function CarePlanCardGrid({
  paginatedPlans,
}: CarePlanCardGridProps) {
  if (!paginatedPlans || paginatedPlans.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
      {paginatedPlans.map((plan, idx) => (
        <CarePlanCard
          key={plan.id}
          plan={plan}
          showRightDivider={idx % 3 !== 2 && idx !== paginatedPlans.length - 1}
        />
      ))}
    </div>
  );
}
