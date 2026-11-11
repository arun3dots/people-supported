"use client";

import {
  Card,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  DatePicker,
} from "@repo/ui/components/ui";
import { RenewalReason } from "@repo/schema";

interface RenewReasonStepProps {
  renewalReason: RenewalReason;
  setRenewalReason: (reason: RenewalReason) => void;
  validFrom: string;
  setValidFrom: (val: string) => void;
  validTo: string;
  setValidTo: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  primaryDoctorId: string;
  setPrimaryDoctorId: (val: string) => void;
  secondaryDoctorId: string;
  setSecondaryDoctorId: (val: string) => void;
  staffList: Array<{ id: string; fullName: string; role?: { name: string } }>;
}

export function RenewReasonStep({
  renewalReason,
  setRenewalReason,
  validFrom,
  setValidFrom,
  validTo,
  setValidTo,
  description,
  setDescription,
  primaryDoctorId,
  setPrimaryDoctorId,
  secondaryDoctorId,
  setSecondaryDoctorId,
  staffList,
}: RenewReasonStepProps) {
  return (
    <Card className="p-6 space-y-6 font-['Outfit',sans-serif]">
      <div className="space-y-1">
        <Text as="h3" size="md" weight="medium" className="text-slate-900">
          1. Renewal Reason &amp; Validity Period
        </Text>
        <Text size="md" weight="regular" className="text-slate-500 mt-0.5">
          Define why this plan is being renewed and establish the new clinical validity dates.
        </Text>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2 md:col-span-2">
          <Label required>Clinical Reason for Renewal</Label>
          <Select
            value={renewalReason}
            onValueChange={(v) => setRenewalReason(v as RenewalReason)}
          >
            <SelectTrigger className="h-11 bg-white border-slate-200 cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ScheduledReview">
                Scheduled Periodic Review (Standard Cadence)
              </SelectItem>
              <SelectItem value="ConditionChange">
                Significant Change in Clinical Condition / Diagnosis
              </SelectItem>
              <SelectItem value="PostIncident">
                Post-Incident Review (e.g. Fall, Hospitalization)
              </SelectItem>
              <SelectItem value="Other">Other Clinical Rationale</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label required>New Valid From Date</Label>
          <DatePicker
            value={validFrom}
            onChange={(d) => setValidFrom(d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "")}
            placeholder="Select valid from date"
          />
        </div>

        <div className="space-y-2">
          <Label required>New Valid To Date</Label>
          <DatePicker
            value={validTo}
            onChange={(d) => setValidTo(d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "")}
            placeholder="Select valid to date"
          />
        </div>

        <div className="space-y-2">
          <Label required>Primary Clinical Approver (Doctor/GP)</Label>
          <Select
            value={primaryDoctorId}
            onValueChange={setPrimaryDoctorId}
          >
            <SelectTrigger className="h-11 bg-white border-slate-200 cursor-pointer">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {staffList.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.fullName} {s.role ? `(${s.role.name})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Secondary Approver / Senior Nurse (Optional)</Label>
          <Select
            value={secondaryDoctorId}
            onValueChange={setSecondaryDoctorId}
          >
            <SelectTrigger className="h-11 bg-white border-slate-200 cursor-pointer">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">None</SelectItem>
              {staffList.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.fullName} {s.role ? `(${s.role.name})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Clinical Renewal Notes &amp; Summary</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Document rationale, changes in resident condition, multidisciplinary inputs..."
            className="text-md min-h-24 bg-white border-slate-200 rounded-xl"
          />
        </div>
      </div>
    </Card>
  );
}
