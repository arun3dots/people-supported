"use client";

import { useState } from "react";
import type {
  CareTaskShift,
  MustKnowItemDTO,
  ShiftNoteDTO,
} from "@repo/schema";
import { Button, Label, Textarea } from "@repo/ui/components/ui";
import { useCreateShiftNoteMutation } from "../../../../../lib/queries/care-journey";
import { PartCard } from "../../admit/pre-admission/shared/PartCard";
import { RatingPill } from "../shared";

const TONE_RATING = {
  danger: "high",
  warning: "med",
  neutral: "none",
} as const;

export function MustKnowCard({ items }: { items: MustKnowItemDTO[] }) {
  return (
    <PartCard title="MUST KNOW BEFORE YOU START" className="min-w-0">
      {items.length === 0 ? (
        <p className="text-md text-slate-600">Nothing flagged for this person.</p>
      ) : (
        <ul className="min-w-0 space-y-2">
          {items.map((item) => (
            <li
              key={`${item.label}-${item.value}`}
              className="min-w-0 space-y-0.5"
            >
              <span className="text-md font-bold text-slate-700">{item.label}</span>
              <div className="min-w-0">
                <RatingPill
                  rating={TONE_RATING[item.tone]}
                  className="w-full min-w-0 max-w-full justify-start whitespace-normal break-words"
                >
                  {item.value}
                </RatingPill>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PartCard>
  );
}

interface NotesCardProps {
  residentId: string;
  shift: CareTaskShift;
  date: string;
  notes: ShiftNoteDTO[];
}

export function NotesCard({ residentId, shift, date, notes }: NotesCardProps) {
  const create = useCreateShiftNoteMutation(residentId);
  const [text, setText] = useState("");

  const add = () =>
    create.mutate(
      { shift, text: text.trim(), date },
      { onSuccess: () => setText("") },
    );

  return (
    <PartCard title="DAILY NOTES">
      <ul className="space-y-2">
        {notes.map((n) => (
          <li key={n.id} className="bg-surface-card-grey rounded-xl px-3 py-2">
            <p className="text-md text-slate-800">{n.text}</p>
            <p className="text-md text-slate-600">
              {n.shift} shift{n.authorName ? ` · ${n.authorName}` : ""}
            </p>
          </li>
        ))}
        {notes.length === 0 && (
          <li className="text-md text-slate-600">No notes for this day yet.</li>
        )}
      </ul>
      <div className="space-y-1.5">
        <Label>Add a note</Label>
        <Textarea
          value={text}
          rows={2}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={!text.trim() || create.isPending}
          onClick={add}
          className="rounded-xl font-semibold px-5 shadow-none"
        >
          {create.isPending ? "Saving…" : "Add note"}
        </Button>
      </div>
    </PartCard>
  );
}
