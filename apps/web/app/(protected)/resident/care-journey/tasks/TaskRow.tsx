"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { CareTaskListItemDTO } from "@repo/schema";
import { Button, Label, Textarea } from "@repo/ui/components/ui";
import {
  useRecordCareTaskMutation,
  useUndoCareTaskMutation,
} from "../../../../../lib/queries/care-journey";
import { RatingPill } from "../shared";

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

interface TaskRowProps {
  residentId: string;
  item: CareTaskListItemDTO;
  date: string;
  canRecordTasks: boolean;
}

export function TaskRow({
  residentId,
  item,
  date,
  canRecordTasks,
}: TaskRowProps) {
  const record = useRecordCareTaskMutation(residentId);
  const undo = useUndoCareTaskMutation(residentId);
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState<"Done" | "Declined">("Done");
  const [note, setNote] = useState("");

  const isNurseOnly = item.role === "Nurse" && canRecordTasks;
  const noteMissing = outcome === "Declined" && !note.trim();

  const submit = () =>
    record.mutate(
      { taskId: item.taskId, data: { outcome, note: note.trim(), date } },
      {
        onSuccess: () => {
          setOpen(false);
          setNote("");
          setOutcome("Done");
        },
      },
    );

  return (
    <li className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
        <span className="text-md font-bold text-slate-800 tabular-nums w-20 shrink-0">
          {item.time || `${item.shift} shift`}
        </span>
        <div className="flex-1 min-w-[12rem]">
          <p className="text-md font-bold text-slate-900">{item.title}</p>
          {item.description && (
            <p className="text-sm text-slate-600">{item.description}</p>
          )}
          <div className="flex flex-wrap gap-2 pt-1.5">
            <RatingPill rating="none">{item.carePlan.area}</RatingPill>
            <RatingPill rating={item.role === "Nurse" ? "med" : "none"}>
              {item.role}
            </RatingPill>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {item.status === "Done" && (
            <RatingPill rating="low">
              <Check className="size-3" />
              Done {item.record ? formatTime(item.record.recordedAt) : ""}
            </RatingPill>
          )}
          {item.status === "Declined" && (
            <RatingPill rating="high">
              <X className="size-3" />
              Declined {item.record ? formatTime(item.record.recordedAt) : ""}
            </RatingPill>
          )}
          {item.status === "Pending" && isNurseOnly && (
            <span className="text-sm font-semibold text-slate-600">Nurse task</span>
          )}
          {item.status === "Pending" &&
            canRecordTasks &&
            !isNurseOnly &&
            !open && (
            <Button
              type="button"
              variant="primary"
              onClick={() => setOpen(true)}
              className="rounded-xl font-semibold shadow-none"
            >
              Record
            </Button>
          )}
          {item.status !== "Pending" && canRecordTasks && (
            <Button
              type="button"
              variant="outline"
              disabled={undo.isPending}
              onClick={() => undo.mutate(item.taskId)}
              className="rounded-xl shadow-none"
            >
              Undo
            </Button>
          )}
        </div>
      </div>

      {item.record?.note && (
        <p className="text-sm text-slate-700 bg-surface-card-grey rounded-xl px-3 py-2">
          {item.record.note}
          {item.record.recordedByName ? ` — ${item.record.recordedByName}` : ""}
        </p>
      )}

      {open && canRecordTasks && (
        <div className="bg-surface-card-grey rounded-xl p-3 space-y-2">
          <div className="flex gap-2" role="group" aria-label="Outcome">
            {(["Done", "Declined"] as const).map((o) => (
              <Button
                key={o}
                type="button"
                variant={outcome === o ? "primary" : "outline"}
                aria-pressed={outcome === o}
                onClick={() => setOutcome(o)}
                className="rounded-xl shadow-none"
              >
                {o}
              </Button>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label required={outcome === "Declined"}>Note</Label>
            <Textarea
              value={note}
              rows={2}
              placeholder={
                outcome === "Declined"
                  ? "Why was it declined?"
                  : "Optional. Anything the next shift should know."
              }
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-xl shadow-none"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={noteMissing || record.isPending}
              onClick={submit}
              className="rounded-xl font-semibold px-5 shadow-none"
            >
              {record.isPending ? "Saving…" : "Save record"}
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
