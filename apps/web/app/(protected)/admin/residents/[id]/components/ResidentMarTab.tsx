"use client";

import React, { useState, useMemo } from "react";
import { isToday } from "date-fns";
import { Loader2 } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Text,
  Textarea,
} from "@repo/ui/components/ui";
import {
  useGetResidentMedicationRoundsQuery,
  useDeleteMedicationRoundMutation,
  useGetMedicationPrescriptionsQuery,
  useStopMedicationPrescriptionMutation,
} from "../../../../../../lib/queries/residents";
import { useAuth } from "../../../../../../lib/context/AuthContext";
import type { Resident } from "../../../../../../lib/types/resident";
import { SupportedLivingMarOverview } from "./mar/SupportedLivingMarOverview";
import { MedicationPrescriptionsTable } from "./mar/MedicationPrescriptionsTable";
import { PrnMedsTable } from "./mar/PrnMedsTable";
import { MarQuickActions } from "./mar/MarQuickActions";
import { AddMedicationDialog } from "./mar/AddMedicationDialog";
import { AddPrnMedicationDialog } from "./mar/AddPrnMedicationDialog";
import { AdministerMedicationDialog } from "./mar/AdministerMedicationDialog";

interface ResidentMarTabProps {
  resident: Resident;
}

interface RawAdminRecord {
  id: string;
  status?: string;
  administeredAt?: string | null;
  createdAt?: string;
  performedBy?: string | null;
  carer?: { fullName?: string };
}

interface RawRoundRecord {
  id: string;
  prescriptionId?: string | null;
  drugName: string;
  dose: string;
  isPRN?: boolean;
  isAdhoc?: boolean;
  status?: string;
  administrations?: RawAdminRecord[];
}

export function ResidentMarTab({ resident }: ResidentMarTabProps): React.JSX.Element {
  const residentId = resident?.id;
  const residentName = resident?.fullName?.trim() || "";

  const { user } = useAuth();
  const isCarer = user?.roleName?.toLowerCase() === "carer";
  const isEditable = !isCarer && resident?.status !== "Discharged" && !resident?.isDraft;

  const [isAddMedOpen, setIsAddMedOpen] = useState(false);
  const [isAddPrnOpen, setIsAddPrnOpen] = useState(false);
  const [isPrnListOpen, setIsPrnListOpen] = useState(false);
  const [administerRound, setAdministerRound] = useState<unknown | null>(null);
  const [scheduleFilter, setScheduleFilter] = useState<"today" | "all">("all");
  const [deleteRoundId, setDeleteRoundId] = useState<string | null>(null);
  const [deletePrescriptionId, setDeletePrescriptionId] = useState<string | null>(null);
  const [deletionReason, setDeletionReason] = useState("");

  const { data: prescriptionsData } = useGetMedicationPrescriptionsQuery(residentId);
  const { data: rawRounds, isLoading } = useGetResidentMedicationRoundsQuery(residentId);
  const deleteMutation = useDeleteMedicationRoundMutation();
  const stopMutation = useStopMedicationPrescriptionMutation();

  const rounds: RawRoundRecord[] = useMemo(
    () => (Array.isArray(rawRounds) ? (rawRounds as RawRoundRecord[]) : []),
    [rawRounds],
  );

  const prnAvailableCount = useMemo(
    () => rounds.filter((r) => Boolean(r.isPRN) && r.status === "Active").length,
    [rounds],
  );

  const prnRounds = useMemo(
    () => rounds.filter((r) => Boolean(r.isPRN) || Boolean(r.isAdhoc)),
    [rounds],
  );

  const recentAdministrations = useMemo(() => {
    const list: {
      id: string;
      drugName: string;
      dose: string;
      administeredAt: string;
      administeredBy: string;
      status: string;
    }[] = [];
    rounds.forEach((r) => {
      (r.administrations || []).forEach((admin) => {
        const dt = admin.administeredAt || admin.createdAt || new Date().toISOString();
        if (isToday(new Date(dt)) || list.length < 5) {
          list.push({
            id: admin.id,
            drugName: r.drugName,
            dose: r.dose,
            administeredAt: dt,
            administeredBy: admin.performedBy || admin.carer?.fullName || "Staff Member",
            status: admin.status || "Given",
          });
        }
      });
    });
    list.sort(
      (a, b) => new Date(b.administeredAt).getTime() - new Date(a.administeredAt).getTime(),
    );
    return list.slice(0, 5);
  }, [rounds]);

  const allergies: string[] = useMemo(() => {
    const raw = resident?.careProfile?.allergies;
    if (Array.isArray(raw)) return raw;
    return [];
  }, [resident]);

  const handleDeleteRound = (roundId: string) => {
    const round = rounds.find((r) => r.id === roundId);
    setDeleteRoundId(roundId);
    setDeletePrescriptionId(round?.prescriptionId ?? null);
    setDeletionReason("");
  };

  const closeDeleteDialog = () => {
    setDeleteRoundId(null);
    setDeletePrescriptionId(null);
    setDeletionReason("");
  };

  const handleConfirmDelete = async () => {
    if (!deleteRoundId || !deletionReason.trim()) return;
    const reason = deletionReason.trim();
    if (deletePrescriptionId) {
      await stopMutation.mutateAsync({
        prescriptionId: deletePrescriptionId,
        residentId,
        data: { effectiveDate: new Date().toISOString(), reason },
      });
    } else {
      await deleteMutation.mutateAsync({ roundId: deleteRoundId, residentId, reason });
    }
    closeDeleteDialog();
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center font-sans">
        <Loader2 className="size-8 animate-spin text-primary mb-3" />
        <Text size="sm" variant="muted">
          Loading medication administration records…
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-300">
      <Dialog
        open={deleteRoundId !== null}
        onOpenChange={(open) => !open && closeDeleteDialog()}
      >
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              {deletePrescriptionId ? "Stop medication" : "Deactivate medication"}
            </DialogTitle>
            <DialogDescription>
              {deletePrescriptionId
                ? "Stops this prescription from today. Future unadministered doses are cancelled; past records remain in the audit history."
                : "Provide a reason to deactivate this medication. The record will remain in the audit history."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label required>Deletion reason</Label>
            <Textarea
              value={deletionReason}
              onChange={(event) => setDeletionReason(event.target.value)}
              placeholder="Enter the reason"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeDeleteDialog}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={
                deleteMutation.isPending || stopMutation.isPending || !deletionReason.trim()
              }
            >
              {deleteMutation.isPending || stopMutation.isPending
                ? "Saving..."
                : deletePrescriptionId
                  ? "Stop medication"
                  : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Supported Living 3 KPI Cards + Prescribed Medicines + 7-Day MAR Matrix */}
      <SupportedLivingMarOverview
        prescriptions={prescriptionsData ?? []}
        prnCount={prnAvailableCount}
        gpName="Dr A. Malik (GP)"
        isEditable={isEditable}
        onAddMedication={() => setIsAddMedOpen(true)}
        onAdministerRound={(round) => setAdministerRound(round)}
      />

      {/* Detailed Prescriptions Management & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <MedicationPrescriptionsTable
            prescriptions={prescriptionsData ?? []}
            residentId={residentId}
            isEditable={isEditable}
            onAddMedication={() => setIsAddMedOpen(true)}
            scheduleFilter={scheduleFilter}
            onScheduleFilterChange={setScheduleFilter}
          />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <MarQuickActions
            residentId={residentId}
            allergies={allergies}
            recentAdministrations={recentAdministrations}
            specialRequirements={resident?.careProfile?.primaryDiagnosis ?? undefined}
            onAddPrn={() => setIsAddPrnOpen(true)}
            onOpenPrn={() => setIsPrnListOpen(true)}
          />
        </div>
      </div>

      {isAddMedOpen && (
        <AddMedicationDialog
          open={isAddMedOpen}
          onOpenChange={setIsAddMedOpen}
          residentId={residentId}
          residentName={residentName}
        />
      )}

      {isAddPrnOpen && (
        <AddPrnMedicationDialog
          open={isAddPrnOpen}
          onOpenChange={setIsAddPrnOpen}
          residentId={residentId}
          residentName={residentName}
        />
      )}

      {isPrnListOpen && (
        <PrnMedsTable
          open={isPrnListOpen}
          onOpenChange={setIsPrnListOpen}
          rounds={prnRounds}
          onAddPrn={() => setIsAddPrnOpen(true)}
          onAdministerRound={(round) => setAdministerRound(round)}
          onDeleteRound={handleDeleteRound}
          isEditable={isEditable}
        />
      )}

      {Boolean(administerRound) && (
        <AdministerMedicationDialog
          open={Boolean(administerRound)}
          onOpenChange={(open) => {
            if (!open) setAdministerRound(null);
          }}
          round={administerRound as never}
          residentId={residentId}
        />
      )}
    </div>
  );
}
