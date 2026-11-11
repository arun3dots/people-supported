"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Button,
  Input,
  Label,
  Switch,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Text,
} from "@repo/ui/components/ui";
import { Loader2 } from "lucide-react";
import type { CreatePackageDTO } from "@repo/schema";
import type { SubscriptionPackage } from "../../../lib/types/package";

interface FormState {
  name: string;
  priceMonthly: string;
  residentLimit: string;
  staffLimit: string;
  currency: string;
  isPublic: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  priceMonthly: "",
  residentLimit: "",
  staffLimit: "",
  currency: "INR",
  isPublic: true,
};

function toFormState(pkg: SubscriptionPackage): FormState {
  return {
    name: pkg.name,
    priceMonthly: String(pkg.priceMonthly),
    residentLimit: String(pkg.residentLimit),
    staffLimit: String(pkg.staffLimit),
    currency: pkg.currency,
    isPublic: pkg.isPublic,
  };
}

interface PackageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: SubscriptionPackage | null;
  saving: boolean;
  /** Persist the package. Should reject to surface an error in the dialog. */
  onSave: (payload: CreatePackageDTO) => Promise<void>;
}

export function PackageFormDialog({
  open,
  onOpenChange,
  editing,
  saving,
  onSave,
}: PackageFormDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(editing ? toFormState(editing) : EMPTY_FORM);
    setError("");
  }, [open, editing]);

  const handleSave = async () => {
    setError("");
    const payload: CreatePackageDTO = {
      name: form.name.trim(),
      priceMonthly: Number(form.priceMonthly),
      residentLimit: Number(form.residentLimit),
      staffLimit: Number(form.staffLimit),
      currency: form.currency.trim() || "INR",
      isPublic: form.isPublic,
      featureFlags: {},
    };
    if (
      !payload.name ||
      Number.isNaN(payload.priceMonthly) ||
      !Number.isInteger(payload.residentLimit) ||
      payload.residentLimit <= 0 ||
      !Number.isInteger(payload.staffLimit) ||
      payload.staffLimit <= 0
    ) {
      setError("Please fill all fields with valid values.");
      return;
    }
    try {
      await onSave(payload);
      onOpenChange(false);
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Failed to save package",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white p-6 rounded-2xl">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <DialogTitle>
            <Text as="h3" size="md" weight="bold" className="text-slate-900">
              {editing ? "Edit Package" : "New Package"}
            </Text>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-100">
              {error}
            </div>
          )}
          <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
            <Label required>Package Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Standard"
            />
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label required>Monthly Price</Label>
              <Input
                type="number"
                value={form.priceMonthly}
                onChange={(e) =>
                  setForm({ ...form, priceMonthly: e.target.value })
                }
                placeholder="999"
              />
            </div>
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label required>Currency</Label>
              <Input
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                placeholder="INR"
              />
            </div>
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label required>Resident Limit</Label>
              <Input
                type="number"
                value={form.residentLimit}
                onChange={(e) =>
                  setForm({ ...form, residentLimit: e.target.value })
                }
                placeholder="50"
              />
            </div>
            <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
              <Label required>Staff Limit</Label>
              <Input
                type="number"
                value={form.staffLimit}
                onChange={(e) =>
                  setForm({ ...form, staffLimit: e.target.value })
                }
                placeholder="50"
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/70 p-3.5">
            <div>
              <Text size="xs" weight="semibold" className="text-slate-900">
                Public Plan
              </Text>
              <Text size="xs" variant="subdued" className="text-2xs">
                Show on public onboarding page
              </Text>
            </div>
            <Switch
              checked={form.isPublic}
              onCheckedChange={(v) => setForm({ ...form, isPublic: v })}
            />
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            {editing ? "Save Changes" : "Create Package"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
