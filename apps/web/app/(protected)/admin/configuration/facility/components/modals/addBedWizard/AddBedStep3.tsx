"use client";

import { useState } from "react";
import { ArrowRight, Calendar as CalendarIcon } from "lucide-react";
import { format, parse } from "date-fns";
import { Button } from "@repo/ui/components/ui/Button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/ui/Popover";
import { Calendar } from "@repo/ui/components/ui/Calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/Select";
import { useGetResidentsQuery } from "../../../../../../../../lib/queries/residents/useGetResidentsQuery";

export interface BedStep3Values {
  availableFromDate?: string;
  plannedStatus?: string;
  occupancyAvailableFrom?: string;
  expectedDischargeDate?: string;
  notes?: string;
  assignedResidentId?: string;
}

interface AddBedStep3Props {
  onNext: (assignment: BedStep3Values) => void;
  onBack: () => void;
  initialValues?: {
    availableFrom?: string;
    plannedStatus?: string;
    occupancyAvailableFrom?: string;
    expectedDischargeDate?: string;
    availabilityNotes?: string;
    residentId?: string;
    assignedResidentId?: string;
  };
}

export function AddBedStep3({ onNext, onBack, initialValues }: AddBedStep3Props) {
  const [availableFromDate, setAvailableFromDate] = useState(
    initialValues?.availableFrom
      ? initialValues.availableFrom.slice(0, 10)
      : ""
  );
  const [assignedResident, setAssignedResident] = useState(
    initialValues?.residentId || initialValues?.assignedResidentId || ""
  );
  const [plannedStatus, setPlannedStatus] = useState(
    initialValues?.plannedStatus || "Available"
  );
  const [occupancyAvailableFrom, setOccupancyAvailableFrom] = useState(
    initialValues?.occupancyAvailableFrom || "Immediate"
  );
  const [expectedDischargeDate, setExpectedDischargeDate] = useState(
    initialValues?.expectedDischargeDate
      ? initialValues.expectedDischargeDate.slice(0, 10)
      : ""
  );
  const [notes, setNotes] = useState(initialValues?.availabilityNotes || "");

  const { data: residents } = useGetResidentsQuery();
  const activeResidents = residents?.filter((r) => r.status === "Active") || [];

  // A resident can only occupy one bed (`residentId` is @unique on Bed).
  // Exclude residents already living on a different bed so the user can only
  // pick someone who isn't already assigned elsewhere (avoids the
  // unique-constraint error on save). The resident currently on THIS bed stays.
  const currentResidentId = initialValues?.residentId || initialValues?.assignedResidentId;
  const selectableResidents = activeResidents.filter(
    (r) => !(r.bed && r.id !== currentResidentId)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({
      availableFromDate,
      assignedResidentId: assignedResident,
      plannedStatus,
      occupancyAvailableFrom,
      expectedDischargeDate,
      notes,
    });
  };

  const handleSkip = () => {
    onNext({
      availableFromDate,
      assignedResidentId: assignedResident,
      plannedStatus,
      occupancyAvailableFrom,
      expectedDischargeDate,
      notes,
    });
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6 pt-2 pb-2 font-outfit">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-[20px] font-medium leading-[25px] text-[#141F1E]">Availability</h3>
        <p className="text-[16px] font-normal leading-[20px] text-[#5D5D5D]">
          Set the availability, assignment and occupancy details for this bed.
        </p>
      </div>

      {/* Availability & Assignment Section */}
      <div className="space-y-4">
        <h4 className="text-[16px] font-medium leading-[20px] text-[#141F1E]">Availability & Assignment</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Available From */}
          <div className="flex flex-col gap-2">
            <label className="text-md font-normal leading-[15px] text-[#5D5D5D]">
              Available From <span className="text-[#ED2115]">*</span>
            </label>
            <div className="relative">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full h-[50px] border-[0.5px] border-[#BCD3CD] rounded-xl bg-white text-[#141F1E] text-md font-normal px-5 justify-start pr-10 focus:ring-[#4A706A]"
                  >
                    {availableFromDate
                      ? format(parse(availableFromDate, "yyyy-MM-dd", new Date()), "dd MMM yyyy")
                      : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden shadow-2xl border-none bg-white" align="start">
                  <Calendar
                    mode="single"
                    selected={availableFromDate ? parse(availableFromDate, "yyyy-MM-dd", new Date()) : undefined}
                    onSelect={(date) => setAvailableFromDate(date ? format(date, "yyyy-MM-dd") : "")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <CalendarIcon className="size-5 absolute right-4 top-1/2 -translate-y-1/2 text-[#141F1E] pointer-events-none" />
            </div>
          </div>

          {/* Assign to Resident (Optional) */}
          <div className="flex flex-col gap-2">
            <label className="text-md font-normal leading-[15px] text-[#5D5D5D]">
              Assign to Resident (Optional) <span className="text-[#ED2115]">*</span>
            </label>
            <Select value={assignedResident} onValueChange={setAssignedResident}>
              <SelectTrigger className="h-[50px] border-[0.5px] border-[#BCD3CD] rounded-xl bg-white text-[#141F1E] text-md px-5">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {selectableResidents.length === 0 && (
                  <div className="px-3 py-2 text-md text-[#5D5D5D]">No residents available</div>
                )}
                {selectableResidents.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Planned Status */}
          <div className="flex flex-col gap-2">
            <label className="text-md font-normal leading-[15px] text-[#5D5D5D]">
              Planned Status <span className="text-[#ED2115]">*</span>
            </label>
            <Select value={plannedStatus} onValueChange={setPlannedStatus}>
              <SelectTrigger className="h-[50px] border-[0.5px] border-[#BCD3CD] rounded-xl bg-white text-[#141F1E] text-md px-5">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-[#22973F]" />
                  <SelectValue placeholder="Available" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Occupied">Occupied</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Reserved">Reserved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Occupancy Details Section */}
      <div className="space-y-4 pt-2">
        <h4 className="text-[16px] font-medium leading-[20px] text-[#141F1E]">Occupancy Details</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Available From */}
          <div className="flex flex-col gap-2">
            <label className="text-md font-normal leading-[15px] text-[#5D5D5D]">Available From</label>
            <Select value={occupancyAvailableFrom} onValueChange={setOccupancyAvailableFrom}>
              <SelectTrigger className="h-[50px] border-[0.5px] border-[#BCD3CD] rounded-xl bg-white text-[#141F1E] text-md px-5">
                <SelectValue placeholder="Immediate" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="Immediate">Immediate</SelectItem>
                <SelectItem value="1 Week">In 1 Week</SelectItem>
                <SelectItem value="1 Month">In 1 Month</SelectItem>
                <SelectItem value="Custom">Custom Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Expected Discharge Date */}
          <div className="flex flex-col gap-2">
            <label className="text-md font-normal leading-[15px] text-[#5D5D5D]">
              Expected Discharge Date (Optional) <span className="text-[#ED2115]">*</span>
            </label>
            <div className="relative">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full h-[50px] border-[0.5px] border-[#BCD3CD] rounded-xl bg-white text-[#141F1E] text-md font-normal px-5 justify-start pr-10 focus:ring-[#4A706A]"
                  >
                    {expectedDischargeDate
                      ? format(parse(expectedDischargeDate, "yyyy-MM-dd", new Date()), "dd MMM yyyy")
                      : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden shadow-2xl border-none bg-white" align="start">
                  <Calendar
                    mode="single"
                    selected={expectedDischargeDate ? parse(expectedDischargeDate, "yyyy-MM-dd", new Date()) : undefined}
                    onSelect={(date) => setExpectedDischargeDate(date ? format(date, "yyyy-MM-dd") : "")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <CalendarIcon className="size-5 absolute right-4 top-1/2 -translate-y-1/2 text-[#141F1E] pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Notes (Optional) */}
      <div className="space-y-2 pt-2">
        <label className="text-md font-normal leading-[15px] text-[#5D5D5D]">Notes (Optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes......."
          className="w-full h-[120px] border-[0.5px] border-[#BCD3CD] rounded-xl bg-white p-4 text-md text-[#141F1E] placeholder-[#5D5D5D] focus:outline-none focus:ring-1 focus:ring-[#4A706A] resize-none"
        />
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          onClick={handleSkip}
          className="h-[42px] w-full sm:w-[140px] rounded-xl border border-[#BCD3CD] text-[#4A706A] hover:bg-emerald-50 text-md font-medium leading-[20px] transition-all"
        >
          Skip
        </Button>
        <div className="flex items-center justify-end gap-[10px] w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="h-[42px] w-1/2 sm:w-[140px] rounded-xl border border-[#BCD3CD] text-[#4A706A] hover:bg-emerald-50 text-md font-medium leading-[20px] transition-all"
          >
            Back
          </Button>
          <Button
            type="submit"
            className="h-[42px] w-1/2 sm:w-[140px] rounded-xl bg-[#4A706A] hover:bg-[#3d5c57] text-white text-md font-medium leading-[20px] transition-all flex items-center justify-center gap-2"
          >
            Next
            <ArrowRight className="size-5" />
          </Button>
        </div>
      </div>
    </form>
  );
}
