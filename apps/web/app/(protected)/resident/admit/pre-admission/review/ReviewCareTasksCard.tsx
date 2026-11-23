"use client";

import { Clock, FileText, Smartphone } from "lucide-react";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@repo/ui/components/ui";
import {
  useListCareTaskDefinitionsQuery,
  useListNeedCarePlansQuery,
} from "../../../../../../lib/queries/care-journey";
import {
  describeTaskRecurrence,
  formatTaskDateWindow,
} from "../../../care-journey/care-plans/ModalTasksSection";
import { RatingPill } from "../../../care-journey/shared";

interface ReviewCareTasksCardProps {
  residentId?: string | null;
  onEditAssessment?: () => void;
}

export function ReviewCareTasksCard({
  residentId,
  onEditAssessment,
}: ReviewCareTasksCardProps) {
  const safeId = residentId ?? "";
  const plansQuery = useListNeedCarePlansQuery(safeId);
  const tasksQuery = useListCareTaskDefinitionsQuery(safeId);

  const plans = plansQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 font-sans">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Text as="h3" size="md" weight="bold" className="text-slate-900">
              Carer&apos;s Activities &amp; Daily Support Schedule
            </Text>
          </div>
          <p className="text-md text-slate-600 mt-0.5">
            {plans.length} support plan{plans.length === 1 ? "" : "s"} · {tasks.length}{" "}
            planned carer activit{tasks.length === 1 ? "y" : "ies"}
          </p>
        </div>
        {onEditAssessment && (
          <Button
            type="button"
            variant="outline"
            onClick={onEditAssessment}
            className="rounded-xl text-md font-semibold shadow-none cursor-pointer"
          >
            Edit support plans &amp; activities
          </Button>
        )}
      </div>

      {plans.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {plans.map((plan) => (
            <span
              key={plan.id}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-md font-medium text-slate-800"
            >
              <FileText className="size-4 text-emerald-800 shrink-0" />
              <span>{plan.area}</span>
              <RatingPill rating={plan.status === "Agreed" ? "low" : "med"}>
                {plan.status}
              </RatingPill>
            </span>
          ))}
        </div>
      )}

      {tasks.length === 0 ? (
        <p className="text-md text-slate-500">
          No carer activities scheduled yet. Activities created in the assessment (Step 6) will appear here and sync directly to the Carer App upon admission.
        </p>
      ) : (
        <div className="rounded-xl border border-slate-200/80 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40 text-md font-bold text-slate-800">
                  Timing &amp; Routine
                </TableHead>
                <TableHead className="min-w-52 text-md font-bold text-slate-800">
                  Carer Activity
                </TableHead>
                <TableHead className="w-52 text-md font-bold text-slate-800">
                  Support Plan Area
                </TableHead>
                <TableHead className="w-32 text-md font-bold text-slate-800">
                  Assigned Role
                </TableHead>
                <TableHead className="w-52 text-md font-bold text-slate-800">
                  Frequency &amp; Schedule
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => {
                const dateWindow = formatTaskDateWindow(task.startsOn, task.endsOn);
                return (
                  <TableRow key={task.id}>
                    <TableCell className="py-3">
                      <span className="inline-flex items-center gap-1.5 font-mono text-md font-bold text-slate-900">
                        <Clock className="size-4 text-slate-500" />
                        {task.time || "Flexible"}
                      </span>
                      <span className="block text-md text-slate-500">
                        {task.shift ? `${task.shift} routine` : "Daily routine"}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="font-medium text-md text-slate-900 block">{task.title}</span>
                      {task.description && (
                        <span className="text-md text-slate-500 block line-clamp-1 mt-0.5">
                          {task.description}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="font-medium text-md text-slate-700">{task.area}</span>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="font-medium text-md text-slate-700">{task.role}</span>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="font-medium text-md text-slate-900 block">
                        {describeTaskRecurrence(task.recurrence)}
                      </span>
                      {dateWindow && (
                        <span className="block text-md text-slate-500">
                          {dateWindow}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
