"use client";

import { useState, useEffect } from "react";
import { CreateBedDTO } from "@repo/schema";
import { FacilityWizardStepper } from "../../shared/FacilityWizardStepper";
import { AddBedStep1, BedStep1Values } from "./AddBedStep1";
import { AddBedStep2, BedStep2Values } from "./AddBedStep2";
import { AddBedStep3, BedStep3Values } from "./AddBedStep3";
import { AddBedStep4 } from "./AddBedStep4";

export interface BedWizardFlowProps {
  initialValues?: Partial<BedStep1Values> & { residentId?: string };
  onSubmit: (payload: CreateBedDTO) => void | Promise<unknown>;
  onCancel: () => void;
  isLoading?: boolean;
}

const BED_STEPS = [
  { id: 1, label: "Bed Details" },
  { id: 2, label: "Specifications" },
  { id: 3, label: "Availability" },
  { id: 4, label: "Review" },
];

/** Accrued state across the 4 bed steps (incl. non-persisted review data). */
interface BedWizardState extends Partial<BedStep1Values> {
  bedLength?: number;
  bedWidth?: number;
  safeWorkingLoad?: number;
  heightAdjustment?: string;
  sideRails?: string;
  pressureMattress?: string;
  equipment?: string[];
  specificationNotes?: string;
  availableFrom?: string;
  plannedStatus?: string;
  occupancyAvailableFrom?: string;
  expectedDischargeDate?: string;
  availabilityNotes?: string;
  residentId?: string;
}

function buildInitialState(
  initialValues?: Partial<BedStep1Values> & { residentId?: string },
): BedWizardState {
  return {
    wingId: initialValues?.wingId || "",
    roomId: initialValues?.roomId || "",
    bedNumber: initialValues?.bedNumber || "",
    bedCode: initialValues?.bedCode || "",
    bedType: initialValues?.bedType || "Standard Bed",
    bedLabel: initialValues?.bedLabel || "",
    status: initialValues?.status || "",
    residentId: initialValues?.residentId || "",
  };
}

/**
 * Reusable 4-step bed creation flow (Bed Details → Specifications →
 * Availability → Review). Owns the local bed state and step progression,
 * then hands a fully-built CreateBedDTO to the supplied `onSubmit`.
 *
 * Shared by both the standalone BedDialog and the facility wizard's
 * "Add Another Bed" inline flow so the bed experience is identical
 * everywhere and the AddBedStep1–4 forms are not duplicated.
 */
export function BedWizardFlow({
  initialValues,
  onSubmit,
  onCancel,
  isLoading,
}: BedWizardFlowProps) {
  const [step, setStep] = useState(1);
  const [bedState, setBedState] = useState<BedWizardState>(() =>
    buildInitialState(initialValues)
  );

  // Reset to the fresh form whenever the parent context (roomId) changes,
  // so a newly-requested "Add Another Bed" always starts from Bed Details.
  useEffect(() => {
    setStep(1);
    setBedState(buildInitialState(initialValues));
  }, [initialValues?.wingId, initialValues?.roomId]);

  const handleStep1Submit = (values: BedStep1Values) => {
    setBedState((prev) => ({ ...prev, ...values }));
    setStep(2);
  };

  const handleStep2Submit = (specs: BedStep2Values) => {
    setBedState((prev) => ({
      ...prev,
      bedLength: specs.bedLength ? Number(specs.bedLength) : undefined,
      bedWidth: specs.bedWidth ? Number(specs.bedWidth) : undefined,
      safeWorkingLoad: specs.safeWorkingLoad
        ? Number(specs.safeWorkingLoad)
        : undefined,
      heightAdjustment: specs.heightAdjustment,
      sideRails: specs.sideRails,
      pressureMattress: specs.pressureMattress,
      equipment: specs.selectedEquipment || [],
      specificationNotes: specs.notes || "",
    }));
    setStep(3);
  };

  const handleStep3Submit = (assignment: BedStep3Values) => {
    setBedState((prev) => ({
      ...prev,
      availableFrom: assignment.availableFromDate || "",
      plannedStatus: assignment.plannedStatus,
      occupancyAvailableFrom: assignment.occupancyAvailableFrom,
      expectedDischargeDate: assignment.expectedDischargeDate || "",
      availabilityNotes: assignment.notes || "",
      // Persist the real assigned resident id chosen in Step 3.
      residentId: assignment.assignedResidentId || "",
    }));
    setStep(4);
  };

  const handleFinalSubmit = async () => {
    const validStatus = (
      ["Available", "Occupied", "Maintenance"].includes(bedState.status || "")
        ? bedState.status
        : "Available"
    ) as "Available" | "Occupied" | "Maintenance";

    const payload: CreateBedDTO = {
      roomId: bedState.roomId || "",
      bedNumber: bedState.bedNumber || "",
      bedCode: bedState.bedCode || bedState.bedNumber || "",
      status: validStatus,
      bedLabel:
        bedState.bedLabel && bedState.bedLabel.trim() !== ""
          ? bedState.bedLabel
          : undefined,
      bedType:
        bedState.bedType && bedState.bedType !== "Standard Bed"
          ? bedState.bedType
          : undefined,
      bedLength: bedState.bedLength,
      bedWidth: bedState.bedWidth,
      safeWorkingLoad: bedState.safeWorkingLoad,
      heightAdjustment: bedState.heightAdjustment,
      sideRails: bedState.sideRails,
      pressureMattress: bedState.pressureMattress,
      equipment:
        bedState.equipment && bedState.equipment.length
          ? bedState.equipment
          : undefined,
      specificationNotes: bedState.specificationNotes || undefined,
      availableFrom: bedState.availableFrom
        ? new Date(bedState.availableFrom).toISOString()
        : undefined,
      plannedStatus: bedState.plannedStatus,
      occupancyAvailableFrom: bedState.occupancyAvailableFrom,
      expectedDischargeDate: bedState.expectedDischargeDate
        ? new Date(bedState.expectedDischargeDate).toISOString()
        : undefined,
      availabilityNotes: bedState.availabilityNotes || undefined,
      residentId: bedState.residentId || undefined,
    };

    await onSubmit(payload);
    setStep(5);
  };

  return (
    <div className="font-outfit">
      <FacilityWizardStepper steps={BED_STEPS} currentStep={step} />

      {step === 1 ? (
        <AddBedStep1
          initialValues={bedState}
          onSubmit={handleStep1Submit}
          onCancel={onCancel}
          isLoading={isLoading}
        />
      ) : step === 2 ? (
        <AddBedStep2
          initialValues={bedState}
          onNext={handleStep2Submit}
          onBack={() => setStep(1)}
        />
      ) : step === 3 ? (
        <AddBedStep3
          initialValues={bedState}
          onNext={handleStep3Submit}
          onBack={() => setStep(2)}
        />
      ) : step === 4 ? (
        <AddBedStep4
          bedData={bedState}
          onFinish={handleFinalSubmit}
          onBack={() => setStep(3)}
          isLoading={isLoading}
        />
      ) : null}
    </div>
  );
}
