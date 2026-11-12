"use client";

import React from "react";
import { Label, Input, DatePicker } from "@repo/ui/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/Select";
import { Resident } from "../../../../../../lib/types/resident";

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface IncidentDetailsSectionProps {
  title: string;
  setTitle: (val: string) => void;
  incidentDate: string;
  setIncidentDate: (val: string) => void;
  incidentTime: string;
  setIncidentTime: (val: string) => void;
  residentId: string;
  onResidentChange: (val: string) => void;
  roomNumber: string;
  setRoomNumber: (val: string) => void;
  location: string;
  setLocation: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  harmLevel: string;
  setHarmLevel: (val: string) => void;
  severity: "High" | "Medium" | "Low" | "";
  setSeverity: (val: "High" | "Medium" | "Low" | "") => void;
  residents?: Resident[];
  roomOptions: string[];
}

export function IncidentDetailsSection({
  title,
  setTitle,
  incidentDate,
  setIncidentDate,
  incidentTime,
  setIncidentTime,
  residentId,
  onResidentChange,
  roomNumber,
  setRoomNumber,
  location,
  setLocation,
  category,
  setCategory,
  harmLevel,
  setHarmLevel,
  severity,
  setSeverity,
  residents,
  roomOptions,
}: IncidentDetailsSectionProps) {
  return (
    <div className="space-y-5 font-sans">
      <h2 className="text-base font-bold text-slate-900 tracking-tight">
        Incident Details
      </h2>

      {/* Row 1: Incident Name, Date, Time */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
        <div className="flex flex-col gap-1.5">
          <Label required htmlFor="incidentTitle">
            Incident Name
          </Label>
          <Input
            id="incidentTitle"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Fall Un-witnessed"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label required htmlFor="incidentDate">
            Date
          </Label>
          <DatePicker
            value={incidentDate}
            maxDate={new Date()}
            onChange={(d) => setIncidentDate(d ? formatLocalDate(d) : "")}
            placeholder="Select incident date"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label required htmlFor="incidentTime">
            Time
          </Label>
          <Input
            id="incidentTime"
            type="time"
            lang="en-GB"
            value={incidentTime}
            onChange={(e) => setIncidentTime(e.target.value)}
          />
        </div>
      </div>

      {/* Row 2: Tenant Name, Room Number */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
        <div className="flex flex-col gap-1.5">
          <Label required>Tenant Name</Label>
          <Select value={residentId} onValueChange={onResidentChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {(() => {
                const activeTenants = residents?.filter(
                  (r: Resident) => (r.status || "").toLowerCase() === "active",
                );
                return activeTenants && activeTenants.length > 0 ? (
                  activeTenants.map((r: Resident) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.fullName}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__none" disabled>
                    No active tenants available
                  </SelectItem>
                );
              })()}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Room Number</Label>
          <Select value={roomNumber} onValueChange={setRoomNumber}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {roomOptions.length > 0 ? (
                roomOptions.map((rn) => (
                  <SelectItem key={rn} value={rn}>
                    {/^room\b/i.test(rn.trim()) ? rn.trim() : `Room ${rn.trim()}`}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="__none" disabled>
                  No rooms found
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="incidentLocation">Incident Location</Label>
        <Input
          id="incidentLocation"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Bedroom, lounge, or garden"
        />
      </div>

      {/* Row 3: Category, Harm Level, Severity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
        <div className="flex flex-col gap-1.5">
          <Label required>Incident Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Fall">Fall</SelectItem>
              <SelectItem value="Medication">Medication Error</SelectItem>
              <SelectItem value="Aggression">Verbal / Physical Aggression</SelectItem>
              <SelectItem value="Skin Injury">Skin Tear / Injury</SelectItem>
              <SelectItem value="Equipment">Equipment Fault</SelectItem>
              <SelectItem value="Elopement">Elopement Attempt</SelectItem>
              <SelectItem value="Pressure Area">Pressure Area Concern</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label required>Harm Level</Label>
          <Select value={harmLevel} onValueChange={setHarmLevel}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Level 1">Level 1 (No Harm)</SelectItem>
              <SelectItem value="Level 2">Level 2 (Low Harm)</SelectItem>
              <SelectItem value="Level 3">Level 3 (Moderate Harm)</SelectItem>
              <SelectItem value="Level 4">Level 4 (Severe Harm)</SelectItem>
              <SelectItem value="Level 5">Level 5 (Critical / Death)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label required>Severity</Label>
          <Select
            value={severity}
            onValueChange={(val) => setSeverity(val as "High" | "Medium" | "Low" | "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
