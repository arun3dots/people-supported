"use client";

import { useState, useMemo, type JSX } from "react";
import { format } from "date-fns";
import { Pill, PauseCircle, PencilLine, StopCircle, Info, Plus } from "lucide-react";
import {
  Badge,
  Button,
  Card,
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
    <Card variant="surface" className="p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/70 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-800 shrink-0">
            <Pill className="size-4" />
          </div>
          <div>
            <Text as="h3" size="md" weight="semibold" className="text-slate-900">
              Medication Prescriptions
            </Text>
            <Text size="md" variant="muted">
              Stop, pause, or change a prescription from a chosen date without editing each scheduled dose.
            </Text>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {onScheduleFilterChange && (
            <div className="inline-flex rounded-lg bg-white border border-slate-200 p-0.5">
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
        <Card variant="white" border="secondary" className="p-4 flex items-center gap-2">
          <Info className="size-4 text-slate-400 shrink-0" />
          <Text size="md" variant="muted">
            {scheduleFilter === "today"
              ? "No active prescriptions scheduled for today."
              : "No prescriptions recorded for this resident."}
          </Text>
        </Card>
      ) : (
        <Card variant="white" border="secondary" className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4">Medication</TableHead>
                <TableHead>Dose / Form</TableHead>
                <TableHead>Times</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Pauses</TableHead>
                <TableHead>Status</TableHead>
                {isEditable && <TableHead className="px-4 text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrescriptions.map((rx) => (
                <TableRow key={rx.id}>
                  <TableCell className="px-4 font-medium text-slate-900">{rx.drugName}</TableCell>
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
                        <Text key={p.id} size="md" variant="muted">
                          {format(new Date(p.pauseFrom), "dd MMM")} → {format(new Date(p.resumeOn), "dd MMM")}
                        </Text>
                      ))}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[rx.status]}>{rx.status}</Badge>
                    {rx.stopReason && (
                      <Text size="md" variant="muted" className="mt-1">{rx.stopReason}</Text>
                    )}
                  </TableCell>
                  {isEditable && (
                    <TableCell className="px-4 text-right">
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
        </Card>
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
    </Card>
  );
}
