"use client";

import React, { useState, useEffect } from "react";
import { Building2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Label,
  Input,
  Textarea,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from "@repo/ui/components/ui";
import { cn } from "@repo/ui/lib/utils";
import type { CreateSchemeDTO, UpdateSchemeDTO } from "@repo/schema";
import type { PropertyItem, SchemeItem } from "../../../../../../../lib/types/facility";
import { useGetStaffQuery } from "../../../../../../../lib/queries/staff/useGetStaffQuery";
import { useGetResidentsQuery } from "../../../../../../../lib/queries/residents/useGetResidentsQuery";

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
  const { data: residentsList = [] } = useGetResidentsQuery({ enabled: isOpen });

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
      setNameError(err instanceof Error ? err.message : "Failed to save scheme");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent size="3xl" className="p-0 max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          <DialogHeader className="pb-4 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-md font-semibold text-emerald-800 uppercase tracking-wider mb-1">
              <Building2 className="size-3.5" />
              <span>Supported Living Scheme</span>
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {isEdit ? "Edit Scheme" : "Add Scheme"}
            </DialogTitle>
            <Text size="sm" className="text-slate-500">
              Configure a supported living scheme, commissioning local authority,
              commissioned hours, and linked properties.
            </Text>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
              <div className="space-y-1">
                <Label required className="text-md font-bold text-slate-800">
                  Scheme Name
                </Label>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameError(undefined);
                  }}
                  placeholder="e.g. North Yorkshire Supported Living"
                  errorMessage={nameError}
                />
              </div>

              <div className="space-y-1">
                <Label required className="text-md font-bold text-slate-800">
                  Reference ID
                </Label>
                <Input
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  placeholder="e.g. SCH-1001"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-md font-bold text-slate-800">
                  Location
                </Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. York & Harrogate"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-md font-bold text-slate-800">
                  Commissioning LA
                </Label>
                <Input
                  value={commissioningLa}
                  onChange={(e) => setCommissioningLa(e.target.value)}
                  placeholder="e.g. North Yorkshire Council"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-md font-bold text-slate-800">
                  Housing Partner
                </Label>
                <Input
                  value={housingPartner}
                  onChange={(e) => setHousingPartner(e.target.value)}
                  placeholder="e.g. Yorkshire Housing Association"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-md font-bold text-slate-800">
                  Scheme Manager
                </Label>
                <Select
                  value={schemeManagerId}
                  onValueChange={setSchemeManagerId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="none">Unassigned</SelectItem>
                    {staffList.map((st) => (
                      <SelectItem key={st.id} value={st.id}>
                        {st.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-x-3">
                <div className="space-y-1">
                  <Label className="text-md font-bold text-slate-800">
                    Commissioned hours (wk)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={commissionedHours}
                    onChange={(e) => setCommissionedHours(e.target.value)}
                    placeholder="240"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-md font-bold text-slate-800">
                    Target Occupancy (%)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={targetOccupancy}
                    onChange={(e) => setTargetOccupancy(e.target.value)}
                    placeholder="90"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label required className="text-md font-bold text-slate-800">
                  Status
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1 [&_[data-slot=input-error]]:hidden">
              <Label className="text-md font-bold text-slate-800">
                Description
              </Label>
              <Textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of the supported living scheme..."
              />
            </div>

            {/* Properties in scheme */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <Label className="text-md font-bold text-slate-800">
                Properties in Scheme ({selectedPropertyIds.length} selected)
              </Label>
              {properties.length === 0 ? (
                <Text size="md" className="text-slate-500">
                  No properties registered yet. You can link properties after
                  creating them.
                </Text>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-1">
                  {properties.map((p) => {
                    const checked = selectedPropertyIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          toggleItem(
                            p.id,
                            selectedPropertyIds,
                            setSelectedPropertyIds,
                          )
                        }
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-md font-semibold border transition-all cursor-pointer",
                          checked
                            ? "bg-emerald-800 text-white border-emerald-800"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
                        )}
                      >
                        {checked && <Check className="size-3" />}
                        <span>{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Staffs & Supported People */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <Label className="text-md font-bold text-slate-800">
                  Staffs ({selectedStaffIds.length})
                </Label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-xl border border-slate-200 bg-slate-50/60">
                  {staffList.slice(0, 20).map((st) => {
                    const checked = selectedStaffIds.includes(st.id);
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() =>
                          toggleItem(st.id, selectedStaffIds, setSelectedStaffIds)
                        }
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-md font-medium border transition-all cursor-pointer",
                          checked
                            ? "bg-emerald-800 text-white border-emerald-800"
                            : "bg-white text-slate-700 border-slate-200",
                        )}
                      >
                        {st.fullName}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-md font-bold text-slate-800">
                  Supported People ({selectedResidentIds.length})
                </Label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-xl border border-slate-200 bg-slate-50/60">
                  {residentsList.slice(0, 20).map((res) => {
                    const checked = selectedResidentIds.includes(res.id);
                    return (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() =>
                          toggleItem(
                            res.id,
                            selectedResidentIds,
                            setSelectedResidentIds,
                          )
                        }
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-md font-medium border transition-all cursor-pointer",
                          checked
                            ? "bg-emerald-800 text-white border-emerald-800"
                            : "bg-white text-slate-700 border-slate-200",
                        )}
                      >
                        {res.fullName}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

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
