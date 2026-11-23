"use client";

import React, { useState } from "react";
import { Contact, Layers, Calendar, Disc, AlertTriangle } from "lucide-react";
import {
  Card,
  Text,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@repo/ui/components/ui";
import { useToast } from "@repo/ui/hooks";
import { useUpdateOrganizationStatusMutation } from "../../../../../../lib/queries/organization";

interface OrgSummaryCardProps {
  id?: string;
  createdAt?: string;
  status?: string | null;
  packageName?: string | null;
}

export function OrgSummaryCard({
  id,
  createdAt,
  status,
  packageName,
}: OrgSummaryCardProps) {
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const updateStatusMutation = useUpdateOrganizationStatusMutation();

  const isInactive = status === "Inactive" || status === "Suspended";

  const handleToggleStatus = async () => {
    const nextStatus = isInactive ? "Active" : "Inactive";
    try {
      await updateStatusMutation.mutateAsync({ status: nextStatus });
      toast({
        title: isInactive ? "Organisation Reactivated" : "Organisation Deactivated",
        description: isInactive
          ? "Your organisation account is now active."
          : "Your organisation account has been set to inactive.",
      });
      setConfirmOpen(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Status Update Failed",
        description: err instanceof Error ? err.message : "Failed to update organisation status",
      });
    }
  };
  const formattedId = id
    ? `ORG-${id.slice(0, 8).toUpperCase()}`
    : "-";

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : "-";

  return (
    <Card className="p-5 sm:p-6 flex flex-col gap-4 border border-slate-200/80 shadow-none w-full font-sans">
      {/* ==================== HEADER ==================== */}
      <div>
        <Text size={'base'} weight={'bold'} className="text-slate-900">
          Organisation Summary
        </Text>
        <Text size={'md'} weight={'regular'} className="text-slate-500">
          Account status and subscription details
        </Text>
      </div>

      {/* ==================== SUMMARY DETAILS ==================== */}
      <div className="flex flex-col divide-y divide-slate-100 text-md mt-1">
        {/* Organisation ID */}
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2">
            <Contact className="size-4 text-emerald-800 shrink-0 stroke-[1.5]" />
            <Text size="md" weight="medium" className="text-slate-600">
              Organisation ID
            </Text>
          </div>
          <Text size="md" weight="semibold" className="text-slate-900 font-mono">
            {formattedId}
          </Text>
        </div>

        {/* Subscription Plan */}
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-emerald-800 shrink-0 stroke-[1.5]" />
            <Text size="md" weight="medium" className="text-slate-600">
              Subscription Plan
            </Text>
          </div>
          <Text size="md" weight="medium" className="text-slate-900">
            {packageName || "-"}
          </Text>
        </div>

        {/* Member Since */}
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-emerald-800 shrink-0 stroke-[1.5]" />
            <Text size="md" weight="medium" className="text-slate-600">
              Member Since
            </Text>
          </div>
          <Text size="md" weight="medium" className="text-slate-900">
            {formattedDate}
          </Text>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2">
            <Disc className="size-4 text-emerald-800 shrink-0 stroke-[1.5]" />
            <Text size="md" weight="medium" className="text-slate-600">
              Status
            </Text>
          </div>
          {status ? (
            <Badge
              variant="secondary"
              state={
                status === "Suspended" || status === "Inactive"
                  ? "inactive"
                  : "success"
              }
              className="text-md"
            >
              {status}
            </Badge>
          ) : (
            <Text size="md" weight="medium" className="text-slate-900">
              -
            </Text>
          )}
        </div>
      </div>

      {/* Account Control */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex flex-col">
          <Text size="md" weight="semibold" className="text-slate-800">
            Account Status
          </Text>
          <Text size="sm" className="text-slate-500">
            {isInactive
              ? "Reactivate organisation access"
              : "Temporarily deactivate this account"}
          </Text>
        </div>
        <Button
          variant={isInactive ? "outline" : "outline"}
          size="sm"
          onClick={() => setConfirmOpen(true)}
          disabled={updateStatusMutation.isPending}
          className={
            isInactive
              ? "rounded-xl text-md cursor-pointer border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              : "rounded-xl text-md cursor-pointer border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
          }
        >
          {isInactive ? "Reactivate" : "Deactivate"}
        </Button>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md bg-white p-6 rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`p-2 rounded-xl ${
                  isInactive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                }`}
              >
                <AlertTriangle className="size-5" />
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                {isInactive
                  ? "Reactivate Organisation Account?"
                  : "Deactivate Organisation Account?"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-md text-slate-600 leading-relaxed pt-1">
              {isInactive
                ? "This will restore full access for all staff members, carers, and residents under this organisation."
                : "Are you sure you want to deactivate this organisation? Active sessions and operational service access will be paused until reactivated."}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex items-center justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => setConfirmOpen(false)}
              disabled={updateStatusMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={isInactive ? "primary" : "destructive"}
              size="default"
              onClick={handleToggleStatus}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending
                ? "Updating..."
                : isInactive
                  ? "Confirm Reactivation"
                  : "Confirm Deactivation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
