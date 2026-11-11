"use client";

import React, { useState } from "react";
import {
  SquarePen,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  Paperclip,
  Mail,
  ListTodo,
} from "lucide-react";
import { Card } from "@repo/ui/components/ui/Card";
import { Button } from "@repo/ui/components/ui/Button";
import { Text } from "@repo/ui/components/ui/Text";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/ui/Avatar";
import { IncidentTask } from "./AssignTaskModal";

interface TaskSummaryCardProps {
  tasks: IncidentTask[];
  onOpenAssignModal: () => void;
}

export function TaskSummaryCard({
  tasks,
  onOpenAssignModal,
}: TaskSummaryCardProps) {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(
    tasks[0]?.id || null,
  );

  const toggleTask = (taskId: string) => {
    setExpandedTaskId((prev) => (prev === taskId ? null : taskId));
  };

  return (
    <Card variant="surface">
      {/* Header with Title and Edit Button */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Text size={"lg"} weight={"bold"}>
            Task Summary
          </Text>
          <Text size={"xs"} weight={"regular"} className="text-slate-500">
            Actionable tasks assigned for this incident.
          </Text>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onOpenAssignModal}
          className="size-9 rounded-xl border border-slate-200 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors shadow-none cursor-pointer"
        >
          <SquarePen className="size-4" />
        </Button>
      </div>

      {/* Empty State */}
      {tasks.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center space-y-2 bg-slate-50/50">
          <ListTodo className="size-6 text-slate-400 mx-auto" />
          <Text size={"xs"} weight={"medium"} className="text-slate-600">
            No tasks assigned yet
          </Text>
          <Button
            type="button"
            variant="outline"
            onClick={onOpenAssignModal}
            className="h-8 px-3 text-md rounded-lg border-emerald-800 text-emerald-800 hover:bg-emerald-50"
          >
            + Assign First Task
          </Button>
        </div>
      ) : (
        /* Accordion Tasks List */
        <div className="space-y-2.5 pt-1">
          {tasks.map((task) => {
            const isExpanded = expandedTaskId === task.id;

            return (
              <div
                key={task.id}
                className="border border-slate-200 rounded-xl overflow-hidden bg-white transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  className="w-full flex items-center justify-between p-3.5 text-left cursor-pointer hover:bg-slate-50/70 transition-colors"
                >
                  <Text
                    size={"sm"}
                    weight={"semibold"}
                    className="text-slate-900"
                  >
                    {task.title}
                  </Text>

                  <div className="text-slate-400">
                    {isExpanded ? (
                      <ChevronUp className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-100 bg-slate-50/30">
                    <Text
                      size={"xs"}
                      weight={"regular"}
                      className="text-slate-600 leading-relaxed"
                    >
                      {task.description}
                    </Text>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60">
                      <div>
                        <Text
                          size={"xs"}
                          weight={"regular"}
                          className="text-slate-500"
                        >
                          Assigned To
                        </Text>
                        <div className="flex items-center gap-2 pt-1">
                          <Avatar className="size-6">
                            {task.assignedToAvatarUrl && (
                              <AvatarImage
                                src={task.assignedToAvatarUrl}
                                alt={task.assignedToName}
                              />
                            )}
                            <AvatarFallback className="text-[9px] bg-slate-200">
                              {task.assignedToName?.slice(0, 2).toUpperCase() ||
                                "ST"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="leading-tight">
                            <Text
                              size={"xs"}
                              weight={"medium"}
                              className="text-slate-800"
                            >
                              {task.assignedToName}
                            </Text>
                            {task.assignedToRole && (
                              <Text
                                size={"xs"}
                                weight={"regular"}
                                className="text-slate-400 block"
                              >
                                ({task.assignedToRole})
                              </Text>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <Text
                          size={"xs"}
                          weight={"regular"}
                          className="text-slate-500"
                        >
                          Priority
                        </Text>
                        <div className="flex items-center gap-1.5 pt-1 font-medium text-red-500">
                          <span
                            className={`size-1.5 rounded-full ${
                              task.priority === "High"
                                ? "bg-red-500"
                                : task.priority === "Medium"
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                            }`}
                          />
                          <Text size={"xs"} weight={"semibold"}>
                            {task.priority}
                          </Text>
                        </div>
                      </div>

                      <div>
                        <Text
                          size={"xs"}
                          weight={"regular"}
                          className="text-slate-500"
                        >
                          Attachments
                        </Text>
                        <div className="flex items-center gap-1.5 pt-1 text-slate-700">
                          <Paperclip className="size-3 text-slate-400" />
                          <Text size={"xs"} weight={"regular"}>
                            {task.attachmentCount || 0} Files attached
                          </Text>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60">
                      <div>
                        <Text
                          size={"xs"}
                          weight={"regular"}
                          className="text-slate-500"
                        >
                          Date
                        </Text>
                        <div className="flex items-center gap-1.5 pt-1 text-slate-700">
                          <Calendar className="size-3 text-slate-400" />
                          <Text size={"xs"} weight={"regular"}>
                            {task.date}
                          </Text>
                        </div>
                      </div>

                      <div>
                        <Text
                          size={"xs"}
                          weight={"regular"}
                          className="text-slate-500"
                        >
                          Time
                        </Text>
                        <div className="flex items-center gap-1.5 pt-1 text-slate-700">
                          <Clock className="size-3 text-slate-400" />
                          <Text size={"xs"} weight={"regular"}>
                            {task.time}
                          </Text>
                        </div>
                      </div>

                      <div>
                        <Text
                          size={"xs"}
                          weight={"regular"}
                          className="text-slate-500"
                        >
                          Notify Assignee
                        </Text>
                        <div className="flex items-center gap-1.5 pt-1 text-slate-700">
                          <Mail className="size-3 text-slate-400" />
                          <Text size={"xs"} weight={"regular"}>
                            {task.notifyEmail
                              ? "Email Enabled"
                              : "No Notification"}
                          </Text>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
