"use client";

import React from "react";
import { Input, Label, RadioGroup, RadioGroupItem, DatePicker } from "@repo/ui/components/ui";
import { format } from "date-fns";
import type { NeedsAssessmentDataDTO } from "@repo/schema";
import { LOCATIONS } from "../../../types";
import { cn } from "@repo/ui/lib/utils";

interface Props {
  formData: NeedsAssessmentDataDTO;
  onChange: (field: keyof NeedsAssessmentDataDTO, value: unknown) => void;
  readOnly?: boolean;
}

export function AssessmentHeaderSection({ formData, onChange, readOnly }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <Label required>Date of Assessment</Label>
        <DatePicker
          value={formData.dateOfAssessment || ""}
          maxDate={new Date()}
          disabled={readOnly}
          onChange={(date) =>
            onChange("dateOfAssessment", date ? format(date, "yyyy-MM-dd") : "")
          }
        />
      </div>

      <div>
        <Label required>Assessor Name</Label>
        <Input
          value={formData.assessorName || ""}
          onChange={(e) => onChange("assessorName", e.target.value)}
          placeholder="e.g. Sarah Jenkins, RN"
          disabled={readOnly}
        />
      </div>

      <div>
        <Label required>Prospect Full Name</Label>
        <Input
          value={formData.prospectFullName || ""}
          onChange={(e) => onChange("prospectFullName", e.target.value)}
          placeholder="e.g. Eleanor Vance"
          disabled={readOnly}
        />
      </div>

      <div>
        <Label required>Date of Birth</Label>
        <DatePicker
          variant="dob"
          value={formData.dob || ""}
          disabled={readOnly}
          onChange={(date) => onChange("dob", date ? format(date, "yyyy-MM-dd") : "")}
        />
      </div>

      <div>
        <Label required>Current Location</Label>
        <RadioGroup
          value={formData.currentLocation || "Home"}
          onValueChange={(val) => !readOnly && onChange("currentLocation", val)}
          disabled={readOnly}
          className="grid grid-cols-2 gap-2 mt-1.5"
        >
          {LOCATIONS.map((loc) => (
            <div
              key={loc}
              className="flex items-center gap-2  text-md font-medium transition-all cursor-pointer"
              onClick={() => !readOnly && onChange("currentLocation", loc)}
            >
              <RadioGroupItem value={loc} id={`location-${loc}`} disabled={readOnly} />
              <Label htmlFor={`location-${loc}`} className="cursor-pointer">
                {loc}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div>
        <Label required>Assessment Reason</Label>
        <RadioGroup
          value={formData.assessmentReason || "New Enquiry"}
          onValueChange={(val) => !readOnly && onChange("assessmentReason", val)}
          disabled={readOnly}
          className="grid grid-cols-1 gap-2 mt-1.5"
        >
          {["New Enquiry", "Readmission Assessment"].map((reason) => (
            <div
              key={reason}
              className="flex items-center gap-2  text-md font-medium transition-all cursor-pointer"
              onClick={() => !readOnly && onChange("assessmentReason", reason)}
            >
              <RadioGroupItem value={reason} id={`reason-${reason}`} disabled={readOnly} />
              <Label htmlFor={`reason-${reason}`} className="cursor-pointer">
                {reason}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}

