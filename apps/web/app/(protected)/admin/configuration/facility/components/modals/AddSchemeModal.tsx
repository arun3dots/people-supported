"use client";

import React, { useState, useEffect } from "react";
import { Building2 } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Text,
} from "@repo/ui/components/ui";
import type { CreateSchemeDTO, UpdateSchemeDTO } from "@repo/schema";
import type {
  PropertyItem,
  SchemeItem,
} from "../../../../../../../lib/types/facility";
import { useGetStaffQuery } from "../../../../../../../lib/queries/staff/useGetStaffQuery";
import { useGetResidentsQuery } from "../../../../../../../lib/queries/residents/useGetResidentsQuery";
import { AddSchemeFormFields } from "./AddSchemeFormFields";
import { AddSchemeAssociationsSection } from "./AddSchemeAssociationsSection";

interface AddSchemeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  properties: PropertyItem[];
  initialData?: SchemeItem | null;
  onCreate: (payload: CreateSchemeDTO) => Promise<unknown>;
  onUpdate?: (id: string, payload: UpdateSchemeDTO) => Promise<unknown>;
  isSubmitting?: boolean;
}

export function AddSchemeModal({
  isOpen,
  onOpenChange,
  properties,
  initialData,
  onCreate,
  onUpdate,
  isSubmitting,
}: AddSchemeModalProps) {
  const isEdit = Boolean(initialData);
  const { data: staffList = [] } = useGetStaffQuery({ enabled: isOpen });
  const { data: residentsList = [] } = useGetResidentsQuery({
    enabled: isOpen,
  });

  const [name, setName] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [commissioningLa, setCommissioningLa] = useState("");
  const [housingPartner, setHousingPartner] = useState("");
  const [schemeManagerId, setSchemeManagerId] = useState("none");
  const [commissionedHours, setCommissionedHours] = useState("240");
  const [targetOccupancy, setTargetOccupancy] = useState("90");
  const [status, setStatus] = useState("Active");
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [selectedResidentIds, setSelectedResidentIds] = useState<string[]>([]);
  const [nameError, setNameError] = useState<string | undefined>();

  useEffect(() => {
    if (!isOpen) return;
    setNameError(undefined);
    if (initialData) {
      setName(initialData.name || "");
      setReferenceId(initialData.referenceId || "");
      setLocation(initialData.location || "");
      setDescription(initialData.description || "");
      setCommissioningLa(initialData.commissioningLa || "");
      setHousingPartner(
        initialData.housingPartner ||
          initialData.schemeDetails?.housingPartner ||
          "",
      );
      setSchemeManagerId(initialData.schemeManagerId || "none");
      setCommissionedHours(
        initialData.commissionedHours !== null &&
          initialData.commissionedHours !== undefined
          ? String(initialData.commissionedHours)
          : "240",
      );
      setTargetOccupancy(
        initialData.schemeDetails?.targetOccupancy !== undefined
          ? String(initialData.schemeDetails.targetOccupancy)
          : "90",
      );
      setStatus(initialData.status || "Active");
      setSelectedPropertyIds(
        initialData.properties?.map((p) => p.id) ?? [],
      );
      setSelectedStaffIds(initialData.schemeDetails?.staffIds ?? []);
      setSelectedResidentIds(initialData.schemeDetails?.residentIds ?? []);
    } else {
      setName("");
      setReferenceId(`SCH-${Math.floor(1000 + Math.random() * 9000)}`);
      setLocation("");
      setDescription("");
      setCommissioningLa("");
      setHousingPartner("");
      setSchemeManagerId("none");
      setCommissionedHours("240");
      setTargetOccupancy("90");
      setStatus("Active");
      setSelectedPropertyIds([]);
      setSelectedStaffIds([]);
      setSelectedResidentIds([]);
    }
  }, [isOpen, initialData]);

  const toggleItem = (
    id: string,
    current: string[],
    setter: (next: string[]) => void,
  ) => {
    if (current.includes(id)) {
      setter(current.filter((x) => x !== id));
    } else {
      setter([...current, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Scheme name is required");
      return;
    }

    const selectedManager = staffList.find((s) => s.id === schemeManagerId);
    const payload: CreateSchemeDTO = {
      name: name.trim(),
      referenceId: referenceId.trim() || undefined,
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      commissioningLa: commissioningLa.trim() || undefined,
      schemeManagerId: schemeManagerId !== "none" ? schemeManagerId : null,
      commissionedHours: commissionedHours
        ? Number(commissionedHours)
        : undefined,
      status,
      propertyIds: selectedPropertyIds,
      schemeDetails: {
        housingPartner: housingPartner.trim() || undefined,
        schemeManagerName: selectedManager?.fullName || undefined,
        targetOccupancy: targetOccupancy ? Number(targetOccupancy) : undefined,
        staffIds: selectedStaffIds,
        residentIds: selectedResidentIds,
      },
    };

    try {
      if (isEdit && initialData && onUpdate) {
        await onUpdate(initialData.id, payload);
      } else {
        await onCreate(payload);
      }
      onOpenChange(false);
    } catch (err) {
      setNameError(
        err instanceof Error ? err.message : "Failed to save scheme",
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent size="3xl" className="p-0 max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          <DialogHeader className="pb-4 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-primary mb-1">
              <Building2 className="size-3.5" />
              <Text
                as="span"
                size="xs"
                weight="medium"
                variant="primary"
                className="uppercase tracking-wider"
              >
                Supported Living Scheme
              </Text>
            </div>
            <DialogTitle className="text-lg font-semibold text-slate-900">
              {isEdit ? "Edit Scheme" : "Add Scheme"}
            </DialogTitle>
            <Text size="sm" variant="muted">
              Configure a supported living scheme, commissioning local authority,
              commissioned hours, and linked properties.
            </Text>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <AddSchemeFormFields
              name={name}
              onNameChange={(val) => {
                setName(val);
                setNameError(undefined);
              }}
              nameError={nameError}
              referenceId={referenceId}
              onReferenceIdChange={setReferenceId}
              location={location}
              onLocationChange={setLocation}
              commissioningLa={commissioningLa}
              onCommissioningLaChange={setCommissioningLa}
              housingPartner={housingPartner}
              onHousingPartnerChange={setHousingPartner}
              schemeManagerId={schemeManagerId}
              onSchemeManagerIdChange={setSchemeManagerId}
              staffList={staffList}
              commissionedHours={commissionedHours}
              onCommissionedHoursChange={setCommissionedHours}
              targetOccupancy={targetOccupancy}
              onTargetOccupancyChange={setTargetOccupancy}
              status={status}
              onStatusChange={setStatus}
              description={description}
              onDescriptionChange={setDescription}
            />

            <AddSchemeAssociationsSection
              properties={properties}
              selectedPropertyIds={selectedPropertyIds}
              onToggleProperty={(id) =>
                toggleItem(id, selectedPropertyIds, setSelectedPropertyIds)
              }
              staffList={staffList}
              selectedStaffIds={selectedStaffIds}
              onToggleStaff={(id) =>
                toggleItem(id, selectedStaffIds, setSelectedStaffIds)
              }
              residentsList={residentsList}
              selectedResidentIds={selectedResidentIds}
              onToggleResident={(id) =>
                toggleItem(id, selectedResidentIds, setSelectedResidentIds)
              }
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : isEdit
                    ? "Save Scheme"
                    : "Create Scheme"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
