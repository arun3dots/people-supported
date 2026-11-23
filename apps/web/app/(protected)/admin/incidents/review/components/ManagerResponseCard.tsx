"use client";

import React, { useMemo } from "react";
import { format } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@repo/ui/components/ui/Card";
import { Label } from "@repo/ui/components/ui/Label";
import { Textarea } from "@repo/ui/components/ui/Textarea";
import { Text } from "@repo/ui/components/ui/Text";

interface ManagerResponseCardProps {
  notes: string;
  onChangeNotes: (val: string) => void;
  lastSavedText?: string;
  lastSavedDate?: Date | string | null;
  readOnly?: boolean;
}

export function ManagerResponseCard({
  notes,
  onChangeNotes,
  lastSavedText,
  lastSavedDate,
  readOnly = false,
}: ManagerResponseCardProps) {
  const displayLastSaved = useMemo(() => {
    if (lastSavedText) return lastSavedText;
    if (lastSavedDate) {
      try {
        const d = new Date(lastSavedDate);
        if (!isNaN(d.getTime())) {
          return format(d, "dd MMM yyyy, hh:mm a");
        }
      } catch {
        // ignore and fallback
      }
    }
    return format(new Date(), "dd MMM yyyy, hh:mm a");
  }, [lastSavedText, lastSavedDate]);

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
            maxLength={1000}
            onChange={(e) => onChangeNotes(e.target.value.slice(0, 1000))}
            placeholder="Write your response notes here..."
            rows={4}
            readOnly={readOnly}
            disabled={readOnly}
            className="min-h-[100px] bg-white border border-slate-200 rounded-xl text-md text-slate-900 p-3.5 focus-visible:ring-1 focus-visible:ring-emerald-800 shadow-none pr-16"
          />
          <span
            className={`absolute bottom-2.5 right-3 text-md ${
              !readOnly && notes.length >= 1000
                ? "text-amber-600 font-medium"
                : "text-slate-400"
            }`}
          >
            {readOnly ? "Read-only" : `${notes.length}/1000`}
          </span>
        </div>
        <Textarea
          value={notes}
          onChange={(e) => onChangeNotes(e.target.value)}
          placeholder="Write your response notes here..."
          rows={4}
          maxLength={250}
          readOnly={readOnly}
          disabled={readOnly}
          className="min-h-[100px] bg-white border border-slate-200 rounded-xl text-md text-slate-900 p-3.5 focus-visible:ring-1 focus-visible:ring-emerald-800 shadow-none"
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <Text size={'md'} weight={'regular'} className="text-slate-500">
          Last saved: {displayLastSaved}
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
