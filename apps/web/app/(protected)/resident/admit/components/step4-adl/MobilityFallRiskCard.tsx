"use client";

import React from "react";
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from "@repo/ui/components/ui";
import { AdmissionFormData } from "../../types";

interface MobilityFallRiskCardProps {
  formData: AdmissionFormData;
  updateFormData: (data: Partial<AdmissionFormData>) => void;
}

export function MobilityFallRiskCard({
  formData,
  updateFormData,
}: MobilityFallRiskCardProps) {
  const [userSelectedFallRisk, setUserSelectedFallRisk] = React.useState(false);
  const fallRiskValue =
    !userSelectedFallRisk &&
    (formData.fallRiskScore === "Low" || !formData.fallRiskScore) &&
    (!formData.ambulationDistance || formData.ambulationDistance === "Independent ambulation > 50m")
      ? ""
      : (formData.fallRiskScore || "");
  const fallsValue =
    formData.fallsLast6Months === "0" || formData.fallsLast6Months === "None"
      ? ""
      : (formData.fallsLast6Months || "");
  const ambulationValue =
    formData.ambulationDistance === "Independent ambulation > 50m" ||
    formData.ambulationDistance === "Independent > 50m"
      ? ""
      : (formData.ambulationDistance || "");
  return (
    <div className="bg-surface-card-grey rounded-2xl p-6 lg:p-8 space-y-6 shadow-none border-none font-sans">
      <div className="pb-4 border-b border-slate-200/80">
        <Text as="h3" size="md" weight="bold">
          Mobility &amp; Fall Risk
        </Text>
        <Text size="sm" weight="regular" variant="subdued">
          Ambulation independence, mobility aids, and historical fall tracking.
        </Text>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
          <Label>Mobility Aids Used</Label>
          <Input
            type="text"
            placeholder="e.g. Walking Stick, Rollator"
            value={formData.mobilityAidsUsed.join(", ")}
            onChange={(e) =>
              updateFormData({
                mobilityAidsUsed: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              })
            }
          />
        </div>
        <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
          <Label>Fall Risk Level</Label>
          <Select
            value={fallRiskValue}
            onValueChange={(val) => {
              setUserSelectedFallRisk(true);
              updateFormData({ fallRiskScore: val });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low Risk</SelectItem>
              <SelectItem value="Medium">Medium Risk</SelectItem>
              <SelectItem value="High">High Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
          <Label>Falls in Last 6 Months</Label>
          <Input
            type="text"
            placeholder="e.g. 0, or 1"
            value={fallsValue}
            onChange={(e) => updateFormData({ fallsLast6Months: e.target.value })}
          />
        </div>
        <div className="space-y-1.5 [&_[data-slot=input-error]]:hidden">
          <Label>Ambulation Distance</Label>
          <Input
            type="text"
            placeholder="e.g. Independent ambulation > 50m"
            value={ambulationValue}
            onChange={(e) => updateFormData({ ambulationDistance: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
