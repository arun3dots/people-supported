"use client";

import { useState, useMemo, type JSX } from "react";
import { format } from "date-fns";
import { Pill, PauseCircle, PencilLine, StopCircle, Info, Plus } from "lucide-react";
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@repo/ui/components/ui";
import {
  PrescriptionActionDialog,
  type PrescriptionAction,
} from "./PrescriptionActionDialog";
import type { MedicationPrescriptionRow } from "../../../../../../../lib/queries/residents/useGetMedicationPrescriptionsQuery";

interface MedicationPrescriptionsTableProps {
  prescriptions: MedicationPrescriptionRow[];
  residentId: string;
  isEditable?: boolean;
  onAddMedication?: () => void;
  scheduleFilter?: "today" | "all";
  onScheduleFilterChange?: (filter: "today" | "all") => void;
}

const STATUS_VARIANT: Record<MedicationPrescriptionRow["status"], "default" | "secondary" | "outline"> = {
  Active: "default",
  Stopped: "secondary",
  Superseded: "outline",
};

export function MedicationPrescriptionsTable({
  prescriptions,
  residentId,
  isEditable = true,
  onAddMedication,
  scheduleFilter = "all",
  onScheduleFilterChange,
}: MedicationPrescriptionsTableProps): JSX.Element {
  const [selected, setSelected] = useState<{
    action: PrescriptionAction;
    prescription: MedicationPrescriptionRow;
  } | null>(null);

  const openAction = (action: PrescriptionAction, prescription: MedicationPrescriptionRow) =>
    setSelected({ action, prescription });

  const filteredPrescriptions = useMemo(() => {
    if (scheduleFilter === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return prescriptions.filter((rx) => {
        if (rx.status !== "Active") return false;
        const start = new Date(rx.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(rx.endDate);
        end.setHours(23, 59, 59, 999);
        return today >= start && today <= end;
      });
    }
    return prescriptions;
  }, [prescriptions, scheduleFilter]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-800 shrink-0">
            <Pill className="size-4" />
          </div>
          <div>
            <Text as="h3" size="base" weight="medium" className="text-slate-900 text-base font-medium">
              Medication Prescriptions
            </Text>
            <Text size="sm" variant="muted" className="text-slate-500">
              Stop, pause, or change a prescription from a chosen date without editing each scheduled dose.
            </Text>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {onScheduleFilterChange && (
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5">
              {(["today", "all"] as const).map((filter) => (
                <Button
                  key={filter}
                  type="button"
                  size="sm"
                  variant={scheduleFilter === filter ? "primary" : "ghost"}
                  onClick={() => onScheduleFilterChange(filter)}
                >
                  {filter === "today" ? "Today" : "All"}
                </Button>
              ))}
            </div>
          )}
          <Button type="button" variant="primary" size="sm" onClick={onAddMedication}>
            <Plus className="size-3.5" /> Prescribe Medication
          </Button>
        </div>
      </div>

      {filteredPrescriptions.length === 0 ? (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-sm text-slate-500 flex items-center gap-2">
          <Info className="size-4 text-slate-400 shrink-0" />
          <span>
            {scheduleFilter === "today"
              ? "No active prescriptions scheduled for today."
              : "No prescriptions recorded for this resident."}
          </span>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-b border-slate-200">
                <TableHead>Medication</TableHead>
                <TableHead>Dose / Form</TableHead>
                <TableHead>Times</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Pauses</TableHead>
                <TableHead>Status</TableHead>
                {isEditable && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {filteredPrescriptions.map((rx) => (
                <TableRow key={rx.id}>
                  <TableCell className="font-medium text-slate-900">{rx.drugName}</TableCell>
                  <TableCell>{rx.dose} · {rx.form}</TableCell>
                  <TableCell>{rx.times.join(", ")}</TableCell>
                  <TableCell>
                    {format(new Date(rx.startDate), "dd MMM yyyy")} –{" "}
                    {format(new Date(rx.endDate), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>
                    {rx.pauses.length === 0
                      ? "—"
                      : rx.pauses.map((p) => (
                        <div key={p.id} className="text-sm text-slate-600">
                          {format(new Date(p.pauseFrom), "dd MMM")} → {format(new Date(p.resumeOn), "dd MMM")}
                        </div>
                      ))}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[rx.status]}>{rx.status}</Badge>
                    {rx.stopReason && (
                      <div className="text-sm text-slate-500 mt-1">{rx.stopReason}</div>
                    )}
                  </TableCell>
                  {isEditable && (
                    <TableCell className="text-right">
                      {rx.status === "Active" && (
                        <div className="flex justify-end gap-1.5">
                          <Button variant="outline" size="sm" onClick={() => openAction("pause", rx)}>
                            <PauseCircle className="size-3.5 mr-1" /> Pause
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openAction("change", rx)}>
                            <PencilLine className="size-3.5 mr-1" /> Change
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openAction("stop", rx)}>
                            <StopCircle className="size-3.5 mr-1" /> Stop
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {selected && (
        <PrescriptionActionDialog
          open
          onOpenChange={(open) => !open && setSelected(null)}
          action={selected.action}
          prescription={selected.prescription}
          residentId={residentId}
        />
      )}
    </div>
  );
}
