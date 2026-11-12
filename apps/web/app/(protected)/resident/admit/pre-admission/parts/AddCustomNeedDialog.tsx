"use client";

import { useState, type FormEvent } from "react";
import { ASSESSMENT_RISK_OPTIONS } from "@repo/schema";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  Textarea,
} from "@repo/ui/components/ui";

export interface CustomNeedInput {
  label: string;
  associatedRisk: string | null;
  found: string | null;
}

interface AddCustomNeedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (input: CustomNeedInput) => void;
}

export function AddCustomNeedDialog({
  open,
  onOpenChange,
  onAdd,
}: AddCustomNeedDialogProps) {
  const [label, setLabel] = useState("");
  const [risk, setRisk] = useState("");
  const [found, setFound] = useState("");

  const reset = () => {
    setLabel("");
    setRisk("");
    setFound("");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) return;
    onAdd({
      label: trimmed,
      associatedRisk: risk || null,
      found: found.trim() || null,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="lg" className="p-6 space-y-4 font-sans">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-bold text-slate-900">
              Add custom support need
            </DialogTitle>
            <DialogDescription className="text-md text-slate-600">
              Add an area of need that is not covered by the tracked risks. You
              can create a support plan for it afterwards.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Text as="label" size="md" weight="bold" className="text-slate-800">
              Area of need
            </Text>
            <Input
              autoFocus
              aria-label="Custom support need name"
              maxLength={80}
              placeholder="e.g. Community access"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Text as="label" size="md" weight="bold" className="text-slate-800">
              Associated risk (optional)
            </Text>
            <Select value={risk || undefined} onValueChange={setRisk}>
              <SelectTrigger aria-label="Associated risk">
                <SelectValue placeholder="Select risk" />
              </SelectTrigger>
              <SelectContent>
                {ASSESSMENT_RISK_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt} className="text-md">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Text as="label" size="md" weight="bold" className="text-slate-800">
              What the assessment found (optional)
            </Text>
            <Textarea
              aria-label="Custom support need finding"
              rows={3}
              placeholder="Record assessment findings..."
              value={found}
              onChange={(event) => setFound(event.target.value)}
              className="resize-none text-md"
            />
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="rounded-xl font-semibold shadow-none"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!label.trim()}
              className="rounded-xl font-semibold shadow-none"
            >
              Add support need
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
