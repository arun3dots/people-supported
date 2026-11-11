"use client";

import React from "react";
import { Control, Controller, UseFormRegister, UseFormSetValue } from "react-hook-form";
import {
  Card,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  DatePicker,
} from "@repo/ui/components/ui";
import type { NewInvoiceFormValues } from "../types";

interface InvoiceDetailsCardProps {
  register: UseFormRegister<NewInvoiceFormValues>;
  control: Control<NewInvoiceFormValues>;
  setValue: UseFormSetValue<NewInvoiceFormValues>;
  watchedPaymentTerms: string;
  watchedIssuedDate: string;
  watchedDueDate?: string;
}

export function InvoiceDetailsCard({
  register,
  control,
  setValue,
  watchedPaymentTerms,
  watchedIssuedDate,
  watchedDueDate,
}: InvoiceDetailsCardProps) {
  const calculateDueDate = (baseDateStr: string, terms: string) => {
    const baseDate = baseDateStr ? new Date(baseDateStr) : new Date();
    let days = 30;
    if (terms === "14 Days") days = 14;
    else if (terms === "7 Days") days = 7;
    else if (terms === "Due on Receipt") days = 0;
    else if (terms === "60 Days") days = 60;

    const newDueDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
    return newDueDate.toISOString().split("T")[0] || "";
  };

  const minDueDate = React.useMemo(() => {
    if (!watchedIssuedDate) return undefined;
    const d = new Date(watchedIssuedDate);
    return isNaN(d.getTime()) ? undefined : d;
  }, [watchedIssuedDate]);

  const handlePaymentTermsChange = (terms: string) => {
    setValue("paymentTerms", terms, { shouldDirty: true, shouldValidate: true });
    setValue("dueDate", calculateDueDate(watchedIssuedDate, terms), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleIssuedDateChange = (date: Date | undefined) => {
    const dateStr = date ? date.toISOString().split("T")[0] || "" : "";
    setValue("issuedDate", dateStr, { shouldDirty: true, shouldValidate: true });
    if (dateStr) {
      if (watchedPaymentTerms) {
        setValue("dueDate", calculateDueDate(dateStr, watchedPaymentTerms), {
          shouldDirty: true,
          shouldValidate: true,
        });
      } else if (watchedDueDate) {
        const currentDue = new Date(watchedDueDate);
        const newIssue = new Date(dateStr);
        if (currentDue < newIssue) {
          setValue("dueDate", dateStr, { shouldDirty: true, shouldValidate: true });
        }
      }
    }
  };

  const handleDueDateChange = (date: Date | undefined) => {
    if (!date) {
      setValue("dueDate", "", { shouldDirty: true, shouldValidate: true });
      return;
    }
    if (minDueDate) {
      const selected = new Date(date);
      selected.setHours(0, 0, 0, 0);
      const min = new Date(minDueDate);
      min.setHours(0, 0, 0, 0);
      if (selected < min) {
        return;
      }
    }
    const dateStr = date.toISOString().split("T")[0] || "";
    setValue("dueDate", dateStr, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <Card className="p-6 flex flex-col gap-6 w-full font-['Outfit',sans-serif]">
      {/* Card Header matching Staff style */}
      <div className="w-full flex items-center justify-between">
        <div>
          <Text as="h3" size="sm" weight="medium" className="text-slate-900">
            Invoice Details
          </Text>
          <Text size="sm" weight="regular" className="text-slate-500 mt-0.5">
            Auto-generated invoice number, dates, payment terms, and reference
          </Text>
        </div>
      </div>

      {/* Row 1: Invoice Number, Issue Date, Due Date */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Invoice Number */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invoiceNumber">Invoice Number</Label>
          <Input
            id="invoiceNumber"
            {...register("invoiceNumber")}
            readOnly
            className="bg-slate-50 text-slate-700 cursor-not-allowed border-slate-200"
            placeholder="e.g. INV-2026-0123"
          />
        </div>

        {/* Issue Date */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="issuedDate">Issue Date</Label>
          <Controller
            name="issuedDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                id="issuedDate"
                value={field.value}
                onChange={handleIssuedDateChange}
                maxYear={new Date().getFullYear() + 5}
                placeholder="Select"
                showCalendarIcon={false}
                showChevron={true}
              />
            )}
          />
        </div>

        {/* Due Date */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dueDate">Due Date</Label>
          <Controller
            name="dueDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                id="dueDate"
                value={field.value}
                onChange={handleDueDateChange}
                minDate={minDueDate}
                maxYear={new Date().getFullYear() + 5}
                placeholder="Select"
                showCalendarIcon={false}
                showChevron={true}
              />
            )}
          />
        </div>
      </div>

      {/* Row 2: Payment Terms & Reference */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Terms */}
        <div className="flex flex-col gap-1.5">
          <Label>Payment Terms</Label>
          <Select
            value={watchedPaymentTerms || ""}
            onValueChange={handlePaymentTermsChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30 Days">30 Days</SelectItem>
              <SelectItem value="14 Days">14 Days</SelectItem>
              <SelectItem value="7 Days">7 Days</SelectItem>
              <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
              <SelectItem value="60 Days">60 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reference */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reference">Reference</Label>
          <Input
            id="reference"
            {...register("reference")}
            placeholder="e.g. PO-2026-0180"
          />
        </div>
      </div>
    </Card>
  );
}
