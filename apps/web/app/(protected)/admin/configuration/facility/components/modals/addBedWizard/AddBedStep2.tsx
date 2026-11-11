"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import {
  Input,
  Button,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
} from "@repo/ui/components/ui";

export interface BedStep2Values {
  bedLength?: number | null;
  bedWidth?: number | null;
  safeWorkingLoad?: number | null;
  heightAdjustment?: string;
  sideRails?: string;
  pressureMattress?: string;
  selectedEquipment?: string[];
  notes?: string;
}

interface AddBedStep2Props {
  onNext: (specs: BedStep2Values) => void;
  onBack: () => void;
  initialValues?: {
    bedLength?: number | null;
    bedWidth?: number | null;
    safeWorkingLoad?: number | null;
    heightAdjustment?: string;
    sideRails?: string;
    pressureMattress?: string;
    equipment?: string[];
    specificationNotes?: string;
  };
}

const EQUIPMENT_LIST = [
  "Overbed Table",
  "Bedside Locker",
  "Call Bell / Nurse Call",
  "IV pole",
  "Oxygen Point",
  "Electric Socket",
];

export function AddBedStep2({ onNext, onBack, initialValues }: AddBedStep2Props) {
  const MAX_INT = 2147483647;

  const safeInt = (v: string): number | undefined => {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 1 || n > MAX_INT) return undefined;
    return Math.round(n);
  };

  const [bedLength, setBedLength] = useState(
    initialValues?.bedLength != null ? String(initialValues.bedLength) : ""
  );
  const [bedWidth, setBedWidth] = useState(
    initialValues?.bedWidth != null ? String(initialValues.bedWidth) : ""
  );
  const [safeWorkingLoad, setSafeWorkingLoad] = useState(
    initialValues?.safeWorkingLoad != null
      ? String(initialValues.safeWorkingLoad)
      : ""
  );
  const [heightAdjustment, setHeightAdjustment] = useState(
    initialValues?.heightAdjustment || ""
  );
  const [sideRails, setSideRails] = useState(initialValues?.sideRails || "");
  const [pressureMattress, setPressureMattress] = useState(
    initialValues?.pressureMattress || ""
  );

  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(
    initialValues?.equipment?.length ? initialValues.equipment : []
  );

  const [notes, setNotes] = useState(initialValues?.specificationNotes || "");

  const toggleEquipment = (item: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({
      bedLength: safeInt(bedLength),
      bedWidth: safeInt(bedWidth),
      safeWorkingLoad: safeInt(safeWorkingLoad),
      heightAdjustment,
      sideRails,
      pressureMattress,
      selectedEquipment,
      notes,
    });
  };

  const handleSkip = () => {
    onNext({
      bedLength: safeInt(bedLength),
      bedWidth: safeInt(bedWidth),
      safeWorkingLoad: safeInt(safeWorkingLoad),
      heightAdjustment,
      sideRails,
      pressureMattress,
      selectedEquipment,
      notes,
    });
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-5 pt-1 pb-2">
      {/* Title Header */}
      <div className="space-y-0.5">
        <h3 className="text-lg font-semibold text-slate-900">Specifications</h3>
        <p className="text-md text-slate-500">
          Configure the specifications and equipment for this bed.
        </p>
      </div>

      {/* Dimensions & Load */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="space-y-1.5">
            <Label>Bed Length (cm)</Label>
            <Input
              type="number"
              value={bedLength}
              onChange={(e) => setBedLength(e.target.value)}
              placeholder="e.g. 200"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Bed Width (cm)</Label>
            <Input
              type="number"
              value={bedWidth}
              onChange={(e) => setBedWidth(e.target.value)}
              placeholder="e.g. 90"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Safe Working Load (kg)</Label>
            <Input
              type="number"
              value={safeWorkingLoad}
              onChange={(e) => setSafeWorkingLoad(e.target.value)}
              placeholder="e.g. 250"
            />
          </div>
        </div>

        {/* Dropdown Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          <div className="space-y-1.5">
            <Label>Height Adjustment</Label>
            <Select value={heightAdjustment} onValueChange={setHeightAdjustment}>
              <SelectTrigger className="w-full bg-white border-slate-200">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Side Rails</Label>
            <Select value={sideRails} onValueChange={setSideRails}>
              <SelectTrigger className="w-full bg-white border-slate-200">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Pressure Mattress</Label>
            <Select value={pressureMattress} onValueChange={setPressureMattress}>
              <SelectTrigger className="w-full bg-white border-slate-200">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Equipment & Features */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
        <h4 className="text-md font-semibold text-slate-900">
          Equipment & Features
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {EQUIPMENT_LIST.map((item) => {
            const isChecked = selectedEquipment.includes(item);
            return (
              <label
                key={item}
                className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl p-3 cursor-pointer select-none hover:bg-slate-50 transition-colors"
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggleEquipment(item)}
                />
                <span className="text-md font-medium text-slate-800">
                  {item}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Notes (Optional) */}
      <div className="space-y-1.5">
        <Label>Notes (Optional)</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Special mattress instructions, maintenance schedule notes..."
          rows={3}
        />
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <Button
          type="button"
          variant="outline"
          onClick={handleSkip}
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
            type="submit"
            variant="primary"
            className="w-full sm:w-28 h-10 rounded-xl flex items-center justify-center gap-1.5"
          >
            Next
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </form>
  );
}
