"use client";

import { useEffect, useRef } from "react";
import type {
  UseFormGetValues,
  UseFormReset,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import type { NewInvoiceFormValues } from "../types";

export const INVOICE_DRAFT_KEY = "lcm_new_invoice_draft";

export function readInvoiceDraft(): Partial<NewInvoiceFormValues> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(INVOICE_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<NewInvoiceFormValues>;
  } catch {
    return null;
  }
}

export function writeInvoiceDraft(data: NewInvoiceFormValues): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(INVOICE_DRAFT_KEY, JSON.stringify(data));
  } catch {
    return;
  }
}

export function clearInvoiceDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(INVOICE_DRAFT_KEY);
  } catch {
    return;
  }
}

interface UseInvoiceDraftStorageParams {
  watch: UseFormWatch<NewInvoiceFormValues>;
  reset: UseFormReset<NewInvoiceFormValues>;
  getValues: UseFormGetValues<NewInvoiceFormValues>;
  setValue: UseFormSetValue<NewInvoiceFormValues>;
}

export function useInvoiceDraftStorage({
  watch,
  reset,
  getValues,
  setValue,
}: UseInvoiceDraftStorageParams) {
  const isRestoredRef = useRef(false);

  // Restore draft from sessionStorage on mount
  useEffect(() => {
    const draft = readInvoiceDraft();
    if (draft) {
      reset({
        ...getValues(),
        ...draft,
      });
      if (draft.residentId) {
        setValue("residentId", draft.residentId, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
      if (draft.payerName) {
        setValue("payerName", draft.payerName, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }
    isRestoredRef.current = true;
  }, [reset, getValues, setValue]);

  // Subscribe to form changes and persist to sessionStorage using full form snapshot
  useEffect(() => {
    const subscription = watch(() => {
      if (!isRestoredRef.current) return;
      const currentData = getValues();
      const hasContent = Boolean(
        currentData.residentId ||
        currentData.payerName?.trim() ||
        currentData.addressLine1?.trim() ||
        currentData.city?.trim() ||
        currentData.postcode?.trim() ||
        currentData.country?.trim() ||
        currentData.paymentTerms?.trim() ||
        currentData.reference?.trim() ||
        currentData.notes?.trim() ||
        (currentData.items && currentData.items.length > 0)
      );

      if (hasContent) {
        // Guard against transient empty residentId wiping an existing saved resident
        if (!currentData.residentId) {
          const prev = readInvoiceDraft();
          if (prev?.residentId) {
            currentData.residentId = prev.residentId;
            if (!currentData.payerName && prev.payerName) {
              currentData.payerName = prev.payerName;
            }
          }
        }
        writeInvoiceDraft(currentData);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, getValues]);

  const saveDraft = (data?: NewInvoiceFormValues) => {
    const toSave = data || getValues();
    if (!toSave.residentId) {
      const prev = readInvoiceDraft();
      if (prev?.residentId) {
        toSave.residentId = prev.residentId;
        if (!toSave.payerName && prev.payerName) {
          toSave.payerName = prev.payerName;
        }
      }
    }
    writeInvoiceDraft(toSave);
  };

  return {
    clearDraft: clearInvoiceDraft,
    saveDraft,
  };
}
