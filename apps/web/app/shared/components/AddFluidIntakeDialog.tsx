"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Droplet, Utensils, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  DatePicker,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import type { MealSlot } from "@repo/schema";
import {
  useCreateFoodFluidLogMutation,
  useUpdateFoodFluidLogMutation,
} from "../../../lib/queries/residents";
import type { FoodFluidLogItem } from "../../../lib/queries/residents/useGetFoodFluidLogsQuery";

interface AddFluidIntakeDialogProps {
  residentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingLog?: FoodFluidLogItem | null;
  defaultType?: "Fluid" | "Food";
  onSuccess?: () => void;
}

const FLUID_PRESETS = [
  { label: "150 ml (Cup)", value: 150 },
  { label: "200 ml (Glass)", value: 200 },
  { label: "250 ml (Mug)", value: 250 },
  { label: "300 ml (Bottle)", value: 300 },
  { label: "500 ml (Jug)", value: 500 },
];

const FLUID_UNITS = [
  { value: "ml", label: "ml (Millilitres)" },
  { value: "oz", label: "oz (Fluid Ounces)" },
] as const;

const FOOD_UNITS = [
  { value: "portion", label: "Portion(s)" },
  { value: "g", label: "g (Grams)" },
  { value: "%", label: "% (Percentage)" },
] as const;

const FLUID_SLOTS: Array<{ value: MealSlot; label: string }> = [
  { value: "MorningTea", label: "Morning Tea / Round" },
  { value: "AfternoonTea", label: "Afternoon Tea / Round" },
  { value: "NightHydration", label: "Night Hydration" },
  { value: "HydrationRound", label: "Hydration Round" },
  { value: "Other", label: "Other / Ad-hoc" },
];

const FOOD_SLOTS: Array<{ value: MealSlot; label: string }> = [
  { value: "Breakfast", label: "Breakfast" },
  { value: "Lunch", label: "Lunch" },
  { value: "Dinner", label: "Dinner" },
  { value: "Supper", label: "Supper" },
  { value: "Snack", label: "Snack" },
  { value: "Other", label: "Other" },
];

export function AddFluidIntakeDialog({
  residentId,
  open,
  onOpenChange,
  editingLog,
  defaultType = "Fluid",
  onSuccess,
}: AddFluidIntakeDialogProps) {
  const createMutation = useCreateFoodFluidLogMutation(residentId);
  const updateMutation = useUpdateFoodFluidLogMutation(residentId);

  const [type, setType] = useState<"Fluid" | "Food">(defaultType);
  const [mealSlot, setMealSlot] = useState<MealSlot | "">("");
  const [amount, setAmount] = useState<number | "">("");
  const [unit, setUnit] = useState<string>("ml");
  const [intakePercentage, setIntakePercentage] = useState<number | null>(null);
  const [timestamp, setTimestamp] = useState<Date | undefined>(new Date());
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (editingLog) {
      const currentType = editingLog.type || "Fluid";
      setType(currentType);
      setMealSlot((editingLog.mealSlot as MealSlot) || "");
      setAmount(editingLog.amount ?? "");
      setUnit(editingLog.unit || (currentType === "Food" ? "portion" : "ml"));
      setIntakePercentage(editingLog.intakePercentage ?? null);
      setTimestamp(editingLog.timestamp ? new Date(editingLog.timestamp) : new Date());
      setNotes(editingLog.notes || "");
      setError("");
    } else if (open) {
      setType(defaultType);
      setMealSlot("");
      setAmount("");
      setUnit(defaultType === "Food" ? "portion" : "ml");
      setIntakePercentage(null);
      setTimestamp(new Date());
      setNotes("");
      setError("");
    }
  }, [editingLog, open, defaultType]);

  const handleTypeChange = (newType: "Fluid" | "Food") => {
    setType(newType);
    setUnit(newType === "Fluid" ? "ml" : "portion");
    setMealSlot("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === "" || Number(amount) <= 0) {
      setError("Please specify a valid intake amount greater than 0");
      return;
    }
    setError("");

    const payload = {
      type,
      amount: Number(amount),
      unit: (unit || (type === "Food" ? "portion" : "ml")) as "ml" | "g" | "oz" | "%" | "portion",
      mealSlot: mealSlot ? (mealSlot as MealSlot) : undefined,
      intakePercentage: intakePercentage !== null && intakePercentage !== undefined ? Number(intakePercentage) : undefined,
      notes: notes.trim() || undefined,
      timestamp: (timestamp ? timestamp.toISOString() : new Date().toISOString()) as unknown as Date,
    };

    const handleSuccess = () => {
      onOpenChange(false);
      onSuccess?.();
    };

    if (editingLog) {
      updateMutation.mutate({ logId: editingLog.id, data: payload }, { onSuccess: handleSuccess });
    } else {
      createMutation.mutate(payload, { onSuccess: handleSuccess });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="p-6 font-sans">
        <DialogHeader className="border-b border-slate-200/80 pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            {type === "Fluid" ? <Droplet className="size-5 text-[#4A706A]" /> : <Utensils className="size-5 text-amber-600" />}
            {editingLog ? "Edit Intake Entry" : "Record Intake"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* 1. Type Selector */}
          <div className="space-y-1.5">
            <Label>Intake Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange("Fluid")}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer",
                  type === "Fluid"
                    ? "border-[#4A706A] bg-[#4A706A]/10 text-[#4A706A] shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                )}
              >
                <Droplet className="size-4 text-[#4A706A]" />
                <span>Fluid Intake</span>
                {type === "Fluid" && <Check className="size-4 ml-auto text-[#4A706A]" />}
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange("Food")}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer",
                  type === "Food"
                    ? "border-amber-600 bg-amber-50 text-amber-900 shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                )}
              >
                <Utensils className="size-4 text-amber-600" />
                <span>Food Intake</span>
                {type === "Food" && <Check className="size-4 ml-auto text-amber-700" />}
              </button>
            </div>
          </div>

          {/* 2. Quick Fluid Presets (if fluid) */}
          {type === "Fluid" && (
            <div className="space-y-1.5">
              <Label>Quick Amount Presets</Label>
              <div className="flex flex-wrap gap-1.5">
                {FLUID_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => { setAmount(p.value); setUnit("ml"); setError(""); }}
                    className={cn(
                      "text-sm px-2.5 py-1.5 rounded-lg border font-medium transition-all cursor-pointer",
                      amount === p.value && unit === "ml"
                        ? "bg-[#4A706A] text-white border-[#4A706A] shadow-xs font-semibold"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Amount and Unit Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label required>Amount</Label>
              <Input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value === "" ? "" : Number(e.target.value));
                  setError("");
                }}
                placeholder={type === "Fluid" ? "e.g. 200" : "e.g. 1"}
                errorMessage={error}
              />
            </div>

            <div className="space-y-1.5">
              <Label required>Unit</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {type === "Fluid"
                    ? FLUID_UNITS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          {u.label}
                        </SelectItem>
                      ))
                    : FOOD_UNITS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          {u.label}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 4. Meal / Hydration Slot & Consumed % */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{type === "Fluid" ? "Hydration Round / Slot" : "Meal Slot"}</Label>
              <Select value={mealSlot} onValueChange={(v) => setMealSlot(v as MealSlot)}>
                <SelectTrigger>
                  <SelectValue placeholder={type === "Fluid" ? "Select hydration round" : "Select meal slot"} />
                </SelectTrigger>
                <SelectContent>
                  {(type === "Fluid" ? FLUID_SLOTS : FOOD_SLOTS).map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Percentage Consumed</Label>
              <div className="flex gap-1.5 pt-1">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setIntakePercentage(intakePercentage === pct ? null : pct)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg border text-sm font-semibold transition-all cursor-pointer",
                      intakePercentage === pct
                        ? "bg-[#4A706A] text-white border-[#4A706A] shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
                    )}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Date and Time */}
          <div className="space-y-1.5">
            <Label>Date &amp; Time Logged</Label>
            <DatePicker
              variant="datetime"
              use12Hours={false}
              value={timestamp ? format(timestamp, "yyyy-MM-dd'T'HH:mm") : ""}
              onChange={(d) => setTimestamp(d || new Date())}
            />
          </div>

          {/* 6. Notes / Liquid Type / Details */}
          <div className="space-y-1.5">
            <Label>Notes / Details</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={type === "Fluid" ? "e.g. Water, tea with milk." : "e.g. Toast, soup, pudding."}
              rows={2}
            />
          </div>

          <DialogFooter className="pt-2 border-t border-slate-200/80 gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isPending}
              className="bg-[#4A706A] hover:bg-[#3D5E59] text-white font-semibold cursor-pointer"
            >
              {isPending ? "Saving..." : editingLog ? "Update Intake" : "Save Intake"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
