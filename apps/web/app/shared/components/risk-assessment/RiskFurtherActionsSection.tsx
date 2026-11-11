"use client";

import { useState } from "react";
import { UserCircle2, X, Plus } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui";
import type { StaffMember } from "../../../../lib/types/staff";

export interface FurtherAction {
  action: string;
  ownerId: string;
  ownerName: string;
  dueDate: string;
}

interface Props {
  actions: FurtherAction[];
  onAddAction: (action: FurtherAction) => void;
  onRemoveAction: (index: number) => void;
  staffList: StaffMember[];
}

export function RiskFurtherActionsSection({
  actions,
  onAddAction,
  onRemoveAction,
  staffList,
}: Props) {
  const [actionText, setActionText] = useState("");
  const [actionOwnerId, setActionOwnerId] = useState("");
  const [actionDueDate, setActionDueDate] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];
  const activeStaff = staffList.filter((s) => s.isActive);

  const hasStartedFurtherAction =
    actionText.trim().length > 0 ||
    actionOwnerId.length > 0 ||
    actionDueDate.length > 0;

  const isActionMissing = hasStartedFurtherAction && !actionText.trim();
  const isOwnerMissing = hasStartedFurtherAction && !actionOwnerId;
  const isDueDateMissing = hasStartedFurtherAction && !actionDueDate;

  const canAddAction =
    actionText.trim().length > 0 &&
    actionOwnerId.length > 0 &&
    actionDueDate.length > 0;

  const handleAdd = () => {
    if (!canAddAction) return;
    const owner = activeStaff.find((s) => s.id === actionOwnerId);
    onAddAction({
      action: actionText.trim(),
      ownerId: actionOwnerId,
      ownerName: owner?.fullName ?? "",
      dueDate: actionDueDate,
    });
    setActionText("");
    setActionOwnerId("");
    setActionDueDate("");
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
      <p className="text-md font-semibold text-slate-800">Further actions</p>

      {actions.length > 0 && (
        <div className="space-y-2">
          {actions.map((fa, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-md font-medium text-slate-800 truncate">{fa.action}</p>
                <p className="text-md text-slate-500 mt-0.5">
                  <UserCircle2 className="inline size-3 mr-1 text-slate-400" />
                  {fa.ownerName}
                  {fa.dueDate && (
                    <span className="ml-2 text-slate-400">· due {fa.dueDate}</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemoveAction(i)}
                className="shrink-0 text-slate-400 hover:text-red-500 transition-colors mt-0.5"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1">
        <div>
          <Label htmlFor="fa-action">Action</Label>
          <Input
            id="fa-action"
            value={actionText}
            onChange={(e) => setActionText(e.target.value)}
            placeholder="Specific, measurable, with a clear outcome"
            errorMessage={isActionMissing ? "Action field is mandatory" : undefined}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
          <div>
            <Label>Owner</Label>
            <Select value={actionOwnerId} onValueChange={setActionOwnerId}>
              <SelectTrigger className={isOwnerMissing ? "border-border-error focus-visible:border-border-error" : ""}>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {activeStaff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p
              className={cn(
                "text-md text-text-error font-medium min-h-[18px] leading-tight mt-1 transition-opacity",
                isOwnerMissing ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none select-none"
              )}
            >
              {isOwnerMissing ? "Owner is mandatory" : "\u00A0"}
            </p>
          </div>
          <div>
            <Label htmlFor="fa-due">Next review date</Label>
            <Input
              id="fa-due"
              type="date"
              min={todayStr}
              value={actionDueDate}
              onChange={(e) => setActionDueDate(e.target.value)}
              errorMessage={isDueDateMissing ? "Next review date is mandatory" : undefined}
            />
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={!canAddAction}
          className="gap-1.5 mt-1 text-md"
        >
          <Plus className="size-3.5" />
          Add action
        </Button>
      </div>
    </div>
  );
}
