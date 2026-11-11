"use client";

import { useState } from "react";
import { Package, PlusCircle, Loader2 } from "lucide-react";
import { Button, Text } from "@repo/ui/components/ui";
import type { CreatePackageDTO } from "@repo/schema";
import {
  useGetPackagesQuery,
  useCreatePackageMutation,
  useUpdatePackageMutation,
  useDeactivatePackageMutation,
} from "../../lib/queries/packages";
import type { SubscriptionPackage } from "../../lib/types/package";
import { PackageCard } from "./components/PackageCard";
import { PackageFormDialog } from "./components/PackageFormDialog";

export default function PackagesPage() {
  const { data: packages, isLoading } = useGetPackagesQuery();
  const createMutation = useCreatePackageMutation();
  const updateMutation = useUpdatePackageMutation();
  const deactivateMutation = useDeactivatePackageMutation();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPackage | null>(null);

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (pkg: SubscriptionPackage) => {
    setEditing(pkg);
    setOpen(true);
  };

  const handleSave = async (payload: CreatePackageDTO) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <Text as="h1" size="xl" weight="bold" className="text-slate-900 tracking-tight flex items-center gap-2.5">
            <Package className="size-5 text-emerald-800" />
            Subscription Packages
          </Text>
          <Text size="xs" weight="regular" variant="subdued" className="mt-1">
            Manage tier configurations, resident quotas and recurring billing plans.
          </Text>
        </div>
        <Button variant="primary" onClick={openCreate} className="gap-2">
          <PlusCircle className="size-4" /> New Package
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-8 animate-spin text-emerald-800" />
        </div>
      ) : !packages?.length ? (
        <div className="bg-surface-card-grey rounded-2xl p-12 text-center">
          <Text size="sm" variant="subdued">
            No packages yet. Create your first subscription package.
          </Text>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onEdit={openEdit}
              onDeactivate={(id) => deactivateMutation.mutate(id)}
              deactivating={deactivateMutation.isPending}
            />
          ))}
        </div>
      )}

      <PackageFormDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        saving={saving}
        onSave={handleSave}
      />
    </div>
  );
}
