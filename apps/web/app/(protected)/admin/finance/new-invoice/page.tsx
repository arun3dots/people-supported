"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray, FieldErrors } from "react-hook-form";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  Button,
  Card,
  Text,
  Textarea,
  toast,
} from "@repo/ui/components/ui";
import { useGetResidentsQuery } from "../../../../../lib/queries/residents/useGetResidentsQuery";
import { useCreateInvoiceMutation } from "../../../../../lib/queries/finance/useFinanceQueries";
import type { Resident } from "../../../../../lib/types/resident";
import type { NewInvoiceFormValues } from "./types";
import { InvoiceDetailsCard } from "./components/InvoiceDetailsCard";
import { BillToCard } from "./components/BillToCard";
import { InvoiceItemsCard } from "./components/InvoiceItemsCard";
import { useInvoiceDraftStorage } from "./hooks/useInvoiceDraftStorage";

export default function NewInvoicePage() {
  const router = useRouter();
  const { data: rawResidents } = useGetResidentsQuery();
  const residents = React.useMemo(
    () =>
      rawResidents?.filter(
        (r) =>
          !r.isDraft &&
          !["draft", "discharged"].includes((r.status || "").toLowerCase())
      ),
    [rawResidents]
  );
  const createInvoiceMutation = useCreateInvoiceMutation();

  const currentYear = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<NewInvoiceFormValues>({
    defaultValues: {
      invoiceNumber: `INV-${currentYear}-${randomSuffix}`,
      issuedDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      paymentTerms: "",
      reference: "",
      billToType: "Resident",
      residentId: "",
      payerName: "",
      addressLine1: "",
      city: "",
      email: "",
      phone: "",
      postcode: "",
      country: "",
      items: [],
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const { clearDraft, saveDraft } = useInvoiceDraftStorage({
    watch,
    reset,
    getValues,
    setValue,
  });

  const watchedBillTo = watch("billToType");
  const watchedItems = watch("items") || [];
  const watchedPaymentTerms = watch("paymentTerms");
  const watchedIssuedDate = watch("issuedDate");
  const watchedDueDate = watch("dueDate");
  const watchedResidentId = watch("residentId");
  const watchedPayerName = watch("payerName");

  const handleResidentSelected = (resident: Resident) => {
    setValue("residentId", resident.id, { shouldValidate: true, shouldDirty: true });
    trigger("residentId");
    setValue("payerName", resident.fullName || "", { shouldValidate: true, shouldDirty: true });
    setValue(
      "addressLine1",
      resident.profile?.addressLine1 ||
        resident.nextOfKin?.address ||
        (resident.bed?.room?.roomNumber ? `Room ${resident.bed.room.roomNumber}` : ""),
      { shouldValidate: true, shouldDirty: true }
    );
    setValue("city", resident.profile?.city || "", { shouldValidate: true, shouldDirty: true });
    setValue("postcode", resident.profile?.postcode || "", { shouldValidate: true, shouldDirty: true });
    setValue("country", resident.profile?.country || "", { shouldValidate: true, shouldDirty: true });
    setValue("email", resident.nextOfKin?.email || "", { shouldValidate: true, shouldDirty: true });
    setValue("phone", resident.nextOfKin?.phoneNumber || "", { shouldValidate: true, shouldDirty: true });
    saveDraft();
  };

  const onInvalid = (fieldErrors: FieldErrors<NewInvoiceFormValues>) => {
    if (fieldErrors.residentId) {
      toast({ title: "Resident Required", description: "Please select a resident to bill for this invoice.", variant: "error" });
      return;
    }
    if (fieldErrors.payerName) {
      toast({ title: "Payer Name Required", description: "Please enter the organisation or payer name.", variant: "error" });
      return;
    }
    if (fieldErrors.items) {
      toast({ title: "Invalid Invoice Items", description: "Please check all invoice line items.", variant: "error" });
      return;
    }
    const firstKey = Object.keys(fieldErrors)[0];
    const firstErr = firstKey ? fieldErrors[firstKey as keyof NewInvoiceFormValues] : undefined;
    const msg = typeof firstErr?.message === "string" ? firstErr.message : "Please check all required fields before continuing.";
    toast({ title: "Validation Error", description: msg, variant: "error" });
  };

  const onSubmit = async (data: NewInvoiceFormValues, status: "Unpaid" | "Draft") => {
    const activeResidentId = data.residentId || watchedResidentId || (residents?.[0]?.id ?? "");

    if (!activeResidentId) {
      toast({
        title: "Resident Required",
        description: "Please select a resident to bill for this invoice.",
        variant: "error",
      });
      return;
    }

    if (data.issuedDate && data.dueDate) {
      const issueTime = new Date(data.issuedDate).setHours(0, 0, 0, 0);
      const dueTime = new Date(data.dueDate).setHours(0, 0, 0, 0);
      if (dueTime < issueTime) {
        toast({
          title: "Invalid Due Date",
          description: "Due date cannot be earlier than the issue date.",
          variant: "error",
        });
        return;
      }
    }

    if (data.billToType === "Organisation / Payer" && !data.payerName?.trim()) {
      toast({
        title: "Payer Name Required",
        description: "Please enter the organisation or payer name.",
        variant: "error",
      });
      return;
    }

    if (!data.items || data.items.length === 0) {
      toast({
        title: "Line Items Required",
        description: "Please add at least one line item before creating the invoice.",
        variant: "error",
      });
      return;
    }

    const hasInvalidItem = data.items.some(
      (it) => !it.description?.trim() || Number(it.quantity) <= 0 || Number(it.unitPrice) < 0
    );
    if (hasInvalidItem) {
      toast({
        title: "Invalid Line Items",
        description: "Each item must have a description, a positive quantity, and a valid unit price.",
        variant: "error",
      });
      return;
    }

    const totalAmount = data.items.reduce(
      (sum, item) => sum + (Number(item.total) || 0),
      0
    );

    if (totalAmount <= 0) {
      toast({
        title: "Invalid Total Amount",
        description: "The total invoice amount must be greater than £0.00.",
        variant: "error",
      });
      return;
    }

    try {
      await createInvoiceMutation.mutateAsync({
        residentId: activeResidentId,
        billToType: data.billToType,
        payerName: data.payerName || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        addressLine1: data.addressLine1 || undefined,
        city: data.city || undefined,
        postcode: data.postcode || undefined,
        country: data.country || "United Kingdom",
        invoiceNumber: data.invoiceNumber || undefined,
        invoiceType: "Residential Fees",
        paymentTerms: data.paymentTerms,
        reference: data.reference || undefined,
        amount: totalAmount > 0 ? totalAmount : 2850,
        issuedDate: data.issuedDate,
        dueDate: data.dueDate,
        notes: data.notes || undefined,
        items: data.items.map((it) => ({
          description: it.description || "Care Fees",
          category: it.category || "Care Fees",
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          vatRate: Number(it.vatRate || 0),
          total: Number(it.total) || 0,
        })),
        status,
      });

      toast({
        title: status === "Draft" ? "Draft Saved" : "Invoice Created",
        description: `Invoice ${data.invoiceNumber || ""} has been successfully saved.`,
        variant: "success",
      });

      clearDraft();
      router.push("/admin/finance/invoices");
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to create invoice. Please check the required fields.";
      toast({
        title: "Invoice Creation Failed",
        description: errorMsg,
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Header Section matching Staff style */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Text size="xl" weight="bold">New Invoice</Text>
          <Text size="sm" weight="regular" className="text-slate-500 mt-0.5">
            Create and send new invoice to a resident or payer
          </Text>
        </div>
      </div>

      <form noValidate className="space-y-6">
        {/* Section 1: Invoice Details */}
        <InvoiceDetailsCard
          register={register}
          control={control}
          setValue={setValue}
          watchedPaymentTerms={watchedPaymentTerms}
          watchedIssuedDate={watchedIssuedDate}
          watchedDueDate={watchedDueDate}
        />

        {/* Section 2: Bill To */}
        <BillToCard
          register={register}
          control={control}
          setValue={setValue}
          watchedBillTo={watchedBillTo}
          watchedResidentId={watchedResidentId}
          watchedPayerName={watchedPayerName}
          residents={residents}
          errors={errors}
          onResidentSelect={handleResidentSelected}
        />

        {/* Section 3: Invoice Items */}
        <InvoiceItemsCard
          register={register}
          control={control}
          setValue={setValue}
          fields={fields}
          append={append}
          remove={remove}
          watchedItems={watchedItems}
          errors={errors}
        />

        {/* Section 4: Notes */}
        <Card className="p-6 flex flex-col gap-6 w-full font-['Outfit',sans-serif]">
          <div className="w-full flex items-center justify-between">
            <div>
              <Text as="h3" size="sm" weight="medium" className="text-slate-900">
                Notes
              </Text>
              <Text size="sm" weight="regular" className="text-slate-500 mt-0.5">
                Optional payment instructions or additional context for the recipient
              </Text>
            </div>
          </div>
          <Textarea
            rows={4}
            placeholder="Add any notes or payment instructions for the recipient..."
            {...register("notes")}
          />
        </Card>

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleSubmit((d) => onSubmit(d, "Draft"), onInvalid)}
            disabled={createInvoiceMutation.isPending}
          >
            Save Draft
          </Button>

          <div className="flex items-center gap-3">
            <Link href="/admin/finance/invoices">
              <Button type="button" variant="ghost">
                <ArrowLeft className="size-4 mr-1.5" /> Back
              </Button>
            </Link>

            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit((d) => onSubmit(d, "Unpaid"), onInvalid)}
              disabled={createInvoiceMutation.isPending}
            >
              {createInvoiceMutation.isPending ? "Creating..." : "Continue"}
              <ArrowRight className="size-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
