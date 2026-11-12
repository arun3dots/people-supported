"use client";

import { useMemo } from "react";
import type { PreAdmissionRoomAllocationDTO } from "@repo/schema";
import { DEFAULT_ADMISSION_FORM_DATA } from "../../data/admissionFormFields";
import type { AdmissionFormData } from "../../types";
import { RoomBedAllocationCard } from "../../components/step7-room-belongings/RoomBedAllocationCard";
import { BelongingsInventoryCard } from "../../components/step7-room-belongings/BelongingsInventoryCard";
import { AssistiveDevicesCard } from "../../components/step7-room-belongings/AssistiveDevicesCard";
import { useScrollToFirstError } from "../shared/useScrollToFirstError";
import type { PartFormProps } from "../shared/types";

const ROOM_FIELD_ORDER = ["roomNumber"] as const;

/** Maps the room allocation JSON onto the form shape the existing room cards edit. */
function toFormData(r: PreAdmissionRoomAllocationDTO): AdmissionFormData {
  return {
    ...DEFAULT_ADMISSION_FORM_DATA,
    assignedBedId: r.bedId ?? "",
    roomNumber: r.roomNumber ?? undefined,
    roomType: r.roomType ?? "",
    landlord: r.landlord ?? "",
    moveInDateTime: r.moveInDateTime ?? undefined,
    roommate: r.roommateId ?? undefined,
    belongings: r.belongings.map((b) => ({
      item: b.item,
      description: b.description ?? undefined,
      estValue: b.estValue ?? undefined,
      conditionPhotoUrl: b.conditionPhotoUrl ?? undefined,
    })),
    assistiveDevices: r.assistiveDevices,
    liabilityWaiverSigned: r.liabilityWaiverSigned,
    valuablesInSafe: r.valuablesInSafe,
    valuablesDescription: r.valuablesDescription ?? undefined,
  };
}

function toRoomPatch(
  patch: Partial<AdmissionFormData>,
): Partial<PreAdmissionRoomAllocationDTO> {
  const out: Partial<PreAdmissionRoomAllocationDTO> = {};
  if ("assignedBedId" in patch) out.bedId = patch.assignedBedId || null;
  if ("roomNumber" in patch) out.roomNumber = patch.roomNumber ?? null;
  if ("roomType" in patch) out.roomType = patch.roomType || null;
  if ("landlord" in patch) out.landlord = patch.landlord?.trim() || null;
  if ("moveInDateTime" in patch) out.moveInDateTime = patch.moveInDateTime ?? null;
  if ("roommate" in patch) out.roommateId = patch.roommate ?? null;
  if (patch.belongings) {
    out.belongings = patch.belongings.map((b) => ({
      item: b.item,
      description: b.description ?? null,
      estValue: b.estValue ?? null,
      conditionPhotoUrl: b.conditionPhotoUrl ?? null,
    }));
  }
  if (patch.assistiveDevices) out.assistiveDevices = patch.assistiveDevices;
  if ("liabilityWaiverSigned" in patch && patch.liabilityWaiverSigned !== undefined)
    out.liabilityWaiverSigned = patch.liabilityWaiverSigned;
  if ("valuablesInSafe" in patch && patch.valuablesInSafe !== undefined)
    out.valuablesInSafe = patch.valuablesInSafe;
  if ("valuablesDescription" in patch)
    out.valuablesDescription = patch.valuablesDescription ?? null;
  return out;
}

export function RoomStep({
  value,
  onChange,
  errors,
}: PartFormProps<PreAdmissionRoomAllocationDTO>) {
  const formData = useMemo(() => toFormData(value), [value]);
  const updateFormData = (patch: Partial<AdmissionFormData>) =>
    onChange(toRoomPatch(patch));
  const visibleErrors = { ...errors };
  if (value.roomNumber?.trim()) delete visibleErrors.roomNumber;

  useScrollToFirstError(errors, ROOM_FIELD_ORDER);

  return (
    <div className="space-y-6 font-sans">
      <RoomBedAllocationCard
        formData={formData}
        updateFormData={updateFormData}
        errors={visibleErrors}
      />
      <BelongingsInventoryCard formData={formData} updateFormData={updateFormData} />
      <AssistiveDevicesCard formData={formData} updateFormData={updateFormData} />
    </div>
  );
}
