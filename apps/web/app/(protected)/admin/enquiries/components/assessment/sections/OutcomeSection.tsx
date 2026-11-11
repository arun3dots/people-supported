"use client";

import React from "react";
import {
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Text,
  DatePicker,
} from "@repo/ui/components/ui";
import { format } from "date-fns";
import type { NeedsAssessmentDataDTO } from "@repo/schema";

interface Props {
  formData: NeedsAssessmentDataDTO;
  onChange: (field: keyof NeedsAssessmentDataDTO, value: unknown) => void;
  readOnly?: boolean;
}

export function OutcomeSection({ formData, onChange, readOnly }: Props) {
  const careLevelOptions = [
    "Residential Low-Dependency",
    "Residential Medium-Dependency",
    "Residential High-Dependency",
    "Dementia Specialist Care",
    "Nursing Care Needed",
  ];

  return (
    <div className="space-y-5">
      {/* 1. Final Clinical Assessment Decision */}
      <div>
        <Label required>Final Clinical Assessment Decision</Label>
        <RadioGroup
          value={formData.finalAssessorDecision || ""}
          onValueChange={(val) => !readOnly && onChange("finalAssessorDecision", val)}
          disabled={readOnly}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2"
        >
          <div
            className="flex items-center gap-3 p-1 text-md cursor-pointer"
            onClick={() => !readOnly && onChange("finalAssessorDecision", "APPROVED")}
          >
            <RadioGroupItem value="APPROVED" id="decision-approved" disabled={readOnly} />
            <Text className="cursor-pointer">
              <Text as="span" size="sm" weight="semibold" className="block">Suitable for Admission</Text>
              <Text as="span" size="sm" variant="muted" className="block">Care home can meet all identified care and clinical needs</Text>
            </Text>
          </div>

          <div
            className="flex items-center gap-3 p-1 text-md cursor-pointer"
            onClick={() => !readOnly && onChange("finalAssessorDecision", "DECLINED")}
          >
            <RadioGroupItem value="DECLINED" id="decision-declined" disabled={readOnly} />
            <Text className="cursor-pointer">
              <Text as="span" size="sm" weight="semibold" className="block">Unsuitable / Decline</Text>
              <Text as="span" size="sm" variant="muted" className="block">Needs exceed registered care capacity</Text>
            </Text>
          </div>
        </RadioGroup>
      </div>

      {/* 2. Recommended Care Allocation Level */}
      <div>
        <Label required>Recommended Care Allocation Level</Label>
        <RadioGroup
          value={formData.recommendedCareAllocationLevel || ""}
          onValueChange={(val) => !readOnly && onChange("recommendedCareAllocationLevel", val)}
          disabled={readOnly}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-2"
        >
          {careLevelOptions.map((level) => (
            <div
              key={level}
              className="flex items-center gap-2 p-1 cursor-pointer"
              onClick={() => !readOnly && onChange("recommendedCareAllocationLevel", level)}
            >
              <RadioGroupItem value={level} id={`care-level-${level}`} disabled={readOnly} />
              <Text size="sm" className="cursor-pointer">
                {level}
              </Text>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* 3. Recommended Room Features & Sign-off Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
        <div>
          <Label>Recommended Room Features</Label>
          <Input
            value={formData.recommendedRoomFeatures || ""}
            onChange={(e) => onChange("recommendedRoomFeatures", e.target.value)}
            placeholder="e.g. Ground floor near nurse station, hoist"
            disabled={readOnly}
          />
        </div>

        <div>
          <Label required>Assessor Signature / Initials</Label>
          <Input
            value={formData.assessorSignature || ""}
            onChange={(e) => onChange("assessorSignature", e.target.value)}
            placeholder="e.g. SJ / Sarah Jenkins, RN"
            disabled={readOnly}
          />
        </div>

        <div>
          <Label required>Completion Date</Label>
          <DatePicker
            value={formData.dateCompleted || ""}
            maxDate={new Date()}
            disabled={readOnly}
            onChange={(date) =>
              onChange("dateCompleted", date ? format(date, "yyyy-MM-dd") : "")
            }
          />
        </div>
      </div>
    </div>
  );
}
