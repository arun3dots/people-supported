"use client";

import { useState } from "react";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import {
  Button,
  Input,
  Label,
} from "@repo/ui/components/ui";
import {
  useCreateRiskControlMutation,
  useCompleteRiskControlMutation,
  useDeleteRiskControlMutation,
} from "../../../../lib/queries/risk";
import type { RiskControlResponse } from "../../../../lib/queries/risk";

interface Props {
  assessmentId: string;
  controls: RiskControlResponse[];
  canEdit: boolean;
}

export function RiskControlsList({ assessmentId, controls, canEdit }: Props) {
  const [draft, setDraft] = useState("");
  const create = useCreateRiskControlMutation();
  const complete = useCompleteRiskControlMutation();
  const remove = useDeleteRiskControlMutation();

  const handleAdd = () => {
    const description = draft.trim();
    if (!description) return;
    create.mutate(
      { assessmentId, dto: { description, isExisting: false } },
      { onSuccess: () => setDraft("") },
    );
  };

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <Label className="text-md font-semibold text-[#141F1E]">Control measures</Label>
        <span className="text-md text-[#5D5D5D] font-normal">
          {controls.length} total ·{" "}
          {controls.filter((c) => c.status === "Completed").length} completed
        </span>
      </div>

      {canEdit && (
        <div className="flex gap-2">
          <Input
            placeholder="Add a new control measure…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            className="rounded-xl border-[#BCD3CD] focus-visible:ring-[#4A706A] text-md"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
            disabled={!draft.trim() || create.isPending}
            className="bg-[#4A706A] hover:bg-[#3D5C57] text-white rounded-xl text-md font-medium px-4"
          >
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
      )}

      {controls.length === 0 ? (
        <p className="text-md text-[#5D5D5D] italic bg-slate-50 p-3.5 rounded-xl border border-[#BCD3CD]">
          No controls defined yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {controls.map((c) => {
            const isDone = c.status === "Completed";
            const isOverdue = c.status === "Overdue";
            return (
              <li
                key={c.id}
                className="flex items-start gap-3 rounded-xl border border-[#BCD3CD] bg-white p-3 shadow-2xs"
              >
                <div className="flex-1">
                  <p
                    className={`text-md ${
                      isDone ? "line-through text-slate-400" : "font-medium text-[#141F1E]"
                    }`}
                  >
                    {c.description}
                  </p>
                  <div className="flex flex-wrap gap-3 text-md text-[#5D5D5D] mt-1">
                    <span>Status: {c.status}</span>
                    {c.dueDate && (
                      <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                        Due: {new Date(c.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    {c.completedAt && (
                      <span>
                        Completed:{" "}
                        {new Date(c.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                {canEdit && !isDone && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => complete.mutate({ id: c.id, dto: {} })}
                    disabled={complete.isPending}
                    className="rounded-xl border-[#BCD3CD] text-[#141F1E] hover:bg-slate-50 text-md font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Done
                  </Button>
                )}
                {canEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove.mutate(c.id)}
                    disabled={remove.isPending}
                    aria-label="Delete control"
                    className="rounded-xl text-slate-400 hover:text-red-600 text-md font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
