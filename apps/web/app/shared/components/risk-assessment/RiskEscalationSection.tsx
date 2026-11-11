"use client";

import { AlertTriangle } from "lucide-react";
import { Button, Textarea } from "@repo/ui/components/ui";

interface Props {
  note: string;
  onNoteChange: (note: string) => void;
  onBack: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function RiskEscalationSection({
  note,
  onNoteChange,
  onBack,
  onConfirm,
  isPending,
}: Props) {
  return (
    <div className="space-y-4 py-2 border-y border-amber-200 bg-amber-50/60 p-4 rounded-xl">
      <div className="flex items-center gap-2 text-amber-900 font-semibold text-base">
        <AlertTriangle className="size-4 text-amber-600" />
        <span>Escalate as Critical Issue</span>
      </div>
      <p className="text-sm text-amber-800">
        Provide escalation notes. This risk will be escalated as Critical to the Clinical Governance &amp; CQC Oversight team with high priority notifications.
      </p>
      <Textarea
        rows={3}
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder="Describe the urgent clinical concern, immediate risks, or required medical attention…"
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onConfirm}
          disabled={isPending || !note.trim()}
        >
          {isPending ? "Escalating…" : "Confirm & Escalate"}
        </Button>
      </div>
    </div>
  );
}

