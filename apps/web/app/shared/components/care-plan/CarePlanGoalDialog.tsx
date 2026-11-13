"use client";

import React, { useState, useEffect } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  Text,
} from "@repo/ui/components/ui";
import { Target, Sparkles } from "lucide-react";
import { CLINICAL_GOAL_PRESETS, ClinicalGoalPreset } from "./clinicalGoalPresets";
import {
  GoalCategoryTrackingInputs,
  CategoryTrackingState,
  TrackingMode,
} from "./GoalCategoryTrackingInputs";

export interface GoalFormData {
  id?: string;
  title: string;
  targetDescription: string;
  whyItMattersToResident?: string | null;
  category: string;
  reviewFrequency: string;
  progressPercent?: number;
  status: string;
  retirementReason?: string | null;
}

interface CarePlanGoalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GoalFormData) => void;
  initialData?: GoalFormData | null;
  isLoading?: boolean;
}

const CATEGORIES = ["Mobility", "Nutrition", "Medication", "Hygiene", "MentalHealth", "Social", "Clinical", "Personal Care", "Other"];
const FREQUENCIES = ["Daily", "Weekly", "Monthly"];
const STATUSES = ["Active", "Achieved", "Retired"];

const DEFAULT_FORM: GoalFormData = {
  title: "", targetDescription: "", whyItMattersToResident: "",
  category: "Mobility", reviewFrequency: "Weekly", progressPercent: 0,
  status: "Active", retirementReason: "",
};

const DEFAULT_TRACKING: CategoryTrackingState = {
  trackingMode: "milestone", unit: "kg", baselineValue: 55, currentValue: 55,
  targetValue: 60, dailyTargetMl: 1800, progressPercent: 0,
};

const CarePlanGoalSchema = z
  .object({
    title: z.string().trim().min(1, "Goal title is required"),
    targetDescription: z.string().trim().min(1, "Clinical target description is required"),
    status: z.string(),
    retirementReason: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.status === "Retired" && (!val.retirementReason || !val.retirementReason.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["retirementReason"],
        message: "Retirement reason is required",
      });
    }
  });

export function CarePlanGoalDialog({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}: CarePlanGoalDialogProps): React.JSX.Element {
  const [formData, setFormData] = useState<GoalFormData>(DEFAULT_FORM);
  const [trackingState, setTrackingState] = useState<CategoryTrackingState>(DEFAULT_TRACKING);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setErrors({});
    if (initialData) {
      const isWeight = initialData.category === "Nutrition" && (initialData.targetDescription?.toLowerCase().includes("kg") || initialData.targetDescription?.toLowerCase().includes("weight"));
      const isFluid = initialData.targetDescription?.toLowerCase().includes("fluid") || initialData.targetDescription?.toLowerCase().includes("hydration") || initialData.targetDescription?.toLowerCase().includes("ml");

      setFormData({
        ...DEFAULT_FORM,
        ...initialData,
        title: initialData.title || "",
        targetDescription: initialData.targetDescription || "",
        whyItMattersToResident: initialData.whyItMattersToResident || "",
      });

      setTrackingState({
        ...DEFAULT_TRACKING,
        trackingMode: isWeight ? "weight" : isFluid ? "fluid" : "milestone",
        unit: isWeight ? "kg" : "ml",
        progressPercent: initialData.progressPercent || 0,
      });
    } else {
      setFormData(DEFAULT_FORM);
      setTrackingState(DEFAULT_TRACKING);
    }
  }, [initialData, isOpen]);

  const handleApplyPreset = (preset: ClinicalGoalPreset) => {
    setErrors({});
    setFormData((prev) => ({
      ...prev,
      category: preset.category,
      title: preset.title,
      targetDescription: preset.targetDescription,
      reviewFrequency: preset.reviewFrequency,
    }));

    setTrackingState((prev) => ({
      ...prev,
      trackingMode: preset.trackingMode,
      unit: preset.defaultMetrics?.unit || prev.unit,
      baselineValue: preset.defaultMetrics?.baseline || prev.baselineValue,
      currentValue: preset.defaultMetrics?.current || prev.currentValue,
      targetValue: preset.defaultMetrics?.target || prev.targetValue,
      dailyTargetMl: preset.defaultMetrics?.dailyTargetMl || prev.dailyTargetMl,
      progressPercent: 0,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = CarePlanGoalSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const key = issue.path[0]?.toString();
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    let enrichedDescription = formData.targetDescription;
    if (trackingState.trackingMode === "weight") {
      enrichedDescription = `Target: ${trackingState.targetValue} ${trackingState.unit} (Baseline: ${trackingState.baselineValue} ${trackingState.unit}, Current: ${trackingState.currentValue} ${trackingState.unit}) | ${formData.targetDescription}`;
    } else if (trackingState.trackingMode === "fluid") {
      enrichedDescription = `Daily Fluid Target: ${trackingState.dailyTargetMl} ml/day | ${formData.targetDescription}`;
    }

    onSubmit({
      ...formData,
      targetDescription: enrichedDescription,
      progressPercent: trackingState.progressPercent,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent size="xl" className="max-h-[90vh] overflow-y-auto font-['Outfit',sans-serif]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Target className="size-5 text-emerald-800" />
            {initialData ? "Edit Clinical Care Goal" : "Define New Care Goal"}
          </DialogTitle>
          <Text size="md" variant="muted">
            Establish measurable outcomes, category tracking metrics, and evaluation frequency.
          </Text>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit} className="space-y-4 py-2">
          {!initialData && (
            <div className="space-y-1.5 p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl">
              <div className="flex items-center gap-1.5 text-md font-semibold text-emerald-900">
                <Sparkles className="size-3.5 text-emerald-800" />
                <span>Quick Clinical Goal Presets (1-Click Fill)</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {CLINICAL_GOAL_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-800 hover:text-white border border-emerald-200 text-slate-700 text-md font-semibold rounded-xl transition-colors cursor-pointer shadow-2xs"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label required>Goal Title</Label>
            <Input
              placeholder="e.g., Safe Mobilisation with Walking Frame"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
              }}
              errorMessage={errors.title}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-amber-800 text-md font-semibold">Why It Matters to Resident (Co-Production)</Label>
            <Input
              placeholder='e.g. "I want to be able to walk to the garden myself to see the flowers."'
              value={formData.whyItMattersToResident || ""}
              onChange={(e) => setFormData({ ...formData, whyItMattersToResident: e.target.value })}
              className="text-md border-amber-200 bg-amber-50/40"
            />
          </div>

          <GoalCategoryTrackingInputs
            state={trackingState}
            onChange={(updates) => setTrackingState((prev) => ({ ...prev, ...updates }))}
          />

          <div className="space-y-1.5">
            <Label required>Clinical Target &amp; Interventions Plan</Label>
            <Textarea
              placeholder="Describe measurable targets, assistance required, and safety measures..."
              value={formData.targetDescription}
              onChange={(e) => {
                setFormData({ ...formData, targetDescription: e.target.value });
                if (errors.targetDescription) setErrors((prev) => ({ ...prev, targetDescription: "" }));
              }}
              rows={3}
              errorMessage={errors.targetDescription}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label required>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(val) => {
                  let defaultMode: TrackingMode = "milestone";
                  if (val === "Nutrition") defaultMode = "weight";
                  else if (val === "Personal Care" || val === "Hygiene") defaultMode = "routine";
                  setFormData({ ...formData, category: val });
                  setTrackingState((prev) => ({ ...prev, trackingMode: defaultMode }));
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label required>Review Cadence</Label>
              <Select
                value={formData.reviewFrequency}
                onValueChange={(val) => setFormData({ ...formData, reviewFrequency: val })}
              >
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (<SelectItem key={f} value={f}>{f}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label required>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.status === "Retired" && (
            <div className="space-y-1.5">
              <Label required className="text-md font-semibold text-rose-700">Retirement Reason</Label>
              <Input
                placeholder="Clinical reason why this goal is no longer pursued"
                value={formData.retirementReason || ""}
                onChange={(e) => {
                  setFormData({ ...formData, retirementReason: e.target.value });
                  if (errors.retirementReason) setErrors((prev) => ({ ...prev, retirementReason: "" }));
                }}
                className="text-md border-rose-200 bg-rose-50/50 text-rose-900"
                errorMessage={errors.retirementReason}
              />
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-slate-100 gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
            <Button type="submit" disabled={isLoading} className="bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-semibold">
              {initialData ? "Save Changes" : "Create Goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
