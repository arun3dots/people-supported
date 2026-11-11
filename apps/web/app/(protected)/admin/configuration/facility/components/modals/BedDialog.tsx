"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui";
import { CreateBedDTO } from "@repo/schema";
import { FacilityWizardStepper } from "../shared/FacilityWizardStepper";
import { Bed } from "../../../../../../../lib/types/facility";
import { AddBedStep1, BedStep1Values } from "./addBedWizard/AddBedStep1";
import { AddBedStep2, BedStep2Values } from "./addBedWizard/AddBedStep2";
import { AddBedStep4 } from "./addBedWizard/AddBedStep4";
import { EntitySuccessStep } from "../shared/EntitySuccessStep";

export interface BedState {
  roomId?: string;
  bedNumber?: string;
  bedCode?: string;
  bedLabel?: string;
  bedType?: string;
  status?: string;
  roomNumber?: string;
  wingId?: string;
  wingName?: string;
  bedLength?: number | null;
  bedWidth?: number | null;
  safeWorkingLoad?: number | null;
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

interface BedDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateBedDTO) => Promise<unknown> | void;
  initialData?: Bed | null;
  defaultWingId?: string | null;
  defaultRoomId?: string | null;
  title: string;
  isLoading?: boolean;
}

const BED_STEPS = [
  { id: 1, label: "Bed Details" },
  { id: 2, label: "Specifications" },
  { id: 3, label: "Review" },
];

export function BedDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  initialData,
  defaultWingId,
  defaultRoomId,
  title,
  isLoading,
}: BedDialogProps) {
  const [step, setStep] = useState(1);
  const [bedState, setBedState] = useState<BedState>({});

  const isEditMode = !!initialData;

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setBedState(
        initialData
          ? {
              bedNumber: initialData.number || "",
              bedCode: initialData.code || "",
              status: initialData.status || "",
              roomId: initialData.roomId || defaultRoomId || "",
              roomNumber: initialData.roomNumber || "",
              wingId: initialData.wingId || "",
              wingName: initialData.wingName || "",
              bedLabel: initialData.bedLabel || "",
              bedType: initialData.bedType || "Standard Bed",
              bedLength: initialData.bedLength,
              bedWidth: initialData.bedWidth,
              safeWorkingLoad: initialData.safeWorkingLoad,
              heightAdjustment: initialData.heightAdjustment || "",
              sideRails: initialData.sideRails || "",
              pressureMattress: initialData.pressureMattress || "",
              equipment: initialData.equipment || [],
              specificationNotes: initialData.specificationNotes || "",
              availableFrom: initialData.availableFrom || "",
              plannedStatus: initialData.plannedStatus || "Available",
              occupancyAvailableFrom:
                initialData.occupancyAvailableFrom || "Immediate",
              expectedDischargeDate: initialData.expectedDischargeDate || "",
              availabilityNotes: initialData.availabilityNotes || "",
              residentId: initialData.residentId || "",
            }
          : {
              wingId: defaultWingId || "",
              roomId: defaultRoomId || "",
              status: "",
            }
      );
    }
  }, [isOpen, initialData, defaultRoomId, defaultWingId]);

  const handleStep1Submit = (values: BedStep1Values) => {
    setBedState((prev) => ({ ...prev, ...values }));
    setStep(2);
  };

  const handleStep2Submit = (specs: BedStep2Values) => {
    setBedState((prev) => ({
      ...prev,
      bedLength: specs.bedLength,
      bedWidth: specs.bedWidth,
      safeWorkingLoad: specs.safeWorkingLoad,
      heightAdjustment: specs.heightAdjustment,
      sideRails: specs.sideRails,
      pressureMattress: specs.pressureMattress,
      equipment: specs.selectedEquipment || [],
      specificationNotes: specs.notes || "",
    }));
    setStep(3);
  };

  const handleFinalSubmit = async () => {
    const validStatus = (
      ["Available", "Occupied", "Maintenance", "Reserved"].includes(bedState.status || "")
        ? bedState.status
        : "Available"
    ) as "Available" | "Occupied" | "Maintenance" | "Reserved";

    const payload: CreateBedDTO = {
      roomId: bedState.roomId || defaultRoomId || "",
      bedNumber: bedState.bedNumber || "",
      bedCode: bedState.bedCode || `BED-${bedState.bedNumber}`,
      status: validStatus,
      bedLabel: bedState.bedLabel,
      bedType: bedState.bedType,
      bedLength: bedState.bedLength || undefined,
      bedWidth: bedState.bedWidth || undefined,
      safeWorkingLoad: bedState.safeWorkingLoad || undefined,
      heightAdjustment: bedState.heightAdjustment,
      sideRails: bedState.sideRails,
      pressureMattress: bedState.pressureMattress,
      equipment: bedState.equipment?.length ? bedState.equipment : undefined,
      specificationNotes: bedState.specificationNotes || undefined,
      availableFrom: bedState.availableFrom || undefined,
      plannedStatus: bedState.plannedStatus || undefined,
      occupancyAvailableFrom: bedState.occupancyAvailableFrom || undefined,
      expectedDischargeDate: bedState.expectedDischargeDate || undefined,
      availabilityNotes: bedState.availabilityNotes || undefined,
      residentId: bedState.residentId || undefined,
    };

    try {
      await onSubmit(payload);
      setStep(4);
    } catch {
      // Error toast is emitted by mutation onError; return user to Step 1 so they can adjust duplicate fields
      setStep(1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent size="3xl" className="p-0 sm:max-w-3xl">
        <div className="p-6">
          {step <= 3 && (
            <div className="mb-4">
              <DialogHeader className="pb-2">
                <DialogTitle className="text-lg font-semibold text-slate-900">
                  {title}
                </DialogTitle>
              </DialogHeader>

              {/* 3-Step Wizard Banner */}
              <FacilityWizardStepper steps={BED_STEPS} currentStep={step} />
            </div>
          )}

          {step === 1 && (
            <AddBedStep1
              onSubmit={handleStep1Submit}
              onCancel={() => onOpenChange(false)}
              initialValues={bedState}
              editingBedId={initialData?.id}
            />
          )}

          {step === 2 && (
            <AddBedStep2
              onNext={handleStep2Submit}
              onBack={() => setStep(1)}
              initialValues={{
                bedLength: bedState.bedLength,
                bedWidth: bedState.bedWidth,
                safeWorkingLoad: bedState.safeWorkingLoad,
                heightAdjustment: bedState.heightAdjustment,
                sideRails: bedState.sideRails,
                pressureMattress: bedState.pressureMattress,
                equipment: bedState.equipment,
                specificationNotes: bedState.specificationNotes,
              }}
            />
          )}

          {step === 3 && (
            <AddBedStep4
              bedData={bedState}
              onFinish={handleFinalSubmit}
              onBack={() => setStep(2)}
              isLoading={isLoading}
              isEditMode={isEditMode}
            />
          )}

          {step === 4 && (
            <EntitySuccessStep
              title="Bed added Successfully!"
              description="Bed has been created Successfully."
              entityName={bedState.bedNumber || "Bed"}
              action1Title="Continue Setting Up"
              action1Subtext="Add more rooms or beds to complete your setup."
              action1ButtonText="Go to Bed Details"
              action2Title="View All Beds"
              action2Subtext="Return to Bed management and view all details"
              action2ButtonText="View All Details"
              onGoToRooms={() => {
                setStep(1);
                setBedState({ wingId: defaultWingId || "", roomId: defaultRoomId || "" });
              }}
              onViewWings={() => onOpenChange(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
