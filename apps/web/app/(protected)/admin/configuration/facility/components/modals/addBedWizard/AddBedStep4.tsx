"use client";

import { ArrowRight, MapPin, BedDouble, ListFilter } from "lucide-react";
import { Button } from "@repo/ui/components/ui/Button";
import { BedState } from "../BedDialog";

interface AddBedStep4Props {
  bedData: BedState;
  onFinish: () => void;
  onBack: () => void;
  isLoading?: boolean;
  isEditMode?: boolean;
}

export function AddBedStep4({
  bedData,
  onFinish,
  onBack,
  isLoading,
  isEditMode = false,
}: AddBedStep4Props) {
  const wingName = bedData.wingName || "—";
  const roomNumber = bedData.roomNumber || "—";

  const bedNumber = bedData.bedNumber || "—";
  const bedLabel = bedData.bedLabel ? ` (${bedData.bedLabel})` : "";
  const bedCode = bedData.bedCode || "—";
  const bedType = bedData.bedType || "—";
  const status = bedData.status || "Available";

  const bedLength = bedData.bedLength != null ? String(bedData.bedLength) : "";
  const bedWidth = bedData.bedWidth != null ? String(bedData.bedWidth) : "";
  const safeLoad =
    bedData.safeWorkingLoad != null ? String(bedData.safeWorkingLoad) : "";

  const heightAdj = bedData.heightAdjustment || "—";
  const sideRails = bedData.sideRails || "—";
  const pressureMattress = bedData.pressureMattress || "—";

  const equipmentList: string[] = bedData.equipment || [];

  return (
    <div className="space-y-5 pt-1 pb-2">
      {/* Header */}
      <div className="space-y-0.5">
        <h3 className="text-lg font-semibold text-slate-900">Review & Confirm</h3>
        <p className="text-md text-slate-500">
          Please review the details below before adding the new bed.
        </p>
      </div>

      {/* Location Section */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-slate-900">
          <div className="size-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
            <MapPin className="size-3.5" />
          </div>
          <h4 className="text-md font-semibold">Location</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl h-11 px-4 flex items-center gap-2 text-md font-medium text-slate-800">
            <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">{wingName}</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl h-11 px-4 flex items-center gap-2 text-md font-medium text-slate-800">
            <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">{roomNumber}</span>
          </div>
        </div>
      </div>

      {/* Bed Information Section */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-slate-900">
          <div className="size-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
            <BedDouble className="size-3.5" />
          </div>
          <h4 className="text-md font-semibold">Bed Information</h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-center gap-0.5">
            <span className="text-md text-slate-400 font-medium">
              Bed Number / Label
            </span>
            <span className="text-md font-semibold text-slate-800 truncate">
              {bedNumber}
              {bedLabel}
            </span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-center gap-0.5">
            <span className="text-md text-slate-400 font-medium">
              Unique Identifier
            </span>
            <span className="text-md font-semibold text-slate-800 truncate">
              {bedCode}
            </span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-center gap-0.5">
            <span className="text-md text-slate-400 font-medium">Bed Type</span>
            <span className="text-md font-semibold text-slate-800 truncate">
              {bedType}
            </span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-center gap-0.5">
            <span className="text-md text-slate-400 font-medium">Status</span>
            <div className="flex items-center gap-1.5 text-md font-semibold text-emerald-700">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>{status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications Section */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-slate-900">
          <div className="size-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
            <ListFilter className="size-3.5" />
          </div>
          <h4 className="text-md font-semibold">Specifications</h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col justify-center gap-0.5">
            <span className="text-md text-slate-400 font-medium">Length × Width</span>
            <span className="text-md font-semibold text-slate-800 truncate">
              {bedLength && bedWidth ? `${bedLength} × ${bedWidth} cm` : "—"}
            </span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col justify-center gap-0.5">
            <span className="text-md text-slate-400 font-medium">Safe Load</span>
            <span className="text-md font-semibold text-slate-800 truncate">
              {safeLoad ? `${safeLoad} kg` : "—"}
            </span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col justify-center gap-0.5">
            <span className="text-md text-slate-400 font-medium">Height Adj.</span>
            <span className="text-md font-semibold text-slate-800 truncate">
              {heightAdj}
            </span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col justify-center gap-0.5">
            <span className="text-md text-slate-400 font-medium">Side Rails</span>
            <span className="text-md font-semibold text-slate-800 truncate">
              {sideRails}
            </span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-col justify-center gap-0.5">
            <span className="text-md text-slate-400 font-medium">Pressure Matt.</span>
            <span className="text-md font-semibold text-slate-800 truncate">
              {pressureMattress}
            </span>
          </div>
        </div>

        {/* Equipment List */}
        {equipmentList.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-md font-medium text-slate-500">Equipment:</span>
            {equipmentList.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-md font-medium text-slate-700"
              >
                <span className="size-1.5 rounded-full bg-emerald-500" />
                {item}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <Button
          type="button"
          variant="outline"
          onClick={onFinish}
          className="w-full sm:w-28 h-10 rounded-xl"
        >
          Skip
        </Button>
        <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="w-full sm:w-28 h-10 rounded-xl"
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={onFinish}
            disabled={isLoading}
            variant="primary"
            className="w-full sm:w-28 h-10 rounded-xl flex items-center justify-center gap-1.5"
          >
            {isLoading ? "Saving..." : isEditMode ? "Update" : "Add Bed"}
            {!isLoading && <ArrowRight className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
