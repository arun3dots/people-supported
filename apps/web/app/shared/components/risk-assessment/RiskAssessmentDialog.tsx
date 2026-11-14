"use client";

import { ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import type { RiskCategory } from "@repo/schema";
import type { RiskAssessmentResponse } from "../../../../lib/queries/risk";
import { RiskMatrixGrid } from "./RiskMatrixGrid";
import { CATEGORIES } from "./risk-dialog.types";
import { useRiskAssessmentForm } from "./useRiskAssessmentForm";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residentId: string;
  initialTitle?: string;
  initialTemplateName?: string;
  initialCategory?: RiskCategory | "";
  initialTool?: string;
  editingAssessment?: RiskAssessmentResponse | null;
}

export function RiskAssessmentDialog(props: Props) {
  const { open, onOpenChange, editingAssessment } = props;
  const {
    state,
    setState,
    errors,
    setErrors,
    templateDisplay,
    hasInherentRiskSelected,
    score,
    level,
    levelStyle,
    handleSave,
    isPending,
  } = useRiskAssessmentForm(props);

  const rawType = state.title?.trim() || props.initialTitle?.trim() || (templateDisplay !== "General Risk" ? templateDisplay : "");
  const formattedAssessmentType = rawType
    ? (/assessment|agreement|scale|audit|plan/i.test(rawType)
        ? rawType
        : `${rawType} Assessment`)
    : "Risk Assessment";

  const dialogTitle = editingAssessment
    ? `Edit ${formattedAssessmentType}`
    : `New ${formattedAssessmentType}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="3xl"
        className="p-5 sm:p-7 max-h-[90vh] overflow-y-auto font-sans rounded-2xl"
      >
        <DialogHeader className="pb-4 border-b border-gray-100 shrink-0 space-y-1">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[#141F1E]">
            <ShieldAlert className="w-5 h-5 text-[#4A706A]" />
            {dialogTitle}
          </DialogTitle>
          <DialogDescription className="text-md text-[#5D5D5D]">
            {editingAssessment
              ? `Update ${formattedAssessmentType.toLowerCase()} details and risk matrix scores.`
              : `Record ${formattedAssessmentType.toLowerCase()} details and risk matrix scores.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="space-y-1.5">
            <Label className="text-md font-semibold text-[#141F1E]" required>
              Category
            </Label>
            <Select
              disabled
              value={state.category}
              onValueChange={(v) => {
                setState((s) => ({ ...s, category: v as RiskCategory }));
                setErrors((e) => ({ ...e, category: undefined }));
              }}
            >
              <SelectTrigger
                disabled
                className={cn(
                  "w-full text-md rounded-xl border-[#BCD3CD] focus-visible:ring-[#4A706A] bg-slate-100/70 text-slate-600 cursor-not-allowed",
                  errors.category && "border-red-500 focus:ring-red-500"
                )}
              >
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="bg-white rounded-xl shadow-lg border border-slate-200">
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="text-md cursor-pointer hover:bg-slate-50">
                    {c === "Behavioral" ? "Behavioural" : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-md text-red-600 mt-1 font-medium">
                {errors.category}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="risk-title" className="text-md font-semibold text-[#141F1E]" required>
              Title
            </Label>
            <Input
              id="risk-title"
              disabled
              value={state.title}
              onChange={(e) => {
                setState((s) => ({ ...s, title: e.target.value }));
                if (e.target.value.trim().length >= 2)
                  setErrors((err) => ({ ...err, title: undefined }));
              }}
              placeholder="e.g. Falls risk — mobility decline"
              className="rounded-xl border-[#BCD3CD] focus-visible:ring-[#4A706A] text-md bg-slate-100/70 text-slate-600 cursor-not-allowed"
              errorMessage={errors.title}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="risk-hazard" className="text-md font-semibold text-[#141F1E]" required>
              Hazard description
            </Label>
            <Textarea
              id="risk-hazard"
              value={state.hazardDescription}
              onChange={(e) => {
                setState((s) => ({ ...s, hazardDescription: e.target.value }));
                if (e.target.value.trim().length >= 5)
                  setErrors((err) => ({ ...err, hazardDescription: undefined }));
              }}
              rows={3}
              placeholder="What is the hazard, who is at risk, and under what circumstances? (min 5 characters)"
              className="rounded-xl border-[#BCD3CD] focus-visible:ring-[#4A706A] text-md"
              errorMessage={errors.hazardDescription}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="risk-who-harmed" className="text-md font-semibold text-[#141F1E]">
              Who could be harmed?
            </Label>
            <Input
              id="risk-who-harmed"
              value={state.whoCouldBeHarmed}
              onChange={(e) =>
                setState((s) => ({ ...s, whoCouldBeHarmed: e.target.value }))
              }
              placeholder="e.g. Residents, staff, visitors"
              className="rounded-xl border-[#BCD3CD] focus-visible:ring-[#4A706A] text-md"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
            <div className="space-y-1.5">
              <Label htmlFor="risk-tool" className="text-md font-semibold text-[#141F1E]">
                Assessment tool
              </Label>
              <Input
                id="risk-tool"
                value={state.tool}
                onChange={(e) => setState((s) => ({ ...s, tool: e.target.value }))}
                placeholder="e.g. Morse Fall Scale"
                className="rounded-xl border-[#BCD3CD] focus-visible:ring-[#4A706A] text-md"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="risk-next-review-date"
                className="text-md font-semibold text-[#141F1E]"
                required
              >
                Next review date
              </Label>
              <Input
                id="risk-next-review-date"
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={state.nextReviewDate}
                onChange={(e) => {
                  setState((s) => ({ ...s, nextReviewDate: e.target.value }));
                  setErrors((errors) => ({ ...errors, nextReviewDate: undefined }));
                }}
                className="w-full rounded-xl border-[#BCD3CD] focus-visible:ring-[#4A706A] text-md bg-white"
                errorMessage={errors.nextReviewDate}
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <Label className="text-md font-semibold text-[#141F1E] block" required>
              Inherent risk (likelihood × severity)
            </Label>
            <RiskMatrixGrid
              likelihood={state.likelihood}
              severity={state.severity}
              onSelect={(l, s) => {
                setState((p) => ({ ...p, likelihood: l, severity: s }));
                setErrors((err) => ({ ...err, inherent: undefined }));
              }}
              caption="Select likelihood and severity"
            />
            {errors.inherent && (
              <p className="text-md text-red-600 mt-1 font-medium">
                {errors.inherent}
              </p>
            )}
          </div>

          {hasInherentRiskSelected && level && levelStyle ? (
            <div className={`rounded-xl p-3.5 border ${levelStyle.bg} border-slate-200`}>
              <p className="text-md font-semibold text-[#141F1E]">
                Inherent risk score:{" "}
                <span className={`font-bold ${levelStyle.text}`}>
                  {score} — {level}
                </span>
              </p>
            </div>
          ) : (
            <div className="rounded-xl p-3.5 bg-slate-50 border border-dashed border-[#BCD3CD] text-[#5D5D5D] text-md italic">
              Please select likelihood and severity from the matrix above *
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="risk-controls" className="text-md font-semibold text-[#141F1E]">
              Control measures (one per line)
            </Label>
            <Textarea
              id="risk-controls"
              rows={4}
              value={state.controlsText}
              onChange={(e) => setState((s) => ({ ...s, controlsText: e.target.value }))}
              placeholder={"Place call bell within reach\nUse bed sensor at night\nFootwear check on each shift"}
              className="rounded-xl border-[#BCD3CD] focus-visible:ring-[#4A706A] text-md"
            />
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-gray-100 shrink-0 flex flex-row items-center justify-end gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-[#BCD3CD] text-[#141F1E] hover:bg-slate-50 text-md font-medium px-4"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="bg-[#4A706A] hover:bg-[#3D5C57] text-white rounded-xl shadow-xs cursor-pointer text-md font-medium px-6"
          >
            {editingAssessment ? "Save Changes" : "Save Assessment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
