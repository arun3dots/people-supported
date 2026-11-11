"use client";

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  Textarea,
  DatePicker,
} from "@repo/ui/components/ui";
import { ShieldCheck } from "lucide-react";
import { useRecordPaymentMutation } from "../../../../../lib/queries/finance/useFinanceQueries";
import type { InvoiceResponse, PaymentHistoryResponse } from "../../../../../lib/queries/finance/types";

interface RecordPaymentDialogProps {
  invoice: InvoiceResponse | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PaymentFormValues {
  amountPaid: number;
  paymentDate: string;
  paymentMethod: "Bank Transfer" | "Direct Debit" | "Credit/Debit Card" | "Cheque" | "Cash" | "Other";
  reference?: string;
  payerName: string;
  notes?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function RecordPaymentDialog({
  invoice,
  isOpen,
  onOpenChange,
}: RecordPaymentDialogProps) {
  const recordPaymentMutation = useRecordPaymentMutation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    defaultValues: {
      amountPaid: 0,
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "Bank Transfer",
      reference: "",
      payerName: "",
      notes: "",
    },
  });

  const totalPaidSoFar = (invoice?.paymentHistory ?? []).reduce(
    (acc: number, curr: PaymentHistoryResponse) => acc + curr.amountPaid,
    0
  );
  const currentInvoiceBalance = Math.max(0, (invoice?.amount || 0) - totalPaidSoFar);

  useEffect(() => {
    if (invoice && isOpen) {
      const defaultPayer =
        invoice.resident?.nextOfKin?.name
          ? `${invoice.resident.nextOfKin.name}${invoice.resident.nextOfKin.relationship
            ? ` (${invoice.resident.nextOfKin.relationship})`
            : ""
          }`
          : invoice.resident?.fullName || "";

      reset({
        amountPaid: currentInvoiceBalance,
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMethod: "Bank Transfer",
        reference: "",
        payerName: defaultPayer,
        notes: "",
      });
    }
  }, [invoice, isOpen, reset, currentInvoiceBalance]);

  const watchedAmount = watch("amountPaid");
  const remainingAfterPayment = Math.max(0, currentInvoiceBalance - (Number(watchedAmount) || 0));

  const onSubmit = async (data: PaymentFormValues) => {
    if (!invoice) return;
    try {
      await recordPaymentMutation.mutateAsync({
        invoiceId: invoice.id,
        amountPaid: Number(data.amountPaid),
        paymentDate: data.paymentDate,
        paymentMethod: data.paymentMethod,
        reference: data.reference || undefined,
        status: "Completed",
        notes: data.notes
          ? `${data.notes}${data.payerName ? ` (Payer: ${data.payerName})` : ""}`
          : data.payerName
            ? `Payer: ${data.payerName}`
            : undefined,
      });
      onOpenChange(false);
    } catch {
      // Handled in mutation hook
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <DialogTitle asChild>
              <Text size="lg" weight="bold" className="text-slate-900">
                Record Payment
              </Text>
            </DialogTitle>
          </div>
          <Text size="sm" weight="regular" className="text-slate-500 mt-0.5">
            Record a full or partial settlement received for invoice {invoice.invoiceNumber}.
          </Text>
        </DialogHeader>

        {/* Invoice Summary Box */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 my-1">
          <div className="flex justify-between items-center text-md">
            <Text size="sm" weight="medium" className="text-slate-600">Resident / Payer:</Text>
            <Text size="sm" weight="semibold" className="text-slate-900">{invoice.resident?.fullName || "—"}</Text>
          </div>
          <div className="flex justify-between items-center text-md mt-1.5">
            <Text size="sm" weight="medium" className="text-slate-600">Total Invoiced:</Text>
            <Text size="sm" weight="semibold" className="text-slate-900">{formatCurrency(invoice.amount)}</Text>
          </div>
          <div className="flex justify-between items-center text-md mt-1.5 pt-1.5 border-t border-slate-200">
            <Text size="sm" weight="bold" className="text-slate-700">Outstanding Balance:</Text>
            <Text size="sm" weight="bold" className="text-emerald-700">{formatCurrency(currentInvoiceBalance)}</Text>
          </div>
        </div>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Amount Paid */}
          <div className="space-y-1.5">
            <Label htmlFor="amountPaid" required>Amount Received (£)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-md text-slate-400 font-medium select-none">£</span>
              <Input
                id="amountPaid"
                type="number"
                step="0.01"
                min="0.01"
                max={currentInvoiceBalance > 0 ? currentInvoiceBalance : undefined}
                className="pl-8"
                {...register("amountPaid", {
                  required: "Amount received is required",
                  min: { value: 0.01, message: "Amount must be greater than £0.00" },
                  valueAsNumber: true,
                })}
              />
            </div>
            {errors.amountPaid && (
              <Text variant="error" size="sm">{errors.amountPaid.message}</Text>
            )}
            <div className="flex justify-between text-md text-slate-500 pt-0.5">
              <Text size="sm" weight="regular" className="text-slate-500">Remaining Balance after this payment:</Text>
              <Text size="sm" weight="semibold" className={remainingAfterPayment === 0 ? "text-emerald-700 font-bold" : "text-slate-700"}>
                {formatCurrency(remainingAfterPayment)} {remainingAfterPayment === 0 ? "(Paid in Full)" : ""}
              </Text>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Payment Date */}
            <div className="space-y-1.5">
              <Label htmlFor="paymentDate" required>Payment Date</Label>
              <Controller
                name="paymentDate"
                control={control}
                rules={{ required: "Payment date is required" }}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={(d) => field.onChange(d ? d.toISOString().split("T")[0] : "")}
                    placeholder="Select payment date"
                  />
                )}
              />
              {errors.paymentDate && (
                <Text variant="error" size="sm">{errors.paymentDate.message}</Text>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-1.5">
              <Label required>Payment Method</Label>
              <Controller
                name="paymentMethod"
                control={control}
                rules={{ required: "Payment method is required" }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Direct Debit">Direct Debit</SelectItem>
                      <SelectItem value="Credit/Debit Card">Credit/Debit Card</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Reference / Transaction ID */}
            <div className="space-y-1.5">
              <Label htmlFor="reference">Payment Reference</Label>
              <Input
                id="reference"
                placeholder="e.g. BACS-98432 or Cheque #104"
                {...register("reference")}
              />
            </div>

            {/* Payer Name */}
            <div className="space-y-1.5">
              <Label htmlFor="payerName" required>Payer Name / Details</Label>
              <Input
                id="payerName"
                placeholder="e.g. Mary Linton (Daughter) or Local Council"
                {...register("payerName", { required: "Payer name is required" })}
              />
              {errors.payerName && (
                <Text variant="error" size="sm">{errors.payerName.message}</Text>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Internal Accounting Notes</Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="Add any additional context, receipt numbers, or details..."
              {...register("notes")}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={recordPaymentMutation.isPending}
              className="gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="size-4" />
              {recordPaymentMutation.isPending ? "Recording..." : "Confirm & Save Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
