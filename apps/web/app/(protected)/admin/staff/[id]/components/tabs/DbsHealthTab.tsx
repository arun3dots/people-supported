"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useGetStaffMemberQuery } from "../../../../../../../lib/queries/staff/useGetStaffMemberQuery";
import {
  useGetStaffComplianceQuery,
  useDeleteImmunisationMutation,
  type DbsRecord,
  type HealthRecord,
  type ImmunisationRecord,
} from "../../../../../../../lib/queries/staff/useComplianceQueries";
import { DbsVerificationForm } from "../forms/DbsVerificationForm";
import { HealthClearanceForm, ImmunisationForm } from "../forms/HealthVerificationForm";
import { useToast } from "@repo/ui/hooks";
import { OccupationalHealthCard } from "../cards/OccupationalHealthCard";
import { ImmunisationCard } from "../cards/ImmunisationCard";
import { DbsDetailsCard } from "../cards/DbsDetailsCard";

export function DbsHealthTab() {
  const { id: staffId } = useParams<{ id: string }>();
  const { data: staff, isLoading: staffLoading } = useGetStaffMemberQuery(staffId);
  const { toast } = useToast();
  const [dbsFormOpen, setDbsFormOpen] = useState(false);
  const [healthFormOpen, setHealthFormOpen] = useState(false);
  const [immFormOpen, setImmFormOpen] = useState(false);
  const [editImm, setEditImm] = useState<ImmunisationRecord | null>(null);

  const { data: complianceData, isLoading: complianceLoading } = useGetStaffComplianceQuery(staffId);
  const dbsData = complianceData?.dbs;
  const healthData = complianceData?.health;
  const immunisations = complianceData?.immunisations;

  const deleteImmMutation = useDeleteImmunisationMutation(staffId, {
    onSuccess: () => toast({ title: "Success", description: "Immunisation deleted" }),
    onError: (err) => toast({ variant: "destructive", title: "Error", description: err.message || "Failed to delete" }),
  });

  if (staffLoading || !staff) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Fallback: use existing staff fields if API data not yet available
  const dbs: DbsRecord | null | undefined = dbsData ?? (staff.dbsNumber ? {
    id: "", userId: staff.id,
    certificateNumber: staff.dbsNumber,
    type: staff.dbsType || "Enhanced",
    issueDate: undefined,
    expiryDate: staff.dbsExpiryDate,
    updateService: staff.dbsUpdateService ?? false,
    status: "Clear",
  } as DbsRecord : null);

  const health: HealthRecord | null | undefined = healthData ?? (staff.occupationalHealthClearance ? {
    id: "", userId: staff.id,
    clearanceDate: staff.occupationalHealthClearance,
    status: "Cleared",
  } as HealthRecord : null);

  const immList = immunisations ?? (staff.immunisations?.map((imm, i) => ({
    id: `mock-${i}`,
    userId: staff.id,
    name: imm.name,
    dateAdministered: imm.date,
    status: imm.status,
  })) || []);

  return (
    <div className="space-y-6">
      {/* ROW 1: Occupational Health Clearance (Full Width Card) */}
      <div className="w-full">
        <OccupationalHealthCard
          health={{
            status: health?.status,
            lastAssessmentDate: health?.clearanceDate,
            nextAssessmentDate: health?.nextAssessmentDate,
            assessedBy: health?.assessedBy,
            outcome: health?.outcome ?? (health?.status === "Cleared" ? "Fit to Work" : undefined),
            restrictions: health?.restrictions,
            notes: health?.notes,
            documentUrl: health?.documentUrl,
          }}
          complianceLoading={complianceLoading}
          onEditClick={() => setHealthFormOpen(true)}
        />
      </div>

      {/* ROW 2: Immunization Status & DBS Details (2 Cards Column Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Column 1: Immunization Card (~58% width) */}
        <div className="lg:col-span-7 h-full flex flex-col">
          <ImmunisationCard
            className="h-full"
            immList={immList}
            complianceLoading={complianceLoading}
            hasStaffFallback={!!staff.immunisations?.length}
            onAdd={() => {
              setEditImm(null);
              setImmFormOpen(true);
            }}
            onEdit={(imm) => {
              setEditImm(imm);
              setImmFormOpen(true);
            }}
            onDelete={(id) => deleteImmMutation.mutate(id)}
          />
        </div>

        {/* Column 2: DBS Details Card (~42% width) */}
        <div className="lg:col-span-5 h-full flex flex-col">
          <DbsDetailsCard
            className="h-full"
            dbs={dbs}
            complianceLoading={complianceLoading}
            hasStaffFallback={!!staff.dbsNumber}
            onEdit={() => setDbsFormOpen(true)}
          />
        </div>
      </div>

      {/* Form Dialogs */}
      <DbsVerificationForm
        staffId={staff.id}
        staffName={staff.fullName}
        existing={dbsData}
        open={dbsFormOpen}
        onOpenChange={setDbsFormOpen}
      />
      <HealthClearanceForm
        staffId={staff.id}
        staffName={staff.fullName}
        existing={healthData}
        open={healthFormOpen}
        onOpenChange={setHealthFormOpen}
      />
      <ImmunisationForm
        staffId={staff.id}
        staffName={staff.fullName}
        existing={editImm}
        open={immFormOpen}
        onOpenChange={(open) => {
          setImmFormOpen(open);
          if (!open) setEditImm(null);
        }}
      />
    </div>
  );
}