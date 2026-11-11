"use client";

import React from "react";
import { format } from "date-fns";
import { CheckSquare } from "lucide-react";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  Text,
} from "@repo/ui/components/ui";
import type { MedicationRoundRow } from "../../../../../../../lib/queries/residents/useGetMedicationPrescriptionsQuery";
import type { MedGroup } from "./medGroups";

interface ScheduledRoundsDetailDialogProps {
  detailGroup: MedGroup | null;
  onClose: () => void;
  onAdministerRound: (round: MedicationRoundRow) => void;
}

export function ScheduledRoundsDetailDialog({
  detailGroup,
  onClose,
  onAdministerRound,
}: ScheduledRoundsDetailDialogProps): React.JSX.Element {
  return (
    <Dialog open={Boolean(detailGroup)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl rounded-2xl">
        <div className="space-y-1 border-b border-slate-100 pb-3">
          <Text size="lg" weight="bold" className="text-slate-900">
            {detailGroup?.drugName || "Medication"}
          </Text>
          <Text size="sm" variant="muted">
            {detailGroup?.dose} · {detailGroup?.route || "Oral"} · Scheduled rounds
          </Text>
        </div>
        <div className="grid gap-2 max-h-[60vh] overflow-y-auto pr-1">
          {(detailGroup?.rounds ?? []).map((item) => {
            const administration = item.administrations[0];
            const itemTaken = item.status === "Administered" || administration?.status === "Given";
            return (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-lg border border-slate-100 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <Text size="sm" weight="medium" className="text-slate-800">
                    {item.scheduledTime ? format(new Date(item.scheduledTime), "dd MMM yyyy, HH:mm") : "Daily round"}
                  </Text>
                  <Badge variant="secondary" state={itemTaken ? "success" : "warning"} className="shadow-none">
                    {itemTaken ? "Taken" : item.status || "Pending"}
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={itemTaken}
                  onClick={() => onAdministerRound(item)}
                  className="h-7 rounded-lg border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                >
                  <CheckSquare className="size-3" /> {itemTaken ? "Completed" : "Administer"}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

