"use client";

import React from "react";
import { Button, Text, toast } from "@repo/ui/components/ui";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { AdmissionFormData } from "../../types";
import { RoomBedAllocationCard } from "./RoomBedAllocationCard";
import { BelongingsInventoryCard } from "./BelongingsInventoryCard";
import { AssistiveDevicesCard } from "./AssistiveDevicesCard";

interface Step7RoomBelongingsProps {
  formData: AdmissionFormData;
  updateFormData: (data: Partial<AdmissionFormData>) => void;
  onPrev: () => void;
  onNext: () => void;
  isSubmitting?: boolean;
}

export function Step7RoomBelongings({
  formData,
  updateFormData,
  onPrev,
  onNext,
  isSubmitting,
}: Step7RoomBelongingsProps) {
  const handleContinue = () => {
    if (!formData.roomNumber) {
      toast({
        title: "Validation Error",
        description: "Please select a room from the dropdown.",
        variant: "destructive",
      });
      return;
    }

    onNext();
  };

  const isFormValid = Boolean(formData.roomNumber);

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Database-backed Room & Bed Allocation */}
      <RoomBedAllocationCard formData={formData} updateFormData={updateFormData} />

      {/* 2. Personal Belongings Inventory */}
      <BelongingsInventoryCard formData={formData} updateFormData={updateFormData} />

      {/* 3. Assistive Devices & Valuables */}
      <AssistiveDevicesCard formData={formData} updateFormData={updateFormData} />

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          type="button"
          onClick={onPrev}
          className="rounded-xl font-semibold px-5 shadow-none"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleContinue}
          disabled={!isFormValid || isSubmitting}
          className="rounded-xl font-semibold px-5 shadow-none"
        >
          Continue
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
