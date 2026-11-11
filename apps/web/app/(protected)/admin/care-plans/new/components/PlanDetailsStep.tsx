"use client";


import {
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  Text,
  DatePicker,
} from "@repo/ui/components/ui";

interface PlanDetailsStepProps {
  residentId: string;
  setResidentId: (val: string) => void;
  validFrom: string;
  setValidFrom: (val: string) => void;
  validTo: string;
  setValidTo: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  residents: Array<{ id: string; fullName: string }>;
}

export function PlanDetailsStep({
  residentId,
  setResidentId,
  validFrom,
  setValidFrom,
  validTo,
  setValidTo,
  description,
  setDescription,
  residents,
}: PlanDetailsStepProps) {
  return (
    <div className="space-y-6 font-sans">
      <div>
        <Text as="h2" size="lg" weight="semibold" className="text-slate-900 tracking-tight">
          Plan Details &amp; Scope
        </Text>
        <Text size="md" weight="regular" className="text-slate-500 mt-1">
          Specify the resident and validity period for this master clinical care plan.
        </Text>
      </div>

      <div className="space-y-4">
        {/* Resident Selection */}
        <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
          <Label required >
            Resident
          </Label>
          <Select value={residentId} onValueChange={setResidentId}>
            <SelectTrigger className="w-full h-11 bg-white border-slate-200 rounded-xl text-md font-semibold text-slate-900 shadow-none">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {residents.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Validity Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
            <Label required>
              Valid From
            </Label>
            <DatePicker
              value={validFrom}
              onChange={(d) => setValidFrom(d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "")}
              placeholder="Select start date"
            />
          </div>
          <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
            <Label required>
              Valid To
            </Label>
            <DatePicker
              value={validTo}
              minDate={validFrom ? new Date(validFrom) : undefined}
              onChange={(d) => setValidTo(d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "")}
              placeholder="Select review date"
            />
          </div>
        </div>

        {/* Clinical Overview */}
        <div className="space-y-1.5">
          <Label >
            Clinical Overview &amp; Baseline Notes
          </Label>
          <Textarea
            rows={4}
            placeholder="Initial baseline notes, primary diagnosis overview, key care considerations, dietary or cognitive notes..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
