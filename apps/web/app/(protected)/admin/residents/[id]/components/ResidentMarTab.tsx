"use client";

import React, { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Button, Text } from "@repo/ui/components/ui";
import {
  useGetResidentMedicationRoundsQuery,
  useDeleteMedicationRoundMutation,
  useGetMedicationPrescriptionsQuery,
  useStopMedicationPrescriptionMutation,
} from "../../../../../../lib/queries/residents";
import { useAuth } from "../../../../../../lib/context/AuthContext";
import type { Resident } from "../../../../../../lib/types/resident";
import { useGetResidentOnboardingMedicinesQuery } from "../../../../../../lib/queries/residents/useGetResidentOnboardingMedicinesQuery";
import { useGetMedicationStockLedgerQuery } from "../../../../../../lib/queries/residents/useGetMedicationStockLedgerQuery";
import type { MedicationRoundRow } from "../../../../../../lib/queries/residents/useGetMedicationPrescriptionsQuery";
import { isPrnRound, latestAdministration } from "./mar/supportedLivingMarData";
import { DeactivateMedicationDialog } from "./mar/DeactivateMedicationDialog";
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

export function ResidentMarTab({
  resident,
}: ResidentMarTabProps): React.JSX.Element {
  const residentId = resident?.id;
  const residentName = resident?.fullName?.trim() || "";

  const { user } = useAuth();
  const isCarer = user?.roleName?.toLowerCase() === "carer";
  const isEditable =
    !isCarer && resident?.status !== "Discharged" && !resident?.isDraft;

  const [isAddMedOpen, setIsAddMedOpen] = useState(false);
  const [isAddPrnOpen, setIsAddPrnOpen] = useState(false);
  const [isPrnListOpen, setIsPrnListOpen] = useState(false);
  const [administerRound, setAdministerRound] =
    useState<MedicationRoundRow | null>(null);
  const [scheduleFilter, setScheduleFilter] = useState<"today" | "all">("all");
  const [deleteRoundId, setDeleteRoundId] = useState<string | null>(null);
  const [deletePrescriptionId, setDeletePrescriptionId] = useState<
    string | null
  >(null);
  const [deletionReason, setDeletionReason] = useState("");

  const prescriptionsQuery = useGetMedicationPrescriptionsQuery(residentId);
  const roundsQuery = useGetResidentMedicationRoundsQuery(residentId);
  const onboardingQuery = useGetResidentOnboardingMedicinesQuery(residentId);
  const { data: prescriptionsData } = prescriptionsQuery;
  const { data: rawRounds } = roundsQuery;
  const canReadStock = ["admin", "manager", "nurse"].includes(
    (user?.roleName ?? "").toLowerCase(),
  );
  const stockQuery = useGetMedicationStockLedgerQuery(residentId, canReadStock);
  const isLoading = prescriptionsQuery.isLoading || roundsQuery.isLoading;
  const queryError = prescriptionsQuery.error || roundsQuery.error;
  const deleteMutation = useDeleteMedicationRoundMutation();
  const stopMutation = useStopMedicationPrescriptionMutation();

  const rounds: MedicationRoundRow[] = useMemo(
    () => (Array.isArray(rawRounds) ? rawRounds : []),
    [rawRounds],
  );

  const prnAvailableCount = useMemo(
    () =>
      rounds.filter(
        (round) =>
          isPrnRound(round) &&
          ["Pending", "Active"].includes(round.status) &&
          !latestAdministration(round),
      ).length,
    [rounds],
  );

  const prnRounds = useMemo(() => rounds.filter(isPrnRound), [rounds]);

  const recentAdministrations = useMemo(
    () =>
      rounds
        .flatMap((round) =>
          (round.administrations ?? []).flatMap((admin) => {
            if (
              admin.deletedAt ||
              admin.isSuperseded ||
              !admin.administeredAt ||
              !Number.isFinite(new Date(admin.administeredAt).getTime())
            )
              return [];
            return [
              {
                id: admin.id,
                drugName: round.drugName,
                dose: round.dose,
                administeredAt: admin.administeredAt,
                administeredBy:
                  admin.performedBy ||
                  admin.carer?.fullName ||
                  "Name not recorded",
                status: admin.status || "Not recorded",
              },
            ];
          }),
        )
        .sort(
          (a, b) =>
            new Date(b.administeredAt).getTime() -
            new Date(a.administeredAt).getTime(),
        )
        .slice(0, 5),
    [rounds],
  );

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
      await deleteMutation.mutateAsync({
        roundId: deleteRoundId,
        residentId,
        reason,
      });
    }
    closeDeleteDialog();
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center font-sans">
        <Loader2 className="size-8 animate-spin text-primary mb-3" />
        <Text size="md" variant="muted">
          Loading medication administration records…
        </Text>
      </div>
    );
  }

  if (queryError)
    return (
      <div className="space-y-3 py-8" role="alert">
        <Text size="md" weight="semibold">
          Unable to load medication records
        </Text>
        <Text size="md" variant="muted">
          {queryError.message}
        </Text>
        <Button
          onClick={() => {
            void prescriptionsQuery.refetch();
            void roundsQuery.refetch();
          }}
        >
          Retry medication records
        </Button>
      </div>
    );

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-300">
      <DeactivateMedicationDialog
        open={deleteRoundId !== null}
        isPrescription={Boolean(deletePrescriptionId)}
        reason={deletionReason}
        busy={deleteMutation.isPending || stopMutation.isPending}
        onReasonChange={setDeletionReason}
        onConfirm={handleConfirmDelete}
        onClose={closeDeleteDialog}
      />

      {/* Supported Living 3 KPI Cards + Prescribed Medicines + 7-Day MAR Matrix */}
      <SupportedLivingMarOverview
        prescriptions={prescriptionsData ?? []}
        onboardingMedicines={onboardingQuery.data}
        onboardingLoading={onboardingQuery.isLoading}
        onboardingError={onboardingQuery.isError}
        onRetryOnboarding={() => {
          void onboardingQuery.refetch();
        }}
        prnCount={prnAvailableCount}
        rounds={rounds}
        stockLedger={stockQuery.data}
        stockLoading={canReadStock && stockQuery.isLoading}
        stockError={stockQuery.isError}
        canReadStock={canReadStock}
        onRetryStock={() => {
          void stockQuery.refetch();
        }}
        canAdminister={!resident.isDraft && resident.status !== "Discharged"}
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
            specialRequirements={
              resident?.careProfile?.primaryDiagnosis ?? undefined
            }
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
          round={
            administerRound
              ? {
                  ...administerRound,
                  form: administerRound.form ?? undefined,
                  instructions: administerRound.instructions ?? undefined,
                  scheduledTime: administerRound.scheduledTime ?? undefined,
                }
              : null
          }
          residentId={residentId}
        />
      )}
    </div>
  );
}
