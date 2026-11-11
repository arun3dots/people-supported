"use client";

import React from "react";
import { HeartPulse } from "lucide-react";
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui";

interface PrnDirectAdminFieldsProps {
  status: "Given" | "Refused" | "Omitted" | "NPO";
  setStatus: (status: "Given" | "Refused" | "Omitted" | "NPO") => void;
  adminReason: string;
  setAdminReason: (reason: string) => void;
  pulse: string;
  setPulse: (pulse: string) => void;
  bloodSugar: string;
  setBloodSugar: (bloodSugar: string) => void;
  temp: string;
  setTemp: (temp: string) => void;
  spo2: string;
  setSpo2: (spo2: string) => void;
}

export function PrnDirectAdminFields({
  status,
  setStatus,
  adminReason,
  setAdminReason,
  pulse,
  setPulse,
  bloodSugar,
  setBloodSugar,
  temp,
  setTemp,
  spo2,
  setSpo2,
}: PrnDirectAdminFieldsProps): React.JSX.Element {
  return (
    <div className="space-y-3 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label required>Administration Outcome</Label>
          <Select
            value={status}
            onValueChange={(val: "Given" | "Refused" | "Omitted" | "NPO") => setStatus(val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Given">Given (Administered)</SelectItem>
              <SelectItem value="Refused">Refused by Resident</SelectItem>
              <SelectItem value="Omitted">Omitted / Not Indicated</SelectItem>
              <SelectItem value="NPO">NPO (Nil by Mouth)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Clinical Trigger / Assessment</Label>
          <Input
            placeholder="e.g. Resident reported pain score 5/10"
            value={adminReason}
            onChange={(e) => setAdminReason(e.target.value)}
          />
        </div>
      </div>

      {/* Optional Vitals */}
      <div className="space-y-1 pt-1">
        <Label className="flex items-center gap-1.5">
          <HeartPulse className="size-3.5 text-emerald-800" />
          Pre-Administration Vitals (Optional)
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Input
            placeholder="Pulse (bpm)"
            value={pulse}
            onChange={(e) => setPulse(e.target.value)}
            type="number"
          />
          <Input
            placeholder="Temp (°C)"
            value={temp}
            onChange={(e) => setTemp(e.target.value)}
            type="number"
            step="0.1"
          />
          <Input
            placeholder="SpO2 (%)"
            value={spo2}
            onChange={(e) => setSpo2(e.target.value)}
            type="number"
          />
          <Input
            placeholder="Sugar (mmol/L)"
            value={bloodSugar}
            onChange={(e) => setBloodSugar(e.target.value)}
            type="number"
            step="0.1"
          />
        </div>
      </div>
    </div>
  );
}
