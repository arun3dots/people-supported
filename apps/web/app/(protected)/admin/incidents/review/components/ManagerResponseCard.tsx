"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@repo/ui/components/ui/Card";
import { Label } from "@repo/ui/components/ui/Label";
import { Textarea } from "@repo/ui/components/ui/Textarea";
import { Text } from "@repo/ui/components/ui/Text";

interface ManagerResponseCardProps {
  notes: string;
  onChangeNotes: (val: string) => void;
  lastSavedText?: string;
  readOnly?: boolean;
}

export function ManagerResponseCard({
  notes,
  onChangeNotes,
  lastSavedText = "12 May 2026, 09:47 AM",
  readOnly = false,
}: ManagerResponseCardProps) {
  return (
    <Card variant="surface">
      <div className="space-y-0.5">
        <Text size={'lg'} weight={'bold'}>
          Manager Review &amp; Response
        </Text>
        <Text size={'md'} weight={'regular'} className="text-slate-500">
          Review the escalation details, take necessary actions using quick actions panel and document your response.
        </Text>
      </div>

      <div className="space-y-1.5 pt-1">
        <Label required >
          Management Response Notes
        </Label>
        <div className="relative">
          <Textarea
            value={notes}
            onChange={(e) => onChangeNotes(e.target.value)}
            placeholder="Write your response notes here..."
            rows={4}
            readOnly={readOnly}
            disabled={readOnly}
            className="min-h-[100px] bg-white border border-slate-200 rounded-xl text-md text-slate-900 p-3.5 focus-visible:ring-1 focus-visible:ring-emerald-800 shadow-none"
          />
          <span className="absolute bottom-2.5 right-3 text-md text-slate-400">
            {readOnly ? "Read-only" : `${notes.length}/250`}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <Text size={'md'} weight={'regular'} className="text-slate-500">
          Last saved: {lastSavedText}
        </Text>
        <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
          <CheckCircle2 className="size-3.5 text-emerald-600" />
          <Text size={'md'} weight={'medium'} className="text-emerald-700">
            Auto-Saved
          </Text>
        </div>
      </div>
    </Card>
  );
}
