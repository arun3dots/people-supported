"use client";


import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  Text,
} from "@repo/ui/components/ui";
import { CheckCircle2, XCircle } from "lucide-react";

export interface DailyTaskExecution {
  id: string;
  title: string;
  status: string;
  skipReason?: string;
}

interface CarePlanTodayExecutionsProps {
  dailyTasks: DailyTaskExecution[];
  onCompleteTask: (taskId: string) => void;
  onOpenSkipModal: (task: { id: string; title: string }) => void;
}

export function CarePlanTodayExecutions({
  dailyTasks = [],
  onCompleteTask,
  onOpenSkipModal,
}: CarePlanTodayExecutionsProps) {
  const getBadgeState = (status: string) => {
    if (status === "Completed") return "success";
    if (status === "Skipped") return "danger";
    return "inactive";
  };

  return (
    <Card className="border border-slate-200 shadow-none bg-white font-['Outfit',sans-serif]">
      <CardHeader className="pb-3 border-b border-slate-100">
        <Text as="h3" size="sm" weight="semibold" className="text-slate-900">
          Today&apos;s Task Occurrences ({dailyTasks.length})
        </Text>
      </CardHeader>
      <CardContent className="p-6 space-y-3">
        {dailyTasks.length === 0 ? (
          <Text size="sm" weight="regular" className="text-center py-6 text-slate-400 block">
            No tasks generated for today. Tasks generate automatically when care plan is active.
          </Text>
        ) : (
          <div className="space-y-2.5">
            {dailyTasks.map((t) => {
              const isCompleted = t.status === "Completed";
              const isSkipped = t.status === "Skipped";

              return (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Text size="sm" weight="semibold" className="text-slate-900">
                        {t.title}
                      </Text>
                      <Badge
                        variant="secondary"
                        state={getBadgeState(t.status)}
                        className="px-2 py-0.5 shadow-none"
                      >
                        {t.status}
                      </Badge>
                    </div>
                    {t.skipReason && (
                      <Text size="sm" className="text-red-600 font-medium mt-0.5">
                        Skipped: {t.skipReason}
                      </Text>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isCompleted && !isSkipped && (
                      <>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => onCompleteTask(t.id)}
                          className="h-8 rounded-xl cursor-pointer gap-1.5"
                        >
                          <CheckCircle2 className="size-3.5" /> Complete
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenSkipModal({ id: t.id, title: t.title })}
                          className="h-8 text-red-600 border-red-200 hover:bg-red-50 rounded-xl cursor-pointer gap-1.5"
                        >
                          <XCircle className="size-3.5" /> Skip
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
