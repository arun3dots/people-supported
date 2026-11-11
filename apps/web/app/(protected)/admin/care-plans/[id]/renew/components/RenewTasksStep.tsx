"use client";


import {
  Card,
  Button,
  Badge,
  Text,
} from "@repo/ui/components/ui";
import { ListTodo, Plus, Trash2, Edit } from "lucide-react";
import { TaskFormData } from "../../../../../../shared/components/care-plan/CarePlanTaskDialog";

interface ClonedTask extends TaskFormData {
  originTaskId?: string;
  diffTag?: "CarriedOver" | "Changed" | "New" | "Removed";
}

interface RenewTasksStepProps {
  tasks: ClonedTask[];
  onOpenAddTask: () => void;
  onOpenEditTask: (task: ClonedTask) => void;
  onRemoveTask: (taskId: string) => void;
}

export function RenewTasksStep({
  tasks,
  onOpenAddTask,
  onOpenEditTask,
  onRemoveTask,
}: RenewTasksStepProps) {
  const getDiffBadge = (tag?: string) => {
    switch (tag) {
      case "New":
        return <Badge variant="secondary" state="info" className="px-2.5 py-0.5 shadow-none">New</Badge>;
      case "Changed":
        return <Badge variant="secondary" state="warning" className="px-2.5 py-0.5 shadow-none">Changed</Badge>;
      case "Removed":
        return <Badge variant="secondary" state="danger" className="px-2.5 py-0.5 shadow-none">Removed</Badge>;
      case "CarriedOver":
      default:
        return <Badge variant="secondary" state="success" className="px-2.5 py-0.5 shadow-none">Carried Over</Badge>;
    }
  };

  return (
    <Card className="p-6 space-y-4 font-['Outfit',sans-serif]">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ListTodo className="size-5 text-emerald-800" />
            <Text as="h3" size="sm" weight="medium" className="text-slate-900">
              3. Review &amp; Update Daily Tasks
            </Text>
          </div>
          <Text size="sm" weight="regular" className="text-slate-500 mt-0.5">
            Review recurring tasks performed by carers. Adjust instructions, slots, or remove deprecated tasks.
          </Text>
        </div>
        <Button size="sm" onClick={onOpenAddTask} className="gap-1.5 rounded-xl cursor-pointer">
          <Plus className="size-3.5" /> Add New Task
        </Button>
      </div>

      <div className="space-y-3">
        {tasks.map((task, idx) => {
          const isRemoved = task.diffTag === "Removed";

          return (
            <div
              key={task.id || idx}
              className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-colors ${isRemoved
                  ? "bg-slate-100/60 border-slate-200 opacity-60"
                  : "bg-white border-slate-200 hover:bg-slate-50/50"
                }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Text
                    size="sm"
                    weight="semibold"
                    className={isRemoved ? "line-through text-slate-400" : "text-slate-900"}
                  >
                    {task.title}
                  </Text>
                  <Badge variant="outline" className="shadow-none">
                    {task.category}
                  </Badge>
                  {getDiffBadge(task.diffTag)}
                  <Text size="sm" weight="regular" className="text-slate-500">
                    Slots: {task.timeOfDay?.join(", ") || "AllDay"}
                  </Text>
                </div>
                {task.instructions && (
                  <Text size="sm" weight="regular" className="text-slate-500">{task.instructions}</Text>
                )}
              </div>

              <div className="flex items-center gap-1">
                {!isRemoved && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => onOpenEditTask(task)} className="cursor-pointer">
                      <Edit className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => task.id && onRemoveTask(task.id)}
                      className="text-red-600 hover:text-red-800 cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
