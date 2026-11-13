"use client";

import {
  Label,
  Input,
  Badge,
  Text,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui";
import { Scale, Droplets, Target, ListTodo } from "lucide-react";

export type TrackingMode = "weight" | "fluid" | "milestone" | "routine";

export interface CategoryTrackingState {
  trackingMode: TrackingMode;
  unit: string;
  baselineValue: number;
  currentValue: number;
  targetValue: number;
  dailyTargetMl: number;
  progressPercent: number;
}

interface GoalCategoryTrackingInputsProps {
  state: CategoryTrackingState;
  onChange: (updates: Partial<CategoryTrackingState>) => void;
}

export function GoalCategoryTrackingInputs({
  state,
  onChange,
}: GoalCategoryTrackingInputsProps) {
  // Auto-compute weight progress percentage
  const computeWeightProgress = (base: number, curr: number, target: number) => {
    if (target === base) return 0;
    const pct = Math.round(((curr - base) / (target - base)) * 100);
    return Math.min(100, Math.max(0, pct));
  };

  return (
    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3 font-['Outfit',sans-serif]">
      {/* Tracking Mode Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {state.trackingMode === "weight" && <Scale className="size-4 text-emerald-800" />}
          {state.trackingMode === "fluid" && <Droplets className="size-4 text-sky-600" />}
          {state.trackingMode === "milestone" && <Target className="size-4 text-indigo-600" />}
          {state.trackingMode === "routine" && <ListTodo className="size-4 text-amber-600" />}
          <Text size="md" weight="semibold" className="text-slate-800 uppercase tracking-wider">
            {state.trackingMode === "weight"
              ? "Quantitative Target Tracking (Weight / Vitals)"
              : state.trackingMode === "fluid"
                ? "Hydration & Fluid Intake Tracking"
                : state.trackingMode === "routine"
                  ? "Care Routine Adherence Tracking"
                  : "Clinical Outcome Milestone Scale"}
          </Text>
        </div>

        {/* Mode Selector Pill Buttons */}
        <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-200">
          {(["milestone", "weight", "fluid", "routine"] as TrackingMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                let initialPct = state.progressPercent;
                if (mode === "weight") {
                  initialPct = computeWeightProgress(state.baselineValue, state.currentValue, state.targetValue);
                }
                onChange({ trackingMode: mode, progressPercent: initialPct });
              }}
              className={`px-2 py-0.5 text-md font-semibold rounded-lg capitalize transition-all cursor-pointer ${state.trackingMode === mode
                ? "bg-emerald-800 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800"
                }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Mode 1: Weight / Quantitative Tracking */}
      {state.trackingMode === "weight" && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2 text-md">
            <div className="space-y-1">
              <Label>Unit</Label>
              <Select
                value={state.unit}
                onValueChange={(val) => onChange({ unit: val })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="lbs">lbs</SelectItem>
                  <SelectItem value="BMI">BMI</SelectItem>
                  <SelectItem value="%">%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Baseline</Label>
              <Input
                type="number"
                step="0.1"
                value={state.baselineValue || ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  const pct = computeWeightProgress(val, state.currentValue, state.targetValue);
                  onChange({ baselineValue: val, progressPercent: pct });
                }}
                className="text-md"
              />
            </div>
            <div className="space-y-1">
              <Label>Current</Label>
              <Input
                type="number"
                step="0.1"
                value={state.currentValue || ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  const pct = computeWeightProgress(state.baselineValue, val, state.targetValue);
                  onChange({ currentValue: val, progressPercent: pct });
                }}
                className="text-md"
              />
            </div>
            <div className="space-y-1">
              <Label>Target</Label>
              <Input
                type="number"
                step="0.1"
                value={state.targetValue || ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  const pct = computeWeightProgress(state.baselineValue, state.currentValue, val);
                  onChange({ targetValue: val, progressPercent: pct });
                }}
                className="text-md"
              />
            </div>
          </div>

          {/* Computed Percentage Banner */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-md">
            <span className="text-emerald-900 font-medium">
              Progress: <strong>{state.currentValue} {state.unit}</strong> towards <strong>{state.targetValue} {state.unit}</strong>
            </span>
            <Badge variant="secondary" state="success" className="font-bold text-md">
              {state.progressPercent}% Achieved
            </Badge>
          </div>
        </div>
      )}

      {/* Mode 2: Fluid / Hydration Intake */}
      {state.trackingMode === "fluid" && (
        <div className="space-y-2 text-md">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Daily Fluid Target (ml/day)</Label>
              <Input
                type="number"
                step="50"
                value={state.dailyTargetMl || ""}
                onChange={(e) => onChange({ dailyTargetMl: parseInt(e.target.value, 10) || 1500 })}
                className="text-md"
              />
            </div>
            <div className="space-y-1">
              <Label>Minimum Safe Intake (ml)</Label>
              <Input
                type="number"
                step="50"
                defaultValue={1500}
                className="text-md"
              />
            </div>
          </div>
          <p className="text-md text-slate-500">
            Daily fluid charts track today&apos;s intake against the {state.dailyTargetMl} ml/day clinical target.
          </p>
        </div>
      )}

      {/* Mode 3: Milestone Scale (0-100% Slider) */}
      {state.trackingMode === "milestone" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-md">
            <span className="text-slate-600 font-medium">Clinical Outcome Stage</span>
            <span className="font-bold text-emerald-800 text-md">{state.progressPercent}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={state.progressPercent}
            onChange={(e) => onChange({ progressPercent: Number(e.target.value) })}
            className="w-full accent-emerald-800 cursor-pointer h-2 bg-slate-200 rounded-lg"
          />
          <div className="flex justify-between text-md text-slate-400 font-mono">
            <span>0% (Baseline)</span>
            <span>25% (Early)</span>
            <span>50% (Moderate)</span>
            <span>75% (Substantial)</span>
            <span>100% (Achieved)</span>
          </div>
        </div>
      )}

      {/* Mode 4: Care Routine Adherence */}
      {state.trackingMode === "routine" && (
        <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-md text-slate-600 space-y-1">
          <p className="font-medium text-slate-800">
            Automated Shift Routine Adherence
          </p>
          <p className="text-md text-slate-500">
            Progress for this care goal is automatically computed in real time from the daily shift execution rate of all tasks linked to this goal.
          </p>
        </div>
      )}
    </div>
  );
}
