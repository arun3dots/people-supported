"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
  Text,
  DatePicker,
} from "@repo/ui/components/ui";
import { Input } from "@repo/ui/components/ui/Input";
import { Button } from "@repo/ui/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/Select";
import { useCreateExpenseMutation } from "../../../../../../lib/queries/finance/useFinanceQueries";

interface ExpenseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ExpenseFormValues {
  expenseNo?: string;
  category:
    | ""
    | "Medical Supplies"
    | "Food & Catering"
    | "Utilities"
    | "Maintenance"
    | "Staffing & Agency"
    | "Equipment"
    | "Administration"
    | "Other";
  vendor: string;
  description: string;
  amount: string;
  date: string;
  status: "" | "Paid" | "Pending" | "Approved" | "Draft";
  notes?: string;
}

function normalizeAmountInput(value: string): string {
  const cleaned = value.replace(/,/g, "").replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length === 1) return parts[0] || "";
  const whole = parts[0] || "";
  return `${whole}.${parts.slice(1).join("").slice(0, 2)}`;
}

function formatAmountDisplay(value: string): string {
  const normalized = value.replace(/,/g, "");
  if (!normalized) return "";

  const amount = Number(normalized);
  if (!Number.isFinite(amount)) return value;

  const parts = amount.toFixed(2).split(".");
  const whole = parts[0] || "0";
  const decimal = parts[1] || "00";
  const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g,",");
  return `${groupedWhole}.${decimal}`;
}

export function ExpenseDialog({ isOpen, onOpenChange }: ExpenseDialogProps) {
  const createExpenseMutation = useCreateExpenseMutation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    defaultValues: {
      category: "",
      vendor: "",
      description: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      status: "",
      notes: "",
    },
  });

  const handleFormSubmit = async (values: ExpenseFormValues) => {
    if (!values.category || !values.status) return;

    await createExpenseMutation.mutateAsync({
      category: values.category,
      vendor: values.vendor,
      description: values.description,
      amount: Number(values.amount.replace(/,/g, "")),
      date: values.date,
      status: values.status,
      notes: values.notes || undefined,
    });

    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-900">
            Record Supported Living Expense
          </DialogTitle>
          <Text size="md" variant="muted" className="mt-0.5">
            Log medical equipment, utilities, catering, or agency staffing expenses.
          </Text>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-1">
          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            <div className="flex flex-col gap-1.5">
              <Label required>Category</Label>
              <Controller
                name="category"
                control={control}
                rules={{ required: "Category is required" }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Medical Supplies">Medical Supplies</SelectItem>
                      <SelectItem value="Food & Catering">Food & Catering</SelectItem>
                      <SelectItem value="Utilities">Utilities</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Staffing & Agency">Staffing & Agency</SelectItem>
                      <SelectItem value="Equipment">Equipment</SelectItem>
                      <SelectItem value="Administration">Administration</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && (
                <Text variant="error" size="md">{errors.category.message}</Text>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label required>Status</Label>
              <Controller
                name="status"
                control={control}
                rules={{ required: "Status is required" }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && (
                <Text variant="error" size="md">{errors.status.message}</Text>
              )}
            </div>
          </div>

          {/* Vendor / Supplier */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="vendor" required>
              Vendor / Supplier
            </Label>
            <Input
              id="vendor"
              placeholder="e.g. NHS Supplies Ltd / British Gas"
              {...register("vendor", { required: "Vendor name is required" })}
              errorMessage={errors.vendor?.message}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description" required>
              Description
            </Label>
            <Input
              id="description"
              placeholder="e.g. PPE & clinical consumables batch"
              {...register("description", { required: "Description is required" })}
              errorMessage={errors.description?.message}
            />
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount" required>
                Amount (£)
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-[22px] -translate-y-1/2 text-md leading-none text-slate-500 font-medium select-none">£</span>
                <Controller
                  name="amount"
                  control={control}
                  rules={{
                  required: "Amount is required",
                  validate: (value) =>
                    /^\d+(?:,\d{3})*(?:\.\d{1,2})?$/.test(value.trim()) &&
                    Number(value.replace(/,/g, "")) > 0 ||
                    "Enter a valid amount with up to 2 decimal places",
                  }}
                  render={({ field }) => (
                    <Input
                      id="amount"
                      type="text"
                      inputMode="decimal"
                      className="pl-8"
                      placeholder="450.00"
                      value={field.value}
                      onChange={(event) => field.onChange(normalizeAmountInput(event.target.value))}
                      onBlur={() => field.onChange(formatAmountDisplay(field.value))}
                      errorMessage={errors.amount?.message}
                    />
                  )}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date" required>
                Date
              </Label>
              <Controller
                name="date"
                control={control}
                rules={{ required: "Date is required" }}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={(d) => field.onChange(d ? d.toISOString().split("T")[0] : "")}
                    placeholder="Select expense date"
                  />
                )}
              />
              {errors.date && (
                <Text variant="error" size="md">{errors.date.message}</Text>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Additional details, purchase order number, etc."
              {...register("notes")}
            />
          </div>

          <DialogFooter className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createExpenseMutation.isPending}
            >
              {createExpenseMutation.isPending ? "Saving..." : "Save Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
